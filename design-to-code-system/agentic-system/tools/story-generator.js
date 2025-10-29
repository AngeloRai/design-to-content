/**
 * Story Generator
 * AI-powered programmatic generation of Storybook stories from component metadata
 * Uses GPT-4 to intelligently analyze components and generate appropriate stories
 */

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { getChatModel } from '../config/openai-client.js';

/**
 * Schema for AI-generated story configuration
 */
const StoryConfigSchema = z.object({
  stories: z.array(z.object({
    name: z.string().describe('Story name (e.g., Primary, PrimaryDisabled)'),
    argsJson: z.string().describe('JSON string of props to pass to component (e.g., \'{"variant": "primary", "children": "Click me"}\')'),
    description: z.string().describe('What this story demonstrates')
  })).describe('Array of story configurations')
});

/**
 * Generate Storybook story file for a component using AI analysis
 * @param {Object} component - Component metadata from registry
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Story file content and metadata
 */
export async function generateStoryForComponent(component, options = {}) {
  // outputDir is passed from workflow, which is relative to design-to-code-system/
  // It should already include the '/ui' suffix (e.g., '../atomic-design-pattern/ui')
  const {
    outputDir = process.env.OUTPUT_DIR || '../atomic-design-pattern/ui'
  } = options;

  const { name, type, figmaSpec } = component;

  // Read component file from new folder structure
  // outputDir already includes '/ui', so we just add type/name/Component.tsx
  const componentPath = path.join(outputDir, type, name, `${name}.tsx`);
  let componentCode = '';

  try {
    componentCode = await fs.readFile(componentPath, 'utf-8');
  } catch (error) {
    console.error(`Failed to read component ${name}:`, error.message);
    return { success: false, error: error.message };
  }

  // Use AI to analyze component and generate story config
  const storyConfig = await analyzeComponentForStories(componentCode, figmaSpec, name);

  // Generate story file content
  const storyContent = buildStoryFile({
    name,
    type,
    stories: storyConfig.stories
  });

  // Save story file in the same folder as the component
  const storyPath = path.join(
    outputDir,
    type,
    name,
    `${name}.stories.tsx`
  );

  return {
    success: true,
    name,
    type,
    path: storyPath,
    content: storyContent,
    totalStories: storyConfig.stories.length
  };
}

/**
 * Use AI to analyze component code and generate appropriate story configurations
 */
async function analyzeComponentForStories(componentCode, figmaSpec, componentName) {
  const model = getChatModel('gpt-4o').withStructuredOutput(StoryConfigSchema);

  const prompt = `Analyze this React component and generate Storybook story configurations.

**Component Code:**
\`\`\`tsx
${componentCode}
\`\`\`

${figmaSpec ? `**Figma Design Spec:**
- Variants: ${figmaSpec.variants?.join(', ') || 'none'}
- States: ${figmaSpec.states?.join(', ') || 'default, hover, disabled'}
- Text Content: ${figmaSpec.textContent?.join(', ') || 'N/A'}
- Visual Properties:
  ${JSON.stringify(figmaSpec.visualProperties, null, 2)}
` : ''}

**Task:**
Generate story configurations that demonstrate all important variations of this component.

**Instructions:**
1. **Analyze the TypeScript interface** to understand what props the component accepts
2. **Look at the implementation** to see how props affect rendering
3. **Use Figma specs** (if provided) to understand intended variants and states
4. **Generate realistic stories** that show:
   - All variants (if the component has a \`variant\` prop)
   - Important states (default, disabled, hover if applicable)
   - Different combinations of props
   - Edge cases (long text, empty states, etc.)

5. **For each story, provide:**
   - \`name\`: CamelCase name (e.g., "Primary", "SecondaryDisabled", "LongText")
   - \`argsJson\`: JSON string with prop values (use realistic data from Figma spec when available)
   - \`description\`: What this story demonstrates

**Examples of good story argsJson:**

For a Button with \`variant\` and \`children\`:
\`\`\`json
{
  "name": "Primary",
  "argsJson": "{\"variant\": \"primary\", \"children\": \"Click me\"}",
  "description": "Primary button variant"
}
\`\`\`

For a TextInput with \`placeholder\` and \`value\`:
\`\`\`json
{
  "name": "Empty",
  "argsJson": "{\"placeholder\": \"Enter text...\", \"value\": \"\"}",
  "description": "Empty input field"
}
\`\`\`

For a component with multiple prop types:
\`\`\`json
{
  "name": "CustomExample",
  "argsJson": "{\"size\": \"large\", \"isActive\": true, \"children\": \"Example\"}",
  "description": "Large active state"
}
\`\`\`

**Important:**
- Don't make assumptions about component behavior - base stories on the actual props
- If a prop is a function (onClick, onChange), omit it from the argsJson (Storybook will handle it)
- Use actual text from Figma textContent when available
- Generate 3-8 stories covering the most important variations
- Include a "Disabled" story if the component supports disabled state
- Don't include "hover" or "focus" stories (Storybook handles these via interactions)
- Make sure argsJson is a valid JSON string with escaped quotes

Generate the story configurations now.`;

  const result = await model.invoke([{ role: 'user', content: prompt }]);

  // Parse the argsJson strings into actual objects with safe fallback
  const parsedStories = (result.stories || []).map(story => {
    let args = {};
    try {
      args = JSON.parse(story.argsJson || '{}');
    } catch (error) {
      console.warn(`Failed to parse argsJson for story ${story.name}:`, error.message);
      args = {};
    }
    return {
      name: story.name,
      args,
      description: story.description
    };
  });

  return { stories: parsedStories };
}

