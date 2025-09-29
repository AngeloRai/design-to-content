# Figma Processor - AI-Powered Design-to-Code System

## Overview

The Figma Processor is an intelligent design-to-code generation system that transforms Figma designs and screenshots into production-ready React components using advanced AI visual analysis and code generation. It employs a visual-first architecture where AI models analyze UI designs, identify components, and generate TypeScript React code with Tailwind CSS styling.

## Core Architecture

### Processing Pipeline

The system follows a sophisticated multi-stage processing pipeline:

```
1. Visual Input → 2. AI Visual Analysis → 3. Component Routing → 4. Code Generation → 5. Validation & Audit → 6. Output
```

### Key Components

#### 1. **Design Processor** (`design-processor.js`)
The main orchestrator that coordinates the entire processing workflow:
- Accepts Figma URLs or local screenshot paths as input
- Manages the processing pipeline from visual analysis to component generation
- Handles session tracking and reporting
- Provides CLI interface for different processing modes

#### 2. **Visual Analysis Engine** (`utils/engines/visual-analysis-engine.js`)
Leverages OpenAI's GPT-4 Vision model for intelligent UI analysis:
- Performs comprehensive visual analysis of screenshots
- Identifies UI components, variants, and visual patterns
- Determines component boundaries and hierarchies
- Outputs structured analysis for downstream processing

#### 3. **AI Generation Router** (`generators/ai-generation-router.js`)
Intelligent routing system that determines optimal generation strategy:
- Analyzes visual complexity to choose generation approach
- Routes between three strategies:
  - **ATOM_GENERATION**: For simple, reusable UI elements
  - **MOLECULE_GENERATION**: For composed components
  - **MIXED_GENERATION**: Combines both approaches
- Maintains debug logging for transparency

#### 4. **Component Generators**
Specialized generators for different component types:

- **Atom Generator** (`generators/atom-generator.js`): Creates basic UI elements (buttons, inputs, badges)
- **Molecule Generator** (`generators/molecule-generator.js`): Builds composed components using existing atoms
- **Generation Common** (`generators/generation-common.js`): Shared utilities for code generation

#### 5. **Audit Engine** (`audit-engine.js`)
Quality assurance system for generated components:
- TypeScript validation using ts-morph
- Component structure analysis
- Optional AI-powered code review
- Overlap detection between components

### Supporting Systems

#### Figma Integration (`utils/figma-utils.js`)
- Parses Figma URLs to extract file keys and node IDs
- Fetches screenshots via Figma API
- Retrieves node data for precise measurements
- Handles various Figma URL formats

#### Library Management
- **Library Documentation** (`utils/library-doc.js`): Maintains component library documentation
- **Dependency Registry** (`utils/dependency-registry.js`): Tracks atom-molecule relationships
- **Atom Context** (`utils/atom-context.js`): Manages atom component context

#### OpenAI Integration (`utils/openai-utils.js`)
- Manages OpenAI API interactions
- Handles prompt engineering
- Provides token optimization

## Data Flow Architecture

### Input Processing
1. **Figma URL Input**: URL → Parse → Fetch Screenshot → Fetch Node Data
2. **Local Screenshot**: Direct file path processing

### Analysis Phase
1. Visual analysis using GPT-4 Vision
2. Component identification and classification
3. Variant detection and relationship mapping

### Generation Phase
1. AI router determines strategy based on complexity
2. Appropriate generator creates TypeScript React code
3. Components use Tailwind CSS for styling
4. TypeScript interfaces ensure type safety

### Output Structure
```
nextjs-app/ui/
├── elements/      # Atomic components (Button, Input, Badge)
├── components/    # Molecular components (SearchForm, LoginCard)
└── modules/       # Complex organisms (Dashboard, Navigation)
```

## Technology Stack

### Core Technologies
- **Node.js v18+**: Runtime environment (ES modules)
- **TypeScript**: Type-safe component generation
- **React**: Target framework for generated components
- **Tailwind CSS**: Utility-first CSS framework

