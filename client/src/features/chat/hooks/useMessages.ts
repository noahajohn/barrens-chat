import { useState, useCallback, useEffect } from 'react'
import type { MessagePayload } from 'shared'
import { fetchMessages } from '@/features/chat/services/messages'

export const useMessages = () => {
  const [messages, setMessages] = useState<MessagePayload[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Load initial messages
  useEffect(() => {
    fetchMessages()
      .then((data) => {
        // Messages come newest-first from API, reverse for display (oldest first)
        setMessages(data.messages.reverse())
        setNextCursor(data.nextCursor)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Load more (older messages)
  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await fetchMessages(nextCursor)
      // Prepend older messages (they come newest-first, reverse them)
      setMessages((prev) => [...data.messages.reverse(), ...prev])
      setNextCursor(data.nextCursor)
    } catch (err) {
      console.error('Failed to load more messages:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [nextCursor, loadingMore])

  // Append new real-time message
  const addMessage = useCallback((message: MessagePayload) => {
    setMessages((prev) => [...prev, message])
  }, [])

  return { messages, loading, loadingMore, hasMore: !!nextCursor, loadMore, addMessage }
}
