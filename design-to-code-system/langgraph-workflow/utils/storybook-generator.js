#!/usr/bin/env node

/**
 * STORYBOOK GENERATOR
 *
 * Generates Storybook stories from component inventory
 * Creates .stories.tsx files for each component with CSF3 format
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

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

      // Generate story for each component
      for (const component of components) {
        // Skip invalid component names
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(component.name)) {
          continue;
        }

        try {
          const storyContent = buildStoryFile(component, category, uiBasePath);

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
 * Build a complete story file for a component
 */
const buildStoryFile = (component, category, uiBasePath) => {
  const { name, exportType, props, variants, capabilities } = component;

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

  // Generate stories based on variants
  const stories = generateStoryExamples(component);

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
 * Generate story examples for a component
 */
const generateStoryExamples = (component) => {
  const { name, props, variants, capabilities } = component;
  const stories = [];

  // Extract variants from props first (more reliable than inventory.variants)
  const propsVariants = extractVariantsFromProps(props);
  const variantsToUse = propsVariants.length > 0 ? propsVariants : (variants || []);

  // If has variants, create a story for each variant
  if (variantsToUse.length > 0) {
    // Deduplicate variants to prevent duplicate story exports
    const uniqueVariants = [...new Set(variantsToUse)];
    const usedStoryNames = new Set();

    uniqueVariants.forEach(variant => {
      const storyName = toValidIdentifier(variant);

      // Skip if story name already used (handles case-insensitive duplicates)
      if (usedStoryNames.has(storyName)) {
        console.warn(`⚠️  Skipping duplicate story name: ${storyName} for component ${name}`);
        return;
      }
      usedStoryNames.add(storyName);

      const args = generateArgsForVariant(props, variant);

      stories.push(`
/**
 * ${storyName} variant
 */
export const ${storyName}: Story = {
  args: ${JSON.stringify(args, null, 4)},
};`);
    });
  } else {
    // Generate a default story with required props
    const defaultArgs = generateDefaultArgs(props, capabilities);

    stories.push(`
/**
 * Default ${name} example
 */
export const Default: Story = {
  args: ${JSON.stringify(defaultArgs, null, 4)},
};`);

    // Add example with custom styling if supports className
    if (capabilities?.hasClassName) {
      const styledArgs = {
        ...defaultArgs,
        className: 'shadow-lg border-2'
      };

      stories.push(`
/**
 * With custom styling
 */
export const WithStyling: Story = {
  args: ${JSON.stringify(styledArgs, null, 4)},
};`);
    }

    // Add example with children if supports them
    if (capabilities?.hasChildren && !defaultArgs.children) {
      const withChildrenArgs = {
        ...defaultArgs,
        children: 'Custom content'
      };

      stories.push(`
/**
 * With custom content
 */
export const WithContent: Story = {
  args: ${JSON.stringify(withChildrenArgs, null, 4)},
};`);
    }
  }

  return stories.join('\n');
};

/**
 * Generate args for a specific variant
 */
const generateArgsForVariant = (props, variant) => {
  const args = {};

  if (!props) return args;

  props.forEach(prop => {
    // Set variant prop
    if (prop.name === 'variant' || prop.name === 'type') {
      args[prop.name] = variant;
    }
    // Set required props
    else if (prop.required) {
      args[prop.name] = generatePropValue(prop);
    }
  });

  return args;
};

/**
 * Generate default args for a component
 */
const generateDefaultArgs = (props, capabilities) => {
  const args = {};

  if (!props) return args;

  props.forEach(prop => {
    if (prop.required) {
      args[prop.name] = generatePropValue(prop);
    }
  });

  // Add default children if component supports them
  if (capabilities?.hasChildren && !args.children) {
    args.children = 'Example';
  }

  return args;
};

/**
 * Generate a sample value for a prop based on its type
 */
const generatePropValue = (prop) => {
  const { type, name } = prop;

  // Handle union types (e.g., 'numeric' | 'status')
  if (type.includes('|')) {
    const options = type.split('|').map(t => t.trim().replace(/'/g, ''));
    return options[0]; // Return first option
  }

  // Handle specific prop names
  if (name === 'className') return '';
  if (name === 'children') return 'Example content';
  if (name.toLowerCase().includes('label')) return 'Label';
  if (name.toLowerCase().includes('title')) return 'Title';
  if (name.toLowerCase().includes('text')) return 'Text';

  // Handle common types
  if (type.includes('string')) return 'Example';
  if (type.includes('number')) return 0;
  if (type.includes('boolean')) return true;

  // Default
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

export default {
  generateStories
};
