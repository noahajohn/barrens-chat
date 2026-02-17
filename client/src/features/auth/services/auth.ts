import { apiFetch } from '@/shared/services/api'

export interface AuthUser {
  id: string
  username: string
  avatarUrl: string | null
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me')
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' })
}

export function getLoginUrl(): string {
  return `${import.meta.env.VITE_API_URL}/auth/discord`
}
