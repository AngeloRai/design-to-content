#!/usr/bin/env node

/**
 * MOLECULE GENERATOR
 * Generates molecule components by composing existing atoms with AI
 */

import { generateAIContext, formatAIContextForAI, updateComponentDoc, getLibraryDocs } from '../utils/library-doc.js';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_PATH = join(__dirname, '..', '..', 'nextjs-app', 'ui', 'components');

let openaiClient = null;
const getOpenAI = () => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
};

/**
 * Parse the generated molecule components from GPT-4 response
 * Uses the same robust parsing logic as atom generator
 */
const parseMoleculeComponents = (content) => {
  const components = [];

  const sections = content.split('---COMPONENT-SEPARATOR---').filter(section => section.trim());

  sections.forEach(section => {
    const lines = section.trim().split('\n');
    let name = '';
    let description = '';
    let code = '';

    let inCodeBlock = false;

    lines.forEach(line => {
      if (line.startsWith('COMPONENT_NAME:')) {
        name = line.replace('COMPONENT_NAME:', '').trim();
      } else if (line.startsWith('COMPONENT_TYPE:')) {
        // Skip - always force 'molecule' type for this generator
      } else if (line.startsWith('COMPONENT_DESCRIPTION:')) {
        description = line.replace('COMPONENT_DESCRIPTION:', '').trim();
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

      components.push({
        name,
        type: 'molecule',
        description,
        code: cleanedCode.trim()
      });
    }
  });

  console.log(`📦 Parsed ${components.length} molecule components from AI response:`);
  components.forEach(comp => {
    console.log(`  • ${comp.name} (${comp.type}): ${comp.description}`);
  });

  if (components.length === 0) {
    console.warn('⚠️  No components were parsed from AI response. This may indicate:');
    console.warn('   - AI decided no reusable molecules were needed');
    console.warn('   - Parsing error in component extraction');
    console.warn('   - All components were too complex (organisms vs molecules)');
  }

  return components;
};

/**
 * Foundation function for analyzing molecule impact on future organisms
 * Currently returns placeholder data until organisms are implemented
 */
const analyzeMoleculeImpact = (moleculeName) => {
  // Foundation for future organism dependency analysis
  return {
    totalDependents: 0,
    affectedOrganisms: [],
    riskLevel: 'low',
    recommendations: []
  };
};

/**
 * AI-powered evaluation of whether existing molecule should be updated
 * Adapted from atom generator for molecule-specific evaluation criteria
 */
const aiShouldUpdateExistingMolecule = async (newComponent, existingLibraryDoc, existingPath) => {
  try {
    const existingContent = readFileSync(existingPath, 'utf8');
    const openai = getOpenAI();

    // Check dependency impact (foundation for future organisms)
    const dependencyImpact = analyzeMoleculeImpact(newComponent.name);
    const dependencyContext = dependencyImpact.totalDependents > 0
      ? `\nDEPENDENCY IMPACT:
- This molecule is used by ${dependencyImpact.totalDependents} organisms: ${dependencyImpact.affectedOrganisms.join(', ')}
- Risk Level: ${dependencyImpact.riskLevel}
- Updating this molecule could break existing organisms - be very careful!
${dependencyImpact.recommendations.join('\n')}\n`
      : '\nDEPENDENCY IMPACT:\n- This molecule has no dependent organisms - safe to update\n';

    const prompt = `You are a senior React developer evaluating whether to update an existing molecule component.

EXISTING MOLECULE: ${newComponent.name}
Current implementation:
\`\`\`typescript
${existingContent}
\`\`\`

PROPOSED NEW VERSION:
\`\`\`typescript
${newComponent.code}
\`\`\`

LIBRARY DOCUMENTATION (existing):
${JSON.stringify(existingLibraryDoc, null, 2)}

${dependencyContext}

MOLECULE-SPECIFIC EVALUATION CRITERIA:
1. **Atom Composition**: Better atom selection or composition patterns?
2. **Interface Evolution**: Improved props interface without breaking changes?
3. **Layout Patterns**: Better layout, spacing, or interaction patterns?
4. **Accessibility**: Enhanced accessibility through atom composition?
5. **Code Quality**: Cleaner composition logic or prop management?
6. **Breaking Changes**: Would updating break existing organism usage?

DECISION FACTORS:
- **UPDATE** if: Significant composition improvements, better interfaces, no breaking changes
- **SKIP** if: Minimal differences, potential breaking changes, existing version is adequate

Respond with JSON only:
{
  "shouldUpdate": boolean,
  "confidence": 1-10,
  "reasoning": "Brief explanation of decision",
  "improvements": ["improvement1", "improvement2"],
  "risks": ["risk1", "risk2"],
  "recommendation": "UPDATE" | "SKIP"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.1
    });

    try {
      const evaluation = JSON.parse(response.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

      console.log(`    🤖 AI Evaluation for ${newComponent.name}:`);
      console.log(`       Decision: ${evaluation.recommendation} (Confidence: ${evaluation.confidence}/10)`);
      console.log(`       Reasoning: ${evaluation.reasoning}`);

      if (evaluation.improvements.length > 0) {
        console.log(`       Improvements: ${evaluation.improvements.join(', ')}`);
      }
      if (evaluation.risks.length > 0) {
        console.log(`       Risks: ${evaluation.risks.join(', ')}`);
      }

      return evaluation.shouldUpdate;

    } catch (parseError) {
      console.warn(`    ⚠️  Could not parse AI evaluation for ${newComponent.name}, defaulting to SKIP:`, parseError.message);
      return false;
    }

  } catch (error) {
    console.warn(`    ⚠️  AI evaluation failed for ${newComponent.name}:`, error.message);

    // Fallback to simple heuristics
    const existingContent = readFileSync(existingPath, 'utf8');
    const sizeDifference = Math.abs(existingContent.length - newComponent.code.length) / existingContent.length;
    return sizeDifference > 0.3;
  }
};

export const generateMolecule = async (componentName, visualAnalysis) => {
  console.log(`🧩 Generating ${componentName} molecule...`);

  try {
    const atomContext = generateAIContext(true, false); // Only atoms for molecules
    const atomContextForAI = formatAIContextForAI(atomContext);
    console.log(`📋 Built context for ${Object.keys(atomContext).length} atoms from library docs`);

    const prompt = `You are a senior React developer creating molecule components by composing existing atoms.

${atomContextForAI}

VISUAL ANALYSIS:
${visualAnalysis}

COMPONENT TO CREATE: ${componentName}

REQUIREMENTS:
• **Visual Accuracy**: Create component that matches exactly what you see in the visual analysis
• **Atom Composition**: Use ONLY the available atoms listed above - no custom elements
• **Clean Implementation**: Focus on composition and prop management
• **Accessibility**: Maintain atom accessibility features through proper prop passing
• **TypeScript**: Complete interfaces with proper prop types
• **Molecule Focus**: Create composite components that combine 2-4 atoms meaningfully

COMPONENT QUALITY STANDARDS:

**Molecule Architecture:**
- Compose existing atoms using their documented interfaces
- Extend component props naturally for customization
- Use atoms' built-in accessibility and styling
- Focus on layout, data flow, and interaction patterns
- Keep components focused and single-purpose

**Implementation Pattern:**
\`\`\`typescript
interface ${componentName}Props {
  // Props specific to this molecule's functionality
  // Derived from visual analysis and atom capabilities
}

export function ${componentName}({ ...props }: ${componentName}Props) {
  return (
    <div>
      {/* Compose atoms using their documented props */}
      <AtomComponent prop1={...} prop2={...} />
      <AnotherAtom prop={...} />
    </div>
  );
}
\`\`\`

IMPORTANT GUIDELINES:

1. **Atom Reuse**: Only use atoms from the provided list with their exact import paths
2. **Composition Focus**: Create meaningful combinations of atoms, not single-atom wrappers
3. **Visual Fidelity**: Match the layout, spacing, and interaction patterns seen in analysis
4. **Clean Interfaces**: Design props that make sense for the component's purpose
5. **No Custom Styling**: Rely on atom styling capabilities and composition

TASK:
1. Analyze how ${componentName} should work based on visual content
2. Identify which atoms to combine and how they should interact
3. Design props interface that supports the component's purpose
4. Implement clean composition using only available atoms

OUTPUT FORMAT (NO MARKDOWN CODE FENCES):
---COMPONENT-SEPARATOR---
COMPONENT_NAME: ${componentName}
COMPONENT_TYPE: molecule
COMPONENT_DESCRIPTION: [Brief description of component purpose and atom composition]
COMPONENT_CODE:
import React from 'react';
[Import statements for atoms used]

[Complete TypeScript component code - NO code fence markers]
---COMPONENT-SEPARATOR---

Generate the ${componentName} molecule component using atom composition.`;

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 2000
    });

    const generatedContent = response.choices[0].message.content;
    console.log(`✅ Generated ${generatedContent.length} characters of molecule component code`);

    // Log first part of AI response for transparency
    const preview = generatedContent.substring(0, 500) + (generatedContent.length > 500 ? '...' : '');
    console.log(`🔍 AI Response Preview:\n${preview}\n`);

    // Parse components using structured format
    const components = parseMoleculeComponents(generatedContent);

    if (components.length === 0) {
      console.error(`❌ No valid components parsed for ${componentName}`);
      return null;
    }

    // Use intelligent duplicate handling instead of naive writeFileSync
    const existingLibrary = getLibraryDocs();
    const saveResult = await saveMoleculeComponents(components, existingLibrary);

    // Return the first saved component result or null if nothing was saved
    const savedComponent = saveResult.saved.find(comp => comp.name === componentName);
    const skippedComponent = saveResult.skipped.find(comp => comp.name === componentName);

    if (savedComponent) {
      // Update library docs with the new/updated molecule
      try {
        await updateComponentDoc(componentName, savedComponent.fullPath, 'molecule');
        console.log(`📚 Updated library docs for ${componentName}`);
      } catch (error) {
        console.warn(`⚠️  Failed to update library docs for ${componentName}:`, error.message);
      }
      return savedComponent;
    } else if (skippedComponent) {
      return skippedComponent;
    } else {
      console.error(`❌ No result found for ${componentName} in save operation`);
      return null;
    }

  } catch (error) {
    console.error(`❌ Failed to generate ${componentName}:`, error.message);
    return null;
  }
};

