# Task 1.2: AI Component Generation

**Estimated Time:** 15 minutes
**Difficulty:** Medium

## Objective
Generate production-ready React components using AI based on the visual analysis, including TypeScript interfaces and proper component structure.

## Tasks
- Use AI to generate complete React components from analysis data
- Include TypeScript interfaces and prop definitions
- Create clean, maintainable component code
- Organize generated files in proper directory structure

## Acceptance Criteria

### ✅ AI Code Generation
- [ ] AI generates complete React components from analysis
- [ ] Components include proper TypeScript interfaces
- [ ] AI chooses appropriate component patterns and structure
- [ ] Generated code follows React best practices

### ✅ Component Quality
- [ ] Components are production-ready and compilable
- [ ] Props match actual design variants and states
- [ ] Accessibility considerations included where appropriate
- [ ] Clean, readable code with proper naming

### ✅ File Organization
- [ ] Components saved to organized directory structure
- [ ] Index files created for easy imports
- [ ] File naming follows consistent conventions
- [ ] Metadata preserved in file headers

### ✅ Flexibility
- [ ] Works with any component types identified by AI
- [ ] Adapts to different styling approaches and patterns
- [ ] Handles complex components with multiple variants
- [ ] No assumptions about specific design systems

## Implementation Pattern

### Modern AI Component Generation
```typescript
import { ChatOpenAI } from "@langchain/openai";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const aiGenerationNode = async (state: typeof StateAnnotation.State) => {
  const model = new ChatOpenAI({
    model: "gpt-4o", // Latest model for best code generation
    temperature: 0.1 // Lower temperature for consistent code
  });

  try {
    const componentCode = await model.invoke([
      {
        role: "system",
        content: `Generate a production-ready React TypeScript component based on this analysis:
        ${JSON.stringify(state.analysisResult, null, 2)}

        Requirements:
        - Modern React functional component with TypeScript
        - Props interface matching analyzed variants and states
        - Tailwind CSS for styling (adapt to analyzed design)
        - Accessibility attributes (ARIA, semantic HTML)
        - JSDoc comments for documentation
        - Export both component and types

        Return only the complete component code, ready to save to file.`
      }
    ]);

    // Parse component details for Next.js UI organization
    const componentName = state.analysisResult.componentType
      .charAt(0).toUpperCase() + state.analysisResult.componentType.slice(1);

    // Organize into Next.js UI structure based on component type
    const uiCategory = determineUICategory(state.analysisResult.componentType);
    const directory = join("nextjs-app/ui", uiCategory, componentName.toLowerCase());
    await mkdir(directory, { recursive: true });

    // Save component file
    await writeFile(
      join(directory, `${componentName}.tsx`),
      componentCode.content
    );

    // Generate index file for Next.js
    const indexContent = `export { default as ${componentName} } from './${componentName}';
export type { ${componentName}Props } from './${componentName}';`;

    await writeFile(join(directory, "index.ts"), indexContent);

    // Helper function to categorize components
    function determineUICategory(componentType: string): string {
      const elementTypes = ['button', 'input', 'checkbox', 'radio', 'select'];
      const componentTypes = ['card', 'modal', 'dropdown', 'tab', 'accordion'];
      const moduleTypes = ['navigation', 'header', 'footer', 'sidebar', 'form'];

      if (elementTypes.includes(componentType.toLowerCase())) return 'elements';
      if (componentTypes.includes(componentType.toLowerCase())) return 'components';
      if (moduleTypes.includes(componentType.toLowerCase())) return 'modules';

      return 'components'; // default fallback
    }

    return new Command({
      goto: "validation",
      update: {
        generatedComponents: [{
          name: componentName,
          code: componentCode.content,
          path: directory,
          uiCategory: uiCategory,
          variants: state.analysisResult.variants,
          confidence: state.analysisResult.confidence
        }]
      }
    });

  } catch (error) {
    return new Command({
      goto: "error_handling",
      update: {
        errors: [`Generation failed: ${error.message}`]
      }
    });
  }
};
```

### Functional API Alternative for Simple Generation
For simpler cases, you can use LangGraph's functional API:

```typescript
import { task, entrypoint } from "@langchain/langgraph";

const generateComponent = task("generateComponent", async (analysis: AnalysisData) => {
  const model = new ChatOpenAI({ model: "gpt-4o" });
  return await model.invoke([
    { role: "system", content: "Generate React component..." },
    { role: "user", content: JSON.stringify(analysis) }
  ]);
});

const organizeFiles = task("organizeFiles", async (component: ComponentData) => {
  // Save to Next.js UI directory structure
  const uiCategory = determineUICategory(component.type);
  const targetPath = `nextjs-app/ui/${uiCategory}/${component.name.toLowerCase()}`;

  return await saveToFileSystem(component, targetPath);
});

const generationWorkflow = entrypoint(
  { checkpointer, name: "generation" },
  async (analysis: AnalysisData) => {
    const component = await generateComponent(analysis);
    return await organizeFiles(component);
  }
);
```

## Verification
```bash
# Test modern AI generation with Command routing
npm run test:generation

# Test parallel generation of multiple components
npm run test:generation:parallel

# Expected: Production-ready React components with proper file structure
```

## Modern Best Practices
- **GPT-4o** for highest quality code generation
- **Command pattern** for clean error handling and routing
- **Functional API** for simple, composable generation tasks
- **Parallel processing** using task decorators for multiple components
- **File system integration** with proper directory structure
- **TypeScript-first** approach with comprehensive type definitions