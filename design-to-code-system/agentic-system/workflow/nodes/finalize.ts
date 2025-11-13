/**
 * Finalize Node
 * Generates final report and summary
 * Minimal console logging - detailed traces available in LangSmith
 */

import type { WorkflowState, NodeResult } from '../../types/workflow.js';

export async function finalizeNode(state: WorkflowState): Promise<NodeResult> {
  console.log('\n' + '🎯'.repeat(30));
  console.log('🎯🎯🎯 FINALIZE NODE REACHED 🎯🎯🎯');
  console.log('🎯'.repeat(30));
  console.log('\n📊 Phase: Finalize');
  console.log('='.repeat(60));

  try {
    const { generatedComponents = [], mcpBridge } = state;

    // Close MCP bridge if it's still open
    if (mcpBridge && typeof (mcpBridge as any).close === 'function') {
      console.log('🔌 Closing MCP bridge connection...');
      try {
        await (mcpBridge as any).close();
        console.log('✅ MCP bridge closed successfully\n');
      } catch (closeError) {
        const errorMessage = closeError instanceof Error ? closeError.message : String(closeError);
        console.error('⚠️  Failed to close MCP bridge:', errorMessage);
      }
    }

    const componentCount = Array.isArray(generatedComponents) ? generatedComponents.length : 0;
    const success = true;

    console.log(`✅ Components Generated: ${componentCount}`);
    console.log('='.repeat(60));
    console.log(`✅ Workflow completed successfully`);
    console.log('   💡 View detailed traces in LangSmith\n');

    return {
      ...state,
      workflowCompleted: true,
      completionTimestamp: new Date().toISOString(),
      totalComponentsGenerated: componentCount
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Finalize failed:', errorMessage);
    return {
      ...state,
      workflowCompleted: true,
      completionTimestamp: new Date().toISOString()
    };
  }
}
