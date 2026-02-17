import type { MessagePayload } from 'shared'
import { MessageType } from 'shared'

interface MessageLineProps {
  message: MessagePayload
}

export function MessageLine({ message }: MessageLineProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (message.messageType === MessageType.SYSTEM) {
    return (
      <div className="py-0.5 font-mono text-sm text-wow-system">
        {message.content}
      </div>
    )
  }

  if (message.messageType === MessageType.EMOTE) {
    return (
      <div className="py-0.5 font-mono text-sm text-wow-emote">
        <span className="text-muted-foreground">{time} </span>
        {message.username} {message.content}
      </div>
    )
  }

  const isYell = message.messageType === MessageType.YELL
  const displayName = message.isNpc ? (message.npcName ?? message.username) : message.username

  return (
    <div className="flex items-start gap-1.5 py-0.5 font-mono text-sm">
      <span className="text-muted-foreground shrink-0">{time}</span>
      {message.avatarUrl && (
        <img
          src={message.avatarUrl}
          alt={displayName}
          className="mt-0.5 h-4 w-4 shrink-0 rounded-full"
        />
      )}
      <span>
        <span className="text-wow-channel">[General] </span>
        <span className={message.isNpc ? 'text-wow-npc' : 'text-wow-gold'}>
          [{displayName}]
        </span>
        <span className={isYell ? 'text-wow-yell' : 'text-foreground'}>
          : {isYell ? message.content.toUpperCase() : message.content}
        </span>
      </span>
    </div>
  )
}
