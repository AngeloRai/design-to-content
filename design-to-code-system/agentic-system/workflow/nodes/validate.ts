/**
 * Validation Node (Subgraph)
 * Multi-pass validation with feedback loop:
 * 1. TypeScript fixes (blocking)
 * 2. Quality review (advisory)
 * 3. Final check (comprehensive)
 * 4. Route back or proceed
 */

import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { typescriptFixNode } from './validation/typescript-fix.ts';
import { qualityReviewNode } from './validation/quality-review.ts';
import { finalCheckNode } from './validation/final-check.ts';
import { routeValidation } from './validation/route-validation.ts';
import type { ComponentMetadata, ComponentRegistry } from '../../types/component.js';
import type { ComponentFailureDetails } from '../../types/workflow.js';

/**
 * Validation-specific state
 * Simplified state management for validation subgraph
 */
const ValidationState = Annotation.Root({
  // Core inputs from parent
  outputDir: Annotation<string>({
    reducer: (existing, update) => update ?? existing
  }),
  registry: Annotation<ComponentRegistry | null>({
    reducer: (existing, update) => update ?? existing
  }),
  generatedComponents: Annotation<ComponentMetadata[] | number>({
    reducer: (existing, update) => update ?? existing
  }),

  // Components tracking (shared with parent)
  failedComponents: Annotation<Record<string, ComponentFailureDetails>>({
    reducer: (existing, update) => update ?? existing,
    default: () => ({})
  }),

  // Validation progress
  validationResults: Annotation<Record<string, unknown>>({
    reducer: (existing, update) => update ?? existing,
    default: () => ({})
  }),
  finalCheckPassed: Annotation<boolean>({
    reducer: (existing, update) => update ?? existing,
    default: () => false
  }),
  finalCheckAttempts: Annotation<number>({
    reducer: (existing, update) => update ?? existing,
    default: () => 0
  }),

  // Track validated components for reference
  validatedComponents: Annotation<string[]>({
    reducer: (existing, update) => {
      if (Array.isArray(update) && Array.isArray(existing)) {
        return [...new Set([...existing, ...update])];
      }
      return update ?? existing;
    },
    default: () => []
  })
});

/**
 * Create validation subgraph
 */
export function createValidationSubgraph() {
  // Build graph by chaining addNode calls to properly track node types
  const validationGraph = new StateGraph(ValidationState)
    .addNode('typescript_fix', typescriptFixNode)
    .addNode('quality_review', qualityReviewNode)
    .addNode('final_check', finalCheckNode);

  // Define flow
  validationGraph.addEdge('__start__', 'typescript_fix');
  validationGraph.addEdge('typescript_fix', 'quality_review');
  validationGraph.addEdge('quality_review', 'final_check');

  // Conditional edge - loop back to typescript_fix or exit subgraph
  validationGraph.addConditionalEdges(
    'final_check',
    routeValidation,
    {
      'typescript_fix': 'typescript_fix',
      'exit': END  // Exit subgraph, control returns to parent graph
    }
  );

  return validationGraph.compile();
}
