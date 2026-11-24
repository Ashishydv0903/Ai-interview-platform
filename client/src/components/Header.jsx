import React from 'react';
import { BrainCircuit, Sparkles, FileText, BarChart3, LogIn, LogOut, History } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, currentSession, user, onOpenAuth, onLogout }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#5CDB94] text-[#0B2540] border-b border-[#48C982] shadow-md px-4 lg:px-8 py-3 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab('setup')}>
          <div className="w-10 h-10 rounded-xl bg-[#0B2540] p-1 flex items-center justify-center shadow-md">
            <BrainCircuit className="w-6 h-6 text-[#5CDB94]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl tracking-tight text-[#0B2540] font-['Outfit']">
                Adaptive<span>AI</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#0B2540]/15 text-[#0B2540] border border-[#0B2540]/25 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Mock Practice
              </span>
            </div>
            <p className="text-xs text-[#0B2540]/80 font-medium hidden sm:block">Realistic mock interviews with instant mentor feedback</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#48C982]/60 p-1.5 rounded-xl border border-[#0B2540]/15 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'setup'
                ? 'bg-[#0B2540] text-white shadow-md font-bold'
                : 'text-[#0B2540] hover:text-black hover:bg-[#5CDB94] font-semibold'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Practice Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            disabled={!currentSession || currentSession.status === 'COMPLETED' || currentSession.isClosed}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'interview'
                ? 'bg-[#0B2540] text-white shadow-md font-bold'
                : (!currentSession || currentSession.status === 'COMPLETED' || currentSession.isClosed)
                ? 'text-[#0B2540]/40 cursor-not-allowed'
                : 'text-[#0B2540] hover:text-black hover:bg-[#5CDB94] font-semibold'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Live Mock</span>
            {currentSession && currentSession.status !== 'COMPLETED' && !currentSession.isClosed && (
              <span className="w-2 h-2 rounded-full bg-[#0B2540] animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            disabled={!currentSession?.finalReport}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#0B2540] text-white shadow-md font-bold'
                : !currentSession?.finalReport
                ? 'text-[#0B2540]/40 cursor-not-allowed'
                : 'text-[#0B2540] hover:text-black hover:bg-[#5CDB94] font-semibold'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Skill Scorecard</span>
          </button>

          <button
            onClick={() => {
              if (!user && onOpenAuth) {
                onOpenAuth();
              } else {
                setActiveTab('results');
              }
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'results'
                ? 'bg-[#0B2540] text-white shadow-md font-bold'
                : 'text-[#0B2540] hover:text-black hover:bg-[#5CDB94] font-semibold'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Past Results</span>
          </button>
        </nav>

        {/* User Account / Login Controls */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2 bg-[#0B2540] text-white px-3.5 py-1.5 rounded-xl text-xs shadow-md">
              <div className="w-6 h-6 rounded-full bg-[#5CDB94] text-[#0B2540] font-bold flex items-center justify-center font-mono">
                {user.name?.charAt(0) || 'C'}
              </div>
              <div className="text-left hidden md:block">
                <span className="font-bold text-white block text-[11px] leading-tight">{user.name}</span>
                <span className="text-[9px] font-mono text-[#5CDB94] uppercase">Candidate</span>
              </div>
              <button
                onClick={onLogout}
                className="ml-1 text-slate-300 hover:text-rose-400 transition-colors p-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 bg-[#0B2540] hover:bg-[#071B2E] text-[#5CDB94] font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
