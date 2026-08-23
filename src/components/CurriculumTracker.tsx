/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Brain, 
  Search, 
  Percent, 
  Star, 
  HelpCircle, 
  Layers, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

interface Stage {
  status: 'not_started' | 'scheduled' | 'completed' | 'overdue';
  completedAt?: string;
  confidenceScore?: number;
  score?: number;
  totalScore?: number;
  scheduledDate?: string;
}

interface LessonProgress {
  lessonId: string;
  lessonName: string;
  subjectId: string;
  subjectName: string;
  unitName: string;
  currentStage: number;
  stages: {
    1: Stage;
    2: Stage;
    3: Stage;
    4: Stage;
    5: Stage;
    6: Stage;
  };
  confidenceScore: number;
  mastered: boolean;
  lastUpdated: string;
}

interface Lesson {
  id: string;
  name: string;
  lessonNumber: number;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedStudyTime: number;
  estimatedRevisionTime: number;
}

interface Unit {
  unitNumber: number;
  name: string;
  lessons: Lesson[];
}

interface CurriculumSubject {
  id: string;
  name: string;
  color: string;
  icon: string;
  maxScore: number;
  units: Unit[];
}

interface CurriculumTrackerProps {
  curriculumProgress: { [lessonId: string]: LessonProgress };
  onUpdateCurriculumProgress: (progress: any) => void;
  token?: string;
  user?: any;
  onTriggerCheckin?: () => void;
}

const STAGE_NAMES = {
  1: 'المذاكرة الأولى للدرس',
  2: 'استدعاء نشط فوري',
  3: 'حل شيت الحصة',
  4: 'حل الواجب المنزلي',
  5: 'التكرار المتباعد الأول',
  6: 'مراجعة التثبيت طويلة المدى'
};

const STAGE_ICONS = {
  1: '📘',
  2: '🧠',
  3: '📝',
  4: '📚',
  5: '🔁',
  6: '🎯'
};

const STAGE_DESCS = {
  1: 'دراسة وفهم المفاهيم الأساسية، تدوين الملاحظات وتحديد النقاط الصعبة لأول مرة.',
  2: 'استدعاء ذاتي نشط بدون مراجعة المذكرات بعد 10-15 دقيقة لتجذير الروابط العصبية.',
  3: 'تقييم سريع بحل ورقة عمل الحصة (الشيت) أو كويز لقياس الفهم الفوري واستخلاص الأخطاء.',
  4: 'حل الأسئلة والتدريبات المنزلية المقررة لتثبيت القوانين وتطبيق الأفكار الإبداعية.',
  5: 'مراجعة استذكارية سريعة بعد يومين (48 ساعة) لمقاومة منحنى النسيان الحاد الأول للإنجهاوس.',
  6: 'جلسات مراجعة تراكمية متباعدة دورياً (كل أسبوع أو أسبوعين) لنقل المعلومات للذاكرة طويلة المدى.'
};

