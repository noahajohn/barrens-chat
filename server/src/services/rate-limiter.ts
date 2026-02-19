export interface RateLimiterOptions {
  windowMs: number
  maxRequests: number
}

export const createRateLimiter = (options: RateLimiterOptions) => {
  const timestamps: number[] = []

  const isRateLimited = (): boolean => {
    const now = Date.now()
    while (timestamps.length > 0 && timestamps[0] < now - options.windowMs) {
      timestamps.shift()
    }
    if (timestamps.length >= options.maxRequests) {
      return true
    }
    timestamps.push(now)
    return false
  }

  const reset = (): void => {
    timestamps.length = 0
  }

  return { isRateLimited, reset }
}
