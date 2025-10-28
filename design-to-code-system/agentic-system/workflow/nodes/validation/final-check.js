/**
 * Final Check Node
 * Pass 3: Run comprehensive tsc + eslint validation on all components
 * Ensures nothing was missed before finalizing
 */

import path from 'path';
import {
  runTypeScriptValidation,
  runESLintValidation
} from '../../../utils/validation-utils.js';

export async function finalCheckNode(state) {
  console.log('\n📗 Pass 3: Final Validation Check');
  console.log('='.repeat(60));

  const { outputDir, registry, finalCheckAttempts = 0 } = state;
  const projectRoot = path.resolve(outputDir, '..');

  console.log('Running comprehensive validation on all components...\n');

  // Run both checks in parallel using shared validation utilities
  const [tscResult, eslintResult] = await Promise.all([
    runTypeScriptValidation(projectRoot, { verbose: true }),
    runESLintValidation(projectRoot, outputDir, { verbose: true })
  ]);

  const allPassed = tscResult.valid && eslintResult.valid;

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
  const failedComponents = {};

  // Build component path map from registry
  const componentPathMap = {};
  if (registry && registry.components) {
    for (const [type, components] of Object.entries(registry.components)) {
      components.forEach(comp => {
        componentPathMap[comp.name] = {
          name: comp.name,
          type,
          path: `ui/${type}/${comp.name}.tsx`
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
        failedComponents[componentName].errors.push(...errors);
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
        failedComponents[componentName].issues.push(...issues);
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
