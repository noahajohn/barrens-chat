# Barrens Chat — Product Requirements Plan (PRP) v2

## 1. Project Overview

**Barrens Chat** is a real-time web chat application that pays homage to the infamous General Chat channel in World of Warcraft's "The Barrens" zone. The app recreates the chaotic, humorous, and nostalgic atmosphere of Barrens chat circa 2005–2008 — a single shared chat room with a themed UI and (as a stretch goal) AI-generated NPC chatters that mimic the classic Barrens experience.

This is a learning-focused side project. The primary goal is to gain hands-on experience with **Fastify**, **PostgreSQL**, **Socket.IO**, **TypeScript**, and **Discord OAuth** while building something fun.

**Source code**: Public GitHub repository. All work is done via feature branches with pull requests merged into `main`.

**CI/CD**: GitHub Actions pipeline runs linting, type-checking, tests, and auto-deploys to Railway on merge to `main`.

**Target platform**: Desktop browsers (responsive/mobile is not a goal for MVP).

---

## 2. Tech Stack & Pinned Versions

All packages must be installed at the **latest version available on npm**. The versions below are current as of February 2026 — always use `@latest` when installing.

| Layer              | Technology                              | Version    |
|--------------------|-----------------------------------------|------------|
| Runtime            | Node.js                                 | 22.x LTS   |
| Language           | TypeScript                              | ^5.x       |
| TS Runner          | tsx                                     | ^4.x       |
| Frontend           | React                                   | ^19.x      |
| Build Tool         | Vite                                    | ^7.3.1     |
| Vite React         | @vitejs/plugin-react                    | ^5.1.4     |
| CSS                | Tailwind CSS + @tailwindcss/vite        | ^4.1.18    |
| CSS Animations     | tw-animate-css                          | latest     |
| UI Components      | shadcn/ui                               | latest     |
| Class Utilities    | clsx + tailwind-merge                   | latest     |
| Backend            | Fastify                                 | ^5.7.4     |
| CORS               | @fastify/cors                           | ^11.2.0    |
| JWT                | @fastify/jwt                            | ^10.0.0    |
| Cookies            | @fastify/cookie                         | ^11.0.2    |
| Autoload           | @fastify/autoload                       | ^6.x       |
| Type Provider      | @fastify/type-provider-typebox          | ^5.x       |
| Schema Builder     | @sinclair/typebox                       | ^0.34.x    |
| Error Utilities    | @fastify/error                          | ^4.x       |
| Static Files       | @fastify/static                         | ^8.x       |
| Plugin Wrapper     | fastify-plugin                          | ^5.x       |
| Real-Time          | socket.io (server)                      | ^4.8.3     |
| Real-Time          | socket.io-client                        | ^4.8.1     |
| ORM                | Prisma (CLI + Client)                   | ^7.2.x     |
| Prisma Adapter     | @prisma/adapter-pg + pg                 | ^7.2.x     |
| Sanitization       | sanitize-html + @types/sanitize-html    | latest     |
| AI (Stretch)       | @anthropic-ai/sdk                       | latest     |
| Deployment         | Railway                                 | —          |
| CI/CD              | GitHub Actions                          | —          |

### Critical Version Notes

**TypeScript**:
- The entire project (client, server, shared) uses TypeScript. All source files use `.ts` / `.tsx` extensions.
- `tsx` is used as a dev dependency in the server for running TypeScript files directly (Prisma config, seed scripts, dev mode).
- The server compiles to JavaScript for production via `tsc`. The production start command runs the compiled output.
- The client uses Vite's built-in TypeScript support (no separate compilation step needed for dev or build).

**Prisma 7 (Breaking Changes from v6)**:
Prisma 7 is a major release with significant changes. The coding agent MUST follow these:
- The generator provider is now `prisma-client` (NOT the old `prisma-client-js`).
- An `output` path is **required** in the generator block. Output to `../src/generated/prisma`.
- A `prisma.config.ts` file is **required** at the server project root for CLI configuration (replaces `.env` auto-loading).
- Prisma 7 ships as **ESM only**. The server project must use `"type": "module"` in `package.json`.
- A **driver adapter** is required for PostgreSQL. Install `@prisma/adapter-pg` and the `pg` driver.
- Environment variables from `.env` files are NOT automatically loaded — use `dotenv` or load them in `prisma.config.ts`.

**Tailwind CSS v4 (Breaking Changes from v3)**:
- There is NO `tailwind.config.js` file. Configuration is now **CSS-first**.
- Use the dedicated `@tailwindcss/vite` plugin (NOT the old PostCSS approach).
- CSS files use `@import "tailwindcss";` (NOT the old `@tailwind base/components/utilities` directives).
- Custom theme values are registered via `@theme inline { }` blocks that map CSS custom properties to Tailwind utility classes.
- Colors use the **OKLCH** color space (not HSL like Tailwind v3). Example: `oklch(0.205 0 0)`.
- Day/night themes are implemented via CSS custom properties in `:root` (day) and `.dark` (night) selectors, toggled by a class on `<html>`.
- Use `tw-animate-css` for animations (replaces `tailwindcss-animate` from v3).

**shadcn/ui**:
- shadcn/ui is a component library that copies source files into your project — you own the code and can modify it.
- Officially supports Vite + React + TypeScript. Initialize with `pnpm dlx shadcn@latest init` which generates `components.json` (with `rsc: false` for Vite and `tailwind.config: ""` for v4).
- Components are added individually via `pnpm dlx shadcn@latest add <component>`. They land in `src/shared/components/ui/` (configured via `components.json` aliases).
- Requires `clsx` + `tailwind-merge` for the `cn()` utility function in `src/lib/utils.ts`.
- All shadcn components use the CSS custom properties defined in the global stylesheet. The day/night theme is implemented by swapping these variables between `:root` and `.dark` selectors.
- The shadcn-recommended **custom ThemeProvider** pattern (~60 lines) is used for day/night theme toggling in Vite projects. This provides `useTheme()` and `setTheme()` with `localStorage` persistence — identical API to `next-themes` without the peer dependency on Next.js.

**Fastify 5 + Socket.IO Integration**:
- The `fastify-socket.io` npm package (v5.1.0) officially supports Fastify 4.x only. For Fastify 5, **manually attach Socket.IO to Fastify's underlying HTTP server** instead of using the plugin:
  ```ts
  import { Server as SocketIOServer } from 'socket.io'
  const io = new SocketIOServer(fastify.server, { cors: { origin: FRONTEND_URL } })
  ```
- Register this setup inside a Fastify plugin wrapped with `fastify-plugin`.