### AI/ML Tools
- **OpenAI GPT-4 Vision**: Visual analysis and component identification
- **OpenAI GPT-4**: Code generation and routing decisions
- **Custom prompts**: Specialized for UI component generation

### Development Tools
- **ts-morph**: TypeScript AST manipulation and validation
- **dotenv**: Environment configuration
- **node-fetch**: HTTP requests for API interactions

## Processing Methods

### Visual-First Approach
The system prioritizes visual analysis over structural data:
1. Screenshots provide the primary source of truth
2. AI vision models identify components visually
3. Figma node data supplements with precise measurements
4. Visual patterns drive component generation

### Intelligent Component Classification
Components are classified using atomic design principles:
- **Atoms**: Basic UI elements (buttons, inputs, labels)
- **Molecules**: Composed components using atoms
- **Organisms**: Complex layouts and modules

### Deduplication & Dependency Management
- Prevents regeneration of existing components
- Tracks atom usage in molecules
- Maintains component relationships
- Updates registry on each generation run

## Installation & Setup

```bash
# Clone repository
git clone <repository-url>
cd figma-processor

# Install dependencies
npm install

# Configure environment
export OPENAI_API_KEY="your-openai-api-key"
export FIGMA_ACCESS_TOKEN="your-figma-token" # Optional
```

## Usage

### CLI Commands

```bash
# Test with included design system
node design-processor.js test

# Process Figma design
node design-processor.js process "https://figma.com/design/FILE_KEY?node-id=NODE_ID"

# Process local screenshot
node design-processor.js process ./path/to/screenshot.png
```

### Programmatic Usage

```javascript
import { processDesignToCode } from './design-processor.js';

const result = await processDesignToCode(input, {
  projectType: 'design-system',
  enableAudit: true,
  auditConfig: {
    enableTypeScriptValidation: true,
    enableStructureAnalysis: true,
    enableAIAnalysis: false
  }
});
```

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: Required for AI processing
- `FIGMA_ACCESS_TOKEN`: Required for Figma URL processing

### Processing Context Options
```javascript
{
  projectType: 'design-system',        // Project context
  purpose: 'Generate React components', // Generation purpose
  enableAudit: true,                   // Enable component auditing
  auditConfig: {
    enableTypeScriptValidation: true,  // Validate TypeScript
    enableStructureAnalysis: true,     // Analyze structure
    enableAIAnalysis: false,           // AI-powered review
    maxCostPerComponent: 0.50         // Cost limit per component
  }
}
```

## Data Management

### Generated Files
- `data/screenshots/`: Figma exports and processed images
- `data/reports/`: Processing session reports
- `data/analysis/`: Visual analysis cache
- `data/debug/`: Debug logs for troubleshooting

### Registry Files
- `data/library-docs.json`: Component library documentation
- `data/dependency-registry.json`: Component dependency tracking

Both registry files are automatically regenerated on each processing run to maintain consistency.

## Performance Characteristics

### Processing Times
- Visual analysis: 2-4 seconds per screenshot
- Component generation: 1-2 seconds per component
- Total pipeline: 8-15 seconds for typical design system

### Resource Usage
- Memory: ~200-500MB during processing
- API calls: 2-5 OpenAI requests per processing session
- Storage: ~10-50KB per generated component

## Error Handling

The system implements comprehensive error handling:
- Graceful API failure recovery
- Detailed error reporting
- Session state preservation
- Fallback strategies for component generation

## Extensibility

### Adding New Generators
1. Create generator in `generators/` directory
2. Implement generation interface
3. Register in AI routing system
4. Update generation strategies

### Custom Processing Steps
1. Modify `design-processor.js` pipeline
2. Add new utility functions in `utils/`
3. Update audit configurations

## Best Practices

1. **Use high-quality screenshots** for better component detection
2. **Process atomic components first** to build library foundation
3. **Enable auditing** for production-ready code
4. **Review generated code** before integration
5. **Maintain registry files** for dependency tracking

## License

MIT License - Open source for commercial and non-commercial use.

---

**Built with AI-driven visual intelligence for rapid UI development**