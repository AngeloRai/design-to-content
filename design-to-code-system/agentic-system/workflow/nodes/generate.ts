/**
 * Generate Node
 * Uses ChatOpenAI with automatic LangSmith tracing
 */

import path from "path";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
  BaseMessage as BaseMessageCtor,
  AIMessage,
  FunctionMessage,
} from "@langchain/core/messages";
import type { BaseMessage, StoredMessage } from "@langchain/core/messages";
import { AGENT_SYSTEM_PROMPT } from "../prompts/agent-prompts.ts";
import { getChatModel } from "../../config/openai-client.ts";
import {
  createToolExecutor,
  TOOLS,
  type VectorSearch,
} from "../../tools/tool-executor.ts";
import { buildRegistry } from "../../tools/registry.ts";
import {
  MCP_TOOLS,
  createMcpToolExecutor,
} from "../../tools/mcp-agent-tools.ts";
import type {
  WorkflowState,
  NodeResult,
  ComponentFailureDetails,
} from "../../types/workflow.ts";
import type { ComponentSpec } from "../../types/component.ts";
import type { DesignToken } from "../../types/figma.ts";

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

interface ToolResult {
  success?: boolean;
  path?: string;
  validated?: boolean;
  validation?: string;
  message?: string;
  validationErrors?: string;
  [key: string]: unknown;
}

interface ValidationResult {
  valid: boolean;
  errors?: string;
}

function rehydrateStoredMessage(entry: StoredMessage): BaseMessage | null {
  if (!entry?.data) return null;
  const common = {
    content: entry.data.content ?? "",
    additional_kwargs: entry.data.additional_kwargs ?? {},
    response_metadata: entry.data.response_metadata ?? {},
    name: entry.data.name,
  };
  switch (entry.type) {
    case "system":
      return new SystemMessage(common as any);
    case "human":
    case "user":
      return new HumanMessage(common as any);
    case "ai":
    case "assistant":
      return new AIMessage(common as any);
    case "tool":
      return new ToolMessage({
        ...common,
        tool_call_id:
          entry.data.tool_call_id ??
          (common.additional_kwargs as Record<string, unknown>).tool_call_id ??
          "",
      } as any);
    case "function":
      return new FunctionMessage({
        ...common,
        name: entry.data.name ?? "",
      } as any);
    default:
      return null;
  }
}

