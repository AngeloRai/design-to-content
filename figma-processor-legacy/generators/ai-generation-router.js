#!/usr/bin/env node

/**
 * AI-DRIVEN GENERATION ROUTER
 * Intelligently routes component generation based on complexity analysis
 * Uses OpenAI to decide between atom and molecule generation strategies
 */

import OpenAI from "openai/index.mjs";
import { generateAndSaveAtoms } from "./atom-generator.js";
import { generateMoleculesFromAnalysis } from "./molecule-generator.js";
import { generateLibraryDocs } from "../utils/library-doc.js";
import {
  getRegistryStats,
  regenerateDependencyRegistry,
} from "../utils/dependency-registry.js";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_DEBUGS = true;

// Debug logging system
let debugLog = [];
const debugLogger = (step, data) => {
  if (!LOG_DEBUGS) return;
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    step,
    data: typeof data === "object" ? JSON.stringify(data, null, 2) : data,
  };
  debugLog.push(logEntry);
  console.log(`🐛 DEBUG [${step}]:`, data);
};

const saveDebugLog = () => {
  try {
    const debugDir = join(__dirname, "..", "data", "debug");
    if (!existsSync(debugDir)) {
      mkdirSync(debugDir, { recursive: true });
    }
    const debugFile = join(debugDir, `debug-${Date.now()}.json`);
    writeFileSync(debugFile, JSON.stringify(debugLog, null, 2));
    console.log(`🐛 DEBUG LOG SAVED: ${debugFile}`);
    debugLog = []; // Reset for next run
  } catch (error) {
    console.error("Failed to save debug log:", error.message);
  }
};

// Lazy OpenAI client initialization
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
 * Helper function to parse AI JSON responses that may have markdown code fences
 */
const parseAIResponse = (response) => {
  let rawContent = response.choices[0].message.content;

  // Clean up markdown code fences if present
  rawContent = rawContent.replace(/```json\n?/g, "");
  rawContent = rawContent.replace(/```\n?/g, "");
  rawContent = rawContent.trim();

  return JSON.parse(rawContent);
};

/**
 * AI-powered component routing decision
 * Analyzes visual complexity and determines generation strategy
 */
export const aiRouteComponent = async (visualAnalysis) => {
  console.log("\n🤖 AI GENERATION ROUTER: Analyzing complexity...");
  console.log("📋 Processing visual analysis for component routing...");

  const openai = getOpenAIClient();

  const prompt = `You are an expert React component architect. Analyze the visual content and determine the optimal generation strategy.

VISUAL ANALYSIS:
${visualAnalysis.analysis}

IMPORTANT: When making your routing decision, consider:
1. Which identified components should become reusable UI atoms vs contextual elements
2. For components you decide to process, briefly explain why they're reusable
3. For any components you decide to skip, explain the contextual reasoning

This helps maintain transparency in the AI decision-making process.

GENERATION STRATEGIES:
1. **ATOM_GENERATION**: Simple, single-purpose components
   - Individual buttons, inputs, icons, labels, badges
   - Basic form controls and UI elements
   - Minimal composition, focused functionality

2. **MOLECULE_GENERATION**: Composed components using multiple atoms
   - Form groups, card components, navigation items
   - Components that combine 2+ atoms meaningfully
   - Complex interactive patterns

3. **MIXED_GENERATION**: Both atoms and molecules needed
   - Design systems with both simple and complex components
   - Multiple component types at different complexity levels

DECISION CRITERIA:
- Component complexity and composition
- Number of distinct interactive elements
- Reusability and atomic design principles
- Whether components can be broken into simpler parts

Respond with JSON only:
{
  "strategy": "ATOM_GENERATION" | "MOLECULE_GENERATION" | "MIXED_GENERATION",
  "reasoning": "Brief explanation of decision",
  "complexity_score": 1-10,
  "estimated_components": {
    "atoms": number,
    "molecules": number
  },
  "priority_order": ["atom", "molecule"] // Which to generate first
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 800,
    temperature: 0.1,
  });

  try {
    const decision = parseAIResponse(response);
    console.log(
      `📊 Strategy: ${decision.strategy} (Complexity: ${decision.complexity_score}/10)`
    );
    console.log(`💭 Reasoning: ${decision.reasoning}`);

    return decision;
  } catch (error) {
    console.warn(
      "Could not parse AI routing decision, defaulting to ATOM_GENERATION"
    );
    console.warn("Parse error:", error.message);
    return {
      strategy: "ATOM_GENERATION",
      reasoning: "Fallback due to parsing error",
      complexity_score: 5,
      estimated_components: { atoms: 3, molecules: 0 },
      priority_order: ["atom"],
    };
  }
};

/**
 * AI-powered complexity analysis for individual components
 */
export const aiAnalyzeComplexity = async (componentSpec) => {
  console.log(
    `🧠 Analyzing complexity of component: ${componentSpec.name || "Unknown"}`
  );

  const openai = getOpenAIClient();

  const prompt = `Analyze this component specification and determine its complexity:

COMPONENT SPEC:
${JSON.stringify(componentSpec, null, 2)}

Determine:
1. Is this a simple atom (button, input, label) or complex molecule?
2. What atoms would this molecule need?
3. Can this be simplified into smaller components?

Respond with JSON only:
{
  "classification": "atom" | "molecule",
  "complexity_score": 1-10,
  "required_atoms": ["AtomName1", "AtomName2"],
  "can_be_simplified": boolean,
  "recommended_breakdown": ["Component1", "Component2"] | null
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400,
    temperature: 0.1,
  });

  try {
    const analysis = parseAIResponse(response);
    console.log(
      `  📋 Classification: ${analysis.classification} (Score: ${analysis.complexity_score})`
    );
    return analysis;
  } catch (error) {
    console.warn(
      "Could not parse complexity analysis, defaulting to atom:",
      error.message
    );
    return {
      classification: "atom",
      complexity_score: 3,
      required_atoms: [],
      can_be_simplified: false,
      recommended_breakdown: null,
    };
  }
};

