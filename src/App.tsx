import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/login/login';
import GetEmployee from './pages/getEmployee/GetEmployee';
import Dashboard from './pages/dashboard/Dashboard';
import Sidebar from './pages/sidebar/Sidebar';
import Header from './pages/header/Header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Settings from './pages/setting/setting';
import './App.css';
import Register from './pages/register/Register';


const App: React.FC = () => {
  const location = useLocation();
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));

  useEffect(() => {
    const handleStorage = () => {
      setToken(localStorage.getItem('token'));
      setRole(localStorage.getItem('role'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const showLayout = !!token && location.pathname !== '/login';

  return (
    <div className="app-container">
      {showLayout && <Header />}
      <div className="main-layout">
        {showLayout && <Sidebar />}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/users" element={token && role === 'ADMIN' ? (<GetEmployee />) : token ? (
              <Navigate to="/dashboard" />) : (<Navigate to="/login" />)
            } />
            <Route path="/setting" element={token && role === 'ADMIN' ? (<Settings />) : token ? (
              <Navigate to="/dashboard" />) : (<Navigate to="/login" />)
            } />
            <Route path="*" element={<Navigate to="/login" />} />
            <Route path="/register" element={<Register />} />

          </Routes>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={1200}
        hideProgressBar
        closeOnClick
        rtl={false}
        theme="colored"
      />
    </div>
  );
};

export default App;

