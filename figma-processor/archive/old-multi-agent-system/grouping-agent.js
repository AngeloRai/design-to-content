#!/usr/bin/env node

/**
 * Grouping Agent - Functional Implementation
 * Processes discovery report and groups UI element variants into unified component specifications
 * Follows Size > Style > State hierarchy for variant consolidation
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PATHS = {
    dataDir: path.join(__dirname, '../data')
};

/**
 * Main grouping process
 * @param {string} discoveryReportPath - Path to discovery report JSON
 * @param {Object} options - Grouping options
 */
export async function group(discoveryReportPath, options = {}) {
    console.log('🔗 Grouping Agent: Starting variant grouping analysis...\n');

    try {
        // Load discovery report
        console.log('📄 Loading discovery report...');
        const reportData = await fs.readFile(discoveryReportPath, 'utf8');
        const discoveryReport = JSON.parse(reportData);

        console.log(`✅ Loaded report with ${Object.keys(discoveryReport.uiElements).length} categories\n`);

        // Group variants for each category
        console.log('🔄 Analyzing variants and grouping components...');
        const groupedComponents = await groupUIElementVariants(discoveryReport.uiElements, options);

        console.log(`✅ Created ${Object.keys(groupedComponents).length} component groups\n`);

        // Generate grouping report
        const report = await generateGroupingReport(
            discoveryReport,
            groupedComponents
        );

        console.log('✅ Grouping Agent: Process completed successfully!');
        console.log(`📊 Report saved to: ${report.reportPath}`);

        return report;

    } catch (error) {
        console.error('❌ Grouping Agent failed:', error.message);
        throw error;
    }
}

/**
 * Group UI elements by identifying variants and creating unified component specifications
 * @param {Object} uiElements - UI elements from discovery report
 * @param {Object} options - Grouping options
 */
async function groupUIElementVariants(uiElements, options = {}) {
    const groupedComponents = new Map();

    for (const [category, elements] of Object.entries(uiElements)) {
        console.log(`   🔍 Analyzing ${category}: ${elements.length} elements`);

        // Group elements by base component name
        const componentGroups = await groupElementsByBaseName(elements, options);

        // Process each component group
        for (const [baseName, variants] of componentGroups) {
            if (variants.length === 1) {
                // Single element - no variants
                const element = variants[0];
                const componentKey = `${category}-${baseName}`;

                groupedComponents.set(componentKey, {
                    category,
                    baseName,
                    type: 'single',
                    elements: [element],
                    variants: {
                        sizes: [],
                        styles: [],
                        states: []
                    },
                    primaryElement: element,
                    componentWorthy: element.componentWorthy
                });
            } else {
                // Multiple variants - analyze and group
                const componentSpec = await analyzeVariantGroup(category, baseName, variants, options);
                const componentKey = `${category}-${baseName}`;
                groupedComponents.set(componentKey, componentSpec);
            }
        }

        console.log(`   ✅ ${category}: ${componentGroups.size} component groups`);
    }

    return Object.fromEntries(groupedComponents);
}

/**
 * Group elements by their base component name using AI-powered analysis
 * @param {Array} elements - UI elements to group
 * @param {Object} options - Grouping options
 */
async function groupElementsByBaseName(elements, options = {}) {
    const componentGroups = new Map();

    for (const element of elements) {
        // Extract base name using AI or fallback to simple name analysis
        const baseName = await extractBaseName(element.name, options);

        if (!componentGroups.has(baseName)) {
            componentGroups.set(baseName, []);
        }
        componentGroups.get(baseName).push(element);
    }

    return componentGroups;
}

/**
 * Extract base component name from element name using AI-powered analysis
 * @param {string} elementName - Full element name
 * @param {Object} options - Extraction options
 */
async function extractBaseName(elementName, options = {}) {
    if (options.useAI && options.openaiApiKey) {
        return await extractBaseNameAI(elementName, options.openaiApiKey);
    }

    // Fallback: simple base name extraction
    return extractBaseNameBasic(elementName);
}

