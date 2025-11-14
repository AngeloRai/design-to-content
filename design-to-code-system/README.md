# Design-to-Code System

**LangGraph-powered design-to-code generation system with TypeScript and modern AI orchestration**

> **📖 Looking to run the system?** See [agentic-system/README.md](agentic-system/README.md) for quick start, usage examples, and troubleshooting.

## 🎯 Purpose

This document provides an architectural overview of the design-to-code system. For practical usage instructions, see the [agentic-system README](agentic-system/README.md).

An autonomous AI-powered system that converts Figma designs into production-ready React components using:
- **LangGraph v1.0** workflows with checkpointing
- **OpenAI GPT-4o Vision** for design analysis
- **TypeScript** throughout the codebase
- **Automatic validation** with TypeScript/ESLint auto-fix
- **MCP integration** for Figma and browser automation

## 📁 Directory Structure

```
design-to-code-system/
├── README.md                           # This file
├── package.json                        # Dependencies (LangGraph, OpenAI, etc.)
├── tsconfig.json                       # TypeScript configuration
├── agentic-system/                     # Main implementation
│   ├── index.ts                        # Entry point with checkpointing
│   ├── workflow/                       # LangGraph workflow
│   │   ├── graph.ts                    # StateGraph with Annotation.Root
│   │   ├── nodes/                      # Workflow nodes (TypeScript)
│   │   │   ├── analyze.ts              # Figma analysis with GPT-4o Vision
│   │   │   ├── setup.ts                # Load references & vector search
│   │   │   ├── generate.ts             # AI component generation
│   │   │   ├── generate-stories.ts     # Storybook story generation
│   │   │   ├── validate.ts             # Validation subgraph
│   │   │   ├── finalize.ts             # Results reporting
│   │   │   └── validation/             # Validation subnodes
│   │   │       ├── final-check.ts      # TypeScript/ESLint validation
│   │   │       ├── typescript-fix.ts   # Auto-fix validation errors
│   │   │       ├── route-validation.ts # Routing logic
│   │   │       └── quality-review.ts   # Quality checks
│   │   └── prompts/                    # AI prompts
│   ├── tools/                          # Tool implementations
│   │   ├── figma-extractor.ts          # Figma API with Zod schemas
│   │   ├── mcp-figma-bridge.ts         # MCP Figma integration
│   │   ├── registry.ts                 # Component tracking
│   │   ├── reference-scanner.ts        # Existing component discovery
│   │   ├── vector-search.ts            # Semantic similarity search
│   │   ├── story-generator.ts          # Storybook story creation
│   │   ├── tool-executor.ts            # Agent tool implementations
│   │   └── design-tokens-extractor.ts  # Design token parsing
│   ├── types/                          # TypeScript type definitions
│   │   ├── workflow.ts                 # Workflow state types
│   │   ├── component.ts                # Component types
│   │   ├── figma.ts                    # Figma data types
│   │   ├── tools.ts                    # Tool types
│   │   └── index.ts                    # Unified exports
│   ├── config/                         # Configuration modules
│   │   ├── env.config.ts               # Environment variables
│   │   ├── openai-client.ts            # OpenAI setup
│   │   └── langsmith-config.ts         # LangSmith tracing
│   └── utils/                          # Utility functions
│       ├── validation-utils.ts         # TypeScript/ESLint validation
│       └── figma-tokens-parser.ts      # Token parsing
└── docs/                               # Documentation
    ├── ARCHITECTURE.md                 # System architecture
    ├── AGENTIC_SYSTEM.md              # Workflow details
    └── VISUAL_VALIDATION_PLAN.md      # Visual validation (planned)
```

## 🚀 Key Features

### 1. Fully Implemented TypeScript System
- **100% TypeScript**: All code migrated from JavaScript
- **Type Safety**: Comprehensive type definitions in `types/`
- **Zod Validation**: Structured AI outputs with runtime validation
- **Modern ES Modules**: Full ESM support throughout

### 2. LangGraph v1.0 Workflow
- **Annotation.Root State**: Modern state management pattern
- **Checkpointing**: Resume workflows after interruptions (MemorySaver)
- **Thread-based Execution**: Multi-run support with thread IDs
- **Validation Subgraph**: Dedicated TypeScript/ESLint validation with auto-fix
- **Conditional Routing**: Smart workflow branching based on analysis results

### 3. AI-Powered Component Generation
- **GPT-4o Vision**: Analyzes Figma screenshots for component extraction
- **Structured Outputs**: Zod schemas enforce consistent AI responses
- **Atomic Design Pattern**: Auto-categorizes into elements/components/modules
- **Vector Search**: Finds similar reference components for consistency
- **Auto-Fix Validation**: Automatically corrects TypeScript errors

### 4. MCP Integration
- **Figma MCP Bridge**: Direct Figma API access via MCP
- **Playwright Tools**: Browser automation for visual testing (planned)
- **Tool Executor**: Agent-callable tools for file operations

