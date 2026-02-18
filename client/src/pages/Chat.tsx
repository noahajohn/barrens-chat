import { useCallback } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useMessages } from '@/features/chat/hooks/useMessages'
import { useSocket } from '@/features/chat/hooks/useSocket'
import { usePresence } from '@/features/presence/hooks/usePresence'
import { ChatLog } from '@/features/chat/components/ChatLog'
import { ChatInput } from '@/features/chat/components/ChatInput'
import { ConnectionStatus } from '@/features/chat/components/ConnectionStatus'
import { UserList } from '@/features/presence/components/UserList'
import { ThemeToggle } from '@/features/theme/components/ThemeToggle'
import type { MessagePayload } from 'shared'

export function ChatPage() {
  const { user, logout } = useAuth()
  const { messages, loading, loadingMore, hasMore, loadMore, addMessage } = useMessages()
  const { users, count, handleUsersList, handleUserJoined, handleUserLeft } = usePresence()

  const onMessage = useCallback((message: MessagePayload) => {
    addMessage(message)
  }, [addMessage])

  const { connected, error, sendMessage } = useSocket({
    enabled: !!user,
    onMessage,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onUsersList: handleUsersList,
  })

  return (
    <div
      className="flex h-screen flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/barrens-bg-day.jpg')" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold font-wow-header text-wow-gold-bright">
            Barrens Chat
          </h1>
          <span className="text-sm text-wow-channel">[General]</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.username}</span>
          <ThemeToggle />
          <button
            onClick={logout}
            className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent"
          >
            Logout
          </button>
        </div>
      </header>

      <ConnectionStatus connected={connected} error={error} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex flex-1 flex-col bg-black/40">
          <ChatLog
            messages={messages}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
          <ChatInput onSend={sendMessage} disabled={!connected} />
        </div>

        {/* User list sidebar */}
        <UserList users={users} count={count} />
      </div>
    </div>
  )
}
