/**
 * Environment Configuration
 * Centralized configuration for all environment variables
 *
 * Import this instead of accessing process.env directly:
 * import { env } from './config/env.config.js';
 *
 * Benefits:
 * - Type safety and validation
 * - Single source of truth
 * - Better IDE autocomplete
 * - Easier to test and mock
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from design-to-code-system directory (two levels up from config/)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

/**
 * Parse boolean environment variable
 */
const parseBoolean = (value: string | undefined, defaultValue = false): boolean => {
  if (value === undefined || value === null || value === '') return defaultValue;
  return value.toLowerCase() === 'true';
};

/**
 * Parse number environment variable
 */
const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Environment configuration type
 */
export interface EnvConfig {
  openai: {
    apiKey: string | undefined;
  };
  figma: {
    accessToken: string | undefined;
    fileId: string | undefined;
    url: string | undefined;
    useDesktop: boolean;
    atomicLevels: {
      atoms: string | undefined;
      molecules: string | undefined;
      organisms: string | undefined;
    };
  };
  langsmith: {
    tracing: boolean;
    tracingV2: boolean;
    apiKey: string | undefined;
    project: string;
    workspaceId: string | undefined;
    flushDelayMs: number;
  };
  otel: {
    logsEndpoint: string | undefined;
    headers: string | undefined;
  };
  models: {
    default: string;
    fallback: string;
    available: string[];
  };
  modelSelection: {
    simpleThreshold: number;
    complexThreshold: number;
    preferSpeed: boolean;
    preferQuality: boolean;
  };
  cost: {
    maxSessionCost: number;
    maxTaskCost: number;
    enableTracking: boolean;
    enableOptimization: boolean;
  };
  output: {
    dir: string;
    globalCssPath: string;
  };
  checkpointing: {
    enabled: boolean;
  };
  debug: boolean;
  logLevel: string;
  enablePerformanceMonitoring: boolean;
  nodeEnv: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

/**
 * Environment configuration object
 * All environment variables are accessed through this object
 */
export const env: EnvConfig = {
  // =============================================================================
  // API Keys & Authentication
  // =============================================================================

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },

  figma: {
    accessToken: process.env.FIGMA_ACCESS_TOKEN,
    fileId: process.env.FIGMA_FILE_ID,
    url: process.env.FIGMA_URL,
    useDesktop: parseBoolean(process.env.USE_DESKTOP),
    // Atomic Design Pattern URLs for multi-node processing
    atomicLevels: {
      atoms: process.env.FIGMA_ATOMS,
      molecules: process.env.FIGMA_MOLECULES,
      organisms: process.env.FIGMA_ORGANISMS,
    },
  },

  // =============================================================================
  // LangSmith Configuration
  // =============================================================================

  langsmith: {
    tracing: parseBoolean(process.env.LANGSMITH_TRACING),
    tracingV2: parseBoolean(process.env.LANGCHAIN_TRACING_V2),
    apiKey: process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY,
    project: process.env.LANGSMITH_PROJECT || process.env.LANGCHAIN_PROJECT || 'design-to-code-system',
    workspaceId: process.env.LANGSMITH_WORKSPACE_ID,
    flushDelayMs: parseNumber(process.env.LANGSMITH_FLUSH_DELAY_MS, 3000),
  },

  // =============================================================================
  // OpenTelemetry Configuration
  // =============================================================================

  otel: {
    logsEndpoint: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
    headers: process.env.OTEL_EXPORTER_OTLP_HEADERS,
  },

  // =============================================================================
  // Model Configuration
  // =============================================================================

  models: {
    default: process.env.DEFAULT_MODEL || 'gpt-4o',
    fallback: process.env.FALLBACK_MODEL || 'gpt-4o-mini',
    available: process.env.AVAILABLE_MODELS?.split(',') || ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
  },

  // =============================================================================
  // Model Selection Thresholds
  // =============================================================================

  modelSelection: {
    simpleThreshold: parseNumber(process.env.SIMPLE_THRESHOLD || process.env.MODEL_SELECTION_SIMPLE_THRESHOLD, 3),
    complexThreshold: parseNumber(process.env.COMPLEX_THRESHOLD || process.env.MODEL_SELECTION_COMPLEX_THRESHOLD, 7),
    preferSpeed: parseBoolean(process.env.PREFER_SPEED || process.env.MODEL_SELECTION_PREFER_SPEED),
    preferQuality: parseBoolean(process.env.PREFER_QUALITY || process.env.MODEL_SELECTION_PREFER_QUALITY),
  },

  // =============================================================================
  // Cost Management
  // =============================================================================

