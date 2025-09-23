# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# AI-POWERED FIGMA PROCESSOR WORKFLOW

## Quick Reference for Figma Processing
When asked to implement components from Figma designs, use the **AI-powered agentic system**:

### 1. Interactive CLI Processing
Use the interactive CLI for systematic processing:
```bash
npm run figma:start    # Start interactive processor
npm run figma:status   # Check processing status
npm run figma:resume   # Resume interrupted processing
```

### 2. Automated System Flow
The system handles all processing automatically:
- **Discovery**: Extract Figma components using MCP tools
- **Classification**: Simple (icons) vs complex (buttons, inputs)
- **AI Selection**: GPT-3.5 for simple, GPT-4 for complex analysis
- **Generation**: Create React components with TypeScript
- **Verification**: Strict visual verification (non-blocking)
- **Integration**: Update component showcase automatically

### 3. Key Processing Features
- **Hybrid AI**: Cost-optimized model selection
- **Functional Architecture**: Pure functions, no classes
- **Comprehensive Logging**: Full progress tracking and recovery
- **Visual Standards**: Pixel-perfect Figma matching
- **Type Safety**: Auto-generated TypeScript interfaces

### 4. System Documentation
For detailed information, see:
- `/docs/agentic-figma-processor/README.md` - Complete system guide
- `/docs/agentic-figma-processor/AGENT-ARCHITECTURE.md` - AI agent specifications
- `/docs/atomic-design-principles.md` - Design system fundamentals
- `/docs/visual-standards.md` - Quality requirements

**CRITICAL**: Use the automated system instead of manual component implementation. The agentic approach ensures consistency, completeness, and quality.

---

# Development Workflow

## When to Use Todo.md Planning (Complex Tasks Only)
Use the full todo.md workflow for:
- Multi-step implementations
- Architecture changes  
- Bug investigations requiring multiple fixes
- Feature additions with multiple components
- Tasks that impact 3+ files or require coordination

For simple tasks (single file edits, configuration changes, straightforward requests), handle directly without todo overhead.

## Todo.md Workflow for Complex Tasks
1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan
4. Then, begin working on the todo items, marking them as complete as you go
5. Please every step of the way just give me a high level explanation of what changes you made
6. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information

## Code Quality Principles
- Make every task and code change as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity
- DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY
- MAKE ALL FIXES AND CODE CHANGES AS SIMPLE AS HUMANLY POSSIBLE. THEY SHOULD ONLY IMPACT NECESSARY CODE RELEVANT TO THE TASK AND NOTHING ELSE. IT SHOULD IMPACT AS LITTLE CODE AS POSSIBLE. YOUR GOAL IS TO NOT INTRODUCE ANY BUGS. IT'S ALL ABOUT SIMPLICITY
- Only create a new file if really needed - always prefer editing existing files
- Follow existing code patterns, conventions, and architecture
- Never introduce breaking changes without explicit approval

## Project Context & Architecture
- **Framework**: Next.js 15.5.0 with Turbopack
- **CMS**: Contentful with preloaded layout data for performance
- **Styling**: Tailwind CSS with custom design system
- **TypeScript**: Strict typing required
- **Build Process**: `npm run build` (includes preload + Next.js build)
- **Git Hook**: Pre-push hook runs build before allowing push

## Key Commands
- `npm run dev` - Development server with Turbopack
- `npm run build` - Production build (includes preload step)  
- `npm run preload` - Fetch and cache Contentful layout data
- `npm run lint` - ESLint checking
- `npm run contentful:types` - Generate TypeScript types from Contentful schema
- `npm run migrate` - Run single Contentful migration
- `npm run migrate:all` - Run all pending migrations
- Git push automatically runs build via pre-push hook

## Architecture Patterns
- **Server/Client Separation**: Minimize client-side components, use "use client" only when necessary
- **Preloaded Data**: Layout data cached at build time for performance via `scripts/preload-layout-data.js`
- **Component Structure**: ui/components (reusable) vs ui/modules (page-specific)
- **Type Safety**: Generated Contentful types in `lib/contentful/types/generated/`, strict TypeScript config
- **Internationalization**: Dual locale support (en-US, pt-BR) with locale-specific routing in `app/[locale]/`
- **CMS Integration**: Contentful headless CMS with auto-generated TypeScript types and content migration system

