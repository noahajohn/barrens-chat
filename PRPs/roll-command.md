# PRP: /roll and /random Slash Commands

## Goal

Add `/roll` and `/random` slash commands to Barrens Chat that replicate WoW's dice rolling system. When a user types `/roll`, a random number between 1-100 is generated and displayed as an emote-style message (e.g., `Legolasxxx rolls 42 (1-100).`). Users can optionally specify a custom range.

## Why

- **Authentic WoW experience**: `/roll` is one of the most iconic WoW commands, used constantly in Barrens Chat for loot decisions, settling arguments, and general fun
- **Social interaction**: Rolling encourages group interaction and games between chatters
- **Low effort, high impact**: Leverages the existing emote pipeline — no server, database, or component changes needed

## What

### User-Visible Behavior

| Input | Output (displayed as emote) |
|---|---|
| `/roll` | `{username} rolls 42 (1-100).` |
| `/random` | Same as `/roll` (alias) |
| `/roll 20` | `{username} rolls 14 (1-20).` |
| `/roll 50-100` | `{username} rolls 73 (50-100).` |
| `/roll 0` | Defaults to `(1-100)` |
| `/roll -5` | Defaults to `(1-100)` |
| `/roll abc` | Treated as unknown command, sent as plain TEXT |

### Success Criteria

- [ ] `/roll` generates a random number 1-100 and displays as EMOTE type message
- [ ] `/random` works identically to `/roll` (alias)
- [ ] `/roll N` generates 1-N range (where N > 0)
- [ ] `/roll X-Y` generates X-Y range (where X < Y and both > 0)
- [ ] Invalid arguments (0, negatives, non-numeric) fall back to 1-100 default
- [ ] Roll messages render with emote styling: `{time} {username} rolls N (X-Y).`
- [ ] All existing tests continue to pass
- [ ] New unit tests cover all roll syntax variants and edge cases
- [ ] Shared types build, server type-check, client type-check, lint, and build all pass

## All Needed Context

### Documentation & References

```yaml
- url: https://wowwiki-archive.fandom.com/wiki/Roll
  why: WoW /roll command reference — syntax, output format, default range
  critical: |
    Syntax: /roll [[<lower>-]<upper>]
    Default: 1-100
    Output: "{Player Name} rolls {number} (1-100)."
    /random is an alias for /roll

- file: shared/types/emotes.ts
  why: Contains parseSlashCommand() — the ONLY function that needs modification
  critical: |
    - /yell is special-cased with startsWith before emote map lookup
    - /roll should be special-cased similarly, BEFORE the emote map lookup
    - Returns { content: string, messageType: MessageType }
    - For roll: return { content: "rolls 42 (1-100).", messageType: MessageType.EMOTE }

- file: shared/types/emotes.test.ts
  why: Test patterns to follow — uses describe/it/expect with Vitest
  critical: Tests parseSlashCommand with exact content matching via toEqual()

- file: client/src/features/chat/components/MessageLine.tsx
  why: Shows how EMOTE messages render — NO changes needed
  critical: |
    EMOTE renders as: {time} {username} {content}
    So roll content "rolls 42 (1-100)." becomes "12:34 Legolasxxx rolls 42 (1-100)."
    This perfectly matches WoW's output format.

- file: client/src/features/chat/components/ChatInput.tsx
  why: Shows where parseSlashCommand is called — NO changes needed
  critical: handleSubmit calls parseSlashCommand(trimmed, targetUser?.username)

- file: server/src/socket/handlers/message.handler.ts
  why: Shows server message flow — NO changes needed
  critical: Server receives { content, messageType }, validates, persists, broadcasts as-is

- file: server/src/services/chat.ts
  why: Shows createMessage service — NO changes needed
  critical: Accepts messageType as string, casts to PrismaMessageType
```

### Current Codebase Tree (relevant files only)

