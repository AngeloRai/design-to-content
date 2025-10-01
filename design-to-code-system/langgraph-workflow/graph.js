#!/usr/bin/env node

/**
 * LANGGRAPH WORKFLOW - Main graph definition
 *
 * Workflow:
 * analysis → strategy_planner → [conditional routing] → finalizer
 *                                  ↓
 *                              generator (if create_new)
 *                              finalizer (if all skip)
 *
 * Uses StateAnnotation from schemas/state.js
 * Includes checkpointing for state persistence
 */

import { StateGraph } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { StateAnnotation } from "./schemas/state.js";
import { analyzeFigmaVisualComponents } from "./nodes/analysis.js";
import { strategyPlannerNode } from "./nodes/strategy-planner.js";
import { generatorNode } from "./nodes/generator.js";
import { finalizerNode } from "./nodes/finalizer.js";

/**
 * Build the workflow graph
 */
export function buildGraph() {
  // Create graph with state schema
  const workflow = new StateGraph(StateAnnotation);

  // Add nodes
  workflow.addNode("analysis", analyzeFigmaVisualComponents);
  workflow.addNode("strategy_planner", strategyPlannerNode);
  workflow.addNode("generator", generatorNode);
  workflow.addNode("finalizer", finalizerNode);

  // Define edges
  workflow.addEdge("__start__", "analysis");
  workflow.addEdge("analysis", "strategy_planner");

  // Conditional routing from strategy planner
  workflow.addConditionalEdges(
    "strategy_planner",
    routeFromStrategyPlanner,
    {
      generator: "generator",
      finalizer: "finalizer"
    }
  );

  workflow.addEdge("generator", "finalizer");
  workflow.addEdge("finalizer", "__end__");

  return workflow;
}

/**
 * Route from strategy planner based on decisions
 */
function routeFromStrategyPlanner(state) {
  const { componentStrategy = [], errors = [] } = state;

  console.log(`🔀 Routing: componentStrategy has ${componentStrategy.length} items`);

  // If errors occurred, skip to finalizer
  if (errors.length > 0) {
    console.log("⚠️  Errors detected, skipping to finalizer");
    return "finalizer";
  }

  // Check if any components need generation
  const needsGeneration = componentStrategy.some(s => s.action === "create_new");

  if (needsGeneration) {
    const count = componentStrategy.filter(s => s.action === "create_new").length;
    console.log(`✓ Routing to generator (${count} component${count > 1 ? 's' : ''} to create)`);
    return "generator";
  }

  // Nothing to generate, skip to finalizer
  console.log("ℹ️  No components to generate, skipping to finalizer");
  return "finalizer";
}

/**
 * Compile graph with checkpointing
 */
export function compileGraph(workflow, checkpointer = null) {
  // Use provided checkpointer or default to in-memory
  const finalCheckpointer = checkpointer || new MemorySaver();

  return workflow.compile({
    checkpointer: finalCheckpointer
  });
}

/**
 * Create and return compiled graph (main export)
 */
export function createWorkflow(checkpointer = null) {
  const workflow = buildGraph();
  return compileGraph(workflow, checkpointer);
}

export default createWorkflow;