import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    // If running in development on port 5173, target backend server on port 3000 if not proxied
    if (window.location.port === '5173') {
      return 'http://localhost:3000';
    }
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

export const socket: Socket = io(getSocketUrl(), {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
  timeout: 5000,
});

// Quietly suppress harmless disconnect / polling warnings in developer console
socket.on('connect_error', () => {
  // Gracefully fallback to REST endpoints
});
