import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Award, ChevronRight, Eye, Calendar, Clock, CheckCircle2, AlertTriangle, BookOpen, Sparkles, ArrowRight, RotateCcw, Target } from 'lucide-react';

export default function ResultsHistoryPortal({ onViewSessionDetail, user, onStartNewMock }) {
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDomain, setFilterDomain] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const url = user?.id ? `/api/interviews?userId=${encodeURIComponent(user.id)}` : '/api/interviews';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSessions(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load interview history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => {
    const roleMatch = (s.targetRole || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (s.candidateDomain || "").toLowerCase().includes(searchQuery.toLowerCase());
    const domainMatch = filterDomain === "ALL" || s.candidateDomain === filterDomain;
    return roleMatch && domainMatch;
  });

  // Calculate Cumulative Performance Stats
  const completedSessions = sessions.filter(s => s.status === 'COMPLETED' || s.finalReport);
  const totalMocks = completedSessions.length;
  const avgScore = totalMocks > 0
    ? Math.round(completedSessions.reduce((acc, curr) => acc + (curr.finalReport?.overallScore || 70), 0) / totalMocks)
    : 0;
  const highestScore = totalMocks > 0
    ? Math.max(...completedSessions.map(s => s.finalReport?.overallScore || 0))
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">
      {/* Top Header Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <History className="w-3.5 h-3.5" /> Candidate Progress Hub
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Account: <strong className="text-slate-200">{user?.name || "Guest Candidate"}</strong>
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1.5 font-['Outfit']">
            Your Mock Interview <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">History & Results</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review past mock attempts, track competency growth over time, and revisit personalized mentor feedback.
          </p>
        </div>

        <button
          onClick={onStartNewMock}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 text-xs transition-all whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Take Another Mock
        </button>
      </div>

      {/* Cumulative Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 border border-purple-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{totalMocks}</div>
            <div className="text-[11px] text-slate-400">Mocks Completed</div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-cyan-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{avgScore}%</div>
            <div className="text-[11px] text-slate-400">Average Score</div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-emerald-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{highestScore}%</div>
            <div className="text-[11px] text-slate-400">Highest Score</div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-amber-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{totalMocks * 15}m</div>
            <div className="text-[11px] text-slate-400">Practice Time</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-card rounded-xl p-3 border border-slate-800 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search role or skill..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterDomain}
            onChange={e => setFilterDomain(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500 w-full sm:w-auto"
          >
            <option value="ALL">All Categories</option>
            <option value="Frontend">Frontend Development</option>
            <option value="Backend">Backend Engineering</option>
            <option value="FullStack">Full Stack</option>
            <option value="DataScience">Data Science & AI</option>
            <option value="Aptitude & Reasoning">Aptitude & Reasoning</option>
            <option value="Business & Management">Business & Management</option>
            <option value="English Communication">English Communication</option>
            <option value="Finance & Accounting">Finance & Accounting</option>
          </select>
        </div>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs">Loading your interview attempts...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Mock Interviews Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              You haven't completed any mock interviews in this category yet. Take an adaptive mock to evaluate your readiness and get detailed feedback!
            </p>
          </div>
          <button
            onClick={onStartNewMock}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
          >
            Start Your First Mock Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSessions.map((session, index) => {
            const score = session.finalReport?.overallScore || 70;
            const readiness = session.finalReport?.readinessTier || "Interview Ready";
            const dateStr = session.createdAt
              ? new Date(session.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Recent Session';

            const questionsCount = session.evaluations?.length || session.totalQuestionsPlanned || 5;

            return (
              <div
                key={session.id || session.sessionId || index}
                className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {session.candidateDomain || "Technical"}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" /> {dateStr}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> {session.timeLimitMinutes || 15} Mins
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {session.targetRole || `${session.candidateDomain} Candidate`}
                    {session.customSubject && (
                      <span className="text-xs font-normal text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                        {session.customSubject}
                      </span>
                    )}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {session.finalReport?.humanSummary ||
                     `Completed ${questionsCount} adaptive questions covering ${(session.candidateSkills || []).slice(0, 4).join(', ')}.`}
                  </p>

                  {session.finalReport?.strengths && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {session.finalReport.strengths.slice(0, 2).map((str, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> {str}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score & View Button */}
                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                  <div className="text-right">
                    <div className="flex items-center gap-2 md:justify-end">
                      <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-mono">
                        {score}%
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border block mt-0.5 ${
                      score >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      score >= 65 ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {readiness}
                    </span>
                  </div>

                  <button
                    onClick={() => onViewSessionDetail(session)}
                    className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Scorecard</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
