import React, { useState, useEffect } from 'react';
import GuestChat from '../components/ChatScreen';
import ChatWindow from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';
import { io } from 'socket.io-client';
import Sidebar from './Sidebar';

const socket = io('http://localhost:5000'); 

const  HomeChat = () => {
  const [chats, setChats] = useState([{ name: 'Petchi', id: '123' }, { name: 'Group Chat', id: 'group1' }]);
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const currentUserId = 'me123'; // get from JWT/user context

  useEffect(() => {
    socket.emit('join', currentUserId);

    socket.on('private-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('group-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSendMessage = (text: string) => {
    const msg = { from: currentUserId, message: text };

    if (currentChat?.id?.startsWith('group')) {
      socket.emit('group-message', { ...msg, groupId: currentChat.id });
    } else {
      socket.emit('private-message', { ...msg, to: currentChat.id });
    }

    setMessages((prev) => [...prev, msg]);
  };

  return (
    <div className="d-flex" style={{ height: '100vh' }}>
      <div style={{ width: '25%' }}>
        <Sidebar chats={chats} onSelectChat={(chat) => {
          setCurrentChat(chat);
          setMessages([]); // Load messages from DB optionally
        }} />
      </div>
      <div className="flex-grow-1 border-start d-flex flex-column">
        {currentChat ? (
          <>
            <div className="flex-grow-1">
              <ChatWindow messages={messages} currentUserId={currentUserId} />
            </div>
            <div className="p-3">
              <MessageInput onSend={handleSendMessage} />
            </div>
          </>
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100">
            <h4>Select a chat to start messaging</h4>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeChat;