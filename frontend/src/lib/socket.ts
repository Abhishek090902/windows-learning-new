import { io, type Socket } from 'socket.io-client';

const resolveSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  if (import.meta.env.VITE_API_URL) {
    try {
      const apiUrl = new URL(import.meta.env.VITE_API_URL);
      return apiUrl.origin;
    } catch {
      return import.meta.env.VITE_API_URL;
    }
  }

  return 'http://localhost:3000';
};

const SOCKET_URL = resolveSocketUrl();

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
