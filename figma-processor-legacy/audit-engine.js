#!/usr/bin/env node

/**
 * AI AUDIT ENGINE
 * Simplified AI-powered component auditing system
 * Focuses on TypeScript validation and component overlap detection
 */

import "dotenv/config";
import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai/index.mjs";
import { Project } from "ts-morph";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize OpenAI client
let openaiClient = null;
const getOpenAIClient = () => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
};

/**
 * Validate TypeScript compilation for UI components only
 */
export const validateTypeScript = async (componentPath) => {
  try {
    console.log(`    🔍 TypeScript validation: ${componentPath}`);

    if (!existsSync(componentPath)) {
      return {
        success: false,
        errors: [`File not found: ${componentPath}`],
        warnings: [],
      };
    }

    // Only validate components in the ui folder
    if (!componentPath.includes("/ui/")) {
      return {
        success: true,
        errors: [],
        warnings: [
          "Component outside ui folder - skipping TypeScript validation",
        ],
        skipped: true,
      };
    }

    // Use ts-morph for UI-focused validation with UI-specific patterns
    const project = new Project({
      compilerOptions: {
        target: "ES2017",
        module: "ESNext",
        jsx: "preserve",
        strict: false, // Relaxed for UI components
        esModuleInterop: true,
        skipLibCheck: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: "bundler",
      },
    });

    // Add the UI directory context
    const uiDir = join(__dirname, "..", "nextjs-app", "ui");
    project.addSourceFilesAtPaths(`${uiDir}/**/*.{ts,tsx}`);

    const sourceFile = project.getSourceFile(componentPath);
    if (!sourceFile) {
      return {
        success: false,
        errors: ["Could not load component into TypeScript project"],
        warnings: [],
      };
    }

    const diagnostics = sourceFile.getPreEmitDiagnostics();
    const errors = [];
    const warnings = [];

    diagnostics.forEach((diagnostic) => {
      const message = diagnostic.getMessageText();
      const category = diagnostic.getCategory();
      const line = diagnostic.getStart()
        ? diagnostic
            .getSourceFile()
            ?.getLineAndColumnAtPos(diagnostic.getStart() || 0).line
        : "unknown";

      const diagnosticText = `Line ${line}: ${message}`;

      // Filter out common UI component false positives
      const messageStr =
        typeof message === "string" ? message : message.toString();

      // Skip module resolution errors for @/* imports (common in UI)
      if (messageStr.includes("Cannot find module '@/")) {
        warnings.push(`${diagnosticText} (common UI pattern)`);
        return;
      }

      if (category === 1) {
        // Error
        errors.push(diagnosticText);
      } else if (category === 0) {
        // Warning
        warnings.push(diagnosticText);
      }
    });

    // UI-specific validation checks
    const content = readFileSync(componentPath, "utf8");

    // Check for proper component exports
    if (!content.includes("export")) {
      warnings.push("UI component should export a function or component");
    }

    // Check for React usage patterns
    if (content.includes("React.") && !content.includes("import React")) {
      errors.push("Using React without importing it");
    }

    // Check for proper component naming (should match filename)
    const fileName = componentPath.split("/").pop()?.replace(".tsx", "");
    if (
      fileName &&
      !content.includes(`function ${fileName}`) &&
      !content.includes(`const ${fileName}`)
    ) {
      warnings.push(
        `Component function name should match filename: ${fileName}`
      );
    }

    const hasErrors = errors.length > 0;

    if (hasErrors) {
      console.log(
        `    ❌ TypeScript validation: ${errors.length} errors, ${warnings.length} warnings`
      );
    } else {
      console.log(`    ✅ TypeScript validation passed`);
    }

    return {
      success: !hasErrors,
      errors,
      warnings,
      uiValidation: true,
    };
  } catch (error) {
    console.error(`    ❌ TypeScript validation failed: ${error.message}`);

    // Fallback to basic UI component syntax check
    try {
      const content = readFileSync(componentPath, "utf8");
      const basicErrors = [];

      // Basic syntax checks for UI components
      if (!content.trim()) {
        basicErrors.push("File is empty");
      }

      // Check for balanced braces/parens
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        basicErrors.push("Mismatched braces");
      }

      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        basicErrors.push("Mismatched parentheses");
      }

      // UI component specific checks
      if (!content.includes("return") && content.includes("function")) {
        basicErrors.push("Function component should have return statement");
      }

      console.log(
        `    ${
          basicErrors.length === 0 ? "✅" : "❌"
        } Basic UI component validation`
      );

      return {
        success: basicErrors.length === 0,
        errors: basicErrors,
        warnings: [],
        basicValidation: true,
      };
    } catch (readError) {
      return {
        success: false,
        errors: [`Cannot read UI component file: ${readError.message}`],
        warnings: [],
        validationFailed: true,
      };
    }
  }
};

