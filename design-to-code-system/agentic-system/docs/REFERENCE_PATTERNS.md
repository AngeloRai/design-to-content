# Component Development Patterns

> Coding conventions from reference/reference-app/ui/. Vector search will find actual component examples.

---

## Import Patterns

### Standard Imports
```typescript
import React from 'react'
import Link from "next/link"           // For internal navigation
import Image from "next/image"          // For optimized images
import { ReactSVG } from "react-svg"    // For SVG rendering
```

### Type Imports
```typescript
import type { ComponentProps } from '@/lib/contentful/types/fields'
import { AssetFields } from "contentful"
```

### Utility Imports
```typescript
import { getBrandBgClass, getContrastTextClass } from '@/lib/utils/brandColors'
import IconRenderer, { IconName } from "../icons/IconRenderer"
```

### Local Component Imports
```typescript
import CTA from './CTA'                 // Relative path for same level
import Logo from "../elements/Logo"     // Relative path for different level
```

---

## TypeScript Conventions

### Interface Patterns

**Always extend base interfaces:**
```typescript
// Good - extends existing interface
interface ComponentCardProps extends CardProps {
  id?: string;
}

// Good - extends HTML attributes (but DON'T redefine existing props)
interface CTAComponentProps extends CTAProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}
```

### Props Destructuring with Defaults
```typescript
export default function Component({
  backgroundColor = 'surface-pure',  // Provide sensible defaults
  icon,
  heading,
  subheading,
  cta
}: ComponentCardProps) {
  // Function body
}
```

### Optional Props
```typescript
interface IconProps {
  className?: string           // Optional with ?
}
```

### Type Annotations for Simple Components
```typescript
const LogoComponent = ({ logo }: { logo: AssetFields }) => {
  // Inline type annotation for simple cases
}
```

---

## Component Structure Patterns

### Default Export Pattern
```typescript
export default function ComponentName({
  prop1,
  prop2
}: ComponentProps) {
  // Component logic
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Function Component (Arrow Function)
```typescript
const ComponentName = ({ prop }: { prop: Type }) => {
  return (
    <svg>
      {/* Content */}
    </svg>
  )
}

export default ComponentName
```

### Conditional Rendering
```typescript
// Pattern 1: Early return
if (!logoUrl) {
  return <LogoLight className="h-14 w-auto" />;
}

// Pattern 2: Ternary in className
className={`${isDarkBackground(backgroundColor)
  ? 'border-white/10 shadow-lg'
  : 'border-brand-primary/10 shadow-md'
}`}

// Pattern 3: Conditional content
{cta && (
  <div className="pt-6 mt-auto">
    <CTA {...cta.fields} />
  </div>
)}
```

### Helper Functions Inside Component
```typescript
const renderContent = () => {
  if (icon && !label) {
    return <IconRenderer name={icon} />;
  } else if (icon && label) {
    return (
      <>
        <IconRenderer name={icon} />
        {children || label}
      </>
    );
  }
  return children || label;
};

const content = renderContent();
```

---

## Styling Patterns

### Tailwind Usage

**Modern Variant Pattern (Recommended):**

For components with variants, **always use CVA with VariantProps** (see CVA Pattern section below):

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center font-body-bold rounded-xl transition-all duration-200",
  {
    variants: {
      variant: {
        primary: "bg-brand-primary text-white hover:bg-brand-secondary",
        secondary: "bg-white text-neutral-dark hover:bg-white/90",
        outline: "bg-transparent text-white border-2 border-white"
      }
    },
    defaultVariants: { variant: 'primary' }
  }
);

// Usage in component
className={cn(buttonVariants({ variant }), className)}
```

### Responsive Classes
```typescript
className="p-6 sm:p-8 text-xl sm:text-2xl"  // Mobile-first approach
```

### State Classes
```typescript
className="hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
```

### Dynamic Classes with Template Literals
```typescript
className={`group p-6 sm:p-8 rounded-2xl ${bgClass} ${
  isDarkBackground(backgroundColor)
    ? 'border-white/10'
    : 'border-brand-primary/10'
}`}
```

