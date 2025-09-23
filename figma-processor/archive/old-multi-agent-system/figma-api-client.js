#!/usr/bin/env node

/**
 * Figma REST API Client - Functional Implementation
 * Handles all Figma API interactions for the multi-agent system
 */

import "dotenv/config";
import fs from "fs/promises";
import path from "path";

// Configuration
const API_CONFIG = {
  apiKey: process.env.FIGMA_ACCESS_TOKEN,
  baseUrl: "https://api.figma.com/v1",
};

if (!API_CONFIG.apiKey) {
  throw new Error("FIGMA_ACCESS_TOKEN environment variable is required");
}

/**
 * Generic Figma API call helper
 */
export async function callFigmaAPI(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_CONFIG.baseUrl}${endpoint}${queryString ? "?" + queryString : ""}`;

  const response = await fetch(url, {
    headers: {
      "X-Figma-Token": API_CONFIG.apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Figma API error: ${response.status} - ${await response.text()}`
    );
  }

  return await response.json();
}

/**
 * Get node data and structure from Figma
 * @param {string} fileKey - Figma file key
 * @param {string|string[]} nodeIds - Single node ID or array of node IDs
 * @param {number} depth - How deep to traverse child nodes (default: 5)
 */
export async function getNodeData(fileKey, nodeIds, depth = 5) {
  const ids = Array.isArray(nodeIds) ? nodeIds.join(",") : nodeIds;

  const data = await callFigmaAPI(`/files/${fileKey}/nodes`, {
    ids,
    depth,
  });

  return data;
}

/**
 * Get screenshots for Figma nodes
 * @param {string} fileKey - Figma file key
 * @param {string|string[]} nodeIds - Single node ID or array of node IDs
 * @param {number} scale - Image scale (1, 2, or 4)
 * @param {string} format - Image format ('png' or 'jpg')
 */
export async function getNodeScreenshots(
  fileKey,
  nodeIds,
  scale = 2,
  format = "png"
) {
  const ids = Array.isArray(nodeIds) ? nodeIds.join(",") : nodeIds;

  const data = await callFigmaAPI(`/images/${fileKey}`, {
    ids,
    scale,
    format,
  });

  return data;
}

/**
 * Download image from URL and save to local file
 * @param {string} imageUrl - S3 URL from Figma API
 * @param {string} savePath - Local path to save the image
 */
export async function downloadImage(imageUrl, savePath) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    // Ensure directory exists
    const dir = path.dirname(savePath);
    await fs.mkdir(dir, { recursive: true });

    // Save the image
    const buffer = await response.arrayBuffer();
    await fs.writeFile(savePath, Buffer.from(buffer));

    return savePath;
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Extract file key and node ID from Figma URL
 * @param {string} figmaUrl - Full Figma URL
 */
export function extractUrlInfo(figmaUrl) {
  try {
    const urlMatch = figmaUrl.match(
      /design\/([a-zA-Z0-9]+).*node-id=([0-9-:]+)/
    );
    if (!urlMatch) {
      throw new Error("Invalid Figma URL format");
    }

    const fileKey = urlMatch[1];
    const nodeId = urlMatch[2].replace("-", ":");

    return { fileKey, nodeId };
  } catch (error) {
    throw new Error(`Failed to parse Figma URL: ${error.message}`);
  }
}

/**
 * Get all child nodes recursively from a parent node
 * @param {Object} node - Figma node object
 * @param {Array} allNodes - Array to collect all nodes
 */
export function getChildNodesRecursively(node, allNodes = []) {
  allNodes.push(node);

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      getChildNodesRecursively(child, allNodes);
    }
  }

  return allNodes;
}

/**
 * Check if a node represents a UI element using AI-powered detection
 * @param {Object} node - Figma node object
 * @param {Object} options - Detection options
 */
