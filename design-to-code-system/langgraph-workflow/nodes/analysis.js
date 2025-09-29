#!/usr/bin/env node

/**
 * VISUAL ANALYSIS NODE
 * Uses Command-based routing and centralized prompts
 */

import { Command } from "@langchain/langgraph";
import { createVisualAnalysisPrompt } from "../../prompts/analysis/visual-analysis.js";
import { validateAnalysisData, updatePhase, addError, AnalysisDataSchema } from "../schemas/state.js";
import { createBaseLLM, withRetry, withCostTracking, compose } from "../utils/structured-output.js";

/**
 * Mock analysis function for testing
 * In production, this would call GPT-4 Vision
 */
const mockAnalyzeVisual = async (screenshot) => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Return mock analysis data that conforms to schema
  return {
    overview: "Mock UI screenshot showing a simple form with input fields and buttons",
    identifiedComponents: [
      {
        type: "button",
        variants: ["primary", "secondary"],
        priority: "high",
        evidence: "Two distinct button styles visible in the design",
        confidence: 0.95
      },
      {
        type: "input",
        variants: ["text", "email"],
        priority: "high",
        evidence: "Multiple input fields with different label styles",
        confidence: 0.90
      },
      {
        type: "label",
        variants: ["default"],
        priority: "medium",
        evidence: "Labels appear above input fields",
        confidence: 0.85
      }
    ],
    implementationPriority: "Atoms first (Button, Input, Label), then form molecules",
    pixelPerfectionNotes: "Button corners appear rounded (4px), inputs have 1px gray border"
  };
};

/**
 * Visual Analysis Node
 * Analyzes Figma screenshots to identify UI components
 */
export const aiAnalysisNode = async (state) => {
  console.log('🔍 AI Analysis Node: Starting visual analysis...');

  try {
    // Update phase
    const updatedState = updatePhase(state, "analysis");

    // Check if we have screenshot data
    if (!state.figmaScreenshot) {
      console.log('⚠️  No Figma screenshot provided, using mock data');
    }

    // For Phase 0 testing, use mock analysis
    // In Phase 1, this will integrate with GPT-4 Vision
    const analysisResult = await mockAnalyzeVisual(state.figmaScreenshot);

    // Validate the analysis data
    const validatedAnalysis = validateAnalysisData(analysisResult);

    console.log(`✅ Analysis complete: Found ${validatedAnalysis.identifiedComponents.length} component types`);

    // Use Command for routing based on analysis success
    return new Command({
      goto: "routing",
      update: {
        ...updatedState,
        visualAnalysis: validatedAnalysis,
        metadata: {
          ...updatedState.metadata,
          tokensUsed: updatedState.metadata.tokensUsed + 150, // Mock token usage
          costEstimate: updatedState.metadata.costEstimate + 0.01
        }
      }
    });

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);

    // Use Command to route to error handling
    return new Command({
      goto: "error",
      update: addError(state, error)
    });
  }
};

/**
 * Production analysis function with structured output and functional middleware
 */
export const aiAnalysisNodeProduction = async (state) => {
  console.log('🔍 Analysis Node: Using structured output with middleware...');

  try {
    const updatedState = updatePhase(state, "analysis");

    // Phase 0: Use mock data for testing
    if (!state.figmaScreenshot) {
      console.log('⚠️  Using mock analysis data for Phase 0 testing');
      const mockResult = await mockAnalyzeVisual(null);
      const validatedAnalysis = validateAnalysisData(mockResult);

      return new Command({
        goto: "routing",
        update: {
          ...updatedState,
          visualAnalysis: validatedAnalysis,
          metadata: {
            ...updatedState.metadata,
            tokensUsed: updatedState.metadata.tokensUsed + 150,
            costEstimate: updatedState.metadata.costEstimate + 0.01
          }
        }
      });
    }

    // Phase 1+: Use structured output with functional middleware
    const costTracker = { track: (data) => console.log(`💰 Analysis: ${data.duration}ms`) };

    // Create LLM with native structured output
    const baseLLM = createBaseLLM({
      model: "gpt-4o-mini", // Vision model for screenshots
      temperature: 0.1,
      maxTokens: 2000
    });

    const structuredLLM = baseLLM.withStructuredOutput(AnalysisDataSchema);

    // Apply essential middleware
    const enhancedAnalysis = compose(
      withCostTracking(costTracker),
      withRetry(3)
    )(async (messages) => structuredLLM.invoke(messages));

    // Create analysis prompt
    const prompt = createVisualAnalysisPrompt({
      hasScreenshot: true,
      figmaData: state.figmaData,
      includeExamples: true
    });

    // Prepare messages for vision model
    const messages = [{
      role: "user",
      content: [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: { url: `data:image/png;base64,${state.figmaScreenshot}` }
        }
      ]
    }];

    console.log('🤖 Invoking structured analysis LLM with middleware...');

    // Call enhanced LLM with middleware - no manual JSON parsing needed
    const analysisResult = await enhancedAnalysis(messages);

    console.log(`✅ Structured analysis complete: Found ${analysisResult.identifiedComponents.length} component types`);

    return new Command({
      goto: "routing",
      update: {
        ...updatedState,
        visualAnalysis: analysisResult,
        metadata: {
          ...updatedState.metadata,
          tokensUsed: updatedState.metadata.tokensUsed + 200,
          costEstimate: updatedState.metadata.costEstimate + 0.02
        }
      }
    });

  } catch (error) {
    console.error('❌ Structured analysis failed:', error.message);
    return new Command({
      goto: "error",
      update: addError(state, error)
    });
  }
};

export default {
  aiAnalysisNode,
  aiAnalysisNodeProduction
};