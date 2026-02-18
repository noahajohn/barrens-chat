import type { MessagePayload } from 'shared'
import { MessageType } from 'shared'

interface MessageLineProps {
  message: MessagePayload
}

const BASE_CLASS = 'py-0.5 font-wow-chat text-[17px] leading-snug text-shadow-wow'

export function MessageLine({ message }: MessageLineProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (message.messageType === MessageType.SYSTEM) {
    return (
      <div className={`${BASE_CLASS} text-wow-system`}>
        {message.content}
      </div>
    )
  }

  if (message.messageType === MessageType.ROLL) {
    return (
      <div className={`${BASE_CLASS} text-wow-system`}>
        <span className="text-white/50">{time} </span>
        {message.username} {message.content}
      </div>
    )
  }

  if (message.messageType === MessageType.EMOTE) {
    return (
      <div className={`${BASE_CLASS} text-wow-emote`}>
        <span className="text-white/50">{time} </span>
        {message.username} {message.content}
      </div>
    )
  }

  if (message.messageType === MessageType.YELL) {
    return (
      <div className={`${BASE_CLASS} text-wow-yell`}>
        <span className="text-white/50">{time} </span>
        {message.username} yells: {message.content.toUpperCase()}
      </div>
    )
  }

  const displayName = message.isNpc ? (message.npcName ?? message.username) : message.username

  return (
    <div className={`flex items-start gap-1.5 ${BASE_CLASS}`}>
      <span className="text-white/50 shrink-0">{time}</span>
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
        <span className="text-wow-zone">
          : {message.content}
        </span>
      </span>
    </div>
  )
}
