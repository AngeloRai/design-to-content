#!/usr/bin/env node

/**
 * VISUAL INSPECTION TOOLS
 * Tools for visual QA agent to compare rendered components with Figma designs
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs-extra";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Track Storybook process globally
let storybookProcess = null;

/**
 * Ensure Storybook is running on the specified port
 */
export const ensureStorybookRunningTool = tool(
  async ({ port = 6006 }) => {
    const { execSync } = await import("child_process");

    try {
      // Check if port is already in use
      const result = execSync(`lsof -ti:${port} 2>/dev/null || echo ""`).toString().trim();

      if (result) {
        return JSON.stringify({
          success: true,
          port,
          status: "already_running",
          message: `Storybook is already running on port ${port}`
        });
      }

      // Port is free, start Storybook
      const storybookDir = path.join(__dirname, "..", "..", "..", "storybook-app");

      console.log(`    → Starting Storybook on port ${port}...`);

      storybookProcess = spawn("npm", ["run", "storybook", "--", "--port", port.toString()], {
        cwd: storybookDir,
        detached: true,
        stdio: "ignore"
      });

      storybookProcess.unref();

      // Wait for Storybook to be ready (check if port opens)
      const maxAttempts = 30; // 30 seconds
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
          const checkResult = execSync(`lsof -ti:${port} 2>/dev/null || echo ""`).toString().trim();
          if (checkResult) {
            console.log(`    ✓ Storybook started on port ${port}`);
            return JSON.stringify({
              success: true,
              port,
              status: "started",
              message: `Storybook started successfully on port ${port}`,
              pid: storybookProcess.pid
            });
          }
        } catch (e) {
          // Keep waiting
        }
      }

      return JSON.stringify({
        success: false,
        port,
        error: "Storybook failed to start within 30 seconds"
      });

    } catch (error) {
      return JSON.stringify({
        success: false,
        port,
        error: error.message
      });
    }
  },
  {
    name: "ensure_storybook_running",
    description: "Ensure Storybook is running on the specified port. If not running, starts it automatically. Returns JSON with success status, port, and whether it was already running or newly started. Call this BEFORE attempting to navigate to Storybook URLs.",
    schema: z.object({
      port: z.number().nullable().default(6006).describe("Port to run Storybook on (default 6006)")
    })
  }
);

/**
 * Write component to temp directory for Storybook rendering
 */
export const writeTempComponentTool = tool(
  async ({ componentName, code, outputPath }) => {
    try {
      const tempDir = path.join(outputPath, 'temp');
      await fs.ensureDir(tempDir);
      const tempPath = path.join(tempDir, `${componentName}.tsx`);
      await fs.writeFile(tempPath, code);

      return JSON.stringify({
        success: true,
        filePath: tempPath,
        message: `Component written to ${tempPath} for Storybook rendering`
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error.message
      });
    }
  },
  {
    name: "write_temp_component",
    description: "Write a component to the temp directory so Storybook can render it for visual inspection. Use this before taking screenshots. Returns JSON with success status and file path.",
    schema: z.object({
      componentName: z.string().describe("Component name (e.g., 'Button')"),
      code: z.string().describe("Complete TypeScript React component code"),
      outputPath: z.string().describe("Output path (e.g., 'nextjs-app/ui')")
    })
  }
);

/**
 * Compare two screenshots using GPT-4 Vision
 */
