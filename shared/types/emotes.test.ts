import { describe, it, expect } from 'vitest'
import { parseSlashCommand, getEmote, EMOTES } from './emotes.js'
import { MessageType } from './message.js'

describe('parseSlashCommand', () => {
  it('returns TEXT for regular messages', () => {
    expect(parseSlashCommand('hello world')).toEqual({
      content: 'hello world',
      messageType: MessageType.TEXT,
    })
  })

  it('trims whitespace from input', () => {
    expect(parseSlashCommand('  hello  ')).toEqual({
      content: 'hello',
      messageType: MessageType.TEXT,
    })
  })

  it('parses /dance without target', () => {
    expect(parseSlashCommand('/dance')).toEqual({
      content: 'bursts into dance.',
      messageType: MessageType.EMOTE,
    })
  })

  it('parses /dance with target', () => {
    expect(parseSlashCommand('/dance', 'Thrall')).toEqual({
      content: 'dances with Thrall.',
      messageType: MessageType.EMOTE,
    })
  })

  it('parses /flex without target', () => {
    expect(parseSlashCommand('/flex')).toEqual({
      content: 'flexes their muscles. Oooooh so strong!',
      messageType: MessageType.EMOTE,
    })
  })

  it('parses /flex with target', () => {
    expect(parseSlashCommand('/flex', 'Mankrik')).toEqual({
      content: 'flexes at Mankrik. Oooooh so strong!',
      messageType: MessageType.EMOTE,
    })
  })

  it('matches emote with trailing space/text', () => {
    expect(parseSlashCommand('/dance something')).toEqual({
      content: 'bursts into dance.',
      messageType: MessageType.EMOTE,
    })
  })

  it('treats unknown /commands as regular text', () => {
    expect(parseSlashCommand('/unknown')).toEqual({
      content: '/unknown',
      messageType: MessageType.TEXT,
    })
  })

  it('handles empty input', () => {
    expect(parseSlashCommand('')).toEqual({
      content: '',
      messageType: MessageType.TEXT,
    })
  })

  it('resolves alias /lol to /laugh', () => {
    expect(parseSlashCommand('/lol')).toEqual({
      content: 'laughs.',
      messageType: MessageType.EMOTE,
    })
  })

  it('resolves alias /lol with target', () => {
    expect(parseSlashCommand('/lol', 'Mankrik')).toEqual({
      content: 'laughs at Mankrik.',
      messageType: MessageType.EMOTE,
    })
  })

  it('resolves alias /sorry to /apologize', () => {
    expect(parseSlashCommand('/sorry')).toEqual({
      content: 'apologizes to everyone. Sorry!',
      messageType: MessageType.EMOTE,
    })
  })

  it('resolves multi-alias /goodbye to /bye', () => {
    expect(parseSlashCommand('/goodbye', 'Thrall')).toEqual({
      content: 'waves goodbye to Thrall. Farewell!',
      messageType: MessageType.EMOTE,
    })
  })
})

describe('parseSlashCommand - /yell', () => {
  it('parses /yell command', () => {
    expect(parseSlashCommand('/yell FOR THE HORDE')).toEqual({
      content: 'FOR THE HORDE',
      messageType: MessageType.YELL,
    })
  })

  it('parses /y alias', () => {
    expect(parseSlashCommand('/y FOR THE HORDE')).toEqual({
      content: 'FOR THE HORDE',
      messageType: MessageType.YELL,
    })
  })

  it('parses /sh alias', () => {
    expect(parseSlashCommand('/sh FOR THE HORDE')).toEqual({
      content: 'FOR THE HORDE',
      messageType: MessageType.YELL,
    })
  })

  it('parses /shout alias', () => {
    expect(parseSlashCommand('/shout FOR THE HORDE')).toEqual({
      content: 'FOR THE HORDE',
      messageType: MessageType.YELL,
    })
  })

  it('is case-insensitive', () => {
    expect(parseSlashCommand('/Yell hello')).toEqual({
      content: 'hello',
      messageType: MessageType.YELL,
    })
  })

  it('treats /yell without text as regular text', () => {
    expect(parseSlashCommand('/yell')).toEqual({
      content: '/yell',
      messageType: MessageType.TEXT,
    })
  })

  it('treats /y without text as regular text', () => {
    expect(parseSlashCommand('/y')).toEqual({
      content: '/y',
      messageType: MessageType.TEXT,
    })
  })
})

