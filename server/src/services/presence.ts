import type { UserPayload } from 'shared'

const onlineUsers = new Map<string, UserPayload>()
const npcUsers = new Map<string, UserPayload>()

export const addUser = (user: UserPayload): void => {
  onlineUsers.set(user.id, user)
}

export const removeUser = (userId: string): UserPayload | undefined => {
  const user = onlineUsers.get(userId)
  onlineUsers.delete(userId)
  return user
}

export const addNpcUser = (user: UserPayload): void => {
  npcUsers.set(user.id, user)
}

export const clearNpcUsers = (): void => {
  npcUsers.clear()
}

export const getOnlineUsers = (): UserPayload[] => {
  return [...onlineUsers.values(), ...npcUsers.values()]
}

export const getOnlineCount = (): number => {
  return onlineUsers.size
}

export const getAllOnlineCount = (): number => {
  return onlineUsers.size + npcUsers.size
}

export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId)
}
