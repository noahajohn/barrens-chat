# Barrens Chat

Real-time web chat app inspired by World of Warcraft's Barrens General Chat (circa 2005-2008). A single shared chat room with a WoW-themed UI and Discord OAuth login. This is a currently a fun, side project for the authors to explore new tech.

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS v4, shadcn/ui
- **Backend**: Fastify 5, Socket.IO 4, Prisma 7
- **Database**: PostgreSQL 17
- **Auth**: Discord OAuth 2.0

## Prerequisites

- Node.js >= 24
- Docker (for local PostgreSQL)
- A [Discord application](https://discord.com/developers/applications) with OAuth2 credentials

## Getting Started

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker compose up -d

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your Discord OAuth credentials and database URL

# Run database migrations and generate Prisma client
cd server && npx prisma migrate dev && npx prisma generate && cd ..

# Build shared types (required before first run)
cd shared && npx tsc && cd ..

# Start dev servers (client on :5173, server on :3000)
npm run dev
```

## Project Structure

```
barrens-chat/
├── shared/    # Shared TypeScript types (client + server)
├── client/    # React frontend (Vite + shadcn/ui)
├── server/    # Fastify backend (Socket.IO, Prisma)
└── .github/   # CI/CD workflows
```

## Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start client and server concurrently |
| `npm run build`     | Build all packages                   |
| `npm run lint`      | Lint server and client               |
| `npm run typecheck` | Type-check all packages              |
