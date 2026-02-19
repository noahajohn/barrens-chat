# NPC Chatters — Product Requirements Plan (PRP)

## Goal

Implement the AI-Generated NPC Chatters stretch feature (section 4.1 from `PRPs/barrens-chat-prp-v2.md`). Only the **Chuck Norris Guy ("Chuckfacts")** NPC will be active, but the architecture must support easily adding more NPCs by activating them in the database. The NPC bot must **only post messages when authenticated human users are present** in the chat room.

## Why

- Brings the Barrens chat experience to life even when few human users are online
- Classic Chuck Norris facts were a staple of Barrens General Chat circa 2006
- Demonstrates Claude API integration as a learning goal
- Extensible design means adding The Noob or Guild Recruiter later is just a database toggle

## What

A server-side timer periodically selects a random active NPC persona from the database, generates a message via the Claude API (Haiku 4.5) using the persona's system prompt and recent chat context, persists the message to the database, and broadcasts it to all connected users via Socket.IO. The NPC timer only fires when at least one authenticated human user is connected. NPC messages are visually distinguished in the frontend (already implemented — uses `text-wow-npc` CSS class).

### Success Criteria

- [ ] `@anthropic-ai/sdk` installed in server
- [ ] `ANTHROPIC_API_KEY` added to env config as optional — NPC feature gracefully disables when not set
- [ ] `NpcService` created in `server/src/services/npc.ts` with Claude API integration
- [ ] NPC handler in `server/src/socket/handlers/npc.handler.ts` manages timer lifecycle
- [ ] NPC only posts when `getOnlineCount() > 0` (human users present)
- [ ] Timer fires at random 45–120 second intervals
- [ ] Only Chuckfacts is seeded with `isActive: true`; other NPCs seeded with `isActive: false`
- [ ] NPC messages appear in chat with correct `text-wow-npc` styling
- [ ] NPC messages persist to database with `isNpc: true` and correct `npcName`
- [ ] If `ANTHROPIC_API_KEY` is missing, server starts normally with NPC feature disabled (log warning)
- [ ] If Claude API call fails, error is logged but server continues (no crash)
- [ ] All validation gates pass (typecheck, lint, tests, build)
- [ ] Unit tests for NPC service core logic

---

## All Needed Context

### Documentation & References

```yaml
# Anthropic SDK for TypeScript
- url: https://github.com/anthropics/anthropic-sdk-typescript
  why: Official SDK source — ESM-compatible, uses `import Anthropic from "@anthropic-ai/sdk"`

# Claude API Pricing (for cost analysis)
- url: https://platform.claude.com/docs/en/about-claude/pricing
  why: Current pricing for Haiku 4.5 ($1/MTok input, $5/MTok output)

# Prompt Caching docs
- url: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
  why: Cache system prompts for 90% cost reduction on repeated calls

# Existing codebase patterns
- file: server/src/services/chat.ts
  why: Service pattern to mirror — accepts PrismaClient, returns MessagePayload

- file: server/src/services/presence.ts
  why: Provides getOnlineCount() to check if human users are present

- file: server/src/socket/handlers/message.handler.ts
  why: Socket handler pattern — typed Server/Socket, io.to('general').emit()

- file: server/src/socket/index.ts
  why: Where NPC handler registration gets wired in

- file: server/src/config/env.ts
  why: Add optional ANTHROPIC_API_KEY using TypeBox Type.Optional()

- file: server/prisma/seed.ts
  why: Update to set only Chuckfacts as isActive: true

- file: shared/types/message.ts
  why: MessagePayload interface (already has isNpc, npcName fields)
```

### Current Codebase Tree

```
barrens-chat/
├── shared/                        # Shared TypeScript types (client + server)
│   └── types/
│       ├── message.ts             # MessageType enum, MessagePayload (has isNpc, npcName)
│       ├── socket-events.ts       # ServerToClientEvents, ClientToServerEvents
│       └── user.ts                # UserPayload
├── client/src/
│   └── features/chat/components/
│       └── MessageLine.tsx        # Already renders NPC messages with text-wow-npc
├── server/
│   ├── prisma/
│   │   ├── schema.prisma          # NpcPersona model already exists
│   │   └── seed.ts                # Seeds 3 NPCs (all isActive: true currently)
│   └── src/
│       ├── config/env.ts          # EnvSchema — needs ANTHROPIC_API_KEY added
│       ├── services/
│       │   ├── chat.ts            # createMessage() already handles isNpc/npcName
│       │   ├── presence.ts        # getOnlineCount(), getOnlineUsers()
│       │   └── rate-limiter.ts
│       ├── socket/
│       │   ├── index.ts           # setupSocketHandlers() — wire NPC handler here
│       │   └── handlers/
│       │       ├── message.handler.ts
│       │       └── presence.handler.ts
│       ├── generated/prisma/      # Prisma client (gitignored)
│       └── types/fastify.d.ts     # FastifyInstance augmentation
```

