import { describe, it, expect } from 'vitest'
import { sanitizeMessage, validateMessage } from './chat.js'

describe('sanitizeMessage', () => {
  it('strips HTML tags', () => {
    expect(sanitizeMessage('<b>hello</b>')).toBe('hello')
  })

  it('strips script tags', () => {
    expect(sanitizeMessage('<script>alert("xss")</script>')).toBe('')
  })

  it('preserves plain text', () => {
    expect(sanitizeMessage('where is mankrik wife')).toBe('where is mankrik wife')
  })

  it('trims whitespace', () => {
    expect(sanitizeMessage('  hello world  ')).toBe('hello world')
  })

  it('strips nested HTML', () => {
    expect(sanitizeMessage('<div><p>text</p></div>')).toBe('text')
  })
})

describe('validateMessage', () => {
  it('rejects empty string', () => {
    expect(validateMessage('')).toBe('Message content cannot be empty')
  })

  it('rejects whitespace-only', () => {
    expect(validateMessage('   ')).toBe('Message content cannot be empty')
  })

  it('rejects messages over 500 characters', () => {
    const longMessage = 'a'.repeat(501)
    expect(validateMessage(longMessage)).toBe('Message content exceeds 500 characters')
  })

  it('accepts valid messages', () => {
    expect(validateMessage('hello world')).toBeNull()
  })

  it('accepts messages at exactly 500 characters', () => {
    const maxMessage = 'a'.repeat(500)
    expect(validateMessage(maxMessage)).toBeNull()
  })
})
