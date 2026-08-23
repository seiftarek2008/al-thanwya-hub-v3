import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  Edit2, 
  RefreshCw, 
  AlertTriangle, 
  Brain,
  Check,
  Tag,
  Sun,
  Moon,
  Layers,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PlannerActivity, Subject, LifestyleProfile, Gamification, Exam } from '../types';

interface WeeklyPlannerProps {
  activities: PlannerActivity[];
  subjects: Subject[];
  currentAcademicWeek?: number;
  onAddActivity: (activity: Omit<PlannerActivity, 'id'>) => void;
  onDeleteActivity: (id: string) => void;
  onUpdateActivity: (activity: PlannerActivity) => void;
  onOptimizeSchedule?: (optimizedList: PlannerActivity[]) => void;
  token?: string;
  onSyncFullData?: (newData: any) => void;
  lifestyleProfile?: LifestyleProfile;
  onUpdateLifestyleProfile?: (profile: LifestyleProfile) => void;
  gamification?: Gamification;
  onUpdateGamification?: (gamification: Gamification) => void;
  exams?: Exam[];
  onAddExam?: (newExam: Omit<Exam, 'id'>) => void;
  onDeleteExam?: (id: string) => void;
  spacedRepetitionReviews?: any[];
  onStartFocusSession?: (activity: PlannerActivity) => void;
}

const DAYS_ARABIC = [
  'الأحد (Sunday)',
  'الإثنين (Monday)',
  'الثلاثاء (Tuesday)',
  'الأربعاء (Wednesday)',
  'الخميس (Thursday)',
  'الجمعة (Friday)',
  'السبت (Saturday)'
];

