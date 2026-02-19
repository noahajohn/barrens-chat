import { useCallback, useEffect, useRef } from 'react'
import type { MessagePayload } from 'shared'
import { Button } from '@/shared/components/ui/button'
import { MessageLine } from './MessageLine'

interface ChatLogProps {
  messages: MessagePayload[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  onLoadMore: () => void
}

export const ChatLog = ({ messages, loading, loadingMore, hasMore, onLoadMore }: ChatLogProps) => {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)

  // Track if user is near bottom
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const threshold = 100
    shouldAutoScroll.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (shouldAutoScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Loading messages...
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex flex-1 flex-col justify-end overflow-y-auto px-4 py-2"
    >
      {hasMore && (
        <div className="mb-2 text-center">
          <Button
            variant="outline"
            size="xs"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load more messages'}
          </Button>
        </div>
      )}
      {messages.map((msg) => (
        <MessageLine key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
