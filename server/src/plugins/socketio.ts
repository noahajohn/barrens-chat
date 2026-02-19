import fp from 'fastify-plugin'
import { Server as SocketIOServer } from 'socket.io'
import type { FastifyInstance } from 'fastify'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from 'shared'

export default fp(async function socketioPlugin(fastify: FastifyInstance) {
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(fastify.server, {
    cors: {
      origin: fastify.env.FRONTEND_URL,
      credentials: true,
    },
  })

  fastify.decorate('io', io)

  fastify.addHook('onClose', async () => {
    io.close()
  })
})
