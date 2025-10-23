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
import { buildRegistry } from "../../tools/registry.js";

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
    // Track ALL failed components with their error details
    const failedComponents = {};
    const componentFixAttempts = {}; // Track how many times we've tried to fix each component

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
              delete failedComponents[functionArgs.name];

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

              // Track fix attempts for this component
              componentFixAttempts[functionArgs.name] = (componentFixAttempts[functionArgs.name] || 0) + 1;
              const attemptCount = componentFixAttempts[functionArgs.name];

              // Store full error details for validation node
              failedComponents[functionArgs.name] = {
                path: result.path,
                errors: validation.errors,
                componentType: functionArgs.type
              };

              result.validated = false;
              result.validation = "failed";
              result.validationErrors = validation.errors;

              // Limit fix attempts to 2 - after that, let validate node handle it
              if (attemptCount >= 2) {
                console.log(`   ⚠️  Max fix attempts (${attemptCount}) reached for ${functionArgs.name}`);
                console.log(`   Moving to next component - validate node will fix this later\n`);

                result.message = `⚠️ Validation failed after ${attemptCount} attempts. Moving to next component.\n\nThe validate node will fix this issue after all components are generated.\n\nContinue with the next component in your plan.`;
              } else {
                result.message = `⚠️ VALIDATION FAILED (Attempt ${attemptCount}/2) - TypeScript errors must be fixed:\n\n${validation.errors}\n\nUse write_component again with corrected code.`;
              }

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
        const failedComponentNames = Object.keys(failedComponents);
        if (failedComponentNames.length > 0) {
          // Informational only - let validate node handle remaining issues
          const failedList = failedComponentNames.join(', ');
          console.log(`📋 Generation complete with ${failedComponentNames.length} component(s) pending validation fixes:\n`);
          console.log(`   ${failedList}\n`);
          console.log("   These will be fixed by the validate node.\n");
        } else {
          console.log("✅ All components generated and validated\n");
        }

        // Allow exit - validate node will handle any remaining issues
        continueLoop = false;
        console.log("✅ Agent completed generation phase\n");
      }
    }

    if (iterationCount >= maxIterations) {
      console.log("⚠️  Reached maximum iterations limit\n");
    }

    console.log("=".repeat(60) + "\n");

    // Build registry to count generated components and update state
    const finalRegistry = await buildRegistry(outputDir);
    const totalComponents = Object.values(finalRegistry.components).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    return {
      ...state,
      conversationHistory: messages,
      iterations: iterationCount,
      generatedComponents: totalComponents,
      registry: finalRegistry,  // Update registry in state
      failedComponents,  // Pass failed components to validation node
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
