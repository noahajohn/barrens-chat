import { useState, useCallback } from 'react'
import type { UserPayload } from 'shared'

export function usePresence() {
  const [users, setUsers] = useState<UserPayload[]>([])
  const [count, setCount] = useState(0)

  const handleUsersList = useCallback((data: { users: UserPayload[]; count: number }) => {
    setUsers(data.users)
    setCount(data.count)
  }, [])

  const handleUserJoined = useCallback((user: UserPayload) => {
    setUsers((prev) => {
      if (prev.some((u) => u.id === user.id)) return prev
      return [...prev, user]
    })
    setCount((prev) => prev + 1)
  }, [])

  const handleUserLeft = useCallback((user: UserPayload) => {
    setUsers((prev) => prev.filter((u) => u.id !== user.id))
    setCount((prev) => Math.max(0, prev - 1))
  }, [])

  return { users, count, handleUsersList, handleUserJoined, handleUserLeft }
}
