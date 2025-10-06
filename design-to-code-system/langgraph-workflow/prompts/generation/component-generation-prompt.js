#!/usr/bin/env node

/**
 * COMPONENT GENERATION PROMPT
 * Builds prompts for generating React TypeScript components from design analysis
 * Following Anthropic prompt engineering best practices
 */

export const buildComponentGenerationPrompt = (componentSpec, libraryContext = {}, refinementFeedback = [], screenshotUrl = null) => {
  // Build library awareness sections
  const iconsList = libraryContext.icons && libraryContext.icons.length > 0
    ? libraryContext.icons
    : [];

  const elementsList = libraryContext.elements && libraryContext.elements.length > 0
    ? libraryContext.elements
    : [];

  const componentsList = libraryContext.components && libraryContext.components.length > 0
    ? libraryContext.components
    : [];

  // Icons section
  const iconsSection = iconsList.length > 0 ? `

**🎨 AVAILABLE ICONS IN YOUR LIBRARY:**
${iconsList.map(name => `  - import { ${name} } from '@/ui/icons/${name}';`).join('\n')}

⚠️ **CRITICAL**:
- Use these icons instead of emojis (❌ ▶️ ✕ ❤️) or inline SVG
- Import from individual files as shown above (e.g., '@/ui/icons/PlayIcon')
- NEVER use barrel imports like '@/ui/icons' - they don't exist` : '';

  // Elements section
  const elementsSection = elementsList.length > 0 ? `

**🧩 AVAILABLE ELEMENTS IN YOUR LIBRARY:**
${elementsList.map(name => `  - import { ${name} } from '@/ui/elements/${name}';`).join('\n')}

⚠️ **CRITICAL**: If building a molecule, compose using these elements. Don't recreate them.` : '';

  // Components section
  const componentsSection = componentsList.length > 0 ? `

**📦 AVAILABLE COMPONENTS IN YOUR LIBRARY:**
${componentsList.map(name => `  - import { ${name} } from '@/ui/components/${name}';`).join('\n')}

⚠️ **CRITICAL**: Reuse these components if building an organism. Don't duplicate functionality.` : '';

  // Refinement section
  const refinementSection = refinementFeedback.length > 0 ? `

**📝 PREVIOUS ITERATION FEEDBACK:**
This is a REVISION - you are FIXING SPECIFIC ISSUES, not rewriting from scratch.

${refinementFeedback.join('\n\n---\n\n')}

**🎯 YOUR TASK - BE SURGICAL:**

1. **Read the feedback carefully** - It lists SPECIFIC problems with EXACT fixes
2. **Make ONLY the changes requested** - Don't refactor working code
3. **Preserve everything else** - If feedback doesn't mention it, keep it as-is
4. **Apply exact fixes** - Use the before→after examples provided

**❌ DO NOT:**
- Rewrite the entire component from scratch
- Change code that wasn't flagged as problematic
- Add new features not mentioned in feedback
- Modify working variant logic, className handling, or structure
- Change import styles unless specifically requested

**✅ DO:**
- Fix the exact issues listed (props, imports, Tailwind, TypeScript, accessibility)
- Apply the specific code changes shown in the feedback
- Keep everything else identical to the previous iteration` : '';

  // Screenshot verification section
  const screenshotSection = screenshotUrl ? `

**🔍 VISUAL REFERENCE AVAILABLE FOR VERIFICATION:**
Design Screenshot: ${screenshotUrl}

⚠️ **CRITICAL: Double-Check Colors Against Visual Design**

The componentSpec provides analyzed color data, but analysis can sometimes contain errors.

**Verification Process:**
1. Review the colors in componentSpec (backgroundColor, textColor, borderColor)
2. VIEW THE SCREENSHOT to verify these colors match the actual visual design
3. If you notice ANY discrepancy between componentSpec colors and screenshot:
   → TRUST THE SCREENSHOT (it's the source of truth)
   → MEASURE or estimate the actual colors from the visual design
   → USE the correct colors in your implementation

**Common Analysis Errors to Watch For:**
- Framework default colors appearing in componentSpec (e.g., common blue/red/gray defaults)
- Mismatch between number of variants listed vs. visual properties provided
- Missing variants that are visible in the screenshot

**Variant Completeness:**
- componentSpec lists: ${componentSpec.styleVariants?.length || 0} styleVariants
- variantVisualMap provides: ${componentSpec.variantVisualMap?.length || 0} visual mappings
- If these don't match: VIEW SCREENSHOT to identify missing variants and their properties

**Goal**: Your generated component should match the VISUAL DESIGN in the screenshot.
Use componentSpec as a guide, but verify critical properties (especially colors) against the screenshot.
` : '';

  return `You are an expert Next.js React TypeScript developer creating pixel-perfect, accessible components.

**COMPONENT SPECIFICATION:**
${JSON.stringify(componentSpec, null, 2)}
${screenshotSection}
${iconsSection}
${elementsSection}
${componentsSection}
${refinementSection}

**YOUR TASK:**
Generate a complete, production-ready TypeScript React component for a Next.js application that exactly matches the specifications above.

${componentSpec.variantVisualMap && componentSpec.variantVisualMap.length > 0 ? `
**🎨 VARIANT VISUAL PROPERTIES (USE THESE FOR PIXEL-PERFECT STYLING):**

The component spec includes \`variantVisualMap\` with EXACT visual properties for each variant.
This is your source of truth for styling - DO NOT guess colors or spacing!

${componentSpec.variantVisualMap.map(v => `
**Variant: ${v.variantName}**
- Background: ${v.visualProperties.backgroundColor}
- Text Color: ${v.visualProperties.textColor}
- Border: ${v.visualProperties.borderWidth} ${v.visualProperties.borderStyle || 'solid'} ${v.visualProperties.borderColor}
- Border Radius: ${v.visualProperties.borderRadius}
- Padding: ${v.visualProperties.padding}
- Font: ${v.visualProperties.fontSize} / weight ${v.visualProperties.fontWeight}
- Shadow: ${v.visualProperties.shadow || 'none'}
${v.visualProperties.hoverEffects ? `- Hover: bg ${v.visualProperties.hoverEffects.backgroundColor || 'no change'}${v.visualProperties.hoverEffects.transform ? `, transform: ${v.visualProperties.hoverEffects.transform}` : ''}` : ''}
${v.visualProperties.disabledEffects ? `- Disabled: opacity ${v.visualProperties.disabledEffects.opacity || '0.5'}` : ''}
`).join('\n')}

**HOW TO USE VARIANT VISUAL MAP:**
1. Create a \`variant\` prop that switches between these styles
2. Map visual properties to Tailwind classes:
   - backgroundColor: Use \`bg-[color]\` or custom color classes
   - textColor: Use \`text-[color]\`
   - borderWidth + borderColor: Use \`border border-[color]\` or \`border-0\` for none
   - borderRadius: Use \`rounded-[size]\` (e.g., \`rounded\` for 4px, \`rounded-lg\` for 8px)
   - padding: Use \`px-[x] py-[y]\` (e.g., "12px 24px" → \`px-6 py-3\`)
   - fontSize: Use \`text-[size]\` (e.g., "14px" → \`text-sm\`, "16px" → \`text-base\`)
   - fontWeight: Use \`font-[weight]\` (e.g., "500" → \`font-medium\`, "600" → \`font-semibold\`)
   - hoverEffects: Use \`hover:bg-[color]\`, \`hover:scale-[value]\`, etc.

**EXAMPLE IMPLEMENTATION:**
\`\`\`typescript
const variantStyles = {
  "${componentSpec.styleVariants && componentSpec.styleVariants[0] || 'default'}": "bg-black text-white border-0 rounded px-6 py-3 text-sm font-medium hover:bg-gray-800",
  // ... map each variant from variantVisualMap
};
\`\`\`

**CRITICAL: DO NOT INVENT COLORS!**
- Use ONLY the hex values provided in variantVisualMap
- If a color isn't in standard Tailwind, use arbitrary values: \`bg-[#ebc060]\`
- Match spacing/sizing EXACTLY to the values provided
` : ''}

