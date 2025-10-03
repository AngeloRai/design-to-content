---
description: Deep code quality analysis using agent
---

Please launch a general-purpose agent to perform comprehensive code quality analysis.

The agent should autonomously:

## 1. Scan All Code Files
- Search through all JavaScript/TypeScript files in `langgraph-workflow/` directory
- Use Glob to find all `.js`, `.ts`, `.jsx`, `.tsx` files
- Read each file and analyze the code

## 2. Identify Issues

### Critical Issues (Must Fix):
- **Infinite loop risks**: Code paths without exit conditions or iteration limits
- **Null/undefined errors**: Accessing properties without null checks
- **Memory leaks**: Unclosed resources (files, connections, processes)
- **Security vulnerabilities**: Hardcoded secrets, unsafe eval, injection risks
- **Breaking changes**: API changes without proper migration path

### High Priority (Should Fix):
- **Missing error handling**: try-catch gaps, unhandled promise rejections
- **Unused code**: Dead code, unused imports/variables/functions
- **Type safety**: Missing TypeScript types, `any` usage, type assertion abuse
- **Logic errors**: Off-by-one errors, incorrect conditionals, wrong operators
- **State management**: Race conditions, missing state validation

### Medium Priority (Consider Fixing):
- **Performance issues**: Inefficient loops, unnecessary re-renders, large operations in sync code
- **Code duplication**: Repeated logic that should be abstracted
- **Best practice violations**: Not following CLAUDE.md guidelines (class-based vs functional)
- **Inconsistent patterns**: Different approaches for same problem
- **Hardcoded values**: Magic numbers, hardcoded paths that should be configurable

### Low Priority (Nice to Have):
- **Code style**: Inconsistent formatting, unclear variable names
- **Documentation**: Missing JSDoc, unclear comments
- **Console statements**: Debug logs left in production code
- **TODO/FIXME**: Unresolved technical debt markers

## 3. Perform Deep Analysis

For each file analyzed:
- Check imports: Are all imports used? Are there circular dependencies?
- Check exports: Are exported functions/classes actually used elsewhere?
- Check error boundaries: Is there proper try-catch around risky operations?
- Check LangGraph patterns: Are state fields properly passed between nodes?
- Check async handling: Are promises properly awaited? Any missing error handlers?
- Check resource cleanup: Are files/connections/processes properly closed?
- Check iteration limits: Do loops have max iteration protection?

## 4. Cross-Reference Against Project Standards

Read and verify compliance with:
- `CLAUDE.md` - Development guidelines
- `CODEBASE_BLUEPRINT.md` - Architecture patterns
- Existing code patterns in the repo

## 5. Generate Comprehensive Report

Return a structured report with:

### Executive Summary
- Total files scanned: X
- Total issues found: Y
- Critical: # | High: # | Medium: # | Low: #
- Overall code health score: (1-10)
- Recommendation: (Production Ready / Needs Attention / Critical Issues)

### Critical Issues (Top 5)
For each critical issue:
```
[CRITICAL] Issue Title
File: path/to/file.js:123
Problem: Clear description of what's wrong
Impact: What could happen if not fixed
Fix: Specific code change needed
```

### Full Issue List by File
Organized by file path, showing:
- Issue severity badge
- Line number
- Issue description
- Suggested fix
- Code snippet (if helpful)

### Recommendations
- Immediate action items (must fix before next commit)
- Short-term improvements (fix this week)
- Long-term refactoring suggestions

### Code Metrics
- Lines of code scanned
- Code duplication percentage
- Average function complexity
- Test coverage gaps identified

The agent should work autonomously using Read, Grep, Glob, and Bash tools as needed. Return the final report in markdown format with clear sections and actionable items.