```
shared/
├── types/
│   ├── emotes.ts          # parseSlashCommand() — MODIFY
│   ├── emotes.test.ts     # Tests — MODIFY
│   ├── message.ts         # MessageType enum — NO CHANGE
│   └── socket-events.ts   # Socket event types — NO CHANGE
├── index.ts               # Barrel exports — NO CHANGE (parseSlashCommand already exported)
client/
└── src/features/chat/
    ├── components/
    │   ├── ChatInput.tsx   # Calls parseSlashCommand — NO CHANGE
    │   └── MessageLine.tsx # Renders EMOTE type — NO CHANGE
    └── hooks/
        ├── useSocket.ts    # sendMessage() — NO CHANGE
        └── useMessages.ts  # Message state — NO CHANGE
server/
├── src/
│   ├── socket/handlers/message.handler.ts  # NO CHANGE
│   └── services/chat.ts                    # NO CHANGE
└── prisma/schema.prisma                    # NO CHANGE (uses EMOTE type)
```

### Desired Codebase Tree Changes

```bash
# No new files — only modifications to existing files:
# ├── shared/types/emotes.ts         # Add /roll and /random parsing to parseSlashCommand()
# └── shared/types/emotes.test.ts    # Add comprehensive /roll test cases
```

### Known Gotchas & Library Quirks

```yaml
# Roll Implementation
- Roll uses MessageType.EMOTE — no Prisma schema or migration needed
- Roll is generated client-side (same trust model as emotes — client constructs content)
- parseSlashCommand currently returns SlashCommandResult { content, messageType }
- Roll content should NOT include the username — MessageLine prepends it for EMOTE type
- The regex /^\/(\S+)/ captures the first word after /, so "/roll 20" captures "roll"
- Arguments after the command name must be parsed from the original input string, NOT from the regex match

# Testing
- emotes.test.ts runs via `cd shared && npx vitest run` (NOT server)
- Tests use exact toEqual() matching — but roll results are random!
- For random output, use expect(result.content).toMatch(/regex/) instead of toEqual()
- Also test that messageType is exactly MessageType.EMOTE

# Shared Package
- Must build shared (`cd shared && npx tsc`) before server/client can import
- ESM imports use .js extension: import { MessageType } from './message.js'
```

## Implementation Blueprint

### Data Model Changes

**None.** Roll messages use the existing `EMOTE` MessageType. No Prisma schema changes or migrations needed.

### End-to-End Data Flow (for reference — all existing, no changes)

```
1. User types "/roll 20" → ChatInput.handleSubmit()
2. parseSlashCommand("/roll 20") → { content: "rolls 14 (1-20).", messageType: EMOTE }
3. useSocket.sendMessage("rolls 14 (1-20).", MessageType.EMOTE)
4. Socket emits → message:send { content: "rolls 14 (1-20).", messageType: "EMOTE" }
5. Server validates, persists as EMOTE, broadcasts message:new
6. All clients receive → MessageLine renders: "12:34 Legolasxxx rolls 14 (1-20)."
```

### List of Tasks to Complete (in order)

```yaml
Task 1:
  description: "Create feature branch off development"
  commands:
    - git checkout development
    - git pull origin development
    - git checkout -b feature/roll-command
  notes: "Always branch from development, never from main"

Task 2:
  description: "Add /roll and /random parsing to parseSlashCommand() in shared/types/emotes.ts"
  files:
    - MODIFY: shared/types/emotes.ts
  notes: |
    - Add roll parsing AFTER /yell check but BEFORE emote map lookup
    - Parse the full input to extract arguments after /roll or /random
    - Handle three syntax variants: /roll, /roll N, /roll X-Y
    - Generate random number with Math.floor(Math.random() * (max - min + 1)) + min
    - Return { content: `rolls ${result} (${min}-${max}).`, messageType: MessageType.EMOTE }
    - Invalid arguments (0, negatives, non-numeric, lower > upper) default to 1-100

Task 3:
  description: "Add comprehensive unit tests for /roll in shared/types/emotes.test.ts"
  files:
    - MODIFY: shared/types/emotes.test.ts
  notes: |
    - Add a new describe('parseSlashCommand - /roll') block
    - Use regex matching (toMatch) for content since output is random
    - Verify messageType is always MessageType.EMOTE
    - Test all syntax variants: /roll, /random, /roll N, /roll X-Y
    - Test edge cases: /roll 0, /roll -1, /roll abc, /roll 5-3
    - Verify range boundaries by running multiple iterations if needed
    - Also verify /roll doesn't conflict with existing /rofl emote

Task 4:
  description: "Run validation loop — build, type-check, lint, test"
  commands:
    - cd shared && npx tsc
    - cd shared && npx vitest run
    - cd server && npx tsc --noEmit
    - cd client && npx tsc --noEmit
    - cd server && npx eslint .
    - cd client && npx eslint .
    - cd client && npx vite build
  notes: "Fix any failures before proceeding"

Task 5:
  description: "Commit changes with detailed message"
  commands:
    - git add shared/types/emotes.ts shared/types/emotes.test.ts
    - |
      git commit -m "Add /roll and /random slash commands

      Implement WoW-style dice rolling in parseSlashCommand():
      - /roll generates random 1-100 (default)
      - /roll N generates random 1-N
      - /roll X-Y generates random X-Y
      - /random is an alias for /roll
      - Invalid args gracefully default to 1-100
      - Uses EMOTE message type for authentic WoW styling
      - Comprehensive test coverage for all variants and edge cases"
  notes: "Commit to feature/roll-command branch"
```

