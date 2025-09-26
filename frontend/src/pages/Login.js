import React, { useState } from 'react';
import { api } from '../api';
export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    async function onLogin() {
        try {
            const res = await api.login({ email, password });
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            window.location.href = '/';
        } catch (e) { alert(e.message); }
    }
    return (
        <div style={{ padding: 20 }}>
            <h2>Login</h2>
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br />
            <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
            /><br />
            <button onClick={onLogin}>Login</button>
        </div>
    )
}