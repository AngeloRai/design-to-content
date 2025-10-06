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
          "variantName": "[variant-name]",
          "visualProperties": {
            "backgroundColor": "#[hex-from-figma]",
            "textColor": "#[hex-from-figma]",
            "borderColor": "[color-or-transparent]",
            "borderWidth": "[number]",
            "borderRadius": "[number]px",
            "padding": "[vertical]px [horizontal]px",
            "fontSize": "[number]px",
            "fontWeight": "[number]",
            "shadow": "[value-or-null]"
          },
          "composition": {
            "containsComponents": ["[ComponentName-if-any]"],
            "layoutPattern": "[pattern-or-null]",
            "contentElements": ["[element-description]"]
          }
        }
        // ... COMPLETE ALL VARIANTS - one entry per styleVariant
      ],

      "interactiveBehaviors": [
        {
          "trigger": "[user-action]",
          "effect": "[expected-behavior]",
          "stateIndicators": ["[visual-feedback]"]
        }
      ]
    }
  ]
}

VARIANT COMPOSITION ANALYSIS:

For each variant, analyze both the CONTAINER and CONTENTS:

1. Container: Visual properties (colors, borders, spacing) - in visualProperties
2. Contents: What's inside the variant - in composition object

composition fields:
- containsComponents: Child components used (e.g., ["Button", "Input"] for a form modal)
- layoutPattern: How content is arranged (e.g., "form-vertical", "image-hero", "grid-2-col")
- contentElements: Specific elements visible (e.g., ["name-input", "email-input", "submit-button"])

Example Modal Analysis:
{
  variantName: "form",
  visualProperties: { /* container styles */ },
  composition: {
    containsComponents: ["Input", "Button"],
    layoutPattern: "form-vertical",
    contentElements: ["name-input", "email-input", "message-textarea", "submit-button"]
  }
}

INTERACTIVE BEHAVIOR ANALYSIS:

Look for signs of interactivity in the design:
- Clickable elements (buttons, page numbers, tabs, links)
- State indicators (active page highlighted, disabled button grayed)
- Multi-step flows (pagination showing numbers, wizards with steps)
- Toggle/expandable sections

For each interactive pattern found, document:
- trigger: User action (e.g., "click-page-number", "click-next", "hover")
- effect: Expected behavior (e.g., "navigate-to-page", "increment-page", "show-tooltip")
- stateIndicators: Visual feedback (e.g., ["active-page-highlighted", "disabled-prev-button", "hover-darkens"])

Example Pagination:
interactiveBehaviors: [
  {
    trigger: "click-page-number",
    effect: "navigate-to-page",
    stateIndicators: ["active-page-has-dark-background", "inactive-pages-are-white"]
  },
  {
    trigger: "click-next",
    effect: "increment-current-page",
    stateIndicators: ["disabled-when-last-page", "hover-underline"]
  }
]

CRITICAL COMPLETENESS RULE:
- variantVisualMap MUST have the SAME number of entries as styleVariants
- If you identify 7 styleVariants, you MUST provide 7 variantVisualMap entries
- NEVER leave variants incomplete
- backgroundColor is REQUIRED for every variant (use "transparent" if no fill)
- composition is REQUIRED for each variant (use empty arrays/null if simple)
- interactiveBehaviors is REQUIRED if component shows interactive patterns

VALIDATION CHECKLIST (verify before returning):
1. styleVariants.length === variantVisualMap.length for each component
2. Every variantVisualMap entry has backgroundColor (required)
3. Every variantVisualMap entry has composition object (required)
4. Interactive components have interactiveBehaviors array
5. No Bootstrap colors unless actually visible in screenshot`;
}

export default buildVisualAnalysisPrompt;