### Task 2 Pseudocode — parseSlashCommand modification

```typescript
// In parseSlashCommand(), AFTER the /yell check, BEFORE emote map lookup:

export function parseSlashCommand(
  input: string,
  targetUsername?: string,
): SlashCommandResult {
  const trimmed = input.trim()

  // /yell — existing
  if (trimmed.startsWith('/yell ')) {
    return { content: trimmed.slice(6), messageType: MessageType.YELL }
  }

  // /roll and /random — NEW
  const rollMatch = trimmed.match(/^\/(roll|random)(?:\s+(.+))?$/i)
  if (rollMatch) {
    // Parse optional range argument
    let min = 1
    let max = 100

    const arg = rollMatch[2]?.trim()
    if (arg) {
      const rangeMatch = arg.match(/^(\d+)-(\d+)$/)
      if (rangeMatch) {
        // /roll X-Y syntax
        const parsedMin = parseInt(rangeMatch[1], 10)
        const parsedMax = parseInt(rangeMatch[2], 10)
        if (parsedMin > 0 && parsedMax > 0 && parsedMin < parsedMax) {
          min = parsedMin
          max = parsedMax
        }
        // else: invalid range, keep defaults 1-100
      } else {
        // /roll N syntax
        const parsedMax = parseInt(arg, 10)
        if (!isNaN(parsedMax) && parsedMax > 0) {
          max = parsedMax
        }
        // else: non-numeric or invalid, keep defaults 1-100
      }
    }

    const result = Math.floor(Math.random() * (max - min + 1)) + min
    return {
      content: `rolls ${result} (${min}-${max}).`,
      messageType: MessageType.EMOTE,
    }
  }

  // Emote map lookup — existing (unchanged)
  const match = trimmed.match(/^\/(\S+)/)
  if (match) {
    const emote = emoteMap.get(match[1])
    // ... rest unchanged
  }

  return { content: trimmed, messageType: MessageType.TEXT }
}
```

### Task 3 Pseudocode — Test cases

```typescript
describe('parseSlashCommand - /roll', () => {
  it('generates EMOTE with default 1-100 range for /roll', () => {
    const result = parseSlashCommand('/roll')
    expect(result.messageType).toBe(MessageType.EMOTE)
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('/random works as alias for /roll', () => {
    const result = parseSlashCommand('/random')
    expect(result.messageType).toBe(MessageType.EMOTE)
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('supports /roll N for custom upper bound', () => {
    const result = parseSlashCommand('/roll 20')
    expect(result.messageType).toBe(MessageType.EMOTE)
    expect(result.content).toMatch(/^rolls \d+ \(1-20\)\.$/)
  })

  it('supports /roll X-Y for custom range', () => {
    const result = parseSlashCommand('/roll 50-100')
    expect(result.messageType).toBe(MessageType.EMOTE)
    expect(result.content).toMatch(/^rolls \d+ \(50-100\)\.$/)
  })

  it('defaults to 1-100 for /roll 0', () => {
    const result = parseSlashCommand('/roll 0')
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('defaults to 1-100 for negative numbers', () => {
    const result = parseSlashCommand('/roll -5')
    // Note: -5 won't match /^\d+$/ so it defaults
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('defaults to 1-100 for non-numeric arguments', () => {
    const result = parseSlashCommand('/roll abc')
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('defaults to 1-100 when lower >= upper in range', () => {
    const result = parseSlashCommand('/roll 100-50')
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('/roll 1 always rolls 1', () => {
    const result = parseSlashCommand('/roll 1')
    expect(result.content).toBe('rolls 1 (1-1).')
  })

  it('does not conflict with /rofl emote', () => {
    const result = parseSlashCommand('/rofl')
    expect(result.messageType).toBe(MessageType.EMOTE)
    expect(result.content).toBe('rolls on the floor laughing.')
  })

  it('ignores target username (rolls have no target)', () => {
    const result = parseSlashCommand('/roll', 'Thrall')
    expect(result.messageType).toBe(MessageType.EMOTE)
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('generates numbers within the specified range', () => {
    // Run multiple times to verify range is respected
    for (let i = 0; i < 50; i++) {
      const result = parseSlashCommand('/roll 5-10')
      const match = result.content.match(/^rolls (\d+) \(5-10\)\.$/)
      expect(match).not.toBeNull()
      const num = parseInt(match![1], 10)
      expect(num).toBeGreaterThanOrEqual(5)
      expect(num).toBeLessThanOrEqual(10)
    }
  })
})
```

