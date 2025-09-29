#!/usr/bin/env node

/**
 * INTELLIGENT MODEL SELECTOR
 * Routes different tasks to optimal models based on complexity and requirements
 * Optimizes for cost, speed, and quality trade-offs
 */

/**
 * Model pricing and capabilities configuration
 * Costs are per 1M tokens (input/output)
 */
const MODEL_CONFIG = {
  "gpt-4o": {
    inputCost: 5.00,      // $5.00/1M input tokens
    outputCost: 15.00,    // $15.00/1M output tokens
    maxTokens: 128000,
    capabilities: ["vision", "code", "reasoning", "structured_output"],
    speed: "fast",
    quality: "high"
  },
  "gpt-4o-mini": {
    inputCost: 0.15,      // $0.15/1M input tokens
    outputCost: 0.60,     // $0.60/1M output tokens
    maxTokens: 128000,
    capabilities: ["code", "reasoning", "structured_output"],
    speed: "fastest",
    quality: "good"
  },
  "o3-mini": {
    inputCost: 1.25,      // $1.25/1M input tokens (estimated)
    outputCost: 5.00,     // $5.00/1M output tokens (estimated)
    maxTokens: 128000,
    capabilities: ["vision", "advanced_reasoning", "complex_analysis"],
    speed: "slower",
    quality: "excellent"
  }
};

/**
 * Task complexity analysis functions
 */
export const ComplexityAnalyzer = {
  /**
   * Analyze visual complexity from screenshot metadata
   */
  analyzeImageComplexity: (screenshot, metadata = {}) => {
    if (!screenshot) return 1; // No image = minimal complexity

    const factors = {
      fileSize: metadata.fileSize || 0,
      dimensions: metadata.width * metadata.height || 0,
      hasMultipleFrames: metadata.frameCount > 1,
      containsCharts: metadata.containsCharts || false,
      containsText: metadata.containsText || false,
      colorComplexity: metadata.colorCount || 0
    };

    let complexity = 1;

    // File size indicates visual complexity
    if (factors.fileSize > 500000) complexity += 2;
    else if (factors.fileSize > 100000) complexity += 1;

    // Large dimensions = more elements
    if (factors.dimensions > 2000000) complexity += 2;
    else if (factors.dimensions > 500000) complexity += 1;

    // Multiple frames = complex layout
    if (factors.hasMultipleFrames) complexity += 2;

    // Charts require advanced reasoning
    if (factors.containsCharts) complexity += 3;

    // Text recognition adds complexity
    if (factors.containsText) complexity += 1;

    // Color complexity
    if (factors.colorComplexity > 50) complexity += 2;
    else if (factors.colorComplexity > 20) complexity += 1;

    return Math.min(complexity, 10); // Cap at 10
  },

  /**
   * Analyze component architectural complexity
   */
  analyzeComponentComplexity: (componentSpec) => {
    if (!componentSpec) return 1;

    const factors = {
      variantCount: componentSpec.variants?.length || 0,
      propsCount: Object.keys(componentSpec.props || {}).length,
      hasState: componentSpec.hasState || false,
      hasEvents: componentSpec.events?.length > 0,
      hasChildren: componentSpec.hasChildren || false,
      dependsOnOthers: componentSpec.dependencies?.length > 0
    };

    let complexity = 1;

    // Multiple variants increase complexity
    complexity += Math.min(factors.variantCount, 3);

    // Props complexity
    if (factors.propsCount > 10) complexity += 3;
    else if (factors.propsCount > 5) complexity += 2;
    else if (factors.propsCount > 2) complexity += 1;

    // State management
    if (factors.hasState) complexity += 2;

    // Event handling
    if (factors.hasEvents) complexity += 1;

    // Composition patterns
    if (factors.hasChildren) complexity += 1;
    if (factors.dependsOnOthers) complexity += 1;

    return Math.min(complexity, 10);
  },

  /**
   * Analyze routing decision complexity
   */
  analyzeRoutingComplexity: (analysisData) => {
    if (!analysisData?.identifiedComponents) return 1;

    const components = analysisData.identifiedComponents;
    const factors = {
      componentCount: components.length,
      avgConfidence: components.reduce((sum, c) => sum + c.confidence, 0) / components.length,
      hasLowConfidence: components.some(c => c.confidence < 0.7),
      hasHighPriority: components.some(c => c.priority === 'high'),
      hasVariedTypes: new Set(components.map(c => c.type)).size
    };

    let complexity = 1;

    // Many components = complex decisions
    if (factors.componentCount > 10) complexity += 3;
    else if (factors.componentCount > 5) complexity += 2;
    else if (factors.componentCount > 2) complexity += 1;

    // Low confidence = needs better reasoning
    if (factors.avgConfidence < 0.7) complexity += 2;
    if (factors.hasLowConfidence) complexity += 1;

    // High priority items need careful routing
    if (factors.hasHighPriority) complexity += 1;

    // Many different types = complex routing
    if (factors.hasVariedTypes > 5) complexity += 2;
    else if (factors.hasVariedTypes > 3) complexity += 1;

    return Math.min(complexity, 10);
  }
};

/**
 * Main ModelSelector class with intelligent routing
 */
export class ModelSelector {
  constructor(config = {}) {
    this.config = {
      // Complexity thresholds (configurable)
      simpleThreshold: config.simpleThreshold || 3,
      complexThreshold: config.complexThreshold || 7,

      // Cost optimization settings
      maxCostPerTask: config.maxCostPerTask || 0.50,
      preferSpeed: config.preferSpeed || false,
      preferQuality: config.preferQuality || false,

      // Model availability
      availableModels: config.availableModels || ["gpt-4o", "gpt-4o-mini", "o3-mini"],

      ...config
    };
  }

