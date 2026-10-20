import React, { useState, useEffect } from 'react';
import { Camera, Eye, Mic, ShieldAlert, Activity, Cpu } from 'lucide-react';

export default function OpenCVProctoringWidget({ isSpeaking, fillerCount }) {
  const [eyeContact, setEyeContact] = useState(94);
  const [postureScore, setPostureScore] = useState(98);
  const [speechPacing, setSpeechPacing] = useState(140); // words per min
  const [cameraActive, setCameraActive] = useState(true);

  // Dynamic simulation ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setEyeContact(prev => Math.min(100, Math.max(82, prev + (Math.floor(Math.random() * 7) - 3))));
      setPostureScore(prev => Math.min(100, Math.max(90, prev + (Math.floor(Math.random() * 5) - 2))));
      if (isSpeaking) {
        setSpeechPacing(prev => Math.min(170, Math.max(110, prev + (Math.floor(Math.random() * 11) - 5))));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div className="glass-card rounded-2xl p-4 border border-purple-500/20 shadow-xl relative overflow-hidden">
      {/* HUD Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
          <span className="text-xs font-bold tracking-wide text-cyan-300">OpenCV AI PROCTORING HUD</span>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          REALTIME
        </span>
      </div>

      {/* Simulated Webcam Viewport with Canvas Bounding Box Overlay */}
      <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group">
        {cameraActive ? (
          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
            {/* Simulated Candidate Avatar Graphic with Face Mesh Bounding box */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600/40 to-cyan-500/40 border-2 border-cyan-400/80 flex items-center justify-center shadow-lg shadow-cyan-500/20 relative">
              <Camera className="w-10 h-10 text-cyan-200 opacity-80" />
              
              {/* OpenCV Face Detection Bounding Box Overlay */}
              <div className="absolute -inset-3 border border-cyan-400/60 rounded-2xl animate-pulse">
                <span className="absolute -top-3 left-1 text-[8px] font-mono text-cyan-400 bg-slate-950 px-1 border border-cyan-500/40 rounded">
                  FACE_ID: #4092 (99.8%)
                </span>
                <span className="absolute -bottom-3 right-1 text-[8px] font-mono text-emerald-400 bg-slate-950 px-1 border border-emerald-500/40 rounded">
                  ATTENTION: OK
                </span>
              </div>
            </div>

            {/* Micro Audio Waveform Visualizer */}
            {isSpeaking && (
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1 bg-slate-900/80 backdrop-blur py-1 px-3 rounded-lg border border-purple-500/30">
                <Mic className="w-3 h-3 text-purple-400 animate-bounce" />
                <div className="flex items-center gap-0.5 h-4">
                  {[40, 80, 60, 100, 70, 90, 50, 85].map((h, idx) => (
                    <div
                      key={idx}
                      className="w-1 bg-purple-400 rounded-full transition-all duration-150"
                      style={{ height: `${(h * Math.random()).toFixed(0)}%` }}
                    ></div>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-purple-300 ml-2">{speechPacing} WPM</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-4 text-slate-500 text-xs">
            <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Camera paused
          </div>
        )}
      </div>

      {/* Analytics Gauge Metrics */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gaze Stability</span>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300">{eyeContact}%</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Vocal Confidence</span>
          </div>
          <span className="text-xs font-mono font-bold text-purple-300">
            {fillerCount > 2 ? 'Moderate' : 'High (95%)'}
          </span>
        </div>
      </div>
    </div>
  );
}
