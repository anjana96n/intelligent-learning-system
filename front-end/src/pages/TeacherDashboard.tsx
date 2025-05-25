import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import CreatePoll from '../components/teacher/CreatePoll';
import CreateQuiz from '../components/teacher/CreateQuiz';
import axios from 'axios';

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

  // Fetch students on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/users/students', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Fetched students:', response.data); // Debug log
        // Initialize all students as absent
        const initialStudents = response.data.map((student: any) => ({
          id: student._id, // Use _id from database
          name: student.name,
          isPresent: false,
          lastActive: new Date()
        }));
        console.log('Initialized students:', initialStudents); // Debug log
        setStudents(initialStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('presence-update', (data: { 
      studentId: string; 
      studentName: string;
      isPresent: boolean;
      lastActive: Date;
    }) => {
      console.log('Received presence update:', data); // Debug log
      setStudents(prev => {
        console.log('Current students:', prev); // Debug log
        // Find the student to update using studentId
        const studentIndex = prev.findIndex(s => s.id === data.studentId);
        if (studentIndex === -1) {
          console.log('Student not found in list:', data.studentName, 'with ID:', data.studentId); // Debug log
          return prev;
        }

        // Create new array with updated student
        const updatedStudents = [...prev];
        updatedStudents[studentIndex] = {
          ...updatedStudents[studentIndex],
          isPresent: data.isPresent,
          lastActive: new Date(data.lastActive)
        };
        console.log('Updated student status:', data.studentName, data.isPresent, 'at', new Date(data.lastActive).toLocaleTimeString()); // Debug log
        return updatedStudents;
      });
    });

    // Cleanup on unmount
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map(student => (
                  <tr key={student.id} className={student.isPresent ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-2 ${
                            student.isPresent ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <span className={`text-sm ${
                          student.isPresent ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {student.isPresent ? 'Present' : 'Absent'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(student.lastActive).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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