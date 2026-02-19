import 'dotenv/config'
import { buildApp } from './app.js'
import { setupSocketHandlers } from './socket/index.js'
import { loadEnv } from './config/env.js'

async function start() {
  try {
    const env = loadEnv()
    const fastify = await buildApp(env)

    await fastify.ready()

    // Set up Socket.IO handlers after app is ready
    setupSocketHandlers(fastify)

    await fastify.listen({ port: parseInt(env.PORT, 10), host: '0.0.0.0' })
    fastify.log.info(`Server listening on port ${env.PORT}`)
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
