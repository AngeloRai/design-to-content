/**
 * Quality Review Node
 * Pass 2: Apply accessibility patterns and best practices
 * Senior reviewer acts as experienced developer doing comprehensive manual code review
 */

import path from "path";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
  trimMessages,
} from "@langchain/core/messages";
import { getChatModel } from "../../../config/openai-client.js";
import { createToolExecutor, TOOLS } from "../../../utils/tool-executor.js";

async function reviewComponentQuality(
  componentName,
  componentPath,
  outputDir,
  registry,
  attempt = 1
) {
  console.log(`\n   📋 Reviewing quality: ${componentName}...`);

  const model = getChatModel("gpt-4o"); // Use full model for nuanced quality review
  const toolExecutor = createToolExecutor(null, registry, outputDir);

  // Load reference patterns for the agent to follow
  const { loadReferencePatterns } = await import(
    "../../prompts/agent-prompts.js"
  );
  const referencePatterns = await loadReferencePatterns();

  const systemPrompt = `You are a senior React/Next.js developer conducting a comprehensive, manual code quality review.

${referencePatterns}

---

## YOUR CURRENT TASK

Review ${componentName} at ${componentPath} as an experienced developer would during a pull request review.

YOU ARE NOT JUST RUNNING AUTOMATED TOOLS - you are manually reviewing every aspect of the code against best practices.

## DIRECTORY CONTEXT

- **Output Directory**: ${outputDir}
- **Component Path**: ${componentPath} (relative to project root)
- **Project Root**: ${path.resolve(outputDir, "..")}

When calling read_file, use the relative path: '${componentPath}'
All paths are resolved automatically against the project root.

## COMPREHENSIVE REVIEW CHECKLIST

Go through EACH category and verify compliance. Apply ALL applicable patterns from the reference above.

### 1. ACCESSIBILITY & REUSABILITY REVIEW (CRITICAL)

For interactive components (inputs, buttons, selects, etc.):
- [ ] Uses React.forwardRef() to expose ref for parent components
- [ ] Uses useId() hook for unique, stable IDs (label-input associations)
- [ ] Has proper ARIA attributes (aria-invalid, aria-describedby, aria-label where needed)
- [ ] Label elements properly associated with inputs via htmlFor={id}
- [ ] Error/helper text linked via aria-describedby
- [ ] Required fields marked with required attribute and visual indicator
- [ ] Disabled states properly handled

For className management:
- [ ] Uses cn() utility from '@/lib/utils' instead of template literals
- [ ] Follows pattern: cn(baseClasses, variantClasses, conditionalClasses, className)

For TypeScript interfaces:
- [ ] Extends proper HTML element props (e.g., React.InputHTMLAttributes<HTMLInputElement>)
- [ ] Uses Omit<> when HTML attributes conflict with custom props (e.g., 'size', 'type')
- [ ] NEVER omit event handlers like 'onChange' - always extract them in destructuring if needed
- [ ] Exports interface for external usage

### 2. NEXT.JS BEST PRACTICES REVIEW

- [ ] Uses next/image <Image> component, NOT <img> tag
- [ ] Uses next/link <Link> component, NOT <a> tag (except for external URLs)
- [ ] External links have target="_blank" rel="noopener noreferrer"
- [ ] Image components have proper alt text
- [ ] No 'use client' directive unless component truly needs it (state, events, browser APIs)

### 3. REACT BEST PRACTICES REVIEW

- [ ] Proper prop destructuring with defaults
- [ ] Event handlers extracted in destructuring if accessed (example: const Component = ({ onChange, onValueChange, ...props }) => ...)
- [ ] CRITICAL: If interface uses Omit to remove a prop, that prop MUST be extracted in destructuring to be accessible
- [ ] No unused variables or imports
- [ ] Proper key props in mapped lists
- [ ] Conditional rendering done cleanly (ternary or logical &&)
- [ ] No console.log statements
- [ ] No commented-out code

### 4. TAILWIND/STYLING REVIEW

- [ ] Uses Tailwind utility classes, not arbitrary values (px-4 not px-[16px])
- [ ] Uses theme colors, not hardcoded hex values
- [ ] Mobile-first responsive design (sm:, md:, lg: breakpoints)
- [ ] Proper spacing scale (p-4, gap-2, not random values)
- [ ] Hover/focus/active states defined for interactive elements
- [ ] Transitions for smooth interactions (transition-colors, duration-200)
- [ ] Uses canonical class names: 'grow' not 'flex-grow', 'shrink' not 'flex-shrink', 'basis-0' not 'flex-basis-0'
- [ ] No redundant or conflicting classes

### 5. COMPONENT STRUCTURE REVIEW

- [ ] Clear, descriptive component and prop names
- [ ] Proper TypeScript types (no 'any')
- [ ] Default exports for components
- [ ] Props interface defined before component
- [ ] Logical prop ordering (required first, optional after)

## VALIDATION REQUIREMENTS (CRITICAL)

Before you can say "Component meets all quality standards", you MUST verify:

1. **TypeScript Compilation**: Call validate_typescript('${componentPath}') - MUST return valid: true
2. **ESLint Quality**: Call check_code_quality('${componentPath}') - MUST return 0 issues
3. **Pattern Compliance**: ALL checklist items above pass

ONLY say "Component meets all quality standards" if ALL THREE are confirmed.

If ANY validation fails, you MUST:
- Call write_component to fix the issues
- Re-validate after fixing
- Continue until ALL validations pass

DO NOT rely on visual inspection alone. ALWAYS validate programmatically.

## YOUR PROCESS

1. Call read_file('${componentPath}') - study the entire component carefully
2. Call validate_typescript('${componentPath}') - check TypeScript compilation
3. Call check_code_quality('${componentPath}') - check ESLint
4. Go through EACH checklist item above - manually verify compliance
5. For EVERY missing pattern or validation error, you MUST upgrade the component
6. Call write_component with the FULLY UPGRADED component code
7. ⚡ AUTOMATIC VALIDATION: After write_component, the system automatically runs validate_typescript and check_code_quality
   - You will see the results in the write_component response under "autoValidation"
   - typescript: "PASS" or "FAIL"
   - eslint: "PASS" or "FAIL"
   - If FAIL, you'll see the errors and must fix them
8. If autoValidation shows PASS for both AND all checklist items are complete, say "Component meets all quality standards"

IMPORTANT:
- After write_component, CHECK THE autoValidation RESULTS before claiming success
- If autoValidation shows FAIL, you MUST call write_component again to fix the errors
- Do NOT say "meets all standards" if autoValidation shows any failures

## AVAILABLE TOOLS

You have access to these tools:
- **read_file**: Read any file in the codebase
- **write_component**: Write/update component files
- **validate_typescript**: Validate TypeScript compilation (checks for type errors)
- **check_code_quality**: Run ESLint checks (checks for linting issues)
- **list_directory**: Explore directory structure (use to see what files exist)
- **get_registry**: See all existing components

If you're unsure about file locations or what exists, use list_directory to explore.

## CRITICAL RULES

- DO NOT rely only on automated tools - YOU are the expert reviewer
- DO NOT say "looks good" unless EVERY checklist item is verified
- DO upgrade basic components to production-ready quality
- DO apply accessibility patterns to ALL interactive components
- DO NOT change functionality or break existing behavior
- DO NOT break TypeScript types
- If component is already production-ready with all patterns, THEN say "Component meets all quality standards"

## EXAMPLES OF UPGRADES YOU SHOULD MAKE

Basic TextInput → Add forwardRef + useId + ARIA + cn() utility + proper error handling
Basic Button → Add forwardRef + proper variants + cn() utility + loading state support
Basic SelectDropdown → Add forwardRef + useId + ARIA + proper label association
img tag → Replace with next/image <Image>
a tag → Replace with next/link <Link> (or keep for external)
Template literal classNames → Replace with cn() utility

Start by reading the file and doing your comprehensive review.`;

  const userPrompt = `Conduct a comprehensive quality review of ${componentName}. Go through the entire checklist and upgrade to production-ready quality.`;

  let messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt),
  ];

  let continueLoop = true;
  let iterations = 0;
  const maxIterations = 3;
  const improvements = [];
  let hasValidationErrors = false;

  while (continueLoop && iterations < maxIterations) {
    iterations++;

    // If we've made improvements and no validation errors, exit early
    if (iterations > 1 && improvements.length > 0 && !hasValidationErrors) {
      console.log(
        `      ✅ Component improved, no validation errors - completing review`
      );
      continueLoop = false;
      break;
    }

    // Trim messages using LangChain's trimMessages
    if (messages.length > 6) {
      messages = await trimMessages(messages, {
        maxTokens: 50000,
        strategy: "last",
        tokenCounter: model,
        includeSystem: true,
        allowPartial: false,
      });
    }

    const response = await model.invoke(messages, { tools: TOOLS });
    messages.push(response);

    // FIRST: Process any tool calls the agent made
    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        const functionName = toolCall.name;
        const functionArgs = toolCall.args;

        const result = await toolExecutor.execute(functionName, functionArgs);

        // Track improvements made
        if (functionName === "write_component" && result.success) {
          improvements.push(
            `Upgraded ${componentName} (iteration ${iterations})`
          );

          // AUTOMATIC POST-WRITE VALIDATION
          // After write_component, immediately validate to show agent if upgrade worked
          console.log(`      🔍 Auto-validating after write_component...`);

          const tsValidation = await toolExecutor.execute(
            "validate_typescript",
            {
              file_path: componentPath,
            }
          );

          const eslintValidation = await toolExecutor.execute(
            "check_code_quality",
            {
              file_path: componentPath,
            }
          );

          const tsValid = tsValidation && tsValidation.valid;
          const eslintValid =
            !eslintValidation.issues || eslintValidation.issues.length === 0;

          console.log(
            `         TypeScript: ${tsValid ? "✅ PASS" : "❌ FAIL"}`
          );
          console.log(
            `         ESLint: ${eslintValid ? "✅ PASS" : "❌ FAIL"}`
          );

          // Track if there are validation errors
          hasValidationErrors = !tsValid || !eslintValid;

          // Add validation results as additional context
          result.autoValidation = {
            typescript: tsValid ? "PASS" : "FAIL",
            eslint: eslintValid ? "PASS" : "FAIL",
            typescriptErrors: tsValid ? null : tsValidation.errors,
            eslintIssues: eslintValid ? null : eslintValidation.issues,
          };
        }

        // Track quality issues found
        if (functionName === "check_code_quality") {
          if (result.issues && result.issues.length > 0) {
            result.issues.forEach((issue) => {
              improvements.push(`${issue.rule}: ${issue.message}`);
            });
          }
        }

        const toolMessage = new ToolMessage({
          content: JSON.stringify(result),
          tool_call_id: toolCall.id,
        });
        messages.push(toolMessage);
      }
    }

    // SECOND: Check if agent claims standards are met - VERIFY with actual validation
    if (
      response.content &&
      response.content.toLowerCase().includes("meets all quality standards")
    ) {
      console.log(
        `      ⚙️  Agent claims component meets standards - verifying...`
      );

      // FORCE validation before accepting the claim
      const tsValidation = await toolExecutor.execute("validate_typescript", {
        file_path: componentPath,
      });

      const eslintValidation = await toolExecutor.execute(
        "check_code_quality",
        {
          file_path: componentPath,
        }
      );

      const tsValid = tsValidation && tsValidation.valid;
      const eslintValid =
        !eslintValidation.issues || eslintValidation.issues.length === 0;

      if (tsValid && eslintValid) {
        console.log(
          `      ✅ Component meets all quality standards (verified)`
        );
        continueLoop = false;
      } else {
        console.log(
          `      ❌ Component has validation errors despite agent claim`
        );
        console.log(`         TypeScript: ${tsValid ? "PASS" : "FAIL"}`);
        console.log(`         ESLint: ${eslintValid ? "PASS" : "FAIL"}`);

        // Force agent to see the actual errors
        const errorDetails = [];
        if (!tsValid) {
          errorDetails.push(
            `TypeScript errors:\n${tsValidation.errors || "Unknown errors"}`
          );
        }
        if (
          !eslintValid &&
          eslintValidation.issues &&
          Array.isArray(eslintValidation.issues)
        ) {
          const eslintSummary = eslintValidation.issues
            .map((i) => `  - ${i.message} (${i.rule})`)
            .join("\n");
          errorDetails.push(`ESLint issues:\n${eslintSummary}`);
        } else if (!eslintValid) {
          errorDetails.push(
            `ESLint validation failed - unable to parse results`
          );
        }

        messages.push(
          new HumanMessage(
            `Your assessment is INCORRECT. The component has validation errors:\n\n` +
              errorDetails.join("\n\n") +
              "\n\n" +
              `You MUST call write_component to fix these errors. ` +
              `Do NOT say "meets all standards" until validation actually passes.`
          )
        );
        // Continue loop to force fixes
      }
    }

    // THIRD: If no tool calls and no "meets standards" claim, stop the loop
    if (!response.tool_calls || response.tool_calls.length === 0) {
      if (
        !response.content ||
        !response.content.toLowerCase().includes("meets all quality standards")
      ) {
        continueLoop = false;
      }
    }
  }

  return {
    reviewed: true,
    iterations,
    improvements,
  };
}

