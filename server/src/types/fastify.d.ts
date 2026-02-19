import type { PrismaClient } from '../generated/prisma/client.js'
import type { Server as SocketIOServer } from 'socket.io'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from 'shared'
import type { Env } from '../config/env.js'

declare module 'fastify' {
  interface FastifyInstance {
    env: Env
    prisma: PrismaClient
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }

  interface FastifyRequest {
    user: {
      id: string
      username: string
      avatarUrl: string | null
    }
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string
      username: string
      avatarUrl: string | null
    }
    user: {
      id: string
      username: string
      avatarUrl: string | null
    }
  }
}
