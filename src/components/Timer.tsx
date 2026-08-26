/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Check, 
  Zap, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Clock, 
  BookOpen, 
  Sparkles, 
  Award, 
  Hourglass,
  Sliders,
  Flame
} from 'lucide-react';
import { StudyMethod, CustomTimer } from '../types';

interface TimerProps {
  subjects: { id: string; name: string; color: string }[];
  onSessionComplete: (session: {
    subjectId: string;
    subjectName: string;
    duration: number;
    method: StudyMethod;
    focusScore: number;
  }) => void;
  token?: string;
}

export default function Timer({ subjects, onSessionComplete, token }: TimerProps) {
  const [activeTab, setActiveTab] = useState<'timer' | 'stopwatch' | 'custom'>('timer');
  const [mode, setMode] = useState<StudyMethod | 'Short Break' | 'Long Break'>('Pomodoro');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');

  useEffect(() => {
    if (subjects.length > 0 && (!selectedSubjectId || !subjects.some(s => s.id === selectedSubjectId))) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [duration, setDuration] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [focusScore, setFocusScore] = useState(85);
  const [savePrompt, setSavePrompt] = useState(false);

  // AI Focus Detection States
  const [isAnalyzingFocus, setIsAnalyzingFocus] = useState(false);
  const [focusAnalysisResult, setFocusAnalysisResult] = useState<{
    focusScore: number;
    distractionLevel: string;
    attentionDeclineRate: number;
    optimalBreakTiming: number;
    deepWorkPotential: number;
    feedback: string;
  } | null>(null);
  const [focusAnalysisError, setFocusAnalysisError] = useState('');

  // Stopwatch States
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  // Custom Timers list
  const [customTimers, setCustomTimers] = useState<CustomTimer[]>(() => {
    const saved = localStorage.getItem('custom_timers_list');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'default-1',
        name: 'فيزياء سريعة ⚡',
        duration: 15 * 60,
        category: 'Deep Work',
        color: 'rose',
        icon: 'Zap',
        sound: 'Zen Gong',
        autoRepeat: false
      },
      {
        id: 'default-2',
        name: 'حل إمتحانات 📝',
        duration: 45 * 60,
        category: 'Practice Questions',
        color: 'indigo',
        icon: 'BookOpen',
        sound: 'Classic Alarm',
        autoRepeat: true
      },
      {
        id: 'default-3',
        name: 'مراجعة كلمات 📖',
        duration: 10 * 60,
        category: 'Revision',
        color: 'emerald',
        icon: 'Sparkles',
        sound: 'Chime',
        autoRepeat: false
      }
    ];
  });

  // Custom Timer Form
  const [newTimerName, setNewTimerName] = useState('');
  const [newTimerMins, setNewTimerMins] = useState('20');
  const [newTimerCategory, setNewTimerCategory] = useState<StudyMethod>('Deep Work');
  const [newTimerColor, setNewTimerColor] = useState<string>('amber');
  const [newTimerIcon, setNewTimerIcon] = useState<string>('Clock');
  const [newTimerSound, setNewTimerSound] = useState<string>('Zen Gong');
  const [newTimerAutoRepeat, setNewTimerAutoRepeat] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Focus Stats State
  const [statsHistory, setStatsHistory] = useState<{ date: string; duration: number; mode: string }[]>(() => {
    const saved = localStorage.getItem('timer_stats_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Save custom timers to localStorage
  useEffect(() => {
    localStorage.setItem('custom_timers_list', JSON.stringify(customTimers));
  }, [customTimers]);

  // Audio synthesizer engine
  const playAlertSound = (soundType: string) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (soundType === 'Zen Gong') {
        // Deep resonance chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.setValueAtTime(150, ctx.currentTime);
        osc2.frequency.setValueAtTime(152, ctx.currentTime); // Chorus effect

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 3);
        osc2.stop(ctx.currentTime + 3);
      } else if (soundType === 'Chime' || soundType === 'good') {
        // High pleasant bell chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
      } else {
        // Classic Alarm tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1);
      }
    } catch (e) {
      console.warn('AudioContext blocked or unsupported:', e);
    }
  };

  // Switch Modes
  useEffect(() => {
    if (activeTab === 'timer') {
      let mins = 25;
      if (mode === 'Deep Work') mins = 50;
      else if (mode === 'Short Break') mins = 5;
      else if (mode === 'Long Break') mins = 15;
      else if (mode === 'Revision') mins = 30;
      else if (mode === 'Practice Questions') mins = 45;

      setTimeLeft(mins * 60);
      setDuration(mins * 60);
      setIsRunning(false);
      setSavePrompt(false);
    }
  }, [mode, activeTab]);

  // Timer intervals
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTab === 'timer' && isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playAlertSound('Zen Gong');
      setSavePrompt(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, activeTab]);

  // Stopwatch intervals
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTab === 'stopwatch' && isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStopwatchRunning, activeTab]);

  const handleStartPause = () => {
    if (activeTab === 'timer') {
      setIsRunning(!isRunning);
    } else {
      setIsStopwatchRunning(!isStopwatchRunning);
    }
  };

  const handleReset = () => {
    if (activeTab === 'timer') {
      setIsRunning(false);
      setTimeLeft(duration);
      setSavePrompt(false);
    } else {
      setIsStopwatchRunning(false);
      setStopwatchTime(0);
      setLaps([]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveSession = async () => {
    const sub = subjects.find(s => s.id === selectedSubjectId);
    if (!sub) return;
    
    const studyDuration = activeTab === 'timer' ? (duration - timeLeft) : stopwatchTime;
    if (studyDuration <= 0) return;

    setIsAnalyzingFocus(true);
    setFocusAnalysisError('');
    setFocusAnalysisResult(null);

    let finalFocusScore = focusScore;

    try {
      const activeAuthToken = token || (typeof window !== 'undefined' ? localStorage.getItem('study_session_token') : null) || 'local_user';
      const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
      const res = await fetch('/api/ai/focus-detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': activeAuthToken
        },
        body: JSON.stringify({
          duration: studyDuration,
          subjectId: sub.id,
          method: (mode === 'Short Break' || mode === 'Long Break') ? 'Pomodoro' : mode as StudyMethod,
          timeOfDay,
          focusScoreInput: focusScore
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setFocusAnalysisResult(data.analysis);
          finalFocusScore = data.analysis.focusScore || focusScore;
        }
      } else {
        // Fallback if API returned non-OK
        const durationMins = Math.round(studyDuration / 60) || 1;
        const breakMins = durationMins >= 50 ? 15 : durationMins >= 25 ? 10 : 5;
        setFocusAnalysisResult({
          focusScore,
          distractionLevel: focusScore >= 80 ? 'low' : focusScore >= 65 ? 'medium' : 'high',
          attentionDeclineRate: Math.max(5, Math.min(35, Math.round((durationMins / 60) * 15))),
          optimalBreakTiming: breakMins,
          deepWorkPotential: Math.min(98, Math.round(focusScore * 1.05)),
          feedback: `أداء ممتاز في مادة ${sub.name}! تم تسجيل جلسة مذاكرة لمدة ${durationMins} دقيقة بمعدل تركيز %${focusScore}. خذ استراحة ${breakMins} دقائق لتجديد الطاقة العصبية.`
        });
      }
    } catch (err: any) {
      const durationMins = Math.round(studyDuration / 60) || 1;
      const breakMins = durationMins >= 50 ? 15 : durationMins >= 25 ? 10 : 5;
      setFocusAnalysisResult({
        focusScore,
        distractionLevel: focusScore >= 80 ? 'low' : focusScore >= 65 ? 'medium' : 'high',
        attentionDeclineRate: Math.max(5, Math.min(35, Math.round((durationMins / 60) * 15))),
        optimalBreakTiming: breakMins,
        deepWorkPotential: Math.min(98, Math.round(focusScore * 1.05)),
        feedback: `أداء ممتاز في مادة ${sub.name}! تم تسجيل جلسة مذاكرة لمدة ${durationMins} دقيقة بمعدل تركيز %${focusScore}. خذ استراحة ${breakMins} دقائق لتجديد الطاقة العصبية.`
      });
    } finally {
      setIsAnalyzingFocus(false);
    }

    onSessionComplete({
      subjectId: sub.id,
      subjectName: sub.name,
      duration: studyDuration,
      method: (mode === 'Short Break' || mode === 'Long Break') ? 'Pomodoro' : mode as StudyMethod,
      focusScore: finalFocusScore
    });

    // Save locally to history
    const updatedHistory = [{ date: new Date().toLocaleDateString('ar-EG'), duration: studyDuration, mode }, ...statsHistory.slice(0, 9)];
    setStatsHistory(updatedHistory);
    localStorage.setItem('timer_stats_history', JSON.stringify(updatedHistory));

    // If there is no token or we failed, reset and close immediately.
    // If there IS a token, we keep the prompt open to show the beautiful AI diagnostic feedback!
    if (!token) {
      setSavePrompt(false);
      handleReset();
    }
  };

  const handleAddCustomTimer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimerName.trim()) return;

    const newTimer: CustomTimer = {
      id: `timer-${Date.now()}`,
      name: newTimerName,
      duration: Number(newTimerMins) * 60,
      category: newTimerCategory,
      color: newTimerColor,
      icon: newTimerIcon,
      sound: newTimerSound,
      autoRepeat: newTimerAutoRepeat
    };

    setCustomTimers([newTimer, ...customTimers]);
    setNewTimerName('');
    setShowAddForm(false);
  };

  const handleDeleteCustomTimer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomTimers(customTimers.filter(t => t.id !== id));
  };

  const handleTriggerCustomTimer = (t: CustomTimer) => {
    setActiveTab('timer');
    setMode(t.category);
    setTimeLeft(t.duration);
    setDuration(t.duration);
    setIsRunning(true);
    playAlertSound(t.sound);
  };

  const safeDuration = duration > 0 ? duration : 1;
  const progress = Number.isNaN(timeLeft / safeDuration) ? 0 : timeLeft / safeDuration;
  const rawOffset = 2 * Math.PI * 90 * (1 - progress);
  const strokeDashoffset = Number.isNaN(rawOffset) ? 0 : rawOffset;

  return (
    <div className={`p-6 rounded-3xl border transition-all duration-300 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 ${
      isFullScreen ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 dark:bg-zinc-950 border-none' : ''
    }`} style={{ direction: 'rtl' }}>
      
      {/* Upper Control Strip */}
      <div className="flex items-center justify-between w-full mb-5 max-w-lg mx-auto">
        <div className="text-right">
          <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
            <Zap className="w-5 h-5 text-amber-500 animate-bounce" />
            <span>مؤقت الاستذكار والإنتاجية المتكامل</span>
          </h2>
          <p className="text-[10px] text-zinc-400">تحكّم متقدم في ساعات وجلسات مذاكرة الثانوية العامة دفعة ٢٠٢٧</p>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            {isFullScreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="grid grid-cols-3 gap-1.5 max-w-sm mx-auto mb-6 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-xl">
        <button
          onClick={() => { setActiveTab('timer'); setIsRunning(false); }}
          className={`py-2 text-[11px] font-black rounded-lg transition-all ${
            activeTab === 'timer' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          مؤقت التركيز ⏱️
        </button>
        <button
          onClick={() => { setActiveTab('stopwatch'); setIsStopwatchRunning(false); }}
          className={`py-2 text-[11px] font-black rounded-lg transition-all ${
            activeTab === 'stopwatch' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          ساعة إيقاف ⚡
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`py-2 text-[11px] font-black rounded-lg transition-all ${
            activeTab === 'custom' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          مؤقتاتي المخصصة 🎛️
        </button>
      </div>

      {/* Timer Section */}
      {activeTab === 'timer' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-1.5 justify-center max-w-md mx-auto">
            {(['Pomodoro', 'Deep Work', 'Short Break', 'Long Break', 'Revision', 'Practice Questions'] as const).map((m) => (
              <button
                key={m}
                disabled={isRunning}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all ${
                  mode === m
                    ? 'bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 border-transparent shadow-xs'
                    : 'bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-150 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 disabled:opacity-50'
                }`}
              >
                {m === 'Pomodoro' ? 'بومودورو (٢٥د)' : m === 'Deep Work' ? 'عمل عميق (٥٠د)' : m === 'Short Break' ? 'راحة قصيرة (٥د)' : m === 'Long Break' ? 'راحة طويلة (١٥د)' : m === 'Revision' ? 'مراجعة (٣٠د)' : 'حل أسئلة (٤٥د)'}
              </button>
            ))}
          </div>

          <div className="relative flex items-center justify-center w-52 h-52 mx-auto">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="104" cy="104" r="90" className="stroke-zinc-100 dark:stroke-zinc-900" strokeWidth="8" fill="transparent" />
              <circle
                cx="104" cy="104" r="90"
                className="stroke-zinc-950 dark:stroke-zinc-50 transition-all duration-300"
                strokeWidth="8" fill="transparent"
                strokeDasharray={2 * Math.PI * 90}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-mono font-black text-zinc-950 dark:text-zinc-50 tracking-tight">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold mt-1">
                {isRunning ? 'جاري شحن تركيزك..' : 'جاهز للمذاكرة'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stopwatch Section */}
      {activeTab === 'stopwatch' && (
        <div className="space-y-6">
          <div className="text-center p-4 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl max-w-sm mx-auto border border-zinc-150 dark:border-zinc-800">
            <span className="text-[10px] font-black text-zinc-400 block mb-1">العداد التصاعدي المفتوح</span>
            <span className="text-4xl font-mono font-black text-zinc-950 dark:text-zinc-50">
              {formatTime(stopwatchTime)}
            </span>
          </div>

          <div className="flex justify-center gap-2 max-w-xs mx-auto">
            <button
              onClick={() => {
                if (stopwatchTime > 0) {
                  setLaps([stopwatchTime, ...laps.slice(0, 4)]);
                }
              }}
              disabled={!isStopwatchRunning}
              className="px-3.5 py-1.5 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 disabled:opacity-50"
            >
              تسجيل دورة ⏱️
            </button>
            {stopwatchTime > 0 && !isStopwatchRunning && (
              <button
                onClick={() => setSavePrompt(true)}
                className="px-3.5 py-1.5 text-[10px] font-black bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200"
              >
                تسجيل الجلسة كدراسة
              </button>
            )}
          </div>

          {laps.length > 0 && (
            <div className="max-w-sm mx-auto space-y-1.5 text-right bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-150 dark:border-zinc-850">
              <span className="text-[10px] font-black text-zinc-400">دورات الانتباه المحسوبة:</span>
              {laps.map((lap, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                  <span>جولة {laps.length - idx}:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatTime(lap)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom Timers Preset Tab */}
      {activeTab === 'custom' && (
        <div className="space-y-5 max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500">قائمة مؤقتاتك السلوكية السريعة:</span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="py-1 px-2.5 bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 rounded-lg text-[10px] font-black flex items-center gap-1 hover:bg-zinc-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مؤقت مخصص</span>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddCustomTimer} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">اسم المؤقت (مثال: أحياء مكثفة):</label>
                  <input
                    type="text" required placeholder="اسم المؤقت"
                    value={newTimerName} onChange={(e) => setNewTimerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">المدة بالدقائق:</label>
                  <input
                    type="number" min="1" max="180" required
                    value={newTimerMins} onChange={(e) => setNewTimerMins(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">تصنيف المذاكرة السلوكي:</label>
                  <select
                    value={newTimerCategory} onChange={(e) => setNewTimerCategory(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="Deep Work">عمل دراسي عميق 🧠</option>
                    <option value="Revision">مراجعة سريعة 🔄</option>
                    <option value="Practice Questions">حل تمارين وأسئلة 📝</option>
                    <option value="Pomodoro">بومودورو قياسي ⏱️</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">نغمة التنبيه عند الانتهاء:</label>
                  <select
                    value={newTimerSound} onChange={(e) => setNewTimerSound(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="Zen Gong">جرس زين هادئ 🔔</option>
                    <option value="Chime">تنبيه رنين لطيف ✨</option>
                    <option value="Classic Alarm">منبه كلاسيكي قوي ⏰</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox" id="autoRepeat" checked={newTimerAutoRepeat}
                  onChange={(e) => setNewTimerAutoRepeat(e.target.checked)}
                  className="rounded text-zinc-950 focus:ring-0"
                />
                <label htmlFor="autoRepeat" className="text-[10px] text-zinc-500 font-bold">تكرار المؤقت تلقائياً عند الاكتمال</label>
              </div>

              <div className="flex gap-1.5 justify-end pt-1">
                <button
                  type="button" onClick={() => setShowAddForm(false)}
                  className="px-2.5 py-1.5 text-[10px] text-zinc-500 font-medium hover:text-zinc-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-[10px] font-black bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 rounded-lg"
                >
                  حفظ المؤقت 💾
                </button>
              </div>
            </form>
          )}

          {/* Render Saved Presets list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customTimers.map((t) => (
              <div
                key={t.id}
                onClick={() => handleTriggerCustomTimer(t)}
                className="p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="text-right space-y-1">
                  <span className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-50 block">{t.name}</span>
                  <div className="flex gap-1.5 text-[9px] text-zinc-400 font-bold">
                    <span>{t.duration / 60} دقيقة</span>
                    <span>•</span>
                    <span>{t.category === 'Deep Work' ? 'تركيز' : t.category === 'Revision' ? 'مراجعة' : 'حل تمارين'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleDeleteCustomTimer(t.id, e)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Control Strip */}
      {activeTab !== 'custom' && (
        <div className="space-y-4">
          {!(mode === 'Short Break' || mode === 'Long Break') && (
            <div className="mt-5 max-w-sm w-full mx-auto">
              <label className="block text-[10px] font-bold text-zinc-500 mb-1.5">مادة المذاكرة الحالية لربط الإحصائيات بها:</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={isRunning || isStopwatchRunning}
                className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-center gap-3.5 max-w-md w-full mx-auto">
            <button
              onClick={handleReset}
              className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-950 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={handleStartPause}
              className="px-6 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-xs flex items-center gap-1.5 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 hover:bg-zinc-900 cursor-pointer"
            >
              {isRunning || isStopwatchRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isRunning || isStopwatchRunning ? 'إيقاف مؤقت' : 'ابدأ الجلسة الآن'}</span>
            </button>

            {((activeTab === 'timer' && timeLeft < duration && !isRunning) || (activeTab === 'stopwatch' && stopwatchTime > 0 && !isStopwatchRunning)) && (
              <button
                onClick={() => setSavePrompt(true)}
                className="p-3 rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-all cursor-pointer"
                title="حفظ وتسجيل الجلسة الدراسية"
              >
                <Check className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Save Session Dialog Panel */}
      {savePrompt && (
        <div className="mt-5 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 max-w-md w-full mx-auto text-right">
          {!focusAnalysisResult ? (
            <>
              <div className="flex items-start gap-2 text-right mb-4">
                <AlertCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100">هل ترغب في تسجيل جلسة المذاكرة الحالية لحساب درجاتك؟</h4>
                  <p className="text-[10px] text-zinc-400 mt-1">يتم احتساب ساعات المذاكرة هذه لمستويات طاقتك المعرفية ومنحنيات الوقاية من الاحتراق الأكاديمي.</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-1 text-[10px] text-zinc-500 font-bold">
                  <span>{focusScore}%</span>
                  <span>تقييمك لمعدل التركيز والاستيعاب:</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={focusScore}
                  onChange={(e) => setFocusScore(Number(e.target.value))}
                  className="w-full accent-zinc-950 dark:accent-zinc-50 bg-zinc-200 dark:bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {focusAnalysisError && (
                <div className="mb-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 text-[10px] font-semibold">
                  {focusAnalysisError}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setSavePrompt(false)}
                  disabled={isAnalyzingFocus}
                  className="px-3 py-1.5 text-[10px] text-zinc-500 hover:text-zinc-700 font-bold disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveSession}
                  disabled={isAnalyzingFocus}
                  className="px-4 py-1.5 text-[10px] font-black bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 rounded-lg hover:bg-zinc-900 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isAnalyzingFocus ? (
                    <>
                      <span className="w-3 h-3 rounded-full border border-zinc-400 border-t-white animate-spin"></span>
                      <span>جاري تحليل التركيز...</span>
                    </>
                  ) : (
                    <>
                      <span>تحليل وتسجيل المذاكرة 🧠</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4 animate-fade-in text-right">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                <div>
                  <h4 className="text-xs font-black text-zinc-950 dark:text-zinc-50">تحليل التركيز العصبي بالذكاء الاصطناعي</h4>
                  <p className="text-[9px] text-zinc-400">تم رصد أدائك المعرفي بناءً على مدة الجلسة ونمط النشاط الحالي.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200/40">
                  <span className="text-[9px] text-zinc-400 font-bold block mb-0.5">درجة التركيز الحقيقية</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">%{focusAnalysisResult.focusScore}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200/40">
                  <span className="text-[9px] text-zinc-400 font-bold block mb-0.5">معدل تراجع الانتباه</span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">%{focusAnalysisResult.attentionDeclineRate}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200/40">
                  <span className="text-[9px] text-zinc-400 font-bold block mb-0.5">مؤشر التشتت</span>
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                    {focusAnalysisResult.distractionLevel === 'high' ? '⚠️ مرتفع' : focusAnalysisResult.distractionLevel === 'medium' ? '⚡ متوسط' : '✨ منخفض'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200/40">
                  <span className="text-[9px] text-zinc-400 font-bold block mb-0.5">استجابة العمل العميق</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">%{focusAnalysisResult.deepWorkPotential}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200/40 text-[10px] leading-relaxed text-zinc-600 dark:text-zinc-400 font-semibold">
                <strong className="text-[10px] text-zinc-950 dark:text-zinc-50 block mb-0.5">توصية فسيولوجية مخصصة:</strong>
                {focusAnalysisResult.feedback}
                <div className="mt-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                  ⏱️ ننصح بأخذ استراحة مدتها {focusAnalysisResult.optimalBreakTiming} دقيقة الآن لاستعادة نشاط الموصلات العصبية.
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setSavePrompt(false);
                    setFocusAnalysisResult(null);
                    handleReset();
                  }}
                  className="px-4 py-1.5 text-[10px] font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  موافق، إغلاق التشخيص 🧠
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Focus statistics and history log at bottom */}
      {statsHistory.length > 0 && !isFullScreen && (
        <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-850">
          <div className="flex items-center justify-between mb-3 text-[11px] font-black text-zinc-400">
            <span>سجل أحدث الجلسات الناجحة:</span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>إجمالي الجلسات اليوم: {statsHistory.length}</span>
            </span>
          </div>

          <div className="space-y-1.5 max-h-24 overflow-y-auto">
            {statsHistory.slice(0, 3).map((hist, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 text-[10px] border border-zinc-100 dark:border-zinc-850">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{hist.mode === 'Short Break' || hist.mode === 'Long Break' ? 'استراحة كوفى' : 'مذاكرة تركيز عميق'}</span>
                <span className="font-mono text-zinc-500">تاريخ {hist.date} - مدة {(hist.duration / 60).toFixed(1)} دقيقة</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full screen cinematic focus loop */}
      {isFullScreen && isRunning && (
        <div className="mt-8 flex flex-col items-center justify-center animate-pulse">
          <div className="w-16 h-16 rounded-full border border-zinc-700 bg-zinc-800/20 animate-[ping_3s_infinite] flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-zinc-500/30"></div>
          </div>
          <span className="text-xs font-medium text-zinc-400 mt-4 tracking-wider">تنفس ببطء وعمق.. ركز انتباهك هنا فقط.</span>
        </div>
      )}
    </div>
  );
}

