import React from 'react';
import { Brain, GraduationCap, TestTube2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
            <div className="relative">
              <Brain className="h-8 w-8 text-white" />
              <GraduationCap className="h-6 w-6 text-blue-300 absolute -top-1 -right-1" />
            </div>
            <span className="ml-2 text-2xl font-bold text-white">JoyStudy</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <span className="text-blue-100">Welcome, {user?.name}</span>
            
            <nav className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-white/20 text-white'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Brain size={16} />
                <span>Dashboard</span>
              </Link>
              
              {user?.role === 'teacher' && (
                <Link
                  to="/speech-testing"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/speech-testing')
                      ? 'bg-white/20 text-white'
                      : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <TestTube2 size={16} />
                  <span>Speech Testing</span>
                </Link>
              )}
              
              <button
                onClick={handleLogout}
                className="text-blue-200 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}