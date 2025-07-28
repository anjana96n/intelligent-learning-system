import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, MessageSquare } from 'lucide-react';

interface CreatePollProps {
  onClose: () => void;
  socket: any;
}

const EMOJI_OPTIONS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🤔', label: 'Confused' },
  { emoji: '👍', label: 'Good' }
];

const CreatePoll: React.FC<CreatePollProps> = ({ onClose, socket }) => {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);

  const handleEmojiToggle = (emoji: string) => {
    setSelectedEmojis(prev => 
      prev.includes(emoji)
        ? prev.filter(e => e !== emoji)
        : [...prev, emoji]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || selectedEmojis.length === 0 || !user?._id) return;

    socket.emit('create-poll', {
      question,
      options: selectedEmojis,
      createdBy: user._id
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-purple-300" />
            <h2 className="text-xl font-semibold text-white">Create Quick Poll</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-purple-100 text-sm font-medium mb-2">
              Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
              placeholder="Enter your question"
              required
            />
          </div>

          <div>
            <label className="block text-purple-100 text-sm font-medium mb-2">
              Select Emoji Options
            </label>
            <div className="grid grid-cols-5 gap-3">
              {EMOJI_OPTIONS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiToggle(emoji)}
                  className={`p-3 rounded-lg text-2xl transition-all duration-200 ${
                    selectedEmojis.includes(emoji)
                      ? 'bg-purple-500/20 border-2 border-purple-400 scale-110'
                      : 'bg-white/10 border border-white/20 hover:bg-white/20 hover:scale-105'
                  }`}
                  title={label}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-purple-200 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!question || selectedEmojis.length === 0 || !user?._id}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePoll; 