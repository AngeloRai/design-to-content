---
description: Review a specific commit using an agent
---

Please launch a general-purpose agent to review a specific commit.

**Commit to review**: {{COMMIT_HASH or HEAD~N}}

The agent should:

1. **Get Commit Details**
   - Run `git show {{COMMIT_HASH}}` to see the full diff
   - Extract commit message, author, date
   - Identify all changed files

2. **Analyze Changes**
   - Read each modified file in its current state
   - Understand the purpose and impact of changes
   - Check for:
     - Logic errors or bugs introduced
     - Breaking changes to APIs
     - Performance regressions
     - Security vulnerabilities
     - Missing tests for new functionality
     - Documentation updates needed

3. **Assess Commit Quality**
   - Is the commit message clear and descriptive?
   - Is the commit focused (single responsibility)?
   - Are changes properly tested?
   - Does it follow project conventions?

4. **Generate Review**
   - Summary of what the commit does
   - Code quality assessment (1-10 scale)
   - Issues found (by severity)
   - Suggestions for improvement
   - Whether this should be amended or reverted

Return a structured code review as if reviewing a pull request.
