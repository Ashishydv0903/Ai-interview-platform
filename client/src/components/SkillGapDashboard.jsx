import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Award, BookOpen, CheckCircle2, AlertTriangle, Download, Sparkles, ExternalLink, BrainCircuit, BarChart2, LayoutGrid, ArrowLeft, MessageSquare, Check, HelpCircle, Code2, TrendingUp, TrendingDown, Layers, History, Compass, ArrowUpRight, Minus, ShieldCheck, ShieldAlert, Camera, Eye, Cpu, UserCheck, UserX, AlertCircle, LogOut, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import html2pdf from 'html2pdf.js';

export default function SkillGapDashboard({ sessionData, user, onBackToHistory, onStartNewMock }) {
  const [viewMode, setViewMode] = useState('humanScorecard'); // 'humanScorecard' or 'radar'

  const finalReport = sessionData?.finalReport || {
    overallScore: 82,
    readinessTier: "Interview Ready",
    humanSummary: "Great performance overall! You demonstrated solid understanding of foundational concepts and communicated your answers with clarity. With minor refinement in system design trade-offs, you will be in a top-tier position for real interviews.",
    strengths: [
      "Clear articulation of core principles and terminology",
      "Structured problem-solving breakdown with minimal hesitations",
      "Good awareness of practical coding idioms and error handling"
    ],
    improvementAreas: [
      "Mention architectural scalability trade-offs (e.g. caching, latency)",
      "Provide more concrete real-world examples when explaining complex concepts",
      "Brush up on event loop microtask sequencing and asynchronous edge cases"
    ],
    skillsBreakdown: [
      {
        subject: "Core Technical Knowledge",
        score: 85,
        benchmark: 80,
        status: "Mastered",
        mentorFeedback: "Strong command of core language features, built-in APIs, and standard conventions."
      },
      {
        subject: "Problem Solving & Logic",
        score: 78,
        benchmark: 75,
        status: "Proficient",
        mentorFeedback: "Solid approach to problem decomposition; practice handling edge cases upfront."
      },
      {
        subject: "Architecture & Design",
        score: 72,
        benchmark: 75,
        status: "Needs Review",
        mentorFeedback: "Good baseline design; expand on state management and caching strategies."
      },
      {
        subject: "Code Quality & Precision",
        score: 88,
        benchmark: 80,
        status: "Mastered",
        mentorFeedback: "Structured, clean, and follows idiomatic patterns with good naming."
      },
      {
        subject: "Communication & Articulation",
        score: 88,
        benchmark: 85,
        status: "Mastered",
        mentorFeedback: "Concise responses with structured flow and clear technical delivery."
      }
    ],
    radarData: [
      { subject: "Core Knowledge", Candidate: 85, TargetBenchmark: 80 },
      { subject: "Problem Solving", Candidate: 78, TargetBenchmark: 75 },
      { subject: "Architecture", Candidate: 72, TargetBenchmark: 75 },
      { subject: "Code Precision", Candidate: 88, TargetBenchmark: 80 },
      { subject: "Communication", Candidate: 88, TargetBenchmark: 85 }
    ],
    missingConcepts: ["Microtask Queue", "Distributed Caching"],
    learningRoadmap: [
      {
        step: 1,
        topic: "Event Loop & Microtask Queue Priority",
        priority: "High Priority",
        actionPlan: "Review how the JavaScript engine prioritizes Promise microtasks vs macrotasks.",
        estimatedHours: "1-2 Hours",
        resourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop"
      },
      {
        step: 2,
        topic: "System Caching & Invalidation Patterns",
        priority: "Recommended",
        actionPlan: "Learn Write-Through vs Write-Back caching strategies with Redis.",
        estimatedHours: "2 Hours",
        resourceUrl: "https://en.wikipedia.org/wiki/Cache_(computing)"
      }
    ]
  };

  const handleExportPDF = () => {
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });

    const element = document.getElementById('report-pdf-container');
    if (!element) return;

    const opt = {
      margin:       [0.4, 0.4, 0.4, 0.4],
      filename:     `Scorecard_${sessionData?.candidateName || user?.name || 'Candidate'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0B2641' },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const [pastSessions, setPastSessions] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoadingPast(true);
        const userId = user?.id || sessionData?.userId;
        const url = userId ? `/api/interviews?userId=${userId}` : '/api/interviews';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const currentId = sessionData?.id || sessionData?.sessionId;
          const others = data.data.filter(s => (s.id || s.sessionId) !== currentId && s.status === 'COMPLETED');
          setPastSessions(others);
        }
      } catch (err) {
        console.error("Failed to fetch past session comparisons:", err);
      } finally {
        setLoadingPast(false);
      }
    };
    fetchHistory();
  }, [sessionData, user]);

  const candidateName = user?.name || sessionData?.candidateName || 'Candidate';
  const overallScore = finalReport.overallScore ?? 80;
  const isEarlyExit = !!(sessionData?.isEarlyExit || sessionData?.finalReport?.isEarlyExit);

  const proctoring = sessionData?.proctoringSummary || sessionData?.finalReport?.proctoringSummary || {
    trustScore: 98,
    status: 'VERIFIED',
    facePresence: 98,
    focusRetention: 96,
    tabSwitches: 0,
    cameraStatus: 'ONLINE',
    micStatus: 'ONLINE',
    gazeStability: 98,
    multipleFacesCount: 0,
    deductions: [],
    flags: []
  };

  const currentDomain = sessionData?.candidateDomain || 'General';
  const sameDomainPast = pastSessions.filter(s => (s.candidateDomain || '').toLowerCase() === currentDomain.toLowerCase());
  const prevSameSession = sameDomainPast[0] || null;
  const prevSameScore = prevSameSession?.finalReport?.overallScore ?? null;
  const scoreDelta = prevSameScore !== null ? (overallScore - prevSameScore) : null;

  // Cross-domain past sessions grouped
  const crossDomainMap = {};
  pastSessions.forEach(s => {
    const d = s.candidateDomain || 'General';
    if (!crossDomainMap[d]) {
      crossDomainMap[d] = {
        domain: d,
        role: s.targetRole || d,
        score: s.finalReport?.overallScore || 0,
        date: s.completedAt || s.createdAt,
        totalMocks: 1
      };
    } else {
      crossDomainMap[d].totalMocks += 1;
    }
  });
  const crossDomainList = Object.values(crossDomainMap);

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
      {/* Top Navigation & Action Ribbon */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card rounded-2xl p-4 sm:p-6 border border-[#1C476E]">
        <div className="flex items-center gap-3">
          {onBackToHistory && (
            <button
              onClick={onBackToHistory}
              className="p-2 rounded-xl bg-[#0B2641] border border-[#1C476E] text-slate-300 hover:text-white transition-all"
              title="Back to History"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#5CDB94]/20 text-[#5CDB94] border border-[#5CDB94]/30">
                Mock Performance Scorecard
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {sessionData?.candidateDomain || 'General'} Assessment
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-['Outfit']">
              Personalized Mentor <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5CDB94] to-[#38BDF8]">Feedback & Debrief</span>
            </h2>
          </div>
        </div>

        {/* View Switcher & PDF Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#071B2E] p-1 rounded-xl border border-[#1C476E] text-xs">
            <button
              onClick={() => setViewMode('humanScorecard')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-bold ${
                viewMode === 'humanScorecard'
                  ? 'bg-[#5CDB94] text-[#0B2540] shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Human Scorecard
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-bold ${
                viewMode === 'radar'
                  ? 'bg-[#5CDB94] text-[#0B2540] shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Radar Chart
            </button>
          </div>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-[#5CDB94] hover:bg-[#4CD087] text-[#0B2540] font-extrabold rounded-xl shadow-md text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#0B2540]" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Printable / Clean Report Container */}
      <div id="report-pdf-container" className="space-y-6">

        {/* Early Exit Notice Banner */}
        {isEarlyExit && (
          <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-['Outfit']">Interview Concluded Early by Candidate</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  You voluntarily ended this session early. Responses submitted so far and complete proctoring integrity logs have been archived into this partial scorecard.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
              PARTIAL SCORECARD
            </span>
          </div>
        )}

        {/* 1. MENTOR'S EXECUTIVE DEBRIEF (Human-Generated Style) */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-[#1C476E] relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5CDB94]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Score Ring */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#5CDB94] to-[#38BDF8] p-1 shadow-lg shadow-[#5CDB94]/25">
                <div className="w-full h-full bg-[#071B2E] rounded-[14px] flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-[#5CDB94] font-mono">
                    {overallScore}%
                  </span>
                  <span className="text-[10px] text-slate-300 uppercase font-semibold">Overall</span>
                </div>
              </div>
              <span className={`mt-2.5 px-3 py-0.5 rounded-full text-xs font-bold border ${
                overallScore >= 80 ? 'bg-[#5CDB94]/20 text-[#5CDB94] border-[#5CDB94]/40' :
                overallScore >= 65 ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40' :
                'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {finalReport.readinessTier}
              </span>
            </div>

            {/* Coach's Personal Note */}
            <div className="space-y-2 flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-bold text-[#5CDB94] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#5CDB94]" /> Mentor's Evaluation Note
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-300 font-semibold">For {candidateName}</span>
              </div>
              <h3 className="text-xl font-bold text-white font-['Outfit']">
                {overallScore >= 80 ? "Superb performance! You're ready for high-stakes interviews." :
                 overallScore >= 65 ? "Solid foundation! A few targeted brush-ups will get you there." :
                 "Good effort! Here is your clear roadmap to build confidence."}
              </h3>
              <p className="text-slate-200 text-sm leading-relaxed">
                {finalReport.humanSummary}
              </p>
            </div>
          </div>
        </div>

        {/* 1.5. KEY PERFORMANCE METRICS (Clean, Simple, Plain Language) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-4 border border-[#1C476E] flex items-center gap-3.5 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-[#5CDB94]/20 text-[#5CDB94] border border-[#5CDB94]/30 flex items-center justify-center font-bold text-lg font-mono">
              {overallScore}%
            </div>
            <div>
              <div className="text-xs font-bold text-white">Overall Performance</div>
              <div className="text-[11px] text-[#5CDB94] font-semibold">
                {overallScore >= 80 ? "Top-Tier Response Quality" : overallScore >= 65 ? "Solid Baseline Knowledge" : "Good Practice Attempt"}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">Scored on clarity, depth, and accuracy</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-[#1C476E] flex items-center gap-3.5 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center font-bold text-lg font-mono">
              {Math.min(95, Math.max(40, Math.round(overallScore * 0.96)))}%
            </div>
            <div>
              <div className="text-xs font-bold text-white">Interview Pass Chance</div>
              <div className="text-[11px] text-[#38BDF8] font-semibold">
                {overallScore >= 80 ? "High Likelihood to Pass" : overallScore >= 65 ? "Moderate Chance (Quick Review)" : "Practice Recommended"}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">Estimated clearance for technical rounds</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-[#1C476E] flex items-center gap-3.5 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-[#5CDB94]/20 text-[#5CDB94] border border-[#5CDB94]/30 flex items-center justify-center font-bold text-sm font-mono">
              {overallScore >= 85 ? "Senior" : overallScore >= 70 ? "Mid-Level" : "Junior"}
            </div>
            <div>
              <div className="text-xs font-bold text-white">Target Job Level</div>
              <div className="text-[11px] text-[#5CDB94] font-semibold">
                {overallScore >= 85 ? "Senior / Lead Level" : overallScore >= 70 ? "Standard Mid-Level" : "Junior / Associate"}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">Matches typical market role expectations</div>
            </div>
          </div>
        </div>

        {/* 2. STRENGTHS & QUICK TIPS (Clear, Natural Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths Card */}
          <div className="bg-[#5CDB94]/10 border border-[#5CDB94]/30 rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-[#5CDB94] font-bold text-sm">
              <div className="w-7 h-7 rounded-lg bg-[#5CDB94]/20 border border-[#5CDB94]/30 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-[#5CDB94]" />
              </div>
              <span>What You Did Well</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-200">
              {(finalReport.strengths || [
                "Clear explanations with good terminology and flow",
                "Structured approach to answering each question directly",
                "Demonstrated good practical understanding of core concepts"
              ]).map((strength, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#5CDB94] font-bold mt-0.5">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvement Card */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
              </div>
              <span>Quick Tips to Score Higher</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-200">
              {(finalReport.improvementAreas || [
                "Give a practical code or architecture example when explaining ideas",
                "Briefly touch on performance trade-offs like speed and memory",
                "Structure situational answers with what you did and the end result"
              ]).map((gap, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-300 font-bold mt-0.5">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. SKILL MASTERY BREAKDOWN (Clean, readable human scorecard) */}
        {viewMode === 'humanScorecard' ? (
          <div className="glass-card rounded-2xl p-6 border border-[#1C476E] space-y-4 shadow-xl">
            <div className="pb-3 border-b border-[#1C476E]">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
                <BarChart2 className="w-4 h-4 text-[#5CDB94]" />
                Skills Evaluated
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Here is how you scored across each area compared to typical interview targets.
              </p>
            </div>

            <div className="space-y-4">
              {(finalReport.skillsBreakdown || [
                { subject: "Core Technical Knowledge", score: 85, benchmark: 80, status: "Mastered", mentorFeedback: "Strong command of core language features and APIs." },
                { subject: "Problem Solving & Logic", score: 78, benchmark: 75, status: "Proficient", mentorFeedback: "Structured breakdown of the problem; handled edge cases well." },
                { subject: "Architecture & Design", score: 72, benchmark: 75, status: "Needs Review", mentorFeedback: "Good baseline design; practice discussing state and caching." },
                { subject: "Code Quality & Precision", score: 88, benchmark: 80, status: "Mastered", mentorFeedback: "Clean, structured, and readable code practices." },
                { subject: "Communication & Articulation", score: 88, benchmark: 85, status: "Mastered", mentorFeedback: "Clear, steady speech with minimal filler words." }
              ]).map((skill, idx) => {
                const delta = skill.score - (skill.benchmark || 80);
                return (
                  <div key={idx} className="bg-[#071B2E] p-4 rounded-xl border border-[#1C476E] space-y-2 hover:border-[#5CDB94]/40 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{skill.subject}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          skill.score >= (skill.benchmark || 80)
                            ? 'bg-[#5CDB94]/20 text-[#5CDB94] border-[#5CDB94]/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {skill.status || (delta >= 0 ? 'Great Job' : 'Needs Practice')}
                        </span>
                      </div>
                      <div className="font-mono text-slate-300">
                        Score: <span className="font-bold text-[#5CDB94]">{skill.score}%</span> / Target: <span className="text-slate-400">{skill.benchmark || 80}%</span>
                      </div>
                    </div>

                    {/* Clean Progress Bar */}
                    <div className="h-2.5 w-full bg-[#0B2641] rounded-full overflow-hidden border border-[#1C476E] relative">
                      <div
                        className={`h-full transition-all duration-700 ${
                          skill.score >= (skill.benchmark || 80)
                            ? 'bg-gradient-to-r from-[#5CDB94] to-[#38BDF8]'
                            : 'bg-gradient-to-r from-amber-500 to-[#5CDB94]'
                        }`}
                        style={{ width: `${Math.min(skill.score, 100)}%` }}
                      ></div>
                    </div>

                    <p className="text-xs text-slate-200 pt-0.5">
                      💬 <strong className="text-white">Mentor Note:</strong> {skill.mentorFeedback}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* RADAR CHART (Secondary View) */
          <div className="glass-card rounded-2xl p-6 border border-[#1C476E] space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C476E]">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
                <BrainCircuit className="w-5 h-5 text-[#5CDB94]" />
                Radar Matrix Chart
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-[#5CDB94] font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-[#5CDB94]"></span> Candidate</span>
                <span className="flex items-center gap-1 text-[#38BDF8] font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]"></span> Target Benchmark</span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={finalReport.radarData}>
                  <PolarGrid stroke="#1C476E" />
                  <PolarAngleAxis dataKey="subject" stroke="#94A3B8" tick={{ fill: '#CBD5E1', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#1C476E" />
                  <Radar name="Candidate" dataKey="Candidate" stroke="#5CDB94" fill="#5CDB94" fillOpacity={0.4} />
                  <Radar name="Target Benchmark" dataKey="TargetBenchmark" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 3.4. INTERVIEW PRESENCE & INTEGRITY DASHBOARD */}
        <div className="glass-card rounded-2xl p-6 border border-[#1C476E] space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1C476E]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
                <ShieldCheck className="w-5 h-5 text-[#5CDB94]" />
                Interview Presence & Integrity Dashboard
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time tracking of face presence, tab focus retention, window switches, and hardware availability.
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 whitespace-nowrap ${
              (proctoring.trustScore || 100) >= 85
                ? 'bg-[#5CDB94]/20 text-[#5CDB94] border-[#5CDB94]/40'
                : (proctoring.trustScore || 100) >= 70
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}>
              <span className="w-2 h-2 rounded-full bg-[#5CDB94] animate-ping"></span>
              SESSION: {proctoring.status || 'VERIFIED'} ({proctoring.trustScore || 98}% TRUST)
            </div>
          </div>

          {/* 5 Real-Time Integrity Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            {/* Integrity Trust Score */}
            <div className="bg-[#071B2E] p-3 rounded-xl border border-[#1C476E]">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#5CDB94]" />
                <span className="truncate">Trust Score</span>
              </div>
              <div className="text-xl font-black text-[#5CDB94] font-mono mt-0.5">{proctoring.trustScore || 98}%</div>
              <div className="text-[10px] text-slate-300 mt-0.5">Overall assessment integrity</div>
            </div>

            {/* Face Presence % */}
            <div className="bg-[#071B2E] p-3 rounded-xl border border-[#1C476E]">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <UserCheck className="w-3.5 h-3.5 text-[#5CDB94]" />
                <span className="truncate">Face Presence</span>
              </div>
              <div className="text-xl font-black text-[#5CDB94] font-mono mt-0.5">{proctoring.facePresence ?? 98}%</div>
              <div className="text-[10px] text-slate-300 mt-0.5">Time candidate in frame</div>
            </div>

            {/* Focus Retention % */}
            <div className="bg-[#071B2E] p-3 rounded-xl border border-[#1C476E]">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="truncate">Focus Retention</span>
              </div>
              <div className="text-xl font-black text-[#38BDF8] font-mono mt-0.5">{proctoring.focusRetention ?? 96}%</div>
              <div className="text-[10px] text-slate-300 mt-0.5">Active tab time</div>
            </div>

            {/* Tab Switch Count */}
            <div className="bg-[#071B2E] p-3 rounded-xl border border-[#1C476E]">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate">Tab Switches</span>
              </div>
              <div className="text-xl font-black text-white font-mono mt-0.5">{proctoring.tabSwitches || 0}</div>
              <div className="text-[10px] text-slate-300 mt-0.5">Focus loss infractions</div>
            </div>

            {/* Hardware Status */}
            <div className="bg-[#071B2E] p-3 rounded-xl border border-[#1C476E] col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Camera className="w-3.5 h-3.5 text-[#5CDB94]" />
                <span className="truncate">Devices</span>
              </div>
              <div className="text-[11px] font-bold text-slate-200 mt-1 space-y-0.5 leading-tight font-mono">
                <div className={proctoring.cameraStatus !== 'DISCONNECTED' ? 'text-[#5CDB94]' : 'text-rose-400'}>
                  Cam: {proctoring.cameraStatus || 'Online'}
                </div>
                <div className={proctoring.micStatus !== 'MUTED' ? 'text-[#5CDB94]' : 'text-rose-400'}>
                  Mic: {proctoring.micStatus || 'Active'}
                </div>
              </div>
            </div>
          </div>

          {/* Transparent Trust Score Deductions Explanation */}
          <div className="bg-[#071B2E] p-4 rounded-xl border border-[#1C476E] space-y-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Trust Score Breakdown & Recalculation
            </span>
            {proctoring.deductions && proctoring.deductions.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {proctoring.deductions.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#0B2641] border border-[#1C476E] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">[{d.timestamp}]</span>
                      <span className="text-slate-200">{d.reason}</span>
                    </div>
                    <span className="text-rose-400 font-bold font-mono text-xs shrink-0 ml-3">
                      -{d.penalty}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#5CDB94] p-2 bg-[#0B2641] rounded-lg border border-[#1C476E]">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#5CDB94]" />
                <span>100% Trust: Clean assessment session with zero penalties or suspicious focus losses.</span>
              </div>
            )}
          </div>

          {/* Full Chronological Audit Trail */}
          <div className="bg-[#071B2E]/70 p-4 rounded-xl border border-[#1C476E] text-xs space-y-2 font-mono">
            <div className="flex items-center justify-between pb-1 border-b border-[#1C476E]/50">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Full Chronological Proctoring Audit Trail ({proctoring.flags?.length || 0} Events)
              </span>
              <span className="text-[10px] text-slate-400">Logged in real-time</span>
            </div>

            {proctoring.flags && proctoring.flags.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {proctoring.flags.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-1.5 rounded bg-[#0B2641]/60 text-[11px] text-slate-200 border border-[#1C476E]/40">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-400 text-[10px]">[{f.timestamp}]</span>
                      <span className={f.severity === 'CRITICAL' ? 'text-rose-300' : f.severity === 'WARNING' ? 'text-amber-200' : 'text-slate-200'}>
                        {f.message}
                      </span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-2 ${
                      f.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : f.severity === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-[#0B2641] text-[#5CDB94] border border-[#1C476E]'
                    }`}>
                      {f.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-[#5CDB94] py-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>100% compliant session: No unauthorized tab switches, face absences, or background anomalies detected.</span>
              </div>
            )}
          </div>
        </div>

        {/* 3.5. HISTORICAL & CROSS-DOMAIN PERFORMANCE COMPARISON */}
        <div className="glass-card rounded-2xl p-6 border border-[#1C476E] space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#1C476E]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
                <History className="w-4 h-4 text-[#38BDF8]" />
                Your Progress & Past Mocks
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Track how this mock compares to your earlier attempts in <strong className="text-white">{currentDomain}</strong> and other practiced domains.
              </p>
            </div>
            {prevSameSession && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                scoreDelta >= 0
                  ? 'bg-[#5CDB94]/20 text-[#5CDB94] border-[#5CDB94]/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {scoreDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-[#5CDB94]" /> : <TrendingDown className="w-3.5 h-3.5 text-amber-300" />}
                {scoreDelta >= 0 ? `+${scoreDelta}%` : `${scoreDelta}%`} vs Previous {currentDomain} Mock
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Same Domain Trajectory Card */}
            <div className="bg-[#071B2E] p-5 rounded-xl border border-[#1C476E] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5CDB94] uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#5CDB94]" /> Progress in {currentDomain}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {sameDomainPast.length} past session{sameDomainPast.length === 1 ? '' : 's'}
                </span>
              </div>

              {prevSameSession ? (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-[#0B2641] p-3 rounded-xl border border-[#1C476E]">
                      <div className="text-[11px] text-slate-300">Previous Attempt</div>
                      <div className="text-xl font-extrabold text-slate-200 font-mono mt-0.5">
                        {prevSameScore}%
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {new Date(prevSameSession.completedAt || prevSameSession.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="bg-[#5CDB94]/10 p-3 rounded-xl border border-[#5CDB94]/30">
                      <div className="text-[11px] text-[#5CDB94] font-semibold">Current Mock</div>
                      <div className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#5CDB94] to-[#38BDF8] font-mono mt-0.5">
                        {overallScore}%
                      </div>
                      <div className="text-[10px] text-[#38BDF8] font-semibold mt-0.5">
                        {scoreDelta >= 0 ? `+${scoreDelta}% Growth` : `${scoreDelta}% Retest`}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed bg-[#0B2641] p-3 rounded-xl border border-[#1C476E]">
                    💡 <strong>Mentor Trajectory Note:</strong>{" "}
                    {scoreDelta > 0
                      ? `Impressive upward momentum in ${currentDomain}! You improved by ${scoreDelta}% compared to your last mock. Your concept precision and response structuring showed noticeable refinement.`
                      : scoreDelta === 0
                      ? `Consistent baseline score in ${currentDomain}. Review the missed concepts highlighted below to break through to the 80%+ mastery threshold.`
                      : `Your score changed by ${scoreDelta}% from your previous ${currentDomain} mock. Review the simple practice guide below to reinforce foundational principles.`}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-[#0B2641] rounded-xl border border-[#1C476E] text-center space-y-1.5">
                  <div className="text-sm font-bold text-white">First Mock in {currentDomain}!</div>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    This interview sets your starting baseline ({overallScore}%). Complete more mocks in this domain to track your score growth over time.
                  </p>
                </div>
              )}
            </div>

            {/* Cross-Domain Matrix Card */}
            <div className="bg-[#071B2E] p-5 rounded-xl border border-[#1C476E] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#38BDF8]" /> Other Topics Practiced
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Multi-Domain History</span>
              </div>

              {crossDomainList.length > 0 ? (
                <div className="space-y-2.5 pt-1">
                  {crossDomainList.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-[#0B2641] rounded-xl border border-[#1C476E] text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
                        <div>
                          <span className="font-semibold text-white block">{item.domain}</span>
                          <span className="text-[10px] text-slate-400">{item.totalMocks} mock session{item.totalMocks === 1 ? '' : 's'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold text-sm ${
                          item.score >= 80 ? 'text-[#5CDB94]' : item.score >= 60 ? 'text-[#38BDF8]' : 'text-amber-400'
                        }`}>
                          {item.score}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}

                  <p className="text-xs text-slate-200 leading-relaxed bg-[#0B2641] p-2.5 rounded-xl border border-[#1C476E]">
                    🎯 <strong>Multi-Topic Insight:</strong>{" "}
                    Practicing across different fields (e.g. Aptitude along with technical engineering) shows a versatile, well-rounded skill set to recruiters.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-[#0B2641] rounded-xl border border-[#1C476E] text-center space-y-1.5">
                  <div className="text-sm font-bold text-white">Expand Your Skill Profile</div>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    Try practicing an Aptitude, Reasoning, or Communication mock next to see your cross-topic profile grow.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. QUESTION-BY-QUESTION HUMAN MENTOR REVIEW */}
        {sessionData?.evaluations && sessionData.evaluations.length > 0 && (
          <div className="glass-card rounded-2xl p-6 border border-[#1C476E] space-y-5 shadow-xl">
            <div className="pb-3 border-b border-[#1C476E]">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
                <MessageSquare className="w-4 h-4 text-[#5CDB94]" />
                Question-by-Question Review & Model Answers
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                See your recorded answer, mentor feedback, and what an ideal answer looks like.
              </p>
            </div>

            <div className="space-y-4">
              {sessionData.evaluations.map((item, idx) => {
                const score = item.evaluation?.score || 70;
                return (
                  <div key={idx} className="bg-[#071B2E] p-4 sm:p-5 rounded-xl border border-[#1C476E] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C476E]/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#5CDB94]/20 text-[#5CDB94] text-xs font-mono font-bold flex items-center justify-center border border-[#5CDB94]/30">
                          Q{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-white">{item.topic || 'Question'}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#0B2641] text-slate-300 font-mono border border-[#1C476E]">
                          {item.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#5CDB94]">{score}% Score</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          score >= 80 ? 'bg-[#5CDB94]/20 text-[#5CDB94] border border-[#5CDB94]/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {item.evaluation?.highlightTag || (score >= 80 ? 'EXCELLENT' : 'GOOD')}
                        </span>
                      </div>
                    </div>

                    {/* Question text */}
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-slate-200">Question Asked:</p>
                      <p className="text-slate-100 bg-[#0B2641] p-3 rounded-xl border border-[#1C476E] text-sm leading-relaxed">
                        {item.questionText}
                      </p>
                    </div>

                    {/* User Answer */}
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-slate-200">What You Answered:</p>
                      <div className="text-slate-100 bg-[#0B2641] p-3 rounded-xl border border-[#1C476E] text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {item.userAnswer ? (
                          item.userAnswer
                        ) : (
                          <span className="text-slate-400 italic">No verbal response recorded.</span>
                        )}
                      </div>
                    </div>

                    {item.codeSnippet && (
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-[#38BDF8] flex items-center gap-1">
                          <Code2 className="w-3.5 h-3.5" /> Executed Code:
                        </p>
                        <pre className="bg-[#051424] p-3 rounded-xl border border-[#1C476E] text-[#5CDB94] font-mono text-xs overflow-x-auto">
                          {item.codeSnippet}
                        </pre>
                      </div>
                    )}

                    {/* Mentor Feedback Box */}
                    <div className="bg-[#0B2641] p-3.5 rounded-xl border border-[#1C476E] text-xs text-slate-200 leading-relaxed">
                      💬 <strong className="text-white">Mentor Advice:</strong> {item.evaluation?.rationale || "Good foundational response."}
                    </div>

                    {/* Model Answer (Simple & Clear) */}
                    <div className="bg-[#5CDB94]/10 p-4 rounded-xl border border-[#5CDB94]/30 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-[#5CDB94] font-bold text-sm">
                        <CheckCircle2 className="w-4 h-4 text-[#5CDB94]" />
                        <span>✨ Simple Model Answer (How to get 100%):</span>
                      </div>
                      <p className="text-slate-100 leading-relaxed text-sm pl-5">
                        {item.idealAnswer ||
                          (item.expectedConcepts && item.expectedConcepts.length > 0
                            ? `A complete answer covers: ${item.expectedConcepts.join(', ')} while giving a practical real-world example.`
                            : "A model answer clearly defines the core concept, explains how it works internally, and mentions a quick practical example.")}
                      </p>
                      {item.evaluation?.missingConcepts && item.evaluation.missingConcepts.length > 0 && (
                        <div className="pl-5 pt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-amber-300 font-semibold">Helpful terms to mention next time:</span>
                          {item.evaluation.missingConcepts.map((k, ki) => (
                            <span key={ki} className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#071B2E] border border-[#1C476E] text-[#5CDB94] font-mono">
                              + {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. SIMPLE STEPS TO PRACTICE NEXT */}
        <div className="glass-card rounded-2xl p-6 border border-[#1C476E] space-y-4 shadow-xl">
          <div className="pb-3 border-b border-[#1C476E]">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
              <BookOpen className="w-4 h-4 text-[#38BDF8]" />
              Simple Steps to Practice Next
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Quick study topics based on this mock interview to help you prepare for real interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(finalReport.learningRoadmap || [
              {
                step: 1,
                topic: "Event Loop & Microtask Priority",
                priority: "High Priority",
                actionPlan: "Review how JavaScript prioritizes Promise microtasks vs macrotasks.",
                estimatedHours: "1-2 Hours",
                resourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop"
              }
            ]).map((step, idx) => (
              <div key={idx} className="bg-[#071B2E] p-4 rounded-xl border border-[#1C476E] space-y-2 hover:border-[#5CDB94]/40 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#38BDF8]">Step {step.step}: {step.topic}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#0B2641] text-slate-300 font-mono border border-[#1C476E]">{step.estimatedHours}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{step.actionPlan}</p>
                <a
                  href={step.resourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#5CDB94] hover:text-[#4CD087] font-bold pt-1"
                >
                  Open Study Guide <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card rounded-2xl p-4 border border-[#1C476E]">
        <p className="text-xs text-slate-300">
          This mock report is automatically saved to your profile history.
        </p>
        <div className="flex items-center gap-3">
          {onBackToHistory && (
            <button
              onClick={onBackToHistory}
              className="px-4 py-2 bg-[#071B2E] hover:bg-[#0B2641] border border-[#1C476E] text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              View All Past Mocks
            </button>
          )}
          {onStartNewMock && (
            <button
              onClick={onStartNewMock}
              className="px-4 py-2 bg-[#5CDB94] hover:bg-[#4CD087] text-[#0B2540] font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Take Another Mock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
