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

interface Poll {
  _id: string;
  question: string;
  options: string[];
  responses: {
    studentId: string;
    studentName: string;
    response: string;
  }[];
  targetStudents: string[];
  createdAt: string;
}

interface Quiz {
  _id: string;
  title: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  responses: {
    studentId: string;
    studentName: string;
    answers: number[];
    score: number;
  }[];
  targetStudents: string[];
  createdAt: string;
}

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  // Helper function to calculate quiz score
  const calculateScore = (answers: number[], questions: Quiz['questions']) => {
    return questions.reduce((score, question, index) => {
      return score + (question.correctAnswer === answers[index] ? 1 : 0);
    }, 0);
  };

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
    console.log('Setting up socket connection...'); // Debug log
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected in TeacherDashboard'); // Debug log
    });

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

    // Listen for new polls
    newSocket.on('poll-created', (poll: Poll) => {
      console.log('Received new poll:', poll);
      setPolls(prev => [poll, ...prev]);
    });

    // Listen for poll updates
    newSocket.on('poll-updated', (updatedPoll: Poll) => {
      console.log('Received poll update:', updatedPoll);
      setPolls(prev => prev.map(p => p._id === updatedPoll._id ? updatedPoll : p));
    });

    // Listen for poll removal
    newSocket.on('poll-removed', (pollId: string) => {
      console.log('Poll removed:', pollId);
      setPolls(prev => prev.filter(p => p._id !== pollId));
    });

    // Listen for poll responses
    newSocket.on('poll-response', (data: { pollId: string; studentId: string; studentName: string; response: string }) => {
      setPolls(prev => prev.map(poll => {
        if (poll._id === data.pollId) {
          const updatedResponses = [...poll.responses];
          const existingResponseIndex = updatedResponses.findIndex(
            r => r.studentId === data.studentId
          );
          
          if (existingResponseIndex !== -1) {
            updatedResponses[existingResponseIndex] = {
              studentId: data.studentId,
              studentName: data.studentName,
              response: data.response
            };
          } else {
            updatedResponses.push({
              studentId: data.studentId,
              studentName: data.studentName,
              response: data.response
            });
          }

          return {
            ...poll,
            responses: updatedResponses
          };
        }
        return poll;
      }));
    });

    // Listen for new quizzes
    newSocket.on('quiz-created', (quiz: Quiz) => {
      console.log('Received new quiz in TeacherDashboard:', quiz); // Debug log
      setQuizzes(prev => {
        console.log('Current quizzes:', prev); // Debug log
        return [quiz, ...prev];
      });
    });

    // Listen for quiz updates
    newSocket.on('quiz-updated', (updatedQuiz: Quiz) => {
      console.log('Received quiz update in TeacherDashboard:', updatedQuiz); // Debug log
      setQuizzes(prev => prev.map(q => q._id === updatedQuiz._id ? updatedQuiz : q));
    });

    // Listen for quiz removal
    newSocket.on('quiz-removed', (quizId: string) => {
      console.log('Quiz removed in TeacherDashboard:', quizId); // Debug log
      setQuizzes(prev => prev.filter(q => q._id !== quizId));
    });

    // Listen for quiz responses
    newSocket.on('quiz-response', (data: { quizId: string; studentId: string; studentName: string; answers: number[] }) => {
      console.log('Received quiz response in TeacherDashboard:', data); // Debug log
      setQuizzes(prev => prev.map(quiz => {
        if (quiz._id === data.quizId) {
          const updatedResponses = [...quiz.responses];
          const existingResponseIndex = updatedResponses.findIndex(
            r => r.studentId === data.studentId
          );
          
          if (existingResponseIndex !== -1) {
            updatedResponses[existingResponseIndex] = {
              studentId: data.studentId,
              studentName: data.studentName,
              answers: data.answers,
              score: calculateScore(data.answers, quiz.questions)
            };
          } else {
            updatedResponses.push({
              studentId: data.studentId,
              studentName: data.studentName,
              answers: data.answers,
              score: calculateScore(data.answers, quiz.questions)
            });
          }

          return {
            ...quiz,
            responses: updatedResponses
          };
        }
        return quiz;
      }));
    });

    return () => {
      console.log('Cleaning up socket connection...'); // Debug log
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  const handleLogout = () => {
    // Close socket connection
    if (socket) {
      socket.close();
    }
    // Logout and navigate
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

        {/* Quiz Responses Section */}
        <div className="bg-white shadow rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold mb-4">Quiz Responses</h2>
          <div className="space-y-6">
            {quizzes.map(quiz => {
              const responseCount = quiz.responses.length;
              const totalStudents = quiz.targetStudents.length;
              const allResponded = responseCount === totalStudents;
              const averageScore = quiz.responses.length > 0
                ? quiz.responses.reduce((sum, r) => sum + r.score, 0) / quiz.responses.length
                : 0;

              return (
                <div key={quiz._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">{quiz.title}</h3>
                    <div className="text-sm text-gray-500">
                      Responses: {responseCount}/{totalStudents}
                      {allResponded && (
                        <span className="ml-2 text-green-500">(All responded)</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {quiz.questions.map((question, qIndex) => (
                      <div key={qIndex} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">{question.question}</h4>
                        <div className="space-y-2">
                          {quiz.responses.map(response => (
                            <div key={response.studentId} className="flex items-center justify-between bg-white p-2 rounded">
                              <div className="flex items-center space-x-4">
                                <span className="text-gray-700">{response.studentName}</span>
                                <span className="text-sm text-gray-500">
                                  Selected: Option {response.answers[qIndex] + 1}
                                </span>
                                <span className={`text-sm ${
                                  response.answers[qIndex] === question.correctAnswer
                                    ? 'text-green-500'
                                    : 'text-red-500'
                                }`}>
                                  {response.answers[qIndex] === question.correctAnswer
                                    ? '✓ Correct'
                                    : '✗ Incorrect'}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                Score: {response.score}/{quiz.questions.length}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          Correct Answer: Option {question.correctAnswer + 1}
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 text-sm text-gray-500">
                      Average Score: {averageScore.toFixed(1)}/{quiz.questions.length}
                    </div>
                  </div>
                </div>
              );
            })}
            {quizzes.length === 0 && (
              <p className="text-gray-500 text-center">No active quizzes</p>
            )}
          </div>
        </div>

        {/* Poll Responses Section */}
        <div className="bg-white shadow rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold mb-4">Poll Responses</h2>
          <div className="space-y-6">
            {polls.map(poll => {
              const responseCount = poll.responses.length;
              const totalStudents = poll.targetStudents.length;
              const allResponded = responseCount === totalStudents;

              return (
                <div key={poll._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">{poll.question}</h3>
                    <div className="text-sm text-gray-500">
                      Responses: {responseCount}/{totalStudents}
                      {allResponded && (
                        <span className="ml-2 text-green-500">(All responded)</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {poll.options.map((option, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">{option}</h4>
                        <div className="space-y-2">
                          {poll.responses
                            .filter(response => response.response === option)
                            .map(response => (
                              <div key={response.studentId} className="flex items-center justify-between bg-white p-2 rounded">
                                <span className="text-gray-700">{response.studentName}</span>
                                <span className="text-sm text-gray-500">
                                  {new Date(poll.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                          {poll.responses.filter(response => response.response === option).length === 0 && (
                            <p className="text-gray-500 text-sm">No responses yet</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {polls.length === 0 && (
              <p className="text-gray-500 text-center">No active polls</p>
            )}
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