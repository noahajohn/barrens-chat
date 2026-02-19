import { Type } from '@sinclair/typebox'
import { MessageType } from 'shared'
import { PaginationQuery } from '../../../schemas/common.js'

export const MessagesQuerystring = PaginationQuery

export const MessageSchema = Type.Object({
  id: Type.String(),
  content: Type.String(),
  createdAt: Type.String(),
  userId: Type.Union([Type.String(), Type.Null()]),
  username: Type.String(),
  avatarUrl: Type.Union([Type.String(), Type.Null()]),
  isNpc: Type.Boolean(),
  npcName: Type.Union([Type.String(), Type.Null()]),
  messageType: Type.Unsafe<MessageType>(Type.Union([
    Type.Literal('TEXT'),
    Type.Literal('EMOTE'),
    Type.Literal('YELL'),
    Type.Literal('SYSTEM'),
    Type.Literal('ROLL'),
  ])),
})

export const MessagesResponse = Type.Object({
  messages: Type.Array(MessageSchema),
  nextCursor: Type.Union([Type.String(), Type.Null()]),
})
