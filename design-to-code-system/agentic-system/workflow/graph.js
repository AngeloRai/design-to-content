/**
 * LangGraph Workflow
 * Defines the component generation workflow using StateGraph
 */

import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { analyzeNode } from './nodes/analyze.js';
import { setupNode } from './nodes/setup.js';
import { generateNode } from './nodes/generate.js';
import { generateStoriesNode } from './nodes/generate-stories.js';
import { finalizeNode } from './nodes/finalize.js';
import { createValidationSubgraph } from './nodes/validate.js';
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
const WorkflowState = Annotation.Root({
  // Input fields - set once at workflow start, never updated during execution
  // Defaults read from env vars, can be overridden by passing explicit values
  figmaUrl: Annotation({
    description: 'Figma file/page URL to analyze',
    // default: () => process.env.FIGMA_URL || null
  }),
  outputDir: Annotation({
    default: () => process.env.OUTPUT_DIR || '../atomic-design-pattern/ui'
  }),

  // Phase 1: Figma Analysis
  figmaAnalysis: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  }),
  componentsIdentified: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => 0
  }),

  // Phase 2: Setup
  referenceComponents: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => []
  }),
  vectorSearch: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  }),
  registry: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  }),

  // Phase 3: Generation
  conversationHistory: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => []
  }),
  generatedComponents: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => 0
  }),
  iterations: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => 0
  }),
  failedComponents: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => ({})
  }),

  // Phase 3.5: Story Generation (for visual validation)
  storiesGenerated: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => false
  }),
  storyResults: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  }),

  // Phase 4: Validation & Quality Review (always runs)
  validationResults: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => ({})
  }),

  // Workflow status
  currentPhase: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => 'init'
  }),
  success: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => false
  }),
  errors: Annotation({
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

  // Metadata
  startTime: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  }),
  endTime: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  })
});

/**
 * Conditional edge function to determine if workflow should continue after analyze
 * If analyze fails, skip directly to finalize
 */
function shouldContinueAfterAnalyze(state) {
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
  const workflow = new StateGraph(WorkflowState);

  // Create validation subgraph
  const validationSubgraph = createValidationSubgraph();

  // Add nodes
  workflow.addNode('analyze', analyzeNode);
  workflow.addNode('setup', setupNode);
  workflow.addNode('generate', generateNode);
  workflow.addNode('generate_stories', generateStoriesNode);
  workflow.addNode('validate', validationSubgraph);
  workflow.addNode('finalize', finalizeNode);

  // Define edges (workflow flow)
  workflow.setEntryPoint('analyze');

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
 * Compile and return the workflow
 * In v1.0, Studio reads input schema from State Annotations
 */
export function buildWorkflow() {
  const graph = createWorkflowGraph();
  return graph.compile();
}

/**
 * Export compiled graph for Studio
 * Studio v1.0 automatically detects State fields as inputs
 */
export const graph = buildWorkflow();
