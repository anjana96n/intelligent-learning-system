import React from 'react';
import MainLayout from '../layouts/MainLayout';
import WebcamFeed from '../components/dashboard/WebcamFeed';
import QuizCard from '../components/dashboard/QuizCard';
import PollBox from '../components/dashboard/PollBox';

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to JoyStudy</h1>
          <p className="text-blue-100">Your intelligent learning dashboard</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6">
              <WebcamFeed />
            </div>
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6">
              <PollBox />
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6">
            <QuizCard />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}