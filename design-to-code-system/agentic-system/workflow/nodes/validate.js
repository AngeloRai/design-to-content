/**
 * Validate Node
 * Two-tier validation system:
 * - Pass 1: Fix blocking TypeScript errors (MUST pass)
 * - Pass 2: Quality review for best practices (advisory)
 */

import path from 'path';
import { HumanMessage, SystemMessage, ToolMessage, trimMessages } from '@langchain/core/messages';
import { getChatModel } from '../../config/openai-client.js';
import { createToolExecutor, TOOLS } from '../../config/tool-executor.js';

/**
 * Pass 1: Fix TypeScript Errors (Blocking)
 * Focused agent that reads imports and fixes prop mismatches
 */
async function fixTypeScriptErrors(componentName, componentDetails, outputDir, registry) {
  console.log(`\n   🔧 Fixing TypeScript errors in ${componentName}...`);

  const { path: componentPath, errors } = componentDetails;

  // Create focused TypeScript specialist agent
  const model = getChatModel('gpt-4o-mini'); // Cheaper model for focused task
  const toolExecutor = createToolExecutor(null, registry, outputDir);

  const systemPrompt = `You are a TypeScript specialist fixing React component errors.

YOUR ONLY JOB: Fix TypeScript compilation errors.

CONTEXT:
- Component: ${componentName}
- File: ${componentPath}
- Output Directory: ${outputDir}
- Project Root: ${path.resolve(outputDir, '..')}
- TypeScript Errors:
${errors}

Note: All file paths are relative to the project root and are resolved automatically.

PROCESS (Follow exactly):
1. Call read_file('${componentPath}') to see the component code
2. Look at the imports - identify what components/libraries are imported
3. For EACH imported component from @/ui/*, call read_file to see its interface
   Example: If importing Button from '@/ui/elements/Button', read that file
4. Study the imported interfaces carefully (prop names, types, required vs optional)
5. Fix the component to match the interfaces EXACTLY
6. Call write_component with the corrected code
7. Validation runs automatically - check if it passes

COMMON ISSUES:
- Wrong prop names (using 'children' when interface expects 'label')
- Missing required props
- Wrong prop types (passing string when expecting function)
- Incorrect import paths
- Using props that don't exist in the interface

CRITICAL RULES:
- DO NOT change functionality - only fix type errors
- DO NOT modify imported components - only fix usage
- DO NOT give up - you have 10 iterations to fix this
- READ the imported files from @/ui/* - don't guess the interfaces
- NEVER try to read node_modules files or React type definitions
- DO NOT read @types/* files - just use the types directly in your code
- If you see a type like React.SelectHTMLAttributes, TRUST that TypeScript knows it

You MUST fix the error. Start by calling read_file.`;

  const userPrompt = `Fix the TypeScript errors in ${componentName}. Start by reading the file and its imports.`;

  let messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt)
  ];

  let continueLoop = true;
  let iterations = 0;
  const maxIterations = 10;
  let lastValidationResult = null;

  // Agent loop to fix the component
  while (continueLoop && iterations < maxIterations) {
    iterations++;

    // Trim messages to prevent context overflow using LangChain's trimMessages
    // Keep last ~50K tokens, always include system message
    if (messages.length > 6) {
      messages = await trimMessages(messages, {
        maxTokens: 50000,
        strategy: "last",
        tokenCounter: model,
        includeSystem: true,
        allowPartial: false
      });
    }

    // Invoke model with tools (v1.0 API)
    const response = await model.invoke(messages, { tools: TOOLS });
    messages.push(response);

    if (response.content) {
      console.log(`      Iteration ${iterations}: ${response.content.substring(0, 100)}...`);
    }

    // Process tool calls
    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        const functionName = toolCall.name;
        const functionArgs = toolCall.args;

        const result = await toolExecutor.execute(functionName, functionArgs);

        // Auto-validate after write_component
        if (functionName === 'write_component' && result.success) {
          const filePath = path.relative(
            path.resolve(outputDir, '..'),
            result.path
          );
          const validation = await toolExecutor.execute('validate_typescript', { file_path: filePath });

          if (validation.valid) {
            console.log(`      ✅ Fixed! TypeScript validation passed`);
            lastValidationResult = { success: true, iterations };
            continueLoop = false;
          } else {
            console.log(`      ❌ Still has errors, continuing...`);
            result.validationErrors = validation.errors;
            result.message = `Validation failed:\n${validation.errors}\n\nRead the imported files and fix the prop usage.`;
            lastValidationResult = { success: false, errors: validation.errors };
          }
        }

        // Add tool result as ToolMessage (v1.0 API)
        const toolMessage = new ToolMessage({
          content: JSON.stringify(result),
          tool_call_id: toolCall.id
        });
        messages.push(toolMessage);
      }
    } else {
      // No tool calls, agent wants to exit
      continueLoop = false;
    }
  }

  if (iterations >= maxIterations) {
    console.log(`      ⚠️  Max iterations reached, component still has errors`);
  }

  return lastValidationResult || { success: false, errors: componentDetails.errors };
}

