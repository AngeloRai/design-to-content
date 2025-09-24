#!/usr/bin/env node


import "dotenv/config";
import { analyzeScreenshot } from './engines/visual-analysis-engine.js';
import { discoverComponents, filterComponentsWithAI } from './engines/discovery-engine.js';
import { verifyAndRefineComponent } from './engines/verification-engine.js';
import { reviewGeneratedComponents } from './engines/self-review-engine.js';
import { parseFigmaUrl, fetchFigmaScreenshot, fetchNodeData } from './utils/figma-utils.js';
import { createFigmaTools, createToolGuidance } from './tools/figma-tools.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const processDesignToCode = async (input, context = {}) => {
  try {
    console.log('\n🚀 DESIGN-TO-CODE PROCESSING');
    console.log('='.repeat(50));

    // Step 1: Get screenshot and setup (existing approach)
    const { screenshotPath, figmaData } = await getScreenshot(input);

    let discoveredComponents = [];
    if (figmaData) {
      console.log('\n🔍 COMPONENT DISCOVERY');
      const discovery = await discoverComponents(figmaData.fileKey, figmaData.nodeId);
      discoveredComponents = discovery.worklist.filter(item =>
        item.type === 'component_set' || item.type === 'component'
      );
      console.log(`   Found ${discoveredComponents.length} components`);
    }

    console.log('\n📸 VISUAL ANALYSIS');
    const visualAnalysis = await analyzeScreenshot(screenshotPath, { ...context, figmaData });

    console.log('\n🧹 COMPONENT FILTERING');
    const filteredComponents = await filterComponentsWithAI(discoveredComponents, visualAnalysis);

    console.log(`   📊 Filter: ${discoveredComponents.length} → ${filteredComponents.length} components`);

    console.log('\n🔧 COMPONENT GENERATION');
    const figmaTools = figmaData ? createFigmaTools(figmaData.fileKey) : null;
    const generatedComponents = await generateComponentsInBatches(
      visualAnalysis,
      filteredComponents,
      figmaData,
      figmaTools
    );

    console.log('\n💾 SAVING COMPONENTS');
    const savedComponents = await saveAllComponents(generatedComponents.map(comp => ({
      ...comp,
      verificationStatus: 'pending',
      qualityScore: 0.8
    })));

    console.log('\n🔍 SELF-REVIEW');
    let selfReviewResults = null;
    try {
      const originalIntent = {
        visualAnalysis,
        discoveredComponents,
        generatedComponents,
        categories: await extractComponentCategories(visualAnalysis)
      };
      selfReviewResults = await reviewGeneratedComponents(savedComponents, originalIntent);

      console.log(`   📊 Quality: ${selfReviewResults.overallAssessment.overallScore.toFixed(1)}/10`);
      if (selfReviewResults.recommendations.length > 0) {
        console.log(`   💡 ${selfReviewResults.recommendations.length} improvements found`);
      }
    } catch (error) {
      console.error(`   ❌ Self-review failed: ${error.message}`);
    }

    console.log('\n🔍 VERIFICATION & REFINEMENT');
    const verifiedComponents = [];

    const componentsByPriority = generatedComponents.filter(comp => comp.nodeId);
    const atomComponents = componentsByPriority.filter(comp => comp.type === 'atom').slice(0, 6);
    const moleculeComponents = componentsByPriority.filter(comp => comp.type === 'molecule').slice(0, 2);
    const componentsToVerify = [...atomComponents, ...moleculeComponents];

    console.log(`   🎯 Verifying ${componentsToVerify.length} components`);
    console.log(`     Atoms: ${atomComponents.length}, Molecules: ${moleculeComponents.length}`);

    for (const component of componentsToVerify) {
      if (figmaTools && component.nodeId) {
        console.log(`\n   Verifying: ${component.name} (${component.type})`);
        try {
          const verificationResult = await verifyAndRefineComponent(component, figmaTools, 1);
          verifiedComponents.push({
            ...verificationResult.component,
            verificationStatus: verificationResult.status,
            qualityScore: verificationResult.finalScore,
            iterations: verificationResult.iterations
          });
        } catch (error) {
          console.error(`   ❌ Verification failed for ${component.name}: ${error.message}`);
          verifiedComponents.push({
            ...component,
            verificationStatus: 'verification_failed',
            qualityScore: 0.7
          });
        }
      } else {
        verifiedComponents.push({
          ...component,
          verificationStatus: 'skipped_no_figma_data',
          qualityScore: 0.8
        });
      }
    }

    const nonVerifiedComponents = generatedComponents.filter(comp =>
      !componentsToVerify.includes(comp)
    ).map(comp => ({
      ...comp,
      verificationStatus: 'deferred',
      qualityScore: 0.75
    }));

    verifiedComponents.push(...nonVerifiedComponents);

    console.log('\n🔄 UPDATING COMPONENTS');
    await updateComponentsWithVerification(savedComponents, verifiedComponents);

    console.log('\n✅ PROCESSING COMPLETE!');
    console.log(`   Generated: ${savedComponents.length} components`);
    console.log(`   Discovered: ${discoveredComponents.length} components`);

    const avgQuality = savedComponents.reduce((sum, comp) => sum + (comp.qualityScore || 0), 0) / savedComponents.length;
    console.log(`   Average Quality: ${avgQuality.toFixed(2)}`);

    console.log(`\n🧩 Components:`);
    savedComponents.forEach(comp => {
      const status = comp.verificationStatus === 'verified' ? '✅' : '⚠️';
      const score = comp.qualityScore ? `(${comp.qualityScore.toFixed(2)})` : '';
      console.log(`  ${status} ${comp.name} → ${comp.path} ${score}`);
    });

    return {
      id: `session_${Date.now()}`,
      screenshotPath,
      figmaData,
      visualAnalysis,
      discoveredComponents,
      components: savedComponents,
      selfReview: selfReviewResults,
      averageQualityScore: avgQuality,
      status: 'completed',
      startTime: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Processing failed:', error.message);
    throw error;
  }
};

