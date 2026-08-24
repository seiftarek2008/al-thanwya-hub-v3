import React, { useState, useEffect, useMemo } from 'react';
import { 
  Crown, 
  Trophy, 
  Flame, 
  Zap, 
  Clock, 
  Sparkles, 
  Award, 
  ChevronLeft, 
  PartyPopper,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Heart,
  Share2
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import confetti from 'canvas-confetti';

export interface PlayerOfTheWeekData {
  id: string;
  name: string;
  profilePicture?: string;
  stream?: string;
  academicYear?: string;
  country?: string;
  weeklyXp: number;
  xp?: number;
  level?: number;
  currentStreak?: number;
  totalStudyHours?: number;
  tasksCompleted?: number;
  sessionsCompleted?: number;
  isCurrentUser?: boolean;
}

interface PlayerOfTheWeekCardProps {
  token?: string;
  currentUser?: any;
  onNavigateToLeaderboard?: () => void;
  variant?: 'homepage' | 'gamification';
}

export default function PlayerOfTheWeekCard({
  token,
  currentUser,
  onNavigateToLeaderboard,
  variant = 'homepage'
}: PlayerOfTheWeekCardProps) {
  const [topPlayer, setTopPlayer] = useState<PlayerOfTheWeekData | null>(null);
  const [allWeeklyRanked, setAllWeeklyRanked] = useState<PlayerOfTheWeekData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clapsCount, setClapsCount] = useState<number>(() => {
    const saved = localStorage.getItem('player_of_week_claps');
    return saved ? parseInt(saved, 10) : 24;
  });
  const [hasCheered, setHasCheered] = useState<boolean>(() => {
    return localStorage.getItem('player_of_week_cheered') === 'true';
  });

  // Calculate day of the week & coronation status (Friday only)
  const { isCoronationDay, dayName, nextCoronationText } = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0: Sunday, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
    const isFridayOnly = day === 5;
    
    const dayNames = [
      'الأحد',
      'الإثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الجمعة',
      'السبت'
    ];

    let nextText = '';
    if (day === 5) {
      nextText = 'يوم الجمعة (تتويج بطل الأسبوع الرسمي مستمر اليوم!)';
    } else {
      const daysUntilFri = (5 - day + 7) % 7;
      nextText = `باقي ${daysUntilFri} ${daysUntilFri === 1 ? 'يوم' : daysUntilFri === 2 ? 'يومان' : 'أيام'} على التتويج القادم (يوم الجمعة)`;
    }

    return {
      isCoronationDay: isFridayOnly,
      dayName: dayNames[day],
      nextCoronationText: nextText
    };
  }, []);

  // Process leaderboard entries and extract #1 top performer
  const processLeaderboardEntries = (entries: any[]) => {
    if (!entries || entries.length === 0) {
      // Fallback to current user or a default diligent student
      if (currentUser) {
        const userGamification = currentUser.data?.gamification || {};
        const fallbackPlayer: PlayerOfTheWeekData = {
          id: currentUser.id || 'user_current',
          name: currentUser.name || 'بطل الثانوية العامة',
          profilePicture: currentUser.profilePicture || '',
          stream: currentUser.stream || 'science',
          academicYear: currentUser.academicYear || 'third',
          country: currentUser.country || 'Egypt',
          weeklyXp: userGamification.xp || 450,
          xp: userGamification.xp || 450,
          level: userGamification.level || 2,
          currentStreak: userGamification.streak || 5,
          totalStudyHours: 18.5,
          tasksCompleted: 14,
          sessionsCompleted: 12,
          isCurrentUser: true
        };
        setTopPlayer(fallbackPlayer);
      }
      setIsLoading(false);
      return;
    }

    const sorted = [...entries].sort((a, b) => {
      const xpA = a.weeklyXp || 0;
      const xpB = b.weeklyXp || 0;
      if (xpB !== xpA) return xpB - xpA;

      const streakA = a.currentStreak || 0;
      const streakB = b.currentStreak || 0;
      if (streakB !== streakA) return streakB - streakA;

      const hoursA = a.totalStudyHours || 0;
      const hoursB = b.totalStudyHours || 0;
      return hoursB - hoursA;
    });

    const ranked: PlayerOfTheWeekData[] = sorted.map(item => ({
      ...item,
      isCurrentUser: item.id === currentUser?.id
    }));

    setAllWeeklyRanked(ranked);
    if (ranked.length > 0) {
      setTopPlayer(ranked[0]);
    }
    setIsLoading(false);
  };

  // Fetch via REST API
  const fetchWeeklyFromApi = async () => {
    try {
      const res = await fetch('/api/player-of-the-week', {
        headers: { 'x-auth-token': token || '' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.playerOfTheWeek) {
          setTopPlayer({
            ...data.playerOfTheWeek,
            isCurrentUser: data.playerOfTheWeek.id === currentUser?.id
          });
        }
      } else {
        // Fallback to leaderboard endpoint
        const lbRes = await fetch('/api/leaderboard?timeframe=weekly', {
          headers: { 'x-auth-token': token || '' }
        });
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          processLeaderboardEntries(lbData.leaderboard || []);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch player of the week from API, using local:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time Firestore sync with API fallback
  useEffect(() => {
    setIsLoading(true);
    let unsubscribe = () => {};

    if (db) {
      try {
        const colRef = collection(db, 'leaderboard');
        unsubscribe = onSnapshot(
          colRef,
          (snapshot) => {
            const list: any[] = [];
            snapshot.forEach((doc) => {
              list.push(doc.data());
            });
            if (list.length > 0) {
              processLeaderboardEntries(list);
            } else {
              fetchWeeklyFromApi();
            }
          },
          (err) => {
            console.warn('Firestore player of the week onSnapshot error, falling back to API:', err);
            fetchWeeklyFromApi();
          }
        );
      } catch (err) {
        console.warn('Firestore initialization error, falling back to API:', err);
        fetchWeeklyFromApi();
      }
    } else {
      fetchWeeklyFromApi();
    }

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id, token]);

  const handleCheerPlayer = () => {
    const nextCount = clapsCount + 1;
    setClapsCount(nextCount);
    setHasCheered(true);
    localStorage.setItem('player_of_week_claps', nextCount.toString());
    localStorage.setItem('player_of_week_cheered', 'true');

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}
  };

  const getStreamLabel = (stream?: string) => {
    switch (stream) {
      case 'science':
        return 'علمي علوم 🧬';
      case 'math':
        return 'علمي رياضة 📐';
      case 'literature':
        return 'شعبة أدبي 📚';
      default:
        return 'ثانوية عامة 🎓';
    }
  };

  const getYearLabel = (year?: string) => {
    switch (year) {
      case 'first':
        return 'الصف الأول الثانوي';
      case 'second':
        return 'الصف الثاني الثانوي';
      case 'third':
      default:
        return 'الصف الثالث الثانوي (دفعة 2027)';
    }
  };

  if (isLoading && !topPlayer) {
    return (
      <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 animate-pulse text-right" style={{ direction: 'rtl' }}>
        <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-3" />
        <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>
    );
  }

  const player: PlayerOfTheWeekData = topPlayer || {
    id: currentUser?.id || 'demo_top',
    name: currentUser?.name || 'طالب متميز',
    profilePicture: currentUser?.profilePicture || '',
    stream: currentUser?.stream || 'science',
    academicYear: currentUser?.academicYear || 'third',
    weeklyXp: 520,
    currentStreak: 6,
    totalStudyHours: 21.5,
    tasksCompleted: 16,
    sessionsCompleted: 12,
    isCurrentUser: true
  };

  const isUserWinner = player.isCurrentUser || player.id === currentUser?.id;

  return (
    <div
      id="player-of-the-week-widget"
      className={`relative overflow-hidden rounded-3xl transition-all shadow-md ${
        isCoronationDay
          ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-indigo-950/20 dark:from-amber-950/30 dark:via-zinc-900 dark:to-amber-900/20 border-2 border-amber-400/80 dark:border-amber-500/60 shadow-amber-500/10'
          : 'bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs'
      }`}
      style={{ direction: 'rtl' }}
    >
      {/* Decorative Golden Ambient Backdrops */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-400/15 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Tag Banner */}
      <div className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${
        isCoronationDay
          ? 'bg-amber-500/15 dark:bg-amber-950/40 border-amber-250 dark:border-amber-900/60'
          : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-150 dark:border-zinc-800'
      }`}>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-amber-500 text-white shadow-xs">
            <Crown className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                نجم الأسبوع الأكثر اجتهاداً (Player of the Week)
              </span>
              {isCoronationDay ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                  👑 تتويج رسمي نهاية الأسبوع (يوم الجمعة)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {dayName} • التتويج كل جمعة 🏆
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hidden sm:inline">
            {nextCoronationText}
          </span>
          {onNavigateToLeaderboard && (
            <button
              onClick={onNavigateToLeaderboard}
              className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>لوحة الأوائل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Winner Profile Avatar & Identity */}
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 p-0.5 shadow-md">
                <div className="w-full h-full rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 overflow-hidden">
                  {player.profilePicture ? (
                    <img
                      src={player.profilePicture}
                      alt={player.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{player.name ? player.name.charAt(0) : '🎓'}</span>
                  )}
                </div>
              </div>
              <div className="absolute -top-2 -right-2 p-1 rounded-full bg-amber-500 text-white shadow-xs">
                <Crown className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50">
                  {player.name}
                </h3>
                {isUserWinner && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    أنت بطل الأسبوع 🌟👏
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold">{getStreamLabel(player.stream)}</span>
                <span>•</span>
                <span>{getYearLabel(player.academicYear)}</span>
              </div>
            </div>
          </div>

          {/* Quick Cheering Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCheerPlayer}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                hasCheered
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                  : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-md active:scale-95'
              }`}
              title="شجع وبارك لبطل الأسبوع"
            >
              <PartyPopper className="w-4 h-4 text-amber-500" />
              <span>{hasCheered ? 'باركت له 👏' : 'شجع وبارك له 👏'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-extrabold">
                {clapsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Diligence Stat Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-150 dark:border-zinc-750/60">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>نقاط الأسبوع (XP)</span>
            </div>
            <div className="text-lg font-black text-zinc-900 dark:text-zinc-50">
              +{player.weeklyXp || 0} <span className="text-xs text-zinc-400 font-normal">XP</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-150 dark:border-zinc-750/60">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>ساعات المذاكرة</span>
            </div>
            <div className="text-lg font-black text-zinc-900 dark:text-zinc-50">
              {player.totalStudyHours || 0} <span className="text-xs text-zinc-400 font-normal">ساعة</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-150 dark:border-zinc-750/60">
            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-xs font-bold mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>سلسلة الانضباط</span>
            </div>
            <div className="text-lg font-black text-zinc-900 dark:text-zinc-50">
              {player.currentStreak || 0} <span className="text-xs text-zinc-400 font-normal">يوم متواصل</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-150 dark:border-zinc-750/60">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>المهام المنجزة</span>
            </div>
            <div className="text-lg font-black text-zinc-900 dark:text-zinc-50">
              {player.tasksCompleted || player.sessionsCompleted || 0} <span className="text-xs text-zinc-400 font-normal">مهمة</span>
            </div>
          </div>
        </div>

        {/* Informational & Motivational Footer */}
        <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/40 dark:border-amber-800/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400 font-black">💡 نظام التتويج الأسبوعي:</span>
            <span className="text-zinc-600 dark:text-zinc-300 font-medium">
              يتم رصد الطالب الأكثر اجتهاداً بناءً على نقاط الخبرة وساعات المذاكرة وسلسلة الأيام وإعلانه للجميع كل يوم جمعة.
            </span>
          </div>
          {onNavigateToLeaderboard && (
            <button
              onClick={onNavigateToLeaderboard}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-xl transition-all shrink-0 cursor-pointer shadow-xs"
            >
              عرض الترتيب الكامل 🏆
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
