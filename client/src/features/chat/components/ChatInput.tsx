import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { MessageType } from 'shared'
import type { UserPayload } from 'shared'

interface ChatInputProps {
  onSend: (content: string, messageType: MessageType) => void
  disabled?: boolean
  targetUser: UserPayload | null
  onClearTarget: () => void
}

const MAX_LENGTH = 500

export function ChatInput({ onSend, disabled, targetUser, onClearTarget }: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || disabled) return

    const target = targetUser?.username

    // Parse chat commands
    if (trimmed.startsWith('/yell ')) {
      onSend(trimmed.slice(6), MessageType.YELL)
    } else if (trimmed.startsWith('/dance')) {
      onSend(target ? `dances with ${target}.` : 'dances.', MessageType.EMOTE)
    } else if (trimmed.startsWith('/flex')) {
      onSend(target ? `flexes at ${target}.` : 'flexes.', MessageType.EMOTE)
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
    <div className="border-t border-border bg-card/80 backdrop-blur-sm">
      {targetUser && (
        <div className="flex items-center gap-2 px-3 pt-2 text-xs text-wow-gold">
          <span>Targeting: <strong>{targetUser.username}</strong></span>
          <button
            type="button"
            onClick={onClearTarget}
            className="rounded px-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            [x]
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          maxLength={MAX_LENGTH}
          className="flex-1 rounded-md border border-input bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
    </div>
  )
}
