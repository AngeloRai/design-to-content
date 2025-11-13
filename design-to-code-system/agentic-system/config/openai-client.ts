/**
 * OpenAI Client
 * LangChain-wrapped ChatOpenAI for automatic LangSmith tracing
 *
 * Follows LangChain best practice: Initialize models once and reuse them
 * to avoid MaxListeners warnings from creating too many instances
 */

import { ChatOpenAI } from '@langchain/openai';
import { env } from './env.config.ts';

// Singleton model instances (LangChain recommended pattern)
const modelInstances = new Map<string, ChatOpenAI>();

/**
 * Get a ChatOpenAI model instance (singleton pattern)
 * Reuses existing instances to avoid MaxListeners warnings
 *
 * LangChain best practice: Create models once at startup and reuse them
 * throughout the application lifecycle
 *
 * @param modelName - Model to use (e.g., 'gpt-4o', 'gpt-4o-mini')
 * @returns Singleton model instance
 */
export const getChatModel = (modelName?: string): ChatOpenAI => {
  const selectedModel = modelName || env.models.default;

  // Return existing instance if already created
  if (modelInstances.has(selectedModel)) {
    return modelInstances.get(selectedModel)!;
  }

  // Create new singleton instance
  const model = new ChatOpenAI({
    modelName: selectedModel,
    temperature: 0,
    openAIApiKey: env.openai.apiKey,
    // Set to maximum tokens to prevent code truncation in function calls
    // GPT-4o supports up to 16,384 output tokens
    maxTokens: 16384,
  });

  modelInstances.set(selectedModel, model);
  return model;
};
