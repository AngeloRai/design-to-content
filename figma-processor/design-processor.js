#!/usr/bin/env node

/**
 * MODERNIZED DESIGN-TO-CODE PROCESSOR
 * Uses AI-driven generation routing for intelligent component creation
 * Clean orchestrator that delegates to specialized generators
 */

import "dotenv/config";
import { analyzeScreenshot } from './utils/engines/visual-analysis-engine.js';
import { parseFigmaUrl, fetchFigmaScreenshot, fetchNodeData } from './utils/figma-utils.js';
import { routeComponentGeneration } from './generators/ai-generation-router.js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main processing function - simplified and AI-driven
 */
export const processDesignToCode = async (input, context = {}) => {
  const startTime = Date.now();
  try {
    console.log('\n🚀 AI-DRIVEN DESIGN-TO-CODE PROCESSOR');
    console.log('=' .repeat(50));

    const { screenshotPath, figmaData } = await getScreenshot(input);

    console.log('\n📸 VISUAL ANALYSIS');
    const visualAnalysis = await analyzeScreenshot(screenshotPath, { ...context, figmaData });

    const generationResult = await routeComponentGeneration(visualAnalysis, figmaData);
    const endTime = Date.now();
    const duration = endTime - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    console.log('\n✅ PROCESSING COMPLETE!');
    console.log(`⏱️  Total time: ${durationSeconds}s`);

    const components = Array.isArray(generationResult.components) ? generationResult.components : [];
    const totalComponents = components.length;

    console.log(`Strategy Used: ${generationResult.strategy}`);
    console.log(`Generated ${totalComponents} components:`);

    if (generationResult.stats) {
      console.log(`  📦 Atoms: ${generationResult.stats.atoms}`);
      console.log(`  🧩 Molecules: ${generationResult.stats.molecules}`);
    }

    components.forEach(comp => {
      if (comp && comp.name && comp.path) {
        console.log(`  • ${comp.name} → ${comp.path}`);
      }
    });

    await saveProcessingReport({
      id: `session_${Date.now()}`,
      input,
      screenshotPath,
      figmaData,
      visualAnalysis,
      generationResult,
      timestamp: new Date().toISOString(),
      duration: durationSeconds,
      success: true
    });

    return {
      id: `session_${Date.now()}`,
      screenshotPath,
      figmaData,
      visualAnalysis,
      components: components,
      strategy: generationResult.strategy,
      stats: generationResult.stats,
      status: 'completed',
      duration: durationSeconds,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString()
    };

  } catch (error) {
    console.error('❌ Processing failed:', error.message);

    await saveProcessingReport({
      id: `session_${Date.now()}`,
      input,
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });

    throw error;
  }
};

/**
 * Get screenshot from input (Figma URL or local path)
 */
const getScreenshot = async (input) => {
  const isFigmaUrl = input.includes('figma.com');

  if (isFigmaUrl) {
    console.log('🔗 Fetching from Figma...');

    const { fileKey, nodeId } = parseFigmaUrl(input);
    const screenshotResult = await fetchFigmaScreenshot(fileKey, nodeId);
    console.log('📏 Fetching node data with increased depth for nested components...');
    const nodeDataResult = await fetchNodeData(fileKey, nodeId, 4);

    return {
      screenshotPath: screenshotResult.localPath,
      figmaData: {
        url: input,
        fileKey,
        nodeId,
        screenshot: screenshotResult,
        nodeData: nodeDataResult
      }
    };
  } else {
    return {
      screenshotPath: input,
      figmaData: null
    };
  }
};

/**
 * Save processing report for analysis and debugging
 */
const saveProcessingReport = async (report) => {
  try {
    const reportsDir = join(__dirname, 'data', 'reports');
    const reportPath = join(reportsDir, `processing_${report.id}.json`);

    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved: ${reportPath}`);
  } catch (error) {
    console.warn('⚠️  Could not save processing report:', error.message);
  }
};

/**
 * Test with the design system screenshot
 */
export const testWithDesignSystem = async () => {
  const screenshotPath = join(__dirname, 'data', 'screenshots', '29-1058.png');

  const context = {
    projectType: 'design-system',
    purpose: 'Generate React components from comprehensive design system'
  };

  return await processDesignToCode(screenshotPath, context);
};

/**
 * CLI Interface
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'test':
      console.log('🧪 Testing with design system screenshot...');
      testWithDesignSystem()
        .then(result => {
          console.log('\n🎉 Test completed successfully!');
          console.log(`Generated ${result.components.length} components using ${result.strategy} strategy`);
          console.log(`⏱️  Total time: ${result.duration}s`);
        })
        .catch(error => {
          console.error('\n❌ Test failed:', error.message);
          process.exit(1);
        });
      break;

    case 'process':
      const input = process.argv[3];
      if (!input) {
        console.error('❌ Please provide Figma URL or screenshot path');
        process.exit(1);
      }

      processDesignToCode(input)
        .then(result => {
          console.log('\n🎉 Processing completed successfully!');
          console.log(`Generated ${result.components.length} components using ${result.strategy} strategy`);
          console.log(`⏱️  Total time: ${result.duration}s`);
        })
        .catch(error => {
          console.error('\n❌ Processing failed:', error.message);
          process.exit(1);
        });
      break;

    default:
      console.log(`
🚀 AI-Driven Design-to-Code Processor

Commands:
  test     - Test with design system screenshot
  process  - Process Figma URL or screenshot

Examples:
  node design-processor.js test
  node design-processor.js process "https://figma.com/design/abc?node-id=1:2"
  node design-processor.js process ./screenshot.png
      `);
  }
}

const designProcessor = {
  processDesignToCode,
  testWithDesignSystem
};

export default designProcessor;