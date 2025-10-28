# Visual Validation System for Pixel-Perfect Component Generation

## 🎯 Goal
Add visual validation to achieve pixel-perfect accuracy by comparing generated components against Figma designs using Playwright screenshots.

---

## 📋 Current State Analysis

### Existing Infrastructure
- [x] **Figma Analysis** extracts rich component specs:
  - Visual properties (colors, typography, spacing, borders, shadows)
  - Variants and states (hover, disabled, etc.)
  - Component metadata in `figmaAnalysis.components[]`

- [x] **Storybook Setup** (`/storybook-app`):
  - Configured with Next.js framework (@storybook/nextjs)
  - Path aliases to `@/ui` components
  - Addons: a11y, vitest, docs
  - Can generate static build (`storybook-static/`)

- [x] **Component Registry** (`agentic-system/tools/registry.js`):
  - Tracks generated components with metadata
  - Stores props, variants, dependencies
  - Available in workflow state

- [x] **Playwright** installed via MCP server
- [x] **Code Validation** working (TypeScript + ESLint)

---

## 🏗️ Architecture: Hybrid Screenshot Strategy

### Decision: Single Screenshot + Cropping (MVP) → Individual Screenshots (Production)

#### Phase 1: Single Screenshot with AI-Assisted Cropping (CURRENT IMPLEMENTATION TARGET)

**Approach:**
1. Fetch ONE screenshot of entire Figma design frame
2. AI vision model analyzes and provides bounding boxes for each component
3. Crop full screenshot during visual validation to get component regions
4. Compare cropped Figma screenshots with Playwright screenshots

**Pros:**
- ✅ One Figma API call (faster, avoids rate limits)
- ✅ Simpler initial implementation
- ✅ Works well for grid-based design system layouts
- ✅ Context preserved (spacing relationships visible)

**Cons:**
- ⚠️ Cropping accuracy depends on bounding box precision
- ⚠️ Layout changes in Figma might affect crops
- ⚠️ Less precise at component edges

#### Phase 2: Individual Component Screenshots (FUTURE UPGRADE)

**Approach:**
1. Extract individual node IDs for each component variant from Figma
2. Fetch separate screenshots in parallel (batch Figma API calls)
3. Store per-component screenshot URLs in registry
4. Direct comparison without cropping

**When to upgrade:**
- Cropping accuracy issues arise
- Figma layout is non-standard/non-grid
- Need better isolation per component
- Visual refinement requires higher precision

---

## 🔄 Complete Validation Flow

### Updated Pipeline with Visual Validation

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Figma Analysis                                           │
│    ├─ Fetch ONE screenshot of full design frame             │
│    ├─ AI vision extracts components + bounding boxes        │
│    └─ Store frame screenshot URL + bounds in registry       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Component Generation                                     │
│    └─ AI generates React components from Figma specs        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Code Validation (final-check)                            │
│    ├─ TypeScript compilation (tsc --noEmit)                 │
│    └─ ESLint quality check                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    ┌─────────────┐
                    │  Code Valid? │
                    └──────┬───────┘
                           │ YES
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Story Generation                                         │
│    └─ Auto-generate .stories.tsx from component registry    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Visual Validation                                        │
│    ├─ Build Storybook static site                           │
│    ├─ Playwright screenshots of all stories                 │
│    ├─ Crop Figma frame to component bounding boxes          │
│    ├─ Compare cropped Figma vs Playwright screenshots       │
│    └─ Calculate pixel difference ratio per component        │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    ┌────────────────┐
                    │ Visual Valid?  │
                    │ (diff < 5%)    │
                    └────┬───────────┘
                         │ NO
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Visual Refinement (Max 3 iterations)                     │
│    ├─ AI receives visual diff image + Figma specs           │
│    ├─ AI adjusts Tailwind classes to match design           │
│    └─ write_component with refined code                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Code Re-Validation (CRITICAL SAFETY STEP)                │
│    ├─ Re-run TypeScript + ESLint validation                 │
│    └─ Ensure visual changes didn't break code               │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    ┌─────────────┐
                    │  Code Valid? │
                    └──────┬───────┘
                           │ YES
                           ↓
                 Loop back to Visual Validation (Step 5)
                           ↓
                    (Repeat until visual passes OR max iterations)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Finalize                                                 │
