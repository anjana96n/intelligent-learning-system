import mongoose from 'mongoose';

const speechSegmentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  confidence: {
    type: Number,
    default: 0.9
  }
});

const speechSessionSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  segments: [speechSegmentSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  totalDuration: {
    type: Number, // in seconds
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
speechSessionSchema.index({ teacherId: 1, isActive: 1 });
speechSessionSchema.index({ sessionId: 1 });

const SpeechSession = mongoose.model('SpeechSession', speechSessionSchema);

export default SpeechSession; 