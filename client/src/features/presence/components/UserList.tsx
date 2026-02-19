import type { UserPayload } from 'shared'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar'

interface UserListProps {
  users: UserPayload[]
  count: number
  targetUser: UserPayload | null
  onTargetUser: (user: UserPayload) => void
}

export const UserList = ({ users, count, targetUser, onTargetUser }: UserListProps) => {
  return (
    <div className="flex w-52 flex-col border-l border-border bg-card/70 backdrop-blur-sm">
      <div className="border-b border-border px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-shadow-wow text-muted-foreground">
          Online — {count}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {users.map((user) => {
          const isTarget = targetUser?.id === user.id
          return (
            <Button
              key={user.id}
              variant="ghost"
              onClick={() => onTargetUser(user)}
              className={cn(
                'flex w-full items-center justify-start gap-2 px-2 py-1.5 h-auto',
                isTarget && 'bg-wow-gold/15 ring-1 ring-wow-gold/40',
              )}
            >
              <Avatar size="sm" className="h-5 w-5">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.username} />}
                <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className={cn(
                'truncate text-sm text-shadow-wow',
                user.isNpc ? 'text-wow-npc' : 'text-wow-gold',
              )}>{user.username}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
