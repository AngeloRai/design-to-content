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

#### Create Environment File
```bash
# Copy the example environment file to the project root
cp .env.example .env
```

#### Configure API Keys
Edit the `.env` file and add your API keys:

```bash
# Required: OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Required: Figma Access Token
FIGMA_ACCESS_TOKEN=figd_your-figma-token-here
```

**Getting your API keys:**

1. **OpenAI API Key**
   - Visit: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)
   - Paste into `.env` file

2. **Figma Access Token**
   - Visit: https://www.figma.com/settings
   - Scroll to "Personal Access Tokens"
   - Click "Generate new token"
   - Copy the token (starts with `figd_`)
   - Paste into `.env` file

> **⚠️ Important:** Never commit the `.env` file to git. It contains sensitive credentials and is already in `.gitignore`.

#### Optional Configuration
The `.env.example` file includes many optional settings you can configure:
- Model selection (GPT-4o, GPT-4o-mini, etc.)
- Cost limits and tracking
- Performance monitoring
- Debug mode

See `.env.example` for full documentation of all available options.

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

All environment variables should be set in the `.env` file in the project root.

### Required Variables

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=sk-your-key-here

# Figma Access Token (required)
FIGMA_ACCESS_TOKEN=figd_your-token-here
```

### Optional Variables

For a complete list of optional configuration variables, see the `.env.example` file. Key options include:

- **Model Configuration**: `DEFAULT_MODEL`, `FALLBACK_MODEL`, `AVAILABLE_MODELS`
- **Cost Management**: `MAX_SESSION_COST`, `MAX_TASK_COST`, `ENABLE_COST_TRACKING`
- **Performance**: `SIMPLE_THRESHOLD`, `COMPLEX_THRESHOLD`, `PREFER_SPEED`, `PREFER_QUALITY`
- **Debug/Logging**: `DEBUG`, `LOG_LEVEL`, `ENABLE_PERFORMANCE_MONITORING`
- **Output**: `OUTPUT_PATH`

Run `cat .env.example` to see detailed documentation for each variable.

## Example Workflow

```bash
# 1. Setup (one time only)
cp .env.example .env
# Edit .env and add your API keys

# 2. Run the workflow with a Figma URL
cd design-to-code-system
npm run figma:workflow "https://www.figma.com/file/abc123/My-Design?node-id=29:1058"

# The workflow will:
# 1. Parse the URL and extract file key/node ID
# 2. Get node data and take screenshots
# 3. Analyze components visually (using AI)
# 4. Plan component strategy (create/update/skip)
# 5. Generate React TypeScript components
# 6. Save components to nextjs-app/ui/
# 7. Generate comprehensive reports (markdown + JSON)

# 3. View results
ls nextjs-app/ui/elements/     # Generated atomic components
ls nextjs-app/ui/icons/        # Generated icon components
cat reports/workflow-report-*.md   # Human-readable summary
cat reports/workflow-report-*.json # Full workflow data

# 4. Preview components
cd nextjs-app
npm run dev                    # Start Next.js dev server
# Visit http://localhost:3000/ui-showcase
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