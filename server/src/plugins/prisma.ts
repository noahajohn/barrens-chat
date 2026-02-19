import fp from 'fastify-plugin'
import { PrismaClient } from '../generated/prisma/client.js'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import type { FastifyInstance } from 'fastify'

export default fp(async function prismaPlugin(fastify: FastifyInstance) {
  const pool = new pg.Pool({ connectionString: fastify.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  await prisma.$connect()
  fastify.decorate('prisma', prisma)

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
    await pool.end()
  })
})
