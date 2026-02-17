import { Type } from '@sinclair/typebox'

export const MessagesQuerystring = Type.Object({
  cursor: Type.Optional(Type.String()),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
})

export const MessageSchema = Type.Object({
  id: Type.String(),
  content: Type.String(),
  createdAt: Type.String(),
  userId: Type.Union([Type.String(), Type.Null()]),
  username: Type.String(),
  avatarUrl: Type.Union([Type.String(), Type.Null()]),
  isNpc: Type.Boolean(),
  npcName: Type.Union([Type.String(), Type.Null()]),
  messageType: Type.String(),
})

export const MessagesResponse = Type.Object({
  messages: Type.Array(MessageSchema),
  nextCursor: Type.Union([Type.String(), Type.Null()]),
})
