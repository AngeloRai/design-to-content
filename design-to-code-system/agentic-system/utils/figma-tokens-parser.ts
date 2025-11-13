/**
 * Figma Design Tokens Parser
 * Extracts design tokens/variables from Figma and converts to CSS variables
 */

/**
 * Token value type - can be a string, nested object, or token with $value
 */
type TokenValue = string | number | { $value?: string | number; [key: string]: unknown };

/**
 * Nested token structure
 */
interface TokenObject {
  $value?: string | number;
  [key: string]: TokenValue | TokenObject | undefined;
}

/**
 * CSS Variables structure grouped by category
 */
interface CSSVariables {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  typography: Record<string, string>;
}

/**
 * Tailwind extensions structure
 */
interface TailwindExtensions {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  fontSize: Record<string, [string, { lineHeight: string }]>;
  lineHeight: Record<string, string>;
  fontFamily: Record<string, string>;
}

/**
 * Token collection mode structure
 */
interface TokenMode {
  [tokenName: string]: TokenObject | TokenValue;
}

/**
 * Token collection structure
 */
interface TokenCollection {
  [collectionName: string]: {
    modes: {
      [modeName: string]: TokenMode;
    };
  };
}

/**
 * Parse result structure
 */
interface ParseResult {
  cssVariables: CSSVariables;
  tailwindExtensions: TailwindExtensions;
}

/**
 * Tailwind config structure
 */
interface TailwindConfig {
  theme: {
    extend: TailwindExtensions;
  };
}

/**
 * Resolve token references like {Colors.Primary.Black} to actual values
 */
function resolveTokenReferences(value: unknown, allTokens: TokenObject): string {
  if (typeof value !== 'string') return String(value);

  // Match pattern: {Collection.Group.Token}
  const refPattern = /^\{(.+)\}$/;
  const match = value.match(refPattern);

  if (!match) return value;

  // Navigate through the token path
  const path = match[1].split('.');
  let current: unknown = allTokens;

  for (const key of path) {
    if (!current || typeof current !== 'object') return value;
    current = (current as Record<string, unknown>)[key];
  }

  // Extract $value if it's a token object
  if (current && typeof current === 'object' && '$value' in current) {
    return String((current as { $value: unknown }).$value);
  }

  return String(current) || value;
}

/**
 * Convert Figma variable name to CSS variable name
 * Example: "color-text-primary-black" → "--color-text-primary-black"
 */
function toCSSVariableName(name: string): string {
  return `--${name.toLowerCase().replace(/\s+/g, '-')}`;
}

/**
 * Convert Figma variable name to Tailwind utility name
 * Example: "color-text-primary-black" → "text-primary-black"
 */
function toTailwindUtilityName(name: string, type: string): string {
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
export function parseFigmaTokens(tokenCollections: TokenCollection[]): ParseResult {
  const cssVariables: CSSVariables = {
    colors: {},
    spacing: {},
    typography: {}
  };

  const tailwindExtensions: TailwindExtensions = {
    colors: {},
    spacing: {},
    fontSize: {},
    lineHeight: {},
    fontFamily: {}
  };

  // First pass: collect all primitive values for reference resolution
  const allPrimitives: TokenObject = {};

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
          if (categoryTokens && typeof categoryTokens === 'object') {
            Object.entries(categoryTokens).forEach(([name, token]) => {
              if (token && typeof token === 'object' && '$value' in token) {
                const value = resolveTokenReferences(token.$value, allPrimitives);
                const cssVar = toCSSVariableName(name);
                const tailwindName = toTailwindUtilityName(name, 'color');

                cssVariables.colors[cssVar] = value;
                tailwindExtensions.colors[tailwindName] = `var(${cssVar})`;
              }
            });
          }
        }
      });
    }

    // Process primitive colors
    if (tokens.Colors && typeof tokens.Colors === 'object') {
      Object.entries(tokens.Colors).forEach(([group, groupColors]) => {
        if (groupColors && typeof groupColors === 'object') {
          Object.entries(groupColors).forEach(([name, colorToken]) => {
            if (colorToken && typeof colorToken === 'object' && '$value' in colorToken) {
              const cssVar = toCSSVariableName(`color-${group}-${name}`);
              cssVariables.colors[cssVar] = String(colorToken.$value);
              tailwindExtensions.colors[`${group.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, '-')}`] = `var(${cssVar})`;
            }
          });
        }
      });
    }

    // Process spacing tokens
    if (tokens.Spacing && typeof tokens.Spacing === 'object') {
      Object.entries(tokens.Spacing).forEach(([name, token]) => {
        if (token && typeof token === 'object' && '$value' in token) {
          const value = typeof token.$value === 'number' ? `${token.$value}px` :
                       resolveTokenReferences(token.$value, allPrimitives);
          const cssVar = toCSSVariableName(`spacing-${name}`);
          const tailwindName = name.replace(/^spacing-/, '');

          cssVariables.spacing[cssVar] = value;
          tailwindExtensions.spacing[tailwindName] = `var(${cssVar})`;
        }
      });
    }

    // Process typography tokens
    if (tokens.Font && typeof tokens.Font === 'object') {
      const fontToken = tokens.Font as TokenObject;

      // Font families
      if (fontToken.Family && typeof fontToken.Family === 'object') {
        Object.entries(fontToken.Family).forEach(([name, token]) => {
          if (token && typeof token === 'object' && '$value' in token) {
            const cssVar = toCSSVariableName(`font-family-${name}`);
            cssVariables.typography[cssVar] = String(token.$value);
            tailwindExtensions.fontFamily[name.toLowerCase()] = `var(${cssVar})`;
          }
        });
      }

      // Font sizes
      if (fontToken.Size && typeof fontToken.Size === 'object') {
        Object.entries(fontToken.Size).forEach(([name, token]) => {
          if (token && typeof token === 'object' && '$value' in token) {
            const value = `${token.$value}px`;
            const cssVar = toCSSVariableName(`font-size-${name}`);
            cssVariables.typography[cssVar] = value;

            // Get corresponding line height if exists
            const lineHeightToken = fontToken['Line-Height'];
            let lineHeightValue = '1.5';
            if (lineHeightToken && typeof lineHeightToken === 'object') {
              const lhToken = (lineHeightToken as TokenObject)[name];
              if (lhToken && typeof lhToken === 'object' && '$value' in lhToken) {
                lineHeightValue = `${lhToken.$value}px`;
              }
            }

            tailwindExtensions.fontSize[name] = [`var(${cssVar})`, { lineHeight: lineHeightValue }];
          }
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
export function generateCSSVariables(cssVariables: CSSVariables): string {
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
export function generateTailwindConfig(tailwindExtensions: TailwindExtensions): TailwindConfig {
  return {
    theme: {
      extend: tailwindExtensions
    }
  };
}
