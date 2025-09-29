#!/usr/bin/env node

/**
 * AI ROUTING DECISION NODE
 * Uses Command-based routing and centralized routing prompts
 */

import { Command } from "@langchain/langgraph";
import { createComponentRoutingPrompt } from "../../prompts/generation/routing-decisions.js";
import { validateRoutingDecision, updatePhase, addError } from "../schemas/state.js";
import { createBaseLLM } from "../utils/structured-output.js";
import { RoutingDecisionSchema } from "../schemas/state.js";

/**
 * Mock routing decision function for testing
 * In production, this would call GPT-4o for intelligent routing
 */
const mockRouteComponent = async (visualAnalysis) => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const componentCount = visualAnalysis.identifiedComponents.length;
  const hasComplexComponents = visualAnalysis.identifiedComponents.some(c =>
    c.variants && c.variants.length > 2 || // Multiple variants indicate complexity
    c.confidence < 0.8 || // Low confidence suggests complex composition
    c.priority === 'high' && c.type.length > 8 // Long names often indicate composite components
  );

  // Simple routing logic based on analysis
  let strategy, reasoning, atoms, molecules;

  if (componentCount <= 2 && !hasComplexComponents) {
    strategy = "ATOM_GENERATION";
    reasoning = "Simple components detected, focus on atomic elements";
    atoms = componentCount;
    molecules = 0;
  } else if (hasComplexComponents) {
    strategy = "MIXED_GENERATION";
    reasoning = "Complex components detected, need both atoms and molecules";
    atoms = Math.floor(componentCount * 0.7);
    molecules = Math.ceil(componentCount * 0.3);
  } else {
    strategy = "ATOM_GENERATION";
    reasoning = "Multiple simple components, start with atoms";
    atoms = componentCount;
    molecules = 0;
  }

  return {
    strategy,
    reasoning,
    complexity_score: hasComplexComponents ? 7 : 4,
    estimated_components: { atoms, molecules },
    priority_order: molecules > 0 ? ["atom", "molecule"] : ["atom"]
  };
};

/**
 * AI Routing Decision Node
 * Analyzes visual analysis to determine generation strategy
 */
export const aiRoutingNode = async (state) => {
  console.log('🎯 AI Routing Node: Determining generation strategy...');

  try {
    // Update phase
    const updatedState = updatePhase(state, "routing");

    // Check if we have visual analysis
    if (!state.visualAnalysis) {
      throw new Error("No visual analysis available for routing decision");
    }

    // For Phase 0 testing, use mock routing
    // In Phase 1, this will integrate with GPT-4o
    const routingResult = await mockRouteComponent(state.visualAnalysis);

    // Validate the routing decision
    const validatedDecision = validateRoutingDecision(routingResult);

    console.log(`✅ Routing decision: ${validatedDecision.strategy} (${validatedDecision.reasoning})`);

    // Use Command for routing based on strategy
    const nextNode = validatedDecision.strategy === "ATOM_GENERATION"
      ? "generation_atoms"
      : validatedDecision.strategy === "MOLECULE_GENERATION"
      ? "generation_molecules"
      : "generation_mixed";

    return new Command({
      goto: nextNode,
      update: {
        ...updatedState,
        routingDecision: validatedDecision,
        metadata: {
          ...updatedState.metadata,
          tokensUsed: updatedState.metadata.tokensUsed + 100, // Mock token usage
          costEstimate: updatedState.metadata.costEstimate + 0.005
        }
      }
    });

  } catch (error) {
    console.error('❌ Routing failed:', error.message);

    return new Command({
      goto: "error",
      update: addError(state, error)
    });
  }
};

/**
 * Production routing function using structured output
 */
export const aiRoutingNodeProduction = async (state) => {
  console.log('🎯 AI Routing Node: Using structured output...');

  try {
    const updatedState = updatePhase(state, "routing");

    if (!state.visualAnalysis) {
      throw new Error("No visual analysis available for routing decision");
    }

    // Create LLM with native structured output
    const baseLLM = createBaseLLM({
      model: "gpt-4o-mini",
      temperature: 0.2,
      maxTokens: 1000
    });
    const structuredRoutingLLM = baseLLM.withStructuredOutput(RoutingDecisionSchema);

    // Create routing prompt
    const prompt = createComponentRoutingPrompt(state.visualAnalysis);

    console.log('🤖 Invoking structured routing LLM...');

    // Call structured LLM - automatic Zod validation
    const routingResult = await structuredRoutingLLM.invoke([{
      role: "user",
      content: prompt
    }]);

    console.log(`✅ Structured routing decision: ${routingResult.strategy}`);
    console.log(`📊 Complexity score: ${routingResult.complexity_score}/10`);

    // Route based on strategy
    const nextNode = routingResult.strategy === "ATOM_GENERATION"
      ? "generation_atoms"
      : routingResult.strategy === "MOLECULE_GENERATION"
      ? "generation_molecules"
      : "generation_mixed";

    return new Command({
      goto: nextNode,
      update: {
        ...updatedState,
        routingDecision: routingResult,
        metadata: {
          ...updatedState.metadata,
          tokensUsed: updatedState.metadata.tokensUsed + 150,
          costEstimate: updatedState.metadata.costEstimate + 0.015
        }
      }
    });

  } catch (error) {
    console.error('❌ Structured routing failed:', error.message);
    return new Command({
      goto: "error",
      update: addError(state, error)
    });
  }
};

export default {
  aiRoutingNode,
  aiRoutingNodeProduction
};