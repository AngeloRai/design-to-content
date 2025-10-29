/**
 * Generate Stories Node
 * Creates Storybook stories for all generated components
 * Runs after component generation, before validation
 */

import { generateAllStories } from '../../tools/story-generator.js';

export async function generateStoriesNode(state) {
  console.log('\n📚 Phase: Generate Stories');
  console.log('='.repeat(60));

  const { registry, outputDir } = state;

  // Check if we have components to generate stories for
  if (!registry || !registry.components) {
    console.log('⚠️  No component registry found, skipping story generation\n');
    return {
      ...state,
      storiesGenerated: false,
      currentPhase: 'validate'
    };
  }

  const totalComponents = Object.values(registry.components)
    .reduce((sum, components) => sum + (components?.length || 0), 0);

  if (totalComponents === 0) {
    console.log('⚠️  No components in registry, skipping story generation\n');
    return {
      ...state,
      storiesGenerated: false,
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
      storiesGenerated: true,
      storyResults: {
        success: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
        totalStories: results.totalStories
      },
      currentPhase: 'validate'
    };

  } catch (error) {
    console.error('❌ Story generation failed:', error.message);
    console.error(error.stack);

    // Continue to validation even if story generation fails
    // Stories are not critical for component generation
    return {
      ...state,
      storiesGenerated: false,
      storyGenerationError: error.message,
      currentPhase: 'validate'
    };
  }
}
