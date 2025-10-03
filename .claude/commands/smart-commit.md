Please launch a general-purpose agent to intelligently create commits from unstaged/staged changes.

The agent should work autonomously to:

## 1. Analyze All Changes

Run `git status -s` and `git diff` to understand:
- What files have been modified/added/deleted
- The nature of each change (feature, fix, refactor, docs, etc.)
- Logical relationships between changes

## 2. Group Related Changes

Organize changes into logical, atomic commits based on:
- **Single Responsibility**: Each commit does ONE thing
- **Functional Cohesion**: Group files that work together
- **Dependency Order**: Commit prerequisites before dependents

Common grouping patterns:
- Schema/type changes + files that use them
- New feature + tests
- Bug fix + affected files
- Refactoring changes (keep separate from features)
- Documentation updates (keep separate)
- Configuration changes (keep separate)

## 3. Create Focused Commits

For each logical group:

### Generate Commit Message
Follow conventional commits format:
```
<type>: <short description>

<optional detailed description>

<optional footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring without behavior change
- `perf`: Performance improvement
- `docs`: Documentation only
- `style`: Formatting, whitespace (no code change)
- `test`: Adding/updating tests
- `chore`: Build process, dependencies, tooling

**Message Guidelines:**
- First line: ≤50 chars, imperative mood ("add" not "added")
- Body: Explain WHAT and WHY (not HOW)
- Keep it concise and clear
- NO mentions of AI assistance or Claude

### Stage and Commit
```bash
git add <files in this group>
git commit -m "<message>"
```

## 4. Handle Edge Cases

**If too many unrelated changes:**
- Warn user that changes should be committed separately
- Still create logical groups but note the complexity

**If changes conflict:**
- Identify dependencies between files
- Order commits appropriately

**If unclear grouping:**
- Default to smaller commits rather than large ones
- Prefer safety over convenience

## 5. Generate Summary Report

After all commits created, provide:

```markdown
## Smart Commit Summary

✅ Created X commits from Y changed files

### Commits Created:

1. **feat: add AI-powered story generation**
   - Files: storybook-generator.js
   - Changes: 150 insertions, 45 deletions

2. **refactor: remove visual inspection workflow**
   - Files: generator-subgraph.js, visual-inspection.js, finalizer.js
   - Changes: 250 deletions, 30 insertions

3. **chore: update dependencies**
   - Files: package.json, package-lock.json
   - Changes: 5 insertions, 3000 insertions (lock)

### Remaining Unstaged:
- nextjs-app/ui/elements/*.tsx (20 files)
  → Recommendation: These are generated files, consider .gitignore

### Run:
git log --oneline -X  # to see all new commits
git push                # when ready to push
```

## Guidelines

- **Minimum commit size**: At least 1 meaningful change
- **Maximum commit size**: ≤15 files per commit (unless package-lock)
- **Prefer atomic commits**: Easy to revert, cherry-pick, or bisect
- **Test after each commit**: Verify nothing breaks
- **No WIP commits**: Every commit should be complete

Return the summary report and list all commits created.
