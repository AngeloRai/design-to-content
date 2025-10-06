#!/usr/bin/env node

/**
 * VISUAL ANALYSIS PROMPT 
 *
 * Principles:
 * - Strictness in schema, not prose
 * - Only reference fields that exist in AnalysisSchema
 * - Focus on critical rules: color accuracy, variant completeness
 * - Removed: ~200 lines of overlapping/redundant instructions
 */

export function buildVisualAnalysisPrompt() {
  return `Analyze this UI design screenshot and extract component specifications.

CRITICAL COLOR RULE:
Measure actual pixel colors from the image. NEVER use framework defaults (#007bff, #6c757d, #dc3545) unless actually visible. If a button is black, use #000000 not #007bff.

VARIANT COMPLETENESS RULE:
Every variant in styleVariants MUST have a matching entry in variantVisualMap with complete visual properties.

COMPONENT GROUPING:
Group similar components by function, not appearance. Example: 10 different button styles = ONE Button component with 10 styleVariants (NOT IconButton, ChatButton, OutlineButton as separate components).

Return JSON with this STREAMLINED structure (focus on essentials):

{
  "summary": "Brief description of components found",
  "componentCount": <number>,
  "components": [
    {
      "name": "Button|Input|Card|...",
      "atomicLevel": "atom|molecule|organism",
      "description": "Component purpose and usage notes",

      "styleVariants": ["primary", "secondary", "outline", "ghost", "destructive"],
      "sizeVariants": ["small", "default", "large"],
      "otherVariants": ["with-icon", "icon-only"],

      "states": ["default", "hover", "disabled"],

      "props": [
        {"name": "onClick", "type": "function", "required": true},
        {"name": "disabled", "type": "boolean", "required": false}
      ],

      "variantVisualMap": [
        {
          "variantName": "primary",
          "visualProperties": {
            "backgroundColor": "#000000",
            "textColor": "#ffffff",
            "borderColor": "transparent",
            "borderWidth": "0",
            "borderRadius": "4px",
            "padding": "12px 24px",
            "fontSize": "14px",
            "fontWeight": "500",
            "shadow": null
          }
        },
        {
          "variantName": "secondary",
          "visualProperties": {
            "backgroundColor": "#f0f0f0",
            "textColor": "#000000",
            "borderColor": "transparent",
            "borderWidth": "0",
            "borderRadius": "4px",
            "padding": "12px 24px",
            "fontSize": "14px",
            "fontWeight": "500",
            "shadow": null
          }
        }
        // ... COMPLETE ALL VARIANTS - one entry per styleVariant
      ]
    }
  ]
}

CRITICAL COMPLETENESS RULE:
- variantVisualMap MUST have the SAME number of entries as styleVariants
- If you identify 7 styleVariants, you MUST provide 7 variantVisualMap entries
- NEVER leave variants incomplete
- backgroundColor is REQUIRED for every variant (use "transparent" if no fill)
- Other properties can be null if not applicable

VALIDATION CHECKLIST (verify before returning):
1. styleVariants.length === variantVisualMap.length for each component
2. Every variantVisualMap entry has backgroundColor (required)
3. No Bootstrap colors unless actually visible in screenshot`;
}

export default buildVisualAnalysisPrompt;
