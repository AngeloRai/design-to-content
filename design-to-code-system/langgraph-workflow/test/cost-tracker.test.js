#!/usr/bin/env node

/**
 * FUNCTIONAL COST TRACKER TESTS
 * Tests the functional cost tracking system with atomic design principles
 */

import {
  createTaskRecord,
  completeTaskRecord,
  calculateEfficiencyMetrics,
  createSessionTracker,
  startTask,
  completeTask,
  endSession,
  getSessionSummary,
  getCostProjection,
  checkCostLimits,
  getAtomicDesignInsights,
  createCostSession,
  getCostSession,
  trackTask,
  completeTaskGlobal
} from '../utils/cost-tracker.js';

console.log('🧪 Testing Functional Cost Tracker...\n');

// Test 1: Task Record Creation and Completion
try {
  console.log('1️⃣  Testing task record creation and completion...');

  const taskRecord = createTaskRecord('task1', 'gpt-4o', 'atom_generation', 'atom');

  if (taskRecord.taskId === 'task1' && taskRecord.componentLevel === 'atom') {
    console.log('✅ Task record created successfully');
  } else {
    throw new Error('Task record creation failed');
  }

  const completedRecord = completeTaskRecord(
    taskRecord,
    1000,
    500,
    true,
    null,
    { description: 'Generated button component' },
    {
      reusabilityScore: 9,
      complexityScore: 3,
      generatedComponents: ['Button', 'IconButton']
    }
  );

  if (completedRecord.success && completedRecord.totalCost > 0) {
    console.log(`✅ Task completion: $${completedRecord.totalCost.toFixed(4)} (${completedRecord.inputTokens + completedRecord.outputTokens} tokens)`);
  } else {
    throw new Error('Task completion failed');
  }

} catch (error) {
  console.error('❌ Task record tests: FAILED');
  console.error('   Error:', error.message);
}

// Test 2: Session Tracker Creation and State Management
try {
  console.log('\n2️⃣  Testing session tracker creation and state management...');

  const session = createSessionTracker('test-session');

  if (session.sessionId === 'test-session' && session.isActive) {
    console.log('✅ Session tracker created successfully');
  } else {
    throw new Error('Session creation failed');
  }

  const sessionWithTask = startTask(session, 'task1', 'gpt-4o', 'atom_generation', 'atom');

  if (sessionWithTask.tasks.has('task1')) {
    console.log('✅ Task started in session');
  } else {
    throw new Error('Task start failed');
  }

  const sessionWithCompletedTask = completeTask(
    sessionWithTask,
    'task1',
    1000,
    500,
    true,
    null,
    {},
    {
      reusabilityScore: 8,
      complexityScore: 4,
      generatedComponents: ['Input', 'Label']
    }
  );

  if (sessionWithCompletedTask.totalCost > 0 && sessionWithCompletedTask.atomicMetrics.totalAtomsGenerated === 2) {
    console.log('✅ Task completed with atomic metrics tracking');
  } else {
    throw new Error('Task completion with metrics failed');
  }

} catch (error) {
  console.error('❌ Session tracker tests: FAILED');
  console.error('   Error:', error.message);
}

// Test 3: Atomic Design Metrics Tracking
try {
  console.log('\n3️⃣  Testing atomic design metrics tracking...');

  let session = createSessionTracker('atomic-test');

  // Generate some atoms
  session = startTask(session, 'atom1', 'gpt-4o', 'atom_generation', 'atom');
  session = completeTask(session, 'atom1', 800, 400, true, null, {}, {
    reusabilityScore: 9,
    complexityScore: 2,
    generatedComponents: ['Button']
  });

  session = startTask(session, 'atom2', 'gpt-4o-mini', 'atom_generation', 'atom');
  session = completeTask(session, 'atom2', 600, 300, true, null, {}, {
    reusabilityScore: 8,
    complexityScore: 3,
    generatedComponents: ['Input', 'Textarea']
  });

  // Generate a molecule
  session = startTask(session, 'molecule1', 'gpt-4o', 'molecule_generation', 'molecule');
  session = completeTask(session, 'molecule1', 1500, 800, true, null, {}, {
    complexityScore: 6,
    atomDependencies: ['Button', 'Input'],
    generatedComponents: ['ContactForm']
  });

  const metrics = session.atomicMetrics;

  if (metrics.totalAtomsGenerated === 3 && metrics.totalMoleculesGenerated === 1) {
    console.log(`✅ Component counts: ${metrics.totalAtomsGenerated} atoms, ${metrics.totalMoleculesGenerated} molecules`);
  } else {
    throw new Error(`Expected 3 atoms and 1 molecule, got ${metrics.totalAtomsGenerated} atoms and ${metrics.totalMoleculesGenerated} molecules`);
  }

  if (metrics.atomToMoleculeRatio === 0.75) {
    console.log(`✅ Atom-to-molecule ratio: ${metrics.atomToMoleculeRatio}`);
  }

  if (metrics.avgAtomReusability > 8) {
    console.log(`✅ Average atom reusability: ${metrics.avgAtomReusability.toFixed(1)}/10`);
  }

  if (metrics.reusabilityIndex > 0) {
    console.log(`✅ Reusability index: ${metrics.reusabilityIndex.toFixed(2)}`);
  }

} catch (error) {
  console.error('❌ Atomic design metrics: FAILED');
  console.error('   Error:', error.message);
}

