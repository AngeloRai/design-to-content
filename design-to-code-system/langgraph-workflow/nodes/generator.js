#!/usr/bin/env node

/**
 * GENERATOR NODE
 *
 * Generates React TypeScript components based on strategy decisions
 * Uses AI with structured output (Zod schema) for reliable code generation
 *
 * Flow:
 * 1. Takes componentStrategy from planner
 * 2. For each "create_new" decision
 * 3. AI generates complete React component code
 * 4. Writes code to file system
 */

import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { buildComponentGenerationPrompt } from "../prompts/generation/component-generation-prompt.js";
import { writeComponent } from "../tools/component-tools.js";
import path from "path";

// Zod schema for structured component generation
const GeneratedComponentSchema = z.object({
  code: z
    .string()
    .describe(
      "Complete TypeScript React component code - this is the actual source code that will be written to a .tsx file"
    ),
  componentName: z.string().describe("Component name (PascalCase)"),
  imports: z
    .array(z.string())
    .describe("List of imports used in the component"),
  exports: z.array(z.string()).describe("Exported names from component"),
  props: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean(),
        description: z.string().nullable(),
      })
    )
    .describe("Component props interface definition"),
  confidence: z.number().min(0).max(1).describe("Generation confidence score"),
});

/**
 * Handle component updates (add variants, props, etc.)
 */
const handleComponentUpdates = async (toUpdate, state) => {
  const fsModule = await import("fs-extra");
  const fs = fsModule.default;
  const { visualAnalysis, outputPath } = state;

  for (const update of toUpdate) {
    try {
      const componentSpec = visualAnalysis.components.find(
        (c) => c.name === update.component.name
      );

      if (!componentSpec) continue;

      // Determine file path
      const targetDir =
        componentSpec.atomicLevel === "atom"
          ? "elements"
          : componentSpec.atomicLevel === "molecule"
          ? "components"
          : "modules";
      const componentPath = path.join(
        outputPath,
        targetDir,
        `${componentSpec.name}.tsx`
      );

      if (!(await fs.pathExists(componentPath))) {
        console.log(
          `  ⚠️  ${componentSpec.name} doesn't exist, skipping update`
        );
        continue;
      }

      console.log(`  → Updating ${componentSpec.name}...`);

      // Read existing component
      const existingCode = await fs.readFile(componentPath, "utf-8");

      // Generate updated version preserving existing functionality
      const patchPath = componentPath.replace(".tsx", ".update.tsx");

      // Use AI to generate updated version
      const model = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0.1,
        maxTokens: 4000,
        openAIApiKey: process.env.OPENAI_API_KEY,
      }).withStructuredOutput(GeneratedComponentSchema);

      // Build update prompt
      const { buildComponentUpdatePrompt } = await import(
        "../prompts/generation/component-update-prompt.js"
      );
      const updatePrompt = buildComponentUpdatePrompt(
        existingCode,
        componentSpec,
        update.reason
      );

      try {
        const result = await model.invoke([
          { role: "system", content: updatePrompt },
          {
            role: "user",
            content:
              "Generate the updated component preserving all existing functionality while adding the new requirements.",
          },
        ]);

        // Save updated version for review
        await fs.writeFile(patchPath, result.code);
        console.log(
          `    ✓ Update saved to ${path.basename(patchPath)} for review`
        );

        // Also save a diff file showing what changed
        const diffPath = componentPath.replace(".tsx", ".diff.md");
        const diffContent = `# Component Update: ${componentSpec.name}

## Reason for Update
${update.reason}

## Update Details
- Original: ${path.basename(componentPath)}
- Updated: ${path.basename(patchPath)}
- Generated: ${new Date().toISOString()}

## Review Instructions
1. Compare ${path.basename(patchPath)} with original
2. Verify existing functionality preserved
3. Test new variants/props
4. Replace original if satisfied
5. Delete .update.tsx and .diff.md files

## Safety Checklist
- [ ] Existing props work
- [ ] No breaking changes
- [ ] New features are optional
- [ ] Tests pass
`;

        await fs.writeFile(diffPath, diffContent);
        console.log(`    ✓ Review notes saved to ${path.basename(diffPath)}`);
      } catch (error) {
        console.log(`    ❌ Update generation failed: ${error.message}`);
      }
    } catch (error) {
      console.log(
        `  ❌ Failed to update ${update.component.name}: ${error.message}`
      );
    }
  }
};

/**
 * Generate icon components from extracted SVGs
 * These SVGs are already fetched from Figma API as complete SVG content
 */
