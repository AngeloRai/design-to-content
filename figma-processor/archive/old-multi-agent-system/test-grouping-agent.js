#!/usr/bin/env node

/**
 * Test script for Grouping Agent
 * Processes discovery report to group UI element variants
 */

import { group } from "../agents/grouping-agent.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Path to discovery report
  const discoveryReportPath = path.join(
    __dirname,
    "data",
    "discovery-report.json"
  );

  console.log("🧪 Testing Grouping Agent with Discovery Report\n");
  console.log(`📋 Discovery Report: ${discoveryReportPath}\n`);

  // Check for OpenAI API key
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const useAI = !!openaiApiKey;

  if (useAI) {
    console.log("🤖 AI-powered variant analysis: ENABLED");
  } else {
    console.log("🔧 AI-powered analysis: DISABLED (using basic heuristics)");
    console.log(
      "   💡 Set OPENAI_API_KEY environment variable to enable AI analysis"
    );
  }
  console.log("");

  try {
    const result = await group(discoveryReportPath, {
      useAI,
      openaiApiKey,
    });

    console.log("\n📊 GROUPING RESULTS:");
    console.log(`   📁 Report: ${result.reportPath}`);
    console.log(
      `   🏗️  Component Groups: ${result.report.processingMeta.groupedComponentsCount}`
    );
    console.log(
      `   🔗 Variant Groups: ${result.report.processingMeta.variantGroupsCount}`
    );
    console.log(
      `   📦 Single Components: ${result.report.processingMeta.singleComponentsCount}`
    );
    console.log(
      `   ⭐ Component-Worthy: ${result.report.processingMeta.componentWorthyCount}`
    );

    console.log("\n📂 Component Groups by Category:");
    Object.values(result.report.groupedComponents).forEach((component) => {
      const variantInfo =
        component.type === "variant-group"
          ? ` (${component.variantCount} variants)`
          : " (single)";
      const componentWorthyFlag = component.componentWorthy ? " ⭐" : "";
      console.log(
        `   • ${component.category}: ${component.baseName}${variantInfo}${componentWorthyFlag}`
      );
    });

    // Show detailed variant analysis for variant groups
    const variantGroups = Object.values(result.report.groupedComponents).filter(
      (c) => c.type === "variant-group"
    );
    if (variantGroups.length > 0) {
      console.log("\n🔬 Variant Analysis Details:");
      variantGroups.forEach((group) => {
        console.log(`   📋 ${group.baseName} (${group.category}):`);
        if (group.variants.sizes.length > 0) {
          console.log(`      📏 Sizes: ${group.variants.sizes.join(", ")}`);
        }
        if (group.variants.styles.length > 0) {
          console.log(`      🎨 Styles: ${group.variants.styles.join(", ")}`);
        }
        if (group.variants.states.length > 0) {
          console.log(`      🔄 States: ${group.variants.states.join(", ")}`);
        }
        console.log(`      🎯 Primary: ${group.primaryElement.name}`);
        console.log("");
      });
    }

    console.log("🎉 Grouping Agent test completed successfully!");
    console.log(
      "🔄 Next: Implement Generation Agent to create React components from grouped specifications"
    );
  } catch (error) {
    console.error("❌ Grouping Agent test failed:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