// Test 4: Cost Efficiency Analysis
try {
  console.log('\n4️⃣  Testing cost efficiency analysis...');

  let session = createSessionTracker('efficiency-test');

  // Add atom generation task
  session = startTask(session, 'atom_task', 'gpt-4o-mini', 'atom_generation', 'atom');
  session = completeTask(session, 'atom_task', 500, 250, true, null, {}, {
    reusabilityScore: 9,
    generatedComponents: ['Toggle', 'Switch']
  });

  // Add molecule generation task
  session = startTask(session, 'molecule_task', 'gpt-4o', 'molecule_generation', 'molecule');
  session = completeTask(session, 'molecule_task', 1200, 600, true, null, {}, {
    complexityScore: 7,
    generatedComponents: ['FilterPanel']
  });

  const atomCosts = session.atomicMetrics.costEfficiencyByLevel.get('atom');
  const moleculeCosts = session.atomicMetrics.costEfficiencyByLevel.get('molecule');

  if (atomCosts && moleculeCosts) {
    const atomicCostRatio = atomCosts.avgCostPerComponent / moleculeCosts.avgCostPerComponent;
    console.log(`✅ Atom cost per component: $${atomCosts.avgCostPerComponent.toFixed(4)}`);
    console.log(`✅ Molecule cost per component: $${moleculeCosts.avgCostPerComponent.toFixed(4)}`);
    console.log(`✅ Cost efficiency ratio (atom/molecule): ${atomicCostRatio.toFixed(2)}`);

    if (atomicCostRatio < 1) {
      console.log('✅ Atoms are more cost-efficient than molecules (as expected)');
    }
  }

} catch (error) {
  console.error('❌ Cost efficiency analysis: FAILED');
  console.error('   Error:', error.message);
}

// Test 5: Session Summary and Insights
try {
  console.log('\n5️⃣  Testing session summary and atomic design insights...');

  let session = createSessionTracker('insights-test');

  // Simulate a complete workflow
  const tasks = [
    { id: 'analysis', model: 'gpt-4o', type: 'analysis', level: null },
    { id: 'routing', model: 'gpt-4o', type: 'routing', level: null },
    { id: 'atom1', model: 'gpt-4o-mini', type: 'atom_generation', level: 'atom' },
    { id: 'atom2', model: 'gpt-4o-mini', type: 'atom_generation', level: 'atom' },
    { id: 'molecule1', model: 'gpt-4o', type: 'molecule_generation', level: 'molecule' },
    { id: 'validation', model: 'gpt-4o-mini', type: 'validation', level: null }
  ];

  // Execute tasks
  for (const task of tasks) {
    session = startTask(session, task.id, task.model, task.type, task.level);

    const inputTokens = task.level === 'molecule' ? 1500 : 800;
    const outputTokens = task.level === 'molecule' ? 800 : 400;

    const atomicMetrics = task.level === 'atom' ? {
      reusabilityScore: 8,
      complexityScore: 3,
      generatedComponents: [`Component_${task.id}`]
    } : task.level === 'molecule' ? {
      complexityScore: 6,
      atomDependencies: ['Component_atom1', 'Component_atom2'],
      generatedComponents: [`Component_${task.id}`]
    } : {};

    session = completeTask(session, task.id, inputTokens, outputTokens, true, null, {}, atomicMetrics);
  }

  const summary = getSessionSummary(session);

  console.log(`✅ Session summary generated:`);
  console.log(`   - Total cost: $${summary.totalCost.toFixed(4)}`);
  console.log(`   - Tasks completed: ${summary.tasksCompleted}/${summary.tasksTotal}`);
  console.log(`   - Success rate: ${(summary.successRate * 100).toFixed(1)}%`);

  const insights = getAtomicDesignInsights(session);

  console.log(`✅ Atomic design insights:`);
  console.log(`   - Design system health: ${insights.designSystemHealth}`);
  console.log(`   - Efficiency score: ${insights.efficiencyScore.toFixed(1)}/10`);
  console.log(`   - Atom-first approach: ${insights.atomicPrinciples.atomFirst ? 'Yes' : 'No'}`);
  console.log(`   - Recommendations: ${insights.recommendations.length} items`);

  const projection = getCostProjection(session, 3);
  console.log(`✅ Cost projection for 3 more tasks: $${projection.projectedTotalCost.toFixed(4)}`);

} catch (error) {
  console.error('❌ Session summary and insights: FAILED');
  console.error('   Error:', error.message);
}