export async function generateNode(state: WorkflowState): Promise<NodeResult> {
  console.log("\n🤖 Phase: Generate - Running Agent");
  console.log("=".repeat(60));

  try {
    const {
      figmaAnalysis,
      vectorSearch,
      registry,
      outputDir,
      conversationHistory,
      mcpBridge,
      globalCssPath,
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
    const toolExecutor = createToolExecutor(
      vectorSearch as VectorSearch | null,
      registry,
      outputDir
    );

    // Setup MCP tool executor if MCP bridge is available
    let mcpToolExecutor:
      | ((name: string, args: Record<string, unknown>) => Promise<unknown>)
      | null = null;
    let allTools: unknown[] = [...TOOLS];

    if (mcpBridge && globalCssPath) {
      console.log("🔧 MCP bridge available - exposing Figma tools to agent");
      mcpToolExecutor = createMcpToolExecutor(mcpBridge, globalCssPath);
      allTools = [...TOOLS, ...MCP_TOOLS] as unknown[];
      console.log(
        `   Total tools available: ${allTools.length} (${TOOLS.length} standard + ${MCP_TOOLS.length} MCP)\n`
      );
    } else {
      console.log("ℹ️  MCP bridge not available - using standard tools only\n");
    }

    // Get ChatOpenAI model with tool binding (uses DEFAULT_MODEL env var or 'gpt-4o')
    // In LangChain v1.0, tools are passed directly in the invocation, not via bind()
    const model = getChatModel();

    // Setup conversation with structured component data
    const systemPrompt = await AGENT_SYSTEM_PROMPT();

    // Format component list for agent
    const componentSummary = figmaAnalysis.components
      .map(
        (comp: ComponentSpec, i: number) =>
          `${i + 1}. ${comp.name} (${comp.atomicLevel} - ${comp.type}): ${
            comp.description
          }`
      )
      .join("\n");

    // Format design tokens by category for agent
    const tokensByCategory = figmaAnalysis.tokens.reduce(
      (acc: Record<string, DesignToken[]>, token: DesignToken) => {
        const category = token.category || "uncategorized";
        if (!acc[category]) acc[category] = [];
        acc[category].push(token);
        return acc;
      },
      {}
    );

    const designTokensSummary = Object.entries(tokensByCategory)
      .map(([category, tokens]) => {
        const tokenList = (tokens as DesignToken[])
          .map((t) => `  - ${t.name}: ${t.value}`)
          .join("\n");
        return `**${category}** (${tokens.length} tokens):\n${tokenList}`;
      })
      .join("\n\n");

    const userContent = `Generate React components following the ATOMIC DESIGN pattern based on this structured analysis from Figma:

📊 ANALYSIS SUMMARY:
- Total Components Identified: ${figmaAnalysis.analysis.totalComponents}
- Design Tokens Extracted: ${figmaAnalysis.tokens.length} tokens across ${
      Object.keys(tokensByCategory).length
    } categories
- Sections: ${figmaAnalysis.analysis.sections
      .map(
        (s: { name: string; componentCount: number }) =>
          `${s.name} (${s.componentCount} components)`
      )
      .join(", ")}

🎨 DESIGN TOKENS (MANDATORY - use ONLY these classes):
These tokens are defined in globals.css via @theme inline.

**How Tailwind v4 @theme works:**
Token in @theme: --color-background-tertiary-red-100
Available classes: bg-background-tertiary-red-100, text-background-tertiary-red-100, border-background-tertiary-red-100

**Rule**: Remove the leading "--" and add the utility prefix (bg-, text-, p-, rounded-, etc.)

**ALL AVAILABLE TOKENS:**
${designTokensSummary}

⚠️ **CRITICAL**: ONLY use classes derived from the tokens listed above. DO NOT invent class names like "bg-primary" or "text-secondary" unless those exact tokens exist in the list!

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
   - **USE DESIGN TOKENS** from globals.css (listed above) for colors, spacing, typography
   - Use Tailwind v4 generated utility classes: bg-primary (not bg-[--color-primary])
   - Only use generic Tailwind classes if no matching design token exists

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
    const storedHistory = Array.isArray(conversationHistory)
      ? conversationHistory
      : [];
    const rehydratedHistory: BaseMessage[] = [];

    for (const entry of storedHistory) {
      if (BaseMessageCtor.isInstance(entry)) {
        rehydratedHistory.push(entry as BaseMessage);
        continue;
      }
      if (entry && typeof entry === "object") {
        const rehydrated = rehydrateStoredMessage(entry as StoredMessage);
        if (rehydrated) {
          rehydratedHistory.push(rehydrated);
          continue;
        }
      }
      console.warn(
        "⚠️  Skipping invalid stored message in conversation history"
      );
    }

    const messages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userContent),
      ...rehydratedHistory,
    ];

    let continueLoop = true;
    let iterationCount = 0;
    const maxIterations = 50;

    console.log("💭 Agent thinking...\n");

    // Agent loop - keep going until agent says it's done
    // Track ALL failed components with their error details
    const failedComponents: Record<string, ComponentFailureDetails> = {};
    const componentFixAttempts: Record<string, number> = {};

    while (continueLoop && iterationCount < maxIterations) {
      iterationCount++;

      console.log(
        `\n📨 Iteration ${iterationCount} - Invoking ChatOpenAI...\n`
      );

      // Invoke model with all tools (standard + MCP if available)
      const response = await model.invoke(messages, { tools: allTools });

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
        for (const toolCall of response.tool_calls as ToolCall[]) {
          const functionName = toolCall.name;
          const functionArgs = toolCall.args;

          console.log(`🔧 Using tool: ${functionName}`);
          console.log(`   Input: ${JSON.stringify(functionArgs, null, 2)}`);

          // Determine if this is an MCP tool or standard tool
          const mcpToolNames = MCP_TOOLS.map((t) => t.function.name);
          const isMcpTool = mcpToolNames.includes(functionName);

          let result: ToolResult;
          if (isMcpTool && mcpToolExecutor) {
            // Execute MCP tool
            console.log(`   [MCP Tool]`);
            result = (await mcpToolExecutor(
              functionName,
              functionArgs
            )) as ToolResult;
          } else {
            // Execute standard tool
            result = (await toolExecutor.execute(
              functionName,
              functionArgs
            )) as ToolResult;
          }

          console.log(
            `   Result: ${JSON.stringify(result, null, 2).slice(0, 200)}${
              JSON.stringify(result).length > 200 ? "..." : ""
            }\n`
          );

          // If write_component was called, auto-validate immediately
          if (functionName === "write_component" && result.success) {
            console.log("   🔍 Auto-validating component...");
            const filePath = path.relative(
              path.resolve(outputDir, ".."),
              result.path!
            );
            const validation = (await toolExecutor.execute(
              "validate_typescript",
              { file_path: filePath }
            )) as ValidationResult;

            if (validation.valid) {
              console.log("   ✅ Validation passed - component is complete\n");
              // Remove from failed list if it was there (successful fix)
              delete failedComponents[functionArgs.name as string];

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
              const compName = functionArgs.name as string;
              componentFixAttempts[compName] =
                (componentFixAttempts[compName] || 0) + 1;
              const attemptCount = componentFixAttempts[compName];

              // Store full error details for validation node
              failedComponents[compName] = {
                path: result.path!,
                errors: validation.errors!,
                componentType: functionArgs.type as string,
              };

              result.validated = false;
              result.validation = "failed";
              result.validationErrors = validation.errors;

              // Limit fix attempts to 2 - after that, let validate node handle it
              if (attemptCount >= 2) {
                console.log(
                  `   ⚠️  Max fix attempts (${attemptCount}) reached for ${compName}`
                );
                console.log(
                  `   Moving to next component - validate node will fix this later\n`
                );

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
            console.log(
              "\n📨 DEBUG - ToolMessage being added to conversation:"
            );
            console.log("================================================");
            console.log(
              "ToolMessage content length:",
              toolMessage.content.length
            );
            console.log(
              "ToolMessage preview:",
              typeof toolMessage.content === "string"
                ? toolMessage.content.substring(0, 500)
                : JSON.stringify(toolMessage.content).substring(0, 500)
            );
            console.log("================================================\n");
          }

          messages.push(toolMessage);
        }
      } else {
        // No tool calls, agent wants to exit
        const failedComponentNames = Object.keys(failedComponents);
        if (failedComponentNames.length > 0) {
          // Informational only - let validate node handle remaining issues
          const failedList = failedComponentNames.join(", ");
          console.log(
            `📋 Generation complete with ${failedComponentNames.length} component(s) pending validation fixes:\n`
          );
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
      (sum: number, arr) => sum + arr.length,
      0
    );

    return {
      ...state,
      conversationHistory: messages.map((message) =>
        message.toDict()
      ) as StoredMessage[],
      iterations: iterationCount,
      generatedComponents: totalComponents,
      registry: {
        ...finalRegistry,
        totalCount: totalComponents,
        lastUpdated: new Date(finalRegistry.lastUpdated).toISOString(),
      },
      failedComponents,
      currentPhase: "finalize",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("❌ Generate failed:", errorMessage);
    if (errorStack) console.error(errorStack);

    return {
      ...state,
      errors: [
        ...(state.errors || []),
        { phase: "generate", error: errorMessage },
      ],
      success: false,
      currentPhase: "finalize",
    };
  }
}
