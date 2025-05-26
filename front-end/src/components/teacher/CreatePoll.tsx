import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create Quick Poll</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your question"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Select Emoji Options
            </label>
            <div className="grid grid-cols-5 gap-2">
              {EMOJI_OPTIONS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiToggle(emoji)}
                  className={`p-2 rounded-lg text-2xl ${
                    selectedEmojis.includes(emoji)
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  title={label}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!question || selectedEmojis.length === 0 || !user?._id}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
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