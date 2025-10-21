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

    // Safety check: if figmaAnalysis is null/undefined, skip generation
    if (!figmaAnalysis || !figmaAnalysis.components) {
      console.log("⚠️  No Figma analysis available, skipping generation\n");
      console.log("=".repeat(60) + "\n");
      return {
        ...state,
        currentPhase: "finalize",
      };
    }

    // Setup tool executor
    const toolExecutor = createToolExecutor(vectorSearch, registry, outputDir);

    // Get ChatOpenAI model with tool binding (uses DEFAULT_MODEL env var or 'gpt-4o')
    // In LangChain v1.0, tools are passed directly in the invocation, not via bind()
    const model = getChatModel();

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

4. **Process** (EXECUTE, DON'T JUST PLAN):
   - DO NOT spend iterations planning - START GENERATING immediately
   - Search for references ONCE per component, then GENERATE
   - Each component: search → generate → validate → next component
   - DO NOT loop on the same search query multiple times

FULL COMPONENT SPECIFICATIONS:
${JSON.stringify(figmaAnalysis.components, null, 2)}

🚨 **ACTION WORKFLOW** (DO THESE STEPS, DON'T JUST DESCRIBE THEM):

1. Call get_registry() → See what exists
2. Generate atoms FIRST (type='elements') → Search once, generate immediately
3. Generate molecules NEXT (type='components') → Search once, generate immediately
4. Generate organisms LAST (type='modules') → Search once, generate immediately

**For EACH component:**
- find_similar_components ONCE
- write_component IMMEDIATELY
- If validation passes: NEXT component
- If validation fails: Fix ONCE, then NEXT component

BEGIN NOW: Call get_registry() then start generating atoms.`;

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
    // Track ALL failed components (don't reset - keep accumulating)
    const failedComponents = new Set();

    while (continueLoop && iterationCount < maxIterations) {
      iterationCount++;

      console.log(
        `\n📨 Iteration ${iterationCount} - Invoking ChatOpenAI...\n`
      );

      // Invoke model with tools (in v1.0, tools are passed in invoke options)
      const response = await model.invoke(messages, { tools: TOOLS });

      // Add AI response to messages
      messages.push(response);

      // Process response
      if (response.content) {
        console.log(`\n💬 Agent: ${response.content}\n`);
      }

      // Check for tool calls
      if (response.tool_calls && response.tool_calls.length > 0) {
        // Process tool calls (validation tracking happens below)

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
              // Remove from failed list if it was there (successful fix)
              failedComponents.delete(functionArgs.name);

              result.validated = true;
              result.validation = "passed";
              result.message = `✅ Component '${functionArgs.name}' generated successfully and validated. Move to the next component in your plan.`;
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

              // Add to failed components list (keeps accumulating)
              failedComponents.add(functionArgs.name);

              result.validated = false;
              result.validation = "failed";
              result.validationErrors = validation.errors;
              result.message = `⚠️ VALIDATION FAILED - TypeScript errors must be fixed before proceeding:\n\n${validation.errors}\n\nUse write_component again with corrected code.`;

              // 🔍 DEBUG: Log what we're sending to the agent
              console.log("\n📋 DEBUG - Message being sent to agent:");
              console.log("================================================");
              console.log("Tool Result Object:");
              console.log(JSON.stringify(result, null, 2));
              console.log("================================================\n");
            }
          }

          // Add tool result to conversation as ToolMessage
          const toolMessage = new ToolMessage({
            content: JSON.stringify(result),
            tool_call_id: toolCall.id,
          });

          // 🔍 DEBUG: Log the actual ToolMessage
          if (result.validation === "failed") {
            console.log("\n📨 DEBUG - ToolMessage being added to conversation:");
            console.log("================================================");
            console.log("ToolMessage content length:", toolMessage.content.length);
            console.log("ToolMessage preview:", toolMessage.content.substring(0, 500));
            console.log("================================================\n");
          }

          messages.push(toolMessage);
        }
      } else {
        // No tool calls, agent wants to exit
        if (failedComponents.size > 0) {
          // BLOCK EXIT - failed components must be fixed
          const failedList = Array.from(failedComponents).join(', ');
          console.log(`🚫 Cannot exit: ${failedComponents.size} component(s) have validation failures\n`);
          console.log(`   Failed components: ${failedList}\n`);
          console.log("   Agent must fix ALL TypeScript errors before completing.\n");

          // Force agent to continue by adding a system message
          messages.push(
            new ToolMessage({
              content: JSON.stringify({
                error: `Cannot complete - you have unresolved TypeScript validation failures in these components: ${failedList}`,
                failed_components: Array.from(failedComponents),
                action_required: `Fix ALL validation errors by calling write_component again for: ${failedList}`,
                reminder: "You said you would fix these later - fix them NOW before exiting"
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
