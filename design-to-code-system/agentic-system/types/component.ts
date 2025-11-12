/**
 * Component Type Definitions
 * Shared types for component metadata, specs, and registry
 */

/**
 * Atomic design pattern levels
 */
export type AtomicLevel = 'elements' | 'components' | 'modules' | 'icons';

/**
 * Component type (legacy naming)
 */
export type ComponentType = 'atoms' | 'molecules' | 'organisms' | AtomicLevel;

/**
 * Component metadata from filesystem
 */
export interface ComponentMetadata {
  name: string;
  type: ComponentType;
  path: string;
  relativePath?: string;
  description?: string;
  props?: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  dependencies?: string[];
  hasStories?: boolean;
  hasTests?: boolean;
}

/**
 * Component specification from Figma analysis
 */
export interface ComponentSpec {
  name: string;
  type: string;
  description: string;
  atomicLevel?: 'atoms' | 'molecules' | 'organisms';
  visualDescription: string;
  variants: string[] | null;
  propsRequired: string[];
  propsOptional: string[];
  behavior: string;
  figmaCode?: string | null;
  figmaNodeId?: string;
  screenshot?: string;
}

/**
 * Component registry structure
 */
export interface ComponentRegistry {
  components: {
    [key in ComponentType]?: ComponentMetadata[];
  };
  totalCount: number;
  lastUpdated: string;
}

/**
 * Component generation result
 */
export interface ComponentGenerationResult {
  name: string;
  type: ComponentType;
  path: string;
  success: boolean;
  timestamp?: string;
  error?: string;
}

/**
 * Story generation result
 */
export interface StoryGenerationResult {
  written: boolean;
  path: string;
  totalStories?: number;
  reason?: string;
  success?: boolean;
  error?: string;
}
