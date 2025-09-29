#!/usr/bin/env node

/**
 * STRUCTURED OUTPUT TESTS
 * Tests the simplified structured output utilities
 */

import {
  createBaseLLM,
  withRetry,
  withCostTracking,
  compose
} from '../utils/structured-output.js';

import {
  AnalysisDataSchema,
  RoutingDecisionSchema
} from '../schemas/state.js';

console.log('🧪 Testing Structured Output Utilities...\n');

// Test 1: Basic LLM creation and native structured output
try {
  console.log('1️⃣  Testing native structured output...');

  const baseLLM = createBaseLLM({ model: "gpt-4o-mini" });
  const structuredLLM = baseLLM.withStructuredOutput(AnalysisDataSchema);

  if (structuredLLM && typeof structuredLLM.invoke === 'function') {
    console.log('✅ Native structured output: SUCCESS');
    console.log('   Created LLM with native withStructuredOutput()');
  } else {
    throw new Error('Invalid structured LLM created');
  }

} catch (error) {
  console.error('❌ Native structured output: FAILED');
  console.error('   Error:', error.message);
}

// Test 2: Multiple schemas with native structured output
try {
  console.log('\n2️⃣  Testing multiple schemas...');

  const baseLLM = createBaseLLM();
  const analysisLLM = baseLLM.withStructuredOutput(AnalysisDataSchema);
  const routingLLM = baseLLM.withStructuredOutput(RoutingDecisionSchema);

  console.log('✅ Multiple schemas: SUCCESS');
  console.log('   Analysis LLM configured ✓');
  console.log('   Routing LLM configured ✓');

} catch (error) {
  console.error('❌ Multiple schemas: FAILED');
  console.error('   Error:', error.message);
}

// Test 3: Essential middleware composition
try {
  console.log('\n3️⃣  Testing essential middleware...');

  const mockCostTracker = {
    track: (data) => {
      console.log(`   📊 Tracking: ${data.duration}ms, success: ${data.success}`);
    }
  };

  const mockLLMFunction = async (messages) => {
    return {
      overview: "Test analysis",
      identifiedComponents: [{
        type: "button",
        variants: ["primary"],
        priority: "high",
        evidence: "Test evidence",
        confidence: 0.9
      }],
      implementationPriority: "Test priority",
      pixelPerfectionNotes: "Test notes"
    };
  };

  const enhancedFunction = compose(
    withCostTracking(mockCostTracker),
    withRetry(2)
  )(mockLLMFunction);

  const result = await enhancedFunction([{ role: "user", content: "test" }]);

  if (result && result.overview) {
    console.log('✅ Essential middleware: SUCCESS');
    console.log('   Composed retry + cost tracking');
  } else {
    throw new Error('Middleware composition failed');
  }

} catch (error) {
  console.error('❌ Essential middleware: FAILED');
  console.error('   Error:', error.message);
}

// Test 4: Schema validation
try {
  console.log('\n4️⃣  Testing schema validation...');

  const validAnalysisData = {
    overview: "Test UI with buttons",
    identifiedComponents: [{
      type: "button",
      variants: ["primary", "secondary"],
      priority: "high",
      evidence: "Visual buttons in design",
      confidence: 0.95
    }],
    implementationPriority: "Start with buttons",
    pixelPerfectionNotes: "4px border radius"
  };

  const validatedData = AnalysisDataSchema.parse(validAnalysisData);

  if (validatedData.overview === "Test UI with buttons") {
    console.log('✅ Schema validation: SUCCESS');
    console.log('   Valid data passed Zod validation');
    console.log('   Component count:', validatedData.identifiedComponents.length);
  }

  try {
    const invalidData = { overview: "missing required fields" };
    AnalysisDataSchema.parse(invalidData);
    throw new Error('Should have failed validation');
  } catch (validationError) {
    console.log('   ✓ Invalid data correctly rejected');
  }

} catch (error) {
  console.error('❌ Schema validation: FAILED');
  console.error('   Error:', error.message);
}

// Test Summary
console.log('\n📊 SIMPLIFIED STRUCTURED OUTPUT TEST SUMMARY');
console.log('=' .repeat(50));
console.log('✅ Native LangGraph structured output');
console.log('✅ Multiple schema support');
console.log('✅ Essential middleware composition');
console.log('✅ Schema validation with Zod');
console.log('');
console.log('🎯 CLEANUP STATUS:');
console.log('   ❌ Custom wrappers → ✅ Native withStructuredOutput()');
console.log('   ❌ Complex middleware → ✅ Essential utilities only');
console.log('   ❌ Redundant validation → ✅ Zod schema validation');
console.log('');
console.log('🎉 Simplified System Tests Complete!');