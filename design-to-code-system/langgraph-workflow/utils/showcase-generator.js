#!/usr/bin/env node

/**
 * SHOWCASE PAGE GENERATOR
 *
 * Generates a Next.js page that displays all components from the inventory
 * Automatically creates prop examples based on component metadata
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Generate the UI showcase page from component inventory
 */
export const generateShowcasePage = async (inventoryPath, outputPath) => {
  try {
    // Read the inventory file
    const inventoryContent = await fs.readFile(inventoryPath, 'utf-8');
    const inventory = JSON.parse(inventoryContent);

    // Generate the page content
    const pageContent = buildShowcasePageContent(inventory);

    // Ensure output directory exists
    const showcaseDir = path.dirname(outputPath);
    await fs.mkdir(showcaseDir, { recursive: true });

    // Write the page
    await fs.writeFile(outputPath, pageContent, 'utf-8');

    return {
      success: true,
      path: outputPath,
      componentsCount: inventory.inventoryMetadata.totalComponents,
      size: pageContent.length
    };
  } catch (error) {
    console.error('Failed to generate showcase page:', error);
    throw error;
  }
};

/**
 * Build the complete showcase page content
 */
const buildShowcasePageContent = (inventory) => {
  const { byCategory, summary } = inventory;

  // Build imports
  const imports = buildImports(byCategory);

  // Build component sections
  const elementSection = buildCategorySection('Elements', byCategory.elements);
  const componentSection = buildCategorySection('Components', byCategory.components);
  const moduleSection = buildCategorySection('Modules', byCategory.modules);
  const iconSection = buildIconSection(byCategory.icons);

  return `/**
 * UI SHOWCASE PAGE
 *
 * Auto-generated from component inventory
 * Displays all available UI components with examples
 *
 * Generated: ${new Date().toISOString()}
 * Total Components: ${summary.total}
 */

import Link from 'next/link';

${imports}

export default function UIShowcasePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">UI Component Library</h1>
          <p className="text-gray-600">
            Showcasing ${summary.total} components: ${summary.elements} elements, ${summary.components} components, ${summary.modules} modules, ${summary.icons} icons
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </header>

        {/* Navigation */}
        <nav className="mb-8 flex gap-4 border-b border-gray-200 pb-4">
          <Link href="#elements" className="text-blue-600 hover:text-blue-800 font-medium">Elements</Link>
          <Link href="#components" className="text-blue-600 hover:text-blue-800 font-medium">Components</Link>
          <Link href="#modules" className="text-blue-600 hover:text-blue-800 font-medium">Modules</Link>
          <Link href="#icons" className="text-blue-600 hover:text-blue-800 font-medium">Icons</Link>
        </nav>

        {/* Elements Section */}
        ${elementSection}

        {/* Components Section */}
        ${componentSection}

        {/* Modules Section */}
        ${moduleSection}

        {/* Icons Section */}
        ${iconSection}
      </div>
    </div>
  );
}
`;
};

/**
 * Build import statements for all components
 */
const buildImports = (byCategory) => {
  const imports = [];

  // Filter out invalid component names (e.g., containing dots)
  const isValidComponentName = (name) => {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
  };

  // Helper to generate correct import syntax based on export type
  const generateImport = (comp, category) => {
    const exportType = comp.exportType || 'default';
    if (exportType === 'named') {
      return `import { ${comp.name} } from '@/ui/${category}/${comp.name}';`;
    } else {
      return `import ${comp.name} from '@/ui/${category}/${comp.name}';`;
    }
  };

  // Elements
  byCategory.elements
    .filter(comp => isValidComponentName(comp.name))
    .forEach(comp => {
      imports.push(generateImport(comp, 'elements'));
    });

  // Components
  byCategory.components
    .filter(comp => isValidComponentName(comp.name))
    .forEach(comp => {
      imports.push(generateImport(comp, 'components'));
    });

  // Modules
  byCategory.modules
    .filter(comp => isValidComponentName(comp.name))
    .forEach(comp => {
      imports.push(generateImport(comp, 'modules'));
    });

  // Icons
  byCategory.icons
    .filter(comp => isValidComponentName(comp.name))
    .forEach(comp => {
      imports.push(generateImport(comp, 'icons'));
    });

  return imports.join('\n');
};

/**
 * Build a category section (elements, components, or modules)
 */
