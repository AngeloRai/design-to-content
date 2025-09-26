#!/usr/bin/env node

/**
 * ATOM GENERATOR
 * Generates simple React components (atoms) from visual analysis
 * Extracted from design-to-code.js for better separation of concerns
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { analyzeAtomImpact } from '../utils/dependency-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lazy OpenAI client initialization
let openaiClient = null;
const getOpenAIClient = () => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
};

/**
 * Get node structure for AI analysis (for icon identification)
 */
const getNodeStructureForAI = async (figmaData) => {
  if (!figmaData?.nodeData?.node) return null;

  try {
    // Extract simplified node structure for AI to analyze
    const extractNodeInfo = (node) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      children: node.children?.map(extractNodeInfo) || []
    });

    return {
      nodeStructure: extractNodeInfo(figmaData.nodeData.node)
    };
  } catch (error) {
    console.warn('Could not extract node structure:', error.message);
    return null;
  }
};

/**
 * Generate atom components using AI with existing component awareness
 */
export const generateAtomComponents = async (visualAnalysis, figmaData, existingLibrary = null) => {
  console.log('🤖 Using GPT-4 for direct atom component generation...');
  console.log('📋 Analyzing visual content for reusable atom components...');

  // Build context about existing components
  let existingComponentsContext = '';
  if (existingLibrary && existingLibrary.atoms && Object.keys(existingLibrary.atoms).length > 0) {
    const existingAtoms = Object.keys(existingLibrary.atoms);
    existingComponentsContext = `\nEXISTING ATOMS IN LIBRARY:\n${existingAtoms.join(', ')}\n\nIMPORTANT:
- If you see components that match existing atoms, DO NOT regenerate them
- Only generate NEW components that don't exist yet
- If existing components need updates, note them but don't regenerate\n`;

    console.log(`   📋 Found ${existingAtoms.length} existing atoms: ${existingAtoms.join(', ')}`);
  }

  // Get node structure for AI to analyze for icons
  const nodeStructure = figmaData ? await getNodeStructureForAI(figmaData) : null;

  const measurementsText = figmaData?.nodeData?.measurements
    ? `\nEXACT MEASUREMENTS FROM FIGMA:\n${JSON.stringify(figmaData.nodeData.measurements, null, 2)}\n`
    : '';

  const nodeStructureText = nodeStructure
    ? `\nFIGMA NODE STRUCTURE (for icon identification):\n${JSON.stringify(nodeStructure.nodeStructure, null, 2)}\n`
    : '';

  const prompt = `You are a senior React component developer. Generate clean, accessible TypeScript React components based on visual analysis.

VISUAL ANALYSIS:
${visualAnalysis.analysis}

${measurementsText}
${nodeStructureText}
${existingComponentsContext}

REQUIREMENTS:
• **Visual Accuracy**: Generate components that match exactly what you see in the visual analysis
• **Clean Implementation**: Focus on core functionality and visual fidelity
• **Accessibility**: Proper focus states, ARIA attributes, keyboard navigation
• **Modern Tailwind**: Use appropriate utilities, focus-visible, transitions
• **TypeScript**: Complete interfaces with proper prop types
• **Atom Focus**: Generate simple, reusable components (atoms) - buttons, inputs, icons, labels

COMPONENT QUALITY STANDARDS:

**Generic Component Architecture:**
- Extend native HTML element props for proper TypeScript integration
- Use 'cn()' utility for conditional class merging
- Include 'className' prop for customization
- Implement proper accessibility attributes
- Support focus management and keyboard navigation

**Adaptive Styling Approach:**
- **Visual-First**: Extract colors, sizes, and spacing directly from the visual analysis
- **Variant Detection**: Identify distinct visual states (hover, active, disabled, focus)
- **Size Inference**: Derive size variants from visual measurements when multiple sizes exist
- **Color Mapping**: Use design system tokens or CSS variables when possible, fallback to direct colors
- **Responsive Design**: Consider mobile/desktop differences visible in the analysis

**Universal Component Structure:**
\`\`\`typescript
interface ComponentProps extends React.HTMLAttributes<HTMLElement> {
  // Derive variants from visual analysis - could be colors, styles, or behaviors
  variant?: string;  // Extract from visual: 'primary' | 'secondary' | 'outline' etc.
  size?: string;     // Extract from visual: 'sm' | 'md' | 'lg' etc.
  className?: string;
}

export function Component({ variant, size, className, ...props }: ComponentProps) {
  return (
    <element
      className={cn(
        "base-styles focus-visible:outline-none focus-visible:ring-2",
        // Dynamic variant styles based on visual analysis
        variant && variantStyles[variant],
        // Dynamic size styles based on visual analysis
        size && sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}
\`\`\`

**Key Principles:**
1. **No Hardcoded Assumptions**: Don't assume specific variant names, colors, or design tokens
2. **Visual Analysis Driven**: Let the visual analysis determine all styling decisions
3. **Flexible Interfaces**: Design component APIs that adapt to any design system
4. **Accessibility Foundation**: Always include focus states, ARIA attributes, and keyboard support
5. **Measurement Precision**: Use exact pixel values from Figma when available, relative units when scalable

IMPORTANT GUIDELINES:

1. **Visual First**: Generate components based exactly on what you see - colors, sizes, variants, functionality
2. **TRUE ATOMS ONLY**: Generate ONLY the most basic, single-purpose UI building blocks
   - GENERATE: Basic form inputs (input, textarea), simple buttons, labels, icons, badges, avatars
   - SKIP: Composite components (search bars, cards, forms, navigation, layouts)
   - SKIP: Any component that combines multiple elements or has complex layout
   - RULE: If it has more than one primary UI element, it's NOT an atom
3. **Component Decision Process**: For each component you identify:
   - Ask: "Is this a single, basic UI element with one primary purpose?"
   - EXAMPLES OF ATOMS: Button, Input, Label, Icon, Badge, Avatar, Checkbox, Toggle
   - EXAMPLES OF NON-ATOMS: SearchBar (input + button), Card (multiple elements), NavigationBar (multiple links), Form (multiple inputs)
   - Skip: Anything that combines multiple UI elements together
4. **Universal Design**: Work with any design system, color scheme, or component patterns
5. **Complete Processing**: Process ALL reusable components identified in the visual analysis
6. **Clean Code**: No markdown code fences in output - pure TypeScript only

OUTPUT FORMAT (NO MARKDOWN CODE FENCES):
---COMPONENT-SEPARATOR---
COMPONENT_NAME: [PascalCase name]
COMPONENT_TYPE: atom
COMPONENT_DESCRIPTION: [Brief description]
COMPONENT_CODE:
import { cn } from '@/lib/utils';

[Complete TypeScript component code - NO code fence markers]
---COMPONENT-SEPARATOR---

PROCESS ALL REUSABLE COMPONENTS from the visual analysis:
1. Review each component mentioned in the visual analysis
2. Determine which are reusable atoms vs contextual elements
3. Generate code for all reusable UI building blocks
4. Skip navigation, layout, and page-specific elements

For transparency, briefly consider:
- What components from the analysis should become reusable atoms?
- What components should be skipped as contextual elements?

Generate all appropriate atom components. Focus on reusable building blocks.
Note: Icons are processed separately, so focus on interactive components, form controls, and UI elements.`;

  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 8000,
    temperature: 0.1
  });

  const generatedContent = response.choices[0].message.content;
  console.log(`✅ Generated ${generatedContent.length} characters of atom component code`);

  // Log first part of AI response for transparency
  const preview = generatedContent.substring(0, 500) + (generatedContent.length > 500 ? '...' : '');
  console.log(`🔍 AI Response Preview:\n${preview}\n`);

  // Parse components
  const components = parseAtomComponents(generatedContent);

  return components;
};

