#!/usr/bin/env node

/**
 * ATOM GENERATION PROMPTS
 * Extracted and enhanced from figma-processor atom-generator.js
 * Applied Anthropic prompt engineering best practices
 */

import { z } from 'zod';

// Zod schema for atom generation output
export const AtomGenerationSchema = z.object({
  components: z.array(z.object({
    name: z.string().describe("PascalCase component name"),
    type: z.literal("atom").describe("Component type"),
    description: z.string().describe("Brief component description"),
    code: z.string().describe("Complete TypeScript React component code"),
    props: z.array(z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean(),
      description: z.string().optional()
    })),
    variants: z.array(z.string()).describe("Component variants supported"),
    confidence: z.number().min(0).max(1).describe("Generation confidence")
  }))
});

/**
 * Primary atom generation prompt for GPT-4
 * Generates simple React components (atoms) from visual analysis
 */
export const createAtomGenerationPrompt = (visualAnalysis, figmaData = null, existingLibrary = null) => {
  // Build context about existing components
  let existingComponentsContext = '';
  if (existingLibrary && existingLibrary.atoms && Object.keys(existingLibrary.atoms).length > 0) {
    const existingAtoms = Object.keys(existingLibrary.atoms);
    existingComponentsContext = `
EXISTING ATOMS IN LIBRARY:
${existingAtoms.join(', ')}

IMPORTANT:
- If you see components that match existing atoms, DO NOT regenerate them
- Only generate NEW components that don't exist yet
- If existing components need updates, note them but don't regenerate`;
  }

  const measurementsText = figmaData?.nodeData?.measurements
    ? `
EXACT MEASUREMENTS FROM FIGMA:
${JSON.stringify(figmaData.nodeData.measurements, null, 2)}`
    : '';

  const nodeStructureText = figmaData?.nodeStructure
    ? `
FIGMA NODE STRUCTURE (for icon identification):
${JSON.stringify(figmaData.nodeStructure, null, 2)}`
    : '';

  const TASK_CONTEXT = `You are a senior React component developer. Generate clean, accessible TypeScript React components based on visual analysis.`;

  const TONE_CONTEXT = `Focus on core functionality and visual fidelity. Prioritize clean, maintainable code over complex features.`;

  const INPUT_DATA = `
<visual_analysis>
${visualAnalysis.analysis}
</visual_analysis>

${measurementsText}

${nodeStructureText}

${existingComponentsContext}`;

  const TASK_DESCRIPTION = `REQUIREMENTS:
• **Visual Accuracy**: Generate components that match exactly what you see in the visual analysis
• **Clean Implementation**: Focus on core functionality and visual fidelity
• **Accessibility**: Proper focus states, ARIA attributes, keyboard navigation
• **Modern Tailwind**: Use appropriate utilities, focus-visible, transitions
• **TypeScript**: Complete interfaces with proper prop types
• **Atom Focus**: Generate simple, reusable components (atoms) - buttons, inputs, icons, labels`;

  const EXAMPLES = `COMPONENT QUALITY STANDARDS:
- Use semantic HTML elements
- Include proper TypeScript interfaces
- Add accessibility attributes (ARIA, roles, etc.)
- Use Tailwind CSS classes for styling
- Include hover, focus, and active states
- Export both component and types
- Follow React best practices (functional components, proper hooks usage)`;

  const OUTPUT_FORMATTING = `OUTPUT FORMAT:
Return each component in this exact format:

---COMPONENT-SEPARATOR---
COMPONENT_NAME: [PascalCase name]
COMPONENT_TYPE: atom
COMPONENT_DESCRIPTION: [Brief description]
COMPONENT_CODE:
import { cn } from '@/lib/utils';
import React from 'react';

interface [ComponentName]Props {
  // TypeScript interface
}

export const [ComponentName]: React.FC<[ComponentName]Props> = ({
  // Component implementation
}) => {
  return (
    // JSX implementation with Tailwind classes
  );
};

export default [ComponentName];
---COMPONENT-SEPARATOR---`;

  const IMMEDIATE_TASK = `Generate atomic React components based on the visual analysis provided. Focus only on simple, reusable components that can serve as building blocks.`;

  return `${TASK_CONTEXT}

${TONE_CONTEXT}

${INPUT_DATA}

${TASK_DESCRIPTION}

${EXAMPLES}

${OUTPUT_FORMATTING}

${IMMEDIATE_TASK}`;
};

/**
 * Component parsing function to extract components from AI response
 * Handles both structured and separator-based outputs
 */
export const parseAtomComponents = (aiResponse) => {
  try {
    // Try JSON parsing first (structured output)
    const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Fall back to separator parsing
    const components = [];
    const componentBlocks = aiResponse.split('---COMPONENT-SEPARATOR---').filter(block => block.trim());

    for (const block of componentBlocks) {
      const nameMatch = block.match(/COMPONENT_NAME:\s*(.+)/);
      const typeMatch = block.match(/COMPONENT_TYPE:\s*(.+)/);
      const descMatch = block.match(/COMPONENT_DESCRIPTION:\s*(.+)/);
      const codeMatch = block.match(/COMPONENT_CODE:\s*([\s\S]+?)(?=---COMPONENT-SEPARATOR---|$)/);

      if (nameMatch && codeMatch) {
        components.push({
          name: nameMatch[1].trim(),
          type: typeMatch ? typeMatch[1].trim() : 'atom',
          description: descMatch ? descMatch[1].trim() : '',
          code: codeMatch[1].trim(),
          variants: [], // Extract from code analysis if needed
          confidence: 0.9 // Default confidence
        });
      }
    }

    return { components };
  } catch (error) {
    console.warn('Failed to parse atom components:', error.message);
    return { components: [] };
  }
};

/**
 * Missing components generation prompt
 * Targets specific missing components with focused generation
 */
export const createMissingComponentsPrompt = (visualAnalysis, missingComponentTypes) => {
  const TASK_CONTEXT = `You are generating SPECIFIC React components that were missed in the initial generation.`;

  const INPUT_DATA = `
<visual_analysis>
${visualAnalysis.analysis}
</visual_analysis>

<target_components>
${missingComponentTypes.join(', ')}
</target_components>`;

  const TASK_DESCRIPTION = `REQUIREMENTS:
- Generate ONLY the components listed in target_components: ${missingComponentTypes.join(', ')}
- Focus specifically on form controls and interactive elements
- Use standard naming: TextInput, Textarea, Slider, Select, etc.
- Complete TypeScript interfaces and implementations
- Follow the same patterns used in existing components`;

  const IMMEDIATE_TASK = `Generate the missing components: ${missingComponentTypes.join(', ')}`;

  return `${TASK_CONTEXT}

${INPUT_DATA}

${TASK_DESCRIPTION}

${IMMEDIATE_TASK}`;
};

export default {
  AtomGenerationSchema,
  createAtomGenerationPrompt,
  parseAtomComponents,
  createMissingComponentsPrompt
};