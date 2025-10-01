#!/usr/bin/env node

/**
 * REPORT GENERATOR
 *
 * Generates comprehensive workflow execution reports in markdown format
 * Includes analysis results, component details, generation stats, and more
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Generate comprehensive reports (both markdown and JSON) from workflow state
 */
export const generateReport = async (state, outputDir = '.') => {
  // Create timestamp with date and time: YYYY-MM-DD_HH-MM-SS
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/T/, '_')
    .replace(/\..+/, '')
    .replace(/:/g, '-');

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Generate markdown report
  const markdownContent = buildReportContent(state);
  const markdownPath = path.join(outputDir, `workflow-report-${timestamp}.md`);
  await fs.writeFile(markdownPath, markdownContent, 'utf-8');

  // Generate JSON report with full state
  const jsonContent = buildJSONReport(state);
  const jsonPath = path.join(outputDir, `workflow-report-${timestamp}.json`);
  await fs.writeFile(jsonPath, JSON.stringify(jsonContent, null, 2), 'utf-8');

  return {
    success: true,
    markdownPath,
    jsonPath,
    markdownSize: markdownContent.length,
    jsonSize: JSON.stringify(jsonContent).length
  };
};

/**
 * Build the complete report content
 */
const buildReportContent = (state) => {
  const sections = [];

  // Header
  sections.push(buildHeader(state));

  // Executive Summary
  sections.push(buildExecutiveSummary(state));

  // Workflow Timeline
  sections.push(buildTimeline(state));

  // Analysis Results
  if (state.visualAnalysis) {
    sections.push(buildAnalysisSection(state.visualAnalysis));
  }

  // Component Strategy
  if (state.componentStrategy && state.componentStrategy.length > 0) {
    sections.push(buildStrategySection(state.componentStrategy));
  }

  // Generated Components
  if (state.generatedComponents && state.generatedComponents.length > 0) {
    sections.push(buildComponentsSection(state.generatedComponents));
  }

  // Figma Integration Details
  if (state.figmaData) {
    sections.push(buildFigmaSection(state.figmaData));
  }

  // Errors & Issues
  if (state.errors && state.errors.length > 0) {
    sections.push(buildErrorsSection(state.errors));
  }

  // Metadata & Performance
  sections.push(buildMetadataSection(state.metadata));

  // Next Steps
  sections.push(buildNextSteps(state));

  return sections.join('\n\n---\n\n');
};

/**
 * Build report header
 */
const buildHeader = (state) => {
  const timestamp = new Date().toISOString();
  return `# Workflow Execution Report

**Generated:** ${new Date(timestamp).toLocaleString()}
**Status:** ${state.status || 'unknown'}
**Phase:** ${state.currentPhase || 'unknown'}
${state.input ? `**Source:** ${state.input}` : ''}
`;
};

/**
 * Build executive summary
 */
const buildExecutiveSummary = (state) => {
  const componentsCount = state.generatedComponents?.length || 0;
  const iconsCount = state.generatedComponents?.filter(c => c.atomicLevel === 'atom' && c.name.includes('Icon')).length || 0;
  const elementsCount = state.generatedComponents?.filter(c => c.atomicLevel === 'atom' && !c.name.includes('Icon')).length || 0;
  const moleculesCount = state.generatedComponents?.filter(c => c.atomicLevel === 'molecule').length || 0;
  const organismsCount = state.generatedComponents?.filter(c => c.atomicLevel === 'organism').length || 0;

  const analysisCount = state.visualAnalysis?.components?.length || 0;
  const strategyCount = state.componentStrategy?.length || 0;

  return `## Executive Summary

### Results Overview
- **Components Analyzed:** ${analysisCount}
- **Strategy Decisions:** ${strategyCount}
- **Components Generated:** ${componentsCount}
  - Icons: ${iconsCount}
  - Elements: ${elementsCount}
  - Molecules: ${moleculesCount}
  - Organisms: ${organismsCount}

### Success Rate
- **Generation Success:** ${strategyCount > 0 ? Math.round((componentsCount / strategyCount) * 100) : 0}%
- **Errors Encountered:** ${state.errors?.length || 0}
`;
};

/**
 * Build workflow timeline
 */
