name: "Barrens Chat PRP Template v1 - Context-Rich with Validation Loops"
description: |

## Purpose

Template optimized for AI agents to implement features with sufficient context and self-validation capabilities to achieve working code through iterative refinement.

## Core Principles

1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

## Goal

[What needs to be built - be specific about the end state and desires]

## Why

- [Business value and user impact]
- [Integration with existing features]
- [Problems this solves and for whom]

## What

[User-visible behavior and technical requirements]

### Success Criteria

- [ ] [Specific measurable outcomes]

## All Needed Context

### Documentation & References (list all context needed to implement the feature)

```yaml
# MUST READ - Include these in your context window
- url: [Official API docs URL]
  why: [Specific sections/methods you'll need]

- file: [path/to/example.ts]
  why: [Pattern to follow, gotchas to avoid]

- doc: [Library documentation URL]
  section: [Specific section about common pitfalls]
  critical: [Key insight that prevents common errors]
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase

```bash
barrens-chat/
├── shared/                        # Shared TypeScript types (client + server)
│   └── types/                     # Socket events, message/user payloads, enums
├── client/                        # React frontend (Vite + shadcn/ui)
│   └── src/
│       ├── features/              # Feature modules (colocation pattern)
│       │   ├── auth/              # Login, AuthContext, useAuth
│       │   ├── chat/              # ChatLog, ChatInput, MessageLine, useSocket, useMessages
│       │   ├── presence/          # UserList, usePresence
│       │   └── theme/             # ThemeProvider, ThemeToggle (day/night)
│       ├── shared/                # Shared components (shadcn/ui), hooks, services
│       ├── pages/                 # Route-level: Chat.tsx, Login.tsx
│       ├── lib/                   # utils.ts (cn()), socket.ts (typed Socket.IO client)
│       └── styles/                # index.css (Tailwind v4, @theme inline, :root/.dark vars)
├── server/                        # Fastify backend (ESM)
│   └── src/
│       ├── plugins/               # Autoloaded, globally available (prisma, auth, cors, socketio, error-handler)
│       ├── routes/                # Autoloaded, dir-prefixed (auth/, api/messages/)
│       ├── socket/                # Socket.IO handlers (NOT autoloaded)
│       │   └── handlers/          # message.handler.ts, presence.handler.ts
│       ├── services/              # Business logic (chat, presence, npc)
│       ├── schemas/               # TypeBox schemas
│       ├── errors/                # @fastify/error custom error classes
│       ├── config/                # env.ts (TypeBox validation)
│       ├── types/                 # fastify.d.ts (declaration merging)
│       └── generated/             # Prisma client (gitignored)
└── .github/workflows/             # ci.yml, deploy.yml
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
# Fill in with new files/directories this feature will add
# Example:
# ├── server/src/services/new-feature.ts    # Business logic for feature
# ├── server/src/routes/api/new-feature/    # REST endpoints
# ├── client/src/features/new-feature/      # Feature module
# │   ├── components/                        # Feature-specific components
# │   ├── hooks/                             # Feature-specific hooks
# │   └── services/                          # Feature-specific API calls
# └── shared/types/new-feature.ts           # Shared types
```

### Known Gotchas & Library Quirks

```yaml
# Prisma 7
- No `url` in schema.prisma datasource — URL goes in prisma.config.ts
- Generator is `prisma-client` (not `prisma-client-js`), output to ../src/generated/prisma
- Prisma generates its own enums; cast with `as unknown as` when converting to shared types

# Fastify 5 + ESM
- All imports need `.js` extensions (even for .ts files)
- Plugins use @fastify/autoload with `encapsulate: false`
- Routes autoloaded with `dirNameRoutePrefix: true`
- Use FastifyPluginAsyncTypebox for typed routes

# Socket.IO
- JWT is in httpOnly cookie — read from socket.handshake.headers.cookie
- Event handlers must be memoized (useCallback) on client to prevent reconnection loops

# Tailwind v4
- CSS-first config, no tailwind.config.js
- Colors use OKLCH color space
- Theme via @theme inline {} and :root/.dark CSS custom properties

# Shared package
- Must build shared (`cd shared && npx tsc`) before server/client can import
- npm workspace dependency: "shared": "*"

