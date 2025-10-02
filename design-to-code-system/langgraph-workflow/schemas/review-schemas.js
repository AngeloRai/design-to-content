#!/usr/bin/env node

/**
 * REVIEW SCHEMAS
 * Zod schemas for code review and visual inspection results
 */

import { z } from "zod";

/**
 * Code Review Result Schema
 * Returned by unified code reviewer
 */
export const CodeReviewSchema = z.object({
  scores: z.object({
    propsDesign: z.number().min(0).max(10).describe("Props API design score"),
    importsAndLibrary: z.number().min(0).max(10).describe("Imports and library usage score"),
    typescript: z.number().min(0).max(10).describe("TypeScript correctness score"),
    tailwind: z.number().min(0).max(10).describe("Tailwind usage score"),
    accessibility: z.number().min(0).max(10).describe("Accessibility score")
  }),
  averageScore: z.number().describe("Average of all scores"),
  passed: z.boolean().describe("True if averageScore >= 8"),
  criticalIssues: z.array(z.string()).describe("Issues that MUST be fixed"),
  minorIssues: z.array(z.string()).describe("Suggestions for improvement"),
  feedback: z.string().describe("Detailed feedback for next iteration"),
  confidenceReady: z.boolean().describe("Ready for visual inspection if passed")
});

/**
 * Visual Inspection Result Schema
 * Returned by visual inspector (Playwright + GPT-4 Vision)
 */
export const VisualInspectionSchema = z.object({
  pixelPerfect: z.boolean().describe("True if 95%+ visual match"),
  confidenceScore: z.number().min(0).max(1).describe("Visual similarity score 0-1"),
  visualDifferences: z.array(z.object({
    aspect: z.string().describe("What aspect differs (e.g., 'button padding')"),
    figma: z.string().describe("Value in Figma design"),
    rendered: z.string().describe("Value in rendered component"),
    severity: z.enum(["high", "medium", "low"]).describe("How critical this difference is")
  })).describe("List of visual differences found"),
  tailwindFixes: z.array(z.string()).describe("Specific Tailwind class changes needed"),
  feedback: z.string().describe("Detailed visual feedback for next iteration")
});

/**
 * Component Generation Result Schema
 * Returned by code generator
 */
export const GeneratedCodeSchema = z.object({
  code: z.string().describe("Complete TypeScript React component code")
});

export default {
  CodeReviewSchema,
  VisualInspectionSchema,
  GeneratedCodeSchema
};
