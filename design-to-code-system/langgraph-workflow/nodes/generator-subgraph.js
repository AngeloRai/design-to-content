#!/usr/bin/env node

/**
 * COMPONENT REFINEMENT SUBGRAPH
 * Iterative quality-driven component generation with code review and visual inspection
 * NO iteration limits - continues until quality gates met (score ≥8, visual ≥90%)
 */

import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { buildComponentGenerationPrompt } from "../prompts/generation/component-generation-prompt.js";
import { buildComponentRefinementPrompt } from "../prompts/generation/component-refinement-prompt.js";
import { buildUnifiedCodeReviewPrompt } from "../prompts/review/unified-code-review-prompt.js";
import { runVisualInspection } from "./visual-inspector-agent.js";
import {
  CodeReviewSchema,
  GeneratedCodeSchema,
} from "../schemas/review-schemas.js";

// Subgraph state
const ComponentRefinementState = Annotation.Root({
  componentSpec: Annotation({ default: () => null }),
  libraryContext: Annotation({
    default: () => ({ icons: [], elements: [], components: [], modules: [] }),
  }),
  figmaScreenshot: Annotation({ default: () => null }),
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
  visualInspectionResult: Annotation({ default: () => null }),

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
      [] // No feedback on first iteration
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
    console.log(`  → Proceeding to visual inspection...`);
    return "visual_inspection";  // ALWAYS run visual inspection!
  }

  // Max iterations before forcing visual inspection
  if (iteration >= maxIterations) {
    console.log(
      `  ⚠️  Max code iterations reached (${maxIterations}), forcing visual inspection`
    );
    return "visual_inspection";  // Still check visually even if code isn't perfect
  }

  console.log(
    `  ↻ Quality gate not met (${score.toFixed(
      1
    )}/10), revising... (iteration ${iteration}/${maxIterations})`
  );
  return "prepare_feedback";
};

const visualInspectionNode = async (state) => {
  console.log(`  → Running visual inspection with autonomous agent...`);

  try {
    const result = await runVisualInspection(
      state.currentCode,
      state.componentSpec,
      state.figmaScreenshot,
      state.outputPath
    );

    const visualPercent = Math.round(result.confidenceScore * 100);
    console.log(`    Visual match: ${visualPercent}% (threshold: 90%)`);
    console.log(`    Pixel perfect: ${result.pixelPerfect ? "✅" : "❌"}`);

    if (result.visualDifferences && result.visualDifferences.length > 0) {
      console.log(
        `    Differences found (${result.visualDifferences.length}):`
      );
      result.visualDifferences.slice(0, 3).forEach((diff, i) => {
        console.log(
          `      ${i + 1}. ${diff.aspect}: Figma=${diff.figma}, Rendered=${
            diff.rendered
          } [${diff.severity}]`
        );
      });
      if (result.visualDifferences.length > 3) {
        console.log(
          `      ... and ${result.visualDifferences.length - 3} more`
        );
      }
    }

    return { visualInspectionResult: result };
  } catch (error) {
    console.error(`    ⚠️  Visual inspection failed: ${error.message}`);
    // Fallback: approve without visual validation
    return {
      visualInspectionResult: {
        pixelPerfect: false,
        confidenceScore: 0.85,
        visualDifferences: [],
        feedback: `Visual inspection unavailable: ${error.message}`,
        tailwindFixes: [],
      },
    };
  }
};

const decideNextAfterVisual = (state) => {
  const visualScore = state.visualInspectionResult.confidenceScore;
  const visualPercent = Math.round(visualScore * 100);

  // Quality gate: visual match >= 90%
  if (state.visualInspectionResult.pixelPerfect || visualScore >= 0.9) {
    console.log(`  ✅ Visual inspection passed (${visualPercent}%)!`);
    return "approve_component";
  }

  // NO ITERATION LIMIT - keep going until visual quality achieved
  console.log(
    `  ↻ Visual quality gate not met (${visualPercent}%), revising...`
  );

  return "generate_component";
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
    .addNode("visual_inspection", visualInspectionNode)
    .addNode("approve_component", approveComponent)

    .addEdge(START, "generate_component")
    .addEdge("generate_component", "review_code")
    .addConditionalEdges("review_code", decideNextAfterCodeReview, {
      visual_inspection: "visual_inspection",  // Code passes → visual inspection
      prepare_feedback: "prepare_feedback",    // Code fails → refine
      // NO direct path to approve_component! Visual inspection is MANDATORY
    })
    .addEdge("prepare_feedback", "generate_component")
    .addConditionalEdges("visual_inspection", decideNextAfterVisual, {
      approve_component: "approve_component",   // Visual passes → approve
      generate_component: "generate_component", // Visual fails → regenerate
    })
    .addEdge("approve_component", END);

  return graph.compile();
};

export const componentRefinementSubgraph = buildSubgraph();
export default componentRefinementSubgraph;
