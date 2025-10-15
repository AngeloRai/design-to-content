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
 */
const WorkflowState = Annotation.Root({
  // Input
  figmaUrl: Annotation(),
  outputDir: Annotation(),

  // Phase 1: Figma Analysis
  figmaAnalysis: Annotation(),
  componentsIdentified: Annotation(),

  // Phase 2: Setup
  referenceComponents: Annotation(),
  vectorSearch: Annotation(),
  registry: Annotation(),

  // Phase 3: Generation
  conversationHistory: Annotation(),
  generatedComponents: Annotation(),
  iterations: Annotation(),

  // Workflow status
  currentPhase: Annotation(),
  success: Annotation(),
  errors: Annotation(),

  // Metadata
  startTime: Annotation(),
  endTime: Annotation()
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