/**
 * Parse the generated atom components from GPT-4 response
 */
export const parseAtomComponents = (content) => {
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
        // Skip - always force 'atom' type for this generator
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
        type: 'atom',
        description,
        code: cleanedCode.trim()
      });
    }
  });

  console.log(`📦 Parsed ${components.length} atom components from AI response:`);
  components.forEach(comp => {
    console.log(`  • ${comp.name} (${comp.type}): ${comp.description}`);
  });

  if (components.length === 0) {
    console.warn('⚠️  No components were parsed from AI response. This may indicate:');
    console.warn('   - AI decided no reusable atoms were needed');
    console.warn('   - Parsing error in component extraction');
    console.warn('   - All components were contextual (navigation, layout, etc.)');
  }

  return components;
};

/**
 * AI-powered evaluation of whether existing component should be updated
 */
const aiShouldUpdateExistingComponent = async (newComponent, existingLibraryDoc, existingPath) => {
  try {
    const existingContent = readFileSync(existingPath, 'utf8');
    const openai = getOpenAIClient();

    // Check dependency impact
    const dependencyImpact = analyzeAtomImpact(newComponent.name);
    const dependencyContext = dependencyImpact.totalDependents > 0
      ? `\nDEPENDENCY IMPACT:
- This atom is used by ${dependencyImpact.totalDependents} molecules: ${dependencyImpact.affectedMolecules.join(', ')}
- Risk Level: ${dependencyImpact.riskLevel}
- Updating this atom could break existing molecules - be very careful!
${dependencyImpact.recommendations.join('\n')}\n`
      : '\nDEPENDENCY IMPACT:\n- This atom has no dependent molecules - safe to update\n';

    const prompt = `You are a senior React developer evaluating whether to update an existing component.

EXISTING COMPONENT: ${newComponent.name}
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

EVALUATION CRITERIA:
1. **Functionality**: Does the new version add significant functionality?
2. **Code Quality**: Is the new version better implemented?
3. **TypeScript**: Better type safety or interfaces?
4. **Accessibility**: Improved ARIA attributes or keyboard navigation?
5. **Visual**: Better styling or variant support?
6. **Breaking Changes**: Would updating break existing usage?

DECISION FACTORS:
- **UPDATE** if: Significant improvements, no breaking changes, worth the risk
- **SKIP** if: Minimal differences, potential breaking changes, existing version is good

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
      // Use the same parsing helper as the router
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

/**
 * Save atom components to elements directory with intelligent duplicate handling
 */
export const saveAtomComponents = async (components, existingLibrary = null) => {
  const saved = [];
  const skipped = [];
  const updated = [];
  const projectRoot = join(__dirname, '..', '..');

  console.log(`💾 Processing ${components.length} atom components for saving...`);

  for (const component of components) {
    try {
      // Save atoms to elements directory
      const componentDir = join(projectRoot, 'nextjs-app', 'ui', 'elements');
      const componentPath = join(componentDir, `${component.name}.tsx`);
      const relativePath = `nextjs-app/ui/elements/${component.name}.tsx`;

      // Check if component already exists
      const componentExists = existsSync(componentPath);
      const existsInLibrary = existingLibrary?.atoms?.[component.name];

      if (componentExists && existsInLibrary) {
        // Component exists - use AI to decide what to do
        const shouldUpdate = await aiShouldUpdateExistingComponent(
          component,
          existsInLibrary,
          componentPath
        );

        if (shouldUpdate) {
          // Check dependency impact before updating
          const impact = analyzeAtomImpact(component.name);
          if (impact.totalDependents > 0) {
            console.log(`    ⚠️  Warning: Updating ${component.name} affects ${impact.totalDependents} molecules`);
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

/**
 * Full atom generation pipeline with library awareness
 */
export const generateAndSaveAtoms = async (visualAnalysis, figmaData, existingLibrary = null) => {
  console.log('\n🔧 GENERATING ATOM COMPONENTS');

  // Generate atoms with knowledge of existing components
  const atomComponents = await generateAtomComponents(visualAnalysis, figmaData, existingLibrary);

  // Save atoms intelligently
  console.log('\n💾 SAVING ATOM COMPONENTS');
  const saveResult = await saveAtomComponents(atomComponents, existingLibrary);

  // Return both saved components and save statistics
  return {
    components: saveResult.saved,
    stats: saveResult.stats,
    skipped: saveResult.skipped
  };
};

const atomGenerator = {
  generateAtomComponents,
  parseAtomComponents,
  saveAtomComponents,
  generateAndSaveAtoms
};

export default atomGenerator;