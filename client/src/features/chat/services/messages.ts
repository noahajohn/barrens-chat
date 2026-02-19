import { apiFetch } from '@/shared/services/api'
import type { MessagePayload } from 'shared'

interface MessagesResponse {
  messages: MessagePayload[]
  nextCursor: string | null
}

export const fetchMessages = async (cursor?: string, limit = 50): Promise<MessagesResponse> => {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  params.set('limit', String(limit))
  return apiFetch<MessagesResponse>(`/api/messages?${params.toString()}`)
}