/**
 * AI-powered base name extraction
 * @param {string} elementName - Full element name
 * @param {string} apiKey - OpenAI API key
 */
async function extractBaseNameAI(elementName, apiKey) {
    try {
        const prompt = `Analyze this UI element name and extract the base component name:

Element Name: "${elementName}"

Extract the core component name without size, style, or state variants.

Examples:
- "Button / Primary / Large" → "Button"
- "Input Field - Error State" → "Input Field"
- "Card Default Small" → "Card"
- "Toggle Switch On" → "Toggle Switch"
- "Primary Button Disabled" → "Button"

Respond with only the base component name (no quotes).`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 20,
                temperature: 0
            })
        });

        if (!response.ok) {
            console.warn(`OpenAI API error: ${response.status}, falling back to basic extraction`);
            return extractBaseNameBasic(elementName);
        }

        const data = await response.json();
        const baseName = data.choices[0]?.message?.content?.trim();

        if (baseName && baseName.length > 0) {
            return baseName;
        }

        console.warn('Empty AI base name response, falling back to basic extraction');
        return extractBaseNameBasic(elementName);
    } catch (error) {
        console.warn(`AI base name extraction failed: ${error.message}, falling back to basic extraction`);
        return extractBaseNameBasic(elementName);
    }
}

/**
 * Basic heuristic-based base name extraction (fallback)
 * @param {string} elementName - Full element name
 */
function extractBaseNameBasic(elementName) {
    // Simple fallback - use first significant word(s)
    const cleanName = elementName
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const words = cleanName.split(' ');

    // Return first 1-2 words as base name
    if (words.length >= 2 && words[1].length > 2) {
        return `${words[0]} ${words[1]}`;
    }

    return words[0] || 'Component';
}

/**
 * Analyze a group of variants and create unified component specification
 * @param {string} category - UI element category
 * @param {string} baseName - Base component name
 * @param {Array} variants - Array of variant elements
 * @param {Object} options - Analysis options
 */
async function analyzeVariantGroup(category, baseName, variants, options = {}) {
    console.log(`     🔬 Analyzing ${variants.length} variants of ${baseName}`);

    // Extract all variant information using AI
    const variantAnalysis = await analyzeVariants(variants, options);

    // Determine primary element (largest, default, or first component-worthy)
    const primaryElement = determinePrimaryElement(variants);

    // Check if any variant is component-worthy
    const componentWorthy = variants.some(v => v.componentWorthy);

    return {
        category,
        baseName,
        type: 'variant-group',
        elements: variants,
        variants: {
            sizes: variantAnalysis.sizes,
            styles: variantAnalysis.styles,
            states: variantAnalysis.states
        },
        primaryElement,
        componentWorthy,
        variantCount: variants.length,
        hierarchy: 'Size > Style > State'
    };
}

/**
 * Analyze variants to extract size, style, and state information using AI
 * @param {Array} variants - Array of variant elements
 * @param {Object} options - Analysis options
 */
async function analyzeVariants(variants, options = {}) {
    if (options.useAI && options.openaiApiKey) {
        return await analyzeVariantsAI(variants, options.openaiApiKey);
    }

    // Fallback: basic analysis using existing variant data
    return analyzeVariantsBasic(variants);
}

/**
 * AI-powered variant analysis
 * @param {Array} variants - Array of variant elements
 * @param {string} apiKey - OpenAI API key
 */
