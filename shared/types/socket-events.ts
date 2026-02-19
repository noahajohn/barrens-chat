import type { MessagePayload, MessageType } from './message.js'
import type { UserPayload } from './user.js'

export type ErrorCode = 'AUTH_FAILED' | 'RATE_LIMITED' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR'

export interface ServerToClientEvents {
  'message:new': (message: MessagePayload) => void
  'user:joined': (user: UserPayload) => void
  'user:left': (user: UserPayload) => void
  'users:list': (data: { users: UserPayload[]; count: number }) => void
  'error': (error: { code: ErrorCode; message: string }) => void
}

export interface ClientToServerEvents {
  'message:send': (data: { content: string; messageType: MessageType }) => void
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string
  username: string
  avatarUrl: string | null
}
