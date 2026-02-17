import createError from '@fastify/error'

export const UnauthorizedError = createError('UNAUTHORIZED', '%s', 401)
export const NotFoundError = createError('NOT_FOUND', '%s', 404)
export const BadRequestError = createError('BAD_REQUEST', '%s', 400)
export const RateLimitError = createError('RATE_LIMITED', '%s', 429)
