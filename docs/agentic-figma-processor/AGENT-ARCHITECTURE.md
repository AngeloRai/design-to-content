# Agent Architecture Specification

*Detailed specification of the specialized AI agents in the Figma processing system*

## Agent Hierarchy and Communication

### Agent Communication Flow
```
┌─────────────────┐
│  Orchestrator   │ ← Main coordinator
├─────────────────┤
│    Discovery    │ → Figma analysis
│ Element Builder │ → Simple components (Ollama)
│Component Builder│ → Complex components (Cloud AI)
│ Molecule Agent  │ → CMS integration molecules
│ Organism Agent  │ → CMS integration organisms
│  Verification   │ → Quality assurance
└─────────────────┘
```

## 🎯 Orchestrator Agent

### Core Responsibilities
- **Pipeline Management**: Coordinate entire multi-phase process
- **Agent Delegation**: Route tasks to appropriate specialized agents
- **Progress Tracking**: Monitor completion across all components
- **Error Handling**: Manage retries and recovery strategies
- **Resource Optimization**: Balance Ollama vs Cloud AI usage

### AI Model: Cloud AI (Strategic Planning Required)
**Rationale**: Needs high-level reasoning for complex coordination

### Key Methods
```typescript
class OrchestratorAgent {
  async processFigmaUrl(url: string, phase: 'atoms' | 'molecules' | 'organisms') {
    // Parse URL and determine node structure
    // Delegate to Discovery Agent for analysis
    // Create processing plan based on component inventory
    // Route components to appropriate builder agents
    // Monitor progress and handle failures
    // Generate completion report
  }

  async handleAgentFailure(agent: string, component: string, error: Error) {
    // Log failure with context
    // Determine retry strategy
    // Re-queue component if retryable
    // Escalate if critical failure
  }

  async generateProgressReport(): ProgressReport {
    // Aggregate status from all agents
    // Calculate completion percentages
    // Estimate remaining time
    // Identify bottlenecks
  }
}
```

### Decision Logic
- **Component Classification**: Route to appropriate builder based on complexity
- **AI Model Selection**: Choose Ollama vs Cloud AI based on task requirements
- **Retry Strategy**: Determine when to retry failed components
- **Phase Progression**: Coordinate movement between atoms → molecules → organisms

## 🔍 Discovery Agent

### Core Responsibilities
- **Figma Analysis**: Extract complete node structure and metadata
- **Component Classification**: Identify simple vs complex elements
- **Inventory Generation**: Create comprehensive component lists
- **Reference Capture**: Take screenshots for visual verification
- **Gap Detection**: Ensure no components are overlooked

### AI Model: Cloud AI (Visual Analysis Required)
**Rationale**: Needs advanced visual understanding for accurate classification

### Key Methods
```typescript
class DiscoveryAgent {
  async analyzeFigmaNode(nodeId: string): ComponentInventory {
    // Use Figma MCP tools to extract metadata
    // Classify each component by complexity
    // Generate complete inventory with status tracking
    // Capture reference screenshots
    // Validate completeness of discovery
  }

  async classifyComponent(component: FigmaComponent): ComponentClassification {
    // Analyze visual complexity
    // Determine processing strategy needed
    // Identify variant requirements
    // Assess CMS integration needs (for molecules/organisms)
  }

  async validateInventoryCompleteness(inventory: ComponentInventory): ValidationResult {
    // Check for missed components
    // Verify all variants identified
    // Ensure no duplicate classifications
    // Flag potential issues
  }
}
```

### Output Formats
```typescript
interface ComponentInventory {
  phase: 'atoms' | 'molecules' | 'organisms';
  totalComponents: number;
  classification: {
    simpleElements: ComponentInfo[];  // → Element Builder (Ollama)
    complexElements: ComponentInfo[]; // → Component Builder (Cloud AI)
    molecules: ComponentInfo[];       // → Molecule Agent (Cloud AI)
    organisms: ComponentInfo[];       // → Organism Agent (Cloud AI)
  };
  referenceImages: { [componentId: string]: string };
}
```

## ⚡ Element Builder Agent

### Core Responsibilities
- **Batch Processing**: Handle multiple simple components efficiently
- **Icon Generation**: Create SVG icon components in bulk
- **Simple Elements**: Build badges, avatars, dividers, etc.
- **Pattern Application**: Use consistent templates and naming
- **Basic Verification**: Ensure components render without errors

