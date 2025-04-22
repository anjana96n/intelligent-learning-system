import React from 'react';
import MainLayout from '../layouts/MainLayout';
import WebcamFeed from '../components/dashboard/WebcamFeed';
import QuizCard from '../components/dashboard/QuizCard';
import PollBox from '../components/dashboard/PollBox';

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <WebcamFeed />
          <PollBox />
        </div>
        <div>
          <QuizCard />
        </div>
      </div>
    </MainLayout>
  );
}