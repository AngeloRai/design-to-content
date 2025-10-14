/**
 * Reference Component Scanner
 * Scans and analyzes reference components for pattern matching
 * These are HIGH-QUALITY human-written components we want AI to follow
 */

import fs from 'fs/promises';
import path from 'path';
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";


// Zod schema for AI-extracted metadata
const ComponentMetadataSchema = z.object({
  description: z.string().describe("Brief description of what this component does"),
  props: z.array(z.string()).describe("List of prop names accepted by this component"),
  hasVariants: z.boolean().describe("Whether component has multiple visual variants"),
  isInteractive: z.boolean().describe("Whether component handles user interactions (clicks, hover, etc)"),
  dependencies: z.array(z.string()).describe("Names of other components this component imports"),
  purpose: z.string().describe("Primary purpose: button, input, container, card, icon, navigation, form, layout, etc")
});

/**
 * Extract metadata from component using AI
 */
const extractComponentMetadata = async (filePath) => {
  try {
    const code = await fs.readFile(filePath, 'utf-8');

    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0
    }).withStructuredOutput(ComponentMetadataSchema);

    const prompt = `Analyze this React component and extract metadata.

Component code:
\`\`\`tsx
${code}
\`\`\`

Extract:
- description: What this component does (1-2 sentences)
- props: List of prop names (just the names, not types)
- hasVariants: Does it have visual variants? (true/false)
- isInteractive: Does it handle user interactions? (true/false)
- dependencies: What other components does it import?
- purpose: Primary purpose (button, input, container, card, icon, navigation, form, layout, etc)`;

    const metadata = await model.invoke(prompt);
    return metadata;
  } catch (error) {
    console.error(`Error extracting metadata from ${filePath}:`, error.message);
    return {
      description: '',
      props: [],
      hasVariants: false,
      isInteractive: false,
      dependencies: [],
      purpose: ''
    };
  }
};

/**
 * Scan reference directory for components
 */
const scanReferenceDirectory = async (dir) => {
  const components = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recurse into subdirectories
        const subComponents = await scanReferenceDirectory(fullPath);
        components.push(...subComponents);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
        // Determine type from directory structure
        const parentDir = path.basename(path.dirname(fullPath));
        const type = ['components', 'elements', 'icons', 'modules'].includes(parentDir)
          ? parentDir
          : 'components';

        const name = entry.name.replace(/\.(tsx|jsx)$/, '');

        components.push({
          name,
          type,
          path: fullPath,
          relativePath: path.relative(process.cwd(), fullPath)
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }

  return components;
};

/**
 * Scan and analyze all reference components
 * @param {string} referenceDir - Path to reference component directory
 * @param {boolean} useAI - Whether to use AI for metadata extraction (default: false)
 * @returns {Array} - Array of analyzed components
 */
export const scanReferenceComponents = async (referenceDir = null, useAI = false) => {
  const defaultPath = referenceDir || path.join(process.cwd(), 'reference', 'reference-app', 'ui');

  console.log(`🔍 Scanning reference components from: ${defaultPath}\n`);

  const components = await scanReferenceDirectory(defaultPath);

  if (components.length === 0) {
    console.log('⚠️  No reference components found');
    return [];
  }

  if (!useAI) {
    // Simple mode: just return components with basic info
    console.log(`✅ Found ${components.length} reference components (simple mode - no AI analysis)\n`);
    return components.map(comp => ({
      ...comp,
      description: `Reference ${comp.type} component`,
      props: [],
      hasVariants: false,
      isInteractive: comp.type === 'elements' || comp.name.toLowerCase().includes('button') || comp.name.toLowerCase().includes('cta'),
      dependencies: [],
      purpose: comp.type === 'icons' ? 'icon' : comp.type.slice(0, -1) // Remove 's' from type
    }));
  }

  console.log(`Found ${components.length} reference components, analyzing with AI...\n`);

  // Extract metadata for each component using AI
  const analyzed = [];
  for (const comp of components) {
    console.log(`  Analyzing ${comp.type}/${comp.name}...`);
    const metadata = await extractComponentMetadata(comp.path);

    analyzed.push({
      ...comp,
      ...metadata
    });
  }

  console.log(`\n✅ Analyzed ${analyzed.length} reference components\n`);

  return analyzed;
};

/**
 * CLI - Test reference scanner
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Testing reference scanner (simple mode)...\n');

  // Test simple mode (no AI)
  scanReferenceComponents(null, false).then(components => {
    console.log('📋 Reference components by type:\n');

    const byType = components.reduce((acc, comp) => {
      if (!acc[comp.type]) acc[comp.type] = [];
      acc[comp.type].push(comp);
      return acc;
    }, {});

    Object.entries(byType).forEach(([type, comps]) => {
      console.log(`  ${type}: ${comps.length} components`);
      comps.slice(0, 3).forEach(c => {
        console.log(`    - ${c.name}`);
      });
      if (comps.length > 3) {
        console.log(`    ... and ${comps.length - 3} more`);
      }
      console.log('');
    });

    console.log(`📊 Total: ${components.length} reference components scanned\n`);

  }).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}
