#!/usr/bin/env node

/**
 * FUNCTIONAL COST TRACKING SYSTEM
 * Real-time monitoring of token usage, costs, and performance across multiple models
 * Built with functional programming principles and atomic design awareness
 */

import modelSelectorModule from './model-selector.js';
const { MODEL_CONFIG } = modelSelectorModule;

/**
 * Create a new task cost record
 */
export const createTaskRecord = (taskId, modelName, taskType, componentLevel = null) => ({
  taskId,
  modelName,
  taskType, // 'analysis', 'routing', 'atom_generation', 'molecule_generation', 'validation'
  componentLevel, // 'atom', 'molecule', 'organism', null for non-generation tasks
  startTime: Date.now(),
  endTime: null,
  inputTokens: 0,
  outputTokens: 0,
  inputCost: 0,
  outputCost: 0,
  totalCost: 0,
  duration: 0,
  success: false,
  errorMessage: null,
  metadata: {},
  atomicMetrics: {
    reusabilityScore: null,    // How reusable is this component (1-10)
    complexityScore: null,     // Component complexity (1-10)
    atomDependencies: [],      // List of atoms this molecule depends on
    generatedComponents: []    // Components generated in this task
  }
});

/**
 * Complete a task record with results and atomic design metrics
 */
export const completeTaskRecord = (record, inputTokens, outputTokens, success = true, errorMessage = null, metadata = {}, atomicMetrics = {}) => {
  const endTime = Date.now();
  const duration = endTime - record.startTime;

  // Calculate costs using MODEL_CONFIG
  const config = MODEL_CONFIG[record.modelName] || MODEL_CONFIG["gpt-4o"];
  const inputCost = (inputTokens / 1000000) * config.inputCost;
  const outputCost = (outputTokens / 1000000) * config.outputCost;

  return {
    ...record,
    endTime,
    duration,
    inputTokens,
    outputTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    success,
    errorMessage,
    metadata,
    atomicMetrics: {
      ...record.atomicMetrics,
      ...atomicMetrics
    }
  };
};

/**
 * Calculate cost efficiency metrics with atomic design considerations
 */
export const calculateEfficiencyMetrics = (record) => {
  const baseMetrics = {
    costPerSecond: record.duration > 0 ? record.totalCost / (record.duration / 1000) : 0,
    tokensPerSecond: record.duration > 0 ? (record.inputTokens + record.outputTokens) / (record.duration / 1000) : 0,
    costPerToken: (record.inputTokens + record.outputTokens) > 0 ? record.totalCost / (record.inputTokens + record.outputTokens) : 0
  };

  // Add atomic design efficiency metrics
  const atomicEfficiency = {};
  if (record.componentLevel && record.atomicMetrics.generatedComponents.length > 0) {
    atomicEfficiency.costPerComponent = record.totalCost / record.atomicMetrics.generatedComponents.length;
    atomicEfficiency.componentGenerationRate = record.duration > 0 ?
      record.atomicMetrics.generatedComponents.length / (record.duration / 1000) : 0;

    // Atoms should be cheaper and faster to generate than molecules
    if (record.componentLevel === 'atom') {
      atomicEfficiency.atomicEfficiencyRating = record.atomicMetrics.reusabilityScore || 'unknown';
    } else if (record.componentLevel === 'molecule') {
      atomicEfficiency.molecularComplexityRatio = record.atomicMetrics.atomDependencies.length > 0 ?
        record.atomicMetrics.complexityScore / record.atomicMetrics.atomDependencies.length : 0;
    }
  }

  return { ...baseMetrics, atomic: atomicEfficiency };
};

/**
 * Create a new session cost tracker state
 */
