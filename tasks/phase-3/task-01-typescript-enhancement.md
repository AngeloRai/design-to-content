# Task 3.1: TypeScript Enhancement

**Estimated Time:** 15 minutes
**Difficulty:** Medium

## Objective
Use AI to generate comprehensive TypeScript interfaces and type definitions for all generated components.

## Tasks
- AI analyzes generated components to create appropriate TypeScript interfaces
- AI generates utility types and helper functions
- AI ensures type safety and consistency across all components
- AI creates type documentation and usage examples

## Acceptance Criteria

### ✅ TypeScript Interface Generation
- [ ] AI generates complete TypeScript interfaces for all components
- [ ] Interfaces accurately reflect component props and variants
- [ ] AI creates appropriate union types for variants
- [ ] Type definitions include proper JSDoc comments

### ✅ Type Safety
- [ ] All components compile without TypeScript errors
- [ ] Proper type checking for component props
- [ ] AI ensures type consistency across related components
- [ ] No 'any' types unless absolutely necessary

### ✅ Utility Types
- [ ] AI generates helpful utility types for common patterns
- [ ] Component variant types properly defined
- [ ] Event handler types included where appropriate
- [ ] Generic types used effectively for reusable patterns

### ✅ Documentation
- [ ] Type definitions include clear documentation
- [ ] Usage examples provided for complex types
- [ ] Export structure clearly defined
- [ ] Integration guidelines for TypeScript projects

## Modern Implementation Pattern

### AI-Powered TypeScript Generation with ToolNode
Leverage LangGraph's ToolNode for integrated TypeScript tooling:

```typescript
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Define TypeScript generation tools
const generateTypesScript = tool(
  async (input: { componentCode: string; analysisData: any }) => {
    const model = new ChatOpenAI({ model: "gpt-4o" });

    const types = await model.invoke([
      {
        role: "system",
        content: `Generate comprehensive TypeScript definitions for this component:

        Requirements:
        - Create proper Props interface with JSDoc
        - Generate variant type unions from actual usage
        - Include event handler types
        - Create utility types for common patterns
        - Export all types properly

        Return only the TypeScript definitions, ready to save as .d.ts file.`
      },
      {
        role: "user",
        content: `Component: ${input.componentCode}\nAnalysis: ${JSON.stringify(input.analysisData)}`
      }
    ]);

    return {
      typeDefinitions: types.content,
      fileName: `${input.analysisData.componentName}.types.ts`,
      targetPath: `nextjs-app/ui/${input.analysisData.uiCategory}/${input.analysisData.componentName.toLowerCase()}`
    };
  },
  {
    name: "generateTypesScript",
    description: "Generate TypeScript definitions for a component",
    schema: z.object({
      componentCode: z.string(),
      analysisData: z.any()
    })
  }
);

const validateTypes = tool(
  async (input: { typeDefinitions: string; componentCode: string }) => {
    // Use TypeScript compiler API or tsc to validate
    const validation = await validateTypeScript(input.typeDefinitions, input.componentCode);
    return {
      isValid: validation.errors.length === 0,
      errors: validation.errors,
      suggestions: validation.suggestions
    };
  },
  {
    name: "validateTypes",
    description: "Validate TypeScript definitions against component code",
    schema: z.object({
      typeDefinitions: z.string(),
      componentCode: z.string()
    })
  }
);

// ToolNode for TypeScript operations
const typeScriptToolNode = new ToolNode([generateTypesScript, validateTypes]);

// Modern workflow using functional API for parallel processing
const enhanceTypesWorkflow = entrypoint(
  { checkpointer: new MemorySaver(), name: "typeEnhancement" },
  async (components: Component[]) => {
    // Generate types for all components in parallel
    const typeGenerationTasks = components.map(component =>
      generateTypesScript({
        componentCode: component.code,
        analysisData: component.analysis
      })
    );

    const generatedTypes = await Promise.all(typeGenerationTasks);

    // Validate all types in parallel
    const validationTasks = generatedTypes.map((types, index) =>
      validateTypes({
        typeDefinitions: types.typeDefinitions,
        componentCode: components[index].code
      })
    );

    const validationResults = await Promise.all(validationTasks);

    return {
      typeDefinitions: generatedTypes,
      validationResults,
      allValid: validationResults.every(result => result.isValid)
    };
  }
);
```

