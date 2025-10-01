#!/usr/bin/env node

/**
 * FIGMA TOOLS - Thin wrappers for fetching Figma data
 *
 * Let AI decide what data it needs and how to interpret it
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", "..", ".env") });

// ===================================
// TOOL DEFINITIONS
// ===================================

export const figmaTools = [
  {
    type: "function",
    function: {
      name: "fetch_figma_screenshot",
      description: "Get a screenshot URL for a Figma node. Use this when you need to analyze the visual design. Returns a PNG image URL that can be passed to vision models.",
      parameters: {
        type: "object",
        properties: {
          fileKey: {
            type: "string",
            description: "Figma file key"
          },
          nodeId: {
            type: "string",
            description: "Figma node ID"
          },
          scale: {
            type: "number",
            description: "Image scale (default: 1, max: 4)"
          }
        },
        required: ["fileKey", "nodeId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "fetch_figma_node_data",
      description: "Get detailed node data from Figma API. Returns the raw node structure including properties, children, styles, etc. Use this when you need more context about component structure, variants, or properties beyond what's visible in the screenshot.",
      parameters: {
        type: "object",
        properties: {
          fileKey: {
            type: "string",
            description: "Figma file key"
          },
          nodeId: {
            type: "string",
            description: "Figma node ID"
          },
          depth: {
            type: "number",
            description: "How many levels deep to fetch children (default: 5)"
          }
        },
        required: ["fileKey", "nodeId"]
      }
    }
  }
];

// ===================================
// TOOL IMPLEMENTATIONS
// ===================================

/**
 * Fetch Figma screenshot URL
 */
export async function fetchFigmaScreenshot(fileKey, nodeId, scale = 1) {
  try {
    const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

    if (!FIGMA_TOKEN) {
      throw new Error("FIGMA_ACCESS_TOKEN not found in environment");
    }

    const response = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=png&scale=${scale}`,
      { headers: { "X-Figma-Token": FIGMA_TOKEN } }
    );

    const data = await response.json();

    if (!response.ok || data.err) {
      throw new Error(data.err || `Figma API error: ${response.status}`);
    }

    const screenshotUrl = data.images[nodeId];

    if (!screenshotUrl) {
      throw new Error("No screenshot URL returned from Figma");
    }

    return {
      success: true,
      fileKey,
      nodeId,
      screenshotUrl,
      scale
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Fetch Figma node data
 */
export async function fetchFigmaNodeData(fileKey, nodeId, depth = 5) {
  try {
    const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

    if (!FIGMA_TOKEN) {
      throw new Error("FIGMA_ACCESS_TOKEN not found in environment");
    }

    const response = await fetch(
      `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}&depth=${depth}`,
      { headers: { "X-Figma-Token": FIGMA_TOKEN } }
    );

    const data = await response.json();

    if (!response.ok || data.err) {
      throw new Error(data.err || `Figma API error: ${response.status}`);
    }

    const nodeData = data.nodes[nodeId];

    if (!nodeData) {
      throw new Error("No node data returned from Figma");
    }

    return {
      success: true,
      fileKey,
      nodeId,
      depth,
      nodeData: nodeData.document,
      metadata: {
        name: nodeData.document.name,
        type: nodeData.document.type,
        childCount: nodeData.document.children?.length || 0
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}