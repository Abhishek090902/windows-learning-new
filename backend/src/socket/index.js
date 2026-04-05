import { Server } from 'socket.io';
import { authenticate } from './middleware/authenticate.js';
import chatHandler from './handlers/chatHandler.js';
import notificationHandler from './handlers/notificationHandler.js';
import sessionHandler from './handlers/sessionHandler.js';
import presenceHandler from './handlers/presenceHandler.js';
import config from '../config/env.js';

const allowedOrigins = (config.frontendUrl || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        if (origin.endsWith('.vercel.app') && allowedOrigins.some((entry) => entry.includes('.vercel.app'))) {
          return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} is not allowed by Socket.IO CORS`));
      },
      credentials: true
    }
  });

  io.use(authenticate);

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected as ${socket.userRole}`);

    socket.join(`user:${socket.userId}`);
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
    }

    chatHandler(io, socket);
    notificationHandler(io, socket);
    sessionHandler(io, socket);
    presenceHandler(io, socket);

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      socket.leave(`user:${socket.userId}`);
    });
  });

  return io;
};

export default setupSocketIO;
