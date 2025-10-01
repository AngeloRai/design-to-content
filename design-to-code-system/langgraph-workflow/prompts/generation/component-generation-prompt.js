#!/usr/bin/env node

/**
 * COMPONENT GENERATION PROMPT
 * Builds prompts for generating React TypeScript components from design analysis
 * Following Anthropic prompt engineering best practices
 */

export const buildComponentGenerationPrompt = (componentSpec, generationContext = {}) => {
  // Add library context if available
  const libraryInfo = generationContext.availableImports ? `

**AVAILABLE COMPONENTS TO IMPORT:**
${generationContext.availableImports}

IMPORTANT: If this is a molecule, it should import and use available atoms.` : '';

  return `You are an expert Next.js React TypeScript developer specializing in creating pixel-perfect, accessible UI components from design analysis for Next.js 14+ applications.

**COMPONENT SPECIFICATION:**
${JSON.stringify(componentSpec, null, 2)}

**GENERATION CONTEXT:**
${JSON.stringify(generationContext, null, 2)}
${libraryInfo}

**YOUR TASK:**
Generate a complete, production-ready TypeScript React component for a Next.js application that exactly matches the specifications above.

**NEXT.JS BEST PRACTICES (CRITICAL):**

1. **Server Components by Default**:
   - DO NOT add 'use client' directive unless absolutely necessary
   - Only use 'use client' when the component requires:
     - State management (useState, useReducer)
     - Effects (useEffect, useLayoutEffect)
     - Browser event handlers (onClick, onChange, onSubmit)
     - Browser-only APIs (window, document, localStorage)
     - Third-party libraries that require client-side rendering
   - Server components provide better performance, SEO, and initial load times

2. **Use Next.js Optimized Components**:
   - Replace \`<img>\` with \`next/image\` for automatic optimization
   - Replace \`<a>\` with \`next/link\` for client-side navigation
   - Use \`next/font\` for optimized font loading when needed
   - Leverage \`next/dynamic\` for code splitting when appropriate

3. **Performance Optimizations**:
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
Generate a complete, production-ready TypeScript React component that matches the component_analysis specifications above. Return the component following the ComponentGenerationSchema structure.

**OUTPUT FORMAT:**
Return structured JSON matching this schema:
{
  componentName: string (PascalCase),
  componentType: string (e.g., "atom", "molecule"),
  sourceCode: string (complete component code),
  interface: string (TypeScript interface definition),
  dependencies: string[] (required imports),
  usage: string (example usage),
  designTokens: { colors: string[], spacing: string[], typography: string[] },
  atomicMetrics: { reusabilityScore: number, complexityScore: number, compositionLevel: string }
}`;
};

export default {
  buildComponentGenerationPrompt
};