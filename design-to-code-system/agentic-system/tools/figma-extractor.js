/**
 * Figma Design Extractor
 * Fetches Figma designs and analyzes them with AI vision
 * Now supports MCP bridge for more efficient data fetching
 * Extracts design tokens first and merges with existing globals.css
 */

import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import path from 'path';
import {
  extractDesignTokens,
  inferTokensFromCode,
  parseGlobalCssTokens,
  mergeTokens,
  updateGlobalCss
} from './design-tokens-extractor.js';

const { env } = '../config/env.config.js'

/**
 * Base64 image format signatures (magic numbers)
 */
const IMAGE_SIGNATURES = {
  PNG: 'iVBORw0KGgo',  // PNG magic number in base64
  JPEG: '/9j/'          // JPEG magic number in base64
};

/**
 * Zod schemas for structured Figma analysis
 */
const ComponentSpecSchema = z.object({
  name: z.string().describe('Component name (e.g., PrimaryButton, TextInput)'),
  atomicLevel: z.enum(['atom', 'molecule', 'organism']).describe('Atomic design classification'),
  type: z.string().describe('Component type (button, input, typography, icon, etc.)'),
  description: z.string().describe('Clear description of this specific component'),
  textContent: z.array(z.string()).describe('All text visible in this component'),
  visualProperties: z.object({
    colors: z.string().describe('PRECISE color properties with approximate HEX values estimated from visual (e.g., "background: ~#1E293B (dark slate), text: ~#FFFFFF (white), border: ~#E5E7EB (light gray)")'),
    typography: z.string().describe('Font, size, weight, line-height'),
    spacing: z.string().describe('Padding, margin, gap values'),
    borders: z.string().describe('Border radius, width, style'),
    shadows: z.string().nullable().describe('Shadow properties or null if none')
  }).describe('Visual properties of the component'),
  states: z.array(z.string()).describe('Interaction states (default, hover, disabled, etc.)'),
  variants: z.array(z.string()).nullable().describe('Variants if multiple exist, or null'),
  propsRequired: z.array(z.string()).describe('Required props'),
  propsOptional: z.array(z.string()).describe('Optional props'),
  behavior: z.string().describe('Interaction behavior description'),
  figmaCode: z.string().nullable().describe('Figma-generated code from get_code (React/HTML/CSS), or null if not available')
});

const FigmaAnalysisSchema = z.object({
  analysis: z.object({
    totalComponents: z.number().describe('Total number of individual components identified'),
    sections: z.array(z.object({
      name: z.string().describe('Section name (e.g., Buttons, Typography, Form Inputs)'),
      componentCount: z.number().describe('Number of components in this section'),
      description: z.string().describe('What this section contains')
    })).describe('Sections/categories if present'),
    needsDeeperFetch: z.boolean().describe('True if visual shows more detail than node data captured'),
    missingElements: z.string().nullable().describe('Description of any elements visible but not in node data, or null')
  }).describe('Overall analysis of the design'),
  components: z.array(ComponentSpecSchema).describe('Array of all individual components')
});

/**
 * Parse Figma URL to extract file key and node ID
 */
export const parseFigmaUrl = (figmaUrl) => {
  const urlPattern = /figma\.com\/(?:file|design)\/([^/]+)\/[^?]*\?.*node-id=([^&]+)/;
  const match = figmaUrl.match(urlPattern);

  if (!match) {
    throw new Error('Invalid Figma URL format. Expected: https://figma.com/file/{fileKey}/...?node-id={nodeId}');
  }

  return {
    fileKey: match[1],
    nodeId: match[2].replace(/-/g, ':') // Convert node ID format (123-456 -> 123:456)
  };
};

/**
 * Parse atomic level URLs from config into processable nodes
 * @param {Object} atomicLevels - Object with atoms, molecules, organisms URLs
 * @returns {Array} Array of {nodeId, level, order} objects
 */
