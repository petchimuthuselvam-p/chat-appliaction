import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('storage'));
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="sidebar">
      <h3>Admin</h3>
      <NavLink to="/dashboard" className="sidebar-link">Dashboard</NavLink>
      <NavLink to="/users" className="sidebar-link">Users</NavLink>
      <NavLink to="/setting" className="sidebar-link">Settings</NavLink>

      <NavLink
        to="#"
        className="sidebar-link"
        onClick={handleLogoutClick}
      >
        Logout
      </NavLink>


      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Are your sure want ot Logout?</h4>
            <div className="modal-buttons">
              <button onClick={confirmLogout}>OK</button>
              <button onClick={cancelLogout}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
