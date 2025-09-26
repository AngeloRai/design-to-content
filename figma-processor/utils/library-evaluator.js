#!/usr/bin/env node

/**
 * LIBRARY EVALUATOR
 * Analyzes current library state and determines what needs to be created/updated
 * before molecule generation
 */

import { getLibraryDocs } from './library-doc.js';
import { getDependencyTree, analyzeAtomImpact } from './dependency-registry.js';
import OpenAI from 'openai';


/**
 * Extract atom requirements from molecule specification
 */
const extractAtomRequirements = async (moleculeSpec) => {
  const requirements = [];

  // Use AI to analyze what atoms this molecule likely needs
  const content = `${moleculeSpec.description || ''} ${moleculeSpec.visualAnalysis || ''} ${moleculeSpec.properties ? JSON.stringify(moleculeSpec.properties) : ''}`;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Analyze this molecule component specification and identify what atomic UI components it would likely need.

MOLECULE SPECIFICATION:
Name: ${moleculeSpec.name}
Description: ${moleculeSpec.description}
Properties: ${JSON.stringify(moleculeSpec.properties || {}, null, 2)}
Visual Analysis: ${moleculeSpec.visualAnalysis || 'Not provided'}

Your task: Identify specific atom components this molecule would logically compose/use.

GUIDELINES:
- Only identify atoms that are clearly needed based on the specification
- Focus on the fundamental building blocks this component would use
- Consider both explicit mentions and logical implications
- Don't assume atoms not clearly indicated by the specification

Return a JSON array of required atoms:
[
  {
    "atomName": "AtomName",
    "confidence": 0.9,
    "reason": "Why this atom is needed based on the spec",
    "required": true
  }
]

Confidence should be 0.1-1.0 based on how certain you are this atom is needed.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.1
    });

    const aiRequirements = JSON.parse(response.choices[0].message.content.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, ''));

    if (Array.isArray(aiRequirements)) {
      requirements.push(...aiRequirements);
      console.log(`   🤖 AI identified ${aiRequirements.length} atom requirements for ${moleculeSpec.name}`);
    }

  } catch (error) {
    console.warn(`   ⚠️ AI atom analysis failed for ${moleculeSpec.name}:`, error.message);
    console.log('   📋 Using minimal fallback analysis...');

    // Minimal fallback - only look for very obvious keywords
    const content_lower = content.toLowerCase();
    if (content_lower.includes('button')) {
      requirements.push({ atomName: 'Button', confidence: 0.8, reason: 'Contains "button" keyword', required: true });
    }
    if (content_lower.includes('icon')) {
      requirements.push({ atomName: 'Icon', confidence: 0.8, reason: 'Contains "icon" keyword', required: true });
    }
  }

  // Sort by confidence
  return requirements.sort((a, b) => b.confidence - a.confidence);
};

/**
 * Assess if an existing atom is suitable for molecule requirements
 */
const assessAtomSuitability = (atomDoc, requirement) => {
  const suitability = {
    suitable: true,
    score: 1.0,
    issues: [],
    suggestions: []
  };

  // Check quality score
  if (atomDoc.metadata && atomDoc.metadata.qualityScore < 0.8) {
    suitability.issues.push('Low quality score');
    suitability.suggestions.push('Improve component implementation');
    suitability.score -= 0.2;
  }

  // Check if atom has proper variants
  if (requirement.atomName === 'Button' && (!atomDoc.variants || !atomDoc.variants.options)) {
    suitability.issues.push('Missing variant system');
    suitability.suggestions.push('Add CVA variant system');
    suitability.score -= 0.3;
  }

  // Check TypeScript interfaces
  if (!atomDoc.interfaces || Object.keys(atomDoc.interfaces).length === 0) {
    suitability.issues.push('Missing TypeScript interfaces');
    suitability.suggestions.push('Add proper TypeScript interfaces');
    suitability.score -= 0.2;
  }

  // Check Next.js compatibility
  if (!atomDoc.dependencies?.external?.includes('class-variance-authority') && atomDoc.variants?.options) {
    suitability.issues.push('Not using CVA for variants');
    suitability.suggestions.push('Migrate to CVA variant system');
    suitability.score -= 0.1;
  }

  // Final assessment
  suitability.suitable = suitability.score >= 0.7 && suitability.issues.length <= 1;

  return suitability;
};

/**
 * Normalize atom names for matching (remove spaces, normalize case)
 */
const normalizeAtomName = (atomName) => {
  return atomName.replace(/\s+/g, ''); // Remove all spaces
};

/**
 * Find atom in library by normalized name
 */