export const parseAtomicLevelUrls = (atomicLevels) => {
  const nodes = [];

  if (atomicLevels.atoms) {
    const { nodeId } = parseFigmaUrl(atomicLevels.atoms);
    nodes.push({ nodeId, level: 'atoms', order: 1 });
  }

  if (atomicLevels.molecules) {
    const { nodeId } = parseFigmaUrl(atomicLevels.molecules);
    nodes.push({ nodeId, level: 'molecules', order: 2 });
  }

  if (atomicLevels.organisms) {
    const { nodeId } = parseFigmaUrl(atomicLevels.organisms);
    nodes.push({ nodeId, level: 'organisms', order: 3 });
  }

  return nodes;
};

/**
 * Fetch Figma screenshot using Figma API
 */
export const fetchFigmaScreenshot = async (fileKey, nodeId, scale = 2) => {
  const FIGMA_ACCESS_TOKEN = env.figma.accessToken;

  if (!FIGMA_ACCESS_TOKEN) {
    throw new Error('FIGMA_ACCESS_TOKEN environment variable is required');
  }

  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&scale=${scale}&format=png`;

  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': FIGMA_ACCESS_TOKEN
    }
  });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.err) {
    throw new Error(`Figma API error: ${data.err}`);
  }

  const imageUrl = data.images[nodeId];

  if (!imageUrl) {
    throw new Error(`No image URL returned for node ${nodeId}`);
  }

  return {
    success: true,
    imageUrl,
    fileKey,
    nodeId
  };
};

/**
 * Fetch Figma node data using Figma API
 */
export const fetchFigmaNodeData = async (fileKey, nodeId) => {
  const FIGMA_ACCESS_TOKEN = env.figma.accessToken;

  if (!FIGMA_ACCESS_TOKEN) {
    throw new Error('FIGMA_ACCESS_TOKEN environment variable is required');
  }

  const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}&depth=5`;

  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': FIGMA_ACCESS_TOKEN
    }
  });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.err) {
    throw new Error(`Figma API error: ${data.err}`);
  }

  const node = data.nodes[nodeId]?.document;

  if (!node) {
    throw new Error(`No node data returned for node ${nodeId}`);
  }

  return {
    success: true,
    node,
    fileKey,
    nodeId
  };
};

/**
 * Extract design specification from Figma using AI vision
 */
