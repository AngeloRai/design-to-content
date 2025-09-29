# Task 0.3: Basic State & Workflow

**Estimated Time:** 20 minutes
**Difficulty:** Medium

## Objective
Create a simple LangGraph state schema and basic workflow with AI analysis and generation nodes.

## Tasks
- Define modern state schema using Annotation.Root (LangGraph 0.6+)
- Create basic nodes with Command-based routing
- Build workflow graph using latest StateGraph patterns
- Test workflow execution with mock data

## Acceptance Criteria

### ✅ Modern State Schema
- [ ] Use `Annotation.Root` for clean state definition (not TypedDict)
- [ ] Proper reducers with default values and reduce functions
- [ ] Input/output validation with schema validation
- [ ] Clean state transitions with Command objects

### ✅ Core Nodes with Command Pattern
- [ ] `aiAnalysisNode` - uses Command for conditional routing
- [ ] `aiGenerationNode` - returns Command with state updates
- [ ] `aiValidationNode` - decides next step via Command
- [ ] All nodes return Command objects for cleaner flow control

### ✅ Modern Workflow Graph
- [ ] StateGraph with Command-based routing (no conditional edges needed)
- [ ] Nodes specify possible destinations with `ends` parameter
- [ ] Clean entry point using `__start__`
- [ ] Proper error handling through Command routing

### ✅ Execution
- [ ] Graph compiles without errors
- [ ] Executes with mock data successfully
- [ ] State is properly maintained across nodes
- [ ] Error handling prevents crashes

## Verification
```bash
# Test basic workflow
npm run test:workflow

# Expected: Graph compiles, executes with mock data, state flows correctly
```

## Implementation Examples

### Modern State Schema with Zod Integration (TypeScript)
```typescript
import { Annotation } from "@langchain/langgraph";
import { z } from "zod";

// Zod schemas for data validation
const AnalysisDataSchema = z.object({
  componentType: z.string(),
  variants: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  styling: z.object({
    colors: z.array(z.string()),
    typography: z.record(z.string()).optional()
  })
});

const ComponentSchema = z.object({
  name: z.string(),
  code: z.string(),
  path: z.string(),
  uiCategory: z.enum(["elements", "components", "modules"]),
  analysis: AnalysisDataSchema
});

// LangGraph State Schema (for workflow state management)
const StateAnnotation = Annotation.Root({
  input: Annotation<string>,
  figmaScreenshot: Annotation<string>(),
  analysisResult: Annotation<z.infer<typeof AnalysisDataSchema>>(),
  generatedComponents: Annotation<z.infer<typeof ComponentSchema>[]>({
    default: () => [],
    reducer: (existing, updates) => [...existing, ...updates]
  }),
  outputPath: Annotation<string>({
    default: () => "nextjs-app/ui" // Target Next.js app UI directory
  }),
  validationStatus: Annotation<"pending" | "pass" | "fail">({
    default: () => "pending"
  }),
  errors: Annotation<string[]>({
    default: () => [],
    reducer: (existing, updates) => [...existing, ...updates]
  })
});

// Export both for use in nodes
export { StateAnnotation, AnalysisDataSchema, ComponentSchema };
```

### Command-Based Node Pattern
```typescript
const aiAnalysisNode = async (state: typeof StateAnnotation.State) => {
  const analysis = await mockAnalyze(state.input);

  return new Command({
    goto: analysis.isValid ? "generation" : "error",
    update: { analysisResult: analysis }
  });
};

const graph = new StateGraph(StateAnnotation)
  .addNode("analysis", aiAnalysisNode, {
    ends: ["generation", "error"]
  })
  .addNode("generation", aiGenerationNode, {
    ends: ["validation", "error"]
  })
  .addEdge("__start__", "analysis");
```

## Annotation vs Zod: When to Use Each

### 🔄 **LangGraph Annotation** - Workflow State
```typescript
// Use for: State that flows between nodes in your graph
const StateAnnotation = Annotation.Root({
  currentStep: Annotation<string>(),
  analysisResult: Annotation<AnalysisData>(),
  components: Annotation<Component[]>({
    reducer: (existing, updates) => [...existing, ...updates] // State aggregation
  })
});
```

### ✅ **Zod** - Data Validation & Structured Output
```typescript
// Use for: Validating AI outputs and external data
const AnalysisSchema = z.object({
  componentType: z.enum(["button", "input", "card"]),
  confidence: z.number().min(0).max(1)
});

// Structured AI output
const structuredLLM = model.withStructuredOutput(AnalysisSchema);
```

### 🤝 **Together: Type-Safe Workflows**
```typescript
// Zod schema defines the shape
const DataSchema = z.object({
  name: z.string(),
  value: z.number()
});

// Annotation uses the Zod-inferred type for state
const StateAnnotation = Annotation.Root({
  validatedData: Annotation<z.infer<typeof DataSchema>>()
});
```

## Modern Implementation Notes
- **Annotation.Root** for LangGraph workflow state management
- **Zod schemas** for AI output validation and type safety
- **Command pattern** for clean routing decisions
- **Structured outputs** eliminate JSON parsing errors
- **Type inference** ensures consistency between schemas and state
- **Mock implementations** for Phase 0 - real AI integration comes in Phase 1