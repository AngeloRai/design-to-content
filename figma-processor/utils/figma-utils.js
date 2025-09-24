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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const FIGMA_API_BASE = 'https://api.figma.com/v1';
const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

if (!FIGMA_TOKEN) {
  console.warn('⚠️  FIGMA_ACCESS_TOKEN not found. Figma API features will be disabled.');
}

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
    const screenshotsDir = join(__dirname, '..', 'screenshots');
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
export const fetchNodeData = async (fileKey, nodeId, depth = 2) => {
  try {
    console.log(`📏 Fetching node data for measurements...`);

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

    console.log(`✅ Node data extracted`);

    return {
      success: true,
      node,
      measurements,
      metadata: {
        fileKey,
        nodeId,
        name: node.name,
        type: node.type
      }
    };
  } catch (error) {
    console.error(`❌ Node data fetch failed:`, error.message);
    throw error;
  }
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

const figmaUtils = {
  parseFigmaUrl,
  fetchFigmaScreenshot,
  fetchNodeData,
  fetchDesignVariables,
  fetchIconSVG,
  findIconNodes
};

export default figmaUtils;