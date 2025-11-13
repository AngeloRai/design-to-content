/**
 * Design Tokens Extractor
 * Uses AI to analyze Figma variables and generate semantic design tokens
 * Merges with existing theme.css instead of replacing
 */

import fs from 'fs/promises';
import path from 'path';
import { getChatModel } from '../config/openai-client.ts';
import { z } from 'zod';
import type { DesignToken } from '../types/figma.js';

/**
 * Design tokens schema as arrays (compatible with OpenAI structured output)
 */
const TokenItemSchema = z.object({
  name: z.string().describe('CSS variable name (e.g., --color-primary-600)'),
  value: z.string().describe('CSS value (e.g., #1E40AF, 16px, 400)'),
  category: z.string().describe('Category name for organization')
});

const DesignTokensSchema = z.object({
  tokens: z.array(TokenItemSchema).describe('Array of all design tokens'),
  categories: z.array(z.string()).describe('List of unique category names'),
  recommendations: z.string().describe('Brief explanation of how tokens were organized')
});

type TokensResult = {
  tokens: DesignToken[];
  categories: Record<string, number>;
  recommendations?: string;
};

interface CodeSnippet {
  nodeId: string;
  code: string;
  metadata: Record<string, unknown>;
}

/**
 * Extract and organize design tokens using AI analysis
 */
