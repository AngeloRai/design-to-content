# Design-to-Content: AI-Centric Figma Component Generator

Transform any Figma design into pixel-perfect React components using OpenAI's intelligence and function calling. No rigid rules, no predetermined patterns - just AI autonomy applied to design-to-code conversion.

## Project Structure

```
design-to-content/
├── figma-processor/     # AI-centric Figma processor
│   ├── ai-processor.js  # Main AI workflow controller
│   ├── tools/           # AI function calling tools
│   ├── utils/           # Core utilities and logging
│   ├── config/          # AI prompts and tool definitions
│   ├── components/      # Generated React components
│   ├── logs/            # Session logs for debugging
│   └── test/            # Step-by-step testing tools
└── nextjs-app/          # Next.js frontend (optional)
    ├── ui/              # Generated components can be copied here
    ├── app/             # Next.js app router
    └── lib/             # Frontend utilities
```

## Quick Start

### 1. Setup Environment
```bash
cd figma-processor

# Set your API keys
export FIGMA_ACCESS_TOKEN="your-figma-access-token"
export OPENAI_API_KEY="your-openai-api-key"
```

### 2. Process Figma Components
```bash
# AI processes any Figma URL autonomously
node ai-processor.js "https://www.figma.com/file/YOUR_FILE_KEY/Design?node-id=123:456"
```

### 3. View Generated Components
```bash
# Components are saved to figma-processor/components/
ls components/

# View session logs for debugging
node utils/log-viewer.js list
```

## How It Works

### AI-Centric Workflow
OpenAI controls the entire process using function calling. The AI decides:

1. **How to explore** Figma designs (parse URLs, get node data)
2. **What to analyze** (take screenshots, understand structure)
3. **Which components to create** (filter UI elements, group variants)
4. **How to generate code** (write React components naturally)

### Tools Available to AI

**Figma Integration:**
- `get_figma_node` - Fetch node data and structure from Figma
- `get_figma_screenshot` - Get visual screenshots for analysis
- `parse_figma_url` - Extract file keys and node IDs from URLs

**Component Analysis:**
- `analyze_component_variants` - Identify variant patterns and relationships
- `extract_component_structure` - Analyze internal component structure
- `identify_ui_elements` - Filter nodes to find actual UI components

**File Management:**
- `save_component` - Save AI-generated React code to filesystem
- `list_components` - List existing components for updates

### Visual-First Analysis

The AI uses screenshots as the primary source of truth:
- Takes visual screenshots before making component decisions
- Compares variants visually to identify relationships
- Generates code based on what it actually sees, not metadata

## Environment Variables

Set these environment variables before running:

```bash
FIGMA_ACCESS_TOKEN=your_figma_token
OPENAI_API_KEY=your_openai_key
```

## Example Workflow

```bash
cd figma-processor

# Set environment variables
export FIGMA_ACCESS_TOKEN="figd_..."
export OPENAI_API_KEY="sk-..."

# Process any Figma design
node ai-processor.js "https://www.figma.com/file/abc123/My-Design?node-id=29:1058"

# AI will:
# 1. Parse the URL and extract file key/node ID
# 2. Get node data and take screenshots
# 3. Analyze component structure and variants
# 4. Write React components based on visual analysis
# 5. Save components with proper organization

# View results
ls components/        # See generated components
cat logs/session-*.log # View detailed session log
```

## Benefits of AI-Centric Architecture

- **True AI Autonomy**: OpenAI controls the entire workflow
- **Adapts to Any Design**: No rigid rules or predetermined patterns
- **Visual Intelligence**: Screenshots drive component decisions
- **Natural Code Generation**: AI writes React code based on what it sees
- **Complete Transparency**: Real-time logging shows AI's thinking process

## Generated Components

Components are saved to:
- `nextjs-app/ui/elements/` - Buttons, inputs, badges, etc.
- `nextjs-app/ui/icons/` - SVG icon components

Each component includes:
- TypeScript interfaces
- Tailwind CSS styling
- Variant support (size/style/state)
- Interactive states (hover, focus, disabled)

## Development

### Server Development
```bash
cd server
npm run dev     # Auto-restart on changes
```

### Next.js Development
```bash
cd nextjs-app
npm run dev     # Hot reload
```

This architecture provides a clean, scalable approach to AI-powered design-to-code generation!