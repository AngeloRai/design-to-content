#!/usr/bin/env node

/**
 * ATOM CONTEXT BUILDER
 * Scans atom files and extracts prop interfaces for AI context
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ATOMS_PATH = join(__dirname, '..', '..', 'nextjs-app', 'ui', 'elements');

const extractInterface = (content, componentName) => {
  const interfaceRegex = new RegExp(`interface\\s+${componentName}Props[^{]*{([^}]+)}`, 's');
  const match = content.match(interfaceRegex);

  if (!match) return null;

  const interfaceBody = match[1];

  const propRegex = /(\w+)\??\s*:\s*([^;,\n]+)/g;
  const props = [];
  let propMatch;

  while ((propMatch = propRegex.exec(interfaceBody)) !== null) {
    const [, name, type] = propMatch;
    if (name !== 'className' && name !== 'children') {
      props.push(`${name}: ${type.trim()}`);
    }
  }

  return props.join(', ');
};

const generateExample = (componentName, props) => {
  if (!props) return `<${componentName} />`;

  const hasProps = props && props.trim().length > 0;
  if (hasProps) {
    return `<${componentName} /* use props: ${props} */ />`;
  }

  return `<${componentName} />`;
};

export const buildAtomContext = () => {
  try {
    const atomFiles = readdirSync(ATOMS_PATH).filter(file => file.endsWith('.tsx'));
    const atomContext = {};

    console.log(`📋 Scanning ${atomFiles.length} atom files...`);

    for (const file of atomFiles) {
      const componentName = file.replace('.tsx', '');
      const filePath = join(ATOMS_PATH, file);
      const content = readFileSync(filePath, 'utf-8');

      const props = extractInterface(content, componentName);
      const example = generateExample(componentName, props);

      atomContext[componentName] = {
        name: componentName,
        props: props || 'No specific props',
        import: `import { ${componentName} } from '@/ui/elements/${componentName}';`,
        example,
        file: `elements/${file}`
      };
    }

    console.log(`✅ Built context for ${Object.keys(atomContext).length} atoms`);
    return atomContext;

  } catch (error) {
    console.error('❌ Error building atom context:', error.message);
    return {};
  }
};

export const formatAtomContextForAI = (atomContext) => {
  let formatted = 'AVAILABLE ATOMS:\n\n';

  for (const atom of Object.values(atomContext)) {
    formatted += `**${atom.name}**\n`;
    formatted += `- Import: ${atom.import}\n`;
    formatted += `- Props: ${atom.props}\n`;
    formatted += `- Example: ${atom.example}\n\n`;
  }

  formatted += `IMPORTANT RULES:
- Use ONLY these atoms above
- Import from the exact paths shown
- Follow the prop types exactly
- Compose atoms logically based on visual analysis
- Save molecules to /ui/components/ folder\n`;

  return formatted;
};