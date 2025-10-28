/**
 * Validation Node (Subgraph)
 * Multi-pass validation with feedback loop:
 * 1. TypeScript fixes (blocking)
 * 2. Quality review (advisory)
 * 3. Final check (comprehensive)
 * 4. Route back or proceed
 */

import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { typescriptFixNode } from './validation/typescript-fix.js';
import { qualityReviewNode } from './validation/quality-review.js';
import { finalCheckNode } from './validation/final-check.js';
import { routeValidation } from './validation/route-validation.js';

/**
 * Validation-specific state
 * Simplified state management for validation subgraph
 */
const ValidationState = Annotation.Root({
  // Core inputs from parent
  outputDir: Annotation({
    reducer: (existing, update) => update ?? existing
  }),
  registry: Annotation({
    reducer: (existing, update) => update ?? existing
  }),
  generatedComponents: Annotation({
    reducer: (existing, update) => update ?? existing
  }),

  // Components tracking (shared with parent)
  failedComponents: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => ({})
  }),

  // Validation progress
  validationResults: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => ({})
  }),
  finalCheckPassed: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => false
  }),
  finalCheckAttempts: Annotation({
    reducer: (existing, update) => update ?? existing,
    default: () => 0
  }),

  // Track validated components for reference
  validatedComponents: Annotation({
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
  const validationGraph = new StateGraph(ValidationState);

  // Add validation nodes
  validationGraph.addNode('typescript_fix', typescriptFixNode);
  validationGraph.addNode('quality_review', qualityReviewNode);
  validationGraph.addNode('final_check', finalCheckNode);

  // Define flow
  validationGraph.setEntryPoint('typescript_fix');
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
