/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  X, 
  Check, 
  Award, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  BookOpen, 
  Clock, 
  Brain, 
  Flame, 
  Smile, 
  AlertCircle, 
  Maximize2, 
  Minimize2, 
  Star,
  Target,
  CheckCircle2,
  Hourglass,
  Sliders,
  Music,
  Wind,
  Tv,
  Video,
  ShieldCheck,
  Smartphone,
  Eye,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlannerActivity, Subject } from '../types';
import { saveFocusSessionLog } from '../utils/focusStatsStore';

interface FocusModeContainerProps {
  activity: PlannerActivity | null;
  subjects: Subject[];
  onClose: () => void;
  onComplete: (sessionDetails: {
    activityId?: string;
    subjectId: string;
    durationMinutes: number;
    completionStatus: 'yes' | 'partially' | 'no';
    difficulty: number;
    stage: string;
    lessonName?: string;
    notes?: string;
    focusBlocksCount: number;
    totalBreakTimeMinutes: number;
    focusScore?: number;
    interruptionsCount?: number;
    totalDistractionSeconds?: number;
    longestUninterruptedSeconds?: number;
  }) => void;
}

// Global Audio Engine Instance (lazy-initialized to obey user click gestures)
class FocusSoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private lofiInterval: any = null;
  private isLofiPlaying: boolean = false;
  private lofiGain: GainNode | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playWhiteNoise() {
    this.init();
    if (!this.ctx) return;
    this.stopNoise();

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.015, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    this.noiseNode.connect(filter);
    filter.connect(this.noiseGain);
    this.noiseGain.connect(this.ctx.destination);
    this.noiseNode.start();
  }

  playRain() {
    this.init();
    if (!this.ctx) return;
    this.stopNoise();

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.018, this.ctx.currentTime);

    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.setValueAtTime(400, this.ctx.currentTime);

    this.noiseNode.connect(this.rainFilter);
    this.rainFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.ctx.destination);
    this.noiseNode.start();

    let time = 0;
    const interval = setInterval(() => {
      if (!this.noiseNode || !this.rainFilter || !this.ctx) {
        clearInterval(interval);
        return;
      }
      const freq = 320 + Math.sin(time) * 70 + Math.random() * 20;
      this.rainFilter.frequency.setValueAtTime(freq, this.ctx.currentTime);
      time += 0.2;
    }, 200);
  }

  stopNoise() {
    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch (e) {}
      this.noiseNode = null;
    }
    this.rainFilter = null;
  }

  playLofi() {
    this.init();
    if (!this.ctx) return;
    this.stopLofi();

    this.isLofiPlaying = true;
    this.lofiGain = this.ctx.createGain();
    this.lofiGain.gain.setValueAtTime(0.035, this.ctx.currentTime);
    this.lofiGain.connect(this.ctx.destination);

    const chords = [
      [220.00, 261.63, 329.63, 392.00, 493.88], // Am9
      [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
      [196.00, 246.94, 293.66, 349.23, 392.00], // G13
      [130.81, 164.81, 196.00, 246.94, 293.66]  // Cmaj9
    ];

    let chordIdx = 0;
    const playNextBeat = () => {
      if (!this.isLofiPlaying || !this.ctx) return;
      const currentChord = chords[chordIdx];
      chordIdx = (chordIdx + 1) % chords.length;

      currentChord.forEach((freq, idx) => {
        if (!this.ctx || !this.lofiGain) return;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.18);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(550, this.ctx.currentTime);

        gainNode.gain.setValueAtTime(0, this.ctx.currentTime + idx * 0.18);
        gainNode.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + idx * 0.18 + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + idx * 0.18 + 3.8);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.lofiGain);

        osc.start(this.ctx.currentTime + idx * 0.18);
        osc.stop(this.ctx.currentTime + idx * 0.18 + 4.2);
      });
    };

    playNextBeat();
    this.lofiInterval = setInterval(playNextBeat, 6000);
  }

  stopLofi() {
    this.isLofiPlaying = false;
    if (this.lofiInterval) {
      clearInterval(this.lofiInterval);
      this.lofiInterval = null;
    }
    if (this.lofiGain) {
      this.lofiGain.disconnect();
      this.lofiGain = null;
    }
  }

  playBeep(type: 'study_end' | 'break_end') {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      if (type === 'study_end') {
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.12); // E5
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      } else {
        osc.frequency.setValueAtTime(392.00, this.ctx.currentTime); // G4
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime + 0.12); // C5
        osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.24); // E5
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
      }
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.5);
    } catch (e) {
      console.warn("AudioContext notification sound error:", e);
    }
  }

  stopAll() {
    this.stopNoise();
    this.stopLofi();
  }
}

const audioEngine = new FocusSoundEngine();

