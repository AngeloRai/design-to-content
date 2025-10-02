#!/usr/bin/env node

/**
 * FINALIZER NODE
 *
 * Final node in the workflow - summarizes results and exports output
 * Simple node with no AI or tool calls, just aggregates state
 */

import { generateReport } from "../utils/report-generator.js";
import { generateStories } from "../utils/storybook-generator.js";
import { stopStorybookTool } from "../tools/visual-inspection-tools.js";
import path from "path";
import { execSync } from "child_process";

export const finalizerNode = async (state) => {
  console.log("\n🎉 Finalizing workflow...");

  // Cleanup: Stop Storybook if it's running
  try {
    const ports = [6006, 6007, 6008, 6009];
    let stoppedCount = 0;

    for (const port of ports) {
      try {
        const pids = execSync(`lsof -ti:${port} 2>/dev/null || echo ""`).toString().trim();
        if (pids) {
          await stopStorybookTool.invoke({ port });
          stoppedCount++;
        }
      } catch (e) {
        // Port already free
      }
    }

    if (stoppedCount > 0) {
      console.log(`\n🧹 Cleanup: Stopped ${stoppedCount} Storybook process(es)`);
    }
  } catch (cleanupError) {
    console.warn(`⚠️  Cleanup warning: ${cleanupError.message}`);
  }

  try {
    const {
      generatedComponents = [],
      componentStrategy = [],
      visualAnalysis = {},
      errors = [],
      metadata = {},
      outputPath = "nextjs-app/ui",
    } = state;

    // Calculate statistics
    const stats = {
      totalAnalyzed: visualAnalysis.components?.length || 0,
      totalPlanned: componentStrategy.length,
      created: componentStrategy.filter((s) => s.action === "create_new")
        .length,
      updated: componentStrategy.filter((s) => s.action === "update_existing")
        .length,
      skipped: componentStrategy.filter((s) => s.action === "skip").length,
      successfullyGenerated: generatedComponents.length,
      errors: errors.length,
    };

    // Build console summary
    const summary = buildSummaryReport(stats, generatedComponents, errors);
    console.log("\n" + summary);

    // Calculate duration if we have start time
    const duration = metadata.startTime
      ? ((Date.now() - new Date(metadata.startTime).getTime()) / 1000).toFixed(
          2
        )
      : null;

    // Update state with final metadata
    const finalState = {
      ...state,
      currentPhase: "complete",
      status: errors.length > 0 ? "completed_with_errors" : "success",
      metadata: {
        ...metadata,
        endTime: new Date().toISOString(),
        durationSeconds: duration,
        summary: stats,
      },
    };

    // Generate comprehensive reports (markdown + JSON + component inventory)
    try {
      const reportsDir = path.join(process.cwd(), "reports");
      const reportResult = await generateReport(finalState, reportsDir);

      console.log(`\n📄 Reports generated:`);
      console.log(`   - Markdown: ${reportResult.markdownPath}`);
      console.log(`   - JSON: ${reportResult.jsonPath}`);
      console.log(`   - Component Inventory: ${reportResult.inventoryPath}`);
      console.log(
        `   - Total size: ${(
          (reportResult.markdownSize +
            reportResult.jsonSize +
            reportResult.inventorySize) /
          1024
        ).toFixed(2)} KB`
      );

      // Generate Storybook stories from inventory
      let storiesResult = null;
      try {
        const storiesDir = path.join(process.cwd(), "storybook-app", "stories");
        // outputPath is already absolute, use it directly
        const uiBasePath = path.isAbsolute(outputPath)
          ? outputPath
          : path.join(process.cwd(), outputPath);
        storiesResult = await generateStories(
          reportResult.inventoryPath,
          storiesDir,
          uiBasePath
        );

        console.log(`\n📚 Storybook stories generated:`);
        console.log(`   - Generated: ${storiesResult.totalGenerated} stories`);
        console.log(
          `   - Skipped: ${
            storiesResult.totalSkipped || 0
          } (component files not found)`
        );
        console.log(`   - Errors: ${storiesResult.totalErrors}`);

        if (storiesResult.generated.length > 0) {
          console.log(
            `   - Categories: ${[
              ...new Set(storiesResult.generated.map((s) => s.category)),
            ].join(", ")}`
          );
        }

        if (storiesResult.skipped && storiesResult.skipped.length > 0) {
          console.log(`\n   ⚠️  Skipped components (not found on disk):`);
          storiesResult.skipped.forEach((s) => {
            console.log(`      - ${s.category}/${s.name}`);
          });
        }
      } catch (storiesError) {
        console.warn(`⚠️  Failed to generate stories: ${storiesError.message}`);
      }

      return {
        ...finalState,
        reportPaths: {
          markdown: reportResult.markdownPath,
          json: reportResult.jsonPath,
          inventory: reportResult.inventoryPath,
          storiesDir: storiesResult
            ? path.join(process.cwd(), "storybook-app", "stories")
            : null,
        },
      };
    } catch (reportError) {
      console.warn(`⚠️  Failed to generate report: ${reportError.message}`);
      // Don't fail the workflow if report generation fails
      return finalState;
    }
  } catch (error) {
    console.error("❌ Finalization failed:", error.message);
    return {
      errors: [
        {
          message: error.message,
          phase: "finalize",
          timestamp: new Date().toISOString(),
        },
      ],
      status: "error",
    };
  }
};

/**
 * Build human-readable summary report
 */
function buildSummaryReport(stats, generatedComponents, errors) {
  const lines = [];

  lines.push("═══════════════════════════════════════");
  lines.push("  WORKFLOW SUMMARY");
  lines.push("═══════════════════════════════════════");
  lines.push("");

  // Analysis stats
  lines.push("📊 Analysis:");
  lines.push(`   Components identified: ${stats.totalAnalyzed}`);
  lines.push("");

  // Strategy stats
  lines.push("🎯 Strategy:");
  lines.push(`   Create new: ${stats.created}`);
  lines.push(`   Update existing: ${stats.updated}`);
  lines.push(`   Skip: ${stats.skipped}`);
  lines.push("");

  // Generation results
  lines.push("⚙️  Generation:");
  lines.push(
    `   Successfully generated: ${stats.successfullyGenerated}/${stats.created}`
  );

  if (generatedComponents.length > 0) {
    lines.push("");
    lines.push("   Generated components:");
    generatedComponents.forEach((comp) => {
      lines.push(`   ✓ ${comp.name} (${comp.atomicLevel}) → ${comp.filePath}`);
      lines.push(
        `     ${comp.linesOfCode} lines, ${comp.props?.length || 0} props`
      );
    });
  }

  // Errors
  if (errors.length > 0) {
    lines.push("");
    lines.push("⚠️  Errors:");
    errors.forEach((err) => {
      lines.push(`   ✗ [${err.phase}] ${err.message}`);
    });
  }

  lines.push("");
  lines.push("═══════════════════════════════════════");

  return lines.join("\n");
}

export default finalizerNode;
