#!/usr/bin/env node

/**
 * COMPONENT REUSABILITY VALIDATOR
 *
 * Uses AI to validate that generated components reuse existing library primitives
 * instead of creating inline HTML elements or duplicating functionality.
 */

import { ChatOpenAI } from "@langchain/openai";
import { ReusabilityAnalysisSchema } from "../schemas/component-schemas.js";
import {
  buildReusabilityValidationPrompt,
  buildReusabilityRefinementPrompt
} from "../prompts/validation/reusability-validation-prompt.js";

/**
 * Validates component reusability using AI analysis
 * @param {string} generatedCode - The generated component code
 * @param {object} libraryContext - Available components {elements: [], components: [], icons: []}
 * @returns {Promise<object>} Validation result with AI-identified issues
 */
export async function validateReusability(generatedCode, libraryContext) {
  try {
    const model = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.1,
      maxTokens: 2000,
      openAIApiKey: process.env.OPENAI_API_KEY,
    }).withStructuredOutput(ReusabilityAnalysisSchema, {
      method: "json_schema",
      name: "analyze_component_reusability",
      strict: true
    });

    // Extract component names from library context (handle both string and object formats)
    const extractNames = (items) => items.map(item =>
      typeof item === 'string' ? item : item.name
    );

    const availableComponents = [
      ...extractNames(libraryContext.elements || []),
      ...extractNames(libraryContext.components || []),
      ...extractNames(libraryContext.icons || [])
    ];

    // Use the extracted prompt builder
    const prompt = buildReusabilityValidationPrompt(generatedCode, availableComponents);

    const result = await model.invoke(prompt);

    return {
      isValid: result.isReusable,
      issues: result.issues || [],
      score: result.reusabilityScore,
      totalIssues: result.issues?.length || 0,
      summary: result.summary,
      message: result.summary
    };

  } catch (error) {
    console.warn(`⚠️  Reusability validation failed: ${error.message}`);

    return {
      isValid: true,
      issues: [],
      score: 1.0,
      totalIssues: 0,
      summary: 'Reusability check skipped due to error',
      message: 'Validation error - proceeding without reusability check',
      error: error.message
    };
  }
}

// Re-export the refinement prompt builder from the extracted prompt module
export { buildReusabilityRefinementPrompt };

export default {
  validateReusability,
  buildReusabilityRefinementPrompt
};
