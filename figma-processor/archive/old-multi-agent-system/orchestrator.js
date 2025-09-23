#!/usr/bin/env node

/**
 * Multi-Agent Orchestrator - Coordinates the entire Figma processing pipeline
 * Manages Discovery → Grouping → Generation → Verification workflow
 */

import { discover } from "./discovery-agent.js";
import { group } from "./grouping-agent.js";
import { checkOpenAIStatus } from "../test/test-openai.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PATHS = {
  dataDir: path.join(__dirname, "data"),
  stateFile: path.join(__dirname, "data", "pipeline-state.json"),
  outputDir: path.join(__dirname, "../nextjs-app/ui/elements"),
};

// Default processing configuration
const DEFAULT_CONFIG = {
  useAI: true,
  openaiApiKey: process.env.OPENAI_API_KEY,
  resumeFrom: null, // 'discovery', 'grouping', 'generation', 'verification'
  skipStages: [], // Skip stages for testing: ['verification']
  batchConfig: {
    maxBatchSize: 10,
    delayBetweenBatches: 1000,
    maxRetries: 3,
  },
  outputDir: PATHS.outputDir,
  saveProgress: true, // Save pipeline state for resumption
};

/**
 * Main orchestrator function - processes entire Figma design system
 * @param {string} figmaUrl - Figma parent node URL to process
 * @param {Object} options - Processing configuration
 */
export async function processDesignSystem(figmaUrl, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };

  console.log(
    "🎭 Multi-Agent Orchestrator: Starting design system processing...\n"
  );
  console.log(`📋 Target URL: ${figmaUrl}`);
  console.log(`🤖 AI Processing: ${config.useAI ? "ENABLED" : "DISABLED"}`);

  if (config.resumeFrom) {
    console.log(`⏮️  Resume Mode: Starting from ${config.resumeFrom} stage`);
  }

  if (config.skipStages.length > 0) {
    console.log(`⏭️  Skip Stages: ${config.skipStages.join(", ")}`);
  }

  console.log("");

  try {
    // Ensure data directory exists
    await fs.mkdir(PATHS.dataDir, { recursive: true });

    // Load or initialize pipeline state
    const state = await loadPipelineState(config);

    // Check OpenAI availability if AI is enabled
    if (config.useAI) {
      await validateOpenAIConnection();
    }

    // Execute pipeline stages
    const pipeline = [
      { name: "discovery", handler: runDiscoveryStage, required: true },
      { name: "grouping", handler: runGroupingStage, required: true },
      { name: "generation", handler: runGenerationStage, required: false },
      { name: "verification", handler: runVerificationStage, required: false },
    ];

    let results = {};

    for (const stage of pipeline) {
      // Skip if resuming from later stage
      if (config.resumeFrom && shouldSkipStage(stage.name, config.resumeFrom)) {
        console.log(`⏭️  Skipping ${stage.name} stage (resume mode)`);
        continue;
      }

      // Skip if explicitly requested
      if (config.skipStages.includes(stage.name)) {
        console.log(`⏭️  Skipping ${stage.name} stage (user requested)`);
        continue;
      }

      // Skip if stage not implemented yet
      if (!stage.required && !isStageImplemented(stage.name)) {
        console.log(`⏭️  Skipping ${stage.name} stage (not implemented yet)`);
        continue;
      }

      console.log(`🎯 === ${stage.name.toUpperCase()} STAGE ===`);

      try {
        const stageResult = await stage.handler(
          figmaUrl,
          config,
          state,
          results
        );
        results[stage.name] = stageResult;

        // Save progress
        if (config.saveProgress) {
          state.completedStages.push(stage.name);
          state.lastCompleted = stage.name;
          state.results = results;
          await savePipelineState(state, config);
        }

        console.log(`✅ ${stage.name} stage completed successfully\n`);
      } catch (error) {
        console.error(`❌ ${stage.name} stage failed:`, error.message);

        // Save error state
        state.errorStage = stage.name;
        state.errorMessage = error.message;
        state.errorTimestamp = new Date().toISOString();
        await savePipelineState(state, config);

        if (stage.required) {
          throw new Error(
            `Required stage '${stage.name}' failed: ${error.message}`
          );
        } else {
          console.log(
            `⚠️  Optional stage '${stage.name}' failed, continuing pipeline...`
          );
        }
      }
    }

    // Generate final report
    const finalReport = await generateFinalReport(results, config);

    console.log(
      "🎉 Multi-Agent Orchestrator: Pipeline completed successfully!"
    );
    console.log(`📊 Final Report: ${finalReport.reportPath}`);

    // Clean up state file on success
    if (config.saveProgress) {
      await cleanupPipelineState(config);
    }

    return finalReport;
  } catch (error) {
    console.error("❌ Multi-Agent Orchestrator failed:", error.message);
    throw error;
  }
}

/**
 * Discovery Stage - UI element discovery and categorization
 */
async function runDiscoveryStage(figmaUrl, config, state, results) {
  console.log("🔍 Running Discovery Agent...");

  const discoveryResult = await discover(figmaUrl, {
    useAI: config.useAI,
    openaiApiKey: config.openaiApiKey,
    batchConfig: config.batchConfig,
  });

  console.log(
    `   📊 Discovered ${Object.keys(discoveryResult.report.uiElements).length} UI categories`
  );
  console.log(
    `   📸 Downloaded ${discoveryResult.report.processingMeta.totalScreenshots} screenshots`
  );

  return discoveryResult;
}

