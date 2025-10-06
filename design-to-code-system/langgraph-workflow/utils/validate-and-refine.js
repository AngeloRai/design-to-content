#!/usr/bin/env node

/**
 * VALIDATE AND REFINE - Ensure AI provides complete, accurate component analysis
 *
 * Problem: AI sometimes provides incomplete variantVisualMap arrays
 * Solution: Validate completeness, send back to AI for refinement if needed
 *
 * This ensures pixel-perfect accuracy rather than using fallback defaults.
 */

/**
 * Validate that each component has complete variantVisualMap
 * @param {Object} analysisResult - AI analysis result
 * @returns {Object} { isValid: boolean, issues: Array<{componentName, missing}> }
 */
export function validateVariantCompleteness(analysisResult) {
  const issues = [];

  if (!analysisResult?.components) {
    return { isValid: false, issues: [{ error: 'No components in analysis result' }] };
  }

  analysisResult.components.forEach(component => {
    const { name, styleVariants, variantVisualMap } = component;

    if (!styleVariants || !Array.isArray(styleVariants)) {
      issues.push({
        componentName: name,
        error: 'Missing or invalid styleVariants array'
      });
      return;
    }

    if (!variantVisualMap || !Array.isArray(variantVisualMap)) {
      issues.push({
        componentName: name,
        error: 'Missing or invalid variantVisualMap array',
        expected: styleVariants.length,
        actual: 0,
        missingVariants: styleVariants
      });
      return;
    }

    // Check if lengths match
    if (styleVariants.length !== variantVisualMap.length) {
      const providedVariants = new Set(variantVisualMap.map(v => v.variantName));
      const missingVariants = styleVariants.filter(v => !providedVariants.has(v));

      issues.push({
        componentName: name,
        error: 'Incomplete variantVisualMap',
        expected: styleVariants.length,
        actual: variantVisualMap.length,
        missingVariants
      });
    }

    // Check that each variant has required visual properties
    variantVisualMap.forEach(variant => {
      if (!variant.visualProperties) {
        issues.push({
          componentName: name,
          variantName: variant.variantName,
          error: 'Missing visualProperties object'
        });
        return;
      }

      // backgroundColor is REQUIRED
      if (!variant.visualProperties.backgroundColor) {
        issues.push({
          componentName: name,
          variantName: variant.variantName,
          error: 'Missing required backgroundColor'
        });
      }
    });
  });

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Validate AI only used colors from Figma API
 * Universal - works for ANY design system, ANY colors
 * @param {Object} analysisResult - AI analysis
 * @param {Object} designTokens - Extracted Figma colors
 * @returns {Object} validation result
 */
export function validateColorFidelity(analysisResult, designTokens) {
  const issues = [];

  // Build set of ALL valid colors from Figma
  const validFigmaColors = new Set();
  if (designTokens?.colors) {
    designTokens.colors.forEach(c => {
      validFigmaColors.add(c.hex.toLowerCase());
    });
  }

  // Helper to check if a color value is valid
  const isValidColor = (colorValue) => {
    if (!colorValue) return true; // null/undefined is ok
    const lower = colorValue.toLowerCase();

    // Check against Figma colors
    if (validFigmaColors.has(lower)) return true;

    // Check if it's a non-color value (transparent, none, null, etc.)
    if (lower === 'transparent' || lower === 'none' || lower === 'null' || lower === 'inherit') return true;

    // Everything else is invalid (hallucinated)
    return false;
  };

  // Check all color references in analysis
  analysisResult.components?.forEach(component => {
    // Check designTokens.colors
    component.designTokens?.colors?.forEach((colorDef, idx) => {
      if (!isValidColor(colorDef.hex)) {
        issues.push({
          component: component.name,
          location: `designTokens.colors[${idx}]`,
          variant: colorDef.variant,
          invalidColor: colorDef.hex,
          message: 'Color not found in Figma API'
        });
      }
    });

    // Check variantVisualMap
    component.variantVisualMap?.forEach(variant => {
      const props = variant.visualProperties || {};

      ['backgroundColor', 'textColor', 'borderColor'].forEach(field => {
        if (!isValidColor(props[field])) {
          issues.push({
            component: component.name,
            variant: variant.variantName,
            location: `variantVisualMap.${field}`,
            invalidColor: props[field],
            message: 'Color not found in Figma API'
          });
        }
      });
    });
  });

  return {
    isValid: issues.length === 0,
    issues,
    figmaColorCount: validFigmaColors.size,
    figmaColors: Array.from(validFigmaColors)
  };
}

/**
 * Build refinement prompt for AI to complete missing variants
 * @param {Object} analysisResult - Original analysis result
 * @param {Array} issues - Validation issues
 * @param {Object} designTokens - Figma extracted colors
 * @returns {string} Refinement prompt
 */
export function buildRefinementPrompt(analysisResult, issues, designTokens) {
  // Group issues by component
  const componentIssues = new Map();
  issues.forEach(issue => {
    if (issue.componentName) {
      if (!componentIssues.has(issue.componentName)) {
        componentIssues.set(issue.componentName, []);
      }
      componentIssues.get(issue.componentName).push(issue);
    }
  });

  let prompt = `Your previous analysis was incomplete. Please complete the missing variant visual specifications.

AVAILABLE FIGMA COLORS (use ONLY these):
${designTokens?.colors?.map(c => `${c.hex} (${c.type})`).join('\n') || 'No color data available'}

CRITICAL RULES:
- Use ONLY colors from the list above
- Measure actual visual properties from the screenshot
- Do NOT use framework defaults or guess colors
- backgroundColor is REQUIRED (use "transparent" if no fill)

`;

  // Add details for each component with issues
  componentIssues.forEach((issueList, componentName) => {
    const component = analysisResult.components.find(c => c.name === componentName);

    prompt += `\n## ${componentName}\n`;

    issueList.forEach(issue => {
      if (issue.missingVariants && issue.missingVariants.length > 0) {
        prompt += `\n**Missing variants:** You provided ${issue.actual}/${issue.expected} variantVisualMap entries.\n`;
        prompt += `You must complete these missing variants:\n`;
        issue.missingVariants.forEach(variantName => {
          prompt += `- ${variantName}\n`;
        });

        // Show what was already provided as reference
        if (component?.variantVisualMap && component.variantVisualMap.length > 0) {
          prompt += `\n**Reference (already provided):**\n\`\`\`json\n`;
          prompt += JSON.stringify(component.variantVisualMap[0], null, 2);
          prompt += `\n\`\`\`\n`;
          prompt += `\nProvide the same level of detail for the missing variants.\n`;
        }
      } else {
        prompt += `\n**Issue:** ${issue.error}\n`;
      }
    });
  });

  prompt += `\n\n**Return ONLY the missing/corrected variantVisualMap entries** in this format:

\`\`\`json
{
  "componentName": "Button",
  "variantVisualMap": [
    {
      "variantName": "outline",
      "visualProperties": {
        "backgroundColor": "transparent",
        "textColor": "#000000",
        "borderColor": "#000000",
        "borderWidth": "1px",
        "borderRadius": "4px",
        "padding": "12px 24px",
        "fontSize": "14px",
        "fontWeight": "500",
        "shadow": null
      }
    }
  ]
}
\`\`\`

IMPORTANT:
- Measure actual colors from the screenshot (no Bootstrap defaults)
- Provide exact spacing, sizing, and border values
- Set properties to null only if truly not applicable
- backgroundColor is REQUIRED for every variant (use "transparent" if no background)`;

  return prompt;
}

/**
 * Refine analysis by asking AI to complete missing variants
 * @param {Object} llm - Language model instance (unused, kept for compatibility)
 * @param {Object} analysisResult - Original analysis result
 * @param {Array} issues - Validation issues
 * @param {string} screenshotUrl - Original screenshot URL
 * @param {Object} schema - Zod schema for refinement
 * @param {Object} designTokens - Figma extracted colors
 * @returns {Promise<Object>} Refined analysis result
 */
export async function refineIncompleteAnalysis(llm, analysisResult, issues, screenshotUrl, schema, designTokens) {
  console.log(`\n🔧 Refining analysis - ${issues.length} issue(s) found`);

  issues.forEach(issue => {
    if (issue.missingVariants) {
      console.log(`   ${issue.componentName}: ${issue.actual}/${issue.expected} variants (missing: ${issue.missingVariants.join(', ')})`);
    } else {
      console.log(`   ${issue.componentName}: ${issue.error}`);
    }
  });

  const refinementPrompt = buildRefinementPrompt(analysisResult, issues, designTokens);

  // Build refinement schema - just need the missing components
  const RefinementSchema = schema.pick({ components: true });

  // Create FRESH LLM instance (don't reuse passed model which already has structuredOutput)
  const { ChatOpenAI } = await import("@langchain/openai");
  const freshLlm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.1,
    maxTokens: 3000,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const structuredLlm = freshLlm.withStructuredOutput(RefinementSchema, {
    method: "json_schema",
    name: "extract_missing_variants",
    strict: true
  });

  const refinement = await structuredLlm.invoke([
    {
      role: "user",
      content: [
        { type: "text", text: refinementPrompt },
        { type: "image_url", image_url: { url: screenshotUrl } }
      ]
    }
  ]);

  // Merge refinement back into original analysis
  const mergedResult = mergeRefinement(analysisResult, refinement, issues);

  console.log(`✅ Refinement complete`);

  return mergedResult;
}

/**
 * Merge refinement data back into original analysis
 * @param {Object} original - Original analysis result
 * @param {Object} refinement - Refinement data from AI
 * @param {Array} issues - Validation issues
 * @returns {Object} Merged result
 */
function mergeRefinement(original, refinement, issues) {
  const result = JSON.parse(JSON.stringify(original)); // Deep clone

  if (!refinement?.components) {
    console.warn('⚠️  Refinement returned no components, returning original');
    return result;
  }

  // Merge each refined component
  refinement.components.forEach(refinedComponent => {
    const originalComponent = result.components.find(c => c.name === refinedComponent.name);

    if (!originalComponent) {
      console.warn(`⚠️  Refined component "${refinedComponent.name}" not found in original`);
      return;
    }

    // Merge variantVisualMap entries
    if (refinedComponent.variantVisualMap && Array.isArray(refinedComponent.variantVisualMap)) {
      const existingVariants = new Set(
        (originalComponent.variantVisualMap || []).map(v => v.variantName)
      );

      refinedComponent.variantVisualMap.forEach(refinedVariant => {
        if (!existingVariants.has(refinedVariant.variantName)) {
          // Add missing variant
          if (!originalComponent.variantVisualMap) {
            originalComponent.variantVisualMap = [];
          }
          originalComponent.variantVisualMap.push(refinedVariant);
          console.log(`   Added: ${originalComponent.name}/${refinedVariant.variantName}`);
        } else {
          // Update existing variant (in case it was incomplete)
          const idx = originalComponent.variantVisualMap.findIndex(
            v => v.variantName === refinedVariant.variantName
          );
          originalComponent.variantVisualMap[idx] = refinedVariant;
          console.log(`   Updated: ${originalComponent.name}/${refinedVariant.variantName}`);
        }
      });
    }
  });

  return result;
}

export default {
  validateVariantCompleteness,
  validateColorFidelity,
  buildRefinementPrompt,
  refineIncompleteAnalysis
};
