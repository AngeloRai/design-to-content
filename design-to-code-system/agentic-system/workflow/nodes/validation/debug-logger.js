/**
 * Debug Logger for Validation
 * Saves prompts and agent interactions to files for debugging
 */

import fs from 'fs/promises';
import path from 'path';

const DEBUG_DIR = 'validation-logs';

/**
 * Ensure debug directory exists
 */
async function ensureDebugDir() {
  try {
    await fs.mkdir(DEBUG_DIR, { recursive: true });
  } catch (error) {
    console.error(`Failed to create debug directory: ${error.message}`);
  }
}

/**
 * Log validation prompt to file
 * @param {string} nodeName - Name of the validation node (typescript-fix, quality-review, etc.)
 * @param {string} componentName - Component being validated
 * @param {Object} prompt - Prompt data to log
 * @param {number} attempt - Validation attempt number
 */
export async function logValidationPrompt(nodeName, componentName, prompt, attempt = 1) {
  await ensureDebugDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${nodeName}_${componentName}_attempt${attempt}_${timestamp}.txt`;
  const filepath = path.join(DEBUG_DIR, filename);

  let content = '';
  content += `=`.repeat(80) + '\n';
  content += `VALIDATION DEBUG LOG\n`;
  content += `=`.repeat(80) + '\n';
  content += `Node: ${nodeName}\n`;
  content += `Component: ${componentName}\n`;
  content += `Attempt: ${attempt}\n`;
  content += `Timestamp: ${new Date().toISOString()}\n`;
  content += `=`.repeat(80) + '\n\n';

  if (typeof prompt === 'string') {
    content += prompt;
  } else if (prompt.systemPrompt && prompt.userPrompt) {
    content += `SYSTEM PROMPT:\n`;
    content += `-`.repeat(80) + '\n';
    content += prompt.systemPrompt + '\n\n';
    content += `USER PROMPT:\n`;
    content += `-`.repeat(80) + '\n';
    content += prompt.userPrompt + '\n\n';
  } else {
    content += JSON.stringify(prompt, null, 2);
  }

  content += '\n' + `=`.repeat(80) + '\n';

  try {
    await fs.writeFile(filepath, content, 'utf-8');
    console.log(`      📝 Debug log saved: ${filename}`);
  } catch (error) {
    console.error(`      ⚠️  Failed to save debug log: ${error.message}`);
  }
}

/**
 * Log agent iteration results
 * @param {string} nodeName - Name of the validation node
 * @param {string} componentName - Component being validated
 * @param {Array} iterations - Array of iteration data
 * @param {number} attempt - Validation attempt number
 */
export async function logAgentIterations(nodeName, componentName, iterations, attempt = 1) {
  await ensureDebugDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${nodeName}_${componentName}_iterations_attempt${attempt}_${timestamp}.txt`;
  const filepath = path.join(DEBUG_DIR, filename);

  let content = '';
  content += `=`.repeat(80) + '\n';
  content += `AGENT ITERATIONS LOG\n`;
  content += `=`.repeat(80) + '\n';
  content += `Node: ${nodeName}\n`;
  content += `Component: ${componentName}\n`;
  content += `Attempt: ${attempt}\n`;
  content += `Total Iterations: ${iterations.length}\n`;
  content += `Timestamp: ${new Date().toISOString()}\n`;
  content += `=`.repeat(80) + '\n\n';

  iterations.forEach((iter, index) => {
    content += `\nITERATION ${index + 1}\n`;
    content += `-`.repeat(80) + '\n';
    content += `Tool Calls: ${iter.toolCalls?.length || 0}\n`;
    if (iter.toolCalls) {
      iter.toolCalls.forEach((call, i) => {
        content += `  ${i + 1}. ${call.name}(${JSON.stringify(call.args).substring(0, 100)}...)\n`;
      });
    }
    content += `Response: ${iter.response?.substring(0, 200)}...\n`;
    content += '\n';
  });

  content += `=`.repeat(80) + '\n';

  try {
    await fs.writeFile(filepath, content, 'utf-8');
    console.log(`      📝 Iterations log saved: ${filename}`);
  } catch (error) {
    console.error(`      ⚠️  Failed to save iterations log: ${error.message}`);
  }
}

/**
 * Log validation results summary
 * @param {string} nodeName - Name of the validation node
 * @param {Object} results - Results data
 * @param {number} attempt - Validation attempt number
 */
export async function logValidationResults(nodeName, results, attempt = 1) {
  await ensureDebugDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${nodeName}_results_attempt${attempt}_${timestamp}.json`;
  const filepath = path.join(DEBUG_DIR, filename);

  try {
    await fs.writeFile(filepath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`      📝 Results saved: ${filename}`);
  } catch (error) {
    console.error(`      ⚠️  Failed to save results: ${error.message}`);
  }
}
