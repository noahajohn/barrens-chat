import { useEffect, useState } from 'react'
import { LoginButton } from '@/features/auth/components/LoginButton'

export function LoginPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'auth_failed') {
      setError('Authentication failed. Please try again.')
      // Clean up URL
      window.history.replaceState({}, '', '/login')
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-5xl font-bold tracking-tight font-wow-header text-wow-gold-bright">
          Barrens Chat
        </h1>
        <p className="text-lg text-muted-foreground">
          [General] Where is Mankrik&apos;s wife?
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <LoginButton />

      <p className="mt-6 text-xs text-muted-foreground">
        A tribute to the greatest chat channel in gaming history.
      </p>

      <footer className="absolute bottom-6 text-xs text-muted-foreground">
        Made with &hearts; and collaboration with Claude Code.
      </footer>
    </div>
  )
}
