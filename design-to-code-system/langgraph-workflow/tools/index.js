#!/usr/bin/env node

/**
 * TOOLS INDEX - Export all tools for LangGraph
 */

import { componentTools } from "./component-tools.js";
import { figmaTools } from "./figma-tools.js";
import { validationTools } from "./validation-tools.js";

// Export all tool definitions
export const allTools = [
  ...componentTools,
  ...figmaTools,
  ...validationTools
];

// Export tool implementations
export {
  listComponents,
  readComponentFile,
  readMultipleFiles,
  searchComponentUsage,
  writeComponent,
  validateTypeScript
} from "./component-tools.js";

export {
  fetchFigmaScreenshot,
  fetchFigmaNodeData
} from "./figma-tools.js";

export {
  runTypeScriptCheck,
  runLinter,
  checkImports
} from "./validation-tools.js";

/**
 * Tool execution router
 * Maps tool names to their implementations
 */
export const toolExecutor = {
  // Component tools
  list_components: async (args) => {
    const { listComponents } = await import("./component-tools.js");
    return listComponents(args.directory, args.pattern);
  },

  read_component_file: async (args) => {
    const { readComponentFile } = await import("./component-tools.js");
    return readComponentFile(args.filePath);
  },

  read_multiple_files: async (args) => {
    const { readMultipleFiles } = await import("./component-tools.js");
    return readMultipleFiles(args.filePaths);
  },

  search_component_usage: async (args) => {
    const { searchComponentUsage } = await import("./component-tools.js");
    return searchComponentUsage(args.componentName, args.searchDirectory);
  },

  write_component: async (args) => {
    const { writeComponent } = await import("./component-tools.js");
    return writeComponent(args.filePath, args.code, args.createBackup);
  },

  validate_typescript: async (args) => {
    const { validateTypeScript } = await import("./component-tools.js");
    return validateTypeScript(args.code, args.tempFileName);
  },

  // Figma tools
  fetch_figma_screenshot: async (args) => {
    const { fetchFigmaScreenshot } = await import("./figma-tools.js");
    return fetchFigmaScreenshot(args.fileKey, args.nodeId, args.scale);
  },

  fetch_figma_node_data: async (args) => {
    const { fetchFigmaNodeData } = await import("./figma-tools.js");
    return fetchFigmaNodeData(args.fileKey, args.nodeId, args.depth);
  },

  // Validation tools
  run_typescript_check: async (args) => {
    const { runTypeScriptCheck } = await import("./validation-tools.js");
    return runTypeScriptCheck(args.files);
  },

  run_linter: async (args) => {
    const { runLinter } = await import("./validation-tools.js");
    return runLinter(args.files);
  },

  check_imports: async (args) => {
    const { checkImports } = await import("./validation-tools.js");
    return checkImports(args.filePath);
  }
};