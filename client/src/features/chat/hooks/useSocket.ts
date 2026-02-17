import { useEffect, useRef, useState, useCallback } from 'react'
import { createSocket, type TypedSocket } from '@/lib/socket'
import type { MessagePayload, UserPayload } from 'shared'
import { MessageType } from 'shared'

interface UseSocketOptions {
  enabled: boolean
  onMessage: (message: MessagePayload) => void
  onUserJoined: (user: UserPayload) => void
  onUserLeft: (user: UserPayload) => void
  onUsersList: (data: { users: UserPayload[]; count: number }) => void
}

export function useSocket({ enabled, onMessage, onUserJoined, onUserLeft, onUsersList }: UseSocketOptions) {
  const socketRef = useRef<TypedSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    const socket = createSocket()
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      setError(null)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('connect_error', (err) => {
      if (err.message === 'AUTH_FAILED') {
        setError('Authentication failed')
        window.location.href = '/login'
      } else {
        setError('Connection error. Reconnecting...')
      }
    })

    socket.on('message:new', onMessage)
    socket.on('user:joined', onUserJoined)
    socket.on('user:left', onUserLeft)
    socket.on('users:list', onUsersList)

    socket.on('error', (err) => {
      console.error('Socket error:', err)
      if (err.code === 'RATE_LIMITED') {
        setError(err.message)
        setTimeout(() => setError(null), 3000)
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled, onMessage, onUserJoined, onUserLeft, onUsersList])

  const sendMessage = useCallback((content: string, messageType: MessageType = MessageType.TEXT) => {
    socketRef.current?.emit('message:send', { content, messageType })
  }, [])

  return { connected, error, sendMessage }
}