export const createSessionTracker = (sessionId = null) => ({
  sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  startTime: Date.now(),
  endTime: null,
  tasks: new Map(), // taskId -> TaskRecord
  modelUsage: new Map(), // modelName -> usage stats
  taskTypeUsage: new Map(), // taskType -> usage stats
  componentLevelUsage: new Map(), // 'atom', 'molecule' -> usage stats
  totalCost: 0,
  totalTokens: 0,
  successRate: 0,
  isActive: true,

  // Atomic design system metrics
  atomicMetrics: {
    totalAtomsGenerated: 0,
    totalMoleculesGenerated: 0,
    avgAtomReusability: 0,
    avgMoleculeComplexity: 0,
    atomToMoleculeRatio: 0,
    costEfficiencyByLevel: new Map(), // 'atom' vs 'molecule' cost efficiency
    generationStrategy: null, // 'ATOM_FIRST', 'MOLECULE_FIRST', 'MIXED'
    atomLibraryGrowth: [], // Track how atomic library grows over time
    reusabilityIndex: 0 // Overall reusability score for generated components
  }
});

/**
 * Start tracking a new task (pure function, returns new state)
 */
export const startTask = (sessionState, taskId, modelName, taskType, componentLevel = null) => {
  if (!sessionState.isActive) {
    throw new Error('Session is not active');
  }

  const record = createTaskRecord(taskId, modelName, taskType, componentLevel);
  const newTasks = new Map(sessionState.tasks);
  newTasks.set(taskId, record);

  const levelInfo = componentLevel ? ` (${componentLevel} level)` : '';
  console.log(`📊 Started tracking task ${taskId} with ${modelName} for ${taskType}${levelInfo}`);

  return {
    ...sessionState,
    tasks: newTasks
  };
};

/**
 * Update model usage statistics (pure function)
 */
const updateModelUsage = (modelUsage, record) => {
  const newModelUsage = new Map(modelUsage);

  if (!newModelUsage.has(record.modelName)) {
    newModelUsage.set(record.modelName, {
      tasks: 0,
      totalCost: 0,
      totalTokens: 0,
      totalDuration: 0,
      successCount: 0,
      errorCount: 0,
      atomTasks: 0,
      moleculeTasks: 0
    });
  }

  const modelStats = { ...newModelUsage.get(record.modelName) };
  modelStats.tasks++;
  modelStats.totalCost += record.totalCost;
  modelStats.totalTokens += (record.inputTokens + record.outputTokens);
  modelStats.totalDuration += record.duration;
  if (record.success) modelStats.successCount++;
  else modelStats.errorCount++;

  // Track atomic vs molecular usage
  if (record.componentLevel === 'atom') modelStats.atomTasks++;
  else if (record.componentLevel === 'molecule') modelStats.moleculeTasks++;

  newModelUsage.set(record.modelName, modelStats);
  return newModelUsage;
};

/**
 * Update task type usage statistics (pure function)
 */
const updateTaskTypeUsage = (taskTypeUsage, record) => {
  const newTaskTypeUsage = new Map(taskTypeUsage);

  if (!newTaskTypeUsage.has(record.taskType)) {
    newTaskTypeUsage.set(record.taskType, {
      tasks: 0,
      totalCost: 0,
      totalTokens: 0,
      avgDuration: 0,
      modelsUsed: new Set()
    });
  }

  const taskStats = { ...newTaskTypeUsage.get(record.taskType) };
  taskStats.tasks++;
  taskStats.totalCost += record.totalCost;
  taskStats.totalTokens += (record.inputTokens + record.outputTokens);
  taskStats.avgDuration = (taskStats.avgDuration * (taskStats.tasks - 1) + record.duration) / taskStats.tasks;
  taskStats.modelsUsed = new Set([...taskStats.modelsUsed, record.modelName]);

  newTaskTypeUsage.set(record.taskType, taskStats);
  return newTaskTypeUsage;
};

/**
 * Update component level usage statistics (pure function)
 */