**Fastify + TypeBox**:
- `@fastify/type-provider-typebox` is the **officially maintained** Fastify type provider. It produces JSON Schema natively, which works directly with Fastify's built-in Ajv validator.
- TypeBox schemas provide both runtime validation AND TypeScript types from a single definition — no duplication.
- Use `FastifyPluginAsyncTypebox` for route plugins to get automatic type inference on `request.body`, `request.params`, `request.query`, and `reply`.

**Fastify + Autoload**:
- `@fastify/autoload` is used **twice** — once for `plugins/` (with `encapsulate: false`) and once for `routes/` (with `dirNameRoutePrefix: true`).
- Plugins are globally available (broken out of encapsulation via `fastify-plugin`).
- Routes are auto-prefixed by their directory name (e.g., `routes/auth/` → `/auth`).

### Why Prisma?
Prisma provides a type-safe query builder, auto-generated migrations, and a great developer experience for someone coming from MongoDB/Mongoose. It smooths the transition to relational modeling without writing raw SQL for everything. You can always drop to raw SQL via `prisma.$queryRaw` when needed. With TypeScript, Prisma's generated types flow through the entire server — from database to API response.

---

## 3. Core Features (MVP)

### 3.1 Authentication
- Discord OAuth 2.0 login (no email/password).
- On first login, a user record is created in PostgreSQL.
- User profile pulled from Discord: username, avatar, Discord ID.
- JWT-based session management (stored in httpOnly cookie).
- JWT tokens expire after **7 days**. On expiry, the user is redirected to the login page — no silent refresh for MVP.
- Logout endpoint that clears the session cookie.

### 3.2 Chat Room
The app has a single shared chat room: **[General]** — the main Barrens chat. Anything goes.

- All authenticated users land in the same room.
- No channel switching or selection needed.

### 3.3 Real-Time Messaging
- Users send messages to the General chat room.
- Messages are broadcast in real-time to all connected users via Socket.IO.
- Messages are persisted to PostgreSQL.
- Each message displays: sender name, timestamp, and message content.
- All message content is **sanitized on the server before persistence and broadcast** to prevent XSS. Use `sanitize-html` configured to strip ALL HTML tags. Messages are plain text only.
- Messages are displayed in the classic WoW chat log format:
  ```
  [General] [Legolasxxx]: where is mankrik's wife
  ```

### 3.4 Chat History
- On page load, the most recent 50 messages are fetched from the database.
- "Load more" button to fetch older messages.
- Pagination uses **cursor-based** params: `GET /api/messages?cursor=<ISO_DATETIME>&limit=50`. The cursor is the `createdAt` value of the oldest message in the current batch. The response includes a `nextCursor` value (or `null` if no more messages).

### 3.5 User Presence
- Show a count or list of online users.
- Broadcast join/leave events:
  ```
  [Legolasxxx] has joined [General].
  ```

### 3.6 WoW-Themed UI with Day/Night Modes
- All UI components are built with **shadcn/ui** (Radix primitives + Tailwind). Use shadcn components instead of native HTML elements.
- Two visual themes inspired by the Barrens zone cycle:
  - **Day** — sun-scorched savanna: warm sand backgrounds, gold/amber text, bright UI accents.
  - **Night** — moonlit Barrens: dark backgrounds, cool blue-purple tints, muted gold text.
- Theme toggle in the UI (sun/moon icon). Preference persisted to `localStorage`.
- Implemented via the **shadcn-recommended custom ThemeProvider** pattern for Vite. The provider toggles a `.dark` class on `<html>`, which swaps CSS custom properties between day (`:root`) and night (`.dark`) values. All shadcn components and custom styles respond to these variables automatically.
- A blocking `<script>` in `index.html` reads the theme from `localStorage` before paint to prevent FOUC (flash of wrong theme).
- Classic fantasy font for the header/logo (e.g., "LifeCraft" font or similar free alternative).
- Chat log styled as a scrolling text feed, not modern chat bubbles.
- User avatars pulled from Discord displayed as small icons next to messages.

---

## 4. Stretch Features

### 4.1 AI-Generated NPC Chatters
- Bot users that periodically post messages in General, simulating the classic Barrens experience.
- Powered by the Anthropic Claude API (`@anthropic-ai/sdk`).
- NPCs have persistent personas stored in the database (name, personality archetype).
- Example NPC archetypes and their system prompts:

  **The Noob** (`npc_name: "Legolasxxx"`):
  ```
  You are a clueless WoW noob in Barrens chat circa 2006. You ask basic questions
  constantly: where to go, how to train, why you keep dying. You type in lowercase
  with bad grammar. Never break character. Keep messages under 100 characters.
  Examples: "how do i get to orgrimmar", "where do i train fishing", "why is everything so far away"
  ```

  **The Chuck Norris Guy** (`npc_name: "Chuckfacts"`):
  ```
  You are a WoW player in Barrens chat circa 2006 who ONLY posts Chuck Norris facts.
  Every message is a Chuck Norris joke in the classic format. Keep it PG-13.
  Never break character. One fact per message, under 120 characters.
  Examples: "Chuck Norris doesn't need a hearthstone. Azeroth comes to him."
  ```

  **The Guild Recruiter** (`npc_name: "Recruitron"`):
  ```
  You are an overly enthusiastic guild recruiter in Barrens chat circa 2006.
  You spam recruitment messages for your guild "<DARK LEGACY>" which is always
  "recruiting all classes". You promise things like "we have tabard" and "bank tabs".
  Keep messages under 150 characters.
  ```

- NPCs post at randomized intervals (every 30–120 seconds) to keep chat lively.
- NPC messages are generated via a single Claude API call with the persona's system prompt and the last 10 messages as context.
- NPC messages are visually distinguished (slightly different name color or a small bot icon).

### 4.2 Chat Commands
- `/who` — List online users.
- `/played` — Returns a joke "time played" stat.
- `/dance` — Emote: "[Username] dances."
- `/yell [message]` — Posts the message in ALL CAPS with a different color.

### 4.3 Message Reactions
- Simple emoji reactions on messages (Horde icon, Alliance icon, skull, kek).

### 4.4 Rate Limiting
- Per-user message rate limiting to prevent spam (e.g., max 5 messages per 10 seconds).
- Implemented as custom Socket.IO middleware using an in-memory token bucket per socket.

---

## 5. Data Models

### User
```
User
├── id            UUID (PK, default auto-generated)
├── discordId     String (unique)
├── username      String
├── avatarUrl     String (nullable)
├── createdAt     DateTime (default now)
└── updatedAt     DateTime (auto-updated)
```

