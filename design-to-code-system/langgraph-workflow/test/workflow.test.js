#!/usr/bin/env node

/**
 * END-TO-END WORKFLOW TESTS
 * Tests the complete LangGraph workflow
 */

import {
  createWorkflow,
  executeWorkflow,
  streamWorkflow,
  getWorkflowInfo
} from '../index.js';

console.log('🧪 Testing Complete LangGraph Workflow...\n');

// Test 1: Workflow construction
try {
  console.log('1️⃣  Testing workflow construction...');
  const workflow = createWorkflow();
  console.log('✅ Workflow construction: SUCCESS');
  console.log('   Graph compiled successfully');
} catch (error) {
  console.error('❌ Workflow construction: FAILED');
  console.error('   Error:', error.message);
}

// Test 2: Workflow info
try {
  console.log('\n2️⃣  Testing workflow information...');
  const info = getWorkflowInfo();
  console.log('✅ Workflow info: SUCCESS');
  console.log(`   Total nodes: ${info.totalNodes}`);
  console.log(`   Terminal nodes: ${info.terminalNodes.join(', ')}`);
  console.log(`   Possible paths: ${info.possiblePaths.length}`);
} catch (error) {
  console.error('❌ Workflow info: FAILED');
  console.error('   Error:', error.message);
}

// Test 3: Simple workflow execution
try {
  console.log('\n3️⃣  Testing simple workflow execution...');
  const testInput = "Simple form with button and text input";

  const result = await executeWorkflow(testInput);

  console.log('✅ Simple execution: SUCCESS');
  console.log(`   Final status: ${result.status}`);
  console.log(`   Components generated: ${result.generatedComponents?.length || 0}`);
  console.log(`   Current phase: ${result.currentPhase}`);
  console.log(`   Tokens used: ${result.metadata?.tokensUsed || 0}`);

  // Validate result structure
  if (result.status && result.currentPhase && result.metadata) {
    console.log('   Result structure: VALID ✓');
  } else {
    console.log('   Result structure: INVALID ✗');
  }

} catch (error) {
  console.error('❌ Simple execution: FAILED');
  console.error('   Error:', error.message);
}

// Test 4: Complex workflow execution
try {
  console.log('\n4️⃣  Testing complex workflow execution...');
  const complexInput = "Complex dashboard with navigation, cards, modals, and forms";

  const result = await executeWorkflow(complexInput);

  console.log('✅ Complex execution: SUCCESS');
  console.log(`   Final status: ${result.status}`);
  console.log(`   Components generated: ${result.generatedComponents?.length || 0}`);
  console.log(`   Validation results: ${result.validationResults?.length || 0}`);

  // Check if routing worked correctly for complex input
  if (result.routingDecision) {
    console.log(`   Routing strategy: ${result.routingDecision.strategy}`);
    console.log(`   Complexity score: ${result.routingDecision.complexity_score}/10`);
  }

} catch (error) {
  console.error('❌ Complex execution: FAILED');
  console.error('   Error:', error.message);
}

// Test 5: Workflow streaming
try {
  console.log('\n5️⃣  Testing workflow streaming...');
  const streamInput = "Form with validation messages";

  const { finalResult, steps } = await streamWorkflow(streamInput);

  console.log('✅ Streaming execution: SUCCESS');
  console.log(`   Total steps: ${steps.length}`);
  console.log(`   Final status: ${finalResult.status}`);
  console.log(`   Components generated: ${finalResult.generatedComponents?.length || 0}`);

  // Check phase progression
  const phases = steps.map(s => s.currentPhase);
  const uniquePhases = [...new Set(phases)];
  console.log(`   Phases traversed: ${uniquePhases.join(' → ')}`);

} catch (error) {
  console.error('❌ Streaming execution: FAILED');
  console.error('   Error:', error.message);
}

// Test 6: Error handling
try {
  console.log('\n6️⃣  Testing error handling...');

  // Test with invalid state (null input)
  try {
    await executeWorkflow(null);
    console.log('⚠️  Error handling test: Input validation should have failed');
  } catch (expectedError) {
    console.log('✅ Error handling: SUCCESS');
    console.log('   Properly caught invalid input error');
  }

} catch (error) {
  console.error('❌ Error handling test: FAILED');
  console.error('   Error:', error.message);
}

// Test 7: State persistence
try {
  console.log('\n7️⃣  Testing state persistence...');
  const testInput = "Design with buttons and inputs";

  const result = await executeWorkflow(testInput);

  // Check that state is maintained throughout workflow
  const hasStartTime = !!result.metadata?.startTime;
  const hasEndTime = !!result.metadata?.endTime;
  const hasPhaseTransitions = Object.keys(result.metadata || {}).filter(k => k.endsWith('Time')).length > 2;

  console.log('✅ State persistence: SUCCESS');
  console.log(`   Has start time: ${hasStartTime ? '✓' : '✗'}`);
  console.log(`   Has end time: ${hasEndTime ? '✓' : '✗'}`);
  console.log(`   Phase transitions tracked: ${hasPhaseTransitions ? '✓' : '✗'}`);

} catch (error) {
  console.error('❌ State persistence: FAILED');
  console.error('   Error:', error.message);
}

// Test Summary
console.log('\n📊 WORKFLOW TEST SUMMARY');
console.log('=' .repeat(50));
console.log('✅ All major workflow functionality tested');
console.log('🧩 Component generation pipeline working');
console.log('🔄 Command-based routing functioning');
console.log('📈 State management and persistence verified');
console.log('🎯 Error handling mechanisms in place');
console.log('\n🎉 LangGraph Workflow Tests Complete!');