const findAtomInLibrary = (atomName, availableAtoms) => {
  // Try exact match first
  if (availableAtoms[atomName]) {
    return availableAtoms[atomName];
  }

  // Try normalized matching
  const normalizedName = normalizeAtomName(atomName);
  for (const [availableName, atomDoc] of Object.entries(availableAtoms)) {
    if (normalizeAtomName(availableName) === normalizedName) {
      return atomDoc;
    }
  }

  return null;
};

/**
 * Analyze availability of required atoms
 */
const analyzeAtomAvailability = (requirements, availableAtoms) => {
  const analysis = {
    available: [],
    missing: [],
    needsUpdate: [],
    summary: {
      availableCount: 0,
      missingCount: 0,
      updateCount: 0
    }
  };

  for (const requirement of requirements) {
    const atomDoc = findAtomInLibrary(requirement.atomName, availableAtoms);

    if (!atomDoc) {
      // Atom doesn't exist
      analysis.missing.push({
        ...requirement,
        status: 'missing',
        action: 'create'
      });
      analysis.summary.missingCount++;
    } else {
      // Atom exists - check if it meets requirements
      const suitability = assessAtomSuitability(atomDoc, requirement);

      if (suitability.suitable) {
        analysis.available.push({
          ...requirement,
          atomDoc,
          status: 'available',
          action: 'use',
          suitability
        });
        analysis.summary.availableCount++;
      } else {
        analysis.needsUpdate.push({
          ...requirement,
          atomDoc,
          status: 'needs_update',
          action: 'update',
          suitability,
          updateSuggestions: suitability.suggestions
        });
        analysis.summary.updateCount++;
      }
    }
  }

  return analysis;
};

/**
 * Generate ordered execution sequence
 */
const generateExecutionSequence = (actions) => {
  const sequence = [];

  // 1. Create missing atoms first
  const createActions = actions.immediate.filter(a => a.type === 'create_atom');
  if (createActions.length > 0) {
    sequence.push({
      step: 1,
      description: 'Create missing atoms',
      actions: createActions,
      estimatedTime: createActions.length * 20 // minutes
    });
  }

  // 2. Update existing atoms
  const updateActions = actions.immediate.filter(a => a.type === 'update_atom');
  if (updateActions.length > 0) {
    sequence.push({
      step: sequence.length + 1,
      description: 'Update existing atoms',
      actions: updateActions,
      estimatedTime: updateActions.reduce((sum) => sum + 25, 0) // average 25 min per update
    });
  }

  // 3. Generate molecule
  sequence.push({
    step: sequence.length + 1,
    description: 'Generate molecule component',
    actions: [{
      type: 'generate_molecule',
      description: 'Create molecule using prepared atoms'
    }],
    estimatedTime: 15
  });

  // 4. Update documentation
  sequence.push({
    step: sequence.length + 1,
    description: 'Update library documentation',
    actions: [{
      type: 'update_docs',
      description: 'Update library docs and dependency registry'
    }],
    estimatedTime: 5
  });

  return sequence;
};

/**
 * Generate action plan for molecule generation
 */
const generateActionPlan = (availabilityAnalysis, dependencyTree) => {
  const actions = {
    immediate: [],      // Actions needed before generation
    optional: [],       // Nice-to-have improvements
    blockers: [],       // Issues that prevent generation
    sequence: []        // Ordered steps to execute
  };

  // Handle missing atoms
  for (const missing of availabilityAnalysis.missing) {
    actions.immediate.push({
      type: 'create_atom',
      atomName: missing.atomName,
      priority: 'high',
      description: `Create ${missing.atomName} atom`,
      reason: missing.reason,
      estimatedTime: '15-30 minutes'
    });

    actions.blockers.push(`Missing atom: ${missing.atomName}`);
  }

  // Handle atoms that need updates
  for (const needsUpdate of availabilityAnalysis.needsUpdate) {
    const impact = analyzeAtomImpact(needsUpdate.atomName);

    // Use dependency tree to get more detailed risk info
    const treeInfo = dependencyTree.atoms[needsUpdate.atomName] || {
      dependentCount: 0,
      dependents: [],
      riskLevel: 'LOW'
    };

    // Combine impact analysis with dependency tree data
    const combinedRiskLevel = impact.riskLevel === 'HIGH' || treeInfo.riskLevel === 'HIGH' ? 'HIGH' :
                             impact.riskLevel === 'MEDIUM' || treeInfo.riskLevel === 'MEDIUM' ? 'MEDIUM' : 'LOW';

    const updateAction = {
      type: 'update_atom',
      atomName: needsUpdate.atomName,
      priority: combinedRiskLevel === 'HIGH' ? 'medium' : 'high',
      description: `Update ${needsUpdate.atomName} atom (${treeInfo.dependentCount} dependent${treeInfo.dependentCount === 1 ? '' : 's'})`,
      issues: needsUpdate.suitability.issues,
      suggestions: needsUpdate.suitability.suggestions,
      riskLevel: combinedRiskLevel,
      affectedMolecules: impact.affectedMolecules,
      dependentCount: treeInfo.dependentCount,
      dependents: treeInfo.dependents,
      estimatedTime: combinedRiskLevel === 'HIGH' ? '45-60 minutes' :
                    combinedRiskLevel === 'MEDIUM' ? '30-45 minutes' : '20-30 minutes'
    };

    if (combinedRiskLevel === 'HIGH') {
      actions.optional.push(updateAction);
      // Don't block generation for high-risk updates due to breaking change potential
      console.log(`   ⚠️  High-risk update for ${needsUpdate.atomName} moved to optional (affects ${treeInfo.dependentCount} components)`);
    } else {
      actions.immediate.push(updateAction);
      actions.blockers.push(`${needsUpdate.atomName} needs updates (${needsUpdate.suitability.issues.join(', ')})`);
    }
  }

  // Generate execution sequence
  actions.sequence = generateExecutionSequence(actions);

  return actions;
};

