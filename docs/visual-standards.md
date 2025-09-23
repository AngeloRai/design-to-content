# Visual Standards for Atomic Design System

*Extracted from Figma design requirements and quality assurance practices*

## Core Visual Requirements

### Pixel-Perfect Accuracy
- **Use exact Figma measurements** - No approximations
- **Tailwind arbitrary values required** - `px-[Npx]`, `py-[Npx]`, etc.
- **Visual verification mandatory** - Screenshot comparison with Figma
- **Color precision** - Extract exact hex values from Figma designs

### Design Token Standards

#### Colors
- Extract exact colors from Figma using `get_code` tool
- Use rgba values when specified in design
- Maintain color consistency across all variants

#### Typography
- **Font families**: Use exact font specifications from Figma
- **Font weights**: Semi Bold, Medium, Regular as specified
- **Text sizes**: Use precise px values, not approximations
- **Line heights**: Follow Figma leading specifications

#### Spacing & Layout
- **Padding**: Use exact px values from Figma measurements
- **Margins**: Follow spacing specifications precisely
- **Border radius**: Use exact border-radius values
- **Borders**: Match width, style, and color exactly

### Component Variant Hierarchy

**CRITICAL RULE**: Size > Style > State

#### Size Variants Must Be Visually Distinct
- **Small buttons**: Significantly smaller dimensions
- **Default buttons**: Medium baseline dimensions
- **Large buttons**: Noticeably larger dimensions
- **Sizes should be clearly different to user's eye**

#### Style Variants
- Primary, secondary, destructive, outline, ghost, link
- Each must have distinct visual appearance
- Colors and backgrounds should clearly differentiate purpose

#### State Variants
- Normal, hover, focus, active, disabled
- Interactive states even if not specified in Figma
- Proper accessibility contrast ratios

## Quality Assurance Checklist

### Visual Verification Process
1. **Take Figma reference screenshot**
2. **Implement component with exact measurements**
3. **Add to showcase page immediately**
4. **Take implementation screenshot**
5. **Compare side-by-side visually**
6. **Fix ALL discrepancies before proceeding**
7. **Re-verify until perfect match**

### Common Visual Issues Prevention
- **Size variants too similar** - Ensure significant dimension differences
- **Color approximations** - Always use exact hex/rgba values
- **Missing interactive states** - Add hover, focus, disabled states
- **Typography inconsistencies** - Match font, size, weight exactly
- **Spacing irregularities** - Use precise padding/margin values

### Component-Specific Standards

#### Buttons
- Distinct size differences (height variations of 8px+ minimum)
- Clear color differences between variants
- Proper interactive state feedback
- Consistent padding ratios

#### Form Controls
- Consistent border treatments
- Proper focus states with ring effects
- Error state styling
- Disabled state visual feedback

#### Display Elements
- Appropriate sizing for content
- Consistent color schemes
- Proper spacing relationships

## Implementation Standards

### File Organization
- Elements (atoms): `ui/elements/`
- Components (molecules): `ui/components/`
- Modules (organisms): `ui/modules/`
- Icons: `ui/icons/`

### TypeScript Requirements
- Proper interface definitions
- Strict typing for all props
- Variant types matching design system
- Optional prop handling

### Documentation
- Component showcased in GEG page
- All variants demonstrated
- Interactive states visible
- Usage examples provided

## Success Criteria

A component is complete only when:
- ✅ **Visual accuracy verified** - Matches Figma exactly
- ✅ **All variants implemented** - No missing states or styles
- ✅ **TypeScript compliance** - Proper typing throughout
- ✅ **Interactive states working** - Hover, focus, disabled functional
- ✅ **Showcase integration** - Added to GEG page with examples
- ✅ **Pixel measurements exact** - No approximated values

**Visual accuracy is non-negotiable. Every component must pass visual verification before being marked complete.**