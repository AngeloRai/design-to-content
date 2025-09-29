# Phase 0: Foundation Setup

**Duration:** 1-2 hours (4 tasks, 15-20 minutes each)
**Goal:** Establish AI-centric LangGraph infrastructure
**Prerequisites:** Node.js v18+, OpenAI API key

## Overview

Phase 0 creates a simplified, AI-centric foundation using LangGraph. Focus on essentials: project setup, AI utilities, basic state management, and simple workflow. No complex logic - just clean orchestration for AI intelligence.

## Task Sequence

Complete these simplified tasks in order:

### [Task 0.1: Project Setup](./task-01-project-setup.md)
**Time:** 15 minutes | **Difficulty:** Easy
- Create project structure with essential folders
- Install LangGraph, OpenAI, and basic dependencies
- Configure environment variables

**Exit Criteria:** Project initialized, dependencies installed, API keys configured

---

### [Task 0.2: AI Utilities](./task-02-ai-utilities.md)
**Time:** 20 minutes | **Difficulty:** Medium
- Create simple AI wrapper functions
- Add response parsing and error handling
- Test OpenAI API connectivity

**Exit Criteria:** AI utilities work with OpenAI API, graceful error handling

---

### [Task 0.3: Modern State & Workflow](./task-03-basic-workflow.md)
**Time:** 20 minutes | **Difficulty:** Medium
- Define modern LangGraph state using Annotation.Root (0.6+)
- Create Command-based nodes for clean routing
- Build workflow graph with latest StateGraph patterns

**Exit Criteria:** LangGraph compiles and executes with mock data

---

### [Task 0.4: Verification System](./task-04-verification.md)
**Time:** 15 minutes | **Difficulty:** Easy
- Create simple test to verify setup
- Add health check command
- Document next steps

**Exit Criteria:** All verification checks pass, ready for Phase 1

---

## Quick Start

```bash
# Start with Task 0.1
cd design-to-content/tasks/phase-0/
open task-01-create-project.md

# Follow each task sequentially
# Complete acceptance criteria before moving to next task
```

## Success Metrics

By the end of Phase 0, you should have:

- ✅ Clean project structure with LangGraph 0.6+ dependencies
- ✅ AI utilities working with OpenAI API
- ✅ Modern LangGraph workflow with Annotation.Root state schema
- ✅ Command-based routing for cleaner node transitions
- ✅ Verification system confirming setup is complete
- ✅ Foundation ready for Phase 1 AI-centric development

## Verification Commands

After completing all tasks:

```bash
# Full verification
npm run verify

# Run tests
npm test

# Expected: All checks pass, ready for Phase 1
```

## Troubleshooting

### Common Issues

**Task 0.1-0.3**: Setup issues
- Check Node.js version (requires v18+)
- Verify write permissions
- Ensure API keys are available

**Task 0.4-0.5**: Schema/Checkpointing issues
- Check import syntax (ES modules)
- Verify environment variables
- Test each component individually

**Task 0.6-0.7**: Node implementation issues
- Mock implementations are intentionally simple for Phase 0
- Graph compilation errors usually indicate state schema issues
- Use `DEBUG=true` environment variable for detailed logging

**Task 0.8**: Verification failures
- Run individual components to isolate issues
- Check all previous tasks completed
- Review error messages in verification output

### Getting Help

1. **Run verification**: `npm run verify` shows detailed error info
2. **Check API keys**: Ensure OPENAI_API_KEY is properly set
3. **Test incrementally**: Each task builds on the previous one
4. **Keep it simple**: Focus on getting basics working first

## What's Next

Once Phase 0 verification passes:

1. **Celebrate! 🎉** You've built a solid LangGraph foundation
2. **Begin Phase 1**: [Achieve Parity with Current System](../phase-1/README.md)
3. **Develop confidently**: All foundation components are tested and working

## Architecture Achieved

```
project/
├── src/
│   ├── utils/           # ✅ AI utilities and helpers
│   ├── nodes/           # ✅ Basic LangGraph nodes
│   ├── state/           # ✅ Simple state schema
│   └── workflow/        # ✅ Basic graph definition
├── tests/               # ✅ Verification tests
├── data/                # ✅ Input/output storage
└── package.json         # ✅ Scripts and dependencies
```

**Phase 0 Complete → Ready for Phase 1! 🚀**