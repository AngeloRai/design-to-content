# Design-to-Code System

**LangGraph-powered design-to-code generation system with modern AI orchestration patterns**

## 🎯 Purpose

This is an **isolated system** that implements a modern LangGraph workflow for converting Figma designs into production-ready React components. It's designed to be completely separate from the existing `figma-processor` and `nextjs-app` code, allowing for independent development, testing, and deployment.

## 📁 Directory Structure

```
design-to-code-system/
├── README.md                    # This file
├── langgraph-workflow/         # Main LangGraph workflow implementation
│   ├── index.js                # Main workflow entry point
│   ├── schemas/                # State management and data validation
│   │   └── state.js            # Modern Annotation.Root state schema
│   ├── nodes/                  # Workflow nodes with Command routing
│   │   ├── analysis.js         # Visual analysis node
│   │   ├── routing.js          # AI routing decision node
│   │   ├── generation.js       # Component generation node
│   │   └── validation.js       # Validation and audit nodes
│   └── test/                   # Test files
│       ├── state.test.js       # State schema tests
│       └── workflow.test.js    # End-to-end workflow tests
├── prompts/                    # Centralized prompt system
│   ├── analysis/               # Visual analysis prompts
│   ├── generation/             # Component generation prompts
│   ├── validation/             # Validation and audit prompts
│   └── shared/                 # Shared prompt utilities
└── docs/                       # System documentation
```

## 🚀 Key Features

### Modern LangGraph Patterns (v0.4+)
- **Annotation.Root** state management (not TypedDict)
- **Command-based routing** (eliminates conditional edges)
- **Supervisor-agent patterns** for complex orchestration
- **Multi-agent networks** for specialized validation

### Centralized Prompt System
- Extracted from proven `figma-processor` system
- Applied Anthropic prompt engineering best practices
- Reusable prompt utilities and composition functions
- Zod schema validation for AI outputs

### Type-Safe Workflow
- Complete TypeScript integration
- Zod schemas for data validation
- State validation at every step
- Comprehensive error handling

## 🧪 Testing Strategy

The system is designed for incremental testing:

```bash
# Test individual components
npm run test:state          # State schema tests
npm run test:nodes          # Individual node tests
npm run test:workflow       # Full workflow tests

# Run all tests
npm test
```

## 🔄 Workflow Phases

### Phase 0: Foundation ✅
- [x] Modern state schema with Annotation.Root
- [x] Centralized prompt system
- [x] Basic Command-based nodes
- [x] Testing infrastructure

### Phase 1: AI Integration (Next)
- [ ] GPT-4o Vision integration
- [ ] OpenAI structured outputs
- [ ] Real component generation
- [ ] Error recovery mechanisms

### Phase 2: Advanced Validation (After Phase 1)
- [ ] Multi-agent validation network
- [ ] TypeScript compilation checks
- [ ] Accessibility compliance
- [ ] Visual comparison validation

### Phase 3: Production Features (After Phase 2)
- [ ] Library management integration
- [ ] Dependency tracking
- [ ] Component overlap detection
- [ ] Production deployment

## 🔌 Integration Points

While isolated, the system connects to existing code at specific points:

- **Input**: Figma URLs and screenshots (from existing processor)
- **Output**: Components saved to `nextjs-app/ui/` structure
- **Library**: Reads existing components for context
- **Validation**: Uses existing TypeScript configuration

## 🛡️ Safety & Error Handling

- **Circuit breaker** patterns for API failures
- **Cost tracking** to prevent runaway charges
- **State validation** at every workflow step
- **Graceful degradation** with fallback strategies

## 💾 State Management

Uses modern LangGraph `Annotation.Root` pattern:

```javascript
const StateAnnotation = Annotation.Root({
  visualAnalysis: Annotation({
    default: () => null,
    description: "Structured analysis result"
  }),
  generatedComponents: Annotation({
    default: () => [],
    reducer: (existing, updates) => [...existing, ...updates],
    description: "Generated components with deduplication"
  })
  // ... more state fields
});
```

## 🎨 Component Generation

Smart categorization into Next.js UI structure:
- `elements/` - Atomic components (Button, Input, Label)
- `components/` - Molecular components (Card, Modal, Form)
- `modules/` - Organism components (Header, Footer, Layout)

## 🚦 Getting Started

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Test the state schema**:
   ```bash
   npm run test:state
   ```

3. **Run basic workflow test** (once complete):
   ```bash
   npm run test:basic
   ```

4. **Start development**:
   ```bash
   npm run dev
   ```

## 📋 Current Status

- ✅ **Isolated system structure** created
- ✅ **Dependencies and configuration** set up
- ✅ **Modern state schema** implemented and tested
- 🔄 **Command-based nodes** in development
- ⏳ **Workflow graph construction** pending
- ⏳ **End-to-end testing** pending

## 🔧 Development Guidelines

Following CLAUDE.md principles:
- **Incremental changes**: Test each component before moving forward
- **Clear separation**: Keep isolated from existing code
- **Error handling**: Comprehensive testing and validation
- **Documentation**: Keep README and tests updated

---

*This system represents the next generation of the design-to-code pipeline, built with modern LangGraph patterns for better reliability, maintainability, and extensibility.*