│    └─ All components pixel-perfect + code-valid ✅           │
└─────────────────────────────────────────────────────────────┘
```

### Key Safety Loop

```
Code Validation → Visual Validation → Visual Fix → Code Validation → Visual Validation → ...
      ↑                                                    │
      └────────────────────────────────────────────────────┘
                    (Max 3 iterations)
```

**Why re-validate code after visual refinement:**
- Visual adjustments modify Tailwind classes
- Class name changes might introduce typos or syntax errors
- New utility imports might be needed
- Props might change to support new variants
- ESLint warnings could appear from formatting changes

---

## 📁 Implementation Phases

### ✅ Phase 0: Foundation (COMPLETED)
- [x] Shared validation utilities (`validation-utils.js`)
- [x] TypeScript + ESLint validation in `final-check.js`
- [x] Component registry with metadata tracking
- [x] MaxListeners fix for concurrent API calls

### ⬜ Phase 1: Enhanced Component Metadata (1-2 hours)

**Goal:** Capture visual specs from Figma for story generation

#### Tasks:
- [ ] Update `ComponentSpecSchema` in `figma-extractor.js`:
  ```javascript
  const ComponentSpecSchema = z.object({
    // ... existing fields
    boundingBox: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number()
    }).optional().describe('Component position in full frame screenshot'),
    frameScreenshotUrl: z.string().describe('URL to full Figma frame screenshot')
  });
  ```

- [ ] Update AI vision prompt to extract bounding boxes:
  ```javascript
  For each component, provide its exact position in the design:
  - x, y coordinates (top-left corner in pixels)
  - width, height in pixels
  This enables precise cropping for visual validation.
  ```

- [ ] Store Figma screenshot URL in `figmaAnalysis` state
- [ ] Extend component registry to store visual specs:
  ```javascript
  {
    name: 'Button',
    type: 'elements',
    figmaSpec: {
      variants: ['primary', 'secondary'],
      states: ['default', 'hover', 'disabled'],
      visualProperties: { colors, typography, spacing, borders, shadows },
      textContent: ['Click me', 'Submit', 'Cancel'],
      boundingBox: { x: 100, y: 200, width: 120, height: 40 },
      frameScreenshotUrl: 'https://...'
    }
  }
  ```

**Files to modify:**
- `/design-to-code-system/agentic-system/tools/figma-extractor.js`
- `/design-to-code-system/agentic-system/tools/registry.js`
- `/design-to-code-system/agentic-system/workflow/nodes/analyze.js`

---

### ⬜ Phase 2: Automated Story Generator (2-3 hours)

**Goal:** Generate Storybook stories programmatically from component registry

#### Tasks:
- [ ] Create `/design-to-code-system/agentic-system/tools/story-generator.js`:
  - Function `generateStoriesForComponent(component)`
  - Generate `.stories.tsx` file per component
  - Create stories for each variant × state combination
  - Use extracted `textContent` for realistic prop values
  - Handle different component types (Button, Input, Typography, etc.)

- [ ] Example story generation:
  ```typescript
  // Button.stories.tsx (auto-generated)
  import Button from '@/ui/elements/Button';

  export default {
    title: 'Elements/Button',
    component: Button,
  };

  export const Primary = {
    args: {
      variant: 'primary',
      children: 'Click me'
    }
  };

  export const PrimaryHover = {
    args: {
      variant: 'primary',
      children: 'Click me'
    },
    parameters: {
      pseudo: { hover: true }
    }
  };

  export const PrimaryDisabled = {
    args: {
      variant: 'primary',
      children: 'Click me',
      disabled: true
    }
  };
  // ... Secondary, Outline, etc.
  ```

- [ ] Create workflow node `/design-to-code-system/agentic-system/workflow/nodes/generate-stories.js`:
  ```javascript
  export async function generateStoriesNode(state) {
    const { registry, outputDir } = state;

    // For each component in registry
    for (const component of getAllComponents(registry)) {
      const storyFile = await generateStoriesForComponent(component);
      await writeStoryFile(storyFile, `/storybook-app/stories/${component.type}`);
    }

    return {
      ...state,
      storiesGenerated: true,
      currentPhase: 'visual_validation'
    };
  }
  ```

**Files to create:**
- `/design-to-code-system/agentic-system/tools/story-generator.js`
- `/design-to-code-system/agentic-system/workflow/nodes/generate-stories.js`

**Files to modify:**
- `/design-to-code-system/agentic-system/workflow/graph.js` (add story generation node)

---

### ⬜ Phase 3: Visual Validation Node (3-4 hours)

**Goal:** Compare Playwright screenshots with Figma designs

#### Tasks:
- [ ] Create `/design-to-code-system/agentic-system/tools/visual-comparator.js`:
  - Function `cropImage(fullImage, boundingBox)` - crop Figma screenshot
  - Function `compareImages(figmaImg, storybookImg)` - pixel comparison
  - Function `generateDiffHeatmap(img1, img2)` - visual diff image
  - Use Playwright's image comparison or `pixelmatch` library

- [ ] Create `/design-to-code-system/agentic-system/workflow/nodes/validation/visual-check.js`:
  ```javascript
  export async function visualCheckNode(state) {
    // 1. Build Storybook static
    console.log('Building Storybook...');
    execSync('npm run build-storybook', {
      cwd: storybookAppDir
    });

    // 2. Start static server
    const server = startStorybookServer('storybook-static');

    // 3. Load stories index
    const stories = JSON.parse(
      fs.readFileSync('storybook-static/index.json')
    );

    // 4. For each component story:
    const visualResults = {};
    for (const [storyId, story] of Object.entries(stories)) {
      // Navigate to story URL
      const page = await browser.newPage();
      await page.goto(`http://localhost:6006/iframe.html?id=${storyId}`);

      // Take Playwright screenshot
      const storybookScreenshot = await page.screenshot();

      // Get component from registry
      const component = findComponentByStory(story, state.registry);

      // Load + crop Figma screenshot
      const figmaFull = await loadImage(component.frameScreenshotUrl);
      const figmaCropped = cropImage(figmaFull, component.boundingBox);

      // Compare
      const comparison = await compareImages(figmaCropped, storybookScreenshot);

      visualResults[component.name] = {
        passed: comparison.diffRatio < VISUAL_DIFF_THRESHOLD,
        diffRatio: comparison.diffRatio,
        diffImagePath: comparison.diffImagePath
      };
    }

    // 5. Stop server
    server.close();

    // 6. Build failedComponents for refinement
    const failedComponents = {};
    for (const [name, result] of Object.entries(visualResults)) {
      if (!result.passed) {
        failedComponents[name] = {
          ...getComponentFromRegistry(name, state.registry),
          visualDiff: result
        };
      }
    }

    return {
      ...state,
      visualValidation: {
        passed: Object.keys(failedComponents).length === 0,
        results: visualResults,
        failedComponents
      },
      currentPhase: failedComponents.length > 0
        ? 'visual_refinement'
        : 'finalize'
    };
  }
  ```

- [ ] Configure Playwright for consistent screenshots:
  - Disable animations (`waitForLoadState('networkidle')`)
  - Fixed viewport size (match Figma frame)
  - Consistent pixel ratio

**Files to create:**
- `/design-to-code-system/agentic-system/tools/visual-comparator.js`
- `/design-to-code-system/agentic-system/workflow/nodes/validation/visual-check.js`

**Configuration:**
- Add to `.env`:
  ```
  VISUAL_VALIDATION_ENABLED=true
  VISUAL_DIFF_THRESHOLD=0.05  # 5% pixel difference allowed
  STORYBOOK_PORT=6006
  ```

---

### ⬜ Phase 4: Visual-Driven Regeneration Loop (2-3 hours)

**Goal:** AI iterates on components that fail visual validation

#### Tasks:
- [ ] Create `/design-to-code-system/agentic-system/workflow/nodes/validation/visual-refinement.js`:
  ```javascript
  export async function visualRefinementNode(state) {
    const { visualValidation, outputDir, registry } = state;
    const { failedComponents } = visualValidation;

    const refinedComponents = {};

    for (const [name, component] of Object.entries(failedComponents)) {
      const result = await refineComponentVisuals(name, component, registry);

      if (result.success) {
        // Component was updated, needs re-validation
        refinedComponents[name] = result.component;
      } else {
        // Refinement failed, keep in failed list
        refinedComponents[name] = component;
      }
    }

    // CRITICAL: After visual refinement, go back to CODE validation
    return {
      ...state,
      refinedComponents,
      currentPhase: 'final_check'  // Re-run TypeScript + ESLint
    };
  }

  async function refineComponentVisuals(name, component, registry) {
    const model = getChatModel('gpt-4o');
    const toolExecutor = createToolExecutor(null, registry, outputDir);

    const prompt = `
  Visual validation failed for ${name} component.

  **Pixel Difference:** ${component.visualDiff.diffRatio * 100}%
  **Visual Diff Image:** ${component.visualDiff.diffImagePath}

  **Figma Spec:**
  - Colors: ${component.figmaSpec.visualProperties.colors}
  - Typography: ${component.figmaSpec.visualProperties.typography}
  - Spacing: ${component.figmaSpec.visualProperties.spacing}
  - Borders: ${component.figmaSpec.visualProperties.borders}
  - Shadows: ${component.figmaSpec.visualProperties.shadows}

  **Current Implementation:**
  [Read the component file to see current code]

  **Task:**
  Adjust the Tailwind CSS classes to match the Figma design EXACTLY.
  Focus on:
  1. Colors (bg-, text-, border-)
  2. Spacing (p-, m-, gap-)
  3. Typography (font-, text-, leading-)
  4. Borders (rounded-, border-)
  5. Shadows (shadow-)

  Use write_component to update with the refined code.
  `;

    // Run AI agent loop (similar to typescript-fix.js)
    // ...
  }
  ```

- [ ] Create `/design-to-code-system/agentic-system/workflow/prompts/visual-refinement-prompt.js`:
  - Structured prompt for visual refinement
  - Include Figma specs
  - Reference visual diff image
  - Guide AI to adjust Tailwind classes

- [ ] Update validation subgraph in `/design-to-code-system/agentic-system/workflow/nodes/validate.js`:
  ```javascript
  // Add visual validation to the loop
  const ValidationState = Annotation.Root({
    // ... existing fields
    visualValidation: Annotation({
      default: () => null
    }),
    visualRefinementAttempts: Annotation({
      default: () => 0
    })
  });

  // Visual validation flow
  validationGraph.addNode('visual_check', visualCheckNode);
  validationGraph.addNode('visual_refinement', visualRefinementNode);

  // After final_check passes, run visual_check
  validationGraph.addConditionalEdges(
    'final_check',
    (state) => state.finalCheckPassed ? 'visual_check' : 'decide_next'
  );

  // After visual_check, either refine or finalize
  validationGraph.addConditionalEdges(
    'visual_check',
    (state) => {
      if (state.visualValidation.passed) {
        return 'finalize';  // All done!
      }
      if (state.visualRefinementAttempts >= 3) {
        return 'finalize';  // Max attempts reached
      }
      return 'visual_refinement';
    }
  );

  // After visual_refinement, go back to final_check (code validation)
  validationGraph.addEdge('visual_refinement', 'final_check');
  ```

**Files to create:**
- `/design-to-code-system/agentic-system/workflow/nodes/validation/visual-refinement.js`
- `/design-to-code-system/agentic-system/workflow/prompts/visual-refinement-prompt.js`

**Files to modify:**
- `/design-to-code-system/agentic-system/workflow/nodes/validate.js` (add visual validation to subgraph)

---

### ⬜ Phase 5: Integration & Testing (1-2 hours)

**Goal:** Wire everything together and test end-to-end

#### Tasks:
- [ ] Update main workflow graph (`/design-to-code-system/agentic-system/workflow/graph.js`):
  ```javascript
  // After generate node, add story generation
  graph.addNode('generate_stories', generateStoriesNode);
  graph.addEdge('generate', 'generate_stories');
  graph.addEdge('generate_stories', 'validate');

  // Visual validation is now part of the validation subgraph
  // (already handled in Phase 4)
  ```

- [ ] Add visual validation toggle in config
- [ ] Create test script to validate one component end-to-end
- [ ] Test with Button component (has multiple variants)
- [ ] Verify iteration loop works correctly
- [ ] Document any edge cases discovered

**Test Checklist:**
- [ ] Story generation creates correct files
- [ ] Storybook builds successfully
- [ ] Playwright screenshots are captured
- [ ] Figma screenshot cropping is accurate
- [ ] Visual comparison produces valid diff ratios
- [ ] Visual refinement improves components
- [ ] Code re-validation catches errors
- [ ] Max iterations prevent infinite loops
- [ ] Final components are pixel-perfect

---

## 📊 Data Structures

### Enhanced Component Registry
```javascript
{
  name: 'Button',
  type: 'elements',
  path: 'ui/elements/Button.tsx',
  description: 'Interactive button component',
  props: ['variant', 'disabled', 'children'],
  hasVariants: true,
  isInteractive: true,

  // NEW: Visual validation metadata
  figmaSpec: {
    atomicLevel: 'atom',
    variants: ['primary', 'secondary', 'outline', 'ghost'],
    states: ['default', 'hover', 'disabled', 'focus'],
    visualProperties: {
      colors: 'bg-blue-600 text-white, bg-gray-500 text-white',
      typography: 'font-inter font-semibold text-base',
      spacing: 'px-6 py-3',
      borders: 'rounded-md',
      shadows: 'shadow-sm hover:shadow-md'
    },
    textContent: ['Click me', 'Submit', 'Cancel', 'Save'],
    boundingBox: {
      x: 100,
      y: 200,
      width: 120,
      height: 40
    },
    frameScreenshotUrl: 'https://s3-alpha.figma.com/img/...'
  },

  // NEW: Visual validation results
  visualValidation: {
    lastChecked: 1234567890,
    passed: true,
    diffRatio: 0.02,
    diffImagePath: 'visual-diffs/Button-primary-default.png'
  }
}
```

### Visual Validation State
```javascript
{
  visualValidation: {
    passed: false,  // Overall pass/fail
    results: {
      'Button': {
        passed: false,
        diffRatio: 0.15,  // 15% pixel difference
        diffImagePath: 'visual-diffs/Button.png'
      },
      'Input': {
        passed: true,
        diffRatio: 0.01
      }
    },
    failedComponents: {
      'Button': {
        // Full component object + visual diff data
      }
    }
  },
  visualRefinementAttempts: 2
}
```

---

## 🛠️ Technical Stack

- **Image Processing:** Sharp or Jimp (for cropping)
- **Visual Comparison:** Playwright's `toHaveScreenshot()` or `pixelmatch`
- **Screenshot Storage:** Local filesystem initially, S3 for production
- **Story Generation:** Template-based with component metadata
- **Browser Automation:** Playwright (already installed)

---

## 🎯 Success Criteria

✅ Automated story generation from component registry
✅ Visual validation detects >95% of styling differences
✅ AI successfully iterates on visual feedback within 3 attempts
✅ Zero manual story writing required
✅ Code re-validation catches regressions after visual fixes
✅ System works for atoms, molecules, and organisms
✅ Pixel difference < 5% threshold for "passing"
✅ Visual diff heatmaps help AI understand mismatches
✅ Complete end-to-end flow from Figma → pixel-perfect components

---

## ⚠️ Edge Cases & Considerations

### Cropping Accuracy
- **Issue:** Bounding boxes might not be pixel-perfect
- **Mitigation:** Add padding buffer (e.g., +10px on all sides) to crops
- **Future:** Upgrade to individual component screenshots

### Viewport Size Consistency
- **Issue:** Storybook viewport must match Figma dimensions
- **Solution:** Extract Figma frame dimensions during analysis
- **Implementation:** Set Playwright viewport to match Figma

### Component State Rendering
- **Issue:** Hover/focus states are pseudo-states
- **Solution:** Use CSS overrides or Storybook pseudo-states addon
- **Alternative:** Screenshot interaction states separately

### Text Content Variations
- **Issue:** Different text lengths affect layout
- **Solution:** Use actual text from Figma `textContent` array
- **Benefit:** More realistic visual testing

### Dark Mode / Themes
- **Issue:** Figma might have light + dark mode variants
- **Future:** Support theme switching in stories
- **Current:** Start with default/light theme only

### Dynamic Components
- **Issue:** Components with animations or transitions
- **Solution:** Disable animations in Playwright (`waitForLoadState`)
- **Config:** Add CSS to override transitions

---

## 📝 Notes

- Visual validation is **non-blocking** initially - components can finalize even if visual check fails
- Enable strict mode (`VISUAL_VALIDATION_STRICT=true`) once system is stable
- Visual diff images stored in `/design-to-code-system/visual-diffs/`
- Diff images should NOT be committed to git (add to `.gitignore`)
- Story files CAN be committed (useful for documentation)

---

## 🔄 Iteration Strategy

**Visual Refinement Loop (Max 3 Iterations):**

```
Iteration 1:
  Visual Diff: 15% → AI adjusts colors/spacing
  Code Re-check: ✅ Valid
  Visual Re-check: 8%

