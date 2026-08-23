import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Check, 
  Clock, 
  Edit2,
  Edit3, 
  Save, 
  Award, 
  CheckCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ListTodo, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Sun, 
  Moon, 
  Sparkles, 
  Layers, 
  Tag 
} from 'lucide-react';
import { PlannerActivity, Subject, User, GradeRecord, Gamification, LifestyleProfile } from '../types';

interface TodayTrackerProps {
  user: User;
  activities: PlannerActivity[];
  subjects: Subject[];
  onToggleActivityCompletion: (id: string, updates?: Partial<PlannerActivity>) => void;
  onUpdateProfile: (profile: any) => void;
  onAddGrade?: (grade: Omit<GradeRecord, 'id'>) => void;
  notifSettings?: any;
  onUpdateNotifSettings?: (settings: any) => void;
  gamification?: Gamification;
  lifestyleProfile?: LifestyleProfile;
  onStartFocusSession?: (activity: PlannerActivity) => void;
  onMissActivity?: (activityId: string, reason: string) => Promise<void>;
  onAddActivity?: (activity: Omit<PlannerActivity, 'id'>) => void;
  onDeleteActivity?: (id: string) => void;
  onUpdateActivity?: (activity: PlannerActivity) => void;
  onRenameLesson?: (subjectId: string, oldName: string, newName: string, activityId?: string) => void;
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

const CATEGORIES_INFO: { [key: string]: { name: string; color: string } } = {
  Study: { name: 'مذاكرة مادة أساسية', color: 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900' },
  Lesson: { name: 'درس / حصة', color: 'border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20' },
  Homework: { name: 'حل واجبات ومسائل', color: 'border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20' },
  Assignment: { name: 'تطبيق عملي أو بحث', color: 'border-teal-200 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/20' },
  Exam: { name: 'امتحان تجريبي شامل', color: 'border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20' },
  'Health/Gym': { name: 'رياضة وجيم وصحة بدنية', color: 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20' },
  'Family/Personal': { name: 'وقت عائلي ومواعيد', color: 'border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20' },
  'Free Time': { name: 'ترفيه وراحة نشطة', color: 'border-orange-200 dark:border-orange-900/40 bg-orange-50/40 dark:bg-orange-950/20' }
};

export default function TodayTracker({ 
  user, 
  activities = [], 
  subjects = [], 
  onToggleActivityCompletion, 
  onUpdateProfile,
  onAddGrade,
  notifSettings,
  onUpdateNotifSettings,
  gamification,
  lifestyleProfile,
  onStartFocusSession,
  onMissActivity,
  onAddActivity,
  onDeleteActivity,
  onUpdateActivity,
  onRenameLesson
}: TodayTrackerProps) {
  
  const [currentDay, setCurrentDay] = useState<number>(new Date().getDay());
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [activityTitle, setActivityTitle] = useState<string>('');
  
  // Custom 3 Part Names state (User custom naming for the 3 daily slots)
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

  // Quick Task Creation modal for a specific part
  const [addingPartIndex, setAddingPartIndex] = useState<number | null>(null);
  const [newTaskAdditionType, setNewTaskAdditionType] = useState<'subject' | 'other'>('subject');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubjectId, setNewTaskSubjectId] = useState(subjects[0]?.id || '');
  const [newTaskCategory, setNewTaskCategory] = useState<PlannerActivity['category']>('Study');
  const [newTaskOtherCategory, setNewTaskOtherCategory] = useState<PlannerActivity['category']>('Lesson');
  const [newTaskStartTime, setNewTaskStartTime] = useState('09:00');
  const [newTaskEndTime, setNewTaskEndTime] = useState('10:30');
  const [newTaskGoal, setNewTaskGoal] = useState('');

  // Material Stage & Attendance mode for Quick Task
  const [newTaskLessonPart, setNewTaskLessonPart] = useState<'lesson' | 'class_sheet' | 'homework' | 'custom'>('lesson');
  const [newTaskCustomStageName, setNewTaskCustomStageName] = useState('');
  const [newTaskStudyMode, setNewTaskStudyMode] = useState<'center' | 'online'>('center');
  const [newTaskOnlineTimerTool, setNewTaskOnlineTimerTool] = useState<'pomodoro' | 'stopwatch' | 'none'>('pomodoro');

  // In-Person actual duration modal
  const [logInPersonAct, setLogInPersonAct] = useState<PlannerActivity | null>(null);
  const [actualMinutesInput, setActualMinutesInput] = useState<number>(120);

  // Local state for editing information on selected activity
  const [activityNotes, setActivityNotes] = useState('');
  const [examScore, setExamScore] = useState<number | ''>('');
  const [examTotal, setExamTotal] = useState<number | ''>('');
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Missed session states
  const [missedAct, setMissedAct] = useState<PlannerActivity | null>(null);
  const [selectedMissedReason, setSelectedMissedReason] = useState<string>('Didn\'t have time');

  // Egypt local date formatting
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('ar-EG', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);

  // Filter activities for today (Excluding weekly review tasks as requested)
  const todaysActivities = useMemo(() => {
    return activities
      .filter(act => act.dayOfWeek === currentDay)
      .filter(act => act.category !== 'Revision' && !act.title?.includes('مراجعة أسبوعية') && !act.title?.includes('مراجعة أسبوع'))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [activities, currentDay]);

  const subjectMap = useMemo(() => {
    const map: { [id: string]: Subject } = {};
    subjects.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [subjects]);

  // Helper to determine which part index (0, 1, or 2) an activity belongs to
  const getPartIndex = (act: PlannerActivity): number => {
    if (act.partIndex !== undefined && act.partIndex >= 0 && act.partIndex <= 2) {
      return act.partIndex;
    }
    const hour = parseInt(act.startTime.split(':')[0] || '9', 10);
    if (hour < 12) return 0;
    if (hour < 17) return 1;
    return 2;
  };

  // Group activities into the 3 custom parts
  const activitiesByPart = useMemo(() => {
    const groups: [PlannerActivity[], PlannerActivity[], PlannerActivity[]] = [[], [], []];
    todaysActivities.forEach(act => {
      const pIdx = getPartIndex(act);
      groups[pIdx].push(act);
    });
    return groups;
  }, [todaysActivities]);

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

  const handleCreateTaskForPart = (partIdx: number) => {
    const startT = newTaskStartTime || (partIdx === 0 ? '08:00' : partIdx === 1 ? '13:00' : '18:00');
    const endT = newTaskEndTime || (partIdx === 0 ? '10:00' : partIdx === 1 ? '15:00' : '20:00');

    if (onAddActivity) {
      if (newTaskAdditionType === 'subject') {
        const sub = subjects.find(s => s.id === newTaskSubjectId);
        const stageText = getStageText(newTaskLessonPart, newTaskCustomStageName);
        const titleToUse = newTaskTitle.trim() || (sub ? `${sub.name} - ${stageText}` : stageText || 'مهمة / حصة جديدة');

        onAddActivity({
          title: titleToUse,
          dayOfWeek: currentDay,
          startTime: startT,
          endTime: endT,
          priority: 'medium',
          category: 'Study',
          subjectId: newTaskSubjectId || undefined,
          todayGoal: newTaskGoal.trim() || undefined,
          partIndex: partIdx,
          lessonPart: newTaskLessonPart,
          customStageName: newTaskLessonPart === 'custom' ? newTaskCustomStageName.trim() : undefined,
          studyMode: newTaskStudyMode,
          onlineTimerTool: newTaskStudyMode === 'online' ? newTaskOnlineTimerTool : undefined,
        });
      } else {
        const defaultTitleMap: Record<string, string> = {
          'Online Course': '💻 كورس أونلاين',
          'Gym & Health': '🏋️ رياضة وجيم',
          'Self Development': '📚 قراءة وتطوير ذاتي',
          'Family/Personal': '👨‍👩‍👧 نشاط شخصي/عائلي',
          'Free Time': '🎨 وقت حر وهواية',
        };
        const titleToUse = newTaskTitle.trim() || defaultTitleMap[newTaskOtherCategory] || 'نشاط جديد';

        onAddActivity({
          title: titleToUse,
          dayOfWeek: currentDay,
          startTime: startT,
          endTime: endT,
          priority: 'medium',
          category: newTaskOtherCategory,
          subjectId: undefined,
          todayGoal: newTaskGoal.trim() || undefined,
          partIndex: partIdx,
          studyMode: 'online',
          onlineTimerTool: 'stopwatch',
        });
      }
    }

    setAddingPartIndex(null);
    setNewTaskTitle('');
    setNewTaskGoal('');
    setNewTaskCustomStageName('');
  };

  const handleSaveInPersonTime = () => {
    if (!logInPersonAct) return;
    onToggleActivityCompletion(logInPersonAct.id, {
      actualInPersonMinutes: Number(actualMinutesInput),
      completed: true
    });
    setLogInPersonAct(null);
  };

  const handleMoveActivityPart = (act: PlannerActivity, newPartIdx: number) => {
    if (onUpdateActivity) {
      onUpdateActivity({
        ...act,
        partIndex: newPartIdx
      });
    } else {
      onToggleActivityCompletion(act.id, { partIndex: newPartIdx });
    }
  };

  const handleSelectActivity = (act: PlannerActivity) => {
    if (selectedActivityId === act.id) {
      setSelectedActivityId(null);
    } else {
      setSelectedActivityId(act.id);
      setActivityTitle(act.lessonName || act.title || '');
      setActivityNotes(act.notes || '');
      setExamScore(act.gradeScore !== undefined ? act.gradeScore : '');
      setExamTotal(act.gradeTotal !== undefined ? act.gradeTotal : (act.category === 'Exam' ? 60 : 100));
    }
  };

  const handleSaveActivityDetails = (act: PlannerActivity) => {
    const oldTitle = act.lessonName || act.title;
    const newTitle = activityTitle.trim() || act.title;
    const updates: Partial<PlannerActivity> = {
      title: newTitle,
      lessonName: newTitle,
      notes: activityNotes,
    };

    if (examScore !== '') {
      updates.gradeScore = Number(examScore);
      updates.gradeTotal = Number(examTotal || 100);

      if (onAddGrade && act.subjectId) {
        onAddGrade({
          subjectId: act.subjectId,
          category: act.category === 'Exam' ? 'Exam' : 'Quiz',
          title: `تقييم ${newTitle}`,
          score: Number(examScore),
          totalScore: Number(examTotal || 100),
          date: new Date().toISOString().split('T')[0]
        });
      }
    }

    onToggleActivityCompletion(act.id, updates);
    if (onUpdateActivity) {
      onUpdateActivity({ ...act, ...updates });
    }

    if (oldTitle && newTitle && oldTitle !== newTitle && act.subjectId && onRenameLesson) {
      onRenameLesson(act.subjectId, oldTitle, newTitle, act.id);
    }

    setSaveStatus('success_act');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const partConfigs = [
    { idx: 0, key: 'part1', defaultTitle: partNames.part1, icon: Sun, color: 'from-amber-500/10 to-orange-500/5 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400' },
    { idx: 1, key: 'part2', defaultTitle: partNames.part2, icon: Clock, color: 'from-blue-500/10 to-indigo-500/5 border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-400' },
    { idx: 2, key: 'part3', defaultTitle: partNames.part3, icon: Moon, color: 'from-indigo-500/10 to-purple-500/5 border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400' }
  ];

  return (
    <div className="space-y-6 text-right" style={{ direction: 'rtl' }}>
      
      {/* Header Bar */}
      <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block">منظم اليوم المقسم ثلاثياً</span>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Calendar className="w-5.5 h-5.5 text-indigo-600 dark:text-indigo-400" />
            <span>جدول اليوم: {todayFormatted}</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            تم تقسيم يومك الدراسي إلى 3 أجزاء متوازنة. يمكنك إعادة تسمية كل جزء بالطريقة التي تفضلها (مثلاً: الظهر، من 2 لـ 5، الفجر) وتوزيع المواد والدروس بسهولة.
          </p>
        </div>

        {/* Action Controls & Simulation dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEditPart1(partNames.part1);
              setEditPart2(partNames.part2);
              setEditPart3(partNames.part3);
              setIsEditingPartNames(true);
            }}
            className="px-3.5 py-2 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 dark:text-indigo-300 rounded-xl border border-indigo-200/50 dark:border-indigo-900/40 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تسمية الفترات الثلاث ✏️</span>
          </button>

          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-xs text-zinc-500 whitespace-nowrap">محاكاة يوم:</span>
            <select 
              value={currentDay}
              onChange={(e) => setCurrentDay(Number(e.target.value))}
              className="px-2.5 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-100"
            >
              {DAYS_ARABIC.map((day, idx) => (
                <option key={idx} value={idx}>{day.split(' (')[0]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: 3 Parts + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Three Daily Parts Cards */}
        <div className="lg:col-span-8 space-y-6">
          
          {partConfigs.map(config => {
            const partIdx = config.idx;
            const partTitle = (partNames as any)[config.key] || config.defaultTitle;
            const partActs = activitiesByPart[partIdx] || [];
            const completedCount = partActs.filter(a => a.completed).length;
            const IconComp = config.icon;
            const progressPercent = partActs.length > 0 ? Math.round((completedCount / partActs.length) * 100) : 0;

            return (
              <div 
                key={config.key} 
                className={`p-5 rounded-3xl border bg-gradient-to-br ${config.color} shadow-xs space-y-4`}
              >
                {/* Part Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs">
                      <IconComp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditPart1(partNames.part1);
                            setEditPart2(partNames.part2);
                            setEditPart3(partNames.part3);
                            setIsEditingPartNames(true);
                          }}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer text-right group"
                          title="تغيير مسمى هذا الجزء ✏️"
                        >
                          <span>{partTitle}</span>
                          <Edit3 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600" />
                        </button>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold">
                          {partActs.length} {partActs.length === 1 ? 'مهمة' : 'مهام'}
                        </span>
                      </h3>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        مكتمل: {completedCount} من {partActs.length} ({progressPercent}%)
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setAddingPartIndex(partIdx);
                      setNewTaskStartTime(partIdx === 0 ? '08:00' : partIdx === 1 ? '13:00' : '18:00');
                      setNewTaskEndTime(partIdx === 0 ? '10:00' : partIdx === 1 ? '15:00' : '20:00');
                    }}
                    className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer w-fit"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة مهمة لهذا الجزء</span>
                  </button>
                </div>

                {/* Progress Bar */}
                {partActs.length > 0 && (
                  <div className="w-full h-1.5 bg-zinc-200/70 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}

                {/* List of Tasks in this Part */}
                {partActs.length === 0 ? (
                  <div className="p-4 text-center bg-white/70 dark:bg-zinc-900/60 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-400 font-medium">
                    لا توجد مهام مضافة في "{partTitle}". انقر على زر إضافة مهمة بالأعلى!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {partActs.map(act => {
                      const sub = act.subjectId ? subjectMap[act.subjectId] : null;
                      const catInfo = CATEGORIES_INFO[act.category] || { name: act.category, color: 'bg-white' };
                      const isSelected = selectedActivityId === act.id;

                      return (
                        <div 
                          key={act.id}
                          className={`p-4 rounded-2xl border bg-white dark:bg-zinc-900 transition-all ${
                            act.completed ? 'opacity-70 border-zinc-200 dark:border-zinc-800' : 'border-zinc-200 dark:border-zinc-800 shadow-xs'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              {/* Checkbox */}
                              <button
                                onClick={() => onToggleActivityCompletion(act.id)}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer mt-0.5 ${
                                  act.completed ? 'bg-zinc-900 border-zinc-900 text-white' : 'border-zinc-300 hover:border-zinc-600'
                                }`}
                              >
                                {act.completed && <Check className="w-4 h-4 stroke-[3]" />}
                              </button>

                              <div className="space-y-1 text-right flex-1">
                                <div className="flex items-center gap-2">
                                  {sub ? (
                                    <span className="flex items-center gap-1.5">
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }}></span>
                                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                                        {(() => {
                                          const subPrefix = sub.name.split(' (')[0];
                                          const cleanTitle = act.title.startsWith(subPrefix) ? act.title : `${subPrefix} - ${act.title}`;
                                          return cleanTitle.replace(new RegExp(`^${subPrefix}\\s*-\\s*${subPrefix}\\s*-\\s*`, 'i'), `${subPrefix} - `);
                                        })()}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{act.title}</span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500">
                                  <span className="flex items-center gap-1 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-bold">
                                    <Clock className="w-3 h-3" />
                                    <span>{act.startTime} - {act.endTime}</span>
                                  </span>
                                  <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-semibold">
                                    {catInfo.name}
                                  </span>

                                  {/* Stage Badge */}
                                  {act.lessonPart && (
                                    <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-md border border-indigo-500/20">
                                      {act.lessonPart === 'lesson' && '📖 شرح ومحاضرة'}
                                      {(act.lessonPart === 'classwork' || act.lessonPart === 'class_sheet') && '📝 كلاس ورك / شيت الفصل'}
                                      {act.lessonPart === 'homework' && '✍️ الهوم ورك والواجب'}
                                      {act.lessonPart === 'revision' && '🔄 المراجعة والتثبيت'}
                                      {act.lessonPart === 'custom' && `➕ ${act.customStageName || 'مرحلة إضافية'}`}
                                    </span>
                                  )}

                                  {/* Attendance Mode Badge */}
                                  <span className={`font-bold px-2 py-0.5 rounded-md border ${
                                    act.studyMode === 'online'
                                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                                  }`}>
                                    {act.studyMode === 'online' ? '💻 أونلاين' : '🏫 حضور مباشر (سنتر)'}
                                  </span>
                                </div>

                                {act.studyMode === 'center' && (
                                  <div className="flex items-center gap-2 bg-amber-50/80 dark:bg-amber-950/30 p-1.5 rounded-lg border border-amber-200/50 text-[10px] text-amber-900 dark:text-amber-200">
                                    <span className="font-semibold">
                                      {act.actualInPersonMinutes 
                                        ? `⏱️ تم الحضور بالسنتر: ${act.actualInPersonMinutes} دقيقة` 
                                        : '📍 حصة سنتر مباشرة'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLogInPersonAct(act);
                                        setActualMinutesInput(act.actualInPersonMinutes || 120);
                                      }}
                                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-bold rounded cursor-pointer mr-auto"
                                    >
                                      {act.actualInPersonMinutes ? 'تعديل المدة ✏️' : 'تسجيل مدة الحضور ⏱️'}
                                    </button>
                                  </div>
                                )}

                                {act.todayGoal && (
                                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-850">
                                    🎯 {act.todayGoal}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Move Part & Actions */}
                            <div className="flex flex-wrap items-center gap-2 justify-end">
                              {/* Part Selector */}
                              <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <span className="text-[10px] text-zinc-400 font-semibold px-1">الجزء:</span>
                                {[0, 1, 2].map(pIdx => (
                                  <button
                                    key={pIdx}
                                    onClick={() => handleMoveActivityPart(act, pIdx)}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                      getPartIndex(act) === pIdx
                                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                        : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                                    title={`نقل إلى ${pIdx === 0 ? partNames.part1 : pIdx === 1 ? partNames.part2 : partNames.part3}`}
                                  >
                                    {pIdx + 1}
                                  </button>
                                ))}
                              </div>

                              {/* Focus Session Button (Online / Self-study only, hidden for Center classes) */}
                              {!act.completed && onStartFocusSession && act.studyMode !== 'center' && (
                                <button
                                  onClick={() => onStartFocusSession(act)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <span>▶️</span>
                                  <span>مذاكرة</span>
                                </button>
                              )}

                              {/* Expand Drawer Toggle */}
                              <button
                                onClick={() => handleSelectActivity(act)}
                                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                              >
                                {isSelected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>

                              {/* Delete */}
                              {onDeleteActivity && (
                                <button
                                  onClick={() => onDeleteActivity(act.id)}
                                  className="p-1 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                                  title="حذف المهمة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Notes Drawer */}
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/30 p-3 rounded-xl">
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1 flex items-center gap-1">
                                  <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>تعديل اسم الدرس / النشاط (يتزامن مع المراجعات الذكية):</span>
                                </label>
                                <input
                                  type="text"
                                  value={activityTitle}
                                  onChange={(e) => setActivityTitle(e.target.value)}
                                  placeholder="اسم الدرس أو النشاط..."
                                  className="w-full text-xs p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1 flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>ملاحظات وإثبات الفهم:</span>
                                </label>
                                <textarea
                                  value={activityNotes}
                                  onChange={(e) => setActivityNotes(e.target.value)}
                                  rows={2}
                                  placeholder="اكتب النقاط الرئيسية أو الملاحظات الهامة..."
                                  className="w-full text-xs p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg focus:outline-none"
                                />
                              </div>

                              <div className="flex justify-between items-center">
                                <button
                                  onClick={() => handleSaveActivityDetails(act)}
                                  className="px-3 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-bold rounded-lg"
                                >
                                  <Save className="w-3 h-3 inline ml-1" />
                                  <span>حفظ</span>
                                </button>
                                {saveStatus === 'success_act' && (
                                  <span className="text-[10px] text-emerald-600 font-bold">تم الحفظ ✅</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

        </div>

        {/* Right Section: Gamification & Smart Notifications */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Gamification Hub Panel */}
          {gamification && (
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <span className="text-amber-500">🏆</span>
                <span>لوحة الجوائز والمستويات</span>
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  <span>المستوى {gamification.level}</span>
                  <span>{gamification.xp % 1000} / 1000 XP</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${(gamification.xp % 1000) / 10}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50/40 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-orange-500 font-bold block">سلسلة المذاكرة المتتالية ⚡</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{gamification.streak} أيام متواصلة!</span>
                </div>
                <div className="text-2xl">🔥</div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-1.5 flex items-center gap-1.5">
                  <span className="text-emerald-500">🎯</span>
                  <span>المهمات اليومية النشطة</span>
                </h4>
                <div className="space-y-2">
                  {gamification.dailyMissions.map((mission) => (
                    <div key={mission.id} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      mission.completed 
                        ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30 text-zinc-400' 
                        : 'bg-zinc-50/50 border-zinc-150 dark:bg-zinc-900/20 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{mission.completed ? '✅' : '📌'}</span>
                        <div className="text-right">
                          <span className={`font-bold block ${mission.completed ? 'line-through' : ''}`}>{mission.title}</span>
                          <span className="text-[9px] text-zinc-400 block">التقدم: {mission.current} / {mission.target}</span>
                        </div>
                      </div>
                      <div className="text-left font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                        +{mission.xpReward} XP
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications config removed */}

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
                اكتب المسمى المناسب لك لكل جزء (مثال: الظهر، من 2 لـ 5، الفجر، المساء).
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
                حفظ المسميات الجديد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Quick Add Task to a specific Part */}
      {addingPartIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ direction: 'rtl' }}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 text-right shadow-2xl">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-500" />
                <span>إضافة مهمة جديدة إلى "{addingPartIndex === 0 ? partNames.part1 : addingPartIndex === 1 ? partNames.part2 : partNames.part3}"</span>
              </h3>
            </div>

            <div className="space-y-3">
              {/* Top 2-Option Selector */}
              <div className="p-1 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setNewTaskAdditionType('subject')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    newTaskAdditionType === 'subject'
                      ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200 dark:border-zinc-700'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>📚</span>
                  <span>مادة أساسية</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewTaskAdditionType('other')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    newTaskAdditionType === 'other'
                      ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm border border-zinc-200 dark:border-zinc-700'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>✨</span>
                  <span>نشاط / كورس آخر</span>
                </button>
              </div>

              {newTaskAdditionType === 'subject' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">📚 المادة الأساسية:</label>
                    <select
                      value={newTaskSubjectId}
                      onChange={(e) => setNewTaskSubjectId(e.target.value)}
                      className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl focus:outline-none font-bold"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Material Stage Choice */}
                  <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">🎯 الستيج / مرحلة الدرس:</label>
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
                          onClick={() => setNewTaskLessonPart(stg.id as any)}
                          className={`px-2 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                            newTaskLessonPart === stg.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {stg.label}
                        </button>
                      ))}
                    </div>

                    {newTaskLessonPart === 'custom' && (
                      <input
                        type="text"
                        placeholder="اسم المرحلة الإضافية (مثل: امتحانات شحاملة، مراجعة...)"
                        value={newTaskCustomStageName}
                        onChange={(e) => setNewTaskCustomStageName(e.target.value)}
                        className="w-full text-xs p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">عنوان / تفاصيل إضافية (اختياري):</label>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder={`تلقائي: ${subjects.find(s => s.id === newTaskSubjectId)?.name || 'المادة'} - ${getStageText(newTaskLessonPart, newTaskCustomStageName)}`}
                      className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl focus:outline-none"
                    />
                  </div>

                  {/* Attendance Mode Choice */}
                  <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">مكان ونوع الحضور:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewTaskStudyMode('center')}
                        className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          newTaskStudyMode === 'center'
                            ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <span>🏫</span>
                        <span>حضور مباشر (سنتر)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewTaskStudyMode('online')}
                        className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          newTaskStudyMode === 'online'
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <span>💻</span>
                        <span>حصة أونلاين</span>
                      </button>
                    </div>
                  </div>

                  {newTaskStudyMode === 'center' ? (
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      📍 حصة حضور بالسنتر - غير متاحة للانضمام عن بُعد. ستتمكن من تسجيل الوقت الفعلي الذي قضيتَه بعد الانتهاء.
                    </p>
                  ) : (
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-800 dark:text-blue-300 space-y-1">
                      <label className="block font-bold">مؤقت المذاكرة للدرس الأونلاين:</label>
                      <select
                        value={newTaskOnlineTimerTool}
                        onChange={(e) => setNewTaskOnlineTimerTool(e.target.value as any)}
                        className="w-full p-1.5 text-xs border border-blue-200 dark:border-blue-800 bg-white dark:bg-zinc-900 rounded focus:outline-none"
                      >
                        <option value="pomodoro">⏱️ تايمر بومودورو / تركيز</option>
                        <option value="stopwatch">⏳ ساعة إيقاف متصاعدة</option>
                        <option value="none">🔇 بدون مؤقت</option>
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Other Activity Fields */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">🏷️ نوع النشاط / الكورس الإضافي:</label>
                    <select
                      value={newTaskOtherCategory}
                      onChange={(e) => setNewTaskOtherCategory(e.target.value as any)}
                      className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl focus:outline-none font-bold"
                    >
                      <option value="Online Course">💻 كورس أونلاين خارجي</option>
                      <option value="Gym & Health">🏋️ رياضة وجيم / صحة</option>
                      <option value="Self Development">📚 قراءة وتطوير ذاتي</option>
                      <option value="Family/Personal">👨‍👩‍👧 نشاط عائلي / شخصي</option>
                      <option value="Free Time">🎨 وقت حر / هواية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">📝 اسم النشاط / الكورس:</label>
                    <input
                      type="text"
                      placeholder="مثال: كورس برمجة Python، تمارين الجيم، قراءة كتاب..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">🎯 الهدف المستهدف (اختياري):</label>
                    <input
                      type="text"
                      placeholder="مثال: إكمال الفصل الأول، أداء تمارين الظهر..."
                      value={newTaskGoal}
                      onChange={(e) => setNewTaskGoal(e.target.value)}
                      className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setAddingPartIndex(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleCreateTaskForPart(addingPartIndex)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                إضافة المهمة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missed Session Rescheduling Question Modal */}
      {missedAct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden text-right" style={{ direction: 'rtl' }}>
            <div className="p-6 border-b border-zinc-150 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>لماذا فاتتك جلسة {missedAct.title.replace(/^📚\s*/, '')}؟ 🧐</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                سنقوم بإعادة الجدولة وتوزيع الجلسة بشكل مرن.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-350">اختر السبب لمساعدتنا في تحسين جدولك:</label>
              
              <div className="space-y-2">
                {[
                  { id: 'Didn\'t have time', label: 'لم يكن لدي وقت كافٍ اليوم ⏱️' },
                  { id: 'Didn\'t understand', label: 'لم أفهم الدرس جيداً 🧠' },
                  { id: 'Felt tired', label: 'شعرت بالتعب 💤' },
                  { id: 'Private lesson', label: 'درس خصوصي إضافي 🏫' },
                  { id: 'Other', label: 'سبب آخر 💬' }
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedMissedReason(option.id)}
                    className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl border text-right transition-colors cursor-pointer flex items-center justify-between ${
                      selectedMissedReason === option.id
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                        : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <span>{option.label}</span>
                    {selectedMissedReason === option.id && <span className="text-rose-600">●</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setMissedAct(null)}
                className="py-2 px-4 text-xs font-semibold text-zinc-600 dark:text-zinc-400"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onMissActivity && missedAct) {
                    await onMissActivity(missedAct.id, selectedMissedReason);
                    setMissedAct(null);
                  }
                }}
                className="py-2 px-5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                <span>🔄 إعادة جدولة الجلسة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Person Class Actual Time Logger Modal */}
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
