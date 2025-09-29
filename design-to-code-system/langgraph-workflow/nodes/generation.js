#!/usr/bin/env node

/**
 * COMPONENT GENERATION NODES
 * Uses Command-based routing and centralized generation prompts
 */

import { Command } from "@langchain/langgraph";
import { createAtomGenerationPrompt } from "../../prompts/generation/atom-generation.js";
import { createMoleculeGenerationPrompt } from "../../prompts/generation/molecule-generation.js";
import { validateComponent, updatePhase, addError, determineUICategory } from "../schemas/state.js";

/**
 * Mock atom generation function for testing
 */
const mockGenerateAtoms = async (visualAnalysis, existingLibrary = {}) => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const components = [];

  // Generate mock components based on visual analysis
  for (const identified of visualAnalysis.identifiedComponents) {
    if (identified.type === 'button' || identified.type === 'input' || identified.type === 'label') {
      const component = {
        name: identified.type.charAt(0).toUpperCase() + identified.type.slice(1),
        type: "atom",
        description: `A reusable ${identified.type} component`,
        code: `import { cn } from '@/lib/utils';\nimport React from 'react';\n\nexport const ${identified.type.charAt(0).toUpperCase() + identified.type.slice(1)} = () => {\n  return <${identified.type} className="mock-component">${identified.type}</${identified.type}>;\n};`,
        path: `nextjs-app/ui/elements/${identified.type.charAt(0).toUpperCase() + identified.type.slice(1)}.tsx`,
        uiCategory: determineUICategory(identified.type),
        confidence: identified.confidence || 0.85,
        variants: identified.variants || ["default"]
      };

      components.push(component);
    }
  }

  return components;
};

/**
 * Mock molecule generation function for testing
 */
const mockGenerateMolecules = async (visualAnalysis, atomContext = {}) => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const components = [];

  // Look for complex components that could be molecules
  const complexComponents = visualAnalysis.identifiedComponents.filter(c =>
    ['form', 'card', 'modal', 'navigation'].includes(c.type.toLowerCase())
  );

  for (const identified of complexComponents) {
    const component = {
      name: identified.type.charAt(0).toUpperCase() + identified.type.slice(1),
      type: "molecule",
      description: `A composite ${identified.type} component`,
      code: `import React from 'react';\n\nexport const ${identified.type.charAt(0).toUpperCase() + identified.type.slice(1)} = () => {\n  return (\n    <div className="mock-molecule">\n      {/* Composed from atoms */}\n    </div>\n  );\n};`,
      path: `nextjs-app/ui/components/${identified.type.charAt(0).toUpperCase() + identified.type.slice(1)}.tsx`,
      uiCategory: determineUICategory(identified.type),
      confidence: identified.confidence || 0.80,
      atoms_used: ["Button", "Input", "Label"], // Mock atom usage
      variants: identified.variants || ["default"]
    };

    components.push(component);
  }

  return components;
};

/**
 * Atom Generation Node
 * Generates simple, reusable atomic components
 */
export const aiGenerationAtomsNode = async (state) => {
  console.log('⚛️  Atom Generation Node: Creating atomic components...');

  try {
    const updatedState = updatePhase(state, "generation");

    if (!state.visualAnalysis) {
      throw new Error("No visual analysis available for atom generation");
    }

    // For Phase 0 testing, use mock generation
    const generatedAtoms = await mockGenerateAtoms(state.visualAnalysis, state.libraryContext);

    // Validate each component
    const validatedComponents = [];
    for (const component of generatedAtoms) {
      try {
        const validated = validateComponent(component);
        validatedComponents.push(validated);
      } catch (error) {
        console.warn(`⚠️  Skipping invalid component ${component.name}: ${error.message}`);
      }
    }

    console.log(`✅ Generated ${validatedComponents.length} atomic components`);

    return new Command({
      goto: "validation",
      update: {
        ...updatedState,
        generatedComponents: validatedComponents,
        metadata: {
          ...updatedState.metadata,
          tokensUsed: updatedState.metadata.tokensUsed + 500,
          costEstimate: updatedState.metadata.costEstimate + 0.02
        }
      }
    });

  } catch (error) {
    console.error('❌ Atom generation failed:', error.message);
    return new Command({
      goto: "error",
      update: addError(state, error)
    });
  }
};

