/**
 * OpenAI Client
 * LangChain-wrapped ChatOpenAI for automatic LangSmith tracing
 */

import { ChatOpenAI } from '@langchain/openai';

/**
 * Create a new ChatOpenAI model instance
 * Returns a fresh instance each time to avoid singleton issues in LangGraph Studio
 */
export const getChatModel = (modelName) => {
  const defaultModel = process.env.DEFAULT_MODEL || 'gpt-4o';
  const selectedModel = modelName || defaultModel;

  return new ChatOpenAI({
    modelName: selectedModel,
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
    // Set to maximum tokens to prevent code truncation in function calls
    // GPT-4o supports up to 16,384 output tokens
    maxTokens: 16384,
  });
};
