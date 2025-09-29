#!/usr/bin/env node

/**
 * SELF-REVIEW ENGINE
 * AI-powered self-analysis of generated components
 * Enables AI to examine, critique, and improve its own output
 */

import "dotenv/config";
import OpenAI from 'openai';
import { createSelfReviewTools, getSelfReviewToolDescriptions } from '../tools/self-review-tools.js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * PRIMARY METHOD: AI reviews its own generated components
 */
export const reviewGeneratedComponents = async (savedComponents, originalIntent) => {
  try {
    console.log('🔍 AI SELF-REVIEW ENGINE');
    console.log(`   Reviewing ${savedComponents.length} generated components...`);

    const reviewTools = createSelfReviewTools();
    const reviewResults = {
      reviewId: `review_${Date.now()}`,
      timestamp: new Date().toISOString(),
      totalComponents: savedComponents.length,
      findings: [],
      recommendations: [],
      overallAssessment: null,
      improvementPlan: null
    };

    // Step 1: AI inventories what it actually created
    console.log('   📋 AI taking inventory of generated components...');
    const inventory = await conductInventory(reviewTools, savedComponents);
    reviewResults.inventory = inventory;

    // Step 2: AI compares intended vs actual for each component
    console.log('   🔍 AI comparing intent vs implementation...');
    const comparisons = await conductComparisons(reviewTools, savedComponents, originalIntent);
    reviewResults.comparisons = comparisons;

    // Step 3: AI performs overall analysis and creates improvement plan
    console.log('   🧠 AI conducting comprehensive analysis...');
    const overallAnalysis = await conductOverallAnalysis(inventory, comparisons, originalIntent);
    reviewResults.overallAssessment = overallAnalysis.assessment;
    reviewResults.recommendations = overallAnalysis.recommendations;
    reviewResults.improvementPlan = overallAnalysis.improvementPlan;

    // Save review results
    await saveReviewResults(reviewResults);

    console.log('✅ AI self-review complete');
    console.log(`   Analyzed: ${inventory.totalFiles} files`);
    console.log(`   Issues found: ${reviewResults.recommendations.length}`);
    console.log(`   Overall quality: ${overallAnalysis.assessment.overallScore.toFixed(1)}/10`);

    return reviewResults;

  } catch (error) {
    console.error('❌ AI self-review failed:', error.message);
    throw error;
  }
};

/**
 * AI inventories what it actually generated
 */
const conductInventory = async (reviewTools, savedComponents) => {
  const prompt = `You are conducting a self-review of components you just generated.

TASK: Take a comprehensive inventory of what you actually created.

COMPONENTS YOU WERE SUPPOSED TO GENERATE:
${JSON.stringify(savedComponents.map(comp => ({ name: comp.name, type: comp.type, path: comp.path })), null, 2)}

AVAILABLE TOOLS:
${getSelfReviewToolDescriptions().map(tool =>
  `• ${tool.name}(${tool.parameters}): ${tool.description}`
).join('\n')}

INSTRUCTIONS:
1. Use listComponentFiles() to see what files actually exist
2. Use readComponentFile() to examine 3-5 key components
3. Use analyzeComponent() for detailed analysis of important files

Provide a structured inventory report:
{
  "actualFiles": [],
  "filesByDirectory": {},
  "keyFindings": [],
  "initialObservations": ""
}

Focus on: What did I actually create? How does it compare to what I intended?`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.1
    });

    const aiResponse = response.choices[0].message.content;

    // For now, we'll do a basic inventory since AI can't actually use tools in this prompt
    // In a future version, we could implement function calling
    const basicInventory = reviewTools.listComponentFiles();

    return {
      ...basicInventory,
      aiAnalysis: aiResponse,
      conductedAt: Date.now()
    };

  } catch (error) {
    console.error('Inventory analysis failed:', error.message);
    // Fallback to basic tool usage
    return reviewTools.listComponentFiles();
  }
};

/**
 * AI compares intended vs actual for each component
 */
const conductComparisons = async (reviewTools, savedComponents, originalIntent) => {
  const comparisons = [];

  // Compare each saved component with its intended specification
  for (const savedComponent of savedComponents.slice(0, 5)) { // Limit for efficiency
    try {
      console.log(`     Comparing ${savedComponent.name}...`);

      const intended = {
        name: savedComponent.name,
        type: savedComponent.type,
        specifications: savedComponent.specifications || {},
        variants: savedComponent.variants,
        nodeId: savedComponent.nodeId
      };

      const comparison = reviewTools.compareWithIntent(intended, savedComponent.path);
      comparisons.push({
        componentName: savedComponent.name,
        ...comparison
      });

    } catch (error) {
      console.error(`Error comparing ${savedComponent.name}:`, error.message);
      comparisons.push({
        componentName: savedComponent.name,
        success: false,
        error: error.message
      });
    }
  }

  return comparisons;
};

/**
 * AI conducts overall analysis and creates improvement plan
 */
