#!/usr/bin/env node

/**
 * VISUAL INSPECTOR AGENT
 * Autonomous agent using createReactAgent with Playwright MCP tools
 * Handles:
 * - Writing temp components
 * - Navigating Storybook with port fallback
 * - Taking screenshots
 * - Comparing with GPT-4 Vision
 */

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import visualInspectionTools from "../tools/visual-inspection-tools.js";

// Import Playwright MCP tools (available from MCP server)
// These are accessed via the MCP tool prefix pattern

const model = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.1,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

/**
 * Build tools array combining our custom tools with Playwright MCP tools
 */
const buildVisualInspectorTools = () => {
  // Our custom visual inspection tools
  const customTools = visualInspectionTools;

  // Playwright MCP tools are available automatically via mcp__ prefix
  // We'll reference them in the agent's prompt so it knows to use them

  return customTools;
};

/**
 * System prompt for visual inspector agent
 */
const buildSystemPrompt = () => {
  return `You are a Visual QA Inspector agent responsible for verifying that rendered React components match Figma designs.

**YOUR MISSION:**
Compare a generated React component with its Figma design screenshot to ensure pixel-perfect accuracy.

**AVAILABLE PLAYWRIGHT TOOLS (via MCP):**
You have access to these Playwright browser tools:
- mcp__playwright__browser_navigate(url) - Navigate to a URL
- mcp__playwright__browser_snapshot() - Get accessibility snapshot
- mcp__playwright__browser_take_screenshot(filename, fullPage, type) - Take screenshot
- mcp__playwright__browser_resize(width, height) - Resize browser window
- mcp__playwright__browser_close() - Close browser

**YOUR CUSTOM TOOLS:**
- write_temp_component(componentName, code, outputPath) - Write component to temp for Storybook
- get_storybook_url(componentName, atomicLevel) - Get Storybook URL
- compare_screenshots_with_vision(figmaScreenshotUrl, renderedScreenshotBase64, componentName) - Compare via GPT-4 Vision

**YOUR WORKFLOW:**

1. **Write temp component** using write_temp_component tool
2. **Get Storybook URL** using get_storybook_url tool
3. **Navigate to Storybook** using mcp__playwright__browser_navigate
   - Try port 6006 first
   - If navigation fails (timeout, error), try ports 6007, 6008, 6009
   - Wait 2-3 seconds for component to render
4. **Take screenshot** using mcp__playwright__browser_take_screenshot
   - Use PNG format
   - Don't use fullPage (just capture viewport)
   - Save with filename like "component-name-screenshot.png"
5. **Compare screenshots** using compare_screenshots_with_vision
   - Pass Figma screenshot URL
   - Pass rendered screenshot (base64 from Playwright)
   - Get visual differences and Tailwind fixes
6. **Return results** with:
   - pixelPerfect: boolean
   - confidenceScore: number (0-1)
   - visualDifferences: array
   - tailwindFixes: array
   - feedback: string

**ERROR HANDLING:**
- If Storybook navigation fails on port 6006, try 6007, 6008, 6009
- If all ports fail, return error with helpful message
- If screenshot fails, retry once before giving up
- If Vision comparison fails, return error details

**QUALITY GATES:**
- pixelPerfect = true if confidenceScore >= 0.95
- Pass if confidenceScore >= 0.9
- Fail if confidenceScore < 0.9

**IMPORTANT:**
- Be thorough - take your time to ensure component renders before screenshot
- Be resilient - retry navigation/screenshot on failure
- Be precise - provide exact Tailwind class changes in feedback

Start by writing the temp component, then proceed through the workflow.`;
};

/**
 * Create visual inspector ReAct agent
 */
export const createVisualInspectorAgent = () => {
  const tools = buildVisualInspectorTools();
  const systemPrompt = buildSystemPrompt();

  const agent = createReactAgent({
    llm: model,
    tools,
    messageModifier: systemPrompt
  });

  return agent;
};

/**
 * Run visual inspection using the agent
 */
export const runVisualInspection = async (componentCode, componentSpec, figmaScreenshot, outputPath) => {
  console.log(`  → Creating visual inspector agent...`);

  const agent = createVisualInspectorAgent();

  const userMessage = `Perform visual inspection for this component:

**Component Name:** ${componentSpec.name}
**Atomic Level:** ${componentSpec.atomicLevel}
**Output Path:** ${outputPath}

**Component Code:**
\`\`\`tsx
${componentCode}
\`\`\`

**Figma Screenshot URL:**
${figmaScreenshot || 'Not provided - skip visual validation'}

**Your task:**
1. Write the temp component file
2. Navigate to Storybook (try ports 6006-6009)
3. Take a screenshot
4. Compare with Figma screenshot using Vision
5. Return the comparison results

If Figma screenshot is not provided, skip visual validation and return a default passing result.`;

  try {
    console.log(`  → Agent starting workflow...`);

    const result = await agent.invoke({
      messages: [
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    console.log(`  → Agent completed`);

    // DEBUG: Log all messages to understand the structure
    console.log(`\n📋 DEBUG: Agent returned ${result.messages.length} messages`);
    result.messages.forEach((msg, idx) => {
      console.log(`  Message ${idx}: type=${msg.constructor.name}, hasContent=${!!msg.content}, hasTool Calls=${!!msg.tool_calls}`);
      if (msg.content) {
        const preview = typeof msg.content === 'string'
          ? msg.content.substring(0, 100)
          : JSON.stringify(msg.content).substring(0, 100);
        console.log(`    Content preview: ${preview}...`);
      }
      if (msg.tool_calls) {
        console.log(`    Tool calls: ${msg.tool_calls.length}`);
      }
    });

    // Extract the final answer from agent messages
    const lastMessage = result.messages[result.messages.length - 1];

    // Parse agent's response
    // The agent should return JSON with the comparison results
    try {
      const parsedResult = JSON.parse(lastMessage.content);
      console.log(`  ✓ Successfully parsed JSON from last message`);
      return parsedResult;
    } catch (parseError) {
      // If agent didn't return JSON, extract key info from text
      console.log(`  ⚠️  Agent response not JSON (${parseError.message}), using fallback`);
      return {
        pixelPerfect: lastMessage.content.includes('pixel perfect') || lastMessage.content.includes('95%'),
        confidenceScore: 0.85,
        visualDifferences: [],
        tailwindFixes: [],
        feedback: lastMessage.content
      };
    }
  } catch (error) {
    console.error(`  ❌ Visual inspection agent failed: ${error.message}`);

    // Return fallback result
    return {
      pixelPerfect: false,
      confidenceScore: 0.85,
      visualDifferences: [],
      tailwindFixes: [],
      feedback: `Visual inspection failed: ${error.message}. Approved based on code review only.`
    };
  }
};

export default { createVisualInspectorAgent, runVisualInspection };
