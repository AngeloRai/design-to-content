#!/usr/bin/env node

/**
 * FIGMA UTILITIES FOR VISUAL-FIRST SYSTEM
 * Clean functional utilities for Figma API integration
 * Supports visual-first workflow: screenshots first, node data for precision
 */

import "dotenv/config";
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const FIGMA_API_BASE = 'https://api.figma.com/v1';
const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

if (!FIGMA_TOKEN) {
  console.warn('⚠️  FIGMA_ACCESS_TOKEN not found. Figma API features will be disabled.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generic Figma API call helper
 */
export const callFigmaAPI = async (endpoint, params = {}) => {
  if (!FIGMA_TOKEN) {
    throw new Error('FIGMA_ACCESS_TOKEN is required for Figma API calls');
  }

  const queryString = new URLSearchParams(params).toString();
  const url = `${FIGMA_API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': FIGMA_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} - ${await response.text()}`);
  }

  return await response.json();
};

/**
 * Extract file key and node ID from Figma URL
 */
export const parseFigmaUrl = (figmaUrl) => {
  try {
    // Handle different Figma URL formats
    const urlMatch = figmaUrl.match(/design\/([a-zA-Z0-9]+).*node-id=([0-9%A-F-:]+)/i);
    if (!urlMatch) {
      throw new Error('Invalid Figma URL format');
    }

    const fileKey = urlMatch[1];
    let nodeId = urlMatch[2];

    // Convert URL-encoded node ID (123%3A456) to Figma format (123:456)
    try {
      nodeId = decodeURIComponent(nodeId);
      // Handle both formats: 123-456 and 123:456
      nodeId = nodeId.includes('-') ? nodeId.replace('-', ':') : nodeId;
    } catch {
      // If decoding fails, try direct replacement
      nodeId = nodeId.replace('%3A', ':').replace('-', ':');
    }

    return { fileKey, nodeId };
  } catch (error) {
    throw new Error(`Failed to parse Figma URL: ${error.message}`);
  }
};

/**
 * Get screenshot from Figma node - PRIMARY tool for visual analysis
 */
export const fetchFigmaScreenshot = async (fileKey, nodeId, options = {}) => {
  const { scale = 2, format = 'png' } = options;

  try {
    console.log(`📸 Fetching screenshot for node ${nodeId}...`);

    const data = await callFigmaAPI(`/images/${fileKey}`, {
      ids: nodeId,
      scale,
      format,
    });

    if (!data.images || !data.images[nodeId]) {
      throw new Error(`No screenshot available for node ${nodeId}`);
    }

    const imageUrl = data.images[nodeId];

    // Download and save locally
    const screenshotsDir = join(__dirname, '..', 'data', 'screenshots');
    if (!existsSync(screenshotsDir)) {
      mkdirSync(screenshotsDir, { recursive: true });
    }

    const filename = `${nodeId.replace(':', '-')}.${format}`;
    const localPath = join(screenshotsDir, filename);

    await downloadImage(imageUrl, localPath);

    console.log(`✅ Screenshot saved: ${filename}`);

    return {
      success: true,
      imageUrl,
      localPath,
      filename,
      metadata: {
        fileKey,
        nodeId,
        scale,
        format
      }
    };
  } catch (error) {
    console.error(`❌ Screenshot fetch failed:`, error.message);
    throw error;
  }
};

/**
 * Get node data for measurements - SECONDARY tool for precision
 */
export const fetchNodeData = async (fileKey, nodeId, depth = 4) => {
  try {
    console.log(`📏 Fetching node data (depth: ${depth}) for comprehensive component discovery...`);

    const data = await callFigmaAPI(`/files/${fileKey}/nodes`, {
      ids: nodeId,
      depth,
    });

    if (!data.nodes || !data.nodes[nodeId]) {
      throw new Error(`Node ${nodeId} not found in file ${fileKey}`);
    }

    const node = data.nodes[nodeId].document;

    // Extract key measurements for AI
    const measurements = extractMeasurements(node);

    // Count nested components for visibility
    const nestedStats = countNestedComponents(node);
    console.log(`✅ Node data extracted: ${nestedStats.totalNodes} nodes, ${nestedStats.frames} frames, ${nestedStats.textNodes} text nodes`);

    return {
      success: true,
      node,
      measurements,
      metadata: {
        fileKey,
        nodeId,
        name: node.name,
        type: node.type,
        depth,
        nestedStats
      }
    };
  } catch (error) {
    console.error(`❌ Node data fetch failed:`, error.message);
    throw error;
  }
};