### Desired Codebase Tree (new/modified files)

```
server/
├── src/
│   ├── config/
│   │   └── env.ts                 # MODIFY: Add optional ANTHROPIC_API_KEY
│   ├── services/
│   │   ├── npc.ts                 # CREATE: NPC service (Claude API, message generation)
│   │   └── npc.test.ts            # CREATE: Unit tests for NPC service
│   ├── socket/
│   │   ├── index.ts               # MODIFY: Wire NPC handler registration
│   │   └── handlers/
│   │       └── npc.handler.ts     # CREATE: Timer-based NPC message orchestration
├── prisma/
│   └── seed.ts                    # MODIFY: Only Chuckfacts isActive: true
└── package.json                   # MODIFY: Add @anthropic-ai/sdk dependency
```

### Known Gotchas & Library Quirks

```yaml
# Anthropic SDK
- Model ID for Haiku 4.5 is "claude-haiku-4-5" (alias) — do NOT append date suffix
- SDK reads ANTHROPIC_API_KEY from env automatically — just `new Anthropic()` works
- Prompt caching: use `cache_control: { type: "ephemeral" }` on system prompt text block
- System prompt must be array format (not string) for cache_control to work
- SDK auto-retries 429/5xx with exponential backoff (default max_retries: 2)

# ESM Imports
- All local imports need .js extensions (even for .ts files)
- import Anthropic from "@anthropic-ai/sdk" (default export, ESM-compatible)

# Prisma 7
- PrismaClient MessageType enum != shared MessageType enum — cast with `as unknown as`
- Prisma generates its own enums in server/src/generated/prisma/enums.js

# TypeBox Optional Fields
- Use Type.Optional(Type.String()) for optional env vars
- The Value.Decode() call will NOT fail if an optional field is missing

# Seed File Bug
- Current seed.ts uses `where: { id: persona.name }` for upsert
- The `id` field is UUID type — using a name string as ID will fail
- Fix: use a deterministic UUID or switch upsert to use a unique field
- Best fix: add `@@unique([name])` to NpcPersona or use `name` as the where clause
  - Actually, the upsert `where` must use a unique field — `name` is not unique in schema
  - Must add `@unique` to the `name` field on NpcPersona model in schema.prisma

# Timer Cleanup
- setInterval returns a NodeJS.Timeout — must call clearInterval on shutdown
- Use fastify.addHook('onClose') or cleanup function to prevent timer leaks

# Socket.IO Room Broadcast
- io.to('general').emit('message:new', payload) broadcasts to all connected users
- NPC messages use the same 'message:new' event as human messages
```

---

## Anthropic API Cost Analysis

### Model Selection: Claude Haiku 4.5

Haiku 4.5 is the recommended model for NPC message generation because:
- **Fast**: Lowest latency — NPC messages should feel responsive
- **Cheap**: $1/MTok input, $5/MTok output — 5x cheaper than Sonnet
- **Sufficient**: Simple persona-based text generation doesn't need advanced reasoning
- **Model ID**: `claude-haiku-4-5`

### Pricing Table (per million tokens, USD)

| Model | Input | Output | Cache Write | Cache Hit |
|-------|-------|--------|-------------|-----------|
| Claude Haiku 4.5 | $1.00 | $5.00 | $1.25 | $0.10 |
| Claude Sonnet 4.5/4.6 | $3.00 | $15.00 | $3.75 | $0.30 |
| Claude Opus 4.5/4.6 | $5.00 | $25.00 | $6.25 | $0.50 |

Source: https://platform.claude.com/docs/en/about-claude/pricing

### Per-Message Cost Estimate (Haiku 4.5)

| Component | Tokens | Cost Calculation |
|-----------|--------|------------------|
| System prompt (persona) | ~100 tokens | $0.0001 (input) |
| Chat context (last 10 msgs) | ~500 tokens | $0.0005 (input) |
| Output (one Chuck Norris fact) | ~30 tokens | $0.00015 (output) |
| **Total per message** | ~630 tokens | **~$0.00075** |

