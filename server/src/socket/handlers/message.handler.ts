import type { Server as SocketIOServer, Socket } from 'socket.io'
import type { FastifyBaseLogger } from 'fastify'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from 'shared'
import type { PrismaClient } from '../../generated/prisma/client.js'
import { validateMessage, createMessage, isValidMessageType } from '../../services/chat.js'
import { createRateLimiter } from '../../services/rate-limiter.js'

type TypedServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

const RATE_LIMIT_WINDOW = 10_000
const RATE_LIMIT_MAX = 5

export const registerMessageHandlers = (
  io: TypedServer,
  socket: TypedSocket,
  prisma: PrismaClient,
  log: FastifyBaseLogger,
) => {
  const rateLimiter = createRateLimiter({ windowMs: RATE_LIMIT_WINDOW, maxRequests: RATE_LIMIT_MAX })

  socket.on('message:send', async (data) => {
    if (rateLimiter.isRateLimited()) {
      socket.emit('error', { code: 'RATE_LIMITED', message: 'Too many messages. Slow down!' })
      return
    }

    const { content, messageType } = data

    if (!isValidMessageType(messageType)) {
      socket.emit('error', { code: 'VALIDATION_ERROR', message: 'Invalid message type' })
      return
    }

    const error = validateMessage(content)
    if (error) {
      socket.emit('error', { code: 'VALIDATION_ERROR', message: error })
      return
    }

    try {
      const messagePayload = await createMessage(prisma, {
        content,
        userId: socket.data.userId,
        messageType,
      })

      io.to('general').emit('message:new', messagePayload)
    } catch (err) {
      log.error(err, 'Failed to persist message')
      socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to send message' })
    }
  })
}
