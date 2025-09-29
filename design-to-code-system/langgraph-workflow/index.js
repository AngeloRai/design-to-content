#!/usr/bin/env node

/**
 * MAIN LANGGRAPH WORKFLOW
 * Modern StateGraph with Command-based routing
 */

import { StateGraph } from "@langchain/langgraph";
import { StateAnnotation, createInitialState } from "./schemas/state.js";

// Import all nodes
import { aiAnalysisNode } from "./nodes/analysis.js";
import { aiRoutingNode } from "./nodes/routing.js";
import {
  aiGenerationAtomsNode,
  aiGenerationMoleculesNode,
  aiGenerationMixedNode
} from "./nodes/generation.js";
import {
  aiValidationNode,
  completionNode,
  errorNode,
  revisionNode
} from "./nodes/validation.js";

/**
 * Build the main workflow graph using modern LangGraph patterns
 */
export const buildWorkflow = () => {
  console.log('🏗️  Building LangGraph workflow...');

  const workflow = new StateGraph(StateAnnotation)
    // Analysis phase
    .addNode("analysis", aiAnalysisNode, {
      ends: ["routing", "error"]
    })

    // Routing phase
    .addNode("routing", aiRoutingNode, {
      ends: ["generation_atoms", "generation_molecules", "generation_mixed", "error"]
    })

    // Generation phase (multiple strategies)
    .addNode("generation_atoms", aiGenerationAtomsNode, {
      ends: ["validation", "error"]
    })
    .addNode("generation_molecules", aiGenerationMoleculesNode, {
      ends: ["validation", "error"]
    })
    .addNode("generation_mixed", aiGenerationMixedNode, {
      ends: ["validation", "error"]
    })

    // Validation phase
    .addNode("validation", aiValidationNode, {
      ends: ["complete", "revision", "error"]
    })

    // Terminal nodes
    .addNode("complete", completionNode)
    .addNode("revision", revisionNode)
    .addNode("error", errorNode)

    // Entry point
    .addEdge("__start__", "analysis");

  console.log('✅ Workflow graph constructed');
  return workflow;
};

/**
 * Compile and return the executable workflow
 */
export const createWorkflow = () => {
  const workflow = buildWorkflow();
  const compiledWorkflow = workflow.compile();
  console.log('✅ Workflow compiled successfully');
  return compiledWorkflow;
};

/**
 * Execute the workflow with given input
 */
export const executeWorkflow = async (input, figmaScreenshot = null, options = {}) => {
  console.log('🚀 Starting workflow execution...');
  console.log(`📝 Input: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`);

  try {
    const workflow = createWorkflow();
    const initialState = createInitialState(input, figmaScreenshot);

    console.log('⏳ Executing workflow...');
    const result = await workflow.invoke(initialState, {
      recursionLimit: 20,
      ...options
    });

    console.log('🎯 Workflow execution completed');
    console.log(`📊 Final status: ${result.status}`);
    console.log(`🧩 Components generated: ${result.generatedComponents?.length || 0}`);

    return result;

  } catch (error) {
    console.error('❌ Workflow execution failed:', error.message);
    throw error;
  }
};

/**
 * Stream workflow execution for real-time monitoring
 */
export const streamWorkflow = async (input, figmaScreenshot = null, options = {}) => {
  console.log('📡 Starting workflow stream...');

  try {
    const workflow = createWorkflow();
    const initialState = createInitialState(input, figmaScreenshot);

    const stream = await workflow.stream(initialState, {
      recursionLimit: 20,
      streamMode: "values",
      ...options
    });

    const results = [];
    console.log('📺 Streaming workflow execution...');

    for await (const step of stream) {
      console.log(`\n🔄 Phase: ${step.currentPhase}`);
      console.log(`📍 Status: ${step.status}`);

      if (step.generatedComponents?.length > 0) {
        console.log(`🧩 Components: ${step.generatedComponents.length}`);
      }

      if (step.errors?.length > 0) {
        console.log(`❌ Errors: ${step.errors.length}`);
      }

      results.push(step);
    }

    const finalResult = results[results.length - 1];
    console.log('\n✅ Stream completed');
    console.log(`📊 Final status: ${finalResult.status}`);

    return {
      finalResult,
      steps: results
    };

  } catch (error) {
    console.error('❌ Workflow stream failed:', error.message);
    throw error;
  }
};

/**
 * Get workflow graph information
 */
export const getWorkflowInfo = () => {
  const workflow = buildWorkflow();

  const nodeInfo = {
    analysis: "Analyzes Figma screenshots to identify UI components",
    routing: "Determines generation strategy based on complexity",
    generation_atoms: "Generates simple, reusable atomic components",
    generation_molecules: "Generates composite components from atoms",
    generation_mixed: "Generates both atoms and molecules in sequence",
    validation: "Validates generated components for quality",
    complete: "Marks successful workflow completion",
    revision: "Handles components that need improvement",
    error: "Handles workflow errors gracefully"
  };

  const possiblePaths = [
    "analysis → routing → generation_atoms → validation → complete",
    "analysis → routing → generation_molecules → validation → complete",
    "analysis → routing → generation_mixed → validation → complete",
    "analysis → routing → generation_* → validation → revision",
    "* → error (for any failure)"
  ];

  return {
    nodeInfo,
    possiblePaths,
    totalNodes: Object.keys(nodeInfo).length,
    terminalNodes: ["complete", "revision", "error"]
  };
};

// For direct execution (when run as script)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎯 Direct execution mode');

  const testInput = "Mock Figma design with buttons and input fields";
  console.log('🧪 Running test workflow...');

  executeWorkflow(testInput)
    .then(result => {
      console.log('\n🎉 Test execution completed successfully!');
      console.log('📋 Final Result Summary:');
      console.log(`  Status: ${result.status}`);
      console.log(`  Components: ${result.generatedComponents?.length || 0}`);
      console.log(`  Validation Results: ${result.validationResults?.length || 0}`);
      console.log(`  Errors: ${result.errors?.length || 0}`);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error.message);
      process.exit(1);
    });
}

export default {
  buildWorkflow,
  createWorkflow,
  executeWorkflow,
  streamWorkflow,
  getWorkflowInfo
};