### With Prompt Caching (recommended)

The system prompt is identical on every call for a given NPC. With prompt caching:
- First call: system prompt costs 1.25x ($0.000125 for 100 tokens)
- Subsequent calls: system prompt costs 0.1x ($0.00001 for 100 tokens) — **90% savings**
- Cache TTL: 5 minutes (default) — well within our 45–120 second interval

| Component | Without Caching | With Caching |
|-----------|----------------|--------------|
| System prompt (per msg) | $0.0001 | $0.00001 |
| Chat context | $0.0005 | $0.0005 |
| Output | $0.00015 | $0.00015 |
| **Total per message** | **$0.00075** | **$0.00066** |

### Monthly Cost Projections

Assuming average interval of ~82.5 seconds (midpoint of 45–120 range):

| Scenario | Messages/Day | Daily Cost | Monthly Cost |
|----------|-------------|------------|-------------|
| 1 NPC, always active (24/7 users) | ~1,047 | $0.69 | **~$21** |
| 1 NPC, 12h active (peak hours) | ~524 | $0.35 | **~$10.50** |
| 1 NPC, 4h active (low traffic) | ~175 | $0.12 | **~$3.50** |
| 3 NPCs, always active | ~3,141 | $2.07 | **~$63** |

**Key insight**: For a low-traffic side project, NPC costs will be negligible ($3–10/month). The presence check (only post when humans are online) is the main cost control — bots don't talk to an empty room.

### Cost Control Levers

1. **Presence check** (implemented): No API calls when no humans are online
2. **Interval tuning**: Increase min/max interval to reduce message frequency
3. **Prompt caching**: 90% savings on system prompt tokens (5-minute cache TTL)
4. **`max_tokens` cap**: Set low `max_tokens` (150) to prevent runaway output
5. **Single active NPC**: Only Chuckfacts active initially; add more NPCs intentionally

---

## Implementation Blueprint

### Source Control

```bash
# Create feature branch off development (NOT main)
git checkout development
git pull origin development
git checkout -b feature/npc-chatters
```

Commit after each major task with a descriptive message.

### Data Model Changes

The `NpcPersona` model already exists in `schema.prisma` but the `name` field needs `@unique` for safe upserts:

```prisma
model NpcPersona {
  id           String  @id @default(uuid()) @db.Uuid
  name         String  @unique          # ADD @unique for upsert support
  archetype    String
  systemPrompt String
  isActive     Boolean @default(true)
}
```

### List of Tasks

