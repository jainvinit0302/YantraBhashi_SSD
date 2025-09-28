import React, { useState } from 'react';
import { DEMO_CREDENTIALS } from '../../utils/constants';
import '../../styles/components.css';  

const LoginForm = ({ onLogin, onSwitchToSignup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('login');

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    try {
      const response = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      onLogin(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="main-bg">
      <div className="form-card">
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`tab-btn ${activeTab === 'signup' ? '' : 'inactive'}`}
            onClick={() => { setActiveTab('signup'); onSwitchToSignup(); }}
          >
            Signup
          </button>
        </div>
        <h2 className="form-title">Login Form</h2>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <input
            type="text"
            placeholder="Email Address"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="forgot-row">
          <button
            onClick={() => alert('Forgot password functionality to be implemented')}
            className="forgot-link"
            type="button"
          >
            Forgot password?
          </button>
        </div>
        <button
          onClick={handleSubmit}
          className="submit-btn"
        >
          Login
        </button>
        <div className="form-footer">
          Not a member? <button className="footer-link" onClick={onSwitchToSignup}>Signup now</button>
        </div>
        <div className="demo-cred">
          <p className="demo-label">Demo Credentials:</p>
          <p className="demo-text">Admin: {DEMO_CREDENTIALS.admin.username} / {DEMO_CREDENTIALS.admin.password}</p>
          <p className="demo-text">Student: {DEMO_CREDENTIALS.student.username} / {DEMO_CREDENTIALS.student.password}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
