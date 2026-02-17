import type { Server as SocketIOServer, Socket } from 'socket.io'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from 'shared'
import { addUser, removeUser, getOnlineUsers, getOnlineCount } from '../../services/presence.js'

type TypedServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

export function registerPresenceHandlers(
  io: TypedServer,
  socket: TypedSocket,
) {
  const user = {
    id: socket.data.userId,
    username: socket.data.username,
    avatarUrl: null as string | null,
  }

  // Add user and join room
  addUser(user)
  socket.join('general')

  // Notify all users about the new user
  socket.to('general').emit('user:joined', user)

  // Send current users list to the newly connected user
  const users = getOnlineUsers()
  socket.emit('users:list', { users, count: getOnlineCount() })

  // Handle disconnect
  socket.on('disconnect', () => {
    const removedUser = removeUser(socket.data.userId)
    if (removedUser) {
      io.to('general').emit('user:left', removedUser)
    }
  })
}
