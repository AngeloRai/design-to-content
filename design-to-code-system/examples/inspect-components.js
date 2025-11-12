/**
 * Inspect component specs from analysis to understand what was identified
 */

import { analyzeNode } from '../agentic-system/workflow/nodes/analyze.js';

async function inspectComponents() {
  const initialState = {
    figmaUrl: undefined,
    outputDir: './test-output',
    errors: [],
    conversationHistory: []
  };

  console.log('Running analysis to get component specs...\n');
  const result = await analyzeNode(initialState);

  console.log('═'.repeat(60));
  console.log('COMPONENT SPECS BY ATOMIC LEVEL');
  console.log('═'.repeat(60));

  // Group by atomic level
  const byLevel = {
    atoms: [],
    molecules: [],
    organisms: []
  };

  result.figmaAnalysis.components.forEach(comp => {
    const level = comp.atomicLevel || 'unknown';
    if (byLevel[level]) {
      byLevel[level].push(comp);
    }
  });

  // Display each level
  Object.entries(byLevel).forEach(([level, components]) => {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`${level.toUpperCase()} (${components.length} components)`);
    console.log('─'.repeat(60));

    components.forEach((comp, i) => {
      console.log(`\n${i + 1}. ${comp.name} (${comp.type})`);
      console.log(`   Description: ${comp.description}`);
      console.log(`   Atomic Level: ${comp.atomicLevel}`);
      console.log(`   Variants: ${comp.variants ? comp.variants.join(', ') : 'none'}`);
      console.log(`   Has Figma Code: ${comp.figmaCode ? 'Yes' : 'No'}`);

      if (comp.figmaCode) {
        const codePreview = comp.figmaCode.substring(0, 150).replace(/\n/g, ' ');
        console.log(`   Code Preview: ${codePreview}...`);
      }

      // Check for any unusual fields
      const unusualFields = Object.keys(comp).filter(k =>
        !['name', 'type', 'description', 'atomicLevel', 'variants', 'figmaCode',
          'visualProperties', 'textContent', 'interactionStates'].includes(k)
      );

      if (unusualFields.length > 0) {
        console.log(`   ⚠️  Unusual fields: ${unusualFields.join(', ')}`);
      }
    });
  });

  console.log('\n═'.repeat(60));
  console.log('POTENTIAL ISSUES');
  console.log('═'.repeat(60));

  // Check for organisms
  if (byLevel.organisms.length === 0) {
    console.log('❌ No organism components found!');
  } else {
    console.log(`✅ Found ${byLevel.organisms.length} organism components`);

    // Check if they have proper types
    const organismTypes = [...new Set(byLevel.organisms.map(c => c.type))];
    console.log(`   Types: ${organismTypes.join(', ')}`);

    // Check if they have code
    const withCode = byLevel.organisms.filter(c => c.figmaCode).length;
    console.log(`   With Figma code: ${withCode}/${byLevel.organisms.length}`);

    // Check for missing descriptions
    const missingDesc = byLevel.organisms.filter(c => !c.description || c.description.length < 10);
    if (missingDesc.length > 0) {
      console.log(`   ⚠️  ${missingDesc.length} organisms with short/missing descriptions`);
    }
  }

  console.log('\n═'.repeat(60));
}

inspectComponents().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
