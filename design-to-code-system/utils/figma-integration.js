#!/usr/bin/env node

/**
 * FIGMA INTEGRATION FOR DESIGN-TO-CODE SYSTEM
 * Uses official Figma REST API with TypeScript types
 * AI-first approach: let AI analyze what it finds, no hardcoded assumptions
 */

import "dotenv/config";
import fs from 'fs-extra';
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
 * Parse Figma URL to extract fileKey and nodeId
 * Supports various Figma URL formats
 */
export const parseFigmaUrl = (url) => {
  try {
    // Support multiple Figma URL formats
    const patterns = [
      // Standard design URL: https://www.figma.com/design/fileKey/title?node-id=1-2
      /figma\.com\/design\/([a-zA-Z0-9]+)\/[^?]*\?.*node-id=([0-9-:]+)/,
      // File URL: https://www.figma.com/file/fileKey/title?node-id=1-2
      /figma\.com\/file\/([a-zA-Z0-9]+)\/[^?]*\?.*node-id=([0-9-:]+)/,
      // Proto URL: https://www.figma.com/proto/fileKey/title?node-id=1-2
      /figma\.com\/proto\/([a-zA-Z0-9]+)\/[^?]*\?.*node-id=([0-9-:]+)/,
      // Simple format: https://figma.com/design/fileKey?node-id=1-2
      /figma\.com\/design\/([a-zA-Z0-9]+)\?.*node-id=([0-9-:]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const [, fileKey, nodeId] = match;
        // Normalize nodeId format (convert 1-2 to 1:2)
        const normalizedNodeId = nodeId.replace(/-/g, ':');

        return {
          fileKey,
          nodeId: normalizedNodeId,
          originalUrl: url
        };
      }
    }

    throw new Error(`Unable to parse Figma URL format: ${url}`);
  } catch (error) {
    throw new Error(`Figma URL parsing failed: ${error.message}`);
  }
};

/**
 * Generic Figma API call with proper error handling
 */
