# Agentic Component Generation System

## Overview

An autonomous LangGraph-powered system that generates production-ready React components from Figma designs using GPT-4o with full LangSmith observability.

**Key Features:**
- 🤖 Autonomous agent with tool calling (find similar components, write files, validate TypeScript)
- 🎨 Atomic design pattern (atoms → elements, molecules → components, organisms → modules)
- ✅ Automatic TypeScript validation after every component write
- 📊 Full LangSmith tracing of every LLM call and tool execution
- 🔍 Semantic search of reference components for pattern reuse
- 📈 Token usage tracking and cost monitoring

## Architecture

```
index.js (Entry Point)
  │
  ├─> Extract Figma Design (GPT-4o Vision + Structured Output)
  │   └─> Zod schemas for component analysis
  │
  └─> LangGraph Workflow
        │
        ├─> Setup Node
        │   ├─ Scan reference components
        │   ├─ Build vector search index
        │   └─ Create component registry
        │
        ├─> Generate Node (ChatOpenAI Agent)
        │   └─ Agent Loop:
        │       ├─ Plan component consolidation
        │       ├─ find_similar_components (semantic search)
        │       ├─ write_component (create .tsx file)
        │       ├─ validate_typescript (auto-validate)
        │       └─ Fix errors if needed → repeat
        │
        └─> Finalize Node
            └─ Report results + flush LangSmith traces
```

## File Structure

```
agentic-system/
├── index.js                    # Main entry point
├── config/                     # System-wide configuration
│   ├── openai-client.js        # ChatOpenAI model factory
│   ├── tool-executor.js        # Tool implementations + definitions
│   └── langsmith-config.js     # LangSmith setup & validation
├── workflow/                   # LangGraph workflow
│   ├── graph.js                # StateGraph definition
│   ├── prompts/                # System prompts (extensible)
│   │   └── agent-prompts.js    # Agent system prompts
│   └── nodes/                  # Workflow execution nodes
│       ├── setup.js            # Resource loading node
│       ├── generate.js         # ChatOpenAI agent node
│       └── finalize.js         # Reporting node
└── tools/                      # Utility tools
    ├── figma-extractor.js      # Figma API + GPT-4o Vision
    ├── reference-scanner.js    # Component discovery
    ├── vector-search.js        # Semantic search
    └── registry.js             # Component registry
```

## Environment Variables

### Required
```bash
# OpenAI
OPENAI_API_KEY=sk-...           # OpenAI API key

# Figma
FIGMA_ACCESS_TOKEN=figd_...     # Figma personal access token
```

### Optional (LangSmith Tracing)
```bash
LANGCHAIN_TRACING_V2=true                    # Enable tracing
LANGCHAIN_API_KEY=lsv2_...                   # LangSmith API key
LANGSMITH_WORKSPACE_ID=...                   # Workspace ID (for org keys)
LANGCHAIN_PROJECT=design-to-code-system      # Project name

# Model Configuration
DEFAULT_MODEL=gpt-4o                         # Or gpt-4o-mini, gpt-4, etc.
```

## Usage

### Basic Usage
```bash
node agentic-system/index.js "https://figma.com/design/FILE_KEY?node-id=X:Y"
```

### With Custom Output Directory
```bash
node agentic-system/index.js "https://figma.com/design/..." "../custom/output/path"
```

### Example
```bash
node agentic-system/index.js \
  "https://figma.com/design/qflwMPDJ4XpMn19ZGHHQCq/Atomic-Design?node-id=6-3" \
  "../atomic-design-pattern/ui"
```

## How It Works

### 1. Figma Analysis (Structured Output)
The system uses GPT-4o Vision to analyze Figma designs with Zod schemas:

```javascript
const ComponentSpecSchema = z.object({
  name: z.string(),
  atomicLevel: z.enum(['atom', 'molecule', 'organism']),
  type: z.string(),
  visualProperties: z.object({
    colors: z.string(),
    typography: z.string(),
    spacing: z.string(),
    borders: z.string(),
    shadows: z.string().nullable()
  }),
  states: z.array(z.string()),
  variants: z.array(z.string())
});
```

### 2. Agent Loop (ChatOpenAI + Tools)
The agent autonomously generates components using available tools:

**Available Tools:**
- `find_similar_components` - Semantic search for reference patterns
- `write_component` - Create React component file
- `read_file` - Read existing files
- `get_registry` - Check what components exist

**Auto-Validation:**
After every `write_component`, TypeScript validation runs automatically:
```
write_component(Button.tsx) → ✅ TypeScript validation → Success
write_component(Input.tsx) → ❌ TypeScript errors → Agent fixes → Retry
```

### 3. Component Consolidation
The agent intelligently groups similar components:
- **Consolidate**: Different styles → Single file with variant props
  - Example: `PrimaryButton`, `SecondaryButton` → `Button.tsx` with `variant` prop
- **Separate**: Different behavior → Separate files
  - Example: `TextInput` vs `SelectDropdown` → Different files

### 4. Atomic Design Mapping
```
Atoms      → ui/elements/     (Button.tsx, Input.tsx, Heading.tsx)
Molecules  → ui/components/   (SearchBar.tsx, FormField.tsx)
Organisms  → ui/modules/      (Navigation.tsx, Header.tsx, Footer.tsx)
```

