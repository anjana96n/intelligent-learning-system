import React from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar onLogout={handleLogout} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}