### 5. Storybook Integration
- **Auto-Generated Stories**: Creates `.stories.tsx` files from components
- **Variant Coverage**: Stories for all variants and states
- **Visual Testing Ready**: Prepared for screenshot comparison (planned)

## 🔄 Workflow Phases

The workflow executes in this order:

```
analyze → setup → generate → generate_stories → validate → finalize
```

### 1. **analyze** (Figma Analysis)
- Fetches Figma file via MCP
- GPT-4o Vision analyzes screenshot
- Extracts components, variants, design tokens
- Uses Zod schemas for structured output
- **Conditional routing**: If analysis fails, skip to finalize

### 2. **setup** (Load References)
- Scans existing component library
- Builds vector search index for similarity
- Initializes component registry
- Loads global CSS for token extraction

### 3. **generate** (AI Component Generation)
- AI agent generates React components
- Uses reference components for consistency
- Writes to `elements/`, `components/`, or `modules/`
- Tracks all generated components in registry

### 4. **generate_stories** (Storybook)
- Creates `.stories.tsx` for each component
- Generates stories for all variants/states
- Uses component metadata from registry

### 5. **validate** (Validation Subgraph)
Sub-workflow with automatic error correction:
- `final-check`: TypeScript + ESLint validation
- `typescript-fix`: AI fixes validation errors
- `route-validation`: Decides next action
- `quality-review`: Final quality checks
- **Loop**: Up to 3 attempts to fix errors

### 6. **finalize** (Results)
- Reports generation statistics
- Displays thread ID for resumption
- Flushes LangSmith traces

> **▶️ For usage instructions and examples**, see [agentic-system/README.md](agentic-system/README.md)

## 💾 State Management

Uses modern LangGraph `Annotation.Root` pattern with reducers:

```typescript
const WorkflowStateAnnotation = Annotation.Root({
  // Input fields
  figmaUrl: Annotation<string>(),
  outputDir: Annotation<string>({
    reducer: (existing, update) => update ?? existing,
    default: () => 'atomic-design-pattern/ui'
  }),

  // Analysis results
  figmaAnalysis: Annotation<FigmaAnalysis | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null
  }),

  // Component tracking
  generatedComponents: Annotation<number>({
    reducer: (existing, update) => update ?? existing,
    default: () => 0
  }),

  // Validation results (used by subgraph)
  validationResults: Annotation<Record<string, unknown>>({
    reducer: (existing, update) => update ?? existing,
    default: () => ({})
  }),

  // ... more fields
});
```

**Key features**:
- **Reducers**: Properly merge state updates between nodes
- **Defaults**: Auto-initialize fields from env vars
- **Type Safety**: Full TypeScript support via generics

## 🎨 Component Output Structure

Generated components follow atomic design principles:

```
OUTPUT_DIR/
├── elements/              # Atoms (Button, Input, Label)
│   ├── Button.tsx
│   ├── Button.stories.tsx
│   ├── Input.tsx
│   └── Input.stories.tsx
├── components/            # Molecules (Card, Modal, SearchBar)
│   ├── Card.tsx
│   ├── Card.stories.tsx
│   └── Modal.tsx
└── modules/               # Organisms (Header, Footer, Navigation)
    ├── Header.tsx
    └── Header.stories.tsx
```

Each component includes:
- TypeScript definitions
- Props interface with variants
- Tailwind CSS styling
- Storybook stories for all variants

## 📋 Implementation Status

### ✅ Implemented
- TypeScript migration (100% complete)
- LangGraph v1.0 workflow with Annotation.Root
- Checkpointing with MemorySaver
- Figma analysis with GPT-4o Vision
- Component generation with AI agent
- Storybook story generation
- TypeScript/ESLint validation with auto-fix
- Vector search for reference components
- MCP Figma integration
- LangSmith tracing

### 📋 Planned
- Visual validation with Playwright (see VISUAL_VALIDATION_PLAN.md)
- SQLite checkpointing (replace MemorySaver)
- Checkpoint management CLI
- Human-in-the-loop review UI

## 🔧 Development Guidelines

This system follows project CLAUDE.md principles:
- **TypeScript-first**: All new code in TypeScript
- **Incremental testing**: Test each node independently
- **Error handling**: Comprehensive try/catch with graceful degradation
- **Documentation**: Keep docs synced with code

---

## 📚 Additional Documentation

- **[agentic-system/README.md](agentic-system/README.md)** - Quick start, usage, checkpointing guide
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Detailed system architecture
- **[docs/AGENTIC_SYSTEM.md](docs/AGENTIC_SYSTEM.md)** - Workflow and node details
- **[docs/VISUAL_VALIDATION_PLAN.md](docs/VISUAL_VALIDATION_PLAN.md)** - Visual validation roadmap

---

**Last Updated**: November 14, 2025
**Status**: Production-ready workflow with TypeScript migration complete

**This README**: Architectural overview
**For Usage**: See [agentic-system/README.md](agentic-system/README.md)