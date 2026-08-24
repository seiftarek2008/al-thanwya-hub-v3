import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Award, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  Lock, 
  ChevronRight, 
  Sparkles,
  Zap,
  Target,
  ShieldAlert,
  Crown,
  BookOpen,
  PartyPopper,
  Gift
} from 'lucide-react';
import { Gamification } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { SEED_SUBJECTS } from '../db/curriculum_seed';
import LevelUpCelebrationModal from './LevelUpCelebrationModal';
import PlayerOfTheWeekCard from './PlayerOfTheWeekCard';
import confetti from 'canvas-confetti';

interface GamificationHubProps {
  gamification: Gamification;
  onUpdateGamification?: (g: Gamification) => void;
  stream: 'science' | 'math' | 'literature';
  token?: string;
  user?: any;
  curriculumProgress?: Record<string, any>;
  spacedRepetitionReviews?: any[];
}

export default function GamificationHub({ gamification, onUpdateGamification, stream, token, user, curriculumProgress, spacedRepetitionReviews = [] }: GamificationHubProps) {
  const currentXp = Math.max(0, gamification.xp || 0);
  const currentLevel = Math.max(1, gamification.level || Math.floor(currentXp / 1000) + 1);
  const streak = gamification.streak || 0;

  // Level XP logic: 1000 XP per level
  const xpInCurrentLevel = currentXp % 1000;
  const xpNeededForNextLevel = 1000;
  const xpProgressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)));

  // Celebratory Level-Up Trigger & State Management
  const prevLevelRef = useRef<number>(currentLevel);
  const isInitialMount = useRef<boolean>(true);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [celebrationNewLevel, setCelebrationNewLevel] = useState<number>(currentLevel);
  const [celebrationOldLevel, setCelebrationOldLevel] = useState<number>(Math.max(1, currentLevel - 1));
  const [levelUpHighlight, setLevelUpHighlight] = useState<boolean>(false);

  // Monitor XP and Level thresholds to trigger celebratory animation immediately upon crossing
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevLevelRef.current = currentLevel;
      return;
    }

    if (currentLevel > prevLevelRef.current) {
      const oldLvl = prevLevelRef.current;
      setCelebrationOldLevel(oldLvl);
      setCelebrationNewLevel(currentLevel);
      setShowCelebrationModal(true);
      setLevelUpHighlight(true);

      // Trigger instant mini confetti burst
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // canvas-confetti fallback
      }

      setTimeout(() => setLevelUpHighlight(false), 5000);
    }
    prevLevelRef.current = currentLevel;
  }, [currentLevel]);

  // Handler to manually preview celebratory animation
  const handleTriggerCelebration = () => {
    setCelebrationOldLevel(Math.max(1, currentLevel - 1));
    setCelebrationNewLevel(currentLevel);
    setShowCelebrationModal(true);
  };

  // Handler to claim completed mission rewards and award XP
  const handleClaimMission = (missionId: string, isWeekly = false) => {
    if (!onUpdateGamification) return;
    
    const missionList = isWeekly ? [...gamification.weeklyMissions] : [...gamification.dailyMissions];
    const missionIndex = missionList.findIndex(m => m.id === missionId);
    if (missionIndex === -1) return;

    const mission = missionList[missionIndex];
    if (mission.completed) return; // already claimed

    const reward = mission.xpReward || 50;
    const nextXp = (gamification.xp || 0) + reward;
    const nextLevel = Math.max(1, Math.floor(nextXp / 1000) + 1);

    const updatedMissions = [...missionList];
    updatedMissions[missionIndex] = {
      ...mission,
      completed: true,
      current: mission.target
    };

    const updatedGamification: Gamification = {
      ...gamification,
      xp: nextXp,
      level: nextLevel,
      dailyMissions: isWeekly ? gamification.dailyMissions : updatedMissions,
      weeklyMissions: isWeekly ? updatedMissions : gamification.weeklyMissions
    };

    onUpdateGamification(updatedGamification);

    // Quick burst for mission claim
    try {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.7 }
      });
    } catch {}
  };

  // Real-time Leaderboard States
  const [leaderboardList, setLeaderboardList] = useState<any[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Timeframe filter state
  const [timeframe, setTimeframe] = useState<'allTime' | 'weekly' | 'monthly'>('allTime');

  // Compute real completed lessons for current user from spacedRepetitionReviews & curriculumProgress
  const userRealLastLessons = useMemo(() => {
    const result: Record<string, string> = {};

    // 1. First prioritize Spaced Repetition items (most recent lessons studied by the user)
    if (Array.isArray(spacedRepetitionReviews) && spacedRepetitionReviews.length > 0) {
      // Sort reviews descending by studiedDate or creation/milestone
      const sortedReviews = [...spacedRepetitionReviews].sort((a, b) => {
        const dateA = a.studiedDate || a.nextReviewDate || '';
        const dateB = b.studiedDate || b.nextReviewDate || '';
        return dateB.localeCompare(dateA);
      });

      sortedReviews.forEach((item) => {
        const subjName = item.subjectName;
        if (subjName && item.lessonName && !result[subjName]) {
          result[subjName] = item.lessonName;
        }
      });
    }

    // 2. Fallback / supplement from curriculumProgress
    const progressMap = curriculumProgress || (user as any)?.data?.curriculumProgress || {};
    const userStream = stream || 'science';
    const userTrack = user?.curriculumTrack || 'arabic';

    SEED_SUBJECTS.forEach((subj) => {
      if (subj.curriculumTrack && subj.curriculumTrack !== userTrack) return;
      if (subj.specialization && subj.specialization !== 'general' && subj.specialization !== userStream) return;

      if (result[subj.name]) return; // already populated from spaced repetition

      let lastCompletedLessonName = '';
      subj.units?.forEach((unit) => {
        unit.lessons?.forEach((lesson) => {
          const prog = progressMap[lesson.id];
          if (prog) {
            const hasCompletedStage = Object.values(prog.stages || {}).some((st: any) => st?.status === 'completed');
            if (hasCompletedStage || prog.mastered) {
              lastCompletedLessonName = lesson.name;
            }
          }
        });
      });

      if (lastCompletedLessonName) {
        result[subj.name] = lastCompletedLessonName;
      }
    });

    return result;
  }, [curriculumProgress, spacedRepetitionReviews, user, stream]);

  // Helper function to derive last completed lessons for a student without fake defaults
  const getStudentLastLessons = (isCurrent: boolean, customLessons?: Record<string, string>) => {
    if (isCurrent) {
      return userRealLastLessons;
    }
    if (customLessons && Object.keys(customLessons).length > 0) {
      return customLessons;
    }
    return {};
  };

  // Helper function to query the REST fallback API
  const fetchLeaderboardFromApi = async () => {
    try {
      const response = await fetch(`/api/leaderboard?timeframe=${timeframe}`, {
        headers: { 'x-auth-token': token || '' }
      });
      if (response.ok) {
        const data = await response.json();
        const ranked = data.leaderboard.map((item: any) => ({
          ...item,
          isCurrentUser: item.id === user?.id
        }));
        setLeaderboardList(ranked);
        
        if (data.currentUserRank) {
          setCurrentUserRank({
            ...data.currentUserRank,
            isCurrentUser: true
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard from API:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Master local sorting logic
  const processAndFilterLeaderboard = (rawEntries: any[]) => {
    const xpField = timeframe === 'weekly' ? 'weeklyXp' : timeframe === 'monthly' ? 'monthlyXp' : 'xp';
    
    const filtered = [...rawEntries];
    filtered.sort((a, b) => {
      const xpA = a[xpField] || 0;
      const xpB = b[xpField] || 0;
      if (xpB !== xpA) return xpB - xpA;
      
      const streakA = a.currentStreak || 0;
      const streakB = b.currentStreak || 0;
      if (streakB !== streakA) return streakB - streakA;

      const hoursA = a.totalStudyHours || 0;
      const hoursB = b.totalStudyHours || 0;
      return hoursB - hoursA;
    });

    const ranked = filtered.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      isCurrentUser: entry.id === user?.id
    }));

    setLeaderboardList(ranked);

    const userIdx = ranked.findIndex(e => e.id === user?.id);
    if (userIdx !== -1) {
      setCurrentUserRank(ranked[userIdx]);
    } else {
      setCurrentUserRank({
        id: user?.id || 'current',
        name: user?.name || 'أنت',
        xp: timeframe === 'weekly' ? 0 : timeframe === 'monthly' ? 0 : currentXp,
        level: currentLevel,
        stream: stream,
        currentStreak: streak,
        totalStudyHours: 0,
        rank: ranked.length + 1,
        isCurrentUser: true
      });
    }
    setIsLoading(false);
  };

  // Setup Firestore listener with API fallback
  useEffect(() => {
    setIsLoading(true);
    let unsubscribe = () => {};

    if (db) {
      try {
        const colRef = collection(db, 'leaderboard');
        unsubscribe = onSnapshot(colRef, (snapshot) => {
          const entries: any[] = [];
          snapshot.forEach((doc) => {
            entries.push(doc.data());
          });
          processAndFilterLeaderboard(entries);
        }, (err) => {
          console.warn("Firestore onSnapshot error, falling back to API:", err);
          fetchLeaderboardFromApi();
        });
      } catch (err) {
        console.warn("Firestore initialize error, falling back to API:", err);
        fetchLeaderboardFromApi();
      }
    } else {
      fetchLeaderboardFromApi();
    }

    return () => unsubscribe();
  }, [timeframe, user?.id, userRealLastLessons]);

  return (
    <div className="space-y-6 text-right" style={{ direction: 'rtl' }} id="gamification-hub-system">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-zinc-950 to-indigo-950 text-white rounded-3xl p-6 md:p-8 border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-right w-full md:w-auto">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-black rounded-full border border-indigo-500/30">
              🎮 نظام التحفيز والتفوق الدراسي
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">لوحة الإنجازات والتفوق 🏆</h2>
            <p className="text-xs text-zinc-400 max-w-md font-medium leading-relaxed">
              تكتسب نقاط الخبرة (XP) من خلال الالتزام بجلسات المذاكرة الحقيقية والمهام المنجزة فقط.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto">
            {/* Streak card */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center min-w-[110px]">
              <Flame className="w-6 h-6 text-orange-500 mx-auto animate-bounce" />
              <span className="text-base font-black font-sans block mt-1">{streak} {streak === 1 ? 'يوم' : streak === 2 ? 'يومان' : 'أيام'}</span>
              <span className="text-[10px] text-zinc-400 font-bold block">التزام متتالي</span>
            </div>

            {/* Level card */}
            <div className={`p-4 rounded-2xl text-center min-w-[120px] transition-all relative ${
              levelUpHighlight 
                ? 'bg-amber-500/30 border-2 border-amber-400 shadow-lg shadow-amber-500/40 animate-pulse' 
                : 'bg-white/5 border border-white/10'
            }`}>
              <Award className={`w-6 h-6 mx-auto ${levelUpHighlight ? 'text-amber-300 animate-spin' : 'text-yellow-500'}`} />
              <span className="text-base font-black font-sans block mt-1">المستوى {currentLevel}</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className="text-[10px] text-zinc-400 font-bold">مستوى الدماغ</span>
                <button
                  type="button"
                  onClick={handleTriggerCelebration}
                  title="عرض احتفال المستوى"
                  className="p-0.5 rounded-md hover:bg-white/10 text-amber-400 cursor-pointer transition-colors"
                >
                  <PartyPopper className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Total XP Card */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center min-w-[110px]">
              <Sparkles className="w-6 h-6 text-indigo-400 mx-auto" />
              <span className="text-base font-black font-sans block mt-1">{currentXp} XP</span>
              <span className="text-[10px] text-indigo-200/80 font-bold block">نقاط الخبرة الكلية ✨</span>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
          <div className="flex flex-wrap justify-between items-center text-xs font-bold gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-zinc-200 font-bold">التقدم للمستوى {currentLevel + 1}</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold border border-indigo-400/30">
                متبقي {Math.max(0, xpNeededForNextLevel - xpInCurrentLevel)} XP للصعود 🚀
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTriggerCelebration}
                className="text-[10px] text-amber-300 hover:text-amber-200 font-black flex items-center gap-1 cursor-pointer underline underline-offset-2"
              >
                <span>🎉 تجربة احتفال الترقية</span>
              </button>
              <span className="text-indigo-300 font-mono text-xs">{xpInCurrentLevel} / {xpNeededForNextLevel} XP ({xpProgressPercent}%)</span>
            </div>
          </div>
          <div className="w-full bg-black/40 h-3.5 rounded-full overflow-hidden border border-white/10 p-[2px] shadow-inner">
            <div 
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-400 h-full rounded-full transition-all duration-1000 shadow-sm"
              style={{ width: `${xpProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Leaderboard Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Player of the Week Spotlight Card */}
          <PlayerOfTheWeekCard
            token={token}
            currentUser={user}
            variant="gamification"
          />

          {/* Live Leaderboard Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500 animate-pulse" />
                  <span>لوحة المتصدرين العامة وشرف الدفعة 🏆</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">عرض الطلاب والدروس الحقيقية المنجزة</p>
              </div>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full font-extrabold animate-pulse border border-emerald-200 dark:border-emerald-800">
                تحديث مباشر
              </span>
            </div>

            {/* Timeframe selector tab */}
            <div className="p-2 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/60">
              <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
                <button
                  onClick={() => setTimeframe('allTime')}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${timeframe === 'allTime' ? 'bg-white dark:bg-zinc-800 shadow-xs text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}
                >
                  الترتيب العام (الكل)
                </button>
                <button
                  onClick={() => setTimeframe('monthly')}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${timeframe === 'monthly' ? 'bg-white dark:bg-zinc-800 shadow-xs text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}
                >
                  الترتيب الشهري
                </button>
                <button
                  onClick={() => setTimeframe('weekly')}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${timeframe === 'weekly' ? 'bg-white dark:bg-zinc-800 shadow-xs text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}
                >
                  الترتيب الأسبوعي
                </button>
              </div>
            </div>

            {/* Ranked Users List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="p-4 bg-zinc-50 dark:bg-zinc-950/20 rounded-2xl flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-3 w-3/4">
                        <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                        <div className="space-y-2 w-2/3">
                          <div className="w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                          <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                        </div>
                      </div>
                      <div className="w-16 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : leaderboardList.length === 0 ? (
                <div className="p-8 bg-zinc-50 dark:bg-zinc-950/20 rounded-2xl text-center space-y-2 text-xs">
                  <span className="text-2xl block">📭</span>
                  <span className="font-bold text-zinc-500 block text-sm">لا يوجد متنافسون حالياً</span>
                  <p className="text-xs text-zinc-400">كن أول من يذاكر ويسجل نقاط XP هنا!</p>
                </div>
              ) : (
                leaderboardList.map((student) => {
                  const rankIcon = student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : student.rank === 3 ? '🥉' : `#${student.rank}`;
                  const scoreLabel = timeframe === 'weekly' ? 'weeklyXp' : timeframe === 'monthly' ? 'monthlyXp' : 'xp';
                  const userScore = student[scoreLabel] || 0;
                  const lessons = getStudentLastLessons(student.isCurrentUser, student.lastLessons);
                  const hasCompletedLessons = Object.keys(lessons).length > 0;

                  return (
                    <div 
                      key={student.id} 
                      className={`p-4 rounded-2xl text-xs transition-all border space-y-3 ${
                        student.isCurrentUser 
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60 shadow-xs ring-1 ring-indigo-500/20' 
                          : 'bg-zinc-50/40 border-zinc-200/80 dark:bg-zinc-950/30 dark:border-zinc-800'
                      }`}
                    >
                      {/* Top Row: User info, rank, and XP */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-xl font-black font-sans flex items-center justify-center text-xs shrink-0 ${
                            student.rank === 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 border border-yellow-300' :
                            student.rank === 2 ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800' :
                            student.rank === 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 border border-amber-300' :
                            'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                          }`}>
                            {rankIcon}
                          </span>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className={`font-black text-sm block ${student.isCurrentUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
                                {student.name}
                              </span>
                              {student.isCurrentUser && (
                                <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black">أنت</span>
                              )}
                              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-lg font-bold">
                                {student.stream === 'science' ? 'شعبة علمي علوم' : student.stream === 'math' ? 'شعبة علمي رياضة' : 'شعبة أدبي'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-zinc-400">
                              <span>المستوى {student.level || 1}</span>
                              {student.currentStreak > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-orange-500 font-sans flex items-center gap-0.5">🔥 {student.currentStreak} أيام التزام</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* XP Badge */}
                        <div className="flex items-center gap-2 text-xs font-black">
                          <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-mono">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{userScore} XP</span>
                          </div>
                        </div>
                      </div>

                      {/* Subject Last Lessons Breakdown */}
                      <div className="pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/80">
                        <div className="text-[10px] font-bold text-zinc-400 mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-indigo-500" />
                            <span>آخر درس تم إنجازه لكل مادة:</span>
                          </div>
                          {hasCompletedLessons && (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                              {Object.keys(lessons).length} مواد منجزة
                            </span>
                          )}
                        </div>
                        {hasCompletedLessons ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(lessons).map(([subj, lesson]) => (
                              <div key={subj} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-2 rounded-xl text-[10px] flex flex-col justify-center">
                                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{subj}:</span>
                                <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate mt-0.5">{lesson}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-zinc-50/80 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 p-3 rounded-xl text-center space-y-1">
                            <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                              {student.isCurrentUser 
                                ? '📖 لم تسجل دراسة أي درس حتى الآن في جدول المنهج أو المراجعة.'
                                : '📖 لم يسجل هذا الطالب دراسة دروس بعد.'}
                            </p>
                            <p className="text-[9px] text-zinc-400">
                              {student.isCurrentUser 
                                ? 'عند دراسة أو مراجعة أي درس، سيظهر اسم آخر درس تم إنجازه هنا أمام زملائك بالدفعة!'
                                : 'ستظهر آخر الدروس المنجزة تلقائياً فور تسجيل جلسات التحصيل والمراجعة.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom champion box */}
            <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/80 dark:border-amber-900/30 rounded-2xl flex gap-3 text-right items-start">
              <Crown className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-amber-800 dark:text-amber-400 block font-bold">بطل الدفعة 👑</strong>
                <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                  تحدَّ زملائك في جميع الشعب والمحافظات بالالتزام والمذاكرة المستمرة لتصدر الترتيب!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Quests & Achievements */}
        <div className="lg:col-span-1 space-y-6">
          {/* Active Missions (Daily & Weekly) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-500" />
                <span>المهمات النشطة وغارات المذاكرة 🎯</span>
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                أكمل هذه الغارات لاكتساب رصيد XP لترقية مستواك الفكري!
              </p>
            </div>

            <div className="space-y-4">
              {/* Daily quests */}
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">الغارات اليومية (Daily Quests)</span>
                {gamification.dailyMissions.map((mission) => {
                  const isReadyToClaim = !mission.completed && mission.current >= mission.target;
                  return (
                    <div key={mission.id} className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs transition-all ${
                      mission.completed 
                        ? 'bg-emerald-50/20 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/20 text-zinc-400' 
                        : isReadyToClaim
                        ? 'bg-amber-50/40 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700/60 shadow-xs'
                        : 'bg-zinc-50/40 border-zinc-100 dark:bg-zinc-950/20 dark:border-zinc-850'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{mission.completed ? '🏆' : isReadyToClaim ? '🎁' : '⚔️'}</span>
                        <div className="text-right">
                          <span className={`font-black block ${mission.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                            {mission.title}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">التقدم الحالي: {mission.current} / {mission.target}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-zinc-100 pt-2 sm:pt-0">
                        {isReadyToClaim ? (
                          <button
                            type="button"
                            onClick={() => handleClaimMission(mission.id, false)}
                            className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-black text-[10px] shadow-sm flex items-center gap-1 cursor-pointer animate-pulse"
                          >
                            <Gift className="w-3 h-3" />
                            <span>استلام +{mission.xpReward} XP 🎁</span>
                          </button>
                        ) : (
                          <>
                            <div className="w-24 bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${mission.completed ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${Math.min(100, Math.round((mission.current / mission.target) * 100))}%` }}
                              />
                            </div>
                            <div className="text-left font-mono text-[10px] text-indigo-500 font-bold whitespace-nowrap">
                              +{mission.xpReward} XP
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weekly quests */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">الملحمات الأسبوعية (Weekly Quests)</span>
                {gamification.weeklyMissions.map((mission) => {
                  const isReadyToClaim = !mission.completed && mission.current >= mission.target;
                  return (
                    <div key={mission.id} className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs transition-all ${
                      mission.completed 
                        ? 'bg-blue-50/20 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/20 text-zinc-400' 
                        : isReadyToClaim
                        ? 'bg-amber-50/40 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700/60 shadow-xs'
                        : 'bg-zinc-50/40 border-zinc-100 dark:bg-zinc-950/20 dark:border-zinc-850'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{mission.completed ? '🎖️' : isReadyToClaim ? '🎁' : '🔒'}</span>
                        <div className="text-right">
                          <span className={`font-black block ${mission.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                            {mission.title}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">التقدم الحالي: {mission.current} / {mission.target}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-zinc-100 pt-2 sm:pt-0">
                        {isReadyToClaim ? (
                          <button
                            type="button"
                            onClick={() => handleClaimMission(mission.id, true)}
                            className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-black text-[10px] shadow-sm flex items-center gap-1 cursor-pointer animate-pulse"
                          >
                            <Gift className="w-3 h-3" />
                            <span>استلام +{mission.xpReward} XP 🎁</span>
                          </button>
                        ) : (
                          <>
                            <div className="w-24 bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${mission.completed ? 'bg-blue-500' : 'bg-violet-500'}`}
                                style={{ width: `${Math.min(100, Math.round((mission.current / mission.target) * 100))}%` }}
                              />
                            </div>
                            <div className="text-left font-mono text-[10px] text-violet-500 font-bold whitespace-nowrap">
                              +{mission.xpReward} XP
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Locked / Unlocked Achievements Grid */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-500" />
                <span>أوسمة الدماغ والإنجازات المستحقة 🏅</span>
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                أوسمة دائمة تُثبت التزامك وقوتك المعرفية في مرحلة الثانوية العامة.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gamification.achievements.map((ach) => (
                <div 
                  key={ach.id} 
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 text-xs transition-all ${
                    ach.completed 
                      ? 'bg-indigo-50/20 border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/20 text-zinc-700 dark:text-zinc-300' 
                      : 'bg-zinc-50/10 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60 text-zinc-400'
                  }`}
                >
                  <span className="text-2xl mt-0.5 shrink-0">{ach.completed ? '👑' : '🔒'}</span>
                  <div className="text-right space-y-1">
                    <span className={`font-black block ${ach.completed ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>
                      {ach.title}
                    </span>
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">{ach.description}</p>
                    {ach.completed ? (
                      <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> تم الحصول عليه (+{ach.xpReward} XP)
                      </span>
                    ) : (
                      <span className="text-[9px] text-zinc-400 font-semibold block">المكافأة: +{ach.xpReward} XP</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Celebratory Level-Up Modal Overlay */}
      <LevelUpCelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        newLevel={celebrationNewLevel}
        oldLevel={celebrationOldLevel}
        totalXp={currentXp}
      />
    </div>
  );
}

