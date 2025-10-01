#!/usr/bin/env node

/**
 * COMPONENT TOOLS - Thin wrappers that let AI do the reasoning
 *
 * Philosophy: Don't hardcode logic. Give AI the data it needs to decide.
 */

import fs from "fs/promises";
import path from "path";
import { glob } from "glob";

// ===================================
// TOOL DEFINITIONS
// ===================================

export const componentTools = [
  {
    type: "function",
    function: {
      name: "list_components",
      description: "List all React component files in a directory. Returns file paths and basic metadata (file size, last modified). The AI should use this to discover what components exist, then read specific ones for detailed analysis.",
      parameters: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Directory to scan (e.g., 'src/components')"
          },
          pattern: {
            type: "string",
            description: "Glob pattern (default: '**/*.{tsx,jsx}')"
          }
        },
        required: ["directory"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_component_file",
      description: "Read the full source code of a component file. Use this to examine existing components in detail - understand their props, structure, variants, dependencies. The AI should analyze this code to make decisions about similarity and what to generate.",
      parameters: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: "Path to component file"
          }
        },
        required: ["filePath"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_multiple_files",
      description: "Read multiple component files at once for comparison. Use this when you need to analyze several existing components to decide which one (if any) matches the design component you want to generate.",
      parameters: {
        type: "object",
        properties: {
          filePaths: {
            type: "array",
            items: { type: "string" },
            description: "Array of file paths to read"
          }
        },
        required: ["filePaths"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_component_usage",
      description: "Search for where a component is imported/used across the codebase. Use this before updating a component to understand the impact. Returns file paths and line numbers where the component appears.",
      parameters: {
        type: "object",
        properties: {
          componentName: {
            type: "string",
            description: "Component name to search for (e.g., 'Button')"
          },
          searchDirectory: {
            type: "string",
            description: "Directory to search in (default: 'src')"
          }
        },
        required: ["componentName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "write_component",
      description: "Write a new component file or overwrite an existing one. Use this after you've generated the component code. The file will be created with proper formatting.",
      parameters: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: "Output file path (e.g., 'src/components/Button.tsx')"
          },
          code: {
            type: "string",
            description: "Complete component code to write"
          },
          createBackup: {
            type: "boolean",
            description: "If true and file exists, create .backup file first (default: true)"
          }
        },
        required: ["filePath", "code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "validate_typescript",
      description: "Run TypeScript compiler check on code without writing to disk. Use this to validate generated code before writing it. Returns compilation errors if any.",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "TypeScript/TSX code to validate"
          },
          tempFileName: {
            type: "string",
            description: "Temporary filename for validation (e.g., 'Button.tsx')"
          }
        },
        required: ["code", "tempFileName"]
      }
    }
  }
];

// ===================================
// TOOL IMPLEMENTATIONS
// ===================================

/**
 * List all component files in directory
 */