  cost: {
    maxSessionCost: parseNumber(process.env.MAX_SESSION_COST || process.env.COST_MAX_SESSION_COST, 5.0),
    maxTaskCost: parseNumber(process.env.MAX_TASK_COST || process.env.COST_MAX_TASK_COST, 0.5),
    enableTracking: parseBoolean(process.env.ENABLE_COST_TRACKING || process.env.COST_ENABLE_TRACKING, true),
    enableOptimization: parseBoolean(process.env.ENABLE_COST_OPTIMIZATION || process.env.COST_ENABLE_OPTIMIZATION, true),
  },

  // =============================================================================
  // Output Configuration
  // =============================================================================

  output: {
    dir: process.env.OUTPUT_DIR || process.env.OUTPUT_PATH || 'atomic-design-pattern/ui',
    globalCssPath: process.env.GLOBAL_CSS_PATH || path.join(__dirname, '..', '..', '..', 'atomic-design-pattern', 'app', 'globals.css'),
  },

  // =============================================================================
  // Checkpointing Configuration
  // =============================================================================

  checkpointing: {
    enabled: parseBoolean(process.env.ENABLE_CHECKPOINTING, true),
    // Future: Add support for persistent storage (SqliteSaver)
    // storage: process.env.CHECKPOINT_STORAGE || 'memory',
  },

  // =============================================================================
  // Development & Debugging
  // =============================================================================

  debug: parseBoolean(process.env.DEBUG),
  logLevel: process.env.LOG_LEVEL || 'info',
  enablePerformanceMonitoring: parseBoolean(process.env.ENABLE_PERFORMANCE_MONITORING, true),

  // =============================================================================
  // Node Environment
  // =============================================================================

  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
};

/**
 * Validate required environment variables
 * Call this at application startup to ensure all required vars are set
 *
 * @throws {Error} If required environment variables are missing
 */
export const validateEnv = (): void => {
  const errors: string[] = [];

  // Check required API keys
  if (!env.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  if (!env.figma.accessToken) {
    errors.push('FIGMA_ACCESS_TOKEN is required');
  }

  // Check LangSmith if tracing is enabled
  if (env.langsmith.tracingV2) {
    if (!env.langsmith.apiKey) {
      errors.push('LANGCHAIN_API_KEY is required when LANGCHAIN_TRACING_V2=true');
    }
    if (!env.langsmith.workspaceId) {
      errors.push('LANGSMITH_WORKSPACE_ID is required when LANGCHAIN_TRACING_V2=true');
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
      `Please check your .env file or see .env.example for setup instructions.`
    );
  }
};

/**
 * Config summary type
 */
export interface ConfigSummary {
  openai: {
    hasApiKey: boolean;
  };
  figma: {
    hasAccessToken: boolean;
    fileId: string | undefined;
    hasUrl: boolean;
    atomicLevels: {
      atoms: boolean;
      molecules: boolean;
      organisms: boolean;
    };
  };
  langsmith: {
    tracing: boolean;
    hasApiKey: boolean;
    project: string;
    workspaceId: string | undefined;
  };
  models: {
    default: string;
    fallback: string;
    available: string[];
  };
  modelSelection: {
    simpleThreshold: number;
    complexThreshold: number;
    preferSpeed: boolean;
    preferQuality: boolean;
  };
  cost: {
    maxSessionCost: number;
    maxTaskCost: number;
    enableTracking: boolean;
    enableOptimization: boolean;
  };
  output: {
    dir: string;
    globalCssPath: string;
  };
  checkpointing: {
    enabled: boolean;
  };
  debug: boolean;
  logLevel: string;
  nodeEnv: string;
}

/**
 * Get a safe summary of environment config (without sensitive values)
 * Useful for logging and debugging
 */
export const getConfigSummary = (): ConfigSummary => ({
  openai: {
    hasApiKey: !!env.openai.apiKey,
  },
  figma: {
    hasAccessToken: !!env.figma.accessToken,
    fileId: env.figma.fileId,
    hasUrl: !!env.figma.url,
    atomicLevels: {
      atoms: !!env.figma.atomicLevels.atoms,
      molecules: !!env.figma.atomicLevels.molecules,
      organisms: !!env.figma.atomicLevels.organisms,
    },
  },
  langsmith: {
    tracing: env.langsmith.tracingV2,
    hasApiKey: !!env.langsmith.apiKey,
    project: env.langsmith.project,
    workspaceId: env.langsmith.workspaceId,
  },
  models: env.models,
  modelSelection: env.modelSelection,
  cost: env.cost,
  output: env.output,
  checkpointing: env.checkpointing,
  debug: env.debug,
  logLevel: env.logLevel,
  nodeEnv: env.nodeEnv,
});

export default env;
