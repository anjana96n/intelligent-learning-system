import express from 'express';
import natural from 'natural';
import SpeechSession from '../models/SpeechSession.js';
import { authenticateToken } from '../middleware/auth.js';
import GradioSummarizationService from '../services/GradioSummarizationService.js';

const router = express.Router();
const gradioService = new GradioSummarizationService();

// Educational keywords that indicate important content
const EDUCATIONAL_KEYWORDS = [
  'important', 'key', 'main', 'primary', 'essential', 'crucial', 'significant',
  'learn', 'understand', 'remember', 'note', 'focus', 'highlight',
  'definition', 'concept', 'theory', 'principle', 'method', 'process',
  'example', 'instance', 'case', 'demonstrate', 'show', 'explain',
  'because', 'therefore', 'thus', 'consequently', 'as a result',
  'first', 'second', 'third', 'finally', 'in conclusion', 'summary'
];

// Enhanced multi-factor summarizer (fallback)
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

    // Use Gradio service for summarization
    let summary;
    let confidence = 0.9;
    let modelUsed = 'gradio';

    try {
      const summaryResult = await gradioService.summarize(text);
      summary = summaryResult.summary;
      confidence = summaryResult.confidence;
      modelUsed = summaryResult.modelUsed;
    } catch (error) {
      console.error('Gradio summarization failed, using fallback:', error);
      // Fallback to local summarization
      summary = enhancedSummary(text);
      confidence = 0.6;
      modelUsed = 'fallback';
    }

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
      confidence,
      modelUsed
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
      sessionId,
      confidence,
      modelUsed
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