#!/usr/bin/env node

/**
 * Test script for Discovery Agent
 * Usage: node test-discovery.js [figma-url]
 */

import { discover } from "../agents/discovery-agent.js";

async function main() {
  const figmaUrl =
    process.argv[2] ||
    "https://www.figma.com/design/zZXMHTFAC05EPwuN6O6W2C/Atomic-Design-System?node-id=0-1";

  console.log("🧪 Testing Discovery Agent\n");
  console.log(`📋 Target URL: ${figmaUrl}\n`);

  try {
    const result = await discover(figmaUrl);

    console.log("\n📊 DISCOVERY RESULTS:");
    console.log(`   📁 Report: ${result.reportPath}`);
    console.log(
      `   🎯 UI Elements: ${result.report.processingMeta.totalUIElementsFound}`
    );
    console.log(
      `   📸 Screenshots: ${result.report.processingMeta.totalScreenshots}`
    );
    console.log(
      `   ⏭️  Skipped: ${result.report.processingMeta.skippedNodes.length}`
    );

    console.log("\n📂 Elements by Category:");
    Object.keys(result.report.uiElements).forEach((category) => {
      if (result.report.uiElements[category].length > 0) {
        console.log(
          `   • ${category}: ${result.report.uiElements[category].length}`
        );
      }
    });

    console.log("\n🎉 Discovery Agent test completed successfully!");
  } catch (error) {
    console.error("❌ Discovery Agent test failed:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