const updateComponentLevelUsage = (componentLevelUsage, record) => {
  if (!record.componentLevel) return componentLevelUsage;

  const newComponentLevelUsage = new Map(componentLevelUsage);

  if (!newComponentLevelUsage.has(record.componentLevel)) {
    newComponentLevelUsage.set(record.componentLevel, {
      tasks: 0,
      totalCost: 0,
      totalTokens: 0,
      avgDuration: 0,
      avgComplexity: 0,
      avgReusability: 0,
      componentsGenerated: 0
    });
  }

  const levelStats = { ...newComponentLevelUsage.get(record.componentLevel) };
  levelStats.tasks++;
  levelStats.totalCost += record.totalCost;
  levelStats.totalTokens += (record.inputTokens + record.outputTokens);
  levelStats.avgDuration = (levelStats.avgDuration * (levelStats.tasks - 1) + record.duration) / levelStats.tasks;
  levelStats.componentsGenerated += record.atomicMetrics.generatedComponents.length;

  if (record.atomicMetrics.complexityScore) {
    levelStats.avgComplexity = (levelStats.avgComplexity * (levelStats.tasks - 1) + record.atomicMetrics.complexityScore) / levelStats.tasks;
  }
  if (record.atomicMetrics.reusabilityScore) {
    levelStats.avgReusability = (levelStats.avgReusability * (levelStats.tasks - 1) + record.atomicMetrics.reusabilityScore) / levelStats.tasks;
  }

  newComponentLevelUsage.set(record.componentLevel, levelStats);
  return newComponentLevelUsage;
};

/**
 * Update atomic design system metrics (pure function)
 */
const updateAtomicMetrics = (atomicMetrics, record) => {
  if (!record.componentLevel) return atomicMetrics;

  const components = record.atomicMetrics.generatedComponents;
  const newAtomicMetrics = { ...atomicMetrics };

  if (record.componentLevel === 'atom') {
    newAtomicMetrics.totalAtomsGenerated += components.length;

    // Track atom library growth over time
    newAtomicMetrics.atomLibraryGrowth = [
      ...newAtomicMetrics.atomLibraryGrowth,
      {
        timestamp: record.endTime,
        newAtoms: components.length,
        totalAtoms: newAtomicMetrics.totalAtomsGenerated
      }
    ];

    // Update average reusability
    if (record.atomicMetrics.reusabilityScore) {
      const totalAtoms = newAtomicMetrics.totalAtomsGenerated;
      newAtomicMetrics.avgAtomReusability =
        (atomicMetrics.avgAtomReusability * (totalAtoms - components.length) +
         record.atomicMetrics.reusabilityScore * components.length) / totalAtoms;
    }

  } else if (record.componentLevel === 'molecule') {
    newAtomicMetrics.totalMoleculesGenerated += components.length;

    // Update average complexity
    if (record.atomicMetrics.complexityScore) {
      const totalMolecules = newAtomicMetrics.totalMoleculesGenerated;
      newAtomicMetrics.avgMoleculeComplexity =
        (atomicMetrics.avgMoleculeComplexity * (totalMolecules - components.length) +
         record.atomicMetrics.complexityScore * components.length) / totalMolecules;
    }
  }

  // Update atom to molecule ratio
  const totalComponents = newAtomicMetrics.totalAtomsGenerated + newAtomicMetrics.totalMoleculesGenerated;
  newAtomicMetrics.atomToMoleculeRatio = totalComponents > 0 ?
    newAtomicMetrics.totalAtomsGenerated / totalComponents : 0;

  // Update cost efficiency by level
  if (record.componentLevel && components.length > 0) {
    const newCostEfficiencyByLevel = new Map(newAtomicMetrics.costEfficiencyByLevel);

    if (!newCostEfficiencyByLevel.has(record.componentLevel)) {
      newCostEfficiencyByLevel.set(record.componentLevel, {
        totalCost: 0,
        totalComponents: 0,
        avgCostPerComponent: 0
      });
    }

    const efficiency = { ...newCostEfficiencyByLevel.get(record.componentLevel) };
    efficiency.totalCost += record.totalCost;
    efficiency.totalComponents += components.length;
    efficiency.avgCostPerComponent = efficiency.totalCost / efficiency.totalComponents;

    newCostEfficiencyByLevel.set(record.componentLevel, efficiency);
    newAtomicMetrics.costEfficiencyByLevel = newCostEfficiencyByLevel;
  }

  // Calculate overall reusability index (higher is better for atomic design)
  newAtomicMetrics.reusabilityIndex =
    (newAtomicMetrics.avgAtomReusability * 0.7) + // Atoms are more important for reusability
    (newAtomicMetrics.atomToMoleculeRatio * 3) + // Favor atom-heavy libraries
    ((10 - newAtomicMetrics.avgMoleculeComplexity) * 0.3); // Simpler molecules are better

  return newAtomicMetrics;
};

