#!/usr/bin/env node

/**
 * IN-MEMORY IMPORT VALIDATOR
 *
 * Validates component imports against library context without file I/O.
 * Catches imports of non-existent components during code review.
 */

/**
 * Validate imports against available library components
 * @param {string} codeString - Generated component code
 * @param {object} libraryContext - Available components {icons: [], elements: [], components: []}
 * @returns {object} Validation result with invalid imports
 */
export function validateImportsAgainstLibrary(codeString, libraryContext) {
  // Match: import { ComponentName } from '@/ui/category/ComponentName'
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@\/ui\/(icons|elements|components)\/([^'"]+)['"]/g;
  const invalidImports = [];

  let match;
  while ((match = importRegex.exec(codeString)) !== null) {
    const importedNames = match[1].split(',').map(n => n.trim());
    const category = match[2]; // 'icons', 'elements', or 'components'
    const fileName = match[3]; // e.g., 'Icon', 'Button', 'ChevronIcon'

    const availableComponents = libraryContext[category] || [];

    // Check if the file/component exists in the library
    if (!availableComponents.includes(fileName)) {
      invalidImports.push({
        importStatement: match[0],
        importedNames,
        fileName,
        path: `@/ui/${category}/${fileName}`,
        category,
        suggestions: availableComponents.slice(0, 5) // Top 5 alternatives
      });
    }
  }

  return {
    valid: invalidImports.length === 0,
    invalidImports,
    totalImports: invalidImports.length,
    issues: invalidImports.map(imp =>
      `Component '${imp.fileName}' imported from '${imp.path}' not found in library. ` +
      `Available ${imp.category}: ${imp.suggestions.length > 0 ? imp.suggestions.join(', ') : 'none'}`
    )
  };
}

/**
 * Build refinement prompt for import issues
 * @param {array} invalidImports - List of invalid imports from validation
 * @param {object} libraryContext - Library context for suggestions
 * @returns {string} Refinement instructions
 */
export function buildImportRefinementPrompt(invalidImports, libraryContext) {
  if (!invalidImports || invalidImports.length === 0) {
    return '';
  }

  let prompt = 'IMPORT ISSUES TO FIX:\n\n';

  invalidImports.forEach((imp, index) => {
    prompt += `${index + 1}. INVALID IMPORT:\n`;
    prompt += `   Current: ${imp.importStatement}\n`;
    prompt += `   Problem: Component '${imp.fileName}' does not exist in library\n`;

    if (imp.suggestions.length > 0) {
      prompt += `   Available ${imp.category}: ${imp.suggestions.join(', ')}\n`;
      prompt += `   Fix: Either use one of the available components OR remove the import and use inline HTML/SVG\n`;
    } else {
      prompt += `   Fix: No ${imp.category} available - use inline HTML/SVG instead\n`;
    }

    prompt += '\n';
  });

  prompt += 'INSTRUCTIONS:\n';
  prompt += '- Remove all invalid imports listed above\n';
  prompt += '- Replace with available library components OR inline HTML/SVG\n';
  prompt += '- Only import components that exist in the library context\n';

  return prompt;
}
