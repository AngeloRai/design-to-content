#!/usr/bin/env node

/**
 * SHARED COMPONENT UTILITIES
 * Reusable functions for component processing and parsing
 */

import { consolidateComponentGroup } from './openai-utils.js';

/**
 * Smart component deduplication using AI
 */
export const deduplicateComponents = async (components) => {
  if (components.length === 0) return components;

  try {
    // Group by similar names
    const componentGroups = new Map();
    components.forEach(comp => {
      const baseName = comp.name.replace(/\d+$/, '').replace(/(Default|Primary|Secondary|Variant.*|.*Variant)$/i, '');
      if (!componentGroups.has(baseName)) {
        componentGroups.set(baseName, []);
      }
      componentGroups.get(baseName).push(comp);
    });

    const uniqueComponents = [];

    // Process each group
    for (const [baseName, group] of componentGroups) {
      if (group.length === 1) {
        uniqueComponents.push(group[0]);
        continue;
      }

      console.log(`   🔄 Consolidating ${group.length} "${baseName}" variants...`);

      // Use AI to merge similar components
      const consolidatedComponent = await consolidateComponentGroup(baseName, group);
      uniqueComponents.push(consolidatedComponent);
    }

    return uniqueComponents;

  } catch (error) {
    console.log(`   ⚠️ Deduplication failed: ${error.message}, keeping all components`);
    return components;
  }
};

/**
 * Parse generated components from AI response
 */
export const parseGeneratedComponents = (content, discoveredComponents) => {
  const components = [];
  const sections = content.split('---COMPONENT-SEPARATOR---').filter(section => section.trim());

  sections.forEach(section => {
    const lines = section.trim().split('\n');
    let name = '';
    let type = 'atom';
    let nodeId = '';
    let description = '';
    let specifications = {};
    let code = '';

    let inCodeBlock = false;

    lines.forEach(line => {
      if (line.startsWith('COMPONENT_NAME:')) {
        name = line.replace('COMPONENT_NAME:', '').trim();
      } else if (line.startsWith('COMPONENT_TYPE:')) {
        type = line.replace('COMPONENT_TYPE:', '').trim();
      } else if (line.startsWith('COMPONENT_NODE_ID:')) {
        nodeId = line.replace('COMPONENT_NODE_ID:', '').trim();
      } else if (line.startsWith('COMPONENT_DESCRIPTION:')) {
        description = line.replace('COMPONENT_DESCRIPTION:', '').trim();
      } else if (line.startsWith('COMPONENT_SPECIFICATIONS:')) {
        try {
          const specText = line.replace('COMPONENT_SPECIFICATIONS:', '').trim();
          specifications = JSON.parse(specText);
        } catch {
          specifications = {};
        }
      } else if (line.startsWith('COMPONENT_CODE:')) {
        inCodeBlock = true;
      } else if (inCodeBlock) {
        code += line + '\n';
      }
    });

    if (name && code.trim()) {
      let cleanedCode = code.trim();
      cleanedCode = cleanedCode.replace(/^```typescript\n?/, '');
      cleanedCode = cleanedCode.replace(/^```\n?/, '');
      cleanedCode = cleanedCode.replace(/\n?```$/, '');
      cleanedCode = cleanedCode.replace(/```$/, '');

      // Try to match with discovered components for additional metadata
      const discoveredMatch = discoveredComponents.find(disc =>
        disc.name === name || disc.name.includes(name) || name.includes(disc.name)
      );

      components.push({
        name,
        type,
        description,
        code: cleanedCode.trim(),
        nodeId: nodeId || discoveredMatch?.nodeId || '',
        specifications,
        variants: discoveredMatch?.variants || null,
        priority: discoveredMatch?.priority || 'medium'
      });
    }
  });

  console.log(`   📦 Parsed ${components.length} components:`);
  components.forEach(comp => {
    const nodeInfo = comp.nodeId ? ` (${comp.nodeId})` : '';
    console.log(`     • ${comp.name} (${comp.type})${nodeInfo}`);
  });

  return components;
};

/**
 * Check if a discovered component relates to a category
 */
export const isRelatedToCategory = (discoveredComponent, category) => {
  const componentName = discoveredComponent.name.toLowerCase();
  return category.keywords.some(keyword => componentName.includes(keyword));
};