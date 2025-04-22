import React from 'react';
import { BookOpen } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-[#4AA7EF]" />
            <span className="ml-2 text-2xl font-bold text-[#4AA7EF]">JoyStudy</span>
          </div>
          <nav className="flex space-x-4">
            <a href="/dashboard" className="text-gray-600 hover:text-[#4AA7EF]">Dashboard</a>
            <a href="/notes" className="text-gray-600 hover:text-[#4AA7EF]">Notes</a>
            <a href="/quizzes" className="text-gray-600 hover:text-[#4AA7EF]">Quizzes</a>
            <a href="/polls" className="text-gray-600 hover:text-[#4AA7EF]">Polls</a>
          </nav>
        </div>
      </div>
    </header>
  );
}