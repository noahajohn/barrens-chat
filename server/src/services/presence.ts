import type { UserPayload } from 'shared'

const onlineUsers = new Map<string, UserPayload>()

export const addUser = (user: UserPayload): void => {
  onlineUsers.set(user.id, user)
}

export const removeUser = (userId: string): UserPayload | undefined => {
  const user = onlineUsers.get(userId)
  onlineUsers.delete(userId)
  return user
}

export const getOnlineUsers = (): UserPayload[] => {
  return Array.from(onlineUsers.values())
}

export const getOnlineCount = (): number => {
  return onlineUsers.size
}

export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId)
}
