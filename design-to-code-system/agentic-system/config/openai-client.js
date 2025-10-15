/**
 * OpenAI Client
 * LangChain-wrapped ChatOpenAI for automatic LangSmith tracing
 */

import { ChatOpenAI } from '@langchain/openai';

// Lazy-load ChatOpenAI model to ensure env vars are loaded first
let model = null;

export const getChatModel = (modelName) => {
  const defaultModel = process.env.DEFAULT_MODEL || 'gpt-4o';
  const selectedModel = modelName || defaultModel;

  if (!model) {
    model = new ChatOpenAI({
      modelName: selectedModel,
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }
  return model;
};