/**
 * Grouping Stage - Variant grouping and component planning
 */
async function runGroupingStage(figmaUrl, config, state, results) {
  console.log("🔄 Running Grouping Agent...");

  // The grouping agent expects a file path, so we need to use the discovery report file
  const discoveryReportPath = results.discovery.reportPath;

  const groupingResult = await group(discoveryReportPath, {
    useAI: config.useAI,
    openaiApiKey: config.openaiApiKey,
  });

  console.log(
    `   📦 Grouped into ${Object.keys(groupingResult.report.components).length} unified components`
  );
  console.log(
    `   🎯 Collapsed ${groupingResult.report.groupingStats.variantsCollapsed} variants`
  );

  return groupingResult;
}

/**
 * Generation Stage - React component generation (placeholder)
 */
async function runGenerationStage(figmaUrl, config, state, results) {
  console.log("⚡ Running Generation Agent...");
  console.log("   🚧 Generation Agent not implemented yet");

  return {
    status: "placeholder",
    message:
      "Generation stage will create React components from component plans",
  };
}

/**
 * Verification Stage - Quality assurance (placeholder)
 */
async function runVerificationStage(figmaUrl, config, state, results) {
  console.log("🔍 Running Verification Agent...");
  console.log("   🚧 Verification Agent not implemented yet");

  return {
    status: "placeholder",
    message: "Verification stage will validate generated components",
  };
}

/**
 * Utility Functions
 */

async function validateOpenAIConnection() {
  console.log("🔄 Validating OpenAI connection...");

  const status = await checkOpenAIStatus();
  if (!status.working) {
    throw new Error(
      `OpenAI API not available: ${status.error || status.statusText}`
    );
  }

  console.log("✅ OpenAI API connection validated\n");
}

async function loadPipelineState(config) {
  if (!config.saveProgress) {
    return createNewPipelineState();
  }

  try {
    const stateContent = await fs.readFile(PATHS.stateFile, "utf8");
    const state = JSON.parse(stateContent);
    console.log(
      `📋 Loaded pipeline state: last completed stage was '${state.lastCompleted}'`
    );
    return state;
  } catch (error) {
    console.log("📋 No existing pipeline state found, starting fresh");
    return createNewPipelineState();
  }
}

function createNewPipelineState() {
  return {
    startedAt: new Date().toISOString(),
    completedStages: [],
    lastCompleted: null,
    errorStage: null,
    errorMessage: null,
    errorTimestamp: null,
    results: {},
  };
}

async function savePipelineState(state, config) {
  if (!config.saveProgress) return;

  state.lastSaved = new Date().toISOString();
  await fs.writeFile(PATHS.stateFile, JSON.stringify(state, null, 2));
}

async function cleanupPipelineState(config) {
  if (!config.saveProgress) return;

  try {
    await fs.unlink(PATHS.stateFile);
    console.log("🧹 Pipeline state cleaned up");
  } catch (error) {
    // Ignore cleanup errors
  }
}

function shouldSkipStage(currentStage, resumeFrom) {
  const stages = ["discovery", "grouping", "generation", "verification"];
  const currentIndex = stages.indexOf(currentStage);
  const resumeIndex = stages.indexOf(resumeFrom);

  return currentIndex < resumeIndex;
}

function isStageImplemented(stageName) {
  // Track which stages are actually implemented
  const implementedStages = ["discovery", "grouping"];
  return implementedStages.includes(stageName);
}

async function generateFinalReport(results, config) {
  const reportPath = path.join(PATHS.dataDir, "final-pipeline-report.json");

  const finalReport = {
    pipelineComplete: true,
    timestamp: new Date().toISOString(),
    configuration: {
      useAI: config.useAI,
      skipStages: config.skipStages,
      batchConfig: config.batchConfig,
    },
    results: {
      stagesCompleted: Object.keys(results),
      discovery: results.discovery
        ? {
            totalUIElements: Object.keys(results.discovery.report.uiElements)
              .length,
            categories: Object.keys(results.discovery.report.uiElements),
            screenshots:
              results.discovery.report.processingMeta.totalScreenshots,
          }
        : null,
      grouping: results.grouping
        ? {
            componentsPlanned: results.grouping.components.length,
            variantsCollapsed: results.grouping.groupingStats.variantsCollapsed,
          }
        : null,
      generation: results.generation || null,
      verification: results.verification || null,
    },
  };

  await fs.writeFile(reportPath, JSON.stringify(finalReport, null, 2));

  return {
    reportPath,
    report: finalReport,
  };
}

// Command-line interface
async function main() {
  const figmaUrl =
    process.argv[2] ||
    "https://www.figma.com/design/zZXMHTFAC05EPwuN6O6W2C/Atomic-Design-System?node-id=29-1058";

  // Parse command-line options
  const options = {};

  if (process.argv.includes("--no-ai")) {
    options.useAI = false;
  }

  if (process.argv.includes("--skip-verification")) {
    options.skipStages = ["verification"];
  }

  const resumeFromIndex = process.argv.indexOf("--resume-from");
  if (resumeFromIndex !== -1 && process.argv[resumeFromIndex + 1]) {
    options.resumeFrom = process.argv[resumeFromIndex + 1];
  }

  try {
    await processDesignSystem(figmaUrl, options);
    console.log(
      "\n🎯 Use this orchestrator for all future testing instead of individual agents!"
    );
  } catch (error) {
    console.error("\n❌ Orchestrator failed:", error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default processDesignSystem;
