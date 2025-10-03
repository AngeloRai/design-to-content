---
description: Run pre-commit checks using an agent before committing
---

Please launch a general-purpose agent to perform comprehensive pre-commit checks.

The agent should:

1. **Verify Staged Changes**
   - Run `git diff --staged --name-only` to list staged files
   - Ensure only intended files are staged
   - Check for accidentally staged files (.env, credentials, node_modules, etc.)

2. **Code Quality Checks**
   For each staged file:
   - Verify syntax is valid (no parsing errors)
   - Check for console.log/debugger statements
   - Find TODO/FIXME comments added
   - Detect hardcoded secrets or API keys
   - Verify imports are used (no unused imports)
   - Check for commented-out code blocks

3. **Project-Specific Checks**
   - Verify changes follow CLAUDE.md guidelines
   - Check for functional patterns (not class-based unless necessary)
   - Ensure TypeScript files have proper types
   - Validate React components follow naming conventions (PascalCase)
   - Check utility functions use camelCase

4. **Test & Build Readiness**
   - Identify if tests need to be updated
   - Check if new exports need documentation
   - Verify dependencies in package.json if imports changed

5. **Git Best Practices**
   - Suggest appropriate commit message based on changes
   - Check if commit should be split into multiple commits
   - Verify no merge conflict markers remain
   - Check file sizes (warn if >1MB files added)

6. **Generate Report**
   - ✅ Passing checks
   - ⚠️  Warnings (non-blocking)
   - ❌ Blocking issues (must fix before commit)
   - Suggested commit message
   - Overall verdict: READY / NEEDS FIXES / NEEDS REVIEW

Return a clear pass/fail report with actionable items.
