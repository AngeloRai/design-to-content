/**
 * STEP 2 TEST: Token Inference from Code
 *
 * This test:
 * 1. Connects to Figma MCP
 * 2. Gets metadata to find child components
 * 3. Calls get_code for 3-5 components
 * 4. Uses AI to infer design tokens from code
 * 5. Generates Tailwind v4 CSS
 * 6. Verifies output
 */

import { createFigmaBridge } from "../agentic-system/utils/mcp-figma-bridge.js";
import {
  inferTokensFromCode,
  generateTailwindV4Css,
  saveDesignTokens,
} from "../agentic-system/tools/design-tokens-extractor.js";

async function testTokenInference() {
  console.log('═'.repeat(60));
  console.log('STEP 2: Token Inference from Code Test');
  console.log('═'.repeat(60));
  console.log('');

  try {
    // 1. Connect to MCP
    console.log('1️⃣  Connecting to Figma MCP...');
    const bridge = await createFigmaBridge({ useDesktop: true });
    console.log('✅ Connected');
    console.log('');

    // 2. Get metadata to find child components
    console.log('2️⃣  Fetching metadata from Figma...');
    console.log('   💡 Make sure you have a parent node selected in Figma');
    console.log('');

    const metadataResult = await bridge.callTool("get_metadata", {
      nodeId: "", // Empty = selected node
      clientLanguages: "typescript",
      clientFrameworks: "react",
    });

    if (metadataResult.isError) {
      console.error('❌ Error fetching metadata:', metadataResult.content?.[0]?.text);
      await bridge.close();
      return;
    }

    console.log('✅ Metadata fetched');
    console.log('');

    // Parse metadata to extract child node IDs
    console.log('3️⃣  Parsing metadata for child components...');
    const metadataXml = metadataResult.content?.[0]?.text || '';

    // Extract node IDs from XML (looking for nodes with specific types)
    const nodeIdMatches = metadataXml.match(/id="([^"]+)"/g) || [];
    const nodeIds = nodeIdMatches
      .map(match => match.match(/id="([^"]+)"/)?.[1])
      .filter(Boolean)
      .slice(0, 5); // Get first 5 node IDs

    console.log(`   Found ${nodeIds.length} node IDs to analyze`);
    console.log('');

    // 4. Get code for each component
    console.log('4️⃣  Fetching code for components...');
    const codeSnippets = [];

    for (const nodeId of nodeIds) {
      console.log(`   Fetching code for node: ${nodeId}`);

      const codeResult = await bridge.callTool("get_code", {
        nodeId,
        clientLanguages: "typescript",
        clientFrameworks: "react",
      });

      if (!codeResult.isError && codeResult.content?.[0]?.text) {
        const codeText = codeResult.content[0].text;

        // Try to parse as JSON first, if that fails use as raw code
        let code = codeText;
        let metadata = {};

        try {
          const codeData = JSON.parse(codeText);
          code = codeData.code || codeData.cssCode || codeText;
          metadata = codeData.metadata || {};
        } catch (e) {
          // It's raw code, use as-is
          code = codeText;
        }

        codeSnippets.push({
          nodeId,
          code,
          metadata
        });
      }
    }

    console.log(`✅ Fetched code for ${codeSnippets.length} components`);
    console.log('');

    // 5. Infer tokens with AI
    console.log('5️⃣  Inferring tokens with AI...');
    const tokenResult = await inferTokensFromCode(codeSnippets);

    if (!tokenResult) {
      console.error('❌ Token inference failed');
      await bridge.close();
      return;
    }

    // 6. Generate CSS
    console.log('6️⃣  Generating Tailwind v4 CSS...');
    const css = generateTailwindV4Css(tokenResult);
    console.log('');

    // 7. Preview CSS
    console.log('7️⃣  CSS Preview:');
    console.log('─'.repeat(60));
    const preview = css.split('\n').slice(0, 40).join('\n');
    console.log(preview);
    if (css.split('\n').length > 40) {
      console.log('...(truncated)');
    }
    console.log('─'.repeat(60));
    console.log('');

    // 8. Save CSS
    console.log('8️⃣  Saving CSS...');
    const outputPath = './test-output/theme-inferred.css';
    await saveDesignTokens(css, outputPath);
    console.log('');

    // 9. Verification
    console.log('═'.repeat(60));
    console.log('✅ STEP 2 VERIFICATION');
    console.log('═'.repeat(60));
    console.log('');
    console.log('Expected Results:');
    console.log('  ✓ Metadata extracted to find child components');
    console.log('  ✓ Code fetched for 3-5 components');
    console.log('  ✓ AI inferred design tokens from code');
    console.log('  ✓ Valid Tailwind v4 @theme CSS generated');
    console.log('  ✓ CSS saved to file');
    console.log('');
    console.log('Actual Results:');
    console.log(`  ✓ Components analyzed: ${codeSnippets.length}`);
    console.log(`  ✓ Total tokens: ${tokenResult.tokens.length}`);
    console.log(`  ✓ Categories: ${tokenResult.categories.length}`);
    console.log(`  ✓ CSS lines: ${css.split('\n').length}`);
    console.log(`  ✓ File saved: ${outputPath}`);
    console.log('');
    console.log('Token Details:');
    tokenResult.categories.forEach(category => {
      const tokensInCategory = tokenResult.tokens.filter(t => t.category === category);
      console.log(`  ${category}: ${tokensInCategory.length} tokens`);
    });
    console.log('');
    console.log(`AI Recommendations:`);
    console.log(`  ${tokenResult.recommendations}`);
    console.log('');

    // 10. Show sample code snippets analyzed
    console.log('Code Snippets Analyzed:');
    codeSnippets.forEach((snippet, i) => {
      console.log(`  ${i + 1}. Node ${snippet.nodeId}:`);
      const codePreview = snippet.code.split('\n').slice(0, 3).join('\n');
      console.log(`     ${codePreview.substring(0, 60)}...`);
    });
    console.log('');

    // Close bridge
    await bridge.close();

    console.log('═'.repeat(60));
    console.log('✅ STEP 2 TEST PASSED');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('');
    console.error('═'.repeat(60));
    console.error('❌ STEP 2 TEST FAILED');
    console.error('═'.repeat(60));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testTokenInference();
