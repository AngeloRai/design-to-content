/**
 * Tool Type Definitions
 * Types for agent tools and tool executor
 */

import type { ComponentMetadata, ComponentType } from './component.js';
import type { ValidationIssue } from './workflow.js';

/**
 * Tool execution result (generic)
 */
export interface ToolResult {
  success?: boolean;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

/**
 * write_component tool arguments
 */
export interface WriteComponentArgs {
  name: string;
  type: ComponentType;
  code: string;
}

/**
 * write_component tool result
 */
export interface WriteComponentResult extends ToolResult {
  name: string;
  type: ComponentType;
  path?: string;
  timestamp?: string;
}

/**
 * read_file tool arguments
 */
export interface ReadFileArgs {
  file_path: string;
}

/**
 * read_file tool result
 */
export interface ReadFileResult extends ToolResult {
  path: string;
  resolved_path?: string;
  content?: string;
  lines?: string[];
}

/**
 * validate_typescript tool arguments
 */
export interface ValidateTypeScriptArgs {
  file_path: string;
}

/**
 * validate_typescript tool result
 */
export interface ValidateTypeScriptResult extends ToolResult {
  path: string;
  valid: boolean;
  errors?: string;
  errorCount?: number;
  fullOutput?: string;
  output?: string;
  note?: string;
  summary?: string;
}

/**
 * check_code_quality tool arguments
 */
export interface CheckCodeQualityArgs {
  file_path: string;
}

/**
 * check_code_quality tool result
 */
export interface CheckCodeQualityResult extends ToolResult {
  path: string;
  valid: boolean;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
}

/**
 * list_directory tool arguments
 */
export interface ListDirectoryArgs {
  directory_path: string;
  recursive?: boolean;
}

/**
 * list_directory tool result
 */
export interface ListDirectoryResult extends ToolResult {
  path: string;
  resolved_path?: string;
  files?: string[];
  items?: Array<{
    name: string;
    type: 'file' | 'directory';
    path: string;
  }>;
  count?: number;
  recursive?: boolean;
}

/**
 * find_similar_components tool arguments
 */
export interface FindSimilarComponentsArgs {
  query: string;
  k?: number;
}

/**
 * find_similar_components tool result
 */
export interface FindSimilarComponentsResult extends ToolResult {
  components: ComponentMetadata[];
  count: number;
  query: string;
}

/**
 * search_help tool arguments
 */
export interface SearchHelpArgs {
  query: string;
  context?: {
    previousAttempts?: string[];
    errorMessage?: string;
    componentType?: string;
  };
}

/**
 * search_help tool result
 */
export interface SearchHelpResult extends ToolResult {
  help: string;
  suggestions?: string[];
}

/**
 * Tool definition for LangChain
 */
export interface ToolDefinition {
  name: string;
  description: string;
  schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

/**
 * Tool executor interface
 */
export interface ToolExecutor {
  execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult>;
}