const CATEGORIES = [
  { id: 'Study', name: 'مذاكرة مادة أساسية', color: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50' },
  { id: 'Lesson', name: 'درس / حصة (سنتر أو أونلاين)', color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300' },
  { id: 'StudyMethod', name: 'طرق وتقنيات المذاكرة ⚡', color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300' },
  { id: 'ActiveRecall', name: 'الاستدعاء النشط والمراجعة 🧠', color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/40 text-purple-800 dark:text-purple-300' },
  { id: 'Revision', name: 'تكرار متباعد ومراجعة دائرية', color: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/40 text-indigo-800 dark:text-indigo-300' },
  { id: 'Homework', name: 'حل واجبات ومسائل', color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300' },
  { id: 'Assignment', name: 'تطبيق عملي أو بحث', color: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/40 text-teal-800 dark:text-teal-300' },
  { id: 'Exam', name: 'امتحان تجريبي أو تقييم', color: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300' },
  { id: 'Health/Gym', name: 'رياضة وجيم وصحة بدنية', color: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300' },
  { id: 'Family/Personal', name: 'وقت عائلي ومواعيد', color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/40 text-purple-800 dark:text-purple-300' },
  { id: 'Free Time', name: 'ترفيه وراحة', color: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/40 text-orange-800 dark:text-orange-300' }
];

export default function WeeklyPlanner({ 
  activities, 
  subjects, 
  currentAcademicWeek = 1,
  onAddActivity, 
  onDeleteActivity, 
  onUpdateActivity,
  onOptimizeSchedule,
  token,
  onSyncFullData,
  onStartFocusSession
}: WeeklyPlannerProps) {
  
  // Custom 3 Part Names state (shared with TodayTracker via localStorage)
  const [partNames, setPartNames] = useState<{ part1: string; part2: string; part3: string }>(() => {
    try {
      const saved = localStorage.getItem('thanaweya_custom_part_names');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      part1: 'الجزء الأول (الصباح / الفجر)',
      part2: 'الجزء الثاني (الظهر / العصر)',
      part3: 'الجزء الثالث (المساء / الليل)'
    };
  });

  const [isEditingPartNames, setIsEditingPartNames] = useState(false);
  const [editPart1, setEditPart1] = useState(partNames.part1);
  const [editPart2, setEditPart2] = useState(partNames.part2);
  const [editPart3, setEditPart3] = useState(partNames.part3);

  // Planner View Mode: 'hybrid' (3 parts + optional exact times), 'parts_only' (3 parts without strict hours), 'exact_time' (timeline)
  const [plannerMode, setPlannerMode] = useState<'hybrid' | 'parts_only' | 'exact_time'>('hybrid');

  // Manual Activity Form State
  const [additionType, setAdditionType] = useState<'subject' | 'other'>('subject');
  const [title, setTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [partIndex, setPartIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [category, setCategory] = useState<PlannerActivity['category']>('Study');
  const [otherActivityCategory, setOtherActivityCategory] = useState<PlannerActivity['category']>('Lesson');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [reminder, setReminder] = useState(true);
  const [expectedDuration, setExpectedDuration] = useState('');
  const [todayGoal, setTodayGoal] = useState('');

  // Rich Material Stage & Attendance Mode state
  const [lessonPart, setLessonPart] = useState<'lesson' | 'class_sheet' | 'homework' | 'custom'>('lesson');
  const [customStageName, setCustomStageName] = useState('');
  const [studyMode, setStudyMode] = useState<'center' | 'online'>('center');
  const [onlineTimerTool, setOnlineTimerTool] = useState<'pomodoro' | 'stopwatch' | 'none'>('pomodoro');

  // Modal for logging actual in-person class time spent
  const [logInPersonAct, setLogInPersonAct] = useState<PlannerActivity | null>(null);
  const [actualMinutesInput, setActualMinutesInput] = useState<number>(120);

  // Quick Add for specific day + part modal
  const [quickAddModal, setQuickAddModal] = useState<{ dayIdx: number; partIdx: number } | null>(null);

  // Editing Activity Modal State
  const [editingActivity, setEditingActivity] = useState<PlannerActivity | null>(null);

  // Filter State
  const [selectedDayFilter, setSelectedDayFilter] = useState<number>(-1); // -1 = show all days
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmResetYear, setShowConfirmResetYear] = useState(false);
  const [isResettingYear, setIsResettingYear] = useState(false);

  useEffect(() => {
    if (subjects && subjects.length > 0) {
      if (!subjectId || !subjects.some(s => s.id === subjectId)) {
        setSubjectId(subjects[0].id);
      }
    }
  }, [subjects, subjectId]);

  useEffect(() => {
    const syncPartNames = () => {
      try {
        const saved = localStorage.getItem('thanaweya_custom_part_names');
        if (saved) setPartNames(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('thanaweya_part_names_updated', syncPartNames);
    window.addEventListener('storage', syncPartNames);
    return () => {
      window.removeEventListener('thanaweya_part_names_updated', syncPartNames);
      window.removeEventListener('storage', syncPartNames);
    };
  }, []);

  const subjectMap = useMemo(() => {
    const map: { [id: string]: Subject } = {};
    subjects.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [subjects]);

  const handleSavePartNames = () => {
    const updated = {
      part1: editPart1.trim() || 'الجزء الأول (الصباح)',
      part2: editPart2.trim() || 'الجزء الثاني (الظهر)',
      part3: editPart3.trim() || 'الجزء الثالث (المساء)'
    };
    setPartNames(updated);
    try {
      localStorage.setItem('thanaweya_custom_part_names', JSON.stringify(updated));
      window.dispatchEvent(new Event('thanaweya_part_names_updated'));
    } catch (e) {}
    setIsEditingPartNames(false);
  };

  const getStageText = (part?: string, customName?: string) => {
    if (part === 'lesson') return 'الشرح والمحاضرة';
    if (part === 'classwork' || part === 'class_sheet') return 'كلاس ورك / شيت الفصل';
    if (part === 'homework') return 'الهوم ورك والواجب';
    if (part === 'revision') return 'المراجعة والتثبيت';
    if (part === 'custom') return customName?.trim() || 'مرحلة إضافية';
    return '';
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (additionType === 'subject') {
      const subObj = subjectMap[subjectId];
      const stageText = getStageText(lessonPart, customStageName);
      const computedTitle = title.trim() || (subObj ? `${subObj.name} - ${stageText}` : stageText || 'حصة / درس جديد');

      onAddActivity({
        title: computedTitle,
        dayOfWeek: Number(dayOfWeek),
        partIndex: Number(partIndex),
        startTime: startTime || '09:00',
        endTime: endTime || '10:30',
        priority,
        category: 'Study',
        subjectId,
        reminder,
        todayGoal: todayGoal.trim() || undefined,
        lessonPart,
        customStageName: lessonPart === 'custom' ? customStageName.trim() : undefined,
        studyMode,
        onlineTimerTool: studyMode === 'online' ? onlineTimerTool : undefined,
      });
    } else {
      const defaultTitleMap: Record<string, string> = {
        'Online Course': '💻 كورس أونلاين',
        'Gym & Health': '🏋️ رياضة وجيم',
        'Self Development': '📚 قراءة وتطوير ذاتي',
        'Family/Personal': '👨‍👩‍👧 نشاط شخصي/عائلي',
        'Free Time': '🎨 وقت حر وهواية',
      };
      const computedTitle = title.trim() || defaultTitleMap[otherActivityCategory] || 'نشاط جديد';

      onAddActivity({
        title: computedTitle,
        dayOfWeek: Number(dayOfWeek),
        partIndex: Number(partIndex),
        startTime: startTime || '09:00',
        endTime: endTime || '10:30',
        priority,
        category: otherActivityCategory,
        subjectId: undefined,
        reminder,
        todayGoal: todayGoal.trim() || undefined,
        studyMode: 'online',
        onlineTimerTool: 'stopwatch',
      });
    }

    setTitle('');
    setTodayGoal('');
    setCustomStageName('');
  };

  const handleQuickAddSubmit = () => {
    if (!quickAddModal) return;

    if (additionType === 'subject') {
      const subObj = subjectMap[subjectId];
      const stageText = getStageText(lessonPart, customStageName);
      const computedTitle = title.trim() || (subObj ? `${subObj.name} - ${stageText}` : stageText || 'حصة / درس جديد');

      onAddActivity({
        title: computedTitle,
        dayOfWeek: quickAddModal.dayIdx,
        partIndex: quickAddModal.partIdx,
        startTime: startTime || (quickAddModal.partIdx === 0 ? '08:00' : quickAddModal.partIdx === 1 ? '13:00' : '18:00'),
        endTime: endTime || (quickAddModal.partIdx === 0 ? '10:00' : quickAddModal.partIdx === 1 ? '15:00' : '20:00'),
        priority,
        category: 'Study',
        subjectId,
        reminder,
        todayGoal: todayGoal.trim() || undefined,
        lessonPart,
        customStageName: lessonPart === 'custom' ? customStageName.trim() : undefined,
        studyMode,
        onlineTimerTool: studyMode === 'online' ? onlineTimerTool : undefined,
      });
    } else {
      const defaultTitleMap: Record<string, string> = {
        'Online Course': '💻 كورس أونلاين',
        'Gym & Health': '🏋️ رياضة وجيم',
        'Self Development': '📚 قراءة وتطوير ذاتي',
        'Family/Personal': '👨‍👩‍👧 نشاط شخصي/عائلي',
        'Free Time': '🎨 وقت حر وهواية',
      };
      const computedTitle = title.trim() || defaultTitleMap[otherActivityCategory] || 'نشاط جديد';

      onAddActivity({
        title: computedTitle,
        dayOfWeek: quickAddModal.dayIdx,
        partIndex: quickAddModal.partIdx,
        startTime: startTime || (quickAddModal.partIdx === 0 ? '08:00' : quickAddModal.partIdx === 1 ? '13:00' : '18:00'),
        endTime: endTime || (quickAddModal.partIdx === 0 ? '10:00' : quickAddModal.partIdx === 1 ? '15:00' : '20:00'),
        priority,
        category: otherActivityCategory,
        subjectId: undefined,
        reminder,
        todayGoal: todayGoal.trim() || undefined,
        studyMode: 'online',
        onlineTimerTool: 'stopwatch',
      });
    }

    setQuickAddModal(null);
    setTitle('');
    setTodayGoal('');
    setCustomStageName('');
  };

  const handleSaveInPersonTime = () => {
    if (!logInPersonAct) return;
    onUpdateActivity({
      ...logInPersonAct,
      actualInPersonMinutes: Number(actualMinutesInput),
      completed: true
    });
    setLogInPersonAct(null);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !editingActivity.title.trim()) return;
    onUpdateActivity(editingActivity);
    setEditingActivity(null);
  };

  const handleMovePartIndex = (act: PlannerActivity, newPartIdx: number) => {
    onUpdateActivity({
      ...act,
      partIndex: newPartIdx
    });
  };

  const handleResetAcademicYear = async () => {
    setIsResettingYear(true);
    try {
      const response = await fetch('/api/user/reset-academic-year', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await response.json();
      if (response.ok && data.data) {
        if (onSyncFullData) {
          onSyncFullData(data.data);
        }
        alert('تم إعادة ضبط العام الأكاديمي وتصفير العدادات بنجاح! 🚀');
        setShowConfirmResetYear(false);
      } else {
        alert('حدث خطأ أثناء إعادة الضبط: ' + (data.error || 'خطأ غير معروف'));
      }
    } catch (err) {
      console.error(err);
      alert('فشل الاتصال بالخادم لإعادة ضبط العام الأكاديمي.');
    } finally {
      setIsResettingYear(false);
    }
  };

  // Helper to resolve part index for an activity
  const getActPartIndex = (act: PlannerActivity): number => {
    if (act.partIndex !== undefined && act.partIndex >= 0 && act.partIndex <= 2) {
      return act.partIndex;
    }
    const hour = parseInt(act.startTime.split(':')[0] || '9', 10);
    if (hour < 12) return 0;
    if (hour < 17) return 1;
    return 2;
  };

  // Group and sort activities by day
  const activitiesByDay = useMemo(() => {
    const days: { [dayIdx: number]: PlannerActivity[] } = {};
    for (let i = 0; i < 7; i++) {
      days[i] = [];
    }
    
    activities.forEach(act => {
      if (days[act.dayOfWeek] !== undefined) {
        days[act.dayOfWeek].push(act);
      }
    });

    // Sort days chronologically by startTime
    Object.keys(days).forEach((dayKey) => {
      const idx = Number(dayKey);
      days[idx].sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
    });

    return days;
  }, [activities]);

  const activeCategoryConfig = (cat: PlannerActivity['category']) => {
    return CATEGORIES.find(c => c.id === cat) || CATEGORIES[0];
  };

  const formatTimeToShow = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'م' : 'ص';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m || 0).padStart(2, '0')} ${period}`;
  };

  const partConfigs = [
    { idx: 0, key: 'part1', title: partNames.part1, icon: Sun, color: 'from-amber-500/10 to-orange-500/5 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400' },
    { idx: 1, key: 'part2', title: partNames.part2, icon: Clock, color: 'from-blue-500/10 to-indigo-500/5 border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-400' },
    { idx: 2, key: 'part3', title: partNames.part3, icon: Moon, color: 'from-indigo-500/10 to-purple-500/5 border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400' }
  ];

  return (
    <div className="space-y-6 text-right" style={{ direction: 'rtl' }}>
      
      {/* Top Banner Header */}
      <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Calendar className="w-5.5 h-5.5 text-indigo-600 dark:text-indigo-400" />
                <span>المنظم الأسبوعي والجدول المقسم</span>
              </h2>
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40">
                📅 الأسبوع الأكاديمي {currentAcademicWeek}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              يمكنك تنظيم جدول أسبوعك كاملاً عبر تقسيم اليوم لـ 3 أجزاء، أو تحديد أوقات دقيقة بالساعات، أو دمج النظامين معاً (نظام هايبرد).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEditPart1(partNames.part1);
                setEditPart2(partNames.part2);
                setEditPart3(partNames.part3);
                setIsEditingPartNames(true);
              }}
              className="px-3.5 py-2 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 dark:text-indigo-300 rounded-xl border border-indigo-200/50 dark:border-indigo-900/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>تسمية الأجزاء الثلاثة ✏️</span>
            </button>

            {!showConfirmClear ? (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="py-2 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-100 dark:border-red-900/30 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                title="مسح كل جدول الأسبوع"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح الجدول</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onOptimizeSchedule) {
                      onOptimizeSchedule([]);
                    } else {
                      activities.forEach(a => onDeleteActivity(a.id));
                    }
                    setShowConfirmClear(false);
                  }}
                  className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 shadow-md cursor-pointer animate-pulse"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>تأكيد المسح ⚠️</span>
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="py-2 px-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mode Selector Options */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span>طريقة عرض وتنظيم جدول الأسبوع:</span>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'hybrid', label: 'جدول هايبرد (3 أجزاء + أوقات محددة) ⚡' },
              { id: 'parts_only', label: 'تقسيم 3 أجزاء فقط (بدون أوقات دقيقة) 🧩' },
              { id: 'exact_time', label: 'توقيت زمني بالساعات (من - إلى) ⏱️' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setPlannerMode(m.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  plannerMode === m.id
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-750'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Right Column: Activity Adder Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-indigo-500" />
              <span>إضافة حصة / درس / مادة للجدول الأسبوعي</span>
            </h3>

            <form onSubmit={handleAdd} className="space-y-4">
              {/* Top 2-Option Addition Type Selector */}
              <div className="p-1 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setAdditionType('subject')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    additionType === 'subject'
                      ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200 dark:border-zinc-700'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>📚</span>
                  <span>مادة دراسية أساسية</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdditionType('other')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    additionType === 'other'
                      ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm border border-zinc-200 dark:border-zinc-700'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>✨</span>
                  <span>نشاط / كورس آخر</span>
                </button>
              </div>

              {additionType === 'subject' ? (
                <>
                  {/* Primary Subject Selection */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      📚 اختر المادة الأساسية:
                    </label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none font-bold text-zinc-900 dark:text-zinc-100"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Material Stage Choice ("الستيج") */}
                  <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      🎯 اختر الستيج / مرحلة الدرس:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'lesson', label: '📖 الشرح والمحاضرة' },
                        { id: 'classwork', label: '📝 كلاس ورك / شيت الفصل' },
                        { id: 'homework', label: '✍️ الهوم ورك والواجب' },
                        { id: 'revision', label: '🔄 المراجعة والتثبيت' },
                        { id: 'custom', label: '➕ مرحلة إضافية...' }
                      ].map((stg) => (
                        <button
                          key={stg.id}
                          type="button"
                          onClick={() => setLessonPart(stg.id as any)}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                            lessonPart === stg.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {stg.label}
                        </button>
                      ))}
                    </div>

                    {lessonPart === 'custom' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="اكتب المرحلة الإضافية (مثال: حل امتحانات، مراجعة مركزة...)"
                          value={customStageName}
                          onChange={(e) => setCustomStageName(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    )}
                  </div>

                  {/* Title / Optional Details */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      تفاصيل إضافية / اسم الدرس (اختياري):
                    </label>
                    <input
                      type="text"
                      placeholder={`تلقائي: ${subjectMap[subjectId]?.name || 'المادة'} - ${getStageText(lessonPart, customStageName)}`}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Other Activity Form Window */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      🏷️ نوع النشاط / الكورس الإضافي:
                    </label>
                    <select
                      value={otherActivityCategory}
                      onChange={(e) => setOtherActivityCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none font-bold text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="Online Course">💻 كورس أونلاين خارجي</option>
                      <option value="Gym & Health">🏋️ رياضة وجيم / صحة</option>
                      <option value="Self Development">📚 قراءة وتطوير ذاتي</option>
                      <option value="Family/Personal">👨‍👩‍👧 نشاط عائلي / شخصي</option>
                      <option value="Free Time">🎨 وقت حر / هواية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      📝 اسم النشاط / الكورس:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: كورس برمجة Python، تمارين الجيم، قراءة كتاب..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-100 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      🎯 الهدف المستهدف لهذا النشاط (اختياري):
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: إكمال الفصل الأول، أداء تمارين الظهر..."
                      value={todayGoal}
                      onChange={(e) => setTodayGoal(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">اليوم:</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-100"
                  >
                    {DAYS_ARABIC.map((day, idx) => (
                      <option key={idx} value={idx}>{day.split(' (')[0]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">الجزء اليومي المخصص:</label>
                  <select
                    value={partIndex}
                    onChange={(e) => setPartIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-100"
                  >
                    <option value={0}>1️⃣ {partNames.part1}</option>
                    <option value={1}>2️⃣ {partNames.part2}</option>
                    <option value={2}>3️⃣ {partNames.part3}</option>
                  </select>
                </div>
              </div>

              {/* Attendance Mode Choice: In-Person Center vs Online */}
              <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">مكان ونوع الحضور:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStudyMode('center')}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      studyMode === 'center'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>🏫</span>
                    <span>حضور مباشر (سنتر)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudyMode('online')}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      studyMode === 'online'
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>💻</span>
                    <span>حصة أونلاين</span>
                  </button>
                </div>

                {studyMode === 'center' ? (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <span>📍</span>
                      <span>حضور مباشر بالسنتر / المدرسة</span>
                    </p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400">
                      غير متاحة للانضمام أونلاين. يمكنك تسجيل مدة حضورك الفعلية بالساعات أو الدقائق فور الانتهاء.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-800 dark:text-blue-300 space-y-2">
                    <label className="block font-bold">اختيار أداة ومؤقت المذاكرة (اختياري):</label>
                    <select
                      value={onlineTimerTool}
                      onChange={(e) => setOnlineTimerTool(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs border border-blue-200 dark:border-blue-800 bg-white dark:bg-zinc-900 rounded-lg focus:outline-none"
                    >
                      <option value="pomodoro">⏱️ تايمر بومودورو / تركيز</option>
                      <option value="stopwatch">⏳ ساعة إيقاف متصاعدة</option>
                      <option value="none">🔇 بدون مؤقت</option>
                    </select>
                  </div>
                )}
              </div>

              {plannerMode !== 'parts_only' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">وقت البدء (اختياري):</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">وقت الانتهاء (اختياري):</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-zinc-500 mb-1">الهدف أو الملاحظات:</label>
                <textarea
                  placeholder="مثال: حل شيت الدرس مع مراجعة القوانين..."
                  rows={2}
                  value={todayGoal}
                  onChange={(e) => setTodayGoal(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-100 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة إلى الجدول</span>
              </button>
            </form>
          </div>
        </div>

        {/* Left Column: Visual Weekly Grid */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Day selection tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            <button
              onClick={() => setSelectedDayFilter(-1)}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedDayFilter === -1 
                  ? 'bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 shadow-sm' 
                  : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              كل الأيام ({activities.length})
            </button>
            {DAYS_ARABIC.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDayFilter(idx)}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedDayFilter === idx 
                    ? 'bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 shadow-sm' 
                    : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {day.split(' (')[0]} ({activitiesByDay[idx]?.length || 0})
              </button>
            ))}
          </div>

          {/* Activities list grouped by day */}
          <div className="space-y-4">
            {DAYS_ARABIC.map((dayName, dayIdx) => {
              if (selectedDayFilter !== -1 && selectedDayFilter !== dayIdx) return null;

              const dayActs = activitiesByDay[dayIdx] || [];

              // Helper for 3 parts grouping
              const part0Acts = dayActs.filter(act => getActPartIndex(act) === 0);
              const part1Acts = dayActs.filter(act => getActPartIndex(act) === 1);
              const part2Acts = dayActs.filter(act => getActPartIndex(act) === 2);

              const renderActivityCard = (act: PlannerActivity) => {
                const catConfig = activeCategoryConfig(act.category);
                const sub = act.subjectId ? subjectMap[act.subjectId] : null;
                const isDone = act.completed;

                return (
                  <div 
                    key={act.id}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 group relative transition-all duration-200 hover:shadow-xs ${
                      isDone 
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100' 
                        : catConfig.color
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      {sub ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }}></span>
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{sub.name.split(' (')[0]}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-500">{catConfig.name}</span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingActivity(act)}
                          className="p-1 text-zinc-400 hover:text-indigo-600 rounded-lg cursor-pointer"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteActivity(act.id)}
                          className="p-1 text-zinc-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <strong className="text-xs font-bold block text-zinc-900 dark:text-zinc-50 leading-snug">
                        {act.title}
                      </strong>

                      {/* Material Stage & Mode Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {act.lessonPart && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                            {act.lessonPart === 'lesson' && '📖 شرح ومحاضرة'}
                            {(act.lessonPart === 'classwork' || act.lessonPart === 'class_sheet') && '📝 كلاس ورك / شيت الفصل'}
                            {act.lessonPart === 'homework' && '✍️ الهوم ورك والواجب'}
                            {act.lessonPart === 'revision' && '🔄 المراجعة والتثبيت'}
                            {act.lessonPart === 'custom' && `➕ ${act.customStageName || 'مرحلة إضافية'}`}
                          </span>
                        )}

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          act.studyMode === 'online'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                        }`}>
                          {act.studyMode === 'online' ? '💻 أونلاين' : '🏫 حضور مباشر (سنتر)'}
                        </span>
                      </div>

                      {act.todayGoal && (
                        <p className="text-[10px] text-zinc-600 dark:text-zinc-300 mt-1 bg-white/60 dark:bg-zinc-950/30 p-1.5 rounded-lg">
                          🎯 {act.todayGoal}
                        </p>
                      )}

                      {/* Attendance / Timer details */}
                      <div className="mt-2 space-y-1">
                        {act.studyMode === 'online' ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-zinc-500 font-semibold">
                              {act.onlineTimerTool === 'pomodoro' ? '⏱️ مؤقت بومودورو' : act.onlineTimerTool === 'stopwatch' ? '⏳ ساعة إيقاف' : 'بدون مؤقت'}
                            </span>
                            {onStartFocusSession && !act.completed && (
                              <button
                                type="button"
                                onClick={() => onStartFocusSession(act)}
                                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                <span>▶️</span>
                                <span>بدء المؤقت</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 bg-amber-50/80 dark:bg-amber-950/30 p-1.5 rounded-lg border border-amber-200/50">
                            <span className="text-[10px] text-amber-900 dark:text-amber-200 font-semibold">
                              {act.actualInPersonMinutes 
                                ? `⏱️ تم الحضور: ${act.actualInPersonMinutes} دقيقة (${Math.round(act.actualInPersonMinutes / 60 * 10) / 10} ساعة)` 
                                : '📍 حصة حضور بالسنتر'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setLogInPersonAct(act);
                                setActualMinutesInput(act.actualInPersonMinutes || 120);
                              }}
                              className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-bold rounded-md cursor-pointer transition-colors"
                            >
                              {act.actualInPersonMinutes ? 'تعديل المدة ✏️' : 'تسجيل الوقت الفعلي ⏱️'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1.5 border-t border-zinc-200/40 dark:border-zinc-800/40">
                      {plannerMode !== 'parts_only' && act.startTime && (
                        <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 font-bold font-mono">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{formatTimeToShow(act.startTime)} - {formatTimeToShow(act.endTime)}</span>
                        </div>
                      )}

                      {/* Part Move controls */}
                      <div className="flex items-center gap-1 bg-white/80 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200/50">
                        {[0, 1, 2].map(pIdx => (
                          <button
                            key={pIdx}
                            onClick={() => handleMovePartIndex(act, pIdx)}
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer ${
                              getActPartIndex(act) === pIdx
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                : 'text-zinc-400 hover:text-zinc-700'
                            }`}
                            title={`نقل للجزء ${pIdx + 1}`}
                          >
                            جـ{pIdx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              };

              return (
                <div key={dayIdx} className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></span>
                      {dayName}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      إجمالي: {dayActs.length} أنشطة
                    </span>
                  </div>

                  {dayActs.length === 0 ? (
                    <div className="text-center py-6 text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      لا توجد أنشطة مجدولة لهذا اليوم. أضف حصصك وموادك من اليسار! ✍️
                    </div>
                  ) : plannerMode === 'exact_time' ? (
                    <div className="space-y-2">
                      {dayActs.map(act => renderActivityCard(act))}
                    </div>
                  ) : (
                    /* 3 Parts Lanes Grid */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {[
                        { pIdx: 0, title: partNames.part1, acts: part0Acts, icon: Sun, color: 'text-amber-500' },
                        { pIdx: 1, title: partNames.part2, acts: part1Acts, icon: Clock, color: 'text-blue-500' },
                        { pIdx: 2, title: partNames.part3, acts: part2Acts, icon: Moon, color: 'text-indigo-500' }
                      ].map(lane => {
                        const IconComponent = lane.icon;
                        return (
                          <div key={lane.pIdx} className="bg-zinc-50/60 dark:bg-zinc-950/20 p-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 flex flex-col justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between border-b border-zinc-200/40 dark:border-zinc-800/40 pb-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditPart1(partNames.part1);
                                    setEditPart2(partNames.part2);
                                    setEditPart3(partNames.part3);
                                    setIsEditingPartNames(true);
                                  }}
                                  className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer text-right group transition-colors"
                                  title="تغيير مسمى هذا الجزء ✏️"
                                >
                                  <IconComponent className={`w-3.5 h-3.5 ${lane.color}`} />
                                  <span>{lane.title}</span>
                                  <Edit2 className="w-3 h-3 text-zinc-400 group-hover:text-indigo-600" />
                                </button>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
                                  {lane.acts.length}
                                </span>
                              </div>

                              {lane.acts.length === 0 ? (
                                <div className="text-[9px] text-zinc-400 text-center py-4 italic">
                                  لا توجد مواد مضافة
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {lane.acts.map(act => renderActivityCard(act))}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setQuickAddModal({ dayIdx, partIdx: lane.pIdx });
                                setStartTime(lane.pIdx === 0 ? '08:00' : lane.pIdx === 1 ? '13:00' : '18:00');
                                setEndTime(lane.pIdx === 0 ? '10:00' : lane.pIdx === 1 ? '15:00' : '20:00');
                              }}
                              className="w-full py-1.5 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-[10px] font-bold text-zinc-600 dark:text-zinc-300 flex items-center justify-center gap-1 cursor-pointer transition-colors mt-1"
                            >
                              <Plus className="w-3 h-3 text-indigo-500" />
                              <span>إضافة لهذا الجزء</span>
                            </button>
                          </div>
                        );
                      })}

                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Modal 1: Edit Custom 3 Part Names */}
      {isEditingPartNames && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ direction: 'rtl' }}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-5 text-right shadow-2xl">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                <span>تعديل مسميات أجزاء اليوم الثلاثة ✏️</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                اكتب المسمى المناسب لك لكل جزء لتنظيم اليوم والأسبوع بنفس الطريقة.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">مسمى الجزء الأول (الفترة الأولى):</label>
                <input
                  type="text"
                  value={editPart1}
                  onChange={(e) => setEditPart1(e.target.value)}
                  placeholder="مثال: الصباح، الفجر، من 8 لـ 12"
                  className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">مسمى الجزء الثاني (الفترة الثانية):</label>
                <input
                  type="text"
                  value={editPart2}
                  onChange={(e) => setEditPart2(e.target.value)}
                  placeholder="مثال: الظهر، من 1 لـ 5"
                  className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">مسمى الجزء الثالث (الفترة الثالثة):</label>
                <input
                  type="text"
                  value={editPart3}
                  onChange={(e) => setEditPart3(e.target.value)}
                  placeholder="مثال: المساء، الليل، من 6 لـ 10"
                  className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsEditingPartNames(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSavePartNames}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                حفظ المسميات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Quick Add for specific day + part */}
      {quickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ direction: 'rtl' }}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 text-right shadow-2xl">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-500" />
                <span>إضافة مهمة إلى {DAYS_ARABIC[quickAddModal.dayIdx].split(' (')[0]} - "{quickAddModal.partIdx === 0 ? partNames.part1 : quickAddModal.partIdx === 1 ? partNames.part2 : partNames.part3}"</span>
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">اسم النشاط أو المادة:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مذاكرة كيمياء الباب الثاني"
                  className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">المادة المرتبطة:</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl focus:outline-none"
                >
                  <option value="">-- بدون مادة --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">وقت البدء:</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">وقت الانتهاء:</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">الهدف اليومي لهذه المهمة:</label>
                <input
                  type="text"
                  value={todayGoal}
                  onChange={(e) => setTodayGoal(e.target.value)}
                  placeholder="مثال: حل شيت الدرس مع المراجعة"
                  className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setQuickAddModal(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleQuickAddSubmit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                إضافة المهمة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Edit Modal */}
      {editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" style={{ direction: 'rtl' }}>
          <div className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl space-y-4 text-right">
            
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-500" />
                <span>تعديل تفاصيل المهمة</span>
              </h3>
              <button 
                onClick={() => setEditingActivity(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">اسم النشاط / المهمة:</label>
                <input
                  type="text"
                  required
                  value={editingActivity.title}
                  onChange={(e) => setEditingActivity({ ...editingActivity, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">اليوم:</label>
                  <select
                    value={editingActivity.dayOfWeek}
                    onChange={(e) => setEditingActivity({ ...editingActivity, dayOfWeek: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none"
                  >
                    {DAYS_ARABIC.map((day, idx) => (
                      <option key={idx} value={idx}>{day.split(' (')[0]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">الجزء اليومي:</label>
                  <select
                    value={editingActivity.partIndex !== undefined ? editingActivity.partIndex : 0}
                    onChange={(e) => setEditingActivity({ ...editingActivity, partIndex: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none"
                  >
                    <option value={0}>1️⃣ {partNames.part1}</option>
                    <option value={1}>2️⃣ {partNames.part2}</option>
                    <option value={2}>3️⃣ {partNames.part3}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">وقت البدء:</label>
                  <input
                    type="time"
                    value={editingActivity.startTime}
                    onChange={(e) => setEditingActivity({ ...editingActivity, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">وقت الانتهاء:</label>
                  <input
                    type="time"
                    value={editingActivity.endTime}
                    onChange={(e) => setEditingActivity({ ...editingActivity, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">مرحلة المادة ومكان الحضور:</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editingActivity.lessonPart || 'lesson'}
                    onChange={(e) => setEditingActivity({ ...editingActivity, lessonPart: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none"
                  >
                    <option value="lesson">📖 شرح ومحاضرة</option>
                    <option value="class_sheet">📝 تطبيق وشيت الفصل</option>
                    <option value="homework">✍️ واجب وتطبيقات</option>
                    <option value="custom">➕ مرحلة إضافية...</option>
                  </select>

                  <select
                    value={editingActivity.studyMode || 'center'}
                    onChange={(e) => setEditingActivity({ ...editingActivity, studyMode: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none"
                  >
                    <option value="center">🏫 حضور مباشر (سنتر)</option>
                    <option value="online">💻 حصة أونلاين</option>
                  </select>
                </div>

                {editingActivity.lessonPart === 'custom' && (
                  <input
                    type="text"
                    placeholder="اسم المرحلة الإضافية"
                    value={editingActivity.customStageName || ''}
                    onChange={(e) => setEditingActivity({ ...editingActivity, customStageName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">الهدف أو الملاحظات:</label>
                <textarea
                  rows={2}
                  value={editingActivity.todayGoal || ''}
                  onChange={(e) => setEditingActivity({ ...editingActivity, todayGoal: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingActivity(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl"
                >
                  إلغاء
                </button>
                {onStartFocusSession && (
                  <button
                    type="button"
                    onClick={() => {
                      const act = editingActivity;
                      setEditingActivity(null);
                      onStartFocusSession(act);
                    }}
                    className="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 rounded-xl flex items-center gap-1"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>جلسة تركيز 🧠</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* In-Person Actual Duration Logging Modal */}
      {logInPersonAct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" style={{ direction: 'rtl' }}>
          <div className="w-full max-w-sm p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl space-y-4 text-right">
            
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <span>🏫</span>
                <span>تسجيل مدة الحضور الفعلية بالسنتر</span>
              </h3>
              <button 
                onClick={() => setLogInPersonAct(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                حصة: <strong className="text-zinc-900 dark:text-zinc-100">{logInPersonAct.title}</strong>
              </p>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
                الرجاء إدخال الوقت الفعلي الذي قضيتَه في الحصة/السنتر بالدقائق بعد الانتهاء:
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">المدة الفعلية بالدقائق:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={actualMinutesInput}
                    onChange={(e) => setActualMinutesInput(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none font-bold text-center"
                  />
                  <span className="text-xs text-zinc-500 font-bold whitespace-nowrap">دقيقة ({Math.round((actualMinutesInput || 0) / 60 * 10) / 10} ساعة)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setLogInPersonAct(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveInPersonTime}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>حفظ واعتبارها مكتملة 🎯</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