/**
 * Molecule Generation Node
 * Generates composite components by composing atoms
 */
export const aiGenerationMoleculesNode = async (state) => {
  console.log('🧩 Molecule Generation Node: Creating composite components...');

  try {
    const updatedState = updatePhase(state, "generation");

    if (!state.visualAnalysis) {
      throw new Error("No visual analysis available for molecule generation");
    }

    // For Phase 0 testing, use mock generation
    const generatedMolecules = await mockGenerateMolecules(state.visualAnalysis, state.libraryContext);

    // Validate each component
    const validatedComponents = [];
    for (const component of generatedMolecules) {
      try {
        const validated = validateComponent(component);
        validatedComponents.push(validated);
      } catch (error) {
        console.warn(`⚠️  Skipping invalid component ${component.name}: ${error.message}`);
      }
    }

    console.log(`✅ Generated ${validatedComponents.length} molecule components`);

    return new Command({
      goto: "validation",
      update: {
        ...updatedState,
        generatedComponents: validatedComponents,
        metadata: {
          ...updatedState.metadata,
          tokensUsed: updatedState.metadata.tokensUsed + 800,
          costEstimate: updatedState.metadata.costEstimate + 0.03
        }
      }
    });

  } catch (error) {
    console.error('❌ Molecule generation failed:', error.message);
    return new Command({
      goto: "error",
      update: addError(state, error)
    });
  }
};

/**
 * Mixed Generation Node
 * Generates both atoms and molecules in sequence
 */
export const aiGenerationMixedNode = async (state) => {
  console.log('🔄 Mixed Generation Node: Creating atoms and molecules...');

  try {
    const updatedState = updatePhase(state, "generation");

    if (!state.visualAnalysis || !state.routingDecision) {
      throw new Error("Missing visual analysis or routing decision for mixed generation");
    }

    const allComponents = [];

    // Generate atoms first (based on priority order)
    if (state.routingDecision.priority_order.includes("atom")) {
      console.log('  📦 Generating atoms first...');
      const atoms = await mockGenerateAtoms(state.visualAnalysis, state.libraryContext);
      allComponents.push(...atoms);
    }

    // Then generate molecules
    if (state.routingDecision.priority_order.includes("molecule")) {
      console.log('  🧩 Generating molecules...');
      // Pass generated atoms as context for molecule generation
      const atomContext = allComponents.reduce((acc, comp) => {
        if (comp.type === 'atom') acc[comp.name] = comp;
        return acc;
      }, {});

      const molecules = await mockGenerateMolecules(state.visualAnalysis, atomContext);
      allComponents.push(...molecules);
    }

    // Validate all components
    const validatedComponents = [];
    for (const component of allComponents) {
      try {
        const validated = validateComponent(component);
        validatedComponents.push(validated);
      } catch (error) {
        console.warn(`⚠️  Skipping invalid component ${component.name}: ${error.message}`);
      }
    }

    console.log(`✅ Mixed generation complete: ${validatedComponents.length} components`);

    return new Command({
      goto: "validation",
      update: {
        ...updatedState,
        generatedComponents: validatedComponents,
        metadata: {
          ...updatedState.metadata,
          tokensUsed: updatedState.metadata.tokensUsed + 1200,
          costEstimate: updatedState.metadata.costEstimate + 0.05
        }
      }
    });

  } catch (error) {
    console.error('❌ Mixed generation failed:', error.message);
    return new Command({
      goto: "error",
      update: addError(state, error)
    });
  }
};

export default {
  aiGenerationAtomsNode,
  aiGenerationMoleculesNode,
  aiGenerationMixedNode
};