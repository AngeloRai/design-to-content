/**
 * Figma Design Tokens Parser
 * Extracts design tokens/variables from Figma and converts to CSS variables
 */

/**
 * Resolve token references like {Colors.Primary.Black} to actual values
 */
function resolveTokenReferences(value, allTokens) {
  if (typeof value !== 'string') return value;

  // Match pattern: {Collection.Group.Token}
  const refPattern = /^\{(.+)\}$/;
  const match = value.match(refPattern);

  if (!match) return value;

  // Navigate through the token path
  const path = match[1].split('.');
  let current = allTokens;

  for (const key of path) {
    if (!current || typeof current !== 'object') return value;
    current = current[key];
  }

  return current?.$value || value;
}

/**
 * Convert Figma variable name to CSS variable name
 * Example: "color-text-primary-black" → "--color-text-primary-black"
 */
function toCSSVariableName(name) {
  return `--${name.toLowerCase().replace(/\s+/g, '-')}`;
}

/**
 * Convert Figma variable name to Tailwind utility name
 * Example: "color-text-primary-black" → "text-primary-black"
 */
function toTailwindUtilityName(name, type) {
  const cleaned = name.toLowerCase().replace(/^color-/, '').replace(/\s+/g, '-');

  // Remove redundant prefixes based on type
  if (type === 'color') {
    return cleaned.replace(/^(text|background|bg|border)-/, '');
  }
  if (type === 'spacing') {
    return cleaned.replace(/^spacing-/, '');
  }

  return cleaned;
}

/**
 * Parse Figma tokens and generate CSS variables + Tailwind config
 */
export function parseFigmaTokens(tokenCollections) {
  const cssVariables = {
    colors: {},
    spacing: {},
    typography: {}
  };

  const tailwindExtensions = {
    colors: {},
    spacing: {},
    fontSize: {},
    lineHeight: {},
    fontFamily: {}
  };

  // First pass: collect all primitive values for reference resolution
  const allPrimitives = {};

  tokenCollections.forEach(collection => {
    const collectionName = Object.keys(collection)[0];
    const modes = collection[collectionName]?.modes;

    if (!modes) return;

    // For now, use the first mode (usually "Mode 1" or "Desktop")
    const firstMode = Object.keys(modes)[0];
    const tokens = modes[firstMode];

    // Store primitives for reference resolution
    if (collectionName === 'Primitives') {
      Object.assign(allPrimitives, tokens);
    }
  });

  // Second pass: process tokens and resolve references
  tokenCollections.forEach(collection => {
    const collectionName = Object.keys(collection)[0];
    const modes = collection[collectionName]?.modes;

    if (!modes) return;

    const firstMode = Object.keys(modes)[0];
    const tokens = modes[firstMode];

    // Process color tokens
    if (tokens['Text Colors'] || tokens['Background Colors']) {
      Object.entries(tokens).forEach(([category, categoryTokens]) => {
        if (category.toLowerCase().includes('color')) {
          Object.entries(categoryTokens).forEach(([name, token]) => {
            const value = resolveTokenReferences(token.$value, allPrimitives);
            const cssVar = toCSSVariableName(name);
            const tailwindName = toTailwindUtilityName(name, 'color');

            cssVariables.colors[cssVar] = value;
            tailwindExtensions.colors[tailwindName] = `var(${cssVar})`;
          });
        }
      });
    }

    // Process primitive colors
    if (tokens.Colors) {
      Object.entries(tokens.Colors).forEach(([group, groupColors]) => {
        Object.entries(groupColors).forEach(([name, colorToken]) => {
          const cssVar = toCSSVariableName(`color-${group}-${name}`);
          cssVariables.colors[cssVar] = colorToken.$value;
          tailwindExtensions.colors[`${group.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, '-')}`] = `var(${cssVar})`;
        });
      });
    }

    // Process spacing tokens
    if (tokens.Spacing) {
      Object.entries(tokens.Spacing).forEach(([name, token]) => {
        const value = typeof token.$value === 'number' ? `${token.$value}px` :
                     resolveTokenReferences(token.$value, allPrimitives);
        const cssVar = toCSSVariableName(`spacing-${name}`);
        const tailwindName = name.replace(/^spacing-/, '');

        cssVariables.spacing[cssVar] = value;
        tailwindExtensions.spacing[tailwindName] = `var(${cssVar})`;
      });
    }

    // Process typography tokens
    if (tokens.Font) {
      // Font families
      if (tokens.Font.Family) {
        Object.entries(tokens.Font.Family).forEach(([name, token]) => {
          const cssVar = toCSSVariableName(`font-family-${name}`);
          cssVariables.typography[cssVar] = token.$value;
          tailwindExtensions.fontFamily[name.toLowerCase()] = `var(${cssVar})`;
        });
      }

      // Font sizes
      if (tokens.Font.Size) {
        Object.entries(tokens.Font.Size).forEach(([name, token]) => {
          const value = `${token.$value}px`;
          const cssVar = toCSSVariableName(`font-size-${name}`);
          cssVariables.typography[cssVar] = value;

          // Get corresponding line height if exists
          const lineHeight = tokens.Font['Line-Height']?.[name]?.$value;
          const lineHeightValue = lineHeight ? `${lineHeight}px` : '1.5';

          tailwindExtensions.fontSize[name] = [`var(${cssVar})`, { lineHeight: lineHeightValue }];
        });
      }
    }
  });

  return {
    cssVariables,
    tailwindExtensions
  };
}

/**
 * Generate CSS file content with design token variables
 */
export function generateCSSVariables(cssVariables) {
  const lines = [':root {'];

  // Add color variables
  if (Object.keys(cssVariables.colors).length > 0) {
    lines.push('  /* Color Tokens */');
    Object.entries(cssVariables.colors).forEach(([name, value]) => {
      lines.push(`  ${name}: ${value};`);
    });
    lines.push('');
  }

  // Add spacing variables
  if (Object.keys(cssVariables.spacing).length > 0) {
    lines.push('  /* Spacing Tokens */');
    Object.entries(cssVariables.spacing).forEach(([name, value]) => {
      lines.push(`  ${name}: ${value};`);
    });
    lines.push('');
  }

  // Add typography variables
  if (Object.keys(cssVariables.typography).length > 0) {
    lines.push('  /* Typography Tokens */');
    Object.entries(cssVariables.typography).forEach(([name, value]) => {
      lines.push(`  ${name}: ${value};`);
    });
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate Tailwind config extension
 */
export function generateTailwindConfig(tailwindExtensions) {
  return {
    theme: {
      extend: tailwindExtensions
    }
  };
}