### Message
```
Message
├── id            UUID (PK)
├── content       String (max 500 chars)
├── createdAt     DateTime (default now, indexed for cursor pagination)
├── userId        UUID (FK → User, nullable for system messages)
├── isNpc         Boolean (default false)
├── npcName       String (nullable, for NPC messages)
└── messageType   Enum: TEXT | EMOTE | YELL | SYSTEM
```

### NpcPersona (Stretch)
```
NpcPersona
├── id            UUID (PK)
├── name          String (e.g., "Chuckfacts")
├── archetype     String (e.g., "chuck_norris_guy")
├── systemPrompt  String (Claude system prompt for this NPC)
└── isActive      Boolean (default true)
```

### Prisma Schema Notes
- The `Message.createdAt` field MUST have a `@db.Timestamptz` annotation and a database index (`@@index([createdAt])`) for efficient cursor-based pagination.
- Prisma 7 requires the generator to use `provider = "prisma-client"` with an explicit `output` path set to `../src/generated/prisma`.
- The generated Prisma client is output to `server/src/generated/prisma/` and is **gitignored** (regenerated on install via `prisma generate`).

---

## 6. API Endpoints

### Auth
| Method | Route                    | Description                      |
|--------|--------------------------|----------------------------------|
| GET    | `/auth/discord`          | Redirects to Discord OAuth       |
| GET    | `/auth/discord/callback` | Handles OAuth callback, sets JWT |
| POST   | `/auth/logout`           | Clears session cookie            |
| GET    | `/auth/me`               | Returns current user info        |

### Messages
| Method | Route            | Description                                    |
|--------|------------------|------------------------------------------------|
| GET    | `/api/messages`  | Paginated message history (`?cursor=&limit=50`) |

**Query params for `GET /api/messages`:**
- `cursor` (optional): ISO 8601 datetime string. Returns messages older than this timestamp.
- `limit` (optional, default `50`, max `100`): Number of messages to return.

**Response shape:**
```json
{
  "messages": [ ... ],
  "nextCursor": "2026-02-17T10:30:00.000Z" | null
}
```

> Message creation happens exclusively through Socket.IO events, not REST.

All routes under `/api/*` and `/auth/me` require a valid JWT cookie. Return `401` with `{ error: "Unauthorized" }` if missing or expired.

### Health Check
| Method | Route      | Description         |
|--------|------------|---------------------|
| GET    | `/health`  | Server health check |

The health check route is **not** auto-loaded from the `routes/` directory. It is registered directly in `app.ts` to ensure it is always available regardless of autoload configuration.

---

## 7. Socket.IO Events

### Typed Event Interfaces

All Socket.IO events are typed using Socket.IO's four-interface pattern. These types live in `shared/types/socket-events.ts` and are used by both client and server:

```ts
export interface ServerToClientEvents {
  'message:new': (message: MessagePayload) => void
  'user:joined': (user: UserPayload) => void
  'user:left': (user: UserPayload) => void
  'users:list': (data: { users: UserPayload[]; count: number }) => void
  'error': (error: { code: ErrorCode; message: string }) => void
}

export interface ClientToServerEvents {
  'message:send': (data: { content: string; messageType: MessageType }) => void
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string
  username: string
}
```

### Client → Server
| Event              | Payload                        | Description                     |
|--------------------|--------------------------------|---------------------------------|
| `message:send`     | `{ content, messageType }`     | User sends a message            |

### Server → Client
| Event              | Payload                              | Description                         |
|--------------------|--------------------------------------|-------------------------------------|
| `message:new`      | `{ message }` (full message object)  | New message in the chat             |
| `user:joined`      | `{ user }`                           | A user came online                  |
| `user:left`        | `{ user }`                           | A user went offline                 |
| `users:list`       | `{ users[], count }`                 | Current online users (sent on connect) |

### Connection Lifecycle
- On connect: authenticate via JWT passed as a Socket.IO `auth` handshake option. Auto-join the General room. If JWT is invalid or expired, **reject the connection** with an error event and the client should redirect to login.
- On disconnect: broadcast `user:left` and update presence.

### Error Events
| Event              | Payload                        | Description                         |
|--------------------|--------------------------------|-------------------------------------|
| `error`            | `{ code, message }`           | Server-side error (auth fail, rate limit, validation) |

Error codes: `AUTH_FAILED`, `RATE_LIMITED`, `VALIDATION_ERROR`, `INTERNAL_ERROR`.

---

## 8. CORS Configuration

The client (Vite dev server) runs on `http://localhost:5173` and the server (Fastify) runs on `http://localhost:3000`. CORS must be configured on **both** Fastify and Socket.IO:

**Fastify** (via `@fastify/cors`):
```ts
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST'],
})
```

**Socket.IO** (passed during server creation):
```ts
const io = new SocketIOServer(fastify.server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
```

The `credentials: true` setting is **critical** — without it, cookies (and therefore JWT auth) will not work cross-origin.

**Production note**: In production, Fastify serves the client's static build files via `@fastify/static`, so CORS is not needed (same origin). The CORS config should only apply when `FRONTEND_URL` differs from the server's own origin, which is only during local development.

---

## 9. Error Handling Strategy

### Server-Side
- **Custom error classes**: Use `@fastify/error` to define typed, reusable error classes (e.g., `NotFoundError`, `UnauthorizedError`) in `server/src/errors/index.ts`.
- **Global error handler**: A Fastify plugin in `plugins/error-handler.ts` registers a `setErrorHandler` that catches all errors, logs them, and returns a consistent JSON response shape.
- **Socket.IO disconnects**: The client auto-reconnects (Socket.IO default behavior). On reconnect, re-verify JWT and re-emit `users:list`.
- **Failed DB writes**: Log the error, emit an `error` event to the sender with code `INTERNAL_ERROR`. Do NOT broadcast the message if persistence fails.
- **Expired JWT (REST)**: Return `401 { error: "Unauthorized", code: "TOKEN_EXPIRED" }`. The client should redirect to `/login`.
- **Expired JWT (Socket.IO handshake)**: Reject the connection. The client should catch the `connect_error` event and redirect to login.
- **Discord OAuth failures**: Redirect to the login page with a `?error=auth_failed` query param. The login page displays a user-friendly error message.
- **Malformed message content**: Validate via TypeBox schema in the Socket.IO handler. Reject with `VALIDATION_ERROR` if content is empty, exceeds 500 chars, or contains only whitespace.

### Client-Side
- **Socket.IO `connect_error`**: If error indicates auth failure, redirect to login. Otherwise, show a "reconnecting..." indicator in the UI.
- **API 401 responses**: Clear local auth state, redirect to login.
- **Network errors**: Show a toast/banner indicating connection issues.

---

## 10. Input Sanitization & Security

