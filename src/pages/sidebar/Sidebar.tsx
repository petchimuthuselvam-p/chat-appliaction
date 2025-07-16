import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('storage'));
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <h3>Admin</h3>
      <NavLink to="/dashboard" className="sidebar-link">Dashboard</NavLink>
      <NavLink to="/users" className="sidebar-link">Users</NavLink>
      <NavLink to="/login" className="sidebar-link">Logout</NavLink>

    </div>
  );
};

export default Sidebar;
