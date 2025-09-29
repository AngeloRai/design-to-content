#!/usr/bin/env node

/**
 * DEPENDENCY REGISTRY SYSTEM
 * Tracks which molecules use which atoms to prevent breaking changes
 * and enable safe library evolution
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration - use relative paths from project structure
const REGISTRY_PATH = join(__dirname, '..', 'data', 'dependency-registry.json');
const UI_PATH = join(__dirname, '..', '..', 'nextjs-app', 'ui');

// Cached registry state
let cachedRegistry = null;

/**
 * Load existing dependency registry
 */
const loadRegistry = () => {
  if (existsSync(REGISTRY_PATH)) {
    try {
      const content = readFileSync(REGISTRY_PATH, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('Could not load dependency registry, starting fresh:', error.message);
    }
  }

  return {
    atomUsage: {},        // atomName -> [molecules that use it]
    moleculeDependencies: {}, // moleculeName -> [atoms it uses]
    lastUpdated: null,
    version: '1.0.0'
  };
};

/**
 * Save registry to file
 */
const saveRegistry = (registry) => {
  const registryDir = dirname(REGISTRY_PATH);
  if (!existsSync(registryDir)) {
    mkdirSync(registryDir, { recursive: true });
  }

  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  cachedRegistry = registry;
  return registry;
};

/**
 * Get current registry state
 */
const getRegistry = () => {
  if (!cachedRegistry) {
    cachedRegistry = loadRegistry();
  }
  return cachedRegistry;
};

/**
 * Calculate risk level based on number of dependents
 */
const calculateRiskLevel = (dependentCount) => {
  if (dependentCount === 0) return 'SAFE';
  if (dependentCount <= 2) return 'LOW';
  if (dependentCount <= 5) return 'MEDIUM';
  return 'HIGH';
};

/**
 * Generate recommendations for atom updates
 */
const generateUpdateRecommendations = (atomName, dependents) => {
  const recommendations = [];

  if (dependents.length === 0) {
    recommendations.push('✅ Safe to update - no dependent molecules');
  } else if (dependents.length <= 2) {
    recommendations.push('⚠️  Low risk - test affected molecules after update');
    recommendations.push(`🧪 Test molecules: ${dependents.join(', ')}`);
  } else {
    recommendations.push('🚨 High risk - many dependent molecules');
    recommendations.push('📋 Consider backwards-compatible changes only');
    recommendations.push('🔄 Plan gradual migration if breaking changes needed');
    recommendations.push(`🧪 Must test molecules: ${dependents.join(', ')}`);
  }

  return recommendations;
};

/**
 * Generate testing plan for affected molecules
 */
const generateTestingPlan = (affectedMolecules) => {
  if (affectedMolecules.length === 0) {
    return { required: false, steps: ['No testing required'] };
  }

  return {
    required: true,
    steps: [
      '1. Update atom implementation',
      '2. Run TypeScript compilation check',
      `3. Test affected molecules: ${affectedMolecules.join(', ')}`,
      '4. Visual regression testing (if applicable)',
      '5. Update molecule generation if needed'
    ]
  };
};

/**
 * Generate migration steps for atom updates
 */
const generateMigrationSteps = (atomName, changes, safety) => {
  const steps = ['1. Backup current atom implementation'];

  if (safety.assessment === 'SAFE') {
    steps.push('2. Apply changes directly');
    steps.push('3. Update library documentation');
  } else {
    steps.push('2. Create temporary atom version (if needed)');
    steps.push('3. Apply changes carefully');
    steps.push('4. Test all dependent molecules');
    steps.push('5. Fix any breaking changes');
    steps.push('6. Update library documentation');
  }

  return steps;
};

/**
 * Register that a molecule uses specific atoms
 */
export const registerDependencies = (moleculeName, atomNames) => {
  console.log(`📝 Registering dependencies for ${moleculeName}: [${atomNames.join(', ')}]`);

  const registry = getRegistry();

  // Update molecule dependencies
  registry.moleculeDependencies[moleculeName] = [...new Set(atomNames)];

  // Update atom usage tracking
  for (const atomName of atomNames) {
    if (!registry.atomUsage[atomName]) {
      registry.atomUsage[atomName] = [];
    }

    if (!registry.atomUsage[atomName].includes(moleculeName)) {
      registry.atomUsage[atomName].push(moleculeName);
    }
  }

  registry.lastUpdated = new Date().toISOString();
  saveRegistry(registry);

  return registry;
};

/**
 * Remove molecule from dependency registry (when molecule is deleted)
 */
export const unregisterMolecule = (moleculeName) => {
  console.log(`🗑️  Unregistering molecule: ${moleculeName}`);

  const registry = getRegistry();

  // Get atoms this molecule was using
  const atomNames = registry.moleculeDependencies[moleculeName] || [];

  // Remove molecule from atom usage tracking
  for (const atomName of atomNames) {
    if (registry.atomUsage[atomName]) {
      registry.atomUsage[atomName] = registry.atomUsage[atomName]
        .filter(mol => mol !== moleculeName);

      // Clean up empty arrays
      if (registry.atomUsage[atomName].length === 0) {
        delete registry.atomUsage[atomName];
      }
    }
  }

  // Remove molecule dependencies
  delete registry.moleculeDependencies[moleculeName];

  registry.lastUpdated = new Date().toISOString();
  saveRegistry(registry);

  return registry;
};

/**
 * Get all molecules that depend on a specific atom
 */
export const getAtomDependents = (atomName) => {
  const registry = getRegistry();
  return registry.atomUsage[atomName] || [];
};

/**
 * Get all atoms that a molecule depends on
 */
export const getMoleculeDependencies = (moleculeName) => {
  const registry = getRegistry();
  return registry.moleculeDependencies[moleculeName] || [];
};

/**
 * Analyze impact of changing/updating an atom
 */
export const analyzeAtomImpact = (atomName) => {
  const dependents = getAtomDependents(atomName);

  return {
    atomName,
    totalDependents: dependents.length,
    affectedMolecules: dependents,
    riskLevel: calculateRiskLevel(dependents.length),
    recommendations: generateUpdateRecommendations(atomName, dependents)
  };
};

/**
 * Check if an atom can be safely updated
 */
export const canSafelyUpdateAtom = (atomName, changeType = 'minor') => {
  const impact = analyzeAtomImpact(atomName);

  const safetyChecks = {
    hasNoDependents: impact.totalDependents === 0,
    lowRisk: impact.riskLevel === 'SAFE' || impact.riskLevel === 'LOW',
    mediumRiskButMinorChange: impact.riskLevel === 'MEDIUM' && changeType === 'minor',
    assessment: 'unknown'
  };

  if (safetyChecks.hasNoDependents) {
    safetyChecks.assessment = 'SAFE';
  } else if (safetyChecks.lowRisk) {
    safetyChecks.assessment = 'SAFE_WITH_TESTING';
  } else if (safetyChecks.mediumRiskButMinorChange) {
    safetyChecks.assessment = 'RISKY_BUT_MANAGEABLE';
  } else {
    safetyChecks.assessment = 'HIGH_RISK';
  }

  return {
    canUpdate: safetyChecks.assessment !== 'HIGH_RISK',
    assessment: safetyChecks.assessment,
    impact,
    recommendations: impact.recommendations
  };
};

/**
 * Generate update plan for atom modifications
 */
export const generateAtomUpdatePlan = (atomName, plannedChanges) => {
  const safety = canSafelyUpdateAtom(atomName, plannedChanges.type);

  return {
    atomName,
    plannedChanges,
    safety,
    testingPlan: generateTestingPlan(safety.impact.affectedMolecules),
    migrationSteps: generateMigrationSteps(atomName, plannedChanges, safety)
  };
};

/**
 * Get complete dependency tree for all components
 */
export const getDependencyTree = () => {
  const registry = getRegistry();

  const tree = {
    atoms: {},
    molecules: {},
    orphanedAtoms: [], // atoms with no dependents
    complexMolecules: [] // molecules with many dependencies
  };

  // Build atom perspective
  for (const [atomName, dependents] of Object.entries(registry.atomUsage)) {
    tree.atoms[atomName] = {
      dependentCount: dependents.length,
      dependents: dependents,
      riskLevel: calculateRiskLevel(dependents.length)
    };
  }

  // Build molecule perspective
  for (const [moleculeName, dependencies] of Object.entries(registry.moleculeDependencies)) {
    tree.molecules[moleculeName] = {
      dependencyCount: dependencies.length,
      dependencies: dependencies,
      complexity: dependencies.length > 3 ? 'high' : dependencies.length > 1 ? 'medium' : 'low'
    };

    if (dependencies.length > 4) {
      tree.complexMolecules.push(moleculeName);
    }
  }

  // Find orphaned atoms (no dependents)
  tree.orphanedAtoms = Object.keys(tree.atoms)
    .filter(atomName => tree.atoms[atomName].dependentCount === 0);

  return tree;
};

/**
 * Get registry statistics
 */
export const getRegistryStats = () => {
  const registry = getRegistry();
  const atomCount = Object.keys(registry.atomUsage).length;
  const moleculeCount = Object.keys(registry.moleculeDependencies).length;
  const totalDependencies = Object.values(registry.moleculeDependencies)
    .reduce((sum, deps) => sum + deps.length, 0);

  return {
    totalAtoms: atomCount,
    totalMolecules: moleculeCount,
    totalDependencies,
    averageDependenciesPerMolecule: moleculeCount > 0 ? totalDependencies / moleculeCount : 0,
    lastUpdated: registry.lastUpdated
  };
};

/**
 * Extract atoms used by a molecule from its TypeScript content
 */
const extractAtomDependencies = (content) => {
  const atomDependencies = [];

  // Match imports from elements folder
  const atomImportRegex = /import\s+\w+\s+from\s+['"]@\/ui\/elements\/(\w+)['"]/g;
  let match;

  while ((match = atomImportRegex.exec(content)) !== null) {
    const atomName = match[1];
    if (!atomDependencies.includes(atomName)) {
      atomDependencies.push(atomName);
    }
  }

  return atomDependencies;
};

/**
 * Scan all molecules and regenerate dependency registry
 */
export const regenerateDependencyRegistry = async () => {
  console.log('🔄 Regenerating dependency registry from component files...');

  const registry = {
    atomUsage: {},
    moleculeDependencies: {},
    lastUpdated: new Date().toISOString(),
    version: '1.0.0'
  };

  // Scan molecules directory
  const moleculesPath = join(UI_PATH, 'components');

  if (existsSync(moleculesPath)) {
    const files = readdirSync(moleculesPath)
      .filter(file => extname(file) === '.tsx')
      .map(file => join(moleculesPath, file));

    for (const filePath of files) {
      try {
        const content = readFileSync(filePath, 'utf8');
        const moleculeName = filePath.split('/').pop().replace('.tsx', '');

        const atomDependencies = extractAtomDependencies(content);

        if (atomDependencies.length > 0) {
          // Register molecule dependencies
          registry.moleculeDependencies[moleculeName] = atomDependencies;

          // Update atom usage tracking
          for (const atomName of atomDependencies) {
            if (!registry.atomUsage[atomName]) {
              registry.atomUsage[atomName] = [];
            }
            if (!registry.atomUsage[atomName].includes(moleculeName)) {
              registry.atomUsage[atomName].push(moleculeName);
            }
          }

          console.log(`   📋 ${moleculeName}: [${atomDependencies.join(', ')}]`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed to analyze ${filePath}: ${error.message}`);
      }
    }
  }

  // Save regenerated registry
  saveRegistry(registry);

  const stats = getRegistryStats();
  console.log(`✅ Dependency registry regenerated: ${stats.totalMolecules} molecules, ${stats.totalAtoms} atoms tracked`);

  return registry;
};

/**
 * CLI usage
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  switch (command) {
    case 'register':
      if (arg1 && arg2) {
        const atoms = arg2.split(',');
        registerDependencies(arg1, atoms);
        console.log('✅ Dependencies registered');
      } else {
        console.log('Usage: node dependency-registry.js register <moleculeName> <atomName1,atomName2>');
      }
      break;

    case 'analyze':
      if (arg1) {
        const impact = analyzeAtomImpact(arg1);
        console.log(JSON.stringify(impact, null, 2));
      } else {
        console.log('Usage: node dependency-registry.js analyze <atomName>');
      }
      break;

    case 'tree':
      const tree = getDependencyTree();
      console.log(JSON.stringify(tree, null, 2));
      break;

    case 'stats':
      const stats = getRegistryStats();
      console.log(JSON.stringify(stats, null, 2));
      break;

    case 'regenerate':
      await regenerateDependencyRegistry();
      break;

    default:
      console.log(`
Dependency Registry CLI

Commands:
  register <molecule> <atoms>  - Register molecule dependencies (comma-separated atoms)
  analyze <atom>              - Analyze impact of updating an atom
  tree                        - Show complete dependency tree
  stats                       - Show registry statistics
  regenerate                  - Regenerate registry from component files

Examples:
  node dependency-registry.js register CTA "Button,Icon,Text"
  node dependency-registry.js analyze Button
  node dependency-registry.js tree
  node dependency-registry.js regenerate
      `);
  }
}