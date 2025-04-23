import React, { useRef, useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import * as faceapi from 'face-api.js';

export default function WebcamFeed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; // You need to serve these files
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    };

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('Camera started successfully');
        }
      } catch (error) {
        console.error('Error starting camera:', error);
      }
    };

    loadModels().then(startVideo);

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (videoRef.current && faceapi.nets.tinyFaceDetector.params) {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );
        setFaceDetected(detections.length > 0);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Webcam Feed</h2>
        <div
          className={`h-4 w-4 rounded-full ${
            faceDetected ? 'bg-green-500' : 'bg-red-500'
          }`}
        ></div>
      </div>
      <div className="bg-gray-100 rounded-lg aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
    </div>
  );
}
