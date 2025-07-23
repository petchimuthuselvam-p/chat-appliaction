import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../login/login.css';

const Register: React.FC = () => {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const generate16DigitId = () => {
    return Math.random().toString().slice(2, 18).padEnd(16, '0');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminEmail || !password || !adminName) {
      toast.error("All fields are required");
      return;
    }

    const adminId = generate16DigitId();

    try {
      const response = await fetch('http://localhost:8080/api/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          adminName,
          adminEmail,
          password,
          roleName: 'ADMIN' // optional, can be set by backend too
        }),
      });

      const data = await response.json();

      if (data.code === "0000") {
        toast.success("Admin Registered Successfully!");
        navigate('/login');
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      toast.error("Server error");
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="login-title">Admin Registration</h2>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              placeholder="Admin Name"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="Admin Email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>
          <button type="submit" className="login-button">Register</button>
          <button
            type="button"
            className="login-button"
            style={{ marginTop: '10px', backgroundColor: '#ccc', color: '#000' }}
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