export async function isUIElement(node, options = {}) {
  // Quick exclusions for obviously non-UI node types
  const skipTypes = ["GROUP", "SECTION"];
  if (skipTypes.includes(node.type)) {
    return false;
  }

  // For performance, use AI detection only when needed
  if (options.useAI && options.openaiApiKey) {
    return await isUIElementAI(node, options.openaiApiKey);
  }

  // Fallback: simple heuristics for basic filtering
  return isUIElementBasic(node);
}

/**
 * AI-powered UI element detection using OpenAI
 * @param {Object} node - Figma node object
 * @param {string} apiKey - OpenAI API key
 */
async function isUIElementAI(node, apiKey) {
  try {
    const prompt = `Analyze this Figma node and determine if it represents a functional UI element or component:

Node Name: "${node.name}"
Node Type: "${node.type}"

A UI element is ANYTHING users can interact with or that displays functional content, including:
- Buttons, inputs, dropdowns, form fields, textareas
- Checkboxes, radio buttons, switches, sliders, toggles
- Icons (all types: action icons, social icons, navigation icons, decorative icons)
- Badges, avatars, cards, chips, tags
- Interactive components and their variants
- Individual form controls (each checkbox, each radio button, each input)
- Navigation elements (breadcrumbs, pagination, tabs)
- Feedback elements (alerts, notifications, toasts, tooltips)
- Data display elements (tables, lists, charts)
- Media elements (images with functional purpose, videos with controls)

IMPORTANT: Each individual interactive element should be considered a UI element:
- If you see "Checkbox - Checked" or "Radio Button - Selected" - these ARE UI elements
- If you see individual icons like "Search Icon" or "User Icon" - these ARE UI elements
- If you see form states like "Input - Error" or "Button - Disabled" - these ARE UI elements

NOT UI elements (only these specific cases):
- Section headers/labels describing categories (like "Form Controls", "Navigation Icons")
- Pure documentation text or instructional content
- Layout grids or spacing guides
- Color palette swatches labeled as "Colors" or "Palette"

Key principle: When in doubt, choose "true" - we want to capture ALL functional UI elements.

Respond with only "true" or "false".`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 10,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      console.warn(
        `OpenAI API error: ${response.status}, falling back to basic detection`
      );
      return isUIElementBasic(node);
    }

    const data = await response.json();
    const result = data.choices[0]?.message?.content?.trim().toLowerCase();

    return result === "true";
  } catch (error) {
    console.warn(
      `AI detection failed: ${error.message}, falling back to basic detection`
    );
    return isUIElementBasic(node);
  }
}

/**
 * Basic heuristic-based UI element detection (fallback)
 * @param {Object} node - Figma node object
 */
function isUIElementBasic(node) {
  // GENERIC APPROACH - Use only structural properties, no name patterns!

  // Skip only structural non-UI elements
  // GROUP and SECTION are organizational, not UI
  if (node.type === "GROUP" || node.type === "SECTION") {
    return false;
  }

  // Skip empty or purely decorative rectangles/ellipses
  if ((node.type === "RECTANGLE" || node.type === "ELLIPSE") &&
      (!node.fills || node.fills.length === 0) &&
      (!node.strokes || node.strokes.length === 0)) {
    return false;
  }

  // Everything else could be a UI element
  // Let the categorization phase determine what type
  return true;
}

/**
 * Check if a UI element is component-worthy (should have a React component generated)
 * @param {Object} node - Figma node object
 */
export function isComponentWorthy(node) {

  // COMPONENT_SET is the highest priority - these show complete component systems
  if (node.type === "COMPONENT_SET") {
    return true;
  }

  // For individual COMPONENTs and INSTANCEs, use structural checks
  if (["COMPONENT", "INSTANCE"].includes(node.type)) {
    // Skip nested instance elements (internal parts) - this is structural
    if (node.id.includes(";")) {
      return false;
    }

    // Skip if it's a very large container (likely a layout example)
    if (node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox;
      // Very large components are usually page layouts or examples
      if (width > 1200 || height > 800) {
        return false;
      }
    }

    // Include all other components and instances
    return true;
  }

  return false;
}

