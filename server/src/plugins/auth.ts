import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from '../errors/index.js'

export default fp(async function authPlugin(fastify: FastifyInstance) {
  await fastify.register(cookie)

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET!,
    cookie: {
      cookieName: 'token',
      signed: false,
    },
    sign: {
      expiresIn: '7d',
    },
  })

  fastify.decorate('authenticate', async function (request: FastifyRequest, _reply: FastifyReply) {
    try {
      await request.jwtVerify()
    } catch {
      throw new UnauthorizedError('Unauthorized')
    }
  })
})

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
