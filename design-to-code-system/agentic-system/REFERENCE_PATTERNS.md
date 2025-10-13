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

**Base + Variant Pattern:**
```typescript
const baseClasses = "inline-flex items-center justify-center font-body-bold rounded-xl transition-all duration-200";

const variantClasses = {
  primary: "bg-brand-primary text-white hover:bg-brand-secondary",
  secondary: "bg-white text-neutral-dark hover:bg-white/90",
  outline: "bg-transparent text-white border-2 border-white"
};

const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;
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

## Accessibility Patterns

### ARIA Labels
```typescript
svg.setAttribute("aria-label", logoTitle);
svg.setAttribute("role", "img");
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

---

## Common Variants & Sizes

### Size Variants
```typescript
const sizeClasses = {
  small: "px-4 py-2 text-sm gap-2",
  medium: "px-6 py-3 text-base gap-2",
  large: "px-8 py-4 text-lg gap-3",
};
```

### Style Variants
```typescript
const variantClasses = {
  primary: "bg-brand-primary text-white",
  secondary: "bg-white text-neutral-dark",
  outline: "bg-transparent border-2",
  ghost: "bg-white/20 backdrop-blur-sm",
  icon: "bg-transparent p-3",
};
```

---

## Key Takeaways

1. **Always use TypeScript** - interfaces, proper types
2. **Functional components only** - no classes
3. **Tailwind for all styling** - no CSS-in-JS, no inline styles
4. **Responsive by default** - mobile-first with sm:, md:, lg:
5. **Composition over complexity** - small, focused components
6. **Sensible defaults** - provide default prop values
7. **Accessibility** - ARIA labels, semantic HTML, keyboard support
8. **Next.js optimizations** - use Link, Image components properly
9. **Clean imports** - organized by type (React, Next, types, utils, components)
10. **Template literals for dynamic classes** - not cn() utility (unless complex logic needed)
