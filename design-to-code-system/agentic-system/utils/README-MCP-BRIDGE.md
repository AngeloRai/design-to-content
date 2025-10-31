# Figma MCP Bridge

Functional bridge to connect to Figma's Model Context Protocol (MCP) server for accessing advanced tools not available via the REST API.

## Features

- **Functional API**: Pure functions with no classes
- **Auto-fallback**: Tries Streamable HTTP, falls back to SSE
- **Desktop & Remote**: Supports both local and remote Figma MCP servers
- **Advanced Tools**: Access to `get_code`, `get_variable_defs`, `get_screenshot`, `get_metadata`, `get_code_connect_map`

## Quick Start

### 1. Prerequisites

**For Desktop Server (Recommended):**
- Figma desktop app installed and running
- A Figma file open
- MCP server enabled (should be on by default)

**For Remote Server:**
- Requires authentication (not yet implemented in this version)
- See Figma's official documentation

### 2. Basic Usage

```javascript
import { createFigmaBridge } from "./agentic-system/utils/mcp-figma-bridge.js";

// Connect to desktop server
const bridge = await createFigmaBridge({ useDesktop: true });

// List available tools
const tools = await bridge.listTools();
console.log(tools.map(t => t.name));

// Get code for selected node in Figma
const code = await bridge.callTool("get_code", {
  nodeId: "", // Empty = currently selected
  clientLanguages: "javascript,typescript",
  clientFrameworks: "react",
});

// Get design variables
const variables = await bridge.callTool("get_variable_defs", {
  nodeId: "",
});

// Clean up
await bridge.close();
```

### 3. Run the Example

```bash
# Make sure Figma desktop app is running with a file open
node design-to-code-system/test-mcp-bridge.js
```

## Available Tools

### `get_code`
Generate UI code for a Figma node.

**Parameters:**
- `nodeId` (string): Node ID or empty for selected node
- `clientLanguages` (string): e.g., "javascript,typescript"
- `clientFrameworks` (string): e.g., "react"

**Example:**
```javascript
const result = await bridge.callTool("get_code", {
  nodeId: "123:456", // or "" for selected
  clientLanguages: "typescript",
  clientFrameworks: "react",
});
```

### `get_variable_defs`
Get design variable definitions (colors, typography, spacing).

**Parameters:**
- `nodeId` (string): Node ID or empty for file-level variables

**Example:**
```javascript
const variables = await bridge.callTool("get_variable_defs", {
  nodeId: "",
});
// Returns: { 'color/primary': '#1E40AF', ... }
```

### `get_screenshot`
Generate screenshot for a node.

**Parameters:**
- `nodeId` (string): Node ID or empty for selected

**Example:**
```javascript
const screenshot = await bridge.callTool("get_screenshot", {
  nodeId: "",
});
```

### `get_metadata`
Get node structure in XML format (lightweight).

**Parameters:**
- `nodeId` (string): Node ID or empty for selected

**Example:**
```javascript
const metadata = await bridge.callTool("get_metadata", {
  nodeId: "0:1", // Can use page ID
});
```

### `get_code_connect_map`
Get mapping of Figma nodes to codebase components.

**Parameters:**
- `nodeId` (string): Node ID or empty for selected

**Example:**
```javascript
const mapping = await bridge.callTool("get_code_connect_map", {
  nodeId: "",
});
// Returns: { '1:2': { codeConnectSrc: 'components/Button.tsx', ... } }
```

### `create_design_system_rules`
Generate design system rules for the repository.

## API Reference

### `createFigmaBridge(options)`

Creates and connects to Figma MCP server.

**Parameters:**
- `options.useDesktop` (boolean): Use desktop server instead of remote
- `options.serverUrl` (string): Custom server URL (optional)

**Returns:** Promise resolving to bridge object with:
- `listTools()`: List available tools
- `callTool(name, args)`: Call a tool
- `listResources()`: List available resources
- `readResource(uri)`: Read a resource
- `close()`: Close connection

## Integration with Your Workflow

### In LangGraph Nodes

```javascript
import { createFigmaBridge } from "./agentic-system/utils/mcp-figma-bridge.js";

export const figmaExtractorNode = async (state) => {
  const bridge = await createFigmaBridge({ useDesktop: true });

  try {
    // Get code for the design
    const code = await bridge.callTool("get_code", {
      nodeId: state.nodeId,
      clientLanguages: "typescript",
      clientFrameworks: "react",
    });

    // Get design variables
    const variables = await bridge.callTool("get_variable_defs", {
      nodeId: state.nodeId,
    });

    return {
      ...state,
      generatedCode: code,
      designVariables: variables,
    };
  } finally {
    await bridge.close();
  }
};
```

### Combining with REST API

The MCP bridge complements the existing REST API:

- **Use REST API for**: File structure, basic node data, bulk operations
- **Use MCP Bridge for**: Code generation, variable definitions, screenshots, Code Connect

```javascript
// REST API: Get file structure
const fileData = await fetchFigmaNodeData(fileKey, nodeId);

// MCP Bridge: Generate code for specific nodes
const bridge = await createFigmaBridge({ useDesktop: true });
const code = await bridge.callTool("get_code", { nodeId });
```

## Troubleshooting

### Connection Failed
- Ensure Figma desktop app is running
- Check that you have a file open
- Verify MCP server is enabled in Figma settings

### Tool Calls Fail
- Make sure you have a node selected in Figma (when using `nodeId: ""`)
- Provide valid node IDs in format `"123:456"`
- Check tool parameters match the expected schema

### Transport Errors
- Desktop server uses Streamable HTTP on port 3845
- If port is occupied, restart Figma
- Remote server requires authentication (not yet supported)

## Next Steps

- [ ] Add authentication for remote MCP server
- [ ] Add retry logic for transient failures
- [ ] Cache connections for better performance
- [ ] Add TypeScript type definitions
- [ ] Add tool response validation

## Resources

- [Figma MCP Documentation](https://developers.figma.com/docs/figma-mcp-server)
- [MCP Specification](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
