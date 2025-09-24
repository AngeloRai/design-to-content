# Development Guidelines for Claude in VSCode
 
## Planning & Analysis
1. **Analyze First**: Read and understand the existing codebase structure, dependencies, and patterns before proposing changes, use CODEBASE_BLUEPRINT.md as the blueprint
2. **Document Plan For more complex tasks**: Write a detailed plan to `tasks/todo.md` with:
   - Current state analysis
   - Proposed changes with rationale
   - Potential risks/impacts
   - Step-by-step implementation tasks
3. **Get Approval**: Present the plan and wait for verification before proceeding
 
## Implementation Principles
4. **Incremental Changes**: Make one small, testable change at a time. Each change should:
   - Be independently verifiable
   - Not break existing functionality
   - Impact the minimum code necessary
5. **Code Quality Standards**:
   - Follow existing code patterns and conventions
   - Write self-documenting code with clear variable/function names
   - Add comments only for complex logic
   - Ensure proper error handling
6. **Testing Mindset**:
   - Test each change immediately after implementation
   - Verify edge cases and error conditions
   - Check for unintended side effects
 
## Communication
7. **Status Updates**: Provide concise updates:
   - What was changed and why
   - Any issues encountered
   - What's being worked on next
8. **Ask When Uncertain**: If multiple approaches exist or requirements are ambiguous, ask for clarification rather than assuming
 
## Problem-Solving Approach
9. **Root Cause Analysis**:
   - Investigate issues thoroughly using debugging and logging
   - Fix the underlying problem, not symptoms
   - Document the root cause and solution
10. **No Temporary Fixes**: Every solution should be production-ready and maintainable
 
## Code Organization
11. **File Management**:
    - Only create new files when logically necessary
    - Keep related code together
    - Maintain clear separation of concerns
12. **Refactoring Rules**:
    - Only refactor code directly related to the current task
    - Preserve all existing functionality
    - Keep refactoring separate from feature changes
13. **React Component Guidelines**:
    - **Prioritize Server Components**: Only add 'use client' when absolutely necessary (state, events, browser APIs)
    - Server components are preferred for better performance and SEO
    - Use proper naming: PascalCase for React components, camelCase for utilities/classes
    - Non-React files (utilities, classes, types) should use camelCase naming
 
## Documentation
14. **Update Documentation**:
    - Keep README files current
    - Document any new environment variables or configuration
    - Update API documentation for endpoint changes
15. **Code Comments**: Add comments for:
    - Complex algorithms or business logic
    - Workarounds with explanation
    - TODOs with context
 
## Review Process
16. **Self-Review Checklist**:
    - [ ] Changes match the approved plan
    - [ ] No unnecessary code modifications
    - [ ] All edge cases handled
    - [ ] Error handling in place
    - [ ] Code follows project conventions
    - [ ] Tests pass (if applicable)
17. **Final Summary**: Add to `todo.md`:
    - List of all files changed
    - Summary of modifications
    - Any follow-up tasks identified
    - Potential improvements for future
 
## VSCode-Specific
18. **Use VSCode Features**:
    - Utilize integrated terminal for testing
    - Check Problems panel for linting issues
    - Use Source Control panel to review changes
19. **File Navigation**: Use workspace search and "Go to Definition" to understand code relationships
 
## Critical Reminders
- **Simplicity is key**: The simplest solution that works is the best solution
- **Preserve stability**: Never risk breaking working code for minor improvements
- **Be thorough**: Complete investigation before implementing fixes
- **Stay focused**: Only work on the assigned task, note other issues for later