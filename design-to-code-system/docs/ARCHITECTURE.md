# Autonomous Design-to-Code System Architecture

## Overview

This system autonomously converts Figma design components into React code using LangGraph workflows with AI-powered decision making and iterative refinement.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 1: DISCOVERY                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌──────────────────┐
                    │    discovery     │ Fetch Figma data
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │     analysis     │ AI visual analysis
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ early_validator  │ Check confidence
                    └────┬───────┬─────┘
                         │       │
         (confidence<0.7)│       │(sufficient)
                         ↓       ↓
              ┌──────────────┐   │
              │refetch_handler├──┘ (loop back to analysis)
              └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                PHASE 2: INVENTORY & MATCHING                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌──────────────────┐
                    │   repo_scanner   │ Scan existing components
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │     matcher      │ Compare design vs existing
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │strategy_planner  │ AI decides per component
                    └────┬───┬───┬─────┘
                         │   │   │
            ┌────────────┘   │   └──────────────┐
            ↓                ↓                   ↓

┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 3: EXECUTION                           │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │  generator   │    │   patcher    │    │skip_handler  │
    │ (new comp)   │    │(update comp) │    │   (log)      │
    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
           ↓                    ↓                    ↓
   ┌───────────────┐    ┌───────────────┐          │
   │syntax_validator│   │safety_validator│         │
   └───────┬───────┘    └───────┬───────┘          │
           └──────────────┬──────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                PHASE 4: QUALITY ASSURANCE                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌──────────────────┐
                    │quality_checker   │ Multi-stage validation
                    └────────┬─────────┘
                             │
                   (validation failed?)
                             ↓
                    ┌──────────────────┐
                    │     refiner      │ Fix and retry
                    └────────┬─────────┘
                             │ (loop back to quality_checker)
                             ↓
                    ┌──────────────────┐
                    │    finalizer     │ Export results
                    └──────────────────┘
