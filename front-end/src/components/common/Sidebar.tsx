import React from 'react';
import { Home, BookOpen, BrainCircuit, PieChart, LogOut } from 'lucide-react';

interface SidebarProps {
  onLogout?: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  return (
    <aside className="backdrop-blur-xl bg-white/10 border-r border-white/20 w-64 min-h-screen p-4">
      <nav className="space-y-6">
        <div className="space-y-2">
          <a href="/dashboard" className="flex items-center space-x-3 text-blue-100 p-3 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200">
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </a>
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