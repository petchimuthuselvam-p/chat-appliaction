import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const ChatScreen = () => {
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState<string[]>([]);

  useEffect(() => {
    socket.on('chat-message', (message) => {
      setChat((prev) => [...prev, message]);
    });
  }, []);

  const sendMessage = () => {
    socket.emit('chat-message', msg);
    setMsg('');
  };

  return (
    <div className="container mt-4">
      <h5>Chat</h5>
      <div className="border p-3 mb-3" style={{ height: '200px', overflowY: 'scroll' }}>
        {chat.map((c, idx) => <div key={idx}>{c}</div>)}
      </div>
      <input className="form-control" value={msg} onChange={e => setMsg(e.target.value)} />
      <button className="btn btn-success mt-2" onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ChatScreen;
