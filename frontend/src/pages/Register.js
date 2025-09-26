import React, { useState } from 'react';
import { api } from '../api';
export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    body: const [role, setRole] = useState('student');
    const [rollNo, setRollNo] = useState('');
    async function onRegister() {
        try {
            const res = await api.register({ name, email, password, role, rollNo });
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            window.location.href = '/';
        } catch (e) { alert(e.message); }
    }
    return (
        <div style={{ padding: 20 }}>
            <h2>Register</h2>
            <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} /><br />
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br />
            <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
            /><br />
            <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
            </select><br />
            {role
                ===
                'student'
                &&
                <input
                    placeholder="Roll
No"
                    value={rollNo}
                    onChange={e => setRollNo(e.target.value)} />}
            <br />
            <button onClick={onRegister}>Register</button>
        </div>
    )
}