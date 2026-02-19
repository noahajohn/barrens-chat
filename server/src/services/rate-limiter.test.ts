import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRateLimiter } from './rate-limiter.js'

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests within the limit', () => {
    const limiter = createRateLimiter({ windowMs: 10_000, maxRequests: 3 })
    expect(limiter.isRateLimited()).toBe(false)
    expect(limiter.isRateLimited()).toBe(false)
    expect(limiter.isRateLimited()).toBe(false)
  })

  it('blocks requests exceeding the limit', () => {
    const limiter = createRateLimiter({ windowMs: 10_000, maxRequests: 2 })
    expect(limiter.isRateLimited()).toBe(false)
    expect(limiter.isRateLimited()).toBe(false)
    expect(limiter.isRateLimited()).toBe(true)
  })

  it('allows requests after the window expires', () => {
    const limiter = createRateLimiter({ windowMs: 10_000, maxRequests: 1 })
    expect(limiter.isRateLimited()).toBe(false)
    expect(limiter.isRateLimited()).toBe(true)

    vi.advanceTimersByTime(10_001)
    expect(limiter.isRateLimited()).toBe(false)
  })

  it('resets all timestamps', () => {
    const limiter = createRateLimiter({ windowMs: 10_000, maxRequests: 1 })
    expect(limiter.isRateLimited()).toBe(false)
    expect(limiter.isRateLimited()).toBe(true)

    limiter.reset()
    expect(limiter.isRateLimited()).toBe(false)
  })

  it('uses a sliding window', () => {
    const limiter = createRateLimiter({ windowMs: 10_000, maxRequests: 2 })
    expect(limiter.isRateLimited()).toBe(false) // t=0

    vi.advanceTimersByTime(5_000)
    expect(limiter.isRateLimited()).toBe(false) // t=5s

    vi.advanceTimersByTime(5_001)
    // t=10.001s — first request (t=0) has expired, only one in window
    expect(limiter.isRateLimited()).toBe(false)
  })
})
