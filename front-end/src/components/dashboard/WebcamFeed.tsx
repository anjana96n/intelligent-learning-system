import React, { useRef, useEffect, useState } from 'react';
import { Camera, Eye } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Camera className="h-5 w-5 text-blue-200" />
          <h2 className="text-lg font-semibold text-white">Face Detection</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Eye className={`h-4 w-4 ${faceDetected ? 'text-green-400' : 'text-red-400'}`} />
          <span className={`text-sm ${faceDetected ? 'text-green-400' : 'text-red-400'}`}>
            {faceDetected ? 'Face Detected' : 'No Face'}
          </span>
        </div>
      </div>
      <div className="relative bg-black/20 rounded-xl overflow-hidden aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!faceDetected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <Eye className="h-12 w-12 text-red-400 mx-auto mb-2" />
              <p className="text-red-200 text-sm">No face detected</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
