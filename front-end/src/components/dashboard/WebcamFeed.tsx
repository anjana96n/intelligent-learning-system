import React from 'react';
import { Camera } from 'lucide-react';

export default function WebcamFeed() {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Webcam Feed</h2>
        <Camera className="h-5 w-5 text-[#4AA7EF]" />
      </div>
      <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
        <p className="text-gray-500">Webcam feed will appear here</p>
      </div>
    </div>
  );
}