const buildTimeline = (state) => {
  const metadata = state.metadata || {};
  const startTime = metadata.startTime ? new Date(metadata.startTime) : null;
  const endTime = metadata.endTime ? new Date(metadata.endTime) : null;
  const duration = startTime && endTime ? ((endTime - startTime) / 1000).toFixed(2) : metadata.durationSeconds || 'N/A';

  return `## Workflow Timeline

- **Start:** ${startTime ? startTime.toLocaleString() : 'N/A'}
- **End:** ${endTime ? endTime.toLocaleString() : 'N/A'}
- **Duration:** ${duration}s
- **Analysis Time:** ${metadata.analysisTime ? new Date(metadata.analysisTime).toLocaleTimeString() : 'N/A'}
- **Generation Time:** ${metadata.generationTime ? new Date(metadata.generationTime).toLocaleTimeString() : 'N/A'}
`;
};

/**
 * Build analysis section
 */
const buildAnalysisSection = (visualAnalysis) => {
  const components = visualAnalysis.components || [];

  let content = `## Visual Analysis Results

**Summary:** ${visualAnalysis.summary || 'N/A'}

### Components Identified (${components.length})

`;

  components.forEach((comp, idx) => {
    content += `#### ${idx + 1}. ${comp.name} (${comp.atomicLevel})

- **Description:** ${comp.description}
- **Confidence:** ${(comp.confidence * 100).toFixed(0)}%
- **Complexity Score:** ${comp.complexityScore || 'N/A'}/10
- **Reusability Score:** ${comp.reusabilityScore || 'N/A'}/10

**Variants:**
- Style: ${comp.styleVariants?.join(', ') || 'none'}
- Size: ${comp.sizeVariants?.join(', ') || 'none'}
- Other: ${comp.otherVariants?.join(', ') || 'none'}

**States:** ${comp.states?.join(', ') || 'none'}

${comp.props && comp.props.length > 0 ? `**Props:**
${comp.props.map(p => `- \`${p.name}\`: ${p.type}${p.required ? ' (required)' : ''}`).join('\n')}
` : ''}
`;
  });

  // Global tokens
  if (visualAnalysis.globalTokens) {
    content += `\n### Design Tokens

**Colors:** ${visualAnalysis.globalTokens.colors?.join(', ') || 'none'}
**Spacing:** ${visualAnalysis.globalTokens.spacing?.join(', ') || 'none'}
**Typography:** ${visualAnalysis.globalTokens.typography?.join(', ') || 'none'}
`;
  }

  return content;
};

/**
 * Build component strategy section
 */
const buildStrategySection = (componentStrategy) => {
  const createCount = componentStrategy.filter(s => s.action === 'create_new').length;
  const updateCount = componentStrategy.filter(s => s.action === 'update_existing').length;
  const skipCount = componentStrategy.filter(s => s.action === 'skip').length;

  let content = `## Component Strategy

**Actions Breakdown:**
- Create New: ${createCount}
- Update Existing: ${updateCount}
- Skip: ${skipCount}

### Strategy Decisions

| Component | Action | Reason | Target Path |
|-----------|--------|--------|-------------|
`;

  componentStrategy.forEach(strategy => {
    const componentName = strategy.component?.name || 'Unknown';
    const action = strategy.action || 'N/A';
    const reason = (strategy.reason || 'N/A').substring(0, 60) + '...';
    const target = strategy.targetPath ? path.basename(strategy.targetPath) : 'N/A';

    content += `| ${componentName} | ${action} | ${reason} | ${target} |\n`;
  });

  return content;
};

/**
 * Build generated components section
 */
const buildComponentsSection = (generatedComponents) => {
  let content = `## Generated Components

### Summary
Total components generated: **${generatedComponents.length}**

`;

  // Group by atomic level
  const byLevel = generatedComponents.reduce((acc, comp) => {
    const level = comp.atomicLevel || 'unknown';
    if (!acc[level]) acc[level] = [];
    acc[level].push(comp);
    return acc;
  }, {});

  Object.entries(byLevel).forEach(([level, components]) => {
    content += `\n### ${level.charAt(0).toUpperCase() + level.slice(1)}s (${components.length})\n\n`;

    components.forEach(comp => {
      const propsCount = comp.props?.length || 0;
      const linesOfCode = comp.linesOfCode || 'N/A';
      const confidence = comp.confidence ? `${(comp.confidence * 100).toFixed(0)}%` : 'N/A';

      content += `#### ${comp.name}
- **Path:** \`${comp.filePath || 'N/A'}\`
- **Lines of Code:** ${linesOfCode}
- **Props:** ${propsCount}
- **Confidence:** ${confidence}
- **Timestamp:** ${comp.timestamp ? new Date(comp.timestamp).toLocaleString() : 'N/A'}

`;
    });
  });

  return content;
};

