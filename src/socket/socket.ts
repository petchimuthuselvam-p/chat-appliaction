import { io, Socket } from 'socket.io-client';

interface MessagePayload {
  from: string;
  to?: string;       // for private message
  groupId?: string;  // for group message
  message: string;
}

let socket: Socket  | null = null;;

// Connect and return the socket instance
export const connectSocket = (userId: string): Socket => {
  socket = io('http://localhost:5000', {
    transports: ['websocket'],
    query: { userId }, // optional: useful if backend reads it
  });

  // Join personal room for private messaging
  socket.emit('join', userId);

  return socket;
};

// Disconnect socket (on logout, etc.)
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

// Send private message
export const sendPrivateMessage = (payload: MessagePayload) => {
  if (socket) {
    socket.emit('private-message', payload);
  }
};

// Send group message
export const sendGroupMessage = (payload: MessagePayload) => {
  if (socket) {
    socket.emit('group-message', payload);
  }
};

// Listen to private messages
export const onPrivateMessage = (callback: (msg: MessagePayload) => void) => {
  if (socket) {
    socket.on('private-message', callback);
  }
};

// Listen to group messages
export const onGroupMessage = (callback: (msg: MessagePayload) => void) => {
  if (socket) {
    socket.on('group-message', callback);
  }
};

// Remove all listeners (optional cleanup)
export const removeListeners = () => {
  if (socket) {
    socket.off('private-message');
    socket.off('group-message');
  }
};

export default socket;
