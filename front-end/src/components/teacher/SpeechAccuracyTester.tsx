import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Download, FileText, BarChart3, TestTube2 } from 'lucide-react';
import { 
  calculateWER, 
  TEST_PHRASES, 
  generateTestReport, 
  exportReportAsCSV, 
  downloadFile,
  testWER,
  type TestResult, 
  type TestReport,
  type AccuracyMetrics 
} from '../../utils/speechMetrics';

interface SpeechAccuracyTesterProps {
  className?: string;
}

interface TestSession {
  currentPhraseIndex: number;
  isRunning: boolean;
  currentPhrase: string;
  recognizedText: string;
  results: TestResult[];
  startTime?: Date;
}

const SpeechAccuracyTester: React.FC<SpeechAccuracyTesterProps> = ({ className = '' }) => {
  const [testSession, setTestSession] = useState<TestSession>({
    currentPhraseIndex: 0,
    isRunning: false,
    currentPhrase: '',
    recognizedText: '',
    results: []
  });

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<TestReport | null>(null);
  const [showReport, setShowReport] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = false;  // Single phrase at a time
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      if (event.results.length > 0) {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        handleRecognitionResult(transcript, confidence);
      }
    };

    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleRecognitionResult = (recognizedText: string, confidence: number) => {
    // CRITICAL: Use the current state at the time of recognition
    setTestSession(prev => {
      const currentPhrase = TEST_PHRASES[prev.currentPhraseIndex];
      
      console.log('🎯 RECOGNITION RESULT:');
      console.log('State current phrase index:', prev.currentPhraseIndex);
      console.log('Reference phrase:', currentPhrase);
      console.log('Recognized text:', recognizedText);
      
      const metrics = calculateWER(currentPhrase, recognizedText);
      
      const result: TestResult = {
        testPhrase: currentPhrase,
        recognizedText: recognizedText,
        metrics,
        timestamp: new Date(),
        browser: getBrowserInfo(),
        confidence
      };

      const newResults = [...prev.results, result];
      const isLastPhrase = prev.currentPhraseIndex === TEST_PHRASES.length - 1;
      const completedAllTests = newResults.length === TEST_PHRASES.length;
      
      console.log('📊 Results count:', newResults.length);
      console.log('📊 Total phrases:', TEST_PHRASES.length);
      console.log('📊 Current phrase index:', prev.currentPhraseIndex);
      console.log('📊 Is last phrase?', isLastPhrase);
      console.log('📊 Completed all tests?', completedAllTests);
      
      // Only generate report when we have completed ALL tests (not just on the last phrase index)
      if (completedAllTests) {
        setTimeout(() => {
          console.log('✅ All tests completed! Generating report...');
          const testReport = generateTestReport(newResults);
          setReport(testReport);
          setShowReport(true);
          setTestSession(current => ({
            ...current,
            isRunning: false
          }));
        }, 500); // Small delay to ensure state is updated
      }

      return {
        ...prev,
        recognizedText,
        results: newResults
      };
    });
  };

  const getBrowserInfo = (): string => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edg')) return 'Edge';
    return 'Unknown';
  };

  const startTesting = () => {
    setTestSession({
      currentPhraseIndex: 0,
      isRunning: true,
      currentPhrase: TEST_PHRASES[0],
      recognizedText: '',
      results: [],
      startTime: new Date()
    });
    setReport(null);
    setShowReport(false);
    setError(null);
  };

  const stopTesting = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setTestSession(prev => {
      console.log('🛑 Stopping test with', prev.results.length, 'results');
      
      // Generate report if we have results
      if (prev.results.length > 0) {
        const testReport = generateTestReport(prev.results);
        setReport(testReport);
        setShowReport(true);
      }
      
      return {
        ...prev,
        isRunning: false
      };
    });
  };

  const resetTesting = () => {
    stopTesting();
    setTestSession({
      currentPhraseIndex: 0,
      isRunning: false,
      currentPhrase: '',
      recognizedText: '',
      results: []
    });
    setReport(null);
    setShowReport(false);
  };

  const nextPhrase = () => {
    setTestSession(prev => {
      const nextIndex = prev.currentPhraseIndex + 1;
      
      console.log('📋 ADVANCING PHRASE:');
      console.log('From index:', prev.currentPhraseIndex);
      console.log('To index:', nextIndex);
      
      if (nextIndex >= TEST_PHRASES.length) {
        // Test completed
        console.log('✅ Test completed!');
        stopTesting();
        return prev; // Don't change state if test is complete
      }

      const newPhrase = TEST_PHRASES[nextIndex];
      console.log('New phrase:', newPhrase);

      return {
        ...prev,
        currentPhraseIndex: nextIndex,
        currentPhrase: newPhrase,
        recognizedText: ''
      };
    });
  };

  const startListeningForCurrentPhrase = () => {
    if (recognitionRef.current && testSession.isRunning) {
      // Clear any pending auto-advance timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      console.log('🎤 STARTING RECOGNITION:');
      console.log('For phrase index:', testSession.currentPhraseIndex);
      console.log('Phrase text:', TEST_PHRASES[testSession.currentPhraseIndex]);
      
      setTestSession(prev => ({
        ...prev,
        recognizedText: '',
        currentPhrase: TEST_PHRASES[prev.currentPhraseIndex] // Ensure sync
      }));
      
      recognitionRef.current.start();
    }
  };

  const downloadCSVReport = () => {
    if (report) {
      const csvContent = exportReportAsCSV(report);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(csvContent, `speech-accuracy-report-${timestamp}.csv`, 'text/csv');
    }
  };

  const downloadJSONReport = () => {
    if (report) {
      const jsonContent = JSON.stringify(report, null, 2);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(jsonContent, `speech-accuracy-report-${timestamp}.json`, 'application/json');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <TestTube2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Speech Recognition Accuracy Tester</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {testSession.results.length} / {TEST_PHRASES.length} phrases tested
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex space-x-3 mb-6">
        {!testSession.isRunning ? (
          <button
            onClick={startTesting}
            disabled={!!error}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={16} />
            <span>Start Testing</span>
          </button>
        ) : (
          <button
            onClick={stopTesting}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Pause size={16} />
            <span>Stop Testing</span>
          </button>
        )}
        
        <button
          onClick={resetTesting}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>

        <button
          onClick={() => {
            console.clear();
            testWER();
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          <TestTube2 size={16} />
          <span>Debug WER</span>
        </button>

        <button
          onClick={() => {
            setTestSession(prev => ({
              ...prev,
              currentPhraseIndex: 0,
              currentPhrase: TEST_PHRASES[0],
              recognizedText: '',
              results: []
            }));
            console.log('🔄 Reset to phrase 0:', TEST_PHRASES[0]);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <RotateCcw size={16} />
          <span>Reset to First</span>
        </button>

        {report && (
          <>
            <button
              onClick={downloadCSVReport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              <span>Download CSV</span>
            </button>
            <button
              onClick={downloadJSONReport}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <FileText size={16} />
              <span>Download JSON</span>
            </button>
          </>
        )}
      </div>

      {/* Current Test Phase */}
      {testSession.isRunning && (
        <div className="border rounded-lg p-4 mb-6 bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">
              Current Phrase ({testSession.currentPhraseIndex + 1} of {TEST_PHRASES.length})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={startListeningForCurrentPhrase}
                disabled={isListening}
                className={`px-3 py-1 rounded-lg text-sm ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isListening ? 'Listening...' : 'Start Recognition'}
              </button>
              
              {testSession.currentPhraseIndex < TEST_PHRASES.length - 1 && (
                <button
                  onClick={nextPhrase}
                  disabled={isListening}
                  className="px-3 py-1 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Next Phrase →
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Read this phrase:</label>
              <p className="p-3 bg-white border rounded text-gray-800 leading-relaxed">
                "{testSession.currentPhrase}"
              </p>
            </div>
            
            {testSession.recognizedText && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recognized:</label>
                <p className="p-3 bg-gray-100 border rounded text-gray-800 leading-relaxed">
                  "{testSession.recognizedText}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real-time Results */}
      {testSession.results.length > 0 && !showReport && (
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Latest Results</h3>
          <div className="space-y-2">
            {testSession.results.slice(-3).reverse().map((result, index) => (
              <div key={index} className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-gray-600">
                  Phrase {testSession.results.length - index}
                </span>
                <div className="flex space-x-4">
                  <span className={`font-medium ${result.metrics.wer <= 10 ? 'text-green-600' : result.metrics.wer <= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                    WER: {result.metrics.wer}%
                  </span>
                  <span className={`font-medium ${result.metrics.cer <= 8 ? 'text-green-600' : result.metrics.cer <= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                    CER: {result.metrics.cer}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Report */}
      {report && showReport && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Accuracy Report</span>
            </h3>
            <button
              onClick={() => setShowReport(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{report.averageWER}%</div>
              <div className="text-sm text-gray-600">Average WER</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{report.averageCER}%</div>
              <div className="text-sm text-gray-600">Average CER</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{report.bestWER}%</div>
              <div className="text-sm text-gray-600">Best WER</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{report.worstWER}%</div>
              <div className="text-sm text-gray-600">Worst WER</div>
            </div>
          </div>

          {/* Test Environment */}
          <div className="bg-white p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">Test Environment</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Browser:</span>
                <span className="ml-2 font-medium">{report.testEnvironment.browser}</span>
              </div>
              <div>
                <span className="text-gray-600">Language:</span>
                <span className="ml-2 font-medium">{report.testEnvironment.language}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Tests:</span>
                <span className="ml-2 font-medium">{report.totalTests}</span>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-lg overflow-hidden">
            <h4 className="font-semibold p-4 bg-gray-100">Detailed Results</h4>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">WER</th>
                    <th className="px-4 py-2 text-left">CER</th>
                    <th className="px-4 py-2 text-left">Confidence</th>
                    <th className="px-4 py-2 text-left">Phrase Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((result, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className={`px-4 py-2 font-medium ${
                        result.metrics.wer <= 10 ? 'text-green-600' : 
                        result.metrics.wer <= 20 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {result.metrics.wer}%
                      </td>
                      <td className={`px-4 py-2 font-medium ${
                        result.metrics.cer <= 8 ? 'text-green-600' : 
                        result.metrics.cer <= 15 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {result.metrics.cer}%
                      </td>
                      <td className="px-4 py-2">
                        {result.confidence ? `${Math.round(result.confidence * 100)}%` : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-gray-600 max-w-xs truncate">
                        {result.testPhrase.substring(0, 50)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!testSession.isRunning && testSession.results.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
          <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
            <li>Click "Start Testing" to begin the accuracy measurement</li>
            <li>Read each displayed phrase clearly into your microphone</li>
            <li>Click "Start Recognition" for each phrase when ready</li>
            <li>The system will automatically calculate WER and CER for each phrase</li>
            <li>After all phrases, download the detailed report for your submission</li>
          </ol>
          <div className="mt-3 text-sm text-blue-700">
            <strong>Note:</strong> This test includes {TEST_PHRASES.length} educational phrases designed to measure speech recognition accuracy in classroom settings.
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechAccuracyTester;
