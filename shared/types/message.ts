export enum MessageType {
  TEXT = 'TEXT',
  EMOTE = 'EMOTE',
  YELL = 'YELL',
  SYSTEM = 'SYSTEM',
  ROLL = 'ROLL',
}

export interface MessagePayload {
  id: string
  content: string
  createdAt: string
  userId: string | null
  username: string
  avatarUrl: string | null
  isNpc: boolean
  npcName: string | null
  messageType: MessageType
}
