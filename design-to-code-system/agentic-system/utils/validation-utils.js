/**
 * Shared Validation Utilities
 * Provides reusable TypeScript and ESLint validation functions
 * Used by both tool-executor.js and final-check.js
 */

import { execSync } from 'child_process';
import path from 'path';

/**
 * Run TypeScript validation on entire project
 * @param {string} projectRoot - Root directory of the project (where tsconfig.json is)
 * @param {Object} options - Validation options
 * @param {boolean} options.verbose - Show detailed logging
 * @returns {Promise<Object>} Validation result with success flag and errors
 */
export async function runTypeScriptValidation(projectRoot, options = {}) {
  const { verbose = false } = options;

  if (verbose) {
    console.log('   🔍 Running TypeScript check...');
    console.log(`      📁 Project root: ${projectRoot}`);
  }

  try {
    execSync('npx tsc --noEmit --skipLibCheck', {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe'
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
    const errorLines = fullOutput.split('\n').filter(line => line.trim());

    if (verbose) {
      console.log(`      ❌ TypeScript: ${errorLines.length} error line(s) found`);
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

    // Parse errors to extract component names and group them
    const componentErrors = parseTypeScriptErrors(fullOutput);

    return {
      success: false,
      valid: false,
      errors: errorLines,
      fullOutput,
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

    // Match errors for ui/ files: ui/elements/Button.tsx(10,5): error TS...
    const match = line.match(/ui\/(\w+)\/([^.]+)\.tsx/);
    if (match) {
      const componentName = match[2];
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
  }

  try {
    const resolvedPath = path.isAbsolute(targetPath)
      ? targetPath
      : path.join(projectRoot, targetPath);

    execSync(`npx eslint "${resolvedPath}" --ext .ts,.tsx --format json`, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe'
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
        const match = issue.file.match(/ui\/(\w+)\/([^.]+)\.tsx/);
        if (match) {
          const componentName = match[2];
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