/**
 * Build Figma integration section
 */
const buildFigmaSection = (figmaData) => {
  let content = `## Figma Integration

**File Key:** \`${figmaData.fileKey || 'N/A'}\`
**Node ID:** \`${figmaData.nodeId || 'N/A'}\`
**Screenshot:** ${figmaData.screenshotUrl ? `[View Screenshot](${figmaData.screenshotUrl})` : 'N/A'}

`;

  if (figmaData.extractedIcons && figmaData.extractedIcons.length > 0) {
    content += `### Extracted Icons (${figmaData.extractedIcons.length})

`;
    figmaData.extractedIcons.slice(0, 10).forEach(icon => {
      content += `- **${icon.name}** (node: \`${icon.nodeId}\`)\n`;
    });

    if (figmaData.extractedIcons.length > 10) {
      content += `\n... and ${figmaData.extractedIcons.length - 10} more icons\n`;
    }
  }

  if (figmaData.componentMetadata) {
    const metadata = figmaData.componentMetadata;
    content += `\n### Component Metadata

- **Total Instances:** ${metadata.instances?.length || 0}
- **Has Vector Elements:** ${metadata.instances?.some(i => i.hasVectorElements) ? 'Yes' : 'No'}
`;
  }

  return content;
};

/**
 * Build errors section
 */
const buildErrorsSection = (errors) => {
  let content = `## Errors & Issues

**Total Errors:** ${errors.length}

`;

  errors.forEach((error, idx) => {
    content += `### ${idx + 1}. ${error.phase || 'Unknown Phase'}

- **Message:** ${error.message}
- **Timestamp:** ${error.timestamp ? new Date(error.timestamp).toLocaleString() : 'N/A'}

`;
  });

  return content;
};

/**
 * Build metadata section
 */
const buildMetadataSection = (metadata = {}) => {
  return `## Performance & Metadata

- **Tokens Used:** ${metadata.tokensUsed || 0}
- **Cost Estimate:** $${metadata.costEstimate || 0}
- **Icons Generated:** ${metadata.iconsCount || 0}
- **Components Generated:** ${metadata.componentsCount || 0}
- **Total Generated:** ${metadata.generatedCount || 0}
`;
};

/**
 * Build next steps section
 */
const buildNextSteps = (state) => {
  const steps = [];

  if (state.generatedComponents && state.generatedComponents.length > 0) {
    steps.push('✅ Review generated components in the UI directory');
    steps.push('✅ Test components in the Next.js application');
    steps.push('✅ Update component styles if needed');
  }

  if (state.errors && state.errors.length > 0) {
    steps.push('⚠️ Address errors listed in the Errors section');
  }

  const updateComponents = state.componentStrategy?.filter(s => s.action === 'update_existing') || [];
  if (updateComponents.length > 0) {
    steps.push('📝 Review component update suggestions');
  }

  steps.push('🚀 Run `npm run dev` in the Next.js app to preview components');

  return `## Next Steps

${steps.map(step => `- ${step}`).join('\n')}

---

*Report generated by Design-to-Code System*
`;
};

/**
 * Build comprehensive JSON report with full state and enriched data
 */
const buildJSONReport = (state) => {
  const timestamp = new Date().toISOString();

  return {
    reportMetadata: {
      version: '1.0.0',
      generatedAt: timestamp,
      reportType: 'workflow-execution',
      generator: 'design-to-code-system'
    },

    // Workflow execution info
    execution: {
      status: state.status || 'unknown',
      currentPhase: state.currentPhase || 'unknown',
      input: state.input || null,
      startTime: state.metadata?.startTime || null,
      endTime: state.metadata?.endTime || null,
      durationSeconds: state.metadata?.durationSeconds || null,
      errors: state.errors || []
    },

    // Complete analysis results
    analysis: {
      summary: state.visualAnalysis?.summary || null,
      componentCount: state.visualAnalysis?.components?.length || 0,
      components: state.visualAnalysis?.components || [],
      globalTokens: state.visualAnalysis?.globalTokens || null,
      analysisTime: state.metadata?.analysisTime || null
    },

    // Component strategy decisions
    strategy: {
      totalDecisions: state.componentStrategy?.length || 0,
      createNew: state.componentStrategy?.filter(s => s.action === 'create_new').length || 0,
      updateExisting: state.componentStrategy?.filter(s => s.action === 'update_existing').length || 0,
      skip: state.componentStrategy?.filter(s => s.action === 'skip').length || 0,
      decisions: state.componentStrategy || []
    },

    // Generated components with full details
    generation: {
      totalGenerated: state.generatedComponents?.length || 0,
      byAtomicLevel: {
        atoms: state.generatedComponents?.filter(c => c.atomicLevel === 'atom') || [],
        molecules: state.generatedComponents?.filter(c => c.atomicLevel === 'molecule') || [],
        organisms: state.generatedComponents?.filter(c => c.atomicLevel === 'organism') || []
      },
      byType: {
        icons: state.generatedComponents?.filter(c => c.atomicLevel === 'atom' && c.name.includes('Icon')) || [],
        elements: state.generatedComponents?.filter(c => c.atomicLevel === 'atom' && !c.name.includes('Icon')) || [],
        components: state.generatedComponents?.filter(c => c.atomicLevel === 'molecule') || [],
        modules: state.generatedComponents?.filter(c => c.atomicLevel === 'organism') || []
      },
      allComponents: state.generatedComponents || [],
      generationTime: state.metadata?.generationTime || null
    },

    // Figma integration details
    figma: {
      fileKey: state.figmaData?.fileKey || null,
      nodeId: state.figmaData?.nodeId || null,
      screenshotUrl: state.figmaData?.screenshotUrl || null,
      extractedIcons: state.figmaData?.extractedIcons || [],
      componentMetadata: state.figmaData?.componentMetadata || null,
      nodeMetadata: state.figmaData?.nodeMetadata || null
    },

    // Library context (existing components)
    libraryContext: state.libraryContext || {
      elements: [],
      components: [],
      modules: [],
      icons: []
    },

    // Performance metrics
    performance: {
      tokensUsed: state.metadata?.tokensUsed || 0,
      costEstimate: state.metadata?.costEstimate || 0,
      iconsCount: state.metadata?.iconsCount || 0,
      componentsCount: state.metadata?.componentsCount || 0,
      generatedCount: state.metadata?.generatedCount || 0,
      phases: {
        analysis: state.metadata?.analysisTime || null,
        strategy: state.metadata?.strategyTime || null,
        generation: state.metadata?.generationTime || null
      }
    },

    // Statistics and aggregations
    statistics: {
      successRate: state.componentStrategy?.length > 0
        ? ((state.generatedComponents?.length || 0) / state.componentStrategy.length * 100).toFixed(2) + '%'
        : '0%',
      averageConfidence: calculateAverageConfidence(state.generatedComponents),
      averageComplexity: calculateAverageComplexity(state.visualAnalysis?.components),
      totalLinesOfCode: (state.generatedComponents || []).reduce((sum, c) => sum + (c.linesOfCode || 0), 0),
      totalProps: (state.generatedComponents || []).reduce((sum, c) => sum + (c.props?.length || 0), 0)
    },

    // Output configuration
    output: {
      outputPath: state.outputPath || 'nextjs-app/ui',
      reportPath: state.reportPath || null
    },

    // Full state object (for debugging and advanced analysis)
    fullState: state
  };
};

/**
 * Calculate average confidence from components
 */
const calculateAverageConfidence = (components) => {
  if (!components || components.length === 0) return 0;
  const withConfidence = components.filter(c => c.confidence != null);
  if (withConfidence.length === 0) return 0;
  const sum = withConfidence.reduce((acc, c) => acc + c.confidence, 0);
  return (sum / withConfidence.length).toFixed(2);
};

/**
 * Calculate average complexity from analysis
 */
const calculateAverageComplexity = (components) => {
  if (!components || components.length === 0) return 0;
  const withComplexity = components.filter(c => c.complexityScore != null);
  if (withComplexity.length === 0) return 0;
  const sum = withComplexity.reduce((acc, c) => acc + c.complexityScore, 0);
  return (sum / withComplexity.length).toFixed(2);
};

export default {
  generateReport,
  buildReportContent,
  buildJSONReport
};
