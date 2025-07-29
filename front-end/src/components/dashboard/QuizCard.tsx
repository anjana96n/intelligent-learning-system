import React from 'react';
import { BrainCircuit, BookOpen } from 'lucide-react';

export default function QuizCard() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="h-5 w-5 text-purple-300" />
          <h3 className="text-lg font-semibold text-white">Current Quiz</h3>
        </div>
        <div className="flex items-center space-x-2 text-purple-200">
          <BookOpen className="h-4 w-4" />
          <span className="text-sm">Question 1 of 5</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-white/10 rounded-lg border border-white/20">
          <p className="font-medium text-white">What is the main benefit of active learning?</p>
        </div>
        
        <div className="space-y-3">
          {[
            { text: 'Better retention', correct: true },
            { text: 'Faster completion', correct: false },
            { text: 'Less effort', correct: false },
            { text: 'More fun', correct: false }
          ].map((option, index) => (
            <button
              key={index}
              className="w-full p-3 text-left rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 hover:border-purple-400 transition-all duration-200 text-blue-100 hover:text-white"
            >
              {option.text}
            </button>
          ))}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-white/20">
          <span className="text-sm text-blue-200">Time remaining: 2:30</span>
          <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105">
            Submit Answer
          </button>
        </div>
      </div>
    </div>
  );
}