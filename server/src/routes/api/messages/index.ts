import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { MessagesQuerystring, MessagesResponse } from './schema.js'
import { getMessages } from '../../../services/chat.js'

const messagesRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: MessagesQuerystring,
        response: { 200: MessagesResponse },
      },
    },
    async (request) => {
      const { cursor, limit } = request.query
      return getMessages(fastify.prisma, { cursor, limit })
    },
  )
}

export default messagesRoutes
