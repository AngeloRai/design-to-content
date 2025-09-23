#!/usr/bin/env node

/**
 * Test script for the Multi-Agent Orchestrator
 * Replaces individual agent test files with unified testing interface
 */

import { processDesignSystem } from '../agents/orchestrator.js';

async function main() {
    // Atoms parent node URL from Figma
    const atomsUrl = 'https://www.figma.com/design/zZXMHTFAC05EPwuN6O6W2C/Atomic-Design-System?node-id=29-1058';

    console.log('🧪 Testing Multi-Agent Orchestrator\n');
    console.log(`📋 Target URL: ${atomsUrl}\n`);

    // Test configuration
    const testConfig = {
        useAI: !!process.env.OPENAI_API_KEY,
        skipStages: ['generation', 'verification'], // Skip unimplemented stages for now
        batchConfig: {
            maxBatchSize: 5,  // Smaller batches for testing
            delayBetweenBatches: 500
        },
        saveProgress: true
    };

    console.log('🔧 Test Configuration:');
    console.log(`   🤖 AI Processing: ${testConfig.useAI ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   ⏭️  Skip Stages: ${testConfig.skipStages.join(', ')}`);
    console.log(`   📦 Batch Size: ${testConfig.batchConfig.maxBatchSize}`);
    console.log('');

    try {
        const result = await processDesignSystem(atomsUrl, testConfig);

        console.log('\n🎉 ORCHESTRATOR TEST RESULTS:');
        console.log(`   📁 Final Report: ${result.reportPath}`);
        console.log(`   🎯 Stages Completed: ${result.report.results.stagesCompleted.join(' → ')}`);

        if (result.report.results.discovery) {
            console.log(`   📊 UI Elements: ${result.report.results.discovery.totalUIElements} categories`);
            console.log(`   📸 Screenshots: ${result.report.results.discovery.screenshots}`);
        }

        if (result.report.results.grouping) {
            console.log(`   📦 Components: ${result.report.results.grouping.componentsPlanned} planned`);
            console.log(`   🎯 Variants: ${result.report.results.grouping.variantsCollapsed} collapsed`);
        }

        console.log('\n✅ Multi-Agent Orchestrator test completed successfully!');
        console.log('\n🚀 Next Steps:');
        console.log('   • Run: node orchestrator.js (for full pipeline)');
        console.log('   • Run: node orchestrator.js --skip-verification (skip unimplemented stages)');
        console.log('   • Run: node orchestrator.js --resume-from grouping (resume from specific stage)');

    } catch (error) {
        console.error('\n❌ Orchestrator test failed:', error.message);
        process.exit(1);
    }
}

main().catch(console.error);