```yaml
Task 1:
  description: "Create feature branch and install @anthropic-ai/sdk"
  files:
    - MODIFY: server/package.json (add @anthropic-ai/sdk dependency)
  commands:
    - git checkout development && git pull origin development
    - git checkout -b feature/npc-chatters
    - cd server && npm install @anthropic-ai/sdk@latest
  commit: "Install @anthropic-ai/sdk for NPC AI message generation"

Task 2:
  description: "Add @unique to NpcPersona.name and add optional ANTHROPIC_API_KEY to env config"
  files:
    - MODIFY: server/prisma/schema.prisma (add @unique to NpcPersona.name)
    - MODIFY: server/src/config/env.ts (add optional ANTHROPIC_API_KEY)
  notes: |
    - Use Type.Optional(Type.String()) for ANTHROPIC_API_KEY so server starts without it
    - Must create a new Prisma migration for the schema change
    - Run: cd server && npx prisma migrate dev --name add-npc-name-unique
  commit: "Add NpcPersona.name unique constraint and optional ANTHROPIC_API_KEY env"

Task 3:
  description: "Update seed file — only Chuckfacts active, fix upsert to use name"
  files:
    - MODIFY: server/prisma/seed.ts
  notes: |
    - Set Legolasxxx and Recruitron to isActive: false
    - Keep Chuckfacts at isActive: true
    - Change upsert `where` to use `{ name: persona.name }` (now @unique)
    - Remove the `id: persona.name` pattern (was using name string as UUID which is wrong)
  commit: "Update NPC seed: only Chuckfacts active, fix upsert where clause"

Task 4:
  description: "Create NPC service (server/src/services/npc.ts)"
  files:
    - CREATE: server/src/services/npc.ts (MIRROR pattern from: server/src/services/chat.ts)
  notes: |
    - Service accepts PrismaClient via parameter (dependency injection pattern)
    - Initialize Anthropic client at module level (reads ANTHROPIC_API_KEY from env)
    - Functions: getActivePersonas(), getRecentMessages(), generateNpcMessage(), createNpcMessage()
    - Use claude-haiku-4-5 model
    - Use prompt caching on system prompt (cache_control: { type: "ephemeral" })
    - Set max_tokens: 150 (Chuck Norris facts are short)
    - Handle API errors gracefully (log + return null, don't throw)
    - See pseudocode below
  commit: "Create NPC service with Claude API integration"

Task 5:
  description: "Create NPC socket handler (server/src/socket/handlers/npc.handler.ts)"
  files:
    - CREATE: server/src/socket/handlers/npc.handler.ts (MIRROR: server/src/socket/handlers/presence.handler.ts for types)
  notes: |
    - Export startNpcTimer() and stopNpcTimer() functions
    - Timer checks getOnlineCount() before generating — skip if 0
    - Random interval between 45–120 seconds
    - On each tick: pick random active NPC, generate message, broadcast via io.to('general')
    - Return cleanup function for graceful shutdown
    - See pseudocode below
  commit: "Create NPC handler with timer-based message broadcasting"

Task 6:
  description: "Wire NPC handler into socket setup and server lifecycle"
  files:
    - MODIFY: server/src/socket/index.ts (import and call NPC handler setup)
  notes: |
    - Import startNpcTimer from npc.handler.ts
    - Call startNpcTimer() OUTSIDE the io.on('connection') callback — it's a global timer, not per-socket
    - Only start if ANTHROPIC_API_KEY is set (check process.env)
    - Log warning if ANTHROPIC_API_KEY is missing
    - Timer cleanup should happen when the Socket.IO server closes
  commit: "Wire NPC handler into socket setup with graceful enable/disable"

Task 7:
  description: "Write unit tests for NPC service"
  files:
    - CREATE: server/src/services/npc.test.ts (MIRROR: server/src/services/chat.test.ts for pattern)
  notes: |
    - Test getActivePersonas() with mock PrismaClient
    - Test message formatting (isNpc: true, npcName set correctly)
    - Test getRandomInterval() returns values in expected range
    - Test graceful handling when no active personas exist
    - Do NOT test actual Claude API calls (would require API key + real calls)
    - Use vi.mock() for Anthropic SDK
  commit: "Add unit tests for NPC service"

Task 8:
  description: "Run all validation gates and fix any issues"
  commands:
    - cd shared && npx tsc
    - cd server && npx prisma generate
    - cd server && npx tsc --noEmit
    - cd server && npx eslint .
    - cd server && npx vitest run
    - cd client && npx tsc --noEmit
    - cd client && npx eslint .
    - cd client && npx vite build
  commit: "Fix validation issues (if any)"
```

### Per-Task Pseudocode

#### Task 2: env.ts changes

```typescript
// server/src/config/env.ts
// ADD to EnvSchema:
ANTHROPIC_API_KEY: Type.Optional(Type.String()),

// The loadEnv() function remains unchanged — Value.Decode handles optional fields
```

#### Task 3: seed.ts changes

```typescript
// server/prisma/seed.ts
// Change upsert to use name (now @unique):
await prisma.npcPersona.upsert({
  where: { name: persona.name },
  update: persona,
  create: persona,
})

// Set isActive for each persona:
// Chuckfacts: isActive: true
// Legolasxxx: isActive: false
// Recruitron: isActive: false
```

#### Task 4: NPC Service (server/src/services/npc.ts)