/**
 * Generate components in batches to avoid token limits and ensure complete coverage
 */
const generateComponentsInBatches = async (visualAnalysis, discoveredComponents, figmaData, figmaTools) => {
  console.log('   🤖 Using batch generation strategy for comprehensive coverage...');

  // Step 1: Extract allowed components from visual analysis (DISABLED - using discovery filter instead)
  const allowedComponents = extractSpecificComponentsFromAnalysis();
  const componentCategories = await extractComponentCategories(visualAnalysis);
  console.log(`   📋 Identified ${componentCategories.length} component categories`);

  // Step 2: Generate components category by category
  const allComponents = [];

  for (const category of componentCategories) {
    console.log(`\n   🔧 Generating ${category.name} components...`);

    // Find related discovered components for this category
    const relatedDiscovered = discoveredComponents.filter(disc =>
      isRelatedToCategory(disc, category)
    );

    const categoryComponents = await generateComponentCategory(
      category,
      relatedDiscovered,
      visualAnalysis,
      figmaData,
      figmaTools,
      allowedComponents
    );

    allComponents.push(...categoryComponents);
    console.log(`     ✅ Generated ${categoryComponents.length} ${category.name} components`);
  }

  // Step 3: Deduplicate and consolidate components
  console.log('   🔄 Deduplicating generated components...');
  const uniqueComponents = await deduplicateComponents(allComponents);
  console.log(`   📊 Deduplicated: ${allComponents.length} → ${uniqueComponents.length} components`);

  return uniqueComponents;
};

/**
 * Smart component deduplication using AI
 */
const deduplicateComponents = async (components) => {
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
 * Consolidate a group of similar components into one with variants
 */
const consolidateComponentGroup = async (baseName, components) => {
  try {
    const componentList = components.map(comp =>
      `${comp.name} (${comp.type}) - ${comp.description || 'No description'}`
    ).join('\n');

    const codeList = components.map(comp =>
      `// ${comp.name}:\n${comp.code.substring(0, 500)}...`
    ).join('\n\n');

    const prompt = `Consolidate these similar React components into ONE component with variant props:

COMPONENTS TO MERGE:
${componentList}

CODE SAMPLES:
${codeList}

Create ONE consolidated component named "${baseName}" that:
• Handles all variations through props (variant, size, state, etc.)
• Uses TypeScript union types for variants
• Maintains all functionality from the separate components
• Uses class-variance-authority (cva) pattern if helpful

Return only the final consolidated component code, no explanations.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.1
    });

    let consolidatedCode = response.choices[0].message.content.trim();

    // Clean up code fences
    consolidatedCode = consolidatedCode.replace(/^```typescript\n?/, '');
    consolidatedCode = consolidatedCode.replace(/^```\n?/, '');
    consolidatedCode = consolidatedCode.replace(/\n?```$/, '');

    // Take the first component as base and update with consolidated code
    const baseComponent = components[0];

    return {
      ...baseComponent,
      name: baseName,
      code: consolidatedCode,
      description: `Consolidated ${baseName} component with variants`,
      variants: components.map(c => c.name).join(', ')
    };

  } catch (error) {
    console.log(`   ⚠️ Failed to consolidate ${baseName}: ${error.message}`);
    return components[0]; // Return first component as fallback
  }
};