export const extractComponentNamesWithAI = async (visualAnalysis) => {
  const analysis = typeof visualAnalysis === 'string' ? visualAnalysis : visualAnalysis.analysis;

  const prompt = `You are a senior React architect analyzing a design system to extract optimal molecule components. Use systematic analysis to make informed decisions about component structure.

VISUAL ANALYSIS:
${analysis}

SYSTEMATIC ANALYSIS PROCESS:

## PHASE 1: COMPONENT GROUP IDENTIFICATION
First, identify families of similar components from the visual analysis.
Look for components that share visual patterns, purposes, or contexts.

## PHASE 2: VARIANT ANALYSIS FRAMEWORK
For each component family, analyze the variants using these criteria:

**Layout Structure Analysis:**
- Do variants have fundamentally different layouts? (e.g., horizontal vs vertical, different content blocks)
- Are the structural differences significant or just styling variations?

**Functional Complexity Analysis:**
- Do variants serve completely different use cases?
- Would variants require very different props/interfaces?
- Do variants have minimal functional overlap?

**Implementation Complexity Analysis:**
- Would a unified component require complex conditional rendering?
- Would the prop interface become confusing with too many optional fields?
- Would maintaining one component be more complex than separate components?

## PHASE 3: DECISION MAKING CRITERIA

**CREATE SEPARATE COMPONENTS when:**
- Variants have different core layouts (not just styling differences)
- Variants serve distinct, unrelated use cases
- Variants would make a unified component complex and hard to maintain
- Variants have fundamentally different data requirements

**CREATE UNIFIED COMPONENT WITH VARIANTS when:**
- Variants share the same basic layout structure
- Variants are related use cases with overlapping functionality
- Differences can be handled cleanly through props/variants
- A unified approach improves reusability without complexity

## PHASE 4: COMPONENT NAMING & QUALITY

**Naming Strategy:**
- Use descriptive names that indicate purpose and scope
- Specific components: describe the unique use case (e.g., UserProfileCard, ProductCard)
- Unified components: use general category name (e.g., Card, FormField)

**Quality Checklist:**
- Components should have clear, single responsibilities
- Prop interfaces should be intuitive and not overly complex
- Components should be reusable without being overly generic
- Names should be self-documenting

## EXAMPLES OF GOOD DECISIONS:

**Separate Components Example:**
If analysis shows: "Card variants: User profile with avatar/bio, Product card with image/price, Article card with thumbnail/excerpt"
→ Decision: Create UserCard, ProductCard, ArticleCard (different layouts and data)

**Unified Component Example:**
If analysis shows: "Button variants: Primary, secondary, outlined styles with same layout"
→ Decision: Create Button with variant prop (same layout, styling differences)

## OUTPUT FORMAT:

Provide your analysis and decision in this structure:

{
  "analysis": {
    "componentGroups": [
      {
        "groupName": "Cards",
        "variants": ["Profile card with avatar", "Content card with description"],
        "decision": "separate|unified",
        "reasoning": "Brief explanation of why"
      }
    ]
  },
  "components": ["ComponentName1", "ComponentName2"],
  "reasoning": "Overall rationale for the component extraction decisions"
}

## IMPORTANT GUIDELINES:
- Focus on true molecules (2-4 atoms composed together)
- Skip simple atoms (single UI elements)
- Skip complex organisms (full page sections)
- Maximum 6 components to maintain focus
- Prioritize components that provide real reusability value
- Consider developer experience and maintenance burden

Analyze the visual description systematically and provide your component extraction decision.`;

  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 5000
    });

    const content = response.choices[0].message.content.trim();

    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysisResult = JSON.parse(jsonMatch[0]);

      // Log the AI's analysis for transparency
      console.log('🤖 AI Component Analysis:');
      if (analysisResult.analysis?.componentGroups) {
        analysisResult.analysis.componentGroups.forEach(group => {
          console.log(`   📦 ${group.groupName}: ${group.decision} (${group.reasoning})`);
          group.variants.forEach(variant => console.log(`      - ${variant}`));
        });
      }
      console.log(`   💭 Overall reasoning: ${analysisResult.reasoning}`);

      return analysisResult.components || [];
    }

    // Fallback: try to extract array format for backward compatibility
    const arrayMatch = content.match(/\[.*\]/s);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('❌ AI component extraction failed:', error.message);
    console.error('   Response content:', response.choices[0].message.content.substring(0, 200) + '...');
    return ['ComponentFromDesign'];
  }
};

/**
 * Save molecule components to components directory with intelligent duplicate handling
 * Adapted from atom generator for molecule-specific paths and evaluation
 */
export const saveMoleculeComponents = async (components, existingLibrary = null) => {
  const saved = [];
  const skipped = [];
  const updated = [];
  const projectRoot = join(__dirname, '..', '..');

  console.log(`💾 Processing ${components.length} molecule components for saving...`);

  for (const component of components) {
    try {
      // Save molecules to components directory
      const componentDir = join(projectRoot, 'nextjs-app', 'ui', 'components');
      const componentPath = join(componentDir, `${component.name}.tsx`);
      const relativePath = `nextjs-app/ui/components/${component.name}.tsx`;

      // Check if component already exists
      const componentExists = existsSync(componentPath);
      const existsInLibrary = existingLibrary?.molecules?.[component.name];

      if (componentExists && existsInLibrary) {
        // Component exists - use AI to decide what to do
        const shouldUpdate = await aiShouldUpdateExistingMolecule(
          component,
          existsInLibrary,
          componentPath
        );

        if (shouldUpdate) {
          // Check dependency impact before updating (foundation for organisms)
          const impact = analyzeMoleculeImpact(component.name);
          if (impact.totalDependents > 0) {
            console.log(`    ⚠️  Warning: Updating ${component.name} affects ${impact.totalDependents} organisms`);
          }

          // Update without backup
          writeFileSync(componentPath, component.code);
          console.log(`  🔄 ${component.name} → ${relativePath} (updated)`);

          updated.push({
            name: component.name,
            type: component.type,
            path: relativePath,
            fullPath: componentPath,
            action: 'updated'
          });
        } else {
          console.log(`  ⏭️  ${component.name} → ${relativePath} (skipped, already exists)`);
          skipped.push({
            name: component.name,
            type: component.type,
            path: relativePath,
            action: 'skipped'
          });
        }
      } else {
        // New component - save it
        if (!existsSync(componentDir)) {
          mkdirSync(componentDir, { recursive: true });
        }

        writeFileSync(componentPath, component.code);
        console.log(`  ✅ ${component.name} → ${relativePath} (new)`);

        saved.push({
          name: component.name,
          type: component.type,
          path: relativePath,
          fullPath: componentPath,
          action: 'created'
        });
      }

    } catch (error) {
      console.error(`  ❌ Failed to save ${component.name}:`, error.message);
    }
  }

  console.log(`📊 Save Results: ${saved.length} new, ${updated.length} updated, ${skipped.length} skipped`);

  return {
    saved: [...saved, ...updated],
    skipped,
    stats: {
      new: saved.length,
      updated: updated.length,
      skipped: skipped.length,
      total: components.length
    }
  };
};

export const generateMoleculesFromAnalysis = async (visualAnalysis) => {
  console.log('\n🧩 MOLECULE GENERATION');
  console.log('==============================');

  console.log('🤖 Using AI to identify molecule components...');
  const componentNames = await extractComponentNamesWithAI(visualAnalysis);

  if (componentNames.length === 0) {
    console.log('❌ No molecule components identified in visual analysis');
    return [];
  }

  console.log(`🎯 AI identified ${componentNames.length} potential molecules:`, componentNames);

  const results = [];

  for (const componentName of componentNames) {
    const result = await generateMolecule(componentName, visualAnalysis);
    if (result) {
      results.push(result);
    }
  }

  console.log(`✅ Generated ${results.length} molecules successfully`);
  return results;
};