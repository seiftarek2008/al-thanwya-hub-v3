/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { 
  Clock, 
  Flame, 
  CheckCircle, 
  CheckCircle2, 
  Award, 
  Brain, 
  AlertTriangle, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  CalendarDays, 
  Hourglass, 
  Activity, 
  Info, 
  RefreshCw, 
  PlayCircle, 
  Layers, 
  Settings, 
  HelpCircle, 
  Smile, 
  ArrowUpRight,
  Play,
  Pause,
  RotateCcw,
  Mic,
  Volume2,
  Compass,
  Target,
  BarChart3,
  Trash2,
  Search,
  CheckSquare,
  Square,
  BookOpen,
  CalendarRange,
  Plus,
  Check,
  Edit2,
  Save
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

import { getStoredVoiceNotes } from '../utils/voiceNotesStore';

import { 
  Subject, 
  StudySession, 
  Task, 
  Exam, 
  GradeRecord, 
  DailyHistoryLog, 
  SpacedRepetitionItem, 
  Gamification,
  LifestyleProfile
} from '../types';
import DailyGoalsModal from './DailyGoalsModal';

import { 
  generateHistoryTimeline, 
  aggregateHistoryForRange 
} from '../utils/historyAnalytics';

import { 
  completeReviewMilestone, 
  rescheduleMissedReviews 
} from '../utils/spacedRepetition';

interface StatsDashboardProps {
  subjects: Subject[];
  sessions: StudySession[];
  tasks: Task[];
  streak: number;
  exams?: Exam[];
  grades?: GradeRecord[];
  
  // NEW attributes
  thanaweyaStartDate: string;
  onUpdateThanaweyaStartDate: (date: string) => void;
  spacedRepetitionReviews: SpacedRepetitionItem[];
  onUpdateSpacedRepetitionReviews: (reviews: SpacedRepetitionItem[]) => void;
  customHistoryLogs: DailyHistoryLog[];
  onUpdateCustomHistoryLogs: (logs: DailyHistoryLog[]) => void;
  gamification: Gamification;
  onUpdateGamification: (g: Gamification) => void;
  token?: string;
  curriculumProgress?: any;
  initialSubTab?: 'daily' | 'longterm' | 'spaced' | 'memory';
  isHomeScreen?: boolean;
  setActiveTab?: (tab: any) => void;
  onToggleActivityCompletion?: (id: string, updates?: any) => void;
  plannerActivities?: any[];
  onAddDailyCheckin?: (checkin: any) => void;
  onTriggerCheckin?: () => void;
  dailyCheckins?: any[];
  user?: any;
  onSessionComplete?: (session: any) => void;
  onOpenStudentGuide?: () => void;
  onRenameLesson?: (subjectId: string, oldName: string, newName: string, lessonId?: string) => void;
  onUpdatePlannerActivity?: (activity: any) => void;
  lifestyleProfile?: LifestyleProfile;
  onUpdateLifestyleProfile?: (profile: LifestyleProfile) => void;
}

const MOTIVATIONAL_QUOTES = [
  { text: "الانضباط الذاتي هو الجسر الحقيقي بين أحلامك وإنجازاتك اليومية.. قوم ابدأ وماتترددش! ⚡", tag: "جرعة انضباط واستمرارية 🚀" },
  { text: "التعب اليومي وبذل المجهود بيروح، لكن مجموعك العالي وفرحة أهلك هتفضل معلّقة فخر طوال العمر! ❤️", tag: "وقود الشغف اليومي 🔥" },
  { text: "الثانوية العامة مش سباق سرعة، دي ماراثون نفَس طويل.. خطوة صغيرة منظمة كل يوم بتوصلك للقمة! 🎓", tag: "قانون الخطوات الثابتة 🏔️" },
  { text: "الالتزام مش إنك تكون متحمس كل يوم.. الالتزام هو إنك تفتح كتابك وتنجز مستهدفك حتى في الأيام الصعبة.", tag: "قاعدة الأبطال 💪" },
  { text: "التركيز ساعة واحدة بذهن حاضر ومستهدف محدد أفضل من 10 ساعات تشتت وتسويف. ابدأ جلستك فوراً! ⏱️", tag: "استراتيجية المذاكرة الذكية 🧠" },
  { text: "مش مهم أنت فين النهاردة ولا فاضلك قد إيه.. المهم إنك بتاخد خطوة حقيقية لقدام في كل جزء من يومك.", tag: "مبدأ الاستمرارية 🌟" },
  { text: "كل درس بتفهمه وكل مسألة بتحلها النهاردة بتشيل من عليك عبء كبير يوم الامتحان. استعن بالله!", tag: "اليقين والعمل 🤲" },
  { text: "العافية مجدعة والرب الموفق.. اعمل اللي عليك بصدق وبدون قلق، وسعيك مش هيضيع ابداً إطلاقاً.", tag: "توفيق ورضا 🏆" },
];

export default function StatsDashboard({
  subjects = [],
  sessions = [],
  tasks = [],
  streak = 0,
  exams = [],
  grades = [],
  thanaweyaStartDate,
  onUpdateThanaweyaStartDate,
  spacedRepetitionReviews = [],
  onUpdateSpacedRepetitionReviews,
  customHistoryLogs = [],
  onUpdateCustomHistoryLogs,
  gamification,
  onUpdateGamification,
  token,
  curriculumProgress,
  initialSubTab,
  isHomeScreen = false,
  setActiveTab,
  onToggleActivityCompletion,
  plannerActivities = [],
  onAddDailyCheckin,
  onTriggerCheckin,
  dailyCheckins = [],
  user,
  onSessionComplete,
  onOpenStudentGuide,
  onRenameLesson,
  onUpdatePlannerActivity,
  lifestyleProfile,
  onUpdateLifestyleProfile
}: StatsDashboardProps) {
  
  // Tab Management: 'daily' | 'longterm' | 'spaced' | 'memory'
  const [subTab, setSubTab] = useState<'daily' | 'longterm' | 'spaced' | 'memory'>(initialSubTab || 'daily');
  const [showDailyGoalsModal, setShowDailyGoalsModal] = useState(false);

  // Motivational Daily Quote State
  const [quoteIndex, setQuoteIndex] = useState(() => {
    return new Date().getDate() % MOTIVATIONAL_QUOTES.length;
  });

  const activeQuote = MOTIVATIONAL_QUOTES[quoteIndex] || MOTIVATIONAL_QUOTES[0];

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
  };

  React.useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Sync memory sub-tab setting when on dedicated memory screen
  React.useEffect(() => {
    if (!isHomeScreen && (subTab === 'daily' || subTab === 'longterm')) {
      setSubTab('spaced');
    }
  }, [isHomeScreen, subTab]);

  // --- HOME SCREEN DAILY CHECKIN STATES ---
  const [showCheckinForm, setShowCheckinForm] = React.useState(false);
  const [sleepHours, setSleepHours] = React.useState(7);
  const [sleepQuality, setSleepQuality] = React.useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [mood, setMood] = React.useState<'stressed' | 'tired' | 'neutral' | 'motivated' | 'calm'>('calm');
  const [stressLevel, setStressLevel] = React.useState(30);
  const [checkinSavedMsg, setCheckinSavedMsg] = React.useState(false);

  // Today Date Helper
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // --- HOME / STATS BAR CHART TIME RANGE CONFIG ---
  // Allow open-ended range from start of journey/year to current date, or custom week X to week Y
  const [barChartMode, setBarChartMode] = React.useState<'fromStart' | 'last7days' | 'last14days' | 'last30days' | 'customWeeks' | 'allYear'>('fromStart');
  const [barChartStartWeek, setBarChartStartWeek] = React.useState<number>(1);

  // Calculate current academic week number based on thanaweyaStartDate
  const currentWeekNumber = useMemo(() => {
    if (!thanaweyaStartDate) return 1;
    const s = new Date(thanaweyaStartDate).getTime();
    const now = Date.now();
    const diffDays = Math.max(0, Math.floor((now - s) / (1000 * 60 * 60 * 24)));
    return Math.max(1, Math.floor(diffDays / 7) + 1);
  }, [thanaweyaStartDate]);

  const [barChartEndWeek, setBarChartEndWeek] = React.useState<number>(() => Math.max(currentWeekNumber, 1));

  // Filter planner activities for today (0-6 representation)
  const todaysActivities = React.useMemo(() => {
    const todayDay = new Date().getDay();
    return plannerActivities
      .filter(act => act.dayOfWeek === todayDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [plannerActivities]);

  // Calculate total study hours done in last 7 days
  const weeklyStudyHours = React.useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const totalSecs = sessions
      .filter(s => new Date(s.timestamp) >= sevenDaysAgo)
      .reduce((acc, s) => acc + s.duration, 0);
    return Number((totalSecs / 3600).toFixed(1));
  }, [sessions]);

  // Filter exams occurring in the next 7 days
  const upcomingExams = React.useMemo(() => {
    if (!exams) return [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    
    return exams.filter(ex => {
      const exDate = new Date(ex.date);
      exDate.setHours(0,0,0,0);
      return exDate >= today && exDate <= sevenDaysLater;
    }).sort((a,b) => a.date.localeCompare(b.date));
  }, [exams]);

  // Check if checkin was completed today
  const hasDoneCheckinToday = React.useMemo(() => {
    return dailyCheckins.some(c => c && c.date && (c.date === todayStr || c.date.startsWith(todayStr)));
  }, [dailyCheckins, todayStr]);

  // Provide neuro-advice if any fatigue or sleep depletion is observed
  const fatigueAlert = React.useMemo(() => {
    if (dailyCheckins.length === 0) return null;
    const sorted = [...dailyCheckins].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0];
    if (latest.stressLevel > 65) {
      return "⚠️ تنبيه الإجهاد الذهني: نلاحظ زيادة في مستويات التوتر لديك مؤخراً. تذكر أن المذاكرة لساعات طويلة دون فترات راحة تقلل الاستيعاب الفعلي وتسبب النسيان السريع. خذ قسطاً من الراحة الآن لتجدد طاقتك العصبية.";
    }
    if (latest.sleepHours < 6) {
      return "💡 تنبيه مستشار النوم: نومك أقل من 6 ساعات يمنع انتقال المعلومات للذاكرة الدائمة ويعيق ترميم خلايا الدماغ. نوصيك بإنهاء المذاكرة مبكراً الليلة لتعويض طاقتك وتحسين استقرار الذاكرة.";
    }
    return null;
  }, [dailyCheckins]);

  // 7-day study adherence & target comparison data for the home screen mini chart
  const weeklyAdherenceData = useMemo(() => {
    const arabicDayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const shortDayNames = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    const result = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayOfWeek = d.getDay();
      const isToday = i === 0;

      // 1. Calculate actual hours from sessions
      const daySessions = sessions.filter(s => {
        if (!s) return false;
        if (s.date && s.date === dateStr) return true;
        if (s.timestamp) {
          if (s.timestamp.startsWith(dateStr)) return true;
          try {
            const dt = new Date(s.timestamp);
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, '0');
            const dayNum = String(dt.getDate()).padStart(2, '0');
            if (`${y}-${m}-${dayNum}` === dateStr) return true;
          } catch {
            // fallback
          }
        }
        return false;
      });
      const actualSecs = daySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
      const actualHours = Number((actualSecs / 3600).toFixed(1));

      // 2. Calculate target hours from plannerActivities for that day of week, or fallback to user configured daily/weekly target from lifestyleProfile
      const dayActivities = plannerActivities.filter(a => a.dayOfWeek === dayOfWeek);
      let targetHours = 0;
      if (dayActivities.length > 0) {
        targetHours = dayActivities.reduce((acc, a) => {
          if (a.duration) return acc + a.duration / 60;
          if (a.startTime && a.endTime) {
            const [sh, sm] = a.startTime.split(':').map(Number);
            const [eh, em] = a.endTime.split(':').map(Number);
            const diff = (eh * 60 + em) - (sh * 60 + sm);
            if (diff > 0) return acc + diff / 60;
          }
          return acc + 2;
        }, 0);
        targetHours = Number(targetHours.toFixed(1));
      }
      
      // Fallback target: User configured daily target from LifestyleProfile preferences, or weeklyGoals / 7, or 4 hrs default
      if (targetHours === 0) {
        const configuredDaily = lifestyleProfile?.personalPreferences?.maxStudyHoursPerDay;
        const configuredWeekly = lifestyleProfile?.weeklyGoals?.studyHours;
        if (configuredDaily && configuredDaily > 0) {
          targetHours = Number(configuredDaily);
        } else if (configuredWeekly && configuredWeekly > 0) {
          targetHours = Number((configuredWeekly / 7).toFixed(1));
        } else {
          targetHours = 4.0;
        }
      }

      const adherenceRate = Math.min(Math.round((actualHours / (targetHours || 1)) * 100), 200);

      result.push({
        date: dateStr,
        dayLabel: isToday ? 'اليوم' : shortDayNames[dayOfWeek],
        fullDayName: arabicDayNames[dayOfWeek],
        formattedDate: `${d.getDate()}/${d.getMonth() + 1}`,
        actualHours,
        targetHours,
        adherenceRate,
        isToday,
        metTarget: actualHours >= targetHours && actualHours > 0,
      });
    }

    return result;
  }, [sessions, plannerActivities, lifestyleProfile]);

  // Aggregate 7-day stats
  const weeklyAdherenceSummary = useMemo(() => {
    const totalActual = weeklyAdherenceData.reduce((acc, d) => acc + d.actualHours, 0);
    const totalTarget = weeklyAdherenceData.reduce((acc, d) => acc + d.targetHours, 0);
    const daysMet = weeklyAdherenceData.filter(d => d.actualHours >= d.targetHours && d.actualHours > 0).length;
    const overallRate = totalTarget > 0 ? Math.min(Math.round((totalActual / totalTarget) * 100), 100) : 0;
    
    // Find best productive day
    let bestDay = weeklyAdherenceData[0];
    for (const d of weeklyAdherenceData) {
      if (d.actualHours > (bestDay?.actualHours || 0)) {
        bestDay = d;
      }
    }

    return {
      totalActual: Number(totalActual.toFixed(1)),
      totalTarget: Number(totalTarget.toFixed(1)),
      daysMet,
      overallRate,
      bestDay: bestDay && bestDay.actualHours > 0 ? `${bestDay.fullDayName} (${bestDay.actualHours} س)` : 'لا توجد جلسات كافية'
    };
  }, [weeklyAdherenceData]);

  // Dynamically calculated user weekly and daily targets
  const userWeeklyTargetHours = React.useMemo(() => {
    const configuredWeekly = lifestyleProfile?.weeklyGoals?.studyHours;
    const configuredDaily = lifestyleProfile?.personalPreferences?.maxStudyHoursPerDay;
    if (configuredWeekly && configuredWeekly > 0) return configuredWeekly;
    if (configuredDaily && configuredDaily > 0) return Number((configuredDaily * 7).toFixed(1));
    if (weeklyAdherenceSummary?.totalTarget && weeklyAdherenceSummary.totalTarget > 0) return weeklyAdherenceSummary.totalTarget;
    return 28;
  }, [lifestyleProfile, weeklyAdherenceSummary]);

  const userDailyTargetHours = React.useMemo(() => {
    const configuredDaily = lifestyleProfile?.personalPreferences?.maxStudyHoursPerDay;
    if (configuredDaily && configuredDaily > 0) return configuredDaily;
    return Number((userWeeklyTargetHours / 7).toFixed(1));
  }, [lifestyleProfile, userWeeklyTargetHours]);

  // 1. Generate full timeline logs dynamically from the Thanaweya Start Date up to Today!
  const fullTimelineLogs = useMemo(() => {
    return generateHistoryTimeline(
      thanaweyaStartDate,
      todayStr,
      sessions,
      tasks,
      grades,
      exams,
      [], // burnout
      [], // stress
      [], // checkins
      gamification,
      subjects,
      curriculumProgress,
      customHistoryLogs
    );
  }, [
    thanaweyaStartDate,
    todayStr,
    sessions,
    tasks,
    grades,
    exams,
    gamification,
    subjects,
    curriculumProgress,
    customHistoryLogs
  ]);

  // Save the newly generated/computed history logs when it updates
  const handleRecalculateHistory = () => {
    onUpdateCustomHistoryLogs(fullTimelineLogs);
  };

  // Compute logs for the bar chart based on selected range
  const filteredBarChartLogs = useMemo(() => {
    if (fullTimelineLogs.length === 0) return [];
    
    if (barChartMode === 'last7days') {
      return fullTimelineLogs.slice(-7);
    }
    if (barChartMode === 'last14days') {
      return fullTimelineLogs.slice(-14);
    }
    if (barChartMode === 'last30days') {
      return fullTimelineLogs.slice(-30);
    }
    if (barChartMode === 'fromStart' || barChartMode === 'allYear') {
      return fullTimelineLogs;
    }
    if (barChartMode === 'customWeeks') {
      const minW = Math.min(barChartStartWeek, barChartEndWeek);
      const maxW = Math.max(barChartStartWeek, barChartEndWeek);
      const startIndex = (minW - 1) * 7;
      const endIndex = maxW * 7;
      return fullTimelineLogs.slice(startIndex, endIndex);
    }
    return fullTimelineLogs;
  }, [fullTimelineLogs, barChartMode, barChartStartWeek, barChartEndWeek]);

  // Aggregate data by weeks if range is long (> 14 days)
  const isAggregatedByWeeks = filteredBarChartLogs.length > 21;
  const barChartDisplayData = useMemo(() => {
    if (!isAggregatedByWeeks) {
      return filteredBarChartLogs.map(log => {
        const d = new Date(log.date);
        const days = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
        return {
          id: log.date,
          label: days[d.getDay()],
          subLabel: log.date.substring(5),
          hours: log.studyMinutes / 60,
          focusScore: log.focusScore,
          date: log.date
        };
      });
    }

    // Group into weekly blocks of 7 days
    const weeklyBuckets: Array<{
      id: string;
      label: string;
      subLabel: string;
      hours: number;
      focusScore: number;
      daysCount: number;
      dateRange: string;
    }> = [];

    for (let i = 0; i < filteredBarChartLogs.length; i += 7) {
      const chunk = filteredBarChartLogs.slice(i, i + 7);
      const weekIndex = Math.floor(i / 7) + 1;
      const totalHours = chunk.reduce((acc, c) => acc + (c.studyMinutes / 60), 0);
      const focusScores = chunk.filter(c => c.focusScore > 0);
      const avgFocus = focusScores.length > 0 
        ? Math.round(focusScores.reduce((acc, c) => acc + c.focusScore, 0) / focusScores.length)
        : 0;
      const firstDay = chunk[0]?.date.substring(5) || '';
      const lastDay = chunk[chunk.length - 1]?.date.substring(5) || '';

      weeklyBuckets.push({
        id: `week-${weekIndex}`,
        label: `أسبوع ${weekIndex}`,
        subLabel: `${firstDay} ➔ ${lastDay}`,
        hours: Number(totalHours.toFixed(1)),
        focusScore: avgFocus,
        daysCount: chunk.length,
        dateRange: `${firstDay} إلى ${lastDay}`
      });
    }

    return weeklyBuckets;
  }, [filteredBarChartLogs, isAggregatedByWeeks]);

  // 4. Memory Health Analytics calculations
  const memoryStats = useMemo(() => {
    const total = spacedRepetitionReviews.length;
    if (total === 0) {
      return {
        memoryHealth: 0,
        retentionIndex: 0,
        knowledgeCount: 0,
        riskLessons: [],
        masteredLessons: [],
        upcomingCount: 0,
        overdueCount: 0,
        successRate: 100,
        subjectBreakdown: [],
        forgettingCurveData: [
          { name: 'اليوم 0', 'بدون مراجعة': 100, 'مع استدعاء نشط': 100 },
          { name: 'اليوم 1', 'بدون مراجعة': 80, 'مع استدعاء نشط': 98 },
          { name: 'اليوم 3', 'بدون مراجعة': 60, 'مع استدعاء نشط': 95 },
          { name: 'اليوم 5', 'بدون مراجعة': 45, 'مع استدعاء نشط': 92 },
          { name: 'اليوم 7', 'بدون مراجعة': 35, 'مع استدعاء نشط': 89 },
          { name: 'اليوم 10', 'بدون مراجعة': 25, 'مع استدعاء نشط': 86 },
          { name: 'اليوم 15', 'بدون مراجعة': 15, 'مع استدعاء نشط': 82 },
        ]
      };
    }

    const avgStrength = Math.round(
      spacedRepetitionReviews.reduce((sum, r) => sum + (r.memoryStrength || 0), 0) / total
    );
    const avgRetention = Math.round(
      spacedRepetitionReviews.reduce((sum, r) => sum + (r.retentionEstimate || 0), 0) / total
    );

    const risk = spacedRepetitionReviews.filter(r => (r.retentionEstimate || 0) < 60);
    const mastered = spacedRepetitionReviews.filter(
      r => (r.memoryStrength || 0) >= 85 && (r.repetitions || 0) >= 4
    );

    const todayVal = new Date(todayStr);
    const sevenDaysFromNow = new Date(todayStr);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcoming = spacedRepetitionReviews.filter(r => {
      const d = new Date(r.nextReviewDate);
      return d > todayVal && d <= sevenDaysFromNow;
    });

    const overdue = spacedRepetitionReviews.filter(r => r.nextReviewDate < todayStr);

    let totalHistory = 0;
    let successfulHistory = 0;
    spacedRepetitionReviews.forEach(item => {
      (item.history || []).forEach(h => {
        totalHistory++;
        if (h.confidenceScore >= 3) {
          successfulHistory++;
        }
      });
    });

    const successRate = totalHistory > 0 ? Math.round((successfulHistory / totalHistory) * 100) : 100;

    // Subject Breakdown
    const subjectsMap: { [key: string]: { sum: number; count: number } } = {};
    spacedRepetitionReviews.forEach(r => {
      if (!subjectsMap[r.subjectName]) {
        subjectsMap[r.subjectName] = { sum: 0, count: 0 };
      }
      subjectsMap[r.subjectName].sum += (r.memoryStrength || 0);
      subjectsMap[r.subjectName].count += 1;
    });

    const subjectBreakdown = Object.keys(subjectsMap).map(subName => {
      const entry = subjectsMap[subName];
      return {
        subject: subName.split(' (')[0],
        'قوة الذاكرة': Math.round(entry.sum / entry.count)
      };
    });

    // Forgetting Curve Simulation
    const forgettingCurveData = [
      { name: 'اليوم 0', 'بدون مراجعة': 100, 'مع استدعاء نشط': 100 },
      { name: 'اليوم 1', 'بدون مراجعة': 80, 'مع استدعاء نشط': 98 },
      { name: 'اليوم 3', 'بدون مراجعة': 60, 'مع استدعاء نشط': 95 },
      { name: 'اليوم 5', 'بدون مراجعة': 45, 'مع استدعاء نشط': 92 },
      { name: 'اليوم 7', 'بدون مراجعة': 35, 'مع استدعاء نشط': 89 },
      { name: 'اليوم 10', 'بدون مراجعة': 25, 'مع استدعاء نشط': 86 },
      { name: 'اليوم 15', 'بدون مراجعة': 15, 'مع استدعاء نشط': 82 },
    ];

    return {
      memoryHealth: avgStrength,
      retentionIndex: avgRetention,
      knowledgeCount: total,
      riskLessons: risk,
      masteredLessons: mastered,
      upcomingCount: upcoming.length,
      overdueCount: overdue.length,
      successRate,
      subjectBreakdown,
      forgettingCurveData
    };
  }, [spacedRepetitionReviews, todayStr]);

  // 2. LONG-TERM COMPARISONS PRESETS
  const [comparisonPreset, setComparisonPreset] = useState<'today_yesterday' | 'week_week' | 'month_month' | 'semester_semester' | 'custom'>('week_week');
  const [customStartA, setCustomStartA] = useState<string>('');
  const [customEndA, setCustomEndA] = useState<string>('');
  const [customStartB, setCustomStartB] = useState<string>('');
  const [customEndB, setCustomEndB] = useState<string>('');

  // Resolved date ranges for comparisons
  const comparisonRanges = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayDateStr = today.toISOString().split('T')[0];
    const yesterdayDateStr = yesterday.toISOString().split('T')[0];

    switch (comparisonPreset) {
      case 'today_yesterday':
        return {
          labelA: 'اليوم',
          labelB: 'أمس',
          startA: todayDateStr,
          endA: todayDateStr,
          startB: yesterdayDateStr,
          endB: yesterdayDateStr
        };
      case 'week_week':
        // This Week: last 7 days
        const startThisWeek = new Date();
        startThisWeek.setDate(today.getDate() - 6);
        const startLastWeek = new Date();
        startLastWeek.setDate(today.getDate() - 13);
        const endLastWeek = new Date();
        endLastWeek.setDate(today.getDate() - 7);

        return {
          labelA: 'هذا الأسبوع',
          labelB: 'الأسبوع الماضي',
          startA: startThisWeek.toISOString().split('T')[0],
          endA: todayDateStr,
          startB: startLastWeek.toISOString().split('T')[0],
          endB: endLastWeek.toISOString().split('T')[0]
        };
      case 'month_month':
        // This Month: last 30 days vs previous 30 days
        const startThisMonth = new Date();
        startThisMonth.setDate(today.getDate() - 29);
        const startLastMonth = new Date();
        startLastMonth.setDate(today.getDate() - 59);
        const endLastMonth = new Date();
        endLastMonth.setDate(today.getDate() - 30);

        return {
          labelA: 'هذا الشهر',
          labelB: 'الشهر الماضي',
          startA: startThisMonth.toISOString().split('T')[0],
          endA: todayDateStr,
          startB: startLastMonth.toISOString().split('T')[0],
          endB: endLastMonth.toISOString().split('T')[0]
        };
      case 'semester_semester':
        // Fallback semester estimates (90 days blocks)
        const startSemA = new Date();
        startSemA.setDate(today.getDate() - 89);
        const startSemB = new Date();
        startSemB.setDate(today.getDate() - 179);
        const endSemB = new Date();
        endSemB.setDate(today.getDate() - 90);

        return {
          labelA: 'الفصل الدراسي الحالي',
          labelB: 'الفصل الدراسي السابق',
          startA: startSemA.toISOString().split('T')[0],
          endA: todayDateStr,
          startB: startSemB.toISOString().split('T')[0],
          endB: endSemB.toISOString().split('T')[0]
        };
      case 'custom':
      default:
        return {
          labelA: 'الفترة أ',
          labelB: 'الفترة ب',
          startA: customStartA || todayDateStr,
          endA: customEndA || todayDateStr,
          startB: customStartB || yesterdayDateStr,
          endB: customEndB || yesterdayDateStr
        };
    }
  }, [comparisonPreset, customStartA, customEndA, customStartB, customEndB]);

  // Aggregate metrics for Range A and Range B
  const statsA = useMemo(() => {
    return aggregateHistoryForRange(fullTimelineLogs, comparisonRanges.startA, comparisonRanges.endA);
  }, [fullTimelineLogs, comparisonRanges]);

  const statsB = useMemo(() => {
    return aggregateHistoryForRange(fullTimelineLogs, comparisonRanges.startB, comparisonRanges.endB);
  }, [fullTimelineLogs, comparisonRanges]);

  // Entire Journey aggregated stats
  const journeyStats = useMemo(() => {
    return aggregateHistoryForRange(fullTimelineLogs, thanaweyaStartDate, todayStr);
  }, [fullTimelineLogs, thanaweyaStartDate, todayStr]);


  // 3. AI INSIGHTS ENGINE
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');

  const generateAIInsights = async () => {
    setIsGeneratingInsights(true);
    setAiError('');
    try {
      const res = await fetch('/api/analytics/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          rangeSummary: statsA,
          recentLogs: fullTimelineLogs.slice(-14) // send last 14 days logs for deep context
        })
      });
      const resData = await res.json();
      if (res.ok) {
        setAiInsights(resData.insights);
      } else {
        setAiError(resData.error || 'حدث خطأ أثناء تحميل التقرير الذكي.');
      }
    } catch (e) {
      setAiError('تعذر الاتصال بالخادم. يرجى التحقق من اتصال الشبكة.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };


  // Helper to render subject icons cleanly as emojis rather than raw text strings (like 'BookOpen')
  const renderSubjectIconEmoji = (iconName?: string) => {
    if (!iconName) return '📚';
    if (iconName === 'BookOpen' || iconName === 'book') return '📖';
    if (iconName === 'Languages' || iconName === 'globe') return '🌐';
    if (iconName === 'Layers' || iconName === 'layers') return '📐';
    if (iconName === 'Flame' || iconName === 'flame') return '🔥';
    if (iconName === 'Compass') return '🧭';
    if (iconName === 'FlaskConical') return '🧪';
    if (iconName === 'Brain') return '🧠';
    if (/[^\x00-\x7F]/.test(iconName)) {
      return iconName;
    }
    return '📚';
  };

  // 4. SPACED REPETITION / REVISIONS STATE
  const [spacedFilter, setSpacedFilter] = useState<'all' | 'today' | 'upcoming' | 'missed'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [lessonSearchQuery, setLessonSearchQuery] = useState<string>('');
  const [activeReviewItem, setActiveReviewItem] = useState<SpacedRepetitionItem | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(5);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string>('');

  // 8 Structured Spaced Repetition Review Stages
  const REVIEW_STAGES = [
    { days: 1, label: 'بعد يوم (1 يوم)', question: 'هل راجعت هذا الدرس بعد يوم؟' },
    { days: 3, label: 'بعد 3 أيام', question: 'هل راجعت هذا الدرس بعد 3 أيام؟' },
    { days: 7, label: 'بعد أسبوع (7 أيام)', question: 'هل راجعت هذا الدرس بعد أسبوع؟' },
    { days: 14, label: 'بعد أسبوعين (14 يوماً)', question: 'هل راجعت هذا الدرس بعد أسبوعين؟' },
    { days: 30, label: 'بعد شهر (30 يوماً)', question: 'هل راجعت هذا الدرس بعد شهر؟' },
    { days: 60, label: 'بعد شهرين (60 يوماً)', question: 'هل راجعت هذا الدرس بعد شهرين؟' },
    { days: 90, label: 'بعد 3 أشهر (90 يوماً)', question: 'هل راجعت هذا الدرس بعد 3 أشهر؟' },
    { days: 180, label: 'بعد 6 أشهر (180 يوماً)', question: 'هل راجعت هذا الدرس بعد 6 أشهر؟' }
  ];

  // Manual Add Lesson Modal State
  const [showAddLessonModal, setShowAddLessonModal] = useState<boolean>(false);
  const [addLessonSubjectId, setAddLessonSubjectId] = useState<string>('');
  const [addLessonNameInput, setAddLessonNameInput] = useState<string>('');
  const [addLessonUnitInput, setAddLessonUnitInput] = useState<string>('');

  // Rename Lesson Modal State
  const [editingLessonModal, setEditingLessonModal] = useState<{
    id: string;
    lessonName: string;
    unitName: string;
    subjectId: string;
    subjectName: string;
  } | null>(null);
  const [editLessonNameInput, setEditLessonNameInput] = useState<string>('');
  const [editLessonUnitInput, setEditLessonUnitInput] = useState<string>('');

  // Delete Lesson Modal State
  const [deletingLessonItem, setDeletingLessonItem] = useState<SpacedRepetitionItem | null>(null);

  const handleConfirmDeleteLesson = () => {
    if (!deletingLessonItem) return;
    const item = deletingLessonItem;
    const updatedList = spacedRepetitionReviews.filter(r => r.id !== item.id);
    onUpdateSpacedRepetitionReviews(updatedList);
    setDeletingLessonItem(null);
    setReviewSuccessMessage(`🗑️ تم حذف درس "${item.lessonName}" بنجاح من جدول المراجعات الذكية.`);
    setTimeout(() => setReviewSuccessMessage(''), 4500);
  };

  const handleSaveLessonRename = () => {
    if (!editingLessonModal || !editLessonNameInput.trim()) return;
    const cleanNewName = editLessonNameInput.trim();
    const cleanNewUnit = editLessonUnitInput.trim() || editingLessonModal.unitName;
    const oldName = editingLessonModal.lessonName;
    const subjectId = editingLessonModal.subjectId;

    const updatedList = spacedRepetitionReviews.map(item => {
      if (item.id === editingLessonModal.id) {
        return {
          ...item,
          lessonName: cleanNewName,
          unitName: cleanNewUnit,
          milestones: item.milestones?.map(m => ({
            ...m,
            lessonName: cleanNewName,
            unit: cleanNewUnit
          }))
        };
      }
      return item;
    });

    onUpdateSpacedRepetitionReviews(updatedList);

    if (onRenameLesson) {
      onRenameLesson(subjectId, oldName, cleanNewName, editingLessonModal.id);
    }

    setEditingLessonModal(null);
    setReviewSuccessMessage(`✏️ تم تعديل اسم الدرس بنجاح إلى "${cleanNewName}" وتحديثه في جدول المراجعات والمنظم الأسبوعي!`);
    setTimeout(() => setReviewSuccessMessage(''), 4500);
  };

  const handleManualAddLesson = () => {
    if (!addLessonSubjectId || !addLessonNameInput.trim()) return;
    const sub = subjects.find(s => s.id === addLessonSubjectId);
    const subjectName = sub ? sub.name : 'مادة دراسية';
    const cleanLessonName = addLessonNameInput.trim();
    const unitName = addLessonUnitInput.trim() || 'الوحدة الدراسية';

    const baseDate = new Date();
    const intervals = [1, 3, 7, 14, 30, 60, 90, 180];
    const lessonId = 'les_' + Math.random().toString(36).substring(2, 9);

    const milestones = intervals.map((days, index) => {
      const targetDate = new Date();
      targetDate.setDate(baseDate.getDate() + days);
      const dateStr = targetDate.toISOString().split('T')[0];

      return {
        daysFromStart: days,
        targetDate: dateStr,
        status: 'pending' as const,
        lessonId,
        subject: subjectName,
        unit: unitName,
        reviewNumber: index + 1,
        plannedReviewDate: dateStr,
        memoryStrength: Math.round(Math.max(20, 100 - (days / (index + 1)) * 2)),
        retentionEstimate: Math.round(Math.max(15, 100 - (days / (index + 1)) * 3)),
        priority: 'medium' as const,
        difficulty: 'medium' as const,
        confidence: null
      };
    });

    const nextDate = new Date();
    nextDate.setDate(baseDate.getDate() + 1);

    const newItem: SpacedRepetitionItem = {
      id: 'sr_' + Math.random().toString(36).substring(2, 9),
      lessonId,
      lessonName: cleanLessonName,
      subjectId: addLessonSubjectId,
      subjectName,
      unitName,
      studiedDate: baseDate.toISOString().split('T')[0],
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: nextDate.toISOString().split('T')[0],
      history: [],
      milestones,
      priority: 'medium',
      memoryStrength: 100,
      retentionEstimate: 100,
      difficulty: 'medium'
    };

    onUpdateSpacedRepetitionReviews([newItem, ...spacedRepetitionReviews]);
    setShowAddLessonModal(false);
    setAddLessonNameInput('');
    setAddLessonUnitInput('');
    setReviewSuccessMessage(`✨ تم إضافة درس "${cleanLessonName}" إلى جدول المراجعات الذكية لـ ${subjectName} بنجاح!`);
    setTimeout(() => setReviewSuccessMessage(''), 5000);
  };

  // Direct toggle for individual review milestone checkbox ("هل راجعت هذا الدرس؟")
  const handleToggleMilestoneDirectly = (item: SpacedRepetitionItem, milestoneIdx: number, newChecked: boolean) => {
    const stage = REVIEW_STAGES[milestoneIdx] || { days: 1, label: `المرحلة ${milestoneIdx + 1}` };
    const baseDate = item.studiedDate ? new Date(item.studiedDate) : new Date();

    // Ensure 8 milestones exist
    const existingMilestones = (item.milestones && item.milestones.length === 8)
      ? [...item.milestones]
      : REVIEW_STAGES.map((s, idx) => {
          const target = new Date(baseDate);
          target.setDate(target.getDate() + s.days);
          const dateStr = target.toISOString().split('T')[0];
          return {
            daysFromStart: s.days,
            targetDate: dateStr,
            status: 'pending' as const,
            lessonId: item.lessonId || item.id,
            subject: item.subjectName,
            unit: item.unitName || '',
            reviewNumber: idx + 1,
            plannedReviewDate: dateStr,
            memoryStrength: Math.round(Math.max(20, 100 - (s.days / (idx + 1)) * 2)),
            retentionEstimate: Math.round(Math.max(15, 100 - (s.days / (idx + 1)) * 3)),
            priority: 'medium' as const,
            difficulty: 'medium' as const,
            confidence: null
          };
        });

    const updatedMilestones = existingMilestones.map((ms, idx) => {
      if (idx === milestoneIdx) {
        return {
          ...ms,
          status: (newChecked ? 'completed' : 'pending') as 'completed' | 'pending',
          completedAt: newChecked ? todayStr : undefined,
          actualReviewDate: newChecked ? todayStr : undefined,
          score: newChecked ? 100 : undefined
        };
      }
      return ms;
    });

    const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
    const newMemoryStrength = Math.min(100, Math.round(40 + (completedCount / 8) * 60));
    const newRetention = Math.min(100, Math.round(35 + (completedCount / 8) * 65));

    const nextPending = updatedMilestones.find(m => m.status !== 'completed');
    const nextReviewDate = nextPending ? (nextPending.plannedReviewDate || nextPending.targetDate) : 'مكتمل بالكامل 🌟';

    let newHistory = [...(item.history || [])];
    if (newChecked) {
      newHistory.push({
        reviewDate: todayStr,
        date: todayStr,
        confidenceScore: 5,
        score: 100,
        reviewType: `تأكيد مراجعة: ${stage.label}`
      });
    }

    const updatedItem: SpacedRepetitionItem = {
      ...item,
      milestones: updatedMilestones,
      repetitions: completedCount,
      memoryStrength: newMemoryStrength,
      retentionEstimate: newRetention,
      nextReviewDate: nextReviewDate,
      history: newHistory
    };

    const updatedList = spacedRepetitionReviews.map(r => r.id === item.id ? updatedItem : r);
    onUpdateSpacedRepetitionReviews(updatedList);

    if (newChecked) {
      if (gamification) {
        const newXp = gamification.xp + 50;
        const newLevel = Math.max(1, Math.floor(Math.sqrt(newXp / 100)) + 1);
        onUpdateGamification({
          ...gamification,
          xp: newXp,
          level: newLevel,
          streak: gamification.streak + 1
        });
      }
      setReviewSuccessMessage(`🎉 أحسنت! تم تأكيد مراجعة "${item.lessonName}" (${stage.label}) بنجاح! +50 XP ⚡`);
    } else {
      setReviewSuccessMessage(`↩️ تم إلغاء تحديد مراجعة "${item.lessonName}" (${stage.label}).`);
    }
    setTimeout(() => setReviewSuccessMessage(''), 4500);
  };

  // Delete a lesson from smart reviews
  const handleDeleteLesson = (itemId: string) => {
    const item = spacedRepetitionReviews.find(r => r.id === itemId);
    const updatedList = spacedRepetitionReviews.filter(r => r.id !== itemId);
    onUpdateSpacedRepetitionReviews(updatedList);
    setReviewSuccessMessage(`🗑️ تم حذف درس "${item?.lessonName || ''}" من جدول المراجعات الذكية.`);
    setTimeout(() => setReviewSuccessMessage(''), 4000);
  };

  // Reschedule missed items automatically on load
  const handleTriggerReschedule = () => {
    const { updatedReviews, explanations } = rescheduleMissedReviews(spacedRepetitionReviews, todayStr);
    if (explanations.length > 0) {
      onUpdateSpacedRepetitionReviews(updatedReviews);
      setReviewSuccessMessage(`🛡️ تم تنظيم الجدولة الذكية! ${explanations.length} مراجعات فائتة تمت إعادة ترحيلها لتخفيف الحمل المعرفي.`);
      setTimeout(() => setReviewSuccessMessage(''), 8000);
    } else {
      setReviewSuccessMessage('✨ جميع المراجعات مجدولة بانتظام، لا توجد مهام متأخرة حالياً!');
      setTimeout(() => setReviewSuccessMessage(''), 4000);
    }
  };

  // Handle active recall milestone completion
  const handleCompleteReview = (item: SpacedRepetitionItem, rating: number) => {
    const updatedItem = completeReviewMilestone(item, rating, todayStr);
    const list = spacedRepetitionReviews.map(r => r.id === item.id ? updatedItem : r);
    onUpdateSpacedRepetitionReviews(list);

    // Give gamification rewards!
    const xpReward = rating >= 4 ? 120 : rating === 3 ? 80 : 40;
    
    if (gamification) {
      const newXp = gamification.xp + xpReward;
      const newLevel = Math.max(1, Math.floor(Math.sqrt(newXp / 100)) + 1);
      
      const newG = {
        ...gamification,
        xp: newXp,
        level: newLevel,
        streak: gamification.streak + 1
      };
      onUpdateGamification(newG);
    }

    setReviewSuccessMessage(`🎉 أحسنت المراجعة! تم كسب +${xpReward} نقطة خبرة. الجولة القادمة: ${updatedItem.nextReviewDate}`);
    setActiveReviewItem(null);
    setTimeout(() => setReviewSuccessMessage(''), 6000);
  };

  // Filter spaced repetition items
  const filteredSpacedReviews = useMemo(() => {
    switch (spacedFilter) {
      case 'today':
        return spacedRepetitionReviews.filter(r => r.nextReviewDate === todayStr);
      case 'upcoming':
        return spacedRepetitionReviews.filter(r => r.nextReviewDate > todayStr);
      case 'missed':
        return spacedRepetitionReviews.filter(r => r.nextReviewDate < todayStr);
      case 'all':
      default:
        return spacedRepetitionReviews;
    }
  }, [spacedRepetitionReviews, spacedFilter, todayStr]);


  // 5. CHARTS COMPUTATIONS

  // Active recall balance hexagon vertex points
  const radarPoints = useMemo(() => {
    if (!statsA) return '';
    const metrics = [
      Math.min(100, (statsA.studyHours / 30) * 100), // Target 30h
      statsA.focusScore,
      statsA.memoryRetention,
      statsA.productivity,
      statsA.consistency,
      Math.max(0, 100 - statsA.stressTrend * 10) // Stress inverse
    ];
    const width = 200;
    const height = 200;
    const cx = width / 2;
    const cy = height / 2;
    const r = 80;

    const points = metrics.map((val, idx) => {
      const angle = (idx * 2 * Math.PI) / 6 - Math.PI / 2;
      const factor = val / 100;
      const x = cx + r * factor * Math.cos(angle);
      const y = cy + r * factor * Math.sin(angle);
      return `${x},${y}`;
    });

    return points.join(' ');
  }, [statsA]);

  // Subject breakdown for horizontal bars
  const subjectStudyBars = useMemo(() => {
    return subjects.map(sub => {
      const secs = sessions
        .filter(s => s.subjectId === sub.id)
        .reduce((acc, s) => acc + s.duration, 0);
      return {
        name: sub.name,
        color: sub.color || '#3b82f6',
        hours: Number((secs / 3600).toFixed(1))
      };
    }).sort((a, b) => b.hours - a.hours);
  }, [subjects, sessions]);


  // Academic Year Week Calculation
  const academicWeekInfo = useMemo(() => {
    const start = thanaweyaStartDate ? new Date(thanaweyaStartDate) : new Date(new Date().getFullYear(), 8, 1);
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let weekNumber = 1;
    if (diffDays > 0) {
      weekNumber = Math.floor(diffDays / 7) + 1;
    }
    return {
      weekNumber: Math.min(Math.max(weekNumber, 1), 52),
      daysElapsed: Math.max(diffDays, 0),
      startDateFormatted: start.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
    };
  }, [thanaweyaStartDate]);

  // RENDER METHOD
  if (isHomeScreen) {
    return (
      <div className="space-y-8 dir-rtl text-right pb-16" style={{ direction: 'rtl' }}>
        {/* Academic Week & Daily Motivational Boost Banner */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-zinc-900 to-indigo-950 text-white rounded-3xl shadow-lg border border-indigo-500/20 space-y-4 relative overflow-hidden">
          {/* Top Academic Year Week Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/10 dark:bg-black/20 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-black text-sm">
                📅
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm font-black text-white">
                    أنت الآن في الأسبوع رقم {academicWeekInfo.weekNumber} من بداية العام الدراسي
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    الأسبوع {academicWeekInfo.weekNumber}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-300 block">
                  بداية العام: {academicWeekInfo.startDateFormatted} ({academicWeekInfo.daysElapsed} يوم دراسي مضى)
                </span>
              </div>
            </div>
            {onOpenStudentGuide && (
              <button
                onClick={onOpenStudentGuide}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[11px] font-black text-white transition-all shadow-md cursor-pointer flex items-center gap-1.5 border border-indigo-400/30"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>دليل الاستخدام الشامل 📖</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                {activeQuote.tag}
              </span>
              <span className="text-[11px] text-zinc-400 font-bold">جرعة التحفيز والإنضباط اليومية 🌟</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNextQuote}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-extrabold text-white transition-all cursor-pointer flex items-center gap-1.5 border border-white/10"
                title="عرض عبارة تحفيزية أخرى"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>عبارة جديدة 🎲</span>
              </button>
            </div>
          </div>
          <p className="text-sm md:text-base font-black text-white leading-relaxed text-right pt-1">
            "{activeQuote.text}"
          </p>
        </div>

        {/* 7-DAY STUDY ADHERENCE & TARGET HOURS RECHARTS MINI-DASHBOARD */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>مدى الالتزام بساعات المذاكرة المستهدفة (آخر 7 أيام)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                    أسبوعي 🎯
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  مقارنة فورية بين ساعات المذاكرة الفعلية والمستهدف اليومي لكل يوم خلال الأسبوع الأخير.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDailyGoalsModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>تحديد المستهدف 🎯</span>
              </button>

              <button
                onClick={() => { if (setActiveTab) setActiveTab('prediction'); }}
                className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>التحليلات الشاملة 📊</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Summary Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/60 text-right space-y-1">
              <span className="text-[10px] text-zinc-400 font-bold block">إجمالي الساعات الفعلية</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">{weeklyAdherenceSummary.totalActual}</span>
                <span className="text-xs text-zinc-500 font-semibold">/ {weeklyAdherenceSummary.totalTarget} س</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/60 text-right space-y-1">
              <span className="text-[10px] text-zinc-400 font-bold block">معدل الالتزام العام</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-black font-mono ${
                  weeklyAdherenceSummary.overallRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                  weeklyAdherenceSummary.overallRate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-300'
                }`}>
                  %{weeklyAdherenceSummary.overallRate}
                </span>
                <span className="text-xs text-zinc-400">
                  {weeklyAdherenceSummary.overallRate >= 80 ? '🔥 ممتاز' : weeklyAdherenceSummary.overallRate >= 50 ? '⚡ جيد' : '🌱 في البداية'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/60 text-right space-y-1">
              <span className="text-[10px] text-zinc-400 font-bold block">أيام تحقيق المستهدف</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{weeklyAdherenceSummary.daysMet}</span>
                <span className="text-xs text-zinc-500 font-semibold">من 7 أيام ✅</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/60 text-right space-y-1">
              <span className="text-[10px] text-zinc-400 font-bold block">أعلى يوم تحصيل</span>
              <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 block truncate pt-1">
                {weeklyAdherenceSummary.bestDay}
              </span>
            </div>
          </div>

          {/* Recharts Composed Chart Canvas */}
          <div className="h-60 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyAdherenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis 
                  dataKey="dayLabel" 
                  tick={{ fill: '#71717a', fontSize: 11, fontWeight: 700 }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e4e4e7', opacity: 0.3 }} 
                />
                <YAxis 
                  unit=" س" 
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false} 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      return (
                        <div className="p-3 bg-zinc-950 text-white rounded-2xl shadow-xl border border-zinc-800 text-right text-xs space-y-1.5 min-w-[170px]" style={{ direction: 'rtl' }}>
                          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                            <span className="font-black text-zinc-100">{data.fullDayName} ({data.formattedDate})</span>
                            {data.isToday && (
                              <span className="px-2 py-0.5 bg-indigo-600 text-[9px] font-black rounded-full">اليوم</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-indigo-300">
                            <span>المذاكرة الفعلية:</span>
                            <span className="font-black font-mono">{data.actualHours} س</span>
                          </div>
                          <div className="flex items-center justify-between text-amber-300">
                            <span>المستهدف اليومي:</span>
                            <span className="font-black font-mono">{data.targetHours} س</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[11px]">
                            <span className="text-zinc-400">نسبة الالتزام:</span>
                            <span className={`font-black ${data.adherenceRate >= 100 ? 'text-emerald-400' : data.adherenceRate >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                              %{data.adherenceRate} {data.metTarget ? '🎯' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="actualHours" 
                  name="ساعات المذاكرة الفعلية" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={36}
                >
                  {weeklyAdherenceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isToday ? '#4f46e5' : entry.metTarget ? '#10b981' : '#6366f1'} 
                    />
                  ))}
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey="targetHours" 
                  name="المستهدف اليومي" 
                  stroke="#f59e0b" 
                  strokeWidth={2.5} 
                  strokeDasharray="4 4" 
                  dot={{ fill: '#f59e0b', r: 3.5, strokeWidth: 1.5, stroke: '#ffffff' }} 
                  activeDot={{ r: 5 }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend & Smart Insight Footnote */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
            <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-indigo-600 inline-block" />
                <span>ساعات المذاكرة الفعلية (س)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-500 border-b border-dashed border-amber-500 inline-block" />
                <span>المستهدف اليومي (س)</span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <span>💡 المستهدف اليومي:</span>
              <button
                type="button"
                onClick={() => setShowDailyGoalsModal(true)}
                className="text-indigo-600 dark:text-indigo-400 font-bold underline hover:text-indigo-700 cursor-pointer"
              >
                انقر لتعديل الهدف اليومي والأسبوعي
              </button>
            </div>
          </div>
        </div>

        {/* Daily Goals Modal */}
        {showDailyGoalsModal && lifestyleProfile && (
          <DailyGoalsModal
            isOpen={showDailyGoalsModal}
            onClose={() => setShowDailyGoalsModal(false)}
            lifestyleProfile={lifestyleProfile}
            onUpdateLifestyleProfile={(updated) => {
              if (onUpdateLifestyleProfile) {
                onUpdateLifestyleProfile(updated);
              }
            }}
          />
        )}

        {/* Home Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Question 1: What should I do now? */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">السؤال الأول</span>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                ⚡ ماذا يجب أن أفعل الآن؟
              </h3>
              <p className="text-xs text-zinc-500 mt-1">المهمة الحالية ومؤقت التركيز الفوري للبدء بوعي وإنتاجية.</p>
            </div>

            {/* Direct Navigation to Canonical Focus Timer */}
            <div className="flex flex-col items-center justify-center p-6 bg-indigo-50/40 dark:bg-indigo-950/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20 space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-center space-y-1.5 max-w-[280px]">
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 block">مؤقت التركيز الفوري الذكي ⏱️</span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  ابدأ جلسة مذاكرة بأسلوب Pomodoro مدعومة بمستشعر تشتت الدماغ الذكي لتسجيل ساعاتك وكسب 5 نقاط XP عن كل ساعة تركيز!
                </p>
              </div>
              <button
                onClick={() => { if (setActiveTab) setActiveTab('timer'); }}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black rounded-xl shadow-sm transition-all cursor-pointer"
              >
                انتقل إلى مؤقت التركيز الآن ➔
              </button>
            </div>

            {/* Active Recall Due Callout */}
            {spacedRepetitionReviews.filter(r => r.nextReviewDate <= todayStr).length > 0 && (
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1 text-right">
                  <span className="text-xs font-extrabold text-amber-800 dark:text-amber-400 block">مراجعات مستحقة اليوم 🧠</span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    لديك <strong>{spacedRepetitionReviews.filter(r => r.nextReviewDate <= todayStr).length} كروت مراجعة</strong> متباعدة مستحقة لتفادي النسيان وتثبيت المعلومات.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (setActiveTab) setActiveTab('spaced');
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-xl transition-all shrink-0 cursor-pointer"
                >
                  ابدأ المراجعة
                </button>
              </div>
            )}
          </div>

          {/* Question 2: What is next today? */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-sm space-y-6">
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">السؤال الثاني</span>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                📅 ماذا ينتظرني اليوم؟
              </h3>
              <p className="text-xs text-zinc-500 mt-1">المنهج والجدول الدراسي المخطط له لليوم بالتفصيل.</p>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {todaysActivities.length === 0 ? (
                <div className="text-center py-10 px-4 bg-zinc-50 dark:bg-zinc-950/40 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <Calendar className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    لا يوجد فترات دراسية مجدولة لليوم في منظمك الأسبوعي.
                  </p>
                  <button
                    onClick={() => { if (setActiveTab) setActiveTab('planner'); }}
                    className="mt-3 text-xs font-bold text-indigo-500 hover:underline cursor-pointer"
                  >
                    خطط لأسبوعك الدراسي الآن 🗓️
                  </button>
                </div>
              ) : (
                todaysActivities.map((act) => {
                  const sub = subjects.find(s => s.id === act.subjectId);
                  return (
                    <div
                      key={act.id}
                      className={`flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/40 border rounded-2xl transition-all ${
                        act.completed 
                          ? 'border-emerald-100 dark:border-emerald-950/40 opacity-70' 
                          : 'border-zinc-100 dark:border-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!act.completed}
                          onChange={() => {
                            if (onToggleActivityCompletion) {
                              onToggleActivityCompletion(act.id, { completed: !act.completed });
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 border-zinc-300 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                        <div className="space-y-0.5 text-right">
                          <span className={`text-xs font-bold block ${act.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                            {act.title}
                          </span>
                          <span className="text-[10px] text-zinc-400 block font-medium">
                            ⏰ {act.startTime} - {act.endTime} | {sub?.name || 'موضوع عام'}
                          </span>
                        </div>
                      </div>

                      {/* Subject Color Pill */}
                      {sub && (
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: sub.color || '#3b82f6' }}
                          title={sub.name}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {todaysActivities.length > 0 && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => { if (setActiveTab) setActiveTab('planner'); }}
                  className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:underline cursor-pointer"
                >
                  عرض وإدارة المنظم الأسبوعي الكامل 🗓️ ➔
                </button>
              </div>
            )}
          </div>

          {/* Question 3: How am I doing? */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-sm space-y-6">
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">السؤال الثالث</span>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                📈 كيف هو أدائي اليوم؟
              </h3>
              <p className="text-xs text-zinc-500 mt-1">معدل التحصيل الدراسي الحالي مقارنة بهدفك الدراسي الأسبوعي.</p>
            </div>

            {/* Progress Tracker Card */}
            <div className="space-y-5">
              {/* Weekly study progression */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">معدل التحصيل الأسبوعي:</span>
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {weeklyStudyHours} / {userWeeklyTargetHours} ساعة دراسية
                  </span>
                </div>
                
                {/* Sleek Custom Progress Bar */}
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((weeklyStudyHours / (userWeeklyTargetHours || 1)) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>
                    بناءً على الـ 7 أيام الماضية. هدفك هو {userWeeklyTargetHours} ساعة أسبوعياً ({userDailyTargetHours} س/يوم).
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDailyGoalsModal(true)}
                    className="text-indigo-600 dark:text-indigo-400 font-bold underline hover:text-indigo-700 cursor-pointer shrink-0 mr-2"
                  >
                    تعديل المستهدف 🎯
                  </button>
                </div>
              </div>

              {/* Streak & Gamification Panel */}
              <div className="grid grid-cols-2 gap-4">
                {/* Commitment Streak */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl text-center space-y-1">
                  <Flame className="w-6 h-6 text-orange-500 mx-auto animate-pulse" />
                  <span className="text-lg font-black text-zinc-900 dark:text-zinc-100 block">
                    {streak} {streak === 1 ? 'يوم' : streak === 2 ? 'يومان' : 'أيام'}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-bold block">التزام متتالي 🔥</span>
                </div>

                {/* Gamification Level & XP */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl text-center space-y-1">
                  <Award className="w-6 h-6 text-yellow-500 mx-auto" />
                  <span className="text-lg font-black text-zinc-900 dark:text-zinc-100 block font-sans">
                    المستوى {gamification?.level || 1}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-bold block font-sans">XP رصيد: {gamification?.xp || 0} ✨</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => { if (setActiveTab) setActiveTab('prediction'); }}
                className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:underline cursor-pointer"
              >
                مشاهدة تحليلات مستشار الدماغ وتوقعات المجموع 📊 ➔
              </button>
            </div>
          </div>

          {/* Question 4: Is there anything requiring attention? */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-sm space-y-6">
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">السؤال الرابع</span>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                ⚠️ هل هناك ما يحتاج لاهتمامي؟
              </h3>
              <p className="text-xs text-zinc-500 mt-1">تنبيهات عاجلة، امتحانات قريبة، أو موازنة عصبية لتجنب الاحتراق.</p>
            </div>

            <div className="space-y-4">
              
              {/* 1. Sleep/Stress/Fatigue Burnout alerts (neuroscience-guided) */}
              {fatigueAlert && (
                <div className="p-4 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-300 text-xs rounded-2xl leading-relaxed text-right font-medium">
                  {fatigueAlert}
                </div>
              )}

              {/* 2. Check-in Today's Status card */}
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm text-right space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 animate-pulse">
                      <Brain className="w-4 h-4" />
                    </span>
                    <strong className="text-xs font-black text-zinc-900 dark:text-zinc-50">التقييم اليومي (Daily Check-in)</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">حالة التقييم اليوم:</span>
                  <div className="flex items-center gap-1.5">
                    {hasDoneCheckinToday ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 rounded-full">
                        مكتمل ✅
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black text-amber-700 bg-amber-50 dark:bg-amber-950/20 rounded-full">
                        معلق ⚠️
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1.5">
                  {hasDoneCheckinToday ? (
                    <button
                      onClick={onTriggerCheckin}
                      className="flex-1 py-2 px-3 text-[11px] font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-600/10 text-center"
                    >
                      تعديل تقييم اليوم ⚙️
                    </button>
                  ) : (
                    <button
                      onClick={onTriggerCheckin}
                      className="flex-1 py-2 px-3 text-[11px] font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-600/10 text-center"
                    >
                      بدء التقييم اليومي 🧠
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (setActiveTab) {
                        setActiveTab('checkin');
                      }
                    }}
                    className="flex-1 py-2 px-3 text-[11px] font-black text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-all cursor-pointer text-center"
                  >
                    السجل والإحصائيات 📊
                  </button>
                </div>
              </div>

              {/* 3. Upcoming Exams notification */}
              {upcomingExams.length > 0 ? (
                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 text-amber-900 dark:text-amber-300 rounded-2xl space-y-2">
                  <span className="text-xs font-extrabold flex items-center gap-1.5">
                    ⚠️ امتحانات قريبة مقرر خوضها:
                  </span>
                  <div className="space-y-1.5 text-right">
                    {upcomingExams.map((ex) => {
                      const sub = subjects.find(s => s.id === ex.subjectId);
                      const daysLeft = Math.ceil((new Date(ex.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                      return (
                        <p key={ex.id} className="text-[11px] leading-relaxed">
                          • امتحان <strong>{ex.title}</strong> ({sub?.name || 'موضوع عام'}) مقرر يوم {ex.date} (<strong>متبقي {daysLeft} {daysLeft === 1 ? 'يوم' : daysLeft === 2 ? 'يومان' : 'أيام'}</strong>).
                        </p>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Success / Perfect indicator if no fatigue or exams */}
              {!fatigueAlert && upcomingExams.length === 0 && hasDoneCheckinToday && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>كل شيء ممتاز ومنظم! خلايا دماغك في حالة بيولوجية مثالية وجاهزة لاستيعاب وتثبيت المفاهيم بذكاء وراحة تامة.</span>
                </div>
              )}

              {checkinSavedMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl">
                  ✅ تم تسجيل مؤشراتك بنجاح! شكراً لاهتمامك ببيولوجيا دماغك.
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    );
  }

  // RENDER METHOD
  return (
    <div className="space-y-8 dir-rtl text-right pb-16">
      
      {/* Top Welcome Title & Timeline Config */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">لوحة التحليلات المتقدمة</span>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 flex items-center gap-2">
            مؤشرات رحلة الثانوية العامة 📈
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
            مراقبة الأداء العصبي والدراسي طويل المدى مدعوماً بالذكاء الاصطناعي وجدول المراجعة الذكية التكرارية.
          </p>
        </div>

        {/* Date Selector and Timeline Config */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 px-4 py-2.5 rounded-xl text-right">
            <label className="text-[10px] text-zinc-400 block font-bold mb-1">تاريخ بداية رحلة الثانوية</label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <input 
                type="date" 
                value={thanaweyaStartDate}
                onChange={(e) => onUpdateThanaweyaStartDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-0 border-0 p-0 cursor-pointer"
              />
            </div>
          </div>

          <button 
            onClick={handleRecalculateHistory}
            className="flex items-center justify-center gap-2 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all text-xs font-bold px-4 py-3 rounded-xl shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            تحديث ومزامنة الرحلة
          </button>
        </div>
      </div>

      {/* Sub tabs Menu */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setSubTab('spaced')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-all ${
            subTab === 'spaced' 
              ? 'border-zinc-950 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50' 
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          مستودع المراجعة الذكي (التكرار المتباعد) 🧠
          {spacedRepetitionReviews.filter(r => r.nextReviewDate === todayStr).length > 0 && (
            <span className="mr-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded-full font-bold">
              {spacedRepetitionReviews.filter(r => r.nextReviewDate === todayStr).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubTab('memory')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-all ${
            subTab === 'memory' 
              ? 'border-zinc-950 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50' 
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          لوحة صحة الذاكرة 🩺🧠
        </button>
      </div>

      {/* SUCCESS MESSAGE NOTIFICATION BANNER */}
      {reviewSuccessMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-pulse">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{reviewSuccessMessage}</span>
        </div>
      )}


      {/* TAB 1: DAILY & WEEKLY METRICS OVERVIEW */}
      {subTab === 'daily' && (
        <div className="space-y-8">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-5 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-xl shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">إجمالي ساعات المذاكرة</span>
                <strong className="text-xl font-black block mt-0.5">{(fullTimelineLogs.reduce((acc, l) => acc + l.studyMinutes, 0) / 60).toFixed(1)} س</strong>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-xl shadow-sm">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">الالتزام وسلسلة الأيام (Streak)</span>
                <strong className="text-xl font-black block mt-0.5">{streak} يوم متواصل</strong>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-xl shadow-sm">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">الدروس المنجزة من المنهج</span>
                <strong className="text-xl font-black block mt-0.5">
                  {fullTimelineLogs[fullTimelineLogs.length - 1]?.completedLessonsCount || 0} درس
                </strong>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-xl shadow-sm">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">متوسط التركيز الذهني</span>
                <strong className="text-xl font-black block mt-0.5">
                  {fullTimelineLogs.length > 0 
                    ? Math.round(fullTimelineLogs.filter(l => l.focusScore > 0).reduce((acc, l) => acc + l.focusScore, 0) / Math.max(1, fullTimelineLogs.filter(l => l.focusScore > 0).length)) 
                    : 0}%
                </strong>
              </div>
            </div>
          </div>

          {/* Interactive Open-Ended Bar Chart & Subject Bars */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-2xl lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>📊 رسم بياني لساعات المذاكرة المفتوح:</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {barChartMode === 'fromStart' && `عرض شامل من أول يوم بالعام الدراسي حتى اليوم الحالي (${barChartDisplayData.length} ${isAggregatedByWeeks ? 'أسبوع' : 'يوم'})`}
                    {barChartMode === 'allYear' && 'عرض إجمالي أسابيع العام الدراسي كاملاً'}
                    {barChartMode === 'last7days' && 'عرض آخر 7 أيام'}
                    {barChartMode === 'last14days' && 'عرض آخر 14 يوماً'}
                    {barChartMode === 'last30days' && 'عرض آخر 30 يوماً'}
                    {barChartMode === 'customWeeks' && `نطاق مخصص: من أسبوع ${Math.min(barChartStartWeek, barChartEndWeek)} إلى أسبوع ${Math.max(barChartStartWeek, barChartEndWeek)}`}
                  </p>
                </div>

                {/* Range Selectors / Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBarChartMode('fromStart')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${
                      barChartMode === 'fromStart'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300'
                    }`}
                  >
                    🚀 من البداية حتى الآن
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarChartMode('last7days')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${
                      barChartMode === 'last7days'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300'
                    }`}
                  >
                    7 أيام
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarChartMode('last30days')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${
                      barChartMode === 'last30days'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300'
                    }`}
                  >
                    30 يوماً
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarChartMode('customWeeks')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${
                      barChartMode === 'customWeeks'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300'
                    }`}
                  >
                    🎯 تحديد أسابيع (X إلى Y)
                  </button>
                </div>
              </div>

              {/* Custom Week Selectors (when in customWeeks mode) */}
              {barChartMode === 'customWeeks' && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 flex flex-wrap items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 dark:text-zinc-400">من أسبوع:</span>
                    <select
                      value={barChartStartWeek}
                      onChange={(e) => setBarChartStartWeek(Number(e.target.value))}
                      className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg font-black"
                    >
                      {Array.from({ length: Math.max(52, currentWeekNumber) }, (_, i) => i + 1).map(w => (
                        <option key={w} value={w}>أسبوع {w}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 dark:text-zinc-400">إلى أسبوع:</span>
                    <select
                      value={barChartEndWeek}
                      onChange={(e) => setBarChartEndWeek(Number(e.target.value))}
                      className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg font-black"
                    >
                      {Array.from({ length: Math.max(52, currentWeekNumber) }, (_, i) => i + 1).map(w => (
                        <option key={w} value={w}>أسبوع {w}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-extrabold mr-auto">
                    إجمالي النطاق: {Math.abs(barChartEndWeek - barChartStartWeek) + 1} أسابيع
                  </span>
                </div>
              )}

              {/* Chart Visualizer Bars */}
              {barChartDisplayData.length > 0 ? (
                <div className="h-64 flex items-end justify-between gap-2 pt-6 px-1 overflow-x-auto scrollbar-thin">
                  {(() => {
                    const maxVal = Math.max(...barChartDisplayData.map(d => d.hours)) || 1;
                    return barChartDisplayData.map((item, index) => {
                      const heightPercent = Math.min(100, Math.max(item.hours > 0 ? 14 : 4, (item.hours / maxVal) * 88));
                      return (
                        <div 
                          key={item.id || index} 
                          className="flex-1 min-w-[28px] max-w-[56px] flex flex-col items-center gap-1.5 group relative"
                        >
                          {/* Hover Tooltip */}
                          <div className="absolute -top-12 z-20 bg-zinc-950 text-white text-[10px] font-bold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg whitespace-nowrap">
                            {item.label} ({item.subLabel}): {item.hours} ساعة
                            {item.focusScore > 0 && ` | ${item.focusScore}% تركيز`}
                          </div>
                          
                          {/* Visual Bar */}
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-t-lg flex flex-col justify-end h-44 overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50">
                            <div 
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full transition-all duration-500 ease-out flex items-center justify-center ${
                                item.hours > 0
                                  ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-300'
                                  : 'bg-zinc-200/50 dark:bg-zinc-800/50'
                              } rounded-t-md`}
                            >
                              {item.hours > 0.3 && (
                                <span className="text-[9px] text-white dark:text-zinc-950 font-black px-0.5 text-center leading-none">
                                  {item.hours}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 truncate w-full text-center">
                            {item.label}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-400 text-xs font-bold gap-2 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <CalendarRange className="w-8 h-8 opacity-40" />
                  <span>لا توجد جلسات مذاكرة مسجلة في هذا النطاق الزمني المحدد.</span>
                </div>
              )}
            </div>

            {/* Subject study breakdown */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">توزيع الجهد حسب المواد 📚</h3>
                <p className="text-[11px] text-zinc-400 mb-4">إجمالي الساعات التراكمية لكل مادة دراسية.</p>
                
                <div className="space-y-4 max-h-52 overflow-y-auto pr-1">
                  {subjectStudyBars.map((sub, index) => (
                    <div key={index} className="space-y-1 text-right">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-zinc-700 dark:text-zinc-300">{sub.name}</span>
                        <span className="text-zinc-500">{sub.hours} ساعة</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-100 dark:border-zinc-800/30">
                        <div 
                          style={{ 
                            width: `${Math.min(100, (sub.hours / Math.max(1, Math.max(...subjectStudyBars.map(s => s.hours)))) * 100)}%`,
                            backgroundColor: sub.color 
                          }}
                          className="h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                  {subjectStudyBars.length === 0 && (
                    <span className="text-xs text-zinc-400 text-center block py-12">لا توجد بيانات لمواد دراسية مضافة بعد.</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed">
                💡 علم الأعصاب ينصح بـ **المذاكرة المتداخلة (Interleaving)** بدلاً من المذاكرة الكتلية؛ تنوع المواد في اليوم الواحد يحفز مرونة الدماغ وقدرة الاسترجاع!
              </div>
            </div>
          </div>
        </div>
      )}


      {/* TAB 2: LONG-TERM COMPARISONS & INSIGHTS */}
      {subTab === 'longterm' && (
        <div className="space-y-8">
          
          {/* Comparison Scale Selectors */}
          <div className="bg-white dark:bg-zinc-900 p-5 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-black text-zinc-800 dark:text-zinc-200">مقارنات الأداء عبر المقياس الزمني للمستقبل 📅</h2>
                <p className="text-xs text-zinc-500 mt-1">اختر المقياس الزمني لمقارنة فترات التحصيل وتحديد معدلات التقدم ونقاط الخلل.</p>
              </div>

              {/* Comparison buttons preset */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'today_yesterday', label: 'اليوم ضد أمس' },
                  { id: 'week_week', label: 'هذا الأسبوع ضد الماضي' },
                  { id: 'month_month', label: 'هذا الشهر ضد الماضي' },
                  { id: 'semester_semester', label: 'الترم الحالي ضد السابق' },
                  { id: 'custom', label: 'فترة مخصصة 🛠️' }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setComparisonPreset(preset.id as any)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                      comparisonPreset === preset.id 
                        ? 'bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 shadow-sm' 
                        : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* If Custom Date is selected, show inputs */}
            {comparisonPreset === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold block">بداية الفترة أ</label>
                  <input type="date" value={customStartA} onChange={(e) => setCustomStartA(e.target.value)} className="w-full text-xs font-semibold p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold block">نهاية الفترة أ</label>
                  <input type="date" value={customEndA} onChange={(e) => setCustomEndA(e.target.value)} className="w-full text-xs font-semibold p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold block">بداية الفترة ب</label>
                  <input type="date" value={customStartB} onChange={(e) => setCustomStartB(e.target.value)} className="w-full text-xs font-semibold p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold block">نهاية الفترة ب</label>
                  <input type="date" value={customEndB} onChange={(e) => setCustomEndB(e.target.value)} className="w-full text-xs font-semibold p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400" />
                </div>
              </div>
            )}
          </div>

          {/* SIDE-BY-SIDE METRICS DISPLAY CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Table side-by-side metric comparison list */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-2xl lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">تحليل مؤشرات التطور المقارن 🧪</h3>
                <span className="text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-full font-bold">
                  {comparisonRanges.labelA} ضد {comparisonRanges.labelB}
                </span>
              </div>

              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {[
                  { label: 'ساعات المذاكرة الكلية ⏰', valA: statsA ? `${statsA.studyHours} ساعة` : '0', valB: statsB ? `${statsB.studyHours} ساعة` : '0', percent: statsA && statsB ? Math.round(((statsA.studyHours - statsB.studyHours) / Math.max(1, statsB.studyHours)) * 100) : 0 },
                  { label: 'ساعات التركيز العميق (Deep Work) ⚡', valA: statsA ? `${statsA.deepWorkHours} ساعة` : '0', valB: statsB ? `${statsB.deepWorkHours} ساعة` : '0', percent: statsA && statsB ? Math.round(((statsA.deepWorkHours - statsB.deepWorkHours) / Math.max(1, statsB.deepWorkHours)) * 100) : 0 },
                  { label: 'ساعات المراجعة والتكرار 🧠', valA: statsA ? `${statsA.revisionHours} ساعة` : '0', valB: statsB ? `${statsB.revisionHours} subclass` : '0', percent: statsA && statsB ? Math.round(((statsA.revisionHours - statsB.revisionHours) / Math.max(1, statsB.revisionHours)) * 100) : 0 },
                  { label: 'متوسط درجة التركيز الذهني 🎯', valA: statsA ? `${statsA.focusScore}%` : '0%', valB: statsB ? `${statsB.focusScore}%` : '0%', percent: statsA && statsB ? statsA.focusScore - statsB.focusScore : 0, isDirectDiff: true },
                  { label: 'مستوى التعب العصبي (Burnout) 🤯', valA: statsA ? `${statsA.burnoutTrend}/10` : '0/10', valB: statsB ? `${statsB.burnoutTrend}/10` : '0/10', percent: statsA && statsB ? statsA.burnoutTrend - statsB.burnoutTrend : 0, isDirectDiff: true, isNegativeMetric: true },
                  { label: 'معدل التوتر والضغط العصبي ⚖️', valA: statsA ? `${statsA.stressTrend}/10` : '0/10', valB: statsB ? `${statsB.stressTrend}/10` : '0/10', percent: statsA && statsB ? statsA.stressTrend - statsB.stressTrend : 0, isDirectDiff: true, isNegativeMetric: true },
                  { label: 'تقدير قوة ثبات الذاكرة 🧠', valA: statsA ? `${statsA.memoryRetention}%` : '0%', valB: statsB ? `${statsB.memoryRetention}%` : '0%', percent: statsA && statsB ? statsA.memoryRetention - statsB.memoryRetention : 0, isDirectDiff: true },
                  { label: 'الإنتاجية والدراسة الفعالة 💎', valA: statsA ? `${statsA.productivity}%` : '0%', valB: statsB ? `${statsB.productivity}%` : '0%', percent: statsA && statsB ? statsA.productivity - statsB.productivity : 0, isDirectDiff: true },
                  { label: 'الدروس المكتملة 📚', valA: statsA ? `${statsA.completedLessons} درس` : '0', valB: statsB ? `${statsB.completedLessons} درس` : '0', percent: statsA && statsB ? statsA.completedLessons - statsB.completedLessons : 0, isDirectDiff: true },
                  { label: 'متوسط درجات كويزات المراجعة ✍️', valA: statsA ? `${statsA.quizScore}%` : '0%', valB: statsB ? `${statsB.quizScore}%` : '0%', percent: statsA && statsB ? statsA.quizScore - statsB.quizScore : 0, isDirectDiff: true },
                  { label: 'متوسط درجات الامتحانات 📝', valA: statsA ? `${statsA.examScore}%` : '0%', valB: statsB ? `${statsB.examScore}%` : '0%', percent: statsA && statsB ? statsA.examScore - statsB.examScore : 0, isDirectDiff: true },
                  { label: 'متوسط درجات الكويزات الذكية (AI) 🤖', valA: statsA ? `${statsA.aiExamScore}%` : '0%', valB: statsB ? `${statsB.aiExamScore}%` : '0%', percent: statsA && statsB ? statsA.aiExamScore - statsB.aiExamScore : 0, isDirectDiff: true },
                ].map((item, index) => {
                  const isUp = item.percent > 0;
                  const isZero = item.percent === 0;
                  
                  // Color determining logic based on metric type
                  let colorClass = 'text-zinc-400';
                  if (!isZero) {
                    if (item.isNegativeMetric) {
                      colorClass = isUp ? 'text-red-500' : 'text-emerald-500';
                    } else {
                      colorClass = isUp ? 'text-emerald-500' : 'text-red-500';
                    }
                  }

                  const trendIcon = isZero ? null : (isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />);
                  const labelSuffix = item.isDirectDiff ? ' درجة فرق' : '% تغيير';

                  return (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-zinc-50 dark:border-zinc-800/50 text-xs">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">{item.label}</span>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 block font-semibold">{comparisonRanges.labelA}</span>
                          <strong className="text-zinc-800 dark:text-zinc-200 font-bold block">{item.valA}</strong>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 block font-semibold">{comparisonRanges.labelB}</span>
                          <strong className="text-zinc-800 dark:text-zinc-200 font-bold block">{item.valB}</strong>
                        </div>

                        <div className={`w-24 text-left flex items-center justify-end gap-1 font-bold ${colorClass}`}>
                          {trendIcon}
                          <span>
                            {isZero ? 'مستقر' : `${isUp ? '+' : ''}${item.percent}${labelSuffix}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RADAR WEB CHART & RECENT CONCEPTS */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">النموذج السداسي للتوازن العصبي 🧬</h3>
                <p className="text-[10px] text-zinc-400 mb-6">رسم تخطيطي للموازنة بين التحصيل والتركيز ومستويات الإجهاد.</p>

                {/* Radar SVG */}
                <div className="flex justify-center my-4">
                  <svg width="200" height="200" className="overflow-visible">
                    {/* Background hexagons */}
                    {[1.0, 0.75, 0.5, 0.25].map((scale, i) => {
                      const points = [0, 1, 2, 3, 4, 5].map((idx) => {
                        const angle = (idx * 2 * Math.PI) / 6 - Math.PI / 2;
                        const r = 80 * scale;
                        const x = 100 + r * Math.cos(angle);
                        const y = 100 + r * Math.sin(angle);
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <polygon
                          key={i}
                          points={points}
                          fill="none"
                          stroke="currentColor"
                          className="text-zinc-100 dark:text-zinc-800/80"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Polygon axes lines */}
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const angle = (idx * 2 * Math.PI) / 6 - Math.PI / 2;
                      const x2 = 100 + 80 * Math.cos(angle);
                      const y2 = 100 + 80 * Math.sin(angle);
                      return (
                        <line
                          key={idx}
                          x1="100"
                          y1="100"
                          x2={x2}
                          y2={y2}
                          stroke="currentColor"
                          className="text-zinc-100 dark:text-zinc-800/80"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Polygon active area fill */}
                    {radarPoints && (
                      <polygon
                        points={radarPoints}
                        fill="rgba(24, 24, 27, 0.1)"
                        stroke="rgba(24, 24, 27, 0.9)"
                        className="dark:fill-white/10 dark:stroke-white/80"
                        strokeWidth="2"
                      />
                    )}

                    {/* Labels */}
                    {[
                      { name: 'دراسة', dx: 0, dy: -12 },
                      { name: 'تركيز', dx: 12, dy: -6 },
                      { name: 'ذاكرة', dx: 12, dy: 10 },
                      { name: 'إنتاج', dx: 0, dy: 16 },
                      { name: 'ثبات', dx: -14, dy: 10 },
                      { name: 'راحة', dx: -14, dy: -6 }
                    ].map((lbl, idx) => {
                      const angle = (idx * 2 * Math.PI) / 6 - Math.PI / 2;
                      const x = 100 + 92 * Math.cos(angle) + lbl.dx;
                      const y = 100 + 92 * Math.sin(angle) + lbl.dy;
                      return (
                        <text
                          key={idx}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          className="fill-zinc-400 dark:fill-zinc-500 font-sans"
                        >
                          {lbl.name}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Concepts detected */}
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block font-bold">المفاهيم عالية التحصيل والأقوى حالياً 🛡️</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {statsA?.strongConcepts && statsA.strongConcepts.length > 0 ? statsA.strongConcepts.map((c, i) => (
                      <span key={i} className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-bold">
                        {c}
                      </span>
                    )) : (
                      <span className="text-[10px] text-zinc-400 font-medium">سيتم التعرف على المفاهيم فور إتمام الامتحانات.</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block font-bold">المفاهيم التي تحتاج إلى مراجعة تكرارية فوراً ⚠️</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {statsA?.weakConcepts && statsA.weakConcepts.length > 0 ? statsA.weakConcepts.map((c, i) => (
                      <span key={i} className="text-[10px] bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 px-2.5 py-1 rounded-lg font-bold">
                        {c}
                      </span>
                    )) : (
                      <span className="text-[10px] text-zinc-400 font-medium">لا توجد نقاط ضعف حادة مرصودة حالياً. ممتاز!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ENTIRE THANAWEYA JOURNEY HEATMAP & TIMELINE TRACKER */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">الجدول الزمني التراكمي للرحلة (Journey Heatmap) 🗺️</h3>
              <p className="text-xs text-zinc-400 mt-1">تتبع استمرارية المذاكرة طوال أيام الرحلة منذ انطلاقها. يمثل كل مربع يوماً، وتزداد درجة اللون غمقاً بزيادة ساعات التحصيل.</p>
            </div>

            {/* Heatmap Layout (GitHub Style Grid) */}
            <div className="overflow-x-auto pb-2 pt-4">
              <div className="min-w-[700px] flex gap-1.5 flex-wrap">
                {fullTimelineLogs.map((log, index) => {
                  const hours = log.studyMinutes / 60;
                  
                  // Color Shading (0h, <=2h, <=4h, <=6h, >6h)
                  let bgClass = 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800';
                  if (hours > 0) {
                    if (hours <= 2) bgClass = 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50';
                    else if (hours <= 4) bgClass = 'bg-zinc-400 dark:bg-zinc-600 text-white';
                    else if (hours <= 6) bgClass = 'bg-zinc-700 dark:bg-zinc-300 text-white dark:text-zinc-950';
                    else bgClass = 'bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950';
                  }

                  const d = new Date(log.date);
                  const formattedDay = d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });

                  return (
                    <div 
                      key={index}
                      className={`w-9 h-9 flex flex-col items-center justify-center rounded-lg border text-[9px] font-bold ${bgClass} cursor-help transition-all hover:scale-105 group relative`}
                    >
                      <span>{d.getDate()}</span>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden group-hover:block bg-zinc-950 text-white text-[10px] font-semibold px-2.5 py-1 rounded shadow whitespace-nowrap z-30">
                        {formattedDay} | {hours.toFixed(1)} س مذاكرة | {log.focusScore}% تركيز
                      </div>
                    </div>
                  );
                })}
                {fullTimelineLogs.length === 0 && (
                  <span className="text-xs text-zinc-400 text-center w-full py-6">الجدول فارغ. يرجى تعديل تاريخ البداية ومزامنة الرحلة.</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-4 border-t border-zinc-50 dark:border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                <span>أقل</span>
                <div className="w-4 h-4 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800" />
                <div className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-4 h-4 rounded bg-zinc-400 dark:bg-zinc-600" />
                <div className="w-4 h-4 rounded bg-zinc-700 dark:bg-zinc-300" />
                <div className="w-4 h-4 rounded bg-zinc-950 dark:bg-zinc-50" />
                <span>أكثر جهداً</span>
              </div>
              <span>إجمالي أيام الرحلة المرصودة: **{fullTimelineLogs.length} يوماً**</span>
            </div>
          </div>

          {/* AI PERFORMANCE ANALYST CONTAINER */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-zinc-900/40 dark:to-zinc-950/20 text-zinc-100 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-100 border border-zinc-700">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">مستشار الأداء الأكاديمي والعصبي (AI Analyst) 🧠</h3>
                  <p className="text-xs text-zinc-400 mt-1">يقرأ الذكاء الاصطناعي كامل سجلك التاريخي ويولد تقريراً مخصصاً بلهجة مصرية محفزة ليوضح لك أسباب تغير أدائك.</p>
                </div>
              </div>

              <button
                onClick={generateAIInsights}
                disabled={isGeneratingInsights}
                className="bg-white hover:bg-zinc-100 text-zinc-950 transition-all font-black text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {isGeneratingInsights ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    جاري توليد التحليل...
                  </>
                ) : (
                  <>
                    <Brain className="w-3.5 h-3.5 text-zinc-950" />
                    استخلص تحليلات الذكاء الاصطناعي للأداء
                  </>
                )}
              </button>
            </div>

            {/* Error banner */}
            {aiError && (
              <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-300 rounded-xl text-xs font-semibold">
                ⚠️ {aiError}
              </div>
            )}

            {/* Insights Display Section */}
            {aiInsights ? (
              <div className="p-5 bg-zinc-900/80 rounded-xl border border-zinc-800/80 leading-relaxed text-zinc-200 text-xs md:text-sm font-medium space-y-4 whitespace-pre-wrap">
                {aiInsights}
              </div>
            ) : (
              !isGeneratingInsights && (
                <div className="py-12 border-2 border-dashed border-zinc-800 rounded-xl text-center text-zinc-500 text-xs">
                  اضغط على الزر بالأعلى لقراءة كامل سجلات دراستك، كويزاتك، نومك وإجهادك، وتوليد نصائح علمية وعصبية ذكية بالعامية المصرية.
                </div>
              )
            )}
          </div>
        </div>
      )}


      {/* TAB 3: NEUROSCIENCE REVIEW DATABASE (SPACED REPETITION - DEDICATED SUBJECT SPACES & DIRECT CHECKLIST) */}
      {(subTab === 'spaced' || subTab === 'memory') && (
        <div className="space-y-6">
          
          {/* Dashboard Summary Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 border border-zinc-100 dark:border-zinc-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div>
              <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>جدول المراجعات الذكية والتكرار المتباعد (مساحات مخصصة لكل مادة)</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                مساحة مستقلة لكل مادة دراسية لمتابعة تثبيت دروسك في الذاكرة طويلة المدى عبر مراحل المراجعة المنظمة والتحقق المباشر بسهولة وسرعة.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  if (selectedSubjectFilter !== 'all') {
                    setAddLessonSubjectId(selectedSubjectFilter);
                  } else if (subjects.length > 0) {
                    setAddLessonSubjectId(subjects[0].id);
                  }
                  setShowAddLessonModal(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة درس جديد للمراجعة</span>
              </button>

              <button
                onClick={handleTriggerReschedule}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold border border-zinc-200 dark:border-zinc-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-zinc-400" />
                <span>ترحيل ذكي للمتأخرات ⚡</span>
              </button>
            </div>
          </div>

          {/* Subject Navigation Tabs Bar (Dedicated Subject Spaces Selector) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>اختر المادة الدراسية لفتح مساحتها المخصصة:</span>
              </span>
              {selectedSubjectFilter !== 'all' && (
                <button
                  onClick={() => setSelectedSubjectFilter('all')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  عرض جميع المواد معاً 🌟
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none dir-rtl" style={{ direction: 'rtl' }}>
              <button
                onClick={() => setSelectedSubjectFilter('all')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                  selectedSubjectFilter === 'all'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <span>🌟 كل المواد</span>
                <span className="text-[10px] bg-zinc-200/80 dark:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded-full font-black">
                  {spacedRepetitionReviews.length}
                </span>
              </button>

              {subjects.map((sub) => {
                const count = spacedRepetitionReviews.filter(r => r.subjectId === sub.id || r.subjectName === sub.name).length;
                const isSelected = selectedSubjectFilter === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubjectFilter(sub.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/30'
                        : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-base">{renderSubjectIconEmoji(sub.icon)}</span>
                    <span>{sub.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DEDICATED SUBJECT WORKSPACE VIEW */}
          <div className="space-y-6">
            {(() => {
              // Determine active subjects to render
              const activeSubjects = selectedSubjectFilter === 'all'
                ? subjects.filter(s => spacedRepetitionReviews.some(r => r.subjectId === s.id || r.subjectName === s.name) || subjects.length <= 3)
                : subjects.filter(s => s.id === selectedSubjectFilter);

              // If a specific subject is selected and not in subjects list, fallback to finding by ID
              if (activeSubjects.length === 0 && selectedSubjectFilter !== 'all') {
                const found = subjects.find(s => s.id === selectedSubjectFilter);
                if (found) activeSubjects.push(found);
              }

              if (activeSubjects.length === 0) {
                return (
                  <div className="py-16 bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center space-y-4 shadow-sm">
                    <BookOpen className="w-10 h-10 text-zinc-400 mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">لا توجد دروس مراجعة مدرجة حالياً</p>
                      <p className="text-xs text-zinc-400 mt-1">أضف درساً لمتابعة مراجعاته المتباعدة في أي مادة دراسية.</p>
                    </div>
                    <button
                      onClick={() => {
                        if (subjects.length > 0) setAddLessonSubjectId(subjects[0].id);
                        setShowAddLessonModal(true);
                      }}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة درس جديد الآن</span>
                    </button>
                  </div>
                );
              }

              return activeSubjects.map((sub) => {
                const subjectLessons = spacedRepetitionReviews.filter(
                  r => r.subjectId === sub.id || r.subjectName.trim().toLowerCase() === sub.name.trim().toLowerCase()
                );

                // Filter by search query if any
                const searchedLessons = subjectLessons.filter(lesson => {
                  if (!lessonSearchQuery.trim()) return true;
                  const q = lessonSearchQuery.trim().toLowerCase();
                  return (
                    lesson.lessonName.toLowerCase().includes(q) ||
                    (lesson.unitName && lesson.unitName.toLowerCase().includes(q))
                  );
                });

                // Filter by status tab
                const filteredLessons = searchedLessons.filter(lesson => {
                  if (spacedFilter === 'today') return lesson.nextReviewDate === todayStr;
                  if (spacedFilter === 'upcoming') return lesson.nextReviewDate > todayStr;
                  if (spacedFilter === 'missed') return lesson.nextReviewDate < todayStr;
                  return true;
                });

                const totalMilestonesCount = subjectLessons.length * 8;
                let completedMilestonesCount = 0;
                subjectLessons.forEach(l => {
                  completedMilestonesCount += (l.milestones || []).filter(m => m.status === 'completed').length;
                });

                const subjectProgress = totalMilestonesCount > 0
                  ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100)
                  : 0;

                const dueTodayCount = subjectLessons.filter(l => l.nextReviewDate === todayStr).length;
                const missedCount = subjectLessons.filter(l => l.nextReviewDate < todayStr).length;

                return (
                  <div 
                    key={sub.id} 
                    className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 md:p-7 space-y-6 shadow-sm"
                  >
                    {/* Dedicated Subject Space Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-3xl shadow-sm">
                          {renderSubjectIconEmoji(sub.icon)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                              {sub.name}
                            </h3>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
                              مساحة مخصصة للمادة
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {subjectLessons.length} دروس مسجلة للمراجعة • {completedMilestonesCount} مراجعة مكتملة من إجمالي {totalMilestonesCount}
                          </p>
                        </div>
                      </div>

                      {/* Subject Metrics & Quick Add Action */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="px-3.5 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-right min-w-[120px]">
                          <span className="text-[10px] font-bold text-zinc-400 block">مستوى الإنجاز والتثبيت</span>
                          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{subjectProgress}% 🌟</span>
                        </div>

                        {dueTodayCount > 0 && (
                          <div className="px-3.5 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-right">
                            <span className="text-[10px] font-bold text-indigo-500 block">مطلوب اليوم</span>
                            <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">{dueTodayCount} دروس ⚡</span>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setAddLessonSubjectId(sub.id);
                            setShowAddLessonModal(true);
                          }}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إضافة درس لـ {sub.name}</span>
                        </button>
                      </div>
                    </div>

                    {/* Search and Status Filters Inside Subject Space */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      {/* Search Bar */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={lessonSearchQuery}
                          onChange={(e) => setLessonSearchQuery(e.target.value)}
                          placeholder={`ابحث عن درس في ${sub.name}...`}
                          className="w-full pl-3 pr-9 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Status Filter Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl">
                        {[
                          { id: 'all', label: 'كل الدروس' },
                          { id: 'today', label: `اليوم (${dueTodayCount})` },
                          { id: 'upcoming', label: 'القادمة' },
                          { id: 'missed', label: `المتأخرة (${missedCount})` }
                        ].map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setSpacedFilter(f.id as any)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                              spacedFilter === f.id
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lessons Cards List */}
                    <div className="space-y-5">
                      {filteredLessons.length === 0 ? (
                        <div className="py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center space-y-3">
                          <p className="text-xs font-bold text-zinc-500">
                            {lessonSearchQuery.trim()
                              ? `لا توجد دروس تطابق بحث "${lessonSearchQuery}" في ${sub.name}.`
                              : `لا توجد دروس تحت هذا الفلتر في ${sub.name}.`}
                          </p>
                          <button
                            onClick={() => {
                              setAddLessonSubjectId(sub.id);
                              setShowAddLessonModal(true);
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                          >
                            ➕ أضف درساً جديداً لهذه المادة الآن
                          </button>
                        </div>
                      ) : (
                        filteredLessons.map((item) => {
                          const completedCount = (item.milestones || []).filter(m => m.status === 'completed').length;
                          const progressPct = Math.round((completedCount / 8) * 100);

                          // Ensure 8 milestones array
                          const milestones = (item.milestones && item.milestones.length === 8)
                            ? item.milestones
                            : REVIEW_STAGES.map((s, idx) => ({
                                daysFromStart: s.days,
                                targetDate: item.nextReviewDate || todayStr,
                                status: 'pending' as const,
                                lessonId: item.lessonId || item.id,
                                subject: item.subjectName,
                                unit: item.unitName || '',
                                reviewNumber: idx + 1,
                                plannedReviewDate: item.nextReviewDate || todayStr,
                                memoryStrength: 100,
                                retentionEstimate: 100,
                                priority: 'medium' as const,
                                difficulty: 'medium' as const,
                                confidence: null
                              }));

                          return (
                            <div
                              key={item.id}
                              className="bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-5 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs"
                            >
                              {/* Lesson Header Row */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/60 dark:border-zinc-700/60">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                      <span>📖 {item.lessonName}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingLessonModal({
                                            id: item.id,
                                            lessonName: item.lessonName,
                                            unitName: item.unitName || '',
                                            subjectId: item.subjectId,
                                            subjectName: item.subjectName
                                          });
                                          setEditLessonNameInput(item.lessonName);
                                          setEditLessonUnitInput(item.unitName || '');
                                        }}
                                        className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 rounded-md transition-colors cursor-pointer"
                                        title="تعديل اسم الدرس والمحتوى"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    </h4>
                                    {item.unitName && (
                                      <span className="text-[10px] text-zinc-500 bg-zinc-200/80 dark:bg-zinc-700/80 px-2 py-0.5 rounded-md font-bold">
                                        🏷️ {item.unitName}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md font-bold border border-indigo-200/50 dark:border-indigo-800/50">
                                      {completedCount} من 8 مراجعات ({progressPct}%)
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                                    <span>
                                      📅 تاريخ المذاكرة: <strong className="text-zinc-700 dark:text-zinc-300">{item.studiedDate || 'مسجل'}</strong>
                                    </span>
                                    <span>
                                      المراجعة القادمة: <strong className="text-indigo-600 dark:text-indigo-400">{item.nextReviewDate}</strong>
                                    </span>
                                  </div>
                                </div>

                                {/* Lesson Actions */}
                                <div className="flex items-center gap-2 self-start sm:self-center">
                                  <button
                                    onClick={() => {
                                      setActiveReviewItem(item);
                                      setConfidenceScore(5);
                                    }}
                                    className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                    title="تقييم استدعاء الذاكرة العميق"
                                  >
                                    <Brain className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>تقييم الاستدعاء</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setDeletingLessonItem(item)}
                                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                    title="حذف هذا الدرس"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Interactive "Did I review this lesson?" Checkboxes Grid */}
                              <div className="space-y-2">
                                <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 block">
                                  ✅ سجل التحقق من المراجعة (اضغط على أي مرحلة للتأكيد المباشر):
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                  {REVIEW_STAGES.map((stage, idx) => {
                                    const ms = milestones[idx];
                                    const isCompleted = ms && ms.status === 'completed';
                                    const plannedDate = ms?.plannedReviewDate || ms?.targetDate || '';
                                    const isDueToday = plannedDate === todayStr && !isCompleted;
                                    const isLate = plannedDate < todayStr && !isCompleted;

                                    return (
                                      <div
                                        key={idx}
                                        onClick={() => handleToggleMilestoneDirectly(item, idx, !isCompleted)}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                                          isCompleted
                                            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 shadow-xs hover:border-emerald-400'
                                            : isDueToday
                                            ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20 hover:border-indigo-400'
                                            : isLate
                                            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 hover:border-rose-300'
                                            : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                        }`}
                                      >
                                        {/* Custom Styled Checkbox Control */}
                                        <div className="pt-0.5">
                                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                                            isCompleted
                                              ? 'bg-emerald-600 text-white shadow-xs'
                                              : 'border-2 border-zinc-300 dark:border-zinc-600 hover:border-indigo-500 bg-white dark:bg-zinc-800'
                                          }`}>
                                            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                          </div>
                                        </div>

                                        {/* Conversational Text & Status Badge */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-1">
                                            <span className={`text-xs font-black block truncate ${
                                              isCompleted 
                                                ? 'text-emerald-900 dark:text-emerald-200' 
                                                : 'text-zinc-900 dark:text-zinc-100'
                                            }`}>
                                              {stage.question}
                                            </span>
                                          </div>

                                          <div className="mt-1 flex items-center justify-between text-[10px]">
                                            <span className="font-bold opacity-75 text-zinc-500 dark:text-zinc-400">
                                              ({stage.label})
                                            </span>

                                            {isCompleted ? (
                                              <span className="font-black text-emerald-600 dark:text-emerald-400">
                                                نعم راجعت ✅
                                              </span>
                                            ) : isDueToday ? (
                                              <span className="font-black text-indigo-600 dark:text-indigo-400 animate-pulse">
                                                مستحقة اليوم! ⚡
                                              </span>
                                            ) : isLate ? (
                                              <span className="font-bold text-rose-600 dark:text-rose-400">
                                                متأخرة ⚠️ {plannedDate}
                                              </span>
                                            ) : (
                                              <span className="font-bold text-zinc-400">
                                                مجدولة: {plannedDate}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* MANUAL ADD LESSON MODAL */}
      {showAddLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md" style={{ direction: 'rtl' }}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-right shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>➕ إضافة درس جديد لجدول المراجعات الذكية</span>
              </h3>
              <button
                onClick={() => setShowAddLessonModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block">المادة الدراسية:</label>
                <select
                  value={addLessonSubjectId}
                  onChange={(e) => setAddLessonSubjectId(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block">عنوان أو اسم الدرس المعني:</label>
                <input
                  type="text"
                  placeholder="مثال: التيار الكهربي وقانون أوم / التكتلات الاقتصادية..."
                  value={addLessonNameInput}
                  onChange={(e) => setAddLessonNameInput(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block">اسم الوحدة أو الفصل (اختياري):</label>
                <input
                  type="text"
                  placeholder="مثال: الوحدة الأولى / الفصل الثاني"
                  value={addLessonUnitInput}
                  onChange={(e) => setAddLessonUnitInput(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAddLessonModal(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleManualAddLesson}
                disabled={!addLessonNameInput.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                حفظ في جدول المراجعات الذكية
              </button>
            </div>
          </div>
        </div>
      )}


      {/* CONFIDENCE RATING SM-2 EVALUATION DIALOG */}
      {activeReviewItem && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-950 max-w-md w-full border border-zinc-100 dark:border-zinc-900 rounded-3xl p-6 text-right space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900/50 pb-4">
                <span className="text-[10px] text-zinc-400 font-bold">{activeReviewItem.subjectName} | {activeReviewItem.unitName}</span>
                <button 
                  onClick={() => setActiveReviewItem(null)}
                  className="text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                >
                  إغلاق ✕
                </button>
              </div>

              <h3 className="text-base font-black text-zinc-900 dark:text-zinc-50 mt-4 leading-relaxed">
                تقييم استدعاء الذاكرة لدرس:
                <span className="block text-zinc-600 dark:text-zinc-300 text-sm mt-1">{activeReviewItem.lessonName}</span>
              </h3>
            </div>

            {/* Instruction block */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-900 text-xs leading-relaxed text-zinc-500">
              💡 **تمرين التسميع والتحقق**: قم بمحاولة تذكر المفاهيم الأساسية، القوانين، أو الكلمات المرتبطة بهذا الدرس ذهنياً أو على مسودة، ثم قم بقياس مستوى دقة تذكرك الفعلي.
            </div>

            {/* V12.4 Voice Explanation Link if available */}
            {(() => {
              const voiceNotes = getStoredVoiceNotes();
              const existingNote = voiceNotes.find(n => 
                n.lessonName.toLowerCase().includes(activeReviewItem.lessonName.toLowerCase()) ||
                activeReviewItem.lessonName.toLowerCase().includes(n.lessonName.toLowerCase()) ||
                (n.subjectName === activeReviewItem.subjectName && n.chapterName === activeReviewItem.unitName)
              );

              if (existingNote) {
                return (
                  <div className="p-4 bg-indigo-950/40 border border-indigo-500/40 rounded-2xl space-y-2 text-right">
                    <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs">
                      <Mic className="w-4 h-4 animate-pulse" />
                      <span>خطوة موصى بها أولاً: الاستماع لشرحك الصوتي السابق 🎧</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed font-semibold">
                      يوجد شرح صوتی بصوتك لهذا الدرس مسجل بتاريخ {existingNote.date} (المدة: {Math.floor(existingNote.durationSeconds / 60)} دقيقة).
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (existingNote.audioDataUri) {
                          const audio = new Audio(existingNote.audioDataUri);
                          audio.play().catch(() => {});
                        } else {
                          alert(`جاري تشغيل الشرح الصوتي الخاص بـ: ${existingNote.lessonName}`);
                        }
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>🎧 الاستماع إلى شرحك الشخصي للدرس الآن</span>
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            {/* Scale choice layout */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-bold block mb-1">قياس قوة الاسترجاع الفعلي:</label>
              
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { value: 5, score: 'ممتاز ومثالي (5/5)', desc: 'تذكرت كامل الدرس فوراً بوضوح تام ودون أي تردد.' },
                  { value: 4, score: 'جيد جداً مع جهد طفيف (4/5)', desc: 'تذكرت المفهوم بالكامل بعد بضع ثوانٍ من التفكير.' },
                  { value: 3, score: 'مقبول مع نسيان طفيف (3/5)', desc: 'تذكرت الخطوط العريضة فقط، ونسيت بعض التفاصيل الفرعية.' },
                  { value: 2, score: 'صعب وضعيف جداً (2/5)', desc: 'تذكرت بصعوبة شديدة وبشكل مشوش بعد رؤية تلميحات.' },
                  { value: 1, score: 'نسيان تام للمعلومة (1/5)', desc: 'لم أستطع تذكر أي شيء على الإطلاق وكأنني أراه لأول مرة.' }
                ].map((scale) => (
                  <button
                    key={scale.value}
                    onClick={() => setConfidenceScore(scale.value)}
                    className={`p-3.5 rounded-2xl text-right border text-xs transition-all ${
                      confidenceScore === scale.value
                        ? 'bg-zinc-950 dark:bg-zinc-50 border-zinc-950 dark:border-zinc-50 text-zinc-50 dark:text-zinc-950 font-bold shadow'
                        : 'bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-50 dark:hover:bg-zinc-900 border-zinc-100 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="block font-black">{scale.score}</span>
                    <span className={`block mt-0.5 text-[10px] ${confidenceScore === scale.value ? 'text-zinc-300 dark:text-zinc-500' : 'text-zinc-400'}`}>
                      {scale.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <button
              onClick={() => handleCompleteReview(activeReviewItem, confidenceScore)}
              className="w-full py-4 bg-zinc-950 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all text-zinc-50 dark:text-zinc-950 text-xs font-black rounded-2xl shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              تأكيد وإدراج النتيجة في الخوارزمية
            </button>
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {editingLessonModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 max-w-md w-full border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-right space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-500" />
                <span>تعديل اسم الدرس والمحتوى</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingLessonModal(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl text-[11px] text-indigo-700 dark:text-indigo-300">
              💡 المادة: <strong>{editingLessonModal.subjectName}</strong> — سيتم تحديث وتعديل اسم الدرس في جدول المراجعات الذكية والمنظم الأسبوعي/اليومي تلقائياً وبشكل متزامن.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  اسم الدرس الجديد:
                </label>
                <input
                  type="text"
                  value={editLessonNameInput}
                  onChange={(e) => setEditLessonNameInput(e.target.value)}
                  placeholder="مثال: البلاغة - الاستعارة التصريحية والمكنية"
                  className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  اسم الوحدة / الفصل (اختياري):
                </label>
                <input
                  type="text"
                  value={editLessonUnitInput}
                  onChange={(e) => setEditLessonUnitInput(e.target.value)}
                  placeholder="مثال: الوحدة الأولى - علم البيان"
                  className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingLessonModal(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveLessonRename}
                disabled={!editLessonNameInput.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ وتحديث الاسمين معاً ✅</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Lesson Confirmation Modal */}
      {deletingLessonItem && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 max-w-md w-full border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-right space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>تأكيد حذف الدرس من جدول المراجعات</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeletingLessonItem(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 rounded-2xl space-y-1.5 text-xs text-rose-900 dark:text-rose-200">
              <p className="font-bold">
                هل أنت متأكد من رغبتك في حذف درس <strong>"{deletingLessonItem.lessonName}"</strong>؟
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                المادة: <strong>{deletingLessonItem.subjectName}</strong> {deletingLessonItem.unitName ? `(${deletingLessonItem.unitName})` : ''} — سيتم مسح هذا الدرس ومحطات المراجعة الـ 8 الخاصة به بالكامل من جدول المراجعات الذكية.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setDeletingLessonItem(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl cursor-pointer"
              >
                تراجع وإلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLesson}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>نعم، حذف الدرس الآن 🗑️</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
