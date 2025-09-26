#!/usr/bin/env node

/**
 * FIGMA TOOLS FOR AI
 * Targeted API tools for AI to dynamically fetch additional Figma data
 * Allows AI to make intelligent decisions about what data to fetch
 */

import { callFigmaAPI } from '../utils/figma-utils.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Create Figma tools scoped to a specific file
 * AI can use these tools to fetch additional data as needed
 */
export const createFigmaTools = (fileKey) => {
  const tools = {
    fileKey,

    /**
     * Get detailed data for a specific node
     */
    async getNode(nodeId, depth = 2) {
      try {
        console.log(`🔧 AI Tool: Getting node ${nodeId} (depth: ${depth})`);

        const data = await callFigmaAPI(`/files/${fileKey}/nodes`, {
          ids: nodeId,
          depth
        });

        if (!data.nodes || !data.nodes[nodeId]) {
          throw new Error(`Node ${nodeId} not found`);
        }

        return {
          success: true,
          node: data.nodes[nodeId].document,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`❌ AI Tool Error (getNode):`, error.message);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get multiple nodes in one call (efficient for batch operations)
     */
    async getNodes(nodeIds, depth = 2) {
      try {
        console.log(`🔧 AI Tool: Getting ${nodeIds.length} nodes (depth: ${depth})`);

        const data = await callFigmaAPI(`/files/${fileKey}/nodes`, {
          ids: nodeIds.join(','),
          depth
        });

        return {
          success: true,
          nodes: data.nodes || {},
          requestedIds: nodeIds,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`❌ AI Tool Error (getNodes):`, error.message);
        return { success: false, error: error.message };
      }
    },

    /**
     * Export images/screenshots for specific nodes
     * AI can request additional PNGs when needed for verification
     */
    async exportImages(nodeIds, options = {}) {
      try {
        const {
          format = 'png',
          scale = 2,
          useFrameBounds = false
        } = options;

        console.log(`🔧 AI Tool: Exporting ${format.toUpperCase()} for ${nodeIds.length} nodes`);

        const data = await callFigmaAPI(`/images/${fileKey}`, {
          ids: nodeIds.join(','),
          format,
          scale,
          use_absolute_bounds: !useFrameBounds
        });

        if (!data.images) {
          throw new Error('No images returned from API');
        }

        // Download and save locally for AI to use
        const savedImages = {};
        const imagesDir = join(__dirname, '..', '..', 'data', 'analysis');

        if (!existsSync(imagesDir)) {
          mkdirSync(imagesDir, { recursive: true });
        }

        for (const [nodeId, imageUrl] of Object.entries(data.images)) {
          if (imageUrl) {
            const filename = `${nodeId.replace(':', '-')}-${Date.now()}.${format}`;
            const localPath = join(imagesDir, filename);

            await downloadImage(imageUrl, localPath);
            savedImages[nodeId] = {
              url: imageUrl,
              localPath,
              filename
            };
          }
        }

        return {
          success: true,
          images: savedImages,
          metadata: { format, scale, useFrameBounds },
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`❌ AI Tool Error (exportImages):`, error.message);
        return { success: false, error: error.message };
      }
    },

    /**
     * List immediate children of a node
     * Useful for AI to explore structure incrementally
     */
    async listChildren(nodeId) {
      try {
        console.log(`🔧 AI Tool: Listing children of node ${nodeId}`);

        const nodeResult = await this.getNode(nodeId, 1);
        if (!nodeResult.success) {
          return nodeResult;
        }

        const node = nodeResult.node;
        const children = node.children || [];

        const childrenInfo = children.map(child => ({
          id: child.id,
          name: child.name,
          type: child.type,
          bounds: child.absoluteBoundingBox,
          hasChildren: !!(child.children && child.children.length > 0)
        }));

        return {
          success: true,
          parentNode: {
            id: node.id,
            name: node.name,
            type: node.type
          },
          children: childrenInfo,
          childCount: childrenInfo.length,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`❌ AI Tool Error (listChildren):`, error.message);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get SVG content for vector-based nodes (icons, illustrations)
     */
    async getSVGs(nodeIds) {
      try {
        console.log(`🔧 AI Tool: Getting SVG content for ${nodeIds.length} nodes`);

        const data = await callFigmaAPI(`/images/${fileKey}`, {
          ids: nodeIds.join(','),
          format: 'svg'
        });

        if (!data.images) {
          throw new Error('No SVGs returned from API');
        }

        const svgContents = {};
        for (const [nodeId, svgUrl] of Object.entries(data.images)) {
          if (svgUrl) {
            const response = await fetch(svgUrl);
            if (response.ok) {
              svgContents[nodeId] = {
                content: await response.text(),
                url: svgUrl
              };
            }
          }
        }

        return {
          success: true,
          svgs: svgContents,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`❌ AI Tool Error (getSVGs):`, error.message);
        return { success: false, error: error.message };
      }
    },

    /**
     * Search for nodes by name pattern
     * AI can search for specific components or patterns
     */
    async searchNodes(searchTerm, rootNodeId = null) {
      try {
        console.log(`🔧 AI Tool: Searching for nodes matching "${searchTerm}"`);

        // Get a broad view of the file structure
        const startNodeId = rootNodeId || 'root';  // Use file root if no specific node
        const data = await callFigmaAPI(`/files/${fileKey}/nodes`, {
          ids: startNodeId,
          depth: 10
        });

        if (!data.nodes) {
          return { success: false, error: 'No nodes found' };
        }

        const matches = [];
        const searchLower = searchTerm.toLowerCase();

        // Recursively search through the tree
        const searchInNode = (node) => {
          if (node.name && node.name.toLowerCase().includes(searchLower)) {
            matches.push({
              id: node.id,
              name: node.name,
              type: node.type,
              bounds: node.absoluteBoundingBox
            });
          }

          if (node.children) {
            node.children.forEach(searchInNode);
          }
        };

        Object.values(data.nodes).forEach(nodeWrapper => {
          if (nodeWrapper.document) {
            searchInNode(nodeWrapper.document);
          }
        });

        return {
          success: true,
          searchTerm,
          matches,
          matchCount: matches.length,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`❌ AI Tool Error (searchNodes):`, error.message);
        return { success: false, error: error.message };
      }
    },

    /**
     * Get component variant details (for Component Sets)
     */
    async getVariantDetails(componentSetId) {
      try {
        console.log(`🔧 AI Tool: Getting variant details for component set ${componentSetId}`);

        const nodeResult = await this.getNode(componentSetId, 3);
        if (!nodeResult.success) {
          return nodeResult;
        }

        const componentSet = nodeResult.node;

        if (componentSet.type !== 'COMPONENT_SET') {
          return {
            success: false,
            error: 'Node is not a component set'
          };
        }

        // Extract variant information
        const variants = componentSet.children?.map(variant => ({
          nodeId: variant.id,
          name: variant.name,
          properties: variant.variantProperties || {},
          bounds: variant.absoluteBoundingBox
        })) || [];

        return {
          success: true,
          componentSet: {
            id: componentSet.id,
            name: componentSet.name,
            propertyDefinitions: componentSet.componentPropertyDefinitions || {}
          },
          variants,
          variantCount: variants.length,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`❌ AI Tool Error (getVariantDetails):`, error.message);
        return { success: false, error: error.message };
      }
    }
  };

  return tools;
};

/**
 * Download image from URL to local file
 */
const downloadImage = async (imageUrl, localPath) => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();

    // Ensure directory exists
    const dir = dirname(localPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(localPath, Buffer.from(buffer));
    return localPath;
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
};

/**
 * Get available tool descriptions for AI
 */
export const getToolDescriptions = () => {
  return [
    {
      name: 'getNode',
      description: 'Get detailed data for a specific Figma node',
      parameters: 'nodeId (string), depth (number, optional)'
    },
    {
      name: 'getNodes',
      description: 'Get multiple nodes in one efficient call',
      parameters: 'nodeIds (array), depth (number, optional)'
    },
    {
      name: 'exportImages',
      description: 'Export PNG/JPG images for nodes (great for verification)',
      parameters: 'nodeIds (array), options (object with format, scale, useFrameBounds)'
    },
    {
      name: 'listChildren',
      description: 'List immediate children of a node for exploration',
      parameters: 'nodeId (string)'
    },
    {
      name: 'getSVGs',
      description: 'Get SVG content for vector nodes (icons, illustrations)',
      parameters: 'nodeIds (array)'
    },
    {
      name: 'searchNodes',
      description: 'Search for nodes by name pattern',
      parameters: 'searchTerm (string), rootNodeId (string, optional)'
    },
    {
      name: 'getVariantDetails',
      description: 'Get detailed variant information for component sets',
      parameters: 'componentSetId (string)'
    }
  ];
};

/**
 * Create tool usage guidance for AI
 */
export const createToolGuidance = (fileKey) => {
  return `
FIGMA API TOOLS AVAILABLE:

You have access to targeted Figma API tools to fetch additional data when needed.
File Key: ${fileKey}

TOOLS:
${getToolDescriptions().map(tool =>
  `• ${tool.name}(${tool.parameters}): ${tool.description}`
).join('\n')}

USAGE GUIDANCE:
1. When you need more detail on a component's variants, use getVariantDetails()
2. When you want to see child nodes for exploration, use listChildren()
3. When you need additional PNGs for verification, use exportImages()
4. When you need SVG content for icons, use getSVGs()
5. When looking for specific patterns, use searchNodes()

BEST PRACTICES:
• Use getNodes() for batch operations (more efficient than multiple getNode() calls)
• Request appropriate depth levels (1-3 for structure, deeper only when needed)
• Use exportImages() to get reference images for component verification
• Cache results when possible to avoid redundant API calls

The tools return {success: boolean, ...data} format. Always check success before using data.
`;
};

const figmaTools = {
  createFigmaTools,
  getToolDescriptions,
  createToolGuidance
};

export default figmaTools;