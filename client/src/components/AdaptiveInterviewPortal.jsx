import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Timer, Sparkles, CheckCircle2, ChevronRight, HelpCircle, Code, Shield, AlertTriangle, ArrowRight, Zap, Clock } from 'lucide-react';
import OpenCVProctoringWidget from './OpenCVProctoringWidget';
import CodeSandboxWidget from './CodeSandboxWidget';

export default function AdaptiveInterviewPortal({ sessionData, onAnswerSubmit, onFinishSession }) {
  const [currentQ, setCurrentQ] = useState(sessionData?.currentQuestion);
  const [difficulty, setDifficulty] = useState(sessionData?.currentDifficulty || "Easy");
  const [questionIndex, setQuestionIndex] = useState(sessionData?.questionIndex || 1);
  const totalQuestions = sessionData?.totalQuestionsPlanned || 5;
  const timeLimitMinutes = sessionData?.timeLimitMinutes || 15;

  const [userAnswer, setUserAnswer] = useState("");
  const [attachedCode, setAttachedCode] = useState("");
  const [showCodeSandbox, setShowCodeSandbox] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  // Timer count-up & remaining time
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sessionData?.currentQuestion) {
      setCurrentQ(sessionData.currentQuestion);
      setDifficulty(sessionData.currentDifficulty || "Easy");
      setQuestionIndex(sessionData.questionIndex || 1);
      setUserAnswer("");
      setAttachedCode("");
      setShowCodeSandbox(false);
      setShowHint(false);
    }
  }, [sessionData]);

  // Overall Session Countdown / Count-up Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentQ]);

  // Web Speech API Voice Dictation
  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Voice dictation is not supported in this browser. You can type your response below.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!isListening) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserAnswer(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
      setIsListening(true);
    } else {
      setIsListening(false);
    }
  };

  const speakQuestion = () => {
    if ('speechSynthesis' in window && currentQ) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQ.question);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = async () => {
    if (!userAnswer && !attachedCode) {
      alert("Please provide an answer before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/interview/evaluate-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.sessionId || sessionData.id,
          answer: userAnswer,
          timeSpentSeconds: timerSeconds,
          isCodeSandboxAnswer: !!attachedCode,
          codeSnippet: attachedCode
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.data.isCompleted) {
          const finRes = await fetch('/api/interview/finalize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: sessionData.sessionId || sessionData.id })
          });
          const finData = await finRes.json();
          if (finData.success && onFinishSession) {
            onFinishSession(finData.data);
          }
        } else {
          if (onAnswerSubmit) {
            onAnswerSubmit(data.data);
          }
        }
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const difficultyColors = {
    Easy: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    Medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Hard: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    Expert: "bg-purple-500/20 text-purple-300 border-purple-500/30"
  };

  if (!currentQ) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-400">
        <Sparkles className="w-10 h-10 mx-auto mb-3 text-purple-400 animate-spin" />
        <p>Loading question state...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">
      {/* Status Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 font-extrabold flex items-center justify-center text-sm font-mono">
            Q{questionIndex}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Question {questionIndex} of {totalQuestions}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${difficultyColors[difficulty] || difficultyColors.Easy}`}>
                Difficulty: {difficulty}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-200">{currentQ.topic}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={speakQuestion}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Read Question Aloud"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            AI Voice
          </button>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Timer: {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')} / {timeLimitMinutes} Mins</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Question & Answer Input Card */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 border border-slate-800 space-y-6 shadow-xl relative">
          
          {/* Interviewer Persona Card */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold flex items-center justify-center text-xs">
                S
              </div>
              <div>
                <span className="font-bold text-white block text-xs">Sarah (Senior Engineering Lead)</span>
                <span className="text-[11px] text-slate-400">"Take your time to structure your answer and cite real-world trade-offs."</span>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
              Live Mock Session
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Question {questionIndex} of {totalQuestions}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug font-['Outfit']">
              {currentQ.question}
            </h3>
          </div>

          {/* Hint Drawer */}
          {currentQ.hints && currentQ.hints.length > 0 && (
            <div>
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs text-amber-400/90 hover:text-amber-300 font-semibold flex items-center gap-1 transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showHint ? "Hide Hint" : "Need a Hint?"}
              </button>
              {showHint && (
                <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/90 leading-relaxed">
                  💡 <strong>Hint:</strong> {currentQ.hints[0]}
                </div>
              )}
            </div>
          )}

          {/* Tools & STAR Template Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
            <label className="text-xs font-medium text-slate-300">Your Answer:</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const starTemplate = `[Situation]: In my previous project...\n[Task]: I needed to implement...\n[Action]: I chose this approach because...\n[Result]: As a result, performance improved by...`;
                  setUserAnswer(prev => prev ? `${prev}\n\n${starTemplate}` : starTemplate);
                }}
                className="px-2.5 py-1 bg-purple-600/15 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                title="Insert STAR Framework template into your answer"
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Insert STAR Template</span>
              </button>

              <button
                onClick={() => setShowCodeSandbox(!showCodeSandbox)}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  showCodeSandbox
                    ? 'bg-purple-600 text-white border-purple-500'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                {showCodeSandbox ? "Hide Code Sandbox" : "Open Code Sandbox"}
              </button>
            </div>
          </div>

          {showCodeSandbox && (
            <CodeSandboxWidget
              initialCode={currentQ.codeTemplate || undefined}
              onCodeChange={code => setAttachedCode(code)}
              onSubmitCode={code => {
                setAttachedCode(code);
                alert("Code snippet attached to your answer!");
              }}
            />
          )}

          <div className="relative">
            <textarea
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              rows={6}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition-all leading-relaxed"
              placeholder="Explain your answer, reasoning, key principles, and examples..."
            />

            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 px-1">
              <span>{userAnswer.trim().split(/\s+/).filter(Boolean).length} words</span>
              <button
                onClick={toggleVoiceInput}
                className={`px-3 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                    : 'bg-slate-900 border-slate-750 text-purple-300 hover:bg-slate-800'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-purple-400" />}
                {isListening ? "Listening..." : "Voice Dictate"}
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all text-sm mt-3"
          >
            <Sparkles className="w-4 h-4" />
            {isSubmitting ? "Evaluating your response..." : `Submit Answer (${questionIndex}/${totalQuestions})`}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Sidebar: OpenCV Proctoring & Difficulty Gauge */}
        <div className="lg:col-span-4 space-y-4">
          <OpenCVProctoringWidget isSpeaking={isListening || userAnswer.length > 20} fillerCount={0} />

          <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Dynamic Difficulty Engine
            </h4>
            <div className="space-y-1.5 pt-1">
              {["Easy", "Medium", "Hard", "Expert"].map((lvl) => (
                <div key={lvl} className="flex items-center justify-between text-xs">
                  <span className={difficulty === lvl ? "font-bold text-purple-300" : "text-slate-500"}>{lvl}</span>
                  <div className="h-2 rounded-full w-24 bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        difficulty === lvl ? 'bg-gradient-to-r from-purple-500 to-cyan-400 w-full' : 'w-0'
                      }`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
