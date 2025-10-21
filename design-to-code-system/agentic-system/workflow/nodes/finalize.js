/**
 * Finalize Node
 * Generates final report and summary
 * Minimal console logging - detailed traces available in LangSmith
 */

import { buildRegistry } from '../../tools/registry.js';

export async function finalizeNode(state) {
  console.log('\n📊 Phase: Finalize');
  console.log('='.repeat(60));

  try {
    const { outputDir, iterations, errors } = state;

    // Count actual generated components
    const finalRegistry = await buildRegistry(outputDir);
    const success = errors.length === 0;

    // Count total components across all types (elements, components, modules, icons)
    const totalComponents = Object.values(finalRegistry.components).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    console.log(`✅ Components Generated: ${totalComponents}`);
    console.log(`   Iterations: ${iterations}`);

    if (errors.length > 0) {
      console.log(`   ⚠️  Errors: ${errors.length}`);
      errors.forEach((err) => {
        console.log(`      - [${err.phase}] ${err.error}`);
      });
    }

    console.log('='.repeat(60));
    console.log(`${success ? '✅' : '⚠️'}  Workflow ${success ? 'completed successfully' : 'completed with errors'}`);
    console.log('   💡 View detailed traces in LangSmith\n');

    return {
      ...state,
      generatedComponents: totalComponents,
      success,
      endTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Finalize failed:', error.message);
    return {
      ...state,
      errors: [...state.errors, { phase: 'finalize', error: error.message }],
      success: false,
      endTime: new Date().toISOString()
    };
  }
}
