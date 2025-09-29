#!/usr/bin/env node

/**
 * SHARED FILE UTILITIES
 * Reusable functions for saving and managing component files
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { determineComponentPath } from './openai-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Save all components to the file system
 */
export const saveAllComponents = async (components) => {
  const saved = [];
  const projectRoot = join(__dirname, '..', '..');

  for (const component of components) {
    try {
      // AI-driven path determination with deterministic fallback
      const subdir = await determineComponentPath(component) || 'components';

      const componentDir = join(projectRoot, 'nextjs-app', 'ui', subdir);
      const componentPath = join(componentDir, `${component.name}.tsx`);

      // Ensure directory exists
      if (!existsSync(componentDir)) {
        mkdirSync(componentDir, { recursive: true });
      }

      // Save component with metadata comment
      const componentWithMeta = `// Quality Score: ${(component.qualityScore || 0).toFixed(2)}
// Node ID: ${component.nodeId || 'N/A'}
// Verification: ${component.verificationStatus || 'none'}

${component.code}`;

      writeFileSync(componentPath, componentWithMeta);

      const relativePath = `nextjs-app/ui/${subdir}/${component.name}.tsx`;
      console.log(`     ✅ ${component.name} → ${relativePath}`);

      saved.push({
        name: component.name,
        type: component.type,
        path: relativePath,
        fullPath: componentPath,
        qualityScore: component.qualityScore,
        verificationStatus: component.verificationStatus
      });

    } catch (error) {
      console.error(`     ❌ Failed to save ${component.name}:`, error.message);
    }
  }

  return saved;
};

/**
 * Update saved components with verification results
 */
export const updateComponentsWithVerification = async (savedComponents, verifiedComponents) => {
  const verificationMap = new Map();
  verifiedComponents.forEach(comp => {
    verificationMap.set(comp.name, comp);
  });

  for (const saved of savedComponents) {
    const verified = verificationMap.get(saved.name);
    if (verified) {
      saved.verificationStatus = verified.verificationStatus;
      saved.qualityScore = verified.qualityScore;

      // Update the file with new metadata
      try {
        const componentWithMeta = `// Quality Score: ${(saved.qualityScore || 0).toFixed(2)}
// Node ID: ${verified.nodeId || 'N/A'}
// Verification: ${saved.verificationStatus || 'none'}

${verified.code}`;

        writeFileSync(saved.fullPath, componentWithMeta);
      } catch (error) {
        console.error(`Failed to update ${saved.name}: ${error.message}`);
      }
    }
  }
};