export default function FocusModeContainer({ 
  activity, 
  subjects, 
  onClose, 
  onComplete 
}: FocusModeContainerProps) {
  
  // 1. Initial State & Configuration Loading
  const currentSubject = useMemo(() => {
    if (activity?.subjectId) {
      return subjects.find(s => s.id === activity.subjectId) || null;
    }
    return subjects[0] || null;
  }, [activity, subjects]);

  const currentStageName = useMemo(() => {
    if (activity) {
      return activity.currentStage || activity.category;
    }
    return 'Lesson'; // Default fallback stage
  }, [activity]);

  // Stage Translation to Arabic Display
  const stageDisplayArabic = (stageStr: string) => {
    switch (stageStr) {
      case 'Lesson':
      case 'Study':
        return 'حضور وحسم الحصة / الدرس 📚';
      case 'Class Sheet':
      case 'Assignment':
        return 'حل ورقة العمل / التطبيقات ✍️';
      case 'Homework':
        return 'حل الواجب المدرسي والمسائل 📝';
      case 'Review':
      case 'Revision':
        return 'مراجعة التكرار المتباعد والتثبيت 🧠';
      case 'Active Recall':
        return 'جلسة استدعاء نشط وتسميع 🎙️';
      default:
        return stageStr;
    }
  };

  // Phase Control
  const [phase, setPhase] = useState<'setup' | 'focus' | 'reflection' | 'celebration'>('setup');

  // Setup options
  const [sessionGoal, setSessionGoal] = useState<string>(activity?.todayGoal || '');
  const [learnedLessonTitle, setLearnedLessonTitle] = useState<string>(activity?.title || activity?.todayGoal || '');
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'pomodoro'>('stopwatch');
  const [sessionLengthHours, setSessionLengthHours] = useState<number>(2); // Default 2 hours
  const [focusStyle, setFocusStyle] = useState<'classic' | 'deep_work' | 'ultra_focus' | 'custom'>(() => {
    return (localStorage.getItem('focus_style_preference') as any) || 'classic';
  });

  // Custom study timer presets
  const [customStudyMinutes, setCustomStudyMinutes] = useState<number>(30);
  const [customShortBreakMinutes, setCustomShortBreakMinutes] = useState<number>(5);
  const [customLongBreakMinutes, setCustomLongBreakMinutes] = useState<number>(15);
  const [customLongBreakEvery, setCustomLongBreakEvery] = useState<number>(4);

  // Sound & distraction toggles
  const [activeSoundBg, setActiveSoundBg] = useState<'none' | 'white' | 'rain' | 'lofi'>('none');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [fullscreenDeniedBanner, setFullscreenDeniedBanner] = useState<boolean>(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState<boolean>(false);

  // Focus core timer state
  const [totalPlannedSeconds, setTotalPlannedSeconds] = useState<number>(0);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState<number>(0);
  const [timeLeftInBlock, setTimeLeftInBlock] = useState<number>(0);
  const [blockDurationSeconds, setBlockDurationSeconds] = useState<number>(0);
  const [currentBlockType, setCurrentBlockType] = useState<'study' | 'break' | 'long_break'>('study');
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const lastTickTimeRef = useRef<number>(Date.now());

  // V12.5 Interruption & Anti-Distraction Stats
  const [interruptionsCount, setInterruptionsCount] = useState<number>(0);
  const [totalDistractionSeconds, setTotalDistractionSeconds] = useState<number>(0);
  const [interruptionStartTime, setInterruptionStartTime] = useState<number | null>(null);
  const [showInterruptionModal, setShowInterruptionModal] = useState<boolean>(false);
  const [lastInterruptionDuration, setLastInterruptionDuration] = useState<number>(0);
  const [longestUninterruptedSeconds, setLongestUninterruptedSeconds] = useState<number>(0);
  const [currentUninterruptedSeconds, setCurrentUninterruptedSeconds] = useState<number>(0);

  // Screen Wake Lock API reference
  const wakeLockRef = useRef<any>(null);

  // Statistics trackers
  const [completedStudyBlocks, setCompletedStudyBlocks] = useState<number>(0);
  const [completedBreakBlocks, setCompletedBreakBlocks] = useState<number>(0);
  const [totalBreakMinutes, setTotalBreakMinutes] = useState<number>(0);

  // Dynamic status notifications
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  // Reflection states (V12.3 Intelligent Session Completion)
  const [actualMinutesStudied, setActualMinutesStudied] = useState<number>(0);
  const [taskCompletion, setTaskCompletion] = useState<'yes' | 'partially' | 'no'>('yes');
  const [partiallyPercent, setPartiallyPercent] = useState<number>(50);
  const [incompleteReason, setIncompleteReason] = useState<string>('ضيق الوقت');
  const [perceivedDifficulty, setPerceivedDifficulty] = useState<number>(3);
  const [reflectionNotes, setReflectionNotes] = useState<string>('');

  // Timer reference to avoid drift
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Screen Wake Lock Handlers
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {
      console.log('Screen Wake Lock unavailable or denied:', err);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {}
      wakeLockRef.current = null;
    }
  };

  // Fullscreen Request Handler
  const requestFullscreenMode = async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
        setIsFullScreen(true);
        setFullscreenDeniedBanner(false);
      } else if ((docEl as any).webkitRequestFullscreen) {
        await (docEl as any).webkitRequestFullscreen();
        setIsFullScreen(true);
        setFullscreenDeniedBanner(false);
      }
    } catch (err) {
      console.warn('Fullscreen request denied by user or environment:', err);
      setFullscreenDeniedBanner(true);
    }
  };

  // 2. Initialize setup options based on selected focus style
  const studyTimerConfig = useMemo(() => {
    switch (focusStyle) {
      case 'deep_work':
        return { study: 50, short: 10, long: 20, cycle: 3 };
      case 'ultra_focus':
        return { study: 90, short: 20, long: 30, cycle: 2 };
      case 'custom':
        return { study: customStudyMinutes, short: customShortBreakMinutes, long: customLongBreakMinutes, cycle: customLongBreakEvery };
      case 'classic':
      default:
        return { study: 25, short: 5, long: 15, cycle: 4 };
    }
  }, [focusStyle, customStudyMinutes, customShortBreakMinutes, customLongBreakMinutes, customLongBreakEvery]);

  // Save focus style preference
  useEffect(() => {
    localStorage.setItem('focus_style_preference', focusStyle);
  }, [focusStyle]);

  // Prevent accidental exit during study (beforeunload API)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase === 'focus' && isRunning) {
        e.preventDefault();
        e.returnValue = 'أنت تدرس حالياً. مغادرتك الآن ستوقف جلسة المذاكرة مؤقتاً. هل تريد الاستمرار؟';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [phase, isRunning]);

  // Screen Visibility & Tab Switching Listener (Auto Pause & Interruption Recording)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (phase === 'focus') {
        if (document.hidden) {
          if (isRunning) {
            setIsRunning(false);
            const now = Date.now();
            setInterruptionStartTime(now);
            setInterruptionsCount(prev => prev + 1);
            setCurrentUninterruptedSeconds(0);
            releaseWakeLock();
          }
        } else {
          // User returned to browser tab
          if (interruptionStartTime) {
            const now = Date.now();
            const distractionSec = Math.max(1, Math.round((now - interruptionStartTime) / 1000));
            setTotalDistractionSeconds(prev => prev + distractionSec);
            setLastInterruptionDuration(distractionSec);
            setInterruptionStartTime(null);
            setShowInterruptionModal(true);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [phase, isRunning, interruptionStartTime]);

  // 3. Setup focus session start
  const handleStartSession = async () => {
    audioEngine.init(); // Unlock AudioContext

    const totalSeconds = sessionLengthHours * 3600;
    setTotalPlannedSeconds(totalSeconds);
    setTotalElapsedSeconds(0);

    const studySeconds = studyTimerConfig.study * 60;
    setBlockDurationSeconds(studySeconds);
    setTimeLeftInBlock(studySeconds);
    setCurrentBlockType('study');
    setCurrentBlockIndex(1);

    setCompletedStudyBlocks(0);
    setCompletedBreakBlocks(0);
    setTotalBreakMinutes(0);

    // Reset Interruption Statistics
    setInterruptionsCount(0);
    setTotalDistractionSeconds(0);
    setLongestUninterruptedSeconds(0);
    setCurrentUninterruptedSeconds(0);
    setInterruptionStartTime(null);

    setPhase('focus');
    setIsRunning(true);
    setNotificationMsg('⚡ بالتوفيق! تم الدخول في بيئة التركيز العميق الخالية من المشتتات.');

    // Fullscreen Request
    await requestFullscreenMode();

    // Acquire Screen Wake Lock
    await requestWakeLock();

    // Native App Bridge Event Dispatching (For future Android/iOS native wrappers)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('NATIVE_FOCUS_MODE_CHANGE', {
        detail: {
          active: true,
          subjectName: currentSubject?.name,
          stage: currentStageName,
          plannedHours: sessionLengthHours
        }
      }));
    }
  };

  // 4. Background Sound Effects Player
  useEffect(() => {
    if (phase === 'focus' && isRunning) {
      if (activeSoundBg === 'white') {
        audioEngine.playWhiteNoise();
      } else if (activeSoundBg === 'rain') {
        audioEngine.playRain();
      } else if (activeSoundBg === 'lofi') {
        audioEngine.playLofi();
      } else {
        audioEngine.stopNoise();
        audioEngine.stopLofi();
      }
    } else {
      audioEngine.stopAll();
    }

    return () => {
      audioEngine.stopAll();
    };
  }, [activeSoundBg, phase, isRunning]);

  // 5. Grand Timer Core Logic (Interval Loop with Drift & Background Protection)
  useEffect(() => {
    if (phase === 'focus' && isRunning) {
      lastTickTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.max(1, Math.min(60, Math.round((now - lastTickTimeRef.current) / 1000)));
        lastTickTimeRef.current = now;
        
        // Track continuous uninterrupted focus duration
        if (currentBlockType === 'study') {
          setCurrentUninterruptedSeconds((prev) => {
            const next = prev + deltaSeconds;
            setLongestUninterruptedSeconds((longest) => Math.max(longest, next));
            return next;
          });
        }

        // Decrement remaining seconds of current block
        setTimeLeftInBlock((prevTime) => {
          if (prevTime <= deltaSeconds) {
            // Block completed - trigger transition
            handleBlockTransition();
            return 0;
          }
          return prevTime - deltaSeconds;
        });

        // Increment total session elapsed seconds with safety cap (max planned or 8h limit)
        setTotalElapsedSeconds((prevElapsed) => {
          const nextElapsed = prevElapsed + deltaSeconds;
          // Runaway session safety guard: cap at 8 hours (28800s) or totalPlannedSeconds
          const hardLimit = Math.max(totalPlannedSeconds, 28800);
          if (nextElapsed >= totalPlannedSeconds && totalPlannedSeconds > 0) {
            // Entire planned study session finished automatically!
            if (timerRef.current) clearInterval(timerRef.current);
            handleSessionCompletedSuccessfully();
            return totalPlannedSeconds;
          } else if (nextElapsed >= hardLimit) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleSessionCompletedSuccessfully();
            return hardLimit;
          }
          return nextElapsed;
        });

      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase, isRunning, currentBlockType, currentBlockIndex, totalPlannedSeconds, studyTimerConfig]);

  // 6. Handle automatic transitions between study & break blocks
  const handleBlockTransition = () => {
    if (currentBlockType === 'study') {
      // Study block ended -> start break
      const nextStudyCount = completedStudyBlocks + 1;
      setCompletedStudyBlocks(nextStudyCount);

      // Determine if long break is due
      const isLongBreakDue = nextStudyCount % studyTimerConfig.cycle === 0;
      const breakType = isLongBreakDue ? 'long_break' : 'break';
      const breakMins = isLongBreakDue ? studyTimerConfig.long : studyTimerConfig.short;
      
      setCurrentBlockType(breakType);
      setBlockDurationSeconds(breakMins * 60);
      setTimeLeftInBlock(breakMins * 60);
      
      setNotificationMsg(`✅ عمل رائع! حان وقت استراحة مدتها ${breakMins} دقائق لتجديد نشاطك العصبي.`);
      audioEngine.playBeep('study_end');

    } else {
      // Break block ended -> start next study block
      const breakMins = currentBlockType === 'long_break' ? studyTimerConfig.long : studyTimerConfig.short;
      setTotalBreakMinutes((prev) => prev + breakMins);
      setCompletedBreakBlocks((prev) => prev + 1);

      setCurrentBlockType('study');
      setCurrentBlockIndex((prev) => prev + 1);
      setBlockDurationSeconds(studyTimerConfig.study * 60);
      setTimeLeftInBlock(studyTimerConfig.study * 60);

      setNotificationMsg('🧠 انتهت الاستراحة. العودة للتركيز والمذاكرة بهمة عالية!');
      audioEngine.playBeep('break_end');
    }
  };

  // 7. Session ends automatically
  const handleSessionCompletedSuccessfully = () => {
    setIsRunning(false);
    releaseWakeLock();
    audioEngine.stopAll();
    audioEngine.playBeep('break_end');
    
    // Auto-fill reflection suggestions
    const totalMinutesStudied = Math.round(totalPlannedSeconds / 60);
    setActualMinutesStudied(totalMinutesStudied);
    setPhase('reflection');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('NATIVE_FOCUS_MODE_CHANGE', { detail: { active: false } }));
    }
  };

  // Skip Break manually
  const handleSkipBreak = () => {
    if (currentBlockType === 'break' || currentBlockType === 'long_break') {
      const breakMins = currentBlockType === 'long_break' ? studyTimerConfig.long : studyTimerConfig.short;
      setTotalBreakMinutes((prev) => prev + breakMins);
      setCompletedBreakBlocks((prev) => prev + 1);

      setCurrentBlockType('study');
      setCurrentBlockIndex((prev) => prev + 1);
      setBlockDurationSeconds(studyTimerConfig.study * 60);
      setTimeLeftInBlock(studyTimerConfig.study * 60);

      setNotificationMsg('🧠 تم تخطي الاستراحة. لنبدأ جولة التركيز التالية مباشرة!');
      audioEngine.playBeep('break_end');
    }
  };

  // Force Quit / End Session manually
  const handleForceEndSession = () => {
    setIsRunning(false);
    releaseWakeLock();
    audioEngine.stopAll();
    
    // Suggest actual study minutes elapsed so far
    const actualElapsedMins = Math.round(totalElapsedSeconds / 60);
    setActualMinutesStudied(actualElapsedMins || 1); // fallback min 1 min
    setPhase('reflection');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('NATIVE_FOCUS_MODE_CHANGE', { detail: { active: false } }));
    }
  };

  // Close Button Clicked during active study
  const handleAttemptClose = () => {
    if (phase === 'focus') {
      if (totalElapsedSeconds >= 30) {
        setIsRunning(false);
        setShowExitConfirmModal(true);
      } else {
        releaseWakeLock();
        audioEngine.stopAll();
        onClose();
      }
    } else if (phase === 'reflection' || phase === 'celebration') {
      handleFinishEverything();
    } else {
      releaseWakeLock();
      audioEngine.stopAll();
      onClose();
    }
  };

  // Calculate Focus Score (0 - 100)
  const calculatedFocusScore = useMemo(() => {
    if (totalElapsedSeconds < 30) return 100;
    const interruptionPenalty = Math.min(40, interruptionsCount * 10);
    const totalDuration = totalElapsedSeconds + totalDistractionSeconds;
    const distractionRatio = totalDuration > 0 ? (totalDistractionSeconds / totalDuration) : 0;
    const distractionPenalty = Math.min(30, Math.round(distractionRatio * 100));

    const score = Math.max(0, Math.min(100, 100 - interruptionPenalty - distractionPenalty));
    return Math.round(score);
  }, [totalElapsedSeconds, totalDistractionSeconds, interruptionsCount]);

  const focusRatingObj = useMemo(() => {
    if (calculatedFocusScore >= 85) {
      return {
        title: 'تركيز ممتاز 🌟',
        badgeClass: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
        desc: 'أداء عالي الأثر مع انعدام شبه تام للمشتتات والقطوعات!'
      };
    } else if (calculatedFocusScore >= 70) {
      return {
        title: 'تركيز جيد 👍',
        badgeClass: 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300',
        desc: 'أداء متوازن ومجهود دراسي طيب رغم وجود انقطاعات بسيطة.'
      };
    } else {
      return {
        title: 'يحتاج تحسين 💪',
        badgeClass: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
        desc: 'تعددت التشتتات والانقطاعات. جرب تفعيل وضع عدم الإزعاج في الجلسة القادمة!'
      };
    }
  }, [calculatedFocusScore]);

  // 8. Submit Reflection questionnaire
  const handleSubmitReflection = () => {
    setPhase('celebration');
  };

  // Complete entire flow
  const handleFinishEverything = () => {
    // Save to persistent storage for weekly focus analytics
    saveFocusSessionLog({
      subjectName: currentSubject?.name || 'مذاكرة حرة',
      durationMinutes: actualMinutesStudied,
      interruptionsCount,
      totalDistractionSeconds,
      longestUninterruptedSeconds,
      focusScore: calculatedFocusScore,
      classification: focusRatingObj.title,
      wasCleanSession: interruptionsCount === 0
    });

    onComplete({
      activityId: activity?.id,
      subjectId: currentSubject?.id || '',
      durationMinutes: actualMinutesStudied,
      completionStatus: taskCompletion,
      difficulty: perceivedDifficulty,
      stage: currentStageName,
      lessonName: learnedLessonTitle.trim(),
      notes: reflectionNotes,
      focusBlocksCount: completedStudyBlocks,
      totalBreakTimeMinutes: totalBreakMinutes,
      focusScore: calculatedFocusScore,
      interruptionsCount,
      totalDistractionSeconds,
      longestUninterruptedSeconds
    });
  };

  // Helper formatting values
  const formatTimeMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Display estimated finish local time
  const estimatedFinishTimeStr = useMemo(() => {
    const remainingSeconds = totalPlannedSeconds - totalElapsedSeconds;
    const finishDate = new Date(Date.now() + remainingSeconds * 1000);
    return finishDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  }, [totalPlannedSeconds, totalElapsedSeconds]);

  // Progress calculations
  const totalSessionProgressPercent = (totalElapsedSeconds / totalPlannedSeconds) * 100 || 0;
  const currentBlockProgressPercent = ((blockDurationSeconds - timeLeftInBlock) / blockDurationSeconds) * 100 || 0;

  // Custom visual block indicator (████████░░)
  const blockProgressBarVisual = useMemo(() => {
    const barsCount = 10;
    const filledCount = Math.min(barsCount, Math.round((totalSessionProgressPercent / 100) * barsCount));
    return '█'.repeat(filledCount) + '░'.repeat(barsCount - filledCount);
  }, [totalSessionProgressPercent]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100 overflow-y-auto select-none ${
        isFullScreen ? 'p-0' : 'p-4 md:p-8'
      }`}
      style={{ direction: 'rtl' }}
    >
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-between py-6 px-4 md:px-8">
        
        {/* Upper Minimalist Navigation Bar */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-900 text-indigo-400 border border-zinc-800 flex items-center justify-center">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>بيئة التركيز العميق V12.5</span>
                <span className="bg-indigo-950 text-indigo-400 text-[9px] px-2 py-0.5 rounded-full border border-indigo-900 font-mono">Anti-Distraction</span>
              </h2>
              <p className="text-[10px] text-zinc-500 font-semibold">مساحة مذاكرة مغلقة لحجب المشتتات وحساب الانقطاعات بدقة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!isFullScreen) {
                  requestFullscreenMode();
                } else {
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                  }
                  setIsFullScreen(false);
                }
              }}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="ملء الشاشة لتقليل التشتت"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            
            {phase !== 'celebration' && (
              <button
                onClick={handleAttemptClose}
                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                title="خروج من جلسة التركيز"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Fullscreen Denied Soft Banner */}
        {fullscreenDeniedBanner && phase === 'focus' && (
          <div className="mb-4 p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-2xl flex items-center justify-between text-xs text-indigo-300">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>للحصول على أفضل تجربة تركيز، يرجى تفعيل وضع الشاشة الكاملة.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={requestFullscreenMode}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
              >
                تفعيل الآن
              </button>
              <button
                onClick={() => setFullscreenDeniedBanner(false)}
                className="text-zinc-500 hover:text-zinc-300 text-[10px]"
              >
                تجاهل
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Inner Layout Screen */}
        <div className="flex-1 flex flex-col justify-center items-center">
          
          <AnimatePresence mode="wait">
            
            {/* 1. SETUP PHASE SCREEN */}
            {phase === 'setup' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full max-w-xl bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 md:p-8 text-right space-y-6 shadow-2xl"
              >
                <div className="text-center space-y-2">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-indigo-400">تجهيز جلسة المذاكرة والتركيز</span>
                  <h3 className="text-xl font-extrabold text-white">ما هو هدفك المحدد لهذه الجلسة؟ 🎯</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    لا يهم كم من الوقت ستستغرق، المهم هو التركيز حتى إنجاز الهدف بالكامل!
                  </p>
                </div>

                {/* Info Card Loaded */}
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold block">مادة المذاكرة والمرحلة:</span>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentSubject?.color || '#cbd5e1' }} />
                      <span>{currentSubject?.name || 'مذاكرة حرة'}</span>
                    </h4>
                    <p className="text-xs text-indigo-400 font-semibold">{stageDisplayArabic(currentStageName)}</p>
                  </div>
                </div>

                {/* Primary Question: Goal Input */}
                <div className="space-y-3 bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <span>اكتب هدفك لهذه الجلسة الدراسية:</span>
                  </label>

                  <input
                    type="text"
                    value={sessionGoal}
                    onChange={(e) => setSessionGoal(e.target.value)}
                    placeholder="مثال: إنهاء مشاهدة وتلخيص المحاضرة، حل 25 سؤال واجب..."
                    className="w-full p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />

                  {/* Suggested Quick Goal Chips */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-zinc-500 font-bold block">اقتراحات سريعة للهدف:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "🎯 إنهاء مشاهدة وتلخيص المحاضرة بالكامل",
                        "✍️ حل جميع أسئلة الواجب بالكامل",
                        "📝 حل 25 سؤال بتركيز بدون توقف",
                        "🔄 مراجعة وتثبيت القوانين والأفكار الرئيسية",
                        "💡 فهم جميع نقاط الدرس المذكورة"
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSessionGoal(chip)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[10px] font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timer Type Selection (Stopwatch vs Pomodoro) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>طريقة حساب الوقت:</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTimerMode('stopwatch')}
                      className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                        timerMode === 'stopwatch'
                          ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xs font-black block text-indigo-300">⏳ عداد صاعد (Stopwatch)</span>
                      <span className="text-[10px] block mt-1 text-zinc-400">حساب الوقت المستغرق تصاعدياً حتى إنهاء الهدف بدون ضغط زمني</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTimerMode('pomodoro')}
                      className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                        timerMode === 'pomodoro'
                          ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xs font-black block text-indigo-300">⏱️ مؤقت بومودورو (Countdown)</span>
                      <span className="text-[10px] block mt-1 text-zinc-400">جلسات تركيز 25 دقيقة تنازلية مع فترات راحة قصيرة</span>
                    </button>
                  </div>
                </div>

                {/* Anti-Distraction Note */}
                <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تفعيل تلقائي لقفل الشاشة (Screen Wake Lock) وتتبع مغادرة اللوحة لضمان عدم إطفاء الشاشة أو تشتيت الانتباه.</span>
                </div>

                {/* Action Start Button */}
                <div className="pt-2">
                  <button
                    onClick={handleStartSession}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>بدء المذاكرة لحساب الوقت وتحقيق الهدف ▶️</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. FOCUS TIMER SCREEN (Clean Deep Focus Interface) */}
            {phase === 'focus' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center space-y-6"
              >
                
                {/* Active Session Minimalist Header */}
                <div className="text-center space-y-2 max-w-md w-full">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: currentSubject?.color || '#cbd5e1' }} />
                    <h3 className="text-xl md:text-2xl font-black text-white">{currentSubject?.name || 'مذاكرة حرة'}</h3>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-indigo-400 font-extrabold">
                      المرحلة: {stageDisplayArabic(currentStageName)}
                    </span>
                    <span className="text-xs px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-400 font-mono font-bold">
                      الجولة {currentBlockIndex}
                    </span>
                  </div>

                  {sessionGoal && (
                    <div className="p-3 bg-indigo-950/60 border border-indigo-800/60 rounded-2xl text-center space-y-0.5">
                      <span className="text-[10px] text-indigo-300 font-bold block">🎯 الهدف المحدد للجلسة:</span>
                      <p className="text-xs text-white font-extrabold leading-snug">{sessionGoal}</p>
                    </div>
                  )}
                </div>

                {/* Huge Immersive Rotating Timer Progress */}
                <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
                  
                  {/* Outer circle glowing trail */}
                  <div className={`absolute inset-0 rounded-full border border-dashed border-zinc-800 ${isRunning ? 'animate-spin [animation-duration:90s]' : ''}`} />
                  
                  {/* SVG circular track */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" r="44%" className="stroke-zinc-900" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="50%" cy="50%" r="44%"
                      className={`transition-all duration-1000 ${
                        currentBlockType === 'study' ? 'stroke-indigo-500' : 'stroke-emerald-500'
                      }`}
                      strokeWidth="10" fill="transparent"
                      strokeDasharray={2 * Math.PI * 120}
                      strokeDashoffset={2 * Math.PI * 120 * (1 - (Number(currentBlockProgressPercent) || 0) / 100)}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Inner Timer Text Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    
                    {/* Status badge */}
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border mb-2 flex items-center gap-1 ${
                      currentBlockType === 'study'
                        ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/50'
                        : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${currentBlockType === 'study' ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                      <span>{currentBlockType === 'study' ? 'تركيز دراسي عميق' : currentBlockType === 'long_break' ? 'راحة فسيولوجية مطولة' : 'استراحة قصيرة'}</span>
                    </span>

                    {/* Left Seconds Counter */}
                    <span className="text-5xl md:text-6xl font-mono font-black text-white tracking-tighter">
                      {formatTimeMinutes(timeLeftInBlock)}
                    </span>

                    {/* Progress bar visual block (████████░░) */}
                    <span className="text-indigo-400/80 text-[10px] tracking-widest font-mono mt-2 block">
                      {blockProgressBarVisual}
                    </span>

                    {/* Small remaining details */}
                    <span className="text-[10px] text-zinc-500 mt-1 font-semibold">
                      {completedStudyBlocks} مكتملة • استراحة كل {studyTimerConfig.cycle}
                    </span>
                  </div>
                </div>

                {/* Smart Stats Dashboard Strip */}
                <div className="w-full max-w-lg bg-zinc-900/40 border border-zinc-900 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-y md:divide-y-0 divide-zinc-800/60 rtl:divide-x-reverse">
                  
                  {/* Total elapsed */}
                  <div className="pt-2 md:pt-0">
                    <span className="text-[9px] text-zinc-500 font-extrabold block mb-0.5">منحنى المذاكرة الكلي</span>
                    <span className="text-xs font-mono font-black text-white">
                      {Math.floor(totalElapsedSeconds / 60)}د / {sessionLengthHours * 60}د
                    </span>
                  </div>

                  {/* Interruptions counter */}
                  <div className="pt-2 md:pt-0 pl-2">
                    <span className="text-[9px] text-zinc-500 font-extrabold block mb-0.5">الانقطاعات المكتشفة</span>
                    <span className={`text-xs font-mono font-black ${interruptionsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {interruptionsCount} انقطاع
                    </span>
                  </div>

                  {/* Total break time */}
                  <div className="pt-2 md:pt-0">
                    <span className="text-[9px] text-zinc-500 font-extrabold block mb-0.5">إجمالي الاستراحات</span>
                    <span className="text-xs font-mono font-black text-white">
                      {totalBreakMinutes} دقيقة
                    </span>
                  </div>

                  {/* Estimated end time */}
                  <div className="pt-2 md:pt-0">
                    <span className="text-[9px] text-zinc-500 font-extrabold block mb-0.5">الانتهاء المتوقع</span>
                    <span className="text-xs font-mono font-black text-indigo-400">
                      {estimatedFinishTimeStr}
                    </span>
                  </div>
                </div>

                {/* Sub-Notification Floating Message */}
                {notificationMsg && (
                  <div className="max-w-md text-center p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 leading-relaxed flex items-center gap-2 justify-center">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                    <span>{notificationMsg}</span>
                  </div>
                )}

                {/* Distraction/Noise Control Bar */}
                <div className="w-full max-w-xs flex flex-col items-center gap-2 p-3 bg-zinc-900/30 rounded-2xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 font-bold flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-indigo-400" />
                    <span>قنوات العزل الصوتي والموسيقى الخلفية:</span>
                  </span>
                  
                  <div className="grid grid-cols-4 gap-1.5 w-full">
                    {[
                      { id: 'none', label: '🔇 صامت' },
                      { id: 'white', label: '🤫 بيضاء' },
                      { id: 'rain', label: '🌧️ مطر' },
                      { id: 'lofi', label: '🎵 لوفاي' }
                    ].map((sound) => (
                      <button
                        key={sound.id}
                        type="button"
                        onClick={() => setActiveSoundBg(sound.id as any)}
                        className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                          activeSoundBg === sound.id
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'
                        }`}
                      >
                        {sound.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Control Action Buttons Strip */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  
                  {/* End study session */}
                  <button
                    onClick={handleForceEndSession}
                    className="px-4 py-2.5 rounded-xl border border-red-900 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                    title="إنهاء الجلسة وتسجيل الإنجازات"
                  >
                    <span>🔴</span>
                    <span>إنهاء الجلسة وحفظ الإنجاز</span>
                  </button>

                  {/* Pause / Resume */}
                  <button
                    onClick={async () => {
                      if (isRunning) {
                        setIsRunning(false);
                        await releaseWakeLock();
                      } else {
                        setIsRunning(true);
                        await requestWakeLock();
                      }
                    }}
                    className="px-6 py-3 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 text-xs font-black shadow-lg shadow-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isRunning ? 'إيقاف المؤقت' : 'استئناف المذاكرة'}</span>
                  </button>

                  {/* Skip Break */}
                  {(currentBlockType === 'break' || currentBlockType === 'long_break') && (
                    <button
                      onClick={handleSkipBreak}
                      className="px-4 py-2.5 rounded-xl border border-emerald-900 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40 text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                      title="تخطي الاستراحة والعودة للتركيز"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span>تخطي الاستراحة ➔</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* 3. REFLECTION PHASE SCREEN (V12.3 Intelligent Session Completion) */}
            {phase === 'reflection' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full max-w-lg bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 md:p-8 text-right space-y-5 shadow-2xl"
              >
                {/* Header with read-only subject & stage */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>📚 {currentSubject?.name || 'مادة دراسية'}</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">تسجيل إنجاز الجلسة والتعلم التكيفي</p>
                  </div>
                  <div className="text-left">
                    <span className="block text-[9px] text-zinc-400 font-bold">المرحلة الدراسية الحالية</span>
                    <span className="text-xs font-black text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-900/60 inline-block">
                      {currentStageName}
                    </span>
                  </div>
                </div>

                {/* Learned Lesson Name Prompt for Smart Repetition */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/60">
                  <label className="text-xs font-bold text-indigo-200 block">
                    📚 ما هو اسم أو عنوان الدرس الذي أتممت شرحه وتعلُّمه اليوم؟
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: الحركة الموجية والتداخل / قانون أوم للدوائر المغلقة..."
                    value={learnedLessonTitle}
                    onChange={(e) => setLearnedLessonTitle(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-indigo-300/80 block">
                    سيتم إدراج هذا الدرس تلقائياً في جدول المراجعات الذكية للمادة وتكراره على فترات متباعدة.
                  </span>
                </div>

                {/* Actual Duration Input (Prefilled) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">⏱️ وقت المذاكرة الفعلي المحسوب تلقائياً:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="600"
                      value={actualMinutesStudied}
                      onChange={(e) => setActualMinutesStudied(Number(e.target.value))}
                      className="w-24 p-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono font-bold text-center"
                    />
                    <span className="text-xs text-zinc-400 font-bold">دقيقة دراسة فعلية</span>
                  </div>
                </div>

                {/* Session Completion Status */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 block">حالة إنجاز جلسة اليوم:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'yes', label: 'تم بالكامل ✅' },
                      { id: 'partially', label: 'مكتمل جزئياً ⏳' },
                      { id: 'no', label: 'لم ينفذ / تعذر ❌' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTaskCompletion(item.id as any)}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          taskCompletion === item.id
                            ? 'bg-white text-zinc-950 border-white font-black shadow-md'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Follow-up: Partially Completed */}
                {taskCompletion === 'partially' && (
                  <div className="p-3.5 bg-amber-950/30 border border-amber-900/50 rounded-2xl space-y-2.5 animate-fadeIn">
                    <div className="flex justify-between items-center text-xs font-bold text-amber-300">
                      <span>كم نسبة ما أنجزته من مهمة اليوم؟</span>
                      <span className="font-mono text-amber-400">{partiallyPercent}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setPartiallyPercent(pct)}
                          className={`py-1 px-2.5 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                            partiallyPercent === pct
                              ? 'bg-amber-500 text-zinc-950 font-black'
                              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-amber-400/80 font-medium">
                      سيتم ترحيل النسبة المتبقية ({100 - partiallyPercent}%) تلقائياً إلى الجدول القادم دون إعادة المرحلة من البداية.
                    </p>
                  </div>
                )}

                {/* Conditional Follow-up: Not Completed */}
                {taskCompletion === 'no' && (
                  <div className="p-3.5 bg-rose-950/30 border border-rose-900/50 rounded-2xl space-y-2.5 animate-fadeIn">
                    <label className="text-xs font-bold text-rose-300 block">لماذا لم تكتمل المذاكرة؟ (لتحسين الجدولة تلقائياً)</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        'ضيق الوقت',
                        'الدرس أطول من المتوقع',
                        'شرح المعلم أبطأ',
                        'المادة كانت صعبة',
                        'فقدان التركيز',
                        'ارتباط طارئ',
                        'إرهاق ذهني',
                        'سبب آخر'
                      ].map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => setIncompleteReason(reason)}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer text-center ${
                            incompleteReason === reason
                              ? 'bg-rose-600 text-white border-rose-500'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    onClick={handleSubmitReflection}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    <span>حفظ وإكمال الجلسة 🎉</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* 4. CELEBRATION / FINISH PHASE SCREEN */}
            {phase === 'celebration' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-lg bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 md:p-8 text-center space-y-6"
              >
                <div className="space-y-3">
                  
                  {/* Rotating Medal Award */}
                  <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-3xl animate-[bounce_1.5s_infinite]">
                    👑
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white">🎉 تم إنجاز جلسة المذاكرة بنجاح!</h3>
                    <p className="text-xs text-zinc-400">عاش يا بطل! استهلاكك الفسيولوجي المخطط والراحة المنظمة تضمن ثبات المعلومة في الذاكرة طويلة المدى.</p>
                  </div>
                </div>

                {/* Focus Score Banner (0 - 100) */}
                <div className={`p-4 rounded-2xl border text-right space-y-1 ${focusRatingObj.badgeClass}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">مؤشر جودة التركيز الفعلي (Focus Score):</span>
                    <span className="text-xl font-black font-mono">{calculatedFocusScore} / 100</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-sm font-black">{focusRatingObj.title}</span>
                    <span className="text-[10px] opacity-80">{focusRatingObj.desc}</span>
                  </div>
                </div>

                {/* Stats Summary Panel */}
                <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-right">
                    
                    <div className="p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
                      <span className="text-[10px] text-zinc-500 font-bold block mb-0.5">زمن المذاكرة الفعلي</span>
                      <strong className="text-sm font-black text-white">{actualMinutesStudied} دقيقة</strong>
                    </div>

                    <div className="p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
                      <span className="text-[10px] text-zinc-500 font-bold block mb-0.5">عدد الانقطاعات</span>
                      <strong className={`text-sm font-black ${interruptionsCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {interruptionsCount === 0 ? 'بلا انقطاعات 🛡️' : `${interruptionsCount} انقطاع`}
                      </strong>
                    </div>

                    <div className="p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
                      <span className="text-[10px] text-zinc-500 font-bold block mb-0.5">أطول فترة تركيز متصلة</span>
                      <strong className="text-sm font-black text-indigo-400">
                        {Math.round(longestUninterruptedSeconds / 60)} دقيقة
                      </strong>
                    </div>

                    <div className="p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
                      <span className="text-[10px] text-zinc-500 font-bold block mb-0.5">وقت المشتتات والغياب</span>
                      <strong className="text-sm font-black text-zinc-300">
                        {Math.round(totalDistractionSeconds)} ثانية
                      </strong>
                    </div>
                  </div>

                  {/* Progress values */}
                  <div className="pt-2 border-t border-zinc-900 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                      <span>إنجاز خطة اليوم:</span>
                      <span className="text-white">100% مكتملة ✅</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleFinishEverything}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ وإغلاق الجلسة كلياً والعودة لجدول اليوم ➔</span>
                </button>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* Modal 1: Exit Confirmation Modal during Active Study */}
        <AnimatePresence>
          {showExitConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-400 flex items-center justify-center mx-auto text-xl">
                  ⚠️
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-white">أنت تدرس حالياً!</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    مغادرتك الآن ستوقف جلسة المذاكرة مؤقتاً وسوف يتم تسجيل الانقطاع في إحصائياتك. هل ترغب في الاستمرار؟
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowExitConfirmModal(false);
                      setIsRunning(true);
                      requestWakeLock();
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    متابعة المذاكرة (Continue Studying)
                  </button>
                  <button
                    onClick={() => {
                      setShowExitConfirmModal(false);
                      handleForceEndSession();
                    }}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    إنهاء وحفظ الإنجاز (Leave & Save)
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal 2: Auto Pause / Interruption Modal */}
        <AnimatePresence>
          {showInterruptionModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full text-right space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                  <div className="p-2.5 rounded-2xl bg-amber-950/60 border border-amber-800/60 text-amber-400">
                    <Eye className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">أهلاً بعودتك إلى بيئة التركيز!</h3>
                    <p className="text-[10px] text-zinc-400">تم الكشف عن انقطاع/مغادرة للشاشة وإيقاف المؤقت مؤقتاً.</p>
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">إجمالي الانقطاعات المكتشفة:</span>
                    <span className="font-mono font-bold text-amber-400">{interruptionsCount} انقطاع</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">مدة الغياب التقديرية الأخيرة:</span>
                    <span className="font-mono font-bold text-zinc-200">{lastInterruptionDuration} ثانية</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-zinc-900">
                    <span className="text-zinc-400">مؤشر جودة التركيز المتوقع:</span>
                    <span className="font-mono font-bold text-indigo-400">{calculatedFocusScore} / 100</span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  الحفاظ على الثبات المعرفي يضمن سرعة الاستدعاء. هل ترغب في استئناف الجلسة الآن؟
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={async () => {
                      setShowInterruptionModal(false);
                      setIsRunning(true);
                      await requestWakeLock();
                    }}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>استئناف الجلسة (Resume)</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowInterruptionModal(false);
                      handleForceEndSession();
                    }}
                    className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    إنهاء الجلسة
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lower Cinematic Footnote */}
        <div className="border-t border-zinc-900 pt-4 mt-6 text-center text-[10px] text-zinc-500 font-semibold flex flex-wrap justify-between items-center gap-2">
          <span>دليل التركيز: الانقطاعات المتكررة تضاعف الإرهاق الذهني بمقدار 3 أضعاف.</span>
          <span className="text-zinc-600">نظام ذكاء اصطناعي محصن ضد المشتتات 🎓</span>
        </div>

      </div>
    </div>
  );
}
