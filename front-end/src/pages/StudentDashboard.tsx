import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import * as faceapi from 'face-api.js';
import MainLayout from '../layouts/MainLayout';

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
  responses: {
    studentId: string;
    studentName: string;
    answers: number[];
    score: number;
  }[];
  targetStudents: string[];
  createdAt: string;
}

interface QuizFeedback {
  quizId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: {
    questionIndex: number;
    correctAnswer: number;
  }[];
}

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isPresent, setIsPresent] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizFeedback, setQuizFeedback] = useState<Record<string, QuizFeedback>>({});
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const presenceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Emit student-connected event when socket connects
    newSocket.on('connect', () => {
      console.log('Socket connected, emitting student-connected event');
      newSocket.emit('student-connected', {
        userId: user?._id,
        role: 'student'
      });
    });

    // Listen for active polls
    newSocket.on('active-polls', (activePolls: Poll[]) => {
      console.log('Received active polls:', activePolls);
      setPolls(activePolls);
    });

    // Listen for active quizzes
    newSocket.on('active-quizzes', (activeQuizzes: Quiz[]) => {
      console.log('Received active quizzes:', activeQuizzes);
      setQuizzes(activeQuizzes);
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

    // Listen for quiz feedback
    newSocket.on('quiz-feedback', (feedback: QuizFeedback) => {
      console.log('Received quiz feedback:', feedback);
      setQuizFeedback(prev => ({
        ...prev,
        [feedback.quizId]: feedback
      }));
    });

    // Listen for new quizzes
    newSocket.on('quiz-created', (quiz: Quiz) => {
      console.log('Received new quiz:', quiz);
      setQuizzes(prev => [quiz, ...prev]);
    });

    // Listen for quiz updates
    newSocket.on('quiz-updated', (updatedQuiz: Quiz) => {
      console.log('Received quiz update:', updatedQuiz);
      setQuizzes(prev => prev.map(q => q._id === updatedQuiz._id ? updatedQuiz : q));
    });

    // Listen for quiz removal
    newSocket.on('quiz-removed', (quizId: string) => {
      console.log('Quiz removed:', quizId);
      setQuizzes(prev => prev.filter(q => q._id !== quizId));
      // Clear feedback for removed quiz
      setQuizFeedback(prev => {
        const newFeedback = { ...prev };
        delete newFeedback[quizId];
        return newFeedback;
      });
    });

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [user]);

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
    if (socket && user) {
      socket.emit('poll-response', {
        pollId,
        studentId: user._id,
        studentName: user.name,
        response
      });
      // Immediately remove the poll from the student's view
      setPolls(prev => prev.filter(p => p._id !== pollId));
    }
  };

  const handleQuizAnswer = (quizId: string, questionIndex: number, answerIndex: number) => {
    setQuizAnswers(prev => {
      const currentAnswers = prev[quizId] || [];
      const newAnswers = [...currentAnswers];
      newAnswers[questionIndex] = answerIndex;
      return {
        ...prev,
        [quizId]: newAnswers
      };
    });
  };

  const handleQuizSubmit = (quizId: string) => {
    if (socket && user) {
      const answers = quizAnswers[quizId] || [];
      // Check if all questions have been answered
      const quiz = quizzes.find(q => q._id === quizId);
      if (quiz && answers.length === quiz.questions.length) {
        socket.emit('quiz-submission', {
          quizId,
          studentId: user._id,
          studentName: user.name,
          answers
        });
        // Clear answers for this quiz
        setQuizAnswers(prev => {
          const newAnswers = { ...prev };
          delete newAnswers[quizId];
          return newAnswers;
        });
        // Remove the quiz from view
        setQuizzes(prev => prev.filter(q => q._id !== quizId));
      }
    }
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
    <MainLayout>
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
            {quizzes
              .filter(quiz => !quiz.responses.some(r => r.studentId === user?._id))
              .map(quiz => (
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
                              onClick={() => handleQuizAnswer(quiz._id, qIndex, oIndex)}
                              className={`p-2 text-left rounded-lg ${
                                quizAnswers[quiz._id]?.[qIndex] === oIndex
                                  ? 'bg-blue-100 border-2 border-blue-500'
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => handleQuizSubmit(quiz._id)}
                      disabled={!quizAnswers[quiz._id] || quizAnswers[quiz._id].length !== quiz.questions.length}
                      className={`mt-4 px-4 py-2 rounded-lg ${
                        quizAnswers[quiz._id]?.length === quiz.questions.length
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Submit Quiz
                    </button>
                  </div>
                </div>
              ))}
            {quizzes.filter(quiz => !quiz.responses.some(r => r.studentId === user?._id)).length === 0 && (
              <p className="text-gray-500 text-center">No active quizzes</p>
            )}
          </div>
        </div>

        {/* Quiz Feedback Section */}
        {Object.entries(quizFeedback).length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Quiz Results</h2>
            <div className="space-y-6">
              {Object.entries(quizFeedback).map(([quizId, feedback]) => (
                <div key={quizId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Quiz Results</h3>
                    <div className="text-sm text-gray-500">
                      Score: {feedback.score}/{feedback.totalQuestions}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {feedback.correctAnswers.map((answer, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-gray-600">Question {index + 1}:</span>
                        <span className="text-green-600">
                          Correct Answer: Option {answer.correctAnswer + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Active Polls</h2>
          <div className="space-y-6">
            {polls
              .filter(poll => !poll.responses.some(r => r.studentId === user?._id))
              .map(poll => (
                <div key={poll._id} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-4">{poll.question}</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {poll.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handlePollResponse(poll._id, option)}
                        className="p-2 rounded-lg text-2xl bg-gray-100 hover:bg-gray-200"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            {polls.filter(poll => !poll.responses.some(r => r.studentId === user?._id)).length === 0 && (
              <p className="text-gray-500 text-center">No active polls</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudentDashboard; 