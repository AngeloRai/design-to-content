#!/usr/bin/env node

/**
 * Discovery Agent - Functional Implementation
 * Traverses large Figma parent nodes and systematically categorizes all UI elements
 */

import {
    extractUrlInfo,
    getNodeData,
    getNodeScreenshots,
    downloadImage,
    getChildNodesRecursively,
    isUIElement,
    categorizeUIElement,
    extractVariantsAndSizes,
    generateScreenshotFilename,
    isIcon,
    getIconSVG,
    generateIconFilename
} from '../shared/figma-api-client.js';
import { processBatchWithAI } from '../shared/openai-batch-processor.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PATHS = {
    dataDir: path.join(__dirname, '../data'),
    screenshotsDir: path.join(__dirname, '../screenshots'),
    iconsDir: path.join(__dirname, '../icons')
};

/**
 * Main discovery process
 * @param {string} figmaUrl - Parent node URL to explore
 * @param {Object} options - Discovery options
 */
export async function discover(figmaUrl, options = {}) {
    console.log('🔍 Discovery Agent: Starting UI element discovery...\n');

    try {
        // Extract file info from URL
        const { fileKey, nodeId } = extractUrlInfo(figmaUrl);
        console.log(`📁 File Key: ${fileKey}`);
        console.log(`📍 Parent Node: ${nodeId}\n`);

        // Get parent node data
        console.log('🔄 Fetching parent node data...');
        const nodeData = await getNodeData(fileKey, nodeId, 10);

        if (!nodeData.nodes[nodeId]) {
            throw new Error('Parent node not found');
        }

        const parentNode = nodeData.nodes[nodeId].document;
        console.log(`✅ Found parent node: "${parentNode.name}"\n`);

        // Discover all child UI elements
        console.log('🔄 Analyzing child nodes for UI elements...');
        const uiElements = await discoverUIElements(parentNode, options);

        console.log(`✅ Discovered ${getTotalUIElements(uiElements)} UI elements\n`);

        // Download screenshots for discovered elements
        console.log('🔄 Downloading Figma screenshots...');
        const screenshots = await downloadScreenshots(fileKey, uiElements);
        console.log(`✅ Downloaded ${Object.keys(screenshots).length} screenshots\n`);

        // Process icons and generate SVG components
        console.log('🔄 Processing icons and generating SVG components...');
        const iconComponents = await processIcons(fileKey, uiElements, options);
        console.log(`✅ Generated ${Object.keys(iconComponents).length} icon components\n`);

        // Generate discovery report
        const report = await generateReport(
            fileKey,
            nodeId,
            parentNode,
            uiElements,
            screenshots,
            iconComponents
        );

        console.log('✅ Discovery Agent: Process completed successfully!');
        console.log(`📊 Report saved to: ${report.reportPath}`);

        return report;

    } catch (error) {
        console.error('❌ Discovery Agent failed:', error.message);
        throw error;
    }
}

/**
 * AI processor for analyzing a single node (used with batch processing)
 */
async function analyzeNodeWithAI(node, options) {
    const { useAI, openaiApiKey } = options;

    const [isUI, category, variantsAndSizes, isIconElement] = await Promise.all([
        isUIElement(node, { useAI, openaiApiKey }),
        categorizeUIElement(node, { useAI, openaiApiKey }),
        extractVariantsAndSizes(node.name, { useAI, openaiApiKey }),
        isIcon(node, { useAI, openaiApiKey })
    ]);

    return {
        nodeId: node.id,
        name: node.name,
        isUI,
        category,
        variantsAndSizes,
        isIconElement
    };
}

/**
 * Discover and categorize UI elements from parent node
 * @param {Object} parentNode - Figma parent node
 * @param {Object} options - Discovery options
 */
