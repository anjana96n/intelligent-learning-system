import express from 'express';
import SpeechSession from '../models/SpeechSession.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Simple extractive summarizer: returns the first sentence or the longest sentence
function extractiveSummary(text) {
  if (!text) return '';
  // Split into sentences (very basic)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  // Option 1: First sentence
  if (sentences.length > 0) return sentences[0].trim();
  // Option 2: Longest sentence (uncomment if you prefer)
  // return sentences.reduce((a, b) => (a.length > b.length ? a : b), '').trim();
  return text.trim();
}

// Start a new speech session
router.post('/session/start', authenticateToken, async (req, res) => {
  try {
    const { teacherId, teacherName } = req.body;
    
    if (!teacherId || !teacherName) {
      return res.status(400).json({ error: 'Teacher ID and name are required' });
    }

    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new speech session
    const session = new SpeechSession({
      teacherId,
      teacherName,
      sessionId,
      segments: [],
      isActive: true,
      startedAt: new Date()
    });

    await session.save();

    res.json({
      success: true,
      sessionId,
      message: 'Speech session started successfully'
    });
  } catch (error) {
    console.error('Error starting speech session:', error);
    res.status(500).json({ error: 'Failed to start speech session' });
  }
});

// Process speech segment and generate summary
router.post('/segment/process', authenticateToken, async (req, res) => {
  try {
    const { sessionId, teacherId, teacherName, text, timestamp } = req.body;

    if (!sessionId || !teacherId || !teacherName || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate summary
    const summary = extractiveSummary(text);

    // Find or create session
    let session = await SpeechSession.findOne({ sessionId });
    
    if (!session) {
      // Create new session if not found
      session = new SpeechSession({
        teacherId,
        teacherName,
        sessionId,
        segments: [],
        isActive: true,
        startedAt: new Date()
      });
    }

    // Add segment to session
    session.segments.push({
      text: text.trim(),
      summary,
      timestamp: timestamp || new Date(),
      confidence: 0.9
    });

    await session.save();

    // Return the processed segment
    const processedSegment = {
      id: session.segments[session.segments.length - 1]._id,
      teacherId,
      teacherName,
      summary,
      originalText: text.trim(),
      timestamp: timestamp || new Date(),
      sessionId
    };

    res.json({
      success: true,
      segment: processedSegment
    });
  } catch (error) {
    console.error('Error processing speech segment:', error);
    res.status(500).json({ error: 'Failed to process speech segment' });
  }
});

// End speech session
router.post('/session/end', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await SpeechSession.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.isActive = false;
    session.endedAt = new Date();
    session.totalDuration = Math.floor((session.endedAt - session.startedAt) / 1000);

    await session.save();

    res.json({
      success: true,
      message: 'Speech session ended successfully',
      session: {
        sessionId: session.sessionId,
        totalSegments: session.segments.length,
        totalDuration: session.totalDuration,
        startedAt: session.startedAt,
        endedAt: session.endedAt
      }
    });
  } catch (error) {
    console.error('Error ending speech session:', error);
    res.status(500).json({ error: 'Failed to end speech session' });
  }
});

// Get session history
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const { teacherId, limit = 10 } = req.query;

    const query = {};
    if (teacherId) {
      query.teacherId = teacherId;
    }

    const sessions = await SpeechSession.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-segments');

    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get session details with segments
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await SpeechSession.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

export default router; 