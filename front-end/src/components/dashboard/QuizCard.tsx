import React from 'react';
import { BrainCircuit } from 'lucide-react';

export default function QuizCard() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Current Quiz</h3>
        <BrainCircuit className="h-5 w-5 text-[#4AA7EF]" />
      </div>
      <div className="space-y-4">
        <p className="text-gray-600">Question 1 of 5</p>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium">What is the main benefit of active learning?</p>
        </div>
        <div className="space-y-2">
          {['Better retention', 'Faster completion', 'Less effort', 'More fun'].map((option, index) => (
            <button
              key={index}
              className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-[#4AA7EF] hover:bg-blue-50"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}