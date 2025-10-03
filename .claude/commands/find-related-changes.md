---
description: Find all files that might need updating based on current changes
---

Please launch a general-purpose agent to find related files that might need updates based on uncommitted changes.

The agent should:

1. **Analyze Uncommitted Changes**
   - Run `git status` and `git diff` to see what's changed
   - Extract modified functions, classes, exports, types
   - Identify new/removed dependencies

2. **Find Related Code**
   For each significant change:
   - Search for imports of modified exports
   - Find files that call changed functions
   - Locate tests for modified code
   - Identify documentation that references changed APIs

3. **Impact Analysis**
   - Which files import from changed files?
   - Are there tests that might break?
   - Is documentation outdated?
   - Are there similar patterns elsewhere that should be updated for consistency?

4. **Categorize Findings**
   - **Must Update**: Direct dependencies, breaking changes
   - **Should Update**: Tests, related functionality
   - **Consider Updating**: Documentation, similar patterns
   - **Monitor**: Files that might be affected indirectly

5. **Generate Report**
   - Change impact map (what changed → what's affected)
   - List of files to review/update
   - Suggested action items
   - Risk assessment

Return a structured impact analysis with file paths and specific line numbers where relevant.