### AI Model: Ollama (Cost-Effective for Repetitive Tasks)
**Rationale**: Simple, template-based work doesn't need expensive AI

### Key Methods
```typescript
class ElementBuilderAgent {
  async processBatch(components: ComponentInfo[]): BatchResult {
    // Process multiple simple components together
    // Apply consistent patterns and templates
    // Generate basic TypeScript interfaces
    // Create simple showcase examples
    // Perform basic functionality testing
  }

  async generateIconBatch(icons: IconInfo[]): IconBatchResult {
    // Extract SVG data from Figma
    // Generate React icon components
    // Apply consistent naming (PascalCase + Icon suffix)
    // Create icon index file for exports
    // Add to icon showcase
  }

  async createSimpleElement(component: ComponentInfo): ElementResult {
    // Extract basic measurements
    // Generate simple component with minimal variants
    // Create basic TypeScript interface
    // Add to showcase with examples
  }
}
```

### Optimization Strategies
- **Template-Based Generation**: Use proven patterns for consistency
- **Batch Processing**: Handle 20-50 components per batch
- **Minimal Complexity**: Avoid over-engineering simple components
- **Fast Iteration**: Quick processing for high-volume elements

## 🔧 Component Builder Agent

### Core Responsibilities
- **Complex Components**: Individual processing of buttons, inputs, forms
- **Variant Hierarchies**: Implement Size > Style > State correctly
- **Measurement Precision**: Extract and apply exact Figma measurements
- **Interactive States**: Add hover, focus, disabled, active states
- **TypeScript Interfaces**: Generate comprehensive prop definitions

### AI Model: Cloud AI (Precision Visual Analysis)
**Rationale**: Needs precise visual analysis and complex state management

### Key Methods
```typescript
class ComponentBuilderAgent {
  async processComplexComponent(component: ComponentInfo): ComponentResult {
    // Extract precise measurements by variant
    // Implement correct variant hierarchy (Size > Style > State)
    // Generate comprehensive TypeScript interfaces
    // Add interactive states even if not in Figma
    // Perform detailed visual verification
  }

  async extractVariantHierarchy(component: ComponentInfo): VariantHierarchy {
    // Identify size variants with distinct dimensions
    // Map style variants with clear visual differences
    // Define state variants for interaction
    // Ensure hierarchy follows atomic design principles
  }

  async generateInteractiveStates(component: ComponentInfo): StateDefinitions {
    // Add hover states with subtle feedback
    // Implement focus states with accessibility
    // Create disabled states with visual feedback
    // Define active states for buttons/inputs
  }
}
```

### Quality Focus
- **Visual Distinctness**: Ensure size variants are clearly different
- **Measurement Accuracy**: Use exact px values from Figma
- **State Completeness**: Add all necessary interactive states
- **Type Safety**: Comprehensive TypeScript interfaces

## 🏗️ Molecule Agent

### Core Responsibilities
- **CMS Integration**: Create Contentful content types for molecules
- **Type Generation**: Generate TypeScript types from CMS schema
- **Component Building**: Build molecules using atoms + CMS data
- **Migration Scripts**: Create database migration scripts
- **Integration Testing**: Test with real Contentful data

### AI Model: Cloud AI (Architectural Thinking)
**Rationale**: Needs understanding of data architecture and relationships

### Key Methods
```typescript
class MoleculeAgent {
  async processMolecule(molecule: ComponentInfo): MoleculeResult {
    // Analyze atom combinations needed
    // Design appropriate Contentful content type
    // Generate migration script
    // Create component with CMS types
    // Test with real content data
  }

  async designContentType(molecule: ComponentInfo): ContentTypeDesign {
    // Identify required content fields
    // Define field types and validations
    // Set up default values
    // Design field relationships
    // Consider content editor experience
  }

  async generateMigrationScript(contentType: ContentTypeDesign): MigrationScript {
    // Create Contentful migration script
    // Define field types and constraints
    // Set up validations and defaults
    // Handle localization if needed
    // Version control integration
  }
}
```

### CMS Integration Patterns
- **Field Mapping**: Component props → Contentful fields
- **Type Safety**: Generated types ensure prop/field matching
- **Content Validation**: Prevent invalid content entry
- **Editor Experience**: Clear, intuitive content management

## 🏛️ Organism Agent

### Core Responsibilities
- **Complex Relationships**: Handle nested component references
- **Advanced CMS**: Design complex content type relationships
- **Responsive Design**: Build layout-aware organisms
- **Advanced Migration**: Create complex migration scripts
- **Integration Testing**: Full workflow testing

