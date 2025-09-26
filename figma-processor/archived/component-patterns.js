#!/usr/bin/env node

/**
 * COMPONENT PATTERNS
 * Generic patterns showing how to structure components properly
 * These are examples of patterns, not rigid templates
 */

/**
 * Example of how to structure a component with variants
 */
export const variantPatternExample = `
// Example pattern for components with variants
import React from 'react';
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Define variants using cva
const componentVariants = cva(
  // Base classes that always apply
  "base-tailwind-classes-here",
  {
    variants: {
      // Define your variant options
      variant: {
        default: "tailwind-classes-for-default",
        secondary: "tailwind-classes-for-secondary",
        // ... more variants
      },
      size: {
        sm: "tailwind-classes-for-small",
        md: "tailwind-classes-for-medium",
        lg: "tailwind-classes-for-large",
      },
      // ... more variant categories
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// TypeScript interface extending VariantProps
interface ComponentProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof componentVariants> {
  // Additional props specific to this component
}

// Component using cn() for className composition
const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <element
        ref={ref}
        className={cn(componentVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Component.displayName = "Component";

export default Component;
`;

/**
 * Example of a simple component without variants
 */
export const simplePatternExample = `
// Example pattern for simple components
import React from 'react';
import { cn } from "@/lib/utils";

interface ComponentProps extends React.HTMLAttributes<HTMLElement> {
  // Component-specific props
}

const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return (
      <element
        ref={ref}
        className={cn(
          "tailwind-classes-here",
          // Conditional classes
          condition && "additional-classes",
          className
        )}
        {...props}
      />
    );
  }
);
Component.displayName = "Component";

export default Component;
`;

/**
 * Key patterns to follow
 */
export const getKeyPatterns = () => `
KEY PATTERNS TO FOLLOW:

1. IMPORTS:
   • Always import cn from "@/lib/utils"
   • Import cva and VariantProps when using variants
   • Use React.forwardRef for better component composition

2. STYLING:
   • Use Tailwind utility classes exclusively
   • Use cn() for all className assignments
   • Never use inline styles or CSS classes

3. VARIANTS (when applicable):
   • Use cva to define variant styles
   • Create TypeScript types with VariantProps
   • Define sensible defaultVariants

4. TYPESCRIPT:
   • Extend appropriate HTML element interfaces
   • Use proper generic types with forwardRef
   • Export interfaces when needed for composition

5. ACCESSIBILITY:
   • Include proper ARIA attributes
   • Support keyboard navigation
   • Use semantic HTML elements
`;

/**
 * Common Tailwind patterns by category
 */
export const getTailwindGuidance = () => `
COMMON TAILWIND PATTERNS:

Layout:
• Flexbox: flex, items-center, justify-between, gap-4
• Grid: grid, grid-cols-3, gap-2
• Spacing: p-4, px-6, py-2, m-4, space-y-4

Typography:
• Size: text-xs, text-sm, text-base, text-lg
• Weight: font-normal, font-medium, font-semibold, font-bold
• Color: text-foreground, text-muted-foreground, text-primary

Interactivity:
• Hover: hover:bg-accent, hover:text-accent-foreground
• Focus: focus:outline-none, focus-visible:ring-2
• Disabled: disabled:opacity-50, disabled:cursor-not-allowed

Borders & Radius:
• Border: border, border-2, border-input
• Radius: rounded, rounded-md, rounded-lg, rounded-full

Transitions:
• transition-colors, transition-all, duration-200

Colors (use semantic tokens):
• Background: bg-background, bg-card, bg-popover
• Primary: bg-primary, text-primary-foreground
• Secondary: bg-secondary, text-secondary-foreground
• Muted: bg-muted, text-muted-foreground
• Accent: bg-accent, text-accent-foreground
• Destructive: bg-destructive, text-destructive-foreground
`;

/**
 * Next.js specific component patterns
 */
