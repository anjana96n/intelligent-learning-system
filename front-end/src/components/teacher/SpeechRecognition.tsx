import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import T5SummarizationService from '../../services/T5SummarizationService';

interface SpeechRecognitionProps {
  socket: any;
  teacherId: string;
  teacherName: string;
}

interface SpeechSegment {
  text: string;
  timestamp: Date;
  confidence: number;
  summary?: string;
  modelUsed?: string;
}

const SpeechRecognition: React.FC<SpeechRecognitionProps> = ({ socket, teacherId, teacherName }) => {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [transcriptSummary, setTranscriptSummary] = useState<string>('');
  const [currentSegment, setCurrentSegment] = useState('');
  const [segments, setSegments] = useState<SpeechSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summarizationStatus, setSummarizationStatus] = useState<string>('Initializing...');
  const [pendingText, setPendingText] = useState<string>('');
  const [lastProcessTime, setLastProcessTime] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string>(Date.now().toString());
  
  const recognitionRef = useRef<any>(null);
  const segmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const t5Service = T5SummarizationService.getInstance();

  // Process buffered text into a meaningful segment
  const processBufferedText = async (bufferedText: string, fullTranscript: string) => {
    if (!bufferedText.trim()) return;
    
    // Clear any existing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    const newSegment: SpeechSegment = {
      text: bufferedText.trim(),
      timestamp: new Date(),
      confidence: 0.9
    };

    // Generate summary using T5 service
    try {
      const summaryResult = await t5Service.summarize(bufferedText.trim());
      newSegment.summary = summaryResult.summary;
      newSegment.modelUsed = summaryResult.modelUsed;
      newSegment.confidence = summaryResult.confidence;
    } catch (error) {
      console.error('T5 summarization failed:', error);
    }

    setSegments(prev => [...prev, newSegment]);
    setPendingText(''); // Clear the buffer
    
    // Generate summary for the full transcript
    if (fullTranscript.trim().length > 50) {
      try {
        const fullSummaryResult = await t5Service.summarize(fullTranscript.trim());
        setTranscriptSummary(fullSummaryResult.summary);
      } catch (error) {
        console.error('Failed to summarize full transcript:', error);
      }
    }
    
    // Send segment to backend for processing
    if (socket) {
      socket.emit('speech-segment', {
        teacherId,
        teacherName,
        text: bufferedText.trim(),
        summary: newSegment.summary,
        timestamp: new Date(),
        sessionId
      });
    }
  };

  useEffect(() => {
    // Initialize T5 service
    const initT5Service = async () => {
      try {
        setSummarizationStatus('Initializing T5 service...');
        await t5Service.initialize();
        setSummarizationStatus('T5 service ready');
      } catch (error) {
        console.error('Failed to initialize T5 service:', error);
        setSummarizationStatus('T5 service unavailable - using fallback');
      }
    };

    initT5Service();
  }, []);

  useEffect(() => {
    // Check if browser supports SpeechRecognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      // Restart if it was supposed to be listening
      if (isListening) {
        recognition.start();
      }
    };

    recognition.onresult = async (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        const newText = finalTranscript.trim();
        const updatedPending = pendingText + ' ' + newText;
        const updatedTranscript = transcript + ' ' + newText;
        
        setPendingText(updatedPending);
        setTranscript(updatedTranscript);
        setLastProcessTime(Date.now());
        
        // Process buffered text into segments when we have enough content or after a pause
        const shouldProcess = 
          updatedPending.split(' ').length >= 30 || // At least 30 words
          updatedPending.split(/[.!?]+/).filter(s => s.trim().length > 0).length >= 2; // At least 2 sentences
        
        if (shouldProcess) {
          await processBufferedText(updatedPending.trim(), updatedTranscript.trim());
        }
        
        setCurrentSegment('');
      }

      if (interimTranscript) {
        setCurrentSegment(interimTranscript);
      }
      
      // Set up auto-processing for remaining buffered text after silence
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      
      processingTimeoutRef.current = setTimeout(async () => {
        if (pendingText.trim() && Date.now() - lastProcessTime > 3000) {
          // Process any remaining buffered text after 3 seconds of silence
          const currentPending = pendingText;
          const currentTranscript = transcript;
          await processBufferedText(currentPending.trim(), currentTranscript.trim() + ' ' + currentPending.trim());
        }
      }, 3500);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [socket, teacherId, teacherName]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const clearTranscript = () => {
    setTranscript('');
    setTranscriptSummary('');
    setSegments([]);
    setCurrentSegment('');
    setPendingText('');
    setLastProcessTime(0);
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
  };

  const startNewSession = () => {
    clearTranscript();
    setSessionId(Date.now().toString());
    if (socket) {
      socket.emit('speech-session-start', {
        teacherId,
        teacherName,
        timestamp: new Date()
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Speech Recognition</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-full transition-colors ${
              isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            onClick={toggleListening}
            className={`p-3 rounded-full transition-colors ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            title={isListening ? 'Stop Listening' : 'Start Listening'}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Status</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={startNewSession}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              New Session
            </button>
            <button
              onClick={clearTranscript}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isListening ? 'Listening...' : 'Not listening'}
          </span>
        </div>
        <div className="mt-2">
          <span className="text-xs text-gray-500">
            Summarization: {summarizationStatus}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Speech Buffer
            {pendingText && (
              <span className="text-xs text-blue-600 ml-2">
                ({pendingText.split(' ').length} words buffered)
              </span>
            )}
          </label>
          <div className="bg-gray-50 p-3 rounded border min-h-[60px]">
            {currentSegment || pendingText ? (
              <p className="text-gray-800">{currentSegment || pendingText}</p>
            ) : (
              <p className="text-gray-400 italic">Waiting for speech...</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Summary
            <span className="text-xs text-gray-500 ml-2">(AI-Generated from Full Transcript)</span>
          </label>
          <div className="bg-blue-50 p-3 rounded border max-h-[200px] overflow-y-auto">
            {transcriptSummary ? (
              <p className="text-blue-800 font-medium">{transcriptSummary}</p>
            ) : transcript ? (
              <p className="text-gray-600 italic">Generating summary...</p>
            ) : (
              <p className="text-gray-400 italic">No content to summarize yet</p>
            )}
          </div>
          {transcript && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                View Full Transcript ({transcript.trim().split(' ').filter(w => w.length > 0).length} words)
              </summary>
              <div className="bg-gray-50 p-2 rounded border mt-1 max-h-[150px] overflow-y-auto">
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{transcript.trim()}</p>
              </div>
            </details>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Processed Speech Segments ({segments.length})
            <span className="text-xs text-gray-500 ml-2">(Intelligent Buffering)</span>
          </label>
          <div className="bg-gray-50 p-3 rounded border max-h-[200px] overflow-y-auto">
            {segments.length > 0 ? (
              <div className="space-y-3">
                {segments.slice(-3).reverse().map((segment, index) => (
                  <div key={index} className="text-sm border-l-4 border-blue-400 pl-3 pb-2">
                    <details>
                      <summary className="font-medium text-gray-800 cursor-pointer hover:text-blue-600">
                        {segment.summary ? `${segment.summary.substring(0, 80)}...` : 'Processing...'}
                      </summary>
                      <div className="mt-2 p-2 bg-white rounded text-xs">
                        <p className="text-gray-700 mb-2">{segment.text}</p>
                        <div className="flex justify-between items-center text-gray-500">
                          <span>{segment.timestamp.toLocaleTimeString()}</span>
                          {segment.modelUsed && (
                            <span className={`px-2 py-1 rounded ${
                              segment.modelUsed === 't5-small-dialogsum' 
                                ? 'bg-blue-100 text-blue-700' 
                                : segment.modelUsed === 'gradio'
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {segment.modelUsed}
                            </span>
                          )}
                        </div>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">No processed segments yet - speak longer phrases for better results</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechRecognition; 