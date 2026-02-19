import cookie from 'cookie'
import type { FastifyInstance } from 'fastify'
import { registerMessageHandlers } from './handlers/message.handler.js'
import { registerPresenceHandlers } from './handlers/presence.handler.js'

export const setupSocketHandlers = (fastify: FastifyInstance) => {
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
}
