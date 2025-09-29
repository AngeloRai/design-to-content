# AI-Centric LangGraph Architecture

## Core Philosophy: AI Intelligence + Structured Orchestration

The system uses AI for all intelligent analysis and decision-making, while LangGraph handles orchestration, state management, and structured outputs.

## Simplified State Schema

```javascript
import { Annotation } from "@langchain/langgraph";

export const PipelineState = Annotation.Root({
  // Input data
  figmaUrl: Annotation<string>({
    reducer: (existing, update) => update || existing,
    default: () => ""
  }),

  figmaData: Annotation<object>({
    reducer: (existing, update) => ({ ...existing, ...update }),
    default: () => ({})
  }),

  screenshots: Annotation<Array>({
    reducer: (existing, updates) => [...existing, ...updates],
    default: () => []
  }),

  // AI Analysis Results
  aiAnalysis: Annotation<object>({
    reducer: (existing, update) => ({ ...existing, ...update }),
    default: () => ({})
  }),

  // Generated Components
  components: Annotation<Array>({
    reducer: (existing, updates) => [...existing, ...updates],
    default: () => []
  }),

  // Build Outputs
  buildResults: Annotation<object>({
    reducer: (existing, update) => ({ ...existing, ...update }),
    default: () => ({})
  }),

  // Processing Status
  status: Annotation<string>({
    reducer: (existing, update) => update || existing,
    default: () => "ready"
  }),

  errors: Annotation<Array>({
    reducer: (existing, updates) => [...existing, ...updates],
    default: () => []
  })
});
```

## Core AI-Driven Nodes

### 1. AI Visual Analysis Node
```javascript
export async function aiVisualAnalysisNode(state) {
  console.log('🧠 AI analyzing Figma design...');

  const analysis = await callAI({
    model: "gpt-4-vision-preview",
    prompt: `
      Analyze this Figma design component. Extract:

      1. Component identification (button, input, card, etc.)
      2. Visual variants present in the design
      3. Interactive states you can identify
      4. Text content and labels
      5. Layout and sizing information
      6. Color and styling patterns

      Return structured JSON:
      {
        "componentType": "...",
        "variants": {...},
        "interactionStates": [...],
        "textContent": [...],
        "layout": {...},
        "styling": {...}
      }
    `,
    image: state.screenshots[0]
  });

  return {
    aiAnalysis: {
      ...state.aiAnalysis,
      visual: analysis
    }
  };
}
```

### 2. AI Component Generation Node
```javascript
export async function aiComponentGenerationNode(state) {
  console.log('⚛️ AI generating React component...');

  const component = await callAI({
    model: "gpt-4-turbo",
    prompt: `
      Generate a production-ready React TypeScript component based on this analysis:

      ${JSON.stringify(state.aiAnalysis.visual, null, 2)}

      Requirements:
      - Clean, maintainable code
      - TypeScript interfaces
      - Props based on actual design variants
      - Accessibility considerations
      - Follow React best practices

      Return the complete component code.
    `
  });

  const parsedComponent = parseAIGeneratedComponent(component);

  return {
    components: [parsedComponent]
  };
}
```

### 3. AI Quality Assessment Node
```javascript
export async function aiQualityAssessmentNode(state) {
  console.log('🔍 AI assessing component quality...');

  const assessment = await callAI({
    model: "gpt-4-turbo",
    prompt: `
      Review this React component for quality:

      ${state.components[0].code}

      Assess:
      1. Code quality and best practices
      2. TypeScript usage
      3. Accessibility compliance
      4. Performance considerations
      5. Maintainability

      Return JSON:
      {
        "overallScore": 0.85,
        "codeQuality": 0.9,
        "accessibility": 0.8,
        "performance": 0.9,
        "recommendations": [...]
      }
    `
  });

  return {
    aiAnalysis: {
      ...state.aiAnalysis,
      quality: assessment
    }
  };
}
```

