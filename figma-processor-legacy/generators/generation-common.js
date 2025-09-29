#!/usr/bin/env node

/**
 * GENERATION COMMON UTILITIES
 * Shared functionality used across atom and molecule generators
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Component type to directory mapping
 */
export const COMPONENT_PATHS = {
  'atom': 'elements',
  'molecule': 'components',
  'organism': 'modules'
};

/**
 * Get the appropriate directory for a component type
 */
export const getComponentDirectory = (componentType) => {
  return COMPONENT_PATHS[componentType] || 'elements';
};

/**
 * Get the full path for saving a component
 */
export const getComponentSavePath = (componentName, componentType) => {
  const projectRoot = join(__dirname, '..', '..');
  const subdir = getComponentDirectory(componentType);
  const componentDir = join(projectRoot, 'nextjs-app', 'ui', subdir);
  const componentPath = join(componentDir, `${componentName}.tsx`);

  return {
    componentDir,
    componentPath,
    relativePath: `nextjs-app/ui/${subdir}/${componentName}.tsx`
  };
};

/**
 * Save a single component to the appropriate directory
 */
export const saveComponent = async (component) => {
  try {
    const { componentDir, componentPath, relativePath } = getComponentSavePath(
      component.name,
      component.type
    );

    // Ensure directory exists
    if (!existsSync(componentDir)) {
      mkdirSync(componentDir, { recursive: true });
    }

    // Clean the code before saving
    const cleanedCode = cleanComponentCode(component.code);

    // Save component
    writeFileSync(componentPath, cleanedCode);

    console.log(`  ✅ ${component.name} → ${relativePath}`);

    return {
      name: component.name,
      type: component.type,
      path: relativePath,
      fullPath: componentPath,
      success: true
    };

  } catch (error) {
    console.error(`  ❌ Failed to save ${component.name}:`, error.message);
    return {
      name: component.name,
      type: component.type,
      success: false,
      error: error.message
    };
  }
};

/**
 * Save multiple components
 */
export const saveComponents = async (components) => {
  const results = [];

  console.log(`💾 Saving ${components.length} components...`);

  for (const component of components) {
    const result = await saveComponent(component);
    results.push(result);
  }

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successfully saved: ${successful.length}`);
  if (failed.length > 0) {
    console.log(`❌ Failed to save: ${failed.length}`);
  }

  return {
    successful,
    failed,
    total: components.length
  };
};

/**
 * Clean component code before saving
 */
export const cleanComponentCode = (code) => {
  let cleaned = code.trim();

  // Remove markdown code fences
  cleaned = cleaned.replace(/^```typescript\n?/, '');
  cleaned = cleaned.replace(/^```tsx\n?/, '');
  cleaned = cleaned.replace(/^```\n?/, '');
  cleaned = cleaned.replace(/\n?```$/, '');
  cleaned = cleaned.replace(/```$/, '');

  // Fix common import issues
  cleaned = cleaned.replace(
    "import { cn } from 'classnames';",
    "import { cn } from '@/lib/utils';"
  );

  cleaned = cleaned.replace(
    'import { cn } from "@/lib/classnames";',
    'import { cn } from "@/lib/utils";'
  );

  // Ensure proper React imports
  if (!cleaned.includes('import') && (cleaned.includes('React.') || cleaned.includes('interface'))) {
    cleaned = "import React from 'react';\n" + cleaned;
  }

  return cleaned;
};

/**
 * Validate component structure
 */
export const validateComponent = (component) => {
  const errors = [];
  const warnings = [];

  // Check required fields
  if (!component.name) {
    errors.push('Component missing name');
  }
  if (!component.code) {
    errors.push('Component missing code');
  }
  if (!component.type) {
    warnings.push('Component missing type, defaulting to atom');
  }

  // Check code quality
  if (component.code && !component.code.includes('export')) {
    warnings.push('Component code missing export statement');
  }

  if (component.code && !component.code.includes('function') && !component.code.includes('=>')) {
    warnings.push('Component code may be missing function definition');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Get generation statistics
 */
export const getGenerationStats = (components) => {
  const stats = {
    total: components.length,
    atoms: 0,
    molecules: 0,
    organisms: 0,
    unknown: 0
  };

  components.forEach(component => {
    switch (component.type) {
      case 'atom':
        stats.atoms++;
        break;
      case 'molecule':
        stats.molecules++;
        break;
      case 'organism':
        stats.organisms++;
        break;
      default:
        stats.unknown++;
    }
  });

  return stats;
};

/**
 * Format generation summary
 */
export const formatGenerationSummary = (components, title = 'Generated Components') => {
  const stats = getGenerationStats(components);

  let summary = `\n${title}:\n`;
  summary += `  Total: ${stats.total}\n`;

  if (stats.atoms > 0) summary += `  📦 Atoms: ${stats.atoms}\n`;
  if (stats.molecules > 0) summary += `  🧩 Molecules: ${stats.molecules}\n`;
  if (stats.organisms > 0) summary += `  🏗️  Organisms: ${stats.organisms}\n`;
  if (stats.unknown > 0) summary += `  ❓ Unknown: ${stats.unknown}\n`;

  summary += '\nComponents:\n';
  components.forEach(comp => {
    const icon = comp.type === 'atom' ? '📦' : comp.type === 'molecule' ? '🧩' : '🏗️';
    summary += `  ${icon} ${comp.name} (${comp.type})\n`;
  });

  return summary;
};

export default {
  COMPONENT_PATHS,
  getComponentDirectory,
  getComponentSavePath,
  saveComponent,
  saveComponents,
  cleanComponentCode,
  validateComponent,
  getGenerationStats,
  formatGenerationSummary
};