  /**
   * Select optimal model for visual analysis tasks
   */
  selectAnalysisModel(screenshot, metadata = {}) {
    const complexity = ComplexityAnalyzer.analyzeImageComplexity(screenshot, metadata);

    console.log(`📊 Analysis complexity: ${complexity}/10`);

    // High complexity visual tasks benefit from o3-mini's reasoning
    if (complexity >= this.config.complexThreshold) {
      if (this.config.availableModels.includes("o3-mini")) {
        console.log(`🧠 Selected o3-mini for complex visual analysis`);
        return "o3-mini";
      }
    }

    // Standard visual analysis - gpt-4o is excellent
    if (this.config.availableModels.includes("gpt-4o")) {
      console.log(`🎯 Selected gpt-4o for visual analysis`);
      return "gpt-4o";
    }

    // Fallback to gpt-4o-mini (no vision, but can analyze descriptions)
    console.log(`⚡ Fallback to gpt-4o-mini for analysis`);
    return "gpt-4o-mini";
  }

  /**
   * Select optimal model for routing decisions
   */
  selectRoutingModel(analysisData) {
    const complexity = ComplexityAnalyzer.analyzeRoutingComplexity(analysisData);

    console.log(`📊 Routing complexity: ${complexity}/10`);

    // Routing is structured decision-making - gpt-4o is optimal
    // (o3-mini might be overkill and slower for routing)
    if (this.config.availableModels.includes("gpt-4o")) {
      console.log(`🎯 Selected gpt-4o for routing decisions`);
      return "gpt-4o";
    }

    // Fallback to gpt-4o-mini for simple routing
    console.log(`⚡ Fallback to gpt-4o-mini for routing`);
    return "gpt-4o-mini";
  }

  /**
   * Select optimal model for component generation
   */
  selectGenerationModel(componentType, componentSpec = {}) {
    const complexity = ComplexityAnalyzer.analyzeComponentComplexity(componentSpec);

    console.log(`📊 Generation complexity: ${complexity}/10`);

    // Complex architectural decisions benefit from o3-mini
    if (complexity >= this.config.complexThreshold) {
      if (this.config.availableModels.includes("o3-mini")) {
        console.log(`🧠 Selected o3-mini for complex component generation`);
        return "o3-mini";
      }
    }

    // Standard code generation - gpt-4o is excellent
    if (this.config.availableModels.includes("gpt-4o")) {
      console.log(`🎯 Selected gpt-4o for component generation`);
      return "gpt-4o";
    }

    // Simple components can use gpt-4o-mini
    if (complexity <= this.config.simpleThreshold) {
      console.log(`⚡ Selected gpt-4o-mini for simple component generation`);
      return "gpt-4o-mini";
    }

    return "gpt-4o"; // Safe default
  }

  /**
   * Select optimal model for validation tasks
   */
  selectValidationModel(validationType = "component") {
    // Validation is usually straightforward - optimize for cost
    if (this.config.availableModels.includes("gpt-4o-mini")) {
      console.log(`💰 Selected gpt-4o-mini for cost-optimized validation`);
      return "gpt-4o-mini";
    }

    // Fallback to gpt-4o if mini not available
    console.log(`🎯 Fallback to gpt-4o for validation`);
    return "gpt-4o";
  }

  /**
   * Get model configuration for cost estimation
   */
  getModelConfig(modelName) {
    return MODEL_CONFIG[modelName] || MODEL_CONFIG["gpt-4o"];
  }

  /**
   * Estimate cost for a task with given model and token counts
   */
  estimateCost(modelName, inputTokens, outputTokens) {
    const config = this.getModelConfig(modelName);
    const inputCost = (inputTokens / 1000000) * config.inputCost;
    const outputCost = (outputTokens / 1000000) * config.outputCost;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      model: modelName
    };
  }

  /**
   * Get recommended model settings for a specific model
   */
  getModelSettings(modelName, taskType) {
    const baseSettings = {
      model: modelName,
      maxTokens: this.getModelConfig(modelName).maxTokens
    };

    // Task-specific optimizations
    switch (taskType) {
      case 'analysis':
        return {
          ...baseSettings,
          temperature: 0.1, // Consistent analysis
          maxTokens: 2000   // Detailed analysis
        };

      case 'routing':
        return {
          ...baseSettings,
          temperature: 0,   // Deterministic routing
          maxTokens: 500    // Concise decisions
        };

      case 'generation':
        return {
          ...baseSettings,
          temperature: 0.2, // Slight creativity for code
          maxTokens: 4000   // Longer code generation
        };

      case 'validation':
        return {
          ...baseSettings,
          temperature: 0,   // Strict validation
          maxTokens: 300    // Brief validation
        };

      default:
        return baseSettings;
    }
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log(`⚙️ ModelSelector configuration updated`);
  }
}

/**
 * Default model selector instance
 */
export const defaultModelSelector = new ModelSelector();

/**
 * Convenience functions for backward compatibility
 */
export const selectModelForAnalysis = (screenshot, metadata) =>
  defaultModelSelector.selectAnalysisModel(screenshot, metadata);

export const selectModelForRouting = (analysisData) =>
  defaultModelSelector.selectRoutingModel(analysisData);

export const selectModelForGeneration = (componentType, componentSpec) =>
  defaultModelSelector.selectGenerationModel(componentType, componentSpec);

export const selectModelForValidation = () =>
  defaultModelSelector.selectValidationModel();

export default {
  ModelSelector,
  ComplexityAnalyzer,
  MODEL_CONFIG,
  defaultModelSelector,
  selectModelForAnalysis,
  selectModelForRouting,
  selectModelForGeneration,
  selectModelForValidation
};