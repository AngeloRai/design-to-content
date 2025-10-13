# Simplified Agentic System: 3-Phase Plan

## Philosophy: Keep It Simple

- Minimum files needed
- No over-engineering
- Manual testing > automated initially
- One agent that does everything
- Static patterns document (no dynamic extraction)
- Build only what we need

---

## File Structure: 8 Files Total

```
design-to-code-system/
└── agentic-system/
    ├── SIMPLE_PLAN.md                  [This document]
    ├── REFERENCE_PATTERNS.md           [Human-curated, static]
    ├── registry.js                     [Simple registry operations]
    ├── vector-search.js               [Semantic search only]
    ├── context.js                      [Plain context object]
    ├── agent.js                        [ONE agent does everything]
    ├── prompts.js                      [All prompts here]
    └── index.js                        [Entry point]
```

---

## PHASE 1: Foundation (Days 1-2)

### Goal
Create basic infrastructure: registry, patterns, context

### Files to Create

#### 1. `REFERENCE_PATTERNS.md` - analyze current ui elements in the reference folder and write a complete document with the most important patterns (claude task)
Write a complete document:
```markdown
# Component Patterns

## Imports
import React from 'react'
import { cn } from '@/lib/utils'

## TypeScript
- Interfaces extend React HTML attributes
- Optional props use ?

## Styling
- Use Tailwind only
- cn() for conditional classes
- Support className prop

## Examples
[Include 1-2 complete examples from best reference components]
```

#### 2. `registry.js`
```javascript
// Simple registry operations
export const loadRegistry = async () => { /* read JSON */ }
export const saveRegistry = async (registry) => { /* write JSON */ }
export const addComponent = (registry, component) => { /* immutable add */ }
export const findByName = (registry, name) => { /* search */ }
```

#### 3. `vector-search.js`
```javascript
// Semantic search using OpenAI embeddings
export const createVectorSearch = async (components) => {
  // Use @langchain/openai embeddings
  // Return { search(query, k) }
}
```

#### 4. `context.js`
```javascript
// Simple context object - no checkpoints, no complexity
export const createContext = (figmaUrl, outputPath) => ({
  figmaUrl,
  outputPath,
  registry: null,
  vectorSearch: null,
  patterns: null,
  history: [],
  results: []
})

export const addToHistory = (context, event) => ({
  ...context,
  history: [...context.history, { ...event, timestamp: Date.now() }]
})
```

### Testing
```bash
# Manual testing
node -e "import('./registry.js').then(r => r.loadRegistry())"
node -e "import('./vector-search.js').then(v => v.createVectorSearch([]))"
```

**✋ STOP - Verify these 4 files work before Phase 2**

---

## PHASE 2: Single Autonomous Agent (Days 3-4)

### Goal
One agent that does EVERYTHING autonomously

### Files to Create

#### 5. `prompts.js`
```javascript
// All prompts in one file - keep it simple

export const AGENT_SYSTEM_PROMPT = `
You are an autonomous code generation agent.

Goal: Generate React component from Figma design.

You decide what to do next. Available actions:
- analyze: Analyze Figma design
- generate: Create component code
- validate: Check for errors
- fix: Fix validation errors
- done: Mark complete

Make decisions based on what you discover.
Return JSON: { action: "...", reasoning: "..." }
`

export const buildDecisionPrompt = (context) => {
  // Build from context state
}

export const buildGenerationPrompt = (spec, patterns) => {
  // Build with patterns and examples
}
```

#### 6. `agent.js` - THE MAIN AGENT
```javascript
import { ChatOpenAI } from "@langchain/openai";

export const createAgent = () => {
  const model = new ChatOpenAI({ modelName: "gpt-4o" });

  // ONE AUTONOMOUS LOOP
  const run = async (context) => {
    let ctx = context;
    let maxIterations = 10;
    let iteration = 0;

    while (iteration < maxIterations) {
      // 1. Agent decides what to do
      const decision = await makeDecision(ctx, model);
      ctx = addToHistory(ctx, { decision });

      // 2. Execute decision
      switch (decision.action) {
        case 'analyze':
          ctx = await analyzeFigma(ctx);
          break;
        case 'generate':
          ctx = await generateCode(ctx, model);
          break;
        case 'validate':
          ctx = await validateCode(ctx);
          break;
        case 'fix':
          ctx = await fixErrors(ctx, model);
          break;
        case 'done':
          return ctx; // Complete!
      }

      iteration++;
    }

    return ctx;
  };

  return { run };
};

// Helper functions (all in same file, keep simple)
const makeDecision = async (context, model) => { /* AI decides */ }
const analyzeFigma = async (context) => { /* use existing tools */ }
const generateCode = async (context, model) => { /* AI generates */ }
const validateCode = async (context) => { /* use existing validators */ }
const fixErrors = async (context, model) => { /* AI fixes */ }
```

