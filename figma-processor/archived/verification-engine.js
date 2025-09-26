#!/usr/bin/env node

/**
 * VERIFICATION ENGINE
 * AI-powered component verification with visual validation
 * Validates generated components against source design with refinement loops
 */

import "dotenv/config";
import OpenAI from 'openai';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * PRIMARY METHOD: Verify component with refinement loop
 * Uses AI to validate and refine until quality thresholds are met
 */
export const verifyAndRefineComponent = async (componentSpec, figmaTools, maxIterations = 3) => {
  try {
    console.log(`🔍 VERIFYING COMPONENT: ${componentSpec.name}`);
    console.log(`   Max Iterations: ${maxIterations}`);

    let currentComponent = componentSpec;
    let iteration = 0;
    const verificationHistory = [];

    // Initial verification
    let verification = await performVerification(currentComponent, figmaTools);
    verificationHistory.push({ iteration, ...verification });

    console.log(`   Initial Quality Score: ${verification.overallScore.toFixed(2)}`);

    // Refinement loop
    while (iteration < maxIterations && !verification.passed) {
      iteration++;
      console.log(`\n🔄 REFINEMENT ITERATION ${iteration}`);

      // AI refines the component based on verification issues
      currentComponent = await refineComponentWithAI(currentComponent, verification, figmaTools);

      // Re-verify the refined component
      verification = await performVerification(currentComponent, figmaTools);
      verificationHistory.push({ iteration, ...verification });

      console.log(`   Iteration ${iteration} Quality Score: ${verification.overallScore.toFixed(2)}`);

      if (verification.passed) {
        console.log(`✅ Component passed verification in ${iteration} iterations`);
        break;
      }
    }

    // Final result
    const finalResult = {
      component: currentComponent,
      passed: verification.passed,
      finalScore: verification.overallScore,
      iterations: iteration,
      verificationHistory,
      status: verification.passed ? 'verified' : 'needs_manual_review'
    };

    // Save verification report
    await saveVerificationReport(finalResult);

    return finalResult;

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return {
      component: componentSpec,
      passed: false,
      error: error.message,
      status: 'verification_failed'
    };
  }
};

/**
 * Perform comprehensive verification of a component
 */
const performVerification = async (componentSpec, figmaTools) => {
  console.log(`   🔎 Performing verification checks...`);

  // 1. Visual Verification - Compare against Figma export
  const visualScore = await performVisualVerification(componentSpec, figmaTools);

  // 2. Spec Compliance - Check if component meets specifications
  const specScore = await performSpecCompliance(componentSpec);

  // 3. Code Quality - Static analysis
  const codeScore = await performCodeQualityCheck(componentSpec);

  // 4. Accessibility - Basic a11y checks
  const a11yScore = await performAccessibilityCheck(componentSpec);

  // Calculate overall score
  const overallScore = (visualScore + specScore + codeScore + a11yScore) / 4;

  // Determine if passed (threshold: 0.85)
  const passed = overallScore >= 0.85;

  const verification = {
    passed,
    overallScore,
    scores: {
      visual: visualScore,
      specCompliance: specScore,
      codeQuality: codeScore,
      accessibility: a11yScore
    },
    issues: await identifyIssues(componentSpec, {
      visual: visualScore,
      specCompliance: specScore,
      codeQuality: codeScore,
      accessibility: a11yScore
    }),
    timestamp: Date.now()
  };

  return verification;
};

/**
 * Visual verification - compare component render with Figma export
 */
const performVisualVerification = async (componentSpec, figmaTools) => {
  try {
    console.log(`     🎨 Visual verification...`);

    // Export reference image from Figma
    const figmaExport = await figmaTools.exportImages([componentSpec.nodeId], {
      format: 'png',
      scale: 2
    });

    if (!figmaExport.success || !figmaExport.images[componentSpec.nodeId]) {
      console.log(`     ⚠️ Could not get Figma reference image`);
      return 0.7; // Default score when no reference available
    }

    // For now, we'll use AI to analyze the visual match
    // In a full implementation, you'd render the component and do pixel comparison
    const visualAnalysis = await analyzeVisualMatchWithAI(componentSpec, figmaExport);

    return visualAnalysis.score;

  } catch (error) {
    console.log(`     ❌ Visual verification failed: ${error.message}`);
    return 0.6; // Lower score for failed verification
  }
};

