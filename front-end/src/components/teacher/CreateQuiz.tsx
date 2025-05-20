import React, { useState } from 'react';

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
    if (!title || questions.some(q => !q.question || q.options.some(o => !o))) return;

    socket.emit('create-quiz', {
      title,
      questions
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
        <h2 className="text-xl font-semibold mb-4">Create Quiz</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Quiz Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quiz title"
              required
            />
          </div>

          {questions.map((question, questionIndex) => (
            <div key={questionIndex} className="mb-6 p-4 border rounded-lg">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Question {questionIndex + 1}
                </label>
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter question"
                  required
                />
              </div>

              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`correct-${questionIndex}`}
                      checked={question.correctAnswer === optionIndex}
                      onChange={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Option ${optionIndex + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-between mb-4">
            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Question
            </button>
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
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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