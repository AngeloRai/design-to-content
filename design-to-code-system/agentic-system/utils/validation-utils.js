/**
 * Shared Validation Utilities
 * Provides reusable TypeScript and ESLint validation functions
 * Used by both tool-executor.js and final-check.js
 */

import { execSync } from 'child_process';
import path from 'path';

/**
 * Run TypeScript validation on entire project or specific directory
 * @param {string} projectRoot - Root directory of the project (where tsconfig.json is)
 * @param {string} targetPath - Specific path to check (optional, relative to projectRoot)
 * @param {Object} options - Validation options
 * @param {boolean} options.verbose - Show detailed logging
 * @returns {Promise<Object>} Validation result with success flag and errors
 */
export async function runTypeScriptValidation(projectRoot, targetPath = null, options = {}) {
  const { verbose = false } = options;

  if (verbose) {
    console.log('   🔍 Running TypeScript check...');
    console.log(`      📁 Project root: ${projectRoot}`);
    console.log(`      📁 Target path: ${targetPath || 'entire project'}`);
    console.log(`      📍 VALIDATION-UTILS TSC VERSION: shell:true ENABLED`);
    console.log(`      📍 Shell: ${process.env.SHELL || 'undefined'}`);
  }

  try {
    // Build the tsc command - always run from project root to get proper type checking
    const tscCommand = 'npx tsc --noEmit --skipLibCheck';

    if (verbose) {
      console.log(`      📍 Working directory: ${projectRoot}`);
      console.log(`      📍 Executing: ${tscCommand}`);
    }

    execSync(tscCommand, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
      shell: true // Explicitly use shell to avoid ENOENT errors
    });

    if (verbose) {
      console.log('      ✅ TypeScript: No errors');
    }

    return {
      success: true,
      valid: true,
      errors: [],
      fullOutput: ''
    };
  } catch (error) {
    // Capture both stdout and stderr
    const fullOutput = error.stdout || error.stderr || error.message || '';
    let errorLines = fullOutput.split('\n').filter(line => line.trim());

    // If targetPath is specified, filter errors to only include files within that directory
    if (targetPath) {
      const relativePath = path.isAbsolute(targetPath)
        ? path.relative(projectRoot, targetPath)
        : targetPath;

      if (verbose) {
        console.log(`      📍 Filtering errors to only show files in: ${relativePath}/`);
      }

      // Filter error lines to only include those from files in the target directory
      // TypeScript error format: path/to/file.tsx(line,col): error TS####: message
      errorLines = errorLines.filter(line => {
        // Extract the file path from the error line (everything before the first '(')
        const match = line.match(/^([^(]+)\(/);
        if (match) {
          const filePath = match[1].trim();
          // Check if the file path starts with the target directory
          return filePath.startsWith(`${relativePath}/`) || filePath.startsWith(`${relativePath}\\`);
        }
        // If no match, this isn't an error line with a file path, filter it out
        return false;
      });
    }

    if (verbose) {
      console.log(`      ❌ TypeScript: ${errorLines.length} error line(s) found (after filtering)`);
      console.log(`      📊 Output length: ${fullOutput.length} chars`);
    }

    // Check if we got empty output (potential issue)
    if (!fullOutput.trim()) {
      console.error('      ⚠️ TypeScript validation returned empty output!');
      return {
        success: false,
        valid: false,
        errors: ['TypeScript validation failed but returned no output'],
        fullOutput: '',
        debugInfo: {
          cwd: projectRoot,
          exitCode: error.status,
          hasStdout: !!error.stdout,
          hasStderr: !!error.stderr
        }
      };
    }

    // If we filtered all errors out, validation passes!
    if (targetPath && errorLines.length === 0) {
      if (verbose) {
        console.log(`      ✅ TypeScript: No errors in target directory`);
      }
      return {
        success: true,
        valid: true,
        errors: [],
        fullOutput: '',
        filteredFrom: fullOutput
      };
    }

    // Parse errors to extract component names and group them
    const componentErrors = parseTypeScriptErrors(errorLines.join('\n'));

    return {
      success: false,
      valid: false,
      errors: errorLines,
      fullOutput: errorLines.join('\n'), // Only return filtered errors
      componentErrors,
      errorCount: errorLines.length
    };
  }
}

/**
 * Parse TypeScript error output and group by component
 * Captures full error context including continuation lines
 * @param {string} output - Raw TypeScript output
 * @returns {Object} Component errors grouped by component name
 */
export function parseTypeScriptErrors(output) {
  const lines = output.split('\n');
  const componentErrors = {};
  let currentComponent = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match errors for ui/ files with nested structure:
    // ui/elements/Button/Button.tsx or ui/components/Alert/Alert.stories.tsx
    const match = line.match(/ui\/\w+\/([^/]+)\/([^/(]+)\.tsx/);
    if (match) {
      // Use the component directory name as the base component name
      // This works for both "Button/Button.tsx" and "Alert/Alert.stories.tsx"
      const componentName = match[1];
      currentComponent = componentName;

      if (!componentErrors[componentName]) {
        componentErrors[componentName] = [];
      }
      componentErrors[componentName].push(line);

      // Capture continuation lines (type details, etc.)
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];

        // Stop if we hit another file error
        if (nextLine.match(/\.tsx?\(\d+,\d+\):/)) {
          break;
        }

        // Stop on empty line
        if (!nextLine.trim()) {
          break;
        }

        // Capture continuation lines (Type details, "Its", etc.)
        componentErrors[componentName].push(nextLine);
        j++;
      }

      i = j - 1; // Skip lines we just captured
    } else if (currentComponent && (line.trim().startsWith('Type ') || line.trim().startsWith('Its '))) {
      // Fallback: capture continuation lines for current component
      componentErrors[currentComponent].push(line);
    }
  }

  return componentErrors;
}

