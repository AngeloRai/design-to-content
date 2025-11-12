# Agentic Component Generator

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
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys

# Run the workflow
node index.js "https://figma.com/design/YOUR_FILE?node-id=1-2"
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
node index.js "https://figma.com/design/..."
```

Output:
```
💾 Checkpoint Thread ID: run-1234567890-abcdef12
   Resume this workflow: node index.js --resume=run-1234567890-abcdef12
   (Workflow state is preserved in memory for this session)
```

#### Resume an Interrupted Workflow

If the workflow is interrupted (Ctrl+C, crash, timeout), you can resume:

```bash
node index.js --resume=run-1234567890-abcdef12
```

**Note**: MemorySaver checkpoints are only preserved for the current process. If you restart the Node.js process, checkpoints are lost. For persistent checkpoints, we'll add SqliteSaver in the future.

#### Use a Custom Thread ID

For testing or debugging, specify your own thread ID:

```bash
node index.js "https://figma.com/..." --thread-id=my-debug-session
```

### Common Use Cases

#### 1. Review Figma Analysis Before Generation

```bash
# Start workflow, interrupt after Figma analysis
node index.js "https://figma.com/..."
# Review what components were detected
# Then resume to continue generation
node index.js --resume=run-1234567890-abcdef12
```

#### 2. Recover from Failures

If the workflow fails due to API timeout, network issues, or errors:

```bash
# Workflow fails during component generation
# Fix the issue (check network, API limits, etc.)
# Resume from where it left off
node index.js --resume=run-1234567890-abcdef12
```

#### 3. Debugging Specific Nodes

```bash
# Use consistent thread ID for debugging
node index.js "https://figma.com/..." --thread-id=debug-validation

# Make code changes to a specific node
# Resume with same thread ID to replay from that node
node index.js --resume=debug-validation
```

## Environment Variables

### Required

```env
# OpenAI API Key
OPENAI_API_KEY=sk-...

# Figma Access Token
FIGMA_ACCESS_TOKEN=figd_...
```

### Optional

```env
# Checkpointing (enabled by default)
ENABLE_CHECKPOINTING=true

# LangSmith Tracing
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_...
LANGSMITH_PROJECT=design-to-code-system
LANGSMITH_WORKSPACE_ID=...

# Model Configuration
DEFAULT_MODEL=gpt-4o
FALLBACK_MODEL=gpt-4o-mini

# Output Configuration
OUTPUT_DIR=atomic-design-pattern/ui

# Debugging
DEBUG=true
LOG_LEVEL=info
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

```
design-to-code-system/
├── agentic-system/
│   ├── index.js                 # Entry point with checkpointing
│   ├── workflow/
│   │   ├── graph.js            # LangGraph workflow definition (with MemorySaver)
│   │   └── nodes/              # Workflow node implementations
│   ├── config/
│   │   ├── env.config.js       # Environment configuration (with checkpointing)
│   │   └── langsmith-config.js # LangSmith tracing setup
│   ├── tools/
│   │   └── figma-extractor.js  # Figma API integration
│   └── utils/
│       ├── validation-utils.js  # TypeScript/ESLint validation
│       └── tool-executor.js     # AI agent tools
```

## LangSmith Integration

View detailed traces of your workflow execution in LangSmith:

```bash
# Enable tracing in .env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_...

# Run workflow
node index.js "https://figma.com/..."

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