/**
 * Complete a task and update tracking (pure function, returns new state)
 */
export const completeTask = (sessionState, taskId, inputTokens, outputTokens, success = true, errorMessage = null, metadata = {}, atomicMetrics = {}) => {
  const record = sessionState.tasks.get(taskId);
  if (!record) {
    throw new Error(`Task ${taskId} not found in session ${sessionState.sessionId}`);
  }

  const completedRecord = completeTaskRecord(record, inputTokens, outputTokens, success, errorMessage, metadata, atomicMetrics);

  // Update tasks map
  const newTasks = new Map(sessionState.tasks);
  newTasks.set(taskId, completedRecord);

  // Update all usage statistics
  const newModelUsage = updateModelUsage(sessionState.modelUsage, completedRecord);
  const newTaskTypeUsage = updateTaskTypeUsage(sessionState.taskTypeUsage, completedRecord);
  const newComponentLevelUsage = updateComponentLevelUsage(sessionState.componentLevelUsage, completedRecord);
  const newAtomicMetrics = updateAtomicMetrics(sessionState.atomicMetrics, completedRecord);

  // Update session totals
  const newTotalCost = sessionState.totalCost + completedRecord.totalCost;
  const newTotalTokens = sessionState.totalTokens + (completedRecord.inputTokens + completedRecord.outputTokens);

  // Calculate success rate
  const completedTasks = Array.from(newTasks.values()).filter(t => t.endTime !== null);
  const successfulTasks = completedTasks.filter(t => t.success);
  const newSuccessRate = completedTasks.length > 0 ? successfulTasks.length / completedTasks.length : 0;

  const levelInfo = completedRecord.componentLevel ? ` (${completedRecord.componentLevel})` : '';
  console.log(`✅ Completed task ${taskId}${levelInfo}: $${completedRecord.totalCost.toFixed(4)} (${completedRecord.inputTokens + completedRecord.outputTokens} tokens)`);

  return {
    ...sessionState,
    tasks: newTasks,
    modelUsage: newModelUsage,
    taskTypeUsage: newTaskTypeUsage,
    componentLevelUsage: newComponentLevelUsage,
    atomicMetrics: newAtomicMetrics,
    totalCost: newTotalCost,
    totalTokens: newTotalTokens,
    successRate: newSuccessRate
  };
};

/**
 * End the session and finalize tracking (pure function, returns new state)
 */
export const endSession = (sessionState) => {
  if (!sessionState.isActive) {
    throw new Error('Session already ended');
  }

  const endTime = Date.now();
  console.log(`🏁 Session ${sessionState.sessionId} ended: $${sessionState.totalCost.toFixed(4)} total cost`);

  return {
    ...sessionState,
    endTime,
    isActive: false
  };
};

/**
 * Get comprehensive session summary (pure function)
 */
