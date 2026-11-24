import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ResumeSetup from './components/ResumeSetup';
import AdaptiveInterviewPortal from './components/AdaptiveInterviewPortal';
import SkillGapDashboard from './components/SkillGapDashboard';
import ResultsHistoryPortal from './components/ResultsHistoryPortal';
import AuthModal from './components/AuthModal';
import { apiUrl } from './config/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('setup');
  const [currentSession, setCurrentSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('adaptiveai_user');
    const token = localStorage.getItem('adaptiveai_token');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (token) {
          fetch(apiUrl('/api/auth/verify'), {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.data?.user) {
                setUser(prev => ({ ...prev, ...data.data.user }));
              }
            })
            .catch(() => {});
        }
      } catch (e) {}
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    const userProfile = userData.user || userData;
    const token = userData.token;
    setUser(userProfile);
    localStorage.setItem('adaptiveai_user', JSON.stringify(userProfile));
    if (token) {
      localStorage.setItem('adaptiveai_token', token);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('adaptiveai_user');
    localStorage.removeItem('adaptiveai_token');
    setCurrentSession(null);
    setActiveTab('setup');
  };

  const handleInterviewStart = (sessionInitialData) => {
    setCurrentSession(sessionInitialData);
    setActiveTab('interview');
  };

  const handleAnswerSubmit = (nextSessionData) => {
    setCurrentSession(prev => ({
      ...prev,
      currentQuestion: nextSessionData.nextQuestion,
      currentDifficulty: nextSessionData.nextDifficulty,
      questionIndex: nextSessionData.questionIndex,
      evaluations: nextSessionData.session?.evaluations || prev.evaluations,
      finalReport: nextSessionData.finalReport || prev.finalReport
    }));
  };

  const handleFinishSession = (completedData) => {
    if (typeof window !== 'undefined' && window.__activeInterviewMediaStream) {
      window.__activeInterviewMediaStream.getTracks().forEach(t => {
        try { t.stop(); } catch (e) {}
      });
      window.__activeInterviewMediaStream = null;
    }
    setCurrentSession(completedData.session);
    setActiveTab('dashboard');
  };

  useEffect(() => {
    // Whenever candidate navigates away from interview room, shut down webcam/mic hardware
    if (activeTab !== 'interview') {
      if (typeof window !== 'undefined' && window.__activeInterviewMediaStream) {
        window.__activeInterviewMediaStream.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
        window.__activeInterviewMediaStream = null;
      }
    }
  }, [activeTab]);

  const handleViewSessionDetail = (session) => {
    setCurrentSession(session);
    setActiveTab('dashboard');
  };

  const handleStartNewMock = () => {
    setActiveTab('setup');
  };

  return (
    <div className="min-h-screen bg-[#0B2641] text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentSession={currentSession}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 pb-12">
        {activeTab === 'setup' && (
          <ResumeSetup
            onInterviewStart={handleInterviewStart}
            user={user}
            onRequireAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeTab === 'interview' && (
          <AdaptiveInterviewPortal
            sessionData={currentSession}
            onAnswerSubmit={handleAnswerSubmit}
            onFinishSession={handleFinishSession}
          />
        )}

        {activeTab === 'dashboard' && (
          <SkillGapDashboard
            sessionData={currentSession}
            user={user}
            onBackToHistory={() => setActiveTab('results')}
            onStartNewMock={handleStartNewMock}
          />
        )}

        {activeTab === 'results' && (
          <ResultsHistoryPortal
            onViewSessionDetail={handleViewSessionDetail}
            user={user}
            onStartNewMock={handleStartNewMock}
          />
        )}
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-[#1C476E] py-4 px-4 text-center text-xs text-slate-400 bg-[#0F3154]/50 backdrop-blur mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-300 font-medium">© 2026 AdaptiveAI. Realistic Mock Interviews for Confident Candidates.</p>
          <div className="flex items-center gap-4 text-slate-400 font-sans text-xs">
            <span>Past Mock History</span> • <span>Model Solutions</span> • <span>Personalized Feedback</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
