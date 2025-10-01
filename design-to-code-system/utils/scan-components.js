/**
 * scan-components.js
 * Scans existing component directories to understand what's already built
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Parse a TypeScript/JSX file to extract component information
 * @param {string} content - File content
 * @param {string} fileName - Name of the file
 * @returns {Object} Component metadata
 */
const parseComponent = (content, fileName) => {
  const componentName = path.basename(fileName, path.extname(fileName));

  // Extract props interface
  const propsMatch = content.match(/interface\s+(\w+Props)\s*(?:extends\s+[^{]+)?\s*{([^}]*)}/);
  const props = [];

  if (propsMatch) {
    const propsContent = propsMatch[2];
    // Simple prop extraction (could be enhanced with proper AST parsing)
    const propLines = propsContent.split('\n').filter(line => line.includes(':'));
    propLines.forEach(line => {
      const match = line.trim().match(/(\w+)(\?)?:\s*([^;,]+)/);
      if (match) {
        props.push({
          name: match[1],
          required: !match[2],
          type: match[3].trim()
        });
      }
    });
  }

  // Check for variants
  const variantMatch = content.match(/const\s+\w*[Vv]ariants?\s*=\s*{([^}]*)}/);
  const variants = [];
  if (variantMatch) {
    const variantKeys = variantMatch[1].match(/['"]?(\w+)['"]?\s*:/g);
    if (variantKeys) {
      variants.push(...variantKeys.map(key => key.replace(/['":]/g, '').trim()));
    }
  }

  // Check for sizes
  const sizeMatch = content.match(/const\s+\w*[Ss]izes?\s*=\s*{([^}]*)}/);
  const sizes = [];
  if (sizeMatch) {
    const sizeKeys = sizeMatch[1].match(/['"]?(\w+)['"]?\s*:/g);
    if (sizeKeys) {
      sizes.push(...sizeKeys.map(key => key.replace(/['":]/g, '').trim()));
    }
  }

  // Check if it's a client component
  const isClientComponent = content.includes("'use client'") || content.includes('"use client"');

  // Extract dependencies/imports
  const importMatches = content.matchAll(/import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g);
  const dependencies = Array.from(importMatches).map(match => match[1]);

  // Detect component capabilities
  const capabilities = {
    hasIcon: content.includes('icon') || content.includes('Icon'),
    hasChildren: content.includes('children'),
    hasOnClick: content.includes('onClick'),
    hasClassName: content.includes('className'),
    extendsHTMLProps: /extends\s+React\.\w+HTMLAttributes/.test(content)
  };

  return {
    name: componentName,
    path: fileName,
    isClientComponent,
    props,
    variants,
    sizes,
    dependencies,
    capabilities
  };
};

/**
 * Scan a directory for component files
 * @param {string} dirPath - Directory to scan
 * @returns {Array} Array of component metadata
 */
const scanDirectory = async (dirPath) => {
  const components = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
        // Skip test files, stories, and index files
        if (entry.name.includes('.test.') ||
            entry.name.includes('.stories.') ||
            entry.name === 'index.tsx' ||
            entry.name === 'index.jsx') {
          continue;
        }

        const filePath = path.join(dirPath, entry.name);
        const content = await fs.readFile(filePath, 'utf-8');
        const metadata = parseComponent(content, entry.name);
        components.push(metadata);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
    console.warn(`Could not scan directory ${dirPath}: ${error.message}`);
  }

  return components;
};

/**
 * Scan all component directories in the output path
 * @param {string} outputPath - Base output path for components
 * @returns {Object} Categorized existing components
 */
export const scanExistingComponents = async (outputPath) => {
  const componentDirs = ['elements', 'components', 'modules', 'icons'];
  const result = {
    elements: [],
    components: [],
    modules: [],
    icons: [],
    all: []
  };

  for (const dir of componentDirs) {
    const dirPath = path.join(outputPath, dir);
    const components = await scanDirectory(dirPath);
    result[dir] = components;
    result.all.push(...components);
  }

  // Build a component map for quick lookups
  result.byName = {};
  result.all.forEach(comp => {
    result.byName[comp.name.toLowerCase()] = comp;
  });

  // Create an import map showing what can be imported
  result.importMap = {
    elements: result.elements.map(c => `@/ui/elements/${c.name}`),
    components: result.components.map(c => `@/ui/components/${c.name}`),
    modules: result.modules.map(c => `@/ui/modules/${c.name}`),
    icons: result.icons.map(c => `@/ui/icons/${c.name}`)
  };

  return result;
};

/**
 * Format existing components for prompt context
 * @param {Object} scannedComponents - Result from scanExistingComponents
 * @param {string} componentType - Type of component being generated
 * @returns {string} Formatted string for prompt
 */
export const formatAvailableImports = (scannedComponents, componentType) => {
  const availableImports = [];

  // For molecules, include atoms (elements)
  if (componentType === 'molecule' || componentType === 'component') {
    if (scannedComponents.elements.length > 0) {
      availableImports.push('**Available Elements (Atoms):**');
      scannedComponents.elements.forEach(comp => {
        const props = comp.props.map(p => `${p.name}${p.required ? '' : '?'}: ${p.type}`).join(', ');
        availableImports.push(`- ${comp.name}: import { ${comp.name} } from '@/ui/elements/${comp.name}';`);
        if (props) {
          availableImports.push(`  Props: { ${props} }`);
        }
        if (comp.variants.length > 0) {
          availableImports.push(`  Variants: ${comp.variants.join(', ')}`);
        }
      });
    }
  }

  // For organisms, include molecules and atoms
  if (componentType === 'organism' || componentType === 'module') {
    if (scannedComponents.components.length > 0) {
      availableImports.push('\n**Available Components (Molecules):**');
      scannedComponents.components.forEach(comp => {
        availableImports.push(`- ${comp.name}: import { ${comp.name} } from '@/ui/components/${comp.name}';`);
      });
    }

    if (scannedComponents.elements.length > 0) {
      availableImports.push('\n**Available Elements (Atoms):**');
      scannedComponents.elements.forEach(comp => {
        availableImports.push(`- ${comp.name}: import { ${comp.name} } from '@/ui/elements/${comp.name}';`);
      });
    }
  }

  // Always include available icons
  if (scannedComponents.icons.length > 0) {
    availableImports.push('\n**Available Icons:**');
    scannedComponents.icons.forEach(icon => {
      availableImports.push(`- ${icon.name}: import { ${icon.name} } from '@/ui/icons/${icon.name}';`);
    });
  }

  return availableImports.join('\n');
};

/**
 * Check if a component should be updated instead of created
 * @param {string} componentName - Name of the component to check
 * @param {Object} newSpec - New component specification
 * @param {Object} existingComponent - Existing component metadata
 * @returns {Object} Update decision with reasoning
 */
export const shouldUpdateComponent = (componentName, newSpec, existingComponent) => {
  // Name similarity check
  const nameSimilarity = componentName.toLowerCase() === existingComponent.name.toLowerCase();

  if (!nameSimilarity) {
    return { shouldUpdate: false, reason: 'Different component names' };
  }

  // Check if new spec has significantly different structure
  const newProps = newSpec.inferredProps || [];
  const existingProps = existingComponent.props || [];

  // If the new component has many more props, might be a different component
  if (newProps.length > existingProps.length * 2) {
    return { shouldUpdate: false, reason: 'Significantly different prop structure' };
  }

  // Check for variant additions
  const newVariants = newSpec.allVisibleVariants || [];
  const existingVariants = existingComponent.variants || [];

  // If we're just adding variants, update is safe
  const variantAddition = newVariants.length > existingVariants.length &&
                          existingVariants.every(v => newVariants.some(nv => nv.includes(v)));

  if (variantAddition) {
    return {
      shouldUpdate: true,
      reason: 'Adding new variants to existing component',
      updateType: 'enhance'
    };
  }

  // If capabilities are similar, consider updating
  const hasIcon = newSpec.inferredProps?.some(p => p.name?.toLowerCase().includes('icon'));
  const capabilitiesMatch = hasIcon === existingComponent.capabilities?.hasIcon;

  if (capabilitiesMatch && nameSimilarity) {
    return {
      shouldUpdate: true,
      reason: 'Same component with potential improvements',
      updateType: 'refine'
    };
  }

  return { shouldUpdate: false, reason: 'Components are too different' };
};

export default {
  scanExistingComponents,
  formatAvailableImports,
  shouldUpdateComponent
};