#!/usr/bin/env node

/**
 * ANALYSIS - Get Figma screenshot URL and analyze with OpenAI
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import fs from "fs-extra";
import { buildVisualAnalysisPrompt } from "../prompts/analysis/visual-analysis-prompt.js";
import { buildVisualAnalysisUserPrompt } from "../prompts/analysis/visual-analysis-user-prompt.js";
import { isDevelopment } from "../utils/config.js";

// Load .env from project root (works regardless of where script is run from)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", "..", ".env") });

// Component schema - focus on what's essential for code generation
const ComponentSchema = z.object({
  name: z.string().min(1).describe("Component name"),
  atomicLevel: z.enum(["atom", "molecule", "organism"]),
  description: z.string().min(1),

  // Variants - enforce non-empty arrays
  styleVariants: z.array(z.string().min(1)).min(1).describe("Style variants observed (min 1)"),
  sizeVariants: z.array(z.string().min(1)),
  otherVariants: z.array(z.string().min(1)),

  states: z.array(z.string().min(1)).min(1).describe("Interactive states (min 1: 'default')"),

  props: z.array(z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    required: z.boolean(),
  }).strict()),

  // CORE: Visual properties for each variant - this is what matters for code generation
  variantVisualMap: z.array(z.object({
    variantName: z.string().min(1),
    visualProperties: z.object({
      backgroundColor: z.string().min(1),
      textColor: z.string().nullable(),
      borderColor: z.string().nullable(),
      borderWidth: z.string().nullable(),
      borderRadius: z.string().nullable(),
      padding: z.string().nullable(),
      fontSize: z.string().nullable(),
      fontWeight: z.string().nullable(),
      shadow: z.string().nullable(),
    }).strict()
  }).strict()).min(1).describe("Visual properties for each variant (MUST match styleVariants length)"),
}).strict();

const AnalysisSchema = z.object({
  summary: z.string().min(1),
  componentCount: z.number().int().min(1),
  components: z.array(ComponentSchema).min(1),
}).strict();

export const analyzeFigmaVisualComponents = async (state) => {
  console.log("🔍 Starting analysis...");

  try {
    // Get Figma screenshot URL and node data
    console.log("📸 Getting Figma screenshot URL and node data...");
    const { parseFigmaUrl, fetchNodeData, extractComponentMetadata, extractDesignTokens } = await import(
      "../../utils/figma-integration.js"
    );
    const { fileKey, nodeId } = parseFigmaUrl(state.input);

    // Call Figma API to get image URL and node data in parallel
    const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
    const DEPTH = 8; // How deep to recurse in node data (increased to reach deeply nested colors)
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

    // Extract component metadata AND design tokens from node data
    const componentMetadata = extractComponentMetadata(
      nodeDataResult.metadata.rawDocument
    );

    // Extract design tokens (colors, spacing, typography) from ALL nodes
    const designTokens = extractDesignTokens(
      nodeDataResult.metadata.rawDocument
    );

    console.log(`✅ Got screenshot URL and node data from Figma`);
    console.log(`   Components found: ${componentMetadata.totalInstances}`);
    console.log(`   Colors extracted: ${designTokens.colors.length}`);

    if (isDevelopment()) {
      console.log('\n📊 Figma Color Palette:');
      designTokens.colors.forEach((color) => {
        const usedIn = color.contexts.slice(0, 2).map(c => c.nodeName).join(', ');
        console.log(`   ${color.hex} (${color.type}) - ${usedIn}`);
      });
      console.log('');
    }

    // DEBUG: Save screenshot for visual inspection
    if (isDevelopment()) {
      const debugDir = join(process.cwd(), 'debug', 'screenshots');
      await fs.ensureDir(debugDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const screenshotPath = join(debugDir, `figma-${timestamp}.png`);

      try {
        // Download and save screenshot
        const imageBuffer = await fetch(screenshotUrl).then(r => r.arrayBuffer());
        await fs.writeFile(screenshotPath, Buffer.from(imageBuffer));

        console.log(`🔍 DEBUG: Screenshot saved to ${screenshotPath}`);
        console.log(`🔍 DEBUG: Screenshot URL: ${screenshotUrl}`);
      } catch (error) {
        console.warn(`⚠️  DEBUG: Failed to save screenshot: ${error.message}`);
      }
    }

    // Analyze with OpenAI using detailed prompt (pass URL directly)
    console.log("🤖 Analyzing with OpenAI (detailed prompt)...");
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.1,
      maxTokens: 16000,
      openAIApiKey: process.env.OPENAI_API_KEY,
    }).withStructuredOutput(AnalysisSchema);

    const systemPrompt = buildVisualAnalysisPrompt();

    let result = await model.invoke([
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: buildVisualAnalysisUserPrompt(designTokens)
          },
          { type: "image_url", image_url: { url: screenshotUrl } }
        ]
      }
    ]);

    if (!result || !result.components) {
      throw new Error("AI analysis failed or returned no components");
    }
    console.log(`✅ Found ${result.components.length} components`);

    // Validate and refine if incomplete (max 2 attempts)
    const { validateVariantCompleteness, validateColorFidelity, refineIncompleteAnalysis } = await import("../utils/validate-and-refine.js");

    let validation = validateVariantCompleteness(result);

    // Validate color fidelity
    const colorValidation = validateColorFidelity(result, designTokens);
    if (!colorValidation.isValid) {
      console.warn(`\n⚠️  Color validation failed - ${colorValidation.issues.length} invalid color(s):`);
      colorValidation.issues.forEach(issue => {
        console.warn(`   ${issue.component}/${issue.variant || 'tokens'}: ${issue.invalidColor}`);
      });
      console.warn(`   Valid Figma colors: ${colorValidation.figmaColorCount}`);
      console.warn(`   Expected: ${colorValidation.figmaColors.slice(0, 5).join(', ')}...`);
    }

    let refinementAttempts = 0;
    const maxRefinementAttempts = 2;

    while (!validation.isValid && refinementAttempts < maxRefinementAttempts) {
      console.log(`\n⚠️  Validation failed - attempting refinement (${refinementAttempts + 1}/${maxRefinementAttempts})`);

      try {
        result = await refineIncompleteAnalysis(
          model,
          result,
          validation.issues,
          screenshotUrl,
          AnalysisSchema,
          designTokens 
        );

        // Re-validate
        validation = validateVariantCompleteness(result);
        refinementAttempts++;

        if (validation.isValid) {
          console.log(`✅ Refinement successful after ${refinementAttempts} attempt(s)`);
        }
      } catch (error) {
        console.error(`❌ Refinement attempt ${refinementAttempts + 1} failed:`, error.message);
        refinementAttempts++;
        break;
      }
    }

    // If still invalid after refinement attempts, log warning
    if (!validation.isValid) {
      console.warn(`\n⚠️  Analysis still incomplete after ${refinementAttempts} refinement attempt(s)`);
      console.warn(`   Issues:`, validation.issues);
      console.warn(`   Proceeding with incomplete data - generated code may be imperfect`);
    }

    // DEBUG: Save full analysis report
    if (isDevelopment()) {
      const debugDir = join(process.cwd(), 'debug', 'analysis-reports');
      await fs.ensureDir(debugDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const reportPath = join(debugDir, `analysis-${timestamp}.json`);

      const fullReport = {
        timestamp: new Date().toISOString(),
        screenshotUrl,
        componentMetadata,
        aiAnalysis: result,
        extractedTokens: result.components.map(c => ({
          name: c.name,
          designTokens: c.designTokens,
          styleVariants: c.styleVariants,
          sizeVariants: c.sizeVariants,
          states: c.states,
          variantVisualMap: c.variantVisualMap
        }))
      };

      await fs.writeFile(reportPath, JSON.stringify(fullReport, null, 2));
      console.log(`🔍 DEBUG: Full analysis saved to ${reportPath}`);

      // Log summary to console
      console.log(`🔍 DEBUG: AI extracted ${result.components.length} components:`);
      result.components.forEach(comp => {
        console.log(`  - ${comp.name} (${comp.atomicLevel}):`);
        console.log(`    Style Variants: ${comp.styleVariants?.join(', ') || 'none'}`);
        console.log(`    Size Variants: ${comp.sizeVariants?.join(', ') || 'none'}`);
        console.log(`    States: ${comp.states?.join(', ') || 'none'}`);

        if (comp.designTokens?.colors && Array.isArray(comp.designTokens.colors)) {
          console.log(`    Colors (${comp.designTokens.colors.length}):`);
          comp.designTokens.colors.slice(0, 3).forEach(c => {
            if (typeof c === 'object' && c.hex) {
              console.log(`      ${c.hex} - ${c.role}${c.variant ? ` (${c.variant})` : ''}`);
            } else {
              console.log(`      ${c}`); 
            }
          });
          if (comp.designTokens.colors.length > 3) {
            console.log(`      ... and ${comp.designTokens.colors.length - 3} more`);
          }
        }

        if (comp.variantVisualMap && comp.variantVisualMap.length > 0) {
          console.log(`    Variant Visual Map (${comp.variantVisualMap.length} variants):`);
          comp.variantVisualMap.slice(0, 2).forEach(v => {
            console.log(`      ${v.variantName}: bg=${v.visualProperties.backgroundColor}, text=${v.visualProperties.textColor}`);
          });
          if (comp.variantVisualMap.length > 2) {
            console.log(`      ... and ${comp.variantVisualMap.length - 2} more`);
          }
        }
      });
    }

    // Quality check: Log potential analysis issues (non-blocking)
    if (isDevelopment()) {
      console.log("🔍 Analysis quality check...");
      let potentialIssues = false;

      result.components.forEach((comp) => {
        // Check variant completeness
        const styleVariantCount = comp.styleVariants?.length || 0;
        const variantMapCount = comp.variantVisualMap?.length || 0;

        if (styleVariantCount > 0 && variantMapCount > 0 && variantMapCount < styleVariantCount) {
          console.log(`  ℹ️  ${comp.name}: ${styleVariantCount} variants listed, ${variantMapCount} visual mappings provided`);
          potentialIssues = true;
        }
      });

      if (!potentialIssues) {
        console.log("  ✅ All components have complete variant data");
      } else {
        console.log("  ℹ️  Generation will verify against screenshot for missing data");
      }
    }

    // Conditional deep dive for icon extraction
    const needsIconExtraction =
      result.components.some(comp =>
        comp.props?.some(p => p?.name && p?.name?.toLowerCase()?.includes('icon')) ||
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