```typescript
// PATTERN: Services accept PrismaClient, return plain objects (same as chat.ts)
import Anthropic from '@anthropic-ai/sdk'
import type { PrismaClient } from '../generated/prisma/client.js'
import { MessageType as PrismaMessageType } from '../generated/prisma/enums.js'
import { MessageType, type MessagePayload } from 'shared'

// Module-level client — reads ANTHROPIC_API_KEY from env automatically
// Only instantiate if key is available
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

const NPC_MODEL = 'claude-haiku-4-5'
const NPC_MAX_TOKENS = 150
const CONTEXT_MESSAGE_COUNT = 10

export const getActivePersonas = async (prisma: PrismaClient) => {
  return prisma.npcPersona.findMany({ where: { isActive: true } })
}

export const getRecentMessages = async (prisma: PrismaClient, count: number) => {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    take: count,
    include: { user: true },
  })
  return messages.reverse() // chronological order for context
}

export const generateNpcMessage = async (
  prisma: PrismaClient,
  persona: { name: string; systemPrompt: string },
): Promise<string | null> => {
  if (!anthropic) return null

  try {
    const recent = await getRecentMessages(prisma, CONTEXT_MESSAGE_COUNT)
    const contextLines = recent.map((m) => {
      const name = m.isNpc ? (m.npcName ?? 'NPC') : (m.user?.username ?? 'Unknown')
      return `[${name}]: ${m.content}`
    })

    const response = await anthropic.messages.create({
      model: NPC_MODEL,
      max_tokens: NPC_MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: persona.systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: contextLines.length > 0
            ? `Here is the recent chat:\n${contextLines.join('\n')}\n\nPost your next message.`
            : 'The chat room just opened. Post your first message.',
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    return textBlock?.text?.trim() ?? null
  } catch (err) {
    // Log but don't throw — NPC failures should never crash the server
    return null // caller handles null
  }
}

export const createNpcMessage = async (
  prisma: PrismaClient,
  npcName: string,
  content: string,
): Promise<MessagePayload> => {
  const message = await prisma.message.create({
    data: {
      content,
      isNpc: true,
      npcName,
      messageType: PrismaMessageType.TEXT,
    },
  })

  return {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    userId: null,
    username: npcName,
    avatarUrl: null,
    isNpc: true,
    npcName,
    messageType: message.messageType as unknown as MessageType,
  }
}

export const getRandomInterval = (minMs: number, maxMs: number): number => {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
}
```

#### Task 5: NPC Handler (server/src/socket/handlers/npc.handler.ts)

```typescript
// PATTERN: Socket handlers receive io, prisma, log (same as message.handler.ts)
import type { Server as SocketIOServer } from 'socket.io'
import type { FastifyBaseLogger } from 'fastify'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from 'shared'
import type { PrismaClient } from '../../generated/prisma/client.js'
import { getOnlineCount } from '../../services/presence.js'
import {
  getActivePersonas,
  generateNpcMessage,
  createNpcMessage,
  getRandomInterval,
} from '../../services/npc.js'

type TypedServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

const MIN_INTERVAL_MS = 45_000   // 45 seconds
const MAX_INTERVAL_MS = 120_000  // 120 seconds

let timer: ReturnType<typeof setTimeout> | null = null

const scheduleNextMessage = (
  io: TypedServer,
  prisma: PrismaClient,
  log: FastifyBaseLogger,
) => {
  const delay = getRandomInterval(MIN_INTERVAL_MS, MAX_INTERVAL_MS)
  timer = setTimeout(async () => {
    try {
      // Only post if human users are present
      if (getOnlineCount() > 0) {
        const personas = await getActivePersonas(prisma)
        if (personas.length > 0) {
          const persona = personas[Math.floor(Math.random() * personas.length)]
          const content = await generateNpcMessage(prisma, persona)
          if (content) {
            const payload = await createNpcMessage(prisma, persona.name, content)
            io.to('general').emit('message:new', payload)
            log.info(`NPC [${persona.name}] posted: "${content.substring(0, 50)}..."`)
          }
        }
      }
    } catch (err) {
      log.error(err, 'NPC message generation failed')
    }
    // Schedule next tick regardless of success/failure
    scheduleNextMessage(io, prisma, log)
  }, delay)
}

export const startNpcTimer = (
  io: TypedServer,
  prisma: PrismaClient,
  log: FastifyBaseLogger,
) => {
  log.info('NPC timer started — posting when users are present')
  scheduleNextMessage(io, prisma, log)
}

export const stopNpcTimer = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}
```

#### Task 6: Wire into socket/index.ts

```typescript
// server/src/socket/index.ts — ADD these changes:
import { startNpcTimer, stopNpcTimer } from './handlers/npc.handler.js'

// AFTER io.on('connection', ...) block, ADD:
if (process.env.ANTHROPIC_API_KEY) {
  startNpcTimer(io, prisma, fastify.log)
  // Cleanup on server close
  fastify.addHook('onClose', async () => {
    stopNpcTimer()
  })
} else {
  fastify.log.warn('ANTHROPIC_API_KEY not set — NPC chatters disabled')
}
```

### Integration Points

