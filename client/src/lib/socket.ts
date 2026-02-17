import { io, type Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from 'shared'

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export function createSocket(): TypedSocket {
  return io(import.meta.env.VITE_SOCKET_URL, {
    transports: ['websocket'],
    withCredentials: true,
  })
}
