import express from 'express';
import { authorizeRole } from '../middleware/auth.js';
import Quiz from '../models/Quiz.js';
import Poll from '../models/Poll.js';

const router = express.Router();

// Get all quizzes (teacher only)
router.get('/', authorizeRole(['teacher']), async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
  }
});

// Create new quiz (teacher only)
router.post('/', authorizeRole(['teacher']), async (req, res) => {
  try {
    const { title, questions } = req.body;
    const quiz = new Quiz({
      title,
      questions,
      createdBy: req.user.userId
    });
    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error creating quiz', error: error.message });
  }
});

// Get all polls (teacher only)
router.get('/polls', authorizeRole(['teacher']), async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching polls', error: error.message });
  }
});

// Create new poll (teacher only)
router.post('/polls', authorizeRole(['teacher']), async (req, res) => {
  try {
    const { question, options } = req.body;
    const poll = new Poll({
      question,
      options,
      createdBy: req.user.userId
    });
    await poll.save();
    res.status(201).json(poll);
  } catch (error) {
    res.status(500).json({ message: 'Error creating poll', error: error.message });
  }
});

// Submit quiz answer (student only)
router.post('/:quizId/submit', authorizeRole(['student']), async (req, res) => {
  try {
    const { answers } = req.body;
    const quiz = await Quiz.findById(req.params.quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const results = quiz.questions.map((question, index) => ({
      question: question.question,
      correct: question.correctAnswer === answers[index],
      correctAnswer: question.options[question.correctAnswer]
    }));

    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting quiz', error: error.message });
  }
});

// Submit poll response (student only)
router.post('/polls/:pollId/submit', authorizeRole(['student']), async (req, res) => {
  try {
    const { response } = req.body;
    const poll = await Poll.findById(req.params.pollId);
    
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    poll.responses.push({
      studentId: req.user.userId,
      response
    });

    await poll.save();
    res.json({ message: 'Response recorded' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting poll response', error: error.message });
  }
});

export default router; 