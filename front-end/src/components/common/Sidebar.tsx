import React from 'react';
import { Home, BookOpen, BrainCircuit, PieChart, LogOut } from 'lucide-react';

interface SidebarProps {
  onLogout?: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  return (
    <aside className="bg-white w-64 min-h-screen p-4 border-r border-gray-200">
      <nav className="space-y-6">
        <div className="space-y-2">
          <a href="/dashboard" className="flex items-center space-x-3 text-gray-700 p-2 rounded-lg hover:bg-[#4AA7EF] hover:text-white">
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </a>
        </div>
        <div className="pt-6 border-t border-gray-200">
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 text-gray-700 p-2 rounded-lg hover:bg-red-100 hover:text-red-500 w-full"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}