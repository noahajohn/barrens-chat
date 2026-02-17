import sanitizeHtml from 'sanitize-html'
import type { PrismaClient } from '../generated/prisma/client.js'
import { MessageType as PrismaMessageType } from '../generated/prisma/enums.js'
import type { MessagePayload } from 'shared'

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
}

export function sanitizeMessage(content: string): string {
  return sanitizeHtml(content, sanitizeOptions).trim()
}

export function validateMessage(content: string): string | null {
  if (!content || content.trim().length === 0) {
    return 'Message content cannot be empty'
  }
  if (content.length > 500) {
    return 'Message content exceeds 500 characters'
  }
  return null
}

export async function createMessage(
  prisma: PrismaClient,
  data: {
    content: string
    userId: string
    messageType: string
  },
): Promise<MessagePayload> {
  const sanitized = sanitizeMessage(data.content)
  const message = await prisma.message.create({
    data: {
      content: sanitized,
      userId: data.userId,
      messageType: data.messageType as PrismaMessageType,
    },
    include: {
      user: true,
    },
  })

  return {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    userId: message.userId,
    username: message.user?.username ?? 'Unknown',
    avatarUrl: message.user?.avatarUrl ?? null,
    isNpc: message.isNpc,
    npcName: message.npcName,
    messageType: message.messageType as unknown as MessagePayload['messageType'],
  }
}

export async function getMessages(
  prisma: PrismaClient,
  options: { cursor?: string; limit?: number },
) {
  const limit = options.limit ?? 50
  const where = options.cursor
    ? { createdAt: { lt: new Date(options.cursor) } }
    : {}

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    include: { user: true },
  })

  const hasMore = messages.length > limit
  const results = hasMore ? messages.slice(0, limit) : messages

  return {
    messages: results.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      userId: m.userId,
      username: m.user?.username ?? m.npcName ?? 'Unknown',
      avatarUrl: m.user?.avatarUrl ?? null,
      isNpc: m.isNpc,
      npcName: m.npcName,
      messageType: m.messageType as unknown as MessagePayload['messageType'],
    })),
    nextCursor: hasMore ? results[results.length - 1].createdAt.toISOString() : null,
  }
}
