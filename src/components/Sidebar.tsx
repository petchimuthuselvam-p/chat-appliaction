import React from 'react';

interface SidebarProps {
  chats: any[];
  onSelectChat: (chat: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ chats, onSelectChat }) => {
  return (
    <div className="bg-light border-end p-3" style={{ height: '100vh', overflowY: 'auto' }}>
      <h5 className="mb-3">Chats</h5>
      {chats.map((chat, index) => (
        <div key={index} onClick={() => onSelectChat(chat)} className="p-2 border-bottom chat-item">
          <strong>{chat.name}</strong>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
