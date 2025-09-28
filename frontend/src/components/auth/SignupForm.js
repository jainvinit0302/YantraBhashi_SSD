import React, { useState } from 'react';
import '../../styles/components.css';  

const SignupForm = ({ onSignup, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('signup');

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    try {
      const response = await fetch('http://localhost:4000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      onSignup();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="main-bg">
      <div className="form-card">
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'login' ? '' : 'inactive'}`}
            onClick={() => { setActiveTab('login'); onSwitchToLogin(); }}
          >
            Login
          </button>
          <button
            className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Signup
          </button>
        </div>
        <h2 className="form-title">Sign Up</h2>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <input
            type="text"
            placeholder="Email Address"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </div>
        <button
          onClick={handleSubmit}
          className="submit-btn"
        >
          Sign Up
        </button>
        <div className="form-footer">
          Already have an account? <button className="footer-link" onClick={onSwitchToLogin}>Login</button>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
