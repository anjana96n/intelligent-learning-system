import React from 'react';
import { Brain, GraduationCap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <Brain className="h-8 w-8 text-white" />
              <GraduationCap className="h-6 w-6 text-blue-300 absolute -top-1 -right-1" />
            </div>
            <span className="ml-2 text-2xl font-bold text-white">JoyStudy</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-blue-100">Welcome, {user?.name}</span>
            <nav className="flex space-x-4">
              <a href="/dashboard" className="text-blue-200 hover:text-white transition-colors">Dashboard</a>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}