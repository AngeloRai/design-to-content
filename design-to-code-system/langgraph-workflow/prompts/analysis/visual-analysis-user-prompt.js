#!/usr/bin/env node

/**
 * USER PROMPT FOR VISUAL ANALYSIS
 *
 * This prompt is sent to the AI with the screenshot and metadata
 * Instructs the AI on how to analyze the design and identify components
 */

export function buildVisualAnalysisUserPrompt(componentMetadata) {
  return `Analyze this design screenshot and identify reusable React components.

IMPORTANT INSTRUCTIONS:
1. PRIMARY SOURCE: Your visual analysis of the screenshot is the MAIN and MOST RELIABLE source
2. SECONDARY CONTEXT: The metadata below is supplementary context ONLY - use it for hints about exact values, NOT as the definitive list of components
3. IDENTIFY COMPONENTS VISUALLY FIRST: Look at the image and identify distinct, reusable UI patterns
4. USE METADATA FOR DETAILS: After identifying a component visually, reference metadata for exact spacing/colors/variant names

METADATA (supplementary context only):
${JSON.stringify(componentMetadata, null, 2)}

What the metadata provides:
- Exact spacing values (padding, gap) - use these for accuracy
- Exact color hex codes - use these for precision
- Variant property names (e.g., "State=Active") - use these as prop name hints
- Text content and colors - use these to understand text styling
- Layout direction - use this to understand flex direction

CRITICAL RULES:
- DO NOT treat each metadata entry as a separate component
- If metadata shows "Button Variants", "Button Sizes", "Button States" - these are examples of ONE Button component with different variants
- Group related visual patterns into a single component with variants
- Only include components you can clearly SEE and identify in the screenshot
- Ignore metadata entries that seem like structural containers or unclear labels

EXCLUDE THE FOLLOWING (these are NOT reusable components):
- Page navigation/tabs at the top (Foundations, Atoms, Molecules, etc.) - this is UI chrome
- Headers, footers, or page layout elements
- Section titles or documentation text
- The page background or container frames

ONLY INCLUDE:
- Atomic UI components (buttons, inputs, badges, avatars, etc.)
- Components that would be reused across multiple pages
- Interactive elements with clear visual boundaries
- Components shown with multiple variants/states/sizes

Focus on identifying atomic, reusable components suitable for a React component library.`;
}

export default buildVisualAnalysisUserPrompt;