**🚫 CRITICAL ANTI-PATTERNS TO AVOID:**

1. **NEVER create props for CSS pseudo-states**:
   - ❌ BAD: \`state?: 'default' | 'hover' | 'active' | 'focus' | 'disabled'\`
   - ❌ BAD: \`isHovered?: boolean\` or \`isDisabled?: boolean\` (for styling)
   - ✅ GOOD: Use CSS pseudo-classes: \`hover:bg-gray-700\`, \`focus:ring-2\`, \`disabled:opacity-50\`
   - ✅ GOOD: Use native HTML attributes: \`disabled\` attribute for buttons/inputs (already in HTMLAttributes)
   - **WHY**: Hover/focus/active are **browser states**, not component props. CSS handles them automatically.
   - **EXCEPTION**: \`disabled\` is a valid HTML attribute (not a styling prop), already included via \`{...props}\`

2. **NEVER use 'label' or 'text' props for content**:
   - ❌ BAD: \`<Button label="Click me" />\` or \`<Button text="Click me" />\`
   - ✅ GOOD: \`<Button>Click me</Button>\` (uses \`children\` prop)
   - **WHY**: React convention is to use \`children\` for composable content

3. **Icon handling**:
   - ❌ BAD: \`<span>▶️</span>\` (emoji placeholders)
   - ✅ GOOD: Import from library if available: \`import { IconName } from '@/ui/icons/IconName'\`
   - ✅ ACCEPTABLE: Use inline SVG if no matching icon exists in library context
   - **CRITICAL**: Only import icons that are listed in the library context above

**UNDERSTANDING COMPONENT SPECS:**
The componentSpec includes a \`states\` array (e.g., \`["default", "hover", "inactive"]\`). These are **visual states observed in the design**, NOT props to create. Handle them as follows:
- **default**: Base styling (no special handling needed)
- **hover/focus/active**: Use Tailwind pseudo-classes (\`hover:\`, \`focus:\`, \`active:\`)
- **disabled/inactive**: Use native \`disabled\` attribute + \`disabled:\` pseudo-class for styling
- **pressed/loading**: ONLY create props for these if they require **state management** (e.g., \`isLoading\`)

**NEXT.JS BEST PRACTICES (CRITICAL):**

1. **Export Pattern for Component Library**:
   - ALWAYS use named exports: \`export const ComponentName = ...\`
   - NEVER use default exports
   - Benefits for component libraries:
     - Multiple components can be exported from one file if needed
     - Import names must match export names (prevents naming inconsistencies)
     - Better IDE autocomplete and refactoring support
     - Easier to identify unused exports
   - Example: \`export const Button = ({ children, ...props }: ButtonProps) => { ... }\`

2. **Server Components by Default**:
   - DO NOT add 'use client' directive unless absolutely necessary
   - Only use 'use client' when the component requires:
     - State management (useState, useReducer)
     - Effects (useEffect, useLayoutEffect)
     - Browser event handlers (onClick, onChange, onSubmit)
     - Browser-only APIs (window, document, localStorage)
     - Third-party libraries that require client-side rendering
   - Server components provide better performance, SEO, and initial load times

3. **Use Next.js Optimized Components**:
   - Replace \`<img>\` with \`next/image\` for automatic optimization
   - Replace \`<a>\` with \`next/link\` for client-side navigation
   - Use \`next/font\` for optimized font loading when needed
   - Leverage \`next/dynamic\` for code splitting when appropriate

4. **Performance Optimizations**:
   - Prefer server-side data fetching in Server Components
   - Use proper loading states with Suspense boundaries
   - Implement proper error boundaries
   - Optimize bundle size by avoiding unnecessary client components

4. **TypeScript & Next.js Integration**:
   - Use proper Next.js types when available
   - Extend appropriate HTML element interfaces
   - Type props correctly for server/client components

**KEY PATTERNS TO FOLLOW:**

<example name="proper-imports">
// Next.js optimized components (when needed)
import Image from 'next/image'; (do not use <img> directly unless justified)
import Link from 'next/link'; (do not use <a> directly unless justified)
import { Inter } from 'next/font/google'; // If using custom fonts

// Utility imports
import { cn } from '@/lib/utils';
import { forwardRef } from 'react'; // ONLY if using forwardRef

// For Button: extend React.ButtonHTMLAttributes<HTMLButtonElement>
// For Input: extend React.InputHTMLAttributes<HTMLInputElement>
</example>

<example name="api-design">
// Good: Uses children, extends HTML props, spreads ...props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
  size?: string;
  children: React.ReactNode;
  className?: string;
}
</example>

<example name="variant-pattern">
// PREFERRED: Use object/map for variant styles instead of inline conditionals
const buttonVariants = {
  default: "bg-gray-200 hover:bg-gray-300 text-gray-900",
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-gray-600 hover:bg-gray-700 text-white",
  destructive: "bg-red-600 hover:bg-red-700 text-white"
};

const buttonSizes = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg"
};

export const Button = ({ variant = "default", size = "md", children, className, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(
        "rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
</example>

<example name="tailwind-syntax-rules">
**🚨 CRITICAL TAILWIND CSS SYNTAX RULES:**

1. **Arbitrary Values MUST Use Square Brackets**:
   - ✅ CORRECT: \`bg-[#ebc060]\`, \`text-[#000000]\`, \`border-[#9747ff]\`
   - ❌ WRONG: \`bg-#ebc060\`, \`text-#000000\` (missing square brackets - WILL NOT WORK)
   - ✅ CORRECT: \`text-[14px]\`, \`w-[200px]\`, \`h-[48px]\`
   - ❌ WRONG: \`text-14px\`, \`w-200px\` (missing square brackets - WILL NOT WORK)
   - **WHY**: Tailwind requires square brackets for arbitrary hex colors and pixel values

2. **Convert Design Pixel Values to Tailwind Scale Units** (divide by 4):
   - Design shows "16px 48px" spacing in designTokens
   - ✅ CORRECT: \`px-4 py-12\` (16÷4=4, 48÷4=12)
   - ❌ WRONG: \`px-16 py-48\` (using pixels as Tailwind units directly)
   - **WHY**: Tailwind's spacing scale: 1 unit = 0.25rem = 4px
   - Common conversions:
     - 8px → 2, 12px → 3, 16px → 4, 20px → 5, 24px → 6
     - 32px → 8, 40px → 10, 48px → 12, 64px → 16

3. **Use Reasonable Spacing Values for Component Type**:
   - Buttons: typically \`px-4 py-2\` to \`px-8 py-4\`
   - ❌ WRONG: \`py-48\` (192px vertical padding is absurdly large for a button!)
   - ❌ WRONG: \`px-96\` (384px horizontal padding is unreasonable)
   - Inputs: typically \`px-3 py-2\` to \`px-4 py-3\`
   - Cards: typically \`p-4\` to \`p-8\`
   - **WHY**: Extreme values indicate a conversion error

4. **Interactive State Classes** (use pseudo-classes, not props):
   - ✅ CORRECT: \`hover:bg-blue-700 focus:ring-2 active:scale-95 disabled:opacity-50\`
   - ❌ WRONG: Creating props for hover/focus/active/disabled states
   - **WHY**: CSS handles these states automatically via pseudo-classes

5. **Prefer Tailwind Scale Over Arbitrary Values When Possible**:
   - ✅ PREFERRED: \`text-sm\` (14px), \`text-base\` (16px), \`text-lg\` (18px)
   - ✅ ACCEPTABLE: \`text-[14px]\` (if exact pixel match needed)
   - ✅ PREFERRED: \`bg-blue-600\`, \`text-gray-900\`
   - ✅ ACCEPTABLE: \`bg-[#ebc060]\` (for custom brand colors)

**TAILWIND VERIFICATION CHECKLIST:**
- [ ] All hex colors use square brackets: \`bg-[#hex]\`, \`text-[#hex]\`, \`border-[#hex]\`
- [ ] All custom pixel values use square brackets: \`text-[14px]\`, \`w-[200px]\`
- [ ] Spacing values converted to Tailwind scale (divide pixels by 4)
- [ ] No absurd spacing values (py-48 for buttons, px-96, etc.)
- [ ] Interactive states use pseudo-classes (hover:, focus:, active:, disabled:)
- [ ] Smooth transitions included: \`transition-colors\`, \`transition-all\`
</example>

<example name="nextjs-specific-patterns">
// Example: Card component with image using Next.js best practices
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// NO 'use client' - this is a server component
interface CardProps {
  title: string;
  description: string;
  imageUrl?: string;
  href?: string;
  className?: string;
}

export const Card = ({ title, description, imageUrl, href, className }: CardProps) => {
  const CardWrapper = href ? Link : 'div';

  return (
    <CardWrapper href={href || '#'} className={cn("block rounded-lg overflow-hidden", className)}>
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={title}
          width={400}
          height={250}
          className="w-full h-auto object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </CardWrapper>
  );
};
</example>

**CRITICAL REACT BEST PRACTICES (MUST FOLLOW):**

1. **NEVER use 'label' prop for button text**:
   - ALWAYS use 'children' for button/link content
   - BAD: '<Button label="Click me" />'
   - GOOD: '<Button>Click me</Button>'

2. **Props Design Rules**:
   - Text content goes in 'children', not custom props
   - Always extend appropriate HTML element props
   - Include 'className' prop for styling overrides
   - Use descriptive prop names matching the domain

3. **Component Composition**:
   - Prefer composition over configuration
   - Use 'children' for flexible content
   - Icons should be passed as React.ReactNode, not strings

**UNIVERSAL COMPONENT GENERATION RULES:**

1. **Analyze the Data Provided**:
   - Look at the allVisibleVariants array and visualProperties
   - Extract exact colors, spacing, typography from the analysis
   - Identify all distinct visual states and variants

2. **Create Variants for EVERY Visual Difference**:
   - Don't assume standard patterns like "primary/secondary"
   - Use descriptive variant names from the analysis
   - Every entry in allVisibleVariants becomes a variant option

3. **Use EXACT Values from Analysis**:
   - Colors: If analysis shows "blue-600", use "bg-blue-600"
   - Spacing: Use the padding/sizing values from visualProperties
   - Typography: Match font sizes and weights exactly

**GENERIC COMPONENT ARCHITECTURE:**

- Extend native HTML element props for proper TypeScript integration
- Use 'cn()' utility for conditional class merging
- Include 'className' prop for customization
- Implement proper accessibility attributes (ARIA, focus states, keyboard navigation)
- Support focus management with proper focus-visible states

**ADAPTIVE STYLING APPROACH:**

- **Visual-First**: Extract colors, sizes, and spacing directly from visual analysis
- **Variant Detection**: Identify distinct visual states (hover, active, disabled, focus)
- **Size Inference**: Derive size variants from visual measurements when multiple sizes exist
- **Color Mapping**: Use the exact color values from the analysis
- **Responsive Design**: Consider mobile/desktop differences visible in the analysis

**IMPORT REQUIREMENTS** (CORRECTED):

Import React features ONLY when actually needed:
- \`forwardRef\`: ONLY when component needs ref forwarding (form inputs that need imperative focus/DOM access)
- \`useState\`, \`useEffect\`: ONLY when using these hooks in the component
- Type imports: \`React.ButtonHTMLAttributes\`, etc. when extending HTML props
- Modern React JSX transform handles JSX automatically - **React import NOT required**
- \`cn\` utility: ALWAYS import from '@/lib/utils'

Keep imports minimal and purposeful. Don't import what you don't use.

**API DESIGN REQUIREMENTS:**

- For Button components: Use \`children\` prop (NOT \`content\` or \`text\`)
- For Input components: Use standard \`value\` and \`onChange\` props
- Extend the appropriate HTML element props (\`React.ButtonHTMLAttributes<HTMLButtonElement>\`, etc.)
- Don't duplicate built-in HTML props like \`disabled\` - they're already included via spread
- Use \`forwardRef\` ONLY when component needs ref (typically form inputs for imperative DOM access)
- Always spread \`{...props}\` to pass through all HTML attributes

**STYLING REQUIREMENTS:**

- Use ONLY Tailwind CSS utility classes (no custom CSS)
- Use \`cn()\` function for conditional classes: \`cn("base-classes", variant && "variant-classes")\`
- Include proper base styles: transitions, focus states, accessibility
- Implement all variants discovered in the visual analysis
- Don't assume Tailwind color names - use what the analysis specifies

**KEY PRINCIPLES:**

1. **No Hardcoded Assumptions**: Don't assume specific variant names, colors, or design tokens
2. **Visual Analysis Driven**: Let the visual analysis determine ALL styling decisions
3. **Flexible Interfaces**: Design component APIs that adapt to ANY design system
4. **Accessibility Foundation**: Always include focus states, ARIA attributes, keyboard support
5. **Measurement Precision**: Use exact values from analysis when available

**IMPROVEMENT MODE** (if improvementInstructions provided):

- This is iterative refinement - improve the existing component
- Follow ALL improvement instructions exactly
- Fix visual differences identified in the feedback
- Add any missing variants specified
- Use more accurate design tokens as suggested
- Goal is PIXEL-PERFECT accuracy to the original design

**COMPONENT QUALITY STANDARDS:**

- Use TypeScript with proper interfaces extending HTML element props
- Include JSDoc comments for all props and the component itself
- Support \`className\` prop override using cn()
- Use simple, conventional names (Button, Input, Card, etc.)
- Follow React best practices and performance optimization
- Export both the component and its props interface

**IMMEDIATE TASK:**
Generate a complete, production-ready TypeScript React component that matches the component_analysis specifications above.

**CRITICAL CODE QUALITY RULES:**

1. **No Unused Code**:
   - ❌ NEVER include unused const declarations (designTokens, atomicMetrics, etc.)
   - ❌ NEVER import icons/components that aren't used in the JSX
   - ❌ NEVER define variables that aren't referenced
   - ✅ ONLY import what you actually use in the component

2. **Import Specificity**:
   - ❌ BAD: \`import { Component1, Component2 } from '@/ui/icons'\` (barrel import - FORBIDDEN)
   - ✅ GOOD: \`import { ComponentName } from '@/ui/icons/ComponentName'\` (individual file import)
   - **CRITICAL**: ONLY import components that exist in the library context provided above
   - **CRITICAL**: Check library context first - if a component doesn't exist, use inline HTML/SVG instead
   - Each component MUST be imported from its own file path

3. **Clean Production Code**:
   - Only include: imports, interface, component, and optionally brief usage example
   - No metadata comments, no unused consts, no extra declarations
   - Every import must be used, every const must be referenced

**OUTPUT FORMAT:**
Return ONLY the clean component source code. Do NOT include:
- Design tokens as const declarations
- Atomic metrics as const declarations
- Unused imports
- Metadata objects
- Comments about the analysis

Include ONLY:
- Necessary imports (cn, icons/elements actually used, React types if needed)
- TypeScript interface
- Component function
- Brief usage example (optional, as comment)`;
};

export default {
  buildComponentGenerationPrompt
};