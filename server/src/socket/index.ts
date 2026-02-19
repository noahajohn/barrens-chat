import cookie from 'cookie'
import type { FastifyInstance } from 'fastify'
import { registerMessageHandlers } from './handlers/message.handler.js'
import { registerPresenceHandlers } from './handlers/presence.handler.js'
import { startNpcTimer, stopNpcTimer } from './handlers/npc.handler.js'

export const setupSocketHandlers = (fastify: FastifyInstance): (() => void) => {
  const io = fastify.io
  const prisma = fastify.prisma

  // Authentication middleware — read JWT from cookie
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie
      if (!cookieHeader) {
        return next(new Error('AUTH_FAILED'))
      }

      const cookies = cookie.parse(cookieHeader)
      const token = cookies.token
      if (!token) {
        return next(new Error('AUTH_FAILED'))
      }

      const decoded = fastify.jwt.verify<{
        id: string
        username: string
        avatarUrl: string | null
      }>(token)
      socket.data.userId = decoded.id
      socket.data.username = decoded.username
      socket.data.avatarUrl = decoded.avatarUrl
      next()
    } catch {
      next(new Error('AUTH_FAILED'))
    }
  })

  // Connection handler
  io.on('connection', async (socket) => {
    fastify.log.info(`User connected: ${socket.data.username} (${socket.data.userId})`)

    await registerPresenceHandlers(io, socket, fastify.log)
    registerMessageHandlers(io, socket, prisma, fastify.log)
  })

  // NPC timer — global, not per-socket
  if (process.env.ANTHROPIC_API_KEY) {
    startNpcTimer(io, prisma, fastify.log).catch((err) => {
      fastify.log.error(err, 'Failed to start NPC timer')
    })
  } else {
    fastify.log.warn('ANTHROPIC_API_KEY not set — NPC chatters disabled')
  }

  return () => {
    stopNpcTimer()
  }
}
