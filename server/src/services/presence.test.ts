import { describe, it, expect, beforeEach } from 'vitest'
import { addUser, removeUser, getOnlineUsers, getOnlineCount, isUserOnline } from './presence.js'

describe('PresenceService', () => {
  beforeEach(() => {
    // Clear all users by removing any that exist
    for (const user of getOnlineUsers()) {
      removeUser(user.id)
    }
  })

  it('adds a user', () => {
    addUser({ id: '1', username: 'Legolasxxx', avatarUrl: null })
    expect(getOnlineCount()).toBe(1)
    expect(isUserOnline('1')).toBe(true)
  })

  it('removes a user', () => {
    addUser({ id: '1', username: 'Legolasxxx', avatarUrl: null })
    const removed = removeUser('1')
    expect(removed?.username).toBe('Legolasxxx')
    expect(getOnlineCount()).toBe(0)
    expect(isUserOnline('1')).toBe(false)
  })

  it('returns undefined when removing non-existent user', () => {
    const removed = removeUser('nonexistent')
    expect(removed).toBeUndefined()
  })

  it('lists online users', () => {
    addUser({ id: '1', username: 'Legolasxxx', avatarUrl: null })
    addUser({ id: '2', username: 'Chuckfacts', avatarUrl: null })
    const users = getOnlineUsers()
    expect(users).toHaveLength(2)
    expect(users.map((u) => u.username)).toContain('Legolasxxx')
    expect(users.map((u) => u.username)).toContain('Chuckfacts')
  })

  it('does not duplicate users', () => {
    addUser({ id: '1', username: 'Legolasxxx', avatarUrl: null })
    addUser({ id: '1', username: 'Legolasxxx_updated', avatarUrl: null })
    expect(getOnlineCount()).toBe(1)
    expect(getOnlineUsers()[0].username).toBe('Legolasxxx_updated')
  })
})
