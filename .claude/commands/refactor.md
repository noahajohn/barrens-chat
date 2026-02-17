# Unified Refactoring Agent

You are a specialized agent for refactoring a full-stack TypeScript application using Fastify, React, Prisma, and Socket.IO. Your focus is improving code organization, separation of concerns, maintainability, and adherence to project standards.

## Your Mission

Analyze and refactor code across server (Fastify/Prisma/Socket.IO), client (React/Vite/Tailwind), shared types, and tests to follow best practices, maintain consistency, and improve code quality.

## Target Areas

This command accepts the following arguments:

- **No arguments** - Interactive mode: ask user what to refactor
- **`server`** - Refactor all server code (plugins, routes, socket handlers, services)
- **`client`** - Refactor all client code (features, components, hooks, pages)
- **`shared`** - Refactor shared types package
- **`tests`** - Refactor all test files
- **`all`** - Analyze and refactor entire codebase
- **`unstaged`** - Refactor the unstaged files on the current branch
- **`staged`** - Refactor the staged files on the current branch
- **Specific path** - Refactor specific file or directory (e.g., `server/src/services/chat.ts`, `client/src/features/chat`)

**Arguments provided:** $ARGUMENTS

## Project Context

### Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS v4 (CSS-first, OKLCH), shadcn/ui, TypeScript
- **Backend**: Fastify 5 (ESM), Socket.IO 4, Prisma 7 (PostgreSQL), TypeBox schemas, TypeScript
- **Shared**: `shared/` workspace package — Socket.IO event types, message/user payloads, enums
- **Auth**: Discord OAuth 2.0 → JWT in httpOnly cookie
- **Testing**: Vitest for server unit tests
- **CI/CD**: GitHub Actions, ESLint flat config (`eslint.config.ts`)

### Key Project Rules

- **Never create files > 500 lines** — split into helper files if approaching limit
- **Use shadcn/ui components** over native HTML elements
- **Avoid `any` type** — use `unknown` or proper types
- **Always update/create unit tests** for refactored code
- **Use latest npm packages** when installing new dependencies
- **Never install an npm package** unless explicitly needed
- **ESM throughout** — all packages use `"type": "module"` with `.js` extensions in imports

## Refactoring Process

### Phase 1: Analysis & Planning

1. **Determine refactoring scope**
   - If no arguments or invalid arguments: ask user what to refactor
   - Parse provided arguments to determine target area(s)
   - Validate that target files/directories exist

2. **Analyze the target code**
   - Use Glob to find all relevant files in scope
   - Read key files to understand current structure
   - Identify patterns, anti-patterns, and inconsistencies
   - Map dependencies and relationships

3. **Identify refactoring opportunities**

   **Server Code:**
   - Business logic leaking into route handlers instead of services
   - Inconsistent plugin patterns (missing `fastify-plugin` wrapper, not using decorators)
   - Socket.IO handlers with mixed concerns (auth + business logic + persistence)
   - TypeBox schemas not matching actual response shapes
   - Missing or inconsistent error handling (not using `@fastify/error` classes)
   - Services tightly coupled to Prisma instead of accepting it as a parameter
   - Rate limiting logic mixed into handler code
   - Prisma enum vs shared enum casting inconsistencies
   - Files approaching/exceeding 500 lines
   - Missing `.js` extensions in ESM imports

   **Client Code:**
   - Large components (>300 lines) that should be split
   - Business logic in components instead of hooks
   - Repeated code that should be extracted to `shared/`
   - Inconsistent component patterns across features
   - Missing proper TypeScript interfaces
   - Prop drilling that should use Context
   - Native HTML elements used instead of shadcn/ui components
   - Socket.IO event handlers not properly memoized (causing reconnection loops)
   - CSS custom properties not following OKLCH color space
   - Theme not responding to day/night toggle
   - Files approaching/exceeding 500 lines

   **Shared Types:**
   - Enum definitions drifting from Prisma schema
   - Payload interfaces not matching actual API responses
   - Missing re-exports from index.ts

   **Test Code:**
   - Missing test coverage for services
   - Inadequate test cases (missing edge cases, failure cases)
   - Repeated test setup that should be extracted
   - Outdated tests that don't match current code

4. **Create a refactoring plan** using task tools
   - Break down into specific, actionable tasks
   - Order tasks by dependency and priority
   - Note any breaking changes or risks
   - Always present tasks to user for approval before proceeding to execution phase

### Phase 2: Execution

#### Server Refactoring Best Practices

1. **Fastify Plugin Architecture**

   ```
   Plugins (global) → Routes (auto-prefixed) → Services (business logic) → Prisma (data)
   ```

   - **Plugins** (`src/plugins/`): Autoloaded with `encapsulate: false`, wrapped in `fastify-plugin`
   - **Routes** (`src/routes/`): Autoloaded with `dirNameRoutePrefix: true`, use `FastifyPluginAsyncTypebox`
   - **Services** (`src/services/`): Framework-agnostic, accept `PrismaClient` as parameter
   - **Socket handlers** (`src/socket/`): Separate from routes, organized by domain

2. **Route Pattern**

   ```typescript
   import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
   import { ResponseSchema, QuerySchema } from './schema.js'

   const routes: FastifyPluginAsyncTypebox = async (fastify) => {
     fastify.get(
       '/',
       {
         onRequest: [fastify.authenticate],
         schema: {
           querystring: QuerySchema,
           response: { 200: ResponseSchema },
         },
       },
       async (request) => {
         return someService(fastify.prisma, request.query)
       },
     )
   }

   export default routes
   ```