## Available MCP Tools & Testing
### Playwright Browser Tools
- `mcp__playwright__browser_navigate` - Navigate to URLs
- `mcp__playwright__browser_snapshot` - Take accessibility snapshots (better than screenshots)
- `mcp__playwright__browser_click` - Click elements
- `mcp__playwright__browser_take_screenshot` - Visual screenshots
- Use for: UI testing, mobile menu verification, responsive design checks

### IDE Integration Tools  
- `mcp__ide__getDiagnostics` - Get TypeScript/ESLint errors
- `mcp__ide__executeCode` - Run code in Jupyter kernel
- Use for: Code validation, error checking

### File & Search Tools
- Prefer `Glob` and `Grep` over bash find/grep commands
- Use `Task` tool with specialized agents for complex searches
- `Read`, `Edit`, `MultiEdit` for file operations

## Development Best Practices
### Before Making Changes
1. **Understand Context**: Read surrounding files, check imports/exports
2. **Follow Existing Patterns**: Mimic code style, use existing libraries
3. **Check Dependencies**: Look at package.json, don't assume libraries exist
4. **Verify Locale Support**: Check both en-US and pt-BR locale handling

### Testing & Verification
1. **Always test UI changes** with Playwright tools, especially mobile responsiveness
2. **Check diagnostics** with IDE tools after changes
3. **Restart dev server** if seeing cache/import issues: `kill bash_id && npm run dev`
4. **Verify builds** - pre-push hook will catch build failures

### Error Handling
- **Never ignore errors** - find root cause, no band-aids
- **Check Contentful data** - handle missing/malformed CMS content gracefully
- **Environment issues** - verify .env variables are set correctly
- **Import errors** - often cache issues, restart dev server

## File Structure Context
- `/ui/components/` - Reusable components (CTA, Testimonial, Card, etc.)
- `/ui/modules/` - Page-specific modules (Navbar, Footer, Grid, Hero variants, etc.) 
- `/ui/icons/` - SVG icon components
- `/lib/contentful/` - CMS integration with generated types, fetchers, and utilities
- `/lib/contentful/types/generated/` - Auto-generated TypeScript types from Contentful schema
- `/lib/preload/` - Build-time cached layout data from Contentful
- `/scripts/` - Build scripts, Contentful migrations, type generation, Figma automation
- `/app/[locale]/` - Next.js app directory with internationalized routing
- `/docs/` - Project documentation including Figma integration guides

## Contentful CMS Integration
- **Content Management**: Headless CMS with auto-generated TypeScript types
- **Preload System**: Layout data cached at build time in `lib/preload/layout-data.ts`
- **Migration System**: Content type migrations in `scripts/` directory with versioning
- **Type Generation**: Run `npm run contentful:types` after schema changes
- **Dual Environment**: Production (cdn.contentful.com) and Preview (preview.contentful.com)
- **Supported Locales**: en-US and pt-BR with fallback handling

## Design System Integration
- **Automated Figma Generation**: Complete tooling in `scripts/figma-automation/` 
- **Design Tokens**: CSS custom properties and Tailwind config extraction
- **Component Analysis**: Automated React component scanning and Figma frame generation
- **Token Sync**: Automated design token to Figma variable conversion

## Environment & Secrets
- Required: CONTENTFUL_SPACE_ID, CONTENTFUL_API_KEY, CONTENTFUL_MANAGEMENT_TOKEN
- Optional: CONTENTFUL_PREVIEW_API_KEY, CONTENTFUL_ENVIRONMENT (defaults to 'master')
- Never commit secrets or log sensitive data
- Use preview vs production Contentful environments appropriately

# Development Workflow

## When to Use Todo.md Planning (Complex Tasks Only)
Use the full todo.md workflow for:
- Multi-step implementations
- Architecture changes  
- Bug investigations requiring multiple fixes
- Feature additions with multiple components
- Tasks that impact 3+ files or require coordination

For simple tasks (single file edits, configuration changes, straightforward requests), handle directly without todo overhead.

