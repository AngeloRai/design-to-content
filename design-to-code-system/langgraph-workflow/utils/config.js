#!/usr/bin/env node

/**
 * CONFIGURATION MANAGEMENT
 * Handles environment variables, API keys, and system configuration
 * Follows security best practices and provides fallbacks
 */

import { config } from 'dotenv';
import { z } from 'zod';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root .env file (parent directory)
config({ path: join(__dirname, '../../.env') });

/**
 * Configuration schema with validation
 */
const ConfigSchema = z.object({
  // OpenAI Configuration
  openai: z.object({
    apiKey: z.string().min(1, "OpenAI API key is required"),
    defaultModel: z.enum(["gpt-4o", "gpt-4o-mini", "o3-mini"]).default("gpt-4o"),
    fallbackModel: z.enum(["gpt-4o", "gpt-4o-mini"]).default("gpt-4o-mini"),
  }),

  // Model Selection Configuration
  modelSelection: z.object({
    simpleThreshold: z.number().min(1).max(10).default(3),
    complexThreshold: z.number().min(1).max(10).default(7),
    preferSpeed: z.boolean().default(false),
    preferQuality: z.boolean().default(false),
    availableModels: z.array(z.string()).default(["gpt-4o", "gpt-4o-mini", "o3-mini"])
  }),

  // Cost Management
  cost: z.object({
    maxSessionCost: z.number().positive().default(5.00),
    maxTaskCost: z.number().positive().default(0.50),
    enableTracking: z.boolean().default(true),
    enableOptimization: z.boolean().default(true)
  }),

  // Development Settings
  development: z.object({
    debug: z.boolean().default(false),
    logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
    enablePerformanceMonitoring: z.boolean().default(true)
  }),

  // Figma Integration (optional)
  figma: z.object({
    accessToken: z.string().nullable(),
    fileId: z.string().nullable()
  }).nullable()
});

/**
 * Parse and validate configuration from environment variables
 */
