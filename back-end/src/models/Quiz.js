import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  answers: [{
    type: Number,
    required: true
  }],
  score: {
    type: Number,
    required: true
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    options: [{
      type: String,
      required: true
    }],
    correctAnswer: {
      type: Number,
      required: true
    }
  }],
  responses: [responseSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }]
}, {
  timestamps: true
});

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz; 