/**
 * Analyze component structure using ts-morph
 */
export const analyzeComponentStructure = (componentPath) => {
  try {
    console.log(`    🔍 Component structure analysis: ${componentPath}`);

    if (!existsSync(componentPath)) {
      throw new Error(`File not found: ${componentPath}`);
    }

    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(componentPath);

    // Extract interfaces
    const interfaces = sourceFile.getInterfaces().map((iface) => ({
      name: iface.getName(),
      properties: iface.getProperties().map((prop) => ({
        name: prop.getName(),
        type: prop.getType().getText(),
        isOptional: prop.hasQuestionToken(),
      })),
    }));

    // Extract function components
    const functions = sourceFile.getFunctions().map((func) => ({
      name: func.getName(),
      parameters: func.getParameters().map((param) => param.getText()),
      isExported: func.hasExportKeyword(),
    }));

    // Extract imports
    const imports = sourceFile.getImportDeclarations().map((imp) => ({
      moduleSpecifier: imp.getModuleSpecifierValue(),
      namedImports: imp.getNamedImports().map((named) => named.getName()),
    }));

    // Extract exports
    const exports = sourceFile.getExportDeclarations().map((exp) => ({
      moduleSpecifier: exp.getModuleSpecifierValue(),
      namedExports: exp.getNamedExports().map((named) => named.getName()),
    }));

    console.log(
      `    ✅ Structure analysis complete: ${interfaces.length} interfaces, ${functions.length} functions`
    );

    return {
      success: true,
      interfaces,
      functions,
      imports,
      exports,
      componentName: sourceFile.getBaseNameWithoutExtension(),
    };
  } catch (error) {
    console.error(
      `    ❌ Component structure analysis failed: ${error.message}`
    );
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Analyze component with GPT-4o using function calling
 */
export const analyzeComponentWithAI = async (
  componentPath,
  structureAnalysis = null
) => {
  try {
    console.log(`    🤖 AI component analysis: ${componentPath}`);

    if (!existsSync(componentPath)) {
      throw new Error(`File not found: ${componentPath}`);
    }

    const componentCode = readFileSync(componentPath, "utf8");
    const componentName = componentPath.split("/").pop().replace(".tsx", "");

    // Use structure analysis if provided, otherwise analyze on the fly
    const structure =
      structureAnalysis && structureAnalysis.success
        ? structureAnalysis
        : analyzeComponentStructure(componentPath);

    const openai = getOpenAIClient();

    const prompt = `Analyze this React TypeScript component for potential issues and improvements.

COMPONENT: ${componentName}
FILE: ${componentPath}

COMPONENT CODE:
\`\`\`typescript
${componentCode}
\`\`\`

STRUCTURE ANALYSIS:
${JSON.stringify(structure, null, 2)}

Please analyze and provide:
1. Component classification (atom/molecule/organism)
2. Props interface quality assessment
3. Accessibility compliance check
4. Potential functional overlaps with common patterns
5. TypeScript type safety evaluation
6. Recommendations for improvement

Respond with structured JSON:
{
  "classification": "atom|molecule|organism",
  "propsQuality": {
    "score": 1-10,
    "issues": ["issue1", "issue2"],
    "strengths": ["strength1", "strength2"]
  },
  "accessibility": {
    "score": 1-10,
    "compliance": ["compliant feature 1"],
    "violations": ["violation 1"]
  },
  "functionality": {
    "purpose": "Brief description",
    "complexity": "low|medium|high",
    "reusability": "low|medium|high"
  },
  "typeSafety": {
    "score": 1-10,
    "issues": ["type issue 1"],
    "recommendations": ["recommendation 1"]
  },
  "overallAssessment": {
    "score": 1-10,
    "strengths": ["strength 1"],
    "improvements": ["improvement 1"]
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.1,
    });

    const aiResponse = response.choices[0].message.content;

    // Try to parse JSON response
    let analysis;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (parseError) {
      console.warn(
        `    ⚠️ Could not parse AI response as JSON, using raw response`
      );
      analysis = { rawResponse: aiResponse, parseError: parseError.message };
    }

    if (analysis) {
      console.log(
        `    ✅ AI analysis complete: ${
          analysis.classification || "unknown"
        } (Score: ${analysis.overallAssessment?.score || "N/A"}/10)`
      );
    }

    return {
      success: true,
      analysis,
      tokensUsed: response.usage?.total_tokens || 0,
      cost: ((response.usage?.total_tokens || 0) * 0.0001).toFixed(4), // Rough cost estimate
    };
  } catch (error) {
    console.error(`    ❌ AI component analysis failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Detect component overlaps using AI analysis
 */
export const detectComponentOverlaps = async (
  targetComponent,
  existingComponents = []
) => {
  try {
    console.log(
      `    🔍 Overlap detection: ${targetComponent.name || "unknown"}`
    );

    if (!targetComponent.path || !existsSync(targetComponent.path)) {
      throw new Error(`Target component not found: ${targetComponent.path}`);
    }

    // Analyze target component
    const targetStructure = analyzeComponentStructure(targetComponent.path);
    const targetCode = readFileSync(targetComponent.path, "utf8");

    // Get existing components to compare against
    const componentsToCheck =
      existingComponents.length > 0
        ? existingComponents
        : await getExistingUIComponents();

    const overlapResults = [];

    // Compare with each existing component
    for (const existing of componentsToCheck.slice(0, 5)) {
      // Limit to 5 for cost control
      if (!existing.path || !existsSync(existing.path)) continue;
      if (existing.path === targetComponent.path) continue; // Skip self

      const existingStructure = analyzeComponentStructure(existing.path);
      const existingCode = readFileSync(existing.path, "utf8");

      const overlapAnalysis = await analyzeOverlapWithAI(
        targetComponent,
        targetCode,
        targetStructure,
        existing,
        existingCode,
        existingStructure
      );

      if (
        overlapAnalysis.success &&
        overlapAnalysis.analysis.overlapScore > 3
      ) {
        overlapResults.push({
          component: existing.name,
          path: existing.path,
          ...overlapAnalysis.analysis,
        });
      }
    }

    // Sort by overlap score (highest first)
    overlapResults.sort((a, b) => b.overlapScore - a.overlapScore);

    console.log(
      `    ✅ Overlap detection complete: ${overlapResults.length} overlaps found`
    );

    return {
      success: true,
      targetComponent: targetComponent.name,
      overlaps: overlapResults,
      recommendations: generateOverlapRecommendations(overlapResults),
    };
  } catch (error) {
    console.error(`    ❌ Overlap detection failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Analyze overlap between two components using AI
 */
const analyzeOverlapWithAI = async (
  component1,
  code1,
  structure1,
  component2,
  code2,
  structure2
) => {
  try {
    const openai = getOpenAIClient();

    const prompt = `Analyze the functional overlap between these two React components.

COMPONENT 1: ${component1.name}
\`\`\`typescript
${code1}
\`\`\`

COMPONENT 2: ${component2.name}
\`\`\`typescript
${code2}
\`\`\`

COMPONENT 1 STRUCTURE:
${JSON.stringify(structure1, null, 2)}

COMPONENT 2 STRUCTURE:
${JSON.stringify(structure2, null, 2)}

Analyze for:
1. Functional similarity (what they do)
2. Interface overlap (similar props)
3. Visual/styling similarity
4. Compositional relationship (is one made of the other?)
5. Atomic design violations (does one component do multiple atomic jobs?)

Pay special attention to:
- Components that combine multiple atomic responsibilities (label + input + helper text)
- Components that duplicate functionality of simpler atoms
- Opportunities to compose from smaller components instead of reimplementing

Respond with JSON:
{
  "overlapScore": 1-10,
  "functionalSimilarity": 1-10,
  "interfaceOverlap": 1-10,
  "visualSimilarity": 1-10,
  "atomicDesignViolation": 1-10,
  "relationship": "duplicate|composition|complement|unrelated",
  "analysis": {
    "purpose1": "brief description",
    "purpose2": "brief description",
    "similarities": ["similarity 1", "similarity 2"],
    "differences": ["difference 1", "difference 2"],
    "atomicIssues": ["issue 1", "issue 2"]
  },
  "recommendation": "merge|refactor|keep_separate|replace|decompose",
  "reasoning": "explanation of recommendation with focus on atomic design principles"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const aiResponse = response.choices[0].message.content;

    // Parse JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    return {
      success: true,
      analysis,
      cost: ((response.usage?.total_tokens || 0) * 0.0001).toFixed(4),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get existing UI components from the ui folder only
 */
const getExistingUIComponents = async () => {
  const uiDir = join(__dirname, "..", "nextjs-app", "ui");
  const components = [];

  if (!existsSync(uiDir)) {
    console.warn("UI directory not found:", uiDir);
    return components;
  }

  const { readdir } = await import("fs/promises");

  // Recursively find all .tsx files in ui directory
  const findTsxFiles = async (dir, parentType = "") => {
    try {
      const items = await readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = join(dir, item.name);

        if (item.isDirectory()) {
          // Determine component type based on directory structure
          let componentType = "component";
          if (item.name === "elements") {
            componentType = "atom";
          } else if (item.name === "components") {
            componentType = "molecule";
          } else if (parentType) {
            componentType = parentType;
          }

          await findTsxFiles(fullPath, componentType);
        } else if (item.name.endsWith(".tsx")) {
          const relativePath = fullPath.replace(uiDir + "/", "");
          const componentName = item.name.replace(".tsx", "");

          // Determine type from path if not already set
          let type = parentType || "component";
          if (relativePath.includes("elements/")) {
            type = "atom";
          } else if (relativePath.includes("components/")) {
            type = "molecule";
          }

          components.push({
            name: componentName,
            type,
            path: fullPath,
            relativePath,
            uiComponent: true,
          });
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${dir}:`, error.message);
    }
  };

  await findTsxFiles(uiDir);

  console.log(`Found ${components.length} UI components in ui folder`);
  return components;
};

/**
 * Generate recommendations based on overlap analysis
 */
const generateOverlapRecommendations = (overlapResults) => {
  const recommendations = [];

  overlapResults.forEach((overlap) => {
    if (overlap.overlapScore >= 8) {
      recommendations.push({
        priority: "high",
        action: overlap.recommendation,
        description: `${overlap.component} has high overlap (${overlap.overlapScore}/10): ${overlap.reasoning}`,
      });
    } else if (overlap.overlapScore >= 6) {
      recommendations.push({
        priority: "medium",
        action: overlap.recommendation,
        description: `${overlap.component} has medium overlap (${overlap.overlapScore}/10): ${overlap.reasoning}`,
      });
    }
  });

  return recommendations;
};

/**
 * Test integration with design processor
 */
export const testDesignProcessorIntegration = async () => {
  console.log("🧪 Testing Design Processor Integration...");

  try {
    // Test with mock components (simulating generated components)
    const mockComponents = [
      {
        name: "TestComponent",
        path: "/Users/angraimo/Work/design-to-content/nextjs-app/ui/elements/Label.tsx",
        fullPath:
          "/Users/angraimo/Work/design-to-content/nextjs-app/ui/elements/Label.tsx",
      },
    ];

    const auditConfig = {
      enableTypeScriptValidation: true,
      enableStructureAnalysis: true,
      enableAIAnalysis: false, // Keep cost low for testing
      maxCostPerComponent: 0.1,
    };

    const result = await auditGeneratedComponents(
      mockComponents,
      null,
      auditConfig
    );

    console.log(
      "Integration Test Result:",
      result.overallSuccess ? "✅ PASSED" : "❌ FAILED"
    );
    console.log(`Audited ${result.totalComponents} components`);
    console.log(
      `Summary: ${result.summary.passed} passed, ${result.summary.failed} failed`
    );

    return result;
  } catch (error) {
    console.error("Integration test failed:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Test overlap detection with TextInput case
 */
export const testOverlapDetection = async () => {
  console.log("🧪 Testing Overlap Detection...");

  const textInputPath = join(
    __dirname,
    "..",
    "nextjs-app",
    "ui",
    "elements",
    "TextInput.tsx"
  );

  if (existsSync(textInputPath)) {
    console.log("Testing overlap detection with TextInput component...");

    const targetComponent = {
      name: "TextInput",
      path: textInputPath,
      type: "atom",
    };

    const result = await detectComponentOverlaps(targetComponent);
    console.log(
      "Overlap Test result:",
      result.success ? "✅ PASSED" : "❌ FAILED"
    );

    if (result.success) {
      console.log(`Found ${result.overlaps.length} overlaps:`);
      result.overlaps.forEach((overlap) => {
        console.log(
          `  - ${overlap.component}: ${overlap.overlapScore}/10 (${overlap.recommendation})`
        );
      });

      console.log(`\nRecommendations: ${result.recommendations.length}`);
      result.recommendations.forEach((rec) => {
        console.log(`  - ${rec.priority}: ${rec.action} - ${rec.description}`);
      });
    }

    return result;
  } else {
    console.log("❌ TextInput component not found for testing");
    return { success: false, error: "TextInput component not found" };
  }
};

/**
 * UI-focused audit configuration with safety mechanisms
 */
const DEFAULT_AUDIT_CONFIG = {
  enableTypeScriptValidation: true,
  enableStructureAnalysis: true,
  enableAIAnalysis: false,
  enableOverlapDetection: false,
  maxCostPerComponent: 0.5,
  maxTotalCost: 5.0,
  maxApiFailures: 3,
  requireApproval: false,
  auditDepth: "basic", // basic | thorough | minimal
  backupComponents: true,
  uiOnly: true, // Only audit components in ui folder
  skipNonUIComponents: true,
  uiComponentPatterns: [
    "ui/elements/**/*.tsx", // Atoms
    "ui/components/**/*.tsx", // Molecules
  ],
  circuitBreaker: {
    enabled: true,
    failureThreshold: 3,
    timeWindow: 300000, // 5 minutes
  },
};

/**
 * Functional circuit breaker state management
 */
let circuitBreakerState = {
  failures: [],
  state: "closed", // closed | open | half-open
  failureThreshold: 3,
  timeWindow: 300000, // 5 minutes
};

const resetCircuitBreaker = () => {
  circuitBreakerState = {
    failures: [],
    state: "closed",
    failureThreshold: 3,
    timeWindow: 300000,
  };
};

const checkCircuitBreaker = () => {
  const now = Date.now();

  // Remove old failures outside time window
  circuitBreakerState.failures = circuitBreakerState.failures.filter(
    (failure) => now - failure.timestamp < circuitBreakerState.timeWindow
  );

  if (circuitBreakerState.state === "open") {
    return {
      allowed: false,
      reason: "Circuit breaker is OPEN - too many recent failures",
    };
  }

  return { allowed: true };
};

const recordCircuitBreakerFailure = (error) => {
  const now = Date.now();
  circuitBreakerState.failures.push({ timestamp: now, error: error.message });

  if (
    circuitBreakerState.failures.length >= circuitBreakerState.failureThreshold
  ) {
    circuitBreakerState.state = "open";
    console.warn(
      `🚨 Circuit breaker OPENED - ${
        circuitBreakerState.failures.length
      } failures in ${circuitBreakerState.timeWindow / 1000}s`
    );
  }
};

const recordCircuitBreakerSuccess = () => {
  circuitBreakerState.failures = [];
  circuitBreakerState.state = "closed";
};

/**
 * Functional cost tracking
 */
let costTrackerState = {
  totalCost: 0,
  componentCosts: {},
  maxCostPerComponent: 1.5,
  maxTotalCost: 15.0,
};

const resetCostTracker = (maxCostPerComponent = 1.5, maxTotalCost = 15.0) => {
  costTrackerState = {
    totalCost: 0,
    componentCosts: {},
    maxCostPerComponent,
    maxTotalCost,
  };
};

const checkCostLimits = (componentName, estimatedCost) => {
  if (estimatedCost > costTrackerState.maxCostPerComponent) {
    return {
      allowed: false,
      reason: `Component cost $${estimatedCost} exceeds limit $${costTrackerState.maxCostPerComponent}`,
    };
  }

  if (
    costTrackerState.totalCost + estimatedCost >
    costTrackerState.maxTotalCost
  ) {
    return {
      allowed: false,
      reason: `Total cost $${
        costTrackerState.totalCost + estimatedCost
      } would exceed limit $${costTrackerState.maxTotalCost}`,
    };
  }

  return { allowed: true };
};

const addCost = (componentName, actualCost) => {
  costTrackerState.totalCost += actualCost;
  costTrackerState.componentCosts[componentName] =
    (costTrackerState.componentCosts[componentName] || 0) + actualCost;
};

const getCostSummary = () => {
  return {
    totalCost: costTrackerState.totalCost,
    maxTotalCost: costTrackerState.maxTotalCost,
    utilizationPercent: (
      (costTrackerState.totalCost / costTrackerState.maxTotalCost) *
      100
    ).toFixed(1),
    componentCosts: costTrackerState.componentCosts,
  };
};

/**
 * Audit a single component with safety mechanisms
 */
export const auditComponent = async (componentPath, config = {}) => {
  const auditConfig = { ...DEFAULT_AUDIT_CONFIG, ...config };
  const componentName =
    componentPath.split("/").pop()?.replace(".tsx", "") || "unknown";

  console.log(`  🔍 Auditing component: ${componentName}`);

  const auditResult = {
    componentPath,
    componentName,
    timestamp: new Date().toISOString(),
    typeScriptValidation: null,
    structureAnalysis: null,
    aiAnalysis: null,
    issues: [],
    recommendations: [],
    success: true,
    totalCost: 0,
    safetyChecks: {
      circuitBreakerStatus: checkCircuitBreaker(),
      costCheck: null,
    },
  };

  try {
    // Safety check: Circuit breaker
    if (!auditResult.safetyChecks.circuitBreakerStatus.allowed) {
      console.warn(
        `  🚨 Circuit breaker active: ${auditResult.safetyChecks.circuitBreakerStatus.reason}`
      );
      auditResult.success = false;
      auditResult.issues.push(
        auditResult.safetyChecks.circuitBreakerStatus.reason
      );
      return auditResult;
    }

    // Phase 1: TypeScript validation (no API cost)
    if (auditConfig.enableTypeScriptValidation) {
      auditResult.typeScriptValidation = await validateTypeScript(
        componentPath
      );

      if (!auditResult.typeScriptValidation.success) {
        auditResult.success = false;
        auditResult.issues.push(...auditResult.typeScriptValidation.errors);
      }
    }

    // Phase 2: Structure analysis (no API cost)
    if (auditConfig.enableStructureAnalysis) {
      auditResult.structureAnalysis = analyzeComponentStructure(componentPath);

      if (!auditResult.structureAnalysis.success) {
        auditResult.issues.push(
          `Structure analysis failed: ${auditResult.structureAnalysis.error}`
        );
      }
    }

    // Phase 3: AI analysis (with cost and safety checks)
    if (auditConfig.enableAIAnalysis) {
      // Pre-flight cost check
      const estimatedCost = 0.15; // Estimated cost per component analysis
      auditResult.safetyChecks.costCheck = checkCostLimits(
        componentName,
        estimatedCost
      );

      if (!auditResult.safetyChecks.costCheck.allowed) {
        console.warn(
          `  💰 Cost limit check failed: ${auditResult.safetyChecks.costCheck.reason}`
        );
        auditResult.issues.push(
          `AI analysis skipped: ${auditResult.safetyChecks.costCheck.reason}`
        );
      } else {
        try {
          auditResult.aiAnalysis = await analyzeComponentWithAI(
            componentPath,
            auditResult.structureAnalysis
          );

          if (auditResult.aiAnalysis.success) {
            const actualCost = parseFloat(auditResult.aiAnalysis.cost);
            auditResult.totalCost = actualCost;
            addCost(componentName, actualCost);
            recordCircuitBreakerSuccess();

            // Extract recommendations from AI analysis
            if (
              auditResult.aiAnalysis.analysis?.overallAssessment?.improvements
            ) {
              auditResult.recommendations.push(
                ...auditResult.aiAnalysis.analysis.overallAssessment
                  .improvements
              );
            }
          } else {
            recordCircuitBreakerFailure(
              new Error(auditResult.aiAnalysis.error)
            );
            auditResult.issues.push(
              `AI analysis failed: ${auditResult.aiAnalysis.error}`
            );
          }
        } catch (aiError) {
          recordCircuitBreakerFailure(aiError);
          auditResult.issues.push(`AI analysis error: ${aiError.message}`);
        }
      }
    }

    console.log(
      `  ${auditResult.success ? "✅" : "❌"} Audit complete: ${
        auditResult.issues.length
      } issues found${
        auditConfig.enableAIAnalysis ? `, $${auditResult.totalCost} cost` : ""
      }`
    );
    return auditResult;
  } catch (error) {
    console.error(`  ❌ Component audit failed: ${error.message}`);
    recordCircuitBreakerFailure(error);
    auditResult.success = false;
    auditResult.issues.push(`Audit error: ${error.message}`);
    return auditResult;
  }
};

/**
 * Audit UI components with safety mechanisms
 */
export const auditGeneratedComponents = async (
  components,
  figmaData = null,
  config = {}
) => {
  const auditConfig = { ...DEFAULT_AUDIT_CONFIG, ...config };

  // Filter to only UI components if uiOnly is enabled
  let componentsToAudit = components;
  if (auditConfig.uiOnly) {
    componentsToAudit = components.filter((component) => {
      const path = component.fullPath || component.path || "";
      return path.includes("/ui/");
    });

    if (componentsToAudit.length < components.length) {
      console.log(
        `🎯 Filtering to UI components: ${componentsToAudit.length}/${components.length} components`
      );
    }
  }

  console.log(
    `🔍 AI AUDIT ENGINE - Auditing ${componentsToAudit.length} UI components`
  );
  console.log("=".repeat(50));

  // Initialize safety mechanisms
  resetCostTracker(auditConfig.maxCostPerComponent, auditConfig.maxTotalCost);
  resetCircuitBreaker();

  const auditResults = {
    timestamp: new Date().toISOString(),
    totalComponents: componentsToAudit.length,
    originalComponentCount: components.length,
    componentResults: [],
    overallSuccess: true,
    uiOnly: auditConfig.uiOnly,
    summary: {
      passed: 0,
      failed: 0,
      skipped: 0,
      totalIssues: 0,
      skippedForCost: 0,
      skippedForFailures: 0,
      skippedNonUI: components.length - componentsToAudit.length,
    },
    costSummary: null,
    circuitBreakerStatus: null,
  };

  try {
    // Audit each UI component
    for (const component of componentsToAudit) {
      if (!component || !component.path) {
        console.warn(
          `  ⚠️ Skipping invalid component: ${JSON.stringify(component)}`
        );
        auditResults.summary.skipped++;
        continue;
      }

      const componentPath = component.fullPath || component.path;

      // Double-check UI folder requirement
      if (auditConfig.uiOnly && !componentPath.includes("/ui/")) {
        console.log(`  ⏭️ Skipping non-UI component: ${componentPath}`);
        auditResults.summary.skipped++;
        continue;
      }

      const result = await auditComponent(componentPath, auditConfig);
      auditResults.componentResults.push(result);

      if (result.success) {
        auditResults.summary.passed++;
      } else {
        auditResults.summary.failed++;
        auditResults.overallSuccess = false;

        // Track specific failure reasons
        if (result.issues.some((issue) => issue.includes("Cost limit"))) {
          auditResults.summary.skippedForCost++;
        }
        if (result.issues.some((issue) => issue.includes("Circuit breaker"))) {
          auditResults.summary.skippedForFailures++;
        }
      }

      auditResults.summary.totalIssues += result.issues.length;

      // Stop if circuit breaker opens
      const circuitStatus = checkCircuitBreaker();
      if (!circuitStatus.allowed) {
        console.warn(
          `🚨 Stopping audit due to circuit breaker: ${circuitStatus.reason}`
        );
        break;
      }
    }

    // Final status and summaries
    auditResults.costSummary = getCostSummary();
    auditResults.circuitBreakerStatus = checkCircuitBreaker();

    console.log("\n📊 UI COMPONENT AUDIT SUMMARY");
    console.log(`  ✅ Passed: ${auditResults.summary.passed}`);
    console.log(`  ❌ Failed: ${auditResults.summary.failed}`);
    console.log(`  ⏭️ Skipped: ${auditResults.summary.skipped}`);
    console.log(`  ⚠️  Total Issues: ${auditResults.summary.totalIssues}`);

    if (auditResults.summary.skippedNonUI > 0) {
      console.log(
        `  🎯 Non-UI components skipped: ${auditResults.summary.skippedNonUI}`
      );
    }

    if (auditConfig.enableAIAnalysis) {
      console.log(`  💰 Total Cost: $${auditResults.costSummary.totalCost}`);
      console.log(
        `  📈 Cost Utilization: ${auditResults.costSummary.utilizationPercent}%`
      );
    }

    if (auditResults.summary.skippedForCost > 0) {
      console.log(
        `  💸 Skipped for cost limits: ${auditResults.summary.skippedForCost}`
      );
    }

    if (auditResults.summary.skippedForFailures > 0) {
      console.log(
        `  🚨 Skipped for failures: ${auditResults.summary.skippedForFailures}`
      );
    }

    return auditResults;
  } catch (error) {
    console.error(`❌ UI audit system failed: ${error.message}`);
    auditResults.overallSuccess = false;
    auditResults.systemError = error.message;
    auditResults.costSummary = getCostSummary();
    auditResults.circuitBreakerStatus = checkCircuitBreaker();
    return auditResults;
  }
};

/**
 * Test function for AI analysis
 */
export const testAIAnalysis = async () => {
  console.log("🧪 Testing AI Analysis...");

  const testComponentPath = join(
    __dirname,
    "..",
    "nextjs-app",
    "ui",
    "elements",
    "Label.tsx"
  );

  if (existsSync(testComponentPath)) {
    console.log("Testing AI analysis with Label.tsx component...");
    const config = {
      enableAIAnalysis: true,
      enableTypeScriptValidation: false,
      enableStructureAnalysis: true,
    };
    const result = await auditComponent(testComponentPath, config);
    console.log("AI Test result:", result.success ? "✅ PASSED" : "❌ FAILED");

    if (result.aiAnalysis && result.aiAnalysis.analysis) {
      console.log(
        "AI Classification:",
        result.aiAnalysis.analysis.classification
      );
      console.log(
        "Overall Score:",
        result.aiAnalysis.analysis.overallAssessment?.score
      );
      console.log("Cost:", `$${result.totalCost}`);
    }

    return result;
  } else {
    console.log("❌ Test component not found");
    return { success: false, error: "Test component not found" };
  }
};

/**
 * Test safety mechanisms
 */
export const testSafetyMechanisms = async () => {
  console.log("🧪 Testing Safety Mechanisms...");

  // Reset state
  resetCostTracker(0.1, 0.25); // Low limits for testing
  resetCircuitBreaker();

  console.log("Testing cost limits...");

  // Test cost limits
  let costCheck = checkCostLimits("TestComponent", 0.15); // Should exceed limit
  console.log(
    "Cost limit test:",
    costCheck.allowed ? "❌ FAILED" : "✅ PASSED"
  );

  costCheck = checkCostLimits("TestComponent", 0.05); // Should be allowed
  console.log(
    "Cost allowed test:",
    costCheck.allowed ? "✅ PASSED" : "❌ FAILED"
  );

  // Test cost tracking
  addCost("TestComponent1", 0.08);
  addCost("TestComponent2", 0.12);

  costCheck = checkCostLimits("TestComponent3", 0.1); // Should exceed total
  console.log(
    "Total cost limit test:",
    costCheck.allowed ? "❌ FAILED" : "✅ PASSED"
  );

  const summary = getCostSummary();
  console.log(
    "Cost tracking test:",
    summary.totalCost === 0.2 ? "✅ PASSED" : "❌ FAILED"
  );

  console.log("Testing circuit breaker...");

  // Test circuit breaker
  recordCircuitBreakerFailure(new Error("Test failure 1"));
  recordCircuitBreakerFailure(new Error("Test failure 2"));
  recordCircuitBreakerFailure(new Error("Test failure 3"));

  const circuitStatus = checkCircuitBreaker();
  console.log(
    "Circuit breaker test:",
    !circuitStatus.allowed ? "✅ PASSED" : "❌ FAILED"
  );

  // Reset for clean state
  resetCostTracker();
  resetCircuitBreaker();

  return {
    success: true,
    costTracking: summary.totalCost === 0.2,
    circuitBreaker: !circuitStatus.allowed,
  };
};

/**
 * Test function for basic validation
 */
export const testAuditEngine = async () => {
  console.log("🧪 Testing Audit Engine...");

  // Test with a known component
  const testComponentPath = join(
    __dirname,
    "..",
    "nextjs-app",
    "ui",
    "elements",
    "Input.tsx"
  );

  if (existsSync(testComponentPath)) {
    console.log("Testing with Input.tsx component...");
    const result = await auditComponent(testComponentPath);
    console.log("Test result:", result.success ? "✅ PASSED" : "❌ FAILED");
    return result;
  } else {
    console.log("❌ Test component not found");
    return { success: false, error: "Test component not found" };
  }
};

const auditEngine = {
  validateTypeScript,
  analyzeComponentStructure,
  analyzeComponentWithAI,
  detectComponentOverlaps,
  auditComponent,
  auditGeneratedComponents,
  testAuditEngine,
  testAIAnalysis,
  testOverlapDetection,
  testDesignProcessorIntegration,
  testSafetyMechanisms,
};

export default auditEngine;