```yaml
SERVER:
  - Service: server/src/services/npc.ts (Claude API + DB operations)
  - Socket handler: server/src/socket/handlers/npc.handler.ts (timer orchestration)
  - Config: server/src/config/env.ts (optional ANTHROPIC_API_KEY)
  - Socket setup: server/src/socket/index.ts (wiring)
  - Seed: server/prisma/seed.ts (NPC persona data)
  - Schema: server/prisma/schema.prisma (NpcPersona.name @unique)

CLIENT:
  - No client changes needed — MessageLine.tsx already handles NPC display

SHARED:
  - No shared type changes needed — MessagePayload already has isNpc/npcName
```

---

## Validation Loop

### Level 1: Shared Types Build

```bash
cd shared && npx tsc
# Expected: No errors (no shared type changes in this feature)
```

### Level 2: Prisma Generation + TypeScript Compilation

```bash
cd server && npx prisma generate && npx tsc --noEmit
# Expected: No errors. If prisma generate fails, check schema.prisma syntax.
# Common issue: import path for Anthropic SDK — must be default import
```

```bash
cd client && npx tsc --noEmit
# Expected: No errors (no client changes)
```

### Level 3: Syntax & Style

```bash
cd server && npx eslint .
# Expected: No errors.
# Common issue: unused variables — prefix with underscore (_err)
# Common issue: @typescript-eslint may flag Anthropic SDK types
```

```bash
cd client && npx eslint .
# Expected: No errors (no client changes)
```

### Level 4: Unit Tests (Vitest)

```bash
cd server && npx vitest run
# Expected: All existing tests pass + new NPC tests pass
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 5: Build Verification

```bash
cd client && npx vite build
# Expected: Builds successfully (no client changes, but verifies no shared type breakage)
```

---

## Final Validation Checklist

- [ ] Feature branch created off `development`: `feature/npc-chatters`
- [ ] `@anthropic-ai/sdk` installed in server
- [ ] `ANTHROPIC_API_KEY` optional in env config
- [ ] `NpcPersona.name` has `@unique` constraint
- [ ] Prisma migration created for schema change
- [ ] Seed file: only Chuckfacts `isActive: true`, upsert uses `name`
- [ ] NPC service handles Claude API calls with prompt caching
- [ ] NPC handler timer only fires when humans are online
- [ ] Timer uses random 45–120 second intervals
- [ ] Graceful disable when `ANTHROPIC_API_KEY` missing
- [ ] Graceful error handling on API failures (log, don't crash)
- [ ] Timer cleanup on server shutdown
- [ ] Unit tests for NPC service
- [ ] Shared types build: `cd shared && npx tsc`
- [ ] Server type-check: `cd server && npx tsc --noEmit`
- [ ] Client type-check: `cd client && npx tsc --noEmit`
- [ ] Server lint: `cd server && npx eslint .`
- [ ] Client lint: `cd client && npx eslint .`
- [ ] All tests pass: `cd server && npx vitest run`
- [ ] Client build: `cd client && npx vite build`
- [ ] Each task committed with descriptive message
- [ ] All commits on `feature/npc-chatters` branch

---

## Anti-Patterns to Avoid

- Don't create new patterns when existing ones work — mirror `chat.ts` service pattern
- Don't skip validation because "it should work"
- Don't use `any` type — use `unknown` or proper types
- Don't hardcode the API key — use env variable
- Don't forget `.js` extensions in ESM imports
- Don't put business logic in socket handlers — use the NPC service
- Don't let NPC timer run per-socket — it's a global singleton timer
- Don't throw errors from NPC service — return null, let caller handle
- Don't install unnecessary packages — only `@anthropic-ai/sdk` is needed
- Don't modify shared types or client code — they already support NPC messages
- Don't use `setInterval` — use chained `setTimeout` for random intervals
- Don't forget to cast Prisma's MessageType enum to shared MessageType (`as unknown as`)

---

## Confidence Score: 9/10

High confidence for one-pass implementation because:
- Most infrastructure already exists (Prisma model, shared types, frontend rendering)
- Only server-side changes needed (no client/shared changes)
- Clear patterns to mirror from existing services and handlers
- Simple Claude API usage (single message, no tools, no streaming)
- Well-defined scope (one NPC, one service, one handler)
- Comprehensive pseudocode covers all critical implementation details

Minor risks:
- Prisma migration for `@unique` constraint could fail if duplicate names exist in DB (unlikely on fresh DB)
- Seed file upsert change needs careful testing
- TypeBox `Type.Optional` behavior with `Value.Decode` should be verified