- **XSS prevention**: All message content is sanitized server-side before persistence using `sanitize-html` configured to strip ALL HTML tags (plain text only). Messages are rendered in the frontend using React's default text escaping (no `dangerouslySetInnerHTML`).
- **Message length**: Server enforces a 500-character maximum via TypeBox schema validation. Client also enforces this with a character counter in the input field.
- **Rate limiting**: Socket.IO middleware tracks messages per user with a sliding window (5 messages per 10 seconds). Exceeding the limit emits a `RATE_LIMITED` error and drops the message.
- **JWT secret**: Use a cryptographically random string of at least 32 bytes. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

---

## 11. Project Structure

```
barrens-chat/
├── .github/
│   └── workflows/
│       ├── ci.yml                      # Lint + type-check + test on every PR
│       └── deploy.yml                  # Deploy to Railway on merge to main
├── shared/                             # Shared TypeScript types (client + server)
│   ├── types/
│   │   ├── socket-events.ts            # Socket.IO typed event interfaces
│   │   ├── message.ts                  # MessageType enum, MessagePayload, etc.
│   │   └── user.ts                     # UserPayload shape (what the client sees)
│   └── tsconfig.json
├── client/                             # React frontend (Vite + TypeScript + shadcn/ui)
│   ├── src/
│   │   ├── features/                  # Feature modules (colocation pattern)
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   │   └── LoginButton.tsx     # Discord OAuth trigger
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useAuth.ts          # Auth state + API calls
│   │   │   │   ├── context/
│   │   │   │   │   └── AuthContext.tsx      # Auth state provider
│   │   │   │   ├── services/
│   │   │   │   │   └── auth.ts             # Auth API calls (login, logout, me)
│   │   │   │   └── types/
│   │   │   │       └── auth.ts             # Auth-specific types
│   │   │   ├── chat/
│   │   │   │   ├── components/
│   │   │   │   │   ├── ChatLog.tsx         # Main scrolling chat display
│   │   │   │   │   ├── ChatInput.tsx       # Message input bar + char counter
│   │   │   │   │   ├── MessageLine.tsx     # Single chat message row
│   │   │   │   │   └── ConnectionStatus.tsx # Reconnecting / error indicator
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useMessages.ts      # Message state + history loading
│   │   │   │   │   └── useSocket.ts        # Socket.IO connection + events
│   │   │   │   ├── context/
│   │   │   │   │   └── SocketContext.tsx    # Socket.IO provider
│   │   │   │   └── services/
│   │   │   │       └── messages.ts         # Message history API calls
│   │   │   ├── presence/
│   │   │   │   ├── components/
│   │   │   │   │   └── UserList.tsx        # Online users panel
│   │   │   │   └── hooks/
│   │   │   │       └── usePresence.ts      # Online users state
│   │   │   └── theme/
│   │   │       └── components/
│   │   │           ├── ThemeProvider.tsx    # shadcn-style day/night provider + useTheme
│   │   │           └── ThemeToggle.tsx     # Sun/moon toggle button
│   │   ├── shared/                    # Shared across features
│   │   │   ├── components/
│   │   │   │   └── ui/               # shadcn/ui components (Button, Input, etc.)
│   │   │   ├── hooks/                # Reusable hooks (useLocalStorage, etc.)
│   │   │   ├── layouts/              # Layout components (ChatLayout, etc.)
│   │   │   └── services/
│   │   │       └── api.ts            # REST API client (typed fetch wrapper)
│   │   ├── pages/                     # Route-level page components
│   │   │   ├── Chat.tsx              # Main chat page (protected)
│   │   │   └── Login.tsx             # Login / landing page
│   │   ├── lib/
│   │   │   ├── utils.ts              # cn() utility (clsx + tailwind-merge)
│   │   │   └── socket.ts             # Socket.IO client instance (typed)
│   │   ├── styles/
│   │   │   └── index.css             # @import "tailwindcss", @theme inline, :root/.dark vars
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── public/
│   │   └── fonts/                     # Fantasy fonts (e.g., LifeCraft)
│   ├── .env                           # VITE_API_URL, VITE_SOCKET_URL (git-ignored)
│   ├── index.html                     # Includes anti-FOUC script for theme
│   ├── components.json                # shadcn/ui configuration
│   ├── vite.config.ts
│   ├── tsconfig.json                  # Extends ../tsconfig.base.json
│   └── package.json
├── server/                             # Fastify backend (TypeScript, ESM)
│   ├── src/
│   │   ├── plugins/                   # Fastify plugins (autoloaded, globally available)
│   │   │   ├── prisma.ts              # Prisma client lifecycle + FastifyInstance decorator
│   │   │   ├── auth.ts                # JWT + cookie plugin + request decorator
│   │   │   ├── cors.ts                # @fastify/cors configuration
│   │   │   ├── socketio.ts            # Socket.IO server creation + FastifyInstance decorator
│   │   │   └── error-handler.ts       # Global setErrorHandler
│   │   ├── routes/                    # Fastify routes (autoloaded, dir-prefixed)
│   │   │   ├── auth/
│   │   │   │   ├── index.ts           # /auth/* routes (discord, callback, logout, me)
│   │   │   │   └── schema.ts          # TypeBox schemas for auth routes
│   │   │   └── api/
│   │   │       └── messages/
│   │   │           ├── index.ts       # GET /api/messages (cursor pagination)
│   │   │           └── schema.ts      # TypeBox schemas for message routes
│   │   ├── socket/                    # Socket.IO event handlers (NOT autoloaded)
│   │   │   ├── index.ts              # Connection orchestrator: onConnection, registers handlers
│   │   │   └── handlers/
│   │   │       ├── message.handler.ts # message:send handler
│   │   │       └── presence.handler.ts # join/leave/disconnect handlers
│   │   ├── services/                  # Business logic (framework-agnostic)
│   │   │   ├── chat.ts               # Message sanitization, validation, persistence
│   │   │   ├── presence.ts           # Online user tracking (in-memory Set)
│   │   │   └── npc.ts                # NPC message generation (stretch)
│   │   ├── schemas/                   # Shared TypeBox schemas
│   │   │   └── common.ts             # Pagination, error response schemas
│   │   ├── errors/
│   │   │   └── index.ts              # @fastify/error custom error classes
│   │   ├── types/
│   │   │   └── fastify.d.ts          # declare module 'fastify' augmentation
│   │   ├── config/
│   │   │   └── env.ts                # Environment variable validation + typed config
│   │   ├── generated/                 # Prisma generated client (gitignored)
│   │   │   └── prisma/
│   │   ├── app.ts                    # Fastify factory: registers autoload for plugins + routes
│   │   └── server.ts                 # Entry point: imports app, calls listen(), graceful shutdown
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema
│   │   ├── seed.ts                   # Seed NPC personas (stretch)
│   │   └── migrations/
│   ├── prisma.config.ts              # Prisma 7 CLI configuration (REQUIRED)
│   ├── .env                          # Server env vars (git-ignored)
│   ├── tsconfig.json                 # Extends ../tsconfig.base.json
│   └── package.json                  # Must include "type": "module"
├── tsconfig.base.json                # Shared TS compiler options
├── package.json                      # Root: npm workspaces + concurrently scripts
├── .nvmrc                            # Contains "22" for Node version
├── .env.example                      # Documented env var template (safe to commit)
├── .gitignore                        # .env, node_modules/, dist/, server/src/generated/
├── README.md
└── docker-compose.yml                # PostgreSQL 17 for local dev
```