/**
 * DISABLED: Component constraint extraction
 * The real fix is to filter discovered components at the source, not during generation
 */
const extractSpecificComponentsFromAnalysis = () => {
  console.log('   🎯 Component constraints disabled - filtering at discovery level instead');
  return null; // No constraints - let the discovery filter handle this
};

/**
 * Extract component categories from visual analysis DYNAMICALLY
 */
const extractComponentCategories = async (visualAnalysis) => {
  console.log('   📋 Using AI to extract semantic component categories...');

  try {
    const prompt = `Analyze this design system and identify the main COMPONENT TYPES (not properties like variants, sizes, or states):

VISUAL ANALYSIS:
${visualAnalysis.analysis}

Identify only the core component types that should each be a single React component with variants/props.

Examples of GOOD categories: Buttons, Form Inputs, Badges, Avatars, Cards, Modals
Examples of BAD categories: Variants, Sizes, States, Colors (these are props, not components)

Return 3-8 component categories, one per line in format:
[ComponentType]: [brief description]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.1
    });

    const lines = response.choices[0].message.content.trim().split('\n');
    const categories = [];

    lines.forEach(line => {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const [, name, description] = match;
        const cleanName = name.trim();

        categories.push({
          name: cleanName,
          keywords: cleanName.toLowerCase().split(/[\s,]+/).filter(word => word.length > 2),
          priority: 'high',
          description: description.trim()
        });

        console.log(`     ✓ ${cleanName}`);
      }
    });

    if (categories.length === 0) {
      console.log('     ⚠️ AI failed, using fallback categories');
      return getDefaultCategories();
    }

    return categories;

  } catch (error) {
    console.log(`     ⚠️ AI extraction failed: ${error.message}`);
    return getDefaultCategories();
  }
};

const getDefaultCategories = () => {
  console.log('     ✓ Using curated default categories');
  return [
    {
      name: 'Buttons',
      keywords: ['button', 'btn', 'cta'],
      priority: 'high',
      description: 'Interactive button components with all variants'
    },
    {
      name: 'Form Inputs',
      keywords: ['input', 'field', 'form', 'textarea'],
      priority: 'high',
      description: 'Form input components including text, email, password'
    },
    {
      name: 'Form Controls',
      keywords: ['checkbox', 'radio', 'switch', 'toggle'],
      priority: 'high',
      description: 'Interactive form control components'
    },
    {
      name: 'Display Components',
      keywords: ['badge', 'avatar', 'alert', 'card'],
      priority: 'medium',
      description: 'Display and presentation components'
    },
    {
      name: 'Interactive Components',
      keywords: ['slider', 'range', 'progress'],
      priority: 'medium',
      description: 'Interactive UI elements'
    }
  ];
};

/**
 * Check if a discovered component relates to a category
 */
const isRelatedToCategory = (discoveredComponent, category) => {
  const componentName = discoveredComponent.name.toLowerCase();
  return category.keywords.some(keyword => componentName.includes(keyword));
};

/**
 * Generate components for a specific category
 */
const generateComponentCategory = async (category, relatedDiscovered, visualAnalysis, figmaData, figmaTools, allowedComponents = null) => {
  // Create category-specific context
  const discoveryContext = relatedDiscovered.length > 0
    ? `\nRELATED DISCOVERED COMPONENTS FOR ${category.name.toUpperCase()}:\n${JSON.stringify(relatedDiscovered, null, 2)}\n`
    : '';

  const toolGuidance = figmaTools
    ? `\n${createToolGuidance(figmaData.fileKey)}\n`
    : '';

  // Create constraint guidance if allowed components are specified
  const constraintGuidance = allowedComponents && allowedComponents.size > 0
    ? `\n🎯 STRICT COMPONENT CONSTRAINTS:

**ALLOWED COMPONENTS (ONLY THESE):**
${Array.from(allowedComponents).join(', ')}

**⛔ GENERATION RULE:**
If a component name is NOT in the allowed list above, DO NOT generate it.
Only generate the specific design system components from the allowed list.
Focus on reusable design system components that were specifically identified in the visual analysis.

`
    : allowedComponents === null
    ? '\n⚠️ NO COMPONENT CONSTRAINTS: Generate components based on visual analysis content only.\n'
    : '';

  // Generate AI-driven requirements
  const categoryRequirements = await getCategoryRequirements(category, visualAnalysis);

  const prompt = `You are a senior React developer creating components for "${category.name}" from a design system.

CATEGORY: ${category.name}
DESCRIPTION: ${category.description}

VISUAL ANALYSIS SECTION:
${visualAnalysis.analysis}

${constraintGuidance}${discoveryContext}

${toolGuidance}

CRITICAL INSTRUCTIONS:
• Generate ONLY 1-3 core components for this category
• Each component should handle ALL its variations through props (variant, size, state)
• DO NOT create separate components for each variant (e.g., ButtonPrimary, ButtonSecondary)
• USE a single component with variant props instead

EXAMPLE GOOD PATTERN (Button category):
- ONE Button component with variant="primary" | "secondary" | "destructive" props

EXAMPLE BAD PATTERN (what NOT to do):
- ButtonPrimary, ButtonSecondary, ButtonDestructive as separate components

${categoryRequirements}

OUTPUT FORMAT:
---COMPONENT-SEPARATOR---
COMPONENT_NAME: [PascalCase name - generic, not variant-specific]
COMPONENT_TYPE: [atom|molecule|organism]
COMPONENT_NODE_ID: [Figma node ID if available]
COMPONENT_DESCRIPTION: [Brief description]
COMPONENT_SPECIFICATIONS: [JSON object with all variants, states, sizes as props]
COMPONENT_CODE:
[Complete TypeScript component with variant/size/state props - NO code fences]
---COMPONENT-SEPARATOR---

Focus: Generate 1-3 consolidated ${category.name.toLowerCase()} components that handle variations through props.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 8000, // Reduced per category to focus on quality
    temperature: 0.1
  });

  const generatedContent = response.choices[0].message.content;
  const components = parseGeneratedComponents(generatedContent, relatedDiscovered);

  return components;
};

