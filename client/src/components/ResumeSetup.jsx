import React, { useState, useEffect } from 'react';
import { FileUp, Play, Sparkles, CheckCircle2, Sliders, ArrowRight, BookOpen, Clock, Target, Save, Lock, Layers, LogIn, ShieldAlert } from 'lucide-react';
import { apiUrl } from '../config/api';

export default function ResumeSetup({ onInterviewStart, user, onRequireAuth }) {
  const [candidateName, setCandidateName] = useState(user?.name || "");
  const [targetRole, setTargetRole] = useState("Frontend Engineer");
  const [domain, setDomain] = useState("Frontend");
  const [customSubject, setCustomSubject] = useState("");
  const [totalQuestionsPlanned, setTotalQuestionsPlanned] = useState(5);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [parsedSkills, setParsedSkills] = useState(["React", "Node.js", "JavaScript", "REST APIs", "MongoDB"]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startingMode, setStartingMode] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [authErrorNotice, setAuthErrorNotice] = useState(false);

  // Auto-load and remember resume from profile
  useEffect(() => {
    if (user) {
      setCandidateName(user.name);
      if (user.savedResumeText) {
        setResumeText(user.savedResumeText);
        // Automatically parse skills from remembered profile resume
        fetch(apiUrl('/api/resume/parse'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText: user.savedResumeText, targetRole: user.targetRole || "Candidate" })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data?.skills?.length) {
              setParsedSkills(data.data.skills);
            }
          })
          .catch(() => {});
      }
      setAuthErrorNotice(false);
    } else {
      setCandidateName("");
    }
  }, [user]);

  const handleFileUpload = async (e) => {
    if (!user) {
      setAuthErrorNotice(true);
      if (onRequireAuth) onRequireAuth();
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', targetRole);

    try {
      const res = await fetch(apiUrl('/api/resume/upload'), {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        if (data.data.skills?.length) setParsedSkills(data.data.skills);
        if (data.data.inferredDomain) setDomain(data.data.inferredDomain);
        if (data.data.rawText) {
          setResumeText(data.data.rawText);
          // Automatically save and remember resume in user profile
          if (user?.id) {
            fetch(apiUrl('/api/auth/resume'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adaptiveai_token') || ''}`
              },
              body: JSON.stringify({ userId: user.id, resumeText: data.data.rawText })
            }).then(() => setSaveSuccess(true)).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error("PDF upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleParseResumeText = async () => {
    setIsParsing(true);
    try {
      const res = await fetch(apiUrl('/api/resume/parse'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, targetRole })
      });
      const data = await res.json();
      if (data.success) {
        if (data.data.skills?.length) setParsedSkills(data.data.skills);
        if (data.data.inferredDomain) setDomain(data.data.inferredDomain);
        // Also auto-save to user profile
        if (user?.id && resumeText) {
          fetch(apiUrl('/api/auth/resume'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('adaptiveai_token') || ''}`
            },
            body: JSON.stringify({ userId: user.id, resumeText })
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error("Parse resume error:", err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveResumeToProfile = async () => {
    if (!user) {
      setAuthErrorNotice(true);
      if (onRequireAuth) onRequireAuth();
      return;
    }
    try {
      const res = await fetch(apiUrl('/api/auth/resume'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adaptiveai_token') || ''}`
        },
        body: JSON.stringify({ userId: user.id, resumeText })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save resume:", err);
    }
  };

  const handleStartInterview = async (selectedMode = "ROLE_BASED") => {
    if (!user) {
      setAuthErrorNotice(true);
      if (onRequireAuth) onRequireAuth();
      return;
    }

    if (selectedMode === "RESUME_BASED") {
      if (!resumeText || resumeText.trim().length < 25) {
        alert("Please paste your resume or upload a resume PDF in Step 3 so Gemini can generate questions from your projects and background.");
        return;
      }
    }

    // Determine domain-appropriate skills so Aptitude / Business / Non-tech don't receive programming keywords
    let skillsForInterview = parsedSkills;
    if (selectedMode === "ROLE_BASED") {
      if (domain === "Frontend") {
        skillsForInterview = ["React", "JavaScript", "Browser Performance", "State Management", "CSS"];
      } else if (domain === "Backend") {
        skillsForInterview = ["Node.js", "REST APIs", "SQL & Databases", "Caching Architecture", "Microservices"];
      } else if (domain === "FullStack") {
        skillsForInterview = ["React", "Node.js", "REST APIs", "SQL Databases", "Authentication"];
      } else if (domain === "DataScience") {
        skillsForInterview = ["Python", "Machine Learning", "Transformers & NLP", "Model Evaluation"];
      } else if (domain === "Aptitude & Reasoning") {
        skillsForInterview = ["Logical Deduction", "Quantitative Aptitude", "Probability & Combinatorics", "Time and Work", "Ratios and Percentages"];
      } else if (domain === "Business & Management") {
        skillsForInterview = ["Product Strategy", "Unit Economics", "Stakeholder Alignment", "Prioritization Frameworks"];
      } else if (domain === "English Communication") {
        skillsForInterview = ["STAR Method", "De-escalation", "Executive Communication", "Client Relationship Management"];
      } else if (domain === "Finance & Accounting") {
        skillsForInterview = ["Financial Statements", "Working Capital", "Valuation", "Accounting Principles"];
      } else if (domain === "Custom" && customSubject) {
        skillsForInterview = [customSubject];
      }
    }

    setIsStarting(true);
    setStartingMode(selectedMode);
    try {
      const activeUserId = user.id;
      const activeCandidateName = user.name || candidateName || "Candidate";

      const res = await fetch(apiUrl('/api/interview/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          candidateName: activeCandidateName,
          targetRole: domain === "Custom" && customSubject ? customSubject : targetRole,
          domain,
          customSubject,
          mode: selectedMode,
          candidateSkills: skillsForInterview,
          resumeText: selectedMode === "RESUME_BASED" ? resumeText : null,
          jobDescription: selectedMode === "RESUME_BASED" ? jobDescription : null,
          initialDifficulty: "Easy",
          totalQuestionsPlanned,
          timeLimitMinutes
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.data && onInterviewStart) {
        onInterviewStart(data.data);
      } else {
        alert(data.message || `Unable to start interview session (HTTP ${res.status}). Please check that the server is online.`);
      }
    } catch (err) {
      console.error("Failed to start interview:", err);
      alert("Cannot connect to backend server. Please verify that the server is running.");
    } finally {
      setIsStarting(false);
      setStartingMode(null);
    }
  };

  const categories = [
    { id: "Frontend", name: "Frontend Development", role: "Frontend Engineer" },
    { id: "Backend", name: "Backend Engineering", role: "Backend Engineer" },
    { id: "FullStack", name: "Full Stack Development", role: "Full Stack Engineer" },
    { id: "DataScience", name: "Data Science & AI", role: "Data Scientist" },
    { id: "Aptitude & Reasoning", name: "Aptitude & Reasoning", role: "Aptitude Assessment" },
    { id: "English Communication", name: "English & Communication", role: "Communication Assessment" },
    { id: "Business & Management", name: "Business & Product", role: "Product Manager" },
    { id: "Finance & Accounting", name: "Finance & Accounting", role: "Financial Analyst" },
    { id: "Custom", name: "Custom Subject / Exam", role: "Custom Assessment" }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Human Friendly Hero Banner */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-['Outfit']">
          Practice realistic interviews. <br />
          <span className="text-[#5CDB94]">
            Build real confidence.
          </span>
        </h1>
        <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
          Select your target role, set your preferred interview length, and practice answering realistic interview questions with personalized mentor feedback.
        </p>
      </div>

      {/* Mandatory Candidate Authentication Notice (If not logged in) */}
      {!user && (
        <div className="p-5 bg-gradient-to-r from-amber-950/80 via-[#0B2641] to-amber-950/80 border-2 border-amber-500/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-['Outfit']">Candidate Login Required</h4>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl leading-relaxed">
                Please sign in or create an account to start an interview session, enable live camera proctoring, and save your skill scorecard.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRequireAuth}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#0B2540] font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-amber-400/20 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <LogIn className="w-4 h-4 text-[#0B2540]" />
            Sign In / Register
          </button>
        </div>
      )}

      {/* Remembered Resume Active Banner (If logged in and resume is stored) */}
      {user && resumeText && (
        <div className="p-3.5 bg-[#0F3154] border border-[#5CDB94]/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#5CDB94]/20 text-[#5CDB94] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white">Your Resume is Remembered & Active</span>
              <span className="text-[11px] text-[#5CDB94] block">
                Saved for {user.name} • {parsedSkills.length} key competencies detected
              </span>
            </div>
          </div>
          <span className="text-[10px] text-slate-300 font-mono bg-[#071B2E] px-2.5 py-1 rounded-lg border border-[#1C476E]">
            Auto-Sync Active
          </span>
        </div>
      )}

      {/* 3 Simple Setup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Step 1 & 2: Role & Format */}
        <div className="md:col-span-7 space-y-6">
          {/* Card 1: Select Your Field */}
          <div className="glass-card rounded-2xl p-6 border border-[#1C476E] space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1C476E] pb-3">
              <div>
                <span className="text-xs font-bold text-[#5CDB94] uppercase tracking-wider">Step 1</span>
                <h3 className="text-base font-bold text-white">Choose Your Field</h3>
              </div>
              <span className="text-xs text-slate-400">Select what you want to practice</span>
            </div>

            {/* Clean Category Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setDomain(cat.id);
                    setTargetRole(cat.role);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    domain === cat.id
                      ? 'bg-[#133A63] border-[#5CDB94] text-white shadow-sm ring-2 ring-[#5CDB94]/50'
                      : 'bg-[#0B2641]/80 border-[#1C476E] text-slate-300 hover:bg-[#0F3154] hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold text-white truncate">{cat.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{cat.role}</div>
                </button>
              ))}
            </div>

            {domain === "Custom" && (
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Enter your specific exam or topic:</label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  placeholder="e.g. System Design, Product Analytics, Banking Quant..."
                  className="w-full bg-[#071B2E] border border-[#1C476E] focus:border-[#5CDB94] rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Card 2: Interview Format */}
          <div className="glass-card rounded-2xl p-6 border border-[#1C476E] space-y-4 shadow-lg">
            <div className="border-b border-[#1C476E] pb-3">
              <span className="text-xs font-bold text-[#5CDB94] uppercase tracking-wider">Step 2</span>
              <h3 className="text-base font-bold text-white">Interview Format & Length</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">How many questions would you like to answer?</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { count: 3, label: "Quick" },
                    { count: 5, label: "Standard" },
                    { count: 10, label: "Detailed" },
                    { count: 15, label: "Full Mock" }
                  ].map(item => (
                    <button
                      key={item.count}
                      type="button"
                      onClick={() => setTotalQuestionsPlanned(item.count)}
                      className={`py-2 px-1 rounded-xl border text-center transition-all ${
                        totalQuestionsPlanned === item.count
                          ? 'bg-[#5CDB94] border-[#5CDB94] text-[#0B2540] shadow-md font-bold'
                          : 'bg-[#0B2641] border-[#1C476E] text-slate-300 hover:bg-[#0F3154]'
                      }`}
                    >
                      <div className="text-xs">{item.count} Questions</div>
                      <div className={`text-[10px] mt-0.5 ${totalQuestionsPlanned === item.count ? 'text-[#0B2540]/80' : 'text-slate-400'}`}>{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Preferred time limit</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 30].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTimeLimitMinutes(mins)}
                      className={`py-2 px-1 rounded-xl border text-center transition-all ${
                        timeLimitMinutes === mins
                          ? 'bg-[#5CDB94] border-[#5CDB94] text-[#0B2540] shadow-md font-bold'
                          : 'bg-[#0B2641] border-[#1C476E] text-slate-300 hover:bg-[#0F3154]'
                      }`}
                    >
                      <div className="text-xs font-semibold">{mins} Mins</div>
                      <div className={`text-[10px] mt-0.5 ${timeLimitMinutes === mins ? 'text-[#0B2540]/80' : 'text-slate-400'}`}>{mins === 5 ? "Quick" : mins === 30 ? "Deep" : "Duration"}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dedicated Start Button 1: Role, Category & Time Selection */}
              <div className="pt-4 border-t border-[#1C476E]/80">
                <button
                  type="button"
                  onClick={() => handleStartInterview("ROLE_BASED")}
                  disabled={isStarting}
                  className={`w-full py-3.5 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all text-xs sm:text-sm active:scale-[0.99] cursor-pointer ${
                    user
                      ? 'bg-gradient-to-r from-[#1C476E] via-[#163F64] to-[#1C476E] hover:from-[#235684] hover:to-[#1C476E] text-white border border-[#5CDB94]/60 shadow-[#1C476E]/40'
                      : 'bg-amber-400 hover:bg-amber-300 text-[#0B2540] shadow-amber-400/25'
                  }`}
                >
                  {user ? (
                    <>
                      <Sparkles className="w-4 h-4 text-[#5CDB94]" />
                      <span>
                        {isStarting && startingMode === "ROLE_BASED"
                          ? "Generating Role Questions..."
                          : `Start ${targetRole} Mock (${totalQuestionsPlanned} Qs • ${timeLimitMinutes} Mins)`}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#5CDB94]" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-[#0B2540]" />
                      <span>Sign In or Register to Start</span>
                      <ArrowRight className="w-4 h-4 text-[#0B2540]" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-300 text-center mt-2 flex items-center justify-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#5CDB94] shrink-0" />
                  <span>
                    <strong>Option 1 (Field Practice):</strong> Questions will focus strictly on <strong>{targetRole}</strong> fundamentals & problem solving.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Resume & Start Button */}
        <div className="md:col-span-5 glass-card rounded-2xl p-6 border border-[#1C476E] flex flex-col justify-between shadow-lg space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1C476E] pb-3">
              <div>
                <span className="text-xs font-bold text-[#5CDB94] uppercase tracking-wider">Step 3</span>
                <h3 className="text-base font-bold text-white">Your Background</h3>
              </div>
              {user && (
                <button
                  onClick={handleSaveResumeToProfile}
                  className="px-2.5 py-1 bg-[#0B2641] hover:bg-[#0F3154] border border-[#1C476E] text-slate-200 text-xs rounded-lg flex items-center gap-1 transition-all"
                >
                  <Save className="w-3 h-3 text-[#5CDB94]" />
                  {saveSuccess ? "Saved!" : "Save"}
                </button>
              )}
            </div>

            {/* Friendly Drag and Drop Zone */}
            <div className="relative border-2 border-dashed border-[#1C476E] hover:border-[#5CDB94]/60 rounded-xl p-4 text-center bg-[#071B2E]/60 transition-all cursor-pointer">
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-1.5">
                <FileUp className="w-6 h-6 text-[#5CDB94]" />
                <span className="text-xs font-semibold text-slate-200">
                  {isUploading ? "Reading your resume..." : "Upload Resume PDF (Optional)"}
                </span>
                <span className="text-[11px] text-slate-400">We remember your resume across all mock interviews</span>
              </div>
            </div>

            {/* Textarea for Resume / Projects */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="font-semibold text-white">Paste Resume or Project Experience:</span>
                <span className="text-[10px] text-[#5CDB94] font-medium">Recommended for Tailored Mock</span>
              </label>
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                rows={4}
                className="w-full bg-[#071B2E] border border-[#1C476E] focus:border-[#5CDB94] rounded-xl p-3 text-xs text-slate-200 font-sans focus:outline-none leading-relaxed"
                placeholder="Paste your resume text, key projects, accomplishments, or tech stack... Gemini will craft interview questions directly from your background."
              />
            </div>

            {/* Optional Job Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="font-semibold text-slate-300">Target Job Description (Optional):</span>
                <span className="text-[10px] text-slate-400">Optional alignment</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                rows={3}
                className="w-full bg-[#071B2E] border border-[#1C476E] focus:border-[#5CDB94] rounded-xl p-3 text-xs text-slate-200 font-sans focus:outline-none leading-relaxed"
                placeholder="Paste the target job description or role requirements... Questions will bridge your experience to these specific role requirements."
              />
            </div>

            {/* Dynamic Interview Mode Badge */}
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs transition-all ${
              resumeText && resumeText.trim().length > 30
                ? 'bg-[#133A63]/80 border-[#5CDB94]/60 text-[#5CDB94] shadow-sm'
                : 'bg-[#0B2641]/80 border-[#1C476E] text-slate-300'
            }`}>
              <Sparkles className={`w-4 h-4 shrink-0 ${resumeText && resumeText.trim().length > 30 ? 'text-[#5CDB94]' : 'text-slate-400'}`} />
              <div>
                <strong className="block text-white font-semibold text-xs">
                  {resumeText && resumeText.trim().length > 30
                    ? '🎯 Resume-Driven Mode Active'
                    : `📚 Standard Role Practice (${targetRole})`}
                </strong>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  {resumeText && resumeText.trim().length > 30
                    ? `Questions will probe your real projects, architecture, and metrics${jobDescription ? ' aligned with the Job Description' : ''}.`
                    : 'No resume provided: Questions will test standard fundamentals for your selected domain.'}
                </p>
              </div>
            </div>

            {/* Skills Pills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5CDB94]" /> Key Topics Covered:
                </span>
                <button
                  onClick={handleParseResumeText}
                  disabled={isParsing}
                  className="text-[#5CDB94] hover:underline text-[11px] font-semibold"
                >
                  {isParsing ? "Updating..." : "Refresh Topics"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parsedSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-[#5CDB94]/15 border border-[#5CDB94]/30 text-[#5CDB94] text-xs font-semibold"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Dedicated Start Button 2: Resume & Job Description */}
          <div className="pt-2">
            <button
              onClick={() => handleStartInterview("RESUME_BASED")}
              disabled={isStarting}
              className={`w-full py-4 font-extrabold rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all text-sm active:scale-[0.99] cursor-pointer ${
                user
                  ? 'bg-[#5CDB94] hover:bg-[#4CD087] text-[#0B2540] shadow-[#5CDB94]/25'
                  : 'bg-amber-400 hover:bg-amber-300 text-[#0B2540] shadow-amber-400/25'
              }`}
            >
              {user ? (
                <>
                  <Sparkles className="w-4 h-4 text-[#0B2540]" />
                  <span>
                    {isStarting && startingMode === "RESUME_BASED"
                      ? "Analyzing Resume & Tailoring..."
                      : `Start Resume & JD Interview (${totalQuestionsPlanned} Qs)`}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#0B2540]" />
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#0B2540]" />
                  <span>Sign In or Register to Start</span>
                  <ArrowRight className="w-4 h-4 text-[#0B2540]" />
                </>
              )}
            </button>
            <p className="text-[11px] text-[#5CDB94] font-medium text-center mt-2 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#5CDB94] shrink-0" />
              <span>
                <strong>Option 2 (Resume Tailored):</strong> Gemini evaluates your actual projects, libraries & role requirements.
              </span>
            </p>
            {!user && (
              <p className="text-xs text-amber-300 font-semibold text-center mt-2 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Candidate login or registration is required to start any mock interview.
                </span>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
