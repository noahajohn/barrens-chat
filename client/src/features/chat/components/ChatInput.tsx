import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { MessageType } from 'shared'

interface ChatInputProps {
  onSend: (content: string, messageType: MessageType) => void
  disabled?: boolean
}

const MAX_LENGTH = 500

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || disabled) return

    // Parse chat commands
    if (trimmed.startsWith('/yell ')) {
      onSend(trimmed.slice(6), MessageType.YELL)
    } else if (trimmed.startsWith('/dance')) {
      onSend('dances.', MessageType.EMOTE)
    } else {
      onSend(trimmed, MessageType.TEXT)
    }

    setMessage('')
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const remaining = MAX_LENGTH - message.length

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border bg-card p-3">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        maxLength={MAX_LENGTH}
        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <span className={`text-xs tabular-nums ${remaining < 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
        {remaining}
      </span>
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        Send
      </button>
    </form>
  )
}
