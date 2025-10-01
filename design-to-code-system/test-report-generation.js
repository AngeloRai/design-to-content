#!/usr/bin/env node

/**
 * Test report generation with sample data
 */

import { generateReport } from './langgraph-workflow/utils/report-generator.js';

// Sample workflow state
const sampleState = {
  input: 'https://figma.com/file/ABC123/design?node-id=1:2',
  currentPhase: 'complete',
  status: 'success',

  visualAnalysis: {
    summary: 'Identified 5 components with various states and variants',
    components: [
      {
        name: 'Button',
        atomicLevel: 'atom',
        description: 'Primary action button with multiple variants',
        confidence: 0.95,
        complexityScore: 3,
        reusabilityScore: 9,
        styleVariants: ['primary', 'secondary', 'outline'],
        sizeVariants: ['sm', 'md', 'lg'],
        states: ['default', 'hover', 'disabled'],
        props: [
          { name: 'variant', type: 'string', required: false },
          { name: 'size', type: 'string', required: false },
          { name: 'children', type: 'ReactNode', required: true }
        ]
      },
      {
        name: 'Badge',
        atomicLevel: 'atom',
        description: 'Status badge indicator',
        confidence: 0.88,
        complexityScore: 2,
        reusabilityScore: 8,
        styleVariants: ['success', 'warning', 'error'],
        sizeVariants: ['sm', 'md'],
        states: ['default'],
        props: [
          { name: 'variant', type: 'string', required: false },
          { name: 'label', type: 'string', required: true }
        ]
      }
    ],
    globalTokens: {
      colors: ['#3B82F6', '#10B981', '#EF4444', '#F3F4F6'],
      spacing: ['4px', '8px', '16px', '24px'],
      typography: ['14px', '16px', '18px']
    }
  },

  componentStrategy: [
    {
      component: { name: 'Button' },
      action: 'create_new',
      reason: 'No existing button component matches the design system variants',
      targetPath: 'nextjs-app/ui/elements/Button.tsx'
    },
    {
      component: { name: 'Badge' },
      action: 'create_new',
      reason: 'New component for status indicators',
      targetPath: 'nextjs-app/ui/elements/Badge.tsx'
    },
    {
      component: { name: 'Input' },
      action: 'update_existing',
      reason: 'Add new error state variant',
      targetPath: 'nextjs-app/ui/elements/Input.tsx'
    }
  ],

  generatedComponents: [
    {
      name: 'Button',
      atomicLevel: 'atom',
      filePath: 'nextjs-app/ui/elements/Button.tsx',
      linesOfCode: 48,
      props: [
        { name: 'variant', type: 'string', required: false },
        { name: 'size', type: 'string', required: false },
        { name: 'children', type: 'ReactNode', required: true }
      ],
      confidence: 0.95,
      timestamp: new Date().toISOString()
    },
    {
      name: 'Badge',
      atomicLevel: 'atom',
      filePath: 'nextjs-app/ui/elements/Badge.tsx',
      linesOfCode: 32,
      props: [
        { name: 'variant', type: 'string', required: false },
        { name: 'label', type: 'string', required: true }
      ],
      confidence: 0.88,
      timestamp: new Date().toISOString()
    },
    {
      name: 'PlayIcon',
      atomicLevel: 'atom',
      filePath: 'nextjs-app/ui/icons/PlayIcon.tsx',
      linesOfCode: 24,
      props: [],
      timestamp: new Date().toISOString()
    }
  ],

  figmaData: {
    fileKey: 'ABC123',
    nodeId: '1:2',
    screenshotUrl: 'https://figma.com/screenshot/example.png',
    extractedIcons: [
      { name: 'Play', nodeId: '1:3' },
      { name: 'Pause', nodeId: '1:4' },
      { name: 'Stop', nodeId: '1:5' }
    ],
    componentMetadata: {
      instances: [
        { hasVectorElements: true },
        { hasVectorElements: false }
      ]
    }
  },

  errors: [],

  metadata: {
    startTime: new Date(Date.now() - 45000).toISOString(), // 45 seconds ago
    endTime: new Date().toISOString(),
    durationSeconds: 45,
    analysisTime: new Date(Date.now() - 40000).toISOString(),
    generationTime: new Date(Date.now() - 10000).toISOString(),
    tokensUsed: 3500,
    costEstimate: 0.12,
    iconsCount: 1,
    componentsCount: 2,
    generatedCount: 3
  }
};

// Generate report
console.log('🧪 Testing report generation...\n');

try {
  const result = await generateReport(sampleState, './reports');
  console.log('✅ Reports generated successfully!');
  console.log(`📄 Markdown: ${result.markdownPath}`);
  console.log(`📄 JSON: ${result.jsonPath}`);
  console.log(`📊 Total size: ${((result.markdownSize + result.jsonSize) / 1024).toFixed(2)} KB`);
  console.log(`   - Markdown: ${(result.markdownSize / 1024).toFixed(2)} KB`);
  console.log(`   - JSON: ${(result.jsonSize / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error('❌ Report generation failed:', error.message);
  process.exit(1);
}
