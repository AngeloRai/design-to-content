#!/usr/bin/env node

/**
 * VALIDATION TOOLS - Simple validation wrappers
 *
 * Run checks and return results for AI to interpret
 */

import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ===================================
// TOOL DEFINITIONS
// ===================================

export const validationTools = [
  {
    type: "function",
    function: {
      name: "run_typescript_check",
      description: "Run TypeScript compiler check on the entire project or specific files. Returns any compilation errors. Use this to ensure generated code doesn't break type safety.",
      parameters: {
        type: "object",
        properties: {
          files: {
            type: "array",
            items: { type: "string" },
            description: "Specific files to check (optional, checks all if not provided)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_linter",
      description: "Run ESLint on files to check code quality and style. Returns linting errors and warnings.",
      parameters: {
        type: "object",
        properties: {
          files: {
            type: "array",
            items: { type: "string" },
            description: "Files to lint"
          }
        },
        required: ["files"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_imports",
      description: "Check if all imports in a file can be resolved. Use this to validate that generated components import dependencies correctly.",
      parameters: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: "File to check imports for"
          }
        },
        required: ["filePath"]
      }
    }
  }
];

// ===================================
// TOOL IMPLEMENTATIONS
// ===================================

/**
 * Run TypeScript check
 */
export async function runTypeScriptCheck(files = []) {
  try {
    const filesArg = files.length > 0 ? files.join(" ") : "";
    const command = `npx tsc --noEmit ${filesArg}`;

    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd()
    });

    return {
      success: true,
      passed: true,
      message: "TypeScript check passed",
      output: stdout || "No errors"
    };
  } catch (error) {
    // TypeScript errors come through as exec errors
    return {
      success: true,
      passed: false,
      errors: error.stdout || error.stderr,
      message: "TypeScript errors found"
    };
  }
}

/**
 * Run ESLint
 */
export async function runLinter(files) {
  try {
    const filesArg = files.join(" ");
    const command = `npx eslint ${filesArg} --format json`;

    const { stdout } = await execAsync(command, {
      cwd: process.cwd()
    });

    const results = JSON.parse(stdout);

    const hasErrors = results.some(r => r.errorCount > 0);
    const hasWarnings = results.some(r => r.warningCount > 0);

    return {
      success: true,
      passed: !hasErrors,
      hasWarnings,
      results: results.map(r => ({
        filePath: r.filePath,
        errorCount: r.errorCount,
        warningCount: r.warningCount,
        messages: r.messages
      }))
    };
  } catch (error) {
    // ESLint errors may come through exec error
    try {
      const results = JSON.parse(error.stdout);
      const hasErrors = results.some(r => r.errorCount > 0);

      return {
        success: true,
        passed: !hasErrors,
        results
      };
    } catch {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Check if imports are resolvable
 */
export async function checkImports(filePath) {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    const code = await fs.readFile(absolutePath, "utf-8");

    // Extract import statements
    const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
    const imports = [];
    let match;

    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }

    // Check each import
    const results = await Promise.all(
      imports.map(async (importPath) => {
        try {
          // Resolve relative imports
          if (importPath.startsWith(".")) {
            const resolvedPath = path.resolve(
              path.dirname(absolutePath),
              importPath
            );

            // Try with common extensions
            const extensions = ["", ".ts", ".tsx", ".js", ".jsx"];
            let found = false;

            for (const ext of extensions) {
              try {
                await fs.access(resolvedPath + ext);
                found = true;
                break;
              } catch {
                continue;
              }
            }

            return {
              import: importPath,
              resolvable: found,
              type: "relative"
            };
          } else {
            // Check if it's a package import (assume resolvable if not relative)
            return {
              import: importPath,
              resolvable: true,
              type: "package"
            };
          }
        } catch {
          return {
            import: importPath,
            resolvable: false,
            error: "Could not resolve"
          };
        }
      })
    );

    const allResolvable = results.every(r => r.resolvable);
    const unresolvedImports = results.filter(r => !r.resolvable);

    return {
      success: true,
      filePath,
      allResolvable,
      totalImports: imports.length,
      results,
      unresolvedImports
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}