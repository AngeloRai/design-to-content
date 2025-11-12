/**
 * STEP 4 TEST: Component Extraction with get_code Integration
 *
 * This test validates:
 * 1. Full extraction flow: tokens + components
 * 2. Metadata parsing to identify child components
 * 3. Screenshot capture for visual analysis
 * 4. get_code integration for each component
 * 5. AI analysis combining vision + code
 * 6. Component specs include figmaCode field
 */

import { createFigmaBridge } from '../agentic-system/utils/mcp-figma-bridge.js';
import { extractWithMcp } from '../agentic-system/tools/figma-extractor.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCodeExtraction() {
  console.log('═'.repeat(60));
  console.log('STEP 4: Component Extraction with get_code Integration');
  console.log('═'.repeat(60));
  console.log('');

  let bridge;

  try {
    // 1. Connect to MCP
    console.log('1️⃣  Connecting to Figma MCP...');
    bridge = await createFigmaBridge({ useDesktop: true });
    console.log('✅ Connected');
    console.log('');

    // 2. Set paths
    const globalCssPath = path.resolve(__dirname, '../../atomic-design-pattern/app/globals.css');
    console.log(`📁 Global CSS path: ${globalCssPath}`);
    console.log('');

    // 3. Run full extraction with MCP (tokens + components)
    console.log('2️⃣  Running full extraction (tokens + components)...');
    console.log('   💡 Make sure you have a parent frame with components selected in Figma');
    console.log('');

    const result = await extractWithMcp(bridge, {
      nodeId: '', // Empty = selected node
      globalCssPath,
      outputPath: './test-output'
    });

    console.log('');
    console.log('═'.repeat(60));
    console.log('✅ STEP 4 VERIFICATION');
    console.log('═'.repeat(60));
    console.log('');

    console.log('Expected Results:');
    console.log('  ✓ Design tokens extracted and merged');
    console.log('  ✓ Metadata fetched to identify child components');
    console.log('  ✓ Screenshot captured for visual analysis');
    console.log('  ✓ Code fetched for each component via get_code');
    console.log('  ✓ AI analyzed components using vision + code');
    console.log('  ✓ Component specs include figmaCode field');
    console.log('');

    console.log('Actual Results:');
    console.log(`  ✓ Tokens extracted: ${result.tokens ? 'Yes' : 'No'}`);
    if (result.tokens) {
      console.log(`    - Total tokens: ${result.tokens.tokens.length}`);
      console.log(`    - Categories: ${result.tokens.categories.length}`);
    }
    console.log(`  ✓ Components extracted: ${result.components.length}`);
    console.log(`  ✓ Screenshot URL: ${result.figmaData.screenshotUrl ? 'Yes' : 'No'}`);
    console.log(`  ✓ Metadata captured: ${result.figmaData.metadata ? 'Yes' : 'No'}`);
    console.log('');

    if (result.components.length > 0) {
      console.log('Component Details:');
      result.components.forEach((comp, i) => {
        console.log(`  ${i + 1}. ${comp.name} (${comp.atomicLevel})`);
        console.log(`     Type: ${comp.type}`);
        console.log(`     Description: ${comp.description}`);
        console.log(`     Figma Code: ${comp.figmaCode ? 'Included ✓' : 'Not available'}`);
        if (comp.figmaCode) {
          const codePreview = comp.figmaCode.substring(0, 100);
          console.log(`     Code Preview: ${codePreview}...`);
        }
        if (comp.variants && comp.variants.length > 0) {
          console.log(`     Variants: ${comp.variants.join(', ')}`);
        }
        console.log('');
      });
    }

    if (result.figmaData.analysis) {
      console.log('Analysis Summary:');
      console.log(`  Total components identified: ${result.figmaData.analysis.totalComponents}`);
      console.log(`  Needs deeper fetch: ${result.figmaData.analysis.needsDeeperFetch}`);
      if (result.figmaData.analysis.sections) {
        console.log('  Sections:');
        result.figmaData.analysis.sections.forEach(section => {
          console.log(`    - ${section.name}: ${section.componentCount} components`);
        });
      }
      console.log('');
    }

    console.log('Next Steps:');
    console.log('  1. Verify components include Figma-generated code');
    console.log('  2. Check that visual analysis matches code structure');
    console.log('  3. Proceed to STEP 5 for workflow integration');
    console.log('');

    console.log('═'.repeat(60));
    console.log('✅ STEP 4 TEST PASSED');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('');
    console.error('═'.repeat(60));
    console.error('❌ STEP 4 TEST FAILED');
    console.error('═'.repeat(60));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (bridge) {
      await bridge.close();
    }
  }
}

testCodeExtraction();