const generateIconComponents = async (icons, outputPath) => {
  if (!icons || icons.length === 0) return [];

  const fs = await import("fs-extra");
  const generatedIcons = [];
  const iconsDir = path.join(outputPath, "icons");

  // Ensure icons directory exists
  await fs.default.ensureDir(iconsDir);

  // Helper to normalize icon names
  const normalizeIconName = (name) => {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").replace(/^(\d)/, "_$1");
    return cleanName.endsWith("Icon") ? cleanName : `${cleanName}Icon`;
  };

  // Deduplicate icons by component name BEFORE processing
  const uniqueIcons = [];
  const seenNames = new Set();

  icons.forEach((icon) => {
    const fileName = normalizeIconName(icon.name);
    if (!seenNames.has(fileName)) {
      seenNames.add(fileName);
      uniqueIcons.push(icon);
    }
  });

  console.log(
    `\n🎨 Generating ${uniqueIcons.length} unique icon components (from ${icons.length} total)...`
  );

  for (const icon of uniqueIcons) {
    try {
      const fileName = normalizeIconName(icon.name);
      console.log(`  → Creating ${fileName}...`);

      // Convert SVG attributes to React format
      const reactifyContent = (content) => {
        return content
          .replace(/fill-rule=/g, "fillRule=")
          .replace(/clip-rule=/g, "clipRule=")
          .replace(/stroke-width=/g, "strokeWidth=")
          .replace(/stroke-linecap=/g, "strokeLinecap=")
          .replace(/stroke-linejoin=/g, "strokeLinejoin=")
          .replace(/fill="#[^"]+"/g, `fill={color}`); // Make fill dynamic
      };

      const svgContent = icon.innerContent
        ? reactifyContent(icon.innerContent)
        : `<path d="${icon.svgPath}" fill={color} />`;

      // We already have the complete SVG content from Figma API
      // Just need to wrap it in a React component with dynamic props
      const iconComponent = `import React from 'react';

interface ${fileName}Props extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

/**
 * ${fileName} component
 * Auto-generated from Figma design
 */
export const ${fileName}: React.FC<${fileName}Props> = ({
  size = 24,
  color = 'currentColor',
  className,
  ...props
}) => {
  // SVG content fetched from Figma API
  return (
    <svg
      width={size}
      height={size}
      viewBox="${icon.viewBox || "0 0 24 24"}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      ${svgContent}
    </svg>
  );
};

export default ${fileName};`;

      const iconPath = path.join(iconsDir, `${fileName}.tsx`);
      await fs.default.writeFile(iconPath, iconComponent);

      generatedIcons.push({
        name: fileName,
        filePath: iconPath,
        action: "created",
        atomicLevel: "atom",
        linesOfCode: iconComponent.split("\n").length,
        timestamp: new Date().toISOString(),
      });

      console.log(`    ✓ Saved to icons/${fileName}.tsx`);
    } catch (error) {
      console.error(`    ❌ Failed to generate ${icon.name}: ${error.message}`);
    }
  }

  return generatedIcons;
};

