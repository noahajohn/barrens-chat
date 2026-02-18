import type { UserPayload } from 'shared'

interface UserListProps {
  users: UserPayload[]
  count: number
}

export function UserList({ users, count }: UserListProps) {
  return (
    <div className="flex w-52 flex-col border-l border-border bg-card/70 backdrop-blur-sm">
      <div className="border-b border-border px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-shadow-wow text-muted-foreground">
          Online — {count}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-2 rounded-md px-2 py-1.5">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="h-5 w-5 rounded-full" />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <span className="truncate text-sm text-shadow-wow text-wow-gold">{user.username}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
