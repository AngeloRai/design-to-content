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

    const analysisPrompt = `Analyze this Figma design screenshot AND the detailed node data below. Create a COMPREHENSIVE component specification that captures ALL elements visible in the design.

IMPORTANT:
- Examine the screenshot carefully for ALL text content, UI elements, and visual details
- Cross-reference with the node data structure to identify all children and nested elements
- Do NOT miss any headings, body text, buttons, or other elements
- List EVERY piece of text content you see
- Identify ALL interactive elements (buttons, links, inputs)

Node Data Structure (examine children array carefully):
${JSON.stringify(nodeDataResult.node, null, 2)}

Provide a comprehensive design specification including:

1. **Component Overview**
   - Component name and primary type (button, card, input, icon, typography section, layout, etc.)
   - Purpose and use case

2. **ALL Text Content** (CRITICAL - list every text element you see)
   - Headings (with sizes: h1, h2, h3, etc.)
   - Body text / paragraphs
   - Labels
   - Button text
   - Any other text visible

3. **Visual Properties**
   - Colors (backgrounds, text, borders)
   - Typography (fonts, sizes, weights, line heights)
   - Spacing (padding, margins, gaps)
   - Borders and shadows
   - Border radius

4. **Layout Structure**
   - Container layout (flex, grid, stack)
   - Dimensions and sizing
   - Alignment and positioning
   - Responsive considerations

5. **ALL Interactive Elements**
   - Buttons (list all you see with their text/labels)
   - Links
   - Inputs
   - Any clickable areas

6. **Interactive States**
   - Hover effects
   - Active/pressed states
   - Disabled states
   - Focus states

7. **Variants** (if applicable)
   - Different size options
   - Different style options
   - Different color schemes

8. **Props Needed**
   - What should be configurable
   - Required vs optional props
   - Default values

9. **Behavior**
   - Click handlers
   - Navigation
   - Form submission
   - Any other interactions

Format as a clear, detailed markdown specification with ALL elements accounted for.`;

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
