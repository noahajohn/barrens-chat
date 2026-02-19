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

type TypedServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

// Rate limiting: 5 messages per 10 seconds per socket
const RATE_LIMIT_WINDOW = 10_000
const RATE_LIMIT_MAX = 5

export function registerMessageHandlers(
  io: TypedServer,
  socket: TypedSocket,
  prisma: PrismaClient,
  log: FastifyBaseLogger,
) {
  const timestamps: number[] = []

  socket.on('message:send', async (data) => {
    // Rate limiting check
    const now = Date.now()
    while (timestamps.length > 0 && timestamps[0] < now - RATE_LIMIT_WINDOW) {
      timestamps.shift()
    }
    if (timestamps.length >= RATE_LIMIT_MAX) {
      socket.emit('error', { code: 'RATE_LIMITED', message: 'Too many messages. Slow down!' })
      return
    }
    timestamps.push(now)

    const { content, messageType } = data

    // Validate message type
    if (!isValidMessageType(messageType)) {
      socket.emit('error', { code: 'VALIDATION_ERROR', message: 'Invalid message type' })
      return
    }

    // Validate content
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
