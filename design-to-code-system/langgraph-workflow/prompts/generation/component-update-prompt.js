#!/usr/bin/env node

/**
 * COMPONENT UPDATE PROMPT
 * Builds prompts for safely updating existing React components
 * Preserves backward compatibility while adding new features
 */

export const buildComponentUpdatePrompt = (existingCode, newRequirements, updateReason) => {
  return `You are an expert React TypeScript developer tasked with updating an existing component.

**CRITICAL REQUIREMENTS:**
1. PRESERVE all existing functionality - the updated component must be backward compatible
2. ADD new features as optional - don't break existing usage
3. MAINTAIN the same export name and structure
4. KEEP existing prop interfaces - only add, never remove or rename
5. EXTEND variant objects - add new variants without removing existing ones

**EXISTING COMPONENT CODE:**
\`\`\`tsx
${existingCode}
\`\`\`

**NEW REQUIREMENTS TO ADD:**
${JSON.stringify(newRequirements, null, 2)}

**REASON FOR UPDATE:**
${updateReason}

**UPDATE GUIDELINES:**

For Adding New Variants:
- Find the existing variants object
- ADD new variant keys without modifying existing ones
- Example: if variants has "default", "primary" and you need "secondary", ADD it

For Adding New Props:
- Make new props OPTIONAL with ? syntax
- Add them to the existing interface
- Provide sensible defaults in the component

For Adding Icon Support:
- Add optional iconStart and iconEnd props
- Don't remove existing icon prop if present
- Support both patterns

For Adding New Sizes:
- Extend the sizes object with new values
- Keep all existing size options

**EXAMPLE OF SAFE UPDATE:**

Before:
\`\`\`tsx
interface ButtonProps {
  variant?: 'default' | 'primary';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const variants = {
  default: 'bg-gray-200',
  primary: 'bg-blue-600'
};
\`\`\`

After (with new secondary variant and lg size):
\`\`\`tsx
interface ButtonProps {
  variant?: 'default' | 'primary' | 'secondary'; // Added secondary
  size?: 'sm' | 'md' | 'lg'; // Added lg
  children: React.ReactNode;
  iconStart?: React.ReactNode; // Added optional
  iconEnd?: React.ReactNode; // Added optional
}

const variants = {
  default: 'bg-gray-200',
  primary: 'bg-blue-600',
  secondary: 'bg-green-600' // Added new variant
};
\`\`\`

Generate the complete updated component code that:
1. Includes ALL existing code functionality
2. Adds the new requirements
3. Is production-ready
4. Has no breaking changes`;
};

export default {
  buildComponentUpdatePrompt
};