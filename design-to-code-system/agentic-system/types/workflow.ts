/**
 * Workflow Type Definitions
 * Types for LangGraph workflow state and node functions
 */

import type { ComponentMetadata, ComponentRegistry, ComponentSpec } from './component.js';
import type { DesignToken } from './figma.js';
import type { FigmaBridge } from '../utils/mcp-figma-bridge.ts';

/**
 * Workflow phase names
 */
export type WorkflowPhase =
  | 'init'
  | 'analyze'
  | 'setup'
  | 'generate'
  | 'generate_stories'
  | 'validate'
  | 'typescript_fix'
  | 'quality_review'
  | 'final_check'
  | 'decide_next'
  | 'finalize'
  | 'end';

/**
 * Main workflow state
 */
export interface WorkflowState {
  // Core input
  figmaUrl?: string;
  outputDir: string;

  // Phase tracking
  currentPhase: WorkflowPhase;

  // Analysis results
  figmaAnalysis?: FigmaAnalysisResult;
  componentsIdentified?: number;

  // Component tracking
  registry?: ComponentRegistry | null;
  generatedComponents?: ComponentMetadata[] | number;
  failedComponents?: Record<string, ComponentFailureDetails>;
  validatedComponents?: string[];

  // Validation tracking
  validationResults?: Record<string, unknown>; // Can be ValidationResult or QualityReviewResult
  finalCheckPassed?: boolean;
  finalCheckAttempts?: number;

  // Reference components and vector search
  referenceComponents?: unknown[];
  vectorSearch?: unknown; // VectorStore type from LangChain

  // Conversation history for agent
  conversationHistory?: unknown[]; // BaseMessage[] from LangChain
  iterations?: number;

  // MCP bridge instance and paths
  mcpBridge?: FigmaBridge;
  globalCssPath?: string | null;

  // Story generation
  storiesGenerated?: boolean;
  storyResults?: unknown;

  // Error tracking
  errors?: Array<{ phase: string; error: string }>;
  success?: boolean;

  // Completion tracking
  workflowCompleted?: boolean;
  completionTimestamp?: string;
  totalComponentsGenerated?: number;
  startTime?: string;
  endTime?: string | null;
}

/**
 * Figma analysis result from analyze node
 */
export interface FigmaAnalysisResult {
  components: ComponentSpec[];
  tokens: DesignToken[];
  categories?: Record<string, number>;
  tokenCategories?: Record<string, number>;
  summary?: string;
  metadata?: {
    nodeId?: string;
    totalComponents: number;
    totalTokens?: number;
    atomicLevels?: string[];
  };
  analysis: {
    totalComponents: number;
    sections: Array<{
      name: string;
      componentCount: number;
    }>;
  };
  processLog?: Array<{
    level: string;
    components: number;
    tokensAdded: number;
    totalTokens: number;
  }>;
}

/**
 * Component failure details for validation
 */
export interface ComponentFailureDetails {
  name?: string;
  type?: string;
  componentType?: string;
  path: string;
  errors: string | string[];
  issues?: ValidationIssue[];
  attemptedFix?: boolean;
}

/**
 * Validation issue (ESLint/TypeScript)
 */
export interface ValidationIssue {
  line: number;
  column?: number;
  message: string;
  rule?: string;
  severity?: 'error' | 'warning';
}

/**
 * Validation result for a component
 */
export interface ValidationResult {
  valid: boolean;
  path?: string;
  errors?: string;
  errorCount?: number;
  warningCount?: number;
  issues?: ValidationIssue[];
  fullOutput?: string;
  success?: boolean;
  iterations?: number;
}

/**
 * Validation state (for validation subgraph)
 */
export interface ValidationState extends WorkflowState {
  failedComponents: Record<string, ComponentFailureDetails>;
  validationResults: Record<string, unknown>; // Can be ValidationResult or QualityReviewResult
  finalCheckPassed: boolean;
  finalCheckAttempts: number;
  validatedComponents: string[];
}

/**
 * Node function result type
 */
export interface NodeResult extends Partial<WorkflowState> {
  currentPhase?: WorkflowPhase;
}

/**
 * Route decision result
 */
export type RouteDecision = WorkflowPhase | 'exit';
