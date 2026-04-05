import { io, type Socket } from 'socket.io-client';
import { getSocketBaseUrl } from '@/lib/runtime-config';

const SOCKET_URL = getSocketBaseUrl();

let socket: Socket | null = null;
let activeToken: string | null = null;

export const getSocket = () => socket;

export const connectSocket = (token: string) => {
  if (socket && activeToken === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  activeToken = token;
  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  activeToken = null;
};
