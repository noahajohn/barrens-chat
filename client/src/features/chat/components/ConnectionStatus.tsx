interface ConnectionStatusProps {
  connected: boolean
  error: string | null
}

export function ConnectionStatus({ connected, error }: ConnectionStatusProps) {
  if (error) {
    return (
      <div className="border-b border-destructive bg-destructive/10 px-4 py-1.5 text-center text-xs text-destructive">
        {error}
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="border-b border-border bg-muted px-4 py-1.5 text-center text-xs text-muted-foreground animate-pulse">
        Reconnecting...
      </div>
    )
  }

  return null
}
