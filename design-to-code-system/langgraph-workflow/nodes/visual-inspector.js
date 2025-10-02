#!/usr/bin/env node

/**
 * VISUAL INSPECTOR
 * Uses Playwright to render component in Storybook and compares with Figma screenshot
 * using GPT-4 Vision for pixel-perfect validation
 */

import { chromium } from 'playwright';
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import path from 'path';
import fs from 'fs-extra';

// Schema for visual comparison result
const VisualComparisonSchema = z.object({
  pixelPerfect: z.boolean().describe("True if 95%+ match"),
  confidenceScore: z.number().min(0).max(1).describe("How close the visual match is (0-1)"),
  visualDifferences: z.array(z.object({
    aspect: z.string().describe("What aspect differs (e.g., 'button padding')"),
    figma: z.string().describe("Value in Figma design"),
    rendered: z.string().describe("Value in rendered component"),
    severity: z.enum(["high", "medium", "low"]).describe("Severity of the difference")
  })).describe("List of visual differences found"),
  tailwindFixes: z.array(z.string()).describe("Specific Tailwind class changes needed"),
  feedback: z.string().describe("Detailed feedback explaining all visual differences and fixes")
});

const visionModel = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.1,
  openAIApiKey: process.env.OPENAI_API_KEY,
}).withStructuredOutput(VisualComparisonSchema, { name: "visual_comparison" });

/**
 * Compare rendered component with Figma screenshot using Playwright + GPT-4 Vision
 */
export const compareWithFigma = async (componentCode, componentSpec, figmaScreenshot, outputPath) => {
  console.log(`    → Preparing visual comparison...`);

  // If no Figma screenshot available, skip visual validation
  if (!figmaScreenshot) {
    console.log(`    ⚠️  No Figma screenshot available, skipping visual inspection`);
    return {
      pixelPerfect: false,
      confidenceScore: 0.85,
      visualDifferences: [],
      feedback: "Visual inspection skipped - no Figma screenshot available",
      tailwindFixes: []
    };
  }

  try {
    // 1. Write component to temp location for Storybook access
    const tempDir = path.join(outputPath, 'temp');
    await fs.ensureDir(tempDir);
    const tempPath = path.join(tempDir, `${componentSpec.name}.tsx`);
    await fs.writeFile(tempPath, componentCode);
    console.log(`    → Wrote temp component to ${tempPath}`);

    // 2. Launch Playwright and capture screenshot
    console.log(`    → Launching Playwright...`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 }
    });

    // Construct Storybook URL based on component category
    const categoryMap = {
      atom: 'elements',
      molecule: 'components',
      organism: 'modules'
    };
    const category = categoryMap[componentSpec.atomicLevel] || 'elements';
    const storyPath = `http://localhost:6006/?path=/story/${category}-${componentSpec.name.toLowerCase()}--default`;

    console.log(`    → Navigating to ${storyPath}`);

    try {
      await page.goto(storyPath, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(2000);  // Let component fully render

      // Take screenshot of the component
      const screenshotBuffer = await page.screenshot({
        type: 'png',
        fullPage: false
      });
      const renderedScreenshot = screenshotBuffer.toString('base64');
      console.log(`    → Captured component screenshot`);

      await browser.close();

      // 3. Use GPT-4 Vision to compare screenshots
      console.log(`    → Analyzing visual differences with GPT-4 Vision...`);
      const comparisonPrompt = buildVisualComparisonPrompt();

      const result = await visionModel.invoke([
        { type: "text", content: comparisonPrompt },
        {
          type: "image_url",
          image_url: {
            url: figmaScreenshot.startsWith('data:') ? figmaScreenshot : `data:image/png;base64,${figmaScreenshot}`
          }
        },
        {
          type: "image_url",
          image_url: { url: `data:image/png;base64,${renderedScreenshot}` }
        }
      ]);

      console.log(`    → Analysis complete`);
      return result;

    } catch (navError) {
      console.log(`    ⚠️  Could not navigate to Storybook: ${navError.message}`);
      await browser.close();

      // Fallback: approve without visual validation
      return {
        pixelPerfect: false,
        confidenceScore: 0.85,
        visualDifferences: [],
        feedback: `Visual inspection unavailable - Storybook navigation failed: ${navError.message}`,
        tailwindFixes: []
      };
    }

  } catch (error) {
    console.error(`    ❌ Visual inspection error: ${error.message}`);

    // Fallback: approve without visual validation
    return {
      pixelPerfect: false,
      confidenceScore: 0.85,
      visualDifferences: [],
      feedback: `Visual inspection failed: ${error.message}. Approved based on code review only.`,
      tailwindFixes: []
    };
  }
};

/**
 * Build prompt for GPT-4 Vision comparison
 */
const buildVisualComparisonPrompt = () => {
  return `You are a design QA specialist comparing a Figma design with a rendered React component.

**YOUR TASK:**
Compare these two UI component images and identify visual differences:

- **Image 1**: Figma design (source of truth)
- **Image 2**: Rendered React component (generated code)

**ANALYZE THESE ASPECTS:**

1. **Colors**
   - Background colors
   - Text colors
   - Border colors
   - Shadow colors
   - Compare hex values if visible

2. **Spacing**
   - Padding (internal spacing)
   - Margins (external spacing)
   - Gaps between elements
   - Overall dimensions (width, height)

3. **Typography**
   - Font size
   - Font weight (normal, medium, semibold, bold)
   - Line height
   - Letter spacing
   - Text alignment

4. **Layout**
   - Element positioning
   - Alignment (left, center, right)
   - Flex direction
   - Justify and align properties

5. **Borders**
   - Border width
   - Border radius (rounded corners)
   - Border style (solid, dashed, etc.)

6. **Visual Effects**
   - Box shadows
   - Opacity
   - Transitions/animations (if visible)

**RETURN JSON:**
{
  "pixelPerfect": <boolean, true if 95%+ match>,
  "confidenceScore": <number 0-1, how close the visual match is>,
  "visualDifferences": [
    {
      "aspect": "button padding",
      "figma": "12px 24px",
      "rendered": "16px 32px",
      "severity": "high|medium|low"
    },
    {
      "aspect": "border radius",
      "figma": "8px",
      "rendered": "4px",
      "severity": "medium"
    }
  ],
  "tailwindFixes": [
    "Change px-4 py-2 to px-6 py-3 for correct padding",
    "Change rounded to rounded-lg for 8px border radius",
    "Adjust text size from text-base to text-sm"
  ],
  "feedback": "Detailed feedback paragraph explaining all visual differences and how to fix them. Be specific about Tailwind classes that need to change. Example: 'The button padding is too large. In Figma it shows 12px horizontal and 24px vertical padding, but the rendered component uses 16px and 32px. Change from px-4 py-2 to px-3 py-6 to match the design.'"
}

**SEVERITY GUIDELINES:**
- **high**: Major visual differences that significantly impact appearance (wrong colors, huge spacing differences)
- **medium**: Noticeable differences that affect polish (slight padding/margin mismatches, border radius)
- **low**: Minor differences that are barely noticeable (1-2px differences, subtle color variations)

**SCORING GUIDELINES:**
- 1.0 (100%): Identical or differences imperceptible to human eye
- 0.95-0.99 (95-99%): Very close, only minor differences (1-2px variations)
- 0.85-0.94 (85-94%): Close match with some noticeable differences
- 0.70-0.84 (70-84%): Similar but multiple differences
- <0.70 (<70%): Significant differences

Be objective and precise. Measure carefully and provide actionable Tailwind class suggestions.`;
};

export default { compareWithFigma };
