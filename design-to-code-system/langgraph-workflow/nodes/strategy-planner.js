#!/usr/bin/env node

/**
 * STRATEGY PLANNER NODE
 *
 * AI-powered decision maker that determines what to do with each analyzed component:
 * - Create new component
 * - Update existing component
 * - Skip (already exists and matches)
 *
 * Uses tools to read existing components and make informed decisions
 */

import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { allTools, toolExecutor } from "../tools/index.js";

// Zod schema for strategy decisions (OpenAI strict mode compatible)
const StrategyDecisionSchema = z.object({
  strategies: z.array(z.object({
    component: z.object({
      name: z.string(),
      type: z.string(),
      props: z.array(z.string()).nullable().describe("Component props"),
      variants: z.array(z.string()).nullable().describe("Component variants")
    }),
    action: z.enum(["create_new", "update_existing", "skip"]),
    targetPath: z.string().nullable(),
    reason: z.string(),
    confidence: z.number().min(0).max(1),
    safetyChecks: z.object({
      usageCount: z.number(),
      riskLevel: z.enum(["low", "medium", "high"]),
      breakingChanges: z.boolean()
    })
  }))
});

export const strategyPlannerNode = async (state) => {
  console.log("🎯 Starting strategy planning...");

  try {
    const { visualAnalysis, outputPath } = state;

    if (!visualAnalysis || !visualAnalysis.components) {
      throw new Error("No visual analysis available for strategy planning");
    }

    // Scan existing components to know what's available
    console.log("📂 Scanning existing components...");
    const { scanExistingComponents } = await import("../../utils/scan-components.js");
    const libraryContext = await scanExistingComponents(outputPath);
    console.log(`  Found: ${libraryContext.elements.length} elements, ${libraryContext.components.length} components`);

    // Initialize AI model with tools (no structured output during tool use)
    const modelWithTools = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.1,
      openAIApiKey: process.env.OPENAI_API_KEY,
    }).bind({
      tools: allTools
    });

    // Model for final structured output (after tool use)
    const modelStructured = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.1,
      openAIApiKey: process.env.OPENAI_API_KEY,
    }).withStructuredOutput(StrategyDecisionSchema);

    console.log(`📊 Planning strategy for ${visualAnalysis.components.length} components...`);

    // Build messages directly (simpler than template for tool calling)
    const systemPrompt = buildStrategyPrompt();
    const userPrompt = buildUserPrompt(visualAnalysis, libraryContext, outputPath);

    // Phase 1: Tool calling (gather information)
    let response = await modelWithTools.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    // Handle tool calls if AI requests them
    let toolCallCount = 0;
    const maxToolCalls = 10;
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    while (response.tool_calls && response.tool_calls.length > 0 && toolCallCount < maxToolCalls) {
      console.log(`🔧 AI requested ${response.tool_calls.length} tool(s)...`);

      // Add assistant message with tool calls
      messages.push({
        role: "assistant",
        content: response.content || "",
        tool_calls: response.tool_calls
      });

      // Execute all tool calls
      const toolResults = await Promise.all(
        response.tool_calls.map(async (toolCall) => {
          console.log(`  → ${toolCall.name}(${JSON.stringify(toolCall.args).slice(0, 100)}...)`);

          try {
            const result = await toolExecutor[toolCall.name](toolCall.args);
            return {
              role: "tool",
              content: JSON.stringify(result),
              tool_call_id: toolCall.id
            };
          } catch (error) {
            console.error(`  ❌ Tool ${toolCall.name} failed:`, error.message);
            return {
              role: "tool",
              content: JSON.stringify({ success: false, error: error.message }),
              tool_call_id: toolCall.id
            };
          }
        })
      );

      // Add tool results to messages
      messages.push(...toolResults);

      // Continue conversation
      response = await modelWithTools.invoke(messages);

      toolCallCount++;
    }

    // Phase 2: Get structured strategy (after tool use complete)
    console.log("📋 Requesting final structured strategy...");
    messages.push({
      role: "assistant",
      content: response.content || "Tool usage complete"
    });
    messages.push({
      role: "user",
      content: "Based on the information gathered, provide your final strategy decisions in the structured format."
    });

    const structuredResult = await modelStructured.invoke(messages);
    const strategy = structuredResult.strategies;

    console.log(`✅ Strategy complete:`);
    console.log(`   - Create new: ${strategy.filter(s => s.action === "create_new").length}`);
    console.log(`   - Update existing: ${strategy.filter(s => s.action === "update_existing").length}`);
    console.log(`   - Skip: ${strategy.filter(s => s.action === "skip").length}`);

    return {
      componentStrategy: strategy,
      currentPhase: "strategy",
      metadata: {
        ...state.metadata,
        strategyToolCalls: toolCallCount
      }
    };

  } catch (error) {
    console.error("❌ Strategy planning failed:", error.message);
    return {
      errors: [{
        message: error.message,
        phase: "strategy",
        timestamp: new Date().toISOString()
      }],
      status: "error"
    };
  }
};

/**
 * Build system prompt for strategy planning
 */
function buildStrategyPrompt() {
  return `You are a strategic planning AI for component generation. Your job is to analyze design components and decide the best action for each one.

**Your Task:**
For each component identified in the visual analysis, determine whether to:
1. CREATE NEW - Generate a new component from scratch
2. UPDATE EXISTING - Modify an existing component to add variants/props
3. SKIP - Component already exists and matches perfectly

**Tools Available:**
- list_components: List all existing components in the library
- read_component_file: Read the source code of an existing component
- read_multiple_files: Read several components at once for comparison
- search_component_usage: Find where a component is used (for safety checks)

**Decision Process:**
1. First, use list_components to see what already exists in the component library
2. For each design component, check if a similar component exists
3. If similar component found, read it to compare:
   - Does it have the same variants?
   - Does it have the same props?
   - Could it be extended vs creating new?
4. Consider component safety:
   - If updating, check search_component_usage to see impact
   - High usage = higher risk of breaking changes
5. Make final decision with clear reasoning

**Decision Criteria:**

CREATE NEW when:
- No similar component exists
- Existing component is fundamentally different
- Creating new is safer than modifying existing

UPDATE EXISTING when:
- Similar component exists (70%+ match)
- Design adds variants/props that can be added safely
- Low to medium usage (safe to modify)
- Changes are additive (not breaking)

SKIP when:
- Component already exists and matches design
- No meaningful differences to add
- Design is subset of existing component

**Output Format:**
For each component, provide:
- component: (name from visual analysis)
- action: "create_new" | "update_existing" | "skip"
- targetPath: (file path if updating/skipping, or suggested path if creating)
- reason: (clear explanation of decision)
- confidence: (0-1 score)
- safetyChecks: { usageCount, riskLevel, breakingChanges }

**Important:**
- Be conservative with updates - prefer creating new if unsure
- Always check component usage before deciding to update
- Provide clear reasoning for every decision
- Consider the atomic level (atom vs molecule vs organism)`;
}

/**
 * Build user prompt with context
 */
function buildUserPrompt(visualAnalysis, libraryContext, outputPath) {
  return `Here is the visual analysis of components from the Figma design:

${JSON.stringify(visualAnalysis, null, 2)}

Component Library Context:
${JSON.stringify(libraryContext, null, 2)}

Output Path: ${outputPath}

Please analyze each component and decide the best action. Use the tools available to:
1. List existing components
2. Read and compare similar components
3. Check usage of components you're considering updating

Then provide your strategy decisions for each component.`;
}


export default strategyPlannerNode;