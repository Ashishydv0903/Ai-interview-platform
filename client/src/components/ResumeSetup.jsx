import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, ArrowRight, User, Save, FileUp, Lock, Clock, BookOpen, Layers, Check, Sparkles } from 'lucide-react';

export default function ResumeSetup({ onInterviewStart, user, onRequireAuth }) {
  const [candidateName, setCandidateName] = useState(user?.name || "");
  const [targetRole, setTargetRole] = useState("Frontend Engineer");
  const [domain, setDomain] = useState("Frontend");
  const [customSubject, setCustomSubject] = useState("");
  
  // Custom Interview Controls
  const [totalQuestionsPlanned, setTotalQuestionsPlanned] = useState(5);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);

  const [resumeText, setResumeText] = useState(
    user?.savedResumeText ||
    `Ashish Yadav - Senior Full Stack Engineer
Skills: React, Node.js, JavaScript, REST APIs, MongoDB, Redux.
Experience: Developing modern web applications, state management, and full-stack solutions.`
  );
  
  const [parsedSkills, setParsedSkills] = useState(["React", "Node.js", "JavaScript", "REST APIs", "MongoDB"]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [authErrorNotice, setAuthErrorNotice] = useState(false);

  useEffect(() => {
    if (user) {
      setCandidateName(user.name);
      if (user.savedResumeText) {
        setResumeText(user.savedResumeText);
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
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        if (data.data.skills?.length) setParsedSkills(data.data.skills);
        if (data.data.inferredDomain) setDomain(data.data.inferredDomain);
        if (data.data.rawText) setResumeText(data.data.rawText);
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
      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, targetRole })
      });
      const data = await res.json();
      if (data.success) {
        if (data.data.skills?.length) setParsedSkills(data.data.skills);
        if (data.data.inferredDomain) setDomain(data.data.inferredDomain);
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
      const res = await fetch('/api/auth/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleStart = async () => {
    if (!user) {
      setAuthErrorNotice(true);
      if (onRequireAuth) onRequireAuth();
      return;
    }

    setIsStarting(true);
    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          candidateName: user.name || candidateName,
          targetRole: domain === "Custom" && customSubject ? customSubject : targetRole,
          domain,
          customSubject,
          candidateSkills: parsedSkills,
          initialDifficulty: "Easy",
          totalQuestionsPlanned,
          timeLimitMinutes
        })
      });
      const data = await res.json();
      if (data.success && onInterviewStart) {
        onInterviewStart(data.data);
      }
    } catch (err) {
      console.error("Failed to start interview:", err);
    } finally {
      setIsStarting(false);
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
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400">
            Build real confidence.
          </span>
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
          Select your target role, set your preferred interview length, and practice answering realistic interview questions with personalized mentor feedback.
        </p>
      </div>

      {/* Guest Notice (If not logged in) */}
      {!user && (
        <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Sign In to Save Your Progress</h4>
              <p className="text-xs text-slate-400">Create a free account to track past mock interviews and get personal scorecards.</p>
            </div>
          </div>
          <button
            onClick={onRequireAuth}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-md whitespace-nowrap"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* 3 Simple Setup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Step 1 & 2: Role & Format */}
        <div className="md:col-span-7 space-y-6">
          {/* Card 1: Select Your Field */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Step 1</span>
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
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
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
                  className="w-full bg-slate-900 border border-purple-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Card 2: Interview Format */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 shadow-lg">
            <div className="border-b border-slate-800/80 pb-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Step 2</span>
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
                          ? 'bg-purple-600 border-purple-500 text-white shadow-md font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs">{item.count} Questions</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.label}</div>
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
                          ? 'bg-cyan-600 border-cyan-500 text-white shadow-md font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-semibold">{mins} Mins</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Duration</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Resume & Start Button */}
        <div className="md:col-span-5 glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between shadow-lg space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Step 3</span>
                <h3 className="text-base font-bold text-white">Your Background</h3>
              </div>
              {user && (
                <button
                  onClick={handleSaveResumeToProfile}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs rounded-lg flex items-center gap-1 transition-all"
                >
                  <Save className="w-3 h-3 text-cyan-400" />
                  {saveSuccess ? "Saved!" : "Save"}
                </button>
              )}
            </div>

            {/* Friendly Drag and Drop Zone */}
            <div className="relative border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-xl p-4 text-center bg-slate-950/60 transition-all cursor-pointer">
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-1.5">
                <FileUp className="w-6 h-6 text-purple-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {isUploading ? "Reading your resume..." : "Upload Resume PDF (Optional)"}
                </span>
                <span className="text-[11px] text-slate-500">We'll tailor interview questions to your experience</span>
              </div>
            </div>

            {/* Textarea for Manual Topics */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Or paste key topics / skills you want to practice:</label>
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                rows={4}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-sans focus:outline-none focus:border-purple-500 leading-relaxed"
                placeholder="e.g. React, Node.js, System Design, SQL, Problem Solving..."
              />
            </div>

            {/* Skills Pills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Key Topics Covered:
                </span>
                <button
                  onClick={handleParseResumeText}
                  disabled={isParsing}
                  className="text-purple-400 hover:text-purple-300 text-[11px] font-semibold"
                >
                  {isParsing ? "Updating..." : "Refresh Topics"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parsedSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Large Start Button */}
          <div className="pt-2">
            <button
              onClick={handleStart}
              disabled={isStarting}
              className={`w-full py-3.5 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all text-sm ${
                !user
                  ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-purple-600/30'
              }`}
            >
              {!user ? <Lock className="w-4 h-4 text-amber-400" /> : <Sparkles className="w-4 h-4" />}
              {isStarting
                ? "Preparing your interview..."
                : !user
                ? "Sign In to Start Mock"
                : `Start Mock (${totalQuestionsPlanned} Questions • ${timeLimitMinutes} Mins)`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