describe('parseSlashCommand - /roll', () => {
  it('generates ROLL with default 1-100 range for /roll', () => {
    const result = parseSlashCommand('/roll')
    expect(result.messageType).toBe(MessageType.ROLL)
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('/random works as alias for /roll', () => {
    const result = parseSlashCommand('/random')
    expect(result.messageType).toBe(MessageType.ROLL)
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('supports /roll N for custom upper bound', () => {
    const result = parseSlashCommand('/roll 20')
    expect(result.messageType).toBe(MessageType.ROLL)
    expect(result.content).toMatch(/^rolls \d+ \(1-20\)\.$/)
  })

  it('supports /roll X-Y for custom range', () => {
    const result = parseSlashCommand('/roll 50-100')
    expect(result.messageType).toBe(MessageType.ROLL)
    expect(result.content).toMatch(/^rolls \d+ \(50-100\)\.$/)
  })

  it('defaults to 1-100 for /roll 0', () => {
    const result = parseSlashCommand('/roll 0')
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('defaults to 1-100 for negative numbers', () => {
    const result = parseSlashCommand('/roll -5')
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('defaults to 1-100 for non-numeric arguments', () => {
    const result = parseSlashCommand('/roll abc')
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('defaults to 1-100 when lower >= upper in range', () => {
    const result = parseSlashCommand('/roll 100-50')
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('/roll 1 always rolls 1', () => {
    const result = parseSlashCommand('/roll 1')
    expect(result.content).toBe('rolls 1 (1-1).')
  })

  it('does not conflict with /rofl emote', () => {
    const result = parseSlashCommand('/rofl')
    expect(result.messageType).toBe(MessageType.EMOTE)
    expect(result.content).toBe('rolls on the floor laughing.')
  })

  it('ignores target username (rolls have no target)', () => {
    const result = parseSlashCommand('/roll', 'Thrall')
    expect(result.messageType).toBe(MessageType.ROLL)
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('is case-insensitive', () => {
    const result = parseSlashCommand('/Roll')
    expect(result.messageType).toBe(MessageType.ROLL)
    expect(result.content).toMatch(/^rolls \d+ \(1-100\)\.$/)
  })

  it('generates numbers within the specified range', () => {
    for (let i = 0; i < 50; i++) {
      const result = parseSlashCommand('/roll 5-10')
      const match = result.content.match(/^rolls (\d+) \(5-10\)\.$/)
      expect(match).not.toBeNull()
      const num = parseInt(match![1], 10)
      expect(num).toBeGreaterThanOrEqual(5)
      expect(num).toBeLessThanOrEqual(10)
    }
  })
})

describe('getEmote', () => {
  it('returns emote by canonical command', () => {
    const emote = getEmote('dance')
    expect(emote).toBeDefined()
    expect(emote!.command).toBe('dance')
  })

  it('returns emote by alias', () => {
    const emote = getEmote('mad')
    expect(emote).toBeDefined()
    expect(emote!.command).toBe('angry')
  })

  it('returns undefined for unknown command', () => {
    expect(getEmote('notacommand')).toBeUndefined()
  })
})

describe('EMOTES', () => {
  it('has no duplicate commands or aliases', () => {
    const seen = new Set<string>()
    for (const emote of EMOTES) {
      expect(seen.has(emote.command)).toBe(false)
      seen.add(emote.command)
      for (const alias of emote.aliases ?? []) {
        expect(seen.has(alias)).toBe(false)
        seen.add(alias)
      }
    }
  })

  it('is sorted alphabetically by command', () => {
    const commands = EMOTES.map((e) => e.command)
    const sorted = [...commands].sort()
    expect(commands).toEqual(sorted)
  })
})
