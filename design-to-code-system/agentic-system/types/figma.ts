/**
 * Figma Type Definitions
 * Types for Figma API, MCP bridge, and design token extraction
 */

/**
 * Figma URL parsing result
 */
export interface FigmaUrlParts {
  fileId: string;
  nodeId: string | null;
}

/**
 * Atomic level node configuration
 */
export interface AtomicLevelNode {
  nodeId: string;
  level: 'atoms' | 'molecules' | 'organisms';
  order: number;
}

/**
 * Figma node metadata from MCP
 */
export interface FigmaNodeMetadata {
  id: string;
  name: string;
  type: string;
  children?: FigmaNodeMetadata[];
  visible?: boolean;
  locked?: boolean;
}

/**
 * Figma variable definition
 */
export interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: string;
  valuesByMode: Record<string, unknown>;
  description?: string;
}

/**
 * Figma code generation result from MCP
 */
export interface FigmaCodeResult {
  language: string;
  code: string;
  title?: string;
}

/**
 * Design token item
 */
export interface DesignToken {
  name: string;
  value: string;
  category: string;
  description?: string;
  source?: 'figma' | 'inferred' | 'manual';
}

/**
 * Design token extraction result
 */
export interface TokenExtractionResult {
  tokens: DesignToken[];
  categories: Record<string, number>;
  totalTokens: number;
}

/**
 * MCP extraction options
 */
export interface McpExtractionOptions {
  nodeId?: string;
  globalCssPath?: string | null;
  outputPath?: string | null;
  isFirstNode?: boolean;
  existingTokens?: DesignToken[];
  atomicLevel?: string;
}

/**
 * MCP extraction result
 */
export interface McpExtractionResult {
  tokens: DesignToken[];
  categories: Record<string, number>;
  components: Array<{
    name: string;
    type: string;
    description: string;
    visualDescription: string;
    variants: string[] | null;
    propsRequired: string[];
    propsOptional: string[];
    behavior: string;
    figmaCode: string | null;
    atomicLevel?: string;
  }>;
  metadata: {
    nodeId: string;
    totalComponents: number;
    totalTokens: number;
  };
  figmaData?: {
    variables?: unknown;
    metadata?: FigmaNodeMetadata;
    code?: FigmaCodeResult;
    screenshot?: string;
  };
}

/**
 * Globals.css update result
 */
export interface GlobalsCssUpdateResult {
  success: boolean;
  tokensAdded: number;
  totalTokens: number;
  filePath: string;
  error?: string;
}
