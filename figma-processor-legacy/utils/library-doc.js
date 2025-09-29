#!/usr/bin/env node

/**
 * LIBRARY DOCUMENTATION ENGINE
 * Scans UI components and generates comprehensive documentation
 * for AI consumption during molecule generation
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration - use relative paths from project structure
const UI_PATH = join(__dirname, '..', '..', 'nextjs-app', 'ui');
const DOCS_PATH = join(__dirname, '..', 'data', 'library-docs.json');

// Cached library state
let cachedLibraryState = null;

/**
 * Load existing documentation if available
 */
const loadExistingDocs = () => {
  if (existsSync(DOCS_PATH)) {
    try {
      const content = readFileSync(DOCS_PATH, 'utf8');

      // Check if file has content before parsing
      if (content.trim().length === 0) {
        console.log('📄 Empty library docs file found, starting fresh');
        return createDefaultLibraryStructure();
      }

      return JSON.parse(content);
    } catch (error) {
      console.warn('Could not load existing docs, starting fresh:', error.message);
    }
  }
  return createDefaultLibraryStructure();
};

/**
 * Create default library structure
 */
const createDefaultLibraryStructure = () => {
  return {
    atoms: {},
    molecules: {},
    lastUpdated: null,
    version: '1.0.0'
  };
};

/**
 * Recursively find all .tsx files
 */
const findTsxFiles = (dir, files = []) => {
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findTsxFiles(fullPath, files);
    } else if (stat.isFile() && extname(item) === '.tsx') {
      files.push(fullPath);
    }
  }

  return files;
};

/**
 * Determine if component is atom or molecule based on file path
 */
const determineComponentType = (relativePath) => {
  if (relativePath.startsWith('elements/')) {
    return 'atom';
  } else if (relativePath.startsWith('components/')) {
    return 'molecule';
  } else if (relativePath.startsWith('modules/')) {
    return 'organism';
  }
  return 'unknown';
};

/**
 * Extract metadata from component header comments
 */
const extractMetadata = (content) => {
  const metadata = {};

  // Look for quality score
  const qualityMatch = content.match(/\/\/ Quality Score: ([\d.]+)/);
  if (qualityMatch) {
    metadata.qualityScore = parseFloat(qualityMatch[1]);
  }

  // Look for node ID
  const nodeMatch = content.match(/\/\/ Node ID: (.+)/);
  if (nodeMatch) {
    metadata.nodeId = nodeMatch[1].trim();
  }

  // Look for verification status
  const verificationMatch = content.match(/\/\/ Verification: (\w+)/);
  if (verificationMatch) {
    metadata.verified = verificationMatch[1] === 'verified';
  }

  return metadata;
};

/**
 * Parse properties from interface body
 */
const parseInterfaceProperties = (interfaceBody) => {
  const properties = {};

  // Simple property parsing - can be enhanced
  const lines = interfaceBody.split('\n').map(line => line.trim()).filter(Boolean);

  for (const line of lines) {
    const propMatch = line.match(/(\w+)(\?)?:\s*([^;]+);?/);
    if (propMatch) {
      const [, name, optional, type] = propMatch;
      properties[name] = {
        name,
        type: type.trim(),
        required: !optional,
        description: null // Could be enhanced to parse JSDoc
      };
    }
  }

  return properties;
};

/**
 * Extract TypeScript interfaces from component
 */
const extractInterfaces = (content) => {
  const interfaces = {};

  // Match interface definitions
  const interfaceRegex = /interface\s+(\w+)\s*(?:extends\s+[^{]+)?\s*{([^}]+)}/g;
  let match;

  while ((match = interfaceRegex.exec(content)) !== null) {
    const interfaceName = match[1];
    const interfaceBody = match[2];

    interfaces[interfaceName] = {
      name: interfaceName,
      properties: parseInterfaceProperties(interfaceBody),
      raw: match[0]
    };
  }

  return interfaces;
};

/**
 * Parse variant options from CVA
 */
const parseVariantOptions = (variantBody) => {
  const options = {};

  // Parse each variant category
  const categoryRegex = /(\w+):\s*{([^}]+)}/g;
  let match;

  while ((match = categoryRegex.exec(variantBody)) !== null) {
    const categoryName = match[1];
    const categoryBody = match[2];

    options[categoryName] = {};

    // Parse individual options
    const optionRegex = /(\w+):\s*"([^"]+)"/g;
    let optionMatch;

    while ((optionMatch = optionRegex.exec(categoryBody)) !== null) {
      options[categoryName][optionMatch[1]] = optionMatch[2];
    }
  }

  return options;
};

/**
 * Parse default variants
 */
const parseDefaultVariants = (defaultBody) => {
  const defaults = {};

  const lines = defaultBody.split(',').map(line => line.trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/(\w+):\s*"(\w+)"/);
    if (match) {
      defaults[match[1]] = match[2];
    }
  }

  return defaults;
};

/**
 * Extract CVA variants from component
 */