/**
 * Generate semantic filename for screenshot
 * @param {Object} element - UI element object with nodeId, name, category
 * @param {string} category - UI element category
 */
export function generateScreenshotFilename(element, category) {
  // GENERIC APPROACH - Works with any Figma project

  const nodeId = element.nodeId || element.id || "unknown";
  const name = element.name || "";

  // Generic cleaning - only basic sanitization
  let cleanName = name
    .replace(/[^a-zA-Z0-9\s-_]/g, "") // Keep alphanumeric, spaces, hyphens, underscores
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .substring(0, 30) // Limit length for filesystem
    .toLowerCase()
    .trim();

  // If no valid name, use node type
  if (!cleanName || cleanName.length < 2) {
    cleanName = element.type ? element.type.toLowerCase() : "element";
  }

  // Build filename: category-name-id for uniqueness
  const safeNodeId = nodeId.replace(/[^a-zA-Z0-9]/g, "-");

  return `${category}-${cleanName}-${safeNodeId}.png`;
}

/**
 * Categorize UI element by type using AI-powered detection
 * @param {Object} node - Figma node object
 * @param {Object} options - Categorization options
 */
export async function categorizeUIElement(node, options = {}) {
  // For performance, use AI categorization only when needed
  if (options.useAI && options.openaiApiKey) {
    return await categorizeUIElementAI(node, options.openaiApiKey);
  }

  // Fallback: simple type-based categorization
  return categorizeUIElementBasic(node);
}

/**
 * AI-powered UI element categorization using OpenAI
 * @param {Object} node - Figma node object
 * @param {string} apiKey - OpenAI API key
 */
