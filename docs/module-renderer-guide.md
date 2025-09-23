# ModuleRenderer System Guide

## Overview

The ModuleRenderer system provides a simplified, scalable approach to dynamically render Contentful content modules with full locale support.

## Key Improvements Over Reference Implementation

### ✅ **Simplified**
- Single component (`ModuleRenderer`) vs complex hierarchy
- Minimal types - only what's necessary
- Direct content type ID mapping

### ✅ **Locale-Aware**
- Built-in localization using `localizeProps` utility
- Components receive clean, single-locale props
- No manual locale handling in components

### ✅ **Type-Safe**
- Full TypeScript support with generated Contentful types
- Automatic IntelliSense for all content fields
- Compile-time validation

### ✅ **Scalable**
- Easy to add new modules (just update registry)
- Convention-based module creation
- Works with any Contentful content type

## Usage

### In Your Page ([...slug]/page.tsx)

```tsx
import { ModuleRenderer } from '@/ui/components/ModuleRenderer'
import { contentfulModuleRegistry } from '@/lib/contentful/registry'
import { getPageBySlug } from '@/lib/contentful/fetchers/page'

export default async function DynamicPage({ params, searchParams }) {
  const page = await getPageBySlug(params.slug?.join('/') || 'home')
  const locale = getValidLocale(searchParams.locale)

  return (
    <div>
      <ModuleRenderer
        modules={page.fields.contentModules || []}
        registry={contentfulModuleRegistry}
        locale={locale}
      />
    </div>
  )
}
```

## Creating a New Module

### 1. Create Component File
```tsx
// ui/modules/TextBlock.tsx
import { createModule } from '@/lib/contentful/utils/module'
import type { TextBlockProps } from '@/lib/contentful/types/fields' // Generated type

function TextBlockBase({ 
  title, 
  content, 
  alignment 
}: TextBlockProps) {
  return (
    <section className={`text-block text-${alignment}`}>
      {title && <h2>{title}</h2>}
      {content && <div>{content}</div>}
    </section>
  )
}

export default createModule(TextBlockBase)
```

### 2. Add to Registry
```tsx
// lib/contentful/registry.ts
import TextBlock from '@/ui/modules/TextBlock'

export const contentfulModuleRegistry: ModuleRegistry = {
  heroSection: Hero,
  cta: CTA,
  textBlock: TextBlock, // Add here with exact Contentful content type ID
}
```

### 3. Done! ✨
The module will automatically:
- Receive localized props for the current locale
- Be type-safe with generated Contentful types
- Work in any page that uses ModuleRenderer

## Architecture

```
┌─────────────────────────────────────────┐
│               Page                      │
│  ┌───────────────────────────────────┐  │
│  │         ModuleRenderer             │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │     Module Registry         │  │  │
│  │  │  heroSection: Hero          │  │  │
│  │  │  cta: CTA                   │  │  │
│  │  │  textBlock: TextBlock       │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  │  For each content module:         │  │
│  │  1. Get contentTypeId             │  │
│  │  2. Find component in registry    │  │
│  │  3. Localize props                │  │
│  │  4. Render component              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Locale Handling

### Automatic Localization
```tsx
// Input from Contentful (all locales)
{
  title: {
    "en-US": "Hello",
    "es-ES": "Hola", 
    "fr-FR": "Bonjour"
  }
}

// Output to component (single locale)
{
  title: "Hola" // For es-ES locale
}
```

### Fallback Strategy
1. Try requested locale
2. Fall back to default locale ('en-US')
3. Fall back to first available locale
4. Return undefined if no content

## Type System

```tsx
// Generated from Contentful (auto-updated)
export interface TypeHeroSectionFields {
  internalName: string
  heading?: string
  subheading?: Document
  image?: Asset
  backgroundColor?: string
  primaryCta?: Entry<TypeCTASkeleton>
  // ...
}

// Clean component props (without internalName)
export type HeroProps = OmitInternalName<
  ExtractFields<TypeHeroSection<AllLocalesChainModifiers, SupportedLocales>>
>
```

## Adding Locale Support

### 1. Update Supported Locales
```tsx
// lib/contentful/types/fields.ts
export type SupportedLocales = 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' // Add new locale
```

### 2. Regenerate Types
```bash
npm run contentful:types
```

### 3. Done!
All modules automatically support the new locale.

## Best Practices

### ✅ **Do**
- Use `createModule()` HOC for all content modules
- Keep components simple - they receive clean, localized props
- Use generated TypeScript types
- Name registry keys exactly as Contentful content type IDs

### ❌ **Don't**
- Handle localization manually in components
- Create custom prop types (use generated ones)
- Add complex logic to ModuleRenderer
- Forget to add new modules to registry

## Performance

- **Single fetch per page** - All modules and locales fetched together
- **Lazy loading** - Components only render when needed
- **Type-safe** - Zero runtime type checking overhead
- **Tree shaking** - Unused modules are automatically excluded

## Troubleshooting

### Module Not Rendering
1. Check content type ID matches registry key exactly
2. Verify module is imported and added to registry
3. Check console for ModuleRenderer warnings

### Type Errors
1. Run `npm run contentful:types` to regenerate
2. Check that content type exists in Contentful
3. Verify field names match generated types

### Locale Issues
1. Check locale is in `SupportedLocales` type
2. Verify content has translations in Contentful
3. Check fallback behavior with `getLocalizedContent`