/**
 * Pass 2: Quality Review (Advisory)
 * Senior reviewer acts as experienced developer doing comprehensive manual code review
 */
async function reviewComponentQuality(componentName, componentPath, outputDir, registry) {
  console.log(`\n   📋 Reviewing quality: ${componentName}...`);

  const model = getChatModel('gpt-4o'); // Use full model for nuanced quality review
  const toolExecutor = createToolExecutor(null, registry, outputDir);

  // Load reference patterns for the agent to follow
  const { loadReferencePatterns } = await import('../prompts/agent-prompts.js');
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
- **Project Root**: ${path.resolve(outputDir, '..')}

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
- [ ] Omits 'size' from HTML props if component defines custom size prop
- [ ] Omits 'onChange' if component uses custom handler like onValueChange
- [ ] Exports interface for external usage

### 2. NEXT.JS BEST PRACTICES REVIEW

- [ ] Uses next/image <Image> component, NOT <img> tag
- [ ] Uses next/link <Link> component, NOT <a> tag (except for external URLs)
- [ ] External links have target="_blank" rel="noopener noreferrer"
- [ ] Image components have proper alt text
- [ ] No 'use client' directive unless component truly needs it (state, events, browser APIs)

### 3. REACT BEST PRACTICES REVIEW

- [ ] Proper prop destructuring with defaults
- [ ] Correct handling of event handlers (both native onChange AND custom onValueChange)
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

### 5. COMPONENT STRUCTURE REVIEW

- [ ] Clear, descriptive component and prop names
- [ ] Proper TypeScript types (no 'any')
- [ ] Default exports for components
- [ ] Props interface defined before component
- [ ] Logical prop ordering (required first, optional after)

## YOUR PROCESS

1. Call read_file('${componentPath}') - study the entire component carefully
2. Go through EACH checklist item above - manually verify compliance
3. For EVERY missing pattern, you MUST upgrade the component
4. Call write_component with the FULLY UPGRADED component code
5. After writing, call check_code_quality('${componentPath}') to verify
6. If ALL checklist items pass after upgrade, say "Component meets all quality standards"

IMPORTANT: If you find ANY checklist items failing (forwardRef missing, no useId, template literal className, etc.),
you MUST call write_component to fix them. Do NOT skip write_component or say "no issues" without upgrading.

## AVAILABLE TOOLS

You have access to these tools:
- **read_file**: Read any file in the codebase
- **write_component**: Write/update component files
- **check_code_quality**: Run ESLint checks
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
    new HumanMessage(userPrompt)
  ];

  let continueLoop = true;
  let iterations = 0;
  const maxIterations = 5;
  const improvements = [];

  while (continueLoop && iterations < maxIterations) {
    iterations++;

    // Trim messages using LangChain's trimMessages
    if (messages.length > 6) {
      messages = await trimMessages(messages, {
        maxTokens: 50000,
        strategy: "last",
        tokenCounter: model,
        includeSystem: true,
        allowPartial: false
      });
    }

    const response = await model.invoke(messages, { tools: TOOLS });
    messages.push(response);

    // Debug logging
    if (response.content) {
      const preview = response.content.substring(0, 150).replace(/\n/g, ' ');
      console.log(`      [iter ${iterations}] ${preview}...`);
    }

    // Agent indicates review is complete
    if (response.content && response.content.toLowerCase().includes('meets all quality standards')) {
      console.log(`      ✅ Component meets all quality standards`);
      continueLoop = false;
      break;
    }

    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        const functionName = toolCall.name;
        const functionArgs = toolCall.args;

        const result = await toolExecutor.execute(functionName, functionArgs);

        // Track improvements made
        if (functionName === 'write_component' && result.success) {
          improvements.push(`Upgraded ${componentName} (iteration ${iterations})`);
        }

        // Track quality issues found
        if (functionName === 'check_code_quality') {
          if (result.issues && result.issues.length > 0) {
            result.issues.forEach(issue => {
              improvements.push(`${issue.rule}: ${issue.message}`);
            });
          }
        }

        const toolMessage = new ToolMessage({
          content: JSON.stringify(result),
          tool_call_id: toolCall.id
        });
        messages.push(toolMessage);
      }
    } else {
      continueLoop = false;
    }
  }

  return {
    reviewed: true,
    iterations,
    improvements
  };
}

