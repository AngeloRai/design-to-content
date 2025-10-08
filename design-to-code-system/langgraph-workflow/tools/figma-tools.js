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
 * This is now a thin wrapper that calls the utils implementation
 */
export async function fetchFigmaScreenshot(fileKey, nodeId, scale = 1) {
  try {
    // Import the utils function dynamically to avoid circular dependencies
    const { fetchFigmaScreenshot: utilsFetchScreenshot } = await import(
      "../../utils/figma-integration.js"
    );

    // Call utils function with appropriate options
    const result = await utilsFetchScreenshot(fileKey, nodeId, {
      format: 'png',
      scale: scale.toString()
    });

    // Convert utils response format to tool response format
    return {
      success: true,
      fileKey,
      nodeId,
      screenshotUrl: result.url,
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
 * This is now a thin wrapper that calls the utils implementation
 */
export async function fetchFigmaNodeData(fileKey, nodeId, depth = 5) {
  try {
    // Import the utils function dynamically to avoid circular dependencies
    const { fetchNodeData: utilsFetchNodeData } = await import(
      "../../utils/figma-integration.js"
    );

    // Call utils function
    const result = await utilsFetchNodeData(fileKey, nodeId, depth);

    // Convert utils response format to tool response format
    return {
      success: true,
      fileKey,
      nodeId,
      depth,
      nodeData: result.nodeData.rawDocument,
      metadata: result.metadata
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}