/**
 * Analyze Node
 * Extracts and analyzes Figma design to identify components
 * Uses MCP (Model Context Protocol) for Figma integration
 */

import { extractWithMcp, parseAtomicLevelUrls } from '../../tools/figma-extractor.ts';
import { createFigmaBridge } from '../../tools/mcp-figma-bridge.ts';
import { env } from '../../config/env.config.ts';
import type { WorkflowState, NodeResult } from '../../types/workflow.js';
import type { ComponentSpec } from '../../types/component.js';
import type { DesignToken } from '../../types/figma.js';

interface ProcessLogEntry {
  level: string;
  components: number;
  tokensAdded: number;
  totalTokens: number;
}

export async function analyzeNode(state: WorkflowState): Promise<NodeResult> {
  console.log('\n📊 Phase: Figma Analysis');
  console.log('='.repeat(60));
  console.log('DEBUG - Received state:', JSON.stringify(state, null, 2));

  let mcpBridge: any = null;

  try {
    const { figmaUrl, outputDir } = state;

    console.log('DEBUG - figmaUrl extracted:', figmaUrl);
    console.log('DEBUG - outputDir extracted:', outputDir);

    // Initialize MCP bridge (uses desktop Figma by default)
    console.log('🔌 Connecting to Figma MCP...');
    mcpBridge = await createFigmaBridge({ useDesktop: true });
    console.log('✅ MCP connected\n');

    // Determine nodes to process (atomic levels or single URL)
    let atomicNodes = parseAtomicLevelUrls(env.figma.atomicLevels);

    // Fallback to single URL if no atomic level URLs configured
    if (atomicNodes.length === 0) {
      if (!figmaUrl) {
        throw new Error('No Figma URLs configured. Set FIGMA_ATOMS (and optionally FIGMA_MOLECULES, FIGMA_ORGANISMS) or provide figmaUrl');
      }

      console.log('ℹ️  No atomic level URLs configured, using single URL\n');
      const nodeIdMatch = figmaUrl.match(/node-id=([^&]+)/);
      const nodeId = nodeIdMatch ? nodeIdMatch[1].replace(/-/g, ':') : '';
      atomicNodes = [{ nodeId, level: 'all', order: 1 }];
    }

    console.log(`📋 Processing ${atomicNodes.length} atomic level${atomicNodes.length > 1 ? 's' : ''}:`);
    atomicNodes.forEach(node => console.log(`   ${node.order}. ${node.level.toUpperCase()}`));
    console.log('');

    let allTokens: DesignToken[] = [];
    let allComponents: ComponentSpec[] = [];
    const processLog: ProcessLogEntry[] = [];

    // Process each atomic level sequentially
    for (const [index, node] of atomicNodes.entries()) {
      console.log('='.repeat(60));
      console.log(`🔬 Processing ${node.level.toUpperCase()} (${index + 1}/${atomicNodes.length})`);
      console.log('='.repeat(60));
      console.log('');

      const result = await extractWithMcp(mcpBridge, {
        nodeId: node.nodeId,
        globalCssPath: env.output.globalCssPath,
        isFirstNode: index === 0,
        existingTokens: allTokens,
        atomicLevel: node.level
      });

      // Track what changed
      const tokensAdded = result.tokens.length - allTokens.length;
      processLog.push({
        level: node.level,
        components: result.components.length,
        tokensAdded,
        totalTokens: result.tokens.length
      });

      allTokens = result.tokens;
      allComponents.push(...result.components.map(c => ({
        ...c,
        atomicLevel: node.level as 'atoms' | 'molecules' | 'organisms'  // Tag with source atomic level
      })));

      console.log('');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('📊 Multi-Node Processing Summary');
    console.log('='.repeat(60));
    processLog.forEach(log => {
      console.log(`   ${log.level.padEnd(12)}: ${log.components} components, +${log.tokensAdded} tokens (total: ${log.totalTokens})`);
    });
    console.log('');
    console.log(`   Total Components: ${allComponents.length}`);
    console.log(`   Total Tokens: ${allTokens.length}`);
    console.log('='.repeat(60) + '\n');

    // IMPORTANT: Keep MCP bridge alive for agent tools during generation
    // It will be closed in the finalize node
    console.log('💾 Keeping MCP bridge alive for agent tool access during generation\n');

    return {
      ...state,
      figmaAnalysis: {
        tokens: allTokens,
        categories: allTokens.reduce((acc: Record<string, number>, token) => {
          const category = token.category || 'uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}),
        components: allComponents,
        analysis: {
          totalComponents: allComponents.length,
          sections: processLog.map(l => ({
            name: l.level,
            componentCount: l.components
          }))
        },
        metadata: {
          totalComponents: allComponents.length,
          totalTokens: allTokens.length,
          atomicLevels: processLog.map(l => l.level)
        },
        processLog,
        summary: `Analyzed ${allComponents.length} components across ${processLog.length} atomic levels`
      },
      componentsIdentified: allComponents.length,
      mcpBridge,  // Pass MCP bridge through state for agent tools
      globalCssPath: env.output.globalCssPath,  // Pass globals.css path for token management
      startTime: new Date().toISOString(),
      currentPhase: 'setup'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('❌ Figma analysis failed:', errorMessage);
    if (errorStack) {
      console.error(errorStack);
    }

    // Cleanup MCP connection on error
    if (mcpBridge && typeof mcpBridge.close === 'function') {
      try {
        await mcpBridge.close();
      } catch (closeError) {
        const closeErrorMessage = closeError instanceof Error ? closeError.message : String(closeError);
        console.error('⚠️  Failed to close MCP:', closeErrorMessage);
      }
    }

    return {
      ...state,
      currentPhase: 'finalize'
    };
  }
}
