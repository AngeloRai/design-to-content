#!/usr/bin/env node

/**
 * SVG EXTRACTOR - Extract SVG icons from Figma nodes
 * Only called when icons are detected in components
 */

/**
 * Extract icons from a specific node
 * @param {string} nodeId - The ID of the node to search
 * @param {object} rootNode - The root node document from Figma
 * @returns {Array} Array of extracted icon data
 */
export const extractIconsFromNode = (nodeId, rootNode) => {
  const node = findNodeById(rootNode, nodeId);
  if (!node) return [];

  const icons = [];

  // Traverse to find VECTOR nodes
  traverseForVectors(node, (vectorNode, parent) => {
    if (vectorNode.type === 'VECTOR' || vectorNode.type === 'BOOLEAN_OPERATION') {
      const iconName = deriveIconName(vectorNode, parent);

      // Extract SVG data if available
      const svgPath = extractSVGPath(vectorNode);
      if (svgPath) {
        const svgData = {
          name: iconName,
          nodeId: vectorNode.id,
          svgPath: svgPath,
          viewBox: calculateViewBox(vectorNode),
          fill: extractFillColor(vectorNode),
          stroke: extractStrokeColor(vectorNode)
        };
        icons.push(svgData);
      }
    }
  });

  return deduplicateIcons(icons);
};

/**
 * Extract SVG path from VECTOR node
 */
const extractSVGPath = (vectorNode) => {
  // Check for fillGeometry (Figma API provides this with geometry=paths parameter)
  if (vectorNode.fillGeometry && vectorNode.fillGeometry.length > 0) {
    return vectorNode.fillGeometry[0].path;
  }

  // Fallback to strokeGeometry if no fill
  if (vectorNode.strokeGeometry && vectorNode.strokeGeometry.length > 0) {
    return vectorNode.strokeGeometry[0].path;
  }

  return null;
};

/**
 * Calculate viewBox from bounding box
 */
const calculateViewBox = (node) => {
  if (!node.absoluteBoundingBox) return "0 0 24 24"; // Default fallback

  const { width, height } = node.absoluteBoundingBox;
  return `0 0 ${Math.round(width)} ${Math.round(height)}`;
};

/**
 * Extract fill color from node
 */
const extractFillColor = (node) => {
  if (!node.fills || node.fills.length === 0) return "currentColor";

  const visibleFills = node.fills.filter(f => f.visible !== false);
  if (visibleFills.length === 0) return "currentColor";

  const fill = visibleFills[0];
  if (fill.type === 'SOLID' && fill.color) {
    const { r, g, b, a = 1 } = fill.color;
    const hex = rgbToHex(r, g, b);
    return a < 1 ? `${hex}${Math.round(a * 255).toString(16).padStart(2, '0')}` : hex;
  }

  return "currentColor";
};

/**
 * Extract stroke color from node
 */
const extractStrokeColor = (node) => {
  if (!node.strokes || node.strokes.length === 0) return null;

  const visibleStrokes = node.strokes.filter(s => s.visible !== false);
  if (visibleStrokes.length === 0) return null;

  const stroke = visibleStrokes[0];
  if (stroke.type === 'SOLID' && stroke.color) {
    const { r, g, b, a = 1 } = stroke.color;
    const hex = rgbToHex(r, g, b);
    return a < 1 ? `${hex}${Math.round(a * 255).toString(16).padStart(2, '0')}` : hex;
  }

  return null;
};

/**
 * Convert RGB (0-1) to hex color
 */
const rgbToHex = (r, g, b) => {
  const toHex = (val) => {
    const hex = Math.round(val * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Derive icon name from context
 */
const deriveIconName = (vectorNode, parent) => {
  let name = vectorNode.name;

  // If generic name, use parent context
  if (name === 'Vector' || name === 'Icon' || name === 'Path') {
    name = parent?.name || 'Icon';
  }

  // Clean up common icon naming patterns
  name = name
    .replace(/^(teenyicons:|icon-|ic-)/i, '') // Remove common prefixes
    .replace(/[-_]/g, ' ') // Replace separators with spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  // Handle specific patterns
  if (name.toLowerCase().includes('arrow')) {
    if (name.toLowerCase().includes('right')) return 'ArrowRight';
    if (name.toLowerCase().includes('left')) return 'ArrowLeft';
    if (name.toLowerCase().includes('up')) return 'ArrowUp';
    if (name.toLowerCase().includes('down')) return 'ArrowDown';
  }

  if (name.toLowerCase().includes('play')) return 'Play';
  if (name.toLowerCase().includes('pause')) return 'Pause';
  if (name.toLowerCase().includes('stop')) return 'Stop';
  if (name.toLowerCase().includes('close')) return 'Close';
  if (name.toLowerCase().includes('menu')) return 'Menu';
  if (name.toLowerCase().includes('search')) return 'Search';

  // Ensure it ends with Icon if it doesn't already
  if (!name.endsWith('Icon')) {
    name += 'Icon';
  }

  return name;
};

/**
 * Traverse node tree to find VECTOR nodes
 */
const traverseForVectors = (node, callback, parent = null) => {
  if (!node) return;

  if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') {
    callback(node, parent);
  }

  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(child => {
      traverseForVectors(child, callback, node);
    });
  }
};

/**
 * Find node by ID in tree
 */
const findNodeById = (node, targetId) => {
  if (!node) return null;
  if (node.id === targetId) return node;

  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findNodeById(child, targetId);
      if (found) return found;
    }
  }

  return null;
};

