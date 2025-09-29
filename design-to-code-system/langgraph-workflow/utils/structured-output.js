#!/usr/bin/env node

/**
 * STRUCTURED OUTPUT UTILITIES
 * Native LangGraph structured output patterns
 */

import { ChatOpenAI } from "@langchain/openai";

/**
 * Create base LLM instance with configuration
 */
export const createBaseLLM = (config = {}) => {
  const defaultConfig = {
    model: "gpt-4o-mini",
    temperature: 0.1,
    maxTokens: 4000,
    ...config
  };

  return new ChatOpenAI(defaultConfig);
};

/**
 * Simple retry mechanism for LLM operations
 */
export const withRetry = (maxAttempts = 3) =>
  (llmFunction) =>
    async (...args) => {
      let lastError;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await llmFunction(...args);
        } catch (error) {
          lastError = error;
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      throw lastError;
    };

/**
 * Simple cost tracking for operations
 */
export const withCostTracking = (costTracker) =>
  (llmFunction) =>
    async (...args) => {
      const startTime = Date.now();

      try {
        const result = await llmFunction(...args);
        const duration = Date.now() - startTime;

        if (costTracker?.track) {
          costTracker.track({ duration, success: true });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        if (costTracker?.track) {
          costTracker.track({ duration, success: false, error: error.message });
        }

        throw error;
      }
    };

/**
 * Function composition utility
 */
export const compose = (...middlewares) =>
  (baseFunction) =>
    middlewares.reduceRight(
      (fn, middleware) => middleware(fn),
      baseFunction
    );

export default {
  createBaseLLM,
  withRetry,
  withCostTracking,
  compose
};