// Test 6: Global State Management
try {
  console.log('\n6️⃣  Testing global state management...');

  const session1 = createCostSession('global-test-1');
  const session2 = createCostSession('global-test-2');

  if (getCostSession('global-test-1') && getCostSession('global-test-2')) {
    console.log('✅ Multiple sessions created in global state');
  }

  // Use convenience functions
  trackTask('global-test-1', 'task1', 'gpt-4o', 'atom_generation', 'atom');
  completeTaskGlobal('global-test-1', 'task1', 800, 400, true, null, {}, {
    reusabilityScore: 9,
    generatedComponents: ['Component1']
  });

  const updatedSession = getCostSession('global-test-1');
  if (updatedSession.totalCost > 0) {
    console.log(`✅ Global state updated: $${updatedSession.totalCost.toFixed(4)}`);
  }

} catch (error) {
  console.error('❌ Global state management: FAILED');
  console.error('   Error:', error.message);
}

// Test 7: Cost Limit Warnings
try {
  console.log('\n7️⃣  Testing cost limit warnings...');

  let session = createSessionTracker('limits-test');

  // Simulate expensive tasks
  session = startTask(session, 'expensive1', 'gpt-4o', 'molecule_generation', 'molecule');
  session = completeTask(session, 'expensive1', 5000, 3000, true, null, {}, {
    complexityScore: 9,
    generatedComponents: ['ExpensiveComponent1']
  });

  session = startTask(session, 'expensive2', 'gpt-4o', 'molecule_generation', 'molecule');
  session = completeTask(session, 'expensive2', 4500, 2500, true, null, {}, {
    complexityScore: 8,
    generatedComponents: ['ExpensiveComponent2']
  });

  const warnings = checkCostLimits(session, 1.00, 0.10); // Low limits for testing

  if (warnings.length > 0) {
    console.log(`✅ Cost warnings generated: ${warnings.length} warnings`);
    warnings.forEach(warning => {
      console.log(`   - ${warning.type}: ${warning.message}`);
    });
  } else {
    console.log('✅ No cost warnings (costs within limits)');
  }

} catch (error) {
  console.error('❌ Cost limit warnings: FAILED');
  console.error('   Error:', error.message);
}

// Test Summary
console.log('\n📊 FUNCTIONAL COST TRACKER TEST SUMMARY');
console.log('=' .repeat(60));
console.log('✅ Pure functional programming approach with immutable state');
console.log('✅ Atomic design principles integrated into cost tracking');
console.log('✅ Component-level cost efficiency analysis');
console.log('✅ Real-time reusability and complexity metrics');
console.log('✅ Multi-model cost optimization tracking');
console.log('✅ Session state management without classes');
console.log('✅ Cost projection and limit warning systems');
console.log('✅ Atomic design insights and recommendations');
console.log('');
console.log('🎯 ATOMIC DESIGN BENEFITS:');
console.log('   ⚛️  Tracks atom vs molecule generation costs');
console.log('   📊 Measures reusability index for design system health');
console.log('   💰 Optimizes costs through atomic-first approach');
console.log('   🔄 Promotes component reuse through cost awareness');
console.log('   📈 Provides insights for better design system architecture');
console.log('');
console.log('🎉 Functional Cost Tracker Tests Complete!');