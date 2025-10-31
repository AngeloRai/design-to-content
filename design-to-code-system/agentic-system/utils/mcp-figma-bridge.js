/**
 * Figma MCP Bridge
 * Connects to Figma's MCP server to access advanced tools not available via REST API
 * Uses functional programming patterns with SSE/Streamable HTTP transport
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { env } from "../config/env.config.js";
/**
 * Figma MCP Server URLs
 */
const FIGMA_MCP_SERVERS = {
  remote: "https://mcp.figma.com/mcp",
  desktop: "http://127.0.0.1:3845/mcp",
};

/**
 * Create MCP client and connect to Figma server
 * Attempts modern transport first, falls back to legacy SSE
 */
const createFigmaClient = async (serverUrl = FIGMA_MCP_SERVERS.remote) => {
  const baseUrl = new URL(serverUrl);
  let client;

  try {
    // Try modern Streamable HTTP transport first
    console.log(`📡 Attempting connection to ${serverUrl} (Streamable HTTP)...`);

    client = new Client({
      name: "figma-mcp-bridge",
      version: "1.0.0",
    });

    const transport = new StreamableHTTPClientTransport(baseUrl);
    await client.connect(transport);

    console.log("✅ Connected using Streamable HTTP transport\n");
    return client;
  } catch (error) {
    // Fall back to SSE transport for older servers
    console.log("⚠️  Streamable HTTP failed, trying SSE transport...");

    try {
      client = new Client({
        name: "figma-mcp-bridge-sse",
        version: "1.0.0",
      });

      const sseTransport = new SSEClientTransport(baseUrl);
      await client.connect(sseTransport);

      console.log("✅ Connected using SSE transport\n");
      return client;
    } catch (sseError) {
      throw new Error(
        `Failed to connect with both transports.\n` +
        `Streamable HTTP: ${error.message}\n` +
        `SSE: ${sseError.message}`
      );
    }
  }
};

/**
 * List all available tools from Figma MCP server
 */
const listFigmaTools = async (client) => {
  const { tools } = await client.listTools();
  return tools;
};

/**
 * Call a Figma MCP tool
 */
const callFigmaTool = async (client, toolName, args) => {
  return await client.callTool({
    name: toolName,
    arguments: args,
  });
};

/**
 * List available resources from Figma MCP server
 */
const listFigmaResources = async (client) => {
  const { resources } = await client.listResources();
  return resources;
};

/**
 * Read a specific resource from Figma MCP server
 */
const readFigmaResource = async (client, uri) => {
  const { contents } = await client.readResource({ uri });
  return contents;
};

/**
 * Close the MCP client connection
 */
const closeFigmaClient = async (client) => {
  await client.close();
};

/**
 * Main bridge interface - creates and returns functional API
 */
export const createFigmaBridge = async (options = {}) => {
  const {
    serverUrl = FIGMA_MCP_SERVERS.remote,
    useDesktop = false,
  } = options;

  const url = useDesktop ? FIGMA_MCP_SERVERS.desktop : serverUrl;
  const client = await createFigmaClient(url);

  // Return functional API
  return {
    listTools: () => listFigmaTools(client),
    callTool: (toolName, args) => callFigmaTool(client, toolName, args),
    listResources: () => listFigmaResources(client),
    readResource: (uri) => readFigmaResource(client, uri),
    close: () => closeFigmaClient(client),

    // Direct client access for advanced use
    client,
  };
};

// Test the bridge if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    console.log("=== Testing Figma MCP Bridge ===\n");

    try {
      // Try desktop first, fall back to remote
      const useDesktop = env.useDesktop === "true";

      console.log(`🎯 Target: ${useDesktop ? "Desktop" : "Remote"} MCP server\n`);

      const bridge = await createFigmaBridge({ useDesktop });

      // List available tools
      console.log("📋 Available tools:");
      const tools = await bridge.listTools();
      tools.forEach((tool) => {
        console.log(`   - ${tool.name}`);
        console.log(`     ${tool.description || "No description"}`);
      });
      console.log();

      // List available resources
      console.log("📦 Available resources:");
      try {
        const resources = await bridge.listResources();
        if (resources.length > 0) {
          resources.forEach((resource) => {
            console.log(`   - ${resource.uri}`);
            console.log(`     ${resource.description || "No description"}`);
          });
        } else {
          console.log("   No resources available");
        }
      } catch (error) {
        console.log(`   Could not list resources: ${error.message}`);
      }
      console.log();

      // Example: Call a tool if you have a Figma URL
      const figmaUrl = env.figma.url;
      if (figmaUrl && tools.some(t => t.name === "get_code")) {
        console.log("🔧 Testing get_code tool...");
        const result = await bridge.callTool("get_code", {
          nodeId: "", // Will use currently selected node in Figma
        });
        console.log("   Result:", JSON.stringify(result, null, 2));
        console.log();
      }

      console.log("✅ Bridge test complete!");

      await bridge.close();
      console.log("🔌 Connection closed");

    } catch (error) {
      console.error("❌ Error:", error.message);
      console.error("\n💡 Tips:");
      console.error("   - For desktop server: Ensure Figma desktop app is running with MCP enabled");
      console.error("   - For remote server: Check your internet connection");
      console.error("   - Set USE_DESKTOP=true to try desktop server");
      process.exit(1);
    }
  })();
}
