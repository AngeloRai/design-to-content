/**
 * Simple test: Get Figma screenshot using MCP bridge
 * Usage:
 *   node test-get-screenshot.js              # Uses selected node
 *   node test-get-screenshot.js 123:456      # Uses specific node ID
 */

import { createFigmaBridge } from "./agentic-system/utils/mcp-figma-bridge.js";
import fs from "fs/promises";
import path from "path";

async function testGetScreenshot() {
  // Get node ID from command line or use empty for selected node
  const nodeId = process.argv[2] || "";

  console.log("=== Testing Figma Screenshot Extraction ===\n");

  if (nodeId) {
    console.log(`🎯 Target: Node ID ${nodeId}`);
  } else {
    console.log("🎯 Target: Currently selected node");
    console.log("💡 Tip: Pass node ID as argument: node test-get-screenshot.js 123:456\n");
  }

  try {
    // Connect to desktop Figma MCP server
    console.log("Connecting to Figma desktop MCP server...");
    const bridge = await createFigmaBridge({ useDesktop: true });
    console.log("✅ Connected!\n");

    // Get screenshot
    console.log("Fetching screenshot...");
    const result = await bridge.callTool("get_screenshot", {
      nodeId,
      clientLanguages: "typescript",
      clientFrameworks: "react",
    });

    console.log("📊 Result type:", result.content?.[0]?.type);
    console.log("📊 Content length:", JSON.stringify(result).length, "bytes\n");

    // Handle the result
    if (result.isError) {
      console.log("⚠️ Error:", result.content?.[0]?.text);
      console.log("\n💡 Tips:");
      console.log("  1. Select a node/frame in Figma, or");
      console.log("  2. Pass a valid node ID: node test-get-screenshot.js 123:456");
    } else if (result.content?.[0]?.type === "image") {
      // Image data returned
      const imageContent = result.content[0];
      console.log("✨ Screenshot captured!");
      console.log("   Format:", imageContent.mimeType || "unknown");

      // Save the screenshot if it's base64 data
      if (imageContent.data) {
        const outputDir = "./screenshots";
        await fs.mkdir(outputDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const nodeIdSuffix = nodeId ? `-${nodeId.replace(":", "-")}` : "";
        const filename = `figma-screenshot${nodeIdSuffix}-${timestamp}.png`;
        const filepath = path.join(outputDir, filename);

        // Decode base64 and save
        const buffer = Buffer.from(imageContent.data, "base64");
        await fs.writeFile(filepath, buffer);

        console.log("   ✅ Saved to:", filepath);
        console.log("   Size:", Math.round(buffer.length / 1024), "KB");
      }
    } else if (result.content?.[0]?.text) {
      // Text response (might be a URL or message)
      const text = result.content[0].text;
      console.log("✨ Response:");
      console.log("  ", text);

      // Check if it's a URL
      if (text.startsWith("http")) {
        console.log("\n📷 Screenshot URL received!");
        console.log("   Downloading from:", text);

        const response = await fetch(text);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const outputDir = "./screenshots";
          await fs.mkdir(outputDir, { recursive: true });

          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const nodeIdSuffix = nodeId ? `-${nodeId.replace(":", "-")}` : "";
          const filename = `figma-screenshot${nodeIdSuffix}-${timestamp}.png`;
          const filepath = path.join(outputDir, filename);

          await fs.writeFile(filepath, buffer);
          console.log("   ✅ Downloaded to:", filepath);
          console.log("   Size:", Math.round(buffer.length / 1024), "KB");
        } else {
          console.log("   ❌ Failed to download:", response.statusText);
        }
      }
    }

    // Close connection
    await bridge.close();
    console.log("\n✅ Test complete!");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\n💡 Make sure:");
    console.error("  1. Figma desktop app is running");
    console.error("  2. You have a file open");
    console.error("  3. Node ID is valid (format: 123:456)");
    process.exit(1);
  }
}

testGetScreenshot();
