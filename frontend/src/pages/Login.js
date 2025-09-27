import React, { useState } from 'react';
import { api } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    try {
      setLoading(true);
      const res = await api.login({ email, password });
      // save token & user
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));

      // role-based redirect
      const role = res.user?.role?.toLowerCase?.() || '';
if (role === 'student') {
  window.location.href = '/student';   // or navigate('/student')
} else if (role === 'instructor') {
  window.location.href = '/instructor'; // or navigate('/instructor')
} else {
  window.location.href = '/';
}

    } catch (e) {
      alert(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      /><br />
      <button onClick={onLogin} disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
    </div>
  );
}
