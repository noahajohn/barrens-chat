import Anthropic from '@anthropic-ai/sdk'
import type { PrismaClient } from '../generated/prisma/client.js'
import { MessageType as PrismaMessageType } from '../generated/prisma/enums.js'
import { MessageType, type MessagePayload } from 'shared'

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

const NPC_MODEL = 'claude-haiku-4-5'
const NPC_MAX_TOKENS = 150
const CONTEXT_MESSAGE_COUNT = 10

export const getActivePersonas = async (prisma: PrismaClient) => {
  return prisma.npcPersona.findMany({ where: { isActive: true } })
}

export const getRecentMessages = async (prisma: PrismaClient, count: number) => {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    take: count,
    include: { user: true },
  })
  return messages.reverse()
}

export const generateNpcMessage = async (
  prisma: PrismaClient,
  persona: { name: string; systemPrompt: string },
  log?: { error: (obj: unknown, msg: string) => void },
): Promise<string | null> => {
  if (!anthropic) return null

  try {
    const recent = await getRecentMessages(prisma, CONTEXT_MESSAGE_COUNT)
    const contextLines = recent.map((m) => {
      const name = m.isNpc ? (m.npcName ?? 'NPC') : (m.user?.username ?? 'Unknown')
      return `[${name}]: ${m.content}`
    })

    const response = await anthropic.messages.create({
      model: NPC_MODEL,
      max_tokens: NPC_MAX_TOKENS,
      system: [
        {
          type: 'text' as const,
          text: persona.systemPrompt,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
      messages: [
        {
          role: 'user' as const,
          content: contextLines.length > 0
            ? `Here is the recent chat:\n${contextLines.join('\n')}\n\nPost your next message.`
            : 'The chat room just opened. Post your first message.',
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    return textBlock && 'text' in textBlock ? textBlock.text.trim() : null
  } catch (err) {
    log?.error(err, `Claude API call failed for NPC [${persona.name}]`)
    return null
  }
}

export const createNpcMessage = async (
  prisma: PrismaClient,
  npcName: string,
  content: string,
): Promise<MessagePayload> => {
  const message = await prisma.message.create({
    data: {
      content,
      isNpc: true,
      npcName,
      messageType: PrismaMessageType.TEXT,
    },
  })

  return {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    userId: null,
    username: npcName,
    avatarUrl: null,
    isNpc: true,
    npcName,
    messageType: message.messageType as unknown as MessageType,
  }
}

export const getRandomInterval = (minMs: number, maxMs: number): number => {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
}
