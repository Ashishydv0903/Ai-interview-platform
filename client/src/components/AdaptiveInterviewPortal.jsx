import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, Timer, Sparkles, CheckCircle2, ChevronRight, HelpCircle, Code, Shield, AlertTriangle, ArrowRight, Zap, Clock, LogOut, ShieldCheck, ShieldAlert, UserX, Camera, CameraOff } from 'lucide-react';
import OpenCVProctoringWidget from './OpenCVProctoringWidget';
import CodeSandboxWidget from './CodeSandboxWidget';
import { apiUrl } from '../config/api';

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
  
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proctoringData, setProctoringData] = useState(null);
  const [pasteWarning, setPasteWarning] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Strict Camera & Face Verification Guards
  const isCameraOn = !!(proctoringData && proctoringData.cameraActive);
  const isCameraCovered = isCameraOn && !!(proctoringData && (proctoringData.isCovered || proctoringData.liveFaceStatus === 'OBSTRUCTED'));
  const isFacePresent = isCameraOn && !isCameraCovered && !!(proctoringData && proctoringData.faceDetected && !proctoringData.isFaceAbsentPaused);
  const isAnswerBlocked = !isCameraOn || isCameraCovered || !isFacePresent;

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const baseAnswerRef = useRef('');
  const answerRef = useRef('');
  const sessionStartRef = useRef(Date.now());
  const timeUpRef = useRef(false);
  const proctoringRef = useRef(null);
  const onFinishRef = useRef(onFinishSession);
  proctoringRef.current = proctoringData;
  onFinishRef.current = onFinishSession;
  answerRef.current = userAnswer;

  const handleProctoringUpdate = useCallback((data) => {
    setProctoringData(data);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (typeof window !== 'undefined' && window.__activeInterviewMediaStream) {
        window.__activeInterviewMediaStream.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
        window.__activeInterviewMediaStream = null;
      }
    };
  }, []);

  useEffect(() => {
    if (sessionData?.currentQuestion) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      isListeningRef.current = false;
      setIsListening(false);
      setCurrentQ(sessionData.currentQuestion);
      setDifficulty(sessionData.currentDifficulty || "Easy");
      setQuestionIndex(sessionData.questionIndex || 1);
      setUserAnswer("");
      setAttachedCode("");
      setShowCodeSandbox(false);
      setShowHint(false);
    }
  }, [sessionData]);

  // Session clock keeps running across questions. Question clock resets with each prompt.
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      setQuestionSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setQuestionSeconds(0);
  }, [currentQ?.id, questionIndex]);

  // Web Speech API Voice Dictation (Robust multi-browser handler with live stream concatenation)
  const toggleVoiceInput = () => {
    if (!isCameraOn) {
      alert("Camera Required: Please turn on your webcam to use voice dictation.");
      return;
    }
    if (isCameraCovered) {
      alert("Camera Obstructed: Please uncover your camera lens before using voice dictation.");
      return;
    }
    if (!isFacePresent) {
      alert("Face Required: Please position your face in the camera view to use voice dictation.");
      return;
    }
    if (proctoringData && !proctoringData.micActive) {
      alert("Microphone Muted: Please unmute your microphone in the OpenCV Proctoring widget to use voice dictation.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice dictation is supported in Chrome, Edge, and Safari. You can also type your answer directly in the box below.");
      return;
    }

    if (isListening) {
      // User tapped Stop
      isListeningRef.current = false;
      setIsListening(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      baseAnswerRef.current = userAnswer;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalized = '';
        let interim = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalized += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const base = baseAnswerRef.current ? baseAnswerRef.current.trim() + ' ' : '';
        setUserAnswer(base + finalized + interim);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          alert("Microphone permission was denied. Please allow microphone access in your browser address bar to use voice dictation.");
          isListeningRef.current = false;
          setIsListening(false);
        } else if (event.error !== 'no-speech') {
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // If candidate is still speaking, auto-restart unless explicitly turned off
        if (isListeningRef.current) {
          try {
            baseAnswerRef.current = answerRef.current;
            recognition.start();
          } catch (e) {
            isListeningRef.current = false;
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
    } catch (err) {
      console.error("Speech recognition could not start:", err);
      isListeningRef.current = false;
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
    if (!isCameraOn) {
      alert("Camera Required: You must turn on your webcam to submit your answer.");
      return;
    }
    if (isCameraCovered) {
      alert("Camera Obstructed: Your camera lens is covered by a hand or object. Please uncover the lens before submitting.");
      return;
    }
    if (!isFacePresent) {
      alert("Face Required: Please position your face in the camera view before submitting.");
      return;
    }
    if (!userAnswer && !attachedCode) {
      alert("Please provide an answer before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/interview/evaluate-next'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.sessionId || sessionData.id,
          answer: userAnswer,
          timeSpentSeconds: questionSeconds,
          isCodeSandboxAnswer: !!attachedCode,
          codeSnippet: attachedCode,
          proctoringSummary: proctoringData
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.message || `Answer evaluation failed (HTTP ${res.status}).`);
      }

      if (data.data.isCompleted) {
        // Guarantee hardware camera and mic are completely powered down immediately
        if (proctoringData?.stopCamera) {
          try { proctoringData.stopCamera(); } catch (e) {}
        }
        if (typeof window !== 'undefined' && window.__activeInterviewMediaStream) {
          window.__activeInterviewMediaStream.getTracks().forEach(t => {
            try { t.stop(); } catch (e) {}
          });
          window.__activeInterviewMediaStream = null;
        }
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
        }
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }

        const finalSession = data.data.session || sessionData;
        const finalReport = data.data.finalReport || finalSession?.finalReport;
        const finalReportWithProctoring = {
          ...(finalReport || {}),
          proctoringSummary: proctoringData || finalReport?.proctoringSummary || finalSession?.proctoringSummary
        };

        // Fire-and-forget background sync if needed, never block UI transition
        fetch(apiUrl('/api/interview/finalize'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionData.sessionId || sessionData.id,
            proctoringSummary: proctoringData
          })
        }).catch(syncErr => console.warn("Background finalize sync notice:", syncErr));

        if (onFinishSession) {
          onFinishSession({
            session: {
              ...(finalSession || {}),
              finalReport: finalReportWithProctoring,
              proctoringSummary: proctoringData || finalSession?.proctoringSummary
            },
            finalReport: finalReportWithProctoring
          });
        }
        return;
      } else {
        if (!data.data.nextQuestion) {
          throw new Error('The server evaluated your answer but did not return the next question. Please check the server logs.');
        }
        // Update local state immediately for instant, seamless transition to next question
        setCurrentQ(data.data.nextQuestion);
        setDifficulty(data.data.nextDifficulty || "Easy");
        setQuestionIndex(data.data.questionIndex || (questionIndex + 1));
        setUserAnswer("");
        setAttachedCode("");
        setShowCodeSandbox(false);
        setShowHint(false);
        setQuestionSeconds(0);
        if (onAnswerSubmit) onAnswerSubmit(data.data);
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      alert(err.message || "Could not submit your answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Voluntary Early Exit with Partial Scorecard Generation
  const handleExitEarly = async () => {
    setIsExiting(true);
    // Guarantee hardware camera and mic are completely powered down immediately
    if (proctoringData?.stopCamera) {
      try { proctoringData.stopCamera(); } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.__activeInterviewMediaStream) {
      window.__activeInterviewMediaStream.getTracks().forEach(t => {
        try { t.stop(); } catch (e) {}
      });
      window.__activeInterviewMediaStream = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    try {
      const exitRecord = {
        id: `MANUAL_EXIT_${Date.now()}`,
        type: 'MANUAL_EXIT',
        message: `Candidate voluntarily concluded interview session after Question ${Math.max(0, questionIndex - 1)}.`,
        severity: 'INFO',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      };

      const updatedProctoring = {
        ...(proctoringData || {}),
        flags: [exitRecord, ...((proctoringData && proctoringData.flags) || [])]
      };

      const finRes = await fetch(apiUrl('/api/interview/finalize'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.sessionId || sessionData.id,
          proctoringSummary: updatedProctoring,
          isEarlyExit: true
        })
      });

      const finData = await finRes.json().catch(() => ({}));
      if (finData && finData.success && onFinishSession) {
        onFinishSession({
          session: {
            ...finData.data.session,
            finalReport: finData.data.finalReport,
            proctoringSummary: updatedProctoring
          },
          finalReport: finData.data.finalReport
        });
      } else {
        alert(finData?.message || "Failed to finalize session.");
      }
    } catch (err) {
      console.error("Error ending interview early:", err);
      alert("Could not finalize session. Please verify connection.");
    } finally {
      setIsExiting(false);
      setShowExitModal(false);
    }
  };

  const releaseInterviewHardware = () => {
    if (proctoringRef.current?.stopCamera) {
      try { proctoringRef.current.stopCamera(); } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.__activeInterviewMediaStream) {
      window.__activeInterviewMediaStream.getTracks().forEach(t => {
        try { t.stop(); } catch (e) {}
      });
      window.__activeInterviewMediaStream = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    const limit = timeLimitMinutes * 60;
    if (sessionSeconds < limit || timeUpRef.current) return;
    timeUpRef.current = true;

    (async () => {
      releaseInterviewHardware();
      try {
        const finRes = await fetch(apiUrl('/api/interview/finalize'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionData.sessionId || sessionData.id,
            proctoringSummary: proctoringRef.current,
            isEarlyExit: true
          })
        });
        const finData = await finRes.json().catch(() => ({}));
        if (finData?.success && onFinishRef.current) {
          onFinishRef.current({
            session: {
              ...finData.data.session,
              finalReport: finData.data.finalReport,
              proctoringSummary: proctoringRef.current
            },
            finalReport: finData.data.finalReport
          });
        }
      } catch (err) {
        console.error('Could not close the session when time ran out:', err);
      }
    })();
  }, [sessionSeconds, timeLimitMinutes, sessionData]);

  const difficultyColors = {
    Easy: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    Medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Hard: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    Expert: "bg-[#5CDB94]/20 text-[#5CDB94] border-[#5CDB94]/30"
  };

  const interviewer = (() => {
    const domain = `${currentQ?.domain || ''} ${currentQ?.topic || ''}`.toLowerCase();
    if (domain.includes('aptitude') || domain.includes('reason')) {
      return { initial: 'A', name: 'Ananya, aptitude round', line: 'Write the steps. The final number alone is not enough.' };
    }
    if (domain.includes('business') || domain.includes('product')) {
      return { initial: 'R', name: 'Rahul, product round', line: 'Say what you would trade off, then what you would pick.' };
    }
    if (domain.includes('english') || domain.includes('communication')) {
      return { initial: 'M', name: 'Meera, communication round', line: 'One real example is better than a definition.' };
    }
    if (domain.includes('finance') || domain.includes('account')) {
      return { initial: 'K', name: 'Kabir, finance round', line: 'Name the statement or ratio you are using.' };
    }
    if (domain.includes('data') || domain.includes('machine')) {
      return { initial: 'P', name: 'Priya, data round', line: 'Say what you would measure, and why that metric.' };
    }
    if (domain.includes('backend') || domain.includes('node') || domain.includes('sql')) {
      return { initial: 'A', name: 'Arjun, backend round', line: 'Mention one way this fails, not only the happy path.' };
    }
    return { initial: 'S', name: 'Sana, frontend round', line: 'Walk through what the browser does, not just the API name.' };
  })();

  if (!currentQ || sessionData?.status === 'COMPLETED' || sessionData?.isClosed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#5CDB94]/20 text-[#5CDB94] mx-auto flex items-center justify-center border border-[#5CDB94]/40">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white font-['Outfit']">This Mock Interview is Concluded</h2>
        <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          The interview board is now closed. Your answers and proctoring analytics have been finalized.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {sessionData?.finalReport && (
            <button
              onClick={() => onFinishSession && onFinishSession({ session: sessionData, finalReport: sessionData.finalReport })}
              className="px-5 py-2.5 bg-[#5CDB94] hover:bg-[#4CD087] text-[#0B2540] font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#0B2540]" />
              View Skill Scorecard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">
      {/* Status Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card rounded-2xl p-4 border border-[#1C476E]">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-[#5CDB94]/20 border border-[#5CDB94]/40 text-[#5CDB94] font-extrabold flex items-center justify-center text-sm font-mono">
            Q{questionIndex}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-medium">Question {questionIndex} of {totalQuestions}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${difficultyColors[difficulty] || difficultyColors.Easy}`}>
                Difficulty: {difficulty}
              </span>
            </div>
            <span className="text-xs font-semibold text-white">{currentQ.topic}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Live Page Focus Indicator */}
          <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all ${
            proctoringData?.liveFocusStatus === 'FOCUSED' || !proctoringData
              ? 'bg-[#5CDB94]/15 border-[#5CDB94]/30 text-[#5CDB94]'
              : 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              proctoringData?.liveFocusStatus === 'FOCUSED' || !proctoringData ? 'bg-[#5CDB94]' : 'bg-rose-400'
            }`}></span>
            <span>
              {proctoringData?.liveFocusStatus === 'TAB_SWITCHED'
                ? 'Tab Switched ⚠️'
                : proctoringData?.liveFocusStatus === 'WINDOW_OUT_OF_FOCUS'
                ? 'Window Out of Focus ⚠️'
                : 'Focused ✅'}
            </span>
          </div>

          <button
            onClick={speakQuestion}
            className="px-3 py-1.5 bg-[#0B2641] hover:bg-[#0F3154] border border-[#1C476E] text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Read Question Aloud"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#5CDB94]" />
            Read aloud
          </button>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono ${
            timeLimitMinutes * 60 - sessionSeconds <= 60
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              : 'bg-[#071B2E] border-[#1C476E] text-[#5CDB94]'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>
              {Math.floor(Math.max(0, timeLimitMinutes * 60 - sessionSeconds) / 60)}:
              {(Math.max(0, timeLimitMinutes * 60 - sessionSeconds) % 60).toString().padStart(2, '0')} left
            </span>
          </div>

          {/* Persistent Exit Interview Button */}
          <button
            onClick={() => setShowExitModal(true)}
            className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Conclude interview early and save partial results"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Exit Interview</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Question & Answer Input Card */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 border border-[#1C476E] space-y-6 shadow-xl relative">
          
          {/* Interviewer Persona Card */}
          <div className="bg-[#071B2E] p-3.5 rounded-xl border border-[#1C476E] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#5CDB94] text-[#0B2540] font-bold flex items-center justify-center text-xs">
                {interviewer.initial}
              </div>
              <div>
                <span className="font-bold text-white block text-xs">{interviewer.name}</span>
                <span className="text-[11px] text-slate-300">{interviewer.line}</span>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[10px] px-2.5 py-0.5 rounded-full bg-[#5CDB94]/20 text-[#5CDB94] border border-[#5CDB94]/30 font-mono font-bold">
              Live Mock Session
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-[#5CDB94] uppercase tracking-wider flex items-center gap-1">
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
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showHint ? "Hide Hint" : "Need a Hint?"}
              </button>
              {showHint && (
                <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 leading-relaxed">
                  💡 <strong>Hint:</strong> {currentQ.hints[0]}
                </div>
              )}
            </div>
          )}

          {/* Tools & STAR Template Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1C476E]">
            <label className="text-xs font-medium text-slate-200">Your Answer:</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isAnswerBlocked) return;
                  const starTemplate = `[Situation]: In my previous project...\n[Task]: I needed to implement...\n[Action]: I chose this approach because...\n[Result]: As a result, performance improved by...`;
                  setUserAnswer(prev => prev ? `${prev}\n\n${starTemplate}` : starTemplate);
                }}
                disabled={isAnswerBlocked}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  isAnswerBlocked
                    ? 'bg-[#5CDB94]/5 border border-[#5CDB94]/10 text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-[#5CDB94]/15 hover:bg-[#5CDB94]/30 border border-[#5CDB94]/30 text-[#5CDB94] cursor-pointer'
                }`}
                title={!isCameraOn ? "Camera required to use STAR template" : "Insert STAR Framework template into your answer"}
              >
                <Sparkles className="w-3 h-3 text-[#5CDB94]" />
                <span>Insert STAR Template</span>
              </button>

              <button
                onClick={() => setShowCodeSandbox(!showCodeSandbox)}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  showCodeSandbox
                    ? 'bg-[#5CDB94] text-[#0B2540] border-[#5CDB94] font-bold'
                    : 'bg-[#0B2641] border-[#1C476E] text-slate-300 hover:bg-[#0F3154]'
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
            {/* Camera Required Warning Banner */}
            {!isCameraOn && (
              <div className="mb-4 p-4 rounded-xl bg-rose-950/90 border border-rose-500/80 text-rose-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                    <CameraOff className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-white font-bold text-sm">Camera Required to Answer:</strong>
                    <p className="text-rose-200/90 text-xs mt-0.5">
                      {proctoringData?.hardwareErrorMsg || "Your camera is currently off or disabled. Assessment proctoring requires your camera to be active to enable typing, voice dictation, and answer submission."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => proctoringData?.enableCamera && proctoringData.enableCamera()}
                    className="px-4 py-2 bg-[#5CDB94] hover:bg-[#4CD087] text-[#0B2540] font-extrabold rounded-xl text-xs shadow-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#0B2540]" />
                    Turn On Camera
                  </button>
                  {proctoringData?.hardwareState !== 'LIVE' && proctoringData?.enableVirtualCamera && (
                    <button
                      type="button"
                      onClick={() => proctoringData.enableVirtualCamera()}
                      className="px-3 py-2 bg-[#0B2641] hover:bg-[#0F3154] border border-[#1C476E] text-slate-300 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      Virtual Test Mode
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Camera Obstructed / Hand Detected Warning Banner */}
            {isCameraOn && isCameraCovered && (
              <div className="mb-3 p-4 rounded-xl bg-rose-950/95 border-2 border-rose-500 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40 text-lg">
                    ✋
                  </div>
                  <div>
                    <strong className="block text-white font-bold text-sm">Camera Obstructed:</strong>
                    <p className="text-rose-200 text-xs mt-0.5">
                      {proctoringData?.coverReason || "Camera lens covered or low contrast. Ensure lighting is on and lens is uncovered."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (proctoringData?.resumeCamera) proctoringData.resumeCamera();
                    else if (proctoringData?.resumeFace) proctoringData.resumeFace();
                  }}
                  className="px-3.5 py-1.5 bg-[#5CDB94] hover:bg-[#4CD087] text-[#0B2540] font-extrabold rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer shadow-md self-end sm:self-center"
                >
                  I'm Here / Camera Clear ✅
                </button>
              </div>
            )}

            {/* Proctoring Face Absence Warning & Recording Pause */}
            {isCameraOn && !isCameraCovered && proctoringData?.isFaceAbsentPaused && (
              <div className="mb-3 p-3.5 rounded-xl bg-rose-950/90 border border-rose-500/80 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-pulse">
                <div className="flex items-center gap-2.5">
                  <UserX className="w-5 h-5 text-rose-400 shrink-0" />
                  <div className="leading-snug">
                    <strong className="block text-rose-300 font-bold">Face Absence Pause:</strong>
                    Position your face in the camera view to resume. If you are already in view, tap Resume.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => proctoringData?.resumeFace && proctoringData.resumeFace()}
                  className="px-3.5 py-1.5 bg-[#5CDB94] hover:bg-[#4CD087] text-[#0B2540] font-extrabold rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer shadow-md self-end sm:self-center"
                >
                  I'm Here / Resume ✅
                </button>
              </div>
            )}

            {pasteWarning && (
              <div className="mb-2 p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2 animate-bounce">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Anti-Cheating Policy:</strong> Copy-paste is disabled during the interview. Please articulate your answer in your own words.
                </span>
              </div>
            )}

            <textarea
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              onPaste={e => {
                e.preventDefault();
                setPasteWarning(true);
                setTimeout(() => setPasteWarning(false), 3800);
              }}
              rows={6}
              disabled={isAnswerBlocked}
              className={`w-full bg-[#071B2E] border rounded-xl p-4 text-sm text-slate-100 focus:outline-none transition-all leading-relaxed ${
                isAnswerBlocked
                  ? 'border-rose-500/60 opacity-60 cursor-not-allowed bg-[#071B2E]/50'
                  : 'border-[#1C476E] focus:border-[#5CDB94]'
              }`}
              placeholder={
                !isCameraOn
                  ? "Camera Required: Please turn on your webcam to begin typing or dictating your answer..."
                  : isCameraCovered
                  ? "Camera Obstructed: Remove hand or object covering the lens to resume..."
                  : proctoringData?.isFaceAbsentPaused
                  ? "Interview paused: Please position your face within camera view to resume..."
                  : "Explain your answer, reasoning, key principles, and examples..."
              }
            />

            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 px-1">
              <span>{userAnswer.trim().split(/\s+/).filter(Boolean).length} words</span>
              <button
                type="button"
                onClick={toggleVoiceInput}
                disabled={isAnswerBlocked}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-md shadow-rose-600/30 font-bold cursor-pointer'
                    : isAnswerBlocked
                    ? 'bg-[#0B2641]/50 border-[#1C476E]/50 text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-[#0B2641] border-[#1C476E] text-[#5CDB94] hover:bg-[#0F3154] cursor-pointer'
                }`}
                title={
                  !isCameraOn
                    ? "Turn on camera to enable voice dictation"
                    : isCameraCovered
                    ? "Camera is obstructed by hand"
                    : isListening
                    ? "Click to stop voice dictation"
                    : "Speak to dictate your answer"
                }
              >
                {isListening ? <MicOff className="w-3.5 h-3.5 animate-bounce" /> : <Mic className="w-3.5 h-3.5 text-[#5CDB94]" />}
                {isListening ? "Listening... (Click to Stop)" : "Voice Dictate"}
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isAnswerBlocked}
            className={`w-full py-3.5 font-extrabold rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all text-sm mt-3 ${
              isAnswerBlocked
                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-75'
                : 'bg-[#5CDB94] hover:bg-[#4CD087] text-[#0B2540] shadow-[#5CDB94]/25 cursor-pointer'
            }`}
          >
            {!isCameraOn ? (
              <>
                <CameraOff className="w-4 h-4 text-rose-400" />
                <span>Turn On Camera to Answer & Submit</span>
              </>
            ) : isCameraCovered ? (
              <>
                <UserX className="w-4 h-4 text-rose-400" />
                <span>Camera Obstructed — Uncover Lens to Submit</span>
              </>
            ) : !isFacePresent ? (
              <>
                <UserX className="w-4 h-4 text-amber-400" />
                <span>Face Required to Submit Answer</span>
              </>
            ) : isSubmitting ? (
              <>
                <Sparkles className="w-4 h-4 text-[#0B2540] animate-spin" />
                <span>Evaluating your response...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#0B2540]" />
                <span>Submit Answer ({questionIndex}/{totalQuestions})</span>
                <ArrowRight className="w-4 h-4 text-[#0B2540]" />
              </>
            )}
          </button>
        </div>

        {/* Right Sidebar: OpenCV Proctoring & Difficulty Gauge */}
        <div className="lg:col-span-4 space-y-4">
          <OpenCVProctoringWidget
            isSpeaking={isListening || userAnswer.length > 20}
            fillerCount={0}
            onProctoringUpdate={handleProctoringUpdate}
          />

          <div className="glass-card rounded-2xl p-4 border border-[#1C476E] space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#5CDB94]" />
              Dynamic Difficulty Engine
            </h4>
            <div className="space-y-1.5 pt-1">
              {["Easy", "Medium", "Hard", "Expert"].map((lvl) => (
                <div key={lvl} className="flex items-center justify-between text-xs">
                  <span className={difficulty === lvl ? "font-bold text-[#5CDB94]" : "text-slate-400"}>{lvl}</span>
                  <div className="h-2 rounded-full w-24 bg-[#071B2E] overflow-hidden border border-[#1C476E]">
                    <div
                      className={`h-full transition-all duration-500 ${
                        difficulty === lvl ? 'bg-gradient-to-r from-[#5CDB94] to-[#38BDF8] w-full' : 'w-0'
                      }`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Exit Interview Confirmation Dialog */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card rounded-2xl p-6 border border-[#1C476E] max-w-md w-full shadow-2xl space-y-4 bg-[#071B2E]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit']">Exit Interview Session?</h3>
                <p className="text-xs text-slate-400">Candidate Session Control</p>
              </div>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">
              Are you sure you want to end this mock interview now?
            </p>

            <div className="p-3.5 bg-[#0B2641] rounded-xl border border-[#1C476E] text-xs text-slate-300 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Questions Answered:</span>
                <span className="font-bold text-white font-mono">{Math.max(0, questionIndex - 1)} of {totalQuestions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Proctoring Integrity:</span>
                <span className="font-bold text-[#5CDB94] font-mono">{proctoringData?.trustScore || 100}% Trust</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Focus Retention:</span>
                <span className="font-bold text-[#38BDF8] font-mono">{proctoringData?.focusRetention || 100}%</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-[#1C476E]/60">
                Your completed responses will be saved, proctoring events archived, and a partial assessment scorecard generated.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                disabled={isExiting}
                className="px-4 py-2.5 rounded-xl bg-[#0B2641] hover:bg-[#0F3154] border border-[#1C476E] text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                Continue Interview
              </button>

              <button
                type="button"
                onClick={handleExitEarly}
                disabled={isExiting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                {isExiting ? "Generating Scorecard..." : "End Interview"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
