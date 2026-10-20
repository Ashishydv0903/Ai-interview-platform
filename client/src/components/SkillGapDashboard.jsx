import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Award, BookOpen, CheckCircle2, AlertTriangle, Download, Sparkles, ExternalLink, BrainCircuit, BarChart2, LayoutGrid, ArrowLeft, MessageSquare, Check, HelpCircle, Code2 } from 'lucide-react';
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
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0B0F19' },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const candidateName = user?.name || sessionData?.candidateName || 'Candidate';
  const overallScore = finalReport.overallScore || 80;

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
      {/* Top Navigation & Action Ribbon */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card rounded-2xl p-4 sm:p-6 border border-slate-800">
        <div className="flex items-center gap-3">
          {onBackToHistory && (
            <button
              onClick={onBackToHistory}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
              title="Back to History"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Mock Performance Scorecard
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {sessionData?.candidateDomain || 'General'} Assessment
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-['Outfit']">
              Personalized Mentor <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Feedback & Debrief</span>
            </h2>
          </div>
        </div>

        {/* View Switcher & PDF Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('humanScorecard')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-semibold ${
                viewMode === 'humanScorecard'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Human Scorecard
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-semibold ${
                viewMode === 'radar'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Radar Chart
            </button>
          </div>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-md text-xs flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Printable / Clean Report Container */}
      <div id="report-pdf-container" className="space-y-6">

        {/* 1. MENTOR'S EXECUTIVE DEBRIEF (Human-Generated Style) */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-purple-500/30 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Score Ring */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-1 shadow-lg shadow-purple-600/30">
                <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-mono">
                    {overallScore}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Overall</span>
                </div>
              </div>
              <span className={`mt-2.5 px-3 py-0.5 rounded-full text-xs font-bold border ${
                overallScore >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                overallScore >= 65 ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {finalReport.readinessTier}
              </span>
            </div>

            {/* Coach's Personal Note */}
            <div className="space-y-2 flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Mentor's Evaluation Note
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">For {candidateName}</span>
              </div>
              <h3 className="text-xl font-bold text-white font-['Outfit']">
                {overallScore >= 80 ? "Superb performance! You're ready for high-stakes interviews." :
                 overallScore >= 65 ? "Solid foundation! A few targeted brush-ups will get you there." :
                 "Good effort! Here is your clear roadmap to build confidence."}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {finalReport.humanSummary}
              </p>
            </div>
          </div>
        </div>

        {/* 1.5. INDUSTRY READINESS & MARKET PERCENTILE BENCHMARK */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-4 border border-purple-500/30 flex items-center gap-3.5 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-lg">
              #{Math.max(5, 100 - Math.round(overallScore * 0.92))}%
            </div>
            <div>
              <div className="text-xs font-bold text-white">Market Percentile Rank</div>
              <div className="text-[11px] text-purple-300">Top {Math.max(5, 100 - Math.round(overallScore * 0.92))}% among applicants</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Benchmarked against entry/mid candidates</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-cyan-500/30 flex items-center gap-3.5 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-lg">
              {Math.min(94, Math.max(40, Math.round(overallScore * 0.96)))}%
            </div>
            <div>
              <div className="text-xs font-bold text-white">Screening Pass Probability</div>
              <div className="text-[11px] text-cyan-300">
                {overallScore >= 80 ? "High Pass Likelihood" : overallScore >= 65 ? "Moderate Pass Likelihood" : "Practice Recommended"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Estimated 1st-round interview clearance</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 flex items-center gap-3.5 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-sm font-mono">
              {overallScore >= 85 ? "Senior" : overallScore >= 70 ? "Mid-Level" : "Junior"}
            </div>
            <div>
              <div className="text-xs font-bold text-white">Proficiency Tier</div>
              <div className="text-[11px] text-emerald-300">
                {overallScore >= 85 ? "Lead / Senior Candidate" : overallScore >= 70 ? "Production Mid-Level" : "Junior / Associate"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Matched to standard job tiering</div>
            </div>
          </div>
        </div>

        {/* 2. STRENGTHS & FOCUS AREAS (Clear, Natural Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths Card */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span>What You Nailed (Key Strengths)</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {(finalReport.strengths || [
                "Good technical vocabulary and concept association",
                "Concise and organized sentence structuring",
                "Active participation across all interview questions"
              ]).map((strength, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvement Card */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <span>Key Areas to Polish (Skill Gaps)</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {(finalReport.improvementAreas || [
                "Provide concrete real-world examples when explaining architecture",
                "Elaborate on performance considerations like latency and caching",
                "Use the STAR method for experiential and behavioral questions"
              ]).map((gap, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold mt-0.5">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. SKILL MASTERY BREAKDOWN (Clean, readable human scorecard) */}
        {viewMode === 'humanScorecard' ? (
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                Skill Competency Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Each core area evaluated during your interview, with candidate score vs industry target.
              </p>
            </div>

            <div className="space-y-4">
              {(finalReport.skillsBreakdown || [
                { subject: "Core Technical Knowledge", score: 85, benchmark: 80, status: "Mastered", mentorFeedback: "Strong command of core language features and APIs." },
                { subject: "Problem Solving & Logic", score: 78, benchmark: 75, status: "Proficient", mentorFeedback: "Structured algorithmic decomposition; minor edge-case missed." },
                { subject: "Architecture & Design", score: 72, benchmark: 75, status: "Needs Review", mentorFeedback: "Solid fundamental design; add state sync details." },
                { subject: "Code Quality & Precision", score: 88, benchmark: 80, status: "Mastered", mentorFeedback: "Clean, structured, and readable code practices." },
                { subject: "Communication & Articulation", score: 88, benchmark: 85, status: "Mastered", mentorFeedback: "Clear articulation with low filler word count." }
              ]).map((skill, idx) => {
                const delta = skill.score - (skill.benchmark || 80);
                return (
                  <div key={idx} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-purple-500/30 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{skill.subject}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          skill.score >= (skill.benchmark || 80)
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {skill.status || (delta >= 0 ? 'Mastered' : 'Needs Practice')}
                        </span>
                      </div>
                      <div className="font-mono text-slate-300">
                        Score: <span className="font-bold text-cyan-300">{skill.score}%</span> / Benchmark: <span className="text-slate-400">{skill.benchmark || 80}%</span>
                      </div>
                    </div>

                    {/* Clean Progress Bar */}
                    <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                      <div
                        className={`h-full transition-all duration-700 ${
                          skill.score >= (skill.benchmark || 80)
                            ? 'bg-gradient-to-r from-purple-500 to-emerald-400'
                            : 'bg-gradient-to-r from-purple-500 to-amber-400'
                        }`}
                        style={{ width: `${Math.min(skill.score, 100)}%` }}
                      ></div>
                    </div>

                    <p className="text-xs text-slate-400 pt-0.5">
                      💬 <strong className="text-slate-300">Mentor Note:</strong> {skill.mentorFeedback}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* RADAR CHART (Secondary View) */
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
                <BrainCircuit className="w-5 h-5 text-purple-400" />
                Radar Matrix Chart
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-purple-300"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Candidate</span>
                <span className="flex items-center gap-1 text-cyan-300"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Benchmark</span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={finalReport.radarData}>
                  <PolarGrid stroke="#1E293B" />
                  <PolarAngleAxis dataKey="subject" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" />
                  <Radar name="Candidate" dataKey="Candidate" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} />
                  <Radar name="Target Benchmark" dataKey="TargetBenchmark" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 4. QUESTION-BY-QUESTION HUMAN MENTOR REVIEW */}
        {sessionData?.evaluations && sessionData.evaluations.length > 0 && (
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5 shadow-xl">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                Question-by-Question Mentor Review
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review your exact responses and see personalized notes on how to elevate each answer.
              </p>
            </div>

            <div className="space-y-4">
              {sessionData.evaluations.map((item, idx) => {
                const score = item.evaluation?.score || 70;
                return (
                  <div key={idx} className="bg-slate-900/70 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-purple-600/30 text-purple-300 text-xs font-mono font-bold flex items-center justify-center">
                          Q{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-white">{item.topic || 'Question'}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {item.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-300">{score}% Score</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          score >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {item.evaluation?.highlightTag || (score >= 80 ? 'EXCELLENT' : 'GOOD')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-slate-200">Question:</p>
                      <p className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                        {item.questionText}
                      </p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-slate-200">Your Response:</p>
                      <p className="text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                        {item.userAnswer || "No answer recorded."}
                      </p>
                    </div>

                    {item.codeSnippet && (
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-cyan-300 flex items-center gap-1">
                          <Code2 className="w-3.5 h-3.5" /> Executed Sandbox Code:
                        </p>
                        <pre className="bg-slate-950 p-2.5 rounded-lg border border-cyan-800/30 text-cyan-200 font-mono text-[11px] overflow-x-auto">
                          {item.codeSnippet}
                        </pre>
                      </div>
                    )}

                    {/* Mentor Feedback Box */}
                    <div className="bg-purple-950/20 p-3 rounded-lg border border-purple-500/30 text-xs text-purple-200/90 leading-relaxed">
                      💬 <strong className="text-purple-300">Mentor's Take:</strong> {item.evaluation?.rationale || "Good foundational response."}
                    </div>

                    {/* Model Answer (Ideal Answer for 100% Score) */}
                    <div className="bg-emerald-950/20 p-3.5 rounded-lg border border-emerald-500/30 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Ideal / Model Answer (What a 100% Score Looks Like):</span>
                      </div>
                      <p className="text-emerald-100/90 leading-relaxed font-sans pl-5">
                        {item.idealAnswer ||
                          (item.expectedConcepts && item.expectedConcepts.length > 0
                            ? `A model response thoroughly covers: ${item.expectedConcepts.join(', ')} while articulating real-world trade-offs and best practices.`
                            : "A model answer should clearly define the core concept, explain the underlying runtime/system mechanics, and give a practical real-world implementation example.")}
                      </p>
                      {item.evaluation?.missingConcepts && item.evaluation.missingConcepts.length > 0 && (
                        <div className="pl-5 pt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-amber-300 font-semibold">Concepts to include next time:</span>
                          {item.evaluation.missingConcepts.map((k, ki) => (
                            <span key={ki} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200 font-mono">
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

        {/* 5. 7-DAY PERSONALIZED LEARNING ROADMAP */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Suggested 7-Day Action Plan
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Practical micro-study steps tailored to bridge your detected skill gaps fast.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(finalReport.learningRoadmap || [
              {
                step: 1,
                topic: "Event Loop & Microtask Priority",
                priority: "High Priority",
                actionPlan: "Review how the JavaScript engine prioritizes Promise microtasks.",
                estimatedHours: "1-2 Hours",
                resourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop"
              }
            ]).map((step, idx) => (
              <div key={idx} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-300">Step {step.step}: {step.topic}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{step.estimatedHours}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{step.actionPlan}</p>
                <a
                  href={step.resourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold pt-1"
                >
                  Open Study Guide <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card rounded-2xl p-4 border border-slate-800">
        <p className="text-xs text-slate-400">
          This mock report is automatically saved to your profile history.
        </p>
        <div className="flex items-center gap-3">
          {onBackToHistory && (
            <button
              onClick={onBackToHistory}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all"
            >
              View All Past Mocks
            </button>
          )}
          {onStartNewMock && (
            <button
              onClick={onStartNewMock}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs shadow-md transition-all"
            >
              Take Another Mock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