async function analyzeVariantsAI(variants, apiKey) {
    try {
        const variantNames = variants.map(v => v.name).join('", "');

        const prompt = `Analyze these UI component variants and categorize them into Size, Style, and State variants:

Variant Names: "${variantNames}"

Categorize each variant characteristic into:
1. SIZES: Different sizes (small, medium, large, xs, sm, md, lg, xl, etc.)
2. STYLES: Visual styles (primary, secondary, outline, ghost, filled, destructive, success, warning, etc.)
3. STATES: Interactive states (default, hover, active, disabled, focused, loading, etc.)

Return a JSON object with this exact format:
{
  "sizes": ["size1", "size2"],
  "styles": ["style1", "style2"],
  "states": ["state1", "state2"]
}

Extract only the actual variants present. If no variants of a type are found, return empty arrays.
Respond with ONLY the JSON object.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 200,
                temperature: 0
            })
        });

        if (!response.ok) {
            console.warn(`OpenAI API error: ${response.status}, falling back to basic analysis`);
            return analyzeVariantsBasic(variants);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content?.trim();

        const result = JSON.parse(content);
        if (result.sizes && result.styles && result.states &&
            Array.isArray(result.sizes) && Array.isArray(result.styles) && Array.isArray(result.states)) {
            return result;
        }

        console.warn('Invalid AI variant analysis result, falling back to basic analysis');
        return analyzeVariantsBasic(variants);
    } catch (error) {
        console.warn(`AI variant analysis failed: ${error.message}, falling back to basic analysis`);
        return analyzeVariantsBasic(variants);
    }
}

/**
 * Basic heuristic-based variant analysis (fallback)
 * @param {Array} variants - Array of variant elements
 */
function analyzeVariantsBasic(variants) {
    // Combine all existing variant data from discovery
    const allSizes = new Set();
    const allStyles = new Set();
    const allStates = new Set();

    variants.forEach(variant => {
        if (variant.sizes) {
            variant.sizes.forEach(size => allSizes.add(size));
        }
        if (variant.variants) {
            variant.variants.forEach(style => allStyles.add(style));
        }
    });

    return {
        sizes: Array.from(allSizes),
        styles: Array.from(allStyles),
        states: [] // States are harder to detect without AI
    };
}

/**
 * Determine the primary element for a variant group
 * @param {Array} variants - Array of variant elements
 */
function determinePrimaryElement(variants) {
    // Priority: component-worthy > largest dimensions > first element

    // First, try component-worthy elements
    const componentWorthyVariants = variants.filter(v => v.componentWorthy);
    if (componentWorthyVariants.length > 0) {
        return componentWorthyVariants[0];
    }

    // Then, try largest element by dimensions
    const variantsWithDimensions = variants.filter(v => v.dimensions);
    if (variantsWithDimensions.length > 0) {
        const largest = variantsWithDimensions.reduce((prev, current) => {
            const prevArea = (prev.dimensions?.width || 0) * (prev.dimensions?.height || 0);
            const currentArea = (current.dimensions?.width || 0) * (current.dimensions?.height || 0);
            return currentArea > prevArea ? current : prev;
        });
        return largest;
    }

    // Fallback to first element
    return variants[0];
}

/**
 * Generate comprehensive grouping report
 */
async function generateGroupingReport(discoveryReport, groupedComponents) {
    const report = {
        parentNode: discoveryReport.parentNode,
        figmaFileKey: discoveryReport.figmaFileKey,
        groupedComponents,
        processingMeta: {
            timestamp: new Date().toISOString(),
            originalCategories: Object.keys(discoveryReport.uiElements).length,
            totalOriginalElements: Object.values(discoveryReport.uiElements).reduce((sum, elements) => sum + elements.length, 0),
            groupedComponentsCount: Object.keys(groupedComponents).length,
            variantGroupsCount: Object.values(groupedComponents).filter(c => c.type === 'variant-group').length,
            singleComponentsCount: Object.values(groupedComponents).filter(c => c.type === 'single').length,
            componentWorthyCount: Object.values(groupedComponents).filter(c => c.componentWorthy).length
        },
        hierarchy: 'Size > Style > State',
        originalDiscoveryReport: discoveryReport.processingMeta
    };

    // Save report to data directory
    await fs.mkdir(PATHS.dataDir, { recursive: true });
    const reportPath = path.join(PATHS.dataDir, 'grouping-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    return {
        report,
        reportPath
    };
}

export default group;