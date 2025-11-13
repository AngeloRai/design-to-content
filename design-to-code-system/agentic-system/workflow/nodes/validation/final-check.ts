/**
 * Final Check Node
 * Pass 3: Run comprehensive tsc + eslint validation on all components
 * Ensures nothing was missed before finalizing
 */

import path from 'path';
import { fileURLToPath } from 'url';
import type { ValidationState, NodeResult, ValidationIssue } from '../../../types/workflow.js';
import type { ComponentMetadata } from '../../../types/component.js';
import {
  runTypeScriptValidation,
  runESLintValidation,
  type ESLintIssue
} from '../../../utils/validation-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ComponentPathInfo {
  name: string;
  type: string;
  path: string;
}

export async function finalCheckNode(state: ValidationState): Promise<NodeResult> {
  console.log('\n📗 Pass 3: Final Validation Check');
  console.log('='.repeat(60));

  const { outputDir, registry, finalCheckAttempts = 0 } = state;

  // CRITICAL FIX: outputDir is stored relative to wherever the workflow was launched from
  // Just resolve it using current working directory, don't try to calculate relative paths
  const absoluteOutputDir = path.resolve(process.cwd(), outputDir);
  const projectRoot = path.dirname(absoluteOutputDir);

  console.log(`   📍 DEBUG: process.cwd() = ${process.cwd()}`);
  console.log(`   📍 DEBUG: outputDir = ${outputDir}`);
  console.log(`   📍 DEBUG: absoluteOutputDir = ${absoluteOutputDir}`);
  console.log(`   📍 DEBUG: projectRoot = ${projectRoot}\n`);

  console.log('Running comprehensive validation on all components...\n');

  // Run both checks in parallel using shared validation utilities
  // Both TypeScript and ESLint should scan only the 'ui' directory
  const relativePath = path.basename(absoluteOutputDir); // Just 'ui'
  const [tscResult, eslintResult] = await Promise.all([
    runTypeScriptValidation(projectRoot, relativePath, { verbose: true }),
    runESLintValidation(projectRoot, relativePath, { verbose: true })
  ]);

  console.log('\n🔍 VALIDATION RESULTS DEBUG:');
  console.log(`   TypeScript result:`, JSON.stringify(tscResult, null, 2));
  console.log(`   ESLint result:`, JSON.stringify(eslintResult, null, 2));
  console.log(`   tscResult.valid: ${tscResult.valid}`);
  console.log(`   eslintResult.valid: ${eslintResult.valid}`);

  const allPassed = tscResult.valid && eslintResult.valid;

  console.log(`   allPassed: ${allPassed}\n`);

  if (allPassed) {
    console.log('\n' + '-'.repeat(60));
    console.log('✅ All validation checks passed!');
    console.log('='.repeat(60) + '\n');

    return {
      ...state,
      finalCheckPassed: true,
      failedComponents: {},
      currentPhase: 'finalize',
      finalCheckAttempts: finalCheckAttempts + 1
    };
  }

  // Build failedComponents object from errors
  // Use registry to get authoritative list of components and their paths
  const failedComponents: Record<string, {
    name: string;
    type: string;
    path: string;
    errors: string[];
    issues: ValidationIssue[];
  }> = {};

  // Build component path map from registry
  const componentPathMap: Record<string, ComponentPathInfo> = {};
  if (registry && registry.components) {
    for (const [type, components] of Object.entries(registry.components)) {
      (components as ComponentMetadata[]).forEach(comp => {
        componentPathMap[comp.name] = {
          name: comp.name,
          type,
          path: comp.path // Use absolute path from registry
        };
      });
    }
  }

  // Add TypeScript errors (match against registry components)
  if (tscResult.componentErrors) {
    for (const [componentName, errors] of Object.entries(tscResult.componentErrors)) {
      // Only track components that are in the registry
      if (componentPathMap[componentName]) {
        if (!failedComponents[componentName]) {
          failedComponents[componentName] = {
            name: componentName,
            type: componentPathMap[componentName].type,
            path: componentPathMap[componentName].path,
            errors: [],
            issues: []
          };
        }
        failedComponents[componentName].errors.push(...(errors as string[]));
      }
    }
  }

  // Add ESLint issues (match against registry components)
  if (eslintResult.componentIssues) {
    for (const [componentName, issues] of Object.entries(eslintResult.componentIssues)) {
      // Only track components that are in the registry
      if (componentPathMap[componentName]) {
        if (!failedComponents[componentName]) {
          failedComponents[componentName] = {
            name: componentName,
            type: componentPathMap[componentName].type,
            path: componentPathMap[componentName].path,
            errors: [],
            issues: []
          };
        }
        // Convert ESLintIssue to ValidationIssue format
        const validationIssues: ValidationIssue[] = issues.map(issue => ({
          line: issue.line,
          column: issue.column,
          message: issue.message,
          rule: issue.rule || undefined,
          severity: issue.severity === 2 ? 'error' as const : 'warning' as const
        }));
        failedComponents[componentName].issues.push(...validationIssues);
      }
    }
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`❌ Validation failed for ${Object.keys(failedComponents).length} component(s)`);
  console.log(`   Components: ${Object.keys(failedComponents).join(', ')}`);
  console.log(`   Attempt: ${finalCheckAttempts + 1}`);
  console.log('='.repeat(60) + '\n');

  return {
    ...state,
    finalCheckPassed: false,
    failedComponents,
    currentPhase: 'decide_next',
    finalCheckAttempts: finalCheckAttempts + 1
  };
}