export const getSessionSummary = (sessionState) => {
  const duration = (sessionState.endTime || Date.now()) - sessionState.startTime;
  const completedTasks = Array.from(sessionState.tasks.values()).filter(t => t.endTime !== null);

  return {
    sessionId: sessionState.sessionId,
    duration,
    isActive: sessionState.isActive,
    totalCost: sessionState.totalCost,
    totalTokens: sessionState.totalTokens,
    successRate: sessionState.successRate,
    tasksCompleted: completedTasks.length,
    tasksTotal: sessionState.tasks.size,

    // Convert Maps to Objects for JSON serialization
    modelBreakdown: Object.fromEntries(
      Array.from(sessionState.modelUsage.entries()).map(([model, stats]) => [
        model,
        {
          ...stats,
          avgCostPerTask: stats.tasks > 0 ? stats.totalCost / stats.tasks : 0,
          avgTokensPerTask: stats.tasks > 0 ? stats.totalTokens / stats.tasks : 0,
          avgDuration: stats.tasks > 0 ? stats.totalDuration / stats.tasks : 0,
          successRate: stats.tasks > 0 ? stats.successCount / stats.tasks : 0
        }
      ])
    ),

    taskTypeBreakdown: Object.fromEntries(
      Array.from(sessionState.taskTypeUsage.entries()).map(([type, stats]) => [
        type,
        {
          ...stats,
          modelsUsed: Array.from(stats.modelsUsed),
          avgCostPerTask: stats.tasks > 0 ? stats.totalCost / stats.tasks : 0
        }
      ])
    ),

    componentLevelBreakdown: Object.fromEntries(
      Array.from(sessionState.componentLevelUsage.entries()).map(([level, stats]) => [
        level,
        {
          ...stats,
          avgCostPerComponent: stats.componentsGenerated > 0 ? stats.totalCost / stats.componentsGenerated : 0
        }
      ])
    ),

    atomicMetrics: {
      ...sessionState.atomicMetrics,
      costEfficiencyByLevel: Object.fromEntries(sessionState.atomicMetrics.costEfficiencyByLevel)
    },

    efficiency: {
      costPerSecond: duration > 0 ? sessionState.totalCost / (duration / 1000) : 0,
      tokensPerSecond: duration > 0 ? sessionState.totalTokens / (duration / 1000) : 0,
      avgTaskDuration: completedTasks.length > 0 ? completedTasks.reduce((sum, t) => sum + t.duration, 0) / completedTasks.length : 0
    }
  };
};

/**
 * Get real-time cost projection (pure function)
 */
export const getCostProjection = (sessionState, estimatedRemainingTasks = 0) => {
  const completedTasks = Array.from(sessionState.tasks.values()).filter(t => t.endTime !== null);

  if (completedTasks.length === 0) {
    return {
      projectedTotalCost: sessionState.totalCost,
      projectedTotalTokens: sessionState.totalTokens,
      confidence: 0
    };
  }

  const avgCostPerTask = sessionState.totalCost / completedTasks.length;
  const avgTokensPerTask = sessionState.totalTokens / completedTasks.length;

  return {
    projectedTotalCost: sessionState.totalCost + (avgCostPerTask * estimatedRemainingTasks),
    projectedTotalTokens: sessionState.totalTokens + (avgTokensPerTask * estimatedRemainingTasks),
    avgCostPerTask,
    avgTokensPerTask,
    confidence: Math.min(completedTasks.length / 5, 1) // Higher confidence with more completed tasks
  };
};

/**
 * Check if session is approaching cost limits (pure function)
 */
export const checkCostLimits = (sessionState, maxSessionCost = 5.00, maxTaskCost = 0.50) => {
  const warnings = [];

  if (sessionState.totalCost > maxSessionCost * 0.8) {
    warnings.push({
      type: 'SESSION_COST_WARNING',
      message: `Session cost ($${sessionState.totalCost.toFixed(4)}) approaching limit ($${maxSessionCost})`,
      severity: sessionState.totalCost > maxSessionCost ? 'CRITICAL' : 'WARNING'
    });
  }

  const recentTasks = Array.from(sessionState.tasks.values())
    .filter(t => t.endTime !== null)
    .sort((a, b) => b.endTime - a.endTime)
    .slice(0, 3);

  const highCostTasks = recentTasks.filter(t => t.totalCost > maxTaskCost);
  if (highCostTasks.length > 0) {
    warnings.push({
      type: 'TASK_COST_WARNING',
      message: `${highCostTasks.length} recent tasks exceeded cost limit ($${maxTaskCost})`,
      tasks: highCostTasks.map(t => ({ taskId: t.taskId, cost: t.totalCost, model: t.modelName })),
      severity: 'WARNING'
    });
  }

  return warnings;
};

/**
 * Get atomic design insights from session data (pure function)
 */
