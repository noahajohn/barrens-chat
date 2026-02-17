# Barrens Chat

### Project Overview

- Real-time web chat app inspired by WoW Barrens General Chat (circa 2005-2008). Single shared chat room with WoW-themed UI, Discord OAuth, and AI NPC chatters (stretch).
- **Use consistent naming conventions, file structure, and architecture patterns.**

### Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS v4 (CSS-first, OKLCH), shadcn/ui, TypeScript
- **Backend**: Fastify 5, Socket.IO 4, Prisma 7, TypeScript, ESM (`"type": "module"`)
- **Database**: PostgreSQL 17 (Docker Compose local, Railway production)
- **Authentication**: Discord OAuth 2.0 → JWT in httpOnly cookie
- **Shared Types**: `shared/` workspace package used by both client and server
- **CI/CD**: GitHub Actions, Railway deployment

### Project Structure

```
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

**Key Conventions:**
- Features use **colocation**: all related code lives in `features/[feature]/`
- Server plugins are autoloaded with `@fastify/autoload` — plugins globally, routes dir-prefixed
- Socket.IO handlers are separate from REST routes in `socket/`
- `app.ts` is the Fastify factory (testable), `server.ts` is the entry point

### Development Commands

```bash
# Start everything
npm run dev                    # Runs both client (5173) and server (3000) via concurrently

# Prerequisites
docker compose up -d           # Start PostgreSQL
cd server && npx prisma migrate dev  # Run migrations
cd server && npx prisma generate     # Generate Prisma client

# Build
cd shared && npx tsc           # Build shared types (must run first)
cd server && npx tsc --noEmit  # Type-check server
cd client && npx tsc --noEmit  # Type-check client
cd client && npx vite build    # Production build

# Quality
cd server && npx eslint .      # Lint server
cd client && npx eslint .      # Lint client
cd server && npx vitest run    # Run server unit tests (15 tests)
```

### Critical Gotchas

- **Prisma 7**: No `url` in `schema.prisma` datasource — URL goes in `prisma.config.ts` via `datasource.url: env('DATABASE_URL')`. Uses `import 'dotenv/config'` to load `.env`.
- **Prisma 7**: Generator is `prisma-client` (not `prisma-client-js`), output to `../src/generated/prisma`.
- **Prisma enums vs shared enums**: Prisma generates its own `MessageType` enum. Cast with `as unknown as` when converting to shared `MessagePayload`.
- **dotenv**: Server entry point (`server.ts`) must `import 'dotenv/config'` at the top — Fastify/Prisma don't auto-load `.env`.
- **Shared package**: Must build shared (`cd shared && npx tsc`) before server/client can import from it.
- **Socket.IO auth**: JWT is in httpOnly cookie — Socket.IO reads it from `socket.handshake.headers.cookie` using the `cookie` package, not from `auth` handshake.
- **Tailwind v4**: CSS-first config. No `tailwind.config.js`. Uses `@import "tailwindcss"`, `@theme inline`, and `@tailwindcss/vite` plugin.
- **API 401 handling**: `apiFetch` throws `ApiError` on 401 but does NOT redirect — AuthContext handles showing the login page to avoid redirect loops.

### TypeScript

- Strict mode throughout all packages
- TypeBox for server request/response schemas (runtime validation + TS types)
- Shared Socket.IO event interfaces in `shared/types/socket-events.ts`
- Fastify declaration merging in `server/src/types/fastify.d.ts`
- Avoid `any` — use `unknown` or proper types

### Code Organization

- **Never create a file longer than 500 lines.** Split into helper files if approaching this limit.
- Use shadcn/ui components over native HTML elements
- ESLint flat config (`eslint.config.ts`) with `typescript-eslint`, underscore prefix for unused args
- When installing npm packages, always use the latest versions
- Never install an npm package unless explicitly needed