/**
 * AI-powered generation path decision with library context
 */
export const aiDecideGenerationPath = async (
  requirements,
  libraryContext = null
) => {
  console.log("🎯 AI deciding optimal generation path...");

  const openai = getOpenAIClient();

  const contextText = libraryContext
    ? `EXISTING LIBRARY CONTEXT:\n${JSON.stringify(libraryContext, null, 2)}\n`
    : "";

  const prompt = `You are a component generation strategist. Given the requirements and existing library context, decide the optimal generation approach.

REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

${contextText}

GENERATION PATHS:
1. **CREATE_NEW_ATOMS**: Build missing atoms first, then molecules
2. **REUSE_ATOMS**: Use existing atoms to build molecules
3. **UPDATE_ATOMS**: Modify existing atoms, then build molecules
4. **MIXED_APPROACH**: Combination of create, reuse, and update

Consider:
- Existing atoms that can be reused
- Missing atoms that need creation
- Atoms that need updates for molecule compatibility
- Risk of breaking existing molecules

Respond with JSON only:
{
  "path": "CREATE_NEW_ATOMS" | "REUSE_ATOMS" | "UPDATE_ATOMS" | "MIXED_APPROACH",
  "steps": ["step1", "step2", "step3"],
  "risk_assessment": "LOW" | "MEDIUM" | "HIGH",
  "atoms_to_create": ["AtomName1"],
  "atoms_to_reuse": ["ExistingAtom1"],
  "atoms_to_update": ["AtomToUpdate1"],
  "estimated_time": "minutes"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 600,
    temperature: 0.1,
  });

  try {
    const path = parseAIResponse(response);
    console.log(
      `🛤️  Generation Path: ${path.path} (Risk: ${path.risk_assessment})`
    );
    return path;
  } catch (error) {
    console.warn(
      "Could not parse generation path, using default:",
      error.message
    );
    return {
      path: "CREATE_NEW_ATOMS",
      steps: ["Generate atoms", "Generate molecules"],
      risk_assessment: "LOW",
      atoms_to_create: [],
      atoms_to_reuse: [],
      atoms_to_update: [],
      estimated_time: "5-10 minutes",
    };
  }
};

/**
 * AI-powered library context evaluation
 */
export const aiEvaluateLibraryContext = async (libraryDocs) => {
  console.log("📚 AI evaluating library context...");

  if (!libraryDocs || (!libraryDocs.atoms && !libraryDocs.molecules)) {
    console.log(
      "  📄 No library context found, proceeding with fresh generation"
    );
    return {
      has_library: false,
      atom_count: 0,
      molecule_count: 0,
      quality_assessment: "UNKNOWN",
      reusability_score: 0,
      recommendations: [
        "Start with atom generation",
        "Build comprehensive component library",
      ],
    };
  }

  const openai = getOpenAIClient();

  const atomCount = Object.keys(libraryDocs.atoms || {}).length;
  const moleculeCount = Object.keys(libraryDocs.molecules || {}).length;

  const prompt = `Evaluate this component library for reusability and generation strategy:

LIBRARY SUMMARY:
- Atoms: ${atomCount}
- Molecules: ${moleculeCount}
- Last Updated: ${libraryDocs.lastUpdated}

SAMPLE ATOMS:
${JSON.stringify(Object.keys(libraryDocs.atoms || {}).slice(0, 5), null, 2)}

SAMPLE MOLECULES:
${JSON.stringify(Object.keys(libraryDocs.molecules || {}).slice(0, 3), null, 2)}

Evaluate:
1. Library maturity and quality
2. Reusability potential for new components
3. Gaps that need to be filled
4. Recommended generation strategy

Respond with JSON only:
{
  "quality_assessment": "EXCELLENT" | "GOOD" | "FAIR" | "POOR",
  "reusability_score": 1-10,
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"],
  "recommendations": ["rec1", "rec2"],
  "generation_strategy": "REUSE_FIRST" | "CREATE_FIRST" | "MIXED_APPROACH"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500,
    temperature: 0.1,
  });

  try {
    const evaluation = parseAIResponse(response);
    console.log(
      `  📊 Quality: ${evaluation.quality_assessment} | Reusability: ${evaluation.reusability_score}/10`
    );
    return {
      has_library: true,
      atom_count: atomCount,
      molecule_count: moleculeCount,
      ...evaluation,
    };
  } catch (error) {
    console.warn("Could not parse library evaluation:", error.message);
    return {
      has_library: true,
      atom_count: atomCount,
      molecule_count: moleculeCount,
      quality_assessment: "UNKNOWN",
      reusability_score: 5,
      recommendations: ["Analyze library manually", "Proceed with caution"],
    };
  }
};

