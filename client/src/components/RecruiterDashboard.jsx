import React, { useState, useEffect } from 'react';
import { Briefcase, Search, Filter, Award, ChevronRight, Eye, CheckCircle2, AlertTriangle, FileText, UserCheck, ShieldAlert, Lock, UserPlus } from 'lucide-react';
import { apiUrl } from '../config/api';

export default function RecruiterDashboard({ onViewSessionDetail, user, onSwitchToRecruiter }) {
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const isRecruiter = user?.role === 'recruiter';

  useEffect(() => {
    if (isRecruiter) {
      fetchSessions();
    }
  }, [isRecruiter]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/interviews'));
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = sessions.filter(s => {
    const nameMatch = (s.candidateName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = filterRole === "ALL" || (s.targetRole || "").includes(filterRole);
    return nameMatch && roleMatch;
  });

  // PERMISSION GUARD FOR CANDIDATES
  if (!isRecruiter) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="glass-card rounded-2xl p-8 border border-amber-500/30 shadow-2xl space-y-5 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              ACCESS RESTRICTED
            </span>
            <h3 className="text-2xl font-extrabold text-white mt-2 font-['Outfit']">
              Recruiter Authorization Required
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Your account is currently registered as a <strong className="text-purple-300">Candidate ({user?.role || 'Guest'})</strong>. The Recruiter Hiring Portal contains candidate comparison matrices and hiring metrics restricted to verified Hiring Managers.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-left text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <ShieldAlert className="w-4 h-4" /> Why is this protected?
            </div>
            <p className="text-slate-400 text-[11px]">
              Candidates must complete their assessments independently. Recruiter views allow hiring teams to compare multi-candidate scores, examine XAI justifications, and export official hiring decisions.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onSwitchToRecruiter && onSwitchToRecruiter()}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Briefcase className="w-4 h-4" />
              Switch to Recruiter Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card rounded-2xl p-6 border border-slate-800">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Authenticated Recruiter & Hiring Portal
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-1 font-['Outfit']">
            Candidate <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Hiring Decision Matrix</span>
          </h2>
          <p className="text-xs text-slate-400">Review adaptive interview scores, skill gap deltas, and XAI evaluations across candidates.</p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-48"
            />
          </div>

          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Roles</option>
            <option value="Frontend">Frontend Engineer</option>
            <option value="Backend">Backend Engineer</option>
            <option value="Full Stack">Full Stack Engineer</option>
            <option value="Data">Data Scientist / AI</option>
            <option value="Aptitude">Aptitude & Reasoning</option>
          </select>
        </div>
      </div>

      {/* Candidate Decision Matrix Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Target Role</th>
                <th className="py-3.5 px-4">Competency Score</th>
                <th className="py-3.5 px-4">Readiness Status</th>
                <th className="py-3.5 px-4">Skill Gaps</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading candidate records...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No candidate sessions found. Complete an assessment first!</td>
                </tr>
              ) : (
                filtered.map((session, idx) => {
                  const score = session.finalReport?.overallScore || 75;
                  const readiness = session.finalReport?.readinessTier || "Job Ready";
                  const gapsCount = session.finalReport?.missingConcepts?.length || 2;

                  return (
                    <tr key={session.id || idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 font-mono flex items-center justify-center text-xs">
                          {session.candidateName?.charAt(0) || 'C'}
                        </div>
                        {session.candidateName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{session.targetRole}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-cyan-300 text-sm">{score}%</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          score >= 75 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {readiness}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {gapsCount} detected
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onViewSessionDetail && onViewSessionDetail(session)}
                          className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> View XAI Report
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
