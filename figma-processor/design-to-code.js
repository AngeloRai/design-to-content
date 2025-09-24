#!/usr/bin/env node

/**
 * DESIGN-TO-CODE PROCESSOR
 * Clean, direct approach - no complex engines, no refinement loops
 * Screenshot → Analysis → Generate → Save
 */

import "dotenv/config";
import { analyzeScreenshot } from './engines/visual-analysis-engine.js';
import { parseFigmaUrl, fetchFigmaScreenshot, fetchNodeData } from './utils/figma-utils.js';
import { processIconsFromAIRequest, getNodeStructureForAI } from './utils/icon-processor.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * MAIN PROCESSOR: Simple and direct
 */
export const processInput = async (input, context = {}) => {
  try {
    console.log('\n🚀 SIMPLE VISUAL-FIRST PROCESSING');
    console.log('=' .repeat(50));

    // Step 1: Get screenshot (from Figma or local file)
    const { screenshotPath, figmaData } = await getScreenshot(input);

    // Step 2: Visual analysis (using existing engine - it works great!)
    console.log('\n📸 VISUAL ANALYSIS');
    const visualAnalysis = await analyzeScreenshot(screenshotPath, { ...context, figmaData });

    // Step 3: Direct component generation (one shot, no loops)
    console.log('\n🔧 GENERATING ALL COMPONENTS');
    const components = await generateAllComponents(visualAnalysis, figmaData);

    // Step 4: Save components directly
    console.log('\n💾 SAVING COMPONENTS');
    const savedComponents = await saveAllComponents(components);

    console.log('\n✅ PROCESSING COMPLETE!');
    console.log(`Generated ${savedComponents.length} components:`);
    savedComponents.forEach(comp => {
      console.log(`  • ${comp.name} → ${comp.path}`);
    });

    return {
      id: `session_${Date.now()}`,
      screenshotPath,
      figmaData,
      visualAnalysis,
      components: savedComponents,
      status: 'completed',
      startTime: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Processing failed:', error.message);
    throw error;
  }
};

/**
 * Get screenshot from input (Figma URL or local path)
 */
const getScreenshot = async (input) => {
  const isFigmaUrl = input.includes('figma.com');

  if (isFigmaUrl) {
    console.log('🔗 Fetching from Figma...');

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

/**
 * Generate all components in one comprehensive prompt
 */
const generateAllComponents = async (visualAnalysis, figmaData) => {
  console.log('🤖 Using GPT-4 for direct component generation...');

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

REQUIREMENTS:
• **Visual Accuracy**: Generate components that match exactly what you see in the visual analysis
• **Clean Implementation**: Focus on core functionality and visual fidelity
• **Accessibility**: Proper focus states, ARIA attributes, keyboard navigation
• **Modern Tailwind**: Use appropriate utilities, focus-visible, transitions
• **TypeScript**: Complete interfaces with proper prop types
• **Flexible Classification**: Classify components based on their complexity (atom/molecule/organism)

COMPONENT QUALITY STANDARDS:

**Button Pattern:**
\`\`\`typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Button({ variant = 'default', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
        // Adapt colors based on visual analysis - don't use hardcoded values
        {
          "bg-primary text-primary-foreground hover:bg-primary/90": variant === 'default',
          "border border-input bg-background hover:bg-accent": variant === 'outline',
          "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === 'destructive',
          "hover:bg-accent hover:text-accent-foreground": variant === 'ghost',
          "text-primary underline-offset-4 hover:underline": variant === 'link',
        },
        {
          "h-8 px-3 text-sm": size === 'sm',
          "h-10 px-4": size === 'md',
          "h-12 px-6 text-lg": size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
\`\`\`

**Input Pattern:**
\`\`\`typescript
interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function TextInput({ className, ...props }: TextInputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
\`\`\`

IMPORTANT GUIDELINES:

1. **Visual First**: Generate components based exactly on what you see - colors, sizes, variants, functionality
2. **Smart Classification**: Use appropriate atomic design levels based on component complexity
3. **Universal Design**: Work with any design system, color scheme, or component patterns
4. **Clean Code**: No markdown code fences in output - pure TypeScript only
5. **Complete Implementation**: Every component should be fully functional for any design system
6. **Icon Identification**: When you see icons in the design:
   - Look at the visual analysis and node structure
   - Identify which nodes are actual icons (not buttons, inputs, or other UI elements)
   - Icons are typically small, simple graphical elements used for visual communication
   - Do NOT mistake input fields, buttons, or other interactive elements as icons

OUTPUT FORMAT (NO MARKDOWN CODE FENCES):

FIRST, if you identify any icons in the design, list them:
---ICONS-SECTION---
ICON_REQUESTS:
[
  {
    "nodeId": "[Figma node ID from structure]",
    "componentName": "[Icon name like SearchIcon, MenuIcon, etc]",
    "description": "[What this icon represents]"
  }
]
---ICONS-SECTION---

THEN generate all other components:
---COMPONENT-SEPARATOR---
COMPONENT_NAME: [PascalCase name]
COMPONENT_TYPE: [atom|molecule|organism - based on complexity]
COMPONENT_DESCRIPTION: [Brief description]
COMPONENT_CODE:
import { cn } from '@/lib/utils';

[Complete TypeScript component code - NO code fence markers]
---COMPONENT-SEPARATOR---

Generate ALL components you see in the visual analysis. Adapt to any design system, any complexity level, any visual patterns.
For components that use icons, import them from '@/ui/icons' (they will be generated separately).`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 8000,
    temperature: 0.1
  });

  const generatedContent = response.choices[0].message.content;
  console.log(`✅ Generated ${generatedContent.length} characters of component code`);

  // Parse icon requests and components separately
  const { iconRequests, components } = parseGeneratedContent(generatedContent);

  // Process icon requests if any were identified
  if (iconRequests && iconRequests.length > 0 && figmaData) {
    console.log(`\n🎨 AI identified ${iconRequests.length} icons to fetch`);
    await processIconsFromAIRequest(figmaData, iconRequests);
  }

  return components;
};

/**
 * Parse the generated content including icon requests and components
 */
const parseGeneratedContent = (content) => {
  const components = [];
  let iconRequests = [];

  // First, check for icon requests section
  const iconSectionMatch = content.match(/---ICONS-SECTION---([\s\S]*?)---ICONS-SECTION---/);
  if (iconSectionMatch) {
    const iconSection = iconSectionMatch[1];
    const iconRequestsMatch = iconSection.match(/ICON_REQUESTS:\s*(\[[\s\S]*?\])/);
    if (iconRequestsMatch) {
      try {
        iconRequests = JSON.parse(iconRequestsMatch[1]);
        console.log(`  📍 Found ${iconRequests.length} icon requests`);
      } catch (e) {
        console.log('  ⚠️  Failed to parse icon requests');
      }
    }
    // Remove icon section from content for component parsing
    content = content.replace(iconSectionMatch[0], '');
  }

  // Then parse components
  const sections = content.split('---COMPONENT-SEPARATOR---').filter(section => section.trim());

  sections.forEach(section => {
    const lines = section.trim().split('\n');
    let name = '';
    let type = 'atom';
    let description = '';
    let code = '';

    let inCodeBlock = false;

    lines.forEach(line => {
      if (line.startsWith('COMPONENT_NAME:')) {
        name = line.replace('COMPONENT_NAME:', '').trim();
      } else if (line.startsWith('COMPONENT_TYPE:')) {
        type = line.replace('COMPONENT_TYPE:', '').trim();
      } else if (line.startsWith('COMPONENT_DESCRIPTION:')) {
        description = line.replace('COMPONENT_DESCRIPTION:', '').trim();
      } else if (line.startsWith('COMPONENT_CODE:')) {
        inCodeBlock = true;
      } else if (inCodeBlock) {
        code += line + '\n';
      }
    });

    if (name && code.trim()) {
      // Clean up the code - remove markdown code fences and fix imports
      let cleanedCode = code.trim();

      // Remove markdown code fences
      cleanedCode = cleanedCode.replace(/^```typescript\n?/, '');
      cleanedCode = cleanedCode.replace(/^```\n?/, '');
      cleanedCode = cleanedCode.replace(/\n?```$/, '');
      cleanedCode = cleanedCode.replace(/```$/, '');

      // Fix import statement
      cleanedCode = cleanedCode.replace(
        "import { cn } from 'classnames';",
        "import { cn } from '@/lib/utils';"
      );

      // Let AI determine appropriate classification based on component complexity
      // No hardcoded rules - AI decides what's appropriate for this design system

      components.push({
        name,
        type,
        description,
        code: cleanedCode.trim()
      });
    }
  });

  console.log(`📦 Parsed ${components.length} components:`);
  components.forEach(comp => {
    console.log(`  • ${comp.name} (${comp.type})`);
  });

  return { iconRequests, components };
};

/**
 * Save all components to appropriate directories
 */
const saveAllComponents = async (components) => {
  const saved = [];
  const projectRoot = join(__dirname, '..');

  for (const component of components) {
    try {
      // Determine save path based on atomic design
      const subdir = {
        'atom': 'elements',
        'molecule': 'components',
        'organism': 'modules'
      }[component.type] || 'elements';

      const componentDir = join(projectRoot, 'nextjs-app', 'ui', subdir);
      const componentPath = join(componentDir, `${component.name}.tsx`);

      // Ensure directory exists
      if (!existsSync(componentDir)) {
        mkdirSync(componentDir, { recursive: true });
      }

      // Save component
      writeFileSync(componentPath, component.code);

      const relativePath = `nextjs-app/ui/${subdir}/${component.name}.tsx`;
      console.log(`  ✅ ${component.name} → ${relativePath}`);

      saved.push({
        name: component.name,
        type: component.type,
        path: relativePath,
        fullPath: componentPath
      });

    } catch (error) {
      console.error(`  ❌ Failed to save ${component.name}:`, error.message);
    }
  }

  return saved;
};

/**
 * Test with the design system screenshot
 */
export const testWithDesignSystem = async () => {
  const screenshotPath = join(__dirname, 'screenshots', '29-1058.png');

  const context = {
    projectType: 'design-system',
    purpose: 'Generate React components from comprehensive design system'
  };

  return await processInput(screenshotPath, context);
};

/**
 * CLI Interface
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'test':
      console.log('🧪 Testing with design system screenshot...');
      testWithDesignSystem()
        .then(result => {
          console.log('\n🎉 Test completed successfully!');
          console.log(`Generated ${result.components.length} components`);
        })
        .catch(error => {
          console.error('\n❌ Test failed:', error.message);
          process.exit(1);
        });
      break;

    case 'process':
      const input = process.argv[3];
      if (!input) {
        console.error('❌ Please provide Figma URL or screenshot path');
        process.exit(1);
      }

      processInput(input)
        .then(result => {
          console.log('\n🎉 Processing completed successfully!');
          console.log(`Generated ${result.components.length} components`);
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
  test     - Test with design system screenshot
  process  - Process Figma URL or screenshot

Examples:
  node design-to-code.js test
  node design-to-code.js process "https://figma.com/design/abc?node-id=1:2"
  node design-to-code.js process ./screenshot.png
      `);
  }
}

const designToCodeProcessor = {
  processInput,
  testWithDesignSystem
};

export default designToCodeProcessor;