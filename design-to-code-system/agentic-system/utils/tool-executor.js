/**
 * Tool Executor
 * Handles execution of agent tools (find_similar_components, write_component, etc.)
 * Extracted from core/agent.js for use in LangGraph workflow
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';
import { execSync } from "child_process";
import {
  runTypeScriptValidation,
  extractFileErrors,
  runESLintValidation,
} from "./validation-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Tool definitions for OpenAI function calling
 */
export const TOOLS = [
  {
    type: "function",
    function: {
      name: "find_similar_components",
      description:
        "Search reference components to find patterns and examples. Use this before generating a component to follow existing patterns.",
      parameters: {
        type: "object",
        required: ["query"],
        properties: {
          query: {
            type: "string",
            description:
              'Search query describing what kind of component pattern you\'re looking for (e.g., "button with variants", "form input", "card layout")',
          },
          limit: {
            type: "number",
            description:
              "Max number of similar components to return (default: 3)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_component",
      description:
        "Write a component to the ui/ folder (elements/, components/, or modules/). CRITICAL: Use correct type based on atomic level.",
      parameters: {
        type: "object",
        required: ["name", "type", "code"],
        properties: {
          name: {
            type: "string",
            description:
              "Component name in PascalCase (e.g., Button, SearchBar, NavigationBar)",
          },
          type: {
            type: "string",
            description:
              "Folder type: elements (for atoms), components (for molecules), modules (for organisms), or icons",
            enum: ["elements", "components", "modules", "icons"],
          },
          code: {
            type: "string",
            description:
              "Complete TypeScript React component code (must be valid TypeScript with proper imports, types, and export default)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description:
        "Read an existing file from the codebase (for reviewing or checking existing components)",
      parameters: {
        type: "object",
        required: ["file_path"],
        properties: {
          file_path: {
            type: "string",
            description: "Relative path to the file to read",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_registry",
      description:
        "Get list of all existing components in the ui/ folder. Use this to check what components already exist.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "validate_typescript",
      description:
        "Validate TypeScript compilation for a file. Returns valid: true if no TypeScript errors, or valid: false with error details.",
      parameters: {
        type: "object",
        required: ["file_path"],
        properties: {
          file_path: {
            type: "string",
            description:
              'Relative path to the file to validate (e.g., "ui/elements/Button.tsx")',
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_code_quality",
      description:
        "Check code quality issues using ESLint (unused imports, best practices, etc.)",
      parameters: {
        type: "object",
        required: ["file_path"],
        properties: {
          file_path: {
            type: "string",
            description:
              'Relative path to the file to check (e.g., "ui/modules/Modal.tsx")',
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_directory",
      description:
        "List files and directories in a given path. Useful for exploring the codebase structure.",
      parameters: {
        type: "object",
        required: ["directory_path"],
        properties: {
          directory_path: {
            type: "string",
            description: "Path to the directory to list (relative or absolute)",
          },
          recursive: {
            type: "boolean",
            description: "If true, list all files recursively. Default: false",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_help",
      description:
        "Search for help and solutions when encountering errors or needing guidance. Use this when standard approaches fail or you need documentation.",
      parameters: {
        type: "object",
        required: ["query"],
        properties: {
          query: {
            type: "string",
            description:
              "The error message or technical question you need help with",
          },
          context: {
            type: "object",
            description: "Optional context about what you've tried",
            properties: {
              previousAttempts: {
                type: "array",
                items: { type: "string" },
                description: "List of approaches that have already failed",
              },
              componentType: {
                type: "string",
                description: "Type of component being worked on",
              },
            },
          },
        },
      },
    },
  },
];

export const createToolExecutor = (vectorSearch, registry, outputDir) => {
  // Resolve outputDir to absolute path to ensure consistent file operations
  // outputDir like '../atomic-design-pattern/ui' needs to be resolved from the tool-executor's location
  // __dirname is: /design-to-content/design-to-code-system/agentic-system/utils
  // We need to go up 2 levels to get to design-to-code-system/, then resolve outputDir from there
  const absoluteOutputDir = path.resolve(__dirname, '..', '..', outputDir);

  const tools = {
    async find_similar_components({ query, limit = 3 }) {
      if (!vectorSearch) {
        return {
          query,
          results: [],
          message:
            "Vector search not available in this context. Use get_registry to see existing components instead.",
        };
      }

      const results = await vectorSearch.search(query, limit);
      return {
        query,
        results: results.map((r) => ({
          name: r.name,
          type: r.type,
          path: r.relativePath,
          description: r.description,
          purpose: r.purpose,
          isInteractive: r.isInteractive,
          hasVariants: r.hasVariants,
        })),
      };
    },

    async read_file({ file_path }) {
      try {
        // If file_path is already absolute (from registry), use it directly
        // Otherwise resolve relative paths against the project root
        const projectRoot = path.resolve(absoluteOutputDir, "..", "..");
        const resolvedPath = path.isAbsolute(file_path)
          ? file_path
          : path.resolve(projectRoot, file_path);

        // CRITICAL: Block reading node_modules - prevents context overflow
        if (resolvedPath.includes("node_modules")) {
          console.error(`      ❌ BLOCKED: Cannot read node_modules files`);
          return {
            path: file_path,
            resolved_path: resolvedPath,
            error: "Reading node_modules files is not allowed",
            success: false,
            message:
              "ERROR: You attempted to read a node_modules file. DO NOT read type definition files from node_modules. Use TypeScript types directly in your code. If you need to understand a type like React.SelectHTMLAttributes, just use it - the TypeScript compiler knows about it.",
          };
        }

        console.log(`      📖 Reading: ${file_path} → ${resolvedPath}`);

        const content = await fs.readFile(resolvedPath, "utf-8");
        const lines = content.split("\n");

        return {
          path: file_path,
          resolved_path: resolvedPath,
          content,
          lines, // Include for backwards compatibility
          success: true,
        };
      } catch (error) {
        const projectRoot = path.resolve(outputDir, "..");
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
          message: `ERROR: File not found. The file ${file_path} does not exist at ${resolvedPath}. This is a critical error - you cannot proceed without reading the file. Check if the path is correct.`,
        };
      }
    },

    async write_component({ name, type, code }) {
      try {
        // CRITICAL: Validate component type to prevent writing config files
        const allowedTypes = ["elements", "components", "modules", "icons"];
        if (!allowedTypes.includes(type)) {
          console.error(`      ❌ BLOCKED: Invalid component type '${type}'`);
          return {
            name,
            type,
            error: `Invalid component type. Must be one of: ${allowedTypes.join(
              ", "
            )}`,
            success: false,
            message: `ERROR: You can only write components to ui folders (elements, components, modules, icons). You cannot write configuration files like tsconfig.json or package.json. Focus on generating React components only.`,
          };
        }

        // CRITICAL: Validate component name to prevent config file generation
        const invalidNames = [
          "tsconfig",
          "package",
          "eslintrc",
          "prettierrc",
          "gitignore",
          "env",
        ];
        const nameLower = name.toLowerCase();
        if (invalidNames.some((invalid) => nameLower.includes(invalid))) {
          console.error(`      ❌ BLOCKED: Invalid component name '${name}'`);
          return {
            name,
            type,
            error: `Invalid component name. Cannot create config files.`,
            success: false,
            message: `ERROR: You attempted to create a configuration file (${name}). You can ONLY create React components. DO NOT modify project configuration. If there are TypeScript errors, fix them in the component code, not by editing tsconfig.`,
          };
        }

        // Validate component name format (PascalCase)
        if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
          console.error(
            `      ⚠️  Warning: Component name '${name}' should be in PascalCase`
          );
        }

        // Create folder structure: ui/elements/ComponentName/ComponentName.tsx
        const componentFileName = `${name}.tsx`;
        const componentDir = path.join(absoluteOutputDir, type, name);
        await fs.mkdir(componentDir, { recursive: true });

        // Normalize code - replace double-escaped characters with actual characters
        // This handles cases where the agent sends JSON-escaped code (e.g., \\n instead of \n)
        const normalizedCode = code
          .replace(/\\n/g, "\n") // Replace literal \n with newlines
          .replace(/\\t/g, "\t") // Replace literal \t with tabs
          .replace(/\\"/g, '"') // Replace escaped quotes
          .replace(/\\'/g, "'"); // Replace escaped single quotes

        // Write the component file
        const componentFilePath = path.join(componentDir, componentFileName);
        await fs.writeFile(componentFilePath, normalizedCode, "utf-8");

        // Create index.ts barrel export file
        const indexContent = `export { default } from './${name}';\n`;
        const indexFilePath = path.join(componentDir, 'index.ts');
        await fs.writeFile(indexFilePath, indexContent, "utf-8");

        const timestamp = new Date().toISOString();
        console.log(`      ✅ Wrote component: ${type}/${name}/${componentFileName}`);
        console.log(`      📁 Full path: ${componentFilePath}`);
        console.log(`      🕐 Timestamp: ${timestamp}`);
        console.log(`      ✅ Created barrel export: ${type}/${name}/index.ts`);

        return {
          name,
          type,
          path: componentFilePath,
          success: true,
          timestamp,
        };
      } catch (error) {
        return {
          name,
          type,
          error: error.message,
          success: false,
        };
      }
    },

    async validate_typescript({ file_path }) {
      const projectRoot = path.resolve(outputDir, "..");

      console.log(`      🔍 Validating TypeScript for: ${file_path}`);
      console.log(`      📁 Project root: ${projectRoot}`);

      // Use shared validation utility
      const result = await runTypeScriptValidation(projectRoot, {
        verbose: false,
      });

      // If validation passed, return success
      if (result.valid) {
        return {
          path: file_path,
          valid: true,
          output: "No TypeScript errors in the project",
        };
      }

      // Extract errors specific to this file
      const fileSpecificErrors = extractFileErrors(
        result.fullOutput,
        file_path
      );

      // If no errors for this specific file, it's valid
      if (fileSpecificErrors.length === 0) {
        console.log(`      ✅ No TypeScript errors for ${file_path}`);
        return {
          path: file_path,
          valid: true,
          output: `No TypeScript errors for ${file_path}. Other files may have errors.`,
          note: "This file is valid but there are other TypeScript errors in the project",
        };
      }

      const errorText = fileSpecificErrors.join("\n");
      console.log(
        `      ❌ Found ${fileSpecificErrors.length} error lines for ${file_path}`
      );

      // CRITICAL: Return BOTH the file-specific errors AND the full project output
      // The AI needs full context to understand related errors and type issues
      return {
        path: file_path,
        valid: false,
        errors: errorText, // Errors specific to this file with full context
        fullOutput: result.fullOutput, // Complete tsc output for full context
        errorCount: fileSpecificErrors.length,
        summary: `TypeScript validation failed with ${fileSpecificErrors.length} error line(s) in ${file_path}`,
      };
    },

    async check_code_quality({ file_path }) {
      const projectRoot = path.resolve(outputDir, "..");

      // Use shared validation utility
      const result = await runESLintValidation(projectRoot, file_path, {
        verbose: false,
      });

      return {
        path: file_path,
        valid: result.valid,
        errorCount: result.errorCount || 0,
        warningCount: result.warningCount || 0,
        issues: result.issues || [],
        error: result.error,
      };
    },

    async list_directory({ directory_path, recursive = false }) {
      try {
        const projectRoot = path.resolve(outputDir, "..");
        const resolvedPath = path.isAbsolute(directory_path)
          ? directory_path
          : path.resolve(projectRoot, directory_path);

        if (recursive) {
          // Use find command for recursive listing
          const output = execSync(
            `find "${resolvedPath}" -type f -name "*.tsx" -o -name "*.ts" -o -name "*.json"`,
            { encoding: "utf-8" }
          );
          const files = output.trim().split("\n").filter(Boolean);

          return {
            path: directory_path,
            resolved_path: resolvedPath,
            files,
            count: files.length,
            recursive: true,
          };
        } else {
          // List current directory only
          const entries = await fs.readdir(resolvedPath, {
            withFileTypes: true,
          });
          const items = entries.map((entry) => ({
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file",
            path: path.join(directory_path, entry.name),
          }));

          return {
            path: directory_path,
            resolved_path: resolvedPath,
            items,
            count: items.length,
            recursive: false,
          };
        }
      } catch (error) {
        return {
          path: directory_path,
          error: error.message,
          success: false,
        };
      }
    },

    async search_help({ query, context = {} }) {
      try {
        const { searchForHelp } = await import("../tools/search-help.js");
        const result = await searchForHelp(query, context);

        if (result.success) {
          console.log("      📚 Found help documentation");
          return {
            success: true,
            help: result.content,
            query,
          };
        } else {
          return {
            success: false,
            error: result.error,
            query,
          };
        }
      } catch (error) {
        console.error("      ❌ Search help failed:", error.message);
        return {
          success: false,
          error: error.message,
          query,
          fallback:
            "Try simplifying the component structure or checking React/TypeScript documentation manually",
        };
      }
    },

    async get_registry() {
      const allComponents = [];

      // Flatten registry by type
      for (const type of ["elements", "components", "modules", "icons"]) {
        const components = registry.components[type] || [];
        components.forEach((comp) => {
          allComponents.push({
            name: comp.name,
            type,
            atomicLevel:
              type === "elements"
                ? "atom"
                : type === "components"
                ? "molecule"
                : "organism",
            importPath: registry.importMap[comp.name],
            description: comp.description || "",
            dependencies: comp.dependencies || [],
          });
        });
      }

      // Count by atomic level
      const atoms = allComponents.filter((c) => c.atomicLevel === "atom");
      const molecules = allComponents.filter(
        (c) => c.atomicLevel === "molecule"
      );
      const organisms = allComponents.filter(
        (c) => c.atomicLevel === "organism"
      );

      // Build helpful response
      const response = {
        summary: {
          total: allComponents.length,
          atoms: atoms.length,
          molecules: molecules.length,
          organisms: organisms.length,
        },
        components: {
          atoms: atoms.map((c) => ({
            name: c.name,
            importPath: c.importPath,
            description: c.description,
          })),
          molecules: molecules.map((c) => ({
            name: c.name,
            importPath: c.importPath,
            dependencies: c.dependencies,
          })),
          organisms: organisms.map((c) => ({
            name: c.name,
            importPath: c.importPath,
            dependencies: c.dependencies,
          })),
        },
        importMap: registry.importMap,
      };

      // Add contextual hints based on current state
      if (allComponents.length === 0) {
        response.hint =
          "📋 Registry is empty. This is a fresh start.\n\n💡 Start by generating ATOMS first (buttons, inputs, headings, etc).\nAtoms are self-contained and don't import other components.";
      } else if (molecules.length === 0 && atoms.length > 0) {
        response.hint = `📋 Registry contains ${atoms.length} atom(s): ${atoms
          .map((a) => a.name)
          .join(
            ", "
          )}\n\n💡 You can now generate MOLECULES that import and compose these atoms.\nExample: SearchBar can import Button + Input.`;
      } else if (organisms.length === 0 && molecules.length > 0) {
        response.hint = `📋 Registry contains:\n- ${atoms.length} atoms: ${atoms
          .map((a) => a.name)
          .join(", ")}\n- ${molecules.length} molecules: ${molecules
          .map((m) => m.name)
          .join(
            ", "
          )}\n\n💡 You can now generate ORGANISMS that compose molecules and atoms.\nExample: Navigation can import Logo + SearchBar + Button.`;
      } else {
        response.hint = `📋 Full registry:\n- ${atoms.length} atoms\n- ${molecules.length} molecules\n- ${organisms.length} organisms\n\n💡 Import existing components using paths from importMap.\nGenerate new components in atomic order: atoms → molecules → organisms.`;
      }

      return response;
    },
  };

  return {
    execute: async (toolName, toolInput) => {
      if (typeof tools[toolName] === "function") {
        return await tools[toolName](toolInput);
      }
      throw new Error(`Unknown tool: ${toolName}`);
    },
  };
};
