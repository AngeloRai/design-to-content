import { createFigmaBridge } from '../agentic-system/utils/mcp-figma-bridge.js';

(async () => {
  const bridge = await createFigmaBridge({ useDesktop: true });

  const nodeId = '36:7316'; // Organisms node

  console.log(`🔍 Examining Organisms Node (${nodeId})\n`);

  // Get metadata to see structure
  const metadata = await bridge.callTool('get_metadata', {
    nodeId,
    clientLanguages: 'typescript',
    clientFrameworks: 'react'
  });

  if (!metadata.isError) {
    const metadataXml = metadata.content[0].text;
    console.log('📋 Node Structure:');
    console.log(metadataXml.substring(0, 1500));
    console.log('\n...(truncated)\n');

    // Count child nodes
    const nodeMatches = metadataXml.match(/id="([^"]+)"/g) || [];
    console.log(`\n📊 Stats:`);
    console.log(`   Total nodes: ${nodeMatches.length}`);

    // Extract top-level frame names
    const frameMatches = metadataXml.match(/<frame[^>]*name="([^"]+)"/g) || [];
    console.log(`   Top-level frames: ${frameMatches.length}`);
    frameMatches.slice(0, 10).forEach((match, i) => {
      const name = match.match(/name="([^"]+)"/)?.[1];
      console.log(`     ${i + 1}. ${name}`);
    });
  }

  // Check for variables
  console.log('\n🎨 Variables:');
  const vars = await bridge.callTool('get_variable_defs', {
    nodeId,
    clientLanguages: 'typescript',
    clientFrameworks: 'react'
  });

  if (!vars.isError) {
    const varsData = JSON.parse(vars.content[0].text);
    console.log(`   Found: ${Object.keys(varsData).length} variables`);
    if (Object.keys(varsData).length > 0) {
      console.log('   First 5:');
      Object.keys(varsData).slice(0, 5).forEach(key => {
        console.log(`     - ${key}: ${varsData[key]}`);
      });
    }
  }

  // Get screenshot
  console.log('\n📸 Screenshot:');
  const screenshot = await bridge.callTool('get_screenshot', {
    nodeId,
    clientLanguages: 'typescript',
    clientFrameworks: 'react'
  });

  if (!screenshot.isError) {
    const data = screenshot.content[0].text;
    console.log(`   Captured: ${data.length} chars (base64)`);
    console.log(`   Format: ${data.startsWith('iVBORw0KGgo') ? 'PNG' : data.startsWith('/9j/') ? 'JPEG' : 'Unknown'}`);
  }

  await bridge.close();
})();