const extractVariants = (content) => {
  const variants = {};

  // Look for cva definition
  const cvaMatch = content.match(/const\s+\w+Variants\s*=\s*cva\s*\(\s*"([^"]+)",\s*{\s*variants:\s*{([^}]+)}/s);

  if (cvaMatch) {
    const baseClasses = cvaMatch[1];
    const variantBody = cvaMatch[2];

    variants.baseClasses = baseClasses;
    variants.options = parseVariantOptions(variantBody);

    // Extract default variants
    const defaultMatch = content.match(/defaultVariants:\s*{([^}]+)}/s);
    if (defaultMatch) {
      variants.defaults = parseDefaultVariants(defaultMatch[1]);
    }
  }

  return variants;
};

/**
 * Extract component dependencies (imports)
 */
const extractDependencies = (content) => {
  const dependencies = {
    internal: [],
    external: [],
    atoms: [],
    utilities: []
  };

  // Find all import statements
  const importRegex = /import\s+(?:{[^}]+}|[^{}\n]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    if (importPath.startsWith('@/')) {
      dependencies.internal.push(importPath);

      // Check if importing from UI library
      if (importPath.includes('/ui/elements/')) {
        const atomName = importPath.split('/').pop();
        dependencies.atoms.push(atomName);
      } else if (importPath.includes('/lib/utils')) {
        dependencies.utilities.push('cn');
      }
    } else if (!importPath.startsWith('.')) {
      dependencies.external.push(importPath);
    }
  }

  return dependencies;
};



/**
 * Analyze a single component file
 */