### Utility Classes
```typescript
// Spacing
"space-y-4"        // Vertical spacing between children
"gap-2"            // Gap for flexbox/grid

// Layout
"flex flex-col h-full"
"inline-flex items-center justify-center"

// Transitions
"transition-all duration-200 hover:scale-[1.02]"

// Borders & Shadows
"rounded-2xl border shadow-md hover:shadow-xl"
```

---

## Component Composition Patterns

### Using Child Components
```typescript
return (
  <div className="group">
    {/* Icon component */}
    <div className="mb-6">
      <IconRenderer name={icon} />
    </div>

    {/* Content */}
    <div className="flex flex-col h-full">
      <h3>{heading}</h3>
      <p>{subheading}</p>
    </div>

    {/* Optional child component */}
    {cta && (
      <CTA {...cta.fields} variant="primary" />
    )}
  </div>
);
```

### Spreading Props
```typescript
<CTA {...cta.fields} variant={variant} />  // Spread + override
```

---

## Link & Navigation Patterns

### Conditional Link/Button Rendering
```typescript
// If no URL or has onClick, render button
if (!url || onClick) {
  return (
    <button onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

// If external, render <a> tag
const isExternal = external || url.startsWith("http");
if (isExternal) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={classes}>
      {content}
    </a>
  );
}

// Otherwise, use Next.js Link
return (
  <Link href={url} className={classes}>
    {content}
  </Link>
);
```

---

## Icon Component Patterns

### Simple SVG Icon
```typescript
interface IconProps {
  className?: string
}

export default function IconName({ className = "w-8 h-8" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* SVG paths/shapes */}
    </svg>
  )
}
```

### Icon with currentColor
```typescript
// Uses currentColor to inherit text color
<svg stroke="currentColor" fill="currentColor">
  <path />
</svg>
```

---

## Image Handling Patterns

### Next.js Image Component
```typescript
<Image
  src={imageUrl}
  alt={imageTitle}
  width={56}
  height={56}
  className="h-14 w-auto"
  priority                    // For above-the-fold images
  style={{ height: "56px", width: "auto" }}
/>
```

### SVG with ReactSVG
```typescript
<ReactSVG
  src={svgUrl}
  className="h-14 w-auto"
  beforeInjection={(svg) => {
    svg.setAttribute("aria-label", title);
    svg.setAttribute("role", "img");
    svg.classList.add("h-14", "w-auto");
  }}
  fallback={() => <Image src={svgUrl} alt={title} />}
/>
```

---

## Accessibility & Reusability Patterns

### Form Input Pattern (Best Practice)

**Note:** See the reference TextInput component for a complete CVA-based example with variant management.

This simplified example shows accessibility patterns without variants:

```typescript
import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | boolean;
  helperText?: string;
  onValueChange?: (value: string) => void;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { id, label, error, helperText, className, onChange, onValueChange, required, ...rest },
  ref
) {
  // Auto-generate unique ID for accessibility
  const autoId = useId();
  const inputId = id ?? `textinput-${autoId}`;
  const hasError = Boolean(error);
  const describedBy = helperText || hasError ? `${inputId}-desc` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </label>
      )}

      <input
        id={inputId}
        ref={ref}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        required={required}
        className={cn(
          'w-full rounded-lg border transition placeholder:text-gray-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          hasError
            ? 'border-red-500 focus-visible:ring-red-500'
            : 'border-gray-300 focus-visible:ring-blue-500',
          className
        )}
        onChange={(e) => {
          onChange?.(e);
          onValueChange?.(e.target.value);
        }}
        {...rest}
      />

      {(helperText || hasError) && (
        <p id={describedBy} className={cn('mt-1 text-xs', hasError ? 'text-red-600' : 'text-gray-500')}>
          {typeof error === 'string' ? error : helperText}
        </p>
      )}
    </div>
  );
});

export default TextInput;
```

