import { apiFetch } from '@/shared/services/api'

export interface AuthUser {
  id: string
  username: string
  avatarUrl: string | null
}

export const fetchCurrentUser = async (): Promise<AuthUser> => {
  return apiFetch<AuthUser>('/auth/me')
}

export const logout = async (): Promise<void> => {
  await apiFetch('/auth/logout', { method: 'POST' })
}

export const getLoginUrl = (): string => {
  return `${import.meta.env.VITE_API_URL}/auth/discord`
}
