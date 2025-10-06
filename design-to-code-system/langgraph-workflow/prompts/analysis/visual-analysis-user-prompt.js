#!/usr/bin/env node

/**
 * VISUAL ANALYSIS USER PROMPT - Color-Override Approach
 *
 * Strategy:
 * - Let Vision AI analyze component structure and variants
 * - Inject EXACT colors from Figma API to override Vision hallucinations
 * - Minimal metadata noise, maximum color accuracy
 */

import { formatColorPaletteForPrompt } from '../../utils/extract-colors-from-metadata.js';

export function buildVisualAnalysisUserPrompt(componentMetadata) {
  const colorInfo = componentMetadata ? formatColorPaletteForPrompt(componentMetadata) : '';

  return `Analyze this design screenshot and identify reusable React components.

${colorInfo}

ANALYSIS APPROACH:
1. Visually identify distinct component types (buttons, inputs, cards, etc.)
2. For each component type, identify ALL visible variants
3. For colors: Use the EXACT colors from the Figma API list above
4. For other properties (spacing, sizing, borders): Measure from the visual

COMPONENT DETECTION RULES:

1. REPEATING VISUAL PATTERNS = Component with Variants
   - Multiple instances of the same visual structure with different content
   - Example: Text blocks at different sizes/weights = Text component with variants
   - Example: Multiple button styles = Button component with styleVariants

2. LABELED SECTIONS = Component Showcases (NOT Documentation)
   - Section headers like "Typography", "Buttons", "Forms", "Cards"
   - Items under these headers are variants of that component type
   - These ARE the design system, not documentation about it

3. SINGLE INSTANCES WITH DESCRIPTIVE LABELS = Reusable Components
   - "Responsive Image" with one example = Image component
   - "Default Search" with one example = SearchBar component
   - Labels indicate reusable patterns, not one-off content

4. TEXT HIERARCHY = Text/Typography Component
   - Headings at different levels (H1, H2, H3, H4)
   - Body text in different sizes (Large, Medium, Small)
   - Specialized text (Caption, Label)
   - → Group as ONE Text/Typography component with variants

COMPONENT GROUPING RULE:
Group similar components by FUNCTION, not appearance.
- Example: 10 different button styles = ONE Button component with 10 styleVariants
- NOT: PrimaryButton, SecondaryButton, IconButton as separate components

WHAT TO INCLUDE:
✓ Text/Typography components showing hierarchy (H1, H2, body, caption)
✓ Image components with responsive or layout patterns
✓ Atomic UI components (buttons, inputs, badges, avatars, separators)
✓ Components with single examples but clear labels indicating reusability
✓ Components showing multiple variants/states/sizes
✓ All items under labeled sections (Typography, Buttons, Forms, etc.)

WHAT TO EXCLUDE:
✗ Page chrome (top-level navigation bars, footers)
✗ Layout containers or page backgrounds
✗ One-off decorative elements
✗ Content placeholders (lorem ipsum without component context)

COLOR FIDELITY RULES (ABSOLUTELY CRITICAL):

The Figma API provides the EXACT colors used in this design (listed above).

REQUIRED:
✓ Use ONLY colors from the Figma API list above
✓ Match visual colors to Figma hex values precisely
✓ For non-colored elements, use "transparent", "none", or null

FORBIDDEN:
✗ NEVER invent, guess, or hallucinate hex colors
✗ NEVER use colors not in the Figma API list
✗ NEVER use framework/library default colors
✗ NEVER approximate - use exact Figma hex values

PROCESS:
1. Identify component color visually (e.g., "this button looks red")
2. Find matching color in Figma API list above (e.g., #ef4444)
3. Use that EXACT hex value in your response
4. If color seems missing from list, use closest match from Figma API

Remember: Figma API = source of truth. Your vision = confirmation only.

Focus on atomic, reusable components for a React component library.`;
}

export default buildVisualAnalysisUserPrompt;