const conductOverallAnalysis = async (inventory, comparisons, originalIntent) => {
  const prompt = `You are conducting a comprehensive self-review of your component generation work.

INVENTORY RESULTS:
Total Files: ${inventory.totalCount || 0}
Directories: ${Object.keys(inventory.byDirectory || {}).join(', ')}

COMPONENT COMPARISONS:
${JSON.stringify(comparisons.map(comp => ({
  name: comp.componentName,
  success: comp.success,
  completeness: comp.comparison?.completeness?.percentage,
  recommendations: comp.recommendations?.length || 0
})), null, 2)}

ORIGINAL INTENT CONTEXT:
${originalIntent ? JSON.stringify(originalIntent, null, 2) : 'No specific intent provided'}

ANALYSIS TASK:
Conduct a thorough self-analysis and provide:

1. OVERALL ASSESSMENT
   - Quality score (1-10)
   - Strengths and weaknesses
   - Completeness evaluation

2. KEY FINDINGS
   - Most common issues across components
   - Patterns in successful implementations
   - Areas where you deviated from best practices

3. IMPROVEMENT PLAN
   - Priority issues to address
   - Specific actions to take
   - Components that need rework

4. LEARNING INSIGHTS
   - What worked well in your generation process
   - What should be improved for next time
   - Patterns to remember

Be honest and critical in your self-assessment. Focus on actionable improvements.

Respond with structured JSON:
{
  "assessment": {
    "overallScore": 0-10,
    "strengths": [],
    "weaknesses": [],
    "completeness": "percentage"
  },
  "keyFindings": [],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "component": "componentName or 'all'",
      "issue": "description",
      "action": "specific action to take"
    }
  ],
  "improvementPlan": {
    "immediate": [],
    "shortTerm": [],
    "longTerm": []
  },
  "learningInsights": []
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.2
    });

    const aiResponse = response.choices[0].message.content;

    // Try to parse JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    }

    // Fallback analysis if JSON parsing fails
    return {
      assessment: {
        overallScore: 7.0,
        strengths: ['Components were generated successfully', 'Basic structure is correct'],
        weaknesses: ['Unable to parse detailed AI analysis'],
        completeness: 'Partial analysis completed'
      },
      keyFindings: ['AI analysis parsing needs improvement'],
      recommendations: [{
        priority: 'medium',
        component: 'all',
        issue: 'Analysis system needs refinement',
        action: 'Improve AI response parsing'
      }],
      improvementPlan: {
        immediate: ['Review generated components manually'],
        shortTerm: ['Improve analysis parsing'],
        longTerm: ['Enhance AI self-review capabilities']
      },
      learningInsights: ['AI-powered self-review shows promise but needs refinement'],
      rawAnalysis: aiResponse
    };

  } catch (error) {
    console.error('Overall analysis failed:', error.message);
    return {
      assessment: {
        overallScore: 6.0,
        strengths: ['Components generated'],
        weaknesses: ['Analysis system error'],
        completeness: 'Analysis failed'
      },
      keyFindings: [],
      recommendations: [],
      improvementPlan: { immediate: [], shortTerm: [], longTerm: [] },
      learningInsights: [],
      error: error.message
    };
  }
};

/**
 * Save review results for tracking and future reference
 */
const saveReviewResults = async (reviewResults) => {
  try {
    const reportsDir = join(__dirname, '..', 'data', 'self-review-reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    const reportFile = join(reportsDir, `self-review-${reviewResults.reviewId}.json`);
    writeFileSync(reportFile, JSON.stringify(reviewResults, null, 2));

    console.log(`   📄 Review report saved: ${reportFile}`);

  } catch (error) {
    console.error('Failed to save review results:', error.message);
  }
};

/**
 * Generate actionable improvement suggestions
 */
export const generateImprovementSuggestions = (reviewResults) => {
  const suggestions = [];

  // Analyze patterns in recommendations
  const highPriorityIssues = reviewResults.recommendations.filter(rec => rec.priority === 'high');
  const componentIssues = reviewResults.recommendations.filter(rec => rec.component !== 'all');

  if (highPriorityIssues.length > 0) {
    suggestions.push({
      category: 'immediate_action',
      description: `Address ${highPriorityIssues.length} high-priority issues`,
      actions: highPriorityIssues.map(issue => issue.action)
    });
  }

  if (componentIssues.length > 0) {
    const componentNames = [...new Set(componentIssues.map(issue => issue.component))];
    suggestions.push({
      category: 'component_specific',
      description: `Review and improve specific components: ${componentNames.join(', ')}`,
      actions: componentIssues.map(issue => `${issue.component}: ${issue.action}`)
    });
  }

  if (reviewResults.overallAssessment?.overallScore < 7.5) {
    suggestions.push({
      category: 'systematic_improvement',
      description: 'Overall quality below target - systematic review needed',
      actions: [
        'Review component generation templates',
        'Improve variant implementation patterns',
        'Enhance accessibility coverage',
        'Strengthen TypeScript usage'
      ]
    });
  }

  return suggestions;
};

const selfReviewEngine = {
  reviewGeneratedComponents,
  generateImprovementSuggestions
};

export default selfReviewEngine;