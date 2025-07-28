import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import CreatePoll from '../components/teacher/CreatePoll';
import CreateQuiz from '../components/teacher/CreateQuiz';
import SpeechRecognition from '../components/teacher/SpeechRecognition';
import StatisticsDashboard from '../components/teacher/StatisticsDashboard';
import { Brain, GraduationCap, Users, BarChart3, Plus, Eye } from 'lucide-react';
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
  const [showStatistics, setShowStatistics] = useState(true);

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-pink-400/10 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-1/3 w-16 h-16 bg-indigo-400/10 rounded-full blur-xl animate-pulse delay-3000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation Bar */}
        <nav className="backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="relative">
                  <Brain className="h-8 w-8 text-white" />
                  <GraduationCap className="h-6 w-6 text-purple-300 absolute -top-1 -right-1" />
                </div>
                <h1 className="ml-2 text-xl font-semibold text-white">Teacher Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-purple-100">Welcome, {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to JoyStudy</h1>
            <p className="text-purple-100">Your intelligent teaching dashboard</p>
          </div>

          {/* Action Buttons */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-purple-300" />
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowCreatePoll(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg hover:scale-105 transition-all duration-200 flex items-center"
              >
                <Users className="h-5 w-5 mr-2" />
                Create Poll
              </button>
              <button
                onClick={() => setShowCreateQuiz(true)}
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-6 py-3 rounded-lg hover:scale-105 transition-all duration-200 flex items-center"
              >
                <Brain className="h-5 w-5 mr-2" />
                Create Quiz
              </button>
              <button
                onClick={() => setShowStatistics(!showStatistics)}
                className={`px-6 py-3 rounded-lg hover:scale-105 transition-all duration-200 flex items-center min-w-[160px] justify-center ${
                  showStatistics 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white' 
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white'
                }`}
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                {showStatistics ? 'Show Details' : 'Show Statistics'}
              </button>
            </div>
          </div>

          {/* Speech Recognition */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 mb-6">
            <SpeechRecognition 
              socket={socket}
              teacherId={user?._id || ''}
              teacherName={user?.name || ''}
            />
          </div>

          {/* Statistics Dashboard */}
          {showStatistics && (
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 mb-6">
              <StatisticsDashboard 
                students={students}
                polls={polls}
                quizzes={quizzes}
              />
            </div>
          )}

          {/* Detailed Views */}
          {!showStatistics && (
            <>
              {/* Student Presence */}
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-green-300" />
                  Student Presence
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/5">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                          Last Active
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/5 divide-y divide-white/20">
                      {students.map(student => (
                        <tr key={student.id} className={student.isPresent ? 'bg-green-500/10' : 'bg-red-500/10'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{student.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`w-3 h-3 rounded-full mr-2 ${
                                  student.isPresent ? 'bg-green-400' : 'bg-red-400'
                                }`}
                              />
                              <span className={`text-sm ${
                                student.isPresent ? 'text-green-300' : 'text-red-300'
                              }`}>
                                {student.isPresent ? 'Present' : 'Absent'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                            {new Date(student.lastActive).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quiz Responses Section */}
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-300" />
                  Quiz Responses
                </h2>
                <div className="space-y-6">
                  {quizzes.map(quiz => {
                    const responseCount = quiz.responses.length;
                    const totalStudents = quiz.targetStudents.length;
                    const allResponded = responseCount === totalStudents;
                    const averageScore = quiz.responses.length > 0
                      ? quiz.responses.reduce((sum, r) => sum + r.score, 0) / quiz.responses.length
                      : 0;

                    return (
                      <div key={quiz._id} className="border border-white/20 rounded-lg p-4 bg-white/5">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium text-white">{quiz.title}</h3>
                          <div className="text-sm text-blue-200">
                            Responses: {responseCount}/{totalStudents}
                            {allResponded && (
                              <span className="ml-2 text-green-400">(All responded)</span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-4">
                          {quiz.questions.map((question, qIndex) => (
                            <div key={qIndex} className="bg-white/10 p-4 rounded-lg border border-white/20">
                              <h4 className="font-medium mb-2 text-white">{question.question}</h4>
                              <div className="space-y-2">
                                {quiz.responses.map(response => (
                                  <div key={response.studentId} className="flex items-center justify-between bg-white/10 p-2 rounded border border-white/20">
                                    <div className="flex items-center space-x-4">
                                      <span className="text-blue-100">{response.studentName}</span>
                                      <span className="text-sm text-blue-200">
                                        Selected: Option {response.answers[qIndex] + 1}
                                      </span>
                                      <span className={`text-sm ${
                                        response.answers[qIndex] === question.correctAnswer
                                          ? 'text-green-400'
                                          : 'text-red-400'
                                      }`}>
                                        {response.answers[qIndex] === question.correctAnswer
                                          ? '✓ Correct'
                                          : '✗ Incorrect'}
                                      </span>
                                    </div>
                                    <span className="text-sm text-blue-200">
                                      Score: {response.score}/{quiz.questions.length}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 text-sm text-blue-200">
                                Correct Answer: Option {question.correctAnswer + 1}
                              </div>
                            </div>
                          ))}
                          <div className="mt-4 text-sm text-blue-200">
                            Average Score: {averageScore.toFixed(1)}/{quiz.questions.length}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {quizzes.length === 0 && (
                    <p className="text-blue-200 text-center">No active quizzes</p>
                  )}
                </div>
              </div>

              {/* Poll Responses Section */}
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-300" />
                  Poll Responses
                </h2>
                <div className="space-y-6">
                  {polls.map(poll => {
                    const responseCount = poll.responses.length;
                    const totalStudents = poll.targetStudents.length;
                    const allResponded = responseCount === totalStudents;

                    return (
                      <div key={poll._id} className="border border-white/20 rounded-lg p-4 bg-white/5">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium text-white">{poll.question}</h3>
                          <div className="text-sm text-blue-200">
                            Responses: {responseCount}/{totalStudents}
                            {allResponded && (
                              <span className="ml-2 text-green-400">(All responded)</span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-4">
                          {poll.options.map((option, index) => (
                            <div key={index} className="bg-white/10 p-4 rounded-lg border border-white/20">
                              <h4 className="font-medium mb-2 text-white">{option}</h4>
                              <div className="space-y-2">
                                {poll.responses
                                  .filter(response => response.response === option)
                                  .map(response => (
                                    <div key={response.studentId} className="flex items-center justify-between bg-white/10 p-2 rounded border border-white/20">
                                      <span className="text-blue-100">{response.studentName}</span>
                                      <span className="text-sm text-blue-200">
                                        {new Date(poll.createdAt).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  ))}
                                {poll.responses.filter(response => response.response === option).length === 0 && (
                                  <p className="text-blue-200 text-sm">No responses yet</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {polls.length === 0 && (
                    <p className="text-blue-200 text-center">No active polls</p>
                  )}
                </div>
              </div>
            </>
          )}
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