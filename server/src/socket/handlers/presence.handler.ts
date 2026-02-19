import type { Server as SocketIOServer, Socket } from 'socket.io'
import type { FastifyBaseLogger } from 'fastify'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from 'shared'
import { addUser, removeUser, getOnlineUsers, getOnlineCount } from '../../services/presence.js'

type TypedServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

export const registerPresenceHandlers = async (
  io: TypedServer,
  socket: TypedSocket,
  _log: FastifyBaseLogger,
) => {
  const user = {
    id: socket.data.userId,
    username: socket.data.username,
    avatarUrl: socket.data.avatarUrl,
  }

  // Add user and join room
  addUser(user)
  await socket.join('general')

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
