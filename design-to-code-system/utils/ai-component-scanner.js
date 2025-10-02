#!/usr/bin/env node

/**
 * AI-POWERED COMPONENT SCANNER
 * Uses AI to understand existing components instead of unreliable regex parsing
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

// Schema for component analysis
const ComponentAnalysisSchema = z.object({
  name: z.string().describe("Component name extracted from the file"),
  type: z.enum(["icon", "element", "component", "module"]).describe("Component category based on file location"),
  exportType: z.enum(["named", "default"]).describe("Export style used"),
  isClientComponent: z.boolean().describe("Whether component uses 'use client' directive"),

  props: z.array(z.object({
    name: z.string(),
    type: z.string().describe("TypeScript type"),
    required: z.boolean(),
    description: z.string().nullable().describe("Purpose of this prop if evident from code")
  })).describe("Component props from interface/type definition"),

  variants: z.array(z.string()).describe("Variant names from variant objects (NOT CSS classes like 'hover:', 'focus:', etc.). Example: if you see const buttonVariants = { solid: '...', outline: '...' }, return ['solid', 'outline']"),

  sizes: z.array(z.string()).nullable().describe("Size variant names if component has size options"),

  capabilities: z.object({
    hasIcon: z.boolean().describe("Component uses or displays icons"),
    hasChildren: z.boolean().describe("Component accepts children prop"),
    hasOnClick: z.boolean().describe("Component has click handler"),
    hasClassName: z.boolean().describe("Component accepts className for style overrides"),
    extendsHTMLProps: z.boolean().describe("Component extends native HTML element props")
  }),

  dependencies: z.array(z.object({
    name: z.string(),
    path: z.string(),
    isLocal: z.boolean().describe("Whether this is a local import from @/ui/")
  })).describe("Other components or utilities this component imports"),

  description: z.string().describe("Brief description of what this component does")
});

/**
 * Analyze a single component file using AI
 */
export const analyzeComponentWithAI = async (filePath, content) => {
  const model = new ChatOpenAI({
    model: "gpt-4o-mini", // Faster and cheaper for analysis
    temperature: 0,
    maxTokens: 1500,
    openAIApiKey: process.env.OPENAI_API_KEY,
  }).withStructuredOutput(ComponentAnalysisSchema);

  const fileName = path.basename(filePath);
  const fileDir = path.dirname(filePath);

  // Determine component type from path (match with or without trailing slash)
  let componentType = "element";
  if (fileDir.includes('/icons')) componentType = "icon";
  else if (fileDir.includes('/components')) componentType = "component";
  else if (fileDir.includes('/modules')) componentType = "module";
  else if (fileDir.includes('/elements')) componentType = "element";

  const prompt = `Analyze this React TypeScript component file and extract structured information.

**File**: ${fileName}
**Path**: ${filePath}
**Type**: ${componentType} (determined from file location - use this value)

**CRITICAL INSTRUCTIONS**:
1. **Type**: Use the type provided above (${componentType}) - it's determined from file path
2. **Variants**: Extract ONLY object key names from variant objects (e.g., \`const buttonVariants = { solid: '...', outline: '...' }\` → \`['solid', 'outline']\`)
3. **DO NOT extract CSS pseudo-classes**: \`hover:\`, \`focus:\`, \`active:\`, \`disabled:\` are NOT variants!
4. **Props**: Extract from TypeScript interface/type definition, not from destructuring
5. **Dependencies**: List all imports, marking which are local (@/ui/) vs external

**CODE**:
\`\`\`typescript
${content}
\`\`\`

Analyze the code above and return structured component metadata.`;

  try {
    const result = await model.invoke([
      { role: "user", content: prompt }
    ]);

    return {
      ...result,
      type: componentType, // Force type from file path, don't let AI override
      path: filePath,
      scannedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Failed to analyze ${fileName}:`, error.message);
    return null;
  }
};

/**
 * Scan a directory of components using AI
 */
export const scanDirectoryWithAI = async (dirPath, options = {}) => {
  const {
    recursive = true,
    filePattern = /\.(tsx|ts|jsx|js)$/,
    exclude = /node_modules|\.stories\.|\.test\.|\.spec\./
  } = options;

  const components = [];

  const scanDir = async (currentDir) => {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (recursive && !exclude.test(entry.name)) {
            await scanDir(fullPath);
          }
        } else if (entry.isFile() && filePattern.test(entry.name) && !exclude.test(entry.name)) {
          console.log(`🔍 Analyzing: ${path.relative(process.cwd(), fullPath)}`);

          const content = await fs.readFile(fullPath, 'utf-8');
          const analysis = await analyzeComponentWithAI(fullPath, content);

          if (analysis) {
            components.push(analysis);
            console.log(`✅ ${analysis.name}: ${analysis.variants?.length || 0} variants, ${analysis.props?.length || 0} props`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error scanning ${currentDir}:`, error.message);
    }
  };

  await scanDir(dirPath);
  return components;
};

/**
 * Build library context from scanned components (compatible with existing workflow)
 */
export const buildLibraryContext = (scannedComponents) => {
  const context = {
    icons: [],
    elements: [],
    components: [],
    modules: []
  };

  scannedComponents.forEach(comp => {
    switch (comp.type) {
      case 'icon':
        context.icons.push(comp.name);
        break;
      case 'element':
        context.elements.push(comp.name);
        break;
      case 'component':
        context.components.push(comp.name);
        break;
      case 'module':
        context.modules.push(comp.name);
        break;
    }
  });

  return context;
};

/**
 * Main export for integration with existing workflow
 */
export const scanComponentsWithAI = async (uiPath) => {
  console.log(`🤖 AI-powered component scanning: ${uiPath}`);

  const scannedComponents = await scanDirectoryWithAI(uiPath, {
    recursive: true,
    exclude: /node_modules|\.stories\.|\.test\.|\.spec\.|dist|build/
  });

  const libraryContext = buildLibraryContext(scannedComponents);

  // Build byName lookup map (for compatibility with old scanner)
  const byName = {};
  scannedComponents.forEach(comp => {
    byName[comp.name.toLowerCase()] = comp;
  });

  // Build import map (for compatibility with old scanner)
  const importMap = {};
  scannedComponents.forEach(comp => {
    const categoryPath = comp.type === 'element' ? 'elements' :
                         comp.type === 'component' ? 'components' :
                         comp.type === 'module' ? 'modules' : 'icons';
    importMap[comp.name] = `@/ui/${categoryPath}/${comp.name}`;
  });

  console.log(`✅ Scanned ${scannedComponents.length} components`);
  console.log(`   - Icons: ${libraryContext.icons.length}`);
  console.log(`   - Elements: ${libraryContext.elements.length}`);
  console.log(`   - Components: ${libraryContext.components.length}`);
  console.log(`   - Modules: ${libraryContext.modules.length}`);

  return {
    components: scannedComponents,
    libraryContext,
    byName,
    importMap
  };
};

export default {
  analyzeComponentWithAI,
  scanDirectoryWithAI,
  buildLibraryContext,
  scanComponentsWithAI
};