async function discoverUIElements(parentNode, options = {}) {
    // Dynamic categories - discovered as we find elements
    const uiElements = new Map();
    const skippedNodes = [];

    // Get all child nodes recursively
    const allNodes = getChildNodesRecursively(parentNode);
    console.log(`   📝 Found ${allNodes.length} total nodes to analyze`);

    // Filter out parent node
    const childNodes = allNodes.filter(node => node.id !== parentNode.id);

    if (options.useAI && childNodes.length > 0) {
        console.log(`   🤖 Using batched AI processing for ${childNodes.length} nodes...`);

        // Use batch processing for AI analysis
        const { results, errors } = await processBatchWithAI(
            childNodes,
            analyzeNodeWithAI,
            options
        );

        // Process results
        results.forEach((analysis, nodeId) => {
            const { name, isUI, category, variantsAndSizes, isIconElement } = analysis;

            if (!isUI) {
                skippedNodes.push({
                    nodeId,
                    name,
                    reason: 'not-ui-element'
                });
                return;
            }

            // Add to UI elements
            const element = {
                nodeId,
                name,
                category,
                variants: variantsAndSizes.variants || [],
                sizes: variantsAndSizes.sizes || [],
                isIcon: isIconElement
            };

            // Group by category
            if (!uiElements.has(category)) {
                uiElements.set(category, []);
            }
            uiElements.get(category).push(element);
        });

        // Log any errors
        if (errors.length > 0) {
            console.log(`   ⚠️ ${errors.length} nodes failed AI analysis, falling back to basic detection`);
            errors.forEach(({ name, error }) => {
                console.log(`      • ${name}: ${error}`);
            });
        }

    } else {
        console.log(`   🔧 Using basic heuristic processing...`);

        // Fallback to individual processing
        for (const node of childNodes) {
            // Check if this is a UI element using basic heuristics
            const isUI = await isUIElement(node, { useAI: false });

            if (!isUI) {
                skippedNodes.push({
                    nodeId: node.id,
                    name: node.name,
                    reason: 'not-ui-element'
                });
                continue;
            }

            // Use basic categorization
            const category = await categorizeUIElement(node, { useAI: false });
            const variantsAndSizes = await extractVariantsAndSizes(node.name, { useAI: false });
            const isIconElement = await isIcon(node, { useAI: false });

            const element = {
                nodeId: node.id,
                name: node.name,
                category,
                variants: variantsAndSizes.variants || [],
                sizes: variantsAndSizes.sizes || [],
                isIcon: isIconElement
            };

            // Add to dynamic category
            if (!uiElements.has(category)) {
                uiElements.set(category, []);
            }
            uiElements.get(category).push(element);
        }
    }

    // Log discovery summary
    console.log('   📊 Discovery Summary:');
    for (const [category, elements] of uiElements) {
        console.log(`      • ${category}: ${elements.length} elements`);
    }
    console.log(`      • Skipped: ${skippedNodes.length} non-UI elements`);

    // Convert Map to object for easier JSON serialization
    const result = Object.fromEntries(uiElements);
    result._skipped = skippedNodes;

    return result;
}

/**
 * Download Figma screenshots for component-worthy elements only
 * @param {string} fileKey - Figma file key
 * @param {Object} uiElements - Discovered UI elements
 */
async function downloadScreenshots(fileKey, uiElements) {
    const screenshots = {};

    // Collect only component-worthy elements for screenshots
    const componentWorthyElements = getComponentWorthyElements(uiElements);

    if (componentWorthyElements.length === 0) {
        console.log('   ⚠️ No component-worthy elements to screenshot');
        return screenshots;
    }

    const nodeIds = componentWorthyElements.map(el => el.nodeId);
    console.log(`   📸 Requesting screenshots for ${nodeIds.length} component-worthy elements...`);

    // Get screenshot URLs from Figma
    const screenshotData = await getNodeScreenshots(fileKey, nodeIds);

    // Download each screenshot with semantic naming
    let downloadCount = 0;
    for (const element of componentWorthyElements) {
        const imageUrl = screenshotData.images[element.nodeId];

        if (!imageUrl) {
            console.log(`   ⚠️ No image URL for ${element.name} (${element.nodeId})`);
            continue;
        }

        try {
            // Generate semantic filename
            const filename = generateScreenshotFilename(element, element.category);
            const savePath = path.join(PATHS.screenshotsDir, filename);

            // Download and save
            await downloadImage(imageUrl, savePath);
            screenshots[element.nodeId] = filename;
            downloadCount++;

            console.log(`   📥 Downloaded: ${filename}`);
        } catch (error) {
            console.log(`   ⚠️ Failed to download screenshot for ${element.name}: ${error.message}`);
        }
    }

    console.log(`   ✅ Successfully downloaded ${downloadCount} component screenshots`);
    return screenshots;
}

/**
 * Process icons and generate SVG components
 * @param {string} fileKey - Figma file key
 * @param {Object} uiElements - Discovered UI elements
 * @param {Object} options - Processing options
 */
