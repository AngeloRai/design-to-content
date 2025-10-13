/**
 * Component Registry
 * Simple functional operations for tracking GENERATED components
 * Registry is rebuilt on every run to stay in sync with filesystem
 * Reference patterns are in REFERENCE_PATTERNS.md (static document)
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Schema for component metadata extraction
const ComponentMetadataSchema = z.object({
  description: z.string().describe("Brief description of what this component does"),
  props: z.array(z.string()).describe("List of prop names accepted by this component"),
  hasVariants: z.boolean().describe("Whether component has multiple visual variants"),
  isInteractive: z.boolean().describe("Whether component handles user interactions (onClick, onChange, etc)"),
  dependencies: z.array(z.string()).describe("Names of other components imported"),
  purpose: z.string().describe("Primary purpose: button, input, container, icon, navigation, display, form, etc")
});

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
 * Extract component metadata using AI with structured output
 */
export const extractComponentMetadata = async (filePath) => {
  try {
    const code = await fs.readFile(filePath, 'utf-8');

    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0
    }).withStructuredOutput(ComponentMetadataSchema);

    const prompt = `Analyze this React component and extract metadata.

Component code:
\`\`\`typescript
${code}
\`\`\`

Extract:
- description: what the component does
- props: list of prop names from the interface
- hasVariants: does it have visual variants (primary/secondary/etc)?
- isInteractive: does it handle user interactions (onClick, onChange)?
- dependencies: imported component names (not libraries)
- purpose: button, input, container, icon, navigation, display, form, etc`;

    const metadata = await model.invoke(prompt);
    return metadata;
  } catch (error) {
    console.error(`Error extracting metadata from ${filePath}:`, error.message);
    return {
      description: '',
      props: [],
      hasVariants: false,
      isInteractive: false,
      dependencies: [],
      purpose: 'unknown'
    };
  }
};

/**
 * Scan directory for component files with AI-enriched metadata
 */
export const scanDirectory = async (directory, useAI = true) => {
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

            let metadata = {
              description: '',
              props: [],
              hasVariants: false,
              isInteractive: false,
              dependencies: [],
              purpose: type
            };

            if (useAI) {
              console.log(`  Analyzing ${type}/${file}...`);
              metadata = await extractComponentMetadata(filePath);
            }

            components.push({
              name,
              type,
              path: filePath,
              relativePath: path.relative(process.cwd(), filePath),
              ...metadata
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
export const buildRegistry = async (generatedDir = null) => {
  let registry = createEmptyRegistry();

  // Default path: from project root
  const defaultPath = generatedDir || path.join(__dirname, '..', '..', 'nextjs-app', 'ui');
  const components = await scanDirectory(defaultPath);

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