/**
 * Build the complete Storybook story file from AI-generated configurations
 */
function buildStoryFile({ name, type, stories }) {
  const importPath = `@/ui/${type}/${name}`;

  // Generate title based on atomic level
  const titleMap = {
    elements: 'Elements',
    components: 'Components',
    modules: 'Modules',
    icons: 'Icons'
  };
  const title = `${titleMap[type] || 'Components'}/${name}`;

  // Generate story exports
  const storyExports = stories.map(story => {
    const argsString = JSON.stringify(story.args, null, 2)
      .replace(/"([^"]+)":/g, '$1:')  // Remove quotes from keys
      .replace(/: null/g, ': () => {}');  // Convert null functions to arrow functions

    return `/**
 * ${story.description || story.name}
 */
export const ${story.name}: Story = {
  args: ${argsString},
};`;
  }).join('\n\n');

  // Build complete file
  return `import type { Meta, StoryObj } from '@storybook/react';
import ${name} from '${importPath}';

const meta: Meta<typeof ${name}> = {
  title: '${title}',
  component: ${name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ${name}>;

${storyExports}
`;
}

/**
 * Write story file to filesystem
 */
export async function writeStoryFile(storyResult, force = false) {
  if (!storyResult.success) {
    throw new Error(`Cannot write story: ${storyResult.error}`);
  }

  const { path: storyPath, content } = storyResult;

  // Ensure directory exists
  const dir = path.dirname(storyPath);
  await fs.mkdir(dir, { recursive: true });

  // Check if file exists
  let exists = false;
  try {
    await fs.access(storyPath);
    exists = true;
  } catch {
    // File doesn't exist
  }

  if (exists && !force) {
    console.log(`   ⚠️  Story already exists: ${path.basename(storyPath)} (skipping)`);
    return { written: false, path: storyPath, reason: 'already_exists' };
  }

  // Write file
  await fs.writeFile(storyPath, content, 'utf-8');

  console.log(`   ✅ Generated story: ${path.basename(storyPath)} (${storyResult.totalStories} stories)`);

  return {
    written: true,
    path: storyPath,
    totalStories: storyResult.totalStories
  };
}

/**
 * Generate stories for all components in registry
 */
export async function generateAllStories(registry, options = {}) {
  const { force = false } = options;

  console.log('\n📚 Generating Storybook Stories');
  console.log('='.repeat(60));

  const results = {
    success: [],
    failed: [],
    skipped: [],
    totalStories: 0
  };

  // Iterate through all component types
  for (const [type, components] of Object.entries(registry.components || {})) {
    if (!components || components.length === 0) continue;

    console.log(`\n   📁 ${type}/ (${components.length} components)`);

    for (const component of components) {
      try {
        // Generate story content with AI
        const storyResult = await generateStoryForComponent(component, options);

        if (!storyResult.success) {
          results.failed.push({ name: component.name, error: storyResult.error });
          console.log(`   ❌ Failed: ${component.name} - ${storyResult.error}`);
          continue;
        }

        // Write to file
        const writeResult = await writeStoryFile(storyResult, force);

        if (writeResult.written) {
          results.success.push(component.name);
          results.totalStories += storyResult.totalStories;
        } else {
          results.skipped.push(component.name);
        }

      } catch (error) {
        results.failed.push({ name: component.name, error: error.message });
        console.log(`   ❌ Failed: ${component.name} - ${error.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Generated: ${results.success.length} components (${results.totalStories} stories)`);
  if (results.skipped.length > 0) {
    console.log(`⏭️  Skipped: ${results.skipped.length} (already exist)`);
  }
  if (results.failed.length > 0) {
    console.log(`❌ Failed: ${results.failed.length}`);
    results.failed.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
  }
  console.log('='.repeat(60) + '\n');

  return results;
}
