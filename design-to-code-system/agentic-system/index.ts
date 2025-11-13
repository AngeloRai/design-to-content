#!/usr/bin/env node
/**
 * Agentic System - LangGraph Entry Point
 * Orchestrates Figma-to-React component generation using LangGraph workflow
 */

import { EventEmitter } from 'events';
import { Client } from 'langsmith';
import { buildWorkflow } from './workflow/graph.ts';
import { configureLangSmith } from './config/langsmith-config.ts';
import { env } from "./config/env.config.ts";

// Increase max listeners to prevent warnings during concurrent API calls
// This is safe because we're making many concurrent LangChain/OpenAI API calls
// and each creates abort listeners that are properly cleaned up
EventEmitter.defaultMaxListeners = 30;

// Configure LangSmith tracing
const langSmithConfig = configureLangSmith();

// Initialize LangSmith client for trace management
const langsmithClient = langSmithConfig.enabled ? new Client() : null;

interface WorkflowResult {
  componentsIdentified?: number;
  generatedComponents?: number | unknown[];
  iterations?: number;
  success?: boolean;
  startTime: string;
  endTime?: string;
  [key: string]: unknown;
}

/**
 * Main workflow using LangGraph
 */
const main = async (): Promise<void> => {
  const args = process.argv.slice(2);

  // Parse command-line arguments
  const threadIdArg = args.find(arg => arg.startsWith('--thread-id='));
  const resumeArg = args.find(arg => arg.startsWith('--resume='));

  // Get Figma URL from args or environment (skip flag arguments)
  const figmaUrl = args.find(arg => !arg.startsWith('--')) || env.figma.url;
  const outputDir = args.find((arg, i) => i > 0 && !arg.startsWith('--')) || env.output.dir;

  // Generate or extract thread ID for checkpointing
  // Thread ID format: run-<timestamp>-<url-hash>
  let threadId: string;
  if (threadIdArg) {
    threadId = threadIdArg.split('=')[1];
  } else if (resumeArg) {
    threadId = resumeArg.split('=')[1];
  } else if (figmaUrl) {
    // Auto-generate thread ID from timestamp + Figma URL hash
    const urlHash = Buffer.from(figmaUrl).toString('base64').slice(0, 8);
    threadId = `run-${Date.now()}-${urlHash}`;
  } else {
    threadId = `run-${Date.now()}`;
  }

  // Check if we have either a single URL or atomic level URLs
  const hasAtomicUrls = env.figma.atomicLevels.atoms ||
                        env.figma.atomicLevels.molecules ||
                        env.figma.atomicLevels.organisms;

  if (!figmaUrl && !hasAtomicUrls) {
    console.log(`
❌ Error: No Figma URLs configured

You must provide either:
  1. Atomic level URLs in .env (RECOMMENDED for multi-node workflow):
     FIGMA_ATOMS=https://figma.com/design/...?node-id=29-1115
     FIGMA_MOLECULES=https://figma.com/design/...?node-id=29-2220  (optional)
     FIGMA_ORGANISMS=https://figma.com/design/...?node-id=29-3330  (optional)

  2. Single URL via command line or .env:
     node index.js "https://figma.com/file/abc123/design?node-id=1:2"
     OR
     FIGMA_URL="https://figma.com/file/abc123/design?node-id=1:2" node index.js

Examples:
  # Multi-node workflow (processes atoms, molecules, organisms sequentially)
  FIGMA_ATOMS="..." FIGMA_MOLECULES="..." node index.js

  # Single node workflow
  node index.js "https://figma.com/file/abc123/design?node-id=1:2" [output-dir]

  # Resume interrupted workflow
  node index.js --resume=run-1234567890-abcdef12

  # Use specific thread ID (for debugging/testing)
  node index.js "https://figma.com/..." --thread-id=my-custom-id

Arguments:
  figma-url    Figma file URL with node-id parameter (optional if atomic URLs set)
  output-dir   Output directory for generated components (default: ${env.output.dir})

Options:
  --thread-id=<id>   Use specific thread ID for checkpointing
  --resume=<id>      Resume a previous workflow from checkpoint
`);
    process.exit(1);
  }

  console.log('🚀 Agentic Component Generator (LangGraph)');
  console.log('='.repeat(60));

  if (hasAtomicUrls) {
    console.log('Mode: Multi-Node Workflow (Atomic Design Pattern)');
    if (env.figma.atomicLevels.atoms) console.log(`  ✓ Atoms URL configured`);
    if (env.figma.atomicLevels.molecules) console.log(`  ✓ Molecules URL configured`);
    if (env.figma.atomicLevels.organisms) console.log(`  ✓ Organisms URL configured`);
  } else {
    console.log(`Mode: Single Node Workflow`);
    console.log(`Figma URL: ${figmaUrl}`);
  }
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

    // Invoke workflow with checkpointing support - starts with analyzeNode
    // Thread ID enables workflow resumption after interruptions
    const result = await workflow.invoke(initialState, {
      configurable: { thread_id: threadId }
    }) as WorkflowResult;

    // Report final results
    console.log('\n📊 Final Results');
    console.log('='.repeat(60));
    console.log(`Components Identified: ${result.componentsIdentified}`);
    console.log(`Components Generated: ${result.generatedComponents}`);
    console.log(`Total Iterations: ${result.iterations}`);
    console.log(`Status: ${result.success ? '✅ Success' : '⚠️  Completed with errors'}`);
    if (result.endTime) {
      const duration = new Date(result.endTime).getTime() - new Date(result.startTime).getTime();
      console.log(`Duration: ${duration}ms`);
    }

    if (langSmithConfig.enabled) {
      console.log(`\n💡 View detailed traces in LangSmith:`);
      console.log(`   https://smith.langchain.com/o/projects/p/${langSmithConfig.projectName}`);
    }

    // Display thread ID for resumption capability
    console.log(`\n💾 Checkpoint Thread ID: ${threadId}`);
    console.log(`   Resume this workflow: node index.js --resume=${threadId}`);
    console.log(`   (Workflow state is preserved in memory for this session)`);

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
