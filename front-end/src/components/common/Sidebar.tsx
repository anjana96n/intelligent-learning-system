import React from 'react';
import { Home, BookOpen, BrainCircuit, PieChart, LogOut, TestTube2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  onLogout?: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="backdrop-blur-xl bg-white/10 border-r border-white/20 w-64 min-h-screen p-4">
      <nav className="space-y-6">
        <div className="space-y-2">
          <Link 
            to="/dashboard" 
            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
              isActive('/dashboard') 
                ? 'bg-white/20 text-white' 
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          
          {user?.role === 'teacher' && (
            <Link 
              to="/speech-testing" 
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                isActive('/speech-testing') 
                  ? 'bg-white/20 text-white' 
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <TestTube2 className="h-5 w-5" />
              <span>Speech Testing</span>
            </Link>
          )}
        </div>
        <div className="pt-6 border-t border-white/20">
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 text-red-200 p-3 rounded-lg hover:bg-red-500/20 hover:text-red-100 transition-all duration-200 w-full"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}