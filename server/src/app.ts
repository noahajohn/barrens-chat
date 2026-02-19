import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import autoLoad from '@fastify/autoload'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { Env } from './config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const buildApp = async (env: Env) => {
  const fastify = Fastify({
    logger: true,
  }).withTypeProvider<TypeBoxTypeProvider>()

  // Decorate env before autoloading plugins so all plugins/routes can access it
  fastify.decorate('env', env)

  // Health check — registered directly, not autoloaded
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Autoload plugins (globally available)
  await fastify.register(autoLoad, {
    dir: path.join(__dirname, 'plugins'),
    encapsulate: false,
  })

  // Autoload routes (dir-prefixed)
  await fastify.register(autoLoad, {
    dir: path.join(__dirname, 'routes'),
    dirNameRoutePrefix: true,
  })

  // Serve static client build in production
  if (env.NODE_ENV === 'production') {
    const staticPlugin = await import('@fastify/static')
    await fastify.register(staticPlugin.default, {
      root: path.join(__dirname, '..', '..', 'client', 'dist'),
      wildcard: false,
    })

    // SPA fallback: serve index.html for all non-API routes
    fastify.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api') || request.url.startsWith('/auth') || request.url.startsWith('/health')) {
        return reply.status(404).send({ error: 'Not Found' })
      }
      return reply.sendFile('index.html')
    })
  }

  return fastify
}
