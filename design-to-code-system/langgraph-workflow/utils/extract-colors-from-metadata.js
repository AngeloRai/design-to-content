#!/usr/bin/env node

/**
 * EXTRACT COLORS FROM FIGMA METADATA
 *
 * Solves Vision LLM color hallucination by providing exact colors from Figma API.
 * Vision models see "primary button = blue" due to training bias.
 * Figma API provides actual colors: backgroundColor: ["#000000"]
 *
 * This utility extracts ONLY colors, avoiding the noise of full metadata.
 */

/**
 * Extract unique colors from design tokens or component metadata
 * @param {Object} data - Either designTokens from extractDesignTokens() or componentMetadata from extractComponentMetadata()
 * @returns {Object} Color palette with usage context
 */
export function extractColorPalette(data) {
  // Check if this is design tokens (has .colors array with .hex)
  if (data?.colors && Array.isArray(data.colors) && data.colors.length > 0 && data.colors[0].hex) {
    // This is from extractDesignTokens
    const colors = data.colors.map(color => ({
      hex: color.hex,
      roles: [color.type], // 'fill' or 'stroke'
      usedIn: color.contexts.map(c => c.nodeName).slice(0, 3)
    }));

    return {
      colors,
      totalUnique: colors.length,
      hint: 'These are the EXACT colors from Figma. Use these instead of guessing from visual appearance.'
    };
  }

  // Fallback to component metadata approach
  if (!data?.instances) {
    return { colors: [], hint: 'No metadata available' };
  }

  const colorMap = new Map();

  data.instances.forEach(instance => {
    const props = instance.visualProperties;
    if (!props) return;

    // Background colors
    if (props.backgroundColor && Array.isArray(props.backgroundColor)) {
      props.backgroundColor.forEach(color => {
        if (color && color.startsWith('#')) {
          const key = color.toLowerCase();
          if (!colorMap.has(key)) {
            colorMap.set(key, {
              hex: color,
              roles: new Set(),
              components: new Set()
            });
          }
          colorMap.get(key).roles.add('background');
          colorMap.get(key).components.add(instance.name.split(/[=,]/)[0].trim());
        }
      });
    }

    // Text colors
    if (props.textColor && props.textColor.startsWith('#')) {
      const key = props.textColor.toLowerCase();
      if (!colorMap.has(key)) {
        colorMap.set(key, {
          hex: props.textColor,
          roles: new Set(),
          components: new Set()
        });
      }
      colorMap.get(key).roles.add('text');
      colorMap.get(key).components.add(instance.name.split(/[=,]/)[0].trim());
    }

    // Border colors
    if (props.borderColor && Array.isArray(props.borderColor)) {
      props.borderColor.forEach(color => {
        if (color && color.startsWith('#')) {
          const key = color.toLowerCase();
          if (!colorMap.has(key)) {
            colorMap.set(key, {
              hex: color,
              roles: new Set(),
              components: new Set()
            });
          }
          colorMap.get(key).roles.add('border');
          colorMap.get(key).components.add(instance.name.split(/[=,]/)[0].trim());
        }
      });
    }

    // Extract colors from children (for text inside buttons, etc.)
    if (props.children && Array.isArray(props.children)) {
      props.children.forEach(child => {
        if (child.color && child.color.startsWith('#')) {
          const key = child.color.toLowerCase();
          if (!colorMap.has(key)) {
            colorMap.set(key, {
              hex: child.color,
              roles: new Set(),
              components: new Set()
            });
          }
          colorMap.get(key).roles.add('text');
          colorMap.get(key).components.add(instance.name.split(/[=,]/)[0].trim());
        }

        if (child.backgroundColor && child.backgroundColor.startsWith('#')) {
          const key = child.backgroundColor.toLowerCase();
          if (!colorMap.has(key)) {
            colorMap.set(key, {
              hex: child.backgroundColor,
              roles: new Set(),
              components: new Set()
            });
          }
          colorMap.get(key).roles.add('background');
          colorMap.get(key).components.add(instance.name.split(/[=,]/)[0].trim());
        }
      });
    }
  });

  // Convert to array and format
  const colors = Array.from(colorMap.values()).map(colorData => ({
    hex: colorData.hex,
    roles: Array.from(colorData.roles),
    usedIn: Array.from(colorData.components).slice(0, 3) // Sample components
  }));

  // Sort by usage frequency (more roles = more important)
  colors.sort((a, b) => b.roles.length - a.roles.length);

  return {
    colors,
    totalUnique: colors.length,
    hint: 'These are the EXACT colors from Figma. Use these instead of guessing from visual appearance.'
  };
}

/**
 * Format color palette for AI prompt
 * Returns a concise string that can be injected into prompt
 */
export function formatColorPaletteForPrompt(componentMetadata) {
  const palette = extractColorPalette(componentMetadata);

  if (palette.colors.length === 0) {
    return 'No color information available from Figma metadata.';
  }

  let output = `ACTUAL COLORS FROM FIGMA API (use these, not visual guesses):\n\n`;

  palette.colors.forEach((color, index) => {
    output += `${index + 1}. ${color.hex}\n`;
    output += `   Roles: ${color.roles.join(', ')}\n`;
    output += `   Used in: ${color.usedIn.join(', ')}\n`;
    if (index < palette.colors.length - 1) output += '\n';
  });

  output += `\nIMPORTANT: These ${palette.totalUnique} colors are from Figma's actual data. `;
  output += `Do NOT use framework defaults like #007bff, #6c757d, #dc3545. `;
  output += `If you see a black button in the image, verify it matches #000000 from this list.`;

  return output;
}

export default {
  extractColorPalette,
  formatColorPaletteForPrompt
};
