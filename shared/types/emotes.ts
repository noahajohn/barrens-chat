import { MessageType } from './message.js'
import { EMOTES, type EmoteDefinition } from './emotes-data.js'

export type { EmoteDefinition }
export { EMOTES }

export interface SlashCommandResult {
  content: string
  messageType: MessageType
}

const emoteMap = new Map<string, EmoteDefinition>()
for (const emote of EMOTES) {
  emoteMap.set(emote.command, emote)
  for (const alias of emote.aliases ?? []) {
    emoteMap.set(alias, emote)
  }
}

export const getEmote = (command: string): EmoteDefinition | undefined => {
  return emoteMap.get(command)
}

export const parseSlashCommand = (
  input: string,
  targetUsername?: string,
): SlashCommandResult => {
  const trimmed = input.trim()

  // /yell, /y, /sh, /shout — WoW-style yelling
  const yellMatch = trimmed.match(/^\/(yell|y|sh|shout)\s+(.+)/i)
  if (yellMatch) {
    return { content: yellMatch[2], messageType: MessageType.YELL }
  }

  // /roll and /random — WoW-style dice rolling
  const rollMatch = trimmed.match(/^\/(roll|random)(?:\s+(.+))?$/i)
  if (rollMatch) {
    let min = 1
    let max = 100

    const arg = rollMatch[2]?.trim()
    if (arg) {
      const rangeMatch = arg.match(/^(\d+)-(\d+)$/)
      if (rangeMatch) {
        const parsedMin = parseInt(rangeMatch[1], 10)
        const parsedMax = parseInt(rangeMatch[2], 10)
        if (parsedMin > 0 && parsedMax > 0 && parsedMin < parsedMax) {
          min = parsedMin
          max = parsedMax
        }
      } else {
        const parsedMax = parseInt(arg, 10)
        if (!isNaN(parsedMax) && parsedMax > 0) {
          max = parsedMax
        }
      }
    }

    const result = Math.floor(Math.random() * (max - min + 1)) + min
    return {
      content: `rolls ${result} (${min}-${max}).`,
      messageType: MessageType.ROLL,
    }
  }

  const match = trimmed.match(/^\/(\S+)/)
  if (match) {
    const emote = emoteMap.get(match[1])
    if (emote) {
      const content = targetUsername
        ? emote.targetText.replace('{target}', targetUsername)
        : emote.text
      return { content, messageType: MessageType.EMOTE }
    }
  }

  return { content: trimmed, messageType: MessageType.TEXT }
}
