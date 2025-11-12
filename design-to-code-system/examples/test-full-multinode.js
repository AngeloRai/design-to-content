/**
 * Test full multi-node workflow
 * Runs analyze node with all 3 atomic levels and captures results
 */

import { analyzeNode } from '../agentic-system/workflow/nodes/analyze.js';

async function testFullMultiNode() {
  console.log('═'.repeat(60));
  console.log('Full Multi-Node Workflow Test');
  console.log('═'.repeat(60));
  console.log('');

  const initialState = {
    figmaUrl: undefined, // Will use atomic level URLs from env
    outputDir: './test-output',
    errors: [],
    conversationHistory: []
  };

  try {
    const result = await analyzeNode(initialState);

    console.log('\n═'.repeat(60));
    console.log('📊 RESULTS SUMMARY');
    console.log('═'.repeat(60));

    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(err => {
        console.log(`   [${err.phase}] ${err.error}`);
      });
    } else {
      console.log('\n✅ No errors');
    }

    console.log('\n📦 Tokens:');
    console.log(`   Total: ${result.figmaAnalysis.tokens.length}`);
    console.log(`   Categories:`, Object.keys(result.figmaAnalysis.tokenCategories));

    console.log('\n🎨 Components:');
    console.log(`   Total: ${result.figmaAnalysis.components.length}`);

    // Group by atomic level
    const byLevel = {};
    result.figmaAnalysis.components.forEach(comp => {
      const level = comp.atomicLevel || 'unknown';
      byLevel[level] = (byLevel[level] || 0) + 1;
    });

    Object.entries(byLevel).forEach(([level, count]) => {
      console.log(`   ${level}: ${count} components`);
    });

    console.log('\n📝 Process Log:');
    if (result.figmaAnalysis.processLog) {
      result.figmaAnalysis.processLog.forEach(log => {
        console.log(`   ${log.level.padEnd(12)}: ${log.components} components, +${log.tokensAdded} tokens`);
      });
    }

    console.log('\n═'.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testFullMultiNode();
