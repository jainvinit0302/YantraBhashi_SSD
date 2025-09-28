import React from 'react';
import { User, LogOut, Users } from 'lucide-react';
import  '../../styles/components.css';  


const Header = ({ title, user, onLogout }) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-gray-600">
            {user.role === 'admin' ? <Users size={20} /> : <User size={20} />}
            {user.username} {user.role === 'admin' && '(Admin)'}
          </span>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;