import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './login.css';


const Login: React.FC = () => {
  const [adminEmail, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !password) {
      toast.error("All fields are required");
      return;
    }
    try {
      const response = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail, password })
      });
      const data = await response.json();

      if (data.code === "0000") {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        window.dispatchEvent(new Event('storage'));
        toast.success('Login successful!');

        if (data.role === 'ADMIN') {
          navigate('/dashboard');
        }
        // else {
        //   navigate('/login');
        // }
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Server error');
    }
  };

  const handleRegister = () => {
    navigate('/register'); // Or any other logic
    console.log("register---->")
  };


  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="login-title">Login to your Account</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={adminEmail}
              onChange={e => setEmail(e.target.value)}
              className="form-input"
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="login-button">Login</button>
          <button
            type="button"
            className="login-button"
            style={{ marginTop: '10px' }}
            onClick={handleRegister}
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

