/**
 * Analyze Node
 * Extracts and analyzes Figma design to identify components
 */

import { extractFigmaDesign } from '../../tools/figma-extractor.js';

export async function analyzeNode(state) {
  console.log('\n📊 Phase: Figma Analysis');
  console.log('='.repeat(60));
  console.log('DEBUG - Received state:', JSON.stringify(state, null, 2));

  try {
    const { figmaUrl, outputDir } = state;

    console.log('DEBUG - figmaUrl extracted:', figmaUrl);
    console.log('DEBUG - outputDir extracted:', outputDir);

    if (!figmaUrl) {
      throw new Error('Figma URL is required (set FIGMA_URL env var or provide via Studio)');
    }

    console.log(`Analyzing Figma design: ${figmaUrl}`);

    // Extract design from Figma with structured analysis
    const extractionResult = await extractFigmaDesign(figmaUrl);
    const { structuredAnalysis } = extractionResult;

    console.log(`✅ Extracted ${structuredAnalysis.components.length} components`);
    console.log(`   Analysis: ${structuredAnalysis.analysis.totalComponents} total components`);
    console.log(`   Sections: ${structuredAnalysis.analysis.sections.length} sections`);
    console.log('='.repeat(60) + '\n');

    return {
      ...state,
      figmaAnalysis: structuredAnalysis,
      componentsIdentified: structuredAnalysis.components.length,
      startTime: new Date().toISOString(),
      currentPhase: 'setup'
    };
  } catch (error) {
    console.error('❌ Figma analysis failed:', error.message);
    console.error(error.stack);
    return {
      ...state,
      errors: [...state.errors, { phase: 'analyze', error: error.message }],
      success: false,
      currentPhase: 'finalize'
    };
  }
}
