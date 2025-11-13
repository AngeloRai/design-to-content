/**
 * Reference Component Scanner
 * Scans and analyzes reference components for pattern matching
 * These are HIGH-QUALITY human-written components we want AI to follow
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from "zod";
import { getChatModel } from '../config/openai-client.ts';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Runnable } from '@langchain/core/runnables';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Zod schema for AI-extracted metadata
const ComponentMetadataSchema = z.object({
  description: z.string().describe("Brief description of what this component does"),
  props: z.array(z.string()).describe("List of prop names accepted by this component"),
  hasVariants: z.boolean().describe("Whether component has multiple visual variants"),
  isInteractive: z.boolean().describe("Whether component handles user interactions (clicks, hover, etc)"),
  dependencies: z.array(z.string()).describe("Names of other components this component imports"),
  purpose: z.string().describe("Primary purpose: button, input, container, card, icon, navigation, form, layout, etc"),
  variants: z.array(z.string()).describe("List of actual variant names from code (e.g., ['primary', 'secondary', 'outline', 'ghost']). Extract from variant objects or TypeScript types. Empty array if no variants."),
  sizes: z.array(z.string()).describe("List of size options from code (e.g., ['small', 'medium', 'large', 'xs', 'xl']). Extract from size objects or className patterns. Empty array if no sizes."),
  states: z.array(z.string()).describe("List of interactive states supported (e.g., ['hover', 'active', 'focus', 'disabled', 'loading']). Look for hover:, active:, disabled:, etc. in classNames. Empty array if none."),
  features: z.array(z.string()).describe("Key features as keywords (e.g., ['icon-support', 'accessible', 'animated', 'responsive', 'external-link', 'conditional-rendering']). Empty array if basic component."),
  patterns: z.array(z.string()).describe("Implementation patterns used (e.g., ['polymorphic', 'composition', 'forwardRef', 'compound-component', 'render-props']). Empty array if simple component.")
});

type ComponentMetadata = z.infer<typeof ComponentMetadataSchema>;

interface BaseComponent {
  name: string;
  type: string;
  path: string;
  relativePath: string;
}

export interface ReferenceComponent extends BaseComponent, ComponentMetadata {}

/**
 * Extract metadata from component using AI
 */
const extractComponentMetadataWithModel = async (
  filePath: string,
  model: Runnable
): Promise<ComponentMetadata> => {
  try {
    const code = await fs.readFile(filePath, 'utf-8');

    const prompt = `Analyze this React component and extract detailed metadata for semantic search.

Component code:
\`\`\`tsx
${code}
\`\`\`

Extract the following (be thorough and specific):

1. **description**: What this component does (1-2 sentences)

2. **props**: List of prop names (just the names, not types)

3. **hasVariants**: Does it have visual variants? (true/false)

4. **isInteractive**: Does it handle user interactions like clicks, hover, etc? (true/false)

5. **dependencies**: What other components does it import? (component names only)

6. **purpose**: Primary purpose (button, input, container, card, icon, navigation, form, layout, etc)

7. **variants**: List ALL variant option names from the code
   - Look for: variantClasses = { primary: ..., secondary: ... }
   - Look for: variant prop with TypeScript enum/union types
   - Examples: ['primary', 'secondary', 'outline', 'ghost', 'icon']
   - Return empty array [] if no variants

8. **sizes**: List ALL size option names from the code
   - Look for: sizeClasses = { small: ..., medium: ... }
   - Look for: size prop types
   - Examples: ['xs', 'small', 'medium', 'large', 'xl']
   - Return empty array [] if no sizes

9. **states**: List interactive states this component supports
   - Look for Tailwind state classes: hover:, active:, focus:, disabled:
   - Look for: disabled prop, loading prop, etc.
   - Examples: ['hover', 'active', 'focus', 'disabled', 'loading']
   - Return empty array [] if no special states

10. **features**: List key features as keywords
    - icon-support (if has icon prop or imports icon components)
    - accessible (if has aria-* attributes, role, etc.)
    - animated (if has transition-, animate- classes)
    - responsive (if has sm:, md:, lg: breakpoint classes)
    - external-link (if handles external URLs)
    - conditional-rendering (if has conditional logic)
    - Examples: ['icon-support', 'accessible', 'animated', 'responsive']
    - Return empty array [] if basic component

11. **patterns**: List implementation patterns used
    - polymorphic (can render as different elements: button, a, Link)
    - composition (embeds/composes other components)
    - forwardRef (uses React.forwardRef)
    - compound-component (parent-child pattern)
    - render-props (uses render functions)
    - Examples: ['polymorphic', 'composition', 'responsive']
    - Return empty array [] if simple component

Be specific and extract ACTUAL VALUES from the code, not generic descriptions.`;

    const metadata = await model.invoke(prompt) as ComponentMetadata;
    return metadata;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error extracting metadata from ${filePath}:`, errorMessage);
    return {
      description: '',
      props: [],
      hasVariants: false,
      isInteractive: false,
      dependencies: [],
      purpose: '',
      variants: [],
      sizes: [],
      states: [],
      features: [],
      patterns: []
    };
  }
};

/**
 * Scan reference directory for components
 */
const scanReferenceDirectory = async (dir: string): Promise<BaseComponent[]> => {
  const components: BaseComponent[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recurse into subdirectories
        const subComponents = await scanReferenceDirectory(fullPath);
        components.push(...subComponents);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
        // Determine type from directory structure
        const parentDir = path.basename(path.dirname(fullPath));
        const type = ['components', 'elements', 'icons', 'modules'].includes(parentDir)
          ? parentDir
          : 'components';

        const name = entry.name.replace(/\.(tsx|jsx)$/, '');

        components.push({
          name,
          type,
          path: fullPath,
          relativePath: path.relative(process.cwd(), fullPath)
        });
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error scanning directory ${dir}:`, errorMessage);
  }

  return components;
};

