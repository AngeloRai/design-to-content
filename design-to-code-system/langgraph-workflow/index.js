#!/usr/bin/env node

/**
 * AUTONOMOUS DESIGN-TO-CODE WORKFLOW
 *
 * Entry point for the LangGraph workflow:
 * analysis → strategy_planner → generator → finalizer
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createWorkflow } from "./graph.js";
import { createInitialState } from "./schemas/state.js";

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  // Get Figma URL from args or env
  const figmaUrl = process.argv[2] || process.env.FIGMA_URL;
  // Default output path: go up one level to parent dir, then into nextjs-app/ui
  const defaultOutputPath = join(__dirname, "..", "..", "nextjs-app", "ui");
  const outputPath = process.argv[3] || process.env.OUTPUT_PATH || defaultOutputPath;

  if (!figmaUrl || !figmaUrl.includes("figma.com")) {
    console.error("❌ Please provide a valid Figma URL");
    console.log('Usage: node langgraph-workflow/index.js [FIGMA_URL] [outputPath]');
    console.log('Or set FIGMA_URL in .env file');
    console.log('Example: node langgraph-workflow/index.js "https://figma.com/file/..." "src/ui"');
    process.exit(1);
  }

  console.log("🚀 Starting autonomous design-to-code workflow...");
  console.log(`📝 Figma URL: ${figmaUrl}`);
  console.log(`📁 Output path: ${outputPath}\n`);

  try {
    // Create workflow with in-memory checkpointing
    const workflow = createWorkflow();

    // Create initial state
    const initialState = createInitialState(figmaUrl);
    initialState.outputPath = outputPath;

    // Run workflow with config
    const config = {
      configurable: {
        thread_id: `figma-${Date.now()}`
      },
      recursionLimit: 25
    };

    console.log("═══════════════════════════════════════\n");

    const finalState = await workflow.invoke(initialState, config);

    console.log("\n═══════════════════════════════════════");
    console.log("✅ Workflow completed successfully!");
    console.log("═══════════════════════════════════════\n");

    // Display key results
    if (finalState.generatedComponents?.length > 0) {
      console.log("Generated components:");
      finalState.generatedComponents.forEach(comp => {
        console.log(`  ✓ ${comp.name} → ${comp.filePath}`);
      });
    }

  } catch (error) {
    console.error("\n❌ Workflow failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}
