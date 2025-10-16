/**
 * Tool Executor
 * Handles execution of agent tools (find_similar_components, write_component, etc.)
 * Extracted from core/agent.js for use in LangGraph workflow
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Tool definitions for OpenAI function calling
 */
export const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'find_similar_components',
      description: 'Search reference components to find patterns and examples. Use this before generating a component to follow existing patterns.',
      parameters: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            description: 'Search query describing what kind of component pattern you\'re looking for (e.g., "button with variants", "form input", "card layout")'
          },
          limit: {
            type: 'number',
            description: 'Max number of similar components to return (default: 3)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_component',
      description: 'Write a component to the ui/ folder (elements/, components/, or modules/). CRITICAL: Use correct type based on atomic level.',
      parameters: {
        type: 'object',
        required: ['name', 'type', 'code'],
        properties: {
          name: {
            type: 'string',
            description: 'Component name in PascalCase (e.g., Button, SearchBar, NavigationBar)'
          },
          type: {
            type: 'string',
            description: 'Folder type: elements (for atoms), components (for molecules), modules (for organisms), or icons',
            enum: ['elements', 'components', 'modules', 'icons']
          },
          code: {
            type: 'string',
            description: 'Complete TypeScript React component code (must be valid TypeScript with proper imports, types, and export default)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read an existing file from the codebase (for reviewing or checking existing components)',
      parameters: {
        type: 'object',
        required: ['file_path'],
        properties: {
          file_path: {
            type: 'string',
            description: 'Relative path to the file to read'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_registry',
      description: 'Get list of all existing components in the ui/ folder. Use this to check what components already exist.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
];

export const createToolExecutor = (vectorSearch, registry, outputDir) => {
  const tools = {
    async find_similar_components({ query, limit = 3 }) {
      const results = await vectorSearch.search(query, limit);
      return {
        query,
        results: results.map(r => ({
          name: r.name,
          type: r.type,
          path: r.relativePath,
          description: r.description,
          purpose: r.purpose,
          isInteractive: r.isInteractive,
          hasVariants: r.hasVariants
        }))
      };
    },

    async read_file({ file_path }) {
      try {
        const content = await fs.readFile(file_path, 'utf-8');
        return {
          path: file_path,
          content,
          success: true
        };
      } catch (error) {
        return {
          path: file_path,
          error: error.message,
          success: false
        };
      }
    },

    async write_component({ name, type, code }) {
      try {
        const fileName = `${name}.tsx`;
        const dir = path.join(outputDir, type);
        await fs.mkdir(dir, { recursive: true });

        const filePath = path.join(dir, fileName);
        await fs.writeFile(filePath, code, 'utf-8');

        return {
          name,
          type,
          path: filePath,
          success: true
        };
      } catch (error) {
        return {
          name,
          type,
          error: error.message,
          success: false
        };
      }
    },

    async validate_typescript({ file_path }) {
      try {
        // Run tsc from design-to-code-system where TypeScript is installed
        // Must explicitly pass --jsx and --esModuleInterop flags for React/JSX support
        const designToCodeDir = path.resolve(__dirname, '..', '..');
        const projectRoot = path.resolve(outputDir, '..');

        // Run TypeScript compiler with explicit flags
        const output = execSync(
          `cd ${projectRoot} && npx --prefix ${designToCodeDir} tsc --noEmit --jsx react-jsx --esModuleInterop ${file_path} 2>&1`,
          {
            encoding: 'utf-8',
            shell: '/bin/bash'
          }
        );

        return {
          path: file_path,
          valid: true,
          output: output || 'No TypeScript errors'
        };
      } catch (error) {
        return {
          path: file_path,
          valid: false,
          errors: error.stdout || error.message
        };
      }
    },

    async get_registry() {
      const allComponents = [];

      // Flatten registry by type
      for (const type of ['elements', 'components', 'modules', 'icons']) {
        const components = registry.components[type] || [];
        components.forEach(comp => {
          allComponents.push({
            name: comp.name,
            type,
            atomicLevel: type === 'elements' ? 'atom' : type === 'components' ? 'molecule' : 'organism',
            importPath: registry.importMap[comp.name],
            description: comp.description || '',
            dependencies: comp.dependencies || []
          });
        });
      }

      // Count by atomic level
      const atoms = allComponents.filter(c => c.atomicLevel === 'atom');
      const molecules = allComponents.filter(c => c.atomicLevel === 'molecule');
      const organisms = allComponents.filter(c => c.atomicLevel === 'organism');

      // Build helpful response
      const response = {
        summary: {
          total: allComponents.length,
          atoms: atoms.length,
          molecules: molecules.length,
          organisms: organisms.length
        },
        components: {
          atoms: atoms.map(c => ({ name: c.name, importPath: c.importPath, description: c.description })),
          molecules: molecules.map(c => ({ name: c.name, importPath: c.importPath, dependencies: c.dependencies })),
          organisms: organisms.map(c => ({ name: c.name, importPath: c.importPath, dependencies: c.dependencies }))
        },
        importMap: registry.importMap
      };

      // Add contextual hints based on current state
      if (allComponents.length === 0) {
        response.hint = "📋 Registry is empty. This is a fresh start.\n\n💡 Start by generating ATOMS first (buttons, inputs, headings, etc).\nAtoms are self-contained and don't import other components.";
      } else if (molecules.length === 0 && atoms.length > 0) {
        response.hint = `📋 Registry contains ${atoms.length} atom(s): ${atoms.map(a => a.name).join(', ')}\n\n💡 You can now generate MOLECULES that import and compose these atoms.\nExample: SearchBar can import Button + Input.`;
      } else if (organisms.length === 0 && molecules.length > 0) {
        response.hint = `📋 Registry contains:\n- ${atoms.length} atoms: ${atoms.map(a => a.name).join(', ')}\n- ${molecules.length} molecules: ${molecules.map(m => m.name).join(', ')}\n\n💡 You can now generate ORGANISMS that compose molecules and atoms.\nExample: Navigation can import Logo + SearchBar + Button.`;
      } else {
        response.hint = `📋 Full registry:\n- ${atoms.length} atoms\n- ${molecules.length} molecules\n- ${organisms.length} organisms\n\n💡 Import existing components using paths from importMap.\nGenerate new components in atomic order: atoms → molecules → organisms.`;
      }

      return response;
    }
  };

  return {
    execute: async (toolName, toolInput) => {
      if (typeof tools[toolName] === 'function') {
        return await tools[toolName](toolInput);
      }
      throw new Error(`Unknown tool: ${toolName}`);
    }
  };
};
