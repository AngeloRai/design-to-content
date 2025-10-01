#!/usr/bin/env node

/**
 * STORYBOOK GENERATOR
 *
 * Generates Storybook stories from component inventory
 * Creates .stories.tsx files for each component with CSF3 format
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Generate Storybook stories from component inventory
 */
export const generateStories = async (inventoryPath, storiesDir) => {
  try {
    // Read the inventory file
    const inventoryContent = await fs.readFile(inventoryPath, 'utf-8');
    const inventory = JSON.parse(inventoryContent);

    // Ensure stories directory exists
    await fs.mkdir(storiesDir, { recursive: true });

    const results = {
      generated: [],
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
          const storyContent = buildStoryFile(component, category);
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
      totalErrors: results.errors.length,
      generated: results.generated,
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
const buildStoryFile = (component, category) => {
  const { name, exportType, props, variants, capabilities } = component;

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
 * Generate story examples for a component
 */
const generateStoryExamples = (component) => {
  const { name, props, variants, capabilities } = component;
  const stories = [];

  // If has variants, create a story for each variant
  if (variants && variants.length > 0) {
    variants.forEach(variant => {
      const storyName = capitalizeFirst(variant);
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

export default {
  generateStories
};
