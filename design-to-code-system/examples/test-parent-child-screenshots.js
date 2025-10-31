/**
 * Test: Extract parent node structure and capture child screenshots
 *
 * Steps:
 * 1. Get metadata of selected parent node (to see structure)
 * 2. Take screenshot of parent
 * 3. Parse metadata to find child nodes
 * 4. Take screenshots of each child
 */

import { createFigmaBridge } from "./agentic-system/utils/mcp-figma-bridge.js";
import fs from "fs/promises";
import path from "path";

async function testParentChildScreenshots() {
  console.log("=== Parent-Child Screenshot Extraction ===\n");

  try {
    // Connect to Figma MCP
    console.log("📡 Connecting to Figma desktop MCP server...");
    const bridge = await createFigmaBridge({ useDesktop: true });
    console.log("✅ Connected!\n");

    // STEP 1: Get metadata of selected parent node
    console.log("STEP 1: Getting metadata of selected parent node...");
    const metadataResult = await bridge.callTool("get_metadata", {
      nodeId: "", // Selected node
      clientLanguages: "typescript",
      clientFrameworks: "react",
    });

    if (metadataResult.isError) {
      console.log("❌ Error:", metadataResult.content?.[0]?.text);
      console.log("💡 Please select a parent node/frame in Figma");
      await bridge.close();
      return;
    }

    const metadataXml = metadataResult.content?.[0]?.text;
    console.log("✅ Metadata received\n");
    console.log("📊 Metadata preview:");
    console.log(metadataXml.substring(0, 500) + "...\n");

    // Parse XML to extract node info
    const parentNodeMatch = metadataXml.match(/<(\w+)\s+id="([^"]+)"\s+name="([^"]+)"/);
    if (!parentNodeMatch) {
      console.log("❌ Could not parse parent node from metadata");
      await bridge.close();
      return;
    }

    const parentNodeType = parentNodeMatch[1];
    const parentNodeId = parentNodeMatch[2];
    const parentNodeName = parentNodeMatch[3];

    console.log("🎯 Parent Node:");
    console.log(`   Type: ${parentNodeType}`);
    console.log(`   ID: ${parentNodeId}`);
    console.log(`   Name: ${parentNodeName}\n`);

    // STEP 2: Take screenshot of parent
    console.log("STEP 2: Taking screenshot of parent node...");
    const parentScreenshot = await bridge.callTool("get_screenshot", {
      nodeId: parentNodeId,
      clientLanguages: "typescript",
      clientFrameworks: "react",
    });

    await saveScreenshot(parentScreenshot, `parent-${parentNodeId.replace(":", "-")}`, parentNodeName);
    console.log();

    // STEP 3: Parse metadata to find child nodes
    console.log("STEP 3: Finding child nodes...");

    // Extract all child nodes from XML (simplified parsing)
    const childNodeMatches = Array.from(
      metadataXml.matchAll(/<(\w+)\s+id="([^"]+)"\s+name="([^"]+)"/g)
    ).slice(1); // Skip first match (parent)

    console.log(`   Found ${childNodeMatches.length} child nodes:\n`);

    const children = childNodeMatches.map((match, index) => ({
      index: index + 1,
      type: match[1],
      id: match[2],
      name: match[3],
    }));

    // Display children
    children.forEach((child) => {
      console.log(`   ${child.index}. [${child.type}] ${child.name} (ID: ${child.id})`);
    });
    console.log();

    // Filter for likely button nodes (you can adjust this logic)
    const buttonNodes = children.filter((child) => {
      const nameLower = child.name.toLowerCase();
      const typeLower = child.type.toLowerCase();
      return (
        nameLower.includes("button") ||
        nameLower.includes("btn") ||
        (typeLower === "frame" && nameLower.match(/\b(primary|secondary|cta|action)\b/i))
      );
    });

    console.log(`🔘 Identified ${buttonNodes.length} potential button nodes:\n`);
    buttonNodes.forEach((btn) => {
      console.log(`   - ${btn.name} (${btn.id})`);
    });
    console.log();

    // STEP 4: Take screenshots of child button nodes
    if (buttonNodes.length > 0) {
      console.log("STEP 4: Taking screenshots of child button nodes...\n");

      for (const button of buttonNodes) {
        console.log(`   📸 Capturing: ${button.name} (${button.id})`);

        const childScreenshot = await bridge.callTool("get_screenshot", {
          nodeId: button.id,
          clientLanguages: "typescript",
          clientFrameworks: "react",
        });

        await saveScreenshot(
          childScreenshot,
          `child-${button.id.replace(":", "-")}`,
          button.name
        );
      }
    } else {
      console.log("STEP 4: No button nodes found. Taking screenshots of all children...\n");

      // Limit to first 5 children to avoid overwhelming output
      const childrenToCapture = children.slice(0, 5);

      for (const child of childrenToCapture) {
        console.log(`   📸 Capturing: ${child.name} (${child.id})`);

        const childScreenshot = await bridge.callTool("get_screenshot", {
          nodeId: child.id,
          clientLanguages: "typescript",
          clientFrameworks: "react",
        });

        await saveScreenshot(
          childScreenshot,
          `child-${child.id.replace(":", "-")}`,
          child.name
        );
      }

      if (children.length > 5) {
        console.log(`\n   💡 Note: Limited to first 5 of ${children.length} children`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ SUMMARY");
    console.log("=".repeat(60));
    console.log(`Parent: ${parentNodeName} (${parentNodeId})`);
    console.log(`Children captured: ${Math.min(buttonNodes.length || children.length, 5)}`);
    console.log(`Screenshots saved to: ./screenshots/`);
    console.log("=".repeat(60) + "\n");

    // Close connection
    await bridge.close();
    console.log("✅ Process complete!");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Helper: Save screenshot to file
 */
async function saveScreenshot(screenshotResult, filePrefix, nodeName) {
  if (screenshotResult.isError) {
    console.log(`      ⚠️ Error: ${screenshotResult.content?.[0]?.text}`);
    return;
  }

  const imageContent = screenshotResult.content?.[0];

  if (imageContent?.type === "image" && imageContent.data) {
    const outputDir = "./screenshots";
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().split("T")[0]; // Just date
    const safeName = nodeName.replace(/[^a-zA-Z0-9-]/g, "-").substring(0, 30);
    const filename = `${filePrefix}-${safeName}-${timestamp}.png`;
    const filepath = path.join(outputDir, filename);

    const buffer = Buffer.from(imageContent.data, "base64");
    await fs.writeFile(filepath, buffer);

    console.log(`      ✅ Saved: ${filename} (${Math.round(buffer.length / 1024)} KB)`);
  } else {
    console.log(`      ⚠️ Unexpected response type: ${imageContent?.type}`);
  }
}

testParentChildScreenshots();
