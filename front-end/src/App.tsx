import React from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  // Temporary login state for demonstration
  const isLoggedIn = true;

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoggedIn ? <DashboardPage /> : <LoginPage />}
    </div>
  );
}

export default App;