/**
 * Deduplicate icons by SVG path similarity
 */
const deduplicateIcons = (icons) => {
  const unique = new Map();

  icons.forEach(icon => {
    // Use first 100 chars of path as key for deduplication
    const key = icon.svgPath ? icon.svgPath.substring(0, 100) : icon.name;
    if (!unique.has(key)) {
      unique.set(key, icon);
    } else {
      // If duplicate, prefer the one with a better name
      const existing = unique.get(key);
      if (icon.name.length < existing.name.length && !icon.name.includes('Icon')) {
        unique.set(key, icon);
      }
    }
  });

  return Array.from(unique.values());
};

/**
 * Generate React component code for icon
 */
export const generateIconComponent = (iconData) => {
  const componentName = iconData.name.endsWith('Icon') ? iconData.name : `${iconData.name}Icon`;

  return `export const ${componentName} = ({ className, ...props }) => (
  <svg
    viewBox="${iconData.viewBox}"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path
      d="${iconData.svgPath}"
      fill="${iconData.fill === 'currentColor' ? 'currentColor' : iconData.fill}"
      ${iconData.stroke ? `stroke="${iconData.stroke}"` : ''}
    />
  </svg>
);`;
};

/**
 * Generate icon manifest for imports
 */
export const generateIconManifest = (extractedIcons) => {
  if (!extractedIcons || extractedIcons.length === 0) return null;

  const manifest = {
    count: extractedIcons.length,
    icons: extractedIcons.map(icon => ({
      name: icon.name,
      componentName: icon.name.endsWith('Icon') ? icon.name : `${icon.name}Icon`,
      hasStroke: !!icon.stroke,
      defaultColor: icon.fill
    }))
  };

  return manifest;
};

/**
 * Batch extract all icons from the design
 * Uses Figma API to export actual SVG files
 * @param {object} rootNode - The root node document from Figma
 * @param {string} fileKey - The Figma file key
 * @param {array} componentInstances - Component instances from metadata (optional)
 * @returns {Array} Array of extracted icon data
 */
