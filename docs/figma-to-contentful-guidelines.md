# Figma to Contentful Content Modeling Guidelines

## Overview
This document provides guidelines for translating Figma designs into Contentful content types, helping determine when to create separate content types versus variations within a single type.

## Atomic Design System Hierarchy

### In Our System:
- **Atoms (Elements)**: Shared, reusable React components used across different components and modules
  - Located in `/ui/elements/`
  - Examples: Button, Badge, Icon, Link, Heading
  - Highly reusable across the entire codebase
  - Accept props for customization but don't have their own Contentful types
  - Can be used in both Components and Modules

- **Molecules (Components)**: Combinations of elements that form reusable UI patterns
  - Located in `/ui/components/`
  - Examples: Card (used in grids), CTA (used in heroes), Testimonial (used in carousels)
  - Cannot stand alone as page sections
  - May be represented as embedded fields or embeddable content types in Contentful
  - Often composed of multiple Elements (e.g., Card uses Button, Heading, and Image elements)

- **Organisms (Modules)**: Standalone page sections that combine Components and Elements
  - Located in `/ui/modules/`
  - Examples: Hero variants, Grid (containing Cards), Navbar, Footer
  - Can function independently on a page
  - Represented as content types in Contentful
  - Compose Components and Elements to create complete page sections

## Decision Framework: Separate Types vs Single Type with Variations

### Create SEPARATE Content Types When:
1. **Different required fields** - Each variant needs different mandatory data
2. **Minimal field overlap** - Less than 50% shared fields between variants
3. **Distinct purposes** - Each serves fundamentally different use cases
4. **Complex validation rules** - Each variant has unique field dependencies
5. **Clean editor experience needed** - Avoid confusing editors with irrelevant fields

### Use SINGLE Content Type with Variations When:
1. **Mostly shared fields** - 70%+ fields are common across variants
2. **Same core purpose** - Variants are stylistic rather than functional
3. **Simple differences** - Variations only affect display options
4. **Predictable patterns** - Clear relationship between variant selection and field usage

## Hero Module Case Study

### Figma Design Analysis:
When analyzing hero components in Figma, identified:
- 4 distinct hero types: Full Bleed, Shop, Blog, Utility
- Each with significantly different content needs
- Shop requires product fields, Blog needs author/date, Utility is minimal

### Decision: Separate Content Types
Created individual types because:
- **Shop Hero**: Requires product image, price, product tag (unique fields)
- **Blog Hero**: Needs author reference, publish date, read time, category (unique fields)
- **Utility Hero**: Minimal fields, no background image needed
- **Full Bleed Hero**: Focus on visual impact with scroll indicators

Each type has ~30% overlap (headline, CTA), but 70% unique fields = separate types.

## Content Modeling Best Practices

### 1. Component Embedding Strategy
```javascript
// DON'T: Create separate content types for components that can't stand alone
❌ ctaModule (as standalone content type)

// DO: Embed component fields directly in modules
✅ heroFullBleed {
    ctaLabel: Symbol
    ctaUrl: Symbol
    ctaStyle: Symbol
}

// OR: Create embeddable component type (not standalone module)
✅ ctaComponent (embedded only, never standalone)
```

### Example: Card Component in Grid Module
```javascript
// Card is a Component (Molecule) used within Grid Module
gridModule {
  cards: [Reference] // References to cardComponent
}

cardComponent {  // Embeddable only
  title: Symbol
  description: Text
  image: Media
  ctaLabel: Symbol  // Card uses Button element internally
  ctaUrl: Symbol
}

// File structure:
// /ui/elements/Button.tsx     - Reusable button element
// /ui/components/Card.tsx     - Card component using Button element
// /ui/modules/Grid.tsx        - Grid module containing Cards

// The Card React component would use shared Button element:
// <Card> renders <Button>{ctaLabel}</Button>
```

### 2. Field Duplication is Acceptable
When creating separate content types, duplicating common fields is preferable to complex inheritance:
```javascript
// Simple and clear - duplicate common fields
heroShop {
  headline: Symbol
  backgroundImage: Media
  // ... shop-specific fields
}

heroBlog {
  headline: Symbol  // Duplicated, but clear
  backgroundImage: Media  // Duplicated, but clear
  // ... blog-specific fields
}
```

### 3. Responsive Considerations
Always consider mobile/desktop variants:
```javascript
backgroundImage: Media (required)
backgroundImageMobile: Media (optional)  // Art direction control
```

## Workflow: Figma to Contentful

### Step 1: Analyze Figma Components
- Use `mcp__figma-dev-mode-mcp-server__get_code` to examine structure
- Identify all variants and their unique properties
- Note required vs optional elements

### Step 2: Map to Atomic Design
- **Module (Organism)?** → Create content type(s)
- **Component (Molecule)?** → Embed fields or create embeddable type
- **Element (Atom)?** → Reusable React component, no Contentful type needed

### Step 3: Evaluate Variation Strategy
- List all fields needed for each variant
- Calculate overlap percentage
- Apply decision framework

### Step 4: Create Migration Scripts
- Follow existing patterns in `/scripts/contentful-migrations/`
- One migration file per content type
- Include proper validation and help text

## Example Migration Pattern
```javascript
// For separate hero types approach
// scripts/contentful-migrations/001-create-hero-shop.js
module.exports = function (migration) {
  const heroShop = migration
    .createContentType('heroShop')
    .name('Hero - Shop')
    .displayField('internalName')
    .description('Hero with product showcase');

  // Common fields
  heroShop.createField('headline')
    .name('Headline')
    .type('Symbol')
    .required(true);

  // Type-specific fields
  heroShop.createField('productImage')
    .name('Product Image')
    .type('Link')
    .linkType('Asset')
    .required(true)
    .validations([{
      linkMimetypeGroup: ['image']
    }]);
}
```

## Key Principles

1. **Simplicity over DRY** - Some duplication is better than complexity
2. **Editor experience first** - Clear, focused interfaces for content editors
3. **Type safety** - Structure that generates clean TypeScript types
4. **Atomic design alignment** - Contentful structure mirrors component architecture
5. **Maintenance-friendly** - Easy to modify one type without affecting others

## Red Flags to Avoid

- ❌ Too many conditional fields in one content type
- ❌ Complex visibility rules based on variant selection
- ❌ Standalone content types for components that are never used alone
- ❌ Over-engineering with abstract base types
- ❌ Ignoring mobile/desktop responsive needs

## Quick Decision Tree

```
Is this a module (organism)?
├─ No → Embed as fields in parent module
└─ Yes → Do variants share >70% of fields?
    ├─ No → Create separate content types
    └─ Yes → Are the differences just styling?
        ├─ No → Create separate content types
        └─ Yes → Single type with variant field
```