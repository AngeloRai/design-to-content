#!/usr/bin/env node
/**
 * Agentic System - Main Entry Point
 * Orchestrates Figma-to-React component generation using autonomous agent
 */

import dotenv from 'dotenv';
import { runAgent } from './core/agent.js';
import { extractFigmaDesign } from './tools/figma-extractor.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from design-to-code-system directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Main workflow
 */
const main = async () => {
  const args = process.argv.slice(2);

  // Get Figma URL from args or environment
  const figmaUrl = args[0] || process.env.FIGMA_URL;
  const outputDir = args[1] || path.join(__dirname, '..', '..', 'nextjs-app', 'ui');

  if (!figmaUrl) {
    console.log(`
❌ Error: Figma URL is required

Usage: node index.js <figma-url> [output-dir]

Or set FIGMA_URL environment variable:
  FIGMA_URL="https://figma.com/file/abc123/design?node-id=1:2" node index.js

Examples:
  node index.js "https://figma.com/file/abc123/design?node-id=1:2"
  node index.js "https://figma.com/file/abc123/design?node-id=1:2" "../nextjs-app/ui"

Options:
  figma-url    Figma file URL with node-id parameter
  output-dir   Output directory for generated components (default: ../nextjs-app/ui)
`);
    process.exit(1);
  }

  console.log('🚀 Agentic Component Generator');
  console.log('='.repeat(60));
  console.log(`Figma URL: ${figmaUrl}`);
  console.log(`Output Dir: ${outputDir}`);
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Extract design from Figma with structured analysis
    const extractionResult = await extractFigmaDesign(figmaUrl);
    const { structuredAnalysis } = extractionResult;

    // Step 2: Run autonomous agent with structured component data
    const result = await runAgent(structuredAnalysis, outputDir);

    // Step 3: Report success
    console.log('\n' + '='.repeat(60));
    console.log('✅ Component generation complete!');
    console.log('='.repeat(60));
    console.log(`Components identified in Figma: ${structuredAnalysis.components.length}`);
    console.log(`Components actually generated: ${result.componentsGenerated || 'unknown'}`);
    console.log(`Iterations: ${result.iterations}`);
    console.log(`Success: ${result.success ? 'Yes' : 'No (validation errors)'}`);
    console.log(`Output directory: ${outputDir}`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Error during component generation:');
    console.error('='.repeat(60));
    console.error(error);
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
