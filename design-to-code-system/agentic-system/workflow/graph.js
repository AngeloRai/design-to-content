/**
 * LangGraph Workflow
 * Defines the component generation workflow using StateGraph
 */

import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { setupNode } from './nodes/setup.js';
import { generateNode } from './nodes/generate.js';
import { finalizeNode } from './nodes/finalize.js';

/**
 * Define state schema using Annotation
 * This replaces the previous ComponentGenerationState object
 *
 * CRITICAL: Use reducer functions to merge state properly between nodes
 * Without reducers, each node completely replaces fields instead of merging
 */
const WorkflowState = Annotation.Root({
  // Input
  figmaUrl: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  }),
  outputDir: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => null
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
        return [...existing, ...update];
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
 * Build the component generation workflow graph
 */
export function createWorkflowGraph() {
  // Create state graph with Annotation-based state
  const workflow = new StateGraph(WorkflowState);

  // Add nodes
  workflow.addNode('setup', setupNode);
  workflow.addNode('generate', generateNode);
  workflow.addNode('finalize', finalizeNode);

  // Define edges (workflow flow)
  workflow.setEntryPoint('setup');
  workflow.addEdge('setup', 'generate');
  workflow.addEdge('generate', 'finalize');
  workflow.addEdge('finalize', END);

  return workflow;
}

/**
 * Compile and return the workflow
 */
export function buildWorkflow() {
  const graph = createWorkflowGraph();
  return graph.compile();
}
