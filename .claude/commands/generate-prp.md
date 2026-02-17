# Create PRP

## Feature file: $ARGUMENTS

Generate a complete PRP for general feature implementation with thorough research. Ensure context is passed to the AI agent to enable self-validation and iterative refinement. Read the feature file first to understand what needs to be created, how the examples provided help, and any other considerations.

The AI agent only gets the context you are appending to the PRP and training data. Assume the AI agent has access to the codebase and the same knowledge cutoff as you, so its important that your research findings are included or referenced in the PRP. The Agent has Websearch capabilities, so pass urls to documentation and examples.

## Research Process

1. **Codebase Analysis**
   - Search for similar features/patterns in the codebase
   - Identify files to reference in PRP
   - Note existing conventions to follow (see CLAUDE.md)
   - Check test patterns for validation approach
   - Review existing services, routes, socket handlers, and hooks for patterns to mirror

2. **External Research**
   - Search for similar features/patterns online
   - Library documentation (include specific URLs)
   - Implementation examples (GitHub/StackOverflow/blogs)
   - Best practices and common pitfalls

3. **User Clarification** (if needed)
   - Specific patterns to mirror and where to find them?
   - Integration requirements and where to find them?

## PRP Generation

Using PRPs/templates/prp_base.md as template:

### Critical Context to Include and pass to the AI agent as part of the PRP

- **Documentation**: URLs with specific sections
- **Code Examples**: Real snippets from codebase
- **Gotchas**: Library quirks, version issues (especially Prisma 7, Fastify 5, Tailwind v4)
- **Patterns**: Existing approaches to follow (service pattern, route pattern, hook pattern, socket handler pattern)
- **Source control**: Make sure PRP includes instructions to create a feature branch (off of main, eg: feature/name-of-new-feature), and instructions to commit changes after each major implementation step. Each commit should include a detailed commit message.

### Implementation Blueprint

- Start with pseudocode showing approach
- Reference real files for patterns:
  - Server services: `server/src/services/chat.ts`
  - Server routes: `server/src/routes/api/messages/index.ts`
  - Socket handlers: `server/src/socket/handlers/message.handler.ts`
  - Client hooks: `client/src/features/chat/hooks/useMessages.ts`
  - Client components: `client/src/features/chat/components/ChatLog.tsx`
  - Shared types: `shared/types/socket-events.ts`
- Include error handling strategy (@fastify/error classes, ApiError on client)
- List tasks to be completed to fulfill the PRP in the order they should be completed

### Validation Gates

- Shared types build: `cd shared && npx tsc`
- Server type-check: `cd server && npx tsc --noEmit`
- Client type-check: `cd client && npx tsc --noEmit`
- Server lint: `cd server && npx eslint .`
- Client lint: `cd client && npx eslint .`
- Unit tests: `cd server && npx vitest run`
- Client build: `cd client && npx vite build`

**_ CRITICAL AFTER YOU ARE DONE RESEARCHING AND EXPLORING THE CODEBASE BEFORE YOU START WRITING THE PRP _**

**_ ULTRATHINK ABOUT THE PRP AND PLAN YOUR APPROACH THEN START WRITING THE PRP _**

## Output

Save as: `PRPs/{feature-name}.md`

## Quality Checklist

- [ ] All necessary context included
- [ ] Validation gates are executable by AI
- [ ] References existing patterns (services, routes, hooks, socket handlers)
- [ ] Clear implementation path with ordered tasks
- [ ] Error handling documented
- [ ] Prisma 7, Fastify 5, Tailwind v4 gotchas addressed
- [ ] ESM import conventions noted (.js extensions)
- [ ] Socket.IO event handler memoization noted if applicable
- [ ] shadcn/ui component usage specified where relevant

Score the PRP on a scale of 1-10 (confidence level to succeed in one-pass implementation using claude code)

Remember: The goal is one-pass implementation success through comprehensive context.
