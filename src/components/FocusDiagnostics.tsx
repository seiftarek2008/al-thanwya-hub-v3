/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Brain,
  Clock,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  Plane,
  Award,
  BarChart2,
  PieChart as PieIcon,
  HelpCircle,
  Activity
} from 'lucide-react';
import { StudySession, Subject } from '../types';

interface FocusDiagnosticsProps {
  sessions: StudySession[];
  subjects: Subject[];
  onNavigateToSettings?: () => void;
  onStartFocusSession?: () => void;
}

export default function FocusDiagnostics({
  sessions = [],
  subjects = [],
  onNavigateToSettings,
  onStartFocusSession
}: FocusDiagnosticsProps) {
  const [selectedMetricView, setSelectedMetricView] = useState<'overview' | 'timeOfDay' | 'duration' | 'methods'>('overview');

  // Compute diagnostics & pattern analytics
  const analytics = useMemo(() => {
    const hasData = sessions.length > 0;
    const effectiveSessions = sessions;

    // 1. Overall stats
    const totalSessions = effectiveSessions.length;
    const totalDurationMins = hasData ? Math.round(effectiveSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60) : 0;
    const avgSessionMins = hasData && totalSessions > 0 ? Math.round(totalDurationMins / totalSessions) : 0;
    const avgFocusScore = hasData && totalSessions > 0 ? Math.round(
      effectiveSessions.reduce((acc, s) => acc + (s.focusScore || 0), 0) / totalSessions
    ) : 0;

    // 2. Time-of-Day Analysis (Morning, Afternoon, Evening, Night)
    const timeOfDayBuckets: Record<string, { label: string; period: string; totalFocus: number; totalMins: number; count: number; icon: string }> = {
      morning: { label: 'الصباح الباكر', period: '06:00 - 12:00', totalFocus: 0, totalMins: 0, count: 0, icon: '🌅' },
      afternoon: { label: 'الظهيرة والبعد الظهر', period: '12:00 - 17:00', totalFocus: 0, totalMins: 0, count: 0, icon: '☀️' },
      evening: { label: 'المساء والغروب', period: '17:00 - 22:00', totalFocus: 0, totalMins: 0, count: 0, icon: '🌆' },
      night: { label: 'الليل المتأخر', period: '22:00 - 06:00', totalFocus: 0, totalMins: 0, count: 0, icon: '🌙' }
    };

    effectiveSessions.forEach((s) => {
      const date = new Date(s.timestamp || Date.now());
      const hour = date.getHours();
      let bucketKey = 'morning';
      if (hour >= 6 && hour < 12) bucketKey = 'morning';
      else if (hour >= 12 && hour < 17) bucketKey = 'afternoon';
      else if (hour >= 17 && hour < 22) bucketKey = 'evening';
      else bucketKey = 'night';

      timeOfDayBuckets[bucketKey].totalFocus += s.focusScore || 75;
      timeOfDayBuckets[bucketKey].totalMins += Math.round((s.duration || 0) / 60);
      timeOfDayBuckets[bucketKey].count += 1;
    });

    const timeOfDayData = Object.keys(timeOfDayBuckets).map((key) => {
      const b = timeOfDayBuckets[key];
      const avgFocus = b.count > 0 ? Math.round(b.totalFocus / b.count) : 0;
      return {
        key,
        name: b.label,
        period: b.period,
        avgFocus,
        totalMins: b.totalMins,
        sessionsCount: b.count,
        icon: b.icon
      };
    });

    // Best Time Slot
    const activeTimeSlots = timeOfDayData.filter(t => t.sessionsCount > 0);
    const bestTimeSlot = activeTimeSlots.length > 0 
      ? [...activeTimeSlots].sort((a, b) => b.avgFocus - a.avgFocus)[0]
      : { key: 'none', name: 'لم تُحدد بعد', period: 'لا توجد جلسات مسجلة', avgFocus: 0, totalMins: 0, sessionsCount: 0, icon: '🎯' };

    // 3. Duration Endurance Analysis
    // Buckets: <25m, 25-45m, 45-60m, >60m
    const durationBuckets: Record<string, { label: string; minRange: string; totalFocus: number; count: number }> = {
      short: { label: 'قصيرة (<25د)', minRange: '< 25 دقيقة', totalFocus: 0, count: 0 },
      medium: { label: 'قياسية (25-45د)', minRange: '25 - 45 دقيقة', totalFocus: 0, count: 0 },
      long: { label: 'عميقة (45-60د)', minRange: '45 - 60 دقيقة', totalFocus: 0, count: 0 },
      extralong: { label: 'طويلة جداً (>60د)', minRange: '> 60 دقيقة', totalFocus: 0, count: 0 }
    };

    effectiveSessions.forEach((s) => {
      const mins = Math.round((s.duration || 0) / 60);
      let bKey = 'medium';
      if (mins < 25) bKey = 'short';
      else if (mins <= 45) bKey = 'medium';
      else if (mins <= 60) bKey = 'long';
      else bKey = 'extralong';

      durationBuckets[bKey].totalFocus += s.focusScore || 75;
      durationBuckets[bKey].count += 1;
    });

    const durationChartData = Object.keys(durationBuckets).map((key) => {
      const b = durationBuckets[key];
      const avgFocus = b.count > 0 ? Math.round(b.totalFocus / b.count) : 0;
      return {
        name: b.label,
        range: b.minRange,
        avgFocus,
        count: b.count
      };
    });

    const bestDurationSlot = [...durationChartData].sort((a, b) => b.avgFocus - a.avgFocus)[0] || durationChartData[1];

    // 4. Study Method Breakdown
    const methodBuckets: Record<string, { name: string; totalFocus: number; count: number }> = {
      'Pomodoro': { name: 'تقنية بومودورو ⏱️', totalFocus: 0, count: 0 },
      'Deep Work': { name: 'المذاكرة العميقة 🧠', totalFocus: 0, count: 0 },
      'Revision': { name: 'المراجعة والحل 🔁', totalFocus: 0, count: 0 },
      'Practice Questions': { name: 'حل الأسئلة والتمارين ✍️', totalFocus: 0, count: 0 }
    };

    effectiveSessions.forEach((s) => {
      const mName = s.method || 'Deep Work';
      if (!methodBuckets[mName]) {
        methodBuckets[mName] = { name: mName, totalFocus: 0, count: 0 };
      }
      methodBuckets[mName].totalFocus += s.focusScore || 75;
      methodBuckets[mName].count += 1;
    });

    const methodChartData = Object.keys(methodBuckets).map((key) => {
      const b = methodBuckets[key];
      const avgFocus = b.count > 0 ? Math.round(b.totalFocus / b.count) : 0;
      return {
        method: key,
        name: b.name,
        avgFocus,
        count: b.count
      };
    });

    const bestMethod = hasData ? ([...methodChartData].sort((a, b) => b.avgFocus - a.avgFocus)[0] || methodChartData[0]) : { method: 'none', name: 'لم تُحدد بعد', avgFocus: 0, count: 0 };

    // 5. Subject Focus Breakdown
    const subjectFocusMap: Record<string, { name: string; totalFocus: number; count: number; color: string }> = {};

    effectiveSessions.forEach((s) => {
      const subName = s.subjectName || 'مادة عامة';
      if (!subjectFocusMap[subName]) {
        const foundSub = subjects.find((sub) => sub.name === subName || sub.id === s.subjectId);
        subjectFocusMap[subName] = {
          name: subName,
          totalFocus: 0,
          count: 0,
          color: foundSub?.color || '#6366f1'
        };
      }
      subjectFocusMap[subName].totalFocus += s.focusScore || 75;
      subjectFocusMap[subName].count += 1;
    });

    const subjectChartData = Object.keys(subjectFocusMap).map((k) => ({
      name: k.length > 15 ? k.substring(0, 15) + '...' : k,
      fullTitle: k,
      avgFocus: Math.round(subjectFocusMap[k].totalFocus / (subjectFocusMap[k].count || 1)),
      count: subjectFocusMap[k].count,
      color: subjectFocusMap[k].color
    }));

    // Generate Tailored Actionable Recommendations based strictly on real sessions
    const recommendations: { id: string; title: string; category: 'time' | 'duration' | 'method' | 'dnd'; description: string; actionText: string; icon: any }[] = hasData ? [
      {
        id: 'rec_time',
        title: `استغل نافذة الذروة الذهنية: ${bestTimeSlot.name}`,
        category: 'time',
        description: `تظهر تحليلات جلساتك أن أعلى كفاءة انتباه تحققها في فترة (${bestTimeSlot.name} - ${bestTimeSlot.period}) بمتوسط تركيز %${bestTimeSlot.avgFocus}. يُفضل تخصيص المواد المعقدة والدروس الجديدة لهذه الفترة.`,
        actionText: 'جدولة المواد الصعبة في هذه الفترة',
        icon: Sparkles
      },
      {
        id: 'rec_duration',
        title: `المدة المثالية للجلسة: ${bestDurationSlot.range}`,
        category: 'duration',
        description: `تظهر منحنيات تحملك العصبوني أن الجلسات التي تتراوح بين (${bestDurationSlot.range}) توفر أعلى درجات الامتصاص المعرفي بتركيز %${bestDurationSlot.avgFocus}. تجنب الجلسات المستمرة لأكثر من 60 دقيقة دون استراحة لتفادي هبوط الطاقة العصبية.`,
        actionText: 'ضبط العداد التنازلي للمدة المثالية',
        icon: Clock
      },
      {
        id: 'rec_method',
        title: `الأسلوب الأكثر ملاءمة لعقلك: ${bestMethod.name}`,
        category: 'method',
        description: `حققت أسلوب المذاكرة (${bestMethod.name}) معدل تركيز بـ %${bestMethod.avgFocus}. اعتمد هذا الأسلوب بشكل رئيسي في دراستك اليومية للحفاظ على دفق ذهن مستقر.`,
        actionText: 'بدء جلسة بهذا الأسلوب',
        icon: Zap
      },
      {
        id: 'rec_dnd',
        title: 'بروتوكول تفادي تشتت الإشعارات (وضع الطيران)',
        category: 'dnd',
        description: 'تظهر الأبحاث العصبية أن تشتت الإشعارات لـ 3 ثوانٍ فقط يستغرق 23 دقيقة لاستعادة حالة التدفق العميق (Flow State). تفعيل "وضع عدم الإزعاج" يرفع درجات تركيزك بمقدار %15-20.',
        actionText: 'تفعيل تنبيه وضع عدم الإزعاج من الإعدادات',
        icon: Plane
      }
    ] : [
      {
        id: 'rec_start',
        title: 'ابدأ جلستك الأولى لتفعيل التشخيص الذكي',
        category: 'time',
        description: 'لا توجد جلسات مسجلة حتى الآن. عند إتمام أول جلسة مذاكرة في مؤقت التركيز، سيقوم النظام تلقائياً برصد منحنيات تركيزك وساعات ذروتك الذهنية.',
        actionText: 'بدء أول جلسة تركيز',
        icon: Sparkles
      },
      {
        id: 'rec_dnd',
        title: 'بروتوكول تفادي تشتت الإشعارات (وضع الطيران)',
        category: 'dnd',
        description: 'تظهر الأبحاث العصبية أن تشتت الإشعارات لـ 3 ثوانٍ فقط يستغرق 23 دقيقة لاستعادة حالة التدفق العميق (Flow State). تفعيل "وضع عدم الإزعاج" يرفع درجات تركيزك.',
        actionText: 'تفعيل وضع عدم الإزعاج',
        icon: Plane
      }
    ];

    return {
      hasData,
      totalSessions,
      totalDurationMins,
      avgSessionMins,
      avgFocusScore,
      timeOfDayData,
      bestTimeSlot,
      durationChartData,
      bestDurationSlot,
      methodChartData,
      bestMethod,
      subjectChartData,
      recommendations
    };
  }, [sessions, subjects]);

  return (
    <div className="space-y-6 text-right animate-fade-in" style={{ direction: 'rtl' }}>
      
      {/* Top Header & Intro Banner */}
      <div className="p-6 md:p-8 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 dark:from-zinc-950 dark:via-indigo-950/20 dark:to-zinc-950 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -translate-x-12 -translate-y-12" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-600 text-white shadow-xs flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                <span>تشخيص خوارزمي دقيق</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                علم الأعصاب التطبيقي
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              مستشار تشخيص أنماط التركيز العصبية 🎯
            </h2>

            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              يقوم هذا النظام بمسح وتحليل بيانات جلسات مذاكرتك الفعلية لرصد أوقات ذروتك الذهنية، المدة الزمنية المثالية للجلسات، وتقييم كفاءة التركيز لتقديم نصائح إستراتيجية تحميك من التشتت وتضمن الامتصاص المعرفي الكامل.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {onStartFocusSession && (
              <button
                onClick={onStartFocusSession}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>بدء جلسة تركيز الآن</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">متوسط طول الجلسة</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <strong className="text-2xl font-black text-zinc-900 dark:text-zinc-50 block">
            {analytics.hasData ? analytics.avgSessionMins : 0} <span className="text-xs font-normal text-zinc-400">دقيقة</span>
          </strong>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
            {analytics.hasData 
              ? (analytics.avgSessionMins <= 45 ? '✨ نطاق ممتاز يمنع الإرهاق العصبوني' : '⚠️ يُفضل تقسيم الجلسات لتفادي التشتت')
              : 'لم تُسجل جلسات بعد'}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">متوسط مؤشر التركيز</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
            %{analytics.hasData ? analytics.avgFocusScore : 0}
          </strong>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
            {analytics.hasData
              ? (analytics.avgFocusScore >= 80 ? '🎯 مستوى تدفق ذهني عالٍ جداً' : '📈 هناك فرصة لرفع التركيز بتقليل التشتت')
              : 'يعتمد على الجلسات المنجزة'}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">نافذة الذروة الذهنية</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <strong className="text-lg font-black text-zinc-900 dark:text-zinc-50 block truncate">
            {analytics.hasData ? analytics.bestTimeSlot.name : 'لم تُحدد بعد'}
          </strong>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
            {analytics.hasData ? `بمعدل تركيز %${analytics.bestTimeSlot.avgFocus} (${analytics.bestTimeSlot.period})` : 'سجل أول جلسة لتحديد الذروة'}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">إجمالي الجلسات المحللة</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <strong className="text-2xl font-black text-zinc-900 dark:text-zinc-50 block">
            {analytics.totalSessions} <span className="text-xs font-normal text-zinc-400">جلسة</span>
          </strong>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
            {analytics.totalDurationMins} دقيقة مذاكرة مسجلة
          </p>
        </div>
      </div>

      {/* Actionable Tailored Recommendations */}
      <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              التوصيات والإرشادات الأكاديمية المخصصة لأداء ذهنك
            </h3>
          </div>
          <span className="text-[11px] font-bold text-zinc-400">تحديث تلقائي استناداً لسلوكك الفعلي</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.recommendations.map((rec) => {
            const IconComp = rec.icon;
            const isDnd = rec.category === 'dnd';
            return (
              <div
                key={rec.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isDnd
                    ? 'border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${isDnd ? 'bg-indigo-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {rec.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {rec.description}
                  </p>
                </div>

                {isDnd && onNavigateToSettings && (
                  <button
                    onClick={onNavigateToSettings}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plane className="w-3.5 h-3.5" />
                    <span>{rec.actionText}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Charts Container */}
      <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              الرسوم البيانية لمؤشرات الانتباه وكفاءة الجلسات
            </h3>
          </div>

          {/* Chart Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl">
            {[
              { id: 'overview', label: 'كفاءة اليوم 🌅' },
              { id: 'duration', label: 'تحمل الجلسة ⏱️' },
              { id: 'methods', label: 'طرق المذاكرة ⚡' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMetricView(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  selectedMetricView === tab.id
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Summary Metric Cards (Replacing embedded charts) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[11px] font-bold text-zinc-500 block">الفترة الأكثر إنتاجية:</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
              {analytics.hasData ? analytics.bestTimeSlot.name : 'لم تُحدد بعد'}
            </span>
            <span className="text-[10px] text-zinc-400 block">
              {analytics.hasData ? `معدل التركيز: %${analytics.bestTimeSlot.avgFocus}` : 'بانتظار تسجيل الجلسات'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[11px] font-bold text-zinc-500 block">مدة الجلسة المثالية:</span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block">
              {analytics.hasData ? `${analytics.avgSessionMins} دقيقة` : '0 دقيقة'}
            </span>
            <span className="text-[10px] text-zinc-400 block">
              {analytics.hasData ? 'النطاق الذهبي لاستدامة الانتباه' : 'يتم احتسابه من جلساتك الفعلية'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[11px] font-bold text-zinc-500 block">إجمالي التركيز العام:</span>
            <span className="text-sm font-black text-purple-600 dark:text-purple-400 block">
              %{analytics.hasData ? analytics.avgFocusScore : 0}
            </span>
            <span className="text-[10px] text-zinc-400 block">
              مستخلص من {analytics.totalSessions} جلسة دراسية
            </span>
          </div>
        </div>

        {/* Subject Focus Ranking Section */}
        {analytics.subjectChartData.length > 0 && (
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-3">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-500" />
              <span>ترتيب كفاءة التركيز حسب المواد الدراسية:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {analytics.subjectChartData.map((sub) => (
                <div
                  key={sub.fullTitle}
                  className="p-3 rounded-2xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: sub.color }} />
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate" title={sub.fullTitle}>
                      {sub.fullTitle}
                    </span>
                  </div>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    %{sub.avgFocus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
