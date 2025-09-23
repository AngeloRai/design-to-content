#!/usr/bin/env node

/**
 * Quick test for orchestrator - minimal processing for validation
 * Use this for fast testing of orchestrator functionality
 */

import { processDesignSystem } from "../agents/orchestrator.js";

async function main() {
  // Use a smaller test URL or fallback to basic processing
  const testUrl =
    "https://www.figma.com/design/zZXMHTFAC05EPwuN6O6W2C/Atomic-Design-System?node-id=29-1058";

  console.log("⚡ Quick Orchestrator Test\n");

  // Fast test configuration - no AI to avoid API delays
  const quickConfig = {
    useAI: false, // Skip AI for speed
    skipStages: ["generation", "verification"],
    batchConfig: {
      maxBatchSize: 20, // Larger batches for speed
      delayBetweenBatches: 100,
    },
    saveProgress: false, // Skip file I/O for speed
  };

  console.log("⚡ Quick Test Mode: AI disabled, minimal processing");

  try {
    const result = await processDesignSystem(testUrl, quickConfig);

    console.log("\n✅ QUICK TEST RESULTS:");
    console.log(
      `   📊 Stages: ${result.report.results.stagesCompleted.join(" → ")}`
    );

    if (result.report.results.discovery) {
      console.log(
        `   📂 Categories: ${result.report.results.discovery.totalUIElements}`
      );
    }

    console.log("\n🎉 Quick orchestrator test passed!");
    console.log("\n🚀 Now use with AI:");
    console.log("   node test-orchestrator.js (full AI processing)");
    console.log("   node orchestrator.js (command-line interface)");
  } catch (error) {
    console.error("\n❌ Quick test failed:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