async function categorizeUIElementAI(node, apiKey) {
  try {
    const prompt = `Analyze this Figma UI element and determine what type of UI component it represents:

Node Name: "${node.name}"
Node Type: "${node.type}"

Based on the name and type, determine what kind of UI component this is. Consider its likely function and purpose.

Examples of UI component types: button, input, checkbox, radio, switch, slider, dropdown, badge, avatar, icon, card, divider, modal, tooltip, accordion, tab, breadcrumb, pagination, datepicker, carousel, stepper, progress, chart, table, etc.

Respond with a single descriptive word (lowercase) that best represents this UI component type. Be creative and specific - if it's something unique, create an appropriate category name.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 10,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      console.warn(
        `OpenAI API error: ${response.status}, falling back to basic categorization`
      );
      return categorizeUIElementBasic(node);
    }

    const data = await response.json();
    const category = data.choices[0]?.message?.content?.trim().toLowerCase();

    // Accept any category the AI provides - completely dynamic!
    if (category && category.length > 0) {
      return category;
    }

    console.warn(
      `Empty AI category response, falling back to basic categorization`
    );
    return categorizeUIElementBasic(node);
  } catch (error) {
    console.warn(
      `AI categorization failed: ${error.message}, falling back to basic categorization`
    );
    return categorizeUIElementBasic(node);
  }
}

/**
 * Basic heuristic-based UI element categorization (fallback)
 * @param {Object} node - Figma node object
 */
function categorizeUIElementBasic(node) {
  const type = node.type;

  // Simple type-based categorization as fallback
  if (type === "VECTOR") {
    return "icon";
  }

  if (type === "TEXT") {
    return "text";
  }

  if (type === "COMPONENT_SET") {
    return "element";
  }

  if (["COMPONENT", "INSTANCE"].includes(type)) {
    return "component";
  }

  if (type === "FRAME") {
    return "frame";
  }

  if (type === "LINE") {
    return "divider";
  }

  // Default fallback
  return "element";
}

/**
 * Check if a UI element is an icon that should be processed as SVG
 * @param {Object} node - Figma node object
 * @param {Object} options - Detection options
 */
export async function isIcon(node, options = {}) {
    // Quick type-based check for obvious icons
    if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION") {
        return true;
    }

    // Check for small instances/components that are likely icons
    if ((node.type === "INSTANCE" || node.type === "COMPONENT") && node.absoluteBoundingBox) {
        const { width, height } = node.absoluteBoundingBox;
        // Small square-ish elements are likely icons
        if (width <= 64 && height <= 64 && Math.abs(width - height) <= 20) {
            return true;
        }
    }

    // For other types, use AI detection if available
    if (options.useAI && options.openaiApiKey) {
        return await isIconAI(node, options.openaiApiKey);
    }

    // Fallback: name-based heuristics
    return isIconBasic(node);
}

/**
 * AI-powered icon detection
 * @param {Object} node - Figma node object
 * @param {string} apiKey - OpenAI API key
 */
async function isIconAI(node, apiKey) {
    try {
        const prompt = `Analyze this Figma node and determine if it represents an icon:

Node Name: "${node.name}"
Node Type: "${node.type}"

An icon is a small graphic symbol that represents an action, object, or concept, such as:
- Action icons (search, close, menu, edit, delete, save, etc.)
- Navigation icons (arrow, chevron, home, back, etc.)
- Social media icons (facebook, twitter, linkedin, etc.)
- Status icons (check, error, warning, info, etc.)
- Interface icons (user, settings, notification, etc.)
- File type icons (pdf, doc, image, etc.)
- Communication icons (mail, phone, chat, etc.)

Icons are typically:
- Simple, recognizable symbols
- Used for navigation or actions
- Small graphical elements
- Vector-based graphics

NOT icons:
- Complex illustrations or artwork
- Photos or detailed images
- Large decorative graphics
- UI components like buttons or forms

Respond with only "true" or "false".`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 10,
                temperature: 0
            })
        });

        if (!response.ok) {
            console.warn(`OpenAI API error: ${response.status}, falling back to basic detection`);
            return isIconBasic(node);
        }

        const data = await response.json();
        const result = data.choices[0]?.message?.content?.trim().toLowerCase();

        return result === 'true';
    } catch (error) {
        console.warn(`AI icon detection failed: ${error.message}, falling back to basic detection`);
        return isIconBasic(node);
    }
}

/**
 * Basic heuristic-based icon detection (fallback)
 * @param {Object} node - Figma node object
 */
function isIconBasic(node) {
    // GENERIC APPROACH - No hardcoded patterns!
    // Only use structural properties from Figma

    // 1. Vector and boolean operation types are icons
    if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION") {
        return true;
    }

    // 2. Small, roughly square elements are often icons
    if (node.absoluteBoundingBox) {
        const { width, height } = node.absoluteBoundingBox;
        const area = width * height;
        const aspectRatio = Math.max(width, height) / Math.min(width, height);

        // Small area + square-ish aspect ratio
        if (area <= 10000 && aspectRatio <= 1.5) { // 100x100 max, roughly square
            // Additional structural check: simple elements (few or no children)
            if (!node.children || node.children.length <= 3) {
                return true;
            }
        }
    }

    // 3. Single-vector components/instances are likely icons
    if ((node.type === "COMPONENT" || node.type === "INSTANCE") && node.children) {
        // Component with single vector child
        if (node.children.length === 1 && node.children[0].type === "VECTOR") {
            return true;
        }

        // Small component with only vector children
        if (node.children.length <= 3 &&
            node.children.every(child => child.type === "VECTOR" || child.type === "BOOLEAN_OPERATION")) {
            return true;
        }
    }

    // 4. Component sets that are small and square (icon variants)
    if (node.type === "COMPONENT_SET" && node.absoluteBoundingBox) {
        const { width, height } = node.absoluteBoundingBox;
        // Small component sets are often icon sets
        if (width <= 200 && height <= 200) {
            return true;
        }
    }

    return false;
}

/**
 * Get SVG content for an icon node
 * @param {string} fileKey - Figma file key
 * @param {string} nodeId - Icon node ID
 */
export async function getIconSVG(fileKey, nodeId) {
    try {
        const data = await callFigmaAPI(`/images/${fileKey}`, {
            ids: nodeId,
            format: 'svg'
        });

        if (data.images && data.images[nodeId]) {
            const svgUrl = data.images[nodeId];
            const response = await fetch(svgUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch SVG: ${response.status}`);
            }
            return await response.text();
        }

        throw new Error('No SVG URL returned from Figma API');
    } catch (error) {
        throw new Error(`Failed to get icon SVG: ${error.message}`);
    }
}