/**
 * Calculate requirement priority
 */
const calculateRequirementPriority = (requirements) => {
  const avgConfidence = requirements.reduce((sum, req) => sum + req.confidence, 0) / requirements.length;

  if (avgConfidence >= 0.8) return 'high';
  if (avgConfidence >= 0.6) return 'medium';
  return 'low';
};

/**
 * Calculate complexity level
 */
const calculateComplexity = (actionPlan) => {
  const createCount = actionPlan.immediate.filter(a => a.type === 'create_atom').length;
  const updateCount = actionPlan.immediate.filter(a => a.type === 'update_atom').length;
  const blockers = actionPlan.blockers.length;

  if (blockers === 0) return 'simple';
  if (createCount + updateCount <= 2) return 'moderate';
  if (createCount + updateCount <= 4) return 'complex';
  return 'very_complex';
};

/**
 * Estimate work required
 */
const estimateWork = (actionPlan) => {
  const totalTime = actionPlan.sequence.reduce((sum, step) => sum + step.estimatedTime, 0);

  return {
    totalTimeMinutes: totalTime,
    totalSteps: actionPlan.sequence.length,
    blockers: actionPlan.blockers.length,
    complexity: calculateComplexity(actionPlan)
  };
};

/**
 * Generate recommendations
 */
const generateRecommendations = (actionPlan, availabilityAnalysis) => {
  const recommendations = [];

  if (actionPlan.blockers.length === 0) {
    recommendations.push('✅ Ready to proceed with molecule generation');
  } else {
    recommendations.push('⚠️  Preparation needed before molecule generation');
    recommendations.push(`🔧 ${actionPlan.immediate.length} immediate actions required`);
  }

  if (availabilityAnalysis.missing.length > 0) {
    recommendations.push(`📦 Create ${availabilityAnalysis.missing.length} missing atoms first`);
  }

  if (availabilityAnalysis.needsUpdate.length > 0) {
    recommendations.push(`🔄 Update ${availabilityAnalysis.needsUpdate.length} existing atoms`);
  }

  if (actionPlan.optional.length > 0) {
    recommendations.push(`💡 ${actionPlan.optional.length} optional improvements available`);
  }

  return recommendations;
};

/**
 * Analyze requirements for molecule generation
 */
export const analyzeMoleculeRequirements = async (moleculeSpec) => {
  console.log(`🔍 Analyzing requirements for molecule: ${moleculeSpec.name}`);

  // Get current library state
  const libraryDocs = getLibraryDocs();
  const dependencyTree = getDependencyTree();

  // Analyze what atoms this molecule needs
  const atomRequirements = await extractAtomRequirements(moleculeSpec);

  // Check availability of required atoms
  const availabilityAnalysis = analyzeAtomAvailability(atomRequirements, libraryDocs.atoms);

  // Determine actions needed
  const actionPlan = generateActionPlan(availabilityAnalysis, dependencyTree);

  const analysis = {
    moleculeName: moleculeSpec.name,
    moleculeType: moleculeSpec.type || 'molecule',
    requirements: {
      atoms: atomRequirements,
      total: atomRequirements.length,
      priority: calculateRequirementPriority(atomRequirements)
    },
    availability: availabilityAnalysis,
    actions: actionPlan,
    readyToGenerate: actionPlan.blockers.length === 0,
    estimatedWork: estimateWork(actionPlan),
    recommendations: generateRecommendations(actionPlan, availabilityAnalysis)
  };

  console.log(`   📋 Found ${atomRequirements.length} atom requirements`);
  console.log(`   ${analysis.readyToGenerate ? '✅' : '⚠️'} Ready to generate: ${analysis.readyToGenerate}`);

  return analysis;
};

