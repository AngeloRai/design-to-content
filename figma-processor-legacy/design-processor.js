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
import { auditGeneratedComponents } from './audit-engine.js';
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

    // Optional AI audit step
    let auditResult = null;
    if (context.enableAudit) {
      console.log('\n🔍 AI AUDIT SYSTEM');
      console.log('=' .repeat(30));

      try {
        const auditConfig = {
          enableTypeScriptValidation: context.auditConfig?.enableTypeScriptValidation !== false,
          enableStructureAnalysis: context.auditConfig?.enableStructureAnalysis !== false,
          enableAIAnalysis: context.auditConfig?.enableAIAnalysis || false,
          maxCostPerComponent: context.auditConfig?.maxCostPerComponent || 0.50
        };

        auditResult = await auditGeneratedComponents(generationResult.components, figmaData, auditConfig);

        if (auditResult.overallSuccess) {
          console.log('✅ Audit completed successfully');
        } else {
          console.warn('⚠️ Audit found issues, but components were generated');
        }

      } catch (auditError) {
        console.warn('⚠️ Audit failed, continuing with original components:', auditError.message);
        auditResult = { error: auditError.message, overallSuccess: false };
      }
    }

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
      auditResult,
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
  const screenshotPath = join(__dirname, 'data', 'screenshots', '33-3174.png');

  const context = {
    projectType: 'design-system',
    purpose: 'Generate React components from comprehensive design system',
    enableAudit: true,
    auditConfig: {
      enableTypeScriptValidation: true,
      enableStructureAnalysis: true,
      enableAIAnalysis: true,
      maxCostPerComponent: 1.50
    }
  };

  return await processDesignToCode(screenshotPath, context);
};

/**
 * Test audit functionality with existing UI components
 */
export const testAuditWithExistingComponents = async () => {
  console.log('🧪 Testing Audit with Existing UI Components');
  console.log('=' .repeat(50));

  const { auditGeneratedComponents } = await import('./audit-engine.js');

  // Mock components that represent the UI components
  const mockComponents = [
    {
      name: 'Label',
      path: join(__dirname, '..', 'nextjs-app', 'ui', 'elements', 'Label.tsx'),
      fullPath: join(__dirname, '..', 'nextjs-app', 'ui', 'elements', 'Label.tsx')
    },
    {
      name: 'Button',
      path: join(__dirname, '..', 'nextjs-app', 'ui', 'elements', 'Button.tsx'),
      fullPath: join(__dirname, '..', 'nextjs-app', 'ui', 'elements', 'Button.tsx')
    },
    {
      name: 'TextInput',
      path: join(__dirname, '..', 'nextjs-app', 'ui', 'elements', 'TextInput.tsx'),
      fullPath: join(__dirname, '..', 'nextjs-app', 'ui', 'elements', 'TextInput.tsx')
    }
  ];

  const auditConfig = {
    enableTypeScriptValidation: true,
    enableStructureAnalysis: true,
    enableAIAnalysis: false, // Keep costs low for testing
    enableOverlapDetection: false
  };

  console.log('\n🔍 AI AUDIT SYSTEM');
  console.log('=' .repeat(30));

  try {
    const auditResult = await auditGeneratedComponents(mockComponents, null, auditConfig);

    if (auditResult.overallSuccess) {
      console.log('✅ Audit completed successfully');
    } else {
      console.warn('⚠️ Audit found issues, but components were audited');
    }

    return { auditResult, mockComponents };

  } catch (auditError) {
    console.warn('⚠️ Audit failed:', auditError.message);
    return { error: auditError.message, mockComponents };
  }
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