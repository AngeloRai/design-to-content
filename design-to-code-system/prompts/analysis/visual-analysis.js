#!/usr/bin/env node

/**
 * VISUAL ANALYSIS PROMPTS
 * Functional prompt composition for UI component identification
 */

import { z } from 'zod';

// Zod schema for visual analysis output
export const VisualAnalysisSchema = z.object({
  overview: z.string().describe("Brief description of what you see"),
  identifiedComponents: z.array(z.object({
    type: z.string().describe("Component type (e.g., button, input, card)"),
    variants: z.array(z.string()).describe("Visual variants found"),
    priority: z.enum(["high", "medium", "low"]).describe("Implementation priority"),
    evidence: z.string().describe("Visual evidence from the design"),
    confidence: z.number().min(0).max(1).describe("Confidence in identification")
  })),
  implementationPriority: z.string().describe("Recommended build order"),
  pixelPerfectionNotes: z.string().describe("Specific measurements/details needed")
});

/**
 * Functional prompt components for better composition
 */
const createSystemContext = () =>
  `You are a professional UI/UX analyst with expertise in component identification.
Analyze screenshots to identify React components that need to be built.`;

const createToneGuidance = () =>
  `Focus on precision and practical component identification.
Be specific about what you observe rather than making assumptions.`;

const createTaskRequirements = () => `FOCUS ON:
- Individual UI elements and their variations
- Visual patterns and relationships
- Component boundaries and hierarchies
- Exact variant names from visual content (avoid generic names)`;

const createOutputSchema = () => `Return structured JSON matching this schema:
{
  "overview": "Brief description of what you see",
  "identifiedComponents": [
    {
      "type": "button|input|card|modal|etc",
      "variants": ["primary", "secondary", "ghost"],
      "priority": "high|medium|low",
      "evidence": "Quote or description of visual evidence",
      "confidence": 0.95
    }
  ],
  "implementationPriority": "Atoms first, then molecules, organisms",
  "pixelPerfectionNotes": "Specific measurements/details needed"
}`;

const createExamples = () => `EXAMPLES:

Button Analysis:
{
  "type": "button",
  "variants": ["primary-blue", "secondary-outline", "ghost-text"],
  "priority": "high",
  "evidence": "Three distinct button styles: solid blue, outlined gray, and text-only variants",
  "confidence": 0.9
}

Input Analysis:
{
  "type": "input",
  "variants": ["text-default", "text-error", "search-with-icon"],
  "priority": "high",
  "evidence": "Input fields with different states and icons visible in design",
  "confidence": 0.85
}`;

/**
 * Create visual analysis prompt with functional composition
 */
export const createVisualAnalysisPrompt = (context = {}) => {
  const sections = [
    createSystemContext(),
    createToneGuidance(),
    createTaskRequirements(),
    createOutputSchema()
  ];

  // Add examples if requested
  if (context.includeExamples) {
    sections.splice(-1, 0, createExamples());
  }

  // Add context information
  const contextInfo = `Context: ${JSON.stringify(context, null, 2)}`;

  const taskInstruction = `Analyze this UI screenshot and provide a comprehensive component analysis.

${contextInfo}

Please identify:
1. What UI components need to be built
2. How many variants of each component exist
3. Visual differences between variants
4. Priority order for implementation
5. Specific details needed for pixel-perfect implementation`;

  sections.push(taskInstruction);

  return sections.join('\n\n');
};

/**
 * Component extraction prompt using functional composition
 */
export const createComponentExtractionPrompt = (analysisData) => {
  const systemContext = `You are a component extraction specialist. Parse visual analysis text to identify React components that need to be built.`;

  const criticalInstructions = `CRITICAL: Do NOT use predetermined patterns or categories. Extract EXACTLY what the visual analysis describes.`;

  const requirements = `Requirements:
• Parse visual analysis text accurately
• Extract component types as described
• Count variants mentioned in analysis
• Assign priority based on component complexity`;

  const constraints = `Constraints:
• Trust the visual analysis completely
• Extract information as described, not as categorized
• Use exact component names from analysis`;

  const outputFormat = `OUTPUT: JSON array of components with:
- type: exact component name from analysis
- variantCount: number of variants mentioned
- priority: "high" (atomic elements), "medium" (combinations), "low" (complex layouts)
- analysisId: provided analysis ID`;

  const taskInstruction = `Parse this visual analysis and extract components to build:

Analysis ID: ${analysisData.id}

Visual Analysis:
${analysisData.analysis}

Return JSON array of components identified in this analysis.`;

  return [
    systemContext,
    criticalInstructions,
    requirements,
    constraints,
    outputFormat,
    taskInstruction
  ].join('\n\n');
};

/**
 * Implementation plan prompt using functional composition
 */
export const createImplementationPlanPrompt = (components) => {
  const systemContext = `You are a React development strategist. Create an implementation plan for the identified components.`;

  const requirements = `Requirements:
• Create logical build order (atoms → molecules → organisms)
• Identify dependencies between components
• Provide complexity and effort estimation
• Assess implementation risks`;

  const constraints = `Constraints:
• Base plan on actual components identified
• No predetermined rules - adapt to specific needs
• Consider team capabilities and timeline
• Prioritize high-impact, low-risk components first`;

  const taskInstruction = `Create an implementation plan for these components:

${JSON.stringify(components, null, 2)}

Provide:
1. Recommended build order with justification
2. Priority reasoning for each phase
3. Estimated complexity (1-10 scale)
4. Potential dependencies and blockers
5. Risk mitigation strategies`;

  return [
    systemContext,
    requirements,
    constraints,
    taskInstruction
  ].join('\n\n');
};

export default {
  VisualAnalysisSchema,
  createVisualAnalysisPrompt,
  createComponentExtractionPrompt,
  createImplementationPlanPrompt
};