/**
 * Generate overall assessment from multiple molecule analyses
 */
const generateOverallAssessment = (analyses) => {
  const totalMolecules = analyses.length;
  const readyMolecules = analyses.filter(a => a.readyToGenerate).length;
  const totalAtomRequirements = analyses.reduce((sum, a) => sum + a.requirements.total, 0);
  const totalBlockers = analyses.reduce((sum, a) => sum + a.actions.blockers.length, 0);
  const totalEstimatedTime = analyses.reduce((sum, a) => sum + a.estimatedWork.totalTimeMinutes, 0);

  return {
    readyToGenerate: readyMolecules === totalMolecules,
    completionRate: readyMolecules / totalMolecules,
    totalMolecules,
    readyMolecules,
    blockedMolecules: totalMolecules - readyMolecules,
    totalAtomRequirements,
    totalBlockers,
    estimatedTime: {
      minutes: totalEstimatedTime,
      hours: Math.round(totalEstimatedTime / 60 * 10) / 10
    },
    complexity: totalBlockers === 0 ? 'simple' : totalBlockers <= 3 ? 'moderate' : 'complex'
  };
};

/**
 * Generate high-level recommendations
 */
const generateHighLevelRecommendations = (assessment) => {
  const recommendations = [];

  if (assessment.readyToGenerate) {
    recommendations.push('🚀 All molecules ready for generation');
    recommendations.push('📋 Proceed with molecule generation workflow');
  } else {
    recommendations.push(`⚠️  ${assessment.blockedMolecules} molecules need preparation`);
    recommendations.push(`⏱️  Estimated ${assessment.estimatedTime.hours} hours of prep work`);

    if (assessment.complexity === 'complex') {
      recommendations.push('🔧 Consider tackling molecules in smaller batches');
      recommendations.push('📊 Focus on high-priority atoms first');
    }
  }

  return recommendations;
};

/**
 * Generate a complete pre-generation report
 */
export const generatePreGenerationReport = async (moleculeSpecs) => {
  console.log('🎯 Generating pre-generation analysis report...');

  const libraryDocs = getLibraryDocs();
  const dependencyTree = getDependencyTree();

  const report = {
    timestamp: new Date().toISOString(),
    libraryState: {
      atoms: Object.keys(libraryDocs.atoms).length,
      molecules: Object.keys(libraryDocs.molecules).length,
      dependencies: {
        totalAtoms: Object.keys(dependencyTree.atoms).length,
        totalMolecules: Object.keys(dependencyTree.molecules).length,
        totalDependencies: Object.values(dependencyTree.molecules)
          .reduce((sum, mol) => sum + mol.dependencyCount, 0),
        averageDependenciesPerMolecule: Object.keys(dependencyTree.molecules).length > 0
          ? Object.values(dependencyTree.molecules).reduce((sum, mol) => sum + mol.dependencyCount, 0) / Object.keys(dependencyTree.molecules).length
          : 0,
        lastUpdated: new Date().toISOString()
      }
    },
    moleculeAnalysis: [],
    overallAssessment: {},
    recommendations: []
  };

  // Analyze each molecule
  for (const spec of Array.isArray(moleculeSpecs) ? moleculeSpecs : [moleculeSpecs]) {
    const analysis = await analyzeMoleculeRequirements(spec);
    report.moleculeAnalysis.push(analysis);
  }

  // Generate overall assessment
  report.overallAssessment = generateOverallAssessment(report.moleculeAnalysis);

  // Generate high-level recommendations
  report.recommendations = generateHighLevelRecommendations(report.overallAssessment);

  console.log(`✅ Analysis complete for ${report.moleculeAnalysis.length} molecule(s)`);

  return report;
};

/**
 * CLI usage
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (command === 'analyze') {
    const moleculeName = process.argv[3] || 'TestMolecule';
    const sampleSpec = {
      name: moleculeName,
      description: 'A sample molecule for testing with button and icon functionality',
      properties: {
        buttonText: 'Text for the button',
        iconName: 'Name of icon to display',
        onClick: 'Click handler function'
      }
    };

    generatePreGenerationReport(sampleSpec).then(report => {
      console.log('\n📋 Pre-Generation Report:');
      console.log('========================');
      console.log(JSON.stringify(report, null, 2));
    });
  } else {
    console.log(`
Library Evaluator CLI

Commands:
  analyze [moleculeName]  - Analyze requirements for molecule generation

Examples:
  node library-evaluator.js analyze CTA
  node library-evaluator.js analyze SearchBar
    `);
  }
}