/**
 * Count nested components for visibility into traversal depth
 */
const countNestedComponents = (node) => {
  const stats = { totalNodes: 0, frames: 0, textNodes: 0, components: 0, instances: 0 };

  const traverse = (currentNode) => {
    if (!currentNode) return;

    stats.totalNodes++;

    switch (currentNode.type) {
      case 'FRAME':
        stats.frames++;
        break;
      case 'TEXT':
        stats.textNodes++;
        break;
      case 'COMPONENT':
        stats.components++;
        break;
      case 'INSTANCE':
        stats.instances++;
        break;
    }

    if (currentNode.children) {
      currentNode.children.forEach(traverse);
    }
  };

  traverse(node);
  return stats;
};

/**
 * Extract key measurements from Figma node
 */
const extractMeasurements = (node) => {
  const measurements = {};

  // Dimensions
  if (node.absoluteBoundingBox) {
    measurements.dimensions = {
      width: Math.round(node.absoluteBoundingBox.width),
      height: Math.round(node.absoluteBoundingBox.height)
    };
  }

  // Colors (fills and strokes)
  if (node.fills && node.fills.length > 0) {
    measurements.colors = node.fills.map(fill => {
      if (fill.type === 'SOLID' && fill.color) {
        const { r, g, b } = fill.color;
        return {
          type: 'fill',
          hex: rgbToHex(r, g, b),
          opacity: fill.opacity || 1
        };
      }
      return null;
    }).filter(Boolean);
  }

  // Strokes
  if (node.strokes && node.strokes.length > 0) {
    measurements.strokes = node.strokes.map(stroke => {
      if (stroke.type === 'SOLID' && stroke.color) {
        const { r, g, b } = stroke.color;
        return {
          type: 'stroke',
          hex: rgbToHex(r, g, b),
          weight: node.strokeWeight || 1
        };
      }
      return null;
    }).filter(Boolean);
  }

  // Corner radius
  if (node.cornerRadius !== undefined) {
    measurements.borderRadius = Math.round(node.cornerRadius);
  } else if (node.rectangleCornerRadii) {
    measurements.borderRadius = node.rectangleCornerRadii.map(r => Math.round(r));
  }

  // Padding (from layout constraints)
  if (node.paddingLeft !== undefined) {
    measurements.padding = {
      top: Math.round(node.paddingTop || 0),
      right: Math.round(node.paddingRight || 0),
      bottom: Math.round(node.paddingBottom || 0),
      left: Math.round(node.paddingLeft || 0)
    };
  }

  // Typography (for text nodes)
  if (node.style) {
    measurements.typography = {
      fontSize: Math.round(node.style.fontSize || 16),
      fontWeight: node.style.fontWeight || 400,
      lineHeight: node.style.lineHeightPx ? Math.round(node.style.lineHeightPx) : 'normal',
      letterSpacing: node.style.letterSpacing || 0
    };
  }

  return measurements;
};

/**
 * Convert RGB to hex
 */
