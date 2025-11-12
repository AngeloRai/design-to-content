# Implementation Plan: Figma MCP Extractor + Design Tokens

**Goal:** Replace REST API-based Figma extractor with MCP approach that extracts design tokens and uses `get_code` for detailed component analysis.

**Strategy:** Incremental implementation with testing at each step.

---

## ✅ STEP 1: Create Design Token Extractor (Basic)

### Implementation

**File:** `agentic-system/tools/design-tokens-extractor.js`

**Functions:**
```javascript
1. extractDesignTokens(variablesJson)
   - Parse Figma variables from MCP get_variable_defs
   - Organize into: colors, typography, spacing, borderRadius
   - Return structured token object

2. generateTailwindV4Css(tokens)
   - Convert tokens to Tailwind v4 @theme directive syntax
   - Use proper namespaces (--color-*, --font-*, --spacing-*, --radius-*)
   - Return CSS string

3. saveDesignTokens(css, outputPath)
   - Write CSS to file
   - Create directory if needed
```

### Test

**File:** `examples/test-design-tokens.js`

```javascript
- Connect to MCP bridge
- Call get_variable_defs on selected node
- Parse variables
- Generate CSS
- Log: variable count, token count, CSS preview
- Verify: Valid @theme syntax
```

### Expected Output
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: Design Token Extraction
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Variables extracted: 33
✅ Tokens generated:
   - Colors: 10
   - Typography: 15
   - Spacing: 4
   - Border Radius: 4
