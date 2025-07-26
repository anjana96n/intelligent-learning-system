import React from 'react';
import PieChartComponent from '../common/PieChartComponent';

interface Student {
  id: string;
  name: string;
  isPresent: boolean;
  lastActive: Date;
}

interface Poll {
  _id: string;
  question: string;
  options: string[];
  responses: {
    studentId: string;
    studentName: string;
    response: string;
  }[];
  targetStudents: string[];
  createdAt: string;
}

interface Quiz {
  _id: string;
  title: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  responses: {
    studentId: string;
    studentName: string;
    answers: number[];
    score: number;
  }[];
  targetStudents: string[];
  createdAt: string;
}

interface StatisticsDashboardProps {
  students: Student[];
  polls: Poll[];
  quizzes: Quiz[];
}

const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ 
  students, 
  polls, 
  quizzes 
}) => {
  // Calculate student presence statistics
  const presentStudents = students.filter(s => s.isPresent).length;
  const absentStudents = students.length - presentStudents;
  
  const presenceData = [
    { name: 'Present', value: presentStudents, color: '#10B981' },
    { name: 'Absent', value: absentStudents, color: '#EF4444' }
  ];

  // Calculate quiz performance statistics
  const allQuizResponses = quizzes.flatMap(quiz => quiz.responses);
  const totalQuizResponses = allQuizResponses.length;
  const averageScore = totalQuizResponses > 0 
    ? allQuizResponses.reduce((sum, r) => sum + r.score, 0) / totalQuizResponses 
    : 0;
  
  // Calculate performance based on percentage scores
  const excellentScores = allQuizResponses.filter(response => {
    const quiz = quizzes.find(q => q.responses.some(r => r.studentId === response.studentId));
    if (!quiz) return false;
    const percentage = (response.score / quiz.questions.length) * 100;
    return percentage >= 80; // 80% or higher
  }).length;
  
  const goodScores = allQuizResponses.filter(response => {
    const quiz = quizzes.find(q => q.responses.some(r => r.studentId === response.studentId));
    if (!quiz) return false;
    const percentage = (response.score / quiz.questions.length) * 100;
    return percentage >= 60 && percentage < 80; // 60-79%
  }).length;
  
  const averageScores = allQuizResponses.filter(response => {
    const quiz = quizzes.find(q => q.responses.some(r => r.studentId === response.studentId));
    if (!quiz) return false;
    const percentage = (response.score / quiz.questions.length) * 100;
    return percentage >= 40 && percentage < 60; // 40-59%
  }).length;
  
  const poorScores = allQuizResponses.filter(response => {
    const quiz = quizzes.find(q => q.responses.some(r => r.studentId === response.studentId));
    if (!quiz) return false;
    const percentage = (response.score / quiz.questions.length) * 100;
    return percentage < 40; // Below 40%
  }).length;

  const quizPerformanceData = [
    { name: 'Excellent (80%+)', value: excellentScores, color: '#10B981' },
    { name: 'Good (60-79%)', value: goodScores, color: '#3B82F6' },
    { name: 'Average (40-59%)', value: averageScores, color: '#F59E0B' },
    { name: 'Poor (<40%)', value: poorScores, color: '#EF4444' }
  ];

  // Calculate poll response statistics
  const totalPollResponses = polls.reduce((sum, poll) => sum + poll.responses.length, 0);
  const totalExpectedResponses = polls.reduce((sum, poll) => sum + poll.targetStudents.length, 0);
  const respondedPolls = totalPollResponses;
  const notRespondedPolls = totalExpectedResponses - totalPollResponses;

  const pollResponseData = [
    { name: 'Responded', value: respondedPolls, color: '#10B981' },
    { name: 'Not Responded', value: notRespondedPolls, color: '#6B7280' }
  ];

  // Get unique students who have responded to polls
  const studentsWhoResponded = Array.from(new Set(
    polls.flatMap(poll => poll.responses.map(response => response.studentName))
  )).filter(name => name && name.trim() !== ''); // Filter out empty names

  // Debug logging
  console.log('Polls:', polls);
  console.log('Students who responded:', studentsWhoResponded);

  // Calculate quiz participation statistics
  const totalQuizQuestions = quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);
  const totalQuizResponsesCount = quizzes.reduce((sum, quiz) => sum + quiz.responses.length, 0);
  const totalExpectedQuizResponses = quizzes.reduce((sum, quiz) => sum + quiz.targetStudents.length, 0);

  const quizParticipationData = [
    { name: 'Participated', value: totalQuizResponsesCount, color: '#10B981' },
    { name: 'Not Participated', value: totalExpectedQuizResponses - totalQuizResponsesCount, color: '#6B7280' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Statistics Dashboard</h2>
      
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-medium opacity-90">Total Students</h3>
          <p className="text-3xl font-bold">{students.length}</p>
          <p className="text-sm opacity-90">
            {presentStudents} present, {absentStudents} absent
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-medium opacity-90">Active Polls</h3>
          <p className="text-3xl font-bold">{polls.length}</p>
          <p className="text-sm opacity-90">
            {totalPollResponses} total responses
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-medium opacity-90">Active Quizzes</h3>
          <p className="text-3xl font-bold">{quizzes.length}</p>
          <p className="text-sm opacity-90">
            {totalQuizResponsesCount} total responses
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-medium opacity-90">Avg Quiz Score</h3>
          <p className="text-3xl font-bold">{averageScore.toFixed(1)}</p>
          <p className="text-sm opacity-90">
            average score
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Student Presence */}
        <PieChartComponent
          data={presenceData}
          title="Student Presence"
          width={250}
          height={250}
        />

        {/* Quiz Performance */}
        <PieChartComponent
          data={quizPerformanceData}
          title="Quiz Performance"
          width={250}
          height={250}
        />

        {/* Poll Responses */}
        <PieChartComponent
          data={pollResponseData}
          title="Poll Responses"
          width={250}
          height={250}
        />

        {/* Quiz Participation */}
        <PieChartComponent
          data={quizParticipationData}
          title="Quiz Participation"
          width={250}
          height={250}
                 />
       </div>

               {/* Poll Response Details */}
        {studentsWhoResponded.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Students Who Responded to Polls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentsWhoResponded.map((studentName, index) => (
                <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-green-800">{studentName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Poll Response Debug Info */}
        {polls.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Poll Response Details</h3>
            <div className="space-y-4">
              {polls.map(poll => (
                <div key={poll._id} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{poll.question}</h4>
                  <div className="space-y-2">
                    {poll.responses.map((response, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-700 font-medium">{response.studentName || 'Unknown Student'}</span>
                          <span className="text-sm text-gray-500">Response: {response.response}</span>
                        </div>
                      </div>
                    ))}
                    {poll.responses.length === 0 && (
                      <p className="text-gray-500 text-sm">No responses yet</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

       {/* Quiz Response Details */}
       {allQuizResponses.length > 0 && (
         <div className="bg-white shadow rounded-lg p-6 mt-6">
           <h3 className="text-lg font-semibold mb-4">Quiz Performance Details</h3>
           <div className="space-y-4">
             {quizzes.map(quiz => (
               <div key={quiz._id} className="border rounded-lg p-4">
                 <h4 className="font-medium mb-3">{quiz.title}</h4>
                 <div className="space-y-2">
                   {quiz.responses.map(response => {
                     const percentage = (response.score / quiz.questions.length) * 100;
                     const getPerformanceColor = (percentage: number) => {
                       if (percentage >= 80) return 'text-green-600 bg-green-50';
                       if (percentage >= 60) return 'text-blue-600 bg-blue-50';
                       if (percentage >= 40) return 'text-orange-600 bg-orange-50';
                       return 'text-red-600 bg-red-50';
                     };
                     
                     return (
                       <div key={response.studentId} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                         <span className="font-medium">{response.studentName}</span>
                         <div className="flex items-center space-x-3">
                           <span className={`px-2 py-1 rounded text-sm font-medium ${getPerformanceColor(percentage)}`}>
                             {response.score}/{quiz.questions.length} ({percentage.toFixed(0)}%)
                           </span>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}
     </div>
   );
 };

export default StatisticsDashboard; 