export const extractFigmaDesign = async (figmaUrl) => {
  console.log(`🎨 Extracting design from Figma: ${figmaUrl}\n`);

  try {
    // Parse Figma URL
    const { fileKey, nodeId } = parseFigmaUrl(figmaUrl);
    console.log(`   File Key: ${fileKey}`);
    console.log(`   Node ID: ${nodeId}\n`);

    // Fetch screenshot and node data in parallel
    console.log('   📸 Fetching Figma screenshot...');
    console.log('   📊 Fetching node data...\n');

    const [screenshotResult, nodeDataResult] = await Promise.all([
      fetchFigmaScreenshot(fileKey, nodeId, 2),
      fetchFigmaNodeData(fileKey, nodeId)
    ]);

    // Use GPT-4o Vision to analyze the design with structured output
    console.log('   🔍 Analyzing design with GPT-4o Vision (structured output)...\n');

    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0
    }).withStructuredOutput(FigmaAnalysisSchema, {
      name: 'figma_component_analysis'
    });

    const analysisPrompt = `You are analyzing a Figma design to extract React components following ATOMIC DESIGN PRINCIPLES.

🔬 ATOMIC DESIGN METHODOLOGY:
- **Atoms**: Basic UI building blocks (Button, Input, Icon, Typography, etc.)
- **Molecules**: Simple combinations of atoms (SearchBar = Input + Button)
- **Organisms**: Complex components (Header, Card, Form)

YOUR TASK: Extract ALL individual components, RECOGNIZING VARIANTS where appropriate.

CRITICAL ANALYSIS STEPS:

1. VISUAL INVENTORY
   - Examine the screenshot carefully
   - Identify EVERY distinct UI element
   - **LOOK FOR PATTERNS**: If you see multiple similar elements with ONLY visual differences (color, size), these are VARIANTS of the same component
   - Examples of variant patterns:
     * Multiple buttons with different colors → ONE Button component with color variants
     * Multiple badges with different states → ONE Badge component with state variants
     * Multiple search bars with different sizes → ONE SearchBar component with size variants

2. VARIANT DETECTION (CRITICAL)
   - If components have:
     * Same structure and props
     * Same interaction behavior
     * Only differ in: color, size, spacing, or visual style
   - Then they are VARIANTS of a single component
   - Extract as ONE component with populated variants array
   - Example: "SuccessButton", "ErrorButton", "InfoButton" → Extract as ONE component named "Button" or "ToastButton" with variants: ["success", "error", "info"]

3. NODE DATA CROSS-REFERENCE
   - Examine the node data structure below (especially children arrays)
   - Match visual elements to node data
   - If visual shows more elements than node data captured, set needsDeeperFetch=true

4. COMPONENT EXTRACTION
   - For components with variants: Extract ONE component with variants array populated
     * Example: 4 toast buttons → ONE "ToastButton" component with variants: ["success", "error", "warning", "info"]
   - For truly different components: Extract separately
     * Example: TextInput, TextArea, Checkbox are different types → Extract as 3 separate components
   - Typography: Extract each distinct level (Heading, BodyText, Caption, etc.)
   - Use the ACTUAL variant names from the design if visible

Node Data (depth=5):
${JSON.stringify(nodeDataResult.node, null, 2)}

REQUIREMENTS:
- Extract components with variant consolidation where appropriate
- For components with variants, populate the variants array with actual variant names
- For components without variants, set variants to null
- Provide complete visual properties for the BASE/DEFAULT variant
- List all text content found in components
- Identify interaction states (hover, disabled, etc.)
- Be thorough - missing components is unacceptable

COLOR ANALYSIS (CRITICAL):
- ALWAYS estimate HEX values from the visual appearance
- Be PRECISE: distinguish between black (#000000), dark slate (#1E293B), navy (#1E3A8A), and blue (#2563EB)
- Don't default to generic names like "blue" - analyze the actual shade
- Format: "background: ~#1E293B (dark slate)" not just "background: blue"
- If a color looks very dark/black, estimate it as ~#000000 to ~#334155 range, NOT as "blue"
- Use the ~ prefix to indicate these are visual estimations

Return structured data following the schema.`;

    const structuredAnalysis = await model.invoke([
      {
        type: 'human',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: screenshotResult.imageUrl
            }
          },
          {
            type: 'text',
            text: analysisPrompt
          }
        ]
      }
    ]);

    console.log('   ✅ Design analysis complete\n');
    console.log(`   📊 Extracted ${structuredAnalysis.components.length} components:`);
    structuredAnalysis.components.forEach((comp, i) => {
      console.log(`      ${i + 1}. ${comp.name} (${comp.atomicLevel})`);
    });
    console.log();

    if (structuredAnalysis.analysis.needsDeeperFetch) {
      console.log('   ⚠️  Analysis indicates visual has more detail than node data captured');
      console.log('   💡 Consider fetching individual child nodes for more detail\n');
    }

    return {
      componentName: nodeDataResult.node.name,
      componentType: 'components',
      structuredAnalysis,
      figmaData: {
        fileKey,
        nodeId,
        imageUrl: screenshotResult.imageUrl,
        node: nodeDataResult.node
      }
    };

  } catch (error) {
    console.error(`   ❌ Error extracting Figma design: ${error.message}\n`);
    throw error;
  }
};