```

---

## State Schema

### Core State Structure

```javascript
{
  // Input
  input: string,                    // Figma URL

  // Discovery phase
  figmaData: {
    fileKey: string,
    nodeId: string,
    screenshotUrl: string,
    nodeMetadata: object,
    componentMetadata: object
  },

  visualAnalysis: {
    summary: string,
    componentCount: number,
    components: Array<{
      name: string,
      atomicLevel: "atom" | "molecule" | "organism",
      props: array,
      variants: object,
      designTokens: object,
      confidence: number
    }>,
    globalTokens: object
  },

  // Inventory phase
  existingComponents: Array<{
    name: string,
    path: string,
    props: array,
    variants: array,
    exports: array
  }>,

  // Strategy phase
  componentStrategy: Array<{
    component: object,        // From visualAnalysis
    action: "create_new" | "update_existing" | "skip",
    targetPath: string | null,
    reason: string,
    confidence: number,
    safetyChecks: {
      dependencyCount: number,
      riskLevel: "low" | "medium" | "high",
      breakingChanges: boolean
    }
  }>,

  // Execution phase
  generatedComponents: Array<{
    name: string,
    filePath: string,
    action: "created" | "updated",
    linesOfCode: number,
    timestamp: string
  }>,

  appliedPatches: Array<{
    componentPath: string,
    changes: object,
    backupPath: string,
    timestamp: string
  }>,

  // Validation phase
  validationResults: {
    typescript: { valid: boolean, errors: array },
    visual: { similarity: number, differences: array },
    dependencies: { safe: boolean, warnings: array }
  },

  // Control flow
  currentPhase: "discovery" | "inventory" | "execution" | "validation" | "finalize",
  iterationCount: number,
  decisionLog: Array<{
    timestamp: string,
    node: string,
    decision: string,
    reasoning: array,
    toolCalls: array
  }>,

  // Routing
  nextNode: string,
  loopReason: string | null
}
```

---

## Tool Definitions

### Discovery Tools

#### `figma_fetch_node`
```javascript
{
  description: "Fetch detailed Figma node data with metadata",
  parameters: {
    fileKey: string,
    nodeId: string,
    depth: number  // How deep to recurse (default: 5)
  },
  returns: {
    metadata: object,
    rawDocument: object
  }
}
```

#### `figma_fetch_variants`
```javascript
{
  description: "Find additional component variants in Figma file",
  parameters: {
    fileKey: string,
    componentName: string,
    variantType: "states" | "sizes" | "styles"
  },
  returns: {
    variants: array,
    nodeIds: array
  }
}
```

#### `screenshot_export`
```javascript
{
  description: "Export high-resolution screenshot of specific Figma node",
  parameters: {
    fileKey: string,
    nodeId: string,
    scale: number  // 1-4
  },
  returns: {
    url: string,
    localPath: string
  }
}
```

---

### Analysis Tools

#### `analyze_ast`
```javascript
{
  description: "Parse React component using TypeScript AST to extract structure",
  parameters: {
    componentPath: string
  },
  returns: {
    name: string,
    props: Array<{ name, type, optional, default }>,
    exports: array,
    imports: array,
    hasVariants: boolean
  }
}
```

#### `measure_similarity`
```javascript
{
  description: "Calculate structural similarity between design and existing component",
  parameters: {
    designComponent: object,  // From visual analysis
    existingComponentPath: string
  },
  returns: {
    similarityScore: number,  // 0-1
    matchedProps: array,
    missingProps: array,
    missingVariants: array,
    recommendation: "create_new" | "update_existing" | "create_variant"
  }
}
```

#### `check_dependencies`
```javascript
{
  description: "Find all files importing/using this component",
  parameters: {
    componentPath: string,
    searchPath: string  // Default: "src"
  },
  returns: {
    usageCount: number,
    usageLocations: array,
    propsUsed: array,
    riskLevel: "none" | "low" | "medium" | "high"
  }
}
```

---

### Design System Tools

#### `map_design_tokens`
```javascript
{
  description: "Map Figma design values to existing design system tokens",
  parameters: {
    designValues: {
      colors: array,
      spacing: array,
      typography: array
    },
    tokenPath: string  // Path to tokens file
  },
  returns: {
    mappings: object,  // { "#3b82f6": "colors.blue.500" }
    unmapped: array,
    suggestions: array
  }
}
```

#### `scan_component_library`
```javascript
{
  description: "Inventory all existing React components in library",
  parameters: {
    componentPath: string,
    pattern: string  // Glob pattern (default: "**/*.tsx")
  },
  returns: {
    count: number,
    components: array
  }
}
```

---

### Code Tools

#### `code_write`
```javascript
{
  description: "Write new file or update existing (creates backup)",
  parameters: {
    filePath: string,
    content: string,
    createBackup: boolean  // Default: true
  },
  returns: {
    success: boolean,
    backupPath: string | null
  }
}
```

#### `code_read`
```javascript
{
  description: "Read file contents",
  parameters: {
    filePath: string
  },
  returns: {
    content: string,
    linesOfCode: number
  }
}
```

#### `diff_preview`
```javascript
{
  description: "Generate git-style diff showing proposed changes",
  parameters: {
    filePath: string,
    newContent: string
  },
  returns: {
    diff: string,
    additions: number,
    deletions: number
  }
}
```

---

### Validation Tools

#### `validate_typescript`
```javascript
{
  description: "Run TypeScript compiler on file",
  parameters: {
    filePath: string
  },
  returns: {
    valid: boolean,
    errors: Array<{ message, line, column }>
  }
}
```

#### `validate_eslint`
```javascript
{
  description: "Run ESLint on file",
  parameters: {
    filePath: string
  },
  returns: {
    valid: boolean,
    errors: array,
    warnings: array
  }
}
```

#### `validate_visual`
```javascript
{
  description: "Compare rendered component screenshot with Figma design",
  parameters: {
    componentPath: string,
    figmaNodeId: string,
    variant: string  // Which variant to test
  },
  returns: {
    similarity: number,  // 0-1
    differences: array,
    acceptable: boolean  // > 0.85 threshold
  }
}
```

#### `validate_dependencies`
```javascript
{
  description: "Check if changes break existing component usage",
  parameters: {
    componentPath: string,
    proposedChanges: object
  },
  returns: {
    safe: boolean,
    breakingChanges: array,
    warnings: array
  }
}
```

---

## Node Specifications

### Phase 1: Discovery Nodes

#### `discovery`
- **Purpose**: Fetch Figma data
- **Tools**: `figma_fetch_node`, `screenshot_export`
- **Output**: `figmaData`
- **Next**: `analysis`

#### `analysis`
- **Purpose**: AI visual analysis using OpenAI GPT-4o
- **Input**: Screenshot + metadata
- **Output**: `visualAnalysis` (Zod schema enforced)
- **Next**: `early_validator`

#### `early_validator`
- **Purpose**: Check if analysis is sufficient
- **Logic**: If avg confidence < 0.7 → route to `refetch_handler`
- **Next**: `refetch_handler` | `repo_scanner`

#### `refetch_handler`
- **Purpose**: Get more Figma data (variants, closeups)
- **Tools**: `figma_fetch_variants`, `screenshot_export`
- **Next**: `analysis` (loop back)

---

### Phase 2: Inventory & Matching Nodes

#### `repo_scanner`
- **Purpose**: Inventory existing components
- **Tools**: `scan_component_library`, `analyze_ast`
- **Output**: `existingComponents`
- **Next**: `matcher`

#### `matcher`
- **Purpose**: Compare each design component vs existing
- **Tools**: `measure_similarity`, `check_dependencies`
- **Output**: Similarity scores for each component
- **Next**: `strategy_planner`

#### `strategy_planner`
- **Purpose**: AI decides action for each component
- **Input**: visualAnalysis + existingComponents + similarity scores
- **Output**: `componentStrategy` (per-component action plan)
- **Routing**: Based on strategy mix (create/update/skip)
- **Next**: `generator` | `patcher` | `skip_handler` (conditional)

---

### Phase 3: Execution Nodes

#### `generator`
- **Purpose**: Create new React components
- **Tools**: `code_write`, `map_design_tokens`
- **Output**: `generatedComponents`
- **Next**: `syntax_validator`

#### `patcher`
- **Purpose**: Update existing components safely
- **Tools**: `check_dependencies`, `diff_preview`, `code_write`
- **Output**: `appliedPatches`
- **Next**: `safety_validator`

#### `skip_handler`
- **Purpose**: Log skipped components
- **Output**: Decision log entry
- **Next**: `quality_checker`

#### `syntax_validator`
- **Purpose**: TypeScript/ESLint checks
- **Tools**: `validate_typescript`, `validate_eslint`
- **Next**: `quality_checker`

#### `safety_validator`
- **Purpose**: Ensure no breaking changes
- **Tools**: `validate_dependencies`
- **Next**: `quality_checker`

---

### Phase 4: Quality Assurance Nodes

#### `quality_checker`
- **Purpose**: Comprehensive validation
- **Tools**: `validate_typescript`, `validate_visual`, `validate_dependencies`
- **Output**: `validationResults`
- **Routing**: If failed → `refiner`, else → `finalizer`
- **Next**: `refiner` | `finalizer` (conditional)

#### `refiner`
- **Purpose**: Fix validation errors and retry
- **Tools**: `code_read`, `code_write`, `diff_preview`
- **Next**: `quality_checker` (loop back)
- **Max iterations**: 3

#### `finalizer`
- **Purpose**: Export results, clean up
- **Output**: Summary report
- **Next**: END

---

## Conditional Routing Logic

### After `early_validator`
```javascript
function routeFromEarlyValidator(state) {
  const avgConfidence = state.visualAnalysis.components.reduce(
    (sum, c) => sum + c.confidence, 0
  ) / state.visualAnalysis.components.length;

  if (avgConfidence < 0.7) {
    return "refetch_handler"; // Need more data
  }

  return "repo_scanner"; // Sufficient, proceed
}
```

### After `strategy_planner`
```javascript
function routeFromStrategyPlanner(state) {
  const strategy = state.componentStrategy;
  const actions = strategy.reduce((acc, s) => {
    acc[s.action] = (acc[s.action] || 0) + 1;
    return acc;
  }, {});

  // Only new components
  if (actions.create_new > 0 && actions.update_existing === 0) {
    return "generator";
  }

  // Has updates (requires safety checks)
  if (actions.update_existing > 0) {
    return "patcher";
  }

  // Nothing to do
  if (actions.skip === strategy.length) {
    return "finalizer";
  }

  return "generator"; // Mixed, start with creation
}
```

### After `quality_checker`
```javascript
function routeFromQualityChecker(state) {
  const results = state.validationResults;

  // Check if all validations passed
  const allPassed =
    results.typescript?.valid &&
    results.visual?.acceptable &&
    results.dependencies?.safe;

  if (allPassed) {
    return "finalizer";
  }

  // Check retry limit
  if (state.iterationCount > 10) {
    console.warn("Max iterations reached, forcing finalization");
    return "finalizer";
  }

  return "refiner"; // Needs fixes
}
```

---

## Checkpointing Strategy

### Development: In-Memory
```javascript
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();
const graph = graphBuilder.compile({ checkpointer });
```

### Production: SQLite
```javascript
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";

