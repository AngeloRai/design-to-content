/**
 * Route Validation
 * Conditional function to determine validation flow
 * Routes back to typescript_fix if issues found, or proceeds to finalize
 */

import type { RouteDecision } from '../../../types/workflow.js';

const MAX_VALIDATION_ATTEMPTS = 3;

// Accept a minimal state shape that LangGraph provides
export function routeValidation(state: {
  finalCheckPassed?: boolean;
  finalCheckAttempts?: number;
  failedComponents?: Record<string, unknown>;
}): RouteDecision {
  const { finalCheckPassed, finalCheckAttempts = 0, failedComponents } = state;

  console.log('\n🔀 ROUTE VALIDATION DECISION:');
  console.log(`   finalCheckPassed: ${finalCheckPassed}`);
  console.log(`   finalCheckAttempts: ${finalCheckAttempts}`);
  console.log(`   failedComponents count: ${Object.keys(failedComponents || {}).length}`);

  // If validation passed, exit subgraph (parent graph will route to finalize)
  if (finalCheckPassed) {
    console.log('   ✅ Decision: EXIT - Validation passed, routing to finalize');
    return 'exit';
  }

  // If max attempts reached, exit subgraph anyway (parent graph will route to finalize)
  if (finalCheckAttempts >= MAX_VALIDATION_ATTEMPTS) {
    console.log(`   ⚠️  Max validation attempts (${MAX_VALIDATION_ATTEMPTS}) reached`);
    console.log(`   ✅ Decision: EXIT - Max attempts reached, routing to finalize with ${Object.keys(failedComponents || {}).length} unresolved issue(s)`);
    return 'exit';
  }

  // Loop back to typescript_fix to resolve issues
  console.log(`   🔄 Decision: LOOP BACK - Attempting typescript_fix (attempt ${finalCheckAttempts + 1}/${MAX_VALIDATION_ATTEMPTS})`);
  return 'typescript_fix';
}
