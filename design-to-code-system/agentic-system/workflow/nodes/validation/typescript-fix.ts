/**
 * TypeScript Fix Node
 * Pass 1: Fix TypeScript compilation errors
 * Focused agent that reads imports and fixes prop mismatches
 */

import path from "path";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
  trimMessages,
} from "@langchain/core/messages";
import { getChatModel } from "../../../config/openai-client.ts";
import { createToolExecutor, TOOLS } from "../../../tools/tool-executor.ts";
import type { ValidationState, NodeResult, ComponentFailureDetails } from "../../../types/workflow.js";
import type { ComponentRegistry } from "../../../types/component.js";
import type { BaseMessage } from "@langchain/core/messages";

interface ValidationResult {
  success: boolean;
  errors?: string;
  iterations?: number;
  tsValid?: boolean;
  eslintValid?: boolean;
}

interface AttemptHistoryItem {
  iteration: number;
  error: string;
  approach: string;
}

async function fixTypeScriptErrors(
  componentName: string,
  componentDetails: ComponentFailureDetails,
  outputDir: string,
  registry: ComponentRegistry | null
): Promise<ValidationResult> {
  console.log(`\n   🔧 Fixing TypeScript errors in ${componentName}...`);

  const { path: componentPath, errors } = componentDetails;

  // Create focused TypeScript specialist agent
  // Using gpt-4o for better reasoning on complex TypeScript errors
  const model = getChatModel("gpt-4o");
  const toolExecutor = createToolExecutor(null, registry, outputDir);

  const systemPrompt = `You are a TypeScript specialist fixing React component errors.

YOUR ONLY JOB: Fix TypeScript compilation errors.

CONTEXT:
- Component: ${componentName}
- File: ${componentPath}
- Output Directory: ${outputDir}
- Project Root: ${path.resolve(outputDir, "..")}
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
- DO NOT give up - you have 15 iterations to fix this
- READ the imported files from @/ui/* - don't guess the interfaces
- NEVER try to read node_modules files or React type definitions
- DO NOT read @types/* files - just use the types directly in your code
- If you try the same fix 3+ times and it fails, use search_help tool for different approaches

COMMON TYPESCRIPT & ESLINT FIXES:
1. "Cannot find namespace 'JSX'" → Add "import React from 'react';" at the top
2. "Component definition is missing display name" (ESLint react/display-name) →
   When using forwardRef, set displayName: ComponentName.displayName = 'ComponentName';
3. Missing React types → Ensure React is imported properly
4. forwardRef issues → Import React.forwardRef correctly
5. Type incompatibility → Check if interfaces match between components
6. Invalid ARIA attributes → Remove aria-* props that don't match the role

You MUST fix ALL errors (TypeScript AND ESLint). Start by calling read_file.`;

  // Format errors (handle both string and array)
  const errorsText = Array.isArray(componentDetails.errors)
    ? componentDetails.errors.join("\n")
    : componentDetails.errors || "No error details provided";

  const issuesText =
    componentDetails.issues && Array.isArray(componentDetails.issues)
      ? "\n" +
        componentDetails.issues
          .map((i) => `${i.message} (${i.rule})`)
          .join("\n")
      : "";

  const userPrompt = `Fix ALL errors in ${componentName} (TypeScript AND ESLint).

Errors to fix:
${errorsText}${issuesText}

Start by reading the file, then apply fixes systematically.`;

  let messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt),
  ];

  let continueLoop = true;
  let iterations = 0;
  const maxIterations = 15;
  let lastValidationResult: ValidationResult | null = null;
  const attemptHistory: AttemptHistoryItem[] = []; // Track what we've tried for stuck detection

  // Agent loop to fix the component
  while (continueLoop && iterations < maxIterations) {
    iterations++;

    // Detect if we're stuck (same error 3+ times)
    if (
      iterations > 3 &&
      lastValidationResult &&
      !lastValidationResult.success
    ) {
      const lastError = lastValidationResult.errors || "";
      const sameErrorCount = attemptHistory.filter(
        (a) => a.error && a.error.includes(lastError.substring(0, 50))
      ).length;

      if (sameErrorCount >= 3) {
        console.log(`      🔄 Stuck on same error, using search_help tool...`);

        // Build a list of previous approaches as strings for the search_help tool
        const previousApproaches = attemptHistory
          .slice(-3) // Last 3 attempts
          .map(a => `Iteration ${a.iteration}: ${a.approach}`)
          .filter(Boolean);

        // Add a message prompting the agent to search for help
        messages.push(
          new HumanMessage(
            `You've tried to fix this error ${sameErrorCount} times but it keeps failing:\n${lastError}\n\n` +
              `Previous attempts:\n${previousApproaches.join('\n')}\n\n` +
              `Use the search_help tool with this JSON format:\n` +
              `{\n` +
              `  "query": "your error message here",\n` +
              `  "context": {\n` +
              `    "previousAttempts": ${JSON.stringify(previousApproaches)}\n` +
              `  }\n` +
              `}\n\n` +
              `After getting help, try a COMPLETELY DIFFERENT approach based on what you learn.`
          )
        );
      }
    }

    // Trim messages to prevent context overflow
    if (messages.length > 6) {
      messages = await trimMessages(messages, {
        maxTokens: 50000,
        strategy: "last",
        tokenCounter: model,
        includeSystem: true,
        allowPartial: false,
      });
    }

    // Invoke model with tools
    const response = await model.invoke(messages, { tools: TOOLS });
    messages.push(response);

    if (response.content) {
      const contentStr = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      console.log(
        `      Iteration ${iterations}: ${contentStr.substring(0, 100)}...`
      );
    }

    // Process tool calls
    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        const functionName = toolCall.name;
        const functionArgs = toolCall.args;

        const result = await toolExecutor.execute(functionName, functionArgs) as { success?: boolean; path?: string; [key: string]: unknown };

        // Auto-validate after write_component
        if (functionName === "write_component" && result.success) {
          const filePath = path.relative(
            path.resolve(outputDir, ".."),
            result.path as string
          );

          // Run BOTH TypeScript AND ESLint validation
          const [tsValidationRaw, eslintValidationRaw] = await Promise.all([
            toolExecutor.execute("validate_typescript", {
              file_path: filePath,
            }),
            toolExecutor.execute("check_code_quality", { file_path: filePath }),
          ]);

          const tsValidation = tsValidationRaw as { valid?: boolean; errors?: string; errorCount?: number; fullOutput?: string; [key: string]: unknown };
          const eslintValidation = eslintValidationRaw as { valid?: boolean; errorCount?: number; warningCount?: number; issues?: unknown[]; [key: string]: unknown };

          const tsValid = tsValidation.valid;
          const eslintValid =
            eslintValidation.valid ||
            (eslintValidation.errorCount === 0 &&
              eslintValidation.warningCount === 0);
          const allValid = tsValid && eslintValid;

          if (allValid) {
            console.log(
              `      ✅ Fixed! TypeScript and ESLint validation passed`
            );
            lastValidationResult = { success: true, iterations };
            continueLoop = false;
          } else {
            console.log(
              `      ❌ Still has errors - TS: ${
                tsValid ? "✓" : "✗"
              }, ESLint: ${eslintValid ? "✓" : "✗"}`
            );

            // Build comprehensive error message with BOTH TypeScript and ESLint issues
            let errorMessage = "Validation failed:\n\n";
            const allErrors: string[] = [];

            // TypeScript errors
            if (!tsValid) {
              const tsErrors =
                tsValidation.errors || "Unknown TypeScript error";
              errorMessage += `**TypeScript Errors (${
                tsValidation.errorCount || "?"
              }):**\n${tsErrors}\n\n`;
              allErrors.push(tsErrors);

              // Include full context if available
              if (tsValidation.fullOutput) {
                errorMessage += `**Full TypeScript Context:**\n${tsValidation.fullOutput.substring(
                  0,
                  1500
                )}\n\n`;
              }
            }

            // ESLint issues
            if (!eslintValid && eslintValidation.issues) {
              const eslintIssues = eslintValidation.issues
                .map(
                  (issue: any) =>
                    `Line ${issue.line}: ${issue.message} (${issue.rule})`
                )
                .join("\n");
              errorMessage += `**ESLint Issues (${
                eslintValidation.errorCount || 0
              } errors, ${
                eslintValidation.warningCount || 0
              } warnings):**\n${eslintIssues}\n\n`;
              allErrors.push(eslintIssues);
            }

            errorMessage +=
              "Read the imported files and fix all issues. Remember:\n";
            errorMessage +=
              '- For "missing display name" with forwardRef: Add ComponentName.displayName = "ComponentName";\n';
            errorMessage +=
              '- For "Cannot find namespace JSX": Add "import React from \'react\';"';

            result.validationErrors = allErrors.join("\n---\n");
            result.tsValidation = tsValidation;
            result.eslintValidation = eslintValidation;
            result.message = errorMessage;

            lastValidationResult = {
              success: false,
              errors: allErrors.join("\n"),
              tsValid,
              eslintValid,
            };

            // Track this attempt
            const contentStr = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
            attemptHistory.push({
              iteration: iterations,
              error: allErrors.join("\n").substring(0, 200),
              approach: contentStr?.substring(0, 100) || "standard fix",
            });
          }
        }

        // Add tool result as ToolMessage
        const toolMessage = new ToolMessage({
          content: JSON.stringify(result),
          tool_call_id: toolCall.id,
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

  return (
    lastValidationResult || { success: false, errors: Array.isArray(componentDetails.errors) ? componentDetails.errors.join('\n') : componentDetails.errors }
  );
}

export async function typescriptFixNode(state: ValidationState): Promise<NodeResult> {
  console.log("\n📘 Pass 1: TypeScript Validation (Blocking)");
  console.log("=".repeat(60));

  const { failedComponents, outputDir, registry } = state;
  const stillFailing: Record<string, ComponentFailureDetails> = {};
  const fixed: string[] = [];

  if (!failedComponents || Object.keys(failedComponents).length === 0) {
    console.log("✅ No TypeScript errors detected\n");
    return {
      ...state,
      failedComponents: {},
      currentPhase: "quality_review",
    };
  }

  console.log(
    `Found ${
      Object.keys(failedComponents).length
    } component(s) with TypeScript errors\n`
  );

  for (const [componentName, details] of Object.entries(failedComponents)) {
    const result = await fixTypeScriptErrors(
      componentName,
      details,
      outputDir,
      registry
    );

    if (result.success) {
      fixed.push(componentName);
    } else {
      stillFailing[componentName] = {
        ...details,
        errors: result.errors || (Array.isArray(details.errors) ? details.errors.join('\n') : details.errors),
        attemptedFix: true,
      };
    }
  }

  console.log("\n" + "-".repeat(60));
  console.log(`✅ Fixed: ${fixed.length} component(s)`);
  if (fixed.length > 0) {
    console.log(`   ${fixed.join(", ")}`);
  }
  console.log(
    `❌ Still failing: ${Object.keys(stillFailing).length} component(s)`
  );
  if (Object.keys(stillFailing).length > 0) {
    console.log(`   ${Object.keys(stillFailing).join(", ")}`);
  }
  console.log();

  return {
    ...state,
    failedComponents: stillFailing,
    currentPhase: "quality_review",
  };
}
