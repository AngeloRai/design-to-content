/**
 * MCP Agent Tools
 * Exposes Figma MCP tools to the AI agent during component generation
 *
 * These tools allow the agent to:
 * 1. Fetch additional Figma screenshots for visual verification
 * 2. Get precise CSS code from Figma nodes
 * 3. Explore child nodes for detailed specifications
 * 4. Dynamically add discovered CSS values to globals.css
 * 5. Read existing design tokens before adding new ones
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MCP Tool Definitions
 * These are OpenAI function calling tool schemas
 */
export const MCP_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'fetch_figma_screenshot',
      description: 'Fetch a screenshot of a Figma node for visual verification. Use this when you need to see the exact visual appearance of a component or design element.',
      parameters: {
        type: 'object',
        properties: {
          nodeId: {
            type: 'string',
            description: 'The Figma node ID to capture (e.g., "123:456")'
          },
          reason: {
            type: 'string',
            description: 'Why you need this screenshot (e.g., "verify button hover state styling")'
          }
        },
        required: ['nodeId', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fetch_figma_code',
      description: 'Get precise CSS/styling code for a Figma node. Use this when you need exact dimensions, colors, typography, or other CSS properties.',
      parameters: {
        type: 'object',
        properties: {
          nodeId: {
            type: 'string',
            description: 'The Figma node ID to get code for (e.g., "123:456")'
          },
          reason: {
            type: 'string',
            description: 'What CSS properties you need (e.g., "get exact button padding and border radius")'
          }
        },
        required: ['nodeId', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fetch_child_nodes',
      description: 'Explore child nodes of a Figma component to understand its internal structure. Use this when you need to understand how a component is built internally.',
      parameters: {
        type: 'object',
        properties: {
          nodeId: {
            type: 'string',
            description: 'The parent Figma node ID to explore (e.g., "123:456")'
          },
          reason: {
            type: 'string',
            description: 'Why you need to explore children (e.g., "understand card layout structure")'
          }
        },
        required: ['nodeId', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_design_token',
      description: 'Add a newly discovered CSS value to globals.css as a design token. Use this when you discover a CSS value from Figma that is not in the existing design tokens.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Token category: "color", "typography", "spacing", "border-radius", "shadow", "other"',
            enum: ['color', 'typography', 'spacing', 'border-radius', 'shadow', 'other']
          },
          name: {
            type: 'string',
            description: 'Token name (e.g., "color-accent-blue", "spacing-card-padding")'
          },
          value: {
            type: 'string',
            description: 'CSS value (e.g., "#3B82F6", "16px", "0 2px 4px rgba(0,0,0,0.1)")'
          },
          reason: {
            type: 'string',
            description: 'Why this token is needed (e.g., "button hover state color from Figma")'
          }
        },
        required: ['category', 'name', 'value', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_design_tokens',
      description: 'Read all existing design tokens from globals.css. Use this before adding new tokens to avoid duplicates.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Optional: Filter by category (color, typography, spacing, border-radius, shadow, other)',
            enum: ['color', 'typography', 'spacing', 'border-radius', 'shadow', 'other']
          }
        }
      }
    }
  }
];

/**
 * Create MCP tool executor
 * Wraps MCP bridge calls as OpenAI function executors
 *
 * @param {Object} mcpBridge - Active MCP bridge instance
 * @param {string} globalCssPath - Path to globals.css file
 * @returns {Function} Tool executor function
 */
export function createMcpToolExecutor(mcpBridge, globalCssPath) {
  return async function executeMcpTool(toolName, args) {
    console.log(`\n🔧 Executing MCP tool: ${toolName}`);
    console.log(`   Args:`, args);

    try {
      switch (toolName) {
        case 'fetch_figma_screenshot':
          return await fetchFigmaScreenshot(mcpBridge, args);

        case 'fetch_figma_code':
          return await fetchFigmaCode(mcpBridge, args);

        case 'fetch_child_nodes':
          return await fetchChildNodes(mcpBridge, args);

        case 'add_design_token':
          return await addDesignToken(globalCssPath, args);

        case 'read_design_tokens':
          return await readDesignTokens(globalCssPath, args);

        default:
          throw new Error(`Unknown MCP tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`❌ Error executing ${toolName}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  };
}

/**
 * Fetch Figma Screenshot
 * Calls get_screenshot via MCP bridge
 */
async function fetchFigmaScreenshot(mcpBridge, { nodeId, reason }) {
  console.log(`   📸 Fetching screenshot for node ${nodeId}: ${reason}`);

  const result = await mcpBridge.callTool('get_screenshot', {
    nodeId,
    clientLanguages: 'typescript,javascript',
    clientFrameworks: 'react,nextjs'
  });

  if (result.content && result.content.length > 0) {
    const screenshot = result.content[0];

    return {
      success: true,
      nodeId,
      screenshot: {
        type: screenshot.type,
        data: screenshot.data || screenshot.text,
        mimeType: screenshot.mimeType
      },
      message: `Screenshot captured for node ${nodeId}`
    };
  }

  return {
    success: false,
    error: 'No screenshot data returned from Figma'
  };
}

/**
 * Fetch Figma Code
 * Calls get_code via MCP bridge and extracts CSS values
 */
async function fetchFigmaCode(mcpBridge, { nodeId, reason }) {
  console.log(`   💻 Fetching code for node ${nodeId}: ${reason}`);

  const result = await mcpBridge.callTool('get_code', {
    nodeId,
    clientLanguages: 'typescript,javascript',
    clientFrameworks: 'react,nextjs',
    forceCode: true
  });

  if (result.content && result.content.length > 0) {
    const codeContent = result.content[0];
    const code = codeContent.text || '';

    // Extract CSS values from the code
    const cssValues = extractCssValues(code);

    return {
      success: true,
      nodeId,
      code,
      cssValues,
      message: `Code retrieved for node ${nodeId}`
    };
  }

  return {
    success: false,
    error: 'No code data returned from Figma'
  };
}

/**
 * Fetch Child Nodes
 * Calls get_metadata via MCP bridge to explore component structure
 */
async function fetchChildNodes(mcpBridge, { nodeId, reason }) {
  console.log(`   🔍 Fetching child nodes for ${nodeId}: ${reason}`);

  const result = await mcpBridge.callTool('get_metadata', {
    nodeId,
    clientLanguages: 'typescript,javascript',
    clientFrameworks: 'react,nextjs'
  });

  if (result.content && result.content.length > 0) {
    const metadataContent = result.content[0];
    const metadata = metadataContent.text || '';

    // Parse XML metadata to extract child nodes
    const childNodes = parseChildNodesFromXml(metadata);

    return {
      success: true,
      nodeId,
      metadata,
      childNodes,
      message: `Found ${childNodes.length} child nodes in ${nodeId}`
    };
  }

  return {
    success: false,
    error: 'No metadata returned from Figma'
  };
}

/**
 * Add Design Token
 * Appends a new design token to globals.css
 */
async function addDesignToken(globalCssPath, { category, name, value, reason }) {
  console.log(`   ➕ Adding design token: ${name} = ${value} (${category})`);
  console.log(`      Reason: ${reason}`);

  try {
    // Read existing globals.css
    const content = await fs.readFile(globalCssPath, 'utf-8');

    // Check if token already exists
    const tokenPattern = new RegExp(`--${name}:\\s*[^;]+;`, 'g');
    if (tokenPattern.test(content)) {
      return {
        success: false,
        error: `Token --${name} already exists in globals.css`,
        suggestion: 'Use read_design_tokens to check existing tokens first'
      };
    }

    // Find the appropriate category section or create it
    const categoryComment = getCategoryComment(category);
    let updatedContent;

    if (content.includes(categoryComment)) {
      // Add to existing category
      const lines = content.split('\n');
      const categoryIndex = lines.findIndex(line => line.includes(categoryComment));

      // Find the end of this category (next category or end of @theme)
      let insertIndex = categoryIndex + 1;
      while (insertIndex < lines.length &&
             !lines[insertIndex].trim().startsWith('/*') &&
             !lines[insertIndex].includes('}')) {
        insertIndex++;
      }

      // Insert new token
      const tokenLine = `    --${name}: ${value};`;
      lines.splice(insertIndex, 0, tokenLine);
      updatedContent = lines.join('\n');
    } else {
      // Create new category section
      const themeBlockEnd = content.lastIndexOf('}');
      const newSection = `\n  ${categoryComment}\n    --${name}: ${value};\n`;
      updatedContent = content.slice(0, themeBlockEnd) + newSection + content.slice(themeBlockEnd);
    }

    // Write updated content
    await fs.writeFile(globalCssPath, updatedContent, 'utf-8');

    return {
      success: true,
      token: {
        name: `--${name}`,
        value,
        category
      },
      message: `Successfully added design token --${name} to globals.css`
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to add design token: ${error.message}`
    };
  }
}

/**
 * Read Design Tokens
 * Parses and returns existing design tokens from globals.css
 */
async function readDesignTokens(globalCssPath, { category } = {}) {
  console.log(`   📖 Reading design tokens${category ? ` (category: ${category})` : ''}`);

  try {
    const content = await fs.readFile(globalCssPath, 'utf-8');

    // Extract tokens from @theme inline block
    const themeBlockMatch = content.match(/@theme inline\s*{([^}]+)}/s);
    if (!themeBlockMatch) {
      return {
        success: false,
        error: 'No @theme inline block found in globals.css'
      };
    }

    const themeContent = themeBlockMatch[1];
    const tokens = [];
    let currentCategory = 'uncategorized';

    // Parse tokens line by line
    const lines = themeContent.split('\n');
    for (const line of lines) {
      // Check for category comment
      const categoryMatch = line.match(/\/\*\s*([^*]+)\s*\*\//);
      if (categoryMatch) {
        currentCategory = categoryMatch[1].trim().toLowerCase();
        continue;
      }

      // Check for token definition
      const tokenMatch = line.match(/--([^:]+):\s*([^;]+);/);
      if (tokenMatch) {
        const tokenName = tokenMatch[1].trim();
        const tokenValue = tokenMatch[2].trim();

        tokens.push({
          name: `--${tokenName}`,
          value: tokenValue,
          category: currentCategory
        });
      }
    }

    // Filter by category if specified
    const filteredTokens = category
      ? tokens.filter(t => t.category.includes(category.toLowerCase()))
      : tokens;

    return {
      success: true,
      tokens: filteredTokens,
      totalCount: tokens.length,
      filteredCount: filteredTokens.length,
      message: `Found ${filteredTokens.length} design tokens${category ? ` in category ${category}` : ''}`
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to read design tokens: ${error.message}`
    };
  }
}

/**
 * Extract CSS values from Figma code
 * Looks for colors, spacing, typography, shadows, etc.
 */
function extractCssValues(code) {
  const values = {
    colors: [],
    spacing: [],
    typography: [],
    borderRadius: [],
    shadows: []
  };

  // Extract hex colors
  const hexColors = code.match(/#[0-9A-Fa-f]{3,8}/g) || [];
  values.colors.push(...hexColors);

  // Extract rgb/rgba colors
  const rgbColors = code.match(/rgba?\([^)]+\)/g) || [];
  values.colors.push(...rgbColors);

  // Extract spacing values (px, rem, em)
  const spacingValues = code.match(/\d+(?:px|rem|em)/g) || [];
  values.spacing.push(...[...new Set(spacingValues)]);

  // Extract font sizes
  const fontSizes = code.match(/fontSize:\s*['"]([^'"]+)['"]/g) || [];
  values.typography.push(...fontSizes.map(m => m.match(/['"]([^'"]+)['"]/)[1]));

  // Extract border radius
  const borderRadius = code.match(/borderRadius:\s*['"]([^'"]+)['"]/g) || [];
  values.borderRadius.push(...borderRadius.map(m => m.match(/['"]([^'"]+)['"]/)[1]));

  // Extract box shadows
  const shadows = code.match(/boxShadow:\s*['"]([^'"]+)['"]/g) || [];
  values.shadows.push(...shadows.map(m => m.match(/['"]([^'"]+)['"]/)[1]));

  return values;
}

/**
 * Parse child nodes from XML metadata
 */
function parseChildNodesFromXml(xml) {
  const nodes = [];

  // Simple XML parsing for node structure
  const nodeMatches = xml.matchAll(/<(\w+)[^>]*name="([^"]*)"[^>]*>/g);

  for (const match of nodeMatches) {
    const [, type, name] = match;
    nodes.push({
      type,
      name
    });
  }

  return nodes;
}

/**
 * Get category comment for globals.css
 */
function getCategoryComment(category) {
  const comments = {
    'color': '/* Colors */',
    'typography': '/* Typography */',
    'spacing': '/* Spacing */',
    'border-radius': '/* Border Radius */',
    'shadow': '/* Shadows */',
    'other': '/* Other */'
  };

  return comments[category] || comments.other;
}

export default {
  MCP_TOOLS,
  createMcpToolExecutor
};
