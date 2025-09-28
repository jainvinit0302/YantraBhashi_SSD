import React, { useState } from 'react';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import CompilerInterface from './components/compiler/CompilerInterface';
import InstructorDashboard from './components/dashboard/InstructorDashboard';
import './styles/components.css';

const App = () => {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === 'admin') {
      setCurrentView('instructor');
    } else {
      setCurrentView('compiler');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
  };

  const handleSignup = () => {
    setCurrentView('login');
  };

  const switchToSignup = () => {
    setCurrentView('signup');
  };

  const switchToLogin = () => {
    setCurrentView('login');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'signup':
        return <SignupForm onSignup={handleSignup} onSwitchToLogin={switchToLogin} />;
      case 'login':
        return <LoginForm onLogin={handleLogin} onSwitchToSignup={switchToSignup} />;
      case 'compiler':
        return user ? <CompilerInterface user={user} onLogout={handleLogout} /> : null;
      case 'instructor':
        return user ? <InstructorDashboard user={user} onLogout={handleLogout} /> : null;
      default:
        return <LoginForm onLogin={handleLogin} onSwitchToSignup={switchToSignup} />;
    }
  };

  return <div className="app">{renderCurrentView()}</div>;
};

export default App;