const analyzeComponent = async (filePath) => {
  const content = readFileSync(filePath, 'utf8');
  const relativePath = filePath.replace(UI_PATH, '').replace(/^\//, '');
  const componentName = basename(filePath, '.tsx');

  // Determine component type based on path
  const componentType = determineComponentType(relativePath);

  // Parse component metadata
  const metadata = extractMetadata(content);

  // Parse TypeScript interfaces
  const interfaces = extractInterfaces(content);

  // Parse variants (if using cva)
  const variants = extractVariants(content);

  // Parse imports and dependencies
  const dependencies = extractDependencies(content);

  // Extract usage examples
  const examples = [];

  const componentDoc = {
    name: componentName,
    type: componentType,
    filePath: relativePath,
    absolutePath: filePath,
    lastModified: new Date().toISOString(),
    metadata,
    interfaces,
    variants,
    dependencies,
    examples,
    qualityScore: metadata.qualityScore,
    nodeId: metadata.nodeId,
    verified: metadata.verified,
    composition: componentType === 'molecule' ? { usesAtoms: [], complexity: 'simple' } : null
  };

  return componentDoc;
};

/**
 * Save documentation to file
 */
const saveDocs = async (docs) => {
  const docDir = dirname(DOCS_PATH);
  if (!existsSync(docDir)) {
    mkdirSync(docDir, { recursive: true });
  }

  writeFileSync(DOCS_PATH, JSON.stringify(docs, null, 2));
  cachedLibraryState = docs;

  return docs;
};

/**
 * Scan all UI components and generate documentation
 */
export const generateLibraryDocs = async () => {
  console.log('🔍 Scanning UI library for components...');
  console.log(`   Scanning: ${UI_PATH}`);

  // Check what folders exist to scan
  const uiFolders = readdirSync(UI_PATH).filter(item =>
    statSync(join(UI_PATH, item)).isDirectory()
  );
  console.log(`   UI folders found: ${uiFolders.join(', ')}`);

  // Find all component files
  const componentFiles = findTsxFiles(UI_PATH);

  console.log(`   Found ${componentFiles.length} component files`);

  const docs = {
    atoms: {},
    molecules: {},
    lastUpdated: new Date().toISOString(),
    version: '1.0.0',
    summary: {
      totalAtoms: 0,
      totalMolecules: 0,
      lastScan: new Date().toISOString()
    }
  };

  for (const filePath of componentFiles) {
    try {
      const componentDoc = await analyzeComponent(filePath);
      if (componentDoc) {
        if (componentDoc.type === 'atom') {
          docs.atoms[componentDoc.name] = componentDoc;
          docs.summary.totalAtoms++;
        } else if (componentDoc.type === 'molecule') {
          docs.molecules[componentDoc.name] = componentDoc;
          docs.summary.totalMolecules++;
        }
      }
    } catch (error) {
      console.warn(`   ⚠️  Failed to analyze ${basename(filePath)}: ${error.message}`);
    }
  }

  // Save documentation
  await saveDocs(docs);

  console.log('✅ Library documentation generated:');
  console.log(`   📋 Atoms: ${docs.summary.totalAtoms} (elements/)`);
  console.log(`   🧩 Molecules: ${docs.summary.totalMolecules} (components/)`);
  console.log(`   🏗️  Organisms: ${docs.summary.totalOrganisms || 0} (modules/)`);

  // Show per-folder breakdown
  const folderBreakdown = {};
  Object.values(docs.atoms).forEach(atom => {
    const folder = atom.filePath.split('/')[0];
    folderBreakdown[folder] = (folderBreakdown[folder] || 0) + 1;
  });
  Object.values(docs.molecules).forEach(molecule => {
    const folder = molecule.filePath.split('/')[0];
    folderBreakdown[folder] = (folderBreakdown[folder] || 0) + 1;
  });

  if (Object.keys(folderBreakdown).length > 0) {
    console.log(`   📁 By folder:`, Object.entries(folderBreakdown)
      .map(([folder, count]) => `${folder}: ${count}`).join(', ')
    );
  }

  return docs;
};

/**
 * Get current library documentation
 */
export const getLibraryDocs = () => {
  if (!cachedLibraryState) {
    cachedLibraryState = loadExistingDocs();
  }
  return cachedLibraryState;
};

/**
 * Generate AI context from library docs (replaces buildAtomContext)
 */
export const generateAIContext = (includeAtoms = true, includeMolecules = false) => {
  const docs = getLibraryDocs();
  const context = {};

  // Process atoms
  if (includeAtoms && docs.atoms) {
    Object.values(docs.atoms).forEach(atom => {
      context[atom.name] = {
        name: atom.name,
        type: 'atom',
        props: extractPropsFromInterfaces(atom.interfaces),
        import: `import { ${atom.name} } from '@/ui/elements/${atom.name}';`,
        example: generateExampleFromProps(atom.name, atom.interfaces),
        file: atom.filePath
      };
    });
  }

  // Process molecules
  if (includeMolecules && docs.molecules) {
    Object.values(docs.molecules).forEach(molecule => {
      context[molecule.name] = {
        name: molecule.name,
        type: 'molecule',
        props: extractPropsFromInterfaces(molecule.interfaces),
        import: `import { ${molecule.name} } from '@/ui/components/${molecule.name}';`,
        example: generateExampleFromProps(molecule.name, molecule.interfaces),
        file: molecule.filePath
      };
    });
  }

  return context;
};

/**
 * Extract simplified props string from interfaces (like buildAtomContext)
 */
const extractPropsFromInterfaces = (interfaces) => {
  if (!interfaces || Object.keys(interfaces).length === 0) {
    return 'No specific props';
  }

  const mainInterface = Object.values(interfaces)[0]; // Get first interface
  if (!mainInterface.properties) return 'No specific props';

  const props = [];
  Object.values(mainInterface.properties).forEach(prop => {
    if (prop.name !== 'className' && prop.name !== 'children') {
      const optional = prop.required ? '' : '?';
      props.push(`${prop.name}${optional}: ${prop.type}`);
    }
  });

  return props.length > 0 ? props.join(', ') : 'No specific props';
};

/**
 * Generate usage example from interfaces
 */
const generateExampleFromProps = (componentName, interfaces) => {
  if (!interfaces || Object.keys(interfaces).length === 0) {
    return `<${componentName} />`;
  }

  const mainInterface = Object.values(interfaces)[0];
  if (!mainInterface.properties) return `<${componentName} />`;

  const hasProps = Object.keys(mainInterface.properties).some(
    prop => prop !== 'className' && prop !== 'children'
  );

  if (hasProps) {
    const propsString = extractPropsFromInterfaces(interfaces);
    return `<${componentName} /* use props: ${propsString} */ />`;
  }

  return `<${componentName} />`;
};

/**
 * Format AI context for consumption (matches formatAtomContextForAI)
 */
export const formatAIContextForAI = (context) => {
  let formatted = 'AVAILABLE COMPONENTS:\n\n';

  for (const component of Object.values(context)) {
    formatted += `**${component.name}** (${component.type})\n`;
    formatted += `- Import: ${component.import}\n`;
    formatted += `- Props: ${component.props}\n`;
    formatted += `- Example: ${component.example}\n\n`;
  }

  return formatted;
};

/**
 * Get specific component documentation
 */
export const getComponentDoc = (componentName, type = 'atom') => {
  const docs = getLibraryDocs();
  return type === 'atom' ? docs.atoms[componentName] : docs.molecules[componentName];
};

/**
 * Update documentation for a specific component
 */
export const updateComponentDoc = async (componentName, componentPath, type = 'atom') => {
  console.log(`🔄 Updating documentation for ${componentName}...`);

  const componentDoc = await analyzeComponent(componentPath);
  if (componentDoc) {
    const docs = getLibraryDocs();

    if (type === 'atom') {
      docs.atoms[componentName] = componentDoc;
    } else {
      docs.molecules[componentName] = componentDoc;
    }

    docs.lastUpdated = new Date().toISOString();
    await saveDocs(docs);

    console.log(`✅ Updated documentation for ${componentName}`);
  }

  return componentDoc;
};

/**
 * CLI usage
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'generate':
      generateLibraryDocs();
      break;
    case 'show':
      console.log(JSON.stringify(getLibraryDocs(), null, 2));
      break;
    default:
      console.log('Usage: node library-doc.js [generate|show]');
  }
}