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

      const poll = new Poll({
        question: data.question,
        options: data.options,
        createdBy: data.createdBy
      });
      await poll.save();
      io.emit('poll-created', poll);

      // Remove poll after 3 minutes
      setTimeout(async () => {
        await Poll.findByIdAndDelete(poll._id);
        io.emit('poll-removed', poll._id);
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
        poll.responses.push({
          studentId: data.studentId,
          response: data.response
        });
        await poll.save();
        io.emit('poll-updated', poll);
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

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 