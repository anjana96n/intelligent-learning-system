import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Brain, Plus, Trash2 } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface CreateQuizProps {
  onClose: () => void;
  socket: any;
}

const CreateQuiz: React.FC<CreateQuizProps> = ({ onClose, socket }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    }
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: unknown) => {
    const newQuestions = [...questions];
    if (field === 'options' && Array.isArray(value)) {
      newQuestions[index].options = value;
    } else if (field === 'correctAnswer' && typeof value === 'number') {
      newQuestions[index].correctAnswer = value;
    } else if (field === 'question' && typeof value === 'string') {
      newQuestions[index].question = value;
    }
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting quiz...');
    console.log('User:', user);
    console.log('Title:', title);
    console.log('Questions:', questions);

    if (!title || questions.some(q => !q.question || q.options.some(o => !o)) || !user?._id) {
      console.error('Validation failed:', { title, questions, userId: user?._id });
      return;
    }

    const quizData = {
      title,
      questions,
      createdBy: user._id
    };
    console.log('Emitting create-quiz event with data:', quizData);

    socket.emit('create-quiz', quizData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-purple-300" />
            <h2 className="text-xl font-semibold text-white">Create Quiz</h2>
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
              Quiz Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
              placeholder="Enter quiz title"
              required
            />
          </div>

          {questions.map((question, questionIndex) => (
            <div key={questionIndex} className="p-6 border border-white/20 rounded-xl bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Question {questionIndex + 1}</h3>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-purple-100 text-sm font-medium mb-2">
                    Question Text
                  </label>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your question"
                    required
                  />
                </div>

                <div>
                  <label className="block text-purple-100 text-sm font-medium mb-2">
                    Options
                  </label>
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name={`correct-${questionIndex}`}
                          checked={question.correctAnswer === optionIndex}
                          onChange={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                          className="text-purple-400 focus:ring-purple-400"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                          className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                          placeholder={`Option ${optionIndex + 1}`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center space-x-2 px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-purple-200 hover:bg-white/20 hover:text-white transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-purple-200 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title || questions.some(q => !q.question || q.options.some(o => !o)) || !user?._id}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Quiz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuiz; 