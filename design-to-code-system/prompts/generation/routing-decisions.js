#!/usr/bin/env node

/**
 * AI ROUTING DECISION PROMPTS
 * Functional composition for generation strategy decisions
 */

import { z } from 'zod';

// Zod schema for routing decision output
export const RoutingDecisionSchema = z.object({
  strategy: z.enum(["ATOM_GENERATION", "MOLECULE_GENERATION", "MIXED_GENERATION"]).describe("Generation strategy"),
  reasoning: z.string().describe("Brief explanation of decision"),
  complexity_score: z.number().min(1).max(10).describe("Complexity assessment"),
  estimated_components: z.object({
    atoms: z.number(),
    molecules: z.number()
  }),
  priority_order: z.array(z.enum(["atom", "molecule"])).describe("Which to generate first")
});

// Zod schema for generation path decision
export const GenerationPathSchema = z.object({
  path: z.enum(["CREATE_NEW_ATOMS", "REUSE_ATOMS", "UPDATE_ATOMS", "MIXED_APPROACH"]).describe("Generation approach"),
  steps: z.array(z.string()),
  risk_assessment: z.enum(["LOW", "MEDIUM", "HIGH"]),
  atoms_to_create: z.array(z.string()),
  atoms_to_reuse: z.array(z.string()),
  atoms_to_update: z.array(z.string()),
  estimated_time: z.string()
});

// Zod schema for library evaluation
export const LibraryEvaluationSchema = z.object({
  quality_assessment: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR"]).describe("Library quality"),
  reusability_score: z.number().min(1).max(10).describe("Reusability potential"),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  recommendations: z.array(z.string()),
  generation_strategy: z.enum(["REUSE_FIRST", "CREATE_FIRST", "MIXED_APPROACH"])
});

/**
 * Core routing strategies and criteria
 */
export const ROUTING_STRATEGIES = [
  "ATOM_GENERATION",
  "MOLECULE_GENERATION",
  "MIXED_GENERATION"
];

export const ROUTING_CRITERIA = [
  "Component complexity and composition",
  "Number of distinct interactive elements",
  "Reusability and atomic design principles",
  "Whether components can be broken into simpler parts"
];


/**
 * Routing template with decision examples
 */
const routingExamples = {
  "Simple Form (ATOM_GENERATION)": `{{
    "strategy": "ATOM_GENERATION",
    "reasoning": "Only basic form elements detected - focus on atomic components",
    "complexity_score": 3,
    "estimated_components": {{ "atoms": 4, "molecules": 0 }},
    "priority_order": ["atom"]
  }}`,
  "Complex Dashboard (MIXED_GENERATION)": `{{
    "strategy": "MIXED_GENERATION",
    "reasoning": "Mix of atomic elements and complex composites requires phased approach",
    "complexity_score": 8,
    "estimated_components": {{ "atoms": 6, "molecules": 4 }},
    "priority_order": ["atom", "molecule"]
  }}`
};


/**
 * Create component routing prompt with functional composition
 */
export const createComponentRoutingPrompt = (visualAnalysis, options = {}) => {

  // Handle both old and new analysis format
  const analysisText = typeof visualAnalysis === 'string'
    ? visualAnalysis
    : visualAnalysis.analysis || JSON.stringify(visualAnalysis, null, 2);

  return `IMPORTANT: When making your routing decision, consider:
1. Which identified components should become reusable UI atoms vs contextual elements
2. For components you decide to process, briefly explain why they're reusable
3. For any components you decide to skip, explain the contextual reasoning

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

VISUAL ANALYSIS:
${analysisText}

Analyze this visual content and determine the optimal component generation strategy.`;
};

/**
 * AI complexity analysis prompt for individual components
 */
export const createComplexityAnalysisPrompt = (componentSpec) => {
  const TASK_CONTEXT = `Analyze this component specification and determine its complexity.`;

  const INPUT_DATA = `
<component_specification>
${JSON.stringify(componentSpec, null, 2)}
</component_specification>`;

  const TASK_DESCRIPTION = `Determine:
1. Is this a simple atom (button, input, label) or complex molecule?
2. What atoms would this molecule need?
3. Can this be simplified into smaller components?`;

  const OUTPUT_FORMATTING = `Respond with JSON only:
{
  "classification": "atom" | "molecule",
  "complexity_score": 1-10,
  "required_atoms": ["AtomName1", "AtomName2"],
  "can_be_simplified": boolean,
  "recommended_breakdown": ["Component1", "Component2"] | null
}`;

  const IMMEDIATE_TASK = `Analyze this component specification and provide complexity assessment.`;

  return `${TASK_CONTEXT}

${INPUT_DATA}

${TASK_DESCRIPTION}

${OUTPUT_FORMATTING}

${IMMEDIATE_TASK}`;
};

