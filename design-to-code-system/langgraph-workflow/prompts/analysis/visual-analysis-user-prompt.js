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

COMPONENT GROUPING RULE:
Group similar components by FUNCTION, not appearance.
- Example: 10 different button styles = ONE Button component with 10 styleVariants
- NOT: PrimaryButton, SecondaryButton, IconButton as separate components

WHAT TO INCLUDE:
✓ Atomic UI components (buttons, inputs, badges, avatars, separators)
✓ Components with clear reuse potential
✓ Interactive elements with distinct visual boundaries
✓ Components showing multiple variants/states/sizes

WHAT TO EXCLUDE:
✗ Page chrome (headers, footers, navigation tabs)
✗ Section titles or documentation labels
✗ Layout containers or page backgrounds
✗ One-off decorative elements

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
