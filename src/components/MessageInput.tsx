import React, { useState } from 'react';

interface Props {
  onSend: (text: string) => void;
}

const MessageInput: React.FC<Props> = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() !== '') {
      onSend(text);
      setText('');
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
