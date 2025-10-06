# Remaining Implementation Tasks

## Status: Phases 1-3 Complete ✅

**Completed:**
- ✅ Enhanced component detection rules (Typography, Image detection)
- ✅ Extended schemas with composition and interactiveBehaviors
- ✅ Created AI-powered reusability validator

**Remaining:**
- Phase 3: Integrate reusability into generator-subgraph.js (NEXT)
- Phase 4: Enhance component-generation-prompt.js
- Phase 5: Update component update workflow
- Testing and verification

---

## Phase 3 Remaining: Integrate Reusability Validation

### File: `generator-subgraph.js`

**After line 164 (end of reviewCodeNode), add reusability check:**

```javascript
// Add reusability validation
const { validateReusability } = await import("../utils/validate-component-reusability.js");
const reusabilityCheck = await validateReusability(state.currentCode, state.libraryContext);

console.log(`    Reusability: ${(reusability.score * 100).toFixed(0)}% (${reusabilityCheck.totalIssues} issues)`);

// Merge reusability issues into review
if (!reusabilityCheck.isValid && reusabilityCheck.issues.length > 0) {
  const reusabilityIssues = reusabilityCheck.issues.map(i =>
    `[Reusability] ${i.suggestion}`
  );
  review.criticalIssues = [...(review.criticalIssues || []), ...reusabilityIssues];

  // Lower score if reusability is poor
  if (reusabilityCheck.score < 0.7) {
    review.scores.importsAndLibrary = Math.min(review.scores.importsAndLibrary, 6);
    review.averageScore = Object.values(review.scores).reduce((a, b) => a + b) / Object.keys(review.scores).length;
    review.passed = review.averageScore >= 8.0;
  }
}

return { codeReviewResult: review };
```

**In prepareRefinementFeedbackNode (after line 200), add reusability refinement:**

```javascript
const { validateReusability, buildReusabilityRefinementPrompt } = await import("../utils/validate-component-reusability.js");
const reusabilityCheck = await validateReusability(state.currentCode, state.libraryContext);

if (!reusabilityCheck.isValid) {
  const reusabilityPrompt = buildReusabilityRefinementPrompt(reusabilityCheck.issues);
  refinementFeedback.push(reusabilityPrompt);
}
```

---

## Phase 4: Enhance Generation Prompts

### File: `prompts/generation/component-generation-prompt.js`

**Add after line where component spec is described:**

```javascript
// Add library context to prompt
const availableComponents = [
  ...(libraryContext.elements || []),
  ...(libraryContext.components || []),
  ...(libraryContext.icons || [])
];

prompt += `\n\nCOMPONENT REUSABILITY (CRITICAL):\n\n`;
prompt += `Available library components: ${availableComponents.join(', ')}\n\n`;
prompt += `REQUIRED:\n`;
prompt += `✓ Import and use existing components instead of HTML elements\n`;
prompt += `✓ Use Button instead of <button>\n`;
prompt += `✓ Use Input instead of <input>\n`;
prompt += `✓ Use Image instead of <img>\n`;
prompt += `✓ Import from: @/ui/elements/, @/ui/components/, @/ui/icons/\n\n`;
prompt += `FORBIDDEN:\n`;
prompt += `✗ Creating inline <button>, <input>, <img> elements\n`;
prompt += `✗ Duplicating functionality that exists in library\n\n`;
```

**Add composition rendering:**