export const batchExtractIcons = async (rootNode, fileKey, componentInstances = []) => {
  console.log("🔎 Scanning for all VECTOR nodes in design...");

  // Collect all VECTOR nodes and icon-like FRAMES from the entire tree
  const iconNodes = [];
  const processedIds = new Set();

  // Find all potential icon nodes in the tree
  const findAllIcons = (node, parent = null, depth = 0) => {
    if (!node || depth > 10) return; // Limit depth to avoid infinite recursion

    // Include VECTOR, BOOLEAN_OPERATION, and FRAME nodes that look like icons
    const isIconNode =
      (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') ||
      (node.type === 'FRAME' && node.name.toLowerCase().includes('icon')) ||
      (node.type === 'COMPONENT' && node.name.toLowerCase().includes('icon'));

    if (isIconNode && !processedIds.has(node.id)) {
      processedIds.add(node.id);
      iconNodes.push({
        node: node,
        parent: parent,
        id: node.id,
        name: deriveIconName(node, parent)
      });
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(child => findAllIcons(child, node, depth + 1));
    }
  };

  findAllIcons(rootNode);

  if (iconNodes.length === 0) {
    console.log("No icon nodes found");
    return [];
  }

  console.log(`Found ${iconNodes.length} potential icon nodes to process`);

  // Fetch SVGs from Figma API
  try {
    const figmaToken = process.env.FIGMA_ACCESS_TOKEN;
    if (!figmaToken) {
      console.error("❌ FIGMA_ACCESS_TOKEN not found - falling back to path extraction");
      return fallbackToPathExtraction(iconNodes);
    }

    const icons = [];

    // Batch request SVGs (Figma API limits to ~50 IDs per request)
    const chunkSize = 50;
    for (let i = 0; i < iconNodes.length; i += chunkSize) {
      const chunk = iconNodes.slice(i, i + chunkSize);
      const nodeIds = chunk.map(n => n.id).join(',');

      console.log(`📥 Fetching SVGs for batch ${Math.floor(i/chunkSize) + 1}...`);

      const response = await fetch(
        `https://api.figma.com/v1/images/${fileKey}?ids=${nodeIds}&format=svg`,
        {
          headers: {
            'X-Figma-Token': figmaToken
          }
        }
      );

      if (!response.ok) {
        console.error(`❌ Figma API error: ${response.statusText}`);
        continue;
      }

      const data = await response.json();

      // Fetch actual SVG content from URLs
      for (const iconNode of chunk) {
        const svgUrl = data.images[iconNode.id];
        if (!svgUrl) continue;

        try {
          const svgResponse = await fetch(svgUrl);
          const svgContent = await svgResponse.text();

          // Clean up the SVG content
          const cleanedSvg = cleanupSvgContent(svgContent);

          icons.push({
            name: iconNode.name,
            nodeId: iconNode.id,
            svgContent: cleanedSvg,
            viewBox: extractViewBox(svgContent) || calculateViewBox(iconNode.node),
            // Extract just the inner content (paths, groups, etc) without the outer svg tag
            innerContent: extractInnerSvgContent(svgContent)
          });
        } catch (error) {
          console.error(`Failed to fetch SVG for ${iconNode.name}: ${error.message}`);
        }
      }
    }

    // Deduplicate icons by nodeId (some nodes might appear in multiple contexts)
    const uniqueIcons = [];
    const seenNodeIds = new Set();

    icons.forEach(icon => {
      if (!seenNodeIds.has(icon.nodeId)) {
        seenNodeIds.add(icon.nodeId);
        uniqueIcons.push(icon);
      }
    });

    console.log(`✅ Successfully fetched ${uniqueIcons.length} unique icon SVGs (from ${icons.length} total)`);
    return uniqueIcons;

  } catch (error) {
    console.error(`❌ Failed to fetch SVGs from Figma: ${error.message}`);
    return fallbackToPathExtraction(iconNodes);
  }
};

/**
 * Extract viewBox from SVG content
 */
const extractViewBox = (svgContent) => {
  const match = svgContent.match(/viewBox="([^"]+)"/);
  return match ? match[1] : null;
};

/**
 * Extract inner SVG content (everything between <svg> tags)
 */
const extractInnerSvgContent = (svgContent) => {
  // Match everything between <svg> and </svg> tags
  const match = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  if (match && match[1]) {
    return match[1].trim();
  }
  // If no match, return the whole content (might already be inner content)
  return svgContent;
};

/**
 * Clean up SVG content for React usage
 */
const cleanupSvgContent = (svgContent) => {
  return svgContent
    // Convert style attributes to React-compatible
    .replace(/style="([^"]*)"/g, (match, styles) => {
      const reactStyles = styles
        .split(';')
        .filter(s => s.trim())
        .map(style => {
          const [prop, value] = style.split(':').map(s => s.trim());
          const camelProp = prop.replace(/-([a-z])/g, (m, p1) => p1.toUpperCase());
          return `${camelProp}: '${value}'`;
        })
        .join(', ');
      return `style={{${reactStyles}}}`;
    })
    // Convert other attributes to React format
    .replace(/class=/g, 'className=')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=');
};

/**
 * Fallback to extracting paths from geometry when API fails
 */
const fallbackToPathExtraction = (iconNodes) => {
  console.log("⚠️  Using fallback path extraction method...");
  const icons = [];

  iconNodes.forEach(({ node, parent, name }) => {
    const svgPath = extractSVGPath(node);
    if (svgPath) {
      icons.push({
        name: name,
        nodeId: node.id,
        svgPath: svgPath,
        viewBox: calculateViewBox(node),
        fill: extractFillColor(node),
        stroke: extractStrokeColor(node),
        // For fallback, we only have the path
        innerContent: `<path d="${svgPath}" fill="currentColor" />`
      });
    }
  });

  const uniqueIcons = deduplicateIcons(icons);
  console.log(`✅ Extracted ${uniqueIcons.length} unique icons from ${iconNodes.length} nodes`);
  return uniqueIcons;
};

export default {
  extractIconsFromNode,
  batchExtractIcons,
  generateIconComponent,
  generateIconManifest
};