const callFigmaAPI = async (endpoint, params = {}) => {
  if (!FIGMA_TOKEN) {
    throw new Error('FIGMA_ACCESS_TOKEN is required for Figma API calls');
  }

  const queryString = new URLSearchParams(params).toString();
  const url = `${FIGMA_API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;

  console.log(`🔗 Calling Figma API: ${endpoint}`);

  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': FIGMA_TOKEN,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Figma API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

/**
 * Fetch screenshot/image from Figma
 * Returns both the image URL and downloads it locally
 */
export const fetchFigmaScreenshot = async (fileKey, nodeId, options = {}) => {
  try {
    const params = {
      ids: nodeId,
      format: options.format || 'png',
      scale: options.scale || '2',
      ...options
    };

    console.log(`📸 Fetching screenshot for node ${nodeId}...`);

    const data = await callFigmaAPI(`/images/${fileKey}`, params);

    if (!data.images || !data.images[nodeId]) {
      throw new Error(`No image returned for node ${nodeId}`);
    }

    const imageUrl = data.images[nodeId];

    // Download image locally for AI processing
    console.log(`⬇️  Downloading screenshot from Figma...`);
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    // Create screenshots directory
    const screenshotsDir = join(__dirname, '..', 'data', 'screenshots');
    await fs.ensureDir(screenshotsDir);

    // Save with timestamp to avoid conflicts
    const timestamp = Date.now();
    const fileName = `figma_${fileKey}_${nodeId.replace(':', '-')}_${timestamp}.png`;
    const localPath = join(screenshotsDir, fileName);

    // Save image buffer
    const buffer = await imageResponse.arrayBuffer();
    await fs.writeFile(localPath, Buffer.from(buffer));

    console.log(`✅ Screenshot saved: ${localPath}`);

    return {
      url: imageUrl,
      localPath,
      fileName,
      nodeId,
      fileKey,
      metadata: {
        format: params.format,
        scale: params.scale,
        downloadedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    throw new Error(`Failed to fetch Figma screenshot: ${error.message}`);
  }
};

/**
 * Fetch node data and metadata from Figma
 * Fetches deep tree structure for accurate component detection
 */
export const fetchNodeData = async (fileKey, nodeId, depth = 6) => {
  try {
    // Validate depth (Figma API max is 10)
    const validDepth = Math.min(Math.max(depth, 1), 10);
    console.log(`📊 Fetching node data for ${nodeId} (depth: ${validDepth})...`);

    const params = {
      ids: nodeId,
      depth: validDepth.toString(),
      geometry: 'paths'
    };

    const data = await callFigmaAPI(`/files/${fileKey}/nodes`, params);

    if (!data.nodes || !data.nodes[nodeId]) {
      throw new Error(`No node data returned for ${nodeId}`);
    }

    const nodeData = data.nodes[nodeId];

    // Extract useful metadata for AI analysis
    const metadata = {
      id: nodeData.document?.id,
      name: nodeData.document?.name,
      type: nodeData.document?.type,
      children: nodeData.document?.children?.length || 0,
      visible: nodeData.document?.visible !== false,
      absoluteBoundingBox: nodeData.document?.absoluteBoundingBox,
      // Let AI discover patterns in fills, strokes, effects
      fills: nodeData.document?.fills,
      strokes: nodeData.document?.strokes,
      effects: nodeData.document?.effects,
      // Component information if available
      componentId: nodeData.document?.componentId,
      componentSetId: nodeData.document?.componentSetId,
      // Text content for AI analysis
      characters: nodeData.document?.characters,
      // Constraints and layout info
      constraints: nodeData.document?.constraints,
      layoutMode: nodeData.document?.layoutMode,
      layoutWrap: nodeData.document?.layoutWrap,
      // AI will analyze the complete structure
      rawDocument: nodeData.document
    };

    console.log(`✅ Node data fetched: ${metadata.name} (${metadata.type})`);

    return {
      nodeId,
      fileKey,
      metadata,
      lastModified: data.lastModified,
      fetchedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`Failed to fetch node data: ${error.message}`);
  }
};

/**
 * Complete Figma integration: URL → Screenshot + Metadata
 * AI-first approach: provide all available data, let AI decide what's important
 */
export const processFigmaUrl = async (figmaUrl, options = {}) => {
  try {
    console.log(`🚀 Processing Figma URL: ${figmaUrl}`);

    // Parse URL
    const { fileKey, nodeId } = parseFigmaUrl(figmaUrl);

    // Fetch screenshot and metadata in parallel for speed
    const [screenshot, nodeData] = await Promise.all([
      fetchFigmaScreenshot(fileKey, nodeId, options.screenshot),
      fetchNodeData(fileKey, nodeId, options.depth || 6)
    ]);

    console.log(`✅ Figma processing complete for ${nodeId}`);

    return {
      fileKey,
      nodeId,
      url: figmaUrl,
      screenshot,
      nodeData,
      processedAt: new Date().toISOString(),
      // Ready for AI analysis
      ready: true
    };

  } catch (error) {
    console.error(`❌ Figma processing failed: ${error.message}`);
    throw error;
  }
};

/**
 * Recursively traverse Figma node tree
 * @param {Object} node - Figma node to traverse
 * @param {Function} callback - Function to call for each node (node, depth, parent)
 * @param {number} depth - Current depth in tree
 * @param {Object} parent - Parent node
 */
export const traverseFigmaTree = (node, callback, depth = 0, parent = null) => {
  if (!node) return;

  // Call callback for current node
  callback(node, depth, parent);

  // Recursively traverse children
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(child => {
      traverseFigmaTree(child, callback, depth + 1, node);
    });
  }
};

/**
 * Find all Figma components in a node tree
 * Detects COMPONENT, COMPONENT_SET, and INSTANCE nodes
 * @param {Object} rootNode - Root Figma node to search
 * @returns {Array} Array of detected components with metadata
 */
export const findComponents = (rootNode) => {
  const components = [];

  traverseFigmaTree(rootNode, (node, depth, parent) => {
    // Detect component nodes
    const isComponent = node.type === 'COMPONENT' ||
                       node.type === 'COMPONENT_SET' ||
                       node.type === 'INSTANCE';

    if (isComponent) {
      components.push({
        id: node.id,
        name: node.name,
        type: node.type,
        depth,
        parent: parent ? { id: parent.id, name: parent.name, type: parent.type } : null,
        // Component properties (for variants)
        componentProperties: node.componentProperties,
        variantProperties: node.variantProperties,
        componentPropertyDefinitions: node.componentPropertyDefinitions,
        // Full node for detailed analysis
        node: node,
        // Basic metadata
        absoluteBoundingBox: node.absoluteBoundingBox,
        children: node.children?.length || 0
      });
    }
  });

  console.log(`🔍 Found ${components.length} components in tree`);
  return components;
};

/**
 * Extract design tokens from a Figma node tree (recursive)
 * @param {Object} node - Figma node (root)
 * @returns {Object} Design tokens (colors, spacing, typography, effects)
 */
export const extractDesignTokens = (node) => {
  const tokens = {
    colors: new Map(), // Use Map to dedupe by hex
    spacing: new Set(),
    typography: [],
    effects: [],
    borderRadii: new Set(),
    dimensions: new Set()
  };

  // Recursive traversal
  const traverse = (currentNode) => {
    if (!currentNode) return;

    // Extract colors from fills
    if (currentNode.fills && Array.isArray(currentNode.fills)) {
      currentNode.fills.forEach(fill => {
        if (fill.visible !== false && fill.type === 'SOLID' && fill.color) {
          const { r, g, b, a = 1 } = fill.color;
          const hex = rgbToHex(r, g, b);
          if (!tokens.colors.has(hex)) {
            tokens.colors.set(hex, {
              type: 'fill',
              hex,
              rgba: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`,
              opacity: fill.opacity !== undefined ? fill.opacity : 1,
              contexts: []
            });
          }
          tokens.colors.get(hex).contexts.push({
            nodeName: currentNode.name,
            nodeType: currentNode.type
          });
        }
      });
    }

    // Extract colors from strokes
    if (currentNode.strokes && Array.isArray(currentNode.strokes)) {
      currentNode.strokes.forEach(stroke => {
        if (stroke.visible !== false && stroke.type === 'SOLID' && stroke.color) {
          const { r, g, b, a = 1 } = stroke.color;
          const hex = rgbToHex(r, g, b);
          if (!tokens.colors.has(hex)) {
            tokens.colors.set(hex, {
              type: 'stroke',
              hex,
              rgba: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`,
              opacity: stroke.opacity !== undefined ? stroke.opacity : 1,
              contexts: []
            });
          }
          tokens.colors.get(hex).contexts.push({
            nodeName: currentNode.name,
            nodeType: currentNode.type
          });
        }
      });
    }

    // Extract spacing patterns
    if (currentNode.paddingLeft !== undefined && currentNode.paddingLeft > 0) tokens.spacing.add(currentNode.paddingLeft);
    if (currentNode.paddingRight !== undefined && currentNode.paddingRight > 0) tokens.spacing.add(currentNode.paddingRight);
    if (currentNode.paddingTop !== undefined && currentNode.paddingTop > 0) tokens.spacing.add(currentNode.paddingTop);
    if (currentNode.paddingBottom !== undefined && currentNode.paddingBottom > 0) tokens.spacing.add(currentNode.paddingBottom);
    if (currentNode.itemSpacing !== undefined && currentNode.itemSpacing > 0) tokens.spacing.add(currentNode.itemSpacing);

    // Extract border radius
    if (currentNode.cornerRadius !== undefined && currentNode.cornerRadius > 0) {
      tokens.borderRadii.add(currentNode.cornerRadius);
    }

    // Extract typography
    if (currentNode.style && currentNode.type === 'TEXT') {
      tokens.typography.push({
        nodeName: currentNode.name,
        fontFamily: currentNode.style.fontFamily,
        fontWeight: currentNode.style.fontWeight,
        fontSize: currentNode.style.fontSize,
        lineHeight: currentNode.style.lineHeightPx || currentNode.style.lineHeightPercentFontSize,
        letterSpacing: currentNode.style.letterSpacing,
        textAlign: currentNode.style.textAlignHorizontal
      });
    }

    // Extract dimensions (width/height for common sizing patterns)
    if (currentNode.absoluteBoundingBox) {
      const { width, height } = currentNode.absoluteBoundingBox;
      if (width && width < 1000) tokens.dimensions.add(Math.round(width));
      if (height && height < 1000) tokens.dimensions.add(Math.round(height));
    }

    // Extract effects (shadows, blurs)
    if (currentNode.effects && Array.isArray(currentNode.effects)) {
      currentNode.effects.forEach(effect => {
        if (effect.visible !== false) {
          tokens.effects.push({
            type: effect.type,
            radius: effect.radius,
            color: effect.color ? rgbToHex(effect.color.r, effect.color.g, effect.color.b) : null,
            offset: effect.offset,
            spread: effect.spread,
            nodeName: currentNode.name
          });
        }
      });
    }

    // Recursively process children
    if (currentNode.children && Array.isArray(currentNode.children)) {
      currentNode.children.forEach(child => traverse(child));
    }
  };

  // Start traversal
  traverse(node);

  // Convert to serializable format
  return {
    colors: Array.from(tokens.colors.values()),
    spacing: Array.from(tokens.spacing).sort((a, b) => a - b),
    typography: tokens.typography,
    effects: tokens.effects,
    borderRadii: Array.from(tokens.borderRadii).sort((a, b) => a - b),
    dimensions: Array.from(tokens.dimensions).sort((a, b) => a - b)
  };
};

/**
 * Helper: Convert RGB (0-1) to hex color
 */
const rgbToHex = (r, g, b) => {
  const toHex = (val) => {
    const hex = Math.round(val * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Extract visual properties from a node with child composition
 */
const extractVisualProperties = (node) => {
  const props = {};

  // Background/fill colors
  if (node.fills && Array.isArray(node.fills)) {
    const visibleFills = node.fills.filter(f => f.visible !== false && f.type === 'SOLID');
    if (visibleFills.length > 0) {
      props.backgroundColor = visibleFills.map(f => {
        const { r, g, b } = f.color;
        return rgbToHex(r, g, b);
      });
    }
  }

  // Border/stroke colors
  if (node.strokes && Array.isArray(node.strokes)) {
    const visibleStrokes = node.strokes.filter(s => s.visible !== false && s.type === 'SOLID');
    if (visibleStrokes.length > 0) {
      props.borderColor = visibleStrokes.map(s => {
        const { r, g, b } = s.color;
        return rgbToHex(r, g, b);
      });
      props.borderWidth = node.strokeWeight;
    }
  }

  // Border radius
  if (node.cornerRadius !== undefined && node.cornerRadius > 0) {
    props.borderRadius = node.cornerRadius;
  }

  // Text properties
  if (node.type === 'TEXT' && node.style) {
    props.text = {
      content: node.characters?.slice(0, 50), // Limit to 50 chars
      fontFamily: node.style.fontFamily,
      fontSize: node.style.fontSize,
      fontWeight: node.style.fontWeight,
      color: node.fills?.[0]?.color ?
        rgbToHex(node.fills[0].color.r, node.fills[0].color.g, node.fills[0].color.b) : null
    };
  }

  // Layout
  if (node.layoutMode) {
    props.layout = {
      direction: node.layoutMode,
      padding: [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft]
        .filter(p => p !== undefined && p > 0),
      gap: node.itemSpacing
    };
  }

  // Dimensions
  if (node.absoluteBoundingBox) {
    props.size = {
      width: Math.round(node.absoluteBoundingBox.width),
      height: Math.round(node.absoluteBoundingBox.height)
    };
  }

  // Extract child composition (1 level deep)
  if (node.children && node.children.length > 0) {
    props.children = node.children.slice(0, 5).map(child => {
      const childInfo = {
        type: child.type,
        name: child.name
      };

      // Add relevant properties based on type
      if (child.type === 'TEXT') {
        childInfo.text = child.characters?.slice(0, 30);
        childInfo.color = child.fills?.[0]?.color ?
          rgbToHex(child.fills[0].color.r, child.fills[0].color.g, child.fills[0].color.b) : null;
        childInfo.fontSize = child.style?.fontSize;
      } else if (child.type === 'RECTANGLE' || child.type === 'FRAME') {
        if (child.fills?.[0]?.color) {
          childInfo.backgroundColor = rgbToHex(
            child.fills[0].color.r,
            child.fills[0].color.g,
            child.fills[0].color.b
          );
        }
      }

      return childInfo;
    });
  }

  return props;
};

/**
 * Extract structured component metadata for AI analysis
 * @param {Object} rootNode - Root Figma node
 * @returns {Object} Structured component metadata with visual properties
 */
export const extractComponentMetadata = (rootNode) => {
  const components = findComponents(rootNode);

  // Simply provide all component instances with their properties
  // Let AI decide how to group them based on visual analysis
  const componentData = components.map(comp => {
    const visualProps = extractVisualProperties(comp.node);

    // Check for potential icon/vector children
    const hasVectorChild = comp.node.children && comp.node.children.some(child =>
      child.type === 'VECTOR' ||
      child.type === 'BOOLEAN_OPERATION' ||
      (child.name && child.name.toLowerCase().includes('icon'))
    );

    // Get text content if any
    const textContent = comp.node.children ?
      comp.node.children
        .filter(c => c.type === 'TEXT')
        .map(c => c.characters)
        .filter(Boolean)
        .slice(0, 3) : [];

    return {
      name: comp.name,
      id: comp.id,
      type: comp.type,
      visualProperties: visualProps,
      hasVectorElements: hasVectorChild,
      componentProperties: comp.componentProperties || {},
      textSamples: textContent,
      childCount: comp.node.children?.length || 0
    };
  });

  // Group by name prefix for hint (but don't force this grouping)
  const nameGroups = {};
  componentData.forEach(comp => {
    const prefix = comp.name.split(/[=,_\/\s]/)[0];
    if (!nameGroups[prefix]) {
      nameGroups[prefix] = [];
    }
    nameGroups[prefix].push(comp.name);
  });

  return {
    totalInstances: components.length,
    instances: componentData.slice(0, 20), // Provide sample, not all
    nameGroupings: Object.entries(nameGroups).map(([prefix, names]) => ({
      prefix,
      count: names.length,
      samples: names.slice(0, 3)
    })),
    hint: "Analyze visual patterns to determine which instances are variants of the same component"
  };
};

/**
 * Build component hierarchy showing composition relationships
 * @param {Array} components - Array of detected components
 * @returns {Object} Hierarchical component structure
 */
export const buildComponentHierarchy = (components) => {
  const hierarchy = {
    atoms: [],
    molecules: [],
    organisms: []
  };

  components.forEach(comp => {
    // Simple heuristic: classify by depth and children count
    if (comp.children === 0 || comp.depth > 4) {
      hierarchy.atoms.push(comp);
    } else if (comp.children <= 3 || comp.depth > 2) {
      hierarchy.molecules.push(comp);
    } else {
      hierarchy.organisms.push(comp);
    }
  });

  return hierarchy;
};

/**
 * Test Figma integration with environment variable
 */
export const testFigmaIntegration = async () => {
  const testUrl = process.env.FIGMA_URL;

  if (!testUrl) {
    throw new Error('FIGMA_URL not found in environment variables');
  }

  console.log(`🧪 Testing Figma integration with: ${testUrl}`);

  try {
    const result = await processFigmaUrl(testUrl);

    console.log('✅ Figma integration test successful!');
    console.log(`📸 Screenshot: ${result.screenshot.localPath}`);
    console.log(`📊 Node: ${result.nodeData.metadata.name} (${result.nodeData.metadata.type})`);

    return result;
  } catch (error) {
    console.error('❌ Figma integration test failed:', error.message);
    throw error;
  }
};

export default {
  parseFigmaUrl,
  fetchFigmaScreenshot,
  fetchNodeData,
  processFigmaUrl,
  testFigmaIntegration,
  // Tree analysis utilities
  traverseFigmaTree,
  findComponents,
  extractDesignTokens,
  extractComponentMetadata,
  buildComponentHierarchy
};