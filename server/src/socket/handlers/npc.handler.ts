import type { Server as SocketIOServer } from 'socket.io'
import type { FastifyBaseLogger } from 'fastify'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from 'shared'
import type { PrismaClient } from '../../generated/prisma/client.js'
import { getOnlineCount } from '../../services/presence.js'
import {
  getActivePersonas,
  generateNpcMessage,
  createNpcMessage,
  getRandomInterval,
} from '../../services/npc.js'

type TypedServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

const MIN_INTERVAL_MS = 45_000
const MAX_INTERVAL_MS = 120_000

let timer: ReturnType<typeof setTimeout> | null = null

const scheduleNextMessage = (
  io: TypedServer,
  prisma: PrismaClient,
  log: FastifyBaseLogger,
) => {
  const delay = getRandomInterval(MIN_INTERVAL_MS, MAX_INTERVAL_MS)
  timer = setTimeout(async () => {
    try {
      if (getOnlineCount() > 0) {
        const personas = await getActivePersonas(prisma)
        if (personas.length > 0) {
          const persona = personas[Math.floor(Math.random() * personas.length)]
          const content = await generateNpcMessage(prisma, persona)
          if (content) {
            const payload = await createNpcMessage(prisma, persona.name, content)
            io.to('general').emit('message:new', payload)
            log.info(`NPC [${persona.name}] posted: "${content.substring(0, 50)}..."`)
          }
        }
      }
    } catch (err) {
      log.error(err, 'NPC message generation failed')
    }
    scheduleNextMessage(io, prisma, log)
  }, delay)
}

export const startNpcTimer = (
  io: TypedServer,
  prisma: PrismaClient,
  log: FastifyBaseLogger,
) => {
  log.info('NPC timer started — posting when users are present')
  scheduleNextMessage(io, prisma, log)
}

export const stopNpcTimer = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}
