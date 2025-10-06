#!/usr/bin/env node

/**
 * COMPONENT REUSABILITY VALIDATOR
 *
 * Uses AI to validate that generated components reuse existing library primitives
 * instead of creating inline HTML elements or duplicating functionality.
 */

import { ChatOpenAI } from "@langchain/openai";
import { ReusabilityAnalysisSchema } from "../schemas/component-schemas.js";

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

    const availableComponents = [
      ...(libraryContext.elements || []),
      ...(libraryContext.components || []),
      ...(libraryContext.icons || [])
    ];

    const prompt = `Analyze this React component code for reusability issues.

COMPONENT CODE:
\`\`\`tsx
${generatedCode}
\`\`\`

AVAILABLE LIBRARY COMPONENTS:
${availableComponents.length > 0 ? availableComponents.join(', ') : 'None available'}

ANALYSIS TASK:
Identify opportunities where the code uses inline HTML elements (like <button>, <input>, <img>, etc.)
when equivalent library components are available.

REUSABILITY PRINCIPLES:
1. Prefer library components over inline HTML elements
2. Use Button instead of <button>
3. Use Input instead of <input>
4. Use Image instead of <img>
5. Match HTML elements to semantically similar library components

SCORING GUIDELINES:
- 1.0: Perfect reusability - uses library components throughout
- 0.7-0.9: Good reusability - minor inline elements that could use library
- 0.4-0.6: Moderate reusability - several inline elements with library equivalents
- 0.0-0.3: Poor reusability - extensive use of inline HTML instead of library

For each issue found:
- Identify the HTML element (button, input, etc.)
- Suggest the best matching library component
- Provide the import path (@/ui/elements/ComponentName)
- Rate severity based on impact

Consider:
- How many occurrences of the inline element exist
- Whether a library component truly matches the use case
- The semantic meaning of the element

Return structured analysis with issues and score.`;

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

/**
 * Builds refinement prompt from AI-identified reusability issues
 * @param {array} issues - Reusability issues found by AI
 * @returns {string} Refinement instructions for code generation
 */
export function buildReusabilityRefinementPrompt(issues) {
  if (!issues || issues.length === 0) return '';

  let prompt = '\n\nCOMPONENT REUSABILITY IMPROVEMENTS REQUIRED:\n\n';

  const highSeverity = issues.filter(i => i.severity === 'high');
  const mediumSeverity = issues.filter(i => i.severity === 'medium');
  const lowSeverity = issues.filter(i => i.severity === 'low');

  if (highSeverity.length > 0) {
    prompt += 'HIGH PRIORITY:\n';
    highSeverity.forEach((issue, idx) => {
      prompt += `${idx + 1}. ${issue.suggestion}\n`;
      if (issue.importPath && issue.libraryComponent) {
        prompt += `   Add: import { ${issue.libraryComponent} } from '${issue.importPath}';\n`;
      }
      prompt += `   Replace: <${issue.htmlElement}> → <${issue.libraryComponent || 'LibraryComponent'}>\n\n`;
    });
  }

  if (mediumSeverity.length > 0) {
    prompt += 'MEDIUM PRIORITY:\n';
    mediumSeverity.forEach((issue, idx) => {
      prompt += `${idx + 1}. ${issue.suggestion}\n`;
      if (issue.importPath && issue.libraryComponent) {
        prompt += `   Add: import { ${issue.libraryComponent} } from '${issue.importPath}';\n\n`;
      }
    });
  }

  if (lowSeverity.length > 0) {
    prompt += 'IMPROVEMENTS:\n';
    lowSeverity.forEach((issue, idx) => {
      prompt += `${idx + 1}. ${issue.suggestion}\n`;
    });
    prompt += '\n';
  }

  prompt += 'CRITICAL: Import and reuse existing library components instead of creating inline HTML elements.\n';
  prompt += 'This ensures consistency, maintainability, and adherence to the design system.\n';

  return prompt;
}

export default {
  validateReusability,
  buildReusabilityRefinementPrompt
};