/**
 * Use AI to analyze visual match (placeholder for actual rendering comparison)
 */
const analyzeVisualMatchWithAI = async (componentSpec, figmaExport) => {
  try {
    // Read the Figma export image
    const figmaImagePath = figmaExport.images[componentSpec.nodeId].localPath;
    const imageBuffer = readFileSync(figmaImagePath);
    const base64Image = imageBuffer.toString('base64');

    const prompt = `Analyze this React component code against the Figma design reference:

COMPONENT CODE:
${componentSpec.code}

COMPONENT SPECIFICATIONS:
${JSON.stringify(componentSpec.specifications || {}, null, 2)}

Looking at the Figma design reference image, evaluate how well the component code would match:

1. Layout and spacing
2. Typography and sizing
3. Colors and styling
4. Interactive states coverage
5. Overall visual fidelity

Respond with JSON:
{
  "score": 0.0-1.0,
  "analysis": "Brief analysis of match quality",
  "missingElements": ["list of missing elements"],
  "strengths": ["list of what matches well"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${base64Image}` }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const aiResponse = response.choices[0].message.content;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      console.log(`     📊 Visual score: ${analysis.score}`);
      return analysis;
    }

    return { score: 0.7, analysis: "Could not parse AI analysis" };

  } catch (error) {
    console.log(`     ❌ AI visual analysis failed: ${error.message}`);
    return { score: 0.6, analysis: "Analysis failed" };
  }
};

/**
 * Check specification compliance
 */
const performSpecCompliance = async (componentSpec) => {
  console.log(`     📋 Spec compliance check...`);

  let score = 1.0;
  const issues = [];

  // Check if component has proper TypeScript interface
  if (!componentSpec.code.includes('interface ')) {
    score -= 0.2;
    issues.push('Missing TypeScript interface');
  }

  // Check if component has proper props handling
  if (!componentSpec.code.includes('Props') && !componentSpec.code.includes('props')) {
    score -= 0.2;
    issues.push('Missing proper props handling');
  }

  // Check if component uses className prop
  if (!componentSpec.code.includes('className')) {
    score -= 0.1;
    issues.push('Missing className prop');
  }

  // Check if component uses cn utility
  if (!componentSpec.code.includes('cn(')) {
    score -= 0.1;
    issues.push('Not using cn utility for class merging');
  }

  // Check for variant handling if variants expected
  if (componentSpec.variants && !componentSpec.code.includes('variant')) {
    score -= 0.3;
    issues.push('Missing variant prop handling');
  }

  console.log(`     📊 Spec compliance score: ${score.toFixed(2)}`);
  return Math.max(0, score);
};

/**
 * Perform basic code quality checks
 */
const performCodeQualityCheck = async (componentSpec) => {
  console.log(`     🔧 Code quality check...`);

  let score = 1.0;
  const code = componentSpec.code;

  // Basic syntax checks
  const hasProperImports = code.includes("import");
  const hasProperExport = code.includes("export");
  const hasProperFunction = code.includes("function ") || code.includes("const ") && code.includes("=>");

  if (!hasProperImports) score -= 0.2;
  if (!hasProperExport) score -= 0.2;
  if (!hasProperFunction) score -= 0.3;

  // Check for common patterns
  const hasForwardRef = code.includes("forwardRef") || code.includes("ref?");
  const hasProperReturn = code.includes("return (") || code.includes("return <");

  if (!hasProperReturn) score -= 0.2;

  // Bonus for good practices
  if (code.includes("React.") || code.includes("HTMLAttributes")) score += 0.05;
  if (code.includes("focus-visible")) score += 0.05;

  console.log(`     📊 Code quality score: ${score.toFixed(2)}`);
  return Math.max(0, Math.min(1, score));
};

/**
 * Perform accessibility checks
 */
const performAccessibilityCheck = async (componentSpec) => {
  console.log(`     ♿ Accessibility check...`);

  let score = 1.0;
  const code = componentSpec.code;

  // Check for focus handling
  if (!code.includes("focus-visible")) score -= 0.2;

  // Check for proper button attributes if it's a button
  if (code.includes("<button") && !code.includes("...props")) {
    score -= 0.2;
  }

  // Check for ARIA attributes if complex component
  const hasAriaAttributes = code.includes("aria-") || code.includes("role=");
  if (componentSpec.type === 'molecule' || componentSpec.type === 'organism') {
    if (!hasAriaAttributes) score -= 0.3;
  }

  console.log(`     📊 Accessibility score: ${score.toFixed(2)}`);
  return Math.max(0, score);
};

