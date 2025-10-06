# Debug Utilities

This directory contains tools for debugging and inspecting the design-to-code workflow.

## Enabling Debug Mode

Add to your `.env` file:
```bash
DEBUG=true
```

When enabled, the system will:
- Save Figma screenshots to `debug/screenshots/`
- Save full AI analysis reports to `debug/analysis-reports/`
- Print detailed console logs showing extracted tokens and visual properties

## Available Tools

### 1. View Screenshots

View the latest Figma screenshot captured during analysis:

```bash
node debug/view-screenshot.js
```

**What it does:**
- Opens the most recent screenshot in your default image viewer
- Lists all available screenshots
- Helps you verify what the AI actually "saw"

**Use when:**
- AI generates incorrect colors/styles
- You want to verify the screenshot quality
- Checking if the right Figma frame was captured

---

### 2. View Analysis Reports

Inspect the design analysis extracted by AI:

```bash
# View summary of latest analysis
node debug/view-analysis.js

# View full details for specific component
node debug/view-analysis.js Button
```

**What it shows:**
- All components found in the design
- Style variants, size variants, states
- Extracted design tokens (colors, spacing, typography)
- Variant visual map (pixel-perfect styling data)

**Use when:**
- Generated component doesn't match design
- Want to see what colors/spacing were extracted
- Debugging variant mapping issues

---

## Understanding the Output

### Analysis Report Structure

```json
{
  "timestamp": "2025-10-02T14:30:00.000Z",
  "screenshotUrl": "https://figma.com/...",
  "componentMetadata": { ... },
  "aiAnalysis": {
    "componentCount": 1,
    "components": [
      {
        "name": "Button",
        "styleVariants": ["solid-black", "solid-gold", "outline", "ghost"],
        "designTokens": {
          "colors": [
            {
              "hex": "#000000",
              "role": "background",
              "variant": "solid-black",
              "state": "default"
            }
          ]
        },
        "variantVisualMap": [
          {
            "variantName": "solid-black",
            "visualProperties": {
              "backgroundColor": "#000000",
              "textColor": "#ffffff",
              "borderRadius": "4px",
              "padding": "12px 24px"
            }
          }
        ]
      }
    ]
  }
}
```

### Design Tokens (Structured Format)

**Old Format (Generic):**
```json
{
  "colors": ["#000000", "#ffffff", "#ebc060"]
}
```
❌ No context - AI has to guess where each color is used!

**New Format (Structured):**
```json
{
  "colors": [
    {
      "hex": "#000000",
      "role": "background",
      "variant": "solid-black",
      "state": "default"
    },
    {
      "hex": "#ffffff",
      "role": "text",
      "variant": "solid-black",
      "state": "default"
    },
    {
      "hex": "#ebc060",
      "role": "background",
      "variant": "solid-gold",
      "state": "default"
    }
  ]
}
```
✅ Explicit context - AI knows EXACTLY how to use each color!

### Variant Visual Map

The most important field for pixel-perfect generation:

```json
{
  "variantName": "solid-black",
  "visualProperties": {
    "backgroundColor": "#000000",      // ← Maps to: bg-black or bg-[#000000]
    "textColor": "#ffffff",             // ← Maps to: text-white
    "borderColor": "transparent",       // ← Maps to: border-0
    "borderWidth": "0",
    "borderRadius": "4px",              // ← Maps to: rounded
    "padding": "12px 24px",             // ← Maps to: px-6 py-3
    "fontSize": "14px",                 // ← Maps to: text-sm
    "fontWeight": "500",                // ← Maps to: font-medium
    "shadow": "none"
  }
}
```

This tells the code generator **EXACTLY** how to style each variant - no guessing!

---

## Troubleshooting

### No screenshots found

1. Check that DEBUG=true is in your .env
2. Run the workflow: `npm run dev`
3. Make sure the workflow completed analysis phase

### Analysis shows wrong colors

1. Open the screenshot: `node debug/view-screenshot.js`
2. Verify it's the correct Figma frame
3. Check if colors are visible enough for AI to extract
4. Consider the screenshot quality/resolution

### variantVisualMap is empty

- AI couldn't confidently extract visual properties
- Screenshot might not show variants clearly
- Try a Figma frame that shows all variants side-by-side

---

## File Locations

```
debug/
├── README.md                           # This file
├── view-screenshot.js                  # Screenshot viewer utility
├── view-analysis.js                    # Analysis viewer utility
├── screenshots/                        # Figma screenshots
│   └── figma-2025-10-02T14-30-00.png
└── analysis-reports/                   # AI analysis JSON
    └── analysis-2025-10-02T14-30-00.json
```

---

## Tips for Better Analysis

1. **Use clear Figma frames**: Show all variants in one frame
2. **Label variants**: Add text labels in Figma for clarity
3. **Show states side-by-side**: Default, hover, disabled states together
4. **Include measurements**: Figma's dev mode measurements help
5. **High contrast**: Ensure colors are distinct and visible

---

## Disabling Debug Mode

Remove or comment out from `.env`:
```bash
# DEBUG=true
```

Debug files are automatically excluded from git (see `.gitignore`).