### Advanced TypeScript Generation with Multi-Agent Pattern
For complex type systems, use specialized agents:

```typescript
const typeSystemSupervisor = async (state: typeof StateAnnotation.State) => {
  const model = new ChatOpenAI({ model: "gpt-4o" });

  const decision = await model.withStructuredOutput(z.object({
    typeComplexity: z.enum(["simple", "moderate", "complex"]),
    requiredAgents: z.array(z.enum(["props", "variants", "utilities", "documentation"]))
  })).invoke([
    {
      role: "system",
      content: `Analyze these components and determine TypeScript generation strategy:
      ${JSON.stringify(state.generatedComponents.map(c => c.analysis), null, 2)}`
    }
  ]);

  // Route to appropriate specialized type agents
  return decision.requiredAgents.map(agent =>
    new Send(`generate_${agent}_types`, {
      components: state.generatedComponents,
      complexity: decision.typeComplexity
    })
  );
};

const propsTypeAgent = async (state: TypeWorkerState) => {
  const model = new ChatOpenAI({ model: "gpt-4o" });

  const propsTypes = await model.invoke([
    {
      role: "system",
      content: `Generate comprehensive Props interfaces for these components.
      Focus on:
      - Accurate prop types from component analysis
      - Optional vs required props
      - Union types for variants
      - Generic types where appropriate
      - Clear JSDoc documentation`
    },
    {
      role: "user",
      content: JSON.stringify(state.components.map(c => c.analysis))
    }
  ]);

  return new Command({
    goto: "__end__",
    update: {
      typeResults: [{
        category: "props",
        definitions: propsTypes.content
      }]
    }
  });
};

const utilityTypeAgent = async (state: TypeWorkerState) => {
  // Generate utility types, helper functions, type guards, etc.
  const utilityTypes = await model.invoke([
    {
      role: "system",
      content: `Create utility types and helper functions:
      - Type guards for variant checking
      - Helper types for component composition
      - Event handler type utilities
      - Theme and styling type utilities`
    },
    {
      role: "user",
      content: JSON.stringify(state.components)
    }
  ]);

  return new Command({
    goto: "__end__",
    update: {
      typeResults: [{
        category: "utilities",
        definitions: utilityTypes.content
      }]
    }
  });
};
```

### Integration with Modern Build Tools
```typescript
// Integrate with Vite, Rollup, or other modern build tools
const buildIntegrationTool = tool(
  async (input: { typeDefinitions: TypeDefinition[] }) => {
    // Generate build configuration
    const buildConfig = await generateBuildConfig(input.typeDefinitions);

    // Create declaration files
    const declarationFiles = await createDeclarationFiles(input.typeDefinitions);

    return {
      buildConfig,
      declarationFiles,
      exportMap: generateExportMap(input.typeDefinitions)
    };
  },
  {
    name: "buildIntegrationTool",
    description: "Generate build configuration and declaration files",
    schema: z.object({
      typeDefinitions: z.array(z.any())
    })
  }
);
```

## Verification
```bash
# Test modern TypeScript generation with parallel processing
npm run test:typescript:parallel

# Test multi-agent type generation
npm run test:typescript:agents

# Test build integration
npm run test:typescript:build

# Expected: Comprehensive, validated TypeScript definitions with build integration
```

## Modern TypeScript Patterns
- **ToolNode Integration**: Leverage built-in TypeScript tooling
- **Functional API**: Parallel processing of type generation
- **Multi-Agent Specialization**: Dedicated agents for different type categories
- **Build Tool Integration**: Modern build system compatibility
- **Automated Validation**: TypeScript compiler integration for validation
- **AI-Generated Utilities**: Smart utility types and helper functions