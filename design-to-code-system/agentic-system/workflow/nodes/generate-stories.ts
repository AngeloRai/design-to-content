/**
 * Generate Stories Node
 * Creates Storybook stories for all generated components
 * Runs after component generation, before validation
 */

import { generateAllStories } from '../../tools/story-generator.js';
import type { WorkflowState, NodeResult } from '../../types/workflow.js';

export async function generateStoriesNode(state: WorkflowState): Promise<NodeResult> {
  console.log('\n📚 Phase: Generate Stories');
  console.log('='.repeat(60));

  const { registry, outputDir } = state;

  // Check if we have components to generate stories for
  if (!registry || !registry.components) {
    console.log('⚠️  No component registry found, skipping story generation\n');
    return {
      ...state,
      currentPhase: 'validate'
    };
  }

  const totalComponents = Object.values(registry.components)
    .reduce((sum, components) => sum + (components?.length || 0), 0);

  if (totalComponents === 0) {
    console.log('⚠️  No components in registry, skipping story generation\n');
    return {
      ...state,
      currentPhase: 'validate'
    };
  }

  console.log(`Found ${totalComponents} components to generate stories for\n`);

  try {
    // Generate stories using AI-powered analysis
    const results = await generateAllStories(registry, {
      outputDir,
      force: false  // Don't overwrite existing stories
    });

    return {
      ...state,
      currentPhase: 'validate'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Story generation failed:', errorMessage);
    if (errorStack) {
      console.error(errorStack);
    }

    // Continue to validation even if story generation fails
    // Stories are not critical for component generation
    return {
      ...state,
      currentPhase: 'validate'
    };
  }
}