### Structure Rationale

**Root `package.json` with npm workspaces**: Defines `workspaces: ["client", "server", "shared"]`. Provides unified scripts via `concurrently` — a single `npm run dev` starts both client and server. This eliminates the "open two terminals" problem.

**`shared/` directory**: TypeScript's biggest win in a full-stack project is shared types. Socket.IO event names, payload shapes, message type enums, and user shapes are defined once and imported by both client and server. This prevents string literal drift and catches contract mismatches at compile time.

**`server/src/plugins/`**: Autoloaded by `@fastify/autoload` with `encapsulate: false`. Each plugin is wrapped with `fastify-plugin` so its decorators (e.g., `fastify.prisma`, `fastify.io`) are globally available to all routes.

**`server/src/routes/`**: Autoloaded by `@fastify/autoload` with `dirNameRoutePrefix: true`. Directory names become route prefixes automatically (`routes/auth/` → `/auth`, `routes/api/messages/` → `/api/messages`). Each route directory contains an `index.ts` (route definitions) and `schema.ts` (TypeBox schemas for that route).

**`server/src/socket/`**: Socket.IO handlers are **not** REST routes — they don't belong in `routes/`. They are organized separately with a connection orchestrator (`index.ts`) that registers per-domain handler files. Called after `app.ready()` in `server.ts`.

**`server/src/services/`**: Framework-agnostic business logic. Services accept a `PrismaClient` parameter (dependency injection) rather than importing a global instance. This makes them testable without spinning up Fastify.

**`server/src/types/fastify.d.ts`**: Centralizes all `declare module 'fastify'` augmentations. When you decorate `fastify.prisma` or `fastify.io`, TypeScript needs declaration merging to know about the new properties. All augmentations live in one file for discoverability.

**`app.ts` / `server.ts` split**: `app.ts` is a factory that builds and returns a `FastifyInstance` (exported for testing). `server.ts` imports the factory, calls `listen()`, and handles graceful shutdown. This separation is critical for testability — tests can import `app.ts` without binding to a port.

### Client Architecture: Feature-Based Colocation

The client uses a **feature-based directory structure** with colocation — all code related to a feature lives together in `features/[feature]/`. This pattern scales better than grouping by type (`components/`, `hooks/`, `services/`) because adding or modifying a feature means working within a single directory rather than touching files scattered across the tree.

**`client/src/features/`**: Each feature is a self-contained module with its own `components/`, `hooks/`, `context/`, `services/`, and `types/` subdirectories. Only create subdirectories that are needed — not every feature needs all of them. The four features are:
- **`auth/`** — Login button, auth state context, useAuth hook, auth API service.
- **`chat/`** — ChatLog, ChatInput, MessageLine, ConnectionStatus, socket context, useMessages/useSocket hooks, message API service.
- **`presence/`** — UserList component, usePresence hook.
- **`theme/`** — shadcn-style ThemeProvider, ThemeToggle component.

**`client/src/shared/`**: Code used across multiple features. Always check `shared/` first before creating new implementations.
- **`shared/components/ui/`** — shadcn/ui component files. Added via `pnpm dlx shadcn@latest add <component>`. These are owned source files, not node_modules.
- **`shared/hooks/`** — Reusable hooks not tied to a specific feature (e.g., `useLocalStorage`).
- **`shared/layouts/`** — Layout components (e.g., `ChatLayout` wrapping the main chat page).
- **`shared/services/api.ts`** — Typed fetch wrapper used by feature-specific services.

**`client/src/pages/`**: Route-level page components. Pages compose feature components — they are thin wrappers, not business logic. `Chat.tsx` imports from `features/chat/`, `features/presence/`, and `features/theme/`. `Login.tsx` imports from `features/auth/`.

**`client/src/lib/`**: Third-party library configurations. `utils.ts` contains the `cn()` utility (clsx + tailwind-merge) required by shadcn components. `socket.ts` creates and exports the typed Socket.IO client instance.

**`components.json`**: shadcn/ui configuration file. Tells the CLI where to put components, which path aliases to use, and that this is a Vite project (`rsc: false`). The `ui` alias points to `@/shared/components/ui`.

**Key rule**: Use shadcn/ui components instead of native HTML elements. Prefer existing `shared/` logic before creating new implementations in features.

---

## 12. Implementation Phases

### Phase 1: Foundation
1. Create root `package.json` with npm workspaces (`client`, `server`, `shared`). Add `concurrently` as a root dev dependency. Define `npm run dev` script.
2. Create `tsconfig.base.json` at root with shared compiler options (`strict: true`, `target: "ES2022"`, `module: "Node16"`, `moduleResolution: "Node16"`).
3. Initialize `server/` directory: `package.json` with `"type": "module"`, `tsconfig.json` extending base. Install Fastify, `@fastify/autoload`, `@fastify/type-provider-typebox`, `@sinclair/typebox`, `@fastify/error`, `fastify-plugin`, `tsx`.
4. Create `server/src/app.ts` (Fastify factory with autoload for `plugins/` and `routes/`) and `server/src/server.ts` (entry point). Add a health check route directly in `app.ts`.
5. Add `.nvmrc` with `22`.
6. Set up PostgreSQL 17 via Docker Compose (see section 15).
7. Configure Prisma 7: create `prisma.config.ts`, define `schema.prisma` with `prisma-client` provider and `output = "../src/generated/prisma"`, install `@prisma/adapter-pg` and `pg`, run initial migration.
8. Initialize `shared/` directory: `package.json`, `tsconfig.json`, stub type files.
9. Initialize `client/` directory: `npm create vite@latest` with React + TypeScript template. Install `@tailwindcss/vite` and `tw-animate-css`. Configure `vite.config.ts` with React + Tailwind plugins and `@` path alias. Set up `styles/index.css` with `@import "tailwindcss"`.
10. Run `pnpm dlx shadcn@latest init` in client directory. Configure `components.json` with `rsc: false`, style `new-york`, and aliases pointing `ui` to `@/shared/components/ui`. This generates the global CSS variables (OKLCH), `@theme inline` block, and `lib/utils.ts` with `cn()`.
11. Scaffold feature-based directory structure: `features/auth/`, `features/chat/`, `features/presence/`, `features/theme/`, `shared/`, `pages/`, `lib/`.
12. Configure `@fastify/cors` in a `plugins/cors.ts` for the client origin (`http://localhost:5173`, `credentials: true`).

