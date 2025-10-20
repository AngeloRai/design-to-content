/**
 * Generate Node
 * Uses ChatOpenAI with automatic LangSmith tracing
 */

import path from "path";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { AGENT_SYSTEM_PROMPT } from "../prompts/agent-prompts.js";
import { getChatModel } from "../../config/openai-client.js";
import { createToolExecutor, TOOLS } from "../../config/tool-executor.js";

export async function generateNode(state) {
  console.log("\n🤖 Phase: Generate - Running Agent");
  console.log("=".repeat(60));

  try {
    const {
      figmaAnalysis,
      vectorSearch,
      registry,
      outputDir,
      conversationHistory,
    } = state;

    // Setup tool executor
    const toolExecutor = createToolExecutor(vectorSearch, registry, outputDir);

    // Get ChatOpenAI model with tool binding (uses DEFAULT_MODEL env var or 'gpt-4o')
    const model = getChatModel();
    const modelWithTools = model.bind({ tools: TOOLS });

    // Setup conversation with structured component data
    const systemPrompt = await AGENT_SYSTEM_PROMPT();

    // Format component list for agent
    const componentSummary = figmaAnalysis.components
      .map(
        (comp, i) =>
          `${i + 1}. ${comp.name} (${comp.atomicLevel} - ${comp.type}): ${
            comp.description
          }`
      )
      .join("\n");

    const userContent = `Generate React components following the ATOMIC DESIGN pattern based on this structured analysis from Figma:

📊 ANALYSIS SUMMARY:
- Total Components Identified: ${figmaAnalysis.analysis.totalComponents}
- Sections: ${figmaAnalysis.analysis.sections
      .map((s) => `${s.name} (${s.componentCount} components)`)
      .join(", ")}

🔬 COMPONENT LIST (from Figma analysis):
${componentSummary}

⚠️ CRITICAL INSTRUCTIONS:

1. **Component Consolidation**:
   - Review the list above and group related components intelligently
   - If components differ only in styling/size/color → consolidate into ONE file with variant props
   - Example: "PrimaryButton", "SecondaryButton", "OutlineButton" → Button.tsx with variant prop
   - If components have different behavior/structure → separate files
   - Example: TextInput vs SelectDropdown → separate files

2. **File Organization (CRITICAL - use correct type parameter)**:
   - **Atoms** → type='elements' (Button.tsx, Input.tsx, Heading.tsx)
   - **Molecules** → type='components' (SearchBar.tsx, FormField.tsx)
   - **Organisms** → type='modules' (Navigation.tsx, Header.tsx)
   - Use PascalCase for file names
   - One component per file (but multiple variants per component via props)

3. **Component Quality**:
   - Each component must be standalone and reusable
   - Include ALL variants, states, and visual properties from specs
   - Follow reference patterns (use find_similar_components)
   - Use TypeScript properly
   - Use Tailwind for all styling

4. **Process**:
   - Start by analyzing which components to consolidate
   - For each component/group, find similar reference patterns
   - Generate the component with all variants
   - Validate TypeScript
   - Move to next component

FULL COMPONENT SPECIFICATIONS:
${JSON.stringify(figmaAnalysis.components, null, 2)}

🚨 MANDATORY FIRST STEP: Call get_registry() to see what components already exist.

Then follow this workflow:

1. **Review Registry Results**
   - Note which atoms, molecules, and organisms already exist
   - Identify which can be reused vs need to be generated

2. **Sort Components by Atomic Level**
   - Group the ${figmaAnalysis.analysis.totalComponents} components into:
     * Atoms (self-contained building blocks)
     * Molecules (compose atoms)
     * Organisms (compose molecules + atoms)

3. **Generate in Order**
   - FIRST: Generate all atoms
   - SECOND: Generate molecules (import existing atoms)
   - THIRD: Generate organisms (import existing molecules + atoms)

4. **Plan Consolidation Within Each Level**
   - Within atoms: consolidate similar buttons, inputs, etc.
   - Within molecules: consolidate similar patterns
   - Within organisms: consolidate similar layouts

Begin now by calling get_registry().`;

    // Initialize messages as LangChain message objects
    const messages =
      conversationHistory.length > 0
        ? conversationHistory
        : [new SystemMessage(systemPrompt), new HumanMessage(userContent)];

    let continueLoop = true;
    let iterationCount = 0;
    const maxIterations = 50;

    console.log("💭 Agent thinking...\n");

    // Agent loop - keep going until agent says it's done
    let hasUnresolvedValidationFailures = false;

    while (continueLoop && iterationCount < maxIterations) {
      iterationCount++;

      console.log(
        `\n📨 Iteration ${iterationCount} - Invoking ChatOpenAI...\n`
      );

      // Invoke model with tools
      const response = await modelWithTools.invoke(messages);

      // Add AI response to messages
      messages.push(response);

      // Process response
      if (response.content) {
        console.log(`\n💬 Agent: ${response.content}\n`);
      }

      // Check for tool calls
      if (response.tool_calls && response.tool_calls.length > 0) {
        // Reset validation failure flag at start of new iteration
        hasUnresolvedValidationFailures = false;

        // Execute all tool calls
        for (const toolCall of response.tool_calls) {
          const functionName = toolCall.name;
          const functionArgs = toolCall.args;

          console.log(`🔧 Using tool: ${functionName}`);
          console.log(`   Input: ${JSON.stringify(functionArgs, null, 2)}`);

          // Execute tool
          const result = await toolExecutor.execute(functionName, functionArgs);
          console.log(
            `   Result: ${JSON.stringify(result, null, 2).slice(0, 200)}${
              JSON.stringify(result).length > 200 ? "..." : ""
            }\n`
          );

          // CRITICAL: If write_component was called, auto-validate immediately
          if (functionName === "write_component" && result.success) {
            console.log("   🔍 Auto-validating component...");
            const filePath = path.relative(
              path.resolve(outputDir, ".."),
              result.path
            );
            const validation = await toolExecutor.execute(
              "validate_typescript",
              { file_path: filePath }
            );

            if (validation.valid) {
              console.log("   ✅ Validation passed - component is complete\n");
              result.validated = true;
              result.validation = "passed";
            } else {
              console.log(
                "   ❌ Validation failed - fix required before proceeding\n"
              );
              console.log(
                `   Errors: ${validation.errors
                  ?.split("\n")
                  .slice(0, 3)
                  .join("\n   ")}\n`
              );

              // Mark that we have unresolved validation failures
              hasUnresolvedValidationFailures = true;

              result.validated = false;
              result.validation = "failed";
              result.validationErrors = validation.errors;
              result.message = `⚠️ VALIDATION FAILED - TypeScript errors must be fixed before proceeding:\n\n${validation.errors}\n\nUse write_component again with corrected code.`;
            }
          }

          // Add tool result to conversation as ToolMessage
          messages.push(
            new ToolMessage({
              content: JSON.stringify(result),
              tool_call_id: toolCall.id,
            })
          );
        }
      } else {
        // No tool calls, agent wants to exit
        if (hasUnresolvedValidationFailures) {
          // BLOCK EXIT - validation failures must be fixed
          console.log("🚫 Cannot exit: Unresolved validation failures exist\n");
          console.log("   Agent must fix TypeScript errors before completing.\n");

          // Force agent to continue by adding a system message
          messages.push(
            new ToolMessage({
              content: JSON.stringify({
                error: "Cannot complete - you have unresolved TypeScript validation failures. You MUST use write_component again to fix the errors before you can finish.",
                action_required: "Fix all validation errors"
              }),
              tool_call_id: "validation_blocker"
            })
          );
        } else {
          // All validations passed, agent can exit
          continueLoop = false;
          console.log("✅ Agent completed task\n");
        }
      }
    }

    if (iterationCount >= maxIterations) {
      console.log("⚠️  Reached maximum iterations limit\n");
    }

    console.log("=".repeat(60) + "\n");

    return {
      ...state,
      conversationHistory: messages,
      iterations: iterationCount,
      currentPhase: "finalize",
    };
  } catch (error) {
    console.error("❌ Generate failed:", error.message);
    console.error(error.stack);
    return {
      ...state,
      errors: [...state.errors, { phase: "generate", error: error.message }],
      success: false,
      currentPhase: "finalize",
    };
  }
}
