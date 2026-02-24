import type { MessagePayload } from 'shared'
import { MessageType } from 'shared'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar'

interface MessageLineProps {
  message: MessagePayload
}

const BASE_CLASS = 'py-0.5 font-wow-chat text-[17px] leading-snug text-shadow-wow'

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
}

export const MessageLine = ({ message }: MessageLineProps) => {
  const time = new Date(message.createdAt).toLocaleTimeString([], TIME_FORMAT)

  if (message.messageType === MessageType.SYSTEM) {
    return (
      <div className={cn(BASE_CLASS, 'text-wow-system')}>
        {message.content}
      </div>
    )
  }

  if (message.messageType === MessageType.ROLL) {
    return (
      <div className={cn(BASE_CLASS, 'text-wow-system')}>
        <span className="text-white/50">{time} </span>
        {message.username} {message.content}
      </div>
    )
  }

  if (message.messageType === MessageType.EMOTE) {
    return (
      <div className={cn(BASE_CLASS, 'text-wow-emote')}>
        <span className="text-white/50">{time} </span>
        {message.username} {message.content}
      </div>
    )
  }

  if (message.messageType === MessageType.YELL) {
    return (
      <div className={cn(BASE_CLASS, 'text-wow-yell')}>
        <span className="text-white/50">{time} </span>
        {message.username} yells: {message.content.toUpperCase()}
      </div>
    )
  }

  const displayName = message.isNpc ? (message.npcName ?? message.username) : message.username

  return (
    <div className={cn('flex items-start gap-1.5', BASE_CLASS)}>
      <span className="text-white/50 shrink-0">{time}</span>
      {message.avatarUrl && (
        <Avatar className="mt-0.5 h-4 w-4">
          <AvatarImage src={message.avatarUrl} alt={displayName} />
          <AvatarFallback className="text-[8px]">
            {displayName[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
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
