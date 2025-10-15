#!/usr/bin/env node
/**
 * Agentic System - LangGraph Entry Point
 * Orchestrates Figma-to-React component generation using LangGraph workflow
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'langsmith';
import { extractFigmaDesign } from './tools/figma-extractor.js';
import { buildWorkflow } from './workflow/graph.js';
import { configureLangSmith } from './config/langsmith-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from design-to-code-system directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configure LangSmith tracing
const langSmithConfig = configureLangSmith();

// Initialize LangSmith client for trace management
const langsmithClient = langSmithConfig.enabled ? new Client() : null;

/**
 * Main workflow using LangGraph
 */
const main = async () => {
  const args = process.argv.slice(2);

  // Get Figma URL from args or environment
  const figmaUrl = args[0] || process.env.FIGMA_URL;
  const outputDir = args[1] || path.join(__dirname, '..', '..', 'nextjs-app', 'ui');

  if (!figmaUrl) {
    console.log(`
❌ Error: Figma URL is required

Usage: node index-langgraph.js <figma-url> [output-dir]

Or set FIGMA_URL environment variable:
  FIGMA_URL="https://figma.com/file/abc123/design?node-id=1:2" node index-langgraph.js

Examples:
  node index-langgraph.js "https://figma.com/file/abc123/design?node-id=1:2"
  node index-langgraph.js "https://figma.com/file/abc123/design?node-id=1:2" "../nextjs-app/ui"

Options:
  figma-url    Figma file URL with node-id parameter
  output-dir   Output directory for generated components (default: ../nextjs-app/ui)
`);
    process.exit(1);
  }

  console.log('🚀 Agentic Component Generator (LangGraph)');
  console.log('='.repeat(60));
  console.log(`Figma URL: ${figmaUrl}`);
  console.log(`Output Dir: ${outputDir}`);
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Extract design from Figma with structured analysis
    console.log('📊 Phase: Figma Analysis');
    console.log('='.repeat(60));
    const extractionResult = await extractFigmaDesign(figmaUrl);
    const { structuredAnalysis } = extractionResult;
    console.log(`✅ Extracted ${structuredAnalysis.components.length} components`);
    console.log('='.repeat(60) + '\n');

    // Step 2: Build and run LangGraph workflow
    const workflow = buildWorkflow();

    const initialState = {
      figmaUrl,
      outputDir,
      figmaAnalysis: structuredAnalysis,
      componentsIdentified: structuredAnalysis.components.length,
      referenceComponents: [],
      vectorSearch: null,
      registry: null,
      conversationHistory: [],
      generatedComponents: 0,
      iterations: 0,
      currentPhase: 'init',
      success: false,
      errors: [],
      startTime: new Date().toISOString(),
      endTime: null
    };

    // Invoke workflow
    const result = await workflow.invoke(initialState);

    // Report final results
    console.log('\n📊 Final Results');
    console.log('='.repeat(60));
    console.log(`Components Identified: ${result.componentsIdentified}`);
    console.log(`Components Generated: ${result.generatedComponents}`);
    console.log(`Total Iterations: ${result.iterations}`);
    console.log(`Status: ${result.success ? '✅ Success' : '⚠️  Completed with errors'}`);
    console.log(`Duration: ${new Date(result.endTime) - new Date(result.startTime)}ms`);

    if (langSmithConfig.enabled) {
      console.log(`\n💡 View detailed traces in LangSmith:`);
      console.log(`   https://smith.langchain.com/o/projects/p/${langSmithConfig.projectName}`);
    }

    console.log('='.repeat(60) + '\n');

    // Flush LangSmith traces before exiting
    if (langsmithClient) {
      console.log('⏳ Flushing traces to LangSmith...');
      await langsmithClient.awaitPendingTraceBatches();
      console.log('✅ Traces flushed successfully');
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Error during component generation:');
    console.error('='.repeat(60));
    console.error(error);
    console.error('='.repeat(60) + '\n');

    // Flush LangSmith traces before exiting
    if (langsmithClient) {
      console.log('⏳ Flushing traces to LangSmith...');
      await langsmithClient.awaitPendingTraceBatches();
      console.log('✅ Traces flushed successfully');
    }

    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