async function processIcons(fileKey, uiElements, options = {}) {
    const iconComponents = {};

    // Collect all icon elements
    const iconElements = getIconElements(uiElements);

    if (iconElements.length === 0) {
        console.log('   ⚠️ No icons found to process');
        return iconComponents;
    }

    console.log(`   🎨 Processing ${iconElements.length} icons...`);

    // Ensure icons directory exists
    await fs.mkdir(PATHS.iconsDir, { recursive: true });

    // Process each icon (avoid duplicates)
    let processedCount = 0;
    const processedFilenames = new Set();

    for (const element of iconElements) {
        try {
            // Generate React component filename
            const componentFilename = generateIconFilename(element);

            // Skip if we already processed an icon with this filename
            if (processedFilenames.has(componentFilename)) {
                console.log(`   ⏭️  Skipped duplicate: ${componentFilename}`);
                continue;
            }

            // Get SVG content from Figma
            const svgContent = await getIconSVG(fileKey, element.nodeId);

            const componentPath = path.join(PATHS.iconsDir, componentFilename);

            // Generate React SVG component
            const componentContent = generateReactSVGComponent(element.name, svgContent);

            // Save component file
            await fs.writeFile(componentPath, componentContent);
            iconComponents[element.nodeId] = componentFilename;
            processedFilenames.add(componentFilename);
            processedCount++;

            console.log(`   📥 Generated: ${componentFilename}`);
        } catch (error) {
            console.log(`   ⚠️ Failed to process icon ${element.name}: ${error.message}`);
        }
    }

    console.log(`   ✅ Successfully generated ${processedCount} icon components`);
    return iconComponents;
}

/**
 * Get all icon elements from UI elements
 * @param {Object} uiElements - UI elements by category
 */
function getIconElements(uiElements) {
    const iconElements = [];
    Object.keys(uiElements).forEach(category => {
        if (category !== '_skipped') {
            uiElements[category].forEach(element => {
                if (element.isIcon) {
                    iconElements.push(element);
                }
            });
        }
    });
    return iconElements;
}

/**
 * Generate React SVG component content
 * @param {string} iconName - Icon name
 * @param {string} svgContent - Raw SVG content
 */
function generateReactSVGComponent(iconName, svgContent) {
    // Clean icon name for component
    const componentName = iconName
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

    // Clean SVG content - remove XML declaration and add React props
    let cleanedSvg = svgContent
        .replace(/<\?xml[^>]*\?>/, '')
        .replace(/<!DOCTYPE[^>]*>/, '')
        .trim();

    // Add React props to SVG element
    cleanedSvg = cleanedSvg.replace(
        /<svg([^>]*)>/,
        '<svg$1 {...props}>'
    );

    // Replace any style attributes with camelCase
    cleanedSvg = cleanedSvg.replace(/style="([^"]*)"/g, (match, styles) => {
        const camelCaseStyles = styles
            .split(';')
            .filter(style => style.trim())
            .map(style => {
                const [property, value] = style.split(':').map(s => s.trim());
                const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                return `${camelProperty}: '${value}'`;
            })
            .join(', ');
        return `style={{${camelCaseStyles}}}`;
    });

    return `import React from 'react';

interface ${componentName}IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export default function ${componentName}Icon({ size = 24, className, ...props }: ${componentName}IconProps) {
  return (
    ${cleanedSvg}
  );
}

export { ${componentName}Icon };
`;
}

/**
 * Generate comprehensive discovery report
 */
async function generateReport(fileKey, nodeId, parentNode, uiElements, screenshots, iconComponents = {}) {
    const report = {
        parentNode: {
            id: nodeId,
            name: parentNode.name,
            type: parentNode.type
        },
        figmaFileKey: fileKey,
        uiElements: {},
        screenshots,
        iconComponents,
        processingMeta: {
            timestamp: new Date().toISOString(),
            totalNodesAnalyzed: 0,
            totalUIElementsFound: 0,
            totalScreenshots: Object.keys(screenshots).length,
            totalIconComponents: Object.keys(iconComponents).length,
            skippedNodes: uiElements._skipped || []
        }
    };

    // Process UI elements (exclude _skipped)
    Object.keys(uiElements).forEach(category => {
        if (category !== '_skipped') {
            report.uiElements[category] = uiElements[category];
            report.processingMeta.totalUIElementsFound += uiElements[category].length;
        }
    });

    report.processingMeta.totalNodesAnalyzed =
        report.processingMeta.totalUIElementsFound + (uiElements._skipped?.length || 0);

    // Save report to data directory
    await fs.mkdir(PATHS.dataDir, { recursive: true });
    const reportPath = path.join(PATHS.dataDir, 'discovery-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    return {
        report,
        reportPath
    };
}

/**
 * Helper: Get total UI elements count
 */
function getTotalUIElements(uiElements) {
    return Object.keys(uiElements).reduce((sum, key) => {
        if (key !== '_skipped') {
            return sum + uiElements[key].length;
        }
        return sum;
    }, 0);
}

/**
 * Helper: Get only component-worthy elements for React component generation
 */
function getComponentWorthyElements(uiElements) {
    const componentWorthyElements = [];
    Object.keys(uiElements).forEach(category => {
        if (category !== '_skipped') {
            uiElements[category].forEach(element => {
                if (element.componentWorthy) {
                    componentWorthyElements.push(element);
                }
            });
        }
    });
    return componentWorthyElements;
}

export default discover;