/**
 * Get category-specific requirements using AI analysis with deterministic fallbacks
 */
const getCategoryRequirements = async (category, visualAnalysis) => {
  try {
    // Use AI to generate context-aware requirements based on visual analysis
    const prompt = `Based on this visual analysis and component category, generate 3-5 specific, actionable requirements for implementation:

CATEGORY: ${category.name}
DESCRIPTION: ${category.description}
VISUAL ANALYSIS EXCERPT: ${extractRelevantAnalysis(visualAnalysis.analysis, category)}

Generate requirements that:
- Are based solely on what's visible in the design
- Work with any design system or visual style
- Focus on functionality and UX patterns observed
- Include appropriate accessibility considerations
- Avoid assumptions about specific colors, sizes, or frameworks

Return as bullet points starting with "•"`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.1
    });

    const aiRequirements = response.choices[0].message.content.trim();

    // Add deterministic universal requirements (these are always beneficial)
    const universalRequirements = [
      '• Match the exact design patterns from the visual analysis',
      '• Use TypeScript interfaces with proper prop types',
      '• Ensure proper keyboard navigation and focus management'
    ];

    return aiRequirements + '\n' + universalRequirements.join('\n');

  } catch (error) {
    console.warn(`   ⚠️ AI requirements generation failed for ${category.name}: ${error.message}, using fallback`);

    // Deterministic fallback - minimal but universally applicable
    return [
      '• Implement all variants and states visible in the design analysis',
      '• Follow established accessibility patterns for this component type',
      '• Use semantic HTML structure appropriate for the component purpose',
      '• Match the exact visual design from the analysis',
      '• Include proper TypeScript interfaces and prop validation'
    ].join('\n');
  }
};