const rgbToHex = (r, g, b) => {
  const toHex = (n) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Download image from URL and save to local file
 */
const downloadImage = async (imageUrl, savePath) => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    // Ensure directory exists
    const dir = dirname(savePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Save the image
    const buffer = await response.arrayBuffer();
    writeFileSync(savePath, Buffer.from(buffer));

    return savePath;
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
};

/**
 * Get design variables from Figma file (if available)
 */
export const fetchDesignVariables = async (fileKey) => {
  try {
    console.log(`🎨 Fetching design variables...`);

    const data = await callFigmaAPI(`/files/${fileKey}/variables/local`);

    if (!data.meta || !data.meta.variables) {
      console.log('ℹ️  No design variables found in this file');
      return { success: true, variables: {} };
    }

    // Process variables into useful format
    const variables = {};

    for (const [, variable] of Object.entries(data.meta.variables)) {
      const category = variable.name.split('/')[0] || 'other';

      if (!variables[category]) {
        variables[category] = {};
      }

      variables[category][variable.name] = variable;
    }

    console.log(`✅ Design variables extracted`);

    return {
      success: true,
      variables,
      metadata: {
        fileKey,
        variableCount: Object.keys(data.meta.variables).length
      }
    };
  } catch (error) {
    console.log(`ℹ️  Design variables not available: ${error.message}`);
    return { success: false, error: error.message, variables: {} };
  }
};

/**
 * Get SVG content for icons from Figma
 */
export const fetchIconSVG = async (fileKey, nodeId) => {
  try {
    console.log(`🎨 Fetching SVG for icon ${nodeId}...`);

    const data = await callFigmaAPI(`/images/${fileKey}`, {
      ids: nodeId,
      format: 'svg'
    });

    if (!data.images || !data.images[nodeId]) {
      throw new Error(`No SVG available for icon ${nodeId}`);
    }

    const svgUrl = data.images[nodeId];
    const response = await fetch(svgUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch SVG: ${response.status}`);
    }

    const svgContent = await response.text();

    return {
      success: true,
      svgContent,
      nodeId
    };
  } catch (error) {
    console.error(`❌ Icon SVG fetch failed:`, error.message);
    throw error;
  }
};

/**
 * Get child nodes that are likely icons (for icon discovery)
 */
export const findIconNodes = async (fileKey, nodeId) => {
  try {
    console.log(`🔍 Searching for icon nodes in ${nodeId}...`);

    const data = await callFigmaAPI(`/files/${fileKey}/nodes`, {
      ids: nodeId,
      depth: 3
    });

    if (!data.nodes || !data.nodes[nodeId]) {
      return [];
    }

    const node = data.nodes[nodeId].document;
    const iconNodes = [];

    // Recursively find small vector/component nodes that look like icons
    const findIcons = (currentNode) => {
      if (!currentNode) return;

      // Check if this looks like an icon
      const isIconCandidate = (
        (currentNode.type === 'VECTOR' ||
         currentNode.type === 'COMPONENT' ||
         currentNode.type === 'INSTANCE') &&
        currentNode.absoluteBoundingBox &&
        currentNode.absoluteBoundingBox.width <= 48 &&
        currentNode.absoluteBoundingBox.height <= 48 &&
        currentNode.name &&
        currentNode.name.length > 0
      );

      if (isIconCandidate) {
        iconNodes.push({
          id: currentNode.id,
          name: currentNode.name,
          type: currentNode.type,
          bounds: currentNode.absoluteBoundingBox
        });
      }

      // Recurse through children
      if (currentNode.children) {
        currentNode.children.forEach(child => findIcons(child));
      }
    };

    findIcons(node);

    console.log(`✅ Found ${iconNodes.length} potential icons`);
    return iconNodes;

  } catch (error) {
    console.error(`❌ Icon discovery failed:`, error.message);
    return [];
  }
};

/**
 * AI-guided node exploration for intelligent discovery
 * Let AI navigate unpredictable Figma node structures
 */
export const aiExploreNodes = async (fileKey, nodeId, visualAnalysis, explorationGoal = "icons") => {
  try {
    console.log(`\n🤖 AI-GUIDED NODE EXPLORATION`);
    console.log(`Goal: Find ${explorationGoal} using visual context`);

    // Get initial node structure with good depth
    const initialData = await callFigmaAPI(`/files/${fileKey}/nodes`, {
      ids: nodeId,
      depth: 6
    });

    if (!initialData.nodes || !initialData.nodes[nodeId]) {
      throw new Error(`Node ${nodeId} not found`);
    }

    const rootNode = initialData.nodes[nodeId].document;
    const nodeStructure = simplifyNodeForAI(rootNode, 6);

    // AI analyzes visual + structure to plan exploration
    const explorationPlan = await planExplorationWithAI(visualAnalysis, nodeStructure, explorationGoal);

    console.log(`🎯 AI identified ${explorationPlan.targetNodes.length} areas to explore`);

    // Execute the exploration plan
    const discoveredNodes = [];
    for (const target of explorationPlan.targetNodes) {
      console.log(`  🔍 Exploring ${target.nodeId}: ${target.reason}`);

      // Get more details on this specific node if needed
      if (target.needsDeepDive) {
        const detailData = await callFigmaAPI(`/files/${fileKey}/nodes`, {
          ids: target.nodeId,
          depth: 4
        });

        if (detailData.nodes && detailData.nodes[target.nodeId]) {
          const detailedNode = detailData.nodes[target.nodeId].document;
          const specificNodes = await extractSpecificNodesWithAI(detailedNode, visualAnalysis, explorationGoal);
          discoveredNodes.push(...specificNodes);
        }
      } else {
        // Use the node directly
        discoveredNodes.push({
          nodeId: target.nodeId,
          name: target.name,
          type: target.type,
          reason: target.reason
        });
      }
    }

    console.log(`✅ AI-guided exploration complete: found ${discoveredNodes.length} ${explorationGoal}`);
    return discoveredNodes;

  } catch (error) {
    console.error(`❌ AI-guided exploration failed:`, error.message);
    return [];
  }
};

/**
 * AI plans the exploration strategy
 */
const planExplorationWithAI = async (visualAnalysis, nodeStructure, explorationGoal) => {
  if (!process.env.OPENAI_API_KEY) {
    // Fallback to simple structural analysis
    console.log('⚠️  No OpenAI key, using fallback exploration');
    return fallbackExploration(nodeStructure, explorationGoal);
  }

  const prompt = `You are exploring a Figma design to find ${explorationGoal}.

VISUAL ANALYSIS:
${visualAnalysis.analysis}

FIGMA NODE STRUCTURE:
${JSON.stringify(nodeStructure, null, 2)}

Based on the visual analysis mentioning "${explorationGoal}" and the node structure above:

1. Identify which parent nodes likely contain the ${explorationGoal}
2. Determine if you need to dive deeper into any nodes to find individual items
3. Consider that Figma structures can be messy - ${explorationGoal} might be nested in frames, groups, or unusual hierarchies

Respond with a JSON exploration plan:
{
  "strategy": "Brief explanation of your exploration approach",
  "targetNodes": [
    {
      "nodeId": "node_id_here",
      "name": "node_name",
      "type": "node_type",
      "reason": "Why this node is relevant",
      "needsDeepDive": true/false
    }
  ]
}

If you see patterns like "many small nodes of similar size" or "grid-like structure", those likely contain individual ${explorationGoal}.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.1
    });

    const aiResponse = response.choices[0].message.content;

    // Parse the JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const explorationPlan = JSON.parse(jsonMatch[0]);
      console.log(`  🧠 AI Strategy: ${explorationPlan.strategy}`);
      return explorationPlan;
    }

    throw new Error('Failed to parse AI exploration plan');
  } catch (error) {
    console.log(`⚠️  AI exploration planning failed: ${error.message}`);
    return fallbackExploration(nodeStructure, explorationGoal);
  }
};

