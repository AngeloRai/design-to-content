# Task 1.1: AI Visual Analysis

**Estimated Time:** 10 minutes
**Difficulty:** Easy

## Objective
Implement AI-powered analysis of Figma design screenshots to extract component information, variants, and design patterns.

## Tasks
- Integrate OpenAI Vision API for design analysis
- Create intelligent prompts that extract relevant component data
- Return structured JSON output for component generation
- Handle different design styles and patterns gracefully

## Acceptance Criteria

### ✅ AI Integration
- [ ] OpenAI Vision API properly configured and working
- [ ] AI analyzes design screenshots and identifies components
- [ ] Structured JSON output with components, variants, colors, patterns
- [ ] Works with any design style without hardcoded assumptions

### ✅ Component Detection
- [ ] AI identifies component types (buttons, inputs, cards, etc.)
- [ ] AI detects variants and states present in design
- [ ] AI extracts color schemes and typography information
- [ ] AI identifies spacing and layout patterns

### ✅ Output Structure
- [ ] Consistent JSON format for downstream processing
- [ ] Component metadata includes bounds, properties, confidence
- [ ] Design system information (colors, fonts, spacing) extracted
- [ ] Error handling for AI API failures

### ✅ Generic Capability
- [ ] No hardcoded component types or color assumptions
- [ ] Works with corporate, personal, and experimental designs
- [ ] Adapts to different design languages and systems
- [ ] Handles edge cases and unusual component types

## Implementation Pattern

### Modern OpenAI Vision Integration
```typescript
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// Zod schema for AI output validation
const AnalysisSchema = z.object({
  componentType: z.enum(["button", "input", "card", "modal", "dropdown", "tab", "navigation"]),
  variants: z.array(z.string()).describe("Visual variants found in the design"),
  interactionStates: z.array(z.string()).describe("Interaction states visible"),
  props: z.array(z.object({
    name: z.string(),
    type: z.enum(["string", "number", "boolean", "enum"]),
    required: z.boolean(),
    description: z.string().optional()
  })),
  styling: z.object({
    colors: z.array(z.string()),
    typography: z.object({
      fontFamily: z.string().optional(),
      fontSize: z.string().optional(),
      fontWeight: z.string().optional()
    }).optional(),
    spacing: z.object({
      padding: z.string().optional(),
      margin: z.string().optional()
    }).optional()
  }),
  confidence: z.number().min(0).max(1)
});

const aiAnalysisNode = async (state: typeof StateAnnotation.State) => {
  const model = new ChatOpenAI({
    model: "gpt-4o",
    maxTokens: 2000
  });

  try {
    // Use structured output with Zod validation
    const structuredModel = model.withStructuredOutput(AnalysisSchema);

    const analysis = await structuredModel.invoke([
      {
        role: "system",
        content: `Analyze this Figma design component and extract structured information about its type, variants, props, and styling. Focus on what you can actually observe in the design.`
      },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: state.figmaScreenshot }}
        ]
      }
    ]);

    // No need to parse - already validated by Zod
    return new Command({
      goto: analysis.confidence > 0.8 ? "generation" : "manual_review",
      update: {
        analysisResult: analysis,
        analysisConfidence: analysis.confidence
      }
    });

  } catch (error) {
    return new Command({
      goto: "error_handling",
      update: {
        errors: [`Analysis failed: ${error.message}`]
      }
    });
  }
};
```

### Structured Output with Confidence Scoring
The AI analysis now includes confidence scoring and adaptive routing based on analysis quality.

## Verification
```bash
# Test AI analysis with confidence routing
npm run test:analysis

# Test with multiple design types
npm run test:analysis:varied

# Expected: AI analyzes designs, routes based on confidence
```

## Advanced Notes
- Use **gpt-4o** or **gpt-4-vision-preview** for best visual analysis
- Include **confidence scoring** for quality-based routing
- **Command pattern** enables smart routing based on analysis results
- **Structured JSON parsing** with error handling for robust operation
- AI adapts to actual design patterns without hardcoded assumptions