#!/usr/bin/env node

/**
 * DISCOVERY ENGINE
 * Deterministic component discovery using Figma's typed node graph
 * Provides complete coverage without guessing - AI handles synthesis
 */

import { callFigmaAPI } from '../utils/figma-utils.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * PRIMARY METHOD: Discover all components systematically
 * Uses Figma's node types for complete coverage
 */
export const discoverComponents = async (fileKey, nodeId) => {
  try {
    console.log('🔍 DETERMINISTIC COMPONENT DISCOVERY');
    console.log(`   File: ${fileKey}`);
    console.log(`   Root Node: ${nodeId}`);

    // First, get complete file structure for comprehensive discovery
    console.log('   📋 Fetching complete file structure...');
    const fileData = await callFigmaAPI(`/files/${fileKey}`);

    // Deep traverse to get complete node structure
    const nodeData = await callFigmaAPI(`/files/${fileKey}/nodes`, {
      ids: nodeId,
      depth: 20 // Very deep for design systems
    });

    if (!nodeData.nodes || !nodeData.nodes[nodeId]) {
      throw new Error(`Node ${nodeId} not found in file ${fileKey}`);
    }

    const rootNode = nodeData.nodes[nodeId].document;
    const components = [];

    traverseForComponents(rootNode, components, fileKey);

    // Also discover from file-level components (design system libraries)
    if (fileData.components) {
      console.log('   🏗️ Discovering file-level components...');
      Object.entries(fileData.components).forEach(([componentId, component]) => {
        components.push({
          nodeId: componentId,
          name: component.name,
          type: 'file_component',
          priority: 'high',
          variants: null,
          metadata: {
            description: component.description || '',
            componentSetId: component.componentSetId,
            isMainComponent: true
          }
        });
      });
    }

    // Discover component sets from file data
    if (fileData.componentSets) {
      console.log('   🎛️ Discovering file-level component sets...');
      Object.entries(fileData.componentSets).forEach(([setId, componentSet]) => {
        components.push({
          nodeId: setId,
          name: componentSet.name,
          type: 'file_component_set',
          priority: 'high',
          variants: null, // Will be populated when we fetch the actual node
          metadata: {
            description: componentSet.description || '',
            componentCount: Object.keys(componentSet.components || {}).length
          }
        });
      });
    }

    console.log(`✅ Discovery complete: ${components.length} items found`);
    logDiscoveryStats(components);

    return {
      fileKey,
      rootNodeId: nodeId,
      worklist: components,
      stats: getDiscoveryStats(components)
    };

  } catch (error) {
    console.error('❌ Discovery failed:', error.message);
    throw error;
  }
};

/**
 * Recursive traversal using Figma's node types for reliable identification
 */
const traverseForComponents = (node, components, fileKey, depth = 0) => {
  if (!node || depth > 20) return; // Safety limit

  // Component Sets (highest priority - contain variants)
  if (node.type === 'COMPONENT_SET') {
    components.push({
      nodeId: node.id,
      name: node.name,
      type: 'component_set',
      priority: 'high',
      variants: extractVariantMatrix(node),
      metadata: {
        depth,
        bounds: node.absoluteBoundingBox,
        componentCount: node.children?.length || 0
      }
    });
  }

  // Individual Components
  else if (node.type === 'COMPONENT') {
    components.push({
      nodeId: node.id,
      name: node.name,
      type: 'component',
      priority: 'high',
      variants: null, // Single variant
      metadata: {
        depth,
        bounds: node.absoluteBoundingBox,
        isPartOfSet: false
      }
    });
  }

  // Icon Candidates (geometry-based detection)
  else if (isIconCandidate(node)) {
    components.push({
      nodeId: node.id,
      name: node.name || `Icon_${node.id}`,
      type: 'icon',
      priority: 'medium',
      variants: null,
      metadata: {
        depth,
        bounds: node.absoluteBoundingBox,
        vectorType: node.type,
        isSmallVector: true
      }
    });
  }

  // Potential Atoms (interactive elements that aren't components yet)
  else if (isPotentialAtom(node)) {
    components.push({
      nodeId: node.id,
      name: node.name,
      type: 'potential_atom',
      priority: 'medium',
      variants: null,
      metadata: {
        depth,
        bounds: node.absoluteBoundingBox,
        nodeType: node.type,
        hasInteractiveElements: hasInteractiveContent(node)
      }
    });
  }

  // Recurse through children
  if (node.children) {
    node.children.forEach(child =>
      traverseForComponents(child, components, fileKey, depth + 1)
    );
  }
};