/**
 * Extract relevant parts of visual analysis for a specific category
 */
const extractRelevantAnalysis = (analysis, category) => {
  const keywords = category.keywords || [];
  const categoryName = category.name.toLowerCase();

  // Split analysis into sentences and find relevant ones
  const sentences = analysis.split(/[.!?]+/);
  const relevantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase();
    return keywords.some(keyword => lowerSentence.includes(keyword)) ||
           lowerSentence.includes(categoryName);
  });

  // Return first 3 relevant sentences or first 500 chars of full analysis
  const relevant = relevantSentences.slice(0, 3).join('. ');
  return relevant.length > 50 ? relevant : analysis.substring(0, 500);
};


const parseGeneratedComponents = (content, discoveredComponents) => {
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
      // Clean up code
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
 * Get screenshot from input (existing function)
 */
const getScreenshot = async (input) => {
  const isFigmaUrl = input.includes('figma.com');

  if (isFigmaUrl) {
    console.log('   🔗 Fetching from Figma...');

    const { fileKey, nodeId } = parseFigmaUrl(input);
    const screenshotResult = await fetchFigmaScreenshot(fileKey, nodeId);
    const nodeDataResult = await fetchNodeData(fileKey, nodeId);

    return {
      screenshotPath: screenshotResult.localPath,
      figmaData: {
        url: input,
        fileKey,
        nodeId,
        screenshot: screenshotResult,
        nodeData: nodeDataResult
      }
    };
  } else {
    return {
      screenshotPath: input,
      figmaData: null
    };
  }
};

const saveAllComponents = async (components) => {
  const saved = [];
  const projectRoot = join(__dirname, '..');

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
const updateComponentsWithVerification = async (savedComponents, verifiedComponents) => {
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

/**
 * CLI Interface
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'process':
      const input = process.argv[3];
      if (!input) {
        console.error('❌ Please provide Figma URL or screenshot path');
        process.exit(1);
      }

      processDesignToCode(input)
        .then(result => {
          console.log('\n🎉 Processing completed successfully!');
          console.log(`Generated ${result.components.length} components`);
          console.log(`Average quality: ${result.averageQualityScore.toFixed(2)}`);
        })
        .catch(error => {
          console.error('\n❌ Processing failed:', error.message);
          process.exit(1);
        });
      break;

    default:
      console.log(`
🚀 Design-to-Code Processor

Commands:
  process   - Process design with AI analysis

Examples:
  node design-processor.js process "https://figma.com/design/abc?node-id=1:2"
  node design-processor.js process ./screenshot.png
      `);
  }
}

const designToCodeProcessor = {
  processDesignToCode
};

/**
 * Determine appropriate file path for component using AI with deterministic fallback
 */
const determineComponentPath = async (component) => {
  try {
    // Quick deterministic mapping for common cases (reliable patterns)
    const typeMapping = {
      'atom': 'elements',
      'molecule': 'components',
      'organism': 'modules'
    };

    // Use deterministic mapping if available (fast and reliable)
    if (typeMapping[component.type]) {
      return typeMapping[component.type];
    }

    // For unclear cases, use AI to determine best path
    const prompt = `Given this React component, determine the most appropriate subdirectory for a modern component library:

COMPONENT: ${component.name}
TYPE: ${component.type}
DESCRIPTION: ${component.description}

Choose the best subdirectory from these options:
- elements (simple, atomic UI elements like buttons, inputs)
- components (composed UI components like cards, forms)
- modules (complex, page-level components)
- layouts (layout and container components)

Respond with just the subdirectory name.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 20,
      temperature: 0
    });

    const suggestedPath = response.choices[0].message.content.trim().toLowerCase();

    // Validate AI response against allowed paths
    const validPaths = ['elements', 'components', 'modules', 'layouts'];
    return validPaths.includes(suggestedPath) ? suggestedPath : 'components';

  } catch (error) {
    console.warn(`   ⚠️ Path determination failed for ${component.name}: ${error.message}`);

    // Deterministic fallback based on type
    const fallbackMapping = {
      'atom': 'elements',
      'molecule': 'components',
      'organism': 'modules'
    };

    return fallbackMapping[component.type] || 'components';
  }
};

export default designToCodeProcessor;