export const getNextJSPatterns = () => `
NEXT.JS COMPONENT PATTERNS:
===========================

📸 IMAGE COMPONENTS:
// Always use Next.js Image component
import Image from 'next/image';

const ImageComponent = ({ src, alt, ...props }) => (
  <Image
    src={src}
    alt={alt}
    width={400}  // Always specify width
    height={300} // Always specify height
    className={cn("rounded-lg object-cover")}
    priority={false} // Set to true for above-the-fold images
    {...props}
  />
);

🔗 LINK COMPONENTS:
// Always use Next.js Link for internal navigation
import Link from 'next/link';

const LinkComponent = ({ href, children, ...props }) => (
  <Link
    href={href}
    className={cn("text-primary hover:underline")}
    {...props}
  >
    {children}
  </Link>
);

🧭 NAVIGATION COMPONENTS:
// Use Next.js router for programmatic navigation
import { useRouter } from 'next/navigation';

const NavigationButton = ({ targetPath, children }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(targetPath);
  };

  return (
    <button onClick={handleClick} className={cn("btn-styles")}>
      {children}
    </button>
  );
};

⚡ DYNAMIC LOADING:
// Use dynamic imports for heavy components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div className="animate-spin">Loading...</div>,
  ssr: false // Disable SSR if needed
});

🖼️ AVATAR/PROFILE COMPONENTS:
// Combine Next.js Image with proper fallbacks
import Image from 'next/image';

const Avatar = ({ src, alt, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn("rounded-full overflow-hidden", sizeClasses[size])}>
      <Image
        src={src || '/default-avatar.png'}
        alt={alt}
        width={64}
        height={64}
        className="object-cover w-full h-full"
      />
    </div>
  );
};
`;

/**
 * Additional Next.js specific patterns for different component types
 */
export const getAdvancedNextJSPatterns = () => `
ADVANCED NEXT.JS PATTERNS:
==========================

🎭 CONDITIONAL RENDERING WITH NEXT.JS:
// Use Next.js hooks for client-side conditionals
'use client';
import { useState, useEffect } from 'react';

const ConditionalComponent = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Prevent hydration mismatches

  return <div className={cn("transition-opacity", mounted && "opacity-100")}>Content</div>;
};

🏗️ SERVER VS CLIENT COMPONENTS:
// Server Component (default - no 'use client')
const ServerComponent = async ({ data }) => {
  // Can fetch data directly, no useState/useEffect
  const serverData = await fetch('/api/data');

  return (
    <div className={cn("p-4 bg-card")}>
      <ClientComponent data={serverData} />
    </div>
  );
};

// Client Component (with 'use client')
'use client';
import { useState } from 'react';

const ClientComponent = ({ data }) => {
  const [state, setState] = useState(data);

  return (
    <button
      onClick={() => setState(!state)}
      className={cn("px-4 py-2 bg-primary text-primary-foreground")}
    >
      Toggle
    </button>
  );
};

📱 RESPONSIVE IMAGES WITH NEXT.JS:
import Image from 'next/image';

const ResponsiveImage = ({ src, alt, priority = false }) => (
  <div className={cn("relative w-full aspect-video")}>
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className={cn("object-cover rounded-lg")}
      priority={priority}
    />
  </div>
);

🔄 LOADING STATES WITH NEXT.JS:
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const LazyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div className={cn("animate-pulse bg-muted h-20 rounded")} />,
});

const ComponentWithSuspense = () => (
  <Suspense fallback={<div className={cn("loading-spinner")} />}>
    <LazyComponent />
  </Suspense>
);

🎯 FORM HANDLING WITH NEXT.JS:
'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const NextJSForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: new FormData(e.target)
      });

      if (response.ok) {
        router.push('/success');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4")}>
      <input
        name="email"
        type="email"
        className={cn("w-full px-3 py-2 border border-input rounded-md")}
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className={cn(
          "px-4 py-2 bg-primary text-primary-foreground rounded-md",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          loading && "animate-pulse"
        )}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
`;

/**
 * Get pattern guidance without specific templates
 */
export const getPatternGuidance = () => {
  return {
    variantPattern: variantPatternExample,
    simplePattern: simplePatternExample,
    keyPatterns: getKeyPatterns(),
    tailwindGuidance: getTailwindGuidance(),
    nextjsPatterns: getNextJSPatterns(),
    advancedNextjsPatterns: getAdvancedNextJSPatterns(),
  };
};