/**
 * AI generation path decision prompt
 */
export const createGenerationPathPrompt = (requirements, libraryContext = null) => {
  const TASK_CONTEXT = `You are a component generation strategist. Given the requirements and existing library context, decide the optimal generation approach.`;

  const contextText = libraryContext ?
    `\nEXISTING LIBRARY CONTEXT:\n${JSON.stringify(libraryContext, null, 2)}\n` : '';

  const INPUT_DATA = `
<requirements>
${JSON.stringify(requirements, null, 2)}
</requirements>
${contextText}`;

  const TASK_DESCRIPTION = `GENERATION PATHS:
1. **CREATE_NEW_ATOMS**: Build missing atoms first, then molecules
2. **REUSE_ATOMS**: Use existing atoms to build molecules
3. **UPDATE_ATOMS**: Modify existing atoms, then build molecules
4. **MIXED_APPROACH**: Combination of create, reuse, and update

Consider:
- Existing atoms that can be reused
- Missing atoms that need creation
- Atoms that need updates for molecule compatibility
- Risk of breaking existing molecules`;

  const OUTPUT_FORMATTING = `Respond with JSON only:
{
  "path": "CREATE_NEW_ATOMS" | "REUSE_ATOMS" | "UPDATE_ATOMS" | "MIXED_APPROACH",
  "steps": ["step1", "step2", "step3"],
  "risk_assessment": "LOW" | "MEDIUM" | "HIGH",
  "atoms_to_create": ["AtomName1"],
  "atoms_to_reuse": ["ExistingAtom1"],
  "atoms_to_update": ["AtomToUpdate1"],
  "estimated_time": "minutes"
}`;

  const IMMEDIATE_TASK = `Determine the optimal generation path based on the requirements and library context.`;

  return `${TASK_CONTEXT}

${INPUT_DATA}

${TASK_DESCRIPTION}

${OUTPUT_FORMATTING}

${IMMEDIATE_TASK}`;
};

/**
 * AI library context evaluation prompt
 */
export const createLibraryEvaluationPrompt = (libraryDocs) => {
  const TASK_CONTEXT = `Evaluate this component library for reusability and generation strategy.`;

  if (!libraryDocs || (!libraryDocs.atoms && !libraryDocs.molecules)) {
    const OUTPUT_FORMATTING = `Return this exact JSON:
{
  "has_library": false,
  "atom_count": 0,
  "molecule_count": 0,
  "quality_assessment": "UNKNOWN",
  "reusability_score": 0,
  "recommendations": ["Start with atom generation", "Build comprehensive component library"]
}`;

    return `${TASK_CONTEXT}

No library context found. ${OUTPUT_FORMATTING}`;
  }

  const atomCount = Object.keys(libraryDocs.atoms || {}).length;
  const moleculeCount = Object.keys(libraryDocs.molecules || {}).length;

  const INPUT_DATA = `
<library_summary>
- Atoms: ${atomCount}
- Molecules: ${moleculeCount}
- Last Updated: ${libraryDocs.lastUpdated}
</library_summary>

<sample_atoms>
${JSON.stringify(Object.keys(libraryDocs.atoms || {}).slice(0, 5), null, 2)}
</sample_atoms>

<sample_molecules>
${JSON.stringify(Object.keys(libraryDocs.molecules || {}).slice(0, 3), null, 2)}
</sample_molecules>`;

  const TASK_DESCRIPTION = `Evaluate:
1. Library maturity and quality
2. Reusability potential for new components
3. Gaps that need to be filled
4. Recommended generation strategy`;

  const OUTPUT_FORMATTING = `Respond with JSON only:
{
  "quality_assessment": "EXCELLENT" | "GOOD" | "FAIR" | "POOR",
  "reusability_score": 1-10,
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"],
  "recommendations": ["rec1", "rec2"],
  "generation_strategy": "REUSE_FIRST" | "CREATE_FIRST" | "MIXED_APPROACH"
}`;

  const IMMEDIATE_TASK = `Evaluate the library and provide strategic recommendations.`;

  return `${TASK_CONTEXT}

${INPUT_DATA}

${TASK_DESCRIPTION}

${OUTPUT_FORMATTING}

${IMMEDIATE_TASK}`;
};