## Todo.md Workflow for Complex Tasks
1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan
4. Then, begin working on the todo items, marking them as complete as you go
5. Please every step of the way just give me a high level explanation of what changes you made
6. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information

## Code Quality Principles
- Make every task and code change as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity
- DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY
- MAKE ALL FIXES AND CODE CHANGES AS SIMPLE AS HUMANLY POSSIBLE. THEY SHOULD ONLY IMPACT NECESSARY CODE RELEVANT TO THE TASK AND NOTHING ELSE. IT SHOULD IMPACT AS LITTLE CODE AS POSSIBLE. YOUR GOAL IS TO NOT INTRODUCE ANY BUGS. IT'S ALL ABOUT SIMPLICITY
- Only create a new file if really needed - always prefer editing existing files
- Follow existing code patterns, conventions, and architecture
- Never introduce breaking changes without explicit approval

## Project Context & Architecture
- **Framework**: Next.js 15.5.0 with Turbopack
- **CMS**: Contentful with preloaded layout data for performance
- **Styling**: Tailwind CSS with custom design system
- **TypeScript**: Strict typing required
- **Build Process**: `npm run build` (includes preload + Next.js build)
- **Git Hook**: Pre-push hook runs build before allowing push

## Key Commands
- `npm run dev` - Development server with Turbopack
- `npm run build` - Production build (includes preload step)  
- `npm run preload` - Fetch and cache Contentful layout data
- `npm run lint` - ESLint checking
- Git push automatically runs build via pre-push hook

## Architecture Patterns
- **Server/Client Separation**: Minimize client-side components, use "use client" only when necessary
- **Preloaded Data**: Layout data cached at build time for performance
- **Component Structure**: ui/components (reusable) vs ui/modules (page-specific)
- **Type Safety**: Generated Contentful types, strict TypeScript config

## Available MCP Tools & Testing
### Playwright Browser Tools
- `mcp__playwright__browser_navigate` - Navigate to URLs
- `mcp__playwright__browser_snapshot` - Take accessibility snapshots (better than screenshots)
- `mcp__playwright__browser_click` - Click elements
- `mcp__playwright__browser_take_screenshot` - Visual screenshots
- Use for: UI testing, mobile menu verification, responsive design checks

### IDE Integration Tools  
- `mcp__ide__getDiagnostics` - Get TypeScript/ESLint errors
- `mcp__ide__executeCode` - Run code in Jupyter kernel
- Use for: Code validation, error checking

### File & Search Tools
- Prefer `Glob` and `Grep` over bash find/grep commands
- Use `Task` tool with specialized agents for complex searches
- `Read`, `Edit`, `MultiEdit` for file operations

## Development Best Practices
### Before Making Changes
1. **Understand Context**: Read surrounding files, check imports/exports
2. **Follow Existing Patterns**: Mimic code style, use existing libraries
3. **Check Dependencies**: Look at package.json, don't assume libraries exist
4. **Verify Locale Support**: Check both en-US and pt-BR locale handling

### Testing & Verification
1. **Always test UI changes** with Playwright tools, especially mobile responsiveness
2. **Check diagnostics** with IDE tools after changes
3. **Restart dev server** if seeing cache/import issues: `kill bash_id && npm run dev`
4. **Verify builds** - pre-push hook will catch build failures

### Error Handling
- **Never ignore errors** - find root cause, no band-aids
- **Check Contentful data** - handle missing/malformed CMS content gracefully
- **Environment issues** - verify .env variables are set correctly
- **Import errors** - often cache issues, restart dev server

## File Structure Context
- `/ui/components/` - Reusable components (CTA, Testimonial, etc.)
- `/ui/modules/` - Page-specific modules (Navbar, Footer, Grid, etc.) 
- `/ui/icons/` - SVG icon components
- `/lib/contentful/` - CMS integration, types, fetchers
- `/lib/preload/` - Build-time cached data
- `/scripts/` - Build scripts, migrations, type generation
- `/app/` - Next.js app directory structure

## Environment & Secrets
- Contentful API keys in .env (already configured)
- Never commit secrets or log sensitive data
- Use preview vs production Contentful environments appropriately

## Context7 MCP
- Use Context7 to check up-to-date docs when needed or add new features using them