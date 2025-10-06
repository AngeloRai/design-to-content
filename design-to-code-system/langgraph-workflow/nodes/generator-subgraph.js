#!/usr/bin/env node

/**
 * COMPONENT REFINEMENT SUBGRAPH
 * Iterative quality-driven component generation with code review only
 * Continues until quality gates met (score ≥8)
 */

import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { buildComponentGenerationPrompt } from "../prompts/generation/component-generation-prompt.js";
import { buildComponentRefinementPrompt } from "../prompts/generation/component-refinement-prompt.js";
import { buildUnifiedCodeReviewPrompt } from "../prompts/review/unified-code-review-prompt.js";
import {
  CodeReviewSchema,
  GeneratedCodeSchema,
} from "../schemas/review-schemas.js";

// Subgraph state
const ComponentRefinementState = Annotation.Root({
  componentSpec: Annotation({ default: () => null }),
  screenshotUrl: Annotation({ default: () => null }),  // Screenshot for visual verification
  libraryContext: Annotation({
    default: () => ({ icons: [], elements: [], components: [], modules: [] }),
  }),
  outputPath: Annotation({ default: () => "nextjs-app/ui" }),

  // Generation tracking
  currentCode: Annotation({ default: () => "" }),
  iterationCount: Annotation({ default: () => 0 }),
  refinementFeedback: Annotation({
    default: () => [],
    reducer: (existing, updates) => {
      if (Array.isArray(updates)) return [...existing, ...updates];
      return [...existing, updates];
    },
  }),

  // Review results
  codeReviewResult: Annotation({ default: () => null }),

  // Final status
  approved: Annotation({ default: () => false }),
  failureReason: Annotation({ default: () => null }),
});

// Models
const generationModel = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.1,
  openAIApiKey: process.env.OPENAI_API_KEY,
}).withStructuredOutput(GeneratedCodeSchema);

const reviewModel = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.1,
  openAIApiKey: process.env.OPENAI_API_KEY,
}).withStructuredOutput(CodeReviewSchema);

// ===== NODES =====

const generateComponentNode = async (state) => {
  const iteration = (state.iterationCount || 0) + 1;
  const isInitialGeneration = iteration === 1;
  const isRefinement = iteration > 1 && state.refinementFeedback.length > 0;

  if (isInitialGeneration) {
    console.log(`  → Generating code (initial generation)...`);
  } else if (isRefinement) {
    console.log(
      `  → Refining code (iteration ${iteration}, applying ${state.refinementFeedback.length} fixes)...`
    );
  }

  // Use different prompts for initial generation vs refinement
  let prompt;
  let userMessage;

  if (isRefinement) {
    // REFINEMENT: Use specialized code fixer prompt with existing code
    prompt = buildComponentRefinementPrompt(
      state.currentCode,
      state.refinementFeedback,
      state.libraryContext
    );
    userMessage =
      "Apply the surgical fixes listed in the feedback. Return only the corrected code in the 'code' field. Make ONLY the changes requested.";
  } else {
    // INITIAL GENERATION: Use comprehensive generation prompt
    prompt = buildComponentGenerationPrompt(
      state.componentSpec,
      state.libraryContext,
      [],
      state.screenshotUrl
    );
    userMessage =
    "Generate the complete component from the specification. Return only the code in the 'code' field.";
  }

  try {
    const result = await generationModel.invoke([
      { role: "system", content: prompt },
      { role: "user", content: userMessage },
    ]);

    console.log(
      `    ✓ Generated ${result.code.split("\n").length} lines of code`
    );

    return {
      currentCode: result.code,
      iterationCount: iteration,
      // Clear feedback after applying it
      refinementFeedback: [],
    };
  } catch (error) {
    console.error(`    ❌ Generation failed: ${error.message}`);
    return {
      currentCode: state.currentCode || "// Generation failed",
      iterationCount: iteration,
      failureReason: `Code generation error: ${error.message}`,
    };
  }
};