/**
 * Extract design tokens and components using MCP bridge
 * This is the new recommended approach that:
 * 1. Extracts design tokens first (from variables or code)
 * 2. Merges with existing globals.css (adds only, never removes)
 * 3. Updates globals.css before component generation
 * 4. Extracts components using MCP get_metadata, get_code, get_screenshot
 *
 * @param {Object} mcpBridge - MCP Figma bridge instance
 * @param {Object} options - Extraction options
 * @param {string} options.nodeId - Figma node ID (empty string = selected node)
 * @param {string} options.globalCssPath - Path to globals.css for token merging
 * @param {string} options.outputPath - Path to output directory for generated code
 * @param {boolean} options.isFirstNode - True if this is the first atomic level being processed
 * @param {Array} options.existingTokens - Tokens from previous atomic levels (for merging)
 * @param {string} options.atomicLevel - Atomic level name (atoms, molecules, organisms)
 * @returns {Object} { tokens, components, figmaData }
 */
export async function extractWithMcp(mcpBridge, options = {}) {
  const {
    nodeId = '',
    globalCssPath = null,
    outputPath = null,
    isFirstNode = true,
    existingTokens = [],
    atomicLevel = 'unknown'
  } = options;

  console.log('═'.repeat(60));
  console.log('🎨 Figma Design Extraction with MCP');
  console.log('═'.repeat(60));
  console.log('');

  try {
    // ========================================
    // PHASE 1: Extract Design Tokens
    // ========================================
    console.log('📦 PHASE 1: Design Token Extraction');
    console.log('─'.repeat(60));
    console.log('');

    // Step 1: Try to get Figma variables
    console.log('1️⃣  Fetching Figma variables...');
    const variablesResult = await mcpBridge.callTool('get_variable_defs', {
      nodeId,
      clientLanguages: 'typescript',
      clientFrameworks: 'react'
    });

    let tokenResult = null;
    let hasVariables = false;

    // Parse variables
    if (!variablesResult.isError && variablesResult.content?.[0]?.text) {
      try {
        const variablesData = JSON.parse(variablesResult.content[0].text);
        const varCount = Object.keys(variablesData).length;

        if (varCount > 0) {
          console.log(`   ✅ Found ${varCount} Figma variables`);
          console.log('');

          // Extract tokens from variables
          console.log('2️⃣  Extracting tokens with AI...');

          if (isFirstNode) {
            // First node: extract tokens directly
            tokenResult = await extractDesignTokens(variablesData);
          } else {
            // Subsequent nodes: merge with existing tokens
            const newTokens = await extractDesignTokens(variablesData);

            console.log('');
            console.log('🔀 Merging with existing tokens...');
            console.log(`   Existing: ${existingTokens.length} tokens`);
            console.log(`   New: ${newTokens.tokens.length} tokens`);

            // Import mergeTokens from design-tokens-extractor
            const { mergeTokens } = await import('./design-tokens-extractor.js');
            const merged = mergeTokens(existingTokens, newTokens.tokens);
            const added = merged.length - existingTokens.length;

            console.log(`   ✅ Merged: ${merged.length} total tokens (${added} new)`);

            tokenResult = { tokens: merged, categories: newTokens.categories };
          }

          hasVariables = true;
        } else {
          console.log('   ℹ️  No variables found, will infer from code');
          console.log('');
        }
      } catch (e) {
        console.log('   ℹ️  Could not parse variables, will infer from code');
        console.log('');
      }
    } else {
      console.log('   ℹ️  No variables available, will infer from code');
      console.log('');
    }

    // Step 2: Fallback to code inference if no variables
    if (!hasVariables) {
      console.log('2️⃣  Fetching metadata to find components...');

      const metadataResult = await mcpBridge.callTool('get_metadata', {
        nodeId,
        clientLanguages: 'typescript',
        clientFrameworks: 'react'
      });

      if (metadataResult.isError) {
        throw new Error('Failed to fetch metadata: ' + metadataResult.content?.[0]?.text);
      }

      console.log('   ✅ Metadata fetched');
      console.log('');

      // Parse metadata to get child node IDs
      const metadataXml = metadataResult.content?.[0]?.text || '';
      const nodeIdMatches = metadataXml.match(/id="([^"]+)"/g) || [];
      const childNodeIds = nodeIdMatches
        .map(match => match.match(/id="([^"]+)"/)?.[1])
        .filter(Boolean)
        .slice(0, 5); // Sample 5 components

      console.log(`3️⃣  Fetching code from ${childNodeIds.length} components...`);

      const codeSnippets = [];
      for (const childId of childNodeIds) {
        const codeResult = await mcpBridge.callTool('get_code', {
          nodeId: childId,
          clientLanguages: 'typescript',
          clientFrameworks: 'react'
        });

        if (!codeResult.isError && codeResult.content?.[0]?.text) {
          codeSnippets.push({
            nodeId: childId,
            code: codeResult.content[0].text,
            metadata: {}
          });
        }
      }

      console.log(`   ✅ Fetched code from ${codeSnippets.length} components`);
      console.log('');

      // Infer tokens from code
      console.log('4️⃣  Inferring tokens from code with AI...');
      tokenResult = await inferTokensFromCode(codeSnippets);
    }

    // Step 3: Merge with existing globals.css
    if (globalCssPath && tokenResult) {
      // Only update globals.css if we have tokens
      const tokensToSave = tokenResult.tokens || tokenResult;

      if (tokensToSave && tokensToSave.length > 0) {
        console.log('5️⃣  Updating globals.css...');

        const { tokens: existingGlobalTokens, raw: existingRaw } = await parseGlobalCssTokens(globalCssPath);

        // For first node, merge with whatever is in globals.css
        // For subsequent nodes, tokens are already merged, just update the file
        const finalTokens = isFirstNode
          ? mergeTokens(existingGlobalTokens, tokensToSave)
          : tokensToSave;

        // Update globals.css
        await updateGlobalCss(globalCssPath, finalTokens, existingRaw);
      } else {
        console.log('   ℹ️  No tokens to save');
        console.log('');
      }
    } else if (tokenResult) {
      console.log('   ℹ️  No globals.css path provided, tokens not saved');
      console.log('');
    }

    console.log('✅ PHASE 1 Complete: Design tokens extracted and merged');
    console.log('');

    // ========================================
    // PHASE 2: Extract Components with get_code Integration
    // ========================================
    console.log('📦 PHASE 2: Component Extraction with Code');
    console.log('─'.repeat(60));
    console.log('');

    // Step 1: Get metadata to find child components
    console.log('1️⃣  Fetching metadata to identify components...');
    const metadataResult = await mcpBridge.callTool('get_metadata', {
      nodeId,
      clientLanguages: 'typescript',
      clientFrameworks: 'react'
    });

    if (metadataResult.isError) {
      console.log('   ⚠️  Could not fetch metadata, skipping component extraction');
      console.log('');
      return {
        tokens: tokenResult,
        components: [],
        figmaData: { nodeId, hasVariables }
      };
    }

    const metadataXml = metadataResult.content?.[0]?.text || '';

    // Parse node IDs from metadata
    const nodeIdMatches = metadataXml.match(/id="([^"]+)"/g) || [];
    const childNodeIds = nodeIdMatches
      .map(match => match.match(/id="([^"]+)"/)?.[1])
      .filter(Boolean)
      .filter(id => id !== nodeId) // Exclude parent node
      .slice(0, 10); // Limit to 10 components for now

    console.log(`   ✅ Found ${childNodeIds.length} child components`);
    console.log('');

    // Step 2: Get screenshot for visual analysis
    console.log('2️⃣  Capturing screenshot for visual analysis...');
    const screenshotResult = await mcpBridge.callTool('get_screenshot', {
      nodeId,
      clientLanguages: 'typescript',
      clientFrameworks: 'react'
    });

    let screenshotUrl = null;
    if (!screenshotResult.isError) {
      // Check different possible response formats
      if (screenshotResult.content?.[0]?.text) {
        // Try parsing as JSON
        try {
          const screenshotData = JSON.parse(screenshotResult.content[0].text);
          screenshotUrl = screenshotData.url || screenshotData.imageUrl || screenshotData.screenshot;
        } catch (e) {
          // If not JSON, might be direct URL or base64
          const responseText = screenshotResult.content[0].text;

          // Check if it's base64 image data
          if (responseText.startsWith(IMAGE_SIGNATURES.PNG) || responseText.startsWith(IMAGE_SIGNATURES.JPEG)) {
            const imageFormat = responseText.startsWith(IMAGE_SIGNATURES.PNG) ? 'png' : 'jpeg';
            screenshotUrl = `data:image/${imageFormat};base64,${responseText}`;
            console.log(`   📸 Detected base64 ${imageFormat.toUpperCase()} data, formatting for GPT-4o Vision`);
          } else {
            // Assume it's a direct URL
            screenshotUrl = responseText;
          }
        }
      } else if (screenshotResult.content?.[0]?.data) {
        // Might be in data field
        const responseData = screenshotResult.content[0].data;

        // Check if it's base64 image data
        if (responseData.startsWith(IMAGE_SIGNATURES.PNG) || responseData.startsWith(IMAGE_SIGNATURES.JPEG)) {
          const imageFormat = responseData.startsWith(IMAGE_SIGNATURES.PNG) ? 'png' : 'jpeg';
          screenshotUrl = `data:image/${imageFormat};base64,${responseData}`;
          console.log(`   📸 Detected base64 ${imageFormat.toUpperCase()} data, formatting for GPT-4o Vision`);
        } else {
          screenshotUrl = responseData;
        }
      }

      if (screenshotUrl) {
        console.log('   ✅ Screenshot captured');
      } else {
        console.log('   ⚠️  Screenshot response format not recognized');
        console.log(`   Debug: ${JSON.stringify(screenshotResult).substring(0, 200)}`);
      }
    } else {
      console.log('   ⚠️  Screenshot capture failed');
    }
    console.log('');

    // Step 3: Get code for each component
    console.log('3️⃣  Fetching Figma code for components...');
    const componentCodes = new Map();

    for (const childId of childNodeIds) {
      const codeResult = await mcpBridge.callTool('get_code', {
        nodeId: childId,
        clientLanguages: 'typescript',
        clientFrameworks: 'react'
      });

      if (!codeResult.isError && codeResult.content?.[0]?.text) {
        componentCodes.set(childId, codeResult.content[0].text);
      }
    }

    console.log(`   ✅ Fetched code for ${componentCodes.size} components`);
    console.log('');

    // Step 4: Analyze with AI Vision + Code
    if (screenshotUrl) {
      console.log('4️⃣  Analyzing components with AI (vision + code)...');

      const model = new ChatOpenAI({
        modelName: 'gpt-4o',
        temperature: 0
      }).withStructuredOutput(FigmaAnalysisSchema, {
        name: 'figma_component_analysis'
      });

      // Build code context for AI
      let codeContext = '\n\nFIGMA GENERATED CODE FOR COMPONENTS:\n';
      for (const [nodeId, code] of componentCodes.entries()) {
        codeContext += `\nNode ${nodeId}:\n${code.substring(0, 500)}...\n`;
      }

      // Context-aware prompt based on atomic level
      const atomicLevelGuidance = atomicLevel === 'organisms'
        ? `
🎯 ORGANISM-LEVEL ANALYSIS (${atomicLevel.toUpperCase()}):
**CRITICAL**: You are analyzing ORGANISM components - complex, composite UI sections.

**DO NOT EXTRACT**:
- ❌ Individual text elements (headings, labels, descriptions)
- ❌ Single images or icons
- ❌ Divider lines or decorative elements
- ❌ Individual buttons or inputs (those are atoms/molecules)

**DO EXTRACT**:
- ✅ Complete navigation bars (with logo + menu items + actions)
- ✅ Full header sections (with multiple elements working together)
- ✅ Complete forms (with multiple input fields + labels + buttons)
- ✅ Search sections (with input + filters + buttons combined)
- ✅ Content blocks (with heading + description + images + CTAs)
- ✅ Footer sections (with links + social + info)
- ✅ Card groups or lists (when they form a cohesive section)

**GROUPING RULE**: If elements work together as a functional unit, group them into ONE organism.
Example: "Global Navigation" heading + search bar + user menu → ONE "Navigation" organism`
        : atomicLevel === 'molecules'
        ? `
🎯 MOLECULE-LEVEL ANALYSIS (${atomicLevel.toUpperCase()}):
Extract combinations of 2-3 atoms that work together:
- Search bars (input + button)
- Form fields (label + input + error)
- Cards (image + text + button)
- Navigation items (icon + text + badge)`
        : `
🎯 ATOM-LEVEL ANALYSIS (${atomicLevel.toUpperCase()}):
Extract basic, indivisible UI elements:
- Buttons, inputs, icons, typography
- Single-purpose components
- Recognize variants (sizes, colors, states)`;

      const analysisPrompt = `You are analyzing a Figma design to extract React components following ATOMIC DESIGN PRINCIPLES.

🔬 ATOMIC DESIGN METHODOLOGY:
- **Atoms**: Basic UI building blocks (Button, Input, Icon, Typography, etc.)
- **Molecules**: Simple combinations of atoms (SearchBar = Input + Button)
- **Organisms**: Complex components (Header, Card, Form)

${atomicLevelGuidance}

IMPORTANT: You have access to both:
1. Visual screenshot showing the design
2. Figma-generated code for each component (see below)

Use the code to:
- Understand the component structure and properties
- Extract precise values for spacing, colors, typography
- Identify component hierarchy and relationships
- Validate visual observations with code

${codeContext}

CRITICAL ANALYSIS STEPS:

1. VISUAL INVENTORY
   - Examine the screenshot carefully
   - Identify components appropriate for ${atomicLevel} level
   - **LOOK FOR PATTERNS**: If you see multiple similar elements with ONLY visual differences (color, size), these are VARIANTS of the same component

2. VARIANT DETECTION (CRITICAL)
   - If components have same structure but differ only in color, size, or visual style, extract as ONE component with variants array populated

3. CODE CROSS-REFERENCE
   - Match visual elements to code
   - Use code to understand exact properties
   - Include the relevant code in figmaCode field

4. COMPONENT EXTRACTION
   - For each component, include the Figma-generated code in figmaCode field
   - Extract ONE component with variants where appropriate
   - Set figmaCode to null only if no code is available
   - ${atomicLevel === 'organisms' ? 'Group related elements into composite organisms' : 'Extract individual components'}

Return structured data following the schema.`;

      const structuredAnalysis = await model.invoke([
        {
          type: 'human',
          content: [
            {
              type: 'image_url',
              image_url: { url: screenshotUrl }
            },
            {
              type: 'text',
              text: analysisPrompt
            }
          ]
        }
      ]);

      console.log('   ✅ AI analysis complete');
      console.log(`   📊 Extracted ${structuredAnalysis.components.length} components`);
      console.log('');

      console.log('═'.repeat(60));
      console.log('✅ Extraction Complete');
      console.log('═'.repeat(60));
      console.log('');

      // Return structure compatible with workflow expectations
      return {
        tokens: tokenResult.tokens || [],
        tokenCategories: (tokenResult.tokens || []).reduce((acc, token) => {
          const category = token.category || 'uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}),
        components: structuredAnalysis.components,
        analysis: structuredAnalysis.analysis,
        figmaData: {
          nodeId,
          hasVariables,
          screenshotUrl,
          metadata: metadataXml
        }
      };
    } else {
      console.log('   ⚠️  No screenshot available, skipping visual analysis');
      console.log('');

      return {
        tokens: tokenResult.tokens || [],
        tokenCategories: (tokenResult.tokens || []).reduce((acc, token) => {
          const category = token.category || 'uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}),
        components: [],
        analysis: { totalComponents: 0, sections: [] },
        figmaData: { nodeId, hasVariables }
      };
    }

  } catch (error) {
    console.error('');
    console.error('═'.repeat(60));
    console.error('❌ Extraction Failed');
    console.error('═'.repeat(60));
    console.error('Error:', error.message);
    throw error;
  }
}

export default extractFigmaDesign;