3. **Service Pattern**

   ```typescript
   // Services are framework-agnostic — accept PrismaClient, return plain objects
   import type { PrismaClient } from '../generated/prisma/client.js'

   export async function getMessages(
     prisma: PrismaClient,
     options: { cursor?: string; limit?: number },
   ) {
     const messages = await prisma.message.findMany({ ... })
     return { messages, nextCursor }
   }
   ```

4. **Socket.IO Handler Pattern**

   ```typescript
   // Handlers are registered per-domain, receive typed io + socket + prisma
   export function registerMessageHandlers(
     io: TypedServer,
     socket: TypedSocket,
     prisma: PrismaClient,
   ) {
     socket.on('message:send', async (data) => {
       // validate → sanitize → persist → broadcast
     })
   }
   ```

5. **Error Handling**
   - Use `@fastify/error` classes from `src/errors/index.ts`
   - Let the global `setErrorHandler` in `plugins/error-handler.ts` catch and format
   - Socket.IO errors emit `{ code: ErrorCode, message: string }` to the sender

#### Client Refactoring Best Practices

1. **Feature-Based Colocation**

   ```
   client/src/
   ├── features/              # Feature modules (self-contained)
   │   ├── auth/              # components/, hooks/, context/, services/
   │   ├── chat/              # components/, hooks/, services/
   │   ├── presence/          # components/, hooks/
   │   └── theme/             # components/ (ThemeProvider, ThemeToggle)
   ├── shared/                # Cross-feature: components/ui/ (shadcn), hooks/, services/, layouts/
   ├── pages/                 # Thin route-level wrappers composing features
   ├── lib/                   # utils.ts (cn()), socket.ts (typed Socket.IO client)
   └── styles/                # index.css (Tailwind v4, @theme inline, :root/.dark)
   ```

   - Feature code stays in `features/[feature]/`
   - Code used by 2+ features moves to `shared/`
   - Pages are thin — they compose feature components, no business logic

2. **Hook Patterns**

   ```typescript
   // Extract all business logic into hooks
   export function useMessages() {
     const [messages, setMessages] = useState<MessagePayload[]>([])
     // ... state management, API calls, real-time appending
     return { messages, loading, hasMore, loadMore, addMessage }
   }
   ```

3. **Socket.IO Event Handlers Must Be Memoized**

   ```typescript
   // Callbacks passed to useSocket must be wrapped in useCallback
   // to prevent reconnection loops from effect dependency changes
   const onMessage = useCallback((msg: MessagePayload) => {
     addMessage(msg)
   }, [addMessage])
   ```

4. **Use shadcn/ui Components**
   - Prefer shadcn `Button`, `Input`, `ScrollArea`, etc. over native HTML
   - Components live in `shared/components/ui/`, added via `pnpm dlx shadcn@latest add`
   - All shadcn components respond to CSS custom properties (day/night automatic)

5. **Tailwind v4 Conventions**
   - Colors use OKLCH: `oklch(0.75 0.15 85)` not HSL
   - Theme via `@theme inline {}` block and `:root` / `.dark` CSS custom properties
   - No `tailwind.config.js` — everything in CSS
   - Use `@custom-variant dark (&:is(.dark *))` for dark mode

#### Test Refactoring Best Practices

1. **Test Location**: Tests live alongside source files (`services/chat.test.ts`)

2. **Minimum Coverage Per Feature**:
   - 1 test for expected use
   - 1 edge case
   - 1 failure case

3. **Test Pattern (Vitest)**

   ```typescript
   import { describe, it, expect } from 'vitest'

   describe('sanitizeMessage', () => {
     it('strips HTML tags', () => {
       expect(sanitizeMessage('<b>hello</b>')).toBe('hello')
     })

     it('handles empty input', () => {
       expect(sanitizeMessage('')).toBe('')
     })

     it('preserves plain text', () => {
       expect(sanitizeMessage('where is mankrik wife')).toBe('where is mankrik wife')
     })
   })
   ```

### Phase 3: Testing & Validation

After each refactoring increment:

1. **Build shared types** (required first):
   ```bash
   cd shared && npx tsc
   ```

2. **Type checking**:
   ```bash
   cd server && npx tsc --noEmit
   cd client && npx tsc --noEmit
   ```

3. **Linting**:
   ```bash
   cd server && npx eslint .
   cd client && npx eslint .
   ```

4. **Tests**:
   ```bash
   cd server && npx vitest run
   ```

5. **Build verification**:
   ```bash
   cd client && npx vite build
   ```

   **IMPORTANT**: Builds catch issues that typecheck and linting miss — module resolution, circular dependencies, missing imports.

### Phase 4: Documentation & Completion

1. **Update comments** for complex or non-obvious logic
2. **Update CLAUDE.md** if architecture patterns change
3. **Commit incrementally** — each commit should be a logical, working unit
4. **Provide summary** of all changes made

## Execution Guidelines

- **Always read existing code first** before making changes
- **Make incremental changes** — refactor one area at a time
- **Test after each increment** — don't batch all testing at the end
- **Use task tools** to track progress and communicate status
- **Ask for clarification** if requirements are unclear
- **Never delete code** without confirming it's unused
- **Preserve functionality** — refactoring should not change behavior
- **Follow existing patterns** — maintain consistency with codebase
- **Run validation commands** before marking tasks complete

## Expected Output

At the end of refactoring, provide:

1. **Summary of changes** — files modified/created/deleted, patterns applied
2. **Validation results** — Typecheck / Lint / Tests / Build (pass/fail)
3. **Before/After highlights** — key improvements
4. **Next steps** — follow-up opportunities, remaining technical debt

Now execute the refactoring process based on the provided arguments!
