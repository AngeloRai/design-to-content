/**
 * Search Help Tool
 * Simple, flexible tool for AI agents to search for solutions
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

/**
 * Search for help on any technical issue
 * Let the AI determine what's relevant
 */
export async function searchForHelp(query, context = {}) {
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
      content: response.content,
      query
    };
  } catch (error) {
    console.error('Search failed:', error);
    return {
      success: false,
      error: error.message,
      query
    };
  }
}

/**
 * Search for working examples in existing code
 * Returns relevant code snippets without being prescriptive
 */
export async function searchCodeExamples(searchTerm, codebaseContext = {}) {
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
      examples: response.content,
      searchTerm
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      searchTerm
    };
  }
}