Iteration 2:
  Visual Diff: 8% → AI adjusts borders/shadows
  Code Re-check: ✅ Valid
  Visual Re-check: 4%

Iteration 3:
  Visual Diff: 4% → ✅ PASSED (< 5% threshold)
  Done!
```

If still >5% after 3 iterations:
- Log warning
- Mark component for manual review
- Continue with other components

---

## ⏱️ Estimated Timeline

| Phase | Time | Complexity |
|-------|------|------------|
| Phase 1: Enhanced Metadata | 1-2 hours | Low |
| Phase 2: Story Generator | 2-3 hours | Medium |
| Phase 3: Visual Validation | 3-4 hours | High |
| Phase 4: Refinement Loop | 2-3 hours | Medium |
| Phase 5: Integration & Testing | 1-2 hours | Medium |
| **Total** | **9-14 hours** | **1-2 days** |

---

## 🚀 Getting Started

1. **Enable visual validation:**
   ```bash
   echo "VISUAL_VALIDATION_ENABLED=true" >> .env
   echo "VISUAL_DIFF_THRESHOLD=0.05" >> .env
   ```

2. **Install dependencies:**
   ```bash
   cd storybook-app
   npm install sharp pixelmatch  # Image processing libraries
   ```

3. **Start with Phase 1:**
   - Begin with enhanced component metadata
   - Update Figma extractor to provide bounding boxes
   - Test with one component before scaling

4. **Iterative development:**
   - Build Phase 1, test thoroughly
   - Move to Phase 2 only when Phase 1 is solid
   - Each phase should be independently functional

---

*Last Updated: 2025-10-27*
*Status: Planning → Implementation*