/**
 * Main validation node
 * Always runs to ensure code quality
 */
export async function validateNode(state) {
  console.log('\n🔍 Phase: Validation & Quality Review');
  console.log('='.repeat(60));

  const { failedComponents, outputDir, registry, generatedComponents } = state;

  const stillFailing = {};
  const fixed = [];

  // PASS 1: Fix blocking TypeScript errors (if any)
  if (failedComponents && Object.keys(failedComponents).length > 0) {
    console.log(`Found ${Object.keys(failedComponents).length} component(s) with TypeScript errors\n`);
    console.log('📋 Pass 1: TypeScript Validation (Blocking)');
    console.log('-'.repeat(60));

    for (const [componentName, details] of Object.entries(failedComponents)) {
      const result = await fixTypeScriptErrors(componentName, details, outputDir, registry);

      if (result.success) {
        fixed.push(componentName);
      } else {
        stillFailing[componentName] = {
          ...details,
          errors: result.errors,
          attemptedFix: true
        };
      }
    }

    console.log('\n' + '-'.repeat(60));
    console.log(`✅ Fixed: ${fixed.length} component(s)`);
    if (fixed.length > 0) {
      console.log(`   ${fixed.join(', ')}`);
    }
    console.log(`❌ Still failing: ${Object.keys(stillFailing).length} component(s)`);
    if (Object.keys(stillFailing).length > 0) {
      console.log(`   ${Object.keys(stillFailing).join(', ')}`);
    }
  } else {
    console.log('✅ No TypeScript errors detected\n');
  }

  // PASS 2: Quality Review for ALL components (always runs)
  console.log('\n📋 Pass 2: Quality Review (Advisory)');
  console.log('-'.repeat(60));
  console.log(`Reviewing ${generatedComponents} generated component(s) for best practices...`);
  console.log('   - React/Next.js patterns');
  console.log('   - Unused imports/variables');
  console.log('   - Accessibility standards');
  console.log('   - Code quality\n');

  // Get all component files from the registry
  const componentsToReview = [];
  if (registry && registry.components) {
    for (const [type, components] of Object.entries(registry.components)) {
      components.forEach(comp => {
        componentsToReview.push({
          name: comp.name,
          path: `ui/${type}/${comp.name}.tsx`
        });
      });
    }
  }

  const qualityResults = {};

  for (const component of componentsToReview) {
    const result = await reviewComponentQuality(
      component.name,
      component.path,
      outputDir,
      registry
    );
    qualityResults[component.name] = result;
  }

  // Summary of quality review
  const reviewedCount = Object.keys(qualityResults).length;
  const improvedCount = Object.values(qualityResults).filter(
    result => result.improvements && result.improvements.length > 0
  ).length;

  console.log('\n' + '-'.repeat(60));
  console.log(`✅ Reviewed: ${reviewedCount} component(s)`);
  console.log(`🔧 Improved: ${improvedCount} component(s)`);

  // Debug: Show what happened with each component
  for (const [componentName, result] of Object.entries(qualityResults)) {
    if (result.improvements && result.improvements.length > 0) {
      console.log(`   ✓ ${componentName}: ${result.improvements.length} improvement(s)`);
    } else {
      console.log(`   - ${componentName}: No improvements (${result.iterations} iteration(s))`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');

  return {
    ...state,
    failedComponents: stillFailing,
    validationResults: qualityResults,
    validationAttempted: true,
    currentPhase: 'finalize'
  };
}