const buildCategorySection = (title, components) => {
  // Filter out invalid component names
  const validComponents = components.filter(comp => /^[A-Z][a-zA-Z0-9]*$/.test(comp.name));

  if (validComponents.length === 0) {
    return `
        {/* ${title} Section */}
        <section id="${title.toLowerCase()}" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">${title}</h2>
          <p className="text-gray-500">No ${title.toLowerCase()} available yet.</p>
        </section>`;
  }

  const componentCards = validComponents.map(comp => buildComponentCard(comp)).join('\n\n');

  return `
        {/* ${title} Section */}
        <section id="${title.toLowerCase()}" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">${title}</h2>
          <div className="space-y-8">
            ${componentCards}
          </div>
        </section>`;
};

/**
 * Build a component card with examples
 */
const buildComponentCard = (component) => {
  const { name, props, variants, capabilities } = component;

  // Generate prop examples
  const propExamples = generatePropExamples(props, variants);

  // Build component instances
  const instances = propExamples.map((example, idx) => {
    const propsString = Object.entries(example.props)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        } else if (typeof value === 'boolean') {
          return value ? key : '';
        }
        return `${key}={${JSON.stringify(value)}}`;
      })
      .filter(Boolean)
      .join(' ');

    const hasChildren = capabilities.hasChildren;
    const content = hasChildren ? `${example.label || 'Example'}` : '';

    return `
              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <${name} ${propsString}>${content}</${name}>
                </div>
                <p className="text-xs text-gray-500">${example.description}</p>
              </div>`;
  }).join('\n');

  // Build props documentation
  const propsDoc = props && props.length > 0
    ? `
            <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Props:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                ${props.map(p => `<li><code className="bg-white px-1 py-0.5 rounded">${p.name}</code>: <span className="text-gray-500">${p.type}</span>${p.required ? ' <span className="text-red-500">*required</span>' : ''}</li>`).join('\n                ')}
              </ul>
            </div>`
    : '';

  return `
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">${name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${instances}
              </div>
              ${propsDoc}
            </div>`;
};

/**
 * Build icon section (special handling for icons)
 */
const buildIconSection = (icons) => {
  // Filter out invalid component names
  const validIcons = icons.filter(icon => /^[A-Z][a-zA-Z0-9]*$/.test(icon.name));

  if (validIcons.length === 0) {
    return `
        {/* Icons Section */}
        <section id="icons" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Icons</h2>
          <p className="text-gray-500">No icons available yet.</p>
        </section>`;
  }

  const iconGrid = validIcons.map(icon => `
              <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <${icon.name} className="w-6 h-6" />
                <span className="text-xs text-gray-600">${icon.name}</span>
              </div>`).join('\n');

  return `
        {/* Icons Section */}
        <section id="icons" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Icons</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4">
            ${iconGrid}
          </div>
        </section>`;
};

/**
 * Generate prop examples based on component metadata
 */
const generatePropExamples = (props, variants) => {
  if (!props || props.length === 0) {
    return [{ props: {}, description: 'Default', label: 'Example' }];
  }

  const examples = [];

  // If has variants, create example for each variant
  if (variants && variants.length > 0) {
    variants.forEach(variant => {
      const variantProps = {};

      props.forEach(prop => {
        if (prop.name === 'variant' || prop.name === 'type') {
          variantProps[prop.name] = variant;
        } else if (prop.required) {
          variantProps[prop.name] = generatePropValue(prop);
        }
      });

      examples.push({
        props: variantProps,
        description: `Variant: ${variant}`,
        label: variant.charAt(0).toUpperCase() + variant.slice(1)
      });
    });
  } else {
    // Generate a default example with required props
    const defaultProps = {};
    props.forEach(prop => {
      if (prop.required) {
        defaultProps[prop.name] = generatePropValue(prop);
      }
    });

    examples.push({
      props: defaultProps,
      description: 'Default configuration',
      label: 'Example'
    });

    // If component has optional className, add a styled example
    const hasClassName = props.some(p => p.name === 'className');
    if (hasClassName) {
      examples.push({
        props: { ...defaultProps, className: 'shadow-lg' },
        description: 'With custom styling',
        label: 'Styled'
      });
    }
  }

  return examples;
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
  if (name === 'children') return 'Content';
  if (name.includes('icon')) return 'IconComponent';

  // Handle common types
  if (type.includes('string')) return 'Example';
  if (type.includes('number')) return 0;
  if (type.includes('boolean')) return true;

  // Default
  return 'value';
};

export default {
  generateShowcasePage
};