### Key Accessibility Features
1. **useId()** - Auto-generate unique IDs for label/input association
2. **forwardRef** - Allow parent components to control refs
3. **aria-invalid** - Indicate error state to screen readers
4. **aria-describedby** - Associate helper text/errors with input
5. **htmlFor** - Proper label-input connection
6. **cn() utility** - Merge className safely from '@/lib/utils'

### Using cn() Utility
```typescript
import { cn } from '@/lib/utils';

// Simple conditional classes
className={cn(
  'base-class',
  isActive && 'active-class',
  error && 'error-class',
  className  // Allow parent to override
)}

// With CVA variants (recommended pattern)
className={cn(buttonVariants({ variant, size }), className)}
```

### forwardRef Pattern for Reusable Components

**For components with variants, use CVA with VariantProps** (see CVA Pattern section below for complete example).

```typescript
import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, children, ...rest },
  ref
) {
  return (
    <button ref={ref} className={className} {...rest}>
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
```

### Extending HTML Attributes

**For components with variants, always use CVA + VariantProps** (see CVA Pattern section).

```typescript
// When HTML attributes conflict with custom props, use Omit
// Example: HTML <select> has 'size' attribute, but we want custom size variants
interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {  // ← Extract size from CVA
  // Additional custom props
  label?: string;
}

// Simple extension without conflicts
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {  // ← Extract variant from CVA
  isLoading?: boolean;
}
```

### ARIA Labels and Roles
```typescript
// For icon-only buttons
<button aria-label="Close menu" className="...">
  <CloseIcon />
</button>

// For Next.js images with alt text
import Image from 'next/image';

<Image src={url} alt="Descriptive alt text" width={200} height={200} />

// For decorative images (empty alt)
<Image src={url} alt="" aria-hidden="true" width={200} height={200} />

// For SVGs
svg.setAttribute("aria-label", title);
svg.setAttribute("role", "img");
```

### Keyboard Navigation
```typescript
// Tab index for custom interactive elements
<div role="button" tabIndex={0} onKeyDown={handleKeyDown}>

// Keyboard event handling
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onClick?.();
  }
};
```

### Focus Management
```typescript
// Visible focus indicators
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"

// Focus trap for modals (use a library like focus-trap-react)
import FocusTrap from 'focus-trap-react';

<FocusTrap>
  <div role="dialog" aria-modal="true">
    {/* Modal content */}
  </div>
</FocusTrap>
```

### External Link Security
```typescript
<a href={url} target="_blank" rel="noopener noreferrer">
```

### Button Types
```typescript
<button type="button">       // Default
<button type="submit">       // For forms
<button type="reset">        // For reset
```

### Form Error States
```typescript
// Associate error message with input
<input
  aria-invalid={hasError}
  aria-describedby={hasError ? `${id}-error` : undefined}
/>

{hasError && (
  <p id={`${id}-error`} role="alert" className="text-red-600">
    {errorMessage}
  </p>
)}
```

---

## CVA (Class Variance Authority) Pattern

**CRITICAL: Always use CVA with VariantProps for components with variants**

CVA provides type-safe variant management for Tailwind CSS and ensures all variant classes are statically discoverable (required for Tailwind v4).

### Complete CVA Pattern with VariantProps

```typescript
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Define variants using CVA
 * This is the SINGLE SOURCE OF TRUTH for all variant classes
 */
const buttonVariants = cva(
  // Base classes applied to all variants
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      // Variant dimension 1: visual style
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
        outline: 'border-2 border-gray-300 bg-transparent hover:bg-gray-100 focus:ring-gray-500',
        ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      },
      // Variant dimension 2: size
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    // Default values when props not provided
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

/**
 * Extract variant prop types from CVA definition using VariantProps
 * This provides type safety and IntelliSense for variant values
 */
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {  // ← Extract variant/size types from CVA
  children: React.ReactNode;
}

/**
 * Component implementation using forwardRef for ref forwarding
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, children, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}  // ← Apply variants + custom classes
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
```