/**
 * AI extracts specific nodes from a detailed structure
 */
const extractSpecificNodesWithAI = async (detailedNode, visualAnalysis, explorationGoal) => {
  if (!process.env.OPENAI_API_KEY) {
    return extractSpecificNodesFallback(detailedNode, explorationGoal);
  }

  const prompt = `You are examining a specific Figma node to extract individual ${explorationGoal}.

VISUAL CONTEXT: ${visualAnalysis.analysis}

NODE DETAILS:
${JSON.stringify(simplifyNodeForAI(detailedNode, 3), null, 2)}

List all individual ${explorationGoal} nodes within this structure. Look for:
- Actual ${explorationGoal}, not containers or decorative elements
- Individual items that should become separate React components
- Ignore frames/groups that are just for organization

Respond with JSON array:
[
  {
    "nodeId": "specific_node_id",
    "name": "descriptive_name",
    "type": "node_type",
    "reason": "Why this is a valid ${explorationGoal}"
  }
]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.1
    });

    const aiResponse = response.choices[0].message.content;
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const specificNodes = JSON.parse(jsonMatch[0]);
      return specificNodes;
    }

    return extractSpecificNodesFallback(detailedNode, explorationGoal);
  } catch (error) {
    console.log(`⚠️  AI specific extraction failed: ${error.message}`);
    return extractSpecificNodesFallback(detailedNode, explorationGoal);
  }
};

/**
 * Simplify node structure for AI analysis
 */
const simplifyNodeForAI = (node, maxDepth, currentDepth = 0) => {
  if (!node || currentDepth >= maxDepth) return null;

  const simplified = {
    id: node.id,
    name: node.name,
    type: node.type
  };

  // Add useful metadata
  if (node.absoluteBoundingBox) {
    simplified.dimensions = {
      width: Math.round(node.absoluteBoundingBox.width),
      height: Math.round(node.absoluteBoundingBox.height)
    };
  }

  // For potential icons, note if they're small and likely individual items
  if (node.type === 'VECTOR' || node.type === 'COMPONENT') {
    if (simplified.dimensions && simplified.dimensions.width <= 100 && simplified.dimensions.height <= 100) {
      simplified.likelyIcon = true;
    }
  }

  // Add children recursively
  if (node.children && node.children.length > 0) {
    simplified.childCount = node.children.length;
    simplified.children = node.children
      .map(child => simplifyNodeForAI(child, maxDepth, currentDepth + 1))
      .filter(Boolean);
  }

  return simplified;
};

/**
 * Fallback exploration when AI is not available
 */
const fallbackExploration = (nodeStructure, explorationGoal) => {
  console.log('  🔧 Using fallback exploration logic');

  const targetNodes = [];

  // Simple heuristic for icons: look for nodes with many small children
  if (explorationGoal === 'icons') {
    const findIconContainers = (node) => {
      if (node.children && node.children.length > 10) {
        // Check if children are small and uniform (likely icons)
        const smallChildren = node.children.filter(child =>
          child.dimensions &&
          child.dimensions.width <= 100 &&
          child.dimensions.height <= 100
        );

        if (smallChildren.length > 10) {
          targetNodes.push({
            nodeId: node.id,
            name: node.name,
            type: node.type,
            reason: `Container with ${smallChildren.length} small items`,
            needsDeepDive: true
          });
        }
      }

      if (node.children) {
        node.children.forEach(findIconContainers);
      }
    };

    findIconContainers(nodeStructure);
  }

  return {
    strategy: "Fallback heuristic-based exploration",
    targetNodes
  };
};

/**
 * Fallback specific node extraction
 */
const extractSpecificNodesFallback = (detailedNode, explorationGoal) => {
  const specificNodes = [];

  const extractNodes = (node) => {
    if (explorationGoal === 'icons') {
      if ((node.type === 'VECTOR' || node.type === 'COMPONENT') &&
          node.absoluteBoundingBox &&
          node.absoluteBoundingBox.width <= 100 &&
          node.absoluteBoundingBox.height <= 100) {
        specificNodes.push({
          nodeId: node.id,
          name: node.name || `Icon_${node.id}`,
          type: node.type,
          reason: `Small ${node.type.toLowerCase()} (fallback detection)`
        });
      }
    }

    if (node.children) {
      node.children.forEach(extractNodes);
    }
  };

  extractNodes(detailedNode);
  return specificNodes;
};

const figmaUtils = {
  parseFigmaUrl,
  fetchFigmaScreenshot,
  fetchNodeData
};

export default figmaUtils;