✅ CSS Preview:
@theme {
  --color-primary-black: #000000;
  --color-primary-red-100: #da1b31;
  ...
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Commit
```
feat: add design token extraction with Tailwind v4 support
```

### ✋ PAUSE - Verify before continuing

---

## ☐ STEP 2: Add Token Inference (Fallback)

### Implementation

**Update:** `agentic-system/tools/design-tokens-extractor.js`

**Add function:**
```javascript
inferTokensFromCode(codeSnippets)
  - Extract CSS properties from get_code results
  - Group similar values:
    - Colors: All #RRGGBB values
    - Fonts: font-family declarations
    - Spacing: padding/margin values
    - Border radius: border-radius values
  - Generate semantic names (primary, secondary, etc.)
  - Return same token structure
```

### Test

**File:** `examples/test-token-inference.js`

```javascript
- Get get_code for 3-5 components
- Extract style properties
- Infer tokens
- Generate CSS
- Log: inferred token count, comparison with visual
- Verify: Tokens make sense for the design
```

### Expected Output
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: Token Inference (No Variables Available)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Components analyzed: 5
✅ Inferred tokens:
   - Colors: 8 (from button backgrounds, text)
   - Fonts: 2 families, 4 sizes
   - Spacing: 6 values
   - Border Radius: 3 values
✅ CSS Generated: Valid @theme CSS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Commit
```
feat: add token inference from component code
```

### ✋ PAUSE - Verify before continuing

---

## ☐ STEP 3: Refactor Figma Extractor (Core MCP)

### Implementation

**Update:** `agentic-system/tools/figma-extractor.js`

**Changes:**
1. Add `bridge` parameter to `extractFigmaDesign(figmaUrl, bridge)`
2. Remove: `fetchFigmaScreenshot`, `fetchFigmaNodeData` (REST API)
3. Add MCP calls:
   ```javascript
   - const metadata = await bridge.callTool('get_metadata', { nodeId })
   - const screenshot = await bridge.callTool('get_screenshot', { nodeId })
   ```
4. Keep: Existing GPT-4o analysis logic
5. Return: Same structure (backward compatible)

### Test

**File:** `examples/test-mcp-extractor.js`

```javascript
- Create bridge
- Run extraction on test URL
- Log: metadata size, screenshot URL, component count
- Compare: Time vs old approach
- Verify: Same components identified
```

### Expected Output
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: MCP-Based Extraction
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Metadata fetched: 1.2s (vs 3.5s REST API)
✅ Screenshot URL: data:image/png;base64...
✅ Components identified: 7
✅ Analysis complete: 5.8s total (vs 8.2s before)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Commit
```
refactor: migrate figma extractor to MCP bridge
```

### ✋ PAUSE - Verify before continuing

---

## ☐ STEP 4: Add get_code Integration

### Implementation

**Update:** `agentic-system/tools/figma-extractor.js`

**Changes:**
1. Parse metadata XML to extract child node IDs
2. For each child node:
   ```javascript
   const code = await bridge.callTool('get_code', {
     nodeId: childId,
     clientLanguages: 'typescript',
     clientFrameworks: 'react'
   })
   const screenshot = await bridge.callTool('get_screenshot', {
     nodeId: childId
   })
   ```
3. Update ComponentSpecSchema:
   ```javascript
   figmaCode: z.object({
     html: z.string().optional(),
     css: z.string().optional(),
     props: z.array(z.string()).optional(),
     variants: z.array(z.string()).optional(),
   }).optional()
   ```
4. Update AI prompt to reference code data

### Test

**File:** `examples/test-code-extraction.js`

```javascript
- Extract with code enabled
- Log: HTML, CSS for each component
- Verify: Code quality and completeness
- Check: Props extracted correctly
```

### Expected Output
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: get_code Integration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Children found: 7
✅ Component: Button Variants
   HTML: <div class="button">...</div>
   CSS: .button { background: #1E293B; ... }
   Props: ["variant", "size", "disabled"]
✅ All components have code + screenshot
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Commit
```
feat: integrate get_code for detailed component analysis
```

### ✋ PAUSE - Verify before continuing

---

## ☐ STEP 5: Integrate Tokens into Extraction

### Implementation

**Update:** `agentic-system/tools/figma-extractor.js`

**Changes:**
1. Import design token extractor
2. Call `get_variable_defs` first
3. Extract tokens:
   ```javascript
   const variables = await bridge.callTool('get_variable_defs', { nodeId })
   let tokens;
   if (hasVariables(variables)) {
     tokens = extractDesignTokens(variables)
   } else {
     // Collect code from all children first
     tokens = inferTokensFromCode(childrenCode)
   }
   ```
4. Return tokens with result

### Test Files
1. `examples/test-tokens-with-variables.js` - File that has variables
2. `examples/test-tokens-without-variables.js` - File without variables

### Expected Output
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5A: Tokens WITH Variables
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Variables found: Yes
✅ Tokens extracted: 33
✅ Token categories: colors, typography, spacing, radius
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5B: Tokens WITHOUT Variables (Inferred)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Variables found: No
✅ Components analyzed: 7
✅ Tokens inferred: 24
✅ Token categories: colors, typography, spacing, radius
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Commit
```
feat: add design token extraction to figma workflow
```

### ✋ PAUSE - Verify before continuing

---

## ☐ STEP 6: Update Workflow Analyze Node

### Implementation

**Update:** `agentic-system/workflow/nodes/analyze.js`

```javascript
import { createFigmaBridge } from '../../utils/mcp-figma-bridge.js';
import { saveDesignTokens } from '../../tools/design-tokens-extractor.js';

export async function analyzeNode(state) {
  console.log('━'.repeat(60))
  console.log('STEP 6: Workflow Integration')
  console.log('━'.repeat(60))

  const bridge = await createFigmaBridge({ useDesktop: true })

  try {
    const result = await extractFigmaDesign(figmaUrl, bridge)

    // Save tokens
    if (result.tokens) {
      const themePath = path.join(outputDir, 'theme.css')
      await saveDesignTokens(result.tokens, themePath)
      console.log(`✅ Design tokens saved: ${themePath}`)
    }

    return {
      ...state,
      designTokens: result.tokens,
      componentCode: result.componentCode,
      figmaAnalysis: result.structuredAnalysis,
      ...
    }
  } finally {
    await bridge.close()
  }
}
```

**Update:** `agentic-system/workflow/graph.js`

Add state fields:
```javascript
designTokens: Annotation({
  reducer: (existing, update) => update ?? existing,
  default: () => null
}),
componentCode: Annotation({
  reducer: (existing, update) => update ?? existing,
  default: () => ({})
})
```

### Test

Run full workflow:
```bash
node agentic-system/index.js <figma-url>
```

### Expected Output
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6: Workflow Integration Test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ MCP bridge created
✅ Tokens extracted: 33
✅ theme.css saved: atomic-design-pattern/ui/theme.css
✅ Component code available: 7 components
✅ State updated with tokens
✅ Bridge closed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Commit
```
feat: integrate design tokens into analyze workflow
```

### ✋ PAUSE - Verify before continuing

---

## ☐ STEP 7: End-to-End Testing

### Test Scenarios

**Test 1:** Simple button with variables
- File: Design system with variables defined
- Expected: Clean token extraction, accurate button code

**Test 2:** Complex form without variables
- File: Form components, no variables
- Expected: Inferred tokens, all form elements captured

**Test 3:** Full design system page
- File: Many components, sections
- Expected: Comprehensive tokens, all components with code

### Verification Checklist

For each test:
- [ ] theme.css created
- [ ] Valid Tailwind v4 @theme syntax
- [ ] Token count logged
- [ ] Component count logged
- [ ] Component code present
- [ ] Screenshots captured
- [ ] No errors in console
- [ ] Faster than old approach

### Expected Output Pattern
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 7: End-to-End Test - [Scenario Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Variables: [Found/Inferred]
✅ Tokens: [Count] → theme.css
✅ Components: [Count]
✅ Code snippets: [Count]
✅ Execution time: [X]s
✅ All checks passed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Commit
```
test: verify end-to-end MCP extraction workflow
```

---

## ☐ STEP 8 (Optional): Agent MCP Tools

### Implementation

**File:** `agentic-system/tools/mcp-agent-tools.js`

```javascript
export function createMcpToolsForAgent(bridge) {
  return [
    {
      name: 'fetch_node_code',
      description: 'Get detailed code for a specific Figma node',
      func: async (nodeId) => {
        return await bridge.callTool('get_code', { nodeId })
      }
    },
    // ... more tools
  ]
}
```

### Test

Add tools to generation agent, test iteration

### Commit
```
feat: add MCP tools for agent iteration
```

---

## File Structure

```
design-to-code-system/
├── IMPLEMENTATION-PLAN.md              # This file
├── agentic-system/
│   ├── tools/
│   │   ├── design-tokens-extractor.js  # NEW - Step 1 & 2
│   │   ├── figma-extractor.js          # UPDATED - Step 3, 4, 5
│   │   └── mcp-agent-tools.js          # NEW - Step 8
│   ├── workflow/
│   │   ├── nodes/analyze.js            # UPDATED - Step 6
│   │   └── graph.js                    # UPDATED - Step 6
└── examples/
    ├── test-design-tokens.js           # NEW - Step 1
    ├── test-token-inference.js         # NEW - Step 2
    ├── test-mcp-extractor.js           # NEW - Step 3
    ├── test-code-extraction.js         # NEW - Step 4
    ├── test-tokens-with-variables.js   # NEW - Step 5
    ├── test-tokens-without-variables.js # NEW - Step 5
    └── test-end-to-end.js              # NEW - Step 7
```

---

## Logging Pattern

Every test must follow this pattern:

```javascript
console.log('━'.repeat(60))
console.log(`STEP X: [Description]`)
console.log('━'.repeat(60))
console.log('📊 Input:', JSON.stringify(input, null, 2).substring(0, 200))
console.log('⚙️  Processing...')
console.log('📊 Output:', JSON.stringify(output, null, 2).substring(0, 500))
console.log('✅ Verification:')
console.log(`   Expected: ${expected}`)
console.log(`   Actual: ${actual}`)
console.log(`   Status: ${actual === expected ? 'PASS ✅' : 'FAIL ❌'}`)
console.log('━'.repeat(60))
```

---

## Progress Tracking

- [ ] STEP 1: Design Token Extractor
- [ ] STEP 2: Token Inference
- [ ] STEP 3: MCP Core Refactor
- [ ] STEP 4: get_code Integration
- [ ] STEP 5: Token Integration
- [ ] STEP 6: Workflow Update
- [ ] STEP 7: E2E Testing
- [ ] STEP 8: Agent Tools (Optional)

---

## Success Criteria

✅ All tests pass
✅ theme.css generated correctly
✅ Tokens work with/without Figma variables
✅ Component code extracted
✅ Faster than old approach
✅ Clean commits
✅ Comprehensive logging

**Ready to execute STEP 1!**
