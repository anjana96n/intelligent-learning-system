import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface SpeechRecognitionProps {
  socket: any;
  teacherId: string;
  teacherName: string;
}

interface SpeechSegment {
  text: string;
  timestamp: Date;
  confidence: number;
}

const SpeechRecognition: React.FC<SpeechRecognitionProps> = ({ socket, teacherId, teacherName }) => {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentSegment, setCurrentSegment] = useState('');
  const [segments, setSegments] = useState<SpeechSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const segmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    recognition.onresult = (event: any) => {
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
        const newSegment: SpeechSegment = {
          text: finalTranscript.trim(),
          timestamp: new Date(),
          confidence: 0.9 // Default confidence
        };

        setSegments(prev => [...prev, newSegment]);
        setTranscript(prev => prev + ' ' + finalTranscript);
        
        // Send segment to backend for processing
        if (socket) {
          socket.emit('speech-segment', {
            teacherId,
            teacherName,
            text: finalTranscript.trim(),
            timestamp: new Date()
          });
        }

        // Clear current segment after sending
        setCurrentSegment('');
      } else {
        setCurrentSegment(interimTranscript);
      }
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
    setSegments([]);
    setCurrentSegment('');
  };

  const startNewSession = () => {
    clearTranscript();
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
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Speech
          </label>
          <div className="bg-gray-50 p-3 rounded border min-h-[60px]">
            {currentSegment ? (
              <p className="text-gray-800">{currentSegment}</p>
            ) : (
              <p className="text-gray-400 italic">Waiting for speech...</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Transcript
          </label>
          <div className="bg-gray-50 p-3 rounded border max-h-[200px] overflow-y-auto">
            {transcript ? (
              <p className="text-gray-800 whitespace-pre-wrap">{transcript}</p>
            ) : (
              <p className="text-gray-400 italic">No transcript yet</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Speech Segments ({segments.length})
          </label>
          <div className="bg-gray-50 p-3 rounded border max-h-[150px] overflow-y-auto">
            {segments.length > 0 ? (
              <div className="space-y-2">
                {segments.slice(-5).reverse().map((segment, index) => (
                  <div key={index} className="text-sm">
                    <p className="text-gray-800">{segment.text}</p>
                    <p className="text-gray-500 text-xs">
                      {segment.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">No segments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechRecognition; 