const checkpointer = await SqliteSaver.fromConnString("./checkpoints.db");
const graph = graphBuilder.compile({ checkpointer });
```

### Usage Pattern
```javascript
const threadId = `figma-${Date.now()}`;
const config = {
  configurable: { thread_id: threadId },
  recursionLimit: 25
};

await graph.invoke({ input: figmaUrl }, config);
```

---

## Safety Mechanisms

### 1. **Iteration Limits**
- Max 25 iterations via `recursionLimit`
- Per-node retry limits (e.g., refiner: 3 attempts)

### 2. **Automatic Backups**
- All `code_write` operations create `.backup` files
- Rollback available via state history

### 3. **Dependency Checks**
- `check_dependencies` before any update
- Block updates if `riskLevel === "high"`

### 4. **Breaking Change Detection**
- `validate_dependencies` after patches
- Prevents removing required props

### 5. **Human-in-the-Loop**
- Optional: `interruptBefore: ["patcher"]` in compile
- Pause workflow for approval before risky updates

---

## Performance Optimizations

### 1. **Parallel Tool Execution**
- OpenAI can return multiple tool calls
- Execute non-dependent tools in parallel with `Promise.all()`

### 2. **Early Termination**
- Skip validation if strategy is all "skip"
- Fast-path for high-confidence analyses

### 3. **Selective Node Execution**
- Strategy planner can route directly to finalizer
- Bypass unnecessary validation steps

### 4. **Caching**
- Cache AST analysis results per component
- Reuse similarity calculations

---

## Error Handling

### Node-Level
```javascript
try {
  // Node logic
} catch (error) {
  console.error(`❌ ${nodeName} failed:`, error.message);
  return {
    update: {
      status: "error",
      errorLog: [...(state.errorLog || []), { node: nodeName, error: error.message }]
    }
  };
}
```

### Graph-Level
```javascript
try {
  await graph.invoke({ input }, config);
} catch (error) {
  // Retrieve state to see what was completed
  const finalState = await graph.getState(config);
  console.log("Completed phases:", finalState.values.currentPhase);
  console.log("Generated:", finalState.values.generatedComponents.length);
}
```

---

## Testing Strategy

### Unit Tests (Per Node)
```javascript
describe("strategy_planner", () => {
  it("recommends create_new for novel components", async () => {
    const state = {
      visualAnalysis: { components: [{ name: "NewButton", ... }] },
      existingComponents: []
    };
    const result = await strategyPlannerNode(state);
    expect(result.update.componentStrategy[0].action).toBe("create_new");
  });
});
```

### Integration Tests (Full Workflow)
```javascript
it("completes full workflow for simple button", async () => {
  const config = { configurable: { thread_id: "test-1" } };
  const result = await graph.invoke({ input: FIGMA_URL }, config);
  expect(result.generatedComponents.length).toBeGreaterThan(0);
});
```

### Tool Tests
```javascript
it("analyze_ast extracts props correctly", async () => {
  const result = await TOOL_IMPLEMENTATIONS.analyze_ast({
    componentPath: "test-fixtures/Button.tsx"
  });
  expect(result.props).toContainEqual({ name: "variant", type: "string" });
});
```

---

## Monitoring & Observability

### Decision Logging
Every routing decision is logged:
```javascript
{
  timestamp: "2025-01-15T10:30:00Z",
  node: "strategy_planner",
  decision: "route to patcher",
  reasoning: [
    "Component Button has 85% similarity to existing",
    "Only missing 'loading' variant",
    "Low risk: 5 usage locations"
  ],
  toolCalls: [
    { tool: "measure_similarity", result: {...} },
    { tool: "check_dependencies", result: {...} }
  ]
}
```

### Metrics to Track
- Average confidence score
- Tool calls per workflow
- Iterations before completion
- Components created vs updated vs skipped
- Validation pass rate
- Time per phase

---

## Future Enhancements

### 1. **Multi-File Components**
- Support generating component + styles + tests
- Template system for boilerplate

### 2. **Visual Regression Testing**
- Automated screenshot comparison
- Percy/Chromatic integration

### 3. **Design Token Extraction**
- Auto-generate token files from Figma variables
- Sync design system tokens

### 4. **Storybook Integration**
- Auto-generate stories for new components
- Variant documentation

### 5. **Team Collaboration**
- PR creation for component changes
- Code review requests
- Slack/Discord notifications

---

## File Structure

```
design-to-code-system/
├── langgraph-workflow/
│   ├── index.js                    # Entry point
│   ├── graph.js                    # LangGraph workflow definition
│   ├── state-schema.js             # State type definitions
│   ├── nodes/
│   │   ├── analysis.js             # Visual analysis node
│   │   ├── early-validator.js      # Confidence checking
│   │   ├── refetch-handler.js      # Additional data fetching
│   │   ├── repo-scanner.js         # Component inventory
│   │   ├── matcher.js              # Similarity analysis
│   │   ├── strategy-planner.js     # AI decision maker
│   │   ├── generator.js            # New component creation
│   │   ├── patcher.js              # Component updates
│   │   ├── quality-checker.js      # Validation orchestrator
│   │   ├── refiner.js              # Error fixing
│   │   └── finalizer.js            # Results export
│   ├── tools/
│   │   ├── figma-tools.js          # Figma API integrations
│   │   ├── component-tools.js      # AST analysis, scanning
│   │   ├── code-tools.js           # File read/write/diff
│   │   └── validation-tools.js     # TypeScript/ESLint checks
│   ├── prompts/
│   │   ├── analysis-prompt.js
│   │   ├── strategy-prompt.js
│   │   └── generation-prompt.js
│   └── utils/
│       ├── ast-parser.js
│       ├── similarity-calculator.js
│       └── token-mapper.js
├── utils/
│   └── figma-integration.js        # Existing Figma utilities
├── docs/
│   └── ARCHITECTURE.md             # This file
└── tests/
    ├── nodes/
    ├── tools/
    └── integration/
```

---

## Implementation Checklist

- [ ] Phase 1: Documentation (current)
- [ ] Phase 2: State schema + checkpointing
- [ ] Phase 3: Tool implementations
- [ ] Phase 4: Node implementations
- [ ] Phase 5: Graph wiring with conditional edges
- [ ] Phase 6: Integration testing
- [ ] Phase 7: Error handling & logging
- [ ] Phase 8: Performance optimization
- [ ] Phase 9: Documentation & examples
- [ ] Phase 10: Production deployment

---

**Next Steps**: Proceed to Phase 2 - implement state schema and checkpointing infrastructure.