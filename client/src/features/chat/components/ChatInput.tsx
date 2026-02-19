import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { parseSlashCommand } from 'shared'
import type { MessageType } from 'shared'
import type { UserPayload } from 'shared'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

interface ChatInputProps {
  onSend: (content: string, messageType: MessageType) => void
  disabled?: boolean
  targetUser: UserPayload | null
  onClearTarget: () => void
}

const MAX_LENGTH = 500

export const ChatInput = ({ onSend, disabled, targetUser, onClearTarget }: ChatInputProps) => {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || disabled) return

    const { content, messageType } = parseSlashCommand(trimmed, targetUser?.username)
    onSend(content, messageType)

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
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onClearTarget}
            className="text-muted-foreground hover:text-foreground"
          >
            [x]
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          maxLength={MAX_LENGTH}
          className="flex-1 bg-background/70"
        />
        <span className={cn('text-xs tabular-nums', remaining < 50 ? 'text-destructive' : 'text-muted-foreground')}>
          {remaining}
        </span>
        <Button type="submit" disabled={disabled || !message.trim()}>
          Send
        </Button>
      </form>
    </div>
  )
}
