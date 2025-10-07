#!/usr/bin/env node

/**
 * TYPESCRIPT VALIDATOR
 *
 * Validates TypeScript code by writing to temp file and running tsc.
 * Catches type errors during code review before saving files.
 */

import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Validate TypeScript code without saving to final location
 * @param {string} codeString - Component code to validate
 * @param {string} componentName - Component name for error messages
 * @returns {Promise<object>} Validation result with errors
 */
export async function validateTypeScript(codeString, componentName) {
  const tempDir = path.join(process.cwd(), '.temp-ts-validation');

  try {
    await fs.ensureDir(tempDir);

    const tempFile = path.join(tempDir, `${componentName}.tsx`);
    await fs.writeFile(tempFile, codeString);

    // Run TypeScript compiler check
    // Skip lib check for speed, use react-jsx transform
    await execAsync(
      `npx tsc --noEmit --jsx react-jsx --esModuleInterop --skipLibCheck --strict false ${tempFile}`,
      { cwd: process.cwd(), timeout: 10000 }
    );

    // If we get here, no TS errors
    await fs.remove(tempDir);

    return {
      valid: true,
      errors: [],
      totalErrors: 0,
      message: 'TypeScript validation passed'
    };
  } catch (error) {
    // Parse TypeScript errors from output
    const errorOutput = error.stdout || error.stderr || '';

    // Extract error lines (format: "file.tsx(line,col): error TSxxxx: message")
    const errorLines = errorOutput
      .split('\n')
      .filter(line =>
        line.includes('error TS') ||
        (line.trim().length > 0 && !line.includes('npm') && !line.includes('npx'))
      )
      .map(line => {
        // Replace temp path with component name for clean error messages
        return line.replace(new RegExp(path.join(process.cwd(), '.temp-ts-validation'), 'g'), '');
      })
      .filter(line => line.trim().length > 0);

    // Count actual TS errors (lines with "error TS")
    const tsErrors = errorLines.filter(line => line.includes('error TS'));

    // Clean up temp directory
    try {
      await fs.remove(tempDir);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    return {
      valid: false,
      errors: errorLines,
      totalErrors: tsErrors.length,
      message: `TypeScript errors found: ${tsErrors.length}`
    };
  }
}
