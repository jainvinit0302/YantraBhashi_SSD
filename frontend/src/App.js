// src/App.js
import React from 'react';

function getLocalUser() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw || raw === 'undefined') return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function App() {
  const token = localStorage.getItem('token');
  const user = getLocalUser();

  return (
    <div style={{ padding: 20 }}>
      <h1>Yantrabhasha Validator</h1>

      {!token ? (
        <div>
          <a href="/login">Login</a> | <a href="/register">Register</a>
        </div>
      ) : (
        <div>
          <p>
            Hey, {user?.name || 'User'} ({user?.role || 'unknown'})
          </p>
          <div>
            {user?.role === 'student' ? (
              <a href="/student">Student Dashboard</a>
            ) : (
              <a href="/instructor">Instructor Dashboard</a>
            )}
            {' | '}
            <a
              href="#"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
              }}
            >
              Logout
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