/**
 * Extract variant matrix from Component Set
 */
const extractVariantMatrix = (componentSetNode) => {
  if (!componentSetNode.componentPropertyDefinitions) {
    return null;
  }

  const variants = {};

  // Process each variant property
  Object.entries(componentSetNode.componentPropertyDefinitions).forEach(([key, definition]) => {
    if (definition.type === 'VARIANT') {
      variants[key] = {
        type: 'variant',
        defaultValue: definition.defaultValue,
        variantOptions: definition.variantOptions || []
      };
    }
  });

  // Get actual variant combinations from children
  const variantCombinations = componentSetNode.children?.map(child => ({
    nodeId: child.id,
    name: child.name,
    properties: child.variantProperties || {}
  })) || [];

  return {
    properties: variants,
    combinations: variantCombinations,
    totalVariants: variantCombinations.length
  };
};

/**
 * Geometry-based icon detection (reliable, not name-based)
 */
const isIconCandidate = (node) => {
  // Must be a vector-type node
  const isVectorType = [
    'VECTOR',
    'BOOLEAN_OPERATION',
    'COMPONENT', // Small components are often icons
    'INSTANCE'   // Instances of icon components
  ].includes(node.type);

  if (!isVectorType || !node.absoluteBoundingBox) {
    return false;
  }

  const { width, height } = node.absoluteBoundingBox;

  // Icon size heuristics (reasonable range)
  const isIconSize = (
    width >= 8 && width <= 100 &&   // 8px to 100px wide
    height >= 8 && height <= 100 && // 8px to 100px tall
    Math.abs(width - height) <= Math.max(width, height) * 0.3 // Roughly square-ish
  );

  return isIconSize;
};

/**
 * Detect potential atomic design elements
 */
const isPotentialAtom = (node) => {
  if (!node.absoluteBoundingBox) return false;

  const { width, height } = node.absoluteBoundingBox;

  // Look for common UI element patterns
  const hasButtonLikeProperties = (
    node.type === 'RECTANGLE' &&
    node.fills && node.fills.length > 0 &&
    width > height && // Typically wider than tall
    height >= 20 && height <= 80 && // Reasonable button height
    width >= 60 && width <= 400 // Reasonable button width
  );

  const hasInputLikeProperties = (
    node.type === 'RECTANGLE' &&
    node.strokes && node.strokes.length > 0 && // Usually has border
    height >= 24 && height <= 60 && // Input height range
    width >= 100 // Inputs are typically wider
  );

  return hasButtonLikeProperties || hasInputLikeProperties;
};

/**
 * Check if node contains interactive elements
 */
const hasInteractiveContent = (node) => {
  if (!node.children) return false;

  return node.children.some(child =>
    child.type === 'TEXT' ||
    child.type === 'VECTOR' ||
    child.type === 'COMPONENT' ||
    child.type === 'INSTANCE'
  );
};

/**
 * Get discovery statistics
 */
const getDiscoveryStats = (components) => {
  const stats = {
    total: components.length,
    byType: {},
    byPriority: {},
    withVariants: 0
  };

  components.forEach(item => {
    // Count by type
    stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;

    // Count by priority
    stats.byPriority[item.priority] = (stats.byPriority[item.priority] || 0) + 1;

    // Count items with variants
    if (item.variants) {
      stats.withVariants++;
    }
  });

  return stats;
};

