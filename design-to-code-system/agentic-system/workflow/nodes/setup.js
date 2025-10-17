/**
 * Setup Node
 * Initializes resources needed for component generation
 * Extracted from agent.js lines 247-252
 */

import { scanReferenceComponents } from '../../tools/reference-scanner.js';
import { createVectorSearch } from '../../tools/vector-search.js';
import { buildRegistry } from '../../tools/registry.js';

export async function setupNode(state) {
  console.log('\n📦 Phase: Setup - Loading Resources');
  console.log('='.repeat(60));

  try {
    // Load reference components for pattern matching with AI analysis
    const referenceComponents = await scanReferenceComponents(null);

    // Create vector search index
    const vectorSearch = await createVectorSearch(referenceComponents);

    // Build registry of existing components
    const registry = await buildRegistry(state.outputDir);

    const totalComponents = Object.values(registry.components).flat().length;
    console.log(`✅ Loaded ${referenceComponents.length} reference components`);
    console.log(`✅ Found ${totalComponents} existing components`);
    console.log('='.repeat(60) + '\n');

    return {
      ...state,
      referenceComponents,
      vectorSearch,
      registry,
      currentPhase: 'generate'
    };
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return {
      ...state,
      errors: [...state.errors, { phase: 'setup', error: error.message }],
      success: false
    };
  }
}
