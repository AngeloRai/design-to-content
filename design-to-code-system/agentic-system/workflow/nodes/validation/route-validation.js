/**
 * Route Validation
 * Conditional function to determine validation flow
 * Routes back to typescript_fix if issues found, or proceeds to finalize
 */

const MAX_VALIDATION_ATTEMPTS = 3;

export function routeValidation(state) {
  const { finalCheckPassed, finalCheckAttempts = 0, failedComponents } = state;

  // If validation passed, exit subgraph (parent graph will route to finalize)
  if (finalCheckPassed) {
    console.log('   → Validation passed, exiting subgraph');
    return 'exit';
  }

  // If max attempts reached, exit subgraph anyway (parent graph will route to finalize)
  if (finalCheckAttempts >= MAX_VALIDATION_ATTEMPTS) {
    console.log(`   ⚠️  Max validation attempts (${MAX_VALIDATION_ATTEMPTS}) reached`);
    console.log(`   → Exiting subgraph with ${Object.keys(failedComponents || {}).length} unresolved issue(s)`);
    return 'exit';
  }

  // Loop back to typescript_fix to resolve issues
  console.log(`   → Looping back to typescript_fix (attempt ${finalCheckAttempts + 1}/${MAX_VALIDATION_ATTEMPTS})`);
  return 'typescript_fix';
}