/**
 * Log discovery statistics
 */
const logDiscoveryStats = (components) => {
  const stats = getDiscoveryStats(components);

  console.log('\n📊 DISCOVERY STATISTICS:');
  console.log(`   Total Items: ${stats.total}`);

  console.log('\n   By Type:');
  Object.entries(stats.byType).forEach(([type, count]) => {
    console.log(`     ${type}: ${count}`);
  });

  console.log('\n   By Priority:');
  Object.entries(stats.byPriority).forEach(([priority, count]) => {
    console.log(`     ${priority}: ${count}`);
  });

  console.log(`\n   Items with Variants: ${stats.withVariants}`);
};

/**
 * Filter components by criteria
 */
export const filterWorklist = (components, criteria = {}) => {
  let filtered = [...components];

  if (criteria.type) {
    filtered = filtered.filter(item => item.type === criteria.type);
  }

  if (criteria.priority) {
    filtered = filtered.filter(item => item.priority === criteria.priority);
  }

  if (criteria.hasVariants !== undefined) {
    filtered = filtered.filter(item => !!item.variants === criteria.hasVariants);
  }

  if (criteria.minSize) {
    filtered = filtered.filter(item => {
      const bounds = item.metadata?.bounds;
      if (!bounds) return true;
      return bounds.width >= criteria.minSize && bounds.height >= criteria.minSize;
    });
  }

  return filtered;
};

export const filterComponentsWithAI = async (discoveredComponents, visualAnalysis) => {
  if (discoveredComponents.length === 0) return [];

  try {
    // Use AI to intelligently filter components
    const componentList = discoveredComponents.map(comp =>
      `${comp.name} (${comp.type}) - ${comp.metadata?.description || ''}`
    ).join('\n');

    const prompt = `Given this visual analysis of a design system and list of discovered components, identify which components are likely to be reusable design system components (not UI chrome, navigation, or specific content):

VISUAL ANALYSIS: ${visualAnalysis.analysis.substring(0, 500)}

DISCOVERED COMPONENTS:
${componentList}

Return only the names of components that appear to be reusable design system components (buttons, inputs, cards, etc.). One name per line.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.1
    });

    const aiFilteredNames = new Set(
      response.choices[0].message.content
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0)
    );

    // Apply AI filtering
    const aiFiltered = discoveredComponents.filter(comp =>
      aiFilteredNames.has(comp.name)
    );

    console.log(`   🤖 AI filtered: ${discoveredComponents.length} → ${aiFiltered.length}`);

    // Apply deterministic safety filter as backup
    const finalFiltered = aiFiltered.filter(comp =>
      !isDeterministicallyNonDesignSystem(comp)
    );

    finalFiltered.forEach(comp => console.log(`   ✅ ${comp.name}`));
    return finalFiltered;

  } catch (error) {
    console.warn(`   ⚠️ AI filtering failed: ${error.message}, using deterministic fallback`);

    // Deterministic fallback - conservative filtering
    return discoveredComponents.filter(comp =>
      !isDeterministicallyNonDesignSystem(comp)
    );
  }
};

/**
 * Deterministic safety filter - removes obvious non-design-system components
 */
const isDeterministicallyNonDesignSystem = (comp) => {
  const name = comp.name.toLowerCase();

  // These patterns are definitively not design system components
  const definitelyExclude = [
    name.includes('figma'),
    name.includes('frame'),
    name.includes('group'),
    name.includes('page'),
    name.includes('artboard'),
    name.length > 50, // Extremely long names are usually not components
    /^\d+$/.test(name), // Pure numbers
    name === '' || name === 'undefined'
  ];

  return definitelyExclude.some(condition => condition);
};

const discoveryEngine = {
  discoverComponents,
  filterWorklist,
  filterComponentsWithAI
};

export default discoveryEngine;