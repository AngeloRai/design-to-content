#!/usr/bin/env node

/**
 * ICON PROCESSOR
 * AI-driven icon processing - no deterministic logic
 * AI decides what is an icon and requests specific SVGs
 */

import { fetchIconSVG, callFigmaAPI } from './figma-utils.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Process specific icons requested by AI analysis
 * This is called ONLY when AI identifies specific nodes as icons
 *
 * @param {Object} figmaData - Contains fileKey from parsed Figma URL
 * @param {Array} iconRequests - Array of icon requests from AI, each containing:
 *   - nodeId: The Figma node ID
 *   - componentName: The React component name (e.g., "SearchIcon")
 *   - description: Optional description of the icon
 */
export const processIconsFromAIRequest = async (figmaData, iconRequests) => {
  if (!figmaData || !figmaData.fileKey || !iconRequests || iconRequests.length === 0) {
    console.log('ℹ️  No icon requests to process');
    return [];
  }

  try {
    console.log('\n🎨 PROCESSING ICONS REQUESTED BY AI');
    console.log(`📦 Processing ${iconRequests.length} icon requests...`);

    // Process each icon that AI specifically identified
    const iconComponents = [];
    for (const iconRequest of iconRequests) {
      try {
        // Fetch SVG for the specific node ID that AI identified as an icon
        const svgResult = await fetchIconSVG(figmaData.fileKey, iconRequest.nodeId);
        const componentCode = generateIconComponent(iconRequest.componentName, svgResult.svgContent);

        iconComponents.push({
          name: iconRequest.componentName,
          nodeId: iconRequest.nodeId,
          description: iconRequest.description || '',
          code: componentCode,
          svgContent: svgResult.svgContent
        });

        console.log(`  ✅ Generated ${iconRequest.componentName}`);
      } catch (error) {
        console.error(`  ❌ Failed to process icon ${iconRequest.componentName}:`, error.message);
      }
    }

    // Save icon components if any were successfully generated
    if (iconComponents.length > 0) {
      await saveIconComponents(iconComponents);
      console.log(`✅ Generated ${iconComponents.length} icon components total`);
    }

    return iconComponents;

  } catch (error) {
    console.error('❌ Icon processing failed:', error.message);
    return [];
  }
};

/**
 * Helper to get node structure for AI to analyze
 * Returns raw node data without any filtering or assumptions
 */
export const getNodeStructureForAI = async (figmaData) => {
  if (!figmaData || !figmaData.fileKey || !figmaData.nodeId) {
    return null;
  }

  try {
    // Get node data with depth to see structure
    const data = await callFigmaAPI(`/files/${figmaData.fileKey}/nodes`, {
      ids: figmaData.nodeId,
      depth: 3
    });

    if (!data.nodes || !data.nodes[figmaData.nodeId]) {
      return null;
    }

    const node = data.nodes[figmaData.nodeId].document;

    // Return simplified structure for AI to analyze
    return {
      fileKey: figmaData.fileKey,
      rootNodeId: figmaData.nodeId,
      nodeStructure: simplifyNodeStructure(node)
    };
  } catch (error) {
    console.error('Failed to get node structure:', error.message);
    return null;
  }
};

/**
 * Simplify node structure for AI analysis
 * Just provides the structure, no filtering or assumptions
 */
const simplifyNodeStructure = (node, depth = 0, maxDepth = 3) => {
  if (!node || depth > maxDepth) return null;

  const simplified = {
    id: node.id,
    name: node.name,
    type: node.type
  };

  // Add dimensions if available
  if (node.absoluteBoundingBox) {
    simplified.dimensions = {
      width: Math.round(node.absoluteBoundingBox.width),
      height: Math.round(node.absoluteBoundingBox.height)
    };
  }

  // Add children structure recursively
  if (node.children && node.children.length > 0) {
    simplified.children = node.children.map(child =>
      simplifyNodeStructure(child, depth + 1, maxDepth)
    ).filter(Boolean);
  }

  return simplified;
};

/**
 * Generate React component code for an icon
 * Creates a clean, reusable SVG component
 */
const generateIconComponent = (componentName, svgContent) => {
  // Clean and prepare SVG content
  let cleanSvg = svgContent
    .replace(/<svg[^>]*>/, '') // Remove opening svg tag
    .replace(/<\/svg>$/, '') // Remove closing svg tag
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return `import { cn } from '@/lib/utils';

interface ${componentName}Props {
  className?: string;
  size?: number;
}

export function ${componentName}({ className, size = 24 }: ${componentName}Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("inline-block", className)}
    >
      ${cleanSvg}
    </svg>
  );
}`;
};

/**
 * Save icon components to icons directory
 */
const saveIconComponents = async (iconComponents) => {
  const projectRoot = join(__dirname, '..', '..');
  const iconsDir = join(projectRoot, 'nextjs-app', 'ui', 'icons');

  // Ensure icons directory exists
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
  }

  for (const icon of iconComponents) {
    const filePath = join(iconsDir, `${icon.name}.tsx`);
    writeFileSync(filePath, icon.code);
    console.log(`  💾 ${icon.name} → ui/icons/${icon.name}.tsx`);
  }

  // Generate index file for easy imports
  const indexContent = iconComponents
    .map(icon => `export { ${icon.name} } from './${icon.name}';`)
    .join('\n') + '\n';

  writeFileSync(join(iconsDir, 'index.ts'), indexContent);
  console.log(`  📦 Generated icons/index.ts with ${iconComponents.length} exports`);
};

const iconProcessor = {
  processIconsFromAIRequest,
  getNodeStructureForAI
};

export default iconProcessor;