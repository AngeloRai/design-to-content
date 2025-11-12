/**
 * Workflow Type Definitions
 * Types for LangGraph workflow state and node functions
 */

import type { ComponentMetadata, ComponentRegistry, ComponentSpec } from './component.js';
import type { DesignToken } from './figma.js';

/**
 * Workflow phase names
 */
export type WorkflowPhase =
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

  // Component tracking
  registry?: ComponentRegistry;
  generatedComponents?: ComponentMetadata[];
  failedComponents?: Record<string, ComponentFailureDetails>;
  validatedComponents?: string[];

  // Validation tracking
  validationResults?: Record<string, ValidationResult>;
  finalCheckPassed?: boolean;
  finalCheckAttempts?: number;

  // Vector search (for reference components)
  vectorSearch?: unknown; // VectorStore type from LangChain

  // Conversation history for agent
  conversationHistory?: unknown[]; // BaseMessage[] from LangChain

  // Completion tracking
  workflowCompleted?: boolean;
  completionTimestamp?: string;
  totalComponentsGenerated?: number;
}

/**
 * Figma analysis result from analyze node
 */
export interface FigmaAnalysisResult {
  components: ComponentSpec[];
  tokens?: DesignToken[];
  categories?: Record<string, number>;
  summary?: string;
  metadata?: {
    nodeId?: string;
    totalComponents: number;
    totalTokens?: number;
    atomicLevels?: string[];
  };
}

/**
 * Component failure details for validation
 */
export interface ComponentFailureDetails {
  name: string;
  type: string;
  path: string;
  errors: string[];
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
  validationResults: Record<string, ValidationResult>;
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