export const compareScreenshotsWithVisionTool = tool(
  async ({ figmaScreenshotUrl, renderedScreenshotBase64, componentName }) => {
    const { ChatOpenAI } = await import("@langchain/openai");
    const { z } = await import("zod");

    // Schema for visual comparison result
    const VisualComparisonSchema = z.object({
      pixelPerfect: z.boolean().describe("True if 95%+ match"),
      confidenceScore: z.number().min(0).max(1).describe("Visual similarity score"),
      visualDifferences: z.array(z.object({
        aspect: z.string(),
        figma: z.string(),
        rendered: z.string(),
        severity: z.enum(["high", "medium", "low"])
      })),
      tailwindFixes: z.array(z.string()),
      feedback: z.string()
    });

    const visionModel = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.1,
      openAIApiKey: process.env.OPENAI_API_KEY,
    }).withStructuredOutput(VisualComparisonSchema, { name: "visual_comparison" });

    const comparisonPrompt = `You are a design QA specialist comparing a Figma design with a rendered React component.

**Component:** ${componentName}

Compare these two images and identify visual differences:
- **Image 1**: Figma design (source of truth)
- **Image 2**: Rendered React component

**Analyze:** colors, spacing, typography, layout, borders, effects

**Return ONLY valid JSON:**
{
  "pixelPerfect": boolean (true if 95%+ match),
  "confidenceScore": number (0-1, visual similarity),
  "visualDifferences": [
    {
      "aspect": "button padding",
      "figma": "12px 24px",
      "rendered": "16px 32px",
      "severity": "high"
    }
  ],
  "tailwindFixes": [
    "Change px-4 py-2 to px-6 py-3"
  ],
  "feedback": "Detailed explanation of differences and fixes"
}

Scoring: 1.0=identical, 0.95-0.99=very close, 0.85-0.94=close, 0.70-0.84=similar, <0.70=different`;

    try {
      const comparisonResult = await visionModel.invoke([
        {
          role: "user",
          content: [
            { type: "text", text: comparisonPrompt },
            {
              type: "image_url",
              image_url: {
                url: figmaScreenshotUrl.startsWith('data:')
                  ? figmaScreenshotUrl
                  : `data:image/png;base64,${figmaScreenshotUrl}`
              }
            },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${renderedScreenshotBase64}` }
            }
          ]
        }
      ]);

      // Return structured result as JSON string for the agent
      return JSON.stringify(comparisonResult);
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error.message,
        pixelPerfect: false,
        confidenceScore: 0,
        visualDifferences: [],
        tailwindFixes: [],
        feedback: `Vision comparison failed: ${error.message}`
      });
    }
  },
  {
    name: "compare_screenshots_with_vision",
    description: "Use GPT-4 Vision to compare Figma screenshot with rendered component screenshot. Returns JSON with pixelPerfect (bool), confidenceScore (0-1), visualDifferences (array), tailwindFixes (array), and feedback (string).",
    schema: z.object({
      figmaScreenshotUrl: z.string().describe("Figma screenshot URL or base64 data URI"),
      renderedScreenshotBase64: z.string().describe("Base64 encoded screenshot from Playwright"),
      componentName: z.string().describe("Component name for context")
    })
  }
);

/**
 * Get Storybook URL for a component
 */
export const getStorybookUrlTool = tool(
  async ({ componentName, atomicLevel, port = 6006 }) => {
    const categoryMap = {
      atom: 'elements',
      molecule: 'components',
      organism: 'modules'
    };

    const category = categoryMap[atomicLevel] || 'elements';
    const url = `http://localhost:${port}/?path=/story/${category}-${componentName.toLowerCase()}--default`;

    return JSON.stringify({
      success: true,
      url,
      port,
      category,
      message: `Storybook URL: ${url}`
    });
  },
  {
    name: "get_storybook_url",
    description: "Get the Storybook URL for a component. Returns JSON with URL and metadata. You can optionally specify port (default 6006). Try ports 6006-6009 if navigation fails.",
    schema: z.object({
      componentName: z.string().describe("Component name (e.g., 'Button')"),
      atomicLevel: z.string().describe("Atomic level: atom, molecule, or organism"),
      port: z.number().nullable().default(6006).describe("Storybook port (default 6006)")
    })
  }
);

const visualInspectionTools = [
  ensureStorybookRunningTool,
  writeTempComponentTool,
  compareScreenshotsWithVisionTool,
  getStorybookUrlTool
];

export default visualInspectionTools;
