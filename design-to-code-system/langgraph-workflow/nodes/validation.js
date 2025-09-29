#!/usr/bin/env node

/**
 * VALIDATION NODES
 * Uses Command-based routing and centralized validation prompts
 */

import { Command } from "@langchain/langgraph";
import { validateValidationResult, updatePhase, addError } from "../schemas/state.js";

/**
 * Mock validation function for testing
 */
const mockValidateComponents = async (components) => {
  // Simulate validation processing delay
  await new Promise(resolve => setTimeout(resolve, 150));

  const results = [];

  for (const component of components) {
    // Simple mock validation
    const hasCode = component.code && component.code.length > 0;
    const hasName = component.name && component.name.length > 0;
    const hasValidType = ['atom', 'molecule', 'organism'].includes(component.type);

    const issues = [];
    const recommendations = [];

    if (!hasCode) issues.push("Missing component code");
    if (!hasName) issues.push("Missing component name");
    if (!hasValidType) issues.push("Invalid component type");

    if (component.code && !component.code.includes('import')) {
      recommendations.push("Add proper imports to component");
    }

    if (!component.code?.includes('export')) {
      recommendations.push("Add proper export to component");
    }

    const success = issues.length === 0;
    const score = success ? (10 - recommendations.length) : Math.max(1, 5 - issues.length);

    results.push({
      component: component.name,
      validationType: "typescript",
      success,
      score,
      issues,
      recommendations,
      confidence: success ? 0.9 : 0.6
    });
  }

  return results;
};

/**
 * AI Validation Node
 * Validates generated components for quality and compliance
 */
export const aiValidationNode = async (state) => {
  console.log('✅ Validation Node: Checking component quality...');

  try {
    const updatedState = updatePhase(state, "validation");

    if (!state.generatedComponents || state.generatedComponents.length === 0) {
      throw new Error("No generated components available for validation");
    }

    console.log(`  🔍 Validating ${state.generatedComponents.length} components...`);

    // For Phase 0 testing, use mock validation
    const validationResults = await mockValidateComponents(state.generatedComponents);

    // Validate each validation result
    const validatedResults = [];
    for (const result of validationResults) {
      try {
        const validated = validateValidationResult(result);
        validatedResults.push(validated);
      } catch (error) {
        console.warn(`⚠️  Invalid validation result for ${result.component}: ${error.message}`);
      }
    }

    // Calculate overall success rate
    const successCount = validatedResults.filter(r => r.success).length;
    const successRate = successCount / validatedResults.length;

    console.log(`✅ Validation complete: ${successCount}/${validatedResults.length} components passed`);

    // Route based on validation success rate
    const nextNode = successRate >= 0.8 ? "complete" : "revision";

    return new Command({
      goto: nextNode,
      update: {
        ...updatedState,
        validationResults: validatedResults,
        status: successRate >= 0.8 ? "success" : "needs_revision",
        metadata: {
          ...updatedState.metadata,
          tokensUsed: updatedState.metadata.tokensUsed + 200,
          costEstimate: updatedState.metadata.costEstimate + 0.01,
          validationSuccessRate: successRate
        }
      }
    });

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return new Command({
      goto: "error",
      update: addError(state, error)
    });
  }
};

/**
 * Completion Node
 * Final node that marks successful completion
 */
export const completionNode = async (state) => {
  console.log('🎉 Completion Node: Workflow finished successfully!');

  const updatedState = updatePhase(state, "complete");

  // Calculate final statistics
  const totalComponents = state.generatedComponents?.length || 0;
  const validationPassRate = state.validationResults?.filter(r => r.success).length /
                            (state.validationResults?.length || 1);

  console.log('📊 Final Statistics:');
  console.log(`  Components generated: ${totalComponents}`);
  console.log(`  Validation pass rate: ${(validationPassRate * 100).toFixed(1)}%`);
  console.log(`  Total tokens used: ${updatedState.metadata.tokensUsed}`);
  console.log(`  Estimated cost: $${updatedState.metadata.costEstimate.toFixed(4)}`);

  // No Command needed - this ends the workflow
  return {
    ...updatedState,
    status: "completed",
    metadata: {
      ...updatedState.metadata,
      endTime: new Date().toISOString(),
      totalDuration: new Date() - new Date(updatedState.metadata.startTime),
      finalStats: {
        totalComponents,
        validationPassRate,
        tokensUsed: updatedState.metadata.tokensUsed,
        costEstimate: updatedState.metadata.costEstimate
      }
    }
  };
};

/**
 * Error Handling Node
 * Handles workflow errors gracefully
 */
export const errorNode = async (state) => {
  console.error('🚨 Error Node: Workflow encountered errors');

  const updatedState = updatePhase(state, "error");

  console.error('📋 Error Summary:');
  state.errors?.forEach((error, index) => {
    console.error(`  ${index + 1}. [${error.phase}] ${error.message}`);
  });

  return {
    ...updatedState,
    status: "failed",
    metadata: {
      ...updatedState.metadata,
      endTime: new Date().toISOString(),
      errorCount: state.errors?.length || 0
    }
  };
};

/**
 * Revision Node
 * Handles components that need revision
 */
export const revisionNode = async (state) => {
  console.log('🔄 Revision Node: Components need improvement');

  const updatedState = updatePhase(state, "revision");

  // Log components that failed validation
  const failedComponents = state.validationResults?.filter(r => !r.success) || [];
  console.log(`📝 ${failedComponents.length} components need revision:`);

  failedComponents.forEach(result => {
    console.log(`  - ${result.component}:`);
    result.issues?.forEach(issue => console.log(`    ❌ ${issue}`));
    result.recommendations?.forEach(rec => console.log(`    💡 ${rec}`));
  });

  // For Phase 0, we'll just mark as needing revision
  // In Phase 1+, this could trigger regeneration
  return {
    ...updatedState,
    status: "needs_revision",
    metadata: {
      ...updatedState.metadata,
      endTime: new Date().toISOString(),
      revisionNeeded: failedComponents.length
    }
  };
};

export default {
  aiValidationNode,
  completionNode,
  errorNode,
  revisionNode
};