export const getAtomicDesignInsights = (sessionState) => {
  const insights = {
    designSystemHealth: 'unknown',
    recommendations: [],
    efficiencyScore: 0,
    atomicPrinciples: {
      atomFirst: sessionState.atomicMetrics.atomToMoleculeRatio > 0.6,
      reusabilityFocus: sessionState.atomicMetrics.avgAtomReusability > 7,
      simplicityMaintained: sessionState.atomicMetrics.avgMoleculeComplexity < 6
    }
  };

  // Analyze design system health
  if (sessionState.atomicMetrics.reusabilityIndex > 8) {
    insights.designSystemHealth = 'excellent';
    insights.recommendations.push('Continue focusing on atomic design principles');
  } else if (sessionState.atomicMetrics.reusabilityIndex > 6) {
    insights.designSystemHealth = 'good';
    insights.recommendations.push('Consider improving atom reusability scores');
  } else {
    insights.designSystemHealth = 'needs_improvement';
    insights.recommendations.push('Focus more on atomic design principles');
    insights.recommendations.push('Prioritize atom generation over molecule creation');
  }

  // Calculate efficiency score based on atomic principles
  const atomRatio = sessionState.atomicMetrics.atomToMoleculeRatio;
  const reusability = sessionState.atomicMetrics.avgAtomReusability / 10;
  const simplicity = (10 - sessionState.atomicMetrics.avgMoleculeComplexity) / 10;

  insights.efficiencyScore = (atomRatio * 0.4 + reusability * 0.4 + simplicity * 0.2) * 10;

  // Add cost efficiency insights
  const atomCosts = sessionState.atomicMetrics.costEfficiencyByLevel.get('atom');
  const moleculeCosts = sessionState.atomicMetrics.costEfficiencyByLevel.get('molecule');

  if (atomCosts && moleculeCosts) {
    const atomicCostRatio = atomCosts.avgCostPerComponent / moleculeCosts.avgCostPerComponent;
    if (atomicCostRatio > 0.8) {
      insights.recommendations.push('Atoms are relatively expensive - optimize atom generation prompts');
    } else if (atomicCostRatio < 0.3) {
      insights.recommendations.push('Excellent atomic cost efficiency - atoms are much cheaper than molecules');
    }
  }

  return insights;
};

/**
 * Global state management (functional approach with state containers)
 */
const globalState = {
  sessions: new Map(), // sessionId -> SessionState
  totalLifetimeCost: 0
};

/**
 * Create a new session in global state
 */
export const createCostSession = (sessionId = null) => {
  const session = createSessionTracker(sessionId);
  globalState.sessions.set(session.sessionId, session);

  console.log(`🎯 Created new cost tracking session: ${session.sessionId}`);
  return session;
};

/**
 * Get session by ID from global state
 */
export const getCostSession = (sessionId) => {
  return globalState.sessions.get(sessionId);
};

/**
 * Track task across sessions - convenience function
 */
export const trackTask = (sessionId, taskId, modelName, taskType, componentLevel = null) => {
  const session = getCostSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const updatedSession = startTask(session, taskId, modelName, taskType, componentLevel);
  globalState.sessions.set(sessionId, updatedSession);

  return session.tasks.get(taskId);
};

/**
 * Complete task across sessions - convenience function
 */
export const completeTaskGlobal = (sessionId, taskId, inputTokens, outputTokens, success = true, errorMessage = null, metadata = {}, atomicMetrics = {}) => {
  const session = getCostSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const updatedSession = completeTask(session, taskId, inputTokens, outputTokens, success, errorMessage, metadata, atomicMetrics);
  globalState.sessions.set(sessionId, updatedSession);

  return updatedSession.tasks.get(taskId);
};

/**
 * Export all functions and utilities
 */
export default {
  // Core functions
  createTaskRecord,
  completeTaskRecord,
  calculateEfficiencyMetrics,
  createSessionTracker,
  startTask,
  completeTask,
  endSession,
  getSessionSummary,
  getCostProjection,
  checkCostLimits,
  getAtomicDesignInsights,

  // Global state functions
  createCostSession,
  getCostSession,
  trackTask,
  completeTaskGlobal
};