/**
 * Identify specific issues for AI refinement
 */
const identifyIssues = async (componentSpec, scores) => {
  const issues = [];

  if (scores.visual < 0.8) {
    issues.push({
      category: 'visual',
      severity: 'high',
      description: 'Component visual appearance may not match Figma design'
    });
  }

  if (scores.specCompliance < 0.8) {
    issues.push({
      category: 'specification',
      severity: 'medium',
      description: 'Component may not fully implement required specifications'
    });
  }

  if (scores.codeQuality < 0.7) {
    issues.push({
      category: 'code_quality',
      severity: 'high',
      description: 'Code quality issues detected - syntax or structure problems'
    });
  }

  if (scores.accessibility < 0.8) {
    issues.push({
      category: 'accessibility',
      severity: 'medium',
      description: 'Accessibility improvements needed'
    });
  }

  return issues;
};

/**
 * AI refines component based on verification results
 */
const refineComponentWithAI = async (componentSpec, verification, figmaTools) => {
  try {
    console.log(`   🤖 AI refining component...`);

    // Get additional Figma data if needed for refinement
    let additionalContext = '';
    if (verification.scores.visual < 0.8) {
      // Get more detailed node information
      const nodeDetails = await figmaTools.getNode(componentSpec.nodeId, 3);
      if (nodeDetails.success) {
        additionalContext = `\nADDITIONAL FIGMA DETAILS:\n${JSON.stringify(nodeDetails.node, null, 2)}`;
      }
    }

    const prompt = `Refine this React component based on verification issues:

CURRENT COMPONENT:
${componentSpec.code}

VERIFICATION RESULTS:
Overall Score: ${verification.overallScore.toFixed(2)}
Visual Score: ${verification.scores.visual.toFixed(2)}
Spec Compliance: ${verification.scores.specCompliance.toFixed(2)}
Code Quality: ${verification.scores.codeQuality.toFixed(2)}
Accessibility: ${verification.scores.accessibility.toFixed(2)}

ISSUES TO FIX:
${verification.issues.map(issue => `• ${issue.category}: ${issue.description}`).join('\n')}

${additionalContext}

REFINEMENT GOALS:
1. Fix the specific issues identified above
2. Improve visual accuracy to match Figma design
3. Ensure all variants/states are properly implemented
4. Maintain clean, readable code structure
5. Follow accessibility best practices

Return the improved component code without markdown code fences:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.1
    });

    const refinedCode = response.choices[0].message.content.trim();

    return {
      ...componentSpec,
      code: refinedCode,
      lastRefined: Date.now()
    };

  } catch (error) {
    console.error(`❌ AI refinement failed: ${error.message}`);
    return componentSpec; // Return original if refinement fails
  }
};

/**
 * Save verification report for tracking
 */
const saveVerificationReport = async (verificationResult) => {
  try {
    const reportsDir = join(__dirname, '..', 'data', 'verification-reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    const reportFile = join(reportsDir, `${verificationResult.component.name}-${Date.now()}.json`);
    writeFileSync(reportFile, JSON.stringify(verificationResult, null, 2));

  } catch (error) {
    console.error('Failed to save verification report:', error.message);
  }
};

/**
 * Get verification statistics
 */
export const getVerificationStats = (verificationResults) => {
  const stats = {
    total: verificationResults.length,
    passed: verificationResults.filter(r => r.passed).length,
    failed: verificationResults.filter(r => !r.passed).length,
    averageScore: 0,
    averageIterations: 0
  };

  if (stats.total > 0) {
    stats.averageScore = verificationResults.reduce((sum, r) => sum + r.finalScore, 0) / stats.total;
    stats.averageIterations = verificationResults.reduce((sum, r) => sum + r.iterations, 0) / stats.total;
  }

  return stats;
};

const verificationEngine = {
  verifyAndRefineComponent,
  getVerificationStats
};

export default verificationEngine;