### AI Model: Cloud AI (System Design Complexity)
**Rationale**: Needs advanced architectural thinking for complex systems

### Key Methods
```typescript
class OrganismAgent {
  async processOrganism(organism: ComponentInfo): OrganismResult {
    // Analyze complex component relationships
    // Design nested content type structures
    // Handle molecule/atom references
    // Build responsive organism components
    // Perform integration testing
  }

  async designComplexContentTypes(organism: ComponentInfo): ComplexContentTypeDesign {
    // Design nested content relationships
    // Handle references to molecules and atoms
    // Create flexible layout systems
    // Consider responsive design needs
    // Plan for content reusability
  }

  async handleComponentReferences(organism: ComponentInfo): ReferenceSystem {
    // Map molecule/atom dependencies
    // Create content type references
    // Handle optional vs required components
    // Design flexible composition patterns
  }
}
```

### Advanced Patterns
- **Nested References**: Organisms → Molecules → Atoms
- **Layout Systems**: Flexible, responsive organism layouts
- **Content Flexibility**: Support multiple composition patterns
- **Performance**: Efficient content fetching strategies

## 👁️ Verification Agent

### Core Responsibilities
- **Visual Verification**: Compare implementations with Figma designs
- **Screenshot Comparison**: Take and analyze Playwright screenshots
- **Quality Assurance**: Ensure all requirements met
- **Failure Analysis**: Diagnose visual discrepancies
- **Recovery Coordination**: Trigger rebuilds when needed

### AI Model: Cloud AI (Visual Comparison)
**Rationale**: Needs advanced visual analysis for accurate comparison

### Key Methods
```typescript
class VerificationAgent {
  async verifyComponent(component: ComponentInfo, implementation: string): VerificationResult {
    // Take Figma reference screenshot
    // Take implementation screenshot via Playwright
    // Compare visual differences
    // Generate detailed diff report
    // Determine if verification passed
  }

  async analyzeVisualDifferences(reference: string, implementation: string): DiffAnalysis {
    // Identify size discrepancies
    // Check color accuracy
    // Verify spacing and alignment
    // Assess typography matching
    // Flag critical vs minor issues
  }

  async generateFailureReport(component: ComponentInfo, issues: Issue[]): FailureReport {
    // Document specific visual problems
    // Suggest fixes for each issue
    // Prioritize issues by severity
    // Create actionable improvement plan
  }
}
```

### Verification Standards
- **Pixel Accuracy**: Components must match Figma exactly
- **All Variants**: Every size/style/state variant verified
- **Interactive States**: All hover/focus/disabled states working
- **Responsive Behavior**: Components work across screen sizes

## Inter-Agent Communication

### Message Passing System
```typescript
interface AgentMessage {
  from: AgentType;
  to: AgentType;
  type: 'task' | 'result' | 'error' | 'status';
  payload: any;
  timestamp: string;
  correlationId: string;
}

class AgentCommunicationBus {
  async sendMessage(message: AgentMessage): Promise<void>;
  async subscribeToMessages(agentType: AgentType, handler: MessageHandler): void;
  async broadcastStatus(status: AgentStatus): Promise<void>;
}
```

### Coordination Patterns
- **Task Delegation**: Orchestrator → Specialized Agents
- **Result Reporting**: Specialized Agents → Orchestrator
- **Status Updates**: All agents → Logging system
- **Error Escalation**: Failed agents → Orchestrator for retry logic

## Error Handling and Recovery

### Agent-Level Error Handling
```typescript
class BaseAgent {
  async handleError(error: AgentError): Promise<ErrorHandlingResult> {
    // Log error with full context
    // Determine if error is recoverable
    // Apply agent-specific recovery strategies
    // Escalate to orchestrator if needed
    // Update component status appropriately
  }

  async retryTask(task: AgentTask, maxRetries: number = 3): Promise<TaskResult> {
    // Implement exponential backoff
    // Apply task-specific retry logic
    // Track retry attempts in logs
    // Return detailed failure information if all retries fail
  }
}
```

### Recovery Strategies
- **Simple Errors**: Automatic retry with exponential backoff
- **Complex Errors**: Human intervention required, detailed error report
- **System Errors**: Full system restart with state preservation
- **Partial Failures**: Continue processing other components, queue failed items

**This agent architecture provides a robust, scalable system for processing complex Figma designs with optimal cost efficiency and quality assurance.**