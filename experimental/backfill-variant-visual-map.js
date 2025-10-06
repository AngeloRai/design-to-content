#!/usr/bin/env node

/**
 * BACKFILL VARIANT VISUAL MAP
 *
 * Problem: AI often provides incomplete variantVisualMap despite having all the data
 * - styleVariants: ["primary", "secondary", "outline", ...] (7 items)
 * - variantVisualMap: [{variantName: "primary", ...}] (1 item) ❌
 * - But designTokens.colors has all 7 variants with exact colors! ✓
 *
 * Solution: Programmatically build complete variantVisualMap from AI's own data
 * - Use styleVariants as source of truth for variant names
 * - Use designTokens.colors to map colors to each variant
 * - Fill in reasonable defaults for missing properties
 *
 * This leverages AI's strengths (identifying variants, extracting colors)
 * while compensating for its weakness (strict array completeness)
 */

/**
 * Build complete variantVisualMap from partial AI data
 * @param {Object} component - Component from AI analysis
 * @returns {Array} Complete variantVisualMap with entry for each styleVariant
 */
export function backfillVariantVisualMap(component) {
  const { styleVariants, designTokens, variantVisualMap } = component;

  if (!styleVariants || styleVariants.length === 0) {
    return variantVisualMap || [];
  }

  // If already complete, return as-is
  if (variantVisualMap && variantVisualMap.length === styleVariants.length) {
    return variantVisualMap;
  }

  // Build color lookup from designTokens
  const colorsByVariant = new Map();

  if (designTokens?.colors) {
    designTokens.colors.forEach(colorDef => {
      const variant = colorDef.variant || 'default';
      if (!colorsByVariant.has(variant)) {
        colorsByVariant.set(variant, {});
      }

      const variantColors = colorsByVariant.get(variant);

      if (colorDef.role === 'background') {
        variantColors.backgroundColor = colorDef.hex;
      } else if (colorDef.role === 'text') {
        variantColors.textColor = colorDef.hex;
      } else if (colorDef.role === 'border') {
        variantColors.borderColor = colorDef.hex;
      }
    });
  }

  // Build spacing lookup
  const defaultSpacing = designTokens?.spacing?.[0]?.value || '12px 24px';

  // Build typography lookup
  const defaultTypography = designTokens?.typography?.[0] || {
    fontSize: '14px',
    fontWeight: '500'
  };

  // Build border lookup
  const bordersByVariant = new Map();
  if (designTokens?.borders) {
    designTokens.borders.forEach(borderDef => {
      const variant = borderDef.variant || 'default';
      bordersByVariant.set(variant, {
        width: borderDef.width,
        color: borderDef.color,
        radius: borderDef.radius
      });
    });
  }

  // Create existing map for quick lookup
  const existingMap = new Map(
    (variantVisualMap || []).map(v => [v.variantName, v])
  );

  // Build complete variantVisualMap
  const completeMap = styleVariants.map(variantName => {
    // If already exists, use it
    if (existingMap.has(variantName)) {
      return existingMap.get(variantName);
    }

    // Otherwise, construct from designTokens
    const colors = colorsByVariant.get(variantName) || {};
    const borders = bordersByVariant.get(variantName) || bordersByVariant.get('default') || {};

    return {
      variantName,
      visualProperties: {
        backgroundColor: colors.backgroundColor || 'transparent',
        textColor: colors.textColor || null,
        borderColor: borders.color || colors.borderColor || 'transparent',
        borderWidth: borders.width || '0',
        borderRadius: borders.radius || '4px',
        padding: defaultSpacing,
        fontSize: defaultTypography.fontSize,
        fontWeight: defaultTypography.fontWeight,
        shadow: null
      }
    };
  });

  return completeMap;
}

/**
 * Process entire analysis result and backfill all components
 * @param {Object} analysisResult - Full AI analysis result
 * @returns {Object} Analysis with complete variantVisualMaps
 */
export function backfillAllComponents(analysisResult) {
  if (!analysisResult?.components) {
    return analysisResult;
  }

  const processedComponents = analysisResult.components.map(component => {
    const completeVariantVisualMap = backfillVariantVisualMap(component);

    // Log if we had to backfill
    const original = component.variantVisualMap?.length || 0;
    const complete = completeVariantVisualMap.length;
    if (complete > original) {
      console.log(`  🔧 Backfilled ${component.name}: ${original} → ${complete} variants`);
    }

    return {
      ...component,
      variantVisualMap: completeVariantVisualMap
    };
  });

  return {
    ...analysisResult,
    components: processedComponents
  };
}

export default {
  backfillVariantVisualMap,
  backfillAllComponents
};
