#!/usr/bin/env node

/**
 * ANALYSIS - Get Figma screenshot URL and analyze with OpenAI
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { buildVisualAnalysisPrompt } from "../prompts/analysis/visual-analysis-prompt.js";
import { buildVisualAnalysisUserPrompt } from "../prompts/analysis/visual-analysis-user-prompt.js";

// Load .env from project root (works regardless of where script is run from)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", "..", ".env") });

// Simplified component schema (using nullable for OpenAI compatibility)
const ComponentSchema = z.object({
  name: z.string().describe("Component name (e.g., 'Button', 'TextInput')"),
  atomicLevel: z
    .enum(["atom", "molecule", "organism"])
    .describe("Atomic design level"),
  description: z.string().describe("Brief purpose/usage"),

  // Separate variant types for clarity
  styleVariants: z
    .array(z.string())
    .describe(
      "Style/color variants, clear semantic naming (e.g., ['default', 'primary', 'secondary'])"
    ),
  sizeVariants: z
    .array(z.string())
    .describe("Size variants (e.g., ['small', 'medium', 'large'])"),
  otherVariants: z
    .array(z.string())
    .nullable()
    .describe("Other variants like shape, density, etc."),

  states: z
    .array(z.string())
    .describe(
      "Interactive states (e.g., ['default', 'hover', 'disabled', 'focus'])"
    ),

  props: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean(),
      })
    )
    .nullable()
    .describe("Inferred component props"),
  designTokens: z
    .object({
      colors: z.array(z.string()).nullable(),
      spacing: z.array(z.string()).nullable(),
      typography: z.array(z.string()).nullable(),
    })
    .nullable()
    .describe("Design tokens used"),
  dependencies: z
    .array(z.string())
    .nullable()
    .describe("Other components this depends on"),
  reusabilityScore: z.number().min(1).max(10),
  complexityScore: z.number().min(1).max(10),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Analysis confidence for this component"),
});

const AnalysisSchema = z.object({
  summary: z.string().describe("Overall analysis summary"),
  componentCount: z.number(),
  components: z.array(ComponentSchema),
  globalTokens: z
    .object({
      colors: z.array(z.string()).nullable(),
      spacing: z.array(z.string()).nullable(),
      typography: z.array(z.string()).nullable(),
    })
    .nullable()
    .describe("Global design tokens across all components"),
});

export const analyzeFigmaVisualComponents = async (state) => {
  console.log("🔍 Starting analysis...");

  try {
    // Get Figma screenshot URL and node data
    console.log("📸 Getting Figma screenshot URL and node data...");
    const { parseFigmaUrl, fetchNodeData, extractComponentMetadata } = await import(
      "../../utils/figma-integration.js"
    );
    const { fileKey, nodeId } = parseFigmaUrl(state.input);

    // Call Figma API to get image URL and node data in parallel
    const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
    const DEPTH = 5; // How deep to recurse in node data
    const [imageResponse, nodeDataResult] = await Promise.all([
      fetch(
        `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=png&scale=1`,
        { headers: { "X-Figma-Token": FIGMA_TOKEN } }
      ),
      fetchNodeData(fileKey, nodeId, DEPTH),
    ]);

    const imageData = await imageResponse.json();
    const screenshotUrl = imageData.images[nodeId];

    if (!screenshotUrl) {
      throw new Error("Failed to get screenshot URL from Figma");
    }

    // Extract component metadata from node data
    const componentMetadata = extractComponentMetadata(
      nodeDataResult.metadata.rawDocument
    );

    console.log("✅ Got screenshot URL and node data from Figma");

    // Analyze with OpenAI using detailed prompt (pass URL directly)
    console.log("🤖 Analyzing with OpenAI (detailed prompt)...");
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.1,
      maxTokens: 3000,
      openAIApiKey: process.env.OPENAI_API_KEY,
    }).withStructuredOutput(AnalysisSchema);

    // Use the detailed prompt builder
    const systemPrompt = buildVisualAnalysisPrompt();

    const result = await model.invoke([
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: buildVisualAnalysisUserPrompt(componentMetadata)
          },
          { type: "image_url", image_url: { url: screenshotUrl } }
        ]
      }
    ]);

    if (!result || !result.components) {
      throw new Error("AI analysis failed or returned no components");
    }
    console.log(`✅ Found ${result.components.length} components`);

    // Conditional deep dive for icon extraction
    const needsIconExtraction =
      result.components.some(comp =>
        comp.inferredProps?.some(p => p.name && p.name.toLowerCase().includes('icon')) ||
        comp.description?.toLowerCase().includes('icon') ||
        comp.designTokens?.hasIcon === true
      ) ||
      componentMetadata.instances?.some(i => i.hasVectorElements);

    let extractedIcons = [];
    if (needsIconExtraction) {
      console.log("🔍 Detected potential icons, extracting SVGs...");

      try {
        // Dynamic import to avoid circular dependencies
        const svgExtractor = await import("../../utils/svg-extractor.js");

        // Batch extract all icons at once
        extractedIcons = await svgExtractor.batchExtractIcons(
          nodeDataResult.metadata.rawDocument,
          fileKey,
          componentMetadata.instances
        );

        if (extractedIcons.length > 0) {
          console.log(`✅ Extracted ${extractedIcons.length} unique icon SVGs`);
        } else {
          console.log("ℹ️  No icons found in the design");
        }
      } catch (error) {
        console.log(`⚠️  Icon extraction skipped: ${error.message}`);
        // Not critical, continue without icons
      }
    }

    // Return state updates directly (for LangGraph StateAnnotation)
    return {
      visualAnalysis: result,
      figmaData: {
        fileKey,
        nodeId,
        screenshotUrl,
        nodeMetadata: nodeDataResult.metadata,
        componentMetadata,
        extractedIcons // Add extracted icons if any
      },
      status: "completed",
      currentPhase: "analysis"
    };
  } catch (error) {
    console.error("❌ Analysis failed:", error.message);
    throw error;
  }
};
