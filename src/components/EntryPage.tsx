import React from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/build-a-realtime-chat-app-from-scratch--1-.webp'; 
import './EntryPage.css';

const EntryPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    // Updated TSX
<div className="entry-wrapper" style={{ backgroundImage: `url(${bgImage})` }}>
  <div className="entry-card shadow-lg p-4 bg-white bg-opacity-10">
    <button className="btn btn-secondary entry-btn mb-3" onClick={() => navigate('/signin')}>
     Sign In
    </button>

    <button className="btn btn-secondary entry-btn mb-3" onClick={() => navigate('/register')}>
      Register
    </button>

    <button className="btn btn-secondary entry-btn" onClick={() => navigate('/home')}>
      Guest
    </button>
  </div>
</div>
  );
};

export default EntryPage;
