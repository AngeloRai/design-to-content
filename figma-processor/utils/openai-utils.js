#!/usr/bin/env node

/**
 * SHARED OPENAI UTILITIES
 * Reusable AI functions for component generation and analysis
 */

import OpenAI from 'openai';

let openai = null;

const getOpenAI = () => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
};

/**
 * Extract component categories from visual analysis DYNAMICALLY
 */
export const aiExtractComponentCategories = async (visualAnalysis) => {
  console.log('   📋 Using AI to extract semantic component categories...');

  try {
    const prompt = `Analyze this design system and identify the main COMPONENT TYPES (not properties like variants, sizes, or states):

VISUAL ANALYSIS:
${visualAnalysis.analysis}

Analyze the visual design and identify distinct UI component types present.
Each component type should represent a reusable element that would become its own React component.

Guidelines:
- Focus on identifying unique functional elements (not variations of the same component)
- Consider the design's actual complexity (could be 1 component or 50+)
- Group similar elements logically (e.g., all text inputs are one component type with variants)
- Don't force a specific number - identify what's actually there

Return each identified component type, one per line:
[ComponentType]: [brief description of its purpose and variations if any]`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
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

/**
 * Get category-specific requirements using AI analysis with deterministic fallbacks
 */
export const aiGetCategoryRequirements = async (category, visualAnalysis) => {
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

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.1
    });

    const aiRequirements = response.choices[0].message.content.trim();

    // Add deterministic universal requirements (these are always beneficial)
    const universalRequirements = [
      '• Match the exact design patterns from the visual analysis',
      '• Use TypeScript interfaces with proper prop types',
      '• Ensure proper keyboard navigation and focus management',
      '• Use Tailwind CSS utilities exclusively (no inline styles or CSS classes)',
      '• Import and use cn() from "@/lib/utils" for className composition',
      '• Use class-variance-authority (cva) for variant management'
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
 * Consolidate a group of similar components into one with variants
 */
export const aiConsolidateComponentGroup = async (baseName, components) => {
  try {
    const componentList = components.map(comp =>
      `${comp.name} (${comp.type}) - ${comp.description || 'No description'}`
    ).join('\n');

    const codeList = components.map(comp =>
      `// ${comp.name}:\n${comp.code.substring(0, 500)}...`
    ).join('\n\n');

    const prompt = `Consolidate these similar React components into ONE MODERN Tailwind CSS component with variant props:

COMPONENTS TO MERGE:
${componentList}

CODE SAMPLES:
${codeList}

Create ONE consolidated component named "${baseName}" that:
• Uses Tailwind CSS utilities exclusively (NO inline styles, NO CSS classes)
• Imports and uses cn() from "@/lib/utils" for className composition
• Uses class-variance-authority (cva) for variant management
• Handles all variations through props (variant, size, state, etc.)
• Uses TypeScript interfaces with VariantProps
• Maintains all functionality from the separate components

REQUIRED IMPORTS:
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

Return only the final consolidated component code with proper Tailwind styling, no explanations.`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.1
    });

    let consolidatedCode = response.choices[0].message.content.trim();

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
 * Determine appropriate file path for component using AI with deterministic fallback
 */
export const aiDetermineComponentPath = async (component) => {
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

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
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

/**
 * Fix TypeScript errors in component code using AI
 */
export const aiFixTypeScriptErrors = async (componentCode, componentName, errors) => {
  if (!errors || errors.length === 0) {
    return {
      success: true,
      code: componentCode,
      message: 'No errors to fix'
    };
  }

  try {
    const errorDescriptions = errors.map(error =>
      `Line ${error.line}, Column ${error.column}: ${error.code} - ${error.message}`
    ).join('\n');

    const prompt = `Fix the TypeScript errors in this React component:

COMPONENT NAME: ${componentName}

CURRENT CODE:
\`\`\`typescript
${componentCode}
\`\`\`

TYPESCRIPT ERRORS:
${errorDescriptions}

REQUIREMENTS:
• Fix all TypeScript errors while maintaining component functionality
• Ensure proper imports are included
• Use correct TypeScript interfaces and types
• Keep the component structure and styling intact
• Use Tailwind CSS and cn() utility properly
• Follow React best practices

Return ONLY the corrected component code with no explanations or markdown formatting.`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.1
    });

    let fixedCode = response.choices[0].message.content.trim();

    fixedCode = fixedCode.replace(/^```typescript\n?/, '');
    fixedCode = fixedCode.replace(/^```tsx\n?/, '');
    fixedCode = fixedCode.replace(/^```\n?/, '');
    fixedCode = fixedCode.replace(/\n?```$/, '');

    return {
      success: true,
      code: fixedCode,
      message: `Fixed ${errors.length} TypeScript error(s)`
    };

  } catch (error) {
    console.log(`   ⚠️ Failed to fix TypeScript errors for ${componentName}: ${error.message}`);
    return {
      success: false,
      code: componentCode,
      message: `AI fix failed: ${error.message}`
    };
  }
};

/**
 * Validate and fix TypeScript errors in a component
 */
export const aiValidateAndFixComponent = async (component) => {
  const { validateTypeScript } = await import('./typescript-validator.js');

  console.log(`   🔍 TypeScript validation: ${component.name}`);

  // First validation
  let validation = await validateTypeScript(component.code, component.name);

  if (validation.isValid) {
    console.log(`   ✅ ${component.name}: No TypeScript errors`);
    return {
      ...component,
      typeScriptValid: true,
      typeScriptErrors: [],
      fixAttempts: 0
    };
  }

  console.log(`   🔧 ${component.name}: Found ${validation.errors.length} TypeScript errors, attempting fix...`);

  // Attempt to fix errors (max 2 attempts)
  let fixedComponent = { ...component };
  let attempts = 0;
  const maxAttempts = 2;

  while (!validation.isValid && attempts < maxAttempts) {
    attempts++;
    console.log(`   🤖 Fix attempt ${attempts}/${maxAttempts} for ${component.name}`);

    const fixResult = await aiFixTypeScriptErrors(
      fixedComponent.code,
      component.name,
      validation.errors
    );

    if (fixResult.success) {
      fixedComponent.code = fixResult.code;

      // Re-validate the fixed code
      validation = await validateTypeScript(fixedComponent.code, component.name);

      if (validation.isValid) {
        console.log(`   ✅ ${component.name}: TypeScript errors fixed after ${attempts} attempt(s)`);
        break;
      } else {
        console.log(`   ⚠️ ${component.name}: ${validation.errors.length} errors remain after fix attempt ${attempts}`);
      }
    } else {
      console.log(`   ❌ ${component.name}: Fix attempt ${attempts} failed`);
      break;
    }
  }

  return {
    ...fixedComponent,
    typeScriptValid: validation.isValid,
    typeScriptErrors: validation.errors,
    fixAttempts: attempts,
    validationWarnings: validation.warnings
  };
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

/**
 * Default categories fallback
 */
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