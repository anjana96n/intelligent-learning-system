import React from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-[#4AA7EF]" />
            <span className="ml-2 text-2xl font-bold text-[#4AA7EF]">JoyStudy</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user?.name}</span>
            <nav className="flex space-x-4">
              <a href="/dashboard" className="text-gray-600 hover:text-[#4AA7EF]">Dashboard</a>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}