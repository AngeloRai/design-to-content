#!/usr/bin/env node

/**
 * VISUAL ANALYSIS ENGINE
 * Core engine for visual-first component identification and analysis
 * Functional approach - no classes, minimal deterministic logic
 */

import "dotenv/config";
import OpenAI from 'openai';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const setupAnalysisDirectories = () => {
  const dirs = ['analysis'];
  dirs.forEach(dir => {
    const fullPath = join(__dirname, '..', '..', 'data', dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
    }
  });
};

setupAnalysisDirectories();

// Analysis state
let analysisHistory = [];
let currentFocus = null;

/**
 * PRIMARY METHOD: Analyze screenshot and identify UI components
 */
export const analyzeScreenshot = async (screenshotPath, context = {}) => {
  try {
    console.log('🔍 Starting Visual Analysis...\n');

    const imageBuffer = readFileSync(screenshotPath);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional UI/UX analyst with expertise in component identification.
          Analyze screenshots to identify React components that need to be built.

          FOCUS ON:
          - Individual UI elements and their variations
          - Visual patterns and relationships
          - Component boundaries and hierarchies
          - Exact variant names from visual content (avoid generic names)

          OUTPUT FORMAT:
          1. OVERVIEW: Brief description of what you see
          2. IDENTIFIED COMPONENTS: Detailed list with variants
          3. IMPLEMENTATION PRIORITY: Atoms first, then molecules, organisms
          4. PIXEL PERFECTION NOTES: Specific measurements/details needed`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this UI screenshot and provide a comprehensive component analysis.

              Context: ${JSON.stringify(context, null, 2)}

              Please identify:
              1. What UI components need to be built
              2. How many variants of each component exist
              3. Visual differences between variants
              4. Priority order for implementation
              5. Specific details needed for pixel-perfect implementation`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    });

    const analysis = response.choices[0].message.content;

    const analysisData = {
      timestamp: new Date().toISOString(),
      screenshotPath,
      context,
      analysis,
      id: `analysis_${Date.now()}`
    };

    analysisHistory.push(analysisData);
    saveAnalysis(analysisData);

    console.log('='.repeat(80));
    console.log('VISUAL ANALYSIS COMPLETE');
    console.log('='.repeat(80));
    console.log(analysis);
    console.log('='.repeat(80));

    return analysisData;

  } catch (error) {
    console.error('❌ Visual Analysis Error:', error.message);
    throw error;
  }
};

/**
 * Use pure AI analysis to extract components - NO predetermined patterns
 */
