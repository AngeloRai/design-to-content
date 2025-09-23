#!/usr/bin/env node

/**
 * Test script for Discovery Agent with Atoms parent node
 * Uses AI-powered UI element detection
 */

import { discover } from "../agents/discovery-agent.js";

async function main() {
  // Atoms parent node URL from Figma
  const atomsUrl =
    "https://www.figma.com/design/zZXMHTFAC05EPwuN6O6W2C/Atomic-Design-System?node-id=29-1058";

  console.log("🧪 Testing Discovery Agent with Atoms Parent Node\n");
  console.log(`📋 Target URL: ${atomsUrl}\n`);

  // Check for OpenAI API key
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const useAI = !!openaiApiKey;

  if (useAI) {
    console.log("🤖 AI-powered UI element detection: ENABLED");
  } else {
    console.log("🔧 AI-powered detection: DISABLED (using basic heuristics)");
    console.log(
      "   💡 Set OPENAI_API_KEY environment variable to enable AI detection"
    );
  }
  console.log("");

  try {
    const result = await discover(atomsUrl, {
      useAI,
      openaiApiKey,
    });

    console.log("\n📊 ATOMS DISCOVERY RESULTS:");
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

    console.log("\n📂 Atoms by Category:");
    Object.keys(result.report.uiElements).forEach((category) => {
      if (result.report.uiElements[category].length > 0) {
        console.log(
          `   • ${category}: ${result.report.uiElements[category].length} elements`
        );
      }
    });

    if (result.report.processingMeta.skippedNodes.length > 0) {
      console.log("\n🚫 Skipped Elements:");
      result.report.processingMeta.skippedNodes
        .slice(0, 5)
        .forEach((skipped) => {
          console.log(`   • "${skipped.name}" (${skipped.reason})`);
        });
      if (result.report.processingMeta.skippedNodes.length > 5) {
        console.log(
          `   • ... and ${result.report.processingMeta.skippedNodes.length - 5} more`
        );
      }
    }

    console.log("\n🎉 Atoms Discovery test completed successfully!");
    console.log(
      "🔄 Next: Implement Grouping Agent to process this discovery report"
    );
  } catch (error) {
    console.error("❌ Atoms Discovery test failed:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
