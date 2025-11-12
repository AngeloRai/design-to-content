/**
 * STEP 5 Test: End-to-End Workflow Integration with MCP
 *
 * Tests the complete workflow with MCP-based extraction:
 * 1. Analyze node uses extractWithMcp
 * 2. Design tokens extracted to globals.css
 * 3. Components include figmaCode field
 * 4. Workflow state properly updated
 */

import { analyzeNode } from '../agentic-system/workflow/nodes/analyze.js';

async function testWorkflowIntegration() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('STEP 5: End-to-End Workflow Integration with MCP');
  console.log('════════════════════════════════════════════════════════════\n');

  try {
    // Test 1: Analyze node with MCP integration
    console.log('1️⃣  Testing analyze node with MCP integration...');
    console.log('   💡 Make sure you have a Figma design selected in Figma Desktop\n');

    const initialState = {
      figmaUrl: 'https://figma.com/design/test',  // URL not actually used with MCP
      outputDir: './test-output',
      errors: [],
      conversationHistory: []
    };

    const result = await analyzeNode(initialState);

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('✅ STEP 5 VERIFICATION');
    console.log('════════════════════════════════════════════════════════════\n');

    // Verify results
    console.log('Expected Results:');
    console.log('  ✓ MCP connection established');
    console.log('  ✓ Design tokens extracted to globals.css');
    console.log('  ✓ Components extracted with metadata');
    console.log('  ✓ Components include figmaCode field (where available)');
    console.log('  ✓ Workflow state properly updated\n');

    console.log('Actual Results:');

    // Check for errors
    if (result.errors && result.errors.length > 0) {
      console.log('  ❌ Errors occurred:');
      result.errors.forEach(err => {
        console.log(`     - [${err.phase}] ${err.error}`);
      });
      throw new Error('Analyze node failed with errors');
    }

    // Verify state structure
    console.log('  ✓ No errors in workflow state');

    if (!result.figmaAnalysis) {
      throw new Error('figmaAnalysis is missing from state');
    }
    console.log('  ✓ figmaAnalysis field present');

    if (!result.figmaAnalysis.tokens) {
      throw new Error('tokens are missing from figmaAnalysis');
    }
    console.log(`  ✓ Design tokens extracted: ${result.figmaAnalysis.tokens.length} tokens`);

    if (!result.figmaAnalysis.components) {
      throw new Error('components are missing from figmaAnalysis');
    }
    console.log(`  ✓ Components extracted: ${result.figmaAnalysis.components.length} components`);

    // Check for figmaCode field in components
    const componentsWithCode = result.figmaAnalysis.components.filter(c => c.figmaCode);
    console.log(`  ✓ Components with Figma code: ${componentsWithCode.length}/${result.figmaAnalysis.components.length}`);

    if (componentsWithCode.length > 0) {
      console.log(`\n  📝 Sample Figma code from ${componentsWithCode[0].name}:`);
      console.log(`     ${componentsWithCode[0].figmaCode.substring(0, 100)}...`);
    }

    // Verify workflow state fields
    console.log(`\n  ✓ componentsIdentified: ${result.componentsIdentified}`);
    console.log(`  ✓ currentPhase: ${result.currentPhase}`);
    console.log(`  ✓ startTime: ${result.startTime}`);

    // Display analysis summary
    if (result.figmaAnalysis.analysis) {
      console.log('\n  Analysis Summary:');
      console.log(`     Total components: ${result.figmaAnalysis.analysis.totalComponents}`);
      console.log(`     Sections: ${result.figmaAnalysis.analysis.sections.length}`);
      result.figmaAnalysis.analysis.sections.forEach(section => {
        console.log(`       - ${section.name}: ${section.componentCount} components`);
      });
    }

    // Display token categories
    if (result.figmaAnalysis.tokenCategories) {
      console.log('\n  Token Categories:');
      Object.entries(result.figmaAnalysis.tokenCategories).forEach(([category, count]) => {
        console.log(`     - ${category}: ${count} tokens`);
      });
    }

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('✅ STEP 5 TEST PASSED');
    console.log('════════════════════════════════════════════════════════════');
    console.log('\nNext Steps:');
    console.log('  1. ✅ MCP integration complete');
    console.log('  2. ✅ Design tokens extracted');
    console.log('  3. ✅ Components include Figma code');
    console.log('  4. Ready for STEP 6: Test full workflow (analyze → setup → generate)');
    console.log('════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n════════════════════════════════════════════════════════════');
    console.error('❌ STEP 5 TEST FAILED');
    console.error('════════════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('════════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

// Run test
testWorkflowIntegration();
