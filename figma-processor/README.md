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
node design-to-code.js test

# Process your Figma URL
node design-to-code.js process "https://figma.com/design/abc123?node-id=1:2"

# Process local screenshot
node design-to-code.js process ./path/to/screenshot.png
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
Generated 10 components:
  • Button → nextjs-app/ui/elements/Button.tsx
  • TextInput → nextjs-app/ui/elements/TextInput.tsx
  • Checkbox → nextjs-app/ui/elements/Checkbox.tsx
  • Switch → nextjs-app/ui/elements/Switch.tsx
  • Badge → nextjs-app/ui/elements/Badge.tsx
  • Avatar → nextjs-app/ui/components/Avatar.tsx
  • Alert → nextjs-app/ui/modules/Alert.tsx
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

**Visual-First Process:**

1. **📸 Screenshot**: Get visual representation from Figma or local file
2. **🔍 AI Analysis**: GPT-4 Vision identifies all components and variants
3. **⚡ Generate**: Single prompt creates all components at once
4. **💾 Save**: Components saved to proper directories automatically

**Key Features:**

- **Visual Intelligence**: AI sees your design and understands what to build
- **Figma Integration**: Direct URL processing with exact measurements
- **One-Shot Generation**: No complex loops or refinements
- **Production Ready**: Complete TypeScript + Tailwind components
- **Atomic Design**: Proper classification and organization

## Requirements

- **Node.js** v18+
- **OpenAI API Key** with GPT-4 access
- **Figma Access Token** (optional, for Figma URLs)

## Configuration

The system is controlled through AI prompts rather than config files:

- **Visual Analysis**: Modify prompts in `engines/visual-analysis-engine.js`
- **Component Generation**: Update prompts in `design-to-code.js`
- **Output Format**: Adjust component templates in generation prompt

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

## Architecture

**Simple & Clean:**
```
design-to-code.js            # Main processor
utils/figma-utils.js         # Figma API integration
engines/visual-analysis-engine.js  # GPT-4 Vision analysis
```

**Data Flow:**
```
Input → Screenshot → Visual Analysis → Component Generation → Save
```

## License

MIT - Use freely for any project.

---

**From design to code in seconds. Visual intelligence meets functional simplicity.**