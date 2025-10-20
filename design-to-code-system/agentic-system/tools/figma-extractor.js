/**
 * Figma Design Extractor
 * Fetches Figma designs and analyzes them with AI vision
 * Self-contained within agentic-system directory
 */

import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

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
    colors: z.string().describe('Color properties (background, text, border)'),
    typography: z.string().describe('Font, size, weight, line-height'),
    spacing: z.string().describe('Padding, margin, gap values'),
    borders: z.string().describe('Border radius, width, style'),
    shadows: z.string().nullable().describe('Shadow properties or null if none')
  }).describe('Visual properties of the component'),
  states: z.array(z.string()).describe('Interaction states (default, hover, disabled, etc.)'),
  variants: z.array(z.string()).nullable().describe('Variants if multiple exist, or null'),
  propsRequired: z.array(z.string()).describe('Required props'),
  propsOptional: z.array(z.string()).describe('Optional props'),
  behavior: z.string().describe('Interaction behavior description')
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
 * Fetch Figma screenshot using Figma API
 */
export const fetchFigmaScreenshot = async (fileKey, nodeId, scale = 2) => {
  const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

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
  const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

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

export default extractFigmaDesign;
