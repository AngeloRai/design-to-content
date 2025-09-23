# Contentful Integration Strategy

*Phase 2 implementation guide for CMS integration with atomic design components*

## Integration Overview

### CMS Integration Scope
- **Atoms (Elements)**: No CMS - Pure React components
- **Molecules (Components)**: Individual Contentful content types
- **Organisms (Modules)**: Complex Contentful content types with references

### Sequential Implementation Strategy

#### Phase 1: Atoms Complete (Prerequisites)
- All elements built and tested
- Visual verification passed
- Component showcase working
- TypeScript interfaces established

#### Phase 2: Molecule CMS Integration
**Per-molecule process**:
1. Analyze Figma molecule design
2. Identify required content fields
3. Create Contentful content type
4. Generate TypeScript types
5. Build molecule component with CMS types
6. Create migration script
7. Test with real CMS data

#### Phase 3: Organism CMS Integration
**Complex relationships**:
1. Analyze organism structure
2. Design content type relationships
3. Handle nested component references
4. Generate advanced TypeScript types
5. Build responsive organisms
6. Integration testing

## Content Type Design Patterns

### Molecule Content Types

#### Simple Molecule Example: CTA Component
```javascript
// contentful/migrations/create-cta-component.js
module.exports = function(migration) {
  const cta = migration.createContentType('ctaComponent', {
    name: 'CTA Component',
    description: 'Call-to-action molecule combining button, text, and optional icon'
  });

  cta.createField('buttonText', {
    name: 'Button Text',
    type: 'Symbol',
    required: true
  });

  cta.createField('buttonVariant', {
    name: 'Button Style',
    type: 'Symbol',
    validations: [{
      in: ['primary', 'secondary', 'destructive', 'outline', 'ghost', 'link']
    }],
    defaultValue: { 'en-US': 'primary' }
  });

  cta.createField('buttonSize', {
    name: 'Button Size',
    type: 'Symbol',
    validations: [{
      in: ['small', 'default', 'large']
    }],
    defaultValue: { 'en-US': 'default' }
  });

  cta.createField('link', {
    name: 'Link URL',
    type: 'Symbol',
    required: false
  });

  cta.createField('iconName', {
    name: 'Icon Name',
    type: 'Symbol',
    required: false
  });
};
```

#### Generated TypeScript Types
```typescript
// lib/contentful/types/generated/TypeCtaComponent.ts
export interface TypeCtaComponentFields {
  buttonText: EntryFieldTypes.Symbol;
  buttonVariant?: EntryFieldTypes.Symbol<'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'>;
  buttonSize?: EntryFieldTypes.Symbol<'small' | 'default' | 'large'>;
  link?: EntryFieldTypes.Symbol;
  iconName?: EntryFieldTypes.Symbol;
}

export type TypeCtaComponent = Entry<TypeCtaComponentFields>;
```

#### Component Implementation
```typescript
// ui/components/CTA.tsx
import React from 'react';
import { Button } from '../elements/Button';
import { Icon } from '../elements/Icon';
import { TypeCtaComponentFields } from '../../lib/contentful/types/generated/TypeCtaComponent';

export const CTA: React.FC<TypeCtaComponentFields> = ({
  buttonText,
  buttonVariant = 'primary',
  buttonSize = 'default',
  link,
  iconName
}) => {
  return (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      href={link}
    >
      {iconName && <Icon name={iconName} />}
      {buttonText}
    </Button>
  );
};

export type CTAProps = TypeCtaComponentFields;
```

### Complex Organism Content Types

#### Advanced Example: Hero Module
```javascript
// contentful/migrations/create-hero-module.js
module.exports = function(migration) {
  const hero = migration.createContentType('heroModule', {
    name: 'Hero Module',
    description: 'Complex hero section with multiple molecules'
  });

  hero.createField('headline', {
    name: 'Headline',
    type: 'Symbol',
    required: true
  });

  hero.createField('subheadline', {
    name: 'Subheadline',
    type: 'Text',
    required: false
  });

  hero.createField('primaryCta', {
    name: 'Primary CTA',
    type: 'Link',
    linkType: 'Entry',
    validations: [{
      linkContentType: ['ctaComponent']
    }],
    required: true
  });

  hero.createField('secondaryCta', {
    name: 'Secondary CTA',
    type: 'Link',
    linkType: 'Entry',
    validations: [{
      linkContentType: ['ctaComponent']
    }],
    required: false
  });

  hero.createField('backgroundImage', {
    name: 'Background Image',
    type: 'Link',
    linkType: 'Asset',
    validations: [{
      linkMimetypeGroup: ['image']
    }]
  });

  hero.createField('layout', {
    name: 'Layout Style',
    type: 'Symbol',
    validations: [{
      in: ['centered', 'left-aligned', 'right-aligned', 'split']
    }],
    defaultValue: { 'en-US': 'centered' }
  });
};
```

## Implementation Workflow

### Molecule Processing Sequence
```bash
# 1. Analyze molecule in Figma
npm run figma:analyze-molecule --node-id="123:456"

# 2. Create content type based on analysis
npm run contentful:create-migration --name="create-cta-component"

# 3. Run migration
npm run migrate:create-cta-component

# 4. Generate TypeScript types
npm run contentful:types

# 5. Build component with generated types
# (Manual implementation using generated interfaces)

# 6. Test with CMS data
npm run dev
```

### Quality Assurance Process
```typescript
// Test component with real Contentful data
const testCTA = {
  buttonText: "Get Started",
  buttonVariant: "primary" as const,
  buttonSize: "large" as const,
  link: "/signup",
  iconName: "arrow-right"
};

// Component should render without TypeScript errors
<CTA {...testCTA} />
```

## Benefits of This Approach

### Type Safety Throughout
- **Compile-time validation**: Component props match CMS fields exactly
- **IntelliSense support**: Auto-completion for content fields
- **Error prevention**: Mismatched types caught early

### Content Editor Experience
- **Clear field names**: Descriptive labels for content editors
- **Validation rules**: Prevent invalid content entry
- **Default values**: Sensible defaults for optional fields
- **Relationship clarity**: Clear connections between components

### Developer Experience
- **Auto-generated types**: No manual type maintenance
- **Consistent patterns**: Standardized content type structures
- **Migration scripts**: Version-controlled schema changes
- **Testing support**: Real data available during development

## Migration Script Organization

### File Structure
```
contentful/migrations/
├── create/
│   ├── create-cta-component.js
│   ├── create-hero-module.js
│   └── create-card-component.js
├── update/
│   ├── update-cta-add-size-field.js
│   └── update-hero-add-layout.js
└── delete/
    └── remove-deprecated-fields.js
```

### Migration Commands
```bash
# Run specific migration
npm run migrate:create-cta-component

# Run all pending migrations
npm run migrate:all

# Generate new migration template
npm run migration:create --name="create-new-component"
```

## Success Criteria

### Molecule Integration Complete
- ✅ **Content type created**: Migration script executed
- ✅ **Types generated**: TypeScript interfaces updated
- ✅ **Component built**: Using exact CMS field types
- ✅ **Testing verified**: Component works with real CMS data
- ✅ **Documentation updated**: Usage examples provided

### Organism Integration Complete
- ✅ **Complex relationships**: Nested content type references working
- ✅ **Advanced types**: Complex TypeScript interfaces generated
- ✅ **Responsive design**: Organisms adapt to different layouts
- ✅ **Integration testing**: Full CMS workflow verified
- ✅ **Performance optimized**: Efficient content fetching

**This CMS integration strategy ensures that the design system components are perfectly aligned with content management needs while maintaining type safety and developer experience.**