#### 7. `index.js` - Entry Point
```javascript
#!/usr/bin/env node

import { createContext } from './context.js';
import { loadRegistry } from './registry.js';
import { createVectorSearch } from './vector-search.js';
import { createAgent } from './agent.js';
import fs from 'fs-extra';

export const run = async (figmaUrl, outputPath = 'nextjs-app/ui') => {
  console.log('🤖 Starting agentic workflow...\n');

  // 1. Setup
  let context = createContext(figmaUrl, outputPath);
  context.registry = await loadRegistry();
  context.vectorSearch = await createVectorSearch(context.registry.components);
  context.patterns = await fs.readFile('agentic-system/REFERENCE_PATTERNS.md', 'utf-8');

  // 2. Run agent (autonomous!)
  const agent = createAgent();
  const result = await agent.run(context);

  // 3. Done
  console.log('\n✅ Complete!');
  console.log(`Generated: ${result.results.length} components`);

  return result;
};

// CLI
if (process.argv[2]) {
  run(process.argv[2], process.argv[3]).catch(console.error);
}
```

### Testing
```bash
# Manual test with Figma URL
node agentic-system/index.js "https://figma.com/..."

# Check:
# - Agent makes decisions
# - Code generated
# - Saved to correct location
```

**✋ STOP - Verify agent works end-to-end before Phase 3**

---

## PHASE 3: Polish & Compare (Day 5)

### Goal
Make it production-ready and compare with old system

### Steps

1. **Add better logging**
   - Log each decision clearly
   - Show progress
   - Display validation results

2. **Write README.md**
   ```markdown
   # Agentic System

   ## Usage
   node agentic-system/index.js "figma-url"

   ## How it works
   One autonomous agent decides what to do next

   ## vs LangGraph
   [Compare results]
   ```

3. **Test with 3-5 Figma designs**
   - Simple button
   - Complex card
   - Form input
   - Icon component

4. **Compare with existing system**
   - Quality: Better pattern matching?
   - Speed: Faster or comparable?
   - Errors: Fewer validation issues?

5. **Document learnings**
   - What worked well
   - What needs improvement
   - Next steps

### Success Criteria
- [ ] Agent completes full workflow
- [ ] Generated components work
- [ ] Quality equal or better than LangGraph
- [ ] Documentation clear

---

## Key Simplifications from Original Plan

### What We REMOVED (for simplicity)
- ❌ Separate specialist agents (pattern learner, fixer, etc.)
- ❌ Checkpointing system (complex, may not need)
- ❌ Message history (just use context.history)
- ❌ Automated testing (manual initially)
- ❌ Multiple phases of testing
- ❌ Pattern extraction (use static doc)
- ❌ Tool registry (just use functions)

### What We KEPT (essential)
- ✅ Autonomous agent (core feature)
- ✅ Vector search (semantic similarity)
- ✅ Static patterns doc (human-curated)
- ✅ Immutable context
- ✅ Registry for components
- ✅ Validation integration

---

## Total Effort

- **Phase 1**: 1-2 days (foundation)
- **Phase 2**: 2-3 days (main agent)
- **Phase 3**: 1 day (polish)
- **Total**: ~5 days

vs original plan: ~14 days

---

## Success Metrics (Simplified)

### Must Have
- [ ] Agent makes autonomous decisions
- [ ] Generated code compiles (TypeScript)
- [ ] Follows reference patterns
- [ ] Works in Next.js

### Nice to Have
- [ ] Fewer iterations than LangGraph
- [ ] Better quality output
- [ ] Faster execution

---

## Next Steps

1. Approve this simplified plan
2. Create `agentic-system/` directory
3. Start Phase 1 (foundation files)
4. Test manually
5. Move to Phase 2 (main agent)
6. Test end-to-end
7. Polish and compare

---

## Philosophy Reminder

**Keep it simple:**
- One file per concern
- Manual testing fine initially
- Build only what we need
- Can add complexity later if needed
- Agent autonomy is the key feature, not elaborate infrastructure

**If in doubt, ask:**
- "Do we really need this?"
- "Can it be simpler?"
- "Does this add value?"
