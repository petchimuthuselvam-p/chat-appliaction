import React, { useState } from 'react';
import axios from 'axios';

interface Props {
  onSend: (text: string) => void;
}

const MessageInput: React.FC<Props> = ({ onSend }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

 const handleSend = async () => {
  // Prevent sending empty messages
  if (!text.trim()) return;

  // Ensure user._id is defined
  if (!user || !user._id) {
    setError('User ID not available');
    return;
  }

  try {
    // Send message to backend
    const res = await axios.post('http://localhost:5000/api/auth/send-msg', {
      from: user._id,
      message: text,
    });

    // (Optional) handle response if needed
    console.log('Message sent:', res.data);

    // Clear input field
    setText('');
  } catch (err: any) {
    console.error('Send message error:', err.response?.data || err.message);
    setError(err.response?.data?.msg || 'Message send error');
  }
};


  return (
    <div className="input-group">
      <input
        className="form-control"
        placeholder="Type a message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      />
      <button className="btn btn-primary" onClick={handleSend}>
        Send
      </button>
    </div>
  );
};

export default MessageInput;