# Auth
- apiFetch throws ApiError on 401 but does NOT redirect
- AuthContext handles showing the login page (prevents redirect loops)
```

## Implementation Blueprint

### Data models and schema changes

```prisma
// If adding Prisma schema changes, show them here
// model NewModel {
//   id        String   @id @default(cuid())
//   createdAt DateTime @default(now())
// }
```

### List of tasks to be completed in order

```yaml
Task 1:
  description: "[What to do]"
  files:
    - MODIFY: server/src/services/existing.ts
    - CREATE: server/src/services/new-feature.ts (MIRROR pattern from: server/src/services/chat.ts)
  notes: "[Any gotchas or important details]"

Task 2:
  description: "[What to do]"
  files:
    - CREATE: client/src/features/new-feature/hooks/useNewFeature.ts
  notes: "[Pattern to follow]"

# ... continue for all tasks
```

### Per-task pseudocode as needed

```typescript
// Task 1 pseudocode — CRITICAL details only, not full code
// PATTERN: Services accept PrismaClient, return plain objects
export async function newFeatureService(
  prisma: PrismaClient,
  options: { /* params */ },
) {
  // validate → query → transform → return
}

// PATTERN: Routes delegate to services
const routes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get('/', { schema: { /* TypeBox */ } }, async (request) => {
    return newFeatureService(fastify.prisma, request.query)
  })
}
```

### Integration Points

```yaml
SERVER:
  - Routes: server/src/routes/api/[feature]/index.ts (autoloaded, dir-prefixed)
  - Services: server/src/services/[feature].ts (framework-agnostic)
  - Socket handlers: server/src/socket/handlers/[feature].handler.ts (if real-time)
  - Schemas: server/src/schemas/[feature].ts (TypeBox)
  - Errors: server/src/errors/index.ts (@fastify/error)

CLIENT:
  - Feature module: client/src/features/[feature]/
  - Components: client/src/features/[feature]/components/
  - Hooks: client/src/features/[feature]/hooks/
  - Shared components: client/src/shared/components/ (if used by 2+ features)

SHARED:
  - Types: shared/types/[feature].ts
  - Re-export from: shared/index.ts

SOURCE CONTROL:
  - Create feature branch off main: feature/[feature-name]
  - Commit after each major implementation step with detailed message
```

## Validation Loop

### Level 1: Shared Types Build

```bash
cd shared && npx tsc
# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: TypeScript Compilation

```bash
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
# Expected: No errors. If errors, READ the error and fix.
```

### Level 3: Syntax & Style

```bash
cd server && npx eslint .
cd client && npx eslint .
# Expected: No errors. If errors, READ the error and fix.
```

### Level 4: Unit Tests (Vitest)

```typescript
// CREATE [feature].test.ts alongside source file
// Minimum per feature:
// - 1 test for expected use
// - 1 edge case
// - 1 failure case
import { describe, it, expect } from 'vitest'

describe('newFeatureService', () => {
  it('returns expected result for valid input', () => {
    // ...
  })

  it('handles edge case', () => {
    // ...
  })

  it('throws on invalid input', () => {
    // ...
  })
})
```

```bash
cd server && npx vitest run
# If failing: Read error, understand root cause, fix code, re-run (never mock to pass)
```

### Level 5: Build Verification

```bash
cd client && npx vite build
# IMPORTANT: Catches module resolution, circular deps, missing imports that typecheck misses
```

## Final Validation Checklist

- [ ] Shared types build: `cd shared && npx tsc`
- [ ] Server type-check: `cd server && npx tsc --noEmit`
- [ ] Client type-check: `cd client && npx tsc --noEmit`
- [ ] Server lint: `cd server && npx eslint .`
- [ ] Client lint: `cd client && npx eslint .`
- [ ] All tests pass: `cd server && npx vitest run`
- [ ] Client build: `cd client && npx vite build`
- [ ] Error cases handled gracefully
- [ ] Documentation updated if needed (CLAUDE.md if architecture changes)

---

## Anti-Patterns to Avoid

- Don't create new patterns when existing ones work
- Don't skip validation because "it should work"
- Don't ignore failing tests — fix them
- Don't use `any` type — use `unknown` or proper types
- Don't create files longer than 500 lines — split into helpers
- Don't use native HTML elements when shadcn/ui components exist
- Don't hardcode values that should be env config
- Don't install npm packages unless explicitly needed
- Don't forget `.js` extensions in ESM imports
- Don't put business logic in route handlers — use services
- Don't forget to memoize Socket.IO event handlers on the client
