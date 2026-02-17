import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyError } from 'fastify'

export default fp(async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode ?? 500

    fastify.log.error(error)

    reply.status(statusCode).send({
      error: error.name || 'InternalServerError',
      message: error.message,
      code: error.code,
      statusCode,
    })
  })
})
