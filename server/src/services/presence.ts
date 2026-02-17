import type { UserPayload } from 'shared'

const onlineUsers = new Map<string, UserPayload>()

export function addUser(user: UserPayload): void {
  onlineUsers.set(user.id, user)
}

export function removeUser(userId: string): UserPayload | undefined {
  const user = onlineUsers.get(userId)
  onlineUsers.delete(userId)
  return user
}

export function getOnlineUsers(): UserPayload[] {
  return Array.from(onlineUsers.values())
}

export function getOnlineCount(): number {
  return onlineUsers.size
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId)
}
