#!/usr/bin/env node

/**
 * MODERN LANGGRAPH STATE SCHEMA
 * Uses Annotation.Root for clean state definition (LangGraph 0.6+ pattern)
 * Integrates with Zod for data validation
 */

import { Annotation } from "@langchain/langgraph";
import { z } from "zod";

// Zod schemas for data validation (separate from workflow state)
export const AnalysisDataSchema = z.object({
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

export const ComponentSchema = z.object({
  name: z.string().describe("PascalCase component name"),
  type: z.enum(["atom", "molecule", "organism"]).describe("Component classification"),
  description: z.string().describe("Brief component description"),
  code: z.string().describe("Complete TypeScript React component code"),
  path: z.string().describe("File path where component should be saved"),
  uiCategory: z.enum(["elements", "components", "modules"]).describe("UI directory category"),
  props: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    description: z.string().nullable()
  })).nullable(),
  variants: z.array(z.string()).describe("Component variants supported").nullable(),
  confidence: z.number().min(0).max(1).describe("Generation confidence"),
  atoms_used: z.array(z.string()).describe("List of atoms used in molecule").nullable()
});

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

export const ValidationResultSchema = z.object({
  component: z.string().describe("Component name being validated"),
  validationType: z.enum(["visual", "accessibility", "typescript", "overlap"]),
  success: z.boolean(),
  score: z.number().min(0).max(10).nullable(),
  issues: z.array(z.string()),
  recommendations: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});

// LangGraph State Schema using Annotation.Root pattern
export const StateAnnotation = Annotation.Root({
  // Input data
  input: Annotation({
    default: () => "",
    description: "User input or Figma URL"
  }),

  figmaData: Annotation({
    default: () => null,
    description: "Raw Figma API data"
  }),

  // Analysis phase
  visualAnalysis: Annotation({
    default: () => null,
    description: "Visual analysis result conforming to AnalysisDataSchema"
  }),

  // Routing phase
  routingDecision: Annotation({
    default: () => null,
    description: "AI routing decision conforming to RoutingDecisionSchema"
  }),

  // Strategy phase
  componentStrategy: Annotation({
    default: () => [],
    description: "Strategy decisions for each component (create/update/skip)"
  }),

  libraryContext: Annotation({
    default: () => ({
      elements: [],
      components: [],
      modules: [],
      icons: []
    }),
    description: "Existing component library context (scanned from file system)"
  }),

  importMap: Annotation({
    default: () => ({}),
    description: "Map of component export names to their import paths (e.g., ResponsiveImage -> @/ui/elements/Image)"
  }),

  // Generation phase
  generatedComponents: Annotation({
    default: () => [],
    reducer: (existing, updates) => {
      // Merge components, avoiding duplicates by name
      const existingNames = existing.map(c => c.name);
      const newComponents = Array.isArray(updates) ? updates : [updates];
      const filtered = newComponents.filter(c => c && !existingNames.includes(c.name));
      return [...existing, ...filtered];
    },
    description: "Generated components conforming to ComponentSchema"
  }),

  // Validation phase
  validationResults: Annotation({
    default: () => [],
    reducer: (existing, updates) => [...existing, ...(Array.isArray(updates) ? updates : [updates])],
    description: "Validation results conforming to ValidationResultSchema"
  }),

  // Output configuration
  outputPath: Annotation({
    default: () => "nextjs-app/ui",
    description: "Target Next.js app UI directory"
  }),

  // Workflow state
  currentPhase: Annotation({
    default: () => "init",
    description: "Current workflow phase: init|analysis|routing|generation|validation|complete"
  }),

  status: Annotation({
    default: () => "pending",
    description: "Overall workflow status"
  }),

  // Error handling
  errors: Annotation({
    default: () => [],
    reducer: (existing, updates) => [...existing, ...(Array.isArray(updates) ? updates : [updates])],
    description: "Accumulated errors during workflow"
  }),

  // Metadata
  metadata: Annotation({
    default: () => ({
      startTime: new Date().toISOString(),
      tokensUsed: 0,
      costEstimate: 0
    }),
    description: "Workflow execution metadata"
  })
});

// Helper functions for state validation
export const validateAnalysisData = (data) => {
  try {
    return AnalysisDataSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid analysis data: ${error.message}`);
  }
};

export const validateComponent = (component) => {
  try {
    return ComponentSchema.parse(component);
  } catch (error) {
    throw new Error(`Invalid component data: ${error.message}`);
  }
};

export const validateRoutingDecision = (decision) => {
  try {
    return RoutingDecisionSchema.parse(decision);
  } catch (error) {
    throw new Error(`Invalid routing decision: ${error.message}`);
  }
};

export const validateValidationResult = (result) => {
  try {
    return ValidationResultSchema.parse(result);
  } catch (error) {
    throw new Error(`Invalid validation result: ${error.message}`);
  }
};

// State utilities
export const createInitialState = (input = "") => {
  return {
    input,
    figmaData: null,
    visualAnalysis: null,
    routingDecision: null,
    libraryContext: {},
    generatedComponents: [],
    validationResults: [],
    outputPath: "nextjs-app/ui",
    currentPhase: "init",
    status: "pending",
    errors: [],
    metadata: {
      startTime: new Date().toISOString(),
      tokensUsed: 0,
      costEstimate: 0
    }
  };
};

export const updatePhase = (state, phase, additionalData = {}) => {
  return {
    ...state,
    currentPhase: phase,
    ...additionalData,
    metadata: {
      ...state.metadata,
      [`${phase}Time`]: new Date().toISOString()
    }
  };
};

export const addError = (state, error) => {
  const errorEntry = {
    message: error.message || error,
    phase: state.currentPhase,
    timestamp: new Date().toISOString()
  };

  return {
    ...state,
    errors: [...state.errors, errorEntry],
    status: "error"
  };
};

/**
 * Determine UI category based on component analysis rather than hardcoded lists
 * Uses heuristics to categorize components dynamically
 */
export const determineUICategory = (componentType, analysisContext = {}) => {
  const type = componentType.toLowerCase();

  // Use analysis context if available (e.g., complexity, composition)
  if (analysisContext.complexity) {
    if (analysisContext.complexity <= 3) return 'elements';
    if (analysisContext.complexity >= 7) return 'modules';
  }

  // Simple heuristics for basic categorization
  if (type.length <= 6 || type.endsWith('field') || type.endsWith('button')) {
    return 'elements';
  }

  if (type.includes('page') || type.includes('layout') || type.includes('header') || type.includes('footer')) {
    return 'modules';
  }

  return 'components'; // default
};

export default {
  StateAnnotation,
  AnalysisDataSchema,
  ComponentSchema,
  RoutingDecisionSchema,
  ValidationResultSchema,
  validateAnalysisData,
  validateComponent,
  validateRoutingDecision,
  validateValidationResult,
  createInitialState,
  updatePhase,
  addError,
  determineUICategory
};