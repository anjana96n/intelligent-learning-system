import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import * as faceapi from 'face-api.js';

interface Poll {
  _id: string;
  question: string;
  options: string[];
  responses: { studentId: string; response: string }[];
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
  createdAt: string;
}

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isPresent, setIsPresent] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const presenceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Listen for new polls
    newSocket.on('poll-created', (poll: Poll) => {
      setPolls(prev => [poll, ...prev]);
      // Remove poll after 3 minutes
      setTimeout(() => {
        setPolls(prev => prev.filter(p => p._id !== poll._id));
      }, 3 * 60 * 1000);
    });

    // Listen for poll updates
    newSocket.on('poll-updated', (updatedPoll: Poll) => {
      setPolls(prev => prev.map(p => p._id === updatedPoll._id ? updatedPoll : p));
    });

    // Listen for new quizzes
    newSocket.on('quiz-created', (quiz: Quiz) => {
      setQuizzes(prev => [quiz, ...prev]);
      // Remove quiz after 3 minutes
      setTimeout(() => {
        setQuizzes(prev => prev.filter(q => q._id !== quiz._id));
      }, 3 * 60 * 1000);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Loading face detection models...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        console.log('Face detection models loaded successfully');
      } catch (error) {
        console.error('Error loading face detection models:', error);
      }
    };

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            console.log('Video stream ready');
          };
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    loadModels();
    startVideo();
  }, []);

  useEffect(() => {
    const detectFace = async () => {
      if (videoRef.current && canvasRef.current) {
        try {
          const detections = await faceapi.detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          );

          const isFaceDetected = detections.length > 0;
          console.log('Face detected:', isFaceDetected, 'Current status:', isPresent); // Debug log
          
          if (isFaceDetected) {
            // Clear any existing timeout
            if (presenceTimeoutRef.current) {
              clearTimeout(presenceTimeoutRef.current);
              presenceTimeoutRef.current = null;
            }
            
            // Always emit presence update when face is detected
            if (socket && user) {
              console.log('Emitting presence update - Present for user:', user); // Debug log
              socket.emit('student-presence', {
                studentId: user._id,
                studentName: user.name,
                isPresent: true,
                lastActive: new Date()
              });
              setIsPresent(true);
            }
          } else {
            // If no face is detected and we're currently marked as present
            if (isPresent && !presenceTimeoutRef.current) {
              console.log('Starting absence timeout'); // Debug log
              // Set timeout to mark as absent after 10 seconds
              presenceTimeoutRef.current = setTimeout(() => {
                if (socket && user) {
                  console.log('Emitting presence update - Absent for user:', user); // Debug log
                  socket.emit('student-presence', {
                    studentId: user._id,
                    studentName: user.name,
                    isPresent: false,
                    lastActive: new Date()
                  });
                  setIsPresent(false);
                }
                presenceTimeoutRef.current = null;
              }, 10000);
            }
          }
        } catch (error) {
          console.error('Error detecting face:', error);
        }
      }
    };

    // Check for face every second
    const interval = setInterval(detectFace, 1000);
    return () => {
      clearInterval(interval);
      if (presenceTimeoutRef.current) {
        clearTimeout(presenceTimeoutRef.current);
        presenceTimeoutRef.current = null;
      }
    };
  }, [socket, user, isPresent]);

  const handlePollResponse = (pollId: string, response: string) => {
    socket.emit('poll-response', {
      pollId,
      studentId: user?.id,
      response
    });
  };

  const handleQuizSubmit = (quizId: string, answers: number[]) => {
    socket.emit('quiz-submission', {
      quizId,
      studentId: user?.id,
      answers
    });
  };

  const handleLogout = () => {
    // Emit final presence update before logging out
    if (socket && user) {
      console.log('Emitting final presence update - Absent on logout'); // Debug log
      socket.emit('student-presence', {
        studentId: user._id,
        studentName: user.name,
        isPresent: false,
        lastActive: new Date()
      });
    }
    
    // Clear any existing timeouts
    if (presenceTimeoutRef.current) {
      clearTimeout(presenceTimeoutRef.current);
      presenceTimeoutRef.current = null;
    }
    
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
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Student Dashboard</h1>
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Presence Detection</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-64 h-48 object-cover rounded"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0"
                />
              </div>
              <div>
                <p className="text-lg">
                  Status: <span className={isPresent ? 'text-green-500' : 'text-red-500'}>
                    {isPresent ? 'Present' : 'Absent'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Active Quizzes</h2>
            <div className="space-y-6">
              {quizzes.map(quiz => (
                <div key={quiz._id} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-4">{quiz.title}</h3>
                  <div className="space-y-4">
                    {quiz.questions.map((question, qIndex) => (
                      <div key={qIndex} className="space-y-2">
                        <p className="font-medium">{question.question}</p>
                        <div className="grid grid-cols-1 gap-2">
                          {question.options.map((option, oIndex) => (
                            <button
                              key={oIndex}
                              onClick={() => handleQuizSubmit(quiz._id, [oIndex])}
                              className="p-2 text-left bg-gray-100 hover:bg-gray-200 rounded-lg"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Active Polls</h2>
            <div className="space-y-6">
              {polls.map(poll => (
                <div key={poll._id} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-4">{poll.question}</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {poll.options.map((option, index) => {
                      const hasResponded = poll.responses.some(
                        r => r.studentId === user?.id && r.response === option
                      );
                      return (
                        <button
                          key={index}
                          onClick={() => handlePollResponse(poll._id, option)}
                          disabled={hasResponded}
                          className={`p-2 rounded-lg text-2xl ${
                            hasResponded
                              ? 'bg-blue-100 border-2 border-blue-500'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard; 