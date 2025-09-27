// src/pages/Register.js
import React, { useState } from 'react';
import { api } from '../api'; // adjust import path if needed
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // <- fixed (no "body:")
  const [rollNo, setRollNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate && useNavigate(); // if using react-router

  async function onRegister(e) {
    e?.preventDefault?.();
    setError(null);
    setLoading(true);
    try {
      const payload = { name, email, password, role, rollNo };
      // call your api.register (adjust as needed)
      const res = await api.register(payload);
      // handle token / navigation as your app expects
      localStorage.setItem('token', res.token);
      navigate?.('/'); // optional redirect
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
      <h2>Register</h2>
      <form onSubmit={onRegister}>
        <div>
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>

        <div>
          <label>Role</label>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>

        <div>
          <label>Roll No (optional)</label>
          <input value={rollNo} onChange={e => setRollNo(e.target.value)} />
        </div>

        {error && <div style={{ color: 'red' }}>{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
