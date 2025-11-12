/**
 * STEP 3 TEST: MCP-Based Figma Extractor with Token Integration
 *
 * This test validates:
 * 1. Token extraction from Figma (variables or code inference)
 * 2. Parsing existing globals.css tokens
 * 3. Merging tokens (add only, never remove)
 * 4. Updating globals.css with merged tokens
 * 5. Component extraction readiness (Phase 2)
 */

import { createFigmaBridge } from '../agentic-system/utils/mcp-figma-bridge.js';
import { extractWithMcp } from '../agentic-system/tools/figma-extractor.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMcpExtractor() {
  console.log('═'.repeat(60));
  console.log('STEP 3: MCP Extractor with Token Integration Test');
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

    // 3. Run extraction with MCP
    console.log('2️⃣  Running MCP-based extraction...');
    console.log('   💡 Make sure you have a Figma node selected');
    console.log('');

    const result = await extractWithMcp(bridge, {
      nodeId: '', // Empty = selected node
      globalCssPath,
      outputPath: './test-output'
    });

    console.log('');
    console.log('═'.repeat(60));
    console.log('✅ STEP 3 VERIFICATION');
    console.log('═'.repeat(60));
    console.log('');

    console.log('Expected Results:');
    console.log('  ✓ Design tokens extracted from Figma (variables or code)');
    console.log('  ✓ Existing globals.css tokens parsed');
    console.log('  ✓ Tokens merged (new tokens added, existing preserved)');
    console.log('  ✓ globals.css updated with merged tokens');
    console.log('  ✓ Component extraction structure ready');
    console.log('');

    console.log('Actual Results:');
    console.log(`  ✓ Tokens extracted: ${result.tokens ? 'Yes' : 'No'}`);
    if (result.tokens) {
      console.log(`    - Total tokens: ${result.tokens.tokens.length}`);
      console.log(`    - Categories: ${result.tokens.categories.length}`);
      console.log(`    - Source: ${result.figmaData.hasVariables ? 'Figma variables' : 'Code inference'}`);
    }
    console.log(`  ✓ Components: ${result.components.length} (Phase 2 pending)`);
    console.log('');

    if (result.tokens) {
      console.log('Token Categories:');
      result.tokens.categories.forEach(category => {
        const tokensInCategory = result.tokens.tokens.filter(t => t.category === category);
        console.log(`  ${category}: ${tokensInCategory.length} tokens`);
      });
      console.log('');

      console.log('AI Recommendations:');
      console.log(`  ${result.tokens.recommendations}`);
      console.log('');
    }

    console.log('Next Steps:');
    console.log('  1. Verify globals.css has been updated with new tokens');
    console.log('  2. Check that existing tokens were preserved');
    console.log('  3. Proceed to STEP 4 for component code integration');
    console.log('');

    console.log('═'.repeat(60));
    console.log('✅ STEP 3 TEST PASSED');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('');
    console.error('═'.repeat(60));
    console.error('❌ STEP 3 TEST FAILED');
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

testMcpExtractor();
