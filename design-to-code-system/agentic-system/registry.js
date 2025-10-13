/**
 * Component Registry
 * Simple functional operations for tracking GENERATED components
 * Registry is rebuilt on every run to stay in sync with filesystem
 * Reference patterns are in REFERENCE_PATTERNS.md (static document)
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create empty registry structure
 */
export const createEmptyRegistry = () => ({
  version: '1.0.0',
  lastUpdated: Date.now(),
  components: {
    elements: [],
    components: [],
    modules: [],
    icons: []
  },
  importMap: {}
});

/**
 * Add component to registry (immutable)
 */
export const addComponent = (registry, type, component) => {
  const existing = registry.components[type] || [];

  return {
    ...registry,
    components: {
      ...registry.components,
      [type]: [...existing, { ...component, addedAt: Date.now() }]
    }
  };
};

/**
 * Update import map (immutable)
 */
export const updateImportMap = (registry, componentName, importPath) => ({
  ...registry,
  importMap: {
    ...registry.importMap,
    [componentName]: importPath
  }
});

/**
 * Find component by name
 */
export const findByName = (registry, name) => {
  for (const type of ['elements', 'components', 'modules', 'icons']) {
    const components = registry.components?.[type] || [];
    const found = components.find(c => c.name === name);
    if (found) {
      return { ...found, type };
    }
  }
  return null;
};

/**
 * Get all components (flattened list)
 */
export const getAllComponents = (registry) => {
  const all = [];
  for (const type of ['elements', 'components', 'modules', 'icons']) {
    const components = registry.components?.[type] || [];
    components.forEach(comp => all.push({ ...comp, type }));
  }
  return all;
};

/**
 * Get components by type
 */
export const getComponentsByType = (registry, type) => {
  return (registry.components?.[type] || []).map(comp => ({ ...comp, type }));
};

/**
 * Get import path for component
 */
export const getImportPath = (registry, componentName) => {
  return registry.importMap?.[componentName] || null;
};

/**
 * Scan directory for component files
 */
export const scanDirectory = async (directory) => {
  const components = [];

  try {
    for (const type of ['elements', 'components', 'modules', 'icons']) {
      const typePath = path.join(directory, type);

      if (await fs.pathExists(typePath)) {
        const files = await fs.readdir(typePath);

        for (const file of files) {
          if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            const name = file.replace(/\.(tsx|jsx)$/, '');
            const filePath = path.join(typePath, file);

            components.push({
              name,
              type,
              path: filePath,
              relativePath: path.relative(process.cwd(), filePath)
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${directory}:`, error);
  }

  return components;
};

/**
 * Build fresh registry from filesystem
 * Called on every workflow run to stay in sync
 */
export const buildRegistry = async (generatedDir = 'nextjs-app/ui') => {
  let registry = createEmptyRegistry();

  const fullPath = path.join(process.cwd(), generatedDir);
  const components = await scanDirectory(fullPath);

  for (const comp of components) {
    registry = addComponent(registry, comp.type, comp);

    // Build import map
    const importPath = `@/ui/${comp.type}/${comp.name}`;
    registry = updateImportMap(registry, comp.name, importPath);
  }

  return registry;
};

/**
 * CLI - Test registry building
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔍 Building component registry from filesystem...\n');

  buildRegistry().then(registry => {
    const total = getAllComponents(registry).length;

    console.log(`✅ Found ${total} generated components:\n`);

    for (const type of ['elements', 'components', 'modules', 'icons']) {
      const components = getComponentsByType(registry, type);
      if (components.length > 0) {
        console.log(`  ${type}:`);
        components.forEach(c => console.log(`    - ${c.name}`));
      }
    }

    console.log('\n📋 Registry structure:');
    console.log(JSON.stringify(registry, null, 2));
  }).catch(error => {
    console.error('Failed to build registry:', error);
    process.exit(1);
  });
}
