/**
 * Setup Node
 * Initializes resources needed for component generation
 * Extracted from agent.js lines 247-252
 */

import { scanReferenceComponents } from '../../tools/reference-scanner.js';
import { createVectorSearch } from '../../tools/vector-search.js';
import { buildRegistry } from '../../tools/registry.js';
import type { WorkflowState, NodeResult } from '../../types/workflow.js';

export async function setupNode(state: WorkflowState): Promise<NodeResult> {
  console.log('\n📦 Phase: Setup - Loading Resources');
  console.log('='.repeat(60));

  try {
    // Load reference components for pattern matching with AI analysis
    const referenceComponents = await scanReferenceComponents(null);

    // Create vector search index
    const vectorSearch = await createVectorSearch(referenceComponents);

    // Build registry of existing components
    const registryData = await buildRegistry(state.outputDir);

    // Ensure registry matches ComponentRegistry interface
    const totalComponents = Object.values(registryData.components).flat().length;
    const registry = {
      components: registryData.components,
      importMap: registryData.importMap || {},
      totalCount: totalComponents,
      lastUpdated: typeof registryData.lastUpdated === 'number'
        ? new Date(registryData.lastUpdated).toISOString()
        : new Date().toISOString()
    };
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Setup failed:', errorMessage);
    return {
      ...state,
      currentPhase: 'finalize'
    };
  }
}