### 4. AI Visual Validation Node
```javascript
export async function aiVisualValidationNode(state) {
  console.log('👁️ AI comparing rendered vs original...');

  const comparison = await callAI({
    model: "gpt-4-vision-preview",
    prompt: `
      Compare these two images:
      1. Original Figma design
      2. Rendered React component

      Analyze:
      - Visual similarity
      - Layout accuracy
      - Color matching
      - Typography matching
      - Spacing accuracy

      Return JSON:
      {
        "similarity": 0.92,
        "differences": [...],
        "accuracy": 0.89,
        "recommendations": [...]
      }
    `,
    images: [state.screenshots[0], state.screenshots[1]]
  });

  return {
    aiAnalysis: {
      ...state.aiAnalysis,
      validation: comparison
    }
  };
}
```

### 5. AI Refinement Node
```javascript
export async function aiRefinementNode(state) {
  console.log('🔧 AI refining component based on comparison...');

  const refinedComponent = await callAI({
    model: "gpt-4-turbo",
    prompt: `
      Improve this React component based on the visual comparison:

      Current component:
      ${state.components[0].code}

      Comparison results:
      ${JSON.stringify(state.aiAnalysis.validation, null, 2)}

      Fix the identified differences while maintaining code quality.
      Return the improved component code.
    `
  });

  const parsedRefinedComponent = parseAIGeneratedComponent(refinedComponent);

  return {
    components: [parsedRefinedComponent]
  };
}
```

## Simplified Workflow Graph

```javascript
import { StateGraph, END } from "@langchain/langgraph";

const workflow = new StateGraph(PipelineState)
  .addNode("fetchFigma", fetchFigmaDataNode)
  .addNode("aiAnalysis", aiVisualAnalysisNode)
  .addNode("aiGeneration", aiComponentGenerationNode)
  .addNode("renderComponent", renderComponentNode)
  .addNode("aiValidation", aiVisualValidationNode)
  .addNode("aiQuality", aiQualityAssessmentNode)
  .addNode("aiRefinement", aiRefinementNode)
  .addNode("buildOutput", buildOutputNode)

  .addEdge("fetchFigma", "aiAnalysis")
  .addEdge("aiAnalysis", "aiGeneration")
  .addEdge("aiGeneration", "renderComponent")
  .addEdge("renderComponent", "aiValidation")
  .addEdge("aiValidation", "aiQuality")
  .addConditionalEdges(
    "aiQuality",
    (state) => state.aiAnalysis.quality.overallScore > 0.8 ? "buildOutput" : "aiRefinement"
  )
  .addEdge("aiRefinement", "renderComponent")
  .addEdge("buildOutput", END)

  .setEntryPoint("fetchFigma");
```

## Key Benefits

### 🧠 **AI-Driven Intelligence**
- No hardcoded rules or assumptions
- Adapts to any design system
- Makes nuanced decisions based on context

### 📊 **Structured Outputs**
- Clean, predictable data flow
- Easy to test and debug
- Maintainable architecture

### 🎯 **Simplified Logic**
- ~90% reduction in complex deterministic code
- Focus on orchestration, not analysis
- AI handles the hard problems

### 🚀 **Maximum Flexibility**
- Works with any Figma design
- No predefined constraints
- Scales to different design systems

## Helper Utilities

```javascript
// Simple AI wrapper
export async function callAI({ model, prompt, image, images }) {
  // Implementation depends on AI provider
  const response = await openai.chat.completions.create({
    model,
    messages: buildMessages(prompt, image, images)
  });

  return parseAIResponse(response);
}

// Simple component parser
export function parseAIGeneratedComponent(aiOutput) {
  return {
    name: extractComponentName(aiOutput),
    code: cleanupCode(aiOutput),
    props: extractProps(aiOutput),
    metadata: extractMetadata(aiOutput)
  };
}

// Simple validation
export function validateAIOutput(output, schema) {
  // Basic validation to ensure AI output is usable
  return isValid(output, schema);
}
```

This architecture maximizes AI capabilities while maintaining clean, structured orchestration through LangGraph.