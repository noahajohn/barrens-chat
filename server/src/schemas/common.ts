import { Type } from '@sinclair/typebox'

export const ErrorResponse = Type.Object({
  error: Type.String(),
  message: Type.String(),
  code: Type.Optional(Type.String()),
  statusCode: Type.Number(),
})

export const PaginationQuery = Type.Object({
  cursor: Type.Optional(Type.String({ format: 'date-time' })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
})