const reviewCodeNode = async (state) => {
  console.log(`  → Reviewing code quality...`);

  const prompt = buildUnifiedCodeReviewPrompt(
    state.currentCode,
    state.componentSpec,
    state.libraryContext
  );

  try {
    const review = await reviewModel.invoke([
      { role: "system", content: prompt },
      {
        role: "user",
        content: "Review this component thoroughly. Be strict but fair.",
      },
    ]);

    console.log(
      `    Score: ${review.averageScore.toFixed(1)}/10 (threshold: 8.0)`
    );
    console.log(`    ├─ Props: ${review.scores.propsDesign}/10`);
    console.log(`    ├─ Imports: ${review.scores.importsAndLibrary}/10`);
    console.log(`    ├─ TypeScript: ${review.scores.typescript}/10`);
    console.log(`    ├─ Tailwind: ${review.scores.tailwind}/10`);
    console.log(`    └─ Accessibility: ${review.scores.accessibility}/10`);
    console.log(`    Passed: ${review.passed ? "✅" : "❌"}`);

    // Deterministic import validation
    const { validateImportsAgainstLibrary } = await import("../utils/validate-imports-in-memory.js");
    const importValidation = validateImportsAgainstLibrary(
      state.currentCode,
      state.libraryContext
    );

    if (!importValidation.valid) {
      console.log(`    Import validation: ❌ ${importValidation.totalImports} invalid import(s)`);
      const importIssues = importValidation.issues.map(issue => `[Import] ${issue}`);
      review.criticalIssues = [...(review.criticalIssues || []), ...importIssues];
      review.scores.importsAndLibrary = Math.min(review.scores.importsAndLibrary || 10, 3);
      const scoreValues = Object.values(review.scores);
      review.averageScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
      review.passed = review.averageScore >= 8.0;
    } else {
      console.log(`    Import validation: ✅`);
    }

    // Add reusability validation
    const { validateReusability } = await import("../utils/validate-component-reusability.js");
    const reusabilityCheck = await validateReusability(state.currentCode, state.libraryContext);

    console.log(`    Reusability: ${(reusabilityCheck.score * 100).toFixed(0)}% (${reusabilityCheck.totalIssues} issue${reusabilityCheck.totalIssues !== 1 ? 's' : ''})`);

    // Merge reusability issues into review
    if (!reusabilityCheck.isValid && reusabilityCheck.issues.length > 0) {
      const reusabilityIssues = reusabilityCheck.issues.map(i =>
        `[Reusability] ${i.suggestion}`
      );
      review.criticalIssues = [...(review.criticalIssues || []), ...reusabilityIssues];

      // Lower score if reusability is poor
      if (reusabilityCheck.score < 0.7) {
        review.scores.importsAndLibrary = Math.min(review.scores.importsAndLibrary || 10, 6);
        const scoreValues = Object.values(review.scores);
        review.averageScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
        review.passed = review.averageScore >= 8.0;
      }
    }

    if (review.criticalIssues && review.criticalIssues.length > 0) {
      console.log(`    Critical issues (${review.criticalIssues.length}):`);
      review.criticalIssues.slice(0, 3).forEach((issue, i) => {
        console.log(`      ${i + 1}. ${issue}`);
      });
      if (review.criticalIssues.length > 3) {
        console.log(`      ... and ${review.criticalIssues.length - 3} more`);
      }
    }

    return { codeReviewResult: review };
  } catch (error) {
    console.error(`    ❌ Review failed: ${error.message}`);
    // Create fallback review result
    return {
      codeReviewResult: {
        scores: {
          propsDesign: 0,
          importsAndLibrary: 0,
          typescript: 0,
          tailwind: 0,
          accessibility: 0,
        },
        averageScore: 0,
        passed: false,
        criticalIssues: [`Review system error: ${error.message}`],
        minorIssues: [],
        feedback: `Unable to complete review: ${error.message}`,
        confidenceReady: false,
      },
    };
  }
};

// Node to prepare feedback for refinement
const prepareFeedbackNode = (state) => {
  const review = state.codeReviewResult;
  console.log(`  → Preparing feedback for refinement...`);

  return {
    refinementFeedback: [review.feedback],
  };
};

const decideNextAfterCodeReview = (state) => {
  const score = state.codeReviewResult.averageScore;
  const iteration = state.iterationCount || 0;
  const maxIterations = 7;

  // CODE QUALITY GATE: score >= 8.0
  if (score >= 8.0) {
    console.log(
      `  ✓ Code review passed (${score.toFixed(1)}/10)`
    );
    return "approve_component";
  }

  // Max iterations - approve anyway
  if (iteration >= maxIterations) {
    console.log(
      `  ⚠️  Max code iterations reached (${maxIterations}), approving with current quality`
    );
    return "approve_component";
  }

  console.log(
    `  ↻ Quality gate not met (${score.toFixed(
      1
    )}/10), revising... (iteration ${iteration}/${maxIterations})`
  );
  return "prepare_feedback";
};

const approveComponent = (state) => {
  console.log(`  ✅ Component approved!`);
  console.log(`     Final code: ${state.currentCode.split("\n").length} lines`);
  console.log(`     Total iterations: ${state.iterationCount || 0}`);
  return {
    approved: true,
  };
};

// ===== BUILD SUBGRAPH =====

const buildSubgraph = () => {
  const graph = new StateGraph(ComponentRefinementState)
    .addNode("generate_component", generateComponentNode)
    .addNode("review_code", reviewCodeNode)
    .addNode("prepare_feedback", prepareFeedbackNode)
    .addNode("approve_component", approveComponent)

    .addEdge(START, "generate_component")
    .addEdge("generate_component", "review_code")
    .addConditionalEdges("review_code", decideNextAfterCodeReview, {
      approve_component: "approve_component",   // Code passes → approve
      prepare_feedback: "prepare_feedback",     // Code fails → refine
    })
    .addEdge("prepare_feedback", "generate_component")
    .addEdge("approve_component", END);

  return graph.compile();
};

export const componentRefinementSubgraph = buildSubgraph();
export default componentRefinementSubgraph;
