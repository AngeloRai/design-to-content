#!/usr/bin/env node
/**
 * Agentic System - LangGraph Entry Point
 * Orchestrates Figma-to-React component generation using LangGraph workflow
 */

import { EventEmitter } from 'events';
import { Client } from 'langsmith';
import { buildWorkflow } from './workflow/graph.js';
import { configureLangSmith } from './config/langsmith-config.js';
import { env } from './config/env.config.js';

// Increase max listeners to prevent warnings during concurrent API calls
// This is safe because we're making many concurrent LangChain/OpenAI API calls
// and each creates abort listeners that are properly cleaned up
EventEmitter.defaultMaxListeners = 30;

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
  const figmaUrl = args[0] || env.figma.url;
  const outputDir = args[1] || env.output.dir;

  if (!figmaUrl) {
    console.log(`
❌ Error: Figma URL is required

Usage: node index-langgraph.js <figma-url> [output-dir]

Or set FIGMA_URL environment variable:
  FIGMA_URL="https://figma.com/file/abc123/design?node-id=1:2" node index-langgraph.js

Examples:
  node index-langgraph.js "https://figma.com/file/abc123/design?node-id=1:2"
  node index-langgraph.js "https://figma.com/file/abc123/design?node-id=1:2" "../atomic-design-pattern/ui"

Options:
  figma-url    Figma file URL with node-id parameter
  output-dir   Output directory for generated components (default: ../atomic-design-pattern/ui)
`);
    process.exit(1);
  }

  console.log('🚀 Agentic Component Generator (LangGraph)');
  console.log('='.repeat(60));
  console.log(`Figma URL: ${figmaUrl}`);
  console.log(`Output Dir: ${outputDir}`);
  console.log('='.repeat(60) + '\n');

  try {
    // Build and run LangGraph workflow
    // The workflow now handles Figma analysis as the first node
    const workflow = buildWorkflow();

    const initialState = {
      figmaUrl,
      outputDir,
      startTime: new Date().toISOString()
    };

    // Invoke workflow - starts with analyzeNode
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

      // Wait a moment for the trace to be finalized by LangGraph
      // This ensures the root span is properly closed before flushing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Now await all pending trace batches
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

      // Wait a moment for the trace to be finalized
      await new Promise(resolve => setTimeout(resolve, 1000));

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
