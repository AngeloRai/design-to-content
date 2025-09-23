# Contentful Types Guide

## Overview
This project uses `contentful-typescript-codegen` to generate TypeScript types from your Contentful content models.

## Setup

### 1. Environment Variables
Copy `.env.example` to `.env.local` and add your Contentful credentials:
```bash
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_API_KEY=your_delivery_api_key
CONTENTFUL_PREVIEW_API_KEY=your_preview_api_key
CONTENTFUL_MANAGEMENT_API_TOKEN=your_management_token_for_codegen
```

### 2. Generate Types
Run the codegen command after creating/updating content types in Contentful:
```bash
npm run contentful:types
```

For development with auto-regeneration:
```bash
npm run contentful:types:watch
```

## File Structure

```
lib/contentful/
├── contentful.ts           # Client setup
├── types/
│   ├── fields.ts           # Clean type exports for components
│   ├── manual-types.ts    # Manual type definitions (before codegen)
│   └── generated/          # Auto-generated types (DO NOT EDIT)
│       └── TypeCTA.ts
│       └── TypeHeroSection.ts
└── fetchers/
    └── base.ts            # Generic fetch utilities
```

## Usage Examples

### 1. In Components
```typescript
import type { TypeHeroSectionSkeleton } from '@/lib/contentful/types/generated/TypeHeroSection'
import type { ComponentFields } from '@/lib/contentful/types/fields'

type HeroProps = ComponentFields<Entry<TypeHeroSectionSkeleton>>

export function Hero({ heading, subheading, image, primaryCta }: HeroProps) {
  return (
    <div>
      <h1>{heading}</h1>
      <p>{subheading}</p>
      {primaryCta && <CTA {...primaryCta.fields} />}
    </div>
  )
}
```

### 2. Fetching Data
```typescript
import { fetchEntry } from '@/lib/contentful/fetchers/base'
import type { TypeHeroSectionSkeleton } from '@/lib/contentful/types/generated/TypeHeroSection'

export async function getHero(internalName: string) {
  const hero = await fetchEntry<TypeHeroSectionSkeleton>(
    'heroSection',
    { 'fields.internalName': internalName },
    { include: 2 }
  )
  
  return hero?.fields
}
```

### 3. Page Integration
```typescript
import { getHero } from '@/lib/contentful/fetchers/hero'
import { Hero } from '@/ui/modules/Hero'

export default async function HomePage() {
  const heroData = await getHero('Homepage Hero')
  
  if (!heroData) return null
  
  return <Hero {...heroData} />
}
```

## Adding New Content Types

1. Create content type in Contentful CMS
2. Add manual types to `manual-types.ts` (optional, for immediate use)
3. Run `npm run contentful:types` to generate types
4. Create fetcher functions if needed
5. Use generated types in components

## Best Practices

1. **Always use generated types** when available
2. **Use ComponentFields helper** to extract clean props
3. **Set include parameter** appropriately for linked content
4. **Handle null/undefined** in fetchers and components
5. **Keep manual types** until codegen is confirmed working