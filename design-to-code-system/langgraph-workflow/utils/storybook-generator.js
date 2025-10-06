#!/usr/bin/env node

/**
 * STORYBOOK GENERATOR
 *
 * Generates Storybook stories from component inventory
 * Creates .stories.tsx files for each component with CSF3 format
 * Uses AI to generate meaningful, context-aware story args
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { ChatOpenAI } from "@langchain/openai";
import { getComponentPlaceholderImage } from './placeholder-images.js';
import { StoryArgsSchema } from '../schemas/component-schemas.js';

// AI model for generating story args
const storyGenModel = new ChatOpenAI({
  model: "gpt-4o-mini",  // Fast and cheap for this task
  temperature: 0.3,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

/**
 * Clean up old story files before generating new ones
 */
const cleanupOldStories = async (storiesDir) => {
  try {
    if (fsSync.existsSync(storiesDir)) {
      console.log(`🧹 Cleaning up old stories in ${storiesDir}...`);
      const entries = await fs.readdir(storiesDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(storiesDir, entry.name);
        if (entry.isDirectory()) {
          // Recursively remove category directories
          await fs.rm(fullPath, { recursive: true, force: true });
        } else if (entry.name.endsWith('.stories.tsx')) {
          // Remove story files
          await fs.unlink(fullPath);
        }
      }
      console.log(`✓ Cleanup complete`);
    }
  } catch (error) {
    console.warn(`⚠️  Failed to cleanup old stories: ${error.message}`);
  }
};

/**
 * Generate Storybook stories from component inventory
 */
export const generateStories = async (inventoryPath, storiesDir, uiBasePath = null) => {
  try {
    // Read the inventory file
    const inventoryContent = await fs.readFile(inventoryPath, 'utf-8');
    const inventory = JSON.parse(inventoryContent);

    // Determine UI base path (defaults to nextjs-app/ui relative to inventory location)
    if (!uiBasePath) {
      const inventoryDir = path.dirname(inventoryPath);
      uiBasePath = path.join(inventoryDir, '..', 'nextjs-app', 'ui');
    }

    // Ensure stories directory exists
    await fs.mkdir(storiesDir, { recursive: true });

    // Clean up old stories before generating new ones
    await cleanupOldStories(storiesDir);

    const results = {
      generated: [],
      skipped: [],
      errors: []
    };

    // Generate stories for each category
    for (const [category, components] of Object.entries(inventory.byCategory)) {
      if (components.length === 0) continue;

      // Create category directory
      const categoryDir = path.join(storiesDir, category);
      await fs.mkdir(categoryDir, { recursive: true });

      // Generate story for each component (sequentially for AI calls)
      for (const component of components) {
        // Skip invalid component names
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(component.name)) {
          continue;
        }

        try {
          console.log(`  → Generating story for ${component.name}...`);
          const storyContent = await buildStoryFile(component, category, uiBasePath);

          // Skip if buildStoryFile returned null (component file doesn't exist)
          if (storyContent === null) {
            results.skipped.push({
              name: component.name,
              category,
              reason: 'Component file not found'
            });
            continue;
          }

          const storyPath = path.join(categoryDir, `${component.name}.stories.tsx`);
          await fs.writeFile(storyPath, storyContent, 'utf-8');

          results.generated.push({
            name: component.name,
            category,
            path: storyPath
          });
        } catch (error) {
          results.errors.push({
            name: component.name,
            category,
            error: error.message
          });
        }
      }
    }

    return {
      success: true,
      totalGenerated: results.generated.length,
      totalSkipped: results.skipped.length,
      totalErrors: results.errors.length,
      generated: results.generated,
      skipped: results.skipped,
      errors: results.errors
    };
  } catch (error) {
    console.error('Failed to generate stories:', error);
    throw error;
  }
};

/**
 * Build a complete story file for a component (AI-powered)
 */
const buildStoryFile = async (component, category, uiBasePath) => {
  const { name, exportType, props } = component;

  // Validate component file exists before creating story
  const componentFilePath = path.join(uiBasePath, category, `${name}.tsx`);
  if (!fsSync.existsSync(componentFilePath)) {
    console.warn(`⚠️  Skipping story for ${name}: component file not found at ${componentFilePath}`);
    return null;
  }

  // Build import statement
  const importPath = `@/ui/${category}/${name}`;
  const importStatement = exportType === 'named'
    ? `import { ${name} } from '${importPath}';`
    : `import ${name} from '${importPath}';`;

  // Build argTypes for interactive controls
  const argTypes = buildArgTypes(props);

  // Generate stories using AI
  const stories = await generateStoryExamples(component);

  return `import type { Meta, StoryObj } from '@storybook/react';
${importStatement}

/**
 * ${name} component
 *
 * Auto-generated from component inventory
 * Category: ${category}
 */
const meta = {
  title: '${capitalizeFirst(category)}/${name}',
  component: ${name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],${argTypes ? `\n  argTypes: ${argTypes},` : ''}
} satisfies Meta<typeof ${name}>;

export default meta;
type Story = StoryObj<typeof meta>;

${stories}
`;
};