### Phase 2: Authentication
1. Register a Discord application and configure OAuth2 redirect URIs.
2. Implement Discord OAuth flow in Fastify routes (`routes/auth/index.ts`): redirect → callback → JWT.
3. JWT config: sign with HS256, 7-day expiry, stored in httpOnly secure cookie. Register via `plugins/auth.ts`.
4. Create auth middleware (`onRequest` hook) for protected routes, decorated onto `FastifyRequest`.
5. Define TypeBox schemas for auth route responses (`routes/auth/schema.ts`).
6. Build login page (`pages/Login.tsx`) using shadcn Button component. Create `features/auth/components/LoginButton.tsx`.
7. Implement `features/auth/context/AuthContext.tsx` with provider and `useAuth` hook. Create `features/auth/services/auth.ts` for API calls. Add protected route wrapper in `App.tsx`.
8. Handle auth errors: redirect to login on 401, show error on OAuth failure.

### Phase 3: Real-Time Chat (Core Loop)
1. Create `plugins/socketio.ts`: manually attach Socket.IO to Fastify's HTTP server with typed event interfaces from `shared/`. Decorate `fastify.io`.
2. Create `server/src/socket/index.ts` connection orchestrator and `handlers/message.handler.ts`.
3. Implement Socket.IO authentication middleware (verify JWT from `auth` handshake) in the connection orchestrator.
4. Build `message:send` handler: validate content (TypeBox schema + length), sanitize HTML, persist to DB via `ChatService`, broadcast.
5. Create `features/chat/context/SocketContext.tsx` and `features/chat/hooks/useSocket.ts` for client-side connection management.
6. Build chat UI components in `features/chat/components/`: `ChatLog.tsx`, `ChatInput.tsx`, `MessageLine.tsx` using shadcn primitives.
7. Wire up real-time message display.
8. Add `features/chat/components/ConnectionStatus.tsx` for reconnection feedback.

### Phase 4: History & Presence
1. Implement `GET /api/messages` with cursor-based pagination using TypeBox schemas (`routes/api/messages/`).
2. Create `features/chat/hooks/useMessages.ts` for message state, history loading, and real-time appending. Create `features/chat/services/messages.ts` for the API call.
3. Implement "Load more" button wired to cursor pagination using shadcn Button.
4. Implement `PresenceService` for online user tracking (in-memory `Map<string, UserPayload>`).
5. Create `handlers/presence.handler.ts` for join/leave/disconnect Socket.IO events.
6. Create `features/presence/hooks/usePresence.ts` and build `features/presence/components/UserList.tsx`.

### Phase 5: WoW Theming & Polish
1. Customize the shadcn-generated CSS custom properties in `styles/index.css`. Override `:root` with day-theme WoW colors (warm golds, sandy backgrounds in OKLCH) and `.dark` with night-theme colors (dark blues, moonlit purples in OKLCH). Use `@theme inline` to register them as Tailwind utilities.
2. Build `features/theme/components/ThemeProvider.tsx` using the shadcn-recommended custom provider pattern (~60 lines: React context, `useTheme` hook, `localStorage` persistence, `.dark` class toggle on `<html>`).
3. Build `features/theme/components/ThemeToggle.tsx` — sun/moon icon toggle using shadcn Button and DropdownMenu.
4. Add anti-FOUC blocking `<script>` to `index.html` that reads theme from `localStorage` before React mounts.
5. Style messages in the classic WoW chat log format for both themes.
6. Add emotes and `/yell` formatting.
7. Add subtle visual touches: login screen with Barrens landscape, Horde emblem, etc.

### Phase 6: Stretch — NPC Bots
1. Create `NpcPersona` model in Prisma schema and seed 3 personas (`prisma/seed.ts`) — see section 4.1 for system prompts.
2. Build `NpcService` (`services/npc.ts`): on a timer, select a random active NPC, generate a message via Claude API with the persona's system prompt and last 10 messages as context, and emit it through Socket.IO.
3. Add visual distinction for NPC messages in the frontend (both day and night themes).
4. Tune timing and variety so NPCs feel organic, not spammy.

### Phase 7: CI/CD & Deployment
1. Initialize the public GitHub repository. Add `.gitignore` (must include `.env`, `node_modules/`, `dist/`, `server/src/generated/`).
2. Set up ESLint in both `client/` and `server/` with `eslint.config.ts` (flat config, ESM). Add `typescript-eslint` for TS-aware linting.
3. Add `npm run typecheck` scripts (`tsc --noEmit`) in both client and server.
4. Add `npm test` script in `server/` (Vitest for unit tests on ChatService and PresenceService).
5. Create `.github/workflows/ci.yml` — lint + typecheck + test on every PR (see section 17).
6. Set up Railway project: create a single web service (server serves both API and client static files) and a PostgreSQL plugin.
7. Configure all environment variables in Railway dashboard.
8. Connect Railway to the GitHub repo for auto-deploy on push to `main` (or set up `deploy.yml` workflow with `RAILWAY_TOKEN`).
9. Update Discord OAuth redirect URI to the production Railway URL.
10. Verify WebSocket connections work end-to-end on the Railway URL.
11. Enable branch protection on `main`: require CI to pass, require at least 1 PR review.

### Phase 8: Stretch — Commands & Reactions
1. Parse messages starting with `/` and route to command handlers.
2. Implement `/who`, `/played`, `/dance`, `/yell`.
3. Add reaction UI (click to react on a message) and persist reactions.

---

## 13. Environment Variables

### Server (`server/.env` — git-ignored)
```env
DATABASE_URL=postgresql://barrens:barrens@localhost:5432/barrens_chat
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
JWT_SECRET=generate_with_crypto_randomBytes_32
FRONTEND_URL=http://localhost:5173
PORT=3000
NODE_ENV=development

# Stretch: AI NPCs
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Client (`client/.env` — git-ignored)
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### Production (Railway — set via Railway dashboard or CLI)
```env
# Auto-provided by Railway PostgreSQL plugin:
DATABASE_URL=<auto-injected by Railway>