export const generatorNode = async (state) => {
  console.log("⚙️  Starting component generation...");

  try {
    const { componentStrategy, visualAnalysis, outputPath, figmaData } = state;

    // Generate icons first if they exist
    let generatedIcons = [];
    if (figmaData?.extractedIcons && figmaData.extractedIcons.length > 0) {
      generatedIcons = await generateIconComponents(
        figmaData.extractedIcons,
        outputPath
      );
    }

    if (!componentStrategy || componentStrategy.length === 0) {
      // If no component strategy but we generated icons, that's still success
      if (generatedIcons.length > 0) {
        console.log(
          `\n✅ Generation complete: ${generatedIcons.length} icons generated`
        );
        return {
          currentPhase: "generation",
          generatedComponents: generatedIcons,
        };
      }
      throw new Error("No component strategy available for generation");
    }

    // Filter for components that need generation or updating
    const toGenerate = componentStrategy.filter(
      (s) => s.action === "create_new"
    );
    const toUpdate = componentStrategy.filter(
      (s) => s.action === "update_existing"
    );

    if (toGenerate.length === 0 && toUpdate.length === 0) {
      console.log("ℹ️  No components to generate or update");
      // But we might have generated icons
      return {
        currentPhase: "generation",
        generatedComponents: generatedIcons,
      };
    }

    // Handle updates first (safer - preserves existing functionality)
    if (toUpdate.length > 0) {
      console.log(`📝 Processing ${toUpdate.length} component updates...`);
      await handleComponentUpdates(toUpdate, state);
    }

    console.log(`📝 Generating ${toGenerate.length} component(s)...`);

    // Initialize AI model with structured output
    // The AI will generate the actual React component code
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.1,
      maxTokens: 4000,
      openAIApiKey: process.env.OPENAI_API_KEY,
    }).withStructuredOutput(GeneratedComponentSchema);

    // Generate each component (start with icons already generated)
    const generatedComponents = [...generatedIcons];

    for (const strategyItem of toGenerate) {
      try {
        console.log(`\n  → Generating ${strategyItem.component.name}...`);

        // Find the full component spec from visual analysis
        const componentSpec = visualAnalysis.components.find(
          (c) => c.name === strategyItem.component.name
        );

        if (!componentSpec) {
          console.warn(
            `  ⚠️  Component spec not found for ${strategyItem.component.name}, skipping`
          );
          continue;
        }

        // Build generation prompt from prompts/generation/component-generation.js
        // This prompt tells the AI HOW to generate React components
        const generationPrompt = buildComponentGenerationPrompt(componentSpec, {
          outputPath,
          atomicLevel: componentSpec.atomicLevel,
          targetPath: strategyItem.targetPath,
        });

        // Invoke directly without template (avoids {} escaping issues in prompt)
        const result = await model.invoke([
          { role: "system", content: generationPrompt },
          {
            role: "user",
            content:
              "Generate the React TypeScript component based on the specifications provided. Return the complete component code in the 'code' field.",
          },
        ]);

        // Validate we got code
        if (!result.code || result.code.trim().length === 0) {
          console.error(`  ❌ AI returned empty code`);
          continue;
        }

        console.log(
          `  ✓ AI generated ${result.code.split("\n").length} lines of code`
        );

        // Skip TypeScript validation - Next.js will validate when building
        // Standalone validation has too many false positives with paths/types
        const componentName =
          result.componentName || strategyItem.component.name;

        // Determine file path based on atomic level
        const filePath = determineFilePath(
          componentName,
          componentSpec.atomicLevel,
          outputPath
        );

        // Write component file to disk
        console.log(`  📁 Writing to ${filePath}...`);
        const writeResult = await writeComponent(filePath, result.code, false);

        if (!writeResult.success) {
          console.error(`  ❌ Failed to write file: ${writeResult.error}`);
          continue;
        }

        // Add to generated components list
        generatedComponents.push({
          name: result.componentName || strategyItem.component.name,
          filePath,
          action: "created",
          linesOfCode: result.code.split("\n").length,
          timestamp: new Date().toISOString(),
          atomicLevel: componentSpec.atomicLevel,
          props: result.props || [],
          imports: result.imports || [],
          exports: result.exports || [],
          confidence: result.confidence || componentSpec.confidence || 0.8,
        });

        console.log(`  ✅ Generated successfully`);
      } catch (error) {
        console.error(
          `  ❌ Failed to generate ${strategyItem.component.name}:`,
          error.message
        );
      }
    }

    const totalGenerated = generatedComponents.length;
    const componentsGenerated = totalGenerated - generatedIcons.length;

    console.log(`\n✅ Generation complete:`);
    if (componentsGenerated > 0) {
      console.log(
        `   - ${componentsGenerated}/${toGenerate.length} components generated`
      );
    }
    if (generatedIcons.length > 0) {
      console.log(`   - ${generatedIcons.length} icons generated`);
    }

    return {
      generatedComponents,
      currentPhase: "generation",
      metadata: {
        ...state.metadata,
        generationTime: new Date().toISOString(),
        generatedCount: totalGenerated,
        iconsCount: generatedIcons.length,
        componentsCount: componentsGenerated,
      },
    };
  } catch (error) {
    console.error("❌ Component generation failed:", error.message);
    return {
      errors: [
        {
          message: error.message,
          phase: "generation",
          timestamp: new Date().toISOString(),
        },
      ],
      status: "error",
    };
  }
};

/**
 * Determine file path based on component name and atomic level
 * Maps: atom -> elements/, molecule -> components/, organism -> modules/
 */
function determineFilePath(componentName, atomicLevel, outputPath) {
  const directoryMap = {
    atom: "elements",
    molecule: "components",
    organism: "modules",
  };

  const directory = directoryMap[atomicLevel] || "components";

  return path.join(outputPath, directory, `${componentName}.tsx`);
}

export default generatorNode;
