#!/usr/bin/env node

/**
 * UNIFIED CODE REVIEW PROMPT
 * Single comprehensive review covering all code quality aspects
 * - Props design
 * - Imports & library usage
 * - TypeScript correctness
 * - Tailwind best practices
 * - Accessibility
 */

export const buildUnifiedCodeReviewPrompt = (code, componentSpec, libraryContext) => {
  const iconsList = libraryContext.icons && libraryContext.icons.length > 0
    ? libraryContext.icons.join(', ')
    : 'none';

  const elementsList = libraryContext.elements && libraryContext.elements.length > 0
    ? libraryContext.elements.join(', ')
    : 'none';

  const componentsList = libraryContext.components && libraryContext.components.length > 0
    ? libraryContext.components.join(', ')
    : 'none';

  return `You are a senior React code reviewer ensuring production-quality Next.js components.

**COMPONENT BEING REVIEWED:**
Name: ${componentSpec.name}
Type: ${componentSpec.atomicLevel}
Expected variants: ${componentSpec.variants ? componentSpec.variants.join(', ') : 'not specified'}

**AVAILABLE LIBRARY:**
Icons: ${iconsList}
Elements: ${elementsList}
Components: ${componentsList}

**CODE TO REVIEW:**
\`\`\`tsx
${code}
\`\`\`

---

**REVIEW CRITERIA** (score each 0-10, component must average ≥8 to pass):

### 1. Props Design (0-10) 🚨 CRITICAL - AUTO-FAIL IF STATE PROPS FOUND

✅ **Correct patterns:**
- Uses \`children\` prop for button/link text (NOT \`label\` or \`text\` props)
- NO props for CSS pseudo-states (\`state\`, \`hover\`, \`active\`, \`focus\`, \`disabled\` as styling props)
- Extends proper HTML element types (\`React.ButtonHTMLAttributes<HTMLButtonElement>\`, etc.)
- Includes \`className\` prop for customization
- Props match component's purpose
- Spreads \`{...props}\` to pass through HTML attributes

❌ **CRITICAL ANTI-PATTERNS** (instant score ≤5):
- **ANY prop that controls hover/focus/active/disabled styling** (e.g., \`state?: 'hover' | 'active'\`)
  - These are **browser states**, not React props
  - Must use CSS pseudo-classes: \`hover:\`, \`focus:\`, \`active:\`, \`disabled:\`
- \`<Button label="Click" />\` or \`text="Click"\` (should be \`<Button>Click</Button>\`)
- Custom \`disabled\` prop for styling (native \`disabled\` attribute is fine, already in HTMLAttributes)
- Missing \`children\` prop in interface

**SCORING GUIDE:**
- 10/10: Perfect props API, uses children, no state props, proper extends
- 7-9/10: Minor issues (e.g., missing className or doesn't spread props)
- 4-6/10: Has \`label\`/\`text\` prop instead of children
- 0-3/10: Has state/hover/focus/disabled props for styling (CRITICAL FAILURE)

**Score this 0-10. List ALL issues found.**

### 2. Imports & Library Usage (0-10) 🚨 CRITICAL - NO UNUSED IMPORTS

✅ **Correct patterns:**
- **ONLY imports what is actually used in JSX**
- Imports components individually from their own files
- Uses \`cn\` utility: \`import { cn } from '@/lib/utils';\`
- NO unnecessary React import (modern JSX transform handles it)
- **CRITICAL**: Only imports components that exist in libraryContext
- For molecules: composes using available elements from library

❌ **CRITICAL ANTI-PATTERNS** (instant score ≤5):
- **Importing multiple components but only using one**
  - ❌ BAD: \`import { Component1, Component2 } from '@/ui/icons'\` when JSX only uses \`<Component1 />\`
  - ✅ GOOD: \`import { Component1 } from '@/ui/icons/Component1'\` (only what's used)
- **Importing components that don't exist in libraryContext**
- **Using emojis as icon placeholders**: \`▶️\` (should use library icon or inline SVG)
- **Duplicating functionality** that exists in library
- **Not reusing available elements** when building molecules
- **Using imported components without their required props**
  - Each imported component should be used with ALL its required props
  - Check component interfaces/documentation for required props

**VERIFICATION CHECKLIST:**
- [ ] Check each import - is it used in the JSX?
- [ ] Are there emojis that should be icon imports?
- [ ] For molecules - are library elements being reused?
- [ ] Are imported components used with proper props?

**SCORING GUIDE:**
- 10/10: All imports used, uses library icons, no emojis, proper composition
- 7-9/10: Minor unused imports or missing some library usage
- 4-6/10: Multiple unused imports or using emojis
- 0-3/10: Importing ALL icons but using none, or recreating existing components

**Score this 0-10. List ALL issues found.**

### 3. TypeScript Correctness (0-10) 🚨 NO UNUSED CODE

✅ **Correct patterns:**
- **No unused variables or const declarations**
- No JSX namespace errors
- Proper interface definitions
- No \`any\` types
- Return types inferred (don't explicitly type \`JSX.Element\` unless importing React)
- Proper extends for HTML element props

❌ **CRITICAL ANTI-PATTERNS** (instant score ≤5):
- **Unused const declarations**:
  - ❌ BAD: \`const designTokens = {...}\` never referenced
  - ❌ BAD: \`const atomicMetrics = {...}\` never referenced
  - ❌ BAD: Any variable defined but not used
- \`: JSX.Element\` return type without React import
- Missing prop types
- \`any\` types
- Duplicate prop definitions (already in HTML element props)

**VERIFICATION:**
- [ ] Every const/variable is used somewhere in the code
- [ ] No metadata objects (designTokens, atomicMetrics, etc.)
- [ ] No commented-out code or unused functions

**SCORING GUIDE:**
- 10/10: Clean code, no unused declarations, proper types
- 7-9/10: Minor type issues but no unused code
- 4-6/10: Some unused code or type issues
- 0-3/10: Multiple unused consts, metadata objects included

**Score this 0-10. List ALL issues found.**

### 4. Tailwind Usage (0-10) 🚨 CRITICAL - SYNTAX & SEMANTIC VALIDATION

✅ **Correct patterns:**
- **MUST use pseudo-classes for ALL interactive states:**
  - Hover: \`hover:bg-blue-700\`, \`hover:scale-105\`
  - Focus: \`focus:ring-2\`, \`focus-visible:outline-none focus-visible:ring-2\`
  - Active: \`active:scale-95\`, \`active:bg-blue-800\`
  - Disabled: \`disabled:opacity-50\`, \`disabled:cursor-not-allowed\`
- **VALID Tailwind syntax for arbitrary values:**
  - ✅ Colors: \`bg-[#ebc060]\`, \`text-[#000000]\`, \`border-[#9747ff]\` (with square brackets)
  - ✅ Sizes: \`text-[14px]\`, \`w-[200px]\`, \`h-[48px]\` (with square brackets)
  - ✅ Spacing: Use Tailwind scale units (px-4 = 16px, py-3 = 12px, etc.)
- **REASONABLE spacing values for component type:**
  - Buttons: typically \`px-4 py-2\` to \`px-8 py-4\` (NOT py-48!)
  - Inputs: typically \`px-3 py-2\` to \`px-4 py-3\`
  - Cards: typically \`p-4\` to \`p-8\`
- Variant patterns using objects/maps (not inline conditionals)
- Uses \`cn()\` for conditional classes
- No inline styles
- Smooth transitions: \`transition-colors\`, \`transition-all\`

❌ **CRITICAL ANTI-PATTERNS** (instant score ≤5):
- **Invalid Tailwind syntax for arbitrary values:**
  - ❌ BAD: \`bg-#ebc060\`, \`text-#000000\` (missing square brackets)
  - ✅ GOOD: \`bg-[#ebc060]\`, \`text-[#000000]\`
  - ❌ BAD: \`text-14px\` (invalid format)
  - ✅ GOOD: \`text-[14px]\` or use Tailwind scale: \`text-sm\`
- **Absurd spacing values:**
  - ❌ BAD: \`py-48\` (192px vertical padding on a button!)
  - ❌ BAD: \`px-96\` (384px horizontal padding)
  - ✅ GOOD: \`py-3\` (12px), \`px-6\` (24px) for buttons
- **Props controlling pseudo-class states instead of CSS**
  - ❌ BAD: \`state === 'hover' ? 'bg-blue-700' : 'bg-blue-600'\`
  - ✅ GOOD: \`bg-blue-600 hover:bg-blue-700\`
- **Pixel values used as Tailwind units without conversion:**
  - ❌ BAD: Seeing "16px 48px" in design tokens and outputting \`px-16 py-48\`
  - ✅ GOOD: Convert to Tailwind scale: 16px → px-4, 48px → py-12 (divide by 4)
- Inline conditional strings without \`cn()\`
- Custom CSS instead of Tailwind
- Missing transition classes

**VERIFICATION CHECKLIST:**
- [ ] Check all \`bg-\`, \`text-\`, \`border-\` with hex colors use square brackets: \`bg-[#hex]\`
- [ ] Check all custom pixel sizes use square brackets: \`text-[14px]\`, \`w-[200px]\`
- [ ] Check spacing values are reasonable for component (buttons shouldn't have py-48!)
- [ ] Verify no bare hex values like \`bg-#ebc060\` (instant fail)
- [ ] Verify no invalid class names like \`text-14px\` (instant fail)

**SCORING GUIDE:**
- 10/10: Perfect syntax, all arbitrary values use brackets, spacing is reasonable
- 7-9/10: Minor issues (missing some brackets or slightly odd spacing)
- 4-6/10: Multiple syntax errors OR unreasonable spacing values
- 0-3/10: Invalid Tailwind syntax (\`bg-#hex\`, \`text-14px\`) OR absurd values (\`py-48\` on button)

**Score this 0-10. List ALL issues found with specific examples.**

### 5. Accessibility (0-10)
✅ **Correct patterns:**
- Semantic HTML elements (button for buttons, a for links, etc.)
- ARIA attributes where needed (\`aria-label\`, \`aria-pressed\`, \`aria-expanded\`, etc.)
- Keyboard navigation support
- Focus management (\`focus-visible:ring-2\`)
- Proper button type attribute

❌ **Anti-patterns to catch:**
- Div/span used instead of button/a/input
- Missing ARIA labels for icon-only buttons
- No focus indicators
- Missing keyboard event handlers where needed

**Score this 0-10. List all issues found.**

---

**RETURN JSON:**
{
  "scores": {
    "propsDesign": <0-10>,
    "importsAndLibrary": <0-10>,
    "typescript": <0-10>,
    "tailwind": <0-10>,
    "accessibility": <0-10>
  },
  "averageScore": <average of above 5 scores>,
  "passed": <true if averageScore >= 8>,
  "criticalIssues": [
    "List specific issues that MUST be fixed (be detailed with line numbers if possible)"
  ],
  "minorIssues": [
    "List suggestions for improvement (nice to have)"
  ],
  "feedback": "Write detailed, surgical feedback for ONLY the specific issues that need fixing. DO NOT suggest changes to code that is already correct.

  **CRITICAL RULES FOR FEEDBACK:**
  1. **Be surgical, not comprehensive** - Only address actual problems
  2. **Preserve working code** - If props are correct, don't suggest changes
  3. **Provide exact fixes** - Show before/after for ONLY the broken parts
  4. **Don't rewrite the component** - Fix specific issues, not everything

  For each issue:
  - State EXACTLY what's wrong (with line reference if possible)
  - Show EXACT code change needed (before → after)
  - Explain WHY it's wrong (reference the rule violated)

  Structure your feedback like:

  **Props Design Issues:**
  - ISSUE: [exact problem with location]
  - FIX: [exact code change: before → after]
  - WHY: [rule violated]

  **Import Issues:**
  - ISSUE: Line X imports multiple components but only uses ComponentName
  - FIX: Replace barrel import with individual import: \`import { ComponentName } from '@/ui/path/ComponentName'\`
  - WHY: Unused imports bloat bundle size
  - ISSUE: Line Y imports component that doesn't exist in libraryContext
  - FIX: Remove the import and use inline implementation or check library for alternatives
  - WHY: Importing non-existent components causes build errors

  **Tailwind Issues:**
  - ISSUE: [exact problem]
  - FIX: [exact code change]
  - WHY: [rule violated]

  **TypeScript Issues:**
  - ISSUE: Lines 70-81 define unused \`designTokens\` and \`atomicMetrics\` consts
  - FIX: Remove these declarations entirely
  - WHY: Unused code adds bloat

  **Accessibility Issues:**
  - ISSUE: [exact problem]
  - FIX: [exact code change]
  - WHY: [rule violated]

  **WHAT TO PRESERVE (DO NOT MENTION IN FEEDBACK):**
  - Correct component structure
  - Working variant logic
  - Proper cn() usage
  - Correct className spreading
  - Any code that already follows best practices",
  "confidenceReady": <true if passed AND component is ready for visual inspection with no major concerns>
}

**CRITICAL REVIEWER MINDSET:**
- You are a CODE SURGEON, not a rewriter
- Only flag ACTUAL problems that violate the criteria above
- Do NOT suggest improvements to code that already works correctly
- Be thorough and strict, but PRECISE - target specific issues only
- The component must score ≥8/10 average to pass`;
};

export default { buildUnifiedCodeReviewPrompt };