/**
 * Process items with limited concurrency to avoid MaxListeners warnings
 */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let currentIndex = 0;

  const runWorker = async (): Promise<void> => {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await worker(items[index], index);
    }
  };

  // Run workers in parallel up to the limit
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => runWorker()
  );

  await Promise.all(workers);
  return results;
}

/**
 * Scan and analyze all reference components using AI
 */
export const scanReferenceComponents = async (
  referenceDir: string | null = null
): Promise<ReferenceComponent[]> => {
  // Use absolute path from this file's location to avoid context-dependent resolution issues
  const defaultPath = referenceDir || path.join(__dirname, '..', '..', '..', 'reference', 'reference-app', 'ui');

  console.log(`🔍 Scanning reference components from: ${defaultPath}\n`);

  const components = await scanReferenceDirectory(defaultPath);

  if (components.length === 0) {
    console.log('⚠️  No reference components found');
    return [];
  }

  console.log(`Found ${components.length} reference components, analyzing with AI...\n`);

  // Get singleton model instance (LangChain best practice)
  const model = getChatModel('gpt-4o').withStructuredOutput(ComponentMetadataSchema);

  // Process with limited concurrency for better progress visibility
  const analyzed = await mapLimit(components, 5, async (comp) => {
    console.log(`  Analyzing ${comp.type}/${comp.name}...`);

    // Reuse singleton model instance
    const metadata = await extractComponentMetadataWithModel(comp.path, model);

    return {
      ...comp,
      ...metadata
    };
  });

  console.log(`\n✅ Analyzed ${analyzed.length} reference components\n`);

  return analyzed;
};

/**
 * CLI - Test reference scanner with AI analysis
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Testing reference scanner with AI analysis...\n');

  scanReferenceComponents(null).then(components => {
    console.log('📋 Reference components by type:\n');

    const byType = components.reduce((acc: Record<string, ReferenceComponent[]>, comp) => {
      if (!acc[comp.type]) acc[comp.type] = [];
      acc[comp.type].push(comp);
      return acc;
    }, {});

    Object.entries(byType).forEach(([type, comps]) => {
      console.log(`  ${type}: ${comps.length} components`);
      comps.slice(0, 2).forEach(c => {
        console.log(`    - ${c.name}`);
        if (c.variants?.length) console.log(`      variants: ${c.variants.join(', ')}`);
        if (c.sizes?.length) console.log(`      sizes: ${c.sizes.join(', ')}`);
        if (c.states?.length) console.log(`      states: ${c.states.join(', ')}`);
        if (c.features?.length) console.log(`      features: ${c.features.join(', ')}`);
      });
      if (comps.length > 2) {
        console.log(`    ... and ${comps.length - 2} more`);
      }
      console.log('');
    });

    console.log(`📊 Total: ${components.length} reference components analyzed\n`);

  }).catch(error => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Test failed:', errorMessage);
    process.exit(1);
  });
}