/**
 * AI expected components extraction prompt
 */
export const createExpectedComponentsPrompt = (analysisText) => {
  const TASK_CONTEXT = `Analyze this visual description and identify what UI components should logically be generated based on what's described.`;

  const INPUT_DATA = `
<visual_analysis>
${analysisText}
</visual_analysis>`;

  const TASK_DESCRIPTION = `Your task: Identify specific, reusable UI components that are mentioned or implied in this visual analysis.

IMPORTANT GUIDELINES:
- Only identify components that are actually mentioned or clearly implied in the analysis
- Focus on interactive elements, form controls, and distinct UI elements
- Avoid assuming components not mentioned in the analysis
- Prioritize components that users interact with (inputs, buttons, controls)
- Consider both explicit mentions ("button", "input field") and implicit ones ("users can select options" = dropdown/select)`;

  const OUTPUT_FORMATTING = `Return a JSON array of expected components:
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

  const IMMEDIATE_TASK = `Extract the specific UI components that should be generated based on this visual analysis.`;

  return `${TASK_CONTEXT}

${INPUT_DATA}

${TASK_DESCRIPTION}

${OUTPUT_FORMATTING}

${IMMEDIATE_TASK}`;
};

/**
 * AI missing components generation prompt
 */
export const createMissingComponentsPrompt = (visualAnalysis, missingComponentTypes) => {
  const TASK_CONTEXT = `You are generating SPECIFIC React components that were missed in the initial generation.`;

  const targetComponents = missingComponentTypes.join(', ');

  const INPUT_DATA = `
<visual_analysis>
${visualAnalysis.analysis}
</visual_analysis>

<target_components>
${targetComponents}
</target_components>`;

  const TASK_DESCRIPTION = `REQUIREMENTS:
- Generate ONLY the components listed above: ${targetComponents}
- Focus specifically on form controls and interactive elements
- Use standard naming: TextInput, Textarea, Slider, Select, etc.
- Complete TypeScript interfaces and implementations
- Follow the same patterns used in existing components`;

  const OUTPUT_FORMATTING = `OUTPUT FORMAT:
---COMPONENT-SEPARATOR---
COMPONENT_NAME: [PascalCase name]
COMPONENT_TYPE: atom
COMPONENT_DESCRIPTION: [Brief description]
COMPONENT_CODE:
import { cn } from '@/lib/utils';

[Complete TypeScript component code]
---COMPONENT-SEPARATOR---`;

  const IMMEDIATE_TASK = `Generate the missing components: ${targetComponents}`;

  return `${TASK_CONTEXT}

${INPUT_DATA}

${TASK_DESCRIPTION}

${OUTPUT_FORMATTING}

${IMMEDIATE_TASK}`;
};

/**
 * @deprecated Use structured output with withStructuredOutput() instead
 * Parse AI routing decision response - LEGACY FUNCTION
 */
export const parseRoutingDecision = (aiResponse) => {
  console.warn('parseRoutingDecision is deprecated. Use structured output with RoutingDecisionSchema instead.');

  try {
    const jsonMatch = aiResponse.match(/```json\n?([\\s\\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);

  } catch (error) {
    console.warn('Failed to parse routing decision, using fallback:', error.message);
    return {
      strategy: 'ATOM_GENERATION',
      reasoning: 'Fallback due to parsing error',
      complexity_score: 5,
      estimated_components: { atoms: 3, molecules: 0 },
      priority_order: ['atom']
    };
  }
};

/**
 * @deprecated Use structured output with appropriate schema instead
 * Parse expected components response - LEGACY FUNCTION
 */
export const parseExpectedComponents = (aiResponse) => {
  console.warn('parseExpectedComponents is deprecated. Use structured output instead.');

  try {
    const jsonMatch = aiResponse.match(/```json\n?([\\s\\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];

  } catch (error) {
    console.warn('Failed to parse expected components, using fallback:', error.message);
    return [];
  }
};

export default {
  // Schemas
  RoutingDecisionSchema,
  GenerationPathSchema,
  LibraryEvaluationSchema,

  // Constants
  ROUTING_STRATEGIES,
  ROUTING_CRITERIA,

  // Prompt functions
  createComponentRoutingPrompt,
  createComplexityAnalysisPrompt,
  createGenerationPathPrompt,
  createLibraryEvaluationPrompt,
  createExpectedComponentsPrompt,
  createMissingComponentsPrompt,

  // Deprecated parsing functions (use structured output instead)
  parseRoutingDecision, // @deprecated
  parseExpectedComponents // @deprecated
};