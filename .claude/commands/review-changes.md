---
description: Review all uncommitted changes using an agent
---

Please launch a general-purpose agent to comprehensively review all uncommitted changes in the repository.

The agent should:

1. **Identify Changes**
   - Run `git status` to see all modified, added, and deleted files
   - Run `git diff` to see unstaged changes
   - Run `git diff --staged` to see staged changes

2. **Analyze Each Changed File**
   - Read the current version of each modified file
   - Understand the context and purpose of changes
   - Check for:
     - Code quality issues
     - Potential bugs or logic errors
     - Missing error handling
     - Inconsistencies with existing patterns
     - Breaking changes
     - Performance implications

3. **Review Against Project Standards**
   - Verify changes follow conventions in CLAUDE.md
   - Check if changes maintain functional patterns (not class-based)
   - Ensure proper TypeScript typing
   - Validate Tailwind CSS usage if applicable

4. **Categorize Findings**
   - **Critical Issues**: Must fix before commit (bugs, breaking changes)
   - **High Priority**: Should fix (code quality, best practices)
   - **Medium Priority**: Consider fixing (improvements, optimizations)
   - **Low Priority**: Nice to have (style, minor refactoring)

5. **Generate Summary**
   - List all changed files with brief description of changes
   - Total lines added/removed
   - Risk assessment (low/medium/high)
   - Recommendation (ready to commit / needs fixes / needs discussion)

Return a structured report with:
- Executive summary
- File-by-file analysis
- Issues categorized by severity
- Overall recommendation
- Suggested commit message (if ready to commit)

The agent should work autonomously using Read, Grep, and Bash tools as needed.