### Integration Points

```yaml
SHARED (only changes):
  - shared/types/emotes.ts — Add roll parsing to parseSlashCommand()
  - shared/types/emotes.test.ts — Add roll test cases

NO CHANGES NEEDED:
  - shared/index.ts — parseSlashCommand already exported
  - server/* — Server receives EMOTE messages as-is, no special handling
  - client/* — ChatInput already calls parseSlashCommand, MessageLine already renders EMOTE
  - Prisma schema — EMOTE type already exists

SOURCE CONTROL:
  - Create feature branch off development: feature/roll-command
  - Commit after implementation + tests pass with detailed message
```

## Validation Loop

### Level 1: Shared Types Build

```bash
cd shared && npx tsc
# Expected: No errors. Roll changes are in shared/types/emotes.ts
```

### Level 2: TypeScript Compilation

```bash
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
# Expected: No errors. No server/client changes, but verify shared import still works
```

### Level 3: Syntax & Style

```bash
cd server && npx eslint .
cd client && npx eslint .
# Expected: No errors.
```

### Level 4: Unit Tests (Vitest)

```bash
cd shared && npx vitest run
# Expected: All existing emote tests pass + new roll tests pass
# NOTE: Tests are in shared/, not server/ — run vitest from shared directory
```

### Level 5: Build Verification

```bash
cd client && npx vite build
# Expected: Clean build. Verifies module resolution and shared import
```

## Final Validation Checklist

- [ ] Shared types build: `cd shared && npx tsc`
- [ ] Server type-check: `cd server && npx tsc --noEmit`
- [ ] Client type-check: `cd client && npx tsc --noEmit`
- [ ] Server lint: `cd server && npx eslint .`
- [ ] Client lint: `cd client && npx eslint .`
- [ ] All tests pass: `cd shared && npx vitest run`
- [ ] Client build: `cd client && npx vite build`
- [ ] `/roll` generates 1-100 range EMOTE
- [ ] `/random` works as alias
- [ ] `/roll N` and `/roll X-Y` work correctly
- [ ] Invalid arguments default to 1-100 gracefully
- [ ] No conflicts with existing `/rofl` emote
- [ ] Error cases handled gracefully (no crashes on bad input)

---

## Anti-Patterns to Avoid

- **Don't add a new MessageType** — EMOTE works perfectly for roll output format
- **Don't modify the Prisma schema** — no migration needed
- **Don't change server code** — roll generation is client-side, following the emote pattern
- **Don't change MessageLine** — EMOTE rendering already displays `{username} {content}`
- **Don't add a new socket event** — rolls flow through existing `message:send`
- **Don't install any npm packages** — pure logic, no dependencies
- **Don't use `any` type** — use proper types throughout
- **Don't forget `.js` extensions** in ESM imports if adding any new imports
- **Don't use case-sensitive matching** for the command name — `/Roll` and `/ROLL` should work too (regex uses `i` flag)
- **Don't use `toEqual()` for random output** in tests — use `toMatch()` with regex patterns

---

## Confidence Score: 9/10

**Rationale:** This is a minimal 2-file change that follows an established pattern exactly (emotes). The pseudocode is nearly complete implementation. The only risk is a subtle regex bug or edge case, which the comprehensive test suite will catch. The validation loop will verify everything compiles, lints, and passes tests before committing.
