#!/usr/bin/env node

/**
 * COMPONENT ANALYSIS PROMPT
 *
 * Analyzes React TypeScript components to extract structured metadata
 * for library scanning and inventory building.
 *
 * Follows GPT-4.1 best practices from OpenAI cookbook:
 * - Explicit, structured instructions
 * - Clear examples of what to extract and what to ignore
 * - Persistence reminders for thorough analysis
 * - Validation checklist at the end
 */

/**
 * Build prompt for AI-powered component analysis
 * @param {string} fileName - Name of the file being analyzed
 * @param {string} filePath - Full path to the file
 * @param {string} componentType - Type determined from file location (icon/element/component/module)
 * @param {string} content - Component source code
 * @returns {string} Structured prompt for analysis
 */
export const buildComponentAnalysisPrompt = (fileName, filePath, componentType, content) => {
  return `<task>
Analyze a React TypeScript component file and extract structured metadata for component library inventory.
</task>

<persistence_reminder>
Carefully analyze the ENTIRE file. Extract ALL props, variants, and dependencies.
Use the file path to determine component type - do not guess or change it.
</persistence_reminder>

<file_metadata>
- **File**: ${fileName}
- **Path**: ${filePath}
- **Type**: ${componentType} (REQUIRED: Use this exact value - determined from file location)
</file_metadata>

<critical_instructions>
1. **Component Type**: MUST use "${componentType}" - this is determined from the file path, not content
2. **Export Type**: Identify whether it uses "named" or "default" export
3. **Client Component**: Check for 'use client' directive at the top of the file
4. **Props Extraction**: Extract from TypeScript interface/type definition, NOT from destructuring
5. **Variants**: Extract ONLY object key names from variant configuration objects
</critical_instructions>

<variant_extraction_rules>
**CORRECT - Extract these as variants:**
- Object keys from variant configurations: \`const variants = { solid: '...', outline: '...' }\` → ["solid", "outline"]
- Enum values for variant props: \`variant: 'primary' | 'secondary'\` → ["primary", "secondary"]
- Size configurations: \`const sizes = { sm: '...', md: '...', lg: '...' }\` → ["sm", "md", "lg"]

**INCORRECT - DO NOT extract these:**
- CSS pseudo-classes: hover:, focus:, active:, disabled: (these are NOT variants!)
- Tailwind modifiers: dark:, sm:, lg:, xl: (these are NOT variants!)
- State-related classes in className strings
- Random object properties that aren't variant configurations
</variant_extraction_rules>

<component_code>
\`\`\`typescript
${content}
\`\`\`
</component_code>

<extraction_checklist>
1. **name**: Component name from the export statement
2. **type**: Must be "${componentType}" (from file path)
3. **exportType**: "named" or "default"
4. **isClientComponent**: true if 'use client' directive exists
5. **props**: Array of { name, type, required, description }
6. **variants**: Array of variant names (NOT CSS classes)
7. **sizes**: Array of size options if applicable
8. **capabilities**: Boolean flags for common features
9. **dependencies**: All imports with their paths and types
10. **description**: Brief summary of component purpose
</extraction_checklist>

<capabilities_detection>
Check for these specific capabilities:
- **hasIcon**: Uses or displays icon components
- **hasChildren**: Accepts children prop for content
- **hasOnClick**: Has click event handler
- **hasClassName**: Accepts className for styling
- **extendsHTMLProps**: Extends native HTML element props (e.g., HTMLButtonElement)
</capabilities_detection>

<dependencies_analysis>
For each import statement:
- **name**: What is imported
- **path**: Import path
- **isLocal**: true if starts with '@/ui/' or './'
Mark dependencies as local vs external for proper categorization.
</dependencies_analysis>

<validation_before_return>
- Component name extracted correctly? ✓
- Type is "${componentType}"? ✓
- All props with their TypeScript types? ✓
- Variants are configuration keys, NOT CSS classes? ✓
- Dependencies categorized as local/external? ✓
</validation_before_return>

<final_reminder>
Return structured component metadata following the schema.
The type MUST be "${componentType}" as determined from the file path.
Do not invent or guess information - extract only what's in the code.
</final_reminder>`;
};

export default buildComponentAnalysisPrompt;