const parseConfig = () => {
  try {
    const rawConfig = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        defaultModel: process.env.DEFAULT_MODEL || "gpt-4o",
        fallbackModel: process.env.FALLBACK_MODEL || "gpt-4o-mini",

      },

      modelSelection: {
        simpleThreshold: parseInt(process.env.SIMPLE_THRESHOLD) || 3,
        complexThreshold: parseInt(process.env.COMPLEX_THRESHOLD) || 7,
        preferSpeed: process.env.PREFER_SPEED === "true",
        preferQuality: process.env.PREFER_QUALITY === "true",
        availableModels: process.env.AVAILABLE_MODELS?.split(",") || ["gpt-4o", "gpt-4o-mini", "o3-mini"]
      },

      cost: {
        maxSessionCost: parseFloat(process.env.MAX_SESSION_COST) || 5.00,
        maxTaskCost: parseFloat(process.env.MAX_TASK_COST) || 0.50,
        enableTracking: process.env.ENABLE_COST_TRACKING !== "false",
        enableOptimization: process.env.ENABLE_COST_OPTIMIZATION !== "false"
      },

      development: {
        debug: process.env.DEBUG === "true",
        logLevel: process.env.LOG_LEVEL || "info",
        enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING !== "false"
      },

      figma: {
        accessToken: process.env.FIGMA_ACCESS_TOKEN,
        fileId: process.env.FIGMA_FILE_ID
      }
    };

    return ConfigSchema.parse(rawConfig);

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Configuration validation failed:");
      error.errors.forEach(err => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`);
      });

      // Provide helpful hints
      if (error.errors.some(err => err.path.includes('apiKey'))) {
        console.error("\n💡 Hint: Set your OpenAI API key:");
        console.error("   export OPENAI_API_KEY='your-api-key-here'");
        console.error("   or create a .env file with OPENAI_API_KEY=your-api-key-here");
      }
    } else {
      console.error("❌ Configuration error:", error.message);
    }

    process.exit(1);
  }
};

/**
 * Global configuration instance
 */
export const appConfig = parseConfig();

/**
 * Validate OpenAI API key format
 */
export const validateOpenAIKey = (apiKey) => {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }

  if (!apiKey.startsWith('sk-')) {
    console.warn("⚠️  OpenAI API key should start with 'sk-'");
  }

  if (apiKey.length < 40) {
    console.warn("⚠️  OpenAI API key seems too short");
  }

  return true;
};

/**
 * Get model configuration for intelligent selection
 */
export const getModelConfig = () => ({
  simpleThreshold: appConfig.modelSelection.simpleThreshold,
  complexThreshold: appConfig.modelSelection.complexThreshold,
  preferSpeed: appConfig.modelSelection.preferSpeed,
  preferQuality: appConfig.modelSelection.preferQuality,
  availableModels: appConfig.modelSelection.availableModels,
  maxCostPerTask: appConfig.cost.maxTaskCost
});

/**
 * Get OpenAI client configuration
 */
export const getOpenAIConfig = () => ({
  apiKey: appConfig.openai.apiKey,
  defaultModel: appConfig.openai.defaultModel,
  fallbackModel: appConfig.openai.fallbackModel,
  enableO3Mini: appConfig.openai.enableO3Mini
});

/**
 * Get cost tracking configuration
 */
export const getCostConfig = () => ({
  maxSessionCost: appConfig.cost.maxSessionCost,
  maxTaskCost: appConfig.cost.maxTaskCost,
  enableTracking: appConfig.cost.enableTracking,
  enableOptimization: appConfig.cost.enableOptimization
});

/**
 * Check if development mode is enabled
 */
export const isDevelopment = () => appConfig.development.debug;

/**
 * Get logging configuration
 */
export const getLogConfig = () => ({
  level: appConfig.development.logLevel,
  debug: appConfig.development.debug,
  enablePerformanceMonitoring: appConfig.development.enablePerformanceMonitoring
});

/**
 * Get Figma configuration if available
 */
export const getFigmaConfig = () => appConfig.figma;

/**
 * Validate configuration health
 */
export const validateConfigHealth = () => {
  const issues = [];

  // Check OpenAI configuration
  try {
    validateOpenAIKey(appConfig.openai.apiKey);
  } catch (error) {
    issues.push(`OpenAI: ${error.message}`);
  }

  // Check model selection thresholds
  if (appConfig.modelSelection.simpleThreshold >= appConfig.modelSelection.complexThreshold) {
    issues.push("Model selection: simpleThreshold should be less than complexThreshold");
  }

  // Check cost limits
  if (appConfig.cost.maxTaskCost >= appConfig.cost.maxSessionCost) {
    issues.push("Cost: maxTaskCost should be less than maxSessionCost");
  }

  return {
    isHealthy: issues.length === 0,
    issues,
    config: appConfig
  };
};

/**
 * Print configuration summary (without sensitive data)
 */
export const printConfigSummary = () => {
  console.log("🔧 Configuration Summary:");
  console.log(`   OpenAI Model: ${appConfig.openai.defaultModel}`);
  console.log(`   Available Models: ${appConfig.modelSelection.availableModels.join(", ")}`);
  console.log(`   Cost Limits: $${appConfig.cost.maxTaskCost}/task, $${appConfig.cost.maxSessionCost}/session`);
  console.log(`   Complexity Thresholds: ${appConfig.modelSelection.simpleThreshold}-${appConfig.modelSelection.complexThreshold}`);
  console.log(`   Debug Mode: ${appConfig.development.debug ? "ON" : "OFF"}`);
  console.log(`   Cost Tracking: ${appConfig.cost.enableTracking ? "ON" : "OFF"}`);

  if (appConfig.figma?.accessToken) {
    console.log(`   Figma Integration: CONFIGURED`);
  }
};

export default {
  appConfig,
  validateOpenAIKey,
  getModelConfig,
  getOpenAIConfig,
  getCostConfig,
  isDevelopment,
  getLogConfig,
  getFigmaConfig,
  validateConfigHealth,
  printConfigSummary
};