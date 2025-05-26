import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quiz.js';
import userRoutes from './routes/users.js';
import { authenticateToken } from './middleware/auth.js';
import Quiz from './models/Quiz.js';
import Poll from './models/Poll.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intelligent-learning';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', authenticateToken, quizRoutes);
app.use('/api/users', authenticateToken, userRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send active polls to newly connected students
  socket.on('student-connected', async (data) => {
    try {
      if (data.role === 'student') {
        // Store user info in socket for disconnect handling
        socket.userId = data.userId;
        socket.userName = data.userName;

        // Get all active polls
        const activePolls = await Poll.find({
          targetStudents: data.userId
        }).sort({ createdAt: -1 });

        // Format polls for emission
        const formattedPolls = activePolls.map(poll => ({
          _id: poll._id,
          question: poll.question,
          options: poll.options,
          responses: poll.responses.map(r => ({
            studentId: r.studentId,
            studentName: r.studentId.name,
            response: r.response
          })),
          targetStudents: poll.targetStudents,
          createdAt: poll.createdAt,
          updatedAt: poll.updatedAt
        }));

        // Send active polls to the newly connected student
        socket.emit('active-polls', formattedPolls);
        console.log('Sent active polls to new student:', data.userId);
      }
    } catch (error) {
      console.error('Error in student-connected handler:', error);
    }
  });

  // Handle student presence
  socket.on('student-presence', (data) => {
    console.log('Received student presence:', data); // Debug log
    // Broadcast to all clients including sender
    io.emit('presence-update', {
      studentId: data.studentId,
      studentName: data.studentName,
      isPresent: data.isPresent,
      lastActive: data.lastActive
    });
    console.log('Broadcasted presence update'); // Debug log
  });

  // Handle poll creation
  socket.on('create-poll', async (data) => {
    try {
      if (!data.createdBy) {
        throw new Error('User ID is required to create a poll');
      }

      // Get all registered students
      const students = await User.find({ role: 'student' });
      const studentIds = students.map(student => student._id);

      const poll = new Poll({
        question: data.question,
        options: data.options,
        createdBy: data.createdBy,
        responses: [],
        targetStudents: studentIds // Store the list of students who should see this poll
      });
      await poll.save();

      // Format the poll data for emission
      const formattedPoll = {
        _id: poll._id,
        question: poll.question,
        options: poll.options,
        responses: [],
        targetStudents: studentIds,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt
      };

      // Broadcast to all connected clients
      io.emit('poll-created', formattedPoll);
      console.log('Broadcasted new poll to all clients:', formattedPoll);

      // Remove poll after 3 minutes
      setTimeout(async () => {
        await Poll.findByIdAndDelete(poll._id);
        io.emit('poll-removed', poll._id);
        console.log('Poll removed after timeout:', poll._id);
      }, 3 * 60 * 1000);
    } catch (error) {
      console.error('Error creating poll:', error);
      socket.emit('poll-error', { message: error.message });
    }
  });

  // Handle poll response
  socket.on('poll-response', async (data) => {
    try {
      const poll = await Poll.findById(data.pollId);
      if (poll) {
        // Find existing response for this student
        const existingResponseIndex = poll.responses.findIndex(
          r => r.studentId.toString() === data.studentId
        );

        if (existingResponseIndex !== -1) {
          // Update existing response
          poll.responses[existingResponseIndex].response = data.response;
        } else {
          // Add new response
          poll.responses.push({
            studentId: data.studentId,
            response: data.response
          });
        }

        await poll.save();

        // Fetch the updated poll with populated student information
        const updatedPoll = await Poll.findById(poll._id)
          .populate('responses.studentId', 'name');

        // Transform the response data to include student names
        const transformedPoll = {
          _id: updatedPoll._id,
          question: updatedPoll.question,
          options: updatedPoll.options,
          responses: updatedPoll.responses.map(r => ({
            studentId: r.studentId._id,
            studentName: r.studentId.name,
            response: r.response
          })),
          targetStudents: updatedPoll.targetStudents,
          createdAt: updatedPoll.createdAt,
          updatedAt: updatedPoll.updatedAt
        };

        // Check if all target students have responded
        const allStudentsResponded = poll.targetStudents.every(studentId =>
          poll.responses.some(response => response.studentId.toString() === studentId.toString())
        );

        // Broadcast to all clients
        io.emit('poll-updated', transformedPoll);
        console.log('Broadcasted poll update to all clients:', transformedPoll);

        // If all students have responded, schedule poll removal after 10 seconds
        if (allStudentsResponded) {
          console.log('All students have responded to poll:', poll._id);
          setTimeout(async () => {
            await Poll.findByIdAndDelete(poll._id);
            io.emit('poll-removed', poll._id);
            console.log('Poll removed after all responses:', poll._id);
          }, 10000); // 10 seconds
        }
      }
    } catch (error) {
      console.error('Error submitting poll response:', error);
    }
  });

  // Handle quiz creation
  socket.on('create-quiz', async (data) => {
    try {
      if (!data.createdBy) {
        throw new Error('User ID is required to create a quiz');
      }

      const quiz = new Quiz({
        title: data.title,
        questions: data.questions,
        createdBy: data.createdBy
      });
      await quiz.save();
      io.emit('quiz-created', quiz);

      // Remove quiz after 3 minutes
      setTimeout(async () => {
        await Quiz.findByIdAndDelete(quiz._id);
        io.emit('quiz-removed', quiz._id);
      }, 3 * 60 * 1000);
    } catch (error) {
      console.error('Error creating quiz:', error);
      socket.emit('quiz-error', { message: error.message });
    }
  });

  // Handle quiz submission
  socket.on('quiz-submission', async (data) => {
    try {
      const quiz = await Quiz.findById(data.quizId);
      if (quiz) {
        const results = quiz.questions.map((question, index) => ({
          question: question.question,
          correct: question.correctAnswer === data.answers[index],
          correctAnswer: question.options[question.correctAnswer]
        }));
        io.emit('quiz-results', {
          quizId: data.quizId,
          studentId: data.studentId,
          results
        });
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // If we have the user's ID stored in the socket, emit a presence update
    if (socket.userId) {
      io.emit('presence-update', {
        studentId: socket.userId,
        studentName: socket.userName,
        isPresent: false,
        lastActive: new Date()
      });
      console.log('Broadcasted absence update for disconnected user:', socket.userId);
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 