export async function extractDesignTokens(
  variablesData: unknown,
  existingThemePath: string | null = null
): Promise<TokensResult> {
  console.log('━'.repeat(60));
  console.log('🤖 AI-Powered Design Token Extraction');
  console.log('━'.repeat(60));

  // Parse variables from MCP format
  let variablesObj: Record<string, unknown> = {};

  if (typeof variablesData === 'object' && variablesData !== null && !('content' in variablesData)) {
    variablesObj = variablesData as Record<string, unknown>;
  } else if (variablesData && typeof variablesData === 'object' && 'content' in variablesData) {
    const content = (variablesData as { content?: Array<{ text?: string }> }).content;
    if (content?.[0]?.text) {
      try {
        variablesObj = JSON.parse(content[0].text);
      } catch (e) {
        console.error('❌ Could not parse variables JSON');
        return { tokens: [], categories: {} };
      }
    }
  }

  const variableCount = Object.keys(variablesObj).length;
  console.log(`📊 Input: ${variableCount} Figma variables`);

  // Read existing theme if it exists
  let existingTokens: Record<string, string> | null = null;
  if (existingThemePath) {
    try {
      const existingCss = await fs.readFile(existingThemePath, 'utf-8');
      existingTokens = parseExistingTokens(existingCss);
      console.log(`📄 Existing theme: ${Object.keys(existingTokens).length} tokens found`);
    } catch (e) {
      console.log('📄 No existing theme file found');
    }
  }

  console.log('⚙️  Processing with AI...');

  // Use AI to analyze and organize tokens
  const model = getChatModel('gpt-4o').withStructuredOutput(DesignTokensSchema, {
    name: 'design_token_analysis'
  });

  const prompt = `You are a design system expert analyzing Figma design variables to create a semantic design token system for Tailwind CSS v4.

FIGMA VARIABLES:
${JSON.stringify(variablesObj, null, 2)}

${existingTokens ? `\nEXISTING TOKENS (merge with these, don't replace):\n${JSON.stringify(existingTokens, null, 2)}` : ''}

YOUR TASK:
1. Analyze the Figma variables and understand what they represent
2. Create SEMANTIC CSS variable names that work with Tailwind v4 @theme directive
3. ${existingTokens ? 'MERGE with existing tokens - update conflicts, add new ones, keep what makes sense' : 'Create a new token system'}

NAMING GUIDELINES:
- Colors: Use --color-* prefix
  - Primary brand: --color-primary-{shade}
  - Semantic: --color-error, --color-success, --color-warning
  - Neutrals: --color-neutral-{number}
  - Text: --color-text-{role}

- Typography: Use semantic prefixes
  - Families: --font-{role} (heading, body, mono)
  - Sizes: --font-size-{size} (sm, md, lg, xl, 2xl, etc.)
  - Weights: --font-weight-{name} (regular, medium, bold)
  - Line heights: --line-height-{size}

- Spacing: --spacing-{size} (xs, sm, md, lg, xl, 2xl, etc.)
- Border Radius: --radius-{size} (sm, md, lg, full)
- Shadows: --shadow-{intensity}

IMPORTANT:
- Be FLEXIBLE - if variables don't fit standard patterns, create appropriate names
- Keep exact values from Figma (don't change #ffffff to white)
- Use semantic names that developers will understand
- For colors, if you see patterns like #da1b31, name it based on its use (error, danger, red, etc.)
- Create a flat structure - all tokens in one object
- Group tokens by category for organization (categories object)

EXAMPLES:
Input: "Colors/Primary/Black": "#000000"
Output: "--color-primary-black": "#000000"

Input: "Font/Size/xl": "48"
Output: "--font-size-xl": "48px"

Input: "Border Radius/Border-radius-M": "12"
Output: "--radius-md": "12px"

Return:
1. tokens: array of token objects with {name, value, category}
2. categories: array of unique category names (strings)
3. recommendations: brief note on how you organized things`;

  const result = await model.invoke([
    {
      type: 'human',
      content: prompt
    }
  ]) as z.infer<typeof DesignTokensSchema>;

  // Log results
  console.log('✅ AI Analysis Complete');
  console.log('');
  console.log(`📦 Total Tokens: ${result.tokens.length}`);
  console.log('📊 Categories:');
  result.categories.forEach(category => {
    const tokensInCategory = result.tokens.filter(t => t.category === category);
    console.log(`   ${category}: ${tokensInCategory.length} tokens`);
  });
  console.log('');
  console.log(`💡 AI Recommendations:`);
  console.log(`   ${result.recommendations}`);
  console.log('━'.repeat(60));
  console.log('');

  // Convert to expected format
  const categoryCounts = result.tokens.reduce((acc: Record<string, number>, token) => {
    const cat = token.category || 'uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return {
    tokens: result.tokens as DesignToken[],
    categories: categoryCounts,
    recommendations: result.recommendations
  };
}

/**
 * Parse existing theme.css to extract current tokens
 */
function parseExistingTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  const themeRegex = /@theme\s*\{([^}]+)\}/s;
  const match = css.match(themeRegex);

  if (!match) return tokens;

  const content = match[1];
  const lines = content.split('\n');

  lines.forEach(line => {
    const tokenMatch = line.match(/^\s*(--[a-z0-9-]+):\s*([^;]+);/);
    if (tokenMatch) {
      tokens[tokenMatch[1]] = tokenMatch[2].trim();
    }
  });

  return tokens;
}

/**
 * Generate Tailwind v4 CSS using @theme directive
 * Organizes tokens by categories determined by AI
 */
export function generateTailwindV4Css(result: {
  tokens: DesignToken[];
  categories: string[];
  recommendations: string;
}): string {
  console.log('🎨 Generating Tailwind v4 CSS...');

  const { tokens, categories, recommendations } = result;

  const lines: string[] = [];

  lines.push('/**');
  lines.push(' * Design Tokens - Tailwind CSS v4');
  lines.push(' * Auto-generated from Figma design variables using AI analysis');
  lines.push(' * ');
  lines.push(` * ${recommendations}`);
  lines.push(' * ');
  lines.push(' * Usage in Tailwind:');
  lines.push(' * - bg-primary-600, text-error, border-neutral-200');
  lines.push(' * - font-heading, text-lg, font-bold');
  lines.push(' * - p-md, gap-sm, rounded-lg');
  lines.push(' */');
  lines.push('');
  lines.push('@theme {');

  // Organize tokens by categories
  categories.forEach(categoryName => {
    const tokensInCategory = tokens.filter(t => t.category === categoryName);
    if (tokensInCategory.length === 0) return;

    lines.push(`  /* ${categoryName} */`);
    tokensInCategory.forEach(token => {
      lines.push(`  ${token.name}: ${token.value};`);
    });
    lines.push('');
  });

  lines.push('}');
  lines.push('');

  const css = lines.join('\n');

  console.log(`✅ CSS generated (${css.split('\n').length} lines)`);

  return css;
}

/**
 * Infer design tokens from code snippets when Figma variables are not available
 * Uses AI to analyze CSS/code and extract design tokens
 */
export async function inferTokensFromCode(codeSnippets: CodeSnippet[]): Promise<TokensResult> {
  console.log('━'.repeat(60));
  console.log('🔍 AI-Powered Token Inference from Code');
  console.log('━'.repeat(60));

  console.log(`📊 Input: ${codeSnippets.length} code snippets to analyze`);
  console.log('⚙️  Processing with AI...');

  // Use AI to analyze code and extract tokens
  const model = getChatModel('gpt-4o').withStructuredOutput(DesignTokensSchema, {
    name: 'design_token_inference'
  });

  const prompt = `You are a design system expert analyzing code snippets to infer design tokens for Tailwind CSS v4.

CODE SNIPPETS TO ANALYZE:
${JSON.stringify(codeSnippets, null, 2)}

YOUR TASK:
1. Analyze the code snippets and extract design values:
   - Colors: Look for color values (#RRGGBB, rgb(), rgba(), named colors)
   - Typography: Look for font-family, font-size, font-weight, line-height
   - Spacing: Look for padding, margin, gap values
   - Border radius: Look for border-radius values
   - Shadows: Look for box-shadow values

2. Group similar values together and create SEMANTIC token names
3. Follow Tailwind v4 naming conventions

NAMING GUIDELINES:
- Colors: --color-{role}-{shade} or --color-{semantic}
  - Example: --color-primary-600, --color-error, --color-neutral-100
- Typography:
  - Families: --font-{role} (heading, body, mono)
  - Sizes: --font-size-{size} (xs, sm, md, lg, xl, 2xl, etc.)
  - Weights: --font-weight-{name} (light, regular, medium, bold)
  - Line heights: --line-height-{size}
- Spacing: --spacing-{size} (xs, sm, md, lg, xl, 2xl, etc.)
- Border Radius: --radius-{size} (sm, md, lg, full)
- Shadows: --shadow-{intensity} (sm, md, lg)

IMPORTANT:
- Be FLEXIBLE - create appropriate names based on what you find
- Keep exact values from the code
- If you see the same value used multiple times, create a single token
- Use semantic names that developers will understand
- Create a flat structure - all tokens in one object

EXAMPLES:
Code: "color: #da1b31" appears in error states
Output: "--color-error": "#da1b31"

Code: "font-size: 48px" used in headings
Output: "--font-size-2xl": "48px"

Code: "padding: 16px" used frequently
Output: "--spacing-md": "16px"

Return:
1. tokens: array of token objects with {name, value, category}
2. categories: array of unique category names (strings)
3. recommendations: brief note on how you organized things and what patterns you found`;

  const result = await model.invoke([
    {
      type: 'human',
      content: prompt
    }
  ]) as z.infer<typeof DesignTokensSchema>;

  // Log results
  console.log('✅ AI Analysis Complete');
  console.log('');
  console.log(`📦 Total Tokens: ${result.tokens.length}`);
  console.log('📊 Categories:');
  result.categories.forEach(category => {
    const tokensInCategory = result.tokens.filter(t => t.category === category);
    console.log(`   ${category}: ${tokensInCategory.length} tokens`);
  });
  console.log('');
  console.log(`💡 AI Recommendations:`);
  console.log(`   ${result.recommendations}`);
  console.log('━'.repeat(60));
  console.log('');

  // Convert to expected format
  const categoryCounts = result.tokens.reduce((acc: Record<string, number>, token) => {
    const cat = token.category || 'uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return {
    tokens: result.tokens as DesignToken[],
    categories: categoryCounts,
    recommendations: result.recommendations
  };
}

/**
 * Parse existing tokens from globals.css file
 * Extracts tokens from :root block (--ds-* variables) which are the source of truth
 * Falls back to @theme inline block if no :root design system block exists
 */
export async function parseGlobalCssTokens(cssPath: string): Promise<{
  tokens: DesignToken[];
  raw: string | null;
}> {
  console.log(`📖 Reading existing tokens from: ${cssPath}`);

  try {
    const cssContent = await fs.readFile(cssPath, 'utf-8');

    // Try to extract from :root design system block first (new format)
    const dsRootMatch = cssContent.match(/\/\* Design System Tokens[\s\S]*?:root\s*\{([^}]+)\}/);

    if (dsRootMatch) {
      const rootBlock = dsRootMatch[1];
      const tokens: DesignToken[] = [];

      // Parse --ds-* variables
      const varMatches = rootBlock.matchAll(/--ds-([^:]+):\s*([^;]+);/g);

      for (const match of varMatches) {
        const name = `--${match[1].trim()}`; // Remove ds- prefix for consistency
        const value = match[2].trim();

        tokens.push({
          name,
          value,
          category: 'existing' // Mark as existing to preserve
        });
      }

      console.log(`   ✅ Found ${tokens.length} existing design system tokens`);
      return { tokens, raw: cssContent };
    }

    // Fallback: Extract from @theme inline block (old format)
    const themeMatch = cssContent.match(/@theme inline\s*\{([^}]+)\}/s);

    if (!themeMatch) {
      console.log(`   ℹ️  No design system tokens found in file`);
      return { tokens: [], raw: cssContent };
    }

    const themeBlock = themeMatch[1];
    const tokens: DesignToken[] = [];

    // Parse CSS variables from theme block
    const varMatches = themeBlock.matchAll(/--([^:]+):\s*([^;]+);/g);

    for (const match of varMatches) {
      const name = `--${match[1].trim()}`;
      const value = match[2].trim();

      // Skip if it's a var() reference (means it's already using the new format)
      if (!value.startsWith('var(')) {
        tokens.push({
          name,
          value,
          category: 'existing'
        });
      }
    }

    console.log(`   ✅ Found ${tokens.length} existing tokens (legacy format)`);
    return { tokens, raw: cssContent };

  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`   ℹ️  File not found, will create new file`);
      return { tokens: [], raw: null };
    }
    throw error;
  }
}

/**
 * Merge new tokens with existing tokens (add only, never remove)
 */
export function mergeTokens(existingTokens: DesignToken[], newTokens: DesignToken[]): DesignToken[] {
  console.log('');
  console.log('🔀 Merging tokens...');
  console.log(`   Existing: ${existingTokens.length} tokens`);
  console.log(`   New: ${newTokens.length} tokens`);

  const existingNames = new Set(existingTokens.map(t => t.name));
  const merged = [...existingTokens];
  let addedCount = 0;

  // Add only new tokens that don't exist
  for (const token of newTokens) {
    if (!existingNames.has(token.name)) {
      merged.push(token);
      addedCount++;
      console.log(`   ➕ Adding: ${token.name}: ${token.value}`);
    }
  }

  console.log(`   ✅ Merged: ${merged.length} total tokens (${addedCount} new)`);
  console.log('');

  return merged;
}

/**
 * Update globals.css with merged tokens using CSS variables as source of truth
 * Creates two blocks:
 * 1. :root block with --ds-* CSS variables (design system variables)
 * 2. @theme inline block that references the CSS variables
 *
 * This approach allows:
 * - Runtime theming (override :root variables)
 * - JavaScript access to design tokens
 * - Single source of truth for all values
 */
export async function updateGlobalCss(
  cssPath: string,
  mergedTokens: DesignToken[],
  existingRaw: string | null
): Promise<void> {
  console.log(`💾 Updating global CSS: ${cssPath}`);
  console.log('   Using CSS variables as source of truth');

  // Group tokens by category
  const categories: Record<string, DesignToken[]> = {};
  for (const token of mergedTokens) {
    if (!categories[token.category]) {
      categories[token.category] = [];
    }
    categories[token.category].push(token);
  }

  // Generate :root block with design system variables
  let rootBlock = '/* Design System Tokens - Source of Truth */\n';
  rootBlock += ':root {\n';

  for (const [category, tokens] of Object.entries(categories)) {
    if (category !== 'existing') {
      rootBlock += `  /* ${category} */\n`;
    }
    for (const token of tokens) {
      // Convert --color-primary-black to --ds-color-primary-black
      const dsVarName = token.name.startsWith('--')
        ? `--ds-${token.name.slice(2)}`
        : `--ds-${token.name}`;
      rootBlock += `  ${dsVarName}: ${token.value};\n`;
    }
  }

  rootBlock += '}';

  // Parse existing @theme inline block to preserve non-design-system tokens
  const existingThemeTokens = new Set<string>();
  if (existingRaw) {
    const themeMatch = existingRaw.match(/@theme inline\s*\{([^}]+)\}/s);
    if (themeMatch) {
      const themeContent = themeMatch[1];
      const tokenMatches = themeContent.matchAll(/\s*(--[a-z0-9-]+):\s*([^;]+);/g);
      for (const match of tokenMatches) {
        const tokenName = match[1];
        const tokenValue = match[2];
        // Keep tokens that DON'T start with design system prefixes
        if (!tokenName.match(/^--(color-|font-|radius-|spacing-|line-height-)/)) {
          existingThemeTokens.add(`  ${tokenName}: ${tokenValue};`);
        }
      }
    }
  }

  // Generate @theme inline block that references CSS variables
  let themeBlock = '\n\n/* Tailwind Theme Configuration - References Design System Tokens */\n';
  themeBlock += '@theme inline {\n';

  // Add preserved existing tokens first (app-specific ones like --color-background, --font-sans)
  if (existingThemeTokens.size > 0) {
    themeBlock += '  /* Existing app tokens */\n';
    existingThemeTokens.forEach(token => {
      themeBlock += token + '\n';
    });
    themeBlock += '\n';
  }

  // Add design system tokens
  for (const [category, tokens] of Object.entries(categories)) {
    if (category !== 'existing') {
      themeBlock += `  /* ${category} */\n`;
    }
    for (const token of tokens) {
      const dsVarName = token.name.startsWith('--')
        ? `--ds-${token.name.slice(2)}`
        : `--ds-${token.name}`;
      themeBlock += `  ${token.name}: var(${dsVarName});\n`;
    }
  }

  themeBlock += '}';

  // Combine blocks
  const designSystemBlocks = rootBlock + themeBlock;

  // Replace or insert blocks
  let updatedCss: string;
  if (existingRaw) {
    let cleanedCss = existingRaw;

    // Remove old :root block with --ds-* variables (if exists)
    cleanedCss = cleanedCss.replace(/:root\s*\{[^}]*--ds-[^}]*\}/gs, '');

    // Remove old @theme inline blocks (all of them - we've already preserved app-specific tokens above)
    cleanedCss = cleanedCss.replace(/@theme inline\s*\{[^}]*\}/gs, '');

    // Insert new design system blocks after imports
    const importMatches = cleanedCss.match(/(@import[^;]+;)/g);

    if (importMatches) {
      const lastImport = importMatches[importMatches.length - 1];
      const lastImportIndex = cleanedCss.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;

      updatedCss = cleanedCss.slice(0, insertIndex) + '\n\n' + designSystemBlocks + '\n' + cleanedCss.slice(insertIndex);
    } else {
      updatedCss = designSystemBlocks + '\n\n' + cleanedCss;
    }

    // Clean up: remove orphaned design system comments and excessive newlines
    updatedCss = updatedCss.replace(/\/\* Design System[^\n]*\n\s*\n\s*\n/g, '');
    updatedCss = updatedCss.replace(/\/\* Tailwind Theme[^\n]*\n\s*\n\s*\n/g, '');
    updatedCss = updatedCss.replace(/\n{4,}/g, '\n\n\n'); // Max 2 blank lines
  } else {
    // Create new file with basic structure
    updatedCss = `@import "tailwindcss";\n\n${designSystemBlocks}\n`;
  }

  // Write file
  const dir = path.dirname(cssPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(cssPath, updatedCss, 'utf-8');

  console.log(`✅ Global CSS updated successfully`);
  console.log(`   📊 ${mergedTokens.length} tokens in :root block`);
  console.log(`   🎨 ${mergedTokens.length} Tailwind mappings in @theme block`);
  console.log('');
}

/**
 * Save design tokens CSS to file
 */
export async function saveDesignTokens(css: string, outputPath: string): Promise<void> {
  console.log(`💾 Saving design tokens to: ${outputPath}`);

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  // Write file
  await fs.writeFile(outputPath, css, 'utf-8');

  console.log(`✅ Design tokens saved successfully`);
}
