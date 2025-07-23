import React, { useState, useEffect } from 'react';
import ChatWindow from '../components/ChatWindow';
import { io } from 'socket.io-client';
import './ChatSidebar.css';
import './HomeChat.css';
import axios from 'axios';

const socket = io('http://localhost:5000');

const HomeChat = () => {
  
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserIndex, setSelectedUserIndex] = useState<number>(-1);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
 const [chatScreen, setChatScreen] = useState<boolean | true>(true);

  const userList = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/userlist');
      const responseUsers = res.data;

      const selfUserIndex = responseUsers.findIndex((u: any) => u._id === user._id);
      let updatedUsers = [];

      if (selfUserIndex !== -1) {
        const selfUser = responseUsers[selfUserIndex];
        const modifiedSelfUser = { ...selfUser, username: 'self' };
        responseUsers.splice(selfUserIndex, 1); // remove self
        updatedUsers = [modifiedSelfUser, ...responseUsers]; // self at top
      } else {
        updatedUsers = responseUsers;
      }

      setUsers(updatedUsers);

      // ✅ Select first non-self user
      if (updatedUsers.length > 1) {
        setSelectedUserIndex(1);
        setSelectedUserId(updatedUsers[1]._id);
      } else if (updatedUsers.length === 1 && updatedUsers[0].username !== 'self') {
        setSelectedUserIndex(0);
        setSelectedUserId(updatedUsers[0]._id);
      }

    } catch (err: any) {
      console.error('Login failed:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Login error');
    }
  };

  useEffect(() => {
    userList();
    socket.emit('join', user._id);

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

  const handleUserSelect = (index: number) => {
    // prevent selecting self
    setSelectedUserIndex(index);
    setChatScreen(false)
    setSelectedUserId(users[index]._id);
  };

 return (
  <div className="d-flex" style={{ height: '100vh' }}>
    {chatScreen && (
      <div className="sidebar p-3 text-white" style={{ width: '350px' }}>
        <div className="d-flex align-items-center mb-4">
          <img
            src="https://randomuser.me/api/portraits/men/11.jpg"
            alt="User"
            className="rounded-circle me-2"
            width="50"
            height="50"
          />
          <div>
            <div className="small">Hello</div>
            <div className="fw-bold">{user.username}</div>
          </div>
          <span className="ms-auto online-indicator bg-success"></span>
        </div>

        <hr className="border-secondary" />

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0 fw-bold">Teams</h6>
        </div>

        <div className="chat-list">
          {users.map((u, index) => (
            <div
              key={index}
              className={`d-flex align-items-center mb-3 p-2 user-item ${
                selectedUserIndex === index ? 'selected-user' : ''
              }`}
              onClick={() => handleUserSelect(index)}>
              <div className="position-relative me-2">
                <img
                  src={u.image || 'https://via.placeholder.com/45'}
                  alt={u.name}
                  className="rounded-circle"
                  width="45"
                  height="45"
                />
                <span
                  className={`online-indicator ${
                    u.online ? 'bg-success' : 'bg-warning'
                  }`}
                ></span>
              </div>
              <div className="flex-grow-1">{u.username}</div>
              {u.messages > 0 && (
                <span className="badge bg-danger rounded-circle">
                  {u.messages}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="flex-grow-1 border-start d-flex flex-column">
      {!chatScreen ? (
        <ChatWindow userId={selectedUserId} onBack={() => setChatScreen(true)} />
      ) : (
        <div className="text-center text-muted h-100 d-flex align-items-center justify-content-center">
        
        </div>
      )}
    </div>
  </div>
  
);

}
export default HomeChat;