/**
 * Generate icon component filename
 * @param {Object} element - Icon element object
 */
export function generateIconFilename(element) {
    // GENERIC APPROACH - No project-specific assumptions!

    const name = element.name || '';
    const nodeId = element.nodeId || element.id || 'unknown';

    // Generic cleaning - only remove truly invalid characters
    let cleanName = name
        .replace(/[^a-zA-Z0-9\s-_]/g, '') // Keep only alphanumeric, spaces, hyphens, underscores
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .trim();

    // If name is too short, too long, or only numbers, use type + ID
    if (!cleanName || cleanName.length < 3 || cleanName.length > 50 || /^[0-9-_]+$/.test(cleanName)) {
        // Use node type and ID for completely generic naming
        const nodeType = element.type ? element.type.toLowerCase() : 'element';
        cleanName = `${nodeType}-${nodeId.replace(/[^a-zA-Z0-9]/g, '-')}`;
    }

    // Truncate if still too long
    if (cleanName.length > 50) {
        cleanName = cleanName.substring(0, 50).replace(/[-_]+$/, '');
    }

    // Convert to PascalCase for React component
    const pascalName = cleanName
        .split(/[-_]/)
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');

    // Ensure valid component name
    const finalName = pascalName || 'Component';

    return `${finalName}Icon.tsx`;
}

/**
 * Extract variants and sizes from element name using AI
 * @param {string} name - Element name
 * @param {Object} options - Extraction options
 */
export async function extractVariantsAndSizes(name, options = {}) {
  // For performance, use AI extraction only when needed
  if (options.useAI && options.openaiApiKey) {
    return await extractVariantsAndSizesAI(name, options.openaiApiKey);
  }

  // Fallback: basic extraction
  return extractVariantsAndSizesBasic(name);
}

/**
 * AI-powered variant and size extraction
 * @param {string} name - Element name
 * @param {string} apiKey - OpenAI API key
 */
async function extractVariantsAndSizesAI(name, apiKey) {
  try {
    const prompt = `Analyze this UI element name and extract variants and sizes:

Element Name: "${name}"

Extract:
1. VARIANTS: Style variants like primary, secondary, destructive, outline, ghost, success, warning, error, info, filled, etc.
2. SIZES: Size variants like small, sm, medium, md, large, lg, xl, xs, etc.

Return a JSON object with this exact format:
{
  "variants": ["variant1", "variant2"],
  "sizes": ["size1", "size2"]
}

If no variants or sizes are found, return empty arrays.
Respond with ONLY the JSON object.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      console.warn(
        `OpenAI API error: ${response.status}, falling back to basic extraction`
      );
      return extractVariantsAndSizesBasic();
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    const result = JSON.parse(content);
    if (
      result.variants &&
      result.sizes &&
      Array.isArray(result.variants) &&
      Array.isArray(result.sizes)
    ) {
      return result;
    }

    console.warn(
      `Invalid AI extraction result, falling back to basic extraction`
    );
    return extractVariantsAndSizesBasic();
  } catch (error) {
    console.warn(
      `AI extraction failed: ${error.message}, falling back to basic extraction`
    );
    return extractVariantsAndSizesBasic();
  }
}

/**
 * Basic heuristic-based variant and size extraction (fallback)
 */
function extractVariantsAndSizesBasic() {
  // Simple fallback - just return empty arrays and let AI handle everything
  return {
    variants: [],
    sizes: [],
  };
}
