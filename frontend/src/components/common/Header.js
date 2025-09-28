import React from 'react';
import { User, LogOut } from 'lucide-react';
import '../../styles/components.css';

const Header = ({ title, user, onLogout }) => {
  return (
    <header className="header-bar">
      <div className="header-content">
        <h1 className="header-title">{title}</h1>
        <div className="header-user-controls">
          <span className="user-info">
            <User size={20} />
            {user.username} {user.role === 'admin' && '(Admin)'}
          </span>
          <button onClick={onLogout} className="logout-btn">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
