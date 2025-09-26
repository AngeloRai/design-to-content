# Visual-First Component Generator

Transform any Figma design or screenshot into production-ready React components using **visual intelligence**. Simple, fast, and effective.

## What This Does

Point this tool at any UI design (Figma URL or screenshot) and get complete TypeScript React components with:

- **All visual variants** identified automatically
- **Proper TypeScript interfaces**
- **Tailwind CSS styling**
- **Atomic design classification** (atoms/molecules/organisms)
- **Production-ready code** saved to your project

## Quick Start

### 1. Setup

```bash
cd figma-processor
npm install

# Required: OpenAI API key
export OPENAI_API_KEY="your-openai-api-key"

# Optional: For Figma integration
export FIGMA_ACCESS_TOKEN="your-figma-token"
```

### 2. Run

```bash
# Test with included design system
node design-processor.js test

# Process your Figma URL
node design-processor.js process "https://figma.com/design/abc123?node-id=1:2"

# Process local screenshot
node design-processor.js process ./path/to/screenshot.png
```

### 3. Results

Components are automatically saved to:
```
nextjs-app/ui/
├── elements/      # Buttons, inputs, badges
├── components/    # Cards, form groups
└── modules/       # Complex layouts
```

## Example Output

```bash
✅ PROCESSING COMPLETE!
⏱️  Total time: 8.42s
Strategy Used: ATOM_GENERATION
Generated 10 components:
  📦 Atoms: 8
  🧩 Molecules: 2
  • Button → nextjs-app/ui/elements/Button.tsx
  • TextInput → nextjs-app/ui/elements/TextInput.tsx
  • Checkbox → nextjs-app/ui/elements/Checkbox.tsx
  • Switch → nextjs-app/ui/elements/Switch.tsx
  • Badge → nextjs-app/ui/elements/Badge.tsx
  • SearchForm → nextjs-app/ui/components/SearchForm.tsx
  • LoginCard → nextjs-app/ui/components/LoginCard.tsx
```

## Generated Component Example

```typescript
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Button({
  variant = 'default',
  size = 'md',
  disabled = false,
  className,
  children,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded transition-colors",
        {
          "bg-blue-500 text-white hover:bg-blue-600": variant === 'default',
          "bg-gray-500 text-white hover:bg-gray-600": variant === 'secondary',
          "bg-red-500 text-white hover:bg-red-600": variant === 'destructive',
          "border border-gray-300 bg-transparent hover:bg-gray-50": variant === 'outline',
          "bg-transparent text-gray-600 hover:bg-gray-100": variant === 'ghost',
          "text-blue-500 underline hover:no-underline": variant === 'link',
          "text-sm px-3 py-1.5": size === 'sm',
          "text-base px-4 py-2": size === 'md',
          "text-lg px-6 py-3": size === 'lg',
          "opacity-50 cursor-not-allowed": disabled,
        },
        className
      )}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
```

## How It Works

**AI-Driven Generation Process:**

1. **📸 Screenshot**: Get visual representation from Figma or local file
2. **🔍 AI Analysis**: GPT-4o Vision identifies all components and variants
3. **🤖 Smart Routing**: AI decides optimal generation strategy (atoms vs molecules vs mixed)
4. **⚡ Generate**: Specialized generators create components with library awareness
5. **🔗 Track Dependencies**: System tracks molecule-atom relationships
6. **💾 Save**: Components saved intelligently, avoiding duplicates

**Key Features:**

- **AI-Driven Strategy**: Intelligent routing between atom, molecule, and mixed generation
- **Component Deduplication**: Won't regenerate existing components unless improvements detected
- **Dependency Tracking**: Prevents breaking changes when updating atoms used by molecules
- **Library Awareness**: Scans existing components and builds on them intelligently
- **Figma Integration**: Direct URL processing with exact measurements
- **Production Ready**: Complete TypeScript + Tailwind components with proper interfaces

## Requirements

- **Node.js** v18+
- **OpenAI API Key** with GPT-4 access
- **Figma Access Token** (optional, for Figma URLs)

## Configuration

The system is controlled through AI prompts embedded in the generators:

- **Visual Analysis**: Prompts in `utils/engines/visual-analysis-engine.js`
- **Atom Generation**: Prompts in `generators/atom-generator.js`
- **Molecule Generation**: Prompts in `generators/molecule-generator.js`
- **AI Routing**: Decision prompts in `generators/ai-generation-router.js`

## Troubleshooting

**"OpenAI API error"**
- Verify `OPENAI_API_KEY` is set and has GPT-4 access

**"Figma API error"**
- Check `FIGMA_ACCESS_TOKEN` is valid
- Ensure you have access to the Figma file
- Verify URL format: `https://figma.com/design/FILE-KEY?node-id=NODE-ID`

**"No components generated"**
- Ensure screenshot contains clear UI components
- Try with a simpler design first
- Check OpenAI API status

## Data Folder Structure

The `figma-processor/data/` folder contains all generated files and caches organized by purpose:

### 📁 Core Data Files

**`library-docs.json`** 🔄 *Auto-regenerated*
- **Purpose**: Component library documentation cache
- **Content**: All atoms/molecules with interfaces, variants, dependencies
- **Usage**: Regenerated on each AI generation run for intelligent component deduplication
- **Format**: Structured JSON with component metadata, TypeScript interfaces, usage examples

**`dependency-registry.json`** 🔄 *Auto-regenerated*
- **Purpose**: Tracks which molecules use which atoms
- **Content**: Atom usage mapping and molecule dependency tracking
- **Usage**: Prevents breaking changes when updating atoms used by existing molecules
- **Regeneration**: Automatically synced with component files on each run

### 📁 Process Data Folders

**`screenshots/`**
- **Purpose**: Figma design exports and local images for processing
- **Content**: PNG files from Figma API or user uploads
- **Cleanup**: Contains working images, safe to clean periodically

**`self-review-reports/`**
- **Purpose**: AI-generated quality assessments of generated components
- **Content**: JSON reports with component analysis, recommendations, quality scores
- **Usage**: Post-generation validation and improvement suggestions

**`analysis/`**
- **Purpose**: Visual analysis results and development artifacts
- **Content**: Cached AI analysis outputs from processing runs
- **Cleanup**: Development cache, can be cleaned periodically

### 🧹 Maintenance Commands

```bash
# Clean old analysis cache (optional)
rm -rf data/analysis/*

# Clean old screenshots (optional)
find data/screenshots -name "*.png" -mtime +7 -delete  # Remove screenshots older than 7 days

# Clean old self-review reports (optional)
find data/self-review-reports -name "*.json" -mtime +30 -delete  # Remove reports older than 30 days
```

### 📊 Data Regeneration

Core data files regenerate automatically on each generation run:
- **`library-docs.json`**: Scans all components in `nextjs-app/ui/`
- **`dependency-registry.json`**: Rebuilds from actual component imports

## Architecture

**AI-Driven Generation System:**
```
generators/
├── ai-generation-router.js     # Intelligent strategy routing
├── atom-generator.js           # Simple component generation
└── molecule-generator.js       # Composed component generation

utils/
├── library-doc.js             # Component documentation engine
├── dependency-registry.js     # Molecule-atom dependency tracking
└── figma-utils.js             # Figma API integration
```

**Data Flow:**
```
Input → Screenshot → AI Analysis → Smart Routing → Generate → Save → Update Registry
```

## License

MIT - Use freely for any project.

---

**From design to code in seconds. Visual intelligence meets functional simplicity.**