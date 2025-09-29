#!/usr/bin/env node

/**
 * STATE SCHEMA TESTS
 * Test modern LangGraph state schema and Zod validation
 */

import {
  StateAnnotation,
  createInitialState,
  updatePhase,
  addError,
  validateComponent,
  determineUICategory
} from '../schemas/state.js';

console.log('🧪 Testing State Schema...\n');

// Test 1: Create initial state
try {
  const initialState = createInitialState("Test input", "base64screenshot");
  console.log('✅ Initial state creation:', {
    input: initialState.input,
    currentPhase: initialState.currentPhase,
    status: initialState.status,
    startTime: initialState.metadata.startTime.substring(0, 19)
  });
} catch (error) {
  console.error('❌ Initial state creation failed:', error.message);
}

// Test 2: StateAnnotation structure
try {
  const stateKeys = Object.keys(StateAnnotation.spec);
  console.log('✅ StateAnnotation keys:', stateKeys.slice(0, 5), '... (total:', stateKeys.length, ')');
} catch (error) {
  console.error('❌ StateAnnotation test failed:', error.message);
}

// Test 3: Phase updates
try {
  let testState = createInitialState("test");
  testState = updatePhase(testState, "analysis", { visualAnalysis: { test: true } });
  console.log('✅ Phase update:', {
    phase: testState.currentPhase,
    hasAnalysisTime: !!testState.metadata.analysisTime
  });
} catch (error) {
  console.error('❌ Phase update failed:', error.message);
}

// Test 4: Error handling
try {
  let testState = createInitialState("test");
  testState = addError(testState, new Error("Test error"));
  console.log('✅ Error handling:', {
    errorCount: testState.errors.length,
    status: testState.status,
    errorMessage: testState.errors[0].message
  });
} catch (error) {
  console.error('❌ Error handling failed:', error.message);
}

// Test 5: Component validation
try {
  const validComponent = {
    name: "TestButton",
    type: "atom",
    description: "A test button component",
    code: "export const TestButton = () => <button>Test</button>;",
    path: "ui/elements/TestButton.tsx",
    uiCategory: "elements",
    confidence: 0.95
  };

  const validated = validateComponent(validComponent);
  console.log('✅ Component validation:', {
    name: validated.name,
    type: validated.type,
    confidence: validated.confidence
  });
} catch (error) {
  console.error('❌ Component validation failed:', error.message);
}

// Test 6: UI Category determination
try {
  const categories = {
    'button': determineUICategory('button'),
    'modal': determineUICategory('modal'),
    'header': determineUICategory('header'),
    'unknown': determineUICategory('unknown-component')
  };
  console.log('✅ UI category determination:', categories);
} catch (error) {
  console.error('❌ UI category determination failed:', error.message);
}

// Test 7: Invalid component validation (should fail)
try {
  const invalidComponent = {
    name: "InvalidComponent",
    // missing required fields
  };
  validateComponent(invalidComponent);
  console.error('❌ Invalid component validation should have failed');
} catch (error) {
  console.log('✅ Invalid component properly rejected:', error.message.substring(0, 50) + '...');
}

console.log('\n🎉 State Schema Tests Complete!');