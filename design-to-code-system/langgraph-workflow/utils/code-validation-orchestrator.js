#!/usr/bin/env node

/**
 * CODE VALIDATION ORCHESTRATOR
 *
 * Centralized validation runner that orchestrates all code quality checks:
 * - Import validation (deterministic)
 * - TypeScript validation (deterministic)
 * - Reusability validation (AI-powered)
 *
 * Keeps the generator-subgraph clean by encapsulating all validation logic.
 */

import { validateImportsAgainstLibrary } from './validate-imports-in-memory.js';
import { validateTypeScript } from './validate-typescript-in-memory.js';
import { validateReusability } from './validate-component-reusability.js';

/**
 * Run all validations on generated code
 * @param {string} code - Generated component code
 * @param {object} componentSpec - Component specification
 * @param {object} libraryContext - Available library components
 * @returns {Promise<object>} Consolidated validation results
 */
export async function runAllValidations(code, componentSpec, libraryContext) {
  const results = {
    allPassed: true,
    validations: {
      imports: { passed: true, issues: [] },
      typescript: { passed: true, issues: [] },
      reusability: { passed: true, issues: [], score: 1.0 }
    },
    criticalIssues: [],
    scoreAdjustments: {}
  };

  // 1. Import Validation
  console.log(`    Import validation: running...`);
  const importValidation = validateImportsAgainstLibrary(code, libraryContext);

  if (!importValidation.valid) {
    console.log(`    Import validation: ❌ ${importValidation.totalImports} invalid import(s)`);
    results.validations.imports.passed = false;
    results.validations.imports.issues = importValidation.issues;
    results.allPassed = false;

    // Add to critical issues
    const importIssues = importValidation.issues.map(issue => `[Import] ${issue}`);
    results.criticalIssues.push(...importIssues);

    // Suggest score adjustment
    results.scoreAdjustments.importsAndLibrary = 3;
  } else {
    console.log(`    Import validation: ✅`);
  }

  // 2. TypeScript Validation
  console.log(`    TypeScript validation: running...`);
  const tsValidation = await validateTypeScript(code, componentSpec.name);

  if (!tsValidation.valid && tsValidation.totalErrors > 0) {
    console.log(`    TypeScript validation: ❌ ${tsValidation.totalErrors} error(s)`);

    // Show first 2 errors
    const errorPreview = tsValidation.errors
      .filter(err => err.includes('error TS'))
      .slice(0, 2);

    errorPreview.forEach(err => {
      const shortErr = err.length > 100 ? err.substring(0, 100) + '...' : err;
      console.log(`      ${shortErr}`);
    });

    if (tsValidation.totalErrors > 2) {
      console.log(`      ... and ${tsValidation.totalErrors - 2} more error(s)`);
    }

    results.validations.typescript.passed = false;
    results.validations.typescript.issues = tsValidation.errors.filter(err => err.includes('error TS'));
    results.allPassed = false;

    // Add to critical issues
    const tsIssues = results.validations.typescript.issues.map(err => `[TypeScript] ${err}`);
    results.criticalIssues.push(...tsIssues);

    // Suggest score adjustment
    results.scoreAdjustments.typescript = 3;
  } else {
    console.log(`    TypeScript validation: ✅`);
  }

  // 3. Reusability Validation (AI-powered, checks component reuse)
  const reusabilityCheck = await validateReusability(code, libraryContext);

  console.log(`    Reusability: ${(reusabilityCheck.score * 100).toFixed(0)}% (${reusabilityCheck.totalIssues} issue${reusabilityCheck.totalIssues !== 1 ? 's' : ''})`);

  if (!reusabilityCheck.isValid && reusabilityCheck.issues.length > 0) {
    results.validations.reusability.passed = false;
    results.validations.reusability.issues = reusabilityCheck.issues;
    results.validations.reusability.score = reusabilityCheck.score;

    // Add to critical issues
    const reusabilityIssues = reusabilityCheck.issues.map(i => `[Reusability] ${i.suggestion}`);
    results.criticalIssues.push(...reusabilityIssues);

    // Suggest score adjustment if reusability is poor
    if (reusabilityCheck.score < 0.7) {
      results.scoreAdjustments.importsAndLibrary = Math.min(
        results.scoreAdjustments.importsAndLibrary || 10,
        6
      );
      results.allPassed = false;
    }
  }

  return results;
}

/**
 * Apply validation results to code review
 * Merges issues and adjusts scores
 * @param {object} review - AI code review result
 * @param {object} validationResults - Results from runAllValidations
 * @returns {object} Updated review with validation results
 */
export function applyValidationResults(review, validationResults) {
  // Merge critical issues
  review.criticalIssues = [
    ...(review.criticalIssues || []),
    ...validationResults.criticalIssues
  ];

  // Apply score adjustments
  Object.entries(validationResults.scoreAdjustments).forEach(([category, score]) => {
    review.scores[category] = Math.min(review.scores[category] || 10, score);
  });

  // Recalculate average score
  const scoreValues = Object.values(review.scores);
  review.averageScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
  review.passed = review.averageScore >= 8.0;

  return review;
}
