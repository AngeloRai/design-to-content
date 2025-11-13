/**
 * Search Help Tool
 * Simple, flexible tool for AI agents to search for solutions
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { SearchHelpResult } from '../types/tools.js';

interface SearchContext {
  previousAttempts?: string[];
  errorMessage?: string;
  componentType?: string;
  [key: string]: unknown;
}

interface CodebaseContext {
  additionalContext?: string;
  [key: string]: unknown;
}

/**
 * Search for help on any technical issue
 * Let the AI determine what's relevant
 */
export async function searchForHelp(query: string, context: SearchContext = {}): Promise<SearchHelpResult> {
  const model = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.1
  });

  const contextInfo = context.previousAttempts && Array.isArray(context.previousAttempts)
    ? `\nPrevious attempts that failed:\n${context.previousAttempts.join('\n')}`
    : '';

  const prompt = `I need help with this technical issue in a React/Next.js TypeScript project:

${query}
${contextInfo}

Please provide:
1. Understanding of the issue
2. Multiple solution approaches (at least 3)
3. Code examples for each approach
4. Which approach to try first and why

Be specific and practical. Provide actual code that can be used immediately.`;

  try {
    const response = await model.invoke([
      new SystemMessage(`You are a senior React/TypeScript developer.
Provide practical, working solutions.
Consider Next.js 13+ app router patterns.
Ensure TypeScript types are correct.
Follow React best practices.`),
      new HumanMessage(prompt)
    ]);

    return {
      success: true,
      help: typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Search failed:', errorMessage);
    return {
      success: false,
      error: errorMessage,
      help: ''
    };
  }
}

/**
 * Search for working examples in existing code
 * Returns relevant code snippets without being prescriptive
 */
export async function searchCodeExamples(
  searchTerm: string,
  codebaseContext: CodebaseContext = {}
): Promise<{
  success: boolean;
  examples?: string;
  searchTerm: string;
  error?: string;
}> {
  const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0
  });

  const prompt = `Search for code examples related to: "${searchTerm}"

Context:
- Framework: React/Next.js with TypeScript
- Looking for: Working patterns, common solutions, best practices
${codebaseContext.additionalContext || ''}

Provide:
1. Common patterns for this
2. Example code snippets
3. Things to avoid
4. Related documentation or resources`;

  try {
    const response = await model.invoke([
      new SystemMessage('Provide practical code examples and patterns.'),
      new HumanMessage(prompt)
    ]);

    return {
      success: true,
      examples: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
      searchTerm
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage,
      searchTerm
    };
  }
}
