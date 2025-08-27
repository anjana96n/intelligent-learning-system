import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import natural from 'natural';
import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quiz.js';
import userRoutes from './routes/users.js';
import speechRoutes from './routes/speech.js';
import { authenticateToken } from './middleware/auth.js';
import Quiz from './models/Quiz.js';
import Poll from './models/Poll.js';
import User from './models/User.js';
import SpeechSession from './models/SpeechSession.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Educational keywords that indicate important content
const EDUCATIONAL_KEYWORDS = [
  'important', 'key', 'main', 'primary', 'essential', 'crucial', 'significant',
  'learn', 'understand', 'remember', 'note', 'focus', 'highlight',
  'definition', 'concept', 'theory', 'principle', 'method', 'process',
  'example', 'instance', 'case', 'demonstrate', 'show', 'explain',
  'because', 'therefore', 'thus', 'consequently', 'as a result',
  'first', 'second', 'third', 'finally', 'in conclusion', 'summary'
];

// Enhanced multi-factor summarizer
function enhancedSummary(text) {
  if (!text || text.length < 50) return text;
  
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= 1) return text.trim();
  
  // Tokenize and calculate TF-IDF scores
  const tokenizer = new natural.WordTokenizer();
  const tfidf = new natural.TfIdf();
  
  // Add sentences to TF-IDF
  sentences.forEach((sentence, index) => {
    tfidf.addDocument(tokenizer.tokenize(sentence.toLowerCase()));
  });
  
  // Calculate comprehensive sentence scores
  const sentenceScores = sentences.map((sentence, index) => {
    const tokens = tokenizer.tokenize(sentence.toLowerCase());
    const sentenceLength = tokens.length;
    
    // Factor 1: TF-IDF score
    let tfidfScore = 0;
    tokens.forEach(token => {
      tfidfScore += tfidf.tfidf(token, index);
    });
    tfidfScore = tfidfScore / sentenceLength;
    
    // Factor 2: Position score (first and last sentences get bonus)
    const positionScore = index === 0 ? 0.3 : (index === sentences.length - 1 ? 0.2 : 0);
    
    // Factor 3: Length score (prefer medium-length sentences)
    const lengthScore = sentenceLength >= 5 && sentenceLength <= 20 ? 0.2 : 
                       sentenceLength < 5 ? 0.1 : 0.05;
    
    // Factor 4: Educational keyword score
    let keywordScore = 0;
    const sentenceLower = sentence.toLowerCase();
    EDUCATIONAL_KEYWORDS.forEach(keyword => {
      if (sentenceLower.includes(keyword)) {
        keywordScore += 0.1;
      }
    });
    keywordScore = Math.min(keywordScore, 0.3); // Cap at 0.3
    
    // Factor 5: Question score (questions are often important)
    const questionScore = sentence.includes('?') ? 0.15 : 0;
    
    // Factor 6: Definition pattern score (sentences with "is" or "are" often define concepts)
    const definitionPattern = /\b(is|are|means|refers to|defined as)\b/i;
    const definitionScore = definitionPattern.test(sentence) ? 0.1 : 0;
    
    // Factor 7: Number/list score (sentences with numbers are often important)
    const numberScore = /\d+/.test(sentence) ? 0.1 : 0;
    
    // Combine all factors
    const totalScore = tfidfScore + positionScore + lengthScore + keywordScore + 
                      questionScore + definitionScore + numberScore;
    
    return { 
      sentence: sentence.trim(), 
      score: totalScore,
      factors: {
        tfidf: tfidfScore,
        position: positionScore,
        length: lengthScore,
        keywords: keywordScore,
        question: questionScore,
        definition: definitionScore,
        number: numberScore
      }
    };
  });
  
  // Return the sentence with highest score
  const bestSentence = sentenceScores.reduce((a, b) => 
    a.score > b.score ? a : b
  );
  
  // If the best sentence is too short, try to get a better one
  if (bestSentence.sentence.length < 30 && sentences.length > 2) {
    // Find the longest sentence with decent score
    const longSentences = sentenceScores.filter(s => s.sentence.length >= 30);
    if (longSentences.length > 0) {
      const bestLongSentence = longSentences.reduce((a, b) => 
        a.score > b.score ? a : b
      );
      // Only use longer sentence if its score is close to the best score
      if (bestLongSentence.score >= bestSentence.score * 0.8) {
        return bestLongSentence.sentence;
      }
    }
  }
  
  return bestSentence.sentence;
}

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intelligent-learning';
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 5, // Maintain at least 5 socket connections
  connectTimeoutMS: 10000, // Give up initial connection after 10s
  retryWrites: true, // Retry write operations if they fail
  retryReads: true, // Retry read operations if they fail
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if we can't connect to the database
  });

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', authenticateToken, quizRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/speech', authenticateToken, speechRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send active polls and quizzes to newly connected students
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
            studentName: r.studentName,
            response: r.response
          })),
          targetStudents: poll.targetStudents,
          createdAt: poll.createdAt,
          updatedAt: poll.updatedAt
        }));

        // Get all active quizzes
        const activeQuizzes = await Quiz.find({
          targetStudents: data.userId
        }).sort({ createdAt: -1 });

        // Format quizzes for emission
        const formattedQuizzes = activeQuizzes.map(quiz => ({
          _id: quiz._id,
          title: quiz.title,
          questions: quiz.questions,
          responses: quiz.responses,
          targetStudents: quiz.targetStudents,
          createdAt: quiz.createdAt
        }));

        // Send active polls and quizzes to the newly connected student
        socket.emit('active-polls', formattedPolls);
        socket.emit('active-quizzes', formattedQuizzes);
        console.log('Sent active polls and quizzes to new student:', data.userId);
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
          poll.responses[existingResponseIndex].studentName = data.studentName;
        } else {
          // Add new response
          poll.responses.push({
            studentId: data.studentId,
            studentName: data.studentName,
            response: data.response
          });
        }

        await poll.save();

        // Broadcast updated poll to all clients
        const formattedPoll = {
          _id: poll._id,
          question: poll.question,
          options: poll.options,
          responses: poll.responses.map(r => ({
            studentId: r.studentId,
            studentName: r.studentName,
            response: r.response
          })),
          targetStudents: poll.targetStudents,
          createdAt: poll.createdAt,
          updatedAt: poll.updatedAt
        };

        io.emit('poll-updated', formattedPoll);
        console.log('Broadcasted poll response:', data);
      }
    } catch (error) {
      console.error('Error handling poll response:', error);
    }
  });

  // Handle quiz creation
  socket.on('create-quiz', async (data) => {
    try {
      if (!data.createdBy) {
        throw new Error('User ID is required to create a quiz');
      }

      // Get all registered students
      const students = await User.find({ role: 'student' });
      const studentIds = students.map(student => student._id);

      const quiz = new Quiz({
        title: data.title,
        questions: data.questions,
        createdBy: data.createdBy,
        responses: [],
        targetStudents: studentIds
      });
      await quiz.save();

      // Format the quiz data for emission
      const formattedQuiz = {
        _id: quiz._id,
        title: quiz.title,
        questions: quiz.questions,
        responses: [],
        targetStudents: studentIds,
        createdAt: quiz.createdAt
      };

      // Broadcast to all connected clients
      io.emit('quiz-created', formattedQuiz);
      console.log('Broadcasted new quiz to all clients:', formattedQuiz);

      // Remove quiz after 5 minutes
      setTimeout(async () => {
        await Quiz.findByIdAndDelete(quiz._id);
        io.emit('quiz-removed', quiz._id);
        console.log('Quiz removed after timeout:', quiz._id);
      }, 5 * 60 * 1000);
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
        // Calculate score
        const score = calculateScore(quiz.questions, data.answers);

        // Find existing response for this student
        const existingResponseIndex = quiz.responses.findIndex(
          r => r.studentId.toString() === data.studentId
        );

        if (existingResponseIndex !== -1) {
          // Update existing response
          quiz.responses[existingResponseIndex].answers = data.answers;
          quiz.responses[existingResponseIndex].score = score;
        } else {
          // Add new response
          quiz.responses.push({
            studentId: data.studentId,
            studentName: data.studentName,
            answers: data.answers,
            score: score
          });
        }

        await quiz.save();

        // Send feedback to the student
        const feedback = {
          quizId: quiz._id,
          score: score,
          totalQuestions: quiz.questions.length,
          correctAnswers: quiz.questions.map((q, index) => ({
            questionIndex: index,
            correctAnswer: q.correctAnswer
          }))
        };

        socket.emit('quiz-feedback', feedback);

        // Broadcast updated quiz to all clients
        const formattedQuiz = {
          _id: quiz._id,
          title: quiz.title,
          questions: quiz.questions,
          responses: quiz.responses,
          targetStudents: quiz.targetStudents,
          createdAt: quiz.createdAt
        };

        io.emit('quiz-updated', formattedQuiz);
        console.log('Broadcasted quiz submission:', data);
      }
    } catch (error) {
      console.error('Error handling quiz submission:', error);
    }
  });

  // Handle speech session start
  socket.on('speech-session-start', async (data) => {
    try {
      console.log('Speech session started:', data);
      
      // Generate unique session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create new speech session
      const session = new SpeechSession({
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        sessionId,
        segments: [],
        isActive: true,
        startedAt: new Date()
      });

      await session.save();

      // Broadcast session start to all clients
      io.emit('speech-session-start', {
        sessionId,
        teacherName: data.teacherName,
        timestamp: new Date()
      });

      console.log('Broadcasted speech session start');
    } catch (error) {
      console.error('Error handling speech session start:', error);
    }
  });

  // Handle speech segment
  socket.on('speech-segment', async (data) => {
    try {
      // Use the AI-generated summary from the teacher, fallback to enhanced summary if not provided
      const summary = data.summary || enhancedSummary(data.text);

      // Find or create session
      let session = await SpeechSession.findOne({ sessionId: data.sessionId });
      if (!session) {
        session = new SpeechSession({
          teacherId: data.teacherId,
          teacherName: data.teacherName,
          sessionId: data.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          segments: [],
          isActive: true,
          startedAt: new Date()
        });
      }
      session.segments.push({
        text: data.text.trim(),
        summary,
        timestamp: data.timestamp || new Date(),
        confidence: data.confidence || 0.9
      });
      await session.save();
      
      const summaryObj = {
        id: session.segments[session.segments.length - 1]._id,
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        summary,
        originalText: data.text.trim(),
        timestamp: data.timestamp || new Date(),
        sessionId: session.sessionId,
        confidence: data.confidence || 0.9,
        modelUsed: data.modelUsed || 'fallback'
      };
      
      console.log('Broadcasting speech summary to students:', summaryObj);
      io.emit('speech-summary', summaryObj);
    } catch (error) {
      console.error('Error handling speech segment:', error);
    }
  });

  // Handle speech session end
  socket.on('speech-session-end', async (data) => {
    try {
      console.log('Speech session ended:', data);
      
      const session = await SpeechSession.findOne({ sessionId: data.sessionId });
      
      if (session) {
        session.isActive = false;
        session.endedAt = new Date();
        session.totalDuration = Math.floor((session.endedAt - session.startedAt) / 1000);
        await session.save();
      }

      // Broadcast session end to all clients
      io.emit('speech-session-end', {
        sessionId: data.sessionId,
        timestamp: new Date()
      });

      console.log('Broadcasted speech session end');
    } catch (error) {
      console.error('Error handling speech session end:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Helper function to calculate quiz score
function calculateScore(questions, answers) {
  return questions.reduce((score, question, index) => {
    return score + (question.correctAnswer === answers[index] ? 1 : 0);
  }, 0);
}

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 