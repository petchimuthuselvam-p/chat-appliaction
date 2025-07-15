import React from 'react';

interface ChatWindowProps {
  messages: any[];
  currentUserId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, currentUserId }) => {
  return (
    <div className="d-flex flex-column justify-content-between h-100 p-3">
      <div className="overflow-auto mb-3" style={{ maxHeight: '80vh' }}>
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.from === currentUserId ? 'text-end' : 'text-start'}`}>
            <span className={`d-inline-block p-2 rounded ${msg.from === currentUserId ? 'bg-success text-white' : 'bg-light'}`}>
              {msg.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatWindow;
