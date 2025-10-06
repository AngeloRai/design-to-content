#!/usr/bin/env node

/**
 * COMPONENT SCHEMAS
 *
 * Centralized Zod schemas for AI-powered component analysis and generation.
 * All schemas are strict and compatible with OpenAI structured output.
 */

import { z } from "zod";

// ============================================================================
// ANALYSIS SCHEMAS
// ============================================================================

/**
 * Component schema for visual analysis output
 * Focus on what's essential for code generation
 */
export const ComponentSchema = z.object({
  name: z.string().min(1).describe("Component name"),
  atomicLevel: z.enum(["atom", "molecule", "organism"]),
  description: z.string().min(1),

  // Variants - enforce non-empty arrays
  styleVariants: z.array(z.string().min(1)).min(1).describe("Style variants observed (min 1)"),
  sizeVariants: z.array(z.string().min(1)),
  otherVariants: z.array(z.string().min(1)),

  states: z.array(z.string().min(1)).min(1).describe("Interactive states (min 1: 'default')"),

  props: z.array(z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    required: z.boolean(),
  }).strict()),

  // CORE: Visual properties for each variant - this is what matters for code generation
  variantVisualMap: z.array(z.object({
    variantName: z.string().min(1),
    visualProperties: z.object({
      backgroundColor: z.string().min(1),
      textColor: z.string().nullable(),
      borderColor: z.string().nullable(),
      borderWidth: z.string().nullable(),
      borderRadius: z.string().nullable(),
      padding: z.string().nullable(),
      fontSize: z.string().nullable(),
      fontWeight: z.string().nullable(),
      shadow: z.string().nullable(),
    }).strict()
  }).strict()).min(1).describe("Visual properties for each variant (MUST match styleVariants length)"),
}).strict();

/**
 * Full analysis result schema
 */
export const AnalysisSchema = z.object({
  summary: z.string().min(1),
  componentCount: z.number().int().min(1),
  components: z.array(ComponentSchema).min(1),
}).strict();

// ============================================================================
// STRATEGY SCHEMAS
// ============================================================================

/**
 * Strategy decision schema for component planning
 */
export const StrategyDecisionSchema = z.object({
  strategies: z.array(z.object({
    component: z.object({
      name: z.string(),
      type: z.string(),
      props: z.array(z.string()).nullable().describe("Component props"),
      variants: z.array(z.string()).nullable().describe("Component variants")
    }),
    action: z.enum(["create_new", "update_existing", "skip"]),
    targetPath: z.string().nullable(),
    reason: z.string(),
    confidence: z.number().min(0).max(1),
    safetyChecks: z.object({
      usageCount: z.number(),
      riskLevel: z.enum(["low", "medium", "high"]),
      breakingChanges: z.boolean()
    })
  }))
});

// ============================================================================
// GENERATION SCHEMAS
// ============================================================================

/**
 * Generated component schema for code generation output
 */
export const GeneratedComponentSchema = z.object({
  code: z
    .string()
    .describe(
      "Complete TypeScript React component code - this is the actual source code that will be written to a .tsx file"
    ),
  componentName: z.string().describe("Component name (PascalCase)"),
  imports: z
    .array(z.string())
    .describe("List of imports used in the component"),
  exports: z.array(z.string()).describe("Exported names from component"),
  props: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean(),
        description: z.string().nullable(),
      })
    )
    .describe("Component props interface definition"),
  confidence: z.number().min(0).max(1).describe("Generation confidence score"),
});

// ============================================================================
// STORYBOOK SCHEMAS
// ============================================================================

/**
 * Storybook args schema for story generation
 * OpenAI doesn't support z.record() - use array of key-value objects instead
 */
export const StoryArgsSchema = z.object({
  args: z.array(z.object({
    key: z.string().describe("Property name (e.g., 'variant', 'children', 'className')"),
    value: z.union([
      z.string(),
      z.number(),
      z.boolean()
    ]).describe("Property value")
  })).describe("Array of property key-value pairs for story args")
});