```javascript
if (component.variantVisualMap) {
  component.variantVisualMap.forEach(variant => {
    if (variant.composition && variant.composition.containsComponents.length > 0) {
      prompt += `\nVariant "${variant.variantName}" composition:\n`;
      prompt += `- Contains: ${variant.composition.containsComponents.join(', ')}\n`;
      prompt += `- Layout: ${variant.composition.layoutPattern || 'default'}\n`;
      prompt += `- Elements: ${variant.composition.contentElements.join(', ')}\n`;
      prompt += `Generate conditional rendering for this variant's internal structure.\n`;
    }
  });
}
```

**Add interactive behavior implementation:**

```javascript
if (component.interactiveBehaviors && component.interactiveBehaviors.length > 0) {
  prompt += `\n\nINTERACTIVE BEHAVIORS TO IMPLEMENT:\n\n`;
  component.interactiveBehaviors.forEach(behavior => {
    prompt += `Behavior: ${behavior.trigger} → ${behavior.effect}\n`;
    prompt += `Visual feedback: ${behavior.stateIndicators.join(', ')}\n`;
    prompt += `- Add proper state management (useState, useCallback)\n`;
    prompt += `- Handle ${behavior.trigger} events\n`;
    prompt += `- Implement ${behavior.effect} logic\n\n`;
  });
  prompt += `Do NOT use placeholder console.log - implement actual functionality.\n\n`;
}
```

---

## Phase 5: Component Update Workflow

### File: `generator.js` - handleComponentUpdates function

**Replace lines 94-127 with:**

```javascript
const result = await model.invoke([
  { role: "system", content: updatePrompt },
  {
    role: "user",
    content: "Generate the updated component preserving all existing functionality while adding the new requirements.",
  },
]);

// Create timestamped backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupPath = componentPath.replace(".tsx", `.backup-${timestamp}.tsx`);
await fs.writeFile(backupPath, existingCode);

// Save diff report
const diffPath = componentPath.replace(".tsx", ".diff.md");
const diffContent = `# Component Update: ${componentSpec.name}

## Timestamp
${new Date().toISOString()}

## Reason for Update
${update.reason}

## Changes Made
- Original backed up to: ${path.basename(backupPath)}
- Component updated in place: ${path.basename(componentPath)}

## What Was Added
${JSON.stringify(componentSpec, null, 2)}

## Rollback Instructions
If issues found:
1. Delete current ${path.basename(componentPath)}
2. Restore from ${path.basename(backupPath)}
3. Re-run generation with adjusted requirements

## Safety Checklist
- [ ] Existing props still work
- [ ] No breaking changes
- [ ] New features are optional
- [ ] Tests pass
- [ ] Storybook updated
`;

await fs.writeFile(diffPath, diffContent);

// Update component directly
await fs.writeFile(componentPath, result.code);

console.log(`    ✓ Component updated: ${path.basename(componentPath)}`);
console.log(`    ✓ Backup saved: ${path.basename(backupPath)}`);
console.log(`    ✓ Diff report: ${path.basename(diffPath)}`);
```

**Update logging at line 337:**

```javascript
if (toUpdate.length > 0) {
  console.log(`📝 Updating ${toUpdate.length} existing component(s)...`);
  console.log(`   Original files will be backed up with timestamp`);
  await handleComponentUpdates(toUpdate, state);
}
```

---

## Testing Checklist

After implementation:

1. Run workflow on Atoms Figma file
2. Verify Typography/Text component is detected
3. Verify Image component is detected
4. Verify Modal imports Button component
5. Verify Modal variants have different content
6. Verify Pagination generates page number buttons
7. Verify component updates create backups not .update.tsx files
8. Test with a different Figma file to ensure generic approach

---

## Files Modified Summary

1. ✅ `prompts/analysis/visual-analysis-user-prompt.js` - Enhanced detection
2. ✅ `prompts/analysis/visual-analysis-prompt.js` - Added composition/interaction
3. ✅ `schemas/component-schemas.js` - Added composition, interactiveBehaviors, ReusabilityAnalysisSchema
4. ✅ `utils/validate-component-reusability.js` - Created AI validator
5. ⏳ `nodes/generator-subgraph.js` - Integrate reusability validation
6. ⏳ `prompts/generation/component-generation-prompt.js` - Add reusability/completeness
7. ⏳ `nodes/generator.js` - Update handleComponentUpdates workflow
