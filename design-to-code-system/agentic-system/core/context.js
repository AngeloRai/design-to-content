/**
 * Context Management
 * Simple immutable context for agent workflow
 * No checkpointing - keep it simple
 */

/**
 * Create initial context
 */
export const createContext = (figmaUrl, outputPath = 'nextjs-app/ui') => ({
  figmaUrl,
  outputPath,
  startTime: Date.now(),

  // Loaded resources
  registry: null,
  vectorSearch: null,
  patterns: null,

  // Workflow state
  status: 'initializing', // initializing, running, completed, failed
  currentAction: null,

  // History of events
  history: [],

  // Results
  results: {
    generated: [],
    errors: [],
    validations: []
  }
});

/**
 * Add event to history (immutable)
 */
export const addToHistory = (context, event) => ({
  ...context,
  history: [
    ...context.history,
    {
      ...event,
      timestamp: Date.now()
    }
  ]
});

/**
 * Update context status (immutable)
 */
export const updateStatus = (context, status, currentAction = null) => ({
  ...context,
  status,
  currentAction,
  lastUpdate: Date.now()
});

/**
 * Add loaded resource (immutable)
 */
export const addResource = (context, resourceName, resource) => ({
  ...context,
  [resourceName]: resource
});

/**
 * Add result (immutable)
 */
export const addResult = (context, type, result) => ({
  ...context,
  results: {
    ...context.results,
    [type]: [...context.results[type], result]
  }
});

/**
 * Get duration of workflow
 */
export const getDuration = (context) => {
  return Date.now() - context.startTime;
};

/**
 * Get recent history entries
 */
export const getRecentHistory = (context, count = 5) => {
  return context.history.slice(-count);
};

/**
 * Format context for display
 */
export const formatContext = (context) => {
  return {
    figmaUrl: context.figmaUrl,
    outputPath: context.outputPath,
    status: context.status,
    currentAction: context.currentAction,
    duration: `${Math.round(getDuration(context) / 1000)}s`,
    historyEntries: context.history.length,
    generatedComponents: context.results.generated.length,
    errors: context.results.errors.length,
    hasRegistry: !!context.registry,
    hasVectorSearch: !!context.vectorSearch,
    hasPatterns: !!context.patterns
  };
};

/**
 * CLI - Test context operations
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Testing context operations...\n');

  // Create context
  let context = createContext('https://figma.com/test', 'output/ui');
  console.log('✅ Context created:');
  console.log(formatContext(context));
  console.log('');

  // Add to history
  context = addToHistory(context, {
    agent: 'test',
    action: 'initialize',
    message: 'Starting test'
  });
  console.log('✅ Added to history');
  console.log('');

  // Update status
  context = updateStatus(context, 'running', 'test_action');
  console.log('✅ Status updated:');
  console.log(`  Status: ${context.status}`);
  console.log(`  Current action: ${context.currentAction}`);
  console.log('');

  // Add resource
  context = addResource(context, 'registry', { components: [] });
  console.log('✅ Resource added:');
  console.log(`  Has registry: ${!!context.registry}`);
  console.log('');

  // Add result
  context = addResult(context, 'generated', {
    name: 'TestComponent',
    path: 'output/TestComponent.tsx'
  });
  console.log('✅ Result added:');
  console.log(`  Generated components: ${context.results.generated.length}`);
  console.log('');

  // Simulate some work
  setTimeout(() => {
    context = updateStatus(context, 'completed');
    console.log('✅ Final context:');
    console.log(JSON.stringify(formatContext(context), null, 2));

    console.log('\n📋 Full history:');
    context.history.forEach((entry, i) => {
      console.log(`  ${i + 1}. [${entry.agent}] ${entry.action}: ${entry.message || ''}`);
    });
  }, 100);
}