export async function qualityReviewNode(state) {
  console.log("\n📗 Pass 2: Quality Review (Advisory)");
  console.log("=".repeat(60));

  const {
    outputDir,
    registry,
    generatedComponents,
    failedComponents,
    finalCheckAttempts = 0,
    validatedComponents = [],
  } = state;

  // OPTIMIZATION: Only review failed components if this is a retry loop
  // On first pass (finalCheckAttempts === 0), review all components
  // On retry passes, only review components that failed final_check
  const isRetry = finalCheckAttempts > 0;
  const hasFailures =
    failedComponents && Object.keys(failedComponents).length > 0;
  const shouldReviewAll = !isRetry || !hasFailures;

  let componentsToReview = [];

  if (shouldReviewAll) {
    console.log(
      `Reviewing all ${generatedComponents} generated component(s) for best practices...`
    );
    console.log("   - React/Next.js patterns");
    console.log("   - Unused imports/variables");
    console.log("   - Accessibility standards");
    console.log("   - Code quality\n");

    // Get all component files from the registry
    if (registry && registry.components) {
      for (const [type, components] of Object.entries(registry.components)) {
        components.forEach((comp) => {
          componentsToReview.push({
            name: comp.name,
            type: type,
            path: comp.path, // Use absolute path from registry
          });
        });
      }
    }
  } else {
    // Only review components that failed final_check (targeted fixes)
    const failedCount = Object.keys(failedComponents).length;
    console.log(
      `Reviewing only ${failedCount} failed component(s) for targeted fixes (retry ${finalCheckAttempts})...`
    );
    console.log("   - Fixing specific TypeScript/ESLint issues");
    console.log("   - Applying required patterns\n");

    for (const [componentName] of Object.entries(failedComponents)) {
      // Find component in registry to get its type and path
      let found = false;
      if (registry && registry.components) {
        for (const [type, components] of Object.entries(registry.components)) {
          const comp = components.find((c) => c.name === componentName);
          if (comp) {
            componentsToReview.push({
              name: componentName,
              type: type,
              path: comp.path, // Use absolute path from registry
            });
            found = true;
            break;
          }
        }
      }

      if (!found) {
        console.log(
          `   ⚠️  Could not find ${componentName} in registry, skipping...`
        );
      }
    }
  }

  const qualityResults = {};

  for (const component of componentsToReview) {
    const result = await reviewComponentQuality(
      component.name,
      component.path,
      outputDir,
      registry,
      finalCheckAttempts + 1 // Pass attempt number for logging
    );
    qualityResults[component.name] = result;
  }

  // Summary of quality review
  const reviewedCount = Object.keys(qualityResults).length;
  const improvedCount = Object.values(qualityResults).filter(
    (result) => result.improvements && result.improvements.length > 0
  ).length;

  console.log("\n" + "-".repeat(60));
  console.log(`✅ Reviewed: ${reviewedCount} component(s)`);
  console.log(`🔧 Improved: ${improvedCount} component(s)`);

  // Debug: Show what happened with each component
  for (const [componentName, result] of Object.entries(qualityResults)) {
    if (result.improvements && result.improvements.length > 0) {
      console.log(
        `   ✓ ${componentName}: ${result.improvements.length} improvement(s)`
      );
    } else {
      console.log(
        `   - ${componentName}: No improvements (${result.iterations} iteration(s))`
      );
    }
  }

  console.log("\n" + "=".repeat(60) + "\n");

  // Track successfully validated components
  const newValidatedComponents = [];
  for (const component of componentsToReview) {
    const componentPath = path.join(outputDir, component.path);
    // If component was reviewed and has no remaining issues, mark as validated
    const result = qualityResults[component.name];
    // Component is validated if it was reviewed and had no issues or only improvements
    if (result && result.reviewed) {
      newValidatedComponents.push(componentPath);
    }
  }

  return {
    ...state,
    validationResults: qualityResults,
    validatedComponents: [...validatedComponents, ...newValidatedComponents],
  };
}
