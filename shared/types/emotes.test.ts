import { describe, it, expect } from 'vitest'
import { parseSlashCommand } from './emotes.js'
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

  it('parses /yell command', () => {
    expect(parseSlashCommand('/yell FOR THE HORDE')).toEqual({
      content: 'FOR THE HORDE',
      messageType: MessageType.YELL,
    })
  })

  it('treats /yell without text as regular text', () => {
    expect(parseSlashCommand('/yell')).toEqual({
      content: '/yell',
      messageType: MessageType.TEXT,
    })
  })

  it('parses /dance without target', () => {
    expect(parseSlashCommand('/dance')).toEqual({
      content: 'dances.',
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
      content: 'flexes.',
      messageType: MessageType.EMOTE,
    })
  })

  it('parses /flex with target', () => {
    expect(parseSlashCommand('/flex', 'Mankrik')).toEqual({
      content: 'flexes at Mankrik.',
      messageType: MessageType.EMOTE,
    })
  })

  it('matches emote with trailing space/text', () => {
    expect(parseSlashCommand('/dance something')).toEqual({
      content: 'dances.',
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
})
