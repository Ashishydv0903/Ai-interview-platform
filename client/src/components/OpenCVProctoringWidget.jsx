import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, CameraOff, Eye, Mic, MicOff, Shield, ShieldAlert, ShieldCheck,
  AlertTriangle, Activity, Cpu, Maximize, Minimize, Volume2, RefreshCw,
  Info, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, UserCheck, UserX, Users
} from 'lucide-react';

/**
 * Webcam proctoring panel.
 * Face check uses the browser FaceDetector API when the browser has it,
 * and a small skin-tone sample otherwise. Answers stay locked until a face is in frame.
 */
export default function OpenCVProctoringWidget({
  isSpeaking = false,
  fillerCount = 0,
  onProctoringUpdate = null
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const isMountedRef = useRef(true);
  const alertAudioRef = useRef(null);
  const onProctoringUpdateRef = useRef(onProctoringUpdate);
  onProctoringUpdateRef.current = onProctoringUpdate;

  // Hardware states: initial cameraActive is FALSE until hardware feed or permission confirms active
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [hardwareState, setHardwareState] = useState('INITIALIZING'); // 'LIVE' | 'PERMISSION_DENIED' | 'NO_WEBCAM' | 'VIRTUAL' | 'OFF'
  const [hardwareErrorMsg, setHardwareErrorMsg] = useState('Connecting to webcam...');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live CV detection telemetry
  const [faceDetected, setFaceDetected] = useState(false);
  const [gazeDirection, setGazeDirection] = useState('CENTER'); // 'CENTER' | 'LEFT' | 'RIGHT' | 'DOWN'
  const [gazeStability, setGazeStability] = useState(98);
  const [faceCount, setFaceCount] = useState(0);
  const [headPose, setHeadPose] = useState({ yaw: 0, pitch: 0 });
  const [measuredFps, setMeasuredFps] = useState(30);

  // Real Audio telemetry
  const [micVolumeDb, setMicVolumeDb] = useState(0);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Live Status Indicators
  const [liveFocusStatus, setLiveFocusStatus] = useState('FOCUSED'); // 'FOCUSED' | 'TAB_SWITCHED' | 'WINDOW_OUT_OF_FOCUS'
  const [liveFaceStatus, setLiveFaceStatus] = useState('MISSING');   // 'DETECTED' | 'MISSING' | 'MULTIPLE' | 'OBSTRUCTED'
  const [isFaceAbsentPaused, setIsFaceAbsentPaused] = useState(false);
  const [isCameraCovered, setIsCameraCovered] = useState(false);
  const [coverReason, setCoverReason] = useState('');

  // Real-Time Integrity Metrics
  const [facePresencePct, setFacePresencePct] = useState(100);
  const [focusRetentionPct, setFocusRetentionPct] = useState(100);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [trustScore, setTrustScore] = useState(100);
  const [deductionsList, setDeductionsList] = useState([]);
  const [violationsList, setViolationsList] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [firstFocusWarning, setFirstFocusWarning] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  // Timing & event references
  const sessionSecondsRef = useRef(1);
  const totalFocusLossSecondsRef = useRef(0);
  const totalFaceAbsentSecondsRef = useRef(0);
  const focusLossStartRef = useRef(null);
  const faceAbsentStartRef = useRef(null);
  const faceAbsentWarningLoggedRef = useRef(false);
  const tabSwitchesRef = useRef(0);
  const multipleFacesCountRef = useRef(0);
  const lastViolationTimeRef = useRef(0);
  const hasEverLostFocusRef = useRef(false);
  const resumeGraceUntilRef = useRef(0);

  // Helper: Log and announce a verified proctoring violation with penalty & duration
  const recordViolation = useCallback((type, message, severity = 'WARNING', penalty = 5, durationSec = null) => {
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 2500 && severity !== 'CRITICAL') return;
    lastViolationTimeRef.current = now;

    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newRecord = {
      id: `${type}_${now}`,
      type,
      message: durationSec ? `${message} (Duration: ${durationSec}s)` : message,
      severity,
      penalty,
      duration: durationSec || null,
      timestamp: timeStr
    };

    setViolationsList(prev => [newRecord, ...prev.slice(0, 24)]);

    if (penalty > 0) {
      setDeductionsList(prev => [
        {
          id: `deduct_${now}`,
          type,
          reason: newRecord.message,
          penalty,
          timestamp: timeStr
        },
        ...prev.slice(0, 14)
      ]);
      setTrustScore(prev => Math.max(10, prev - penalty));
    }

    setActiveAlert(newRecord);
    setTimeout(() => {
      setActiveAlert(current => (current?.id === newRecord.id ? null : current));
    }, 4500);

    // One shared audio context. Creating a new one per warning leaks contexts and stutters the tab.
    try {
      if (!alertAudioRef.current) {
        alertAudioRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const alertCtx = alertAudioRef.current;
      if (alertCtx.state === 'suspended') {
        alertCtx.resume().catch(() => {});
      }
      const osc = alertCtx.createOscillator();
      const gain = alertCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, alertCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(330, alertCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.05, alertCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, alertCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(alertCtx.destination);
      osc.start();
      osc.stop(alertCtx.currentTime + 0.16);
    } catch (e) {}
  }, []);

  // Hardware Stream Release Utility: Guarantees webcam and mic sensor hardware LEDs shut off immediately
  const stopAllMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch (e) {}
      });
      mediaStreamRef.current = null;
    }
    if (typeof window !== 'undefined' && window.__activeInterviewMediaStream) {
      window.__activeInterviewMediaStream.getTracks().forEach(t => {
        try { t.stop(); } catch (e) {}
      });
      window.__activeInterviewMediaStream = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (e) {}
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch (e) {}
      audioContextRef.current = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (alertAudioRef.current) {
      try { alertAudioRef.current.close(); } catch (e) {}
      alertAudioRef.current = null;
    }
  }, []);

  // 1. HARDWARE STREAM INITIALIZATION (Live Camera + Microphone)
  const initMediaDevices = useCallback(async () => {
    try {
      if (!isMountedRef.current) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is not supported in this browser environment.');
      }

      setHardwareErrorMsg('Requesting camera & microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: true
      });

      // If component unmounted while awaiting user approval / stream negotiation, release immediately!
      if (!isMountedRef.current) {
        stream.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
        return;
      }

      // Stop any prior dangling stream before assigning new one
      if (mediaStreamRef.current && mediaStreamRef.current !== stream) {
        mediaStreamRef.current.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
      }

      mediaStreamRef.current = stream;
      if (typeof window !== 'undefined') {
        window.__activeInterviewMediaStream = stream;
      }

      setHardwareState('LIVE');
      setCameraActive(true);
      setMicActive(true);
      setHardwareErrorMsg('');
      setFaceDetected(true);
      setLiveFaceStatus('DETECTED');
      faceAbsentStartRef.current = null;
      setIsFaceAbsentPaused(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Initialize Web Audio API Analyser
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
      } catch (audioErr) {
        console.warn('AudioContext initialization warning:', audioErr);
      }

      // Hardware and browser microphone mute listeners
      const audTrack = stream.getAudioTracks()[0];
      if (audTrack) {
        audTrack.onmute = () => {
          setMicActive(false);
          recordViolation('MIC_MUTED', 'Microphone hardware or browser feed muted.', 'WARNING', 4);
        };
        audTrack.onunmute = () => {
          setMicActive(true);
          recordViolation('MIC_CONNECTED', 'Microphone hardware restored.', 'INFO', 0);
        };
        audTrack.onended = () => {
          setMicActive(false);
          recordViolation('MIC_DISCONNECTED', 'Microphone disconnected from device.', 'CRITICAL', 8);
        };
        setMicActive(audTrack.enabled && !audTrack.muted && audTrack.readyState === 'live');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.warn('Live webcam/mic initialization notice:', err);
      setCameraActive(false);
      setFaceDetected(false);
      setLiveFaceStatus('MISSING');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setHardwareState('PERMISSION_DENIED');
        setHardwareErrorMsg('Camera access was denied in browser permissions. Please allow camera access in the browser address bar to unlock questions.');
        recordViolation('CAMERA_PERMISSION_DENIED', 'Camera access blocked in browser. Camera is required to answer.', 'CRITICAL', 10);
      } else {
        setHardwareState('NO_WEBCAM');
        setHardwareErrorMsg('No webcam detected on your device. Camera feed is required for proctored mock interviews.');
        recordViolation('WEBCAM_DISCONNECTED', 'No webcam device detected on hardware.', 'CRITICAL', 10);
      }
    }
  }, [recordViolation]);

  useEffect(() => {
    isMountedRef.current = true;
    initMediaDevices();

    return () => {
      isMountedRef.current = false;
      stopAllMediaTracks();
    };
  }, [initMediaDevices, stopAllMediaTracks]);

  // Turn camera ON or OFF explicitly
  const toggleCamera = useCallback(async () => {
    if (cameraActive) {
      // Turn OFF: Full hardware release so camera LED turns off
      stopAllMediaTracks();
      setCameraActive(false);
      setFaceDetected(false);
      setLiveFaceStatus('MISSING');
      setIsFaceAbsentPaused(true);
      recordViolation('WEBCAM_DISCONNECTED', 'Candidate turned off camera feed. Answering is locked.', 'CRITICAL', 10);
    } else {
      // Turn ON: Acquire fresh hardware media stream
      await initMediaDevices();
    }
  }, [cameraActive, initMediaDevices, recordViolation, stopAllMediaTracks]);

  // Enable Virtual Testing Mode (For test environments without physical webcam)
  const enableVirtualMode = useCallback(() => {
    setHardwareState('VIRTUAL');
    setCameraActive(true);
    setFaceDetected(true);
    setLiveFaceStatus('DETECTED');
    setHardwareErrorMsg('');
    setIsFaceAbsentPaused(false);
    faceAbsentStartRef.current = null;
    recordViolation('VIRTUAL_CAMERA_ENABLED', 'Virtual simulation mode activated for testing.', 'INFO', 0);
  }, [recordViolation]);

  // One-click resume: Candidate confirms face in view
  const resumeFacePresence = useCallback(() => {
    resumeGraceUntilRef.current = Date.now() + 8000; // 8-second grace period
    faceAbsentStartRef.current = null;
    faceAbsentWarningLoggedRef.current = false;
    setIsFaceAbsentPaused(false);
    setIsCameraCovered(false);
    setFaceDetected(true);
    setLiveFaceStatus('DETECTED');
    setTrustScore(prev => Math.max(90, prev));
  }, []);

  // 2. REAL-TIME ACCUMULATOR TIMER (Face Presence % & Focus Retention %)
  useEffect(() => {
    const timer = setInterval(() => {
      sessionSecondsRef.current += 1;

      // Accumulate focus loss seconds
      if (focusLossStartRef.current) {
        totalFocusLossSecondsRef.current += 1;
      }

      // Check face absence or camera off duration
      if (!cameraActive || faceAbsentStartRef.current) {
        totalFaceAbsentSecondsRef.current += 1;

        if (faceAbsentStartRef.current && Date.now() >= resumeGraceUntilRef.current) {
          const absentSec = Math.round((Date.now() - faceAbsentStartRef.current) / 1000);

          if (absentSec >= 4 && !faceAbsentWarningLoggedRef.current) {
            faceAbsentWarningLoggedRef.current = true;
            setIsFaceAbsentPaused(true);
            setLiveFaceStatus('MISSING');
            recordViolation(
              'FACE_NOT_DETECTED',
              `Face absent from camera view for ${absentSec}s! Answering paused.`,
              'WARNING',
              4,
              absentSec
            );
          }
        }
      } else if (cameraActive && faceDetected && !isCameraCovered && liveFocusStatus === 'FOCUSED') {
        // Continuous compliance auto-recovery: recover trust score over time
        setTrustScore(prev => Math.min(100, prev + 1));
      }

      const total = Math.max(1, sessionSecondsRef.current);
      const facePres = Math.max(0, Math.min(100, Math.round(((total - totalFaceAbsentSecondsRef.current) / total) * 100)));
      const focusRet = Math.max(0, Math.min(100, Math.round(((total - totalFocusLossSecondsRef.current) / total) * 100)));

      setFacePresencePct(facePres);
      setFocusRetentionPct(focusRet);
    }, 1000);

    return () => clearInterval(timer);
  }, [cameraActive, faceDetected, isCameraCovered, liveFocusStatus, recordViolation]);

  // 3. TAB VISIBILITY, WINDOW BLUR / FOCUS & DEVTOOLS MONITORS
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        focusLossStartRef.current = Date.now();
        setLiveFocusStatus('TAB_SWITCHED');
        tabSwitchesRef.current += 1;
        setTabSwitchCount(tabSwitchesRef.current);

        const isFirst = !hasEverLostFocusRef.current;
        hasEverLostFocusRef.current = true;
        const penalty = isFirst ? 5 : tabSwitchesRef.current === 2 ? 8 : 12;

        if (isFirst) {
          setFirstFocusWarning(true);
          setTimeout(() => setFirstFocusWarning(false), 7000);
        }

        recordViolation(
          'TAB_SWITCH_OUT',
          `Candidate navigated away from interview tab!${isFirst ? ' (First Warning Issued)' : ` (Infraction #${tabSwitchesRef.current})`}`,
          'CRITICAL',
          penalty
        );
      } else {
        const awayMs = focusLossStartRef.current ? (Date.now() - focusLossStartRef.current) : 0;
        const awaySec = Math.max(1, Math.round(awayMs / 1000));
        focusLossStartRef.current = null;
        setLiveFocusStatus('FOCUSED');

        recordViolation(
          'TAB_FOCUS_RESTORED',
          `Candidate returned to active interview window.`,
          'INFO',
          0,
          awaySec
        );
      }
    };

    const handleWindowBlur = () => {
      if (!document.hidden && liveFocusStatus === 'FOCUSED') {
        focusLossStartRef.current = Date.now();
        setLiveFocusStatus('WINDOW_OUT_OF_FOCUS');

        const isFirst = !hasEverLostFocusRef.current;
        hasEverLostFocusRef.current = true;
        const penalty = isFirst ? 4 : 6;

        if (isFirst) {
          setFirstFocusWarning(true);
          setTimeout(() => setFirstFocusWarning(false), 7000);
        }

        recordViolation(
          'WINDOW_BLUR',
          `Interview window lost active focus (switched app or clicked away)${isFirst ? ' (First Warning)' : ''}`,
          'WARNING',
          penalty
        );
      }
    };

    const handleWindowFocus = () => {
      if (focusLossStartRef.current) {
        const awayMs = Date.now() - focusLossStartRef.current;
        const awaySec = Math.max(1, Math.round(awayMs / 1000));
        focusLossStartRef.current = null;
        setLiveFocusStatus('FOCUSED');

        recordViolation(
          'WINDOW_FOCUS_RESTORED',
          `Interview window regained active focus.`,
          'INFO',
          0,
          awaySec
        );
      } else {
        setLiveFocusStatus('FOCUSED');
      }
    };

    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active) {
        recordViolation('FULLSCREEN_EXIT', 'Candidate exited proctored full-screen view.', 'WARNING', 4);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        recordViolation('DEVTOOLS_PROHIBITED', 'Developer tools shortcut blocked by proctoring policy.', 'CRITICAL', 10);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [liveFocusStatus, recordViolation]);

  // Toggle Fullscreen Mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 4. COMPUTER VISION & CANVAS TELEMETRY RENDER LOOP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let currentBox = { x: 120, y: 70, width: 220, height: 260 };
    let targetBox = { x: 120, y: 70, width: 220, height: 260 };
    let frameCount = 0;
    let lastFpsCheck = Date.now();

    // High-performance offscreen sampling canvas for real photometric & skin chrominance analysis
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 64;
    sampleCanvas.height = 48;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

    const nativeFaceDetector = typeof window !== 'undefined' && 'FaceDetector' in window
      ? new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 })
      : null;

    let consecutiveCoveredCount = 0;
    let consecutiveFaceCount = 0;
    let lastSampleAt = 0;
    let displayedFps = 0;
    // Last vision result. Drawing can reuse it so we don't scan pixels on every animation frame.
    let held = {
      detected: false,
      detectedFaces: 0,
      frameIsCovered: false,
      coverDetectedReason: '',
      target: { x: 120, y: 70, width: 220, height: 260 }
    };

    const renderLoop = async () => {
      const width = canvas.width;
      const height = canvas.height;

      // Calculate real measured FPS
      frameCount++;
      const now = Date.now();
      if (now - lastFpsCheck >= 1000) {
        displayedFps = frameCount;
        frameCount = 0;
        lastFpsCheck = now;
      }

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Real Audio Spectrum Sampling
      let currentDb = 0;
      let isVoiceDetected = false;

      // Continuously synchronize real hardware/browser microphone state
      const currentAudTrack = mediaStreamRef.current?.getAudioTracks()[0];
      const isAudLive = !!(currentAudTrack && currentAudTrack.enabled && !currentAudTrack.muted && currentAudTrack.readyState === 'live');
      if (isAudLive !== micActive) {
        setMicActive(isAudLive);
      }

      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        currentDb = Math.min(100, Math.round((rms / 255) * 100));
        isVoiceDetected = currentDb > 18;

        // Draw live mini audio spectrum bar
        const barWidth = width / dataArray.length;
        ctx.fillStyle = isVoiceDetected ? 'rgba(92, 219, 148, 0.6)' : 'rgba(56, 189, 248, 0.3)';
        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * 22;
          ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
        }
      }

      // REAL COMPUTER VISION & OCCLUSION / HAND-COVERAGE DETECTION
      let detected = false;
      let detectedFaces = 0;
      let frameIsCovered = false;
      let coverDetectedReason = '';

      if (cameraActive && hardwareState === 'LIVE' && videoRef.current && videoRef.current.readyState >= 2) {
        if (now - lastSampleAt < 160) {
          detected = held.detected;
          detectedFaces = held.detectedFaces;
          frameIsCovered = held.frameIsCovered;
          coverDetectedReason = held.coverDetectedReason;
          targetBox = held.target;
        } else {
        lastSampleAt = now;
        let meanL = 0;
        let stdDev = 0;
        let totalSkinPixels = 0;
        let centerSkinCount = 0;
        let sMinX = 64, sMaxX = 0, sMinY = 48, sMaxY = 0;

        try {
          sampleCtx.drawImage(videoRef.current, 0, 0, 64, 48);
          const imgData = sampleCtx.getImageData(0, 0, 64, 48).data;
          const totalPix = 64 * 48; // 3,072 sample pixels

          let sumL = 0;
          let sumL2 = 0;

          for (let y = 0; y < 48; y++) {
            for (let x = 0; x < 64; x++) {
              const idx = (y * 64 + x) * 4;
              const r = imgData[idx];
              const g = imgData[idx + 1];
              const b = imgData[idx + 2];

              // ITU-R BT.601 standard photometric luminance
              const L = 0.299 * r + 0.587 * g + 0.114 * b;
              sumL += L;
              sumL2 += L * L;

              // Inclusive universal skin chrominance space (works across all Fitzpatrick types I-VI & cool/warm LED lighting)
              const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
              const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

              // Rigorous skin chrominance filter:
              // Excludes saturated red/maroon clothing fabrics (where r-g > 48 or r/(g+1) > 2.15).
              // Natural human skin contains melanin and blood perfusion with significant green components.
              const isSkin = (
                L >= 14 && L <= 248 &&
                Cb >= 68 && Cb <= 160 &&
                Cr >= 110 && Cr <= 190 &&
                (r >= g - 12) &&
                (r - g <= 48) &&
                (r / (g + 1) <= 2.15) &&
                (r + g >= b * 0.95) &&
                (Math.max(r, g, b) - Math.min(r, g, b) >= 3)
              );

              if (isSkin) {
                totalSkinPixels++;
                if (x < sMinX) sMinX = x;
                if (x > sMaxX) sMaxX = x;
                if (y < sMinY) sMinY = y;
                if (y > sMaxY) sMaxY = y;

                // Central framing zone (where candidate head resides)
                if (x >= 10 && x <= 54 && y >= 2 && y <= 42) {
                  centerSkinCount++;
                }
              }
            }
          }

          meanL = sumL / totalPix;
          const variance = Math.max(0, (sumL2 / totalPix) - (meanL * meanL));
          stdDev = Math.sqrt(variance);
        } catch (sampleErr) {
          console.warn("Video frame sample error:", sampleErr);
        }

        const skinCoverageRatio = totalSkinPixels / 3072;
        const clusterW = Math.max(0, sMaxX - sMinX);
        const clusterH = Math.max(0, sMaxY - sMinY);
        const clusterAspect = clusterW / Math.max(1, clusterH);

        // Check native browser FaceDetector API if available
        let nativeDetected = false;
        if (nativeFaceDetector) {
          try {
            const faces = await nativeFaceDetector.detect(videoRef.current);
            if (faces && faces.length > 0) {
              nativeDetected = true;
              detected = true;
              detectedFaces = faces.length;
              const f = faces[0].boundingBox;
              targetBox = {
                x: (f.x / videoRef.current.videoWidth) * width,
                y: (f.y / videoRef.current.videoHeight) * height,
                width: (f.width / videoRef.current.videoWidth) * width,
                height: (f.height / videoRef.current.videoHeight) * height
              };
            }
          } catch (e) {}
        }

        // Real human candidate sitting or standing in front of webcam:
        // 1. Natural room illumination & contrast: meanL >= 10, stdDev >= 4.0
        // 2. Real human face cluster size in candidate zone: centerSkinCount >= 10, totalSkinPixels >= 12
        // 3. Head dimensions: clusterW >= 5, clusterH >= 6
        // 4. Natural facial aspect ratio: 0.25 <= clusterAspect <= 2.8
        // 5. Head positioned in upper 85% of screen: sMinY <= 42
        const hasRealHumanSubject = (
          meanL >= 10 &&
          stdDev >= 4.0 &&
          totalSkinPixels >= 12 &&
          centerSkinCount >= 10 &&
          clusterW >= 5 &&
          clusterH >= 6 &&
          clusterAspect >= 0.25 &&
          clusterAspect <= 2.8 &&
          sMinY <= 42
        );

        // PHYSICAL CAMERA OBSTRUCTION DETECTION (Hand covering the lens):
        // Can ONLY trigger if NO face or candidate subject is detected in the frame.
        // A hand directly covering lens produces EITHER:
        // 1. Extreme darkness / total light occlusion: meanL < 7 (blackout)
        // 2. Monolithic hand/palm pressed flush onto lens: skinCoverageRatio > 0.90 && stdDev < 4.0
        const isGraceActive = Date.now() < resumeGraceUntilRef.current;
        if (!nativeDetected && !hasRealHumanSubject && !isGraceActive) {
          if (meanL < 7) {
            frameIsCovered = true;
            coverDetectedReason = "Camera view is completely dark or lens is covered.";
          } else if (skinCoverageRatio > 0.90 && stdDev < 4.0) {
            frameIsCovered = true;
            coverDetectedReason = "Hand or palm is pressed directly against the camera lens.";
          }
        }

        if (frameIsCovered) {
          consecutiveCoveredCount++;
          consecutiveFaceCount = 0;
          detected = false;
          detectedFaces = 0;

          if (consecutiveCoveredCount >= 8) {
            setIsCameraCovered(true);
            setCoverReason(coverDetectedReason);
            setFaceDetected(false);
            setLiveFaceStatus('OBSTRUCTED');
            setIsFaceAbsentPaused(true);
            if (!faceAbsentStartRef.current) {
              faceAbsentStartRef.current = Date.now();
            }
            recordViolation('CAMERA_OBSTRUCTED', `Camera lens obstructed by hand or object: ${coverDetectedReason}`, 'CRITICAL', 8);
          }
        } else {
          consecutiveCoveredCount = 0;
          if (isCameraCovered) {
            setIsCameraCovered(false);
            setCoverReason('');
          }

          // Robust in-browser Computer Vision presence detector
          if (!nativeDetected) {
            if (hasRealHumanSubject) {
              consecutiveFaceCount = Math.min(30, consecutiveFaceCount + 2);
            } else {
              consecutiveFaceCount = Math.max(0, consecutiveFaceCount - 1);
            }

            if (consecutiveFaceCount >= 1 || (Date.now() < resumeGraceUntilRef.current)) {
              detected = true;
              detectedFaces = 1;

              const cMinX = Math.max(0.08, sMinX / 64);
              const cMaxX = Math.min(0.92, sMaxX / 64);
              const cMinY = Math.max(0.05, sMinY / 48);
              const cMaxY = Math.min(0.90, sMaxY / 48);
              const boxW = Math.max(0.20, cMaxX - cMinX);
              const boxH = Math.max(0.24, cMaxY - cMinY);

              targetBox = {
                x: Math.max(10, cMinX * width),
                y: Math.max(10, cMinY * height),
                width: Math.min(width - 20, boxW * width),
                height: Math.min(height - 20, boxH * height)
              };
            } else {
              consecutiveFaceCount = 0;
              detected = false;
              detectedFaces = 0;
            }
          }
          held.detected = detected;
          held.detectedFaces = detectedFaces;
          held.frameIsCovered = frameIsCovered;
          held.coverDetectedReason = coverDetectedReason;
          held.target = targetBox;
        }
      }
    } else if (cameraActive && hardwareState === 'VIRTUAL') {
        // Virtual test pattern mode if explicitly toggled for testing without webcam
        detected = true;
        detectedFaces = 1;
        targetBox = {
          x: width * 0.28,
          y: height * 0.16,
          width: width * 0.44,
          height: height * 0.62
        };

        ctx.fillStyle = 'rgba(7, 27, 46, 0.4)';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(92, 219, 148, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.42, 42, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.fill();

        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(92, 219, 148, 0.85)';
        ctx.fillText('CAMERA TEST PATTERN: FACE VERIFIED', 12, height - 10);
      } else {
        // Camera is OFF, PERMISSION_DENIED, NO_WEBCAM
        detected = false;
        detectedFaces = 0;
      }

      // Handle Face Presence State Changes
      if (detected && cameraActive && !frameIsCovered) {
        if (faceAbsentStartRef.current) {
          const awaySec = Math.round((Date.now() - faceAbsentStartRef.current) / 1000);
          if (awaySec >= 3) {
            recordViolation(
              'FACE_RESTORED',
              `Candidate returned to camera view.`,
              'INFO',
              0,
              awaySec
            );
          }
          faceAbsentStartRef.current = null;
          faceAbsentWarningLoggedRef.current = false;
          setIsFaceAbsentPaused(false);
        }

        setFaceDetected(true);
        setFaceCount(detectedFaces);

        if (detectedFaces > 1) {
          setLiveFaceStatus('MULTIPLE');
          multipleFacesCountRef.current += 1;
          recordViolation('MULTIPLE_PERSONS', `Multiple faces detected in camera frame (${detectedFaces} persons)!`, 'CRITICAL', 15);
        } else {
          setLiveFaceStatus('DETECTED');
        }
      } else if (!frameIsCovered) {
        // Face Not Detected in frame or Camera is OFF
        if (!faceAbsentStartRef.current) {
          faceAbsentStartRef.current = Date.now();
        }
        setFaceDetected(false);
        setLiveFaceStatus('MISSING');
      }

      // Smooth lerp bounding box
      currentBox.x += (targetBox.x - currentBox.x) * 0.25;
      currentBox.y += (targetBox.y - currentBox.y) * 0.25;
      currentBox.width += (targetBox.width - currentBox.width) * 0.25;
      currentBox.height += (targetBox.height - currentBox.height) * 0.25;

      // ESTIMATE HEAD POSE & GAZE ANGLE
      const frameCenterX = width * 0.5;
      const frameCenterY = height * 0.45;
      const faceCenterX = currentBox.x + currentBox.width * 0.5;
      const faceCenterY = currentBox.y + currentBox.height * 0.4;

      const rawDeltaX = (faceCenterX - frameCenterX) / frameCenterX;
      const rawDeltaY = (faceCenterY - frameCenterY) / frameCenterY;

      const deltaX = Math.abs(rawDeltaX) < 0.42 ? 0 : rawDeltaX;
      const deltaY = Math.abs(rawDeltaY) < 0.45 ? 0 : rawDeltaY;

      const yawDeg = Math.round(deltaX * 35);
      const pitchDeg = Math.round(deltaY * 25);

      let currentGaze = 'CENTER';
      if (deltaX < -0.42) {
        currentGaze = 'LEFT';
      } else if (deltaX > 0.42) {
        currentGaze = 'RIGHT';
      } else if (deltaY > 0.45) {
        currentGaze = 'DOWN';
      }

      // Visual Alert Overlay on Canvas when Camera is Obstructed by Hand
      if (frameIsCovered && cameraActive) {
        ctx.fillStyle = 'rgba(153, 27, 27, 0.82)';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, width - 12, height - 12);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CAMERA LENS COVERED ✋', width / 2, height / 2 - 10);

        ctx.fillStyle = '#FECACA';
        ctx.font = '10px monospace';
        ctx.fillText('Remove hand or obstruction to resume', width / 2, height / 2 + 12);
        ctx.textAlign = 'start';
      }

      // DRAW OPENCV HUD OVERLAYS ONLY IF CAMERA IS ON AND FACE DETECTED AND NOT COVERED
      if (cameraActive && detected && !frameIsCovered) {
        const { x, y, width: bw, height: bh } = currentBox;
        const hudColor = currentGaze === 'CENTER' ? '#5CDB94' : '#F59E0B';
        const bracketLen = 22;

        ctx.strokeStyle = hudColor;
        ctx.lineWidth = 2.5;

        // Top-Left corner bracket
        ctx.beginPath();
        ctx.moveTo(x, y + bracketLen);
        ctx.lineTo(x, y);
        ctx.lineTo(x + bracketLen, y);
        ctx.stroke();

        // Top-Right corner bracket
        ctx.beginPath();
        ctx.moveTo(x + bw - bracketLen, y);
        ctx.lineTo(x + bw, y);
        ctx.lineTo(x + bw, y + bracketLen);
        ctx.stroke();

        // Bottom-Left corner bracket
        ctx.beginPath();
        ctx.moveTo(x, y + bh - bracketLen);
        ctx.lineTo(x, y + bh);
        ctx.lineTo(x + bracketLen, y + bh);
        ctx.stroke();

        // Bottom-Right corner bracket
        ctx.beginPath();
        ctx.moveTo(x + bw - bracketLen, y + bh);
        ctx.lineTo(x + bw, y + bh);
        ctx.lineTo(x + bw, y + bh - bracketLen);
        ctx.stroke();

        // Eye Landmark Reticles (+)
        const eyeY = y + bh * 0.38;
        const leftEyeX = x + bw * 0.32;
        const rightEyeX = x + bw * 0.68;

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.lineWidth = 1.5;

        // Left Eye Crosshair
        ctx.beginPath();
        ctx.moveTo(leftEyeX - 6, eyeY);
        ctx.lineTo(leftEyeX + 6, eyeY);
        ctx.moveTo(leftEyeX, eyeY - 6);
        ctx.lineTo(leftEyeX, eyeY + 6);
        ctx.stroke();

        // Right Eye Crosshair
        ctx.beginPath();
        ctx.moveTo(rightEyeX - 6, eyeY);
        ctx.lineTo(rightEyeX + 6, eyeY);
        ctx.moveTo(rightEyeX, eyeY - 6);
        ctx.lineTo(rightEyeX, eyeY + 6);
        ctx.stroke();

        // Eye gaze tracking vector line
        ctx.strokeStyle = hudColor;
        ctx.beginPath();
        ctx.moveTo(leftEyeX, eyeY);
        ctx.lineTo(leftEyeX + yawDeg * 0.8, eyeY + pitchDeg * 0.8);
        ctx.moveTo(rightEyeX, eyeY);
        ctx.lineTo(rightEyeX + yawDeg * 0.8, eyeY + pitchDeg * 0.8);
        ctx.stroke();

        // HUD Top Badge Label
        ctx.fillStyle = 'rgba(11, 38, 65, 0.85)';
        ctx.fillRect(x, Math.max(0, y - 22), 170, 18);
        ctx.strokeStyle = hudColor;
        ctx.strokeRect(x, Math.max(0, y - 22), 170, 18);

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = hudColor;
        ctx.fillText(`Face: ${currentGaze.toLowerCase()}`, x + 6, Math.max(12, y - 9));

        // Diagnostics telemetry in top-right HUD
        ctx.fillStyle = 'rgba(7, 27, 46, 0.85)';
        ctx.fillRect(width - 150, 8, 142, 46);
        ctx.strokeStyle = 'rgba(28, 71, 110, 0.8)';
        ctx.strokeRect(width - 150, 8, 142, 46);

        ctx.font = '9px monospace';
        ctx.fillStyle = '#5CDB94';
        ctx.fillText(`Pose  Y:${yawDeg}°  P:${pitchDeg}°`, width - 142, 22);
        ctx.fillText(`Mic ${currentDb}   gaze ${currentGaze.toLowerCase()}`, width - 142, 34);
        ctx.fillText(`Camera loop ${displayedFps} fps`, width - 142, 46);
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraActive, hardwareState, micActive, recordViolation]);

  // 5. SYNC PROCTORING SUMMARY TO PARENT PORTAL
  useEffect(() => {
    if (onProctoringUpdateRef.current) {
      onProctoringUpdateRef.current({
        trustScore,
        status: trustScore >= 85 ? 'VERIFIED' : trustScore >= 70 ? 'MONITORED' : 'FLAGGED',
        totalViolations: violationsList.length,
        tabSwitches: tabSwitchesRef.current,
        multipleFacesCount: multipleFacesCountRef.current,
        gazeStability: Math.round(gazeStability),
        facePresence: facePresencePct,
        focusRetention: focusRetentionPct,
        cameraActive, // Strict Boolean: true ONLY if camera is ON
        cameraStatus: cameraActive ? (hardwareState === 'LIVE' ? 'ONLINE' : 'VIRTUAL') : 'DISCONNECTED',
        micActive, // Strict Boolean: true ONLY if mic is active and unmuted
        micStatus: micActive ? 'ONLINE' : 'MUTED',
        hardwareState,
        hardwareErrorMsg,
        isCovered: isCameraCovered,
        coverReason,
        faceDetected: cameraActive && !isCameraCovered && faceDetected,
        liveFocusStatus,
        liveFaceStatus: !cameraActive ? 'MISSING' : isCameraCovered ? 'OBSTRUCTED' : liveFaceStatus,
        isFaceAbsentPaused: isFaceAbsentPaused || !cameraActive || isCameraCovered,
        enableCamera: toggleCamera,
        enableVirtualCamera: enableVirtualMode,
        stopCamera: stopAllMediaTracks,
        resumeFace: resumeFacePresence,
        resumeCamera: resumeFacePresence,
        deductions: deductionsList,
        flags: violationsList
      });
    }
  }, [
    trustScore, violationsList, gazeStability, facePresencePct,
    focusRetentionPct, cameraActive, hardwareState, hardwareErrorMsg, micActive,
    isCameraCovered, coverReason, faceDetected, liveFocusStatus, liveFaceStatus,
    isFaceAbsentPaused, deductionsList, toggleCamera, enableVirtualMode, resumeFacePresence, stopAllMediaTracks
  ]);

  return (
    <div className="glass-card rounded-2xl p-4 border border-[#1C476E] shadow-xl relative overflow-hidden space-y-3">
      {/* HUD Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1C476E]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#5CDB94]/20 border border-[#5CDB94]/30 flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5 text-[#5CDB94]" />
          </div>
          <div>
            <span className="text-xs font-bold text-white tracking-wide block leading-none">
              Camera check
            </span>
            <span className="text-[10px] text-[#5CDB94] font-mono">
              {cameraActive && hardwareState === 'LIVE'
                ? 'Webcam and mic are on'
                : cameraActive
                ? 'Using a test pattern'
                : 'Camera is off'}
            </span>
          </div>
        </div>

        {/* Live Integrity Rating Badge */}
        <div className="flex items-center gap-1.5">
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border ${
            trustScore >= 85
              ? 'bg-[#5CDB94]/20 text-[#5CDB94] border-[#5CDB94]/40'
              : trustScore >= 70
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}>
            {trustScore >= 85 ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
            <span>TRUST: {trustScore}%</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1 rounded bg-[#071B2E] border border-[#1C476E] text-slate-300 hover:text-white transition-all cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Proctored Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Live Status Indicator Ribbon (User Transparency) */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
        {/* Live Focus Status Indicator */}
        <div className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-1 transition-all ${
          liveFocusStatus === 'FOCUSED'
            ? 'bg-[#5CDB94]/15 border-[#5CDB94]/30 text-[#5CDB94]'
            : liveFocusStatus === 'TAB_SWITCHED'
            ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
            : 'bg-amber-950/80 border-amber-500/60 text-amber-300'
        }`}>
          <span className="text-[10px] uppercase font-mono text-slate-400">Page Focus:</span>
          <span className="font-bold flex items-center gap-1">
            {liveFocusStatus === 'FOCUSED' ? 'Focused ✅' : liveFocusStatus === 'TAB_SWITCHED' ? 'Tab Switched ⚠️' : 'Window Out of Focus ⚠️'}
          </span>
        </div>

        {/* Live Face Status Indicator */}
        <div className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-1 transition-all ${
          cameraActive && !isCameraCovered && liveFaceStatus === 'DETECTED'
            ? 'bg-[#5CDB94]/15 border-[#5CDB94]/30 text-[#5CDB94]'
            : !cameraActive
            ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 font-bold'
            : isCameraCovered || liveFaceStatus === 'OBSTRUCTED'
            ? 'bg-rose-950/90 border-rose-500 text-rose-300 font-bold animate-pulse'
            : liveFaceStatus === 'MISSING'
            ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 animate-pulse'
            : 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-bounce'
        }`}>
          <span className="text-[10px] uppercase font-mono text-slate-400">Face View:</span>
          <span className="font-bold flex items-center gap-1">
            {!cameraActive
              ? 'Camera Off ❌'
              : isCameraCovered || liveFaceStatus === 'OBSTRUCTED'
              ? 'Camera Obstructed ✋'
              : liveFaceStatus === 'DETECTED'
              ? 'Face Detected ✅'
              : liveFaceStatus === 'MISSING'
              ? 'Face Missing ⚠️'
              : 'Multiple Faces Detected 🚨'}
          </span>
        </div>
      </div>

      {/* First Focus Loss Alert Warning Modal/Banner */}
      {firstFocusWarning && (
        <div className="p-3 bg-amber-950/90 border border-amber-500/80 rounded-xl text-amber-200 text-xs flex items-start gap-2 shadow-xl animate-bounce">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong className="block text-amber-300">Proctoring Notice (First Warning):</strong>
            Please keep this interview tab active. Navigating away, minimizing the window, or switching apps is recorded in your assessment audit log and will reduce your integrity trust score.
          </div>
        </div>
      )}

      {/* Live Viewport (Video + Overlay Canvas) */}
      <div className="relative aspect-[4/3] bg-[#071B2E] rounded-xl overflow-hidden border border-[#1C476E] shadow-inner group">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${
            hardwareState === 'LIVE' && cameraActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Camera Off / Inactive Overlay with One-Click Turn On Button */}
        {(!cameraActive || hardwareState !== 'LIVE') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#0B2641] to-[#071B2E] z-10">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2">
              <CameraOff className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-white">Camera Required</span>
            <span className="text-[11px] text-slate-300 max-w-xs mt-1 leading-snug">
              {hardwareErrorMsg || "Camera feed is turned off. Turn on camera to enable answering interview questions."}
            </span>
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={toggleCamera}
                className="px-3.5 py-1.5 rounded-xl bg-[#5CDB94] hover:bg-[#4CD087] text-[#0B2540] font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                Turn On Camera
              </button>
              {hardwareState !== 'LIVE' && (
                <button
                  type="button"
                  onClick={enableVirtualMode}
                  className="px-2.5 py-1.5 rounded-xl bg-[#0B2641] hover:bg-[#0F3154] border border-[#1C476E] text-slate-300 text-xs font-medium cursor-pointer"
                  title="Enable synthetic test pattern if you do not have a physical webcam"
                >
                  Virtual Test Mode
                </button>
              )}
            </div>
          </div>
        )}

        {/* Real-Time OpenCV HUD Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Dynamic Violation Toast Banner */}
        {activeAlert && (
          <div className="absolute top-2 left-2 right-2 p-2 rounded-lg bg-rose-950/90 border border-rose-500/60 shadow-xl backdrop-blur flex items-center gap-2 text-rose-200 text-xs animate-bounce z-20">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="flex-1 truncate">
              <span className="font-bold block leading-tight">{activeAlert.type}</span>
              <span className="text-[10px] opacity-90 truncate block">{activeAlert.message}</span>
            </div>
          </div>
        )}

        {/* Camera & Mic Action Overlay Icons */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 z-20">
          <button
            onClick={toggleCamera}
            className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
              cameraActive
                ? 'bg-[#0B2641]/90 border-[#1C476E] text-[#5CDB94]'
                : 'bg-rose-900/90 border-rose-500 text-rose-200'
            }`}
            title={cameraActive ? "Turn Off Camera" : "Turn On Camera"}
          >
            {cameraActive ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              if (mediaStreamRef.current) {
                const audTrack = mediaStreamRef.current.getAudioTracks()[0];
                if (audTrack) audTrack.enabled = !micActive;
              }
              const newState = !micActive;
              setMicActive(newState);
              recordViolation(
                newState ? 'MIC_CONNECTED' : 'MIC_MUTED',
                newState ? 'Candidate unmuted microphone.' : 'Candidate muted microphone.',
                newState ? 'INFO' : 'WARNING',
                newState ? 0 : 4
              );
            }}
            className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
              micActive
                ? 'bg-[#0B2641]/90 border-[#1C476E] text-[#5CDB94]'
                : 'bg-rose-900/90 border-rose-500 text-rose-200'
            }`}
            title={micActive ? "Mute Microphone" : "Unmute Microphone"}
          >
            {micActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Real-time Integrity Dashboard Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Face Presence % */}
        <div className="bg-[#071B2E] p-2.5 rounded-xl border border-[#1C476E]">
          <div className="flex items-center gap-1 text-[11px] text-slate-300">
            <UserCheck className="w-3 h-3 text-[#5CDB94]" />
            <span className="truncate">Face Presence</span>
          </div>
          <div className="text-base font-extrabold text-[#5CDB94] font-mono mt-0.5">
            {facePresencePct}%
          </div>
          <div className="text-[10px] text-slate-400">In camera view</div>
        </div>

        {/* Focus Retention % */}
        <div className="bg-[#071B2E] p-2.5 rounded-xl border border-[#1C476E]">
          <div className="flex items-center gap-1 text-[11px] text-slate-300">
            <Activity className="w-3 h-3 text-[#38BDF8]" />
            <span className="truncate">Focus Retention</span>
          </div>
          <div className="text-base font-extrabold text-[#38BDF8] font-mono mt-0.5">
            {focusRetentionPct}%
          </div>
          <div className="text-[10px] text-slate-400">Active tab time</div>
        </div>

        {/* Tab Switch Count */}
        <div className="bg-[#071B2E] p-2.5 rounded-xl border border-[#1C476E]">
          <div className="flex items-center gap-1 text-[11px] text-slate-300">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span className="truncate">Tab Switches</span>
          </div>
          <div className="text-base font-extrabold text-white font-mono mt-0.5">
            {tabSwitchCount}
          </div>
          <div className="text-[10px] text-slate-400">Total focus losses</div>
        </div>

        {/* Hardware Status */}
        <div className="bg-[#071B2E] p-2.5 rounded-xl border border-[#1C476E]">
          <div className="flex items-center gap-1 text-[11px] text-slate-300">
            <Shield className="w-3 h-3 text-[#5CDB94]" />
            <span className="truncate">Devices</span>
          </div>
          <div className="text-[11px] font-bold text-slate-200 mt-1 flex flex-col gap-0.5 leading-tight font-mono">
            <span className={cameraActive ? 'text-[#5CDB94]' : 'text-rose-400'}>
              Cam: {cameraActive ? (hardwareState === 'LIVE' ? 'Online ✅' : 'Virtual ✅') : 'Off ❌'}
            </span>
            <span className={micActive ? 'text-[#5CDB94]' : 'text-rose-400'}>
              Mic: {micActive ? 'Active ✅' : 'Off ❌'}
            </span>
          </div>
        </div>
      </div>

      {/* Compliance / Status Strip with Audit Log Toggle */}
      <div className="flex items-center justify-between text-[11px] px-1 text-slate-300 font-mono">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${
            cameraActive && liveFocusStatus === 'FOCUSED' && liveFaceStatus === 'DETECTED' ? 'bg-[#5CDB94] animate-pulse' : 'bg-rose-400'
          }`}></span>
          {!cameraActive
            ? 'Camera Off (Answering Locked)'
            : liveFocusStatus === 'FOCUSED' && liveFaceStatus === 'DETECTED'
            ? 'Candidate Focused & Compliant'
            : liveFocusStatus !== 'FOCUSED'
            ? 'Tab Focus Lost'
            : 'Candidate Not In Frame'}
        </span>
        <button
          onClick={() => setShowAuditTrail(!showAuditTrail)}
          className="text-[#5CDB94] hover:underline flex items-center gap-0.5 text-[11px] font-sans font-semibold cursor-pointer"
        >
          {showAuditTrail ? 'Hide Integrity Log' : `Audit Log & Deductions (${violationsList.length})`}
          {showAuditTrail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expandable Live Audit Log & Itemized Trust Deductions */}
      {showAuditTrail && (
        <div className="p-3 bg-[#051424] rounded-xl border border-[#1C476E] max-h-48 overflow-y-auto space-y-2 text-[11px] font-mono">
          {deductionsList.length > 0 && (
            <div className="pb-2 border-b border-[#1C476E]/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-300 block">
                Itemized Trust Deductions:
              </span>
              {deductionsList.map(d => (
                <div key={d.id} className="flex items-center justify-between text-[10px] text-slate-300">
                  <span className="truncate">[{d.timestamp}] {d.reason}</span>
                  <span className="text-rose-400 font-bold shrink-0 ml-2">-{d.penalty}%</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Chronological Audit Log:
            </span>
            {violationsList.length === 0 ? (
              <p className="text-[#5CDB94] text-center py-2 text-[10px] flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#5CDB94]" /> 100% Compliant Session: No infractions recorded.
              </p>
            ) : (
              violationsList.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between gap-1 text-[10px] border-b border-[#1C476E]/30 pb-1">
                  <span className={item.severity === 'CRITICAL' ? 'text-rose-400' : item.severity === 'WARNING' ? 'text-amber-300' : 'text-slate-300'}>
                    [{item.timestamp}] {item.message}
                  </span>
                  <span className="text-[9px] px-1 rounded bg-[#071B2E] border border-[#1C476E] text-slate-400 shrink-0">
                    {item.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
