import { describe, it, expect, beforeEach } from 'vitest'
import {
  addUser,
  removeUser,
  getOnlineUsers,
  getOnlineCount,
  getAllOnlineCount,
  isUserOnline,
  addNpcUser,
  clearNpcUsers,
} from './presence.js'

describe('PresenceService', () => {
  beforeEach(() => {
    // Clear all users by removing any that exist
    for (const user of getOnlineUsers()) {
      removeUser(user.id)
    }
    clearNpcUsers()
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

describe('NPC Presence', () => {
  beforeEach(() => {
    for (const user of getOnlineUsers()) {
      removeUser(user.id)
    }
    clearNpcUsers()
  })

  it('adds an NPC user', () => {
    addNpcUser({ id: 'npc-Chuck', username: 'Chuckfacts', avatarUrl: null, isNpc: true })
    expect(getAllOnlineCount()).toBe(1)
    expect(getOnlineCount()).toBe(0)
  })

  it('includes NPC users in getOnlineUsers', () => {
    addUser({ id: '1', username: 'Legolasxxx', avatarUrl: null })
    addNpcUser({ id: 'npc-Chuck', username: 'Chuckfacts', avatarUrl: null, isNpc: true })
    const users = getOnlineUsers()
    expect(users).toHaveLength(2)
    expect(users.map((u) => u.username)).toContain('Legolasxxx')
    expect(users.map((u) => u.username)).toContain('Chuckfacts')
  })

  it('clearNpcUsers removes all NPC users', () => {
    addNpcUser({ id: 'npc-Chuck', username: 'Chuckfacts', avatarUrl: null, isNpc: true })
    addNpcUser({ id: 'npc-Recruit', username: 'Recruitron', avatarUrl: null, isNpc: true })
    expect(getAllOnlineCount()).toBe(2)
    clearNpcUsers()
    expect(getAllOnlineCount()).toBe(0)
  })

  it('getAllOnlineCount includes both real and NPC users', () => {
    addUser({ id: '1', username: 'Legolasxxx', avatarUrl: null })
    addNpcUser({ id: 'npc-Chuck', username: 'Chuckfacts', avatarUrl: null, isNpc: true })
    expect(getOnlineCount()).toBe(1)
    expect(getAllOnlineCount()).toBe(2)
  })

  it('clearNpcUsers does not affect real users', () => {
    addUser({ id: '1', username: 'Legolasxxx', avatarUrl: null })
    addNpcUser({ id: 'npc-Chuck', username: 'Chuckfacts', avatarUrl: null, isNpc: true })
    clearNpcUsers()
    expect(getOnlineCount()).toBe(1)
    expect(getAllOnlineCount()).toBe(1)
    expect(isUserOnline('1')).toBe(true)
  })
})