/**
 * Build argTypes for Storybook controls
 */
const buildArgTypes = (props) => {
  if (!props || props.length === 0) return null;

  const argTypes = {};

  props.forEach(prop => {
    const argType = {};

    // Determine control type based on prop type
    if (prop.type.includes('|')) {
      // Union type - use select control
      const options = prop.type
        .split('|')
        .map(t => t.trim().replace(/['"]/g, ''));

      argType.control = 'select';
      argType.options = options;
    } else if (prop.type.includes('boolean')) {
      argType.control = 'boolean';
    } else if (prop.type.includes('number')) {
      argType.control = 'number';
    } else if (prop.type.includes('string')) {
      argType.control = 'text';
    }

    // Add description
    argType.description = prop.required ? 'Required' : 'Optional';

    argTypes[prop.name] = argType;
  });

  return JSON.stringify(argTypes, null, 4);
};

/**
 * Extract variant values from component props
 * Looks for 'variant' or 'type' prop and parses union type values
 */
const extractVariantsFromProps = (props) => {
  if (!props || props.length === 0) return [];

  // Find variant or type prop
  const variantProp = props.find(p => p.name === 'variant' || p.name === 'type');
  if (!variantProp || !variantProp.type) return [];

  // Parse union type: "'value1' | 'value2' | 'value3'"
  if (variantProp.type.includes('|')) {
    const variants = variantProp.type
      .split('|')
      .map(v => v.trim().replace(/^['"]|['"]$/g, '')) // Remove quotes
      .filter(v => v && v !== 'string'); // Filter empty and generic types
    return [...new Set(variants)]; // Deduplicate
  }

  return [];
};

/**
 * Generate story examples for a component (AI-powered)
 */
const generateStoryExamples = async (component) => {
  const { name, props, variants, capabilities } = component;
  const stories = [];

  // Extract variants from props first (more reliable than inventory.variants)
  const propsVariants = extractVariantsFromProps(props);
  const variantsToUse = propsVariants.length > 0 ? propsVariants : (variants || []);

  // If has variants, create a story for each variant
  if (variantsToUse.length > 0) {
    const uniqueVariants = [...new Set(variantsToUse)];
    const usedStoryNames = new Set();

    for (const variant of uniqueVariants) {
      const storyName = toValidIdentifier(variant);

      if (usedStoryNames.has(storyName)) {
        continue;
      }
      usedStoryNames.add(storyName);

      // Use AI to generate args
      const args = await generateArgsForVariantWithAI(component, variant, capabilities);

      stories.push(`
/**
 * ${storyName} variant
 */
export const ${storyName}: Story = {
  args: ${JSON.stringify(args, null, 4)},
};`);
    }
  } else {
    // Use AI for default story too
    const args = await generateArgsForVariantWithAI(component, 'default', capabilities);

    stories.push(`
/**
 * Default ${name} example
 */
export const Default: Story = {
  args: ${JSON.stringify(args, null, 4)},
};`);
  }

  return stories.join('\n');
};

/**
 * Use AI to generate meaningful story args for a variant
 * Falls back to rule-based generation if AI fails
 */
const generateArgsForVariantWithAI = async (component, variant, capabilities) => {
  const { name, props } = component;

  // Generate placeholder image URLs for image-type props
  const imagePlaceholders = {};
  if (props) {
    props.forEach(prop => {
      const propLower = prop.name.toLowerCase();
      // Detect image-related props
      if (propLower.includes('src') || propLower.includes('image') ||
          propLower.includes('url') || propLower.includes('avatar') ||
          propLower.includes('photo') || propLower.includes('background')) {
        imagePlaceholders[prop.name] = getComponentPlaceholderImage(name, prop.name);
      }
    });
  }

  try {
    const prompt = `You are a Storybook expert. Generate realistic, presentable args for a component story.

Component: ${name}
Variant: ${variant}
Props: ${JSON.stringify(props, null, 2)}
Capabilities: ${JSON.stringify(capabilities, null, 2)}

${Object.keys(imagePlaceholders).length > 0 ? `
IMAGE PROP PLACEHOLDERS (use these exact URLs):
${Object.entries(imagePlaceholders).map(([key, url]) => `- ${key}: "${url}"`).join('\n')}
` : ''}

Requirements:
1. Set the variant/type prop to "${variant}"
2. Provide all required props
3. ${capabilities?.hasChildren ? 'IMPORTANT: Include meaningful children content (e.g., button text, card content)' : 'No children needed'}
4. ${capabilities?.hasClassName ? 'You can add className if helpful, but leave empty string if not needed' : ''}
5. For image props (src, imageUrl, avatar, etc.), use the exact URLs provided above
6. Make the content realistic and testable (real-world example data)
7. Keep it simple and focused on showcasing the variant

Return an array of key-value pairs. Example:
[
  {"key": "variant", "value": "${variant}"},
  {"key": "children", "value": "Primary Button"},
  {"key": "src", "value": "https://ui-avatars.com/api/..."}
]`;

    const modelWithSchema = storyGenModel.withStructuredOutput(StoryArgsSchema, { name: "story_args" });
    const result = await modelWithSchema.invoke(prompt);

    // Convert array of key-value pairs to object
    const argsObject = {};
    result.args.forEach(({ key, value }) => {
      argsObject[key] = value;
    });

    return argsObject;
  } catch (error) {
    console.warn(`⚠️  AI args generation failed for ${name}/${variant}, using fallback: ${error.message}`);
    // Fallback to rule-based generation
    return generateArgsForVariantFallback(props, variant, capabilities, name);
  }
};

/**
 * Fallback: Generate args for a specific variant (rule-based)
 */
const generateArgsForVariantFallback = (props, variant, capabilities, componentName) => {
  const args = {};

  if (!props) return args;

  props.forEach(prop => {
    // Set variant prop
    if (prop.name === 'variant' || prop.name === 'type') {
      args[prop.name] = variant;
    }
    // Set required props
    else if (prop.required) {
      args[prop.name] = generatePropValue(prop, variant, componentName);
    }
  });

  // Add children if component supports them
  if (capabilities?.hasChildren && !args.children) {
    // Format variant name nicely (capitalize words)
    const formatted = variant
      .split(/[-_\s]+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    // Use formatted variant name as-is
    args.children = formatted;
  }

  return args;
};

/**
 * Simple fallback for generating prop values
 * Used only when AI fails
 */
const generatePropValue = (prop, variant, componentName) => {
  const { type, name } = prop;

  // Check if this is an image-related prop
  const nameLower = name.toLowerCase();
  const isImageProp = nameLower.includes('src') || nameLower.includes('image') ||
                      nameLower.includes('url') || nameLower.includes('avatar') ||
                      nameLower.includes('photo') || nameLower.includes('background');

  if (isImageProp) {
    return getComponentPlaceholderImage(componentName, name);
  }

  if (type.includes('|')) {
    return type.split('|')[0].trim().replace(/'/g, '');
  }

  if (name === 'className') return '';
  if (name === 'children') return 'Button';
  if (type.includes('string')) return 'Example';
  if (type.includes('number')) return 0;
  if (type.includes('boolean')) return true;

  return undefined;
};

/**
 * Capitalize first letter of a string
 */
const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert variant name to valid JavaScript identifier (PascalCase)
 * Handles kebab-case, snake_case, and other formats
 * Examples: "solid-black" -> "SolidBlack", "outline_white" -> "OutlineWhite"
 */
const toValidIdentifier = (str) => {
  if (!str) return '';

  // Split on hyphens, underscores, or spaces
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

/**
 * Build story file content for a single component (AI-powered)
 * Exported for use in other contexts
 * @param skipFileCheck - Set to true to skip component file existence validation
 */
export const buildStoryFileContent = async (component, category, uiBasePath = null, skipFileCheck = false) => {
  const { name, exportType, props } = component;

  // Validate component file exists (unless explicitly skipped)
  if (!skipFileCheck && uiBasePath) {
    const componentFilePath = path.join(uiBasePath, category, `${name}.tsx`);
    if (!fsSync.existsSync(componentFilePath)) {
      console.warn(`⚠️  Skipping story for ${name}: component file not found at ${componentFilePath}`);
      return null;
    }
  }

  // Build import statement
  const importPath = `@/ui/${category}/${name}`;
  const importStatement = exportType === 'named'
    ? `import { ${name} } from '${importPath}';`
    : `import ${name} from '${importPath}';`;

  // Build argTypes for interactive controls
  const argTypes = buildArgTypes(props);

  // Generate stories using AI
  const stories = await generateStoryExamples(component);

  return `import type { Meta, StoryObj } from '@storybook/react';
${importStatement}

/**
 * ${name} component
 *
 * Auto-generated from component inventory
 * Category: ${category}
 */
const meta = {
  title: '${capitalizeFirst(category)}/${name}',
  component: ${name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],${argTypes ? `\n  argTypes: ${argTypes},` : ''}
} satisfies Meta<typeof ${name}>;

export default meta;
type Story = StoryObj<typeof meta>;

${stories}
`;
};

export default {
  generateStories,
  buildStoryFileContent
};
