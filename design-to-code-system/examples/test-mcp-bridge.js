/**
 * Example: Using Figma MCP Bridge
 * Demonstrates how to connect to Figma MCP and use its tools
 */

import { createFigmaBridge } from "./agentic-system/utils/mcp-figma-bridge.js";

async function main() {
  console.log("=== Figma MCP Bridge Example ===\n");

  try {
    // Connect to desktop Figma MCP server
    // (Make sure Figma desktop app is running with a file open)
    const bridge = await createFigmaBridge({ useDesktop: true });

    // 1. List available tools
    console.log("Available tools:");
    const tools = await bridge.listTools();
    tools.forEach(tool => {
      console.log(`  - ${tool.name}`);
    });
    console.log();

    // 2. Get code for currently selected node
    // (Select a node in Figma first)
    console.log("Getting code for selected node...");
    try {
      const codeResult = await bridge.callTool("get_code", {
        nodeId: "", // Empty string uses currently selected node
        clientLanguages: "javascript,typescript",
        clientFrameworks: "react",
      });

      console.log("Code generation result:");
      console.log(JSON.stringify(codeResult, null, 2));
    } catch (error) {
      console.log("Note: Select a node in Figma to test get_code");
      console.log(`Error: ${error.message}`);
    }
    console.log();

    // 3. Get variable definitions
    console.log("Getting variable definitions...");
    try {
      const variables = await bridge.callTool("get_variable_defs", {
        nodeId: "",
        clientLanguages: "javascript,typescript",
        clientFrameworks: "react",
      });

      console.log("Variables:");
      console.log(JSON.stringify(variables, null, 2));
    } catch (error) {
      console.log(`Could not get variables: ${error.message}`);
    }
    console.log();

    // 4. Get screenshot
    console.log("Getting screenshot of selected node...");
    try {
      const screenshot = await bridge.callTool("get_screenshot", {
        nodeId: "",
        clientLanguages: "javascript,typescript",
        clientFrameworks: "react",
      });

      console.log("Screenshot generated successfully");
      console.log(`Type: ${screenshot.content?.[0]?.type}`);
    } catch (error) {
      console.log(`Could not get screenshot: ${error.message}`);
    }
    console.log();

    // 5. Get metadata
    console.log("Getting metadata for selected node...");
    try {
      const metadata = await bridge.callTool("get_metadata", {
        nodeId: "",
        clientLanguages: "javascript,typescript",
        clientFrameworks: "react",
      });

      console.log("Metadata:");
      console.log(JSON.stringify(metadata, null, 2).substring(0, 500) + "...");
    } catch (error) {
      console.log(`Could not get metadata: ${error.message}`);
    }
    console.log();

    // Close connection
    await bridge.close();
    console.log("✅ Example complete!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\n💡 Make sure:");
    console.error("   1. Figma desktop app is running");
    console.error("   2. You have a file open in Figma");
    console.error("   3. MCP server is enabled in Figma settings");
    process.exit(1);
  }
}

main();
