import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import CreatePoll from '../components/teacher/CreatePoll';
import CreateQuiz from '../components/teacher/CreateQuiz';

interface Student {
  id: string;
  name: string;
  isPresent: boolean;
  lastActive: Date;
}

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('presence-update', (data: { studentId: string; isPresent: boolean }) => {
      setStudents(prev => prev.map(student => 
        student.id === data.studentId 
          ? { ...student, isPresent: data.isPresent, lastActive: new Date() }
          : student
      ));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Teacher Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowCreatePoll(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Create Poll
            </button>
            <button
              onClick={() => setShowCreateQuiz(true)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Create Quiz
            </button>
          </div>
        </div>

        {/* Student Presence */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Student Presence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map(student => (
              <div
                key={student.id}
                className={`p-4 rounded-lg border ${
                  student.isPresent ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{student.name}</h3>
                    <p className="text-sm text-gray-500">
                      Last active: {new Date(student.lastActive).toLocaleTimeString()}
                    </p>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      student.isPresent ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Poll Modal */}
      {showCreatePoll && (
        <CreatePoll
          onClose={() => setShowCreatePoll(false)}
          socket={socket}
        />
      )}

      {/* Create Quiz Modal */}
      {showCreateQuiz && (
        <CreateQuiz
          onClose={() => setShowCreateQuiz(false)}
          socket={socket}
        />
      )}
    </div>
  );
};

export default TeacherDashboard; 