import React, { useState } from 'react';
import axios from 'axios';
import './SignIn.css';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/AdobeStock_868510427_Preview.jpeg';

const SignIn = () => {
  const navigate = useNavigate();
  const [user,setUser] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // error message state

  const login = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validate fields
    if (!email || !password) {
      setError('Both Email and Password are required');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res?.data.user));
      window.location.href = '/home';
    } catch (err: any) {
      console.error('Login failed:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Login error');
    }
  };

  return (
    <div
      className="wrapper"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100vw',
        height: '100vh',
      }}
    >
      <button className="back-btn" onClick={() => navigate('/')}>
        🔙 Back
      </button>

      <section className="container">
        <div className="login-container">
          <div className="circle circle-one"></div>
          <div className="form-container">
            <h1 className="opacity">Sign In</h1>
            {error && <p className="text-danger">{error}</p>} 

            <form onSubmit={login}>
              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" className="opacity">
                Submit
              </button>
            </form>
          </div>
          <div className="circle circle-two"></div>
        </div>
      </section>
    </div>
  );
};

export default SignIn;
