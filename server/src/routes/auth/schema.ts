import { Type } from '@sinclair/typebox'

export const CallbackQuerystring = Type.Object({
  code: Type.String(),
})

export const MeResponse = Type.Object({
  id: Type.String(),
  username: Type.String(),
  avatarUrl: Type.Union([Type.String(), Type.Null()]),
})

export const ErrorQuerystring = Type.Object({
  error: Type.Optional(Type.String()),
})
