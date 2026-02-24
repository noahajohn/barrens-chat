import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useMessages } from '@/features/chat/hooks/useMessages'
import { useSocket } from '@/features/chat/hooks/useSocket'
import { usePresence } from '@/features/presence/hooks/usePresence'
import { useTheme } from '@/features/theme/components/ThemeProvider'
import { ChatLog } from '@/features/chat/components/ChatLog'
import { ChatInput } from '@/features/chat/components/ChatInput'
import { ConnectionStatus } from '@/features/chat/components/ConnectionStatus'
import { UserList } from '@/features/presence/components/UserList'
import { ThemeToggle } from '@/features/theme/components/ThemeToggle'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/lib/utils'
import type { MessagePayload, UserPayload } from 'shared'

export const ChatPage = () => {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const { messages, loading, loadingMore, hasMore, loadMore, addMessage } = useMessages()
  const { users, count, handleUsersList, handleUserJoined, handleUserLeft } = usePresence()
  const [targetUser, setTargetUser] = useState<UserPayload | null>(null)

  const bgImage = isDark ? '/barrens-bg-night.jpeg' : '/barrens-bg-day.jpg'

  const handleTargetUser = useCallback((clickedUser: UserPayload) => {
    setTargetUser((prev) => (prev?.id === clickedUser.id ? null : clickedUser))
  }, [])

  const handleClearTarget = useCallback(() => {
    setTargetUser(null)
  }, [])

  const onUserLeft = useCallback((leftUser: UserPayload) => {
    handleUserLeft(leftUser)
    setTargetUser((prev) => (prev?.id === leftUser.id ? null : prev))
  }, [handleUserLeft])

  const onMessage = useCallback((message: MessagePayload) => {
    addMessage(message)
  }, [addMessage])

  const { connected, error, authFailed, sendMessage } = useSocket({
    enabled: !!user,
    onMessage,
    onUserJoined: handleUserJoined,
    onUserLeft: onUserLeft,
    onUsersList: handleUsersList,
  })

  useEffect(() => {
    if (authFailed) {
      window.location.href = '/login'
    }
  }, [authFailed])

  return (
    <div
      className="flex h-screen flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${bgImage}')` }}
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
          <Button variant="outline" size="xs" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      <ConnectionStatus connected={connected} error={error} />

      {/* Main content — centered WoW-style chat panel */}
      <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
        <div className={cn(
          'flex h-full w-[70%] min-w-[540px] max-w-[1300px] overflow-hidden rounded-sm',
          'border-[3px] border-yellow-900/60 dark:border-yellow-600/40',
          'shadow-[0_0_20px_rgba(0,0,0,0.6),inset_0_0_10px_rgba(0,0,0,0.3)]',
        )}>
          {/* Chat area */}
          <div className="flex flex-1 flex-col bg-black/60">
            <ChatLog
              messages={messages}
              loading={loading}
              loadingMore={loadingMore}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
            <ChatInput
              onSend={sendMessage}
              disabled={!connected}
              targetUser={targetUser}
              onClearTarget={handleClearTarget}
            />
          </div>

          {/* User list sidebar */}
          <UserList
            users={users}
            count={count}
            targetUser={targetUser}
            onTargetUser={handleTargetUser}
          />
        </div>
      </div>
    </div>
  )
}
