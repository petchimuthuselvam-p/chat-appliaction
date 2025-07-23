import React, { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface Message {
  text: string;
  sender: 'me' | 'them';
  time: string;
  filePath:string
}
interface ChatWindowProps {
  userId: string;
  onBack: () => void;
}


const ChatWindow: React.FC<ChatWindowProps> = ({ userId, onBack }) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
  interface UserDetail {
    username?: string;

  }
  const [userDetail, setUserDetail] = useState<UserDetail>({});
  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
    });



    newSocket.on('chat-message', (msg: any) => {
      const newMsg: Message = {
        text: msg.message,
        sender: msg.from === user._id ? 'me' : 'them',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        filePath: msg.filePath || '', 
      };
      setMessages((prev) => [...prev, newMsg]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user._id]);

  useEffect(() => {
    if (userId) {
      fetchMessages();
    }
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/auth/messages/${user._id}/${userId}`);
      if (Array.isArray(res.data)) {
        setMessages(
          res.data.map((m: any) => ({
            text: m.message,
            filePath: m.filePath || '',
            sender: m.from === user._id ? 'me' : 'them',
              time: new Date(m.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };
  const getUser = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/user-id/' + userId);
      setUserDetail(res.data.data);
      console.log(res.data.data);
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleBack = async () => {
    await onBack();
  };



  const handleSend = async () => {
    if (inputText.trim() === '') return;

    try {
      await axios.post('http://localhost:5000/api/auth/send-msg', {
        from: user._id,
        message: inputText,
        to: userId,
      });

      setInputText('');
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

   const addEmoji = (emoji: any) => {
  setInputText((prev) => prev + emoji.native);
};

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const formData = new FormData();
    formData.append('from', user._id);
    formData.append('to', userId);
    formData.append('file', file);

    try {
      await axios.post('http://localhost:5000/api/auth/send-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (err) {
      console.error('Send file error:', err);
    }
  }
};

  return (
    <div style={{paddingTop:'20px',paddingLeft:'5px'}}>
      {/* Back Arrow */}
      <div
        className="d-flex align-items-center p-2"
        style={{ backgroundColor: 'green', color: 'white' , width: '400px' ,  borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          className="bi bi-arrow-left me-3"
          viewBox="0 0 16 16"
          style={{ cursor: 'pointer' }}
          onClick={handleBack}
        >
          <path
            fillRule="evenodd"
            d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 
      4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 
      0 15 8"
          />
        </svg>

        {loading ? <p className="mb-0">Loading user...</p> : <h5 className="mb-0">{userDetail?.username}</h5>}
      </div>

      {/* Chat Window */}
      <div
        className="chat-window"
        style={{
          height: '500px',
          border: '2px solid green',
          borderRadius: '8px',
          padding: '10px',
          width: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>

        {/* Messages */}
        {/* <div className="chat-messages overflow-auto p-3" style={{ flexGrow: 1 }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender}`}>
              <div className="message-text">{msg.text}</div>
              <div className="message-time text-muted small">{msg.time}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div> */}
        <div className="chat-messages overflow-auto p-3" style={{ flexGrow: 1 }}>
  {messages.map((msg, idx) => (
    <div key={idx} className={`message ${msg.sender}`}>
      {/* Message text */}
      <div className="message-text">{msg.text}</div>

      {/* Check if filePath exists and render image */}
      {msg.filePath && (
        <div className="message-image">
          <img
          src={`http://localhost:5000/uploads/${msg.filePath}`}
            alt="attachment"
            style={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Message time */}
      <div className="message-time text-muted small">{msg.time}</div>
    </div>
  ))}
  <div ref={messagesEndRef} />
</div>


        {/* Input */}
        {/* <div className="chat-input border-top p-2 d-flex">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn btn-success" onClick={handleSend}>
            Send
          </button>
        </div> */}
        {/* Input and Emoji/File Controls */}
<div className="chat-input border-top p-2 d-flex align-items-center position-relative">
  {/* Emoji Button */}
 <button
  type="button"
  className="btn btn-light me-2"
  onClick={() => setShowEmoji(!showEmoji)}
>
  {showEmoji ? '❌' : '😊'}
</button>

  {/* File Upload */}
  <button
    type="button"
    className="btn btn-light me-2"
    onClick={() => fileInputRef.current?.click()}
  >
    📎
  </button>
  <input
    type="file"
    accept="image/*"
    ref={fileInputRef}
    onChange={handleFileChange}
    style={{ display: 'none' }}
  />

  {/* Message Input */}
  <input
    type="text"
    className="form-control me-2"
    placeholder="Type a message..."
    value={inputText}
    onChange={(e) => setInputText(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
  />

  {/* Send Button */}
  <button className="btn btn-success" onClick={handleSend}>
    Send
  </button>

  {/* Emoji Picker */}
  {showEmoji && (
    <div style={{ position: 'absolute', bottom: '60px', left: '10px', zIndex: 10 }}>
      <Picker data={data} onEmojiSelect={addEmoji} />
    </div>
  )}
</div>

      </div>
    </div>
  );

};

export default ChatWindow;


