/**
 * Simple test: Get Figma variables using MCP bridge
 */

import { createFigmaBridge } from "./agentic-system/utils/mcp-figma-bridge.js";

async function testGetVariables() {
  console.log("=== Testing Figma Variable Extraction ===\n");

  try {
    // Connect to desktop Figma MCP server
    console.log("Connecting to Figma desktop MCP server...");
    const bridge = await createFigmaBridge({ useDesktop: true });
    console.log("✅ Connected!\n");

    // Get variables (empty nodeId gets file-level variables)
    console.log("Fetching design variables...");
    const result = await bridge.callTool("get_variable_defs", {
      nodeId: "", // Empty = use selected node or file-level
      clientLanguages: "typescript",
      clientFrameworks: "react",
    });

    console.log("\n📊 Result:");
    console.log(JSON.stringify(result, null, 2));

    // Parse and display variables if successful
    if (!result.isError && result.content?.[0]?.type === "text") {
      const variableText = result.content[0].text;

      console.log("\n✨ Variables extracted:");
      console.log("─────────────────────────────────");
      console.log(variableText);
      console.log("─────────────────────────────────\n");

      // Try to parse as JSON if it looks like JSON
      if (variableText.trim().startsWith('{')) {
        try {
          const variables = JSON.parse(variableText);
          console.log("📦 Parsed variables:");
          Object.entries(variables).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        } catch (e) {
          console.log("(Variables are in text format, not JSON)");
        }
      }
    } else if (result.isError) {
      console.log("\n⚠️ Note:", result.content?.[0]?.text);
      console.log("\n💡 Tips:");
      console.log("  1. Open a Figma file with design variables defined");
      console.log("  2. Or select a node that uses variables");
      console.log("  3. Variables are usually defined in: Assets → Local variables");
    }

    // Close connection
    await bridge.close();
    console.log("\n✅ Test complete!");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\n💡 Make sure:");
    console.error("  1. Figma desktop app is running");
    console.error("  2. You have a file open");
    console.error("  3. The file has variables defined (or select a node)");
    process.exit(1);
  }
}

testGetVariables();
