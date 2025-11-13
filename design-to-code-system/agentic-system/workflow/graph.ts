/**
 * LangGraph Workflow
 * Defines the component generation workflow using StateGraph
 */

import { StateGraph, END, Annotation, MemorySaver } from '@langchain/langgraph';
import { analyzeNode } from './nodes/analyze.ts';
import { setupNode } from './nodes/setup.ts';
import { generateNode } from './nodes/generate.ts';
import { generateStoriesNode } from './nodes/generate-stories.ts';
import { finalizeNode } from './nodes/finalize.ts';
import { createValidationSubgraph } from './nodes/validate.ts';
import type { WorkflowState } from '../types/workflow.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

/**
 * Define WORKFLOW state schema
 * Studio v1.0 will auto-detect fields without defaults as required inputs
 *
 * CRITICAL: Use reducer functions to merge state properly between nodes
 * Without reducers, each node completely replaces fields instead of merging
*/
const WorkflowStateAnnotation = Annotation.Root({
  // Input fields - set once at workflow start, never updated during execution
  // Defaults read from env vars, can be overridden by passing explicit values
  figmaUrl: Annotation<string>,
  outputDir: Annotation<string>({
    reducer: (existing, update) => update ?? existing,
    default: () => process.env.OUTPUT_DIR || 'atomic-design-pattern/ui'
  }),

  // Phase 1: Figma Analysis
  figmaAnalysis: Annotation<WorkflowState['figmaAnalysis']>({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  }),
  componentsIdentified: Annotation<number>({
    reducer: (existing, update) => update ?? existing,
    default: () => 0
  }),
  mcpBridge: Annotation<unknown>({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  }),
  globalCssPath: Annotation<string | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  }),

  // Phase 2: Setup
  referenceComponents: Annotation<unknown[]>({
    reducer: (existing, update) => update ?? existing,
    default: () => []
  }),
  vectorSearch: Annotation<unknown>({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  }),
  registry: Annotation<WorkflowState['registry']>({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  }),

  // Phase 3: Generation
  conversationHistory: Annotation<unknown[]>({
    reducer: (existing, update) => update ?? existing,
    default: () => []
  }),
  generatedComponents: Annotation<number>({
    reducer: (existing, update) => update ?? existing,
    default: () => 0
  }),
  iterations: Annotation<number>({
    reducer: (existing, update) => update ?? existing,
    default: () => 0
  }),
  failedComponents: Annotation<Record<string, unknown>>({
    reducer: (existing, update) => update ?? existing,
    default: () => ({})
  }),

  // Phase 3.5: Story Generation (for visual validation)
  storiesGenerated: Annotation<boolean>({
    reducer: (existing, update) => update ?? existing,
    default: () => false
  }),
  storyResults: Annotation<unknown>({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  }),

  // Phase 4: Validation & Quality Review (always runs)
  validationResults: Annotation<Record<string, unknown>>({
    reducer: (existing, update) => update ?? existing,
    default: () => ({})
  }),

  // Workflow status
  currentPhase: Annotation<string>({
    reducer: (existing, update) => update ?? existing,
    default: () => 'init'
  }),
  success: Annotation<boolean>({
    reducer: (existing, update) => update ?? existing,
    default: () => false
  }),
  errors: Annotation<Array<{ phase: string; error: string }>>({
    reducer: (existing, update) => {
      // Merge arrays
      if (Array.isArray(update) && Array.isArray(existing)) {
        // filter to show only unique errors
        const uniqueErrors = update.filter(
          (err) => !existing.some((e) => e.phase === err.phase && e.error === err.error)
        );
        return [...existing, ...uniqueErrors];
      }
      return update ?? existing;
    },
    default: () => []
  }),

  // Validation state fields (used by validation subgraph)
  finalCheckPassed: Annotation<boolean>({
    reducer: (existing, update) => update ?? existing,
    default: () => false
  }),
  finalCheckAttempts: Annotation<number>({
    reducer: (existing, update) => update ?? existing,
    default: () => 0
  }),
  validatedComponents: Annotation<string[]>({
    reducer: (existing, update) => {
      if (Array.isArray(update) && Array.isArray(existing)) {
        return [...new Set([...existing, ...update])];
      }
      return update ?? existing;
    },
    default: () => []
  }),

  // Metadata
  startTime: Annotation<string | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  }),
  endTime: Annotation<string | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  })
});

/**
 * Conditional edge function to determine if workflow should continue after analyze
 * If analyze fails, skip directly to finalize
 */
function shouldContinueAfterAnalyze(state: { figmaAnalysis?: unknown; currentPhase?: string }): 'setup' | 'finalize' {
  // Check if analyze was successful by verifying figmaAnalysis exists
  if (!state.figmaAnalysis || state.currentPhase === 'finalize') {
    return 'finalize';
  }
  return 'setup';
}

/**
 * Build the component generation workflow graph
 */
export function createWorkflowGraph() {
  // Create state graph with WorkflowState
  // Studio v1.0 will detect fields without defaults as inputs
  // Use chained addNode calls to properly track node types
  const validationSubgraph = createValidationSubgraph();

  const workflow = new StateGraph(WorkflowStateAnnotation)
    .addNode('analyze', analyzeNode)
    .addNode('setup', setupNode)
    .addNode('generate', generateNode)
    .addNode('generate_stories', generateStoriesNode)
    .addNode('validate', validationSubgraph as any)
    .addNode('finalize', finalizeNode);

  // Define edges (workflow flow)
  workflow.addEdge('__start__', 'analyze');

  // Conditional edge after analyze - skip to finalize on failure
  workflow.addConditionalEdges(
    'analyze',
    shouldContinueAfterAnalyze,
    {
      'setup': 'setup',
      'finalize': 'finalize'
    }
  );

  workflow.addEdge('setup', 'generate');
  workflow.addEdge('generate', 'generate_stories');  // Generate stories after components
  workflow.addEdge('generate_stories', 'validate');  // Then validate
  workflow.addEdge('validate', 'finalize');
  workflow.addEdge('finalize', END);

  return workflow;
}

/**
 * Compile and return the workflow with checkpointing support
 * In v1.0, Studio reads input schema from State Annotations
 *
 * Checkpointing enables:
 * - Resume workflows after interruptions/failures
 * - Inspect intermediate state for debugging
 * - Pause workflows for human review
 * - Replay from specific nodes during development
 */
export function buildWorkflow() {
  const graph = createWorkflowGraph();
  const checkpointer = new MemorySaver();
  return graph.compile({ checkpointer });
}

/**
 * Export compiled graph for Studio
 * Studio v1.0 automatically detects State fields as inputs
 */
export const graph = buildWorkflow();