/**
 * Extract errors for a specific file from full TypeScript output
 * @param {string} fullOutput - Complete TypeScript validation output
 * @param {string} filePath - Relative file path (e.g., "ui/elements/Button.tsx")
 * @returns {string[]} Array of error lines for this file with full context
 */
export function extractFileErrors(fullOutput, filePath) {
  const lines = fullOutput.split('\n');
  const fileErrors = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line is an error for our file
    if (line.includes(filePath) && line.match(/\.tsx?\(\d+,\d+\):/)) {
      fileErrors.push(line);

      // Capture ALL continuation lines
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];

        // Stop if we hit another file's error
        if (nextLine.match(/\.tsx?\(\d+,\d+\):/)) {
          break;
        }

        // Stop on empty line
        if (!nextLine.trim()) {
          break;
        }

        fileErrors.push(nextLine);
        j++;
      }

      i = j - 1;
    }
  }

  return fileErrors;
}

/**
 * Run ESLint validation on a directory or file
 * @param {string} projectRoot - Root directory of the project
 * @param {string} targetPath - Path to validate (directory or file)
 * @param {Object} options - Validation options
 * @param {boolean} options.verbose - Show detailed logging
 * @returns {Promise<Object>} Validation result with success flag and issues
 */
export async function runESLintValidation(projectRoot, targetPath, options = {}) {
  const { verbose = false } = options;

  if (verbose) {
    console.log('   🔍 Running ESLint check...');
    console.log(`      📍 VALIDATION-UTILS VERSION: shell:true ENABLED`);
    console.log(`      📍 Project root: ${projectRoot}`);
    console.log(`      📍 Target path: ${targetPath}`);
    console.log(`      📍 Shell environment: ${process.env.SHELL || 'undefined'}`);
    console.log(`      📍 PATH: ${process.env.PATH?.substring(0, 100)}...`);
  }

  try {
    const resolvedPath = path.isAbsolute(targetPath)
      ? targetPath
      : path.join(projectRoot, targetPath);

    if (verbose) {
      console.log(`      📍 Resolved path: ${resolvedPath}`);
      console.log(`      📍 About to execute: npx eslint`);
    }

    const stdout = execSync(`npx eslint "${resolvedPath}" --ext .ts,.tsx --format json`, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
      shell: true // Explicitly use shell to avoid ENOENT errors
    });

    if (verbose) {
      console.log('      ✅ ESLint: No errors');
    }

    return {
      success: true,
      valid: true,
      issues: [],
      errorCount: 0,
      warningCount: 0
    };
  } catch (error) {
    // ESLint returns exit code 1 when there are linting errors
    // The output should be in stdout, not stderr
    if (verbose) {
      console.log(`      ❌ ESLint execSync failed!`);
      console.log(`      📍 Error code: ${error.code}`);
      console.log(`      📍 Error message: ${error.message}`);
      console.log(`      📍 Error errno: ${error.errno}`);
      console.log(`      📍 Error syscall: ${error.syscall}`);
      console.log(`      📍 Has stdout: ${!!error.stdout}`);
      console.log(`      📍 Has stderr: ${!!error.stderr}`);
    }

    const errorOutput = error.stdout || error.stderr || error.message;

    try {
      const results = JSON.parse(errorOutput);
      const allIssues = results.flatMap(file =>
        file.messages.map(msg => ({
          file: file.filePath,
          line: msg.line,
          column: msg.column,
          message: msg.message,
          rule: msg.ruleId,
          severity: msg.severity
        }))
      );

      if (verbose) {
        console.log(`      ❌ ESLint: ${allIssues.length} issue(s) found`);
      }

      // Count errors vs warnings
      const errorCount = allIssues.filter(i => i.severity === 2).length;
      const warningCount = allIssues.filter(i => i.severity === 1).length;

      // Group by component
      const componentIssues = {};
      allIssues.forEach(issue => {
        // Match ui/elements/Button/Button.tsx or ui/components/Alert/Alert.stories.tsx
        const match = issue.file.match(/ui\/\w+\/([^/]+)\//);
        if (match) {
          const componentName = match[1];
          if (!componentIssues[componentName]) {
            componentIssues[componentName] = [];
          }
          componentIssues[componentName].push(issue);
        }
      });

      return {
        success: false,
        valid: false,
        issues: allIssues,
        componentIssues,
        errorCount,
        warningCount
      };
    } catch (parseError) {
      // ESLint output wasn't JSON - log the actual error for debugging
      if (verbose) {
        console.log('      ❌ ESLint: Error running check');
        console.log('      Error output:', errorOutput);
        console.log('      Parse error:', parseError.message);
      }

      return {
        success: false,
        valid: false,
        issues: [{ message: errorOutput }],
        componentIssues: {},
        errorCount: 0,
        warningCount: 0,
        error: 'Failed to parse ESLint output',
        rawError: errorOutput
      };
    }
  }
}

/**
 * Format ESLint issues for display to AI agent
 * @param {Array} issues - Array of ESLint issue objects
 * @returns {string} Formatted issue text
 */
export function formatESLintIssues(issues) {
  if (!issues || issues.length === 0) {
    return '';
  }

  return issues.map(issue => {
    const severity = issue.severity === 2 ? 'ERROR' : 'WARNING';
    return `Line ${issue.line}:${issue.column} [${severity}] ${issue.message} (${issue.rule})`;
  }).join('\n');
}
