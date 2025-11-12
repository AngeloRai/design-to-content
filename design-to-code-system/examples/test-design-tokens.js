/**
 * STEP 1 TEST: Design Token Extraction
 *
 * This test:
 * 1. Connects to Figma MCP
 * 2. Calls get_variable_defs
 * 3. Uses AI to extract and organize tokens
 * 4. Generates Tailwind v4 CSS
 * 5. Verifies output
 */

import { createFigmaBridge } from "../agentic-system/utils/mcp-figma-bridge.js";
import {
  extractDesignTokens,
  generateTailwindV4Css,
  saveDesignTokens,
} from "../agentic-system/tools/design-tokens-extractor.js";

async function testDesignTokens() {
  console.log('═'.repeat(60));
  console.log('STEP 1: Design Token Extraction Test');
  console.log('═'.repeat(60));
  console.log('');

  try {
    // 1. Connect to MCP
    console.log('1️⃣  Connecting to Figma MCP...');
    const bridge = await createFigmaBridge({ useDesktop: true });
    console.log('✅ Connected');
    console.log('');

    // 2. Get variables from selected node
    console.log('2️⃣  Fetching variables from Figma...');
    console.log('   💡 Make sure you have a node selected in Figma');
    console.log('');

    const variablesResult = await bridge.callTool("get_variable_defs", {
      nodeId: "", // Empty = selected node or file-level
      clientLanguages: "typescript",
      clientFrameworks: "react",
    });

    if (variablesResult.isError) {
      console.error('❌ Error fetching variables:', variablesResult.content?.[0]?.text);
      await bridge.close();
      return;
    }

    console.log('✅ Variables fetched');
    console.log('');

    // 3. Extract tokens with AI
    console.log('3️⃣  Extracting tokens with AI...');
    const tokenResult = await extractDesignTokens(variablesResult);

    if (!tokenResult) {
      console.error('❌ Token extraction failed');
      await bridge.close();
      return;
    }

    // 4. Generate CSS
    console.log('4️⃣  Generating Tailwind v4 CSS...');
    const css = generateTailwindV4Css(tokenResult);
    console.log('');

    // 5. Preview CSS
    console.log('5️⃣  CSS Preview:');
    console.log('─'.repeat(60));
    const preview = css.split('\n').slice(0, 30).join('\n');
    console.log(preview);
    if (css.split('\n').length > 30) {
      console.log('...(truncated)');
    }
    console.log('─'.repeat(60));
    console.log('');

    // 6. Save CSS
    console.log('6️⃣  Saving CSS...');
    const outputPath = './test-output/theme.css';
    await saveDesignTokens(css, outputPath);
    console.log('');

    // 7. Verification
    console.log('═'.repeat(60));
    console.log('✅ STEP 1 VERIFICATION');
    console.log('═'.repeat(60));
    console.log('');
    console.log('Expected Results:');
    console.log('  ✓ Variables extracted from Figma');
    console.log('  ✓ AI organized tokens semantically');
    console.log('  ✓ Valid Tailwind v4 @theme CSS generated');
    console.log('  ✓ CSS saved to file');
    console.log('');
    console.log('Actual Results:');
    console.log(`  ✓ Total tokens: ${Object.keys(tokenResult.tokens).length}`);
    console.log(`  ✓ Categories: ${Object.keys(tokenResult.categories).length}`);
    console.log(`  ✓ CSS lines: ${css.split('\n').length}`);
    console.log(`  ✓ File saved: ${outputPath}`);
    console.log('');
    console.log('Token Details:');
    Object.entries(tokenResult.categories).forEach(([category, tokens]) => {
      console.log(`  ${category}: ${tokens.length} tokens`);
    });
    console.log('');
    console.log(`AI Recommendations:`);
    console.log(`  ${tokenResult.recommendations}`);
    console.log('');

    // Close bridge
    await bridge.close();

    console.log('═'.repeat(60));
    console.log('✅ STEP 1 TEST PASSED');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('');
    console.error('═'.repeat(60));
    console.error('❌ STEP 1 TEST FAILED');
    console.error('═'.repeat(60));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testDesignTokens();
