"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeListeners = exports.onGroupMessage = exports.onPrivateMessage = exports.sendGroupMessage = exports.sendPrivateMessage = exports.disconnectSocket = exports.connectSocket = void 0;
const socket_io_client_1 = require("socket.io-client");
let socket = null;
;
// Connect and return the socket instance
const connectSocket = (userId) => {
    socket = (0, socket_io_client_1.io)('http://localhost:5000', {
        transports: ['websocket'],
        query: { userId }, // optional: useful if backend reads it
    });
    // Join personal room for private messaging
    socket.emit('join', userId);
    return socket;
};
exports.connectSocket = connectSocket;
// Disconnect socket (on logout, etc.)
const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
    }
};
exports.disconnectSocket = disconnectSocket;
// Send private message
const sendPrivateMessage = (payload) => {
    if (socket) {
        socket.emit('private-message', payload);
    }
};
exports.sendPrivateMessage = sendPrivateMessage;
// Send group message
const sendGroupMessage = (payload) => {
    if (socket) {
        socket.emit('group-message', payload);
    }
};
exports.sendGroupMessage = sendGroupMessage;
// Listen to private messages
const onPrivateMessage = (callback) => {
    if (socket) {
        socket.on('private-message', callback);
    }
};
exports.onPrivateMessage = onPrivateMessage;
// Listen to group messages
const onGroupMessage = (callback) => {
    if (socket) {
        socket.on('group-message', callback);
    }
};
exports.onGroupMessage = onGroupMessage;
// Remove all listeners (optional cleanup)
const removeListeners = () => {
    if (socket) {
        socket.off('private-message');
        socket.off('group-message');
    }
};
exports.removeListeners = removeListeners;
exports.default = socket;
