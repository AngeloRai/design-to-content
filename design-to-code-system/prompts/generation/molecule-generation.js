#!/usr/bin/env node

/**
 * MOLECULE GENERATION PROMPTS
 * Extracted and enhanced from figma-processor molecule-generator.js
 * Applied Anthropic prompt engineering best practices
 */

import { z } from 'zod';

// Zod schema for molecule generation output
export const MoleculeGenerationSchema = z.object({
  components: z.array(z.object({
    name: z.string().describe("PascalCase component name"),
    type: z.literal("molecule").describe("Component type"),
    description: z.string().describe("Brief component description"),
    code: z.string().describe("Complete TypeScript React component code"),
    atoms_used: z.array(z.string()).describe("List of atoms composed in this molecule"),
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
 * Primary molecule generation prompt for GPT-4
 * Creates composite components by composing existing atoms
 */
export const createMoleculeGenerationPrompt = (visualAnalysis, atomContext = null) => {
  const atomContextForAI = atomContext ? formatAIContextForAI(atomContext) :
    'No atom context provided. Generate molecules using standard HTML elements.';

  const TASK_CONTEXT = `You are a senior React developer creating molecule components by composing existing atoms.`;

  const TONE_CONTEXT = `Focus on composition and proper atom usage. Create meaningful combinations that serve real UI purposes.`;

  const INPUT_DATA = `
<atom_library>
${atomContextForAI}
</atom_library>

<visual_analysis>
${visualAnalysis}
</visual_analysis>`;

  const TASK_DESCRIPTION = `REQUIREMENTS:
• **Visual Accuracy**: Create component that matches exactly what you see in the visual analysis
• **Atom Composition**: Use ONLY the available atoms listed above - no custom elements
• **Clean Implementation**: Focus on composition and prop management
• **Accessibility**: Maintain atom accessibility features through proper prop passing
• **TypeScript**: Complete interfaces with proper prop types
• **Molecule Focus**: Create composite components that combine 2-4 atoms meaningfully`;

  const EXAMPLES = `COMPONENT QUALITY STANDARDS:

**Molecule Architecture:**
- Compose existing atoms using their documented interfaces
- Pass through relevant props to atoms
- Add molecule-level logic for coordination
- Maintain proper TypeScript interfaces
- Include comprehensive prop documentation

**Composition Patterns:**
- Form groups (Label + Input + ErrorMessage)
- Card components (Image + Text + Button)
- Navigation items (Icon + Text + Badge)
- Search components (Input + Button + Icon)`;

  const OUTPUT_FORMATTING = `OUTPUT FORMAT:
Return each component in this exact format:

---COMPONENT-SEPARATOR---
COMPONENT_NAME: [PascalCase name]
COMPONENT_TYPE: molecule
COMPONENT_DESCRIPTION: [Brief description]
ATOMS_USED: [Atom1, Atom2, Atom3]
COMPONENT_CODE:
import React from 'react';
import { Atom1, Atom2 } from '../elements';

interface [ComponentName]Props {
  // TypeScript interface
}

export const [ComponentName]: React.FC<[ComponentName]Props> = ({
  // Component implementation with atom composition
}) => {
  return (
    <div>
      {/* Compose atoms here */}
    </div>
  );
};

export default [ComponentName];
---COMPONENT-SEPARATOR---`;

  const IMMEDIATE_TASK = `Generate molecule React components by composing the available atoms. Focus on meaningful combinations that serve real UI purposes.`;

  return `${TASK_CONTEXT}

${TONE_CONTEXT}

${INPUT_DATA}

${TASK_DESCRIPTION}

${EXAMPLES}

${OUTPUT_FORMATTING}

${IMMEDIATE_TASK}`;
};

/**
 * Component name extraction prompt with AI analysis
 * Systematically analyzes designs to extract optimal molecule components
 */
export const createComponentExtractionPrompt = (visualAnalysis) => {
  const analysis = typeof visualAnalysis === 'string' ? visualAnalysis : visualAnalysis.analysis;

  const TASK_CONTEXT = `You are a senior React architect analyzing a design system to extract optimal molecule components. Use systematic analysis to make informed decisions about component structure.`;

  const INPUT_DATA = `
<visual_analysis>
${analysis}
</visual_analysis>`;

  const TASK_DESCRIPTION = `SYSTEMATIC ANALYSIS PROCESS:

## PHASE 1: COMPONENT GROUP IDENTIFICATION
First, identify families of similar components from the visual analysis.
Look for components that share visual patterns, purposes, or contexts.

## PHASE 2: VARIANT ANALYSIS FRAMEWORK
For each component family, analyze the variants using these criteria:

**Layout Structure Analysis:**
- Do variants have fundamentally different layouts? (e.g., horizontal vs vertical, different content blocks)
- Are the structural differences significant or just styling variations?

**Functional Complexity Analysis:**
- Do variants serve completely different use cases?
- Would variants require very different props/interfaces?

**Reusability Assessment:**
- Are these components likely to be reused across the application?
- Do they represent common UI patterns?`;

  const OUTPUT_FORMATTING = `DECISION FRAMEWORK:
Create SEPARATE components when:
- Variants have fundamentally different layouts or structures
- Variants serve completely different functional purposes
- Variants would require significantly different prop interfaces
- Components serve different contexts (e.g., navigation vs forms)

Use SINGLE component with variants when:
- Variants share the same basic structure with styling differences
- Variants serve the same functional purpose with different appearances
- Variants can be managed through simple prop variations (size, color, etc.)

RETURN: JSON array of component names to generate:
["ComponentName1", "ComponentName2", ...]

Focus on practical, reusable molecules that compose 2-4 atoms meaningfully.`;

  const IMMEDIATE_TASK = `Analyze the visual content and extract the optimal set of molecule components to generate.`;

  return `${TASK_CONTEXT}

${INPUT_DATA}

${TASK_DESCRIPTION}

${OUTPUT_FORMATTING}

${IMMEDIATE_TASK}`;
};

/**
 * Molecule update evaluation prompt
 * Evaluates whether to update existing molecules with new versions
 */
export const createMoleculeUpdatePrompt = (existingComponent, newComponent, dependencyContext = '') => {
  const TASK_CONTEXT = `You are a senior React developer evaluating whether to update an existing molecule component.`;

  const INPUT_DATA = `
<existing_molecule>
${existingComponent.name}
Current implementation:
\`\`\`typescript
${existingComponent.code}
\`\`\`
</existing_molecule>

<proposed_version>
\`\`\`typescript
${newComponent.code}
\`\`\`
</proposed_version>

${dependencyContext}`;

  const TASK_DESCRIPTION = `MOLECULE-SPECIFIC EVALUATION CRITERIA:
1. **Atom Composition**: Better atom selection or composition patterns?
2. **Interface Evolution**: Improved props interface without breaking changes?
3. **Code Quality**: Cleaner implementation or better maintainability?
4. **Functionality**: Additional features or better user experience?
5. **Dependencies**: Impact on organisms that depend on this molecule?`;

  const OUTPUT_FORMATTING = `RESPOND WITH:
{
  "shouldUpdate": true/false,
  "reason": "Specific reason for the decision",
  "riskAssessment": "low/medium/high",
  "requiredTests": ["test1", "test2"],
  "migrationNotes": "Steps for safe migration"
}`;

  const IMMEDIATE_TASK = `Evaluate whether to update this molecule component. Consider both improvements and potential breaking changes.`;

  return `${TASK_CONTEXT}

${INPUT_DATA}

${TASK_DESCRIPTION}

${OUTPUT_FORMATTING}

${IMMEDIATE_TASK}`;
};

/**
 * Format atom context for AI consumption
 * Converts atom library data into prompt-friendly format
 */
export const formatAIContextForAI = (atomContext) => {
  if (!atomContext || Object.keys(atomContext).length === 0) {
    return 'No atoms available. Use standard HTML elements.';
  }

  let formattedContext = 'AVAILABLE ATOMS FOR COMPOSITION:\n\n';

  Object.entries(atomContext).forEach(([atomName, atomData]) => {
    formattedContext += `**${atomName}**\n`;
    formattedContext += `Description: ${atomData.description || 'No description'}\n`;

    if (atomData.interface) {
      formattedContext += `Props: ${atomData.interface}\n`;
    }

    if (atomData.usage) {
      formattedContext += `Usage: ${atomData.usage}\n`;
    }

    formattedContext += '\n';
  });

  return formattedContext;
};

/**
 * Parse molecule components from AI response
 * Handles both structured and separator-based outputs
 */
export const parseMoleculeComponents = (aiResponse) => {
  try {
    // Try JSON parsing first
    const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Fall back to separator parsing
    const components = [];
    const sections = aiResponse.split('---COMPONENT-SEPARATOR---').filter(section => section.trim());

    sections.forEach(section => {
      const lines = section.trim().split('\n');
      let name = '';
      let description = '';
      let atoms_used = [];
      let code = '';

      let inCodeBlock = false;
      const codeLines = [];

      lines.forEach(line => {
        if (line.startsWith('COMPONENT_NAME:')) {
          name = line.replace('COMPONENT_NAME:', '').trim();
        } else if (line.startsWith('COMPONENT_DESCRIPTION:')) {
          description = line.replace('COMPONENT_DESCRIPTION:', '').trim();
        } else if (line.startsWith('ATOMS_USED:')) {
          const atomsStr = line.replace('ATOMS_USED:', '').trim();
          atoms_used = atomsStr.split(',').map(a => a.trim()).filter(a => a);
        } else if (line.startsWith('COMPONENT_CODE:')) {
          inCodeBlock = true;
        } else if (inCodeBlock) {
          codeLines.push(line);
        }
      });

      if (name && codeLines.length > 0) {
        components.push({
          name,
          type: 'molecule',
          description,
          atoms_used,
          code: codeLines.join('\n'),
          variants: [],
          confidence: 0.85
        });
      }
    });

    return { components };
  } catch (error) {
    console.warn('Failed to parse molecule components:', error.message);
    return { components: [] };
  }
};

export default {
  MoleculeGenerationSchema,
  createMoleculeGenerationPrompt,
  createComponentExtractionPrompt,
  createMoleculeUpdatePrompt,
  formatAIContextForAI,
  parseMoleculeComponents
};