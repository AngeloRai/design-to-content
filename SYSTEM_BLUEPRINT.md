# Design-to-Content System Blueprint

**Version:** 1.0
**Last Updated:** 2025-10-07
**Purpose:** Comprehensive architectural reference for the autonomous Figma-to-React code generation system

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [LangGraph Workflow](#langgraph-workflow)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [AI Integration](#ai-integration)
7. [Validation System](#validation-system)
8. [Component Generation](#component-generation)
9. [Output Structure](#output-structure)
10. [Quality Assurance](#quality-assurance)
11. [Key Design Principles](#key-design-principles)
12. [Extension Points](#extension-points)

---

## System Overview

### Purpose

The Design-to-Content system is an **autonomous AI-powered pipeline** that transforms Figma design files into production-ready React TypeScript components. It uses LangGraph for orchestration, OpenAI for visual analysis and code generation, and implements a sophisticated quality control system with iterative refinement.

### Core Capabilities

- **Visual Analysis**: AI analyzes Figma screenshots to identify components, variants, and design tokens
- **Atomic Design Classification**: Automatically categorizes components as atoms, molecules, or organisms
- **Strategic Planning**: AI decides whether to create new, update existing, or skip components
- **Code Generation**: Generates TypeScript React components with Tailwind CSS
- **Quality Gates**: Iterative refinement until code passes quality thresholds (≥8/10)
- **Multi-Layer Validation**: Import validation, TypeScript validation, reusability analysis
- **Report Generation**: Creates comprehensive markdown and JSON reports
- **Storybook Integration**: Automatically generates Storybook stories

### Key Technologies

- **LangGraph**: Workflow orchestration with state management
- **OpenAI GPT-4o**: Vision + structured output for analysis and generation
- **Zod**: Schema validation for structured AI outputs
- **Figma REST API**: Design data and screenshot retrieval
- **TypeScript**: In-memory validation without file system writes
- **Tailwind CSS**: Styling framework for generated components

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LANGGRAPH WORKFLOW                       │
│                                                             │
│  ┌───────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ Analysis  │───▶│   Strategy   │───▶│  Generator   │   │
│  │           │    │   Planner    │    │  (Subgraph)  │   │
│  └───────────┘    └──────────────┘    └──────────────┘   │
│       │                  │                     │           │
│       │                  │                     │           │
│       ▼                  ▼                     ▼           │
│  ┌───────────────────────────────────────────────────┐    │
│  │              STATE (Annotation.Root)              │    │
│  │  - visualAnalysis                                 │    │
│  │  - componentStrategy                              │    │
│  │  - generatedComponents                            │    │
│  │  - validationResults                              │    │
│  │  - libraryContext                                 │    │
│  └───────────────────────────────────────────────────┘    │
│                          │                                 │
│                          ▼                                 │
│                  ┌──────────────┐                         │
│                  │  Finalizer   │                         │
│                  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       OUTPUT                                │
│  - nextjs-app/ui/elements/    (atoms)                      │
│  - nextjs-app/ui/components/  (molecules)                  │
│  - nextjs-app/ui/modules/     (organisms)                  │
│  - nextjs-app/ui/icons/       (SVG icons)                  │
│  - reports/                   (markdown + JSON)            │
│  - storybook-app/stories/     (Storybook stories)          │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
design-to-content/
├── design-to-code-system/        # Main workflow system
│   ├── langgraph-workflow/       # LangGraph implementation
│   │   ├── index.js              # Entry point
│   │   ├── graph.js              # Workflow graph definition
│   │   ├── nodes/                # Workflow nodes
│   │   │   ├── analysis.js       # Visual analysis node
│   │   │   ├── strategy-planner.js  # Strategy planning node
│   │   │   ├── generator.js      # Component generation node
│   │   │   ├── generator-subgraph.js # Refinement subgraph
│   │   │   └── finalizer.js      # Report generation node
│   │   ├── schemas/              # Zod schemas
│   │   │   ├── state.js          # LangGraph state definition
│   │   │   ├── component-schemas.js  # Component data schemas
│   │   │   └── review-schemas.js # Validation schemas
│   │   ├── prompts/              # AI prompts
│   │   │   ├── analysis/         # Analysis prompts
│   │   │   ├── generation/       # Generation prompts
│   │   │   └── review/           # Review prompts
│   │   ├── tools/                # AI function calling tools
│   │   │   ├── figma-tools.js    # Figma API interactions
│   │   │   ├── component-tools.js # Component file operations
│   │   │   └── validation-tools.js # Validation utilities
│   │   └── utils/                # Utility functions
│   │       ├── config.js         # Configuration management
│   │       ├── validate-imports-in-memory.js
│   │       ├── validate-typescript-in-memory.js
│   │       ├── validate-component-reusability.js
│   │       ├── code-validation-orchestrator.js
│   │       ├── report-generator.js
│   │       └── storybook-generator.js
│   └── utils/                    # Shared utilities
│       ├── figma-integration.js  # Figma API wrapper
│       ├── svg-extractor.js      # Icon extraction
│       └── ai-component-scanner.js # Library scanning
├── nextjs-app/                   # Output target
│   └── ui/                       # Generated components
│       ├── elements/             # Atoms (Button, Input, etc.)
│       ├── components/           # Molecules (Card, Pagination, etc.)
│       ├── modules/              # Organisms (Modal, Header, etc.)
│       └── icons/                # SVG icon components
├── reports/                      # Generated reports
│   ├── workflow-report-*.md     # Human-readable summary
│   ├── workflow-report-*.json   # Machine-readable data
│   └── component-inventory-*.json # Component metadata
├── storybook-app/                # Storybook integration
│   └── stories/                  # Auto-generated stories
├── debug/                        # Debug artifacts (dev mode)
│   ├── screenshots/              # Downloaded Figma images
│   └── analysis-reports/         # Full analysis JSON
└── .env                          # Configuration
```

---

## LangGraph Workflow

### Workflow Graph Definition

**File:** `langgraph-workflow/graph.js`

```javascript
START
  → analysis
  → strategy_planner
  → [conditional routing]
      ├─ generator (if create_new)
      └─ finalizer (if all skip)
  → finalizer
  → END
```

### State Management

**File:** `langgraph-workflow/schemas/state.js`

Uses LangGraph's `Annotation.Root` pattern for type-safe state:

```javascript
StateAnnotation = {
  // Input
  input: String,                    // Figma URL
  figmaData: Object,                // Raw Figma data + screenshots

  // Analysis phase
  visualAnalysis: Object,           // AI analysis result

  // Strategy phase
  componentStrategy: Array,         // Create/update/skip decisions
  libraryContext: Object,           // Existing components

  // Generation phase
  generatedComponents: Array,       // Generated component metadata

  // Validation phase
  validationResults: Array,         // Quality check results

  // Configuration
  outputPath: String,               // Target directory

  // Workflow state
  currentPhase: String,             // init|analysis|strategy|generation|complete
  status: String,                   // pending|success|error
  errors: Array,                    // Error accumulation
  metadata: Object                  // Timing, costs, stats
}
```

### Nodes Overview

#### 1. Analysis Node
- **Purpose**: Visual analysis of Figma designs
- **Input**: Figma URL
- **AI Task**: Screenshot analysis with structured output
- **Output**: Component specifications with variants and design tokens
- **Features**:
  - Fetches Figma screenshot via REST API
  - Extracts design tokens (colors, spacing, typography)
  - Extracts icon SVGs (batch operation)
  - Validates analysis completeness (with refinement if needed)
  - Saves debug artifacts in development mode

#### 2. Strategy Planner Node
- **Purpose**: Decide what to do with each component
- **Input**: Visual analysis + library context
- **AI Task**: Tool-calling for component discovery and decision-making
- **Output**: Strategy decisions (create_new, update_existing, skip)
- **Features**:
  - Scans existing components with AI
  - Uses tools to read/compare components
  - Checks component usage for update safety
  - Provides confidence scores and reasoning

#### 3. Generator Node
- **Purpose**: Generate React components from specifications
- **Input**: Component strategy + visual analysis
- **AI Task**: Code generation with quality control (subgraph)
- **Output**: TypeScript React components
- **Features**:
  - Generates icons first (from extracted SVGs)
  - Invokes refinement subgraph for each component
  - Writes approved components to file system
  - Handles component updates (with backups)

#### 4. Generator Subgraph (Refinement Loop)
- **Purpose**: Iterative quality-driven generation
- **Flow**: generate → review → [approve OR refine]
- **Quality Gate**: Score ≥ 8.0/10
- **Max Iterations**: 7
- **Features**:
  - Initial generation with full context
  - Code review with structured feedback
  - Surgical refinement (not regeneration)
  - Multi-layer validation (imports, TypeScript, reusability)
  - Automatic approval after max iterations

#### 5. Finalizer Node
- **Purpose**: Aggregate results and generate reports
- **Input**: Final workflow state
- **Output**: Reports, stories, statistics
- **Features**:
  - Generates markdown report (human-readable)
  - Generates JSON report (machine-readable)
  - Generates component inventory (metadata)
  - Generates Storybook stories
  - Calculates workflow statistics

---

## Core Components

### 1. Figma Integration

**File:** `utils/figma-integration.js`

#### Functions:
- `parseFigmaUrl(url)`: Extract fileKey and nodeId from Figma URL
- `fetchNodeData(fileKey, nodeId, depth)`: Fetch node hierarchy from Figma API
- `extractComponentMetadata(rawDocument)`: Parse Figma node tree for components
- `extractDesignTokens(rawDocument)`: Extract colors, spacing, typography from all nodes

#### Design Token Extraction:
```javascript
designTokens = {
  colors: [{
    hex: "#1A73E8",
    type: "fill|stroke",
    contexts: [{ nodeName, nodeType, property }]
  }],
  spacing: [...],
  typography: [...]
}
```

### 2. Icon Extraction

**File:** `utils/svg-extractor.js`

#### Process:
1. Identify vector nodes in Figma tree
2. Batch fetch SVG content via Figma API (`/images/${fileKey}?ids=${nodeIds}&format=svg`)
3. Parse SVG XML to extract paths and attributes
4. Normalize SVG attributes for React (fillRule, strokeWidth, etc.)
5. Generate React component wrapper with dynamic props (size, color)

### 3. AI Component Scanner

**File:** `utils/ai-component-scanner.js`

#### Purpose:
Scan existing component library and build context for AI

#### Output:
```javascript
libraryContext = {
  elements: ["Button", "Input", "Avatar", ...],
  components: ["Card", "Pagination", ...],
  modules: ["Modal", "Header", ...],
  icons: ["SearchIcon", "CloseIcon", ...]
}
```

### 4. Component Tools (AI Function Calling)

**File:** `langgraph-workflow/tools/component-tools.js`

#### Available Tools:
- `list_components(directory, pattern)`: List all React files
- `read_component_file(filePath)`: Read component source code
- `read_multiple_files(filePaths)`: Batch read for comparison
- `search_component_usage(componentName)`: Find usages across codebase
- `write_component(filePath, code)`: Write component with backup
- `validate_typescript(code, tempFileName)`: In-memory validation

**Philosophy:** Give AI the tools and data, let it reason and decide

---

## Data Flow

### Complete Flow Diagram

```
┌─────────────────┐
│  Figma URL      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  ANALYSIS NODE                      │
│  1. Parse URL → fileKey, nodeId     │
│  2. Fetch screenshot + node data    │
│  3. Extract design tokens           │
│  4. AI visual analysis              │
│  5. Extract icons (if any)          │
│  6. Validate completeness           │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  visualAnalysis (Zod validated)     │
│  {                                  │
│    components: [{                   │
│      name, atomicLevel,             │
│      styleVariants, sizeVariants,   │
│      variantVisualMap,              │
│      interactiveBehaviors,          │
│      designTokens                   │
│    }]                               │
│  }                                  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  STRATEGY PLANNER NODE              │
│  1. Scan existing components        │
│  2. AI tool calling:                │
│     - list_components()             │
│     - read_component_file()         │
│     - search_component_usage()      │
│  3. Make decisions (create/update/skip) │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  componentStrategy                  │
│  [{                                 │
│    component: {...},                │
│    action: "create_new",            │
│    targetPath,                      │
│    reason,                          │
│    confidence                       │
│  }]                                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  GENERATOR NODE                             │
│  1. Generate icons (if any)                 │
│  2. Update library context                  │
│  3. For each create_new:                    │
│     ┌────────────────────────────────────┐  │
│     │  REFINEMENT SUBGRAPH (iterative)   │  │
│     │  ┌──────────────────────────────┐  │  │
│     │  │  generate_component          │  │  │
│     │  └──────────┬───────────────────┘  │  │
│     │             ▼                       │  │
│     │  ┌──────────────────────────────┐  │  │
│     │  │  review_code (multi-layer)   │  │  │
│     │  │  - AI review (5 dimensions)  │  │  │
│     │  │  - Import validation         │  │  │
│     │  │  - TypeScript validation     │  │  │
│     │  │  - Reusability validation    │  │  │
│     │  └──────────┬───────────────────┘  │  │
│     │             ▼                       │  │
│     │      [score >= 8.0?]               │  │
│     │       ┌─────┴─────┐                │  │
│     │      YES          NO                │  │
│     │       │            │                │  │
│     │       ▼            ▼                │  │
│     │   approve    prepare_feedback      │  │
│     │                    │                │  │
│     │                    └──────┐         │  │
│     │                           │         │  │
│     │      (loop until approved) │        │  │
│     │                           ▼         │  │
│     │              generate_component     │  │
│     └────────────────────────────────────┘  │
│  4. Write approved components               │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  generatedComponents                │
│  [{                                 │
│    name, filePath, action,          │
│    linesOfCode, atomicLevel,        │
│    qualityScore, iterations         │
│  }]                                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  FINALIZER NODE                     │
│  1. Calculate statistics            │
│  2. Generate markdown report        │
│  3. Generate JSON report            │
│  4. Generate component inventory    │
│  5. Generate Storybook stories      │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  OUTPUT FILES                       │
│  - nextjs-app/ui/**/*.tsx           │
│  - reports/workflow-report-*.md     │
│  - reports/workflow-report-*.json   │
│  - reports/component-inventory-*.json│
│  - storybook-app/stories/**/*.tsx   │
└─────────────────────────────────────┘
```

---

## AI Integration

### OpenAI Structured Output

The system uses OpenAI's **structured output mode** (JSON Schema) for reliable parsing:

```javascript
const model = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.1
}).withStructuredOutput(ZodSchema, {
  method: "json_schema",
  name: "schema_name",
  strict: true
});
```

### Key AI Tasks

#### 1. Visual Analysis
- **Model**: GPT-4o (vision-capable)
- **Input**: Screenshot URL + design tokens + system prompt
- **Output**: Structured component analysis (AnalysisSchema)
- **Schema Highlights**:
  - Component name (PascalCase, validated with regex)
  - Atomic level (atom/molecule/organism)
  - Variants (style, size, state)
  - Visual properties per variant (colors, spacing, etc.)
  - Composition (what's inside each variant)
  - Interactive behaviors (triggers and effects)

#### 2. Strategy Planning
- **Model**: GPT-4o (with function calling)
- **Input**: Visual analysis + library context + tools
- **Output**: Strategy decisions (StrategyDecisionSchema)
- **Tools Used**: list_components, read_component_file, search_component_usage
- **Decision Factors**:
  - Similarity to existing components
  - Usage count (impact of updates)
  - Risk level (breaking changes)
  - Confidence score

#### 3. Code Generation
- **Model**: GPT-4o
- **Input**: Component spec + library context + screenshot
- **Output**: TypeScript React code (GeneratedCodeSchema)
- **Prompt Strategy**:
  - Emphasize reusability (CRITICAL priority)
  - List available library components
  - Provide variant visual mappings
  - Include interactive behavior requirements
  - Require actual implementation (no placeholders)

#### 4. Code Review
- **Model**: GPT-4o
- **Input**: Generated code + component spec + library context
- **Output**: Structured review (CodeReviewSchema)
- **Review Dimensions** (each scored 0-10):
  - Props design (2 checks)
  - Imports and library usage (3 checks)
  - TypeScript quality (3 checks)
  - Tailwind CSS usage (3 checks)
  - Accessibility (3 checks)
- **Aggregate**: Average score, pass/fail (≥8.0), feedback

#### 5. Refinement
- **Model**: GPT-4o
- **Input**: Current code + review feedback + library context
- **Output**: Refined code (GeneratedCodeSchema)
- **Strategy**: Surgical fixes, not full regeneration

#### 6. Reusability Validation
- **Model**: GPT-4o
- **Input**: Code + library context
- **Output**: Reusability analysis (ReusabilityAnalysisSchema)
- **Checks**:
  - Inline HTML elements that should use library components
  - Missing imports
  - Suggestions with import paths

---

## Validation System

### Multi-Layer Validation Architecture

**File:** `langgraph-workflow/utils/code-validation-orchestrator.js`

```
┌─────────────────────────────────────────┐
│  runAllValidations(code, spec, library) │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  1. Import Validation          │    │
│  │     (deterministic)             │    │
│  │     - Parse import statements   │    │
│  │     - Check against library     │    │
│  └────────────┬───────────────────┘    │
│               │                         │
│  ┌────────────▼───────────────────┐    │
│  │  2. TypeScript Validation      │    │
│  │     (in-memory)                 │    │
│  │     - Create temp tsconfig      │    │
│  │     - Run tsc --noEmit          │    │
│  │     - Parse errors               │    │
│  └────────────┬───────────────────┘    │
│               │                         │
│  ┌────────────▼───────────────────┐    │
│  │  3. Reusability Validation     │    │
│  │     (AI-powered)                │    │
│  │     - Find inline HTML elements │    │
│  │     - Suggest library components│    │
│  │     - Calculate reusability score│   │
│  └────────────┬───────────────────┘    │
│               │                         │
│               ▼                         │
│  ┌────────────────────────────────┐    │
│  │  Consolidated Results          │    │
│  │  - allPassed: boolean          │    │
│  │  - criticalIssues: Array       │    │
│  │  - scoreAdjustments: Object    │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 1. Import Validation

**File:** `utils/validate-imports-in-memory.js`

- **Type**: Deterministic
- **Purpose**: Ensure all imports reference existing components
- **Method**: Regex parsing + library context lookup
- **Output**: Valid/invalid + list of invalid imports

### 2. TypeScript Validation

**File:** `utils/validate-typescript-in-memory.js`

- **Type**: Deterministic (compiler-based)
- **Purpose**: Catch type errors before file write
- **Method**: Create temp file + minimal tsconfig → run tsc → parse output
- **Output**: Valid/invalid + compilation errors

### 3. Reusability Validation

**File:** `utils/validate-component-reusability.js`

- **Type**: AI-powered
- **Purpose**: Enforce component reuse (not inline HTML)
- **Method**: AI analyzes code for inline elements + suggests library alternatives
- **Schema**: ReusabilityAnalysisSchema
- **Output**: Score (0-1) + issues with suggestions + severity

### Integration with Code Review

```javascript
// In generator-subgraph.js reviewCodeNode:
const review = await reviewModel.invoke([...]);
const validationResults = await runAllValidations(code, spec, library);
const updatedReview = applyValidationResults(review, validationResults);

// applyValidationResults:
// 1. Merge critical issues
// 2. Apply score adjustments (lower scores for failures)
// 3. Recalculate average score
// 4. Update pass/fail status
```

---

## Component Generation

### Generation Prompt Structure

**File:** `prompts/generation/component-generation-prompt.js`

```javascript
buildComponentGenerationPrompt(componentSpec, libraryContext, previousAttempts, screenshotUrl) {
  return `
    YOU ARE: Expert React/TypeScript component generator

    COMPONENT SPECIFICATION:
    ${JSON.stringify(componentSpec, null, 2)}

    REUSABILITY (CRITICAL - HIGHEST PRIORITY):
    Available library components: ${availableComponents.join(', ')}

    REQUIRED:
    ✓ Import and use existing components instead of HTML
    ✓ Use Button instead of <button>
    ✓ Use Input instead of <input>
    ✓ Use Image instead of <img>
    ✓ Import from @/ui/elements/, @/ui/components/, @/ui/icons/

    FORBIDDEN:
    ✗ Creating inline <button>, <input>, <img> elements
    ✗ Duplicating functionality that exists in library

    VARIANT VISUAL MAPPINGS:
    ${variantVisualMap.map(v => `
      Variant: ${v.variantName}
      - Background: ${v.backgroundColor}
      - Text: ${v.textColor}
      - Border: ${v.borderColor} ${v.borderWidth}
      - Padding: ${v.padding}
      - Font: ${v.fontSize} ${v.fontWeight}
      - Shadow: ${v.shadow}
    `).join('\n')}

    COMPOSITION RENDERING:
    ${variantVisualMap.filter(v => v.composition.containsComponents.length > 0).map(v => `
      Variant "${v.variantName}" composition:
      - Contains: ${v.composition.containsComponents.join(', ')}
      - Layout: ${v.composition.layoutPattern}
      - Elements: ${v.composition.contentElements.join(', ')}
      Generate conditional rendering for this variant's internal structure.
    `).join('\n')}

    INTERACTIVE BEHAVIORS:
    ${interactiveBehaviors.map(b => `
      Behavior: ${b.trigger} → ${b.effect}
      Visual feedback: ${b.stateIndicators.join(', ')}
      - Add proper state management (useState, useCallback)
      - Handle ${b.trigger} events
      - Implement ${b.effect} logic
      Do NOT use placeholder console.log - implement actual functionality.
    `).join('\n')}

    REQUIREMENTS:
    1. Use TypeScript with proper types
    2. Use Tailwind CSS for all styling
    3. Use cn() utility for className merging
    4. Export as named export (export const ${componentName})
    5. Include usage example in JSDoc comment
    6. Handle all variants through props
    7. Implement ALL interactive behaviors (no placeholders)

    SCREENSHOT:
    ${screenshotUrl ? 'Screenshot provided for visual reference' : 'No screenshot'}
  `;
}
```

### Refinement Prompt Strategy

**File:** `prompts/generation/component-refinement-prompt.js`

When refinement is needed (score < 8.0):

```javascript
buildComponentRefinementPrompt(currentCode, feedbackArray, libraryContext) {
  return `
    YOU ARE: Code fixer applying surgical corrections

    EXISTING CODE:
    ${currentCode}

    ISSUES TO FIX (from code review):
    ${feedbackArray.map((f, i) => `${i+1}. ${f}`).join('\n')}

    AVAILABLE LIBRARY:
    ${libraryContext.elements.join(', ')}

    INSTRUCTIONS:
    - Apply ONLY the fixes listed above
    - Do NOT rewrite unrelated code
    - Maintain existing functionality
    - Return complete corrected code in 'code' field

    Focus on:
    - Replacing inline HTML with library components
    - Fixing TypeScript errors
    - Correcting import paths
    - Improving accessibility
  `;
}
```

### Icon Component Generation

**File:** `nodes/generator.js` → `generateIconComponents()`

```javascript
// Process:
// 1. Deduplicate by name
// 2. Normalize icon name (PascalCase + "Icon" suffix)
// 3. Convert SVG attributes to React (fillRule, strokeWidth, etc.)
// 4. Generate component with dynamic size/color props

// Template:
export const IconNameIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* SVG content from Figma API */}
    </svg>
  );
};
```

---

## Output Structure

### Component File Locations

```
nextjs-app/ui/
├── elements/              # Atoms (atomic design)
│   ├── Button.tsx         # Single responsibility, no composition
│   ├── Input.tsx          # Reusable primitive
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── Image.tsx
│   ├── Separator.tsx
│   └── Typography.tsx
│
├── components/            # Molecules (atomic design)
│   ├── Card.tsx           # Composes atoms
│   ├── Pagination.tsx     # Composes Button + state logic
│   └── ToastNotification.tsx
│
├── modules/               # Organisms (atomic design)
│   └── Modal.tsx          # Complex composition, full features
│
└── icons/                 # SVG icon components
    ├── SearchIcon.tsx     # Auto-generated from Figma
    ├── CloseIcon.tsx
    └── ...
```

### Component File Structure

Generated components follow this structure:

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/elements/Button';  // Library imports

/**
 * ComponentName component
 * Description from analysis
 *
 * @example
 * <ComponentName variant="primary" size="md">
 *   Content
 * </ComponentName>
 */

interface ComponentNameProps {
  variant: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  primary: "bg-[#1a73e8] text-white border-none",
  secondary: "bg-transparent text-[#1a73e8] border border-[#1a73e8]",
  tertiary: "bg-[#f5f5f5] text-[#0a0a0a] border-none"
};

const sizeStyles = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg"
};

export const ComponentName: React.FC<ComponentNameProps> = ({
  variant,
  size = 'md',
  disabled = false,
  children,
  className
}) => {
  return (
    <div className={cn(
      variantStyles[variant],
      sizeStyles[size],
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}>
      {children}
    </div>
  );
};

export default ComponentName;
```

### Report Files

#### 1. Markdown Report
**File:** `reports/workflow-report-YYYYMMDD-HHMMSS.md`

```markdown
# Design-to-Code Workflow Report

**Generated:** 2025-10-07T10:30:00Z
**Duration:** 45.23 seconds

## Summary
- Components analyzed: 8
- Components generated: 6
- Components skipped: 2
- Total iterations: 12

## Generated Components

### Button (atom)
- **Path:** nextjs-app/ui/elements/Button.tsx
- **Quality Score:** 9.2/10
- **Iterations:** 2
- **Props:** variant, size, disabled, onClick

### Card (molecule)
- **Path:** nextjs-app/ui/components/Card.tsx
- **Quality Score:** 8.8/10
- **Iterations:** 3
- **Props:** variant, header, footer, children

## Quality Metrics
- Average quality score: 8.9/10
- TypeScript errors: 0
- Import errors: 0
- Reusability score: 95%
```

#### 2. JSON Report
**File:** `reports/workflow-report-YYYYMMDD-HHMMSS.json`

```json
{
  "timestamp": "2025-10-07T10:30:00Z",
  "duration": 45.23,
  "summary": {
    "analyzed": 8,
    "generated": 6,
    "skipped": 2,
    "errors": 0
  },
  "generatedComponents": [...],
  "qualityMetrics": {...},
  "metadata": {...}
}
```

#### 3. Component Inventory
**File:** `reports/component-inventory-YYYYMMDD-HHMMSS.json`

```json
{
  "timestamp": "2025-10-07T10:30:00Z",
  "totalComponents": 6,
  "byCategory": {
    "elements": [...],
    "components": [...],
    "modules": [...]
  },
  "components": [{
    "name": "Button",
    "category": "elements",
    "filePath": "nextjs-app/ui/elements/Button.tsx",
    "atomicLevel": "atom",
    "props": [...],
    "variants": [...],
    "qualityScore": 9.2,
    "linesOfCode": 87
  }]
}
```

### Storybook Stories

**File:** `storybook-app/stories/elements/Button.stories.tsx`

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/ui/elements/Button';

const meta: Meta<typeof Button> = {
  title: 'Elements/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    }
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Click me'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
    children: 'Click me'
  }
};
```

---

## Quality Assurance

### Quality Gates

#### 1. Analysis Validation
- **Check**: Variant completeness
- **Method**: `validateVariantCompleteness(result)`
- **Action**: Refine if incomplete (max 2 attempts)

#### 2. Color Fidelity
- **Check**: Colors match Figma palette
- **Method**: `validateColorFidelity(result, designTokens)`
- **Action**: Warning (non-blocking)

#### 3. Code Review (Iterative)
- **Gate**: Average score ≥ 8.0/10
- **Max Iterations**: 7
- **Dimensions**:
  - Props design (2 checks)
  - Imports and library usage (3 checks)
  - TypeScript quality (3 checks)
  - Tailwind CSS usage (3 checks)
  - Accessibility (3 checks)

#### 4. Import Validation
- **Gate**: All imports valid
- **Method**: Parse imports + check library context
- **Adjustment**: Lower importsAndLibrary score to 3/10 if invalid

#### 5. TypeScript Validation
- **Gate**: No compilation errors
- **Method**: In-memory tsc --noEmit
- **Adjustment**: Lower typescript score to 3/10 if errors

#### 6. Reusability Validation
- **Gate**: Score ≥ 0.7
- **Method**: AI detects inline HTML that should use library
- **Adjustment**: Lower importsAndLibrary score to 6/10 if poor

### Quality Score Calculation

```javascript
// Code review scores (0-10 each):
scores = {
  propsDesign: [check1, check2].average,
  importsAndLibrary: [check1, check2, check3].average,
  typescript: [check1, check2, check3].average,
  tailwind: [check1, check2, check3].average,
  accessibility: [check1, check2, check3].average
};

// Apply deterministic validation adjustments:
if (importValidation.failed) {
  scores.importsAndLibrary = 3;
}
if (typescriptValidation.failed) {
  scores.typescript = 3;
}
if (reusabilityValidation.score < 0.7) {
  scores.importsAndLibrary = min(scores.importsAndLibrary, 6);
}

// Calculate average:
averageScore = Object.values(scores).reduce(sum) / 5;

// Pass/fail:
passed = averageScore >= 8.0;
```

### Iteration Strategy

```
Iteration 1: GENERATE (full prompt)
  ↓
  REVIEW (multi-layer validation)
  ↓
  [score >= 8.0?]
  ├─ YES → APPROVE → Write to disk
  └─ NO → Extract feedback
      ↓
      Iteration 2: REFINE (surgical fixes)
      ↓
      REVIEW
      ↓
      [score >= 8.0?]
      ├─ YES → APPROVE
      └─ NO → Loop (max 7 iterations)
```

---

## Key Design Principles

### 1. AI Autonomy
**Give AI tools and context, let it reason and decide**
- No hardcoded rules for component categorization
- AI decides create vs update vs skip
- AI determines atomic level (atom/molecule/organism)
- AI identifies components, variants, and behaviors

### 2. Visual-First
**Screenshot as source of truth**
- Analysis starts with screenshot, not metadata
- Visual properties extracted per variant
- Design tokens from actual node properties
- Color validation against Figma palette

### 3. Generic Schema Design
**No hardcoded enums, allow AI to discover**

❌ **FORBIDDEN:**
```javascript
size: z.enum(["xs", "sm", "md", "lg", "xl"])
```

✅ **CORRECT:**
```javascript
size: z.string().describe("Size descriptor observed (e.g., 'compact', 'spacious')")
```

**Rationale:** System must work with any design system, any naming convention

### 4. Iterative Quality
**Generate → Review → Refine loop**
- Don't expect perfection on first try
- Surgical refinement (not regeneration)
- Multiple validation layers
- Quality gate: 8.0/10 threshold

### 5. Component Reusability
**Library-first approach**
- Always check existing components before creating
- Import and compose, don't recreate
- Deterministic validation for imports
- AI validation for inline HTML misuse

### 6. State Persistence
**LangGraph checkpointing**
- Workflow state persists between nodes
- Errors accumulate without failing workflow
- Metadata tracks timing and costs
- Supports recovery from failures

### 7. Structured Output
**Zod schemas + OpenAI strict mode**
- All AI outputs validated with Zod
- OpenAI structured output prevents hallucination
- Type safety from AI → code
- Parsing errors caught early

### 8. Separation of Concerns
**Clear node boundaries**
- Analysis: Visual understanding
- Strategy: Decision making
- Generation: Code creation
- Refinement: Quality improvement (subgraph)
- Finalization: Report generation

### 9. Debug-Friendly
**Comprehensive logging and artifacts**
- Screenshot downloads in debug mode
- Full analysis JSON saved
- Iteration-by-iteration tracking
- Quality scores at each step
- Tool call logging

### 10. Type-Safe Throughout
**TypeScript + Zod + LangGraph Annotation**
- State schema validated
- AI outputs validated
- File operations type-safe
- No runtime type surprises

---

## Extension Points

### 1. Adding New Validation Rules

**File:** Create `utils/validate-<your-rule>.js`

```javascript
export async function validateYourRule(code, componentSpec, libraryContext) {
  // Your validation logic
  return {
    valid: boolean,
    issues: Array,
    score: number
  };
}
```

**Integrate:** Add to `code-validation-orchestrator.js`:

```javascript
// In runAllValidations:
const yourValidation = await validateYourRule(code, spec, library);
if (!yourValidation.valid) {
  results.validations.yourRule = { passed: false, issues: [...] };
  results.criticalIssues.push(...yourValidation.issues);
}
```

### 2. Adding New AI Tools

**File:** `langgraph-workflow/tools/your-tools.js`

```javascript
export const yourTools = [
  {
    type: "function",
    function: {
      name: "your_tool_name",
      description: "What AI should know about this tool",
      parameters: {
        type: "object",
        properties: {
          param1: { type: "string", description: "..." }
        },
        required: ["param1"]
      }
    }
  }
];

export async function yourToolName(args) {
  // Implementation
  return { success: true, data: ... };
}
```

**Integrate:** Add to `tools/index.js`:

```javascript
import { yourTools, yourToolName } from './your-tools.js';

export const allTools = [
  ...componentTools,
  ...figmaTools,
  ...yourTools
];

export const toolExecutor = {
  ...existingTools,
  your_tool_name: yourToolName
};
```

### 3. Adding New Workflow Nodes

**File:** `langgraph-workflow/nodes/your-node.js`

```javascript
export const yourNode = async (state) => {
  console.log("🔧 Starting your node...");

  try {
    // Your logic
    const result = await doSomething(state);

    return {
      // State updates
      yourData: result,
      currentPhase: "your_phase"
    };
  } catch (error) {
    console.error("❌ Your node failed:", error.message);
    return {
      errors: [{
        message: error.message,
        phase: "your_phase",
        timestamp: new Date().toISOString()
      }]
    };
  }
};
```

**Integrate:** Add to `graph.js`:

```javascript
import { yourNode } from './nodes/your-node.js';

workflow.addNode("your_node", yourNode);
workflow.addEdge("previous_node", "your_node");
workflow.addEdge("your_node", "next_node");
```

### 4. Customizing AI Prompts

All prompts are in `prompts/` directory:
- `analysis/visual-analysis-prompt.js` - System prompt for analysis
- `analysis/visual-analysis-user-prompt.js` - User prompt with tokens
- `generation/component-generation-prompt.js` - Generation system prompt
- `generation/component-refinement-prompt.js` - Refinement prompt
- `review/unified-code-review-prompt.js` - Review criteria

**Pattern:**
```javascript
export function buildYourPrompt(context) {
  return `
    YOU ARE: Role description

    CONTEXT:
    ${JSON.stringify(context, null, 2)}

    YOUR TASK:
    Clear instructions

    REQUIREMENTS:
    1. Requirement 1
    2. Requirement 2

    OUTPUT FORMAT:
    Expected structure
  `;
}
```

### 5. Adding New Output Formats

**File:** `utils/your-generator.js`

```javascript
export async function generateYourFormat(workflowState, outputDir) {
  // Extract data from state
  const { generatedComponents, visualAnalysis } = workflowState;

  // Generate your format
  const content = createYourFormat(generatedComponents);

  // Write to file
  const outputPath = path.join(outputDir, `your-output-${timestamp}.ext`);
  await fs.writeFile(outputPath, content);

  return {
    outputPath,
    size: content.length,
    totalItems: generatedComponents.length
  };
}
```

**Integrate:** Call in `finalizer.js`:

```javascript
import { generateYourFormat } from '../utils/your-generator.js';

// In finalizerNode:
const yourResult = await generateYourFormat(finalState, outputDir);
console.log(`📄 Your format generated: ${yourResult.outputPath}`);
```

### 6. Supporting New Component Libraries

Currently supports: React + Tailwind + TypeScript

**To add support for other frameworks:**

1. Create new prompt file: `prompts/generation/component-generation-[framework].js`
2. Create new validation: `utils/validate-[framework]-in-memory.js`
3. Update schemas: `schemas/component-schemas.js` (add framework-specific props)
4. Update generator: `nodes/generator.js` (detect framework from config)

### 7. Custom Quality Gates

**File:** `nodes/generator-subgraph.js`

Modify `decideNextAfterCodeReview`:

```javascript
function decideNextAfterCodeReview(state) {
  const score = state.codeReviewResult.averageScore;
  const iteration = state.iterationCount || 0;

  // ADD YOUR CUSTOM GATES:
  if (yourCustomCondition(state)) {
    return "approve_component";
  }

  // Original logic
  if (score >= 8.0) {
    return "approve_component";
  }

  if (iteration >= maxIterations) {
    return "approve_component";
  }

  return "prepare_feedback";
}
```

---

## Usage Examples

### Basic Usage

```bash
# Set environment variables
export FIGMA_ACCESS_TOKEN="figd_..."
export OPENAI_API_KEY="sk-..."

# Run workflow
cd design-to-code-system
node langgraph-workflow/index.js "https://figma.com/file/abc123/Design?node-id=1:2" "nextjs-app/ui"
```

### Programmatic Usage

```javascript
import { createWorkflow } from './langgraph-workflow/graph.js';
import { createInitialState } from './langgraph-workflow/schemas/state.js';

const figmaUrl = "https://figma.com/file/abc123/Design?node-id=1:2";
const outputPath = "nextjs-app/ui";

const workflow = createWorkflow();
const initialState = createInitialState(figmaUrl);
initialState.outputPath = outputPath;

const config = {
  configurable: { thread_id: `figma-${Date.now()}` },
  recursionLimit: 25
};

const finalState = await workflow.invoke(initialState, config);

console.log("Generated:", finalState.generatedComponents.length, "components");
```

### Debug Mode

```bash
# Enable debug logging and artifact saving
DEBUG=true node langgraph-workflow/index.js "https://figma.com/..."

# Artifacts saved to:
# - debug/screenshots/figma-YYYYMMDD-HHMMSS.png
# - debug/analysis-reports/analysis-YYYYMMDD-HHMMSS.json
```

### Custom Configuration

```javascript
// In .env file:
DEFAULT_MODEL=gpt-4o
FALLBACK_MODEL=gpt-4o-mini
MAX_SESSION_COST=5.00
DEBUG=true
LOG_LEVEL=debug
OUTPUT_PATH=nextjs-app/ui
```

---

## Performance Characteristics

### Typical Workflow Timings

- **Analysis**: 5-10 seconds (Figma API + AI vision)
- **Strategy Planning**: 10-20 seconds (tool calling + AI reasoning)
- **Generation (per component)**:
  - Initial generation: 5-8 seconds
  - Code review: 3-5 seconds
  - Refinement: 5-8 seconds
  - Typical iterations: 2-3
  - Total per component: 20-40 seconds
- **Finalization**: 5-10 seconds (report generation)

### Token Usage (Approximate)

- **Analysis**: 2,000-5,000 tokens (input) + 1,000-2,000 tokens (output)
- **Strategy Planning**: 1,000-3,000 tokens per tool call (5-10 calls)
- **Generation**: 3,000-6,000 tokens (input) + 500-1,500 tokens (output)
- **Review**: 2,000-4,000 tokens (input) + 300-600 tokens (output)
- **Total per component**: ~30,000-50,000 tokens

### Cost Estimation (GPT-4o)

- **Per component**: $0.15-$0.30
- **Per workflow (5-10 components)**: $0.75-$3.00

---

## Troubleshooting

### Common Issues

#### 1. "No components found in analysis"
- **Cause**: Screenshot doesn't show UI components
- **Fix**: Ensure Figma node-id points to component, not empty frame

#### 2. "Import validation failed"
- **Cause**: Generated code imports non-existent components
- **Fix**: Check library context is correctly populated
- **Debug**: Review `libraryContext` in state

#### 3. "TypeScript validation failed"
- **Cause**: Syntax or type errors in generated code
- **Fix**: System auto-refines, check if max iterations reached
- **Debug**: Read error messages in console

#### 4. "Quality gate not met after 7 iterations"
- **Cause**: Component too complex or requirements unclear
- **Fix**: Simplify design, or adjust quality threshold
- **Debug**: Review refinement feedback in logs

#### 5. "Screenshot URL failed"
- **Cause**: Invalid Figma token or expired URL
- **Fix**: Regenerate Figma access token
- **Check**: Token in `.env` file

---

## Future Enhancements

### Potential Additions

1. **Multi-File Components**: Support for index.ts + styles + tests
2. **Animation Detection**: Identify transitions/animations from Figma
3. **Responsive Breakpoints**: Extract and implement responsive variants
4. **Theme System**: Generate theme tokens from Figma variables
5. **Accessibility Testing**: Automated a11y checks (axe-core integration)
6. **Visual Regression**: Compare generated component screenshots to Figma
7. **Incremental Updates**: Update only changed components
8. **Multi-Framework**: Support Vue, Svelte, Angular
9. **Custom Hooks**: Extract stateful logic to custom hooks
10. **Test Generation**: Generate Jest/Vitest tests

---

## Conclusion

The Design-to-Content system represents a sophisticated, production-ready approach to autonomous design-to-code generation. By combining:

- **LangGraph** for workflow orchestration
- **OpenAI GPT-4o** for visual understanding and code generation
- **Multi-layer validation** for quality assurance
- **Iterative refinement** for reliable outputs
- **AI-first philosophy** (give tools, let AI decide)

...it achieves a level of autonomy and quality that traditional rule-based systems cannot match.

The system is **generic by design** - no hardcoded enums, no assumptions about design systems - allowing it to adapt to any Figma file and any component library.

**Key Success Factors:**
✅ Visual-first analysis (screenshot as truth)
✅ Structured AI outputs (Zod validation)
✅ Iterative refinement (quality gates)
✅ Component reusability (library-first)
✅ Multi-layer validation (deterministic + AI)
✅ Comprehensive reporting (markdown + JSON + inventory)

---

**End of Blueprint**