/**
 * Main routing function - orchestrates the entire generation process
 */
export const routeComponentGeneration = async (visualAnalysis, figmaData) => {
  try {
    console.log("\n🚀 AI-DRIVEN COMPONENT GENERATION ROUTER");
    console.log("=".repeat(50));

    debugLogger("ROUTER_START", {
      visualAnalysisLength: visualAnalysis?.analysis?.length || 0,
      hasFigmaData: !!figmaData,
    });

    // Step 1: Regenerate library documentation for accurate context
    console.log("🔄 Regenerating library documentation...");
    const libraryDocs = await generateLibraryDocs();
    debugLogger("LIBRARY_DOCS", {
      atomCount: Object.keys(libraryDocs?.atoms || {}).length,
      moleculeCount: Object.keys(libraryDocs?.molecules || {}).length,
    });

    // Step 2: Regenerate dependency registry from component files
    console.log("🔄 Regenerating dependency registry...");
    await regenerateDependencyRegistry();

    // Step 3: Evaluate library context with fresh data and dependency info
    const registryStats = getRegistryStats();
    debugLogger("REGISTRY_STATS", registryStats);

    console.log(
      `   📊 Dependency Registry: ${registryStats.totalAtoms} atoms, ${registryStats.totalMolecules} molecules`
    );
    if (registryStats.totalDependencies > 0) {
      console.log(
        `   🔗 ${registryStats.totalDependencies} total dependencies tracked`
      );
    }

    const libraryContext = await aiEvaluateLibraryContext(libraryDocs);
    debugLogger("LIBRARY_CONTEXT", libraryContext);

    // Step 4: Analyze routing decision
    const routingDecision = await aiRouteComponent(visualAnalysis);
    debugLogger("ROUTING_DECISION", routingDecision);
    console.log(
      `📋 Components mentioned in visual analysis: extracting for tracking...`
    );

    // Step 5: Execute generation based on strategy
    let generatedComponents = []; // Ensure it's always an array

    debugLogger("STRATEGY_EXECUTION_START", {
      strategy: routingDecision.strategy,
      reasoning: routingDecision.reasoning,
    });

    switch (routingDecision.strategy) {
      case "ATOM_GENERATION":
        console.log("\n🔬 Executing ATOM_GENERATION strategy");
        const atomResult = await generateAndSaveAtoms(
          visualAnalysis,
          figmaData,
          libraryDocs
        );
        generatedComponents = atomResult.components || [];
        debugLogger("ATOM_RESULT", {
          componentCount: generatedComponents.length,
          stats: atomResult.stats,
        });

        // Log intelligent save results
        if (atomResult.stats) {
          console.log(
            `   📊 Save Results: ${atomResult.stats.new} new, ${atomResult.stats.updated} updated, ${atomResult.stats.skipped} skipped`
          );
        }

        // Regenerate library docs after atom generation
        if (generatedComponents.length > 0) {
          console.log(
            "🔄 Regenerating library documentation after atom generation..."
          );
          await generateLibraryDocs();
          console.log("✅ Library documentation updated with new atoms");
        }
        break;

      case "MOLECULE_GENERATION":
        console.log("\n🧩 Executing MOLECULE_GENERATION strategy");
        debugLogger("MOLECULE_GENERATION_START", {
          analysis: visualAnalysis.analysis,
        });

        // Use simple molecule generator
        const moleculeResults = await generateMoleculesFromAnalysis(
          visualAnalysis.analysis
        );
        debugLogger("MOLECULE_RESULTS", moleculeResults);

        generatedComponents = moleculeResults || [];

        // Regenerate library docs after molecule generation
        if (generatedComponents.length > 0) {
          console.log(
            "🔄 Regenerating library documentation after molecule generation..."
          );
          await generateLibraryDocs();
          console.log("✅ Library documentation updated with new molecules");
        }
        break;

      case "MIXED_GENERATION":
        console.log("\n🔄 Executing MIXED_GENERATION strategy");
        debugLogger("MIXED_GENERATION_START", {
          priorityOrder: routingDecision.priority_order,
        });

        // Generate based on priority order
        if (routingDecision.priority_order[0] === "atom") {
          console.log("  📦 Generating atoms first...");
          const atomResult = await generateAndSaveAtoms(
            visualAnalysis,
            figmaData,
            libraryDocs
          );
          generatedComponents.push(...(atomResult.components || []));
          debugLogger("MIXED_ATOMS_RESULT", {
            atomsGenerated: atomResult.components?.length || 0,
            atomsAdded: atomResult.components?.length || 0,
          });

          console.log("  🧩 Generating molecules...");
          debugLogger("MIXED_MOLECULE_START", {
            analysis: visualAnalysis.analysis,
          });

          // Use simple molecule generator
          const mixedMoleculeResults = await generateMoleculesFromAnalysis(
            visualAnalysis.analysis
          );
          debugLogger("MIXED_MOLECULE_RESULTS", mixedMoleculeResults);

          if (mixedMoleculeResults.length > 0) {
            generatedComponents.push(...mixedMoleculeResults);
          }
        } else {
          console.log("  🧩 Generating molecules first...");
          // Molecule-first approach (less common)
          debugLogger("MOLECULE_FIRST_START", {
            analysis: visualAnalysis.analysis,
          });

          const moleculeFirstResults = await generateMoleculesFromAnalysis(
            visualAnalysis.analysis
          );
          debugLogger("MOLECULE_FIRST_RESULTS", moleculeFirstResults);

          if (moleculeFirstResults.length > 0) {
            generatedComponents.push(...moleculeFirstResults);
          }
        }

        // Regenerate library docs after all mixed generation is complete
        if (generatedComponents.length > 0) {
          console.log(
            "🔄 Regenerating library documentation after component generation..."
          );
          await generateLibraryDocs();
          console.log("✅ Library documentation updated with new components");
        }
        break;

      default:
        console.log("\n⚠️  Unknown strategy, defaulting to atom generation");
        const defaultResult = await generateAndSaveAtoms(
          visualAnalysis,
          figmaData
        );
        generatedComponents = defaultResult.components || [];

        // Regenerate library docs after default generation
        if (generatedComponents.length > 0) {
          console.log(
            "🔄 Regenerating library documentation after component generation..."
          );
          await generateLibraryDocs();
          console.log("✅ Library documentation updated with new components");
        }
    }

    console.log("\n✅ AI-DRIVEN GENERATION COMPLETE!");
    console.log(
      `Generated ${generatedComponents.length} components using ${routingDecision.strategy} strategy`
    );

    debugLogger("GENERATION_COMPLETE", {
      strategy: routingDecision.strategy,
      totalComponents: generatedComponents.length,
      componentNames: generatedComponents.map((c) => c?.name || "unnamed"),
    });

    // Validate completeness - check what was identified vs what was generated
    const completenessCheck = await validateGenerationCompleteness(
      visualAnalysis,
      generatedComponents
    );
    debugLogger("COMPLETENESS_CHECK", completenessCheck);
    if (completenessCheck.missingComponents.length > 0) {
      console.warn(
        `⚠️  Completeness Issue: ${completenessCheck.missingComponents.length} expected components were not generated:`
      );
      completenessCheck.missingComponents.forEach((missing) => {
        console.warn(
          `   - ${missing}: ${
            completenessCheck.explanations[missing] || "No explanation provided"
          }`
        );
      });

      // Attempt to generate missing high-priority components
      if (completenessCheck.highPriorityMissing.length > 0) {
        console.log(
          "\n🔄 Attempting to generate high-priority missing components..."
        );
        const retryResult = await generateMissingComponents(
          visualAnalysis,
          completenessCheck.highPriorityMissing
        );
        if (retryResult.components.length > 0) {
          generatedComponents.push(...retryResult.components);
          console.log(
            `✅ Successfully generated ${retryResult.components.length} missing components`
          );
        }
      }
    }

    if (generatedComponents.length === 0) {
      console.warn("⚠️  No components were generated. This may indicate:");
      console.warn(
        "   - All identified components were contextual (navigation, layout)"
      );
      console.warn("   - Components already exist in library");
      console.warn("   - AI processing issue in generation phase");
    }

    const finalResult = {
      strategy: routingDecision.strategy,
      components: generatedComponents,
      libraryContext,
      routingDecision,
      stats: {
        totalComponents: generatedComponents.length,
        atoms: generatedComponents.filter((c) => c && c.type === "atom").length,
        molecules: generatedComponents.filter((c) => c && c.type === "molecule")
          .length,
      },
    };

    debugLogger("FINAL_RESULT", finalResult);
    saveDebugLog();

    return finalResult;
  } catch (error) {
    debugLogger("ERROR_OCCURRED", {
      error: error.message,
      stack: error.stack,
    });

    console.error("❌ AI routing failed:", error.message);
    console.log("🔄 Falling back to atom generation...");

    // Fallback to atom generation
    const fallbackResult = await generateAndSaveAtoms(
      visualAnalysis,
      figmaData
    );
    const fallbackComponents = Array.isArray(fallbackResult.components)
      ? fallbackResult.components
      : [];

    const fallbackReturn = {
      strategy: "ATOM_GENERATION_FALLBACK",
      components: fallbackComponents,
      stats: {
        totalComponents: fallbackComponents.length,
        atoms: fallbackComponents.filter((c) => c && c.type === "atom").length,
        molecules: fallbackComponents.filter((c) => c && c.type === "molecule")
          .length,
      },
      error: error.message,
    };

    debugLogger("FALLBACK_RESULT", fallbackReturn);
    saveDebugLog();

    return fallbackReturn;
  }
};