# Set manually in Railway service variables:
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=https://your-app.up.railway.app/auth/discord/callback
JWT_SECRET=generate_with_crypto_randomBytes_32
FRONTEND_URL=https://your-app.up.railway.app
PORT=3000
NODE_ENV=production

ANTHROPIC_API_KEY=your_anthropic_api_key

# Client env vars are baked at build time:
VITE_API_URL=https://your-app.up.railway.app
VITE_SOCKET_URL=https://your-app.up.railway.app
```

### Environment Validation
The server validates all required environment variables at startup in `server/src/config/env.ts` using TypeBox. If any required variable is missing, the server fails fast with a clear error message. This prevents runtime crashes from missing config.

```ts
// server/src/config/env.ts
import { Type, Static } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

const EnvSchema = Type.Object({
  DATABASE_URL: Type.String(),
  DISCORD_CLIENT_ID: Type.String(),
  DISCORD_CLIENT_SECRET: Type.String(),
  DISCORD_REDIRECT_URI: Type.String(),
  JWT_SECRET: Type.String({ minLength: 32 }),
  FRONTEND_URL: Type.String(),
  PORT: Type.String({ default: '3000' }),
  NODE_ENV: Type.Union([
    Type.Literal('development'),
    Type.Literal('production'),
    Type.Literal('test'),
  ], { default: 'development' }),
})

export type Env = Static<typeof EnvSchema>

export function loadEnv(): Env {
  return Value.Decode(EnvSchema, process.env)
}
```

Note: `JWT_SECRET` is the only secret used for both cookie signing and JWT signing. `@fastify/jwt` handles both. **Never commit secrets to the repo** — `.env` files must be in `.gitignore`.

---

## 14. Key Technical Decisions & Notes

- **TypeScript throughout**: All source code (client, server, shared) uses TypeScript. This provides type safety from database (Prisma generated types) to API (TypeBox schemas) to frontend (shared type imports). The learning cost is offset by catching bugs at compile time and getting full autocompletion.
- **Feature-based client architecture**: The client uses a colocation pattern — all code for a feature lives in `features/[feature]/` with its own `components/`, `hooks/`, `context/`, `services/`, and `types/`. Shared UI primitives (shadcn) and cross-feature utilities live in `shared/`. This scales better than flat type-based grouping and keeps related code together.
- **shadcn/ui for all UI components**: shadcn copies component source files into the project — you own and can customize them. All components use CSS custom properties for theming, making the day/night theme automatic. Use shadcn components instead of native HTML elements. Requires `clsx` + `tailwind-merge` for the `cn()` utility.
- **shadcn-recommended ThemeProvider over `next-themes`**: `next-themes` technically works in Vite but emits `next` peer dependency warnings and requires manual FOUC workarounds. shadcn's own Vite docs recommend a custom ThemeProvider (~60 lines) that provides the identical API (`useTheme`, `setTheme`, localStorage persistence) with zero external dependencies. This is the approach used.
- **Day/Night theme via CSS custom properties**: `:root` defines day-theme OKLCH colors (warm golds, sandy backgrounds). `.dark` overrides with night-theme colors (dark blues, moonlit purples). All shadcn components and custom styles respond to these variables automatically via Tailwind utilities. A blocking `<script>` in `index.html` prevents FOUC.
- **No TanStack Query**: The app has only 2 GET endpoints (`/auth/me` and `/api/messages`). All real-time data flows through Socket.IO, not REST. TanStack Query's strengths (cache deduplication, background refetching) don't apply. The Socket.IO `message:new` event needs to append directly to message state — fighting TanStack Query's paginated cache structure adds complexity for no benefit. Custom hooks with `useState` + cursor tracking are simpler and sufficient. Revisit if stretch features add more REST endpoints.
- **TypeBox over Zod for Fastify schemas**: `@fastify/type-provider-typebox` is the officially maintained Fastify type provider. TypeBox produces JSON Schema natively (no conversion layer), works directly with Fastify's built-in Ajv validator, and is faster than Zod (no deep cloning). One schema definition gives both runtime validation and TypeScript types.
- **`@fastify/autoload` for plugin and route discovery**: Convention-based auto-loading eliminates manual `app.register()` calls. Plugins in `plugins/` are globally available; routes in `routes/` are auto-prefixed by directory name. This is the standard Fastify project pattern.
- **Shared types package**: Socket.IO event names, message type enums, and payload shapes are defined once in `shared/` and imported by both client and server. This eliminates string literal duplication and catches contract mismatches at compile time.
- **Prisma 7 with `prisma-client` provider**: The new Rust-free client is faster and simpler to deploy. Requires `@prisma/adapter-pg` as a driver adapter for PostgreSQL. Generated output goes to `src/generated/prisma/` (gitignored, regenerated on install).
- **Tailwind v4 CSS-first config with OKLCH**: No `tailwind.config.js`. Theme customization happens in CSS via `@theme inline` blocks. Colors use OKLCH (perceptually uniform) instead of HSL. `tw-animate-css` replaces `tailwindcss-animate` for v4.
- **JWT in httpOnly cookies over localStorage**: More secure against XSS. `@fastify/cookie` and `@fastify/jwt` work together — `@fastify/jwt` can read tokens from cookies directly when configured with `cookie: { cookieName: 'token', signed: false }`.
- **Manual Socket.IO integration over `fastify-socket.io` plugin**: The plugin doesn't officially support Fastify 5. Manual attachment is straightforward and avoids a compatibility risk. Socket.IO handlers are organized in a separate `socket/` directory with typed event interfaces.
- **Single Socket.IO room**: All connected users are auto-joined to a single "general" room on connect. Simple and clean.
- **In-memory presence**: Online user tracking uses a `Map<string, UserPayload>` for speed. If scaling to multiple server instances later, swap to Redis.
- **Message pagination via cursor, not offset**: Use `createdAt` cursor-based pagination for message history. Offset pagination degrades on append-heavy tables.
- **`@fastify/error` for error classes**: Provides typed, reusable error classes with HTTP status codes. Combined with a global `setErrorHandler` for consistent error response shapes.
- **ESM throughout**: Both client (Vite default) and server (Prisma 7 requirement) use ES modules. No CommonJS.
- **Single-service Railway deployment**: In production, Fastify serves the client's built static files via `@fastify/static`. This means one Railway web service instead of two — simpler deployment, no CORS in production, one billing unit.
- **Railway for deployment**: Native WebSocket support without transport quirks, usage-based billing for low-traffic side projects, one-click PostgreSQL plugin with auto-injected `DATABASE_URL`, and Git-based deploys.
- **GitHub Actions over Railway's native CI**: While Railway can auto-deploy from GitHub, using GitHub Actions gives explicit control — gating deploys behind passing lint, type-checking, and tests, with a clear PR-based workflow.

---

## 15. Docker Compose (Local Development)

```yaml
services:
  postgres:
    image: postgres:17
    container_name: barrens-postgres
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: barrens
      POSTGRES_PASSWORD: barrens
      POSTGRES_DB: barrens_chat
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Run with `docker compose up -d`. The `pgdata` volume persists data across container restarts.