export const parseComponentsFromAnalysis = async (analysisData) => {
  try {
    console.log('🤖 Using AI to parse components from visual analysis...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a component extraction specialist. Parse visual analysis text to identify React components that need to be built.

          CRITICAL: Do NOT use predetermined patterns or categories. Extract EXACTLY what the visual analysis describes.

          OUTPUT: JSON array of components with:
          - type: exact component name from analysis
          - variantCount: number of variants mentioned
          - priority: "high" (atomic elements), "medium" (combinations), "low" (complex layouts)
          - analysisId: provided analysis ID

          Trust the visual analysis completely. Extract component information as described, not as you think it should be categorized.`
        },
        {
          role: "user",
          content: `Parse this visual analysis and extract components to build:

Analysis ID: ${analysisData.id}

Visual Analysis:
${analysisData.analysis}

Return JSON array of components identified in this analysis.`
        }
      ],
      max_tokens: 1000
    });

    const aiResponse = response.choices[0].message.content;

    // Try to parse JSON response
    let components = [];
    try {
      // Extract JSON from response if wrapped in markdown
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\[([\s\S]*)\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      components = JSON.parse(jsonStr);
    } catch {
      console.log('⚠️  AI response not valid JSON, using fallback parsing');
      // Fallback: let AI describe what it found
      components = [{
        type: 'VisuallyIdentifiedComponents',
        variantCount: 1,
        priority: 'high',
        analysisId: analysisData.id,
        aiDescription: aiResponse
      }];
    }

    console.log(`   Found ${components.length} components through AI analysis`);
    return components;

  } catch (error) {
    console.error('❌ AI Component Parsing Error:', error.message);
    // Fallback to raw analysis
    return [{
      type: 'RequiresManualAnalysis',
      variantCount: 1,
      priority: 'high',
      analysisId: analysisData.id,
      originalAnalysis: analysisData.analysis
    }];
  }
};

/**
 * Focus on specific component for iterative perfection
 */
export const setComponentFocus = (componentType, reason) => {
  currentFocus = {
    componentType,
    reason,
    startTime: new Date().toISOString(),
    status: 'active'
  };

  console.log(`\n🎯 FOCUSING ON: ${componentType}`);
  console.log(`   Reason: ${reason}`);
  console.log(`   Started: ${currentFocus.startTime}\n`);

  saveFocusSession();
  return currentFocus;
};

/**
 * Complete current component focus
 */
export const completeFocus = (completionNotes) => {
  if (currentFocus) {
    currentFocus.status = 'completed';
    currentFocus.endTime = new Date().toISOString();
    currentFocus.completionNotes = completionNotes;

    console.log(`✅ COMPLETED: ${currentFocus.componentType}`);
    console.log(`   Notes: ${completionNotes}\n`);

    saveFocusSession();
    const completedFocus = currentFocus;
    currentFocus = null;
    return completedFocus;
  }
  return null;
};

/**
 * Generate component implementation plan using AI
 */
export const generateImplementationPlan = async (components) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a React development strategist. Create an implementation plan for the identified components.

          FOCUS ON:
          - Logical build order (atoms → molecules → organisms)
          - Dependencies between components
          - Complexity and effort estimation
          - Risk assessment

          NO predetermined rules - base your plan on the actual components identified.`
        },
        {
          role: "user",
          content: `Create an implementation plan for these components:

${JSON.stringify(components, null, 2)}

Provide:
1. Recommended build order
2. Priority justification
3. Estimated complexity
4. Potential dependencies`
        }
      ],
      max_tokens: 1000
    });

    const plan = {
      id: `plan_${Date.now()}`,
      timestamp: new Date().toISOString(),
      totalComponents: components.length,
      aiPlan: response.choices[0].message.content,
      components: components
    };

    saveImplementationPlan(plan);
    return plan;

  } catch (error) {
    console.error('❌ AI Planning Error:', error.message);
    // Fallback to simple sorting by priority
    const sortedComponents = components.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return {
      id: `plan_${Date.now()}`,
      timestamp: new Date().toISOString(),
      totalComponents: components.length,
      components: sortedComponents,
      fallback: true
    };
  }
};

/**
 * Save analysis data
 */
const saveAnalysis = (analysisData) => {
  const filePath = join(__dirname, '..', '..', 'data', 'analysis', `${analysisData.id}.json`);
  writeFileSync(filePath, JSON.stringify(analysisData, null, 2));
};

/**
 * Save focus session data
 */
const saveFocusSession = () => {
  if (currentFocus) {
    const filePath = join(__dirname, '..', '..', 'data', 'analysis', `focus_${Date.now()}.json`);
    writeFileSync(filePath, JSON.stringify(currentFocus, null, 2));
  }
};

/**
 * Save implementation plan
 */
const saveImplementationPlan = (plan) => {
  const filePath = join(__dirname, '..', '..', 'data', 'analysis', `plan_${plan.id}.json`);
  writeFileSync(filePath, JSON.stringify(plan, null, 2));
};

/**
 * Get current analysis status
 */
export const getAnalysisStatus = () => {
  return {
    totalAnalyses: analysisHistory.length,
    currentFocus: currentFocus,
    lastAnalysis: analysisHistory[analysisHistory.length - 1]
  };
};

/**
 * Get analysis history
 */
export const getAnalysisHistory = () => analysisHistory;

/**
 * Get current focus
 */
export const getCurrentFocus = () => currentFocus;

const visualAnalysisEngine = {
  analyzeScreenshot,
  parseComponentsFromAnalysis,
  setComponentFocus,
  completeFocus,
  generateImplementationPlan,
  getAnalysisStatus,
  getAnalysisHistory,
  getCurrentFocus
};

export default visualAnalysisEngine;