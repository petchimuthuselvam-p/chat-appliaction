import React, { useState } from 'react';
import './Register.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    mobile: '',
    dob: '',
    password: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [passcode, setPasscode] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleRegister = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.username) newErrors.username = 'Username is required';
    if (!form.email) newErrors.email = 'Email is required';
    if (!form.mobile) newErrors.mobile = 'Mobile number is required';
    if (!form.dob) newErrors.dob = 'Date of birth is required';
    if (!form.password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsLoading(true);
      const res = await axios.post('http://localhost:5000/api/auth/register', form);

      if (res?.data?.statusCode === 200) {
        console.log('Registration successful:', res.data);
        setShowVerify(true);
      } else {
        alert(res.data?.msg || 'Unexpected error');
      }
    } catch (err: any) {
      console.error('Registration failed:', err.response?.data || err.message);
      alert(err.response?.data?.msg || 'Registration error');
    } finally {
      setIsLoading(false);
    }
  };



   const handleVerify = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify', {
        email: form?.email,
         passcode: passcode,
      });

      if (res.data.token) {
        // Save token and redirect
        localStorage.setItem('token', res.data.token);
        window.location.href = '/home';
      }
    } catch (error) {
      console.error('Verification failed:', error);
      alert('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-bg d-flex align-items-center justify-content-center vh-100">
      <button className="back-button btn btn-outline-secondary position-absolute top-0 start-0 m-3" onClick={() => navigate('/')}>
        🔙 Back
      </button>

      {!showVerify ? (
        <div className="card p-4 register-card">
          <div className="text-center mb-4">
            <div className="icon-circle mb-3">
              <i className="bi bi-person fs-3 text-white"></i>
            </div>
            <h2>Create Account</h2>
            <p className="text-muted">Join us and start your journey</p>
          </div>

          <form>
            {[
              { name: 'username', type: 'text', icon: 'person', placeholder: 'Username' },
              { name: 'email', type: 'email', icon: 'envelope', placeholder: 'Email address' },
              { name: 'mobile', type: 'tel', icon: 'phone', placeholder: 'Mobile number' },
              { name: 'dob', type: 'date', icon: 'calendar', placeholder: '' },
            ].map(({ name, type, icon, placeholder }) => (
              <div className="form-group mb-3 position-relative" key={name}>
                <i className={`bi bi-${icon} input-icon`}></i>
                <input
                  type={type}
                  name={name}
                  className={`form-control ps-5 ${errors[name] ? 'is-invalid' : ''}`}
                  placeholder={placeholder}
                  value={(form as any)[name]}
                  onChange={handleChange}
                />
                {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
              </div>
            ))}

            <div className="form-group mb-4 position-relative">
              <i className="bi bi-lock input-icon"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className={`form-control ps-5 pe-5 ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
              />
              <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </span>
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            <button
              type="button"
              className="btn btn-primary w-100 mb-3"
              onClick={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="spinner-border spinner-border-sm text-light" role="status"></div>
              ) : (
                <>
                  Create Account <i className="bi bi-arrow-right"></i>
                </>
              )}
            </button>

            <p className="text-center text-muted">
              Already have an account? <a href="#" className="text-primary">Sign in here</a>
            </p>
          </form>
        </div>
      ) : (
        <div className="card p-4 register-card">
          <div className="text-center mb-4">
            <div className="icon-circle bg-success mb-3">
              <i className="bi bi-shield-check fs-3 text-white"></i>
            </div>
            <h2>Verify Account</h2>
            <p className="text-muted">Enter the 6-digit code sent to your email</p>
          </div>

          <div className="form-group mb-4 position-relative">
            <i className="bi bi-shield-lock input-icon"></i>
            <input
              type="text"
              className="form-control text-center fs-4"
              placeholder="Enter 6-digit code"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              maxLength={6}
            />
          </div>

          <button
            type="button"
            className="btn btn-success w-100 mb-3"
            onClick={handleVerify}
            disabled={isLoading || passcode.length !== 6}
          >
            {isLoading ? (
              <div className="spinner-border spinner-border-sm text-light" role="status" ></div>
            ) : (
              <>
                Verify Account <i className="bi bi-check-circle"></i>
              </>
            )}
          </button>

          <p className="text-center text-muted">
            Didn't receive the code? <a href="#" className="text-success">Resend Code</a>
          </p>
        </div>
      )}
    </div>
  );
};

export default Register;
