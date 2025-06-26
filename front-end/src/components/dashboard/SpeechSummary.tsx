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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="text-blue-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Live Lecture Summary</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isActive ? 'Live' : 'Inactive'}
          </span>
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
        <div className="space-y-4">
          {summaries.map((summary, index) => (
            <div 
              key={summary.id || index} 
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <User className="text-blue-500" size={16} />
                  <span className="text-sm font-medium text-gray-700">
                    {summary.teacherName}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-gray-500">
                  <Clock size={14} />
                  <span className="text-xs">
                    {formatRelativeTime(summary.timestamp)}
                  </span>
                </div>
              </div>
              
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-800 mb-1">Summary:</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {summary.summary}
                </p>
              </div>

              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700 mb-1">
                  Show original text
                </summary>
                <p className="text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                  {summary.originalText}
                </p>
              </details>

              <div className="mt-2 text-xs text-gray-400">
                {formatTime(summary.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}

      {summaries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Showing {summaries.length} summaries</span>
            <button
              onClick={() => setSummaries([])}
              className="text-blue-500 hover:text-blue-700"
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