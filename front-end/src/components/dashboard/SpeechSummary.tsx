import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, User } from 'lucide-react';

interface SpeechSummary {
  id: string;
  teacherId: string;
  teacherName: string;
  summary: string;
  originalText: string;
  timestamp: Date;
  sessionId: string;
  confidence?: number;
  modelUsed?: string;
}

interface SpeechSummaryProps {
  socket: any;
}

const SpeechSummary: React.FC<SpeechSummaryProps> = ({ socket }) => {
  const [summaries, setSummaries] = useState<SpeechSummary[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Listen for new speech summaries
    socket.on('speech-summary', (summary: SpeechSummary) => {
      console.log('Received speech summary:', summary);
      setSummaries(prev => [summary, ...prev.slice(0, 9)]); // Keep last 10 summaries
      setIsActive(true);
    });

    // Listen for speech session start
    socket.on('speech-session-start', (data: { sessionId: string; teacherName: string }) => {
      console.log('Speech session started:', data);
      setCurrentSession(data.sessionId);
      setIsActive(true);
      setSummaries([]); // Clear previous summaries for new session
    });

    // Listen for speech session end
    socket.on('speech-session-end', (data: { sessionId: string }) => {
      console.log('Speech session ended:', data);
      if (currentSession === data.sessionId) {
        setIsActive(false);
      }
    });

    return () => {
      socket.off('speech-summary');
      socket.off('speech-session-start');
      socket.off('speech-session-end');
    };
  }, [socket, currentSession]);

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    } else {
      return `${seconds}s ago`;
    }
  };

  // Smart truncation that preserves complete words and sentences
  const smartTruncate = (text: string, maxLength: number = 100) => {
    if (!text || text.length <= maxLength) return text;
    
    // First try to find a complete sentence within the limit
    const sentences = text.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences[0] && sentences[0].length <= maxLength) {
      return sentences[0].trim();
    }
    
    // If no complete sentence fits, truncate at word boundary
    const truncated = text.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.7) { // Only truncate at space if it's not too early
      return truncated.substring(0, lastSpaceIndex).trim() + '...';
    }
    
    // If we can't find a good word boundary, just truncate and add ellipsis
    return truncated.trim() + '...';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isActive ? 'Receiving Live Summaries' : 'No Active Session'}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {summaries.length > 0 && `Showing last ${Math.min(5, summaries.length)} of ${summaries.length} summaries`}
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="mx-auto text-gray-300 mb-2" size={48} />
          <p className="text-gray-500">
            {isActive 
              ? 'Waiting for teacher to start speaking...' 
              : 'No active lecture session'
            }
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 p-3 rounded border max-h-[300px] overflow-y-auto">
          <div className="space-y-3">
            {summaries.slice(-5).reverse().map((summary, index) => (
              <div key={summary.id || index} className="text-sm border-l-4 border-blue-400 pl-3 pb-2">
                <details>
                  <summary className="font-medium text-gray-800 cursor-pointer hover:text-blue-600 flex items-center justify-between">
                    <span className="flex-1">
                      {summary.summary ? smartTruncate(summary.summary, 100) : 'Processing...'}
                    </span>
                    <div className="flex items-center space-x-2 ml-2">
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(summary.timestamp)}
                      </span>
                      {summary.confidence && (
                        <span className="text-xs text-green-600 bg-green-100 px-1 py-0.5 rounded">
                          {Math.round(summary.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </summary>
                  <div className="mt-2 p-3 bg-white rounded border text-xs space-y-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="text-blue-500" size={14} />
                        <span className="font-medium text-gray-700">{summary.teacherName}</span>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          AI-Generated
                        </span>
                      </div>
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded-r mb-2">
                        <p className="text-blue-800 font-medium">{summary.summary}</p>
                      </div>
                    </div>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700 mb-1">
                        Show original transcript
                      </summary>
                      <p className="text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                        {summary.originalText}
                      </p>
                    </details>
                    <div className="flex justify-between items-center text-gray-500 pt-2 border-t">
                      <span>{formatTime(summary.timestamp)}</span>
                      <div className="flex items-center space-x-2">
                        {summary.modelUsed && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            summary.modelUsed === 't5-small-dialogsum' 
                              ? 'bg-green-100 text-green-700' 
                              : summary.modelUsed === 'gradio'
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {summary.modelUsed === 't5-small-dialogsum' ? 'T5 AI' : 
                             summary.modelUsed === 'gradio' ? 'Gradio AI' : 'Enhanced'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {summaries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Showing last {Math.min(5, summaries.length)} of {summaries.length} summaries</span>
            <button
              onClick={() => setSummaries([])}
              className="text-blue-500 hover:text-blue-700 hover:underline"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechSummary; 