export default function CurriculumTracker({
  curriculumProgress = {},
  onUpdateCurriculumProgress,
  token,
  user,
  onTriggerCheckin
}: CurriculumTrackerProps) {
  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<{ [key: string]: boolean }>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'studying' | 'mastered'>('all');

  // Interactive Stage Editing Modal State
  const [editingLesson, setEditingLesson] = useState<{
    lesson: Lesson;
    unitName: string;
    subject: CurriculumSubject;
    stageNum: number;
    stageData: Stage;
  } | null>(null);

  // Form states
  const [formStatus, setFormStatus] = useState<'not_started' | 'scheduled' | 'completed' | 'overdue'>('not_started');
  const [formConfidence, setFormConfidence] = useState<number>(3);
  const [formScore, setFormScore] = useState<string>('');
  const [formTotalScore, setFormTotalScore] = useState<string>('');
  const [formScheduledDate, setFormScheduledDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load Curriculum Subjects
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/curriculum/subjects', {
      headers: { 'x-auth-token': token }
    })
      .then(res => {
        if (!res.ok) throw new Error('فشل تحميل بيانات المنهج');
        return res.json();
      })
      .then(data => {
        if (data.subjects) {
          // Remove subjects from curriculum if they have no purpose (no lessons) or are study-methods only
          const filteredCurriculumSubjects = data.subjects.filter((sub: CurriculumSubject) => {
            const hasLessons = sub.units && sub.units.some((u: Unit) => u.lessons && u.lessons.length > 0);
            const isStudyMethodOnly = sub.name?.includes('طرق المذاكرة') || sub.name?.includes('أساليب المذاكرة') || sub.name?.includes('Study Methods');
            return hasLessons && !isStudyMethodOnly;
          });

          setSubjects(filteredCurriculumSubjects);
          // Expand first subject units by default
          if (filteredCurriculumSubjects.length > 0) {
            setSelectedSubjectId(filteredCurriculumSubjects[0].id);
            const initialExpanded: { [key: string]: boolean } = {};
            filteredCurriculumSubjects[0].units?.forEach((u: Unit, idx: number) => {
              initialExpanded[`${filteredCurriculumSubjects[0].id}_u_${u.unitNumber}`] = idx === 0; // Expand first unit
            });
            setExpandedUnits(initialExpanded);
          }
        }
      })
      .catch(err => {
        console.error('Curriculum load error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Overall Statistics Calculations
  const stats = useMemo(() => {
    let totalLessonsCount = 0;
    let completedLessonsCount = 0; // At least Stage 1 is finished
    let masteredLessonsCount = 0; // All 6 stages completed
    let totalScoreSum = 0;
    let totalScoreCount = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;

    subjects.forEach(sub => {
      sub.units?.forEach(unit => {
        unit.lessons?.forEach(lesson => {
          totalLessonsCount++;
          const progress = curriculumProgress[lesson.id];
          if (progress) {
            if (progress.stages?.[1]?.status === 'completed') {
              completedLessonsCount++;
            }
            if (progress.mastered) {
              masteredLessonsCount++;
            }
            if (progress.confidenceScore) {
              confidenceSum += progress.confidenceScore;
              confidenceCount++;
            }
            // Average scores from Class Sheet (Stage 3) and Homework (Stage 4)
            [3, 4].forEach(stageId => {
              const st = progress.stages?.[stageId as 1 | 2 | 3 | 4 | 5 | 6];
              if (st && st.status === 'completed' && st.score !== undefined && st.totalScore) {
                totalScoreSum += (st.score / st.totalScore) * 100;
                totalScoreCount++;
              }
            });
          }
        });
      });
    });

    const averageConfidence = confidenceCount > 0 ? (confidenceSum / confidenceCount).toFixed(1) : '3.0';
    const averageScore = totalScoreCount > 0 ? Math.round(totalScoreSum / totalScoreCount) : null;
    const progressPercent = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;
    const masteredPercent = totalLessonsCount > 0 ? Math.round((masteredLessonsCount / totalLessonsCount) * 100) : 0;

    return {
      totalLessonsCount,
      completedLessonsCount,
      masteredLessonsCount,
      averageConfidence,
      averageScore,
      progressPercent,
      masteredPercent
    };
  }, [subjects, curriculumProgress]);

  // Filter lessons based on search query and status filter
  const activeSubject = subjects.find(s => s.id === selectedSubjectId);

  // Helper to open Edit State Modal
  const startEditStage = (lesson: Lesson, unitName: string, sub: CurriculumSubject, stageNum: number) => {
    const progress = curriculumProgress[lesson.id];
    const stageData = progress?.stages?.[stageNum as 1 | 2 | 3 | 4 | 5 | 6] || { status: 'not_started' };
    
    setEditingLesson({ lesson, unitName, subject: sub, stageNum, stageData });
    setFormStatus(stageData.status);
    setFormConfidence(stageData.confidenceScore || 3);
    setFormScore(stageData.score !== undefined ? String(stageData.score) : '');
    setFormTotalScore(stageData.totalScore !== undefined ? String(stageData.totalScore) : '');
    setFormScheduledDate(stageData.scheduledDate || '');
    setSaveSuccess(false);
  };

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !token) return;

    setIsSaving(true);
    try {
      const payload = {
        lessonId: editingLesson.lesson.id,
        lessonName: editingLesson.lesson.name,
        subjectId: editingLesson.subject.id,
        subjectName: editingLesson.subject.name,
        unitName: editingLesson.unitName,
        stageNumber: editingLesson.stageNum,
        stageStatus: formStatus,
        confidenceScore: formConfidence,
        score: formScore !== '' ? Number(formScore) : undefined,
        totalScore: formTotalScore !== '' ? Number(formTotalScore) : undefined,
        scheduledDate: formScheduledDate !== '' ? formScheduledDate : undefined
      };

      const res = await fetch('/api/curriculum/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحديث المرحلة');

      if (data.success && data.progress) {
        // Construct the full updated progress map
        const updatedProgress = {
          ...curriculumProgress,
          [editingLesson.lesson.id]: data.progress
        };
        onUpdateCurriculumProgress(updatedProgress);
        setSaveSuccess(true);
        setTimeout(() => {
          setEditingLesson(null);
        }, 800);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  // Helper to determine stage state badge / coloring
  const getStageStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500 text-white border-emerald-600';
      case 'scheduled':
        return 'bg-blue-500 text-white border-blue-600 animate-pulse';
      case 'overdue':
        return 'bg-red-500 text-white border-red-600 animate-bounce';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-700';
    }
  };

  // Get localized status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'scheduled': return 'مجدول';
      case 'overdue': return 'متأخر';
      default: return 'غير مبدوء';
    }
  };

  return (
    <div className="space-y-8 text-right pb-16" style={{ direction: 'rtl' }}>
      {/* Title section with aesthetic illustration */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 rounded-full">
              الجيل الثالث للمذاكرة ⚡
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
            منهج المذاكرة الذكي ودورة التعلم المتكاملة 📚📈
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            توقف عن معاملة كل درس كأنه جلسة دراسة عابرة! ينظم هذا النظام دورة دراسة الدرس الفعلي على مدار 6 مراحل عصبية متتالية: من الفهم الأول، مروراً بحل الشيتات والواجبات، وحتى الاستدعاء النشط وجدولة التكرار المتباعد.
          </p>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shrink-0 self-stretch md:self-auto flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3">
          <Brain className="w-8 h-8 text-zinc-900 dark:text-zinc-50 animate-pulse hidden md:block" />
          <div className="text-right md:text-left">
            <span className="text-[10px] text-zinc-400 font-bold block">معدل التحصيل الشامل</span>
            <span className="text-2xl font-black text-zinc-950 dark:text-zinc-50 block mt-0.5">{stats.progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Main Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-zinc-900 p-5 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex flex-col justify-between gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-black">التقدم العام بالمنهج</span>
            <BookOpen className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{stats.completedLessonsCount}</span>
            <span className="text-xs text-zinc-400">/ {stats.totalLessonsCount} درس مفعّل</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-zinc-900 dark:bg-zinc-100 h-full rounded-full transition-all" style={{ width: `${stats.progressPercent}%` }} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-zinc-900 p-5 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex flex-col justify-between gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-black">دروس تم إتقانها وتثبيتها</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{stats.masteredLessonsCount}</span>
            <span className="text-xs text-zinc-400">({stats.masteredPercent}%)</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${stats.masteredPercent}%` }} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-zinc-900 p-5 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex flex-col justify-between gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-black">متوسط قوة ثقة الذاكرة</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{stats.averageConfidence}</span>
            <span className="text-xs text-zinc-400">/ 5.0 نقاط</span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-none">مستنتجة من تقييمات الاستدعاء الفعلي للدروس.</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-zinc-900 p-5 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex flex-col justify-between gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-black">متوسط درجات الشيتات والواجب</span>
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50">
              {stats.averageScore !== null ? `${stats.averageScore}%` : '---'}
            </span>
            <span className="text-xs text-zinc-400">معدل الفهم المقاس</span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-none">محسوب من درجات الشيت والواجبات المسجلة.</p>
        </div>
      </div>

      {/* Curriculum subjects navigation and search */}
      <div className="bg-white dark:bg-zinc-900 p-5 border border-zinc-100 dark:border-zinc-800 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث عن درس محدد، موضوع أو مفهوم في المنهج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 text-xs sm:text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-950 dark:text-zinc-50"
            />
          </div>

          {/* Status quick filters */}
          <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl self-start md:self-auto">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'not_started', label: 'غير مبدوء' },
              { id: 'studying', label: 'قيد الدراسة' },
              { id: 'mastered', label: 'تم إتقانها 🏆' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Subjects list */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-zinc-100 dark:border-zinc-800 pt-4">
          {subjects.map(sub => {
            const isActive = sub.id === selectedSubjectId;
            return (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedSubjectId(sub.id);
                  // Expand units of this subject
                  const updatedExpanded: { [key: string]: boolean } = {};
                  sub.units?.forEach((u, i) => {
                    updatedExpanded[`${sub.id}_u_${u.unitNumber}`] = i === 0;
                  });
                  setExpandedUnits(updatedExpanded);
                }}
                className={`px-4 py-3 rounded-2xl text-xs font-extrabold transition-all border flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md border-transparent scale-[1.02]'
                    : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 border-zinc-150 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sub.color }}></span>
                <span>{sub.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Curriculum Units & Lessons list tree */}
      {loading ? (
        <div className="py-24 text-center text-zinc-400 text-sm font-bold flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-zinc-800 dark:border-zinc-100 border-t-transparent rounded-full animate-spin"></div>
          <span>جاري تحميل المنهج الدراسي وملف التحصيل...</span>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 rounded-3xl text-center text-red-600 dark:text-red-400">
          <p className="font-bold">⚠️ عذراً، تعذر تحميل المنهج</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      ) : activeSubject ? (
        <div className="space-y-6">
          {activeSubject.units?.map(unit => {
            const unitKey = `${activeSubject.id}_u_${unit.unitNumber}`;
            const isExpanded = expandedUnits[unitKey];

            // Filter lessons of this unit based on search and filters
            const filteredLessons = unit.lessons?.filter(lesson => {
              const matchesSearch = lesson.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                    (lesson.topic && lesson.topic.toLowerCase().includes(searchQuery.toLowerCase()));
              
              const progress = curriculumProgress[lesson.id];
              if (statusFilter === 'all') return matchesSearch;
              if (statusFilter === 'not_started') {
                return matchesSearch && (!progress || !progress.stages?.[1] || progress.stages[1].status !== 'completed');
              }
              if (statusFilter === 'studying') {
                return matchesSearch && progress && progress.stages?.[1]?.status === 'completed' && !progress.mastered;
              }
              if (statusFilter === 'mastered') {
                return matchesSearch && progress && progress.mastered;
              }
              return matchesSearch;
            }) || [];

            // Skip rendering units with 0 matching items if filtering or searching
            if ((searchQuery || statusFilter !== 'all') && filteredLessons.length === 0) {
              return null;
            }

            return (
              <div 
                key={unitKey}
                className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm"
              >
                {/* Unit Header Accordion Toggle */}
                <button
                  onClick={() => toggleUnit(unitKey)}
                  className="w-full p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-950/60 transition-colors text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-extrabold block">الفصل / الوحدة رقم {unit.unitNumber}</span>
                      <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-100 mt-0.5">{unit.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2.5 py-1 rounded-full font-bold">
                      {filteredLessons.length} دروس
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </div>
                </button>

                {/* Expanded Lessons Area */}
                {isExpanded && (
                  <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 space-y-6 bg-zinc-50/20 dark:bg-zinc-950/20">
                    {filteredLessons.map(lesson => {
                      const progress = curriculumProgress[lesson.id] || {
                        currentStage: 1,
                        stages: { 1: { status: 'not_started' }, 2: { status: 'not_started' }, 3: { status: 'not_started' }, 4: { status: 'not_started' }, 5: { status: 'not_started' }, 6: { status: 'not_started' } },
                        confidenceScore: 3,
                        mastered: false
                      };

                      return (
                        <div 
                          key={lesson.id}
                          className="p-5 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm"
                        >
                          {/* Lesson Title & Details Row */}
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-zinc-50 dark:border-zinc-800/80 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-zinc-400 font-bold">درس رقم {lesson.lessonNumber}</span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold ${
                                  lesson.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/10' :
                                  lesson.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/10' :
                                  'bg-red-50 text-red-600 dark:bg-red-950/10'
                                }`}>
                                  {lesson.difficulty === 'Easy' ? 'سهل' : lesson.difficulty === 'Medium' ? 'متوسط' : 'صعب'}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-zinc-850 dark:text-zinc-100 mt-1">{lesson.name}</h4>
                              {lesson.topic && <span className="text-[10px] text-zinc-400 block mt-0.5">{lesson.topic}</span>}
                            </div>

                            {/* Overall Lesson status indicator */}
                            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-0 pt-2 sm:pt-0 mt-2 sm:mt-0">
                              <div className="text-right">
                                <span className="text-[9px] text-zinc-400 font-bold block">مرحلة التعلم الحالية</span>
                                <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-200 mt-0.5 flex items-center gap-1">
                                  <span>{STAGE_ICONS[progress.currentStage as 1 | 2 | 3 | 4 | 5 | 6]}</span>
                                  <span>{STAGE_NAMES[progress.currentStage as 1 | 2 | 3 | 4 | 5 | 6]}</span>
                                </span>
                              </div>
                              {progress.mastered ? (
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30 text-[10px] font-black rounded-lg flex items-center gap-1 shadow-sm shrink-0">
                                  <Award className="w-3 h-3 text-emerald-500 animate-bounce" />
                                  <span>مكتمل ومثبّت</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] font-black rounded-lg flex items-center gap-1 shrink-0">
                                  <span>{Math.round(((progress.currentStage - 1) / 6) * 100)}% تم</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 6-Stage Visual Learning Timeline */}
                          <div>
                            <span className="text-[9px] text-zinc-400 font-bold block mb-2">مسار دورة المذاكرة الكاملة (اضغط على المرحلة لتعديلها):</span>
                            
                            <div className="relative pt-4 pb-2">
                              {/* Horizontal Timeline Connector Line (Desktop) */}
                              <div className="absolute top-[28px] right-4 left-4 h-1 bg-zinc-100 dark:bg-zinc-800 -z-10 hidden md:block"></div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 relative">
                                {([1, 2, 3, 4, 5, 6] as const).map(stageNum => {
                                  const stageData = progress.stages?.[stageNum] || { status: 'not_started' };
                                  const isCurrent = progress.currentStage === stageNum;

                                  return (
                                    <button
                                      key={stageNum}
                                      onClick={() => startEditStage(lesson, unit.name, activeSubject, stageNum)}
                                      className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between gap-1 text-xs relative ${
                                        isCurrent 
                                          ? 'ring-2 ring-zinc-950 dark:ring-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/80 shadow'
                                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-950/40 bg-white dark:bg-zinc-900'
                                      } ${
                                        stageData.status === 'completed' ? 'border-emerald-150 dark:border-emerald-900/30' :
                                        stageData.status === 'scheduled' ? 'border-blue-150 dark:border-blue-900/30' :
                                        stageData.status === 'overdue' ? 'border-red-150 dark:border-red-900/30' :
                                        'border-zinc-150 dark:border-zinc-800'
                                      }`}
                                    >
                                      {/* Top: Icon + Status */}
                                      <div className="flex items-center justify-between w-full">
                                        <span className="text-sm">{STAGE_ICONS[stageNum]}</span>
                                        <span className={`w-2.5 h-2.5 rounded-full border ${getStageStyle(stageData.status)}`} />
                                      </div>

                                      {/* Stage Index and Name */}
                                      <div className="mt-2 text-right">
                                        <span className="text-[8px] text-zinc-400 font-extrabold block">خطوة {stageNum}</span>
                                        <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 line-clamp-1">{STAGE_NAMES[stageNum]}</span>
                                      </div>

                                      {/* Bottom stage metadata (grades, dates, or status) */}
                                      <div className="mt-1 text-[9px] font-bold text-zinc-500 border-t border-zinc-100 dark:border-zinc-850 pt-1 flex items-center justify-between w-full">
                                        <span>{getStatusLabel(stageData.status)}</span>
                                        {stageData.status === 'completed' && (stageNum === 3 || stageNum === 4) && stageData.score !== undefined && (
                                          <span className="text-indigo-600 dark:text-indigo-400">
                                            {stageData.score}/{stageData.totalScore}
                                          </span>
                                        )}
                                        {stageData.status === 'completed' && stageData.confidenceScore !== undefined && (
                                          <span className="text-amber-500 flex items-center gap-0.5">
                                            ★{stageData.confidenceScore}
                                          </span>
                                        )}
                                        {stageData.status === 'scheduled' && stageData.scheduledDate && (
                                          <span className="text-blue-500 font-normal">
                                            {stageData.scheduledDate.substring(5)}
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center text-zinc-400 text-sm font-bold bg-white dark:bg-zinc-900 border border-dashed border-zinc-150 dark:border-zinc-800 rounded-3xl">
          📭 لا يوجد مواد مسجلة لشعبتك في تكرار المنهج الدراسي حالياً.
        </div>
      )}

      {/* Stage Modification Modal Dialogue */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-950 max-w-md w-full border border-zinc-150 dark:border-zinc-900 rounded-3xl p-6 text-right space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900/50 pb-4">
                <div>
                  <span className="text-[10px] text-zinc-400 font-extrabold">{editingLesson.subject.name} | {editingLesson.unitName}</span>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 mt-1 line-clamp-1">{editingLesson.lesson.name}</h3>
                </div>
                <button 
                  onClick={() => setEditingLesson(null)}
                  className="text-zinc-400 hover:text-zinc-600 text-xs font-black p-1.5"
                >
                  إغلاق ✕
                </button>
              </div>

              {/* Stage Introduction Banner */}
              <div className="mt-4 p-3.5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-850 flex items-start gap-2.5 text-xs">
                <span className="text-xl shrink-0">{STAGE_ICONS[editingLesson.stageNum as 1 | 2 | 3 | 4 | 5 | 6]}</span>
                <div>
                  <span className="font-black text-zinc-800 dark:text-zinc-200 block">
                    مرحلة رقم {editingLesson.stageNum}: {STAGE_NAMES[editingLesson.stageNum as 1 | 2 | 3 | 4 | 5 | 6]}
                  </span>
                  <p className="text-zinc-400 mt-1 leading-relaxed text-[10px]">
                    {STAGE_DESCS[editingLesson.stageNum as 1 | 2 | 3 | 4 | 5 | 6]}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStage} className="space-y-4">
              {/* Status input */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-black block">حالة التحصيل لهذه المرحلة:</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['not_started', 'scheduled', 'completed', 'overdue'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormStatus(s)}
                      className={`py-2 px-1 text-center rounded-xl font-bold text-[10px] transition-all border ${
                        formStatus === s
                          ? s === 'completed' ? 'bg-emerald-500 border-transparent text-white' :
                            s === 'scheduled' ? 'bg-blue-500 border-transparent text-white' :
                            s === 'overdue' ? 'bg-red-500 border-transparent text-white' :
                            'bg-zinc-950 border-transparent text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                          : 'bg-zinc-50 border-zinc-150 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {getStatusLabel(s)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scheduled Date picker if status is 'scheduled' */}
              {formStatus === 'scheduled' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1">
                  <label className="text-xs text-zinc-400 font-black block">تاريخ الإنجاز المجدول:</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={formScheduledDate}
                      onChange={(e) => setFormScheduledDate(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Confidence Rating if status is completed */}
              {formStatus === 'completed' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1">
                  <label className="text-xs text-zinc-400 font-black block">مستوى الثقة والاستيعاب الفعلي (1-5):</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => setFormConfidence(stars)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-1 ${
                          formConfidence === stars
                            ? 'bg-amber-500 border-transparent text-white shadow-sm scale-105'
                            : 'bg-zinc-50 border-zinc-150 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${formConfidence === stars ? 'fill-white' : 'text-zinc-400'}`} />
                        <span>{stars}</span>
                      </button>
                    ))}
                  </div>
                  <span className="block text-[10px] text-zinc-400 mt-1 leading-none">
                    {formConfidence === 5 ? '🎯 تذكر كلي تام للمفاهيم والتطبيقات بدون أي معوقات.' :
                     formConfidence === 4 ? '👍 تذكر جيد جداً مع مجهود بسيط واستذكار القوانين.' :
                     formConfidence === 3 ? '👌 استيعاب متوسط للمفاهيم العامة، ولكن هناك تفاصيل نسيت.' :
                     formConfidence === 2 ? '⚠️ استيعاب مشتت وضعيف، تفهم العناوين الكبيرة فقط.' :
                     '🚫 نسيان تام وصعوبة بالغة في محاولة التذكر والحل.'}
                  </span>
                </div>
              )}

              {/* Grade / Score inputs if (Class Sheet or Homework) AND completed */}
              {formStatus === 'completed' && (editingLesson.stageNum === 3 || editingLesson.stageNum === 4) && (
                <div className="space-y-2 p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 rounded-2xl animate-in slide-in-from-top-1">
                  {/* Subject and Sheet Name Confirmation Badge */}
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-black text-xs pb-1 border-b border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-base">{editingLesson.stageNum === 3 ? '📝' : '📚'}</span>
                    <span>تأكيد المادة: {editingLesson.subject.name} ({editingLesson.stageNum === 3 ? 'شيت الحصة' : 'الواجب المنزلي'})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-extrabold block">الدرجة التي حصلت عليها:</label>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={formScore}
                        onChange={(e) => setFormScore(e.target.value)}
                        placeholder="مثال: 8"
                        className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-extrabold block">الدرجة الكلية للامتحان:</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={formTotalScore}
                        onChange={(e) => setFormTotalScore(e.target.value)}
                        placeholder="مثال: 10"
                        className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Post-lesson check-in prompt if completing a stage */}
              {formStatus === 'completed' && onTriggerCheckin && (
                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-center justify-between gap-3 text-right">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-black text-amber-900 dark:text-amber-300 block">هل أنهيت جلستك الدراسية للتو؟ 🧠</span>
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 block">سجّل تقييمك اليومي ومؤشرات التركيز لتحديث إحصائياتك الحيوية</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onTriggerCheckin();
                    }}
                    className="px-3 py-1.5 text-[10px] font-black bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    تسجيل التقييم 🩺
                  </button>
                </div>
              )}

              {/* Save Trigger */}
              <div className="pt-2">
                {saveSuccess ? (
                  <div className="py-3.5 bg-emerald-500 text-white font-extrabold text-xs text-center rounded-2xl flex items-center justify-center gap-2 shadow-md animate-bounce">
                    <CheckCircle2 className="w-4 h-4 animate-pulse" />
                    <span>تم الحفظ وتحديث المسار بنجاح! 🎉</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-850 dark:bg-zinc-50 dark:hover:bg-zinc-200 transition-all text-zinc-50 dark:text-zinc-950 text-xs font-black rounded-2xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>جاري حفظ التغييرات...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>حفظ التعديلات وتحديث المرحلة 💾</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