export async function listComponents(directory, pattern = "**/*.{tsx,jsx}") {
  try {
    const baseDir = path.resolve(process.cwd(), directory);
    const files = await glob(pattern, { cwd: baseDir, absolute: true });

    const components = await Promise.all(
      files.map(async (filePath) => {
        const stats = await fs.stat(filePath);
        const relativePath = path.relative(process.cwd(), filePath);

        return {
          path: relativePath,
          absolutePath: filePath,
          name: path.basename(filePath, path.extname(filePath)),
          extension: path.extname(filePath),
          size: stats.size,
          lastModified: stats.mtime.toISOString()
        };
      })
    );

    return {
      success: true,
      directory,
      totalFiles: components.length,
      components
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Read single component file
 */
export async function readComponentFile(filePath) {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    const code = await fs.readFile(absolutePath, "utf-8");

    return {
      success: true,
      filePath,
      code,
      lines: code.split("\n").length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Read multiple component files
 */
export async function readMultipleFiles(filePaths) {
  try {
    const results = await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          const absolutePath = path.resolve(process.cwd(), filePath);
          const code = await fs.readFile(absolutePath, "utf-8");

          return {
            filePath,
            code,
            success: true
          };
        } catch (error) {
          return {
            filePath,
            success: false,
            error: error.message
          };
        }
      })
    );

    return {
      success: true,
      files: results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Search for component usage across codebase
 */
export async function searchComponentUsage(componentName, searchDirectory = "src") {
  try {
    const baseDir = path.resolve(process.cwd(), searchDirectory);
    const files = await glob("**/*.{tsx,jsx,ts,js}", { cwd: baseDir, absolute: true });

    const usages = [];

    for (const filePath of files) {
      const code = await fs.readFile(filePath, "utf-8");
      const lines = code.split("\n");

      // Find lines that mention the component
      const matches = [];
      lines.forEach((line, index) => {
        if (line.includes(componentName)) {
          matches.push({
            lineNumber: index + 1,
            content: line.trim(),
            isImport: /import.*from/.test(line),
            isUsage: new RegExp(`<${componentName}[\\s/>]`).test(line)
          });
        }
      });

      if (matches.length > 0) {
        usages.push({
          filePath: path.relative(process.cwd(), filePath),
          matchCount: matches.length,
          matches
        });
      }
    }

    return {
      success: true,
      componentName,
      totalFiles: usages.length,
      usages
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Write component to file
 */
export async function writeComponent(filePath, code, createBackup = true) {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);

    // Check if file exists and create backup if requested
    let backupCreated = false;
    try {
      await fs.access(absolutePath);
      if (createBackup) {
        const backupPath = `${absolutePath}.backup`;
        const existingCode = await fs.readFile(absolutePath, "utf-8");
        await fs.writeFile(backupPath, existingCode, "utf-8");
        backupCreated = true;
      }
    } catch {
      // File doesn't exist, no backup needed
    }

    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(absolutePath, code, "utf-8");

    return {
      success: true,
      filePath,
      backupCreated,
      message: backupCreated ? "File updated, backup created" : "File created"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate TypeScript code
 */
export async function validateTypeScript(code, tempFileName) {
  try {
    const tmpDir = path.join(process.cwd(), ".tmp-validation");
    await fs.mkdir(tmpDir, { recursive: true });

    const tempFilePath = path.join(tmpDir, tempFileName);
    await fs.writeFile(tempFilePath, code, "utf-8");

    // Create a minimal tsconfig.json for validation
    const tsconfigPath = path.join(tmpDir, "tsconfig.json");
    const minimalTsConfig = {
      compilerOptions: {
        target: "ES2020",
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        jsx: "react-jsx",
        module: "ESNext",
        moduleResolution: "bundler",
        skipLibCheck: true,
        skipDefaultLibCheck: true,
        strict: false,
        noEmit: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noResolve: false,
        paths: {
          "@/*": ["../../nextjs-app/*"]
        }
      },
      include: ["./**/*"]
    };
    await fs.writeFile(tsconfigPath, JSON.stringify(minimalTsConfig, null, 2), "utf-8");

    // Run tsc to check for errors
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    try {
      // Find the nearest node_modules with typescript
      const possibleTscPaths = [
        path.join(process.cwd(), 'design-to-code-system', 'node_modules', '.bin', 'tsc'),
        path.join(process.cwd(), 'nextjs-app', 'node_modules', '.bin', 'tsc'),
        path.join(process.cwd(), 'node_modules', '.bin', 'tsc')
      ];

      let tscCommand = null;
      for (const tscPath of possibleTscPaths) {
        try {
          await fs.access(tscPath);
          tscCommand = tscPath;
          console.log(`  ✓ Found TypeScript at: ${tscPath}`);
          break;
        } catch {
          // Try next path
        }
      }

      if (!tscCommand) {
        console.log(`  ⚠️  TypeScript not found, skipping validation`);
        return {
          success: true,
          valid: true,
          skipped: true,
          message: "TypeScript validation skipped (tsc not found)"
        };
      }

      await execAsync(`${tscCommand} --project ${tsconfigPath}`, {
        cwd: tmpDir
      });

      // Clean up
      await fs.unlink(tempFilePath);
      await fs.unlink(tsconfigPath);

      return {
        success: true,
        valid: true,
        message: "TypeScript validation passed"
      };
    } catch (execError) {
      // Clean up
      await fs.unlink(tempFilePath);
      try { await fs.unlink(tsconfigPath); } catch {}

      return {
        success: true,
        valid: false,
        errors: execError.stdout || execError.stderr
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
