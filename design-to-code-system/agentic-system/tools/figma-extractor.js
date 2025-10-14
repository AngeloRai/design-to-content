/**
 * Figma Design Extractor
 * Fetches Figma designs and analyzes them with AI vision
 * Self-contained within agentic-system directory
 */

import { ChatOpenAI } from '@langchain/openai';

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

    // Use GPT-4o Vision to analyze the design
    console.log('   🔍 Analyzing design with GPT-4o Vision...\n');

    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0
    });

    const analysisPrompt = `Analyze this Figma design and create a detailed component specification.

Node Data:
${JSON.stringify(nodeDataResult.node, null, 2)}

Provide a comprehensive design specification including:
1. Component name and type (button, card, input, icon, layout, etc.)
2. Visual properties (colors, typography, spacing, borders, shadows)
3. Layout structure (flex, grid, dimensions)
4. Interactive states (hover, active, disabled, focus)
5. Variants (if multiple styles exist)
6. Props needed (what should be configurable)
7. Content (text, images, icons)
8. Behavior (click handlers, navigation, form submission, etc.)

Format as a clear markdown specification.`;

    const response = await model.invoke([
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

    const designSpec = response.content;

    console.log('   ✅ Design analysis complete\n');

    return {
      componentName: nodeDataResult.node.name,
      componentType: 'components',
      designSpec,
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
