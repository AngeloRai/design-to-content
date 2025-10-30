/**
 * Finalize Node
 * Generates final report and summary
 * Minimal console logging - detailed traces available in LangSmith
 */

export async function finalizeNode(state) {
  console.log('\n' + '🎯'.repeat(30));
  console.log('🎯🎯🎯 FINALIZE NODE REACHED 🎯🎯🎯');
  console.log('🎯'.repeat(30));
  console.log('\n📊 Phase: Finalize');
  console.log('='.repeat(60));

  try {
    const { generatedComponents = 0, iterations = 0, errors = [] } = state;
    const success = errors.length === 0;

    console.log(`✅ Components Generated: ${generatedComponents}`);
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
