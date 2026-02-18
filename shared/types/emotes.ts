import { MessageType } from './message.js'

export interface EmoteDefinition {
  command: string
  text: string
  targetText: string
}

export const EMOTES: EmoteDefinition[] = [
  { command: 'dance', text: 'dances.', targetText: 'dances with {target}.' },
  { command: 'flex', text: 'flexes.', targetText: 'flexes at {target}.' },
]

export function parseSlashCommand(
  input: string,
  targetUsername?: string,
): { content: string; messageType: MessageType } {
  const trimmed = input.trim()

  if (trimmed.startsWith('/yell ')) {
    return { content: trimmed.slice(6), messageType: MessageType.YELL }
  }

  for (const emote of EMOTES) {
    if (trimmed === `/${emote.command}` || trimmed.startsWith(`/${emote.command} `)) {
      const content = targetUsername
        ? emote.targetText.replace('{target}', targetUsername)
        : emote.text
      return { content, messageType: MessageType.EMOTE }
    }
  }

  return { content: trimmed, messageType: MessageType.TEXT }
}
