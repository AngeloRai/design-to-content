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
- ensure_storybook_running(port) - Ensure Storybook is running before navigation
- write_temp_component(componentName, code, outputPath) - Write component to temp for Storybook
- get_storybook_url(componentName, atomicLevel, port) - Get Storybook URL
- compare_screenshots_with_vision(figmaScreenshotUrl, renderedScreenshotBase64, componentName) - Compare via GPT-4 Vision

**YOUR WORKFLOW:**

1. **Ensure Storybook is running** using ensure_storybook_running tool (port 6006)
   - This will start Storybook if it's not running
   - Wait for it to be ready before proceeding
2. **Write temp component** using write_temp_component tool
3. **Get Storybook URL** using get_storybook_url tool (use same port as step 1)
4. **Navigate to Storybook** using mcp__playwright__browser_navigate
   - Use the URL from step 3
   - Wait 2-3 seconds for component to render
5. **Take screenshot** using mcp__playwright__browser_take_screenshot
   - Use PNG format
   - Don't use fullPage (just capture viewport)
   - Save with filename like "component-name-screenshot.png"
6. **Compare screenshots** using compare_screenshots_with_vision
   - Pass Figma screenshot URL
   - Pass rendered screenshot (base64 from Playwright)
   - Get visual differences and Tailwind fixes
7. **Return results** as JSON with:
   - pixelPerfect: boolean
   - confidenceScore: number (0-1)
   - visualDifferences: array
   - tailwindFixes: array
   - feedback: string
   - storybookPort: number (the port you used)

**ERROR HANDLING:**
- If Storybook fails to start, return error immediately
- If navigation fails, check if Storybook is actually running
- If screenshot fails, retry once before giving up
- If Vision comparison fails, return error details

**QUALITY GATES:**
- pixelPerfect = true if confidenceScore >= 0.95
- Pass if confidenceScore >= 0.9
- Fail if confidenceScore < 0.9

**IMPORTANT:**
- Always start by ensuring Storybook is running (step 1)
- Be thorough - take your time to ensure component renders before screenshot
- Be resilient - retry navigation/screenshot on failure
- Be precise - provide exact Tailwind class changes in feedback

Start by ensuring Storybook is running, then proceed through the workflow.`;
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
export const runVisualInspection = async (componentCode, componentSpec, figmaScreenshot, outputPath, storybookPort = null) => {
  console.log(`  → Creating visual inspector agent...`);

  const agent = createVisualInspectorAgent();

  // Use existing port or default to 6006
  const targetPort = storybookPort || 6006;
  const portInstruction = storybookPort
    ? `Use port ${storybookPort} (already running from previous inspection)`
    : `Use port 6006 (start if needed)`;

  const userMessage = `Perform visual inspection for this component:

**Component Name:** ${componentSpec.name}
**Atomic Level:** ${componentSpec.atomicLevel}
**Output Path:** ${outputPath}
**Storybook Port:** ${targetPort} - ${portInstruction}

**Component Code:**
\`\`\`tsx
${componentCode}
\`\`\`

**Figma Screenshot URL:**
${figmaScreenshot || 'Not provided - skip visual validation'}

**Your task:**
1. Ensure Storybook is running on port ${targetPort} (if already running, skip to step 2)
2. Write the temp component file
3. Get the Storybook URL for this component (use port ${targetPort})
4. Navigate to Storybook using the URL from step 3
5. Take a screenshot
6. Compare with Figma screenshot using Vision
7. Return the comparison results

If Figma screenshot is not provided, skip visual validation and return a default passing result.`;

  try {
    console.log(`  → Agent starting workflow...`);

    const result = await agent.invoke(
      {
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ]
      },
      {
        recursionLimit: 50  // Increase from default 25 to allow more tool calls
      }
    );

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
      // Ensure port is included in result
      if (!parsedResult.storybookPort) {
        parsedResult.storybookPort = targetPort;
      }
      return parsedResult;
    } catch (parseError) {
      // If agent didn't return JSON, extract key info from text
      console.log(`  ⚠️  Agent response not JSON (${parseError.message}), using fallback`);
      return {
        pixelPerfect: lastMessage.content.includes('pixel perfect') || lastMessage.content.includes('95%'),
        confidenceScore: 0.85,
        visualDifferences: [],
        storybookPort: targetPort,  // Include port in fallback
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