### Why Use CVA with VariantProps?

**Benefits:**
1. **Type Safety**: TypeScript knows `variant` can only be `'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'`
2. **Single Source of Truth**: Variant types extracted from CVA, not manually duplicated
3. **IntelliSense**: Auto-completion for all valid variant values
4. **Compile-Time Checking**: TypeScript catches invalid variant values
5. **Tailwind v4 Compatibility**: All classes statically discoverable for proper purging
6. **Compound Variants**: Easy to add complex variant combinations

**❌ Wrong - Manual Variant Types (DON'T DO THIS):**
```typescript
// BAD: Manually defining variant types (duplicates CVA definition)
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';  // ← Duplicate definition!
  size?: 'sm' | 'md' | 'lg';                      // ← Duplicate definition!
}

const buttonVariants = cva('...', {
  variants: {
    variant: { primary: '...', secondary: '...', outline: '...' },
    size: { sm: '...', md: '...', lg: '...' },
  },
});
```

**✅ Correct - VariantProps Extraction (DO THIS):**
```typescript
// GOOD: Types extracted from CVA automatically
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {  // ← Auto-extracts variant/size types
  children: React.ReactNode;
}

const buttonVariants = cva('...', {
  variants: {
    variant: { primary: '...', secondary: '...', outline: '...' },
    size: { sm: '...', md: '...', lg: '...' },
  },
});
```

### Advanced CVA: Compound Variants

Use compound variants for complex combinations:

```typescript
const buttonVariants = cva('base-classes', {
  variants: {
    variant: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-500',
    },
    size: {
      sm: 'text-sm',
      lg: 'text-lg',
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
    },
  },
  compoundVariants: [
    // Special case: large destructive buttons have extra padding
    {
      variant: 'destructive',
      size: 'lg',
      className: 'px-8 py-4',
    },
  ],
  defaultVariants: {
    variant: 'primary',
    size: 'sm',
  },
});
```

### CVA Best Practices

1. **Always use with VariantProps** - Never manually duplicate variant types
2. **Define base classes** - Common styles in the first argument
3. **Use defaultVariants** - Provide sensible defaults
4. **Combine with cn()** - Allow className overrides: `cn(buttonVariants({ variant, size }), className)`
5. **Export the CVA definition** - If other components need to reference variants

### When to Use CVA

Use CVA for any component with:
- Multiple visual variants (primary, secondary, outline, etc.)
- Size variants (sm, md, lg)
- State variants (active, disabled, loading, etc.)
- Any combination of the above

### When NOT to Use CVA

Don't use CVA for:
- Single-variant components with no variations
- Components where className is entirely dynamic
- Simple utility functions

---

## Common Variants & Sizes

**Use CVA Pattern for all variant and size management** (see CVA Pattern section above).

CVA provides type-safe variants with proper TypeScript integration. Define size and variant classes within the CVA definition, not as separate objects.

---

## Key Takeaways

1. **Always use TypeScript** - interfaces, proper types, extend HTML attributes
2. **Functional components only** - no classes
3. **Use CVA with VariantProps** - for components with variants (CRITICAL for type safety)
4. **Use forwardRef** - for reusable components that need ref access
5. **Use useId()** - for accessibility (label/input associations)
6. **Use cn() utility** - from '@/lib/utils' for className merging
7. **Tailwind for all styling** - no CSS-in-JS, no inline styles
8. **Responsive by default** - mobile-first with sm:, md:, lg:
9. **Composition over complexity** - small, focused components
10. **Sensible defaults** - provide default prop values
11. **Accessibility first** - ARIA labels, aria-invalid, aria-describedby, semantic HTML
12. **Next.js optimizations** - use <Image> instead of <img>, <Link> instead of <a>
13. **Clean imports** - organized by type (React, Next, types, utils, components)
14. **Extend HTML attributes** - Use Omit<> when needed to avoid conflicts
15. **Error states** - Proper ARIA associations with role="alert"
