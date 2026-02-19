import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRandomInterval } from './npc.js'

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  }
})

describe('getRandomInterval', () => {
  it('returns a value within the specified range', () => {
    for (let i = 0; i < 100; i++) {
      const result = getRandomInterval(1000, 5000)
      expect(result).toBeGreaterThanOrEqual(1000)
      expect(result).toBeLessThanOrEqual(5000)
    }
  })

  it('returns an integer', () => {
    const result = getRandomInterval(1000, 5000)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('returns min when min equals max', () => {
    const result = getRandomInterval(3000, 3000)
    expect(result).toBe(3000)
  })
})

describe('getActivePersonas', () => {
  it('calls prisma with isActive filter', async () => {
    const { getActivePersonas } = await import('./npc.js')
    const mockPersonas = [
      { id: '1', name: 'Chuckfacts', archetype: 'chuck', systemPrompt: 'test', isActive: true },
    ]
    const mockPrisma = {
      npcPersona: {
        findMany: vi.fn().mockResolvedValue(mockPersonas),
      },
    }

    const result = await getActivePersonas(mockPrisma as never)
    expect(mockPrisma.npcPersona.findMany).toHaveBeenCalledWith({ where: { isActive: true } })
    expect(result).toEqual(mockPersonas)
  })

  it('returns empty array when no active personas', async () => {
    const { getActivePersonas } = await import('./npc.js')
    const mockPrisma = {
      npcPersona: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    }

    const result = await getActivePersonas(mockPrisma as never)
    expect(result).toEqual([])
  })
})

describe('createNpcMessage', () => {
  let createNpcMessage: typeof import('./npc.js').createNpcMessage

  beforeEach(async () => {
    const mod = await import('./npc.js')
    createNpcMessage = mod.createNpcMessage
  })

  it('creates a message with isNpc true and correct npcName', async () => {
    const mockMessage = {
      id: 'msg-1',
      content: 'Chuck Norris counted to infinity. Twice.',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      userId: null,
      isNpc: true,
      npcName: 'Chuckfacts',
      messageType: 'TEXT',
    }
    const mockPrisma = {
      message: {
        create: vi.fn().mockResolvedValue(mockMessage),
      },
    }

    const result = await createNpcMessage(
      mockPrisma as never,
      'Chuckfacts',
      'Chuck Norris counted to infinity. Twice.',
    )

    expect(mockPrisma.message.create).toHaveBeenCalledWith({
      data: {
        content: 'Chuck Norris counted to infinity. Twice.',
        isNpc: true,
        npcName: 'Chuckfacts',
        messageType: 'TEXT',
      },
    })
    expect(result.isNpc).toBe(true)
    expect(result.npcName).toBe('Chuckfacts')
    expect(result.userId).toBeNull()
    expect(result.username).toBe('Chuckfacts')
    expect(result.avatarUrl).toBeNull()
  })
})
