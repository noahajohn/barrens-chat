import type { Server as SocketIOServer } from 'socket.io'
import type { FastifyBaseLogger } from 'fastify'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from 'shared'
import type { PrismaClient } from '../../generated/prisma/client.js'
import { getOnlineCount, addNpcUser, clearNpcUsers } from '../../services/presence.js'
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
      const onlineCount = getOnlineCount()
      if (onlineCount === 0) {
        log.debug('NPC tick skipped — no users online')
        return
      }

      const personas = await getActivePersonas(prisma)
      if (personas.length === 0) {
        log.warn('NPC tick skipped — no active personas in database')
        return
      }

      const persona = personas[Math.floor(Math.random() * personas.length)]
      const content = await generateNpcMessage(prisma, persona, log)
      if (!content) {
        log.warn(`NPC [${persona.name}] generated null content`)
        return
      }

      const payload = await createNpcMessage(prisma, persona.name, content)
      io.to('general').emit('message:new', payload)
      log.info(`NPC [${persona.name}] posted: "${content.substring(0, 50)}..."`)
    } catch (err) {
      log.error(err, 'NPC message generation failed')
    } finally {
      scheduleNextMessage(io, prisma, log)
    }
  }, delay)
}

export const startNpcTimer = async (
  io: TypedServer,
  prisma: PrismaClient,
  log: FastifyBaseLogger,
) => {
  const personas = await getActivePersonas(prisma)
  for (const persona of personas) {
    addNpcUser({
      id: `npc-${persona.name}`,
      username: persona.name,
      avatarUrl: null,
      isNpc: true,
    })
  }
  log.info(`NPC timer started — ${personas.length} NPC(s) online, posting when users are present`)
  scheduleNextMessage(io, prisma, log)
}

export const stopNpcTimer = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  clearNpcUsers()
}
