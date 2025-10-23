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
  },
  {
    type: 'function',
    function: {
      name: 'check_code_quality',
      description: 'Check code quality issues using ESLint (unused imports, best practices, etc.)',
      parameters: {
        type: 'object',
        required: ['file_path'],
        properties: {
          file_path: {
            type: 'string',
            description: 'Relative path to the file to check (e.g., "ui/modules/Modal.tsx")'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_directory',
      description: 'List files and directories in a given path. Useful for exploring the codebase structure.',
      parameters: {
        type: 'object',
        required: ['directory_path'],
        properties: {
          directory_path: {
            type: 'string',
            description: 'Path to the directory to list (relative or absolute)'
          },
          recursive: {
            type: 'boolean',
            description: 'If true, list all files recursively. Default: false'
          }
        }
      }
    }
  }
];

export const createToolExecutor = (vectorSearch, registry, outputDir) => {
  const tools = {
    async find_similar_components({ query, limit = 3 }) {
      if (!vectorSearch) {
        return {
          query,
          results: [],
          message: 'Vector search not available in this context. Use get_registry to see existing components instead.'
        };
      }

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
        // Resolve relative paths against the project root
        const projectRoot = path.resolve(outputDir, '..');
        const resolvedPath = path.isAbsolute(file_path)
          ? file_path
          : path.resolve(projectRoot, file_path);

        // CRITICAL: Block reading node_modules - prevents context overflow
        if (resolvedPath.includes('node_modules')) {
          console.error(`      ❌ BLOCKED: Cannot read node_modules files`);
          return {
            path: file_path,
            resolved_path: resolvedPath,
            error: 'Reading node_modules files is not allowed',
            success: false,
            message: 'ERROR: You attempted to read a node_modules file. DO NOT read type definition files from node_modules. Use TypeScript types directly in your code. If you need to understand a type like React.SelectHTMLAttributes, just use it - the TypeScript compiler knows about it.'
          };
        }

        console.log(`      📖 Reading: ${file_path} → ${resolvedPath}`);

        const content = await fs.readFile(resolvedPath, 'utf-8');
        const lines = content.split('\n');

        return {
          path: file_path,
          resolved_path: resolvedPath,
          content,
          lines, // Include for backwards compatibility
          success: true
        };
      } catch (error) {
        const projectRoot = path.resolve(outputDir, '..');
        const resolvedPath = path.isAbsolute(file_path)
          ? file_path
          : path.resolve(projectRoot, file_path);

        console.error(`      ❌ Failed to read file: ${file_path}`);
        console.error(`         Resolved to: ${resolvedPath}`);
        console.error(`         Error: ${error.message}`);

        return {
          path: file_path,
          resolved_path: resolvedPath,
          error: `Failed to read file at ${resolvedPath}: ${error.message}`,
          success: false,
          message: `ERROR: File not found. The file ${file_path} does not exist at ${resolvedPath}. This is a critical error - you cannot proceed without reading the file. Check if the path is correct.`
        };
      }
    },

    async write_component({ name, type, code }) {
      try {
        const fileName = `${name}.tsx`;
        const dir = path.join(outputDir, type);
        await fs.mkdir(dir, { recursive: true });

        // Normalize code - replace double-escaped characters with actual characters
        // This handles cases where the agent sends JSON-escaped code (e.g., \\n instead of \n)
        const normalizedCode = code
          .replace(/\\n/g, '\n')     // Replace literal \n with newlines
          .replace(/\\t/g, '\t')     // Replace literal \t with tabs
          .replace(/\\"/g, '"')      // Replace escaped quotes
          .replace(/\\'/g, "'");     // Replace escaped single quotes

        const filePath = path.join(dir, fileName);
        await fs.writeFile(filePath, normalizedCode, 'utf-8');

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
        // Run tsc on the entire project to respect tsconfig.json (includes path aliases)
        // Then filter output for just the file we're validating
        const designToCodeDir = path.resolve(__dirname, '..', '..');
        const projectRoot = path.resolve(outputDir, '..');

        // Run tsc --noEmit on entire project (picks up tsconfig.json automatically)
        // This respects path aliases like @/ui/elements/Button
        const output = execSync(
          `cd ${projectRoot} && npx --prefix ${designToCodeDir} tsc --noEmit 2>&1`,
          {
            encoding: 'utf-8',
            shell: '/bin/bash'
          }
        );

        // If we get here, no errors (success case shouldn't happen with catch block)
        return {
          path: file_path,
          valid: true,
          output: 'No TypeScript errors'
        };
      } catch (error) {
        const fullOutput = error.stdout || error.message;

        // Filter errors to only show ones related to the specific file
        const fileErrors = fullOutput
          .split('\n')
          .filter(line => line.includes(file_path))
          .join('\n');

        // If no errors for this specific file, it's valid
        if (!fileErrors.trim()) {
          return {
            path: file_path,
            valid: true,
            output: 'No TypeScript errors for this file'
          };
        }

        return {
          path: file_path,
          valid: false,
          errors: fileErrors
        };
      }
    },

    async check_code_quality({ file_path }) {
      try {
        const designToCodeDir = path.resolve(__dirname, '..', '..');
        const projectRoot = path.resolve(outputDir, '..');

        // Run ESLint on the specific file
        const output = execSync(
          `cd ${projectRoot} && npx --prefix ${designToCodeDir} eslint ${file_path} --format json 2>&1`,
          {
            encoding: 'utf-8',
            shell: '/bin/bash'
          }
        );

        // ESLint returns JSON format
        const results = JSON.parse(output);
        const fileResult = results[0];

        if (!fileResult || fileResult.errorCount === 0 && fileResult.warningCount === 0) {
          return {
            path: file_path,
            valid: true,
            issues: []
          };
        }

        // Format issues for the agent
        const issues = fileResult.messages.map(msg => ({
          line: msg.line,
          column: msg.column,
          severity: msg.severity === 2 ? 'error' : 'warning',
          message: msg.message,
          rule: msg.ruleId
        }));

        return {
          path: file_path,
          valid: false,
          errorCount: fileResult.errorCount,
          warningCount: fileResult.warningCount,
          issues
        };
      } catch (error) {
        // ESLint might return non-zero exit code with issues
        // Try to parse the output as JSON
        try {
          const output = error.stdout || error.message;
          const results = JSON.parse(output);
          const fileResult = results[0];

          const issues = fileResult.messages.map(msg => ({
            line: msg.line,
            column: msg.column,
            severity: msg.severity === 2 ? 'error' : 'warning',
            message: msg.message,
            rule: msg.ruleId
          }));

          return {
            path: file_path,
            valid: false,
            errorCount: fileResult.errorCount,
            warningCount: fileResult.warningCount,
            issues
          };
        } catch {
          // If JSON parsing fails, return the raw output for debugging
          return {
            path: file_path,
            error: `Failed to parse ESLint output: ${error.stdout || error.message}`
          };
        }
      }
    },

    async list_directory({ directory_path, recursive = false }) {
      try {
        const projectRoot = path.resolve(outputDir, '..');
        const resolvedPath = path.isAbsolute(directory_path)
          ? directory_path
          : path.resolve(projectRoot, directory_path);

        if (recursive) {
          // Use find command for recursive listing
          const output = execSync(
            `find "${resolvedPath}" -type f -name "*.tsx" -o -name "*.ts" -o -name "*.json"`,
            { encoding: 'utf-8' }
          );
          const files = output.trim().split('\n').filter(Boolean);

          return {
            path: directory_path,
            resolved_path: resolvedPath,
            files,
            count: files.length,
            recursive: true
          };
        } else {
          // List current directory only
          const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
          const items = entries.map(entry => ({
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            path: path.join(directory_path, entry.name)
          }));

          return {
            path: directory_path,
            resolved_path: resolvedPath,
            items,
            count: items.length,
            recursive: false
          };
        }
      } catch (error) {
        return {
          path: directory_path,
          error: error.message,
          success: false
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