---

## 16. Railway Deployment

### Architecture on Railway
The app deploys as **two Railway services** within a single Railway project:

| Service        | Type        | Source            | Notes                                           |
|----------------|-------------|-------------------|-------------------------------------------------|
| `server`       | Web Service | `server/` dir     | Fastify + Socket.IO + serves client static build |
| `postgres`     | Plugin      | Railway Postgres   | Managed PostgreSQL, auto-injects `DATABASE_URL`  |

In production, Fastify serves the client's built static files via `@fastify/static`. This eliminates the need for a separate client service and removes CORS from the production equation.

### Railway Configuration

**Server service:**
- **Root directory**: `server`
- **Build command**: `npm install && npx prisma generate && npx prisma migrate deploy && cd ../client && npm install && npm run build`
- **Start command**: `node dist/server.js`
- **Health check path**: `/health`
- Link the PostgreSQL plugin so `DATABASE_URL` is auto-injected.
- Set all other env vars (Discord credentials, JWT secret, `FRONTEND_URL` matching the server's own URL, `VITE_API_URL`, `VITE_SOCKET_URL`, etc.) in the Railway dashboard.
- The server's `app.ts` registers `@fastify/static` to serve `../client/dist/` when `NODE_ENV=production`.

**PostgreSQL plugin:**
- One-click add from Railway's plugin menu. The `DATABASE_URL` env var is auto-populated on linked services.

### Socket.IO Transport on Railway
Railway handles WebSocket upgrades natively. To avoid unnecessary long-polling negotiation, configure the client to prefer WebSocket transport:
```ts
const socket: TypedSocket = io(import.meta.env.VITE_SOCKET_URL, {
  transports: ['websocket'],
  withCredentials: true,
})
```

### Custom Domain (Optional)
Railway provides a `*.up.railway.app` subdomain by default. A custom domain can be added later via the Railway dashboard with automatic SSL.

---

## 17. CI/CD Pipeline (GitHub Actions)

### Repository Setup
- The repo is **public** on GitHub.
- Branch protection on `main`: require PR reviews, require CI checks to pass before merge.
- Secrets stored in GitHub repo settings (Settings → Secrets → Actions): `RAILWAY_TOKEN`.

### Workflow: CI (`ci.yml`)
Runs on every pull request and push to `main`. Purpose: lint, type-check, and run unit tests.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test-server:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: server/package-lock.json
      - run: npm ci
        working-directory: server
      - run: npx prisma generate
        working-directory: server
      - run: npm run lint
        working-directory: server
      - run: npm run typecheck
        working-directory: server
      - run: npm test
        working-directory: server

  lint-and-typecheck-client:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: client/package-lock.json
      - run: npm ci
        working-directory: client
      - run: npm run lint
        working-directory: client
      - run: npm run typecheck
        working-directory: client
      - run: npm run build
        working-directory: client
```

### Workflow: Deploy (`deploy.yml`)
Runs only on push to `main` (i.e., after a PR is merged). Triggers Railway deployment via the Railway CLI.

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: []  # can depend on CI job if in same file
    steps:
      - uses: actions/checkout@v4
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      - name: Deploy to Railway
        run: railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

**Alternative**: Railway also supports automatic GitHub deployments natively (connect your repo in the Railway dashboard and it deploys on every push to `main`). The GitHub Actions workflow above gives you more control — you can gate deploys behind CI checks passing. Choose whichever approach you prefer; if using Railway's native GitHub integration, the `deploy.yml` workflow is not needed.

### Generating a Railway Token
1. Install the Railway CLI: `npm install -g @railway/cli`
2. Log in: `railway login`
3. Generate a project token: `railway tokens create` (or create one in the Railway dashboard under Project Settings → Tokens)
4. Add it as a GitHub secret named `RAILWAY_TOKEN`.

### PR Workflow Summary
1. Developer creates a feature branch off `main`.
2. Developer opens a PR. GitHub Actions runs `ci.yml` (lint + typecheck + test).
3. PR is reviewed and approved.
4. On merge to `main`, `deploy.yml` triggers and deploys to Railway (or Railway's native integration auto-deploys).

---

## 18. Testing Guidance

Testing is not a focus for MVP, but the following priorities should guide any test effort:

- **Linting** (required for CI): Set up ESLint in both `client/` and `server/`. Use `eslint.config.ts` (flat config, ESM) with `typescript-eslint` for TS-aware rules. This is the minimum bar for the CI pipeline.
- **Type-checking** (required for CI): `tsc --noEmit` in both client and server. TypeScript's compiler catches a wide class of bugs that linting alone cannot.
- **Unit test the chat service** (`services/chat.ts`): message sanitization, length validation, and persistence logic. These are the highest-value tests. Use Vitest.
- **Unit test the presence service** (`services/presence.ts`): join/leave tracking, user list accuracy.
- **Skip E2E tests for MVP**: The real-time Socket.IO + OAuth flow is complex to test end-to-end and not worth the setup cost for a side project.
- **Manual QA checklist**: Login flow, send/receive messages in two browser tabs, load history, verify presence updates on connect/disconnect, verify day/night theme toggle, verify production Railway deployment works with WebSockets.

---

## 19. Acceptance Criteria (MVP is Done When...)

- [ ] A user can log in via Discord and see their username/avatar.
- [ ] A user lands directly in the General chat room after login.
- [ ] A user can send a message and see it appear in real-time for all connected users.
- [ ] Messages are sanitized (no HTML/script injection possible).
- [ ] Message history loads on page load with working "load more" pagination.
- [ ] Online user count is visible.
- [ ] Expired JWT redirects the user to the login page (both REST and Socket.IO).
- [ ] Day/night theme toggle works and persists preference across sessions.
- [ ] The UI looks and feels like a WoW-era chat interface, not a modern chat app.
- [ ] The app runs locally with `docker compose up` (PostgreSQL) + `npm run dev` (client + server from root).
- [ ] CI pipeline (GitHub Actions) passes lint, type-check, and tests on every PR.
- [ ] Merging to `main` auto-deploys to Railway.
- [ ] The app is accessible at a public Railway URL with working WebSocket connections.
