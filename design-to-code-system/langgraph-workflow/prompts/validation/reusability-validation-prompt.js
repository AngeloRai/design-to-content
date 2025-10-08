#!/usr/bin/env node

/**
 * REUSABILITY VALIDATION PROMPT
 *
 * Analyzes generated React components to ensure they reuse existing library primitives
 * instead of creating inline HTML elements or duplicating functionality.
 *
 * Follows GPT-4.1 best practices from OpenAI cookbook:
 * - Clear structure with XML tags
 * - Persistence and reflection instructions
 * - Key instructions at both beginning and end
 * - Concrete examples and scoring guidelines
 */

/**
 * Build prompt for AI-powered reusability validation
 * @param {string} generatedCode - The generated component code
 * @param {array} availableComponents - List of available library components
 * @returns {string} Structured prompt for validation
 */
export const buildReusabilityValidationPrompt = (generatedCode, availableComponents) => {
  return `<task>
Analyze a React component for reusability issues and opportunities to use existing library components.
</task>

<persistence_reminder>
Thoroughly analyze EVERY line of code. Check ALL HTML elements against available library components.
Continue until you've identified all reusability opportunities.
</persistence_reminder>

<component_code>
\`\`\`tsx
${generatedCode}
\`\`\`
</component_code>

<available_library_components>
${availableComponents.length > 0 ? availableComponents.join(', ') : 'None available'}
</available_library_components>

<analysis_instructions>
1. **Scan for inline HTML elements**: Look for <button>, <input>, <img>, <textarea>, <select>, <a>, etc.
2. **Match to library components**: For each HTML element, check if a library equivalent exists
3. **Evaluate semantic fit**: Ensure the library component truly matches the use case
4. **Count occurrences**: Note how many times each issue appears
5. **Rate severity**: High for common elements (button, input), Medium for layout, Low for special cases
</analysis_instructions>

<reusability_principles>
- **ALWAYS prefer library components** over inline HTML elements
- Use Button instead of <button>
- Use Input instead of <input>
- Use Image/ResponsiveImage instead of <img>
- Use Link instead of <a>
- Use Select instead of <select>
- Use TextArea instead of <textarea>
- Match HTML elements to semantically similar library components
</reusability_principles>

<scoring_guidelines>
**1.0 (Perfect)**: Uses library components throughout, no inline HTML elements
**0.7-0.9 (Good)**: Minor inline elements that could use library components
**0.4-0.6 (Moderate)**: Several inline elements with library equivalents available
**0.0-0.3 (Poor)**: Extensive use of inline HTML instead of library components
</scoring_guidelines>

<output_format>
For each reusability issue found, provide:
1. **htmlElement**: The HTML element used (e.g., "button", "input")
2. **libraryComponent**: Best matching library component (e.g., "Button", "Input")
3. **importPath**: Suggested import path (e.g., "@/ui/elements/Button")
4. **severity**: "high" | "medium" | "low"
5. **suggestion**: Specific improvement recommendation
6. **occurrences**: Number of times this issue appears
</output_format>

<reflection>
Before finalizing:
- Have I checked EVERY HTML element in the code?
- Did I match each to the most appropriate library component?
- Are my severity ratings consistent and justified?
- Is my overall score fair based on the issues found?
</reflection>

<final_reminder>
Return a structured analysis with:
- isReusable: boolean (true if score >= 0.7)
- reusabilityScore: number (0.0 to 1.0)
- issues: array of reusability issues
- summary: brief description of findings
Focus on actionable improvements that enhance consistency and maintainability.
</final_reminder>`;
};

/**
 * Build refinement instructions from identified reusability issues
 * @param {array} issues - Array of reusability issues
 * @returns {string} Refinement prompt for code generation
 */
export const buildReusabilityRefinementPrompt = (issues) => {
  if (!issues || issues.length === 0) return '';

  const highSeverity = issues.filter(i => i.severity === 'high');
  const mediumSeverity = issues.filter(i => i.severity === 'medium');
  const lowSeverity = issues.filter(i => i.severity === 'low');

  let prompt = `
<reusability_improvements_required>

<persistence_reminder>
Fix ALL identified reusability issues. Do not skip any HTML elements that should use library components.
</persistence_reminder>

`;

  if (highSeverity.length > 0) {
    prompt += `<high_priority>
${highSeverity.map((issue, idx) => `
${idx + 1}. **${issue.suggestion}**
   - Add import: \`import { ${issue.libraryComponent} } from '${issue.importPath}';\`
   - Replace ALL \`<${issue.htmlElement}>\` elements with \`<${issue.libraryComponent}>\`
   - Occurrences to fix: ${issue.occurrences || 1}
`).join('\n')}
</high_priority>

`;
  }

  if (mediumSeverity.length > 0) {
    prompt += `<medium_priority>
${mediumSeverity.map((issue, idx) => `
${idx + 1}. ${issue.suggestion}
   - Import: \`import { ${issue.libraryComponent} } from '${issue.importPath}';\`
   - Replace: \`<${issue.htmlElement}>\` → \`<${issue.libraryComponent}>\`
`).join('\n')}
</medium_priority>

`;
  }

  if (lowSeverity.length > 0) {
    prompt += `<improvements>
${lowSeverity.map((issue, idx) => `${idx + 1}. ${issue.suggestion}`).join('\n')}
</improvements>

`;
  }

  prompt += `<critical_requirement>
Import and reuse existing library components instead of creating inline HTML elements.
This ensures consistency, maintainability, and adherence to the design system.
Every HTML element should be evaluated for library component replacement.
</critical_requirement>

</reusability_improvements_required>`;

  return prompt;
};