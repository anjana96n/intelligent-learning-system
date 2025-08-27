import React from 'react';
import { TestTube2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SpeechAccuracyTester from '../components/teacher/SpeechAccuracyTester';

const SpeechTestingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <TestTube2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Speech Recognition Accuracy Testing</h1>
                  <p className="text-blue-200 mt-1">
                    Measure WER and CER metrics for your speech recognition system
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testing Interface */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          <SpeechAccuracyTester className="bg-transparent" />
        </div>

        {/* Information Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">About This Test</h3>
            <div className="text-blue-100 text-sm space-y-2">
              <p>• Tests 4 educational phrases designed for classroom environments</p>
              <p>• Measures Word Error Rate (WER) and Character Error Rate (CER)</p>
              <p>• Generates detailed reports for academic submissions</p>
              <p>• Works with your browser's built-in speech recognition</p>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Best Practices</h3>
            <div className="text-blue-100 text-sm space-y-2">
              <p>• Use a quiet environment with minimal background noise</p>
              <p>• Speak clearly and at a natural pace</p>
              <p>• Ensure your microphone has good quality</p>
              <p>• Use Chrome or Edge browser for optimal results</p>
            </div>
          </div>
        </div>

        {/* Expected Results Information */}
        <div className="mt-6 backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Expected Performance Ranges</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-200 mb-3">Word Error Rate (WER)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Excellent:</span>
                  <span className="text-green-300 font-medium">0-5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Good:</span>
                  <span className="text-blue-300 font-medium">5-10%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Acceptable:</span>
                  <span className="text-yellow-300 font-medium">10-15%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Needs Improvement:</span>
                  <span className="text-red-300 font-medium">15%+</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-blue-200 mb-3">Character Error Rate (CER)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Excellent:</span>
                  <span className="text-green-300 font-medium">0-3%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Good:</span>
                  <span className="text-blue-300 font-medium">3-6%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Acceptable:</span>
                  <span className="text-yellow-300 font-medium">6-10%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Needs Improvement:</span>
                  <span className="text-red-300 font-medium">10%+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SpeechTestingPage;
