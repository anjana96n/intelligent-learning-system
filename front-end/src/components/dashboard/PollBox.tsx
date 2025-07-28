import React from 'react';
import { PieChart, Smile } from 'lucide-react';

export default function PollBox() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PieChart className="h-5 w-5 text-green-300" />
          <h3 className="text-lg font-semibold text-white">Quick Poll</h3>
        </div>
        <Smile className="h-4 w-4 text-green-300" />
      </div>
      
      <p className="text-blue-100 mb-4">How are you feeling about today's lesson?</p>
      
      <div className="grid grid-cols-2 gap-3">
        {[
          { emoji: '😊', label: 'Great', color: 'hover:bg-green-500/20 hover:border-green-400' },
          { emoji: '😐', label: 'Okay', color: 'hover:bg-yellow-500/20 hover:border-yellow-400' },
          { emoji: '🤔', label: 'Confused', color: 'hover:bg-orange-500/20 hover:border-orange-400' },
          { emoji: '😴', label: 'Tired', color: 'hover:bg-red-500/20 hover:border-red-400' }
        ].map((item, index) => (
          <button
            key={index}
            className={`p-4 text-2xl rounded-lg border border-white/20 bg-white/5 transition-all duration-200 ${item.color} hover:scale-105`}
          >
            <div className="text-center">
              <div className="text-3xl mb-1">{item.emoji}</div>
              <div className="text-xs text-blue-200">{item.label}</div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="text-center pt-2">
        <span className="text-xs text-blue-200">Click to vote</span>
      </div>
    </div>
  );
}