/**
 * AI-powered extraction of expected components from visual analysis
 */
const aiExtractExpectedComponents = async (analysisText) => {
  try {
    const openai = getOpenAIClient();

    const prompt = `Analyze this visual description and identify what UI components should logically be generated based on what's described.

VISUAL ANALYSIS:
${analysisText}

Your task: Identify specific, reusable UI components that are mentioned or implied in this visual analysis.

IMPORTANT GUIDELINES:
- Only identify components that are actually mentioned or clearly implied in the analysis
- Focus on interactive elements, form controls, and distinct UI elements
- Avoid assuming components not mentioned in the analysis
- Prioritize components that users interact with (inputs, buttons, controls)
- Consider both explicit mentions ("button", "input field") and implicit ones ("users can select options" = dropdown/select)

Return a JSON array of expected components:
[
  {
    "name": "ComponentName",
    "keywords": ["keyword1", "keyword2"],
    "evidence": "Quote from analysis that suggests this component",
    "priority": "high" | "medium" | "low"
  }
]

Use "high" priority for interactive/form components users need to interact with.
Use "medium" priority for important display components.
Use "low" priority for decorative or secondary elements.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const components = parseAIResponse(response);
    console.log(
      `   🎯 AI identified ${components.length} expected components from visual analysis`
    );

    return Array.isArray(components) ? components : [];
  } catch (error) {
    console.warn(
      "⚠️  AI component extraction failed, using fallback:",
      error.message
    );
    // Minimal fallback - no assumptions
    return [];
  }
};

/**
 * Validate that all expected components from visual analysis were actually generated
 */
const validateGenerationCompleteness = async (
  visualAnalysis,
  generatedComponents
) => {
  console.log("🔍 Validating generation completeness...");

  try {
    const generatedNames = generatedComponents
      .filter((c) => c && c.name) // Filter out undefined components
      .map((c) => c.name.toLowerCase());

    // Use AI to identify what components were mentioned in visual analysis
    const expectedComponents = await aiExtractExpectedComponents(
      visualAnalysis.analysis
    );

    const missingComponents = [];
    const explanations = {};
    const highPriorityMissing = [];

    // Check if each expected component was actually generated
    for (const expectedComponent of expectedComponents) {
      const wasGenerated = generatedNames.some(
        (name) =>
          name.toLowerCase().includes(expectedComponent.name.toLowerCase()) ||
          expectedComponent.keywords.some((keyword) =>
            name.toLowerCase().includes(keyword.toLowerCase())
          )
      );

      if (!wasGenerated) {
        missingComponents.push(expectedComponent.name);
        explanations[
          expectedComponent.name
        ] = `Expected based on visual analysis: "${expectedComponent.evidence}" but not generated`;

        // High priority: interactive/form components
        if (expectedComponent.priority === "high") {
          highPriorityMissing.push(expectedComponent.name);
        }
      }
    }

    console.log(
      `   📊 Analysis: ${missingComponents.length} missing components identified`
    );

    return {
      missingComponents,
      explanations,
      highPriorityMissing,
      totalExpected: Object.keys(expectedPatterns).filter((type) =>
        expectedPatterns[type].some((pattern) => analysisText.includes(pattern))
      ).length,
      totalGenerated: generatedComponents.length,
    };
  } catch (error) {
    console.warn("⚠️  Completeness validation failed:", error.message);
    return {
      missingComponents: [],
      explanations: {},
      highPriorityMissing: [],
      totalExpected: 0,
      totalGenerated: generatedComponents.length,
    };
  }
};

/**
 * Generate specific missing components with targeted prompts
 */
const generateMissingComponents = async (
  visualAnalysis,
  missingComponentTypes
) => {
  console.log(
    `🎯 Targeting generation for: ${missingComponentTypes.join(", ")}`
  );

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Create focused prompt for missing components only
    const targetComponents = missingComponentTypes.join(", ");

    const prompt = `You are generating SPECIFIC React components that were missed in the initial generation.

VISUAL ANALYSIS (for context):
${visualAnalysis.analysis}

TARGET COMPONENTS TO GENERATE: ${targetComponents}

REQUIREMENTS:
- Generate ONLY the components listed above: ${targetComponents}
- Focus specifically on form controls and interactive elements
- Use standard naming: TextInput, Textarea, Slider, Select, etc.
- Complete TypeScript interfaces and implementations
- Follow the same patterns used in existing components

OUTPUT FORMAT:
---COMPONENT-SEPARATOR---
COMPONENT_NAME: [PascalCase name]
COMPONENT_TYPE: atom
COMPONENT_DESCRIPTION: [Brief description]
COMPONENT_CODE:
import { cn } from '@/lib/utils';

[Complete TypeScript component code]
---COMPONENT-SEPARATOR---

Generate the missing components: ${targetComponents}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.1,
    });

    const generatedContent = response.choices[0].message.content;

    // Parse the response using existing parsing logic
    const { parseAtomComponents } = await import("./atom-generator.js");
    const components = parseAtomComponents(generatedContent);

    // Save the generated components
    const { saveAtomComponents } = await import("./atom-generator.js");
    const savedComponents = await saveAtomComponents(components);

    return {
      components: savedComponents.components,
      stats: savedComponents.stats,
    };
  } catch (error) {
    console.error("❌ Failed to generate missing components:", error.message);
    return {
      components: [],
      stats: { new: 0, updated: 0, skipped: 0 },
    };
  }
};

const aiGenerationRouter = {
  aiRouteComponent,
  aiAnalyzeComplexity,
  aiDecideGenerationPath,
  aiEvaluateLibraryContext,
  routeComponentGeneration,
};

export default aiGenerationRouter;
