import 'dotenv/config'
import { buildApp } from './app.js'
import { setupSocketHandlers } from './socket/index.js'
import { loadEnv } from './config/env.js'

const start = async () => {
  try {
    const env = loadEnv()
    const fastify = await buildApp(env)

    await fastify.ready()

    // Set up Socket.IO handlers after app is ready
    const cleanup = setupSocketHandlers(fastify)

    await fastify.listen({ port: parseInt(env.PORT, 10), host: '0.0.0.0' })
    fastify.log.info(`Server listening on port ${env.PORT}`)

    let shuttingDown = false
    const shutdown = async () => {
      if (shuttingDown) return
      shuttingDown = true
      cleanup()
      await fastify.close()
      process.exit(0)
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