## LangSmith Observability

When `LANGCHAIN_TRACING_V2=true`, every step is automatically traced:

### What You See in LangSmith Dashboard:

```
Component Generation Workflow (180s)
├─ setup (2.1s)
│  └─ Loaded 45 reference components
│
├─ generate (175.3s)
│  ├─ ChatOpenAI Call #1 (5.2s, $0.034)
│  │  ├─ Input: System prompt + 25 component specs
│  │  └─ Output: "I'll consolidate buttons and inputs..."
│  │
│  ├─ find_similar_components (0.3s)
│  │  ├─ Query: "button with variants"
│  │  └─ Results: Button.tsx, IconButton.tsx, LinkButton.tsx
│  │
│  ├─ ChatOpenAI Call #2 (8.1s, $0.056)
│  │  └─ Tool call: write_component(Button.tsx)
│  │
│  ├─ write_component (0.1s)
│  │  └─ Created: ui/elements/Button.tsx
│  │
│  ├─ validate_typescript (1.2s)
│  │  └─ ✅ No errors
│  │
│  └─ ... (repeats for all components)
│
└─ finalize (0.2s)
   └─ Generated 12 components successfully
```

**Benefits:**
- See exact prompts and responses
- Token counts and costs per call
- Tool execution traces
- Error debugging with full context
- Performance profiling

## Advanced Configuration

### Custom Model Selection
Use different models via environment variable:

```bash
# Use GPT-4o Mini (faster, cheaper)
DEFAULT_MODEL=gpt-4o-mini node agentic-system/index.js "..."

# Use GPT-4 (more capable)
DEFAULT_MODEL=gpt-4 node agentic-system/index.js "..."
```

### Synchronous Tracing (Debugging)
For guaranteed trace completion (slower):

```bash
LANGSMITH_TRACING_BACKGROUND=false node agentic-system/index.js "..."
```

## Troubleshooting

### LangSmith Trace Shows "Pending"

**Cause**: Process exited before traces uploaded.

**Solution**: Already implemented! The system uses `awaitPendingTraceBatches()` to flush traces before exit.

If you still see pending traces, check:
1. `LANGCHAIN_API_KEY` is set correctly
2. `LANGSMITH_WORKSPACE_ID` is set (required for org-scoped keys)
3. Network connectivity

### TypeScript Validation Fails

The agent automatically retries with fixes. If it gets stuck:

1. Check the error in console output
2. Look at the generated component in `ui/` folder
3. Common issues:
   - Missing imports (React, types)
   - Invalid JSX syntax
   - Type mismatches

The agent has up to 50 iterations to fix issues.

### No Components Generated

Check:
1. Figma URL is correct with `node-id` parameter
2. `FIGMA_ACCESS_TOKEN` is valid
3. `OPENAI_API_KEY` is valid
4. Run with LangSmith tracing to see where it fails

## Architecture Decisions

### Why LangGraph?
- **Structured workflow**: Clear phases (setup → generate → finalize)
- **State management**: Pass data between nodes cleanly
- **Extensibility**: Easy to add new nodes (e.g., visual validation, Contentful sync)
- **Observability**: Built-in LangSmith integration

### Why ChatOpenAI (not direct SDK)?
- **Automatic tracing**: Every LLM call traced in LangSmith
- **Tool calling**: Native support for function calling
- **Token tracking**: Automatic cost monitoring
- **Error handling**: Better error context

### Why Zod Schemas?
- **Structured output**: Guaranteed JSON structure from LLM
- **Type safety**: Compile-time type checking
- **Validation**: Runtime validation of LLM responses
- **Self-documenting**: Schema serves as spec

### Why Auto-Validation?
- **Quality assurance**: Every component must compile
- **Self-healing**: Agent automatically fixes errors
- **Fast feedback**: Errors caught immediately

## Performance

**Typical Run (25 components):**
- Figma analysis: 15-20 seconds
- Setup: 2-3 seconds
- Generation: 120-180 seconds (depends on complexity)
- Finalize: < 1 second

**Cost Estimate (GPT-4o):**
- Figma analysis: $0.10-0.15
- Component generation: $0.50-1.50 (depends on iterations)
- Total: ~$0.60-1.65 per run

## Future Enhancements

Planned features enabled by LangGraph architecture:

1. **Smart Component Reuse**
   - Detect existing components before generating
   - Suggest adjustments vs new generation

2. **Incremental Runs**
   - Only generate what changed since last run
   - State persistence between runs

3. **Visual Validation**
   - Playwright node to compare Figma vs Storybook
   - Automated screenshot diffing

4. **Contentful Integration**
   - Auto-generate content types from components
   - Migration scripts with codegen

5. **Parallel Generation**
   - Generate independent components concurrently
   - 3-5x faster for large designs

6. **Human-in-the-Loop**
   - Review checkpoints before file writes
   - Approve/reject/edit suggestions

## Technology Stack

- **LangGraph**: Workflow orchestration
- **LangChain**: LLM abstraction layer
- **ChatOpenAI**: GPT-4o model wrapper
- **LangSmith**: Observability platform
- **OpenAI**: LLM provider
- **Figma API**: Design extraction
- **Zod**: Schema validation
- **TypeScript**: Component validation

## License

[Your License Here]

## Contributing

[Contributing guidelines here]
