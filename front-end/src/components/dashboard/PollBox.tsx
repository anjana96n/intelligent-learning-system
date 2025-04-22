import React from 'react';
import { PieChart } from 'lucide-react';

export default function PollBox() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Quick Poll</h3>
        <PieChart className="h-5 w-5 text-[#4AA7EF]" />
      </div>
      <p className="text-gray-600 mb-4">How are you feeling about today's lesson?</p>
      <div className="grid grid-cols-2 gap-2">
        {['😊', '😐', '🤔', '😴'].map((emoji, index) => (
          <button
            key={index}
            className="p-4 text-2xl rounded-lg border border-gray-200 hover:border-[#4AA7EF] hover:bg-blue-50"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}