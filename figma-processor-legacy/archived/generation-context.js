#!/usr/bin/env node

/**
 * GENERATION CONTEXT
 * Defines the project's technology stack and coding patterns
 * Ensures consistent component generation with proper tools
 */

/**
 * Get the technology stack context for component generation
 */
export const getTechStackContext = () => {
  return `
TECHNOLOGY STACK & REQUIREMENTS:
=================================

🚀 NEXT.JS APPLICATION CONTEXT:
   • This is a Next.js React application
   • Use Next.js optimized components when applicable
   • Follow Next.js App Router conventions
   • Leverage Next.js performance optimizations

1. STYLING APPROACH:
   • Use Tailwind CSS v4 for ALL styling
   • NO inline styles (style={{}})
   • NO CSS classes (.btn, .switch__input, etc.)
   • NO styled-components or CSS-in-JS
   • Use Tailwind utility classes exclusively

2. REQUIRED IMPORTS:
   Every component MUST import:
   \`\`\`typescript
   import React from 'react';
   import { cn } from "@/lib/utils";
   \`\`\`

   For components with variants, also import:
   \`\`\`typescript
   import { cva, type VariantProps } from "class-variance-authority";
   \`\`\`

3. NEXT.JS SPECIFIC IMPORTS (use when applicable):
   \`\`\`typescript
   import Image from 'next/image';        // For images (instead of <img>)
   import Link from 'next/link';          // For navigation (instead of <a>)
   import { useRouter } from 'next/router'; // For programmatic navigation
   import dynamic from 'next/dynamic';    // For code splitting
   \`\`\`

4. NEXT.JS OPTIMIZATION RULES:
   • Use Next.js Image component for ALL images:
     - NEVER use <img> tags
     - Always use <Image> from 'next/image'
     - Include alt, width, height props
     - Use priority={true} for above-the-fold images

   • Use Next.js Link for internal navigation:
     - NEVER use <a> for internal links
     - Always wrap with <Link> from 'next/link'
     - Use href prop for the destination

   • Use dynamic imports for heavy components:
     - Use dynamic() for large/optional components
     - Add loading states when appropriate

5. CLASSNAME MANAGEMENT:
   • Always use cn() utility for className composition
   • Never use template literals for classes
   • Never concatenate strings directly

   GOOD: className={cn("flex items-center", isDisabled && "opacity-50")}
   BAD:  className={\`flex items-center \${isDisabled ? 'opacity-50' : ''}\`}
   BAD:  className="flex items-center"

6. VARIANT HANDLING with CVA:
   For components with variants, use class-variance-authority:

   \`\`\`typescript
   const componentVariants = cva(
     "base-classes-here",
     {
       variants: {
         variant: {
           default: "tailwind-classes",
           secondary: "tailwind-classes",
         },
         size: {
           sm: "h-9 px-3",
           default: "h-10 px-4",
           lg: "h-11 px-8",
         },
       },
       defaultVariants: {
         variant: "default",
         size: "default",
       },
     }
   );
   \`\`\`

7. TAILWIND CLASS GUIDELINES:
   • Use Tailwind's design system tokens (colors, spacing, etc.)
   • Common patterns:
     - Flexbox: flex, items-center, justify-center, gap-2
     - Spacing: p-4, px-3, py-2, mt-4, space-x-2
     - Typography: text-sm, font-medium, text-gray-900
     - Borders: border, border-gray-300, rounded-md
     - States: hover:bg-gray-100, focus:ring-2, disabled:opacity-50
     - Transitions: transition-colors, duration-200

8. ACCESSIBILITY & NEXT.JS:
   • Include proper ARIA attributes
   • Ensure keyboard navigation with focus styles
   • Use semantic HTML elements
   • Leverage Next.js SEO features when applicable`;
};

/**
 * Get pattern guidance for components
 */
export const getPatternGuidance = () => {
  return `
COMPONENT STRUCTURE PATTERNS:
=============================

When creating components, follow these patterns:

1. FOR COMPONENTS WITH VARIANTS:
   • Use cva() to define variant styles
   • Create proper TypeScript interfaces with VariantProps
   • Use cn() to compose classNames

2. FOR SIMPLE COMPONENTS:
   • Still use cn() for className management
   • Apply Tailwind utilities directly
   • Support className prop for composition

3. ALWAYS:
   • Import { cn } from "@/lib/utils"
   • Use React.forwardRef for better composition
   • Include proper TypeScript types
   • Use semantic HTML elements
   • Add accessibility attributes`;
};


/**
 * Instructions to avoid common mistakes
 */
export const getAntiPatterns = () => {
  return `
ANTI-PATTERNS TO AVOID:
=======================

❌ STYLING DON'T USE:
1. CSS classes: className="button" or className="btn-primary"
2. BEM notation: className="button__text" or "card--large"
3. Inline styles: style={{ padding: '10px', backgroundColor: 'blue' }}
4. String concatenation: className={"btn " + (disabled ? "btn-disabled" : "")}
5. Template literals without cn(): className={\`btn \${variant}\`}
6. CSS modules: styles.button or styles['button-primary']

❌ NEXT.JS DON'T USE:
1. Regular img tags: <img src="/image.jpg" alt="..." />
2. Regular anchor tags for internal links: <a href="/page">Link</a>
3. Client-side routing without Next.js: window.location.href = "/page"
4. Unoptimized image loading: <img> without dimensions
5. Direct DOM manipulation: document.getElementById()
6. Browser-specific APIs without proper checks

✅ STYLING DO USE:
1. Tailwind utilities: className={cn("bg-blue-500 hover:bg-blue-600")}
2. CVA for variants: className={cn(buttonVariants({ variant, size }))}
3. Conditional classes with cn(): className={cn("p-4", isActive && "bg-gray-100")}
4. Proper imports: import { cn } from "@/lib/utils"

✅ NEXT.JS DO USE:
1. Next.js Image: <Image src="/image.jpg" alt="..." width={100} height={100} />
2. Next.js Link: <Link href="/page">Link</Link>
3. Next.js Router: const router = useRouter(); router.push("/page")
4. Proper image optimization: Always include width, height, and alt
5. Server components when possible (no useState, useEffect unless needed)
6. TypeScript for better type safety`;
};