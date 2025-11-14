# Agentic Component Generator

**Quick Start & Usage Guide**

> **📐 Looking for architecture details?** See [../README.md](../README.md) for system overview and [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for detailed architecture.

An AI-powered system that automatically generates React components from Figma designs using LangGraph workflows.

## Features

- **Figma Analysis**: Automatically extracts components and design tokens from Figma files
- **AI-Powered Generation**: Uses OpenAI GPT-4 to generate production-ready React components
- **Atomic Design Pattern**: Organizes components into elements, components, and modules
- **Validation & Auto-Fix**: TypeScript and ESLint validation with automatic error correction
- **Storybook Stories**: Generates Storybook stories for visual testing
- **Checkpointing**: Resume workflows after interruptions or failures
- **LangSmith Tracing**: Full observability with LangSmith integration

## Quick Start

```bash
# Install dependencies (from design-to-code-system root)
cd design-to-code-system
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY and FIGMA_ACCESS_TOKEN

# Run the workflow
npx tsx agentic-system/index.ts "https://figma.com/design/YOUR_FILE?node-id=1-2"
```

## Checkpointing & Resume Capability

The workflow now supports checkpointing, which enables powerful features:

### What is Checkpointing?

Checkpointing automatically saves the workflow state at each node, allowing you to:
- Resume workflows after crashes or interruptions
- Pause to review intermediate results
- Replay from specific nodes during development
- Inspect state for debugging

### How to Use Checkpointing

#### Basic Usage (Auto-Generated Thread ID)

When you run a workflow, a thread ID is automatically generated:

```bash
npx tsx agentic-system/index.ts "https://figma.com/design/..."
```

Output:
```
💾 Checkpoint Thread ID: run-1234567890-abcdef12
   Resume this workflow: npx tsx agentic-system/index.ts --resume=run-1234567890-abcdef12
   (Workflow state is preserved in memory for this session)
```

#### Resume an Interrupted Workflow

If the workflow is interrupted (Ctrl+C, crash, timeout), you can resume:

```bash
npx tsx agentic-system/index.ts --resume=run-1234567890-abcdef12
```

**Note**: MemorySaver checkpoints are only preserved for the current process. If you restart the Node.js process, checkpoints are lost. For persistent checkpoints, we'll add SqliteSaver in the future.

#### Use a Custom Thread ID

For testing or debugging, specify your own thread ID:

```bash
npx tsx agentic-system/index.ts "https://figma.com/..." --thread-id=my-debug-session
```

### Common Use Cases

#### 1. Single Figma Node

```bash
# Generate components from a single Figma node
npx tsx agentic-system/index.ts "https://figma.com/design/FILE?node-id=1-2"
```

#### 2. Multi-Node Workflow (Recommended)

```bash
# Process atoms, molecules, and organisms separately
FIGMA_ATOMS="https://figma.com/design/FILE?node-id=1-2" \
FIGMA_MOLECULES="https://figma.com/design/FILE?node-id=3-4" \
FIGMA_ORGANISMS="https://figma.com/design/FILE?node-id=5-6" \
npx tsx agentic-system/index.ts
```

#### 3. Review Figma Analysis Before Generation

```bash
# Start workflow, interrupt after Figma analysis
npx tsx agentic-system/index.ts "https://figma.com/..."
# Review what components were detected
# Then resume to continue generation
npx tsx agentic-system/index.ts --resume=run-1234567890-abcdef12
```

#### 4. Recover from Failures

If the workflow fails due to API timeout, network issues, or errors:

```bash
# Workflow fails during component generation
# Fix the issue (check network, API limits, etc.)
# Resume from where it left off
npx tsx agentic-system/index.ts --resume=run-1234567890-abcdef12
```

#### 5. Debugging Specific Nodes

```bash
# Use consistent thread ID for debugging
npx tsx agentic-system/index.ts "https://figma.com/..." --thread-id=debug-validation

# Make code changes to a specific node
# Resume with same thread ID to replay from that node
npx tsx agentic-system/index.ts --resume=debug-validation
```

## Environment Variables

### Required

```env
# OpenAI API Key
OPENAI_API_KEY=sk-...

# Figma Access Token
FIGMA_ACCESS_TOKEN=figd_...
```

### Optional - Workflow Configuration

```env
# Multi-node workflow (recommended for atomic design)
FIGMA_ATOMS=https://figma.com/design/...?node-id=1-2
FIGMA_MOLECULES=https://figma.com/design/...?node-id=3-4
FIGMA_ORGANISMS=https://figma.com/design/...?node-id=5-6

# Or single URL workflow
FIGMA_URL=https://figma.com/design/...?node-id=1-2

# Output directory (default: atomic-design-pattern/ui)
OUTPUT_DIR=atomic-design-pattern/ui

# Checkpointing (enabled by default)
ENABLE_CHECKPOINTING=true
```

### Optional - LangSmith Tracing

```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_...
LANGSMITH_PROJECT=design-to-code-system
LANGSMITH_WORKSPACE_ID=...  # Required when tracing is enabled
```

### Optional - Model Configuration

```env
DEFAULT_MODEL=gpt-4o
FALLBACK_MODEL=gpt-4o-mini
```

## Workflow Nodes

The LangGraph workflow consists of these nodes:

1. **analyze**: Extract components and design tokens from Figma
2. **setup**: Load reference components and initialize vector search
3. **generate**: Generate React components using AI
4. **generate_stories**: Create Storybook stories for each component
5. **validate**: Run TypeScript/ESLint validation with auto-fix
6. **finalize**: Clean up and report results

## Architecture

**TypeScript Implementation**:

```
design-to-code-system/
├── agentic-system/
│   ├── index.ts                   # Entry point with checkpointing
│   ├── workflow/
│   │   ├── graph.ts               # LangGraph workflow (StateGraph + MemorySaver)
│   │   ├── nodes/                 # Workflow node implementations
│   │   │   ├── analyze.ts         # Figma analysis with GPT-4o Vision
│   │   │   ├── setup.ts           # Load references & vector search
│   │   │   ├── generate.ts        # AI component generation
│   │   │   ├── generate-stories.ts # Storybook story generation
│   │   │   ├── validate.ts        # Validation subgraph
│   │   │   ├── finalize.ts        # Results reporting
│   │   │   └── validation/        # Validation subnodes
│   │   └── prompts/               # AI prompts
│   ├── config/
│   │   ├── env.config.ts          # Environment configuration
│   │   ├── openai-client.ts       # OpenAI setup
│   │   └── langsmith-config.ts    # LangSmith tracing
│   ├── tools/                     # Tool implementations
│   │   ├── figma-extractor.ts     # Figma API + Zod schemas
│   │   ├── mcp-figma-bridge.ts    # MCP Figma integration
│   │   ├── registry.ts            # Component registry
│   │   ├── vector-search.ts       # Semantic search
│   │   ├── story-generator.ts     # Story generation
│   │   └── tool-executor.ts       # Agent tools
│   ├── types/                     # TypeScript type definitions
│   └── utils/
│       └── validation-utils.ts    # TypeScript/ESLint validation
```

> **📐 For detailed architecture**, see [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)

## LangSmith Integration

View detailed traces of your workflow execution in LangSmith:

```bash
# Enable tracing in .env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_...

# Run workflow
npx tsx agentic-system/index.ts "https://figma.com/..."

# Visit URL shown in output:
# https://smith.langchain.com/o/projects/p/design-to-code-system
```

## Future Enhancements

- **Persistent Checkpoints**: Replace MemorySaver with SqliteSaver for disk-based checkpoints
- **Checkpoint Management CLI**: List, inspect, and delete checkpoints
- **Human-in-the-Loop UI**: Web interface for reviewing and approving components
- **Automatic Checkpoint Cleanup**: Remove old checkpoints automatically

## Troubleshooting

### Checkpoint Not Found

If you see "checkpoint not found" when resuming:
- MemorySaver only persists checkpoints in memory during the process lifetime
- Restarting Node.js clears all checkpoints
- Use the same Node.js process to resume, or wait for SqliteSaver implementation

### Workflow Stuck/Hanging

If the workflow hangs:
1. Press Ctrl+C to interrupt
2. Check LangSmith traces for the stuck node
3. Fix the issue (API limits, network, etc.)
4. Resume with `--resume=<thread-id>`

## Contributing

See [ARCHITECTURE.md](../docs/ARCHITECTURE.md) for detailed system design and contribution guidelines.

## License

MIT
