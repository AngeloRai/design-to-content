/**
 * Story Generator
 * AI-powered programmatic generation of Storybook stories from component metadata
 * Uses GPT-4 to intelligently analyze components and generate appropriate stories
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { getChatModel } from '../config/openai-client.ts';
import type { ComponentRegistry, ComponentMetadata } from '../types/component.ts';
import type { ComponentSpec } from '../types/component.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

type StoryConfigResult = z.infer<typeof StoryConfigSchema>;

interface StoryConfig {
  name: string;
  args: Record<string, unknown>;
  description: string;
}

interface GenerateOptions {
  outputDir?: string;
  force?: boolean;
}

interface ComponentWithFigma extends ComponentMetadata {
  figmaSpec?: ComponentSpec;
}

interface StoryGenerationResult {
  success: boolean;
  name?: string;
  type?: string;
  path?: string;
  content?: string;
  totalStories?: number;
  error?: string;
}

interface WriteStoryResult {
  written: boolean;
  path: string;
  totalStories?: number;
  reason?: string;
}

interface GenerateAllResults {
  success: string[];
  failed: Array<{ name: string; error: string }>;
  skipped: string[];
  totalStories: number;
}

/**
 * Generate Storybook story file for a component using AI analysis
 */
export async function generateStoryForComponent(
  component: ComponentWithFigma,
  options: GenerateOptions = {}
): Promise<StoryGenerationResult> {
  // outputDir is passed from workflow state (set by index.js) and is relative to process.cwd()
  // It already includes the '/ui' suffix (e.g., 'atomic-design-pattern/ui')
  const {
    outputDir = process.env.OUTPUT_DIR || '../atomic-design-pattern/ui'
  } = options;

  const { name, type, figmaSpec } = component;

  // Read component file from new folder structure
  // outputDir already includes '/ui', so we just add type/name/Component.tsx
  // Resolve to absolute path from process.cwd() to match workflow context
  const componentPath = path.resolve(process.cwd(), outputDir, type, name, `${name}.tsx`);
  let componentCode = '';

  try {
    componentCode = await fs.readFile(componentPath, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to read component ${name}:`, errorMessage);
    console.error(`   Attempted path: ${componentPath}`);
    return { success: false, error: errorMessage };
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
  // Resolve to absolute path from process.cwd() to match workflow context
  const storyPath = path.resolve(process.cwd(), outputDir, type, name, `${name}.stories.tsx`);

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
async function analyzeComponentForStories(
  componentCode: string,
  figmaSpec: ComponentSpec | undefined,
  componentName: string
): Promise<{ stories: StoryConfig[] }> {
  const model = getChatModel('gpt-4o').withStructuredOutput(StoryConfigSchema);

  const prompt = `Analyze this React component and generate Storybook story configurations.

**Component Code:**
\`\`\`tsx
${componentCode}
\`\`\`

${figmaSpec ? `**Figma Design Spec:**
- Variants: ${figmaSpec.variants?.join(', ') || 'none'}
- States: default, hover, disabled
- Text Content: N/A
- Visual Properties:
  ${JSON.stringify(figmaSpec, null, 2)}
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
  "argsJson": "{\\"variant\\": \\"primary\\", \\"children\\": \\"Click me\\"}",
  "description": "Primary button variant"
}
\`\`\`

For a TextInput with \`placeholder\` and \`value\`:
\`\`\`json
{
  "name": "Empty",
  "argsJson": "{\\"placeholder\\": \\"Enter text...\\", \\"value\\": \\"\\"}",
  "description": "Empty input field"
}
\`\`\`

For a component with multiple prop types:
\`\`\`json
{
  "name": "CustomExample",
  "argsJson": "{\\"size\\": \\"large\\", \\"isActive\\": true, \\"children\\": \\"Example\\"}",
  "description": "Large active state"
}
\`\`\`

**Important:**
- Don't make assumptions about component behavior - base stories on the actual props
- If a prop is a function (onClick, onChange, onSubmit, etc.), use null in the JSON: "onClick": null
- Use actual text from Figma textContent when available
- Generate 3-8 stories covering the most important variations
- Include a "Disabled" story if the component supports disabled state
- Don't include "hover" or "focus" stories (Storybook handles these via interactions)
- Make sure argsJson is a valid JSON string with escaped quotes
- NEVER use string representations of functions like "() => {}" - always use null for function props

Generate the story configurations now.`;

  const result = await model.invoke([{ role: 'user', content: prompt }]) as StoryConfigResult;

  // Parse the argsJson strings into actual objects with safe fallback
  const parsedStories: StoryConfig[] = (result.stories || []).map(story => {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(story.argsJson || '{}') as Record<string, unknown>;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to parse argsJson for story ${story.name}:`, errorMessage);
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
function buildStoryFile({ name, type, stories }: {
  name: string;
  type: string;
  stories: StoryConfig[];
}): string {
  const importPath = `@/ui/${type}/${name}`;

  // Generate title based on atomic level
  const titleMap: Record<string, string> = {
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
      .replace(/: null/g, ': () => {}')  // Convert null functions to arrow functions
      .replace(/: "(\(\)\s*=>\s*\{\})"/g, ': () => {}')  // Convert string functions to real functions
      .replace(/: "\(\)\s*=>\s*\{\s*\}"/g, ': () => {}');  // Convert string functions with spaces

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
export async function writeStoryFile(
  storyResult: StoryGenerationResult,
  force: boolean = false
): Promise<WriteStoryResult> {
  if (!storyResult.success) {
    throw new Error(`Cannot write story: ${storyResult.error}`);
  }

  const { path: storyPath, content } = storyResult;

  if (!storyPath || !content) {
    throw new Error('Story path and content are required');
  }

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
export async function generateAllStories(
  registry: ComponentRegistry,
  options: GenerateOptions = {}
): Promise<GenerateAllResults> {
  const { force = false } = options;

  console.log('\n📚 Generating Storybook Stories');
  console.log('='.repeat(60));

  const results: GenerateAllResults = {
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
        const storyResult = await generateStoryForComponent(component as ComponentWithFigma, options);

        if (!storyResult.success) {
          results.failed.push({ name: component.name, error: storyResult.error || 'Unknown error' });
          console.log(`   ❌ Failed: ${component.name} - ${storyResult.error}`);
          continue;
        }

        // Write to file
        const writeResult = await writeStoryFile(storyResult, force);

        if (writeResult.written) {
          results.success.push(component.name);
          results.totalStories += storyResult.totalStories || 0;
        } else {
          results.skipped.push(component.name);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.failed.push({ name: component.name, error: errorMessage });
        console.log(`   ❌ Failed: ${component.name} - ${errorMessage}`);
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
