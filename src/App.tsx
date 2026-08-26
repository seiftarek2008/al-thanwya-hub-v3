/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Timer as TimerIcon,
  CheckSquare,
  BookOpen,
  GraduationCap,
  BrainCircuit,
  Settings as SettingsIcon,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  User,
  Activity,
  Award,
  TrendingUp,
  Lock,
  Mail,
  LogIn,
  UserPlus,
  Cloud,
  Calendar,
  CalendarDays,
  Hourglass,
  Search,
  CheckCircle,
  Brain,
  MessageSquare,
  Info,
  ChevronDown,
  Plane,
  Compass,
  Menu,
  X
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import StudentGuideModal from './components/StudentGuideModal';

import { Subject, StudySession, Task, Goal, Exam, GradeRecord, ChatMessage, NeuroscienceStats, AppStudyState, PlannerActivity, Countdown, LifestyleProfile, Gamification, SpacedRepetitionItem, SpacedRepetitionMilestone, DailyHistoryLog } from './types';
import { autoCreateSpacedRepetitionReviews, rescheduleMissedReviews } from './utils/spacedRepetition';
import { calculateDayTaskStats, computeTaskBasedStreak, evaluateGamificationStreak, getAcademicDateString, StreakThreshold } from './utils/streakManager';
import Timer from './components/Timer';
import AIChatbot from './components/AIChatbot';
import StatsDashboard from './components/StatsDashboard';
import TaskList from './components/TaskList';
import ExamsTracker from './components/ExamsTracker';
import NeurosciencePanel from './components/NeurosciencePanel';
import SettingsPanel from './components/SettingsPanel';
import DailyCheckinModal from './components/DailyCheckinModal';
import SubjectsManager from './components/SubjectsManager';
import GoogleDrivePanel from './components/GoogleDrivePanel';
import WeeklyPlanner from './components/WeeklyPlanner';
import TodayTracker from './components/TodayTracker';
import CountdownManager from './components/CountdownManager';
import ScorePrediction from './components/ScorePrediction';
import FocusDiagnostics from './components/FocusDiagnostics';
import CustomAnalyticsDashboard from './components/CustomAnalyticsDashboard';
import GamificationHub from './components/GamificationHub';
import CurriculumTracker from './components/CurriculumTracker';
import FocusModeContainer from './components/FocusModeContainer';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { 
  getLocalAcademicData, 
  setLocalAcademicData, 
  clearAllLocalAcademicData,
  getPendingSyncQueue, 
  dequeueOfflineAction, 
  getQueuePendingCount, 
  enqueueOfflineAction,
  getOfflineDailyCheckins,
  saveOfflineDailyCheckins,
  getTodayDateStr,
  mergeDailyCheckins,
  WeeklyScheduleData,
  getOfflineWeeklySchedule,
  retryRecoverWeeklyScheduleFromIndexedDB,
  saveOfflineWeeklySchedule,
  mergeWeeklySchedules,
  generateScheduleHash
} from './utils/offlineDb';

const getDefaultSubjects = (
  stream: 'math' | 'science' | 'literature',
  track: 'arabic' | 'languages' = 'arabic'
): Subject[] => {
  const isLang = track === 'languages';
  
  if (stream === 'math') {
    return [
      { 
        id: 'sub_1', 
        name: isLang ? 'Arabic Language (اللغة العربية)' : 'اللغة العربية', 
        color: '#FF5733', 
        icon: 'BookOpen', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 80, 
        branches: ['نحو', 'نصوص', 'بلاغة', 'أدب', 'قراءة وقصة'] 
      },
      { 
        id: 'sub_2', 
        name: isLang ? 'English (First Foreign Language)' : 'اللغة الإنجليزية الأولى', 
        color: '#33FF57', 
        icon: 'Languages', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 60, 
        branches: isLang 
          ? ['Grammar', 'Vocabulary & Reading', 'Writing & Essay'] 
          : ['قواعد (Grammar)', 'كلمات وقراءة (Vocabulary & Reading)', 'كتابة وتعبير (Writing)'] 
      },
      { 
        id: 'sub_3_pure', 
        name: isLang ? 'Pure Mathematics (الرياضيات البحتة)' : 'الرياضيات البحتة', 
        color: '#3357FF', 
        icon: 'Layers', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 30, 
        branches: isLang 
          ? ['Calculus', 'Algebra & Solid Geometry'] 
          : ['تفاضل وتكامل', 'جبر وهندسة فراغية'] 
      },
      { 
        id: 'sub_3_applied', 
        name: isLang ? 'Applied Mathematics (الرياضيات التطبيقية)' : 'الرياضيات التطبيقية', 
        color: '#3b82f6', 
        icon: 'Compass', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 30, 
        branches: isLang 
          ? ['Statics', 'Dynamics'] 
          : ['استاتيكا', 'ديناميكا'] 
      },
      { 
        id: 'sub_4', 
        name: isLang ? 'Physics (الفيزياء)' : 'الفيزياء', 
        color: '#F3FF33', 
        icon: 'Flame', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 60, 
        branches: isLang 
          ? ['Electric Current & Kirchhoff\'s Laws', 'Magnetic Effect & Devices', 'Electromagnetic Induction', 'Alternating Current', 'Modern Physics']
          : ['تيار كهربي وكيرشوف', 'تأثير مغناطيسي وأجهزة', 'حث كهرومغناطيسي', 'تيار متردد', 'فيزياء حديثة'] 
      },
      { 
        id: 'sub_5', 
        name: isLang ? 'Chemistry (الكيمياء)' : 'الكيمياء', 
        color: '#FF33F3', 
        icon: 'FlaskConical', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 60, 
        branches: isLang 
          ? ['Transition Elements', 'Chemical Analysis', 'Chemical Equilibrium', 'Electrochemistry', 'Organic Chemistry']
          : ['عناصر انتقالية', 'تحليل كيميائي', 'اتزان كيميائي', 'كيمياء كهربية', 'كيمياء عضوية'] 
      }
    ];
  } else if (stream === 'science') {
    return [
      { 
        id: 'sub_1', 
        name: isLang ? 'Arabic Language (اللغة العربية)' : 'اللغة العربية', 
        color: '#FF5733', 
        icon: 'BookOpen', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 80, 
        branches: ['نحو', 'نصوص', 'بلاغة', 'أدب', 'قراءة وقصة'] 
      },
      { 
        id: 'sub_2', 
        name: isLang ? 'English (First Foreign Language)' : 'اللغة الإنجليزية الأولى', 
        color: '#33FF57', 
        icon: 'Languages', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 60, 
        branches: isLang 
          ? ['Grammar', 'Vocabulary & Reading', 'Writing & Essay'] 
          : ['قواعد (Grammar)', 'كلمات وقراءة (Vocabulary & Reading)', 'كتابة وتعبير (Writing)'] 
      },
      { 
        id: 'sub_3', 
        name: isLang ? 'Biology (الأحياء)' : 'الأحياء', 
        color: '#3357FF', 
        icon: 'Layers', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 60, 
        branches: isLang 
          ? ['Support & Movement', 'Hormonal Coordination', 'Reproduction', 'Immunity', 'Molecular Biology']
          : ['دعامة وحركة', 'تنسيق هرموني', 'تكاثر', 'مناعة', 'بيولوجيا جزيئية (DNA & RNA)'] 
      },
      { 
        id: 'sub_4', 
        name: isLang ? 'Physics (الفيزياء)' : 'الفيزياء', 
        color: '#F3FF33', 
        icon: 'Flame', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 60, 
        branches: isLang 
          ? ['Electric Current & Kirchhoff\'s Laws', 'Magnetic Effect & Devices', 'Electromagnetic Induction', 'Alternating Current', 'Modern Physics']
          : ['تيار كهربي وكيرشوف', 'تأثير مغناطيسي وأجهزة', 'حث كهرومغناطيسي', 'تيار متردد', 'فيزياء حديثة'] 
      },
      { 
        id: 'sub_5', 
        name: isLang ? 'Chemistry (الكيمياء)' : 'الكيمياء', 
        color: '#FF33F3', 
        icon: 'FlaskConical', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 60, 
        branches: isLang 
          ? ['Transition Elements', 'Chemical Analysis', 'Chemical Equilibrium', 'Electrochemistry', 'Organic Chemistry']
          : ['عناصر انتقالية', 'تحليل كيميائي', 'اتزان كيميائي', 'كيمياء كهربية', 'كيمياء عضوية'] 
      }
    ];
  } else {
    return [
      { 
        id: 'sub_1', 
        name: isLang ? 'Arabic Language (اللغة العربية)' : 'اللغة العربية', 
        color: '#FF5733', 
        icon: 'BookOpen', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 80, 
        branches: ['نحو', 'نصوص', 'بلاغة', 'أدب', 'قراءة وقصة'] 
      },
      { 
        id: 'sub_2', 
        name: isLang ? 'English (First Foreign Language)' : 'اللغة الإنجليزية الأولى', 
        color: '#33FF57', 
        icon: 'Languages', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 60, 
        branches: isLang 
          ? ['Grammar', 'Vocabulary & Reading', 'Writing & Essay'] 
          : ['قواعد (Grammar)', 'كلمات وقراءة (Vocabulary & Reading)', 'كتابة وتعبير (Writing)'] 
      },
      { 
        id: 'sub_3', 
        name: isLang ? 'History (التاريخ)' : 'التاريخ', 
        color: '#3357FF', 
        icon: 'Layers', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 60, 
        branches: isLang 
          ? ['French Campaign', 'Mohammad Ali Era', 'Orabi Revolution', 'Post WWI Egypt', 'Colonial Expansion', 'Modern Egypt']
          : ['الحملة الفرنسية', 'محمد علي وبناء مصر الحديثة', 'الثورة العرابية والاحتلال', 'مصر بعد الحرب العالمية الأولى', 'التوسع الاستعماري والتحرر', 'الحرب العالمية الثانية والمقاومة', 'ثورة 23 يوليو', 'الصراع العربي الإسرائيلي'] 
      },
      { 
        id: 'sub_4', 
        name: isLang ? 'Geography (الجغرافيا)' : 'الجغرافيا', 
        color: '#F3FF33', 
        icon: 'Flame', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 60, 
        branches: isLang 
          ? ['Political Geography', 'The State', 'Political Borders', 'Global Conflicts', 'International Blocs', 'New World Order']
          : ['مدخل الجغرافيا السياسية', 'الدولة', 'الحدود السياسية', 'المشكلات السياسية', 'التكتلات والأحلاف', 'النظام العالمي الجديد'] 
      },
      { 
        id: 'sub_philosophy', 
        name: isLang ? 'Philosophy & Logic (الفلسفة والمنطق)' : 'الفلسفة والمنطق', 
        color: '#9B51E0', 
        icon: 'Brain', 
        totalMinutes: 0, 
        targetMinutesPerWeek: 420, 
        maxScore: 60, 
        branches: isLang 
          ? ['Applied Philosophy', 'Environmental Ethics', 'Logic & Scientific Method', 'Deductive Reasoning', 'Artificial Intelligence Logic']
          : ['الفلسفة التطبيقية والأخلاق البيئية', 'أخلاقيات المهنة والبيولوجيا', 'الاستدلال الاستقرائي والمنهج العلمي', 'الاستدلال الاستنباطي وتطبيقاته', 'المنطق والذكاء الاصطناعي'] 
      }
    ];
  }
};

const deduplicateClientSubjects = (list: Subject[]): Subject[] => {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const result: Subject[] = [];
  for (const sub of list) {
    if (!sub || !sub.name) continue;
    const n = sub.name.toLowerCase();
    let key = sub.name;
    if (n.includes('عرب') || n.includes('arabic')) key = 'arabic';
    else if (n.includes('إنجليز') || n.includes('english')) key = 'english';
    else if (n.includes('بحت') || n.includes('pure')) key = 'pure_math';
    else if (n.includes('تطبيق') || n.includes('applied')) key = 'applied_math';
    else if (n.includes('فيزي') || n.includes('physic')) key = 'physics';
    else if (n.includes('كيمي') || n.includes('chemist')) key = 'chemistry';
    else if (n.includes('أحي') || n.includes('biol')) key = 'biology';
    else if (n.includes('تاريخ') || n.includes('histor')) key = 'history';
    else if (n.includes('جغراف') || n.includes('geog')) key = 'geography';
    else if (n.includes('فلسف') || n.includes('philosoph')) key = 'philosophy';

    if (!seen.has(key)) {
      seen.add(key);
      result.push(sub);
    }
  }
  return result;
};

const sanitizeUserDataState = (
  rawSubjects: Subject[],
  rawExams: Exam[],
  rawGrades: GradeRecord[],
  rawSessions: StudySession[],
  rawTasks: Task[],
  stream: 'math' | 'science' | 'literature',
  track: 'arabic' | 'languages'
) => {
  const defaultSubjects = deduplicateClientSubjects(getDefaultSubjects(stream, track));
  const allowedIds = defaultSubjects.map(s => s.id);

  const sanitizedSubjects = defaultSubjects.map(def => {
    const existing = (rawSubjects || []).find(s => s.id === def.id || (s.name && s.name.split(' ')[0] === def.name.split(' ')[0]));
    if (existing) {
      return {
        ...def,
        totalMinutes: existing.totalMinutes !== undefined ? existing.totalMinutes : 0,
        targetMinutesPerWeek: existing.targetMinutesPerWeek !== undefined ? existing.targetMinutesPerWeek : def.targetMinutesPerWeek,
      };
    }
    return { ...def };
  });

  const finalSubjects = deduplicateClientSubjects(sanitizedSubjects);

  const sanitizedExams = (rawExams || []).filter(e => allowedIds.includes(e.subjectId));
  const sanitizedGrades = (rawGrades || []).filter(g => allowedIds.includes(g.subjectId));
  const sanitizedSessions = (rawSessions || []).filter(s => Boolean(s && s.id));
  const sanitizedTasks = (rawTasks || []).filter(t => Boolean(t && t.id));

  return {
    subjects: finalSubjects,
    exams: sanitizedExams,
    grades: sanitizedGrades,
    sessions: sanitizedSessions,
    tasks: sanitizedTasks
  };
};

const HELP_CONTENT: Record<string, { title: string; purpose: string; howItWorks: string; bestPractices: string; shortDesc: string }> = {
  dashboard: {
    title: "الرئيسية ودراسة اليوم 🏠",
    shortDesc: "هذه الشاشة تجيبك فوراً وبوضوح عن روتينك لليوم: ماذا تفعل الآن، ماذا ينتظرك، كيف هو أداؤك، وما الذي يتطلب اهتمامك لتبقي ذهنك هادئاً ومرتباً.",
    purpose: "الإجابة عن الأسئلة الأربعة الأساسية ليومك الدراسي دون تشتيت.",
    howItWorks: "تجمع المؤشرات من روتينك اليومي وتضع لك أهم الإجراءات المطلوبة الآن عصبياً ودراسياً.",
    bestPractices: "ابدأ يومك بتفقد هذه البطاقات الأربعة لتنطلق في دراستك بوعي وتركيز تام."
  },
  planner: {
    title: "المنظم والجدول الأسبوعي الذكي 🗓️",
    shortDesc: "خطط لأسبوعك الدراسي بذكاء، وزّع الجهد بين المواد وحافظ على فترات الراحة المنشطة والمنظمة تلقائياً.",
    purpose: "توزيع الجهد الدراسي على مدار الأسبوع وموازنة حمل الحفظ والفهم.",
    howItWorks: "يقوم بتوزيع الحصص والفترات بناءً على مستواك الحالي وصعوبة المواد لضمان عدم حدوث احتراق.",
    bestPractices: "استعن بمستشار الجدولة لتحسين روتينك الأسبوعي والمذاكرة بذكاء."
  },
  tasks: {
    title: "قائمة الواجبات والمهام 📝",
    shortDesc: "منظم مرن لإضافة وإدارة واجباتك المحددة لكل مادة دراسية وعرض المنجز منها لتفريغ عقلك من تراكم الأفكار.",
    purpose: "تقسيم المناهج الضخمة إلى مهام صغيرة قابلة للتنفيذ اليومي والتدريجي.",
    howItWorks: "تربط كل مهمة بمادتها ليسهل عليك تصفيتها والبدء بالأهم فالأهم.",
    bestPractices: "اكتب دائماً مهاماً ملموسة وواضحة جداً وتجنب العناوين العامة الغامضة."
  },
  countdowns: {
    title: "العدادات التنازلية للامتحانات ⏳",
    shortDesc: "تتبع الأيام المتبقية على الامتحانات النهائية والمحطات الهامة بدقة بالغة لبناء دافع دراسي يومي متزن وصحي.",
    purpose: "إدراك الزمن المتبقي للمراجعة الشاملة قبل دخول قاعة الامتحان.",
    howItWorks: "يحسب تنازلياً الزمن الفعلي المتبقي حتى تاريخ امتحان كل مادة مضافة.",
    bestPractices: "راجع العدادات باستمرار لجدولة مراجعاتك النهائية بوعي واستباقية."
  },
  spaced: {
    title: "التكرار المتباعد والاستدعاء النشط 🧠",
    shortDesc: "حارب منحنى النسيان الطبيعي عبر خوارزمية التكرار المتباعد لتثبيت المعلومات في الذاكرة طويلة الأجل بجهد أقل 5 مرات.",
    purpose: "حفظ وتثبيت الدروس والمفاهيم دون الحاجة لإعادة مذاكرتها بالكامل.",
    howItWorks: "يقوم بجدولة جلسات مراجعة متباعدة لدروسك التي تنهيها بناءً على مدى ثقتك من استيعابك.",
    bestPractices: "راجع الكروت المستحقة اليوم أولاً بأول لحماية روابطك العصبية من التلاشي."
  },
  memory: {
    title: "لوحة صحة الذاكرة المعرفية 🩺🧠",
    shortDesc: "توقع دقيق لمعدلات النسيان والاحتفاظ بالمعلومات بناءً على منحنى إبنجهاوس العصبي لتشخيص الدروس المهددة بالضياع.",
    purpose: "رصد جودة تخزين المفاهيم في دماغك والتنبؤ بالدروس التي قاربت على نسيانها.",
    howItWorks: "يحلل استقرار معلوماتك الذهنية ويرشدك لما يحتاج إلى استدعاء عاجل فوراً.",
    bestPractices: "أعطِ الأولوية القصوى للدروس المصنفة بـ 'مهددة بالنسيان' لتفادي فقدان جهد دراستها."
  },
  ai: {
    title: "مستشار الذكاء الاصطناعي والكوتش 🤖✨",
    shortDesc: "تحدث مع كوتش المذاكرة الذكي لشرح المفاهيم المعقدة، حل المسائل الصعبة، أو تلخيص الدروس بلغة عربية بسيطة وسهلة.",
    purpose: "الحصول على رفيق دراسي ذكي ومستشار أكاديمي ونفسي متاح على مدار الساعة.",
    howItWorks: "يستخدم نموذج Gemini المطور لتقديم حلول ذكية مخصصة لنظام الثانوية العامة.",
    bestPractices: "اطلب منه وضع خطة تلخيص سريعة لدرس معقد أو طرح أسئلة اختبار تفاعلية لقياس فهمك."
  },
  curriculum: {
    title: "منهج المذاكرة الذكي ودورة التعلم 📚",
    shortDesc: "تتبع تقدمك في دروس المنهج الدراسي عبر دورة تعلم متكاملة من 6 مراحل عصبية متتالية لضمان الفهم والتثبيت الكامل.",
    purpose: "تنظيم دراسة كل درس في المنهج بدقة ومنع الاكتفاء بالقراءة السطحية.",
    howItWorks: "يقسم تحصيل المنهج إلى مراحل متتالية من الفهم الأول، وحل الشيتات والواجبات، وحتى المراجعة المتباعدة الذكية والتثبيت.",
    bestPractices: "تابع الدروس وقم بتحديث تقدمك في كل مرحلة، وسجل درجات شيتاتك والواجبات لتقييم فهمك الفعلي."
  },
  prediction: {
    title: "متنبئ المجموع التراكمي والتحليلات 🎯",
    shortDesc: "تنبؤات دقيقة لمجموعك النهائي في الثانوية العامة استناداً لأدائك الفعلي في الدرجات ومعدلات تركيزك اليومية.",
    purpose: "رسم مسار حقيقي لنسب نجاحك وتوجيه جهودك الدراسية نحو المواد الأكثر حاجة للدعم.",
    howItWorks: "يحلل درجات الامتحانات والواجبات المكتملة ويربطها بجدية روتينك وساعات تركيزك الفعلية.",
    bestPractices: "حافظ على تدوين درجاتك الدورية بصدق لتمنح الكوتش فرصة تحليل مسارك بدقة بالغة."
  },
  focus_diagnostics: {
    title: "تشخيص أنماط التركيز العصبية 🎯",
    shortDesc: "تحليل خوارزمي دقيق لكفاءة التركيز، أوقات الذروة الذهنية، والمدة الزمنية المثالية للجلسات لمنع التشتت والانقطاع.",
    purpose: "اكتشاف أوقات وأساليب المذاكرة التي تمنحك أعلى معدلات التدفق الذهني والامتصاص المعرفي.",
    howItWorks: "يحلل بيانات جلساتك الفعلية ويرسم اتجاهات الانتباه عبر فترات اليوم المختلفة لتوليد توصيات مخصصة.",
    bestPractices: "تابع هذا التقرير أسبوعياً لضبط جدولة المواد الصعبة في أوقات ذروة تركيزك وتفعيل وضع عدم الإزعاج."
  },
  neuroscience: {
    title: "علم الأعصاب وصحة الدماغ البيولوجية 🧠🧪",
    shortDesc: "يقيس مستويات الإجهاد وجودة النوم والضغط النفسي لتوفير إرشادات مخصصة لثباتك النفسي وتفادي الاحتراق.",
    purpose: "الاهتمام بصحة دماغك البيولوجية كأداة التخزين الأساسية طوال رحلة الثانوية العامة.",
    howItWorks: "يرصد مؤشراتك اليومية ليقدم تحذيرات دقيقة حول تزايد معدلات التوتر والاحتراق وعلاجها.",
    bestPractices: "اتبع نصائح النوم واستعادة الحيوية لضمان تحضير خلايا دماغك لامتصاص المعرفة بفعالية."
  },
  exams: {
    title: "سجل الامتحانات والدرجات الموثق 📝",
    shortDesc: "قاعدة بيانات درجاتك الدورية لربط توقعات مجموعك النهائي بأدائك الفعلي والموثق.",
    purpose: "مراقبة تطور مستواك الأكاديمي في امتحانات الدروس العامة والخاصة.",
    howItWorks: "تضيف درجاتك لتسجيلها ومقارنتها تلقائياً بالمستهدف السنوي الخاص بك.",
    bestPractices: "أضف كل امتحان تخوضه أولاً بأول لتبقى على علم تام بنقاط ضعفك وقوتك."
  },
  subjects: {
    title: "إدارة المواد والمنهج الدراسي 📚",
    shortDesc: "منظم متكامل لمتابعة ما تم إنجازه من فصول المنهج وتوزيع ساعات دراستك لكل مادة بوضوح.",
    purpose: "السيطرة الكاملة على كمية منهج الثانوية العامة وتتبع التقدم التفصيلي للأبواب والفروع.",
    howItWorks: "تحدد المواد ومستهدفك الأسبوعي ليربطها المنظم بجدولك وخطط مراجعتك.",
    bestPractices: "قسّم فصول المواد بانتظام لتشعر بالإنجاز المتدرج مع إتمام كل باب معرفي."
  },
  settings: {
    title: "الملف الدراسي والإعدادات ⚙️",
    shortDesc: "تحكم بملفك الشخصي، أهدافك السنوية، موادك الدراسية، والنسخ السحابي لبياناتك بأمان تام.",
    purpose: "تخصيص كامل للنظام ليتطابق مع شعبتك الدراسية وأهداف طموحك الخاصة.",
    howItWorks: "يحفظ خياراتك الأساسية ومستهدفك المئوي لتعديل توقعات المجموع بناءً عليها.",
    bestPractices: "احرص على إبقاء البريد الإلكتروني والشعبة والنسبة المستهدفة دقيقة دائماً."
  },
  drive: {
    title: "النسخ السحابي والاحتياطي ☁️",
    shortDesc: "حفظ ومزامنة ملفاتك وبياناتك الدراسية تلقائياً على حسابك بـ Google Drive لحماية سجل رحلتك.",
    purpose: "منع ضياع أي بيانات دراسية أو سجل تكرار متباعد والوصول لملفاتك من أي جهاز.",
    howItWorks: "يربط مع Google Drive لرفع نسخة احتياطية آمنة ومزامنة بياناتك بلمسة واحدة.",
    bestPractices: "قم بعمل مزامنة دورية لحماية جهودك وسجل مراجعاتك الطويل."
  },
  custom_analytic: {
    title: "استوديو التحليلات والرسم البياني المخصص (Analytic Studio) 📈",
    shortDesc: "لوحة تحكم تفاعلية تسمح لك بإنشاء وتصميم أي رسم بياني تحتاجه: اختر المحور الأفقي والرأسي، ونوع الرسم، وقارن بين الأسابيع الدراسية.",
    purpose: "منحك حرية كاملة لتحليل أدائك وساعات مذاكرتك ودرجاتك وفق الفلاتر والنطاقات الزمنية والأسابيع التي تختارها.",
    howItWorks: "تحدد المحاور والمقاييس ونوع الرسم البياني (أعمدة، خطي، دائري، رادار...) وتفعّل وضع مقارنة الأسابيع جنب لجنب عند الحاجة.",
    bestPractices: "استخدم نماذج المقارنة المباشرة لمعرفة مدى تطور ساعات مذاكرتك من الأسبوع الأول حتى الأسبوع الحالي."
  }
};

export default function App() {
  // Auth states
  const [token, setToken] = useState<string | null>(localStorage.getItem('study_session_token'));
  const [user, setUser] = useState<{ 
    name: string; 
    email: string; 
    stream: 'math' | 'science' | 'literature'; 
    targetPercentage: number;
    curriculumTrack?: 'arabic' | 'languages';
    academicYear?: 'first' | 'second' | 'third';
    phone?: string;
    whatsappReminders?: boolean;
  } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Auth Form State
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authStream, setAuthStream] = useState<'math' | 'science' | 'literature'>('science');
  const [authTarget, setAuthTarget] = useState(95);
  const [authCurriculumTrack, setAuthCurriculumTrack] = useState<'arabic' | 'languages'>('arabic');
  const [authAcademicYear, setAuthAcademicYear] = useState<'first' | 'second' | 'third'>('third');
  const [authError, setAuthError] = useState('');

  // Main study records state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [neuroscienceStats, setNeuroscienceStats] = useState<NeuroscienceStats>({
    burnoutRisk: 'low',
    breakRecommendations: ['Take a 5-minute NSDR break', 'Walk for 5 minutes in sunlight'],
    optimalStudyHours: ['09:00 AM - 11:00 AM', '04:00 PM - 06:00 PM'],
    dailyCognitiveEnergy: 90,
    consistencyScore: 92,
    spacedRepetitionList: []
  });

  // Additional behavioral indicators & weekly planner states
  const [plannerActivities, setPlannerActivities] = useState<any[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleData | null>(null);
  const [sleepLogs, setSleepLogs] = useState<any[]>([]);
  const [screenTimeLogs, setScreenTimeLogs] = useState<any[]>([]);
  const [dailyCheckins, setDailyCheckins] = useState<any[]>([]);
  const [showCheckinModal, setShowCheckinModal] = useState<boolean>(false);
  const [grades, setGrades] = useState<any[]>([]);

  // NEW Extended States for upgraded features
  const [countdowns, setCountdowns] = useState<any[]>([]);
  const [burnoutLogs, setBurnoutLogs] = useState<any[]>([]);
  const [stressLogs, setStressLogs] = useState<any[]>([]);
  const [thanaweyaStartDate, setThanaweyaStartDate] = useState<string>('2026-08-25');
  const thanaweyaStartDateRef = useRef<string>('2026-08-25');
  const syncDebounceRef = useRef<any>(null);
  const latestStateRef = useRef<Partial<AppStudyState>>({});
  const [spacedRepetitionReviews, setSpacedRepetitionReviews] = useState<SpacedRepetitionItem[]>([]);
  const [customHistoryLogs, setCustomHistoryLogs] = useState<DailyHistoryLog[]>([]);
  const [currentAcademicWeek, setCurrentAcademicWeek] = useState<number>(1);
  const [academicHistory, setAcademicHistory] = useState<any[]>([]);
  const [notifSettings, setNotifSettings] = useState<any>({
    emailNotif: true,
    browserNotif: true,
    whatsappNotif: true,
    whatsappTime: '18:00',
    morningSummary: true,
    nightReview: true,
    hydrateReminder: true,
    breakReminder: true,
    sleepReminder: true
  });

  const [lifestyleProfile, setLifestyleProfile] = useState<LifestyleProfile>({
    fixedCommitments: [],
    sleepSchedule: { bedtime: '23:00', wakeupTime: '06:30', minDuration: 6, targetDuration: 8 },
    flexibleActivities: [],
    personalPreferences: { bestStudyTime: 'morning', worstStudyTime: 'afternoon', sessionDuration: 50, breakDuration: 10, maxStudyHoursPerDay: 6, maxDeepWorkSessions: 4, difficultSubjects: [], avoidNightSubjects: [], maxFocusSubjects: [] },
    energyLifestyle: { exerciseFrequency: '1-2', workoutIntensity: 'medium', dailyWalkingMinutes: 30, screenTimeMinutes: 120, coffeeCups: 1, waterIntakeLiters: 2.5, mealsCount: 3, mentalEnergyLevel: 8, relaxationActivities: [] },
    weeklyGoals: { studyHours: 30, revisionHours: 10, exerciseHours: 5, hobbyHours: 5, restHours: 10, sleepHours: 56 }
  });

  const [gamification, setGamification] = useState<Gamification>({
    xp: 0,
    coins: 0,
    streak: 0,
    level: 1,
    achievements: [
      { id: 'ach_1', title: 'البداية القوية 🚀', description: 'أكملت أول مهمة في جدولك الأسبوعي في وقتها!', completed: false, xpReward: 100, coinsReward: 10, icon: 'Award' },
      { id: 'ach_2', title: 'عاشق النوم الصحي 😴', description: 'حافظت على دورة نوم منتظمة لمدة 3 أيام متتالية', completed: false, xpReward: 150, coinsReward: 15, icon: 'Clock' },
      { id: 'ach_3', title: 'قاهر المواد الصعبة 🔥', description: 'أنجزت 5 جلسات مذاكرة للمواد عالية الصعوبة', completed: false, xpReward: 250, coinsReward: 25, icon: 'Zap' }
    ],
    dailyMissions: [
      { id: 'dm_1', title: 'مذاكرة الفجر 🌅', target: 1, current: 0, xpReward: 50, coinsReward: 5, completed: false, category: 'daily' },
      { id: 'dm_2', title: 'ساعة من الجهد النشط ✍️', target: 2, current: 0, xpReward: 80, coinsReward: 10, completed: false, category: 'daily' }
    ],
    weeklyMissions: [
      { id: 'wm_1', title: 'درع الالتزام الأسبوعي 🛡️', target: 8, current: 0, xpReward: 300, coinsReward: 30, completed: false, category: 'weekly' },
      { id: 'wm_2', title: 'أسبوع المذاكرة المتباعدة 🧠', target: 5, current: 0, xpReward: 400, coinsReward: 40, completed: false, category: 'weekly' }
    ]
  });

  // UI States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timer' | 'tasks' | 'subjects' | 'ai' | 'exams' | 'neuroscience' | 'settings' | 'drive' | 'planner' | 'today' | 'prediction' | 'spaced' | 'memory' | 'analytics' | 'checkin' | 'burnout' | 'coach' | 'gamification' | 'focus_diagnostics' | 'countdowns' | 'curriculum' | 'custom_analytic'>('dashboard');
  const [primaryTab, setPrimaryTab] = useState<'planning' | 'learning' | 'progress' | 'health' | 'gamification' | 'profile'>('planning');
  const [dndMode, setDndMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('study_dnd_mode') === 'true';
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('onboarding_completed');
  });
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [helpTopic, setHelpTopic] = useState<{ title: string; purpose: string; howItWorks: string; bestPractices: string; shortDesc: string } | null>(null);
  const [showStudentGuideModal, setShowStudentGuideModal] = useState(false);
  const [stageCompletionModal, setStageCompletionModal] = useState<{
    activityId: string;
    subjectId: string;
    subjectName: string;
    defaultDurationMinutes: number;
    stage: string;
  } | null>(null);

  // V10 Smart Focus Session state
  const [activeFocusActivity, setActiveFocusActivity] = useState<PlannerActivity | null>(null);

  // Sync primary tab when activeTab changes (e.g. via navigation or direct updates from other screens)
  useEffect(() => {
    if (['dashboard', 'today', 'planner', 'timer', 'tasks', 'countdowns'].includes(activeTab)) {
      setPrimaryTab('planning');
    } else if (['ai', 'spaced', 'memory'].includes(activeTab)) {
      setPrimaryTab('learning');
    } else if (['prediction', 'custom_analytic', 'focus_diagnostics', 'exams', 'analytics'].includes(activeTab)) {
      setPrimaryTab('progress');
    } else if (['checkin', 'burnout'].includes(activeTab)) {
      setPrimaryTab('health');
    } else if (activeTab === 'gamification') {
      setPrimaryTab('gamification');
    } else if (['settings', 'subjects', 'drive'].includes(activeTab)) {
      setPrimaryTab('profile');
    }
  }, [activeTab]);

  const [modalHours, setModalHours] = useState<number>(0);
  const [modalMinutes, setModalMinutes] = useState<number>(0);
  const [modalStage, setModalStage] = useState<string>('Lesson');
  const [modalCompletionStatus, setModalCompletionStatus] = useState<'completed' | 'partially' | 'not_completed'>('completed');
  const [modalPartialPercent, setModalPartialPercent] = useState<number>(50);
  const [modalIncompleteReason, setModalIncompleteReason] = useState<string>('ضيق الوقت');
  const [modalLessonName, setModalLessonName] = useState<string>('');

  useEffect(() => {
    if (stageCompletionModal) {
      setModalHours(Math.floor(stageCompletionModal.defaultDurationMinutes / 60));
      setModalMinutes(stageCompletionModal.defaultDurationMinutes % 60);
      setModalStage(stageCompletionModal.stage);
      setModalCompletionStatus('completed');
      setModalPartialPercent(50);
      setModalIncompleteReason('ضيق الوقت');
      const act = plannerActivities.find(a => a.id === stageCompletionModal.activityId);
      let defaultName = act?.todayGoal || act?.lessonName || act?.title || '';
      if (defaultName && stageCompletionModal.subjectName) {
        const subName = stageCompletionModal.subjectName;
        const doubleSubPattern = new RegExp(`^${subName}\\s*-\\s*${subName}\\s*-\\s*`, 'i');
        defaultName = defaultName.replace(doubleSubPattern, '');
        const singleSubPattern = new RegExp(`^${subName}\\s*-\\s*`, 'i');
        defaultName = defaultName.replace(singleSubPattern, '');
      }
      setModalLessonName(defaultName);
    }
  }, [stageCompletionModal]);

  // Two-Way Sync: Rename a lesson bidirectionally across Spaced Repetition Reviews and Weekly/Daily Planner
  const syncLessonRename = (
    subjectId: string,
    oldLessonName: string,
    newLessonName: string,
    activityId?: string
  ) => {
    const cleanOld = (oldLessonName || '').trim();
    const cleanNew = (newLessonName || '').trim();
    if (!cleanNew || cleanOld === cleanNew) return;

    // 1. Update Spaced Repetition Reviews and their Milestones
    setSpacedRepetitionReviews(prev => {
      let changed = false;
      const updated = prev.map(item => {
        const matchSubject = !subjectId || item.subjectId === subjectId;
        const matchOld = cleanOld && (
          item.lessonName.toLowerCase() === cleanOld.toLowerCase() ||
          item.lessonName.toLowerCase().includes(cleanOld.toLowerCase()) ||
          cleanOld.toLowerCase().includes(item.lessonName.toLowerCase())
        );
        const matchActivity = activityId && (item as any).activityId === activityId;

        if (matchSubject && (matchOld || matchActivity)) {
          changed = true;
          return {
            ...item,
            lessonName: cleanNew,
            milestones: item.milestones?.map(m => ({
              ...m,
              lessonName: cleanNew
            }))
          };
        }
        return item;
      });

      if (changed) {
        syncStateWithStorage({ spacedRepetitionReviews: updated });
        return updated;
      }

      // If not previously found in reviews, automatically add it!
      const subObj = subjects.find(s => s.id === subjectId);
      const subName = subObj ? subObj.name : 'مادة دراسية';
      setTimeout(() => {
        addLessonToSmartRevision(subjectId, subName, cleanNew, 'الوحدة الدراسية');
      }, 50);

      return prev;
    });

    // 2. Update Weekly Planner Activities
    setPlannerActivities(prev => {
      let changed = false;
      const updated = prev.map(act => {
        const matchActivity = activityId && act.id === activityId;
        const matchSubject = !subjectId || act.subjectId === subjectId;
        const matchOld = cleanOld && (
          act.title.toLowerCase() === cleanOld.toLowerCase() ||
          act.title.toLowerCase().includes(cleanOld.toLowerCase()) ||
          cleanOld.toLowerCase().includes(act.title.toLowerCase()) ||
          (act.lessonName && act.lessonName.toLowerCase() === cleanOld.toLowerCase()) ||
          (act.todayGoal && act.todayGoal.toLowerCase().includes(cleanOld.toLowerCase()))
        );

        if (matchActivity || (matchSubject && matchOld)) {
          changed = true;
          return {
            ...act,
            title: cleanNew,
            lessonName: cleanNew,
            todayGoal: act.todayGoal ? act.todayGoal.replace(cleanOld, cleanNew) : act.todayGoal
          };
        }
        return act;
      });

      if (changed) {
        const updatedSchedule: WeeklyScheduleData = {
          weekId: weeklySchedule?.weekId || `week_${getTodayDateStr()}`,
          generatedAt: weeklySchedule?.generatedAt || new Date().toISOString(),
          version: (weeklySchedule?.version || 1),
          schedule: updated,
          lastUpdated: Date.now(),
          hash: generateScheduleHash(updated)
        };
        setWeeklySchedule(updatedSchedule);
        syncStateWithStorage({ weeklySchedule: updatedSchedule, plannerActivities: updated });
        return updated;
      }
      return prev;
    });
  };

  // V12.5 Auto-add completed lesson to Smart Revision Table with 8 Spaced Milestones
  const addLessonToSmartRevision = (
    subjectId: string,
    subjectName: string,
    lessonName: string,
    unitName: string = 'الوحدة الدراسية',
    customStudiedDate?: string
  ) => {
    if (!lessonName || !lessonName.trim() || !subjectId) return;

    const cleanLessonName = lessonName.trim();
    const studiedDateStr = customStudiedDate || new Date().toISOString().split('T')[0];
    const baseDate = new Date(studiedDateStr + 'T00:00:00');
    
    // 8 long-term spaced repetition intervals (1d, 3d, 7d, 14d, 30d, 60d, 90d, 180d)
    const intervals = [1, 3, 7, 14, 30, 60, 90, 180];
    const lessonId = 'les_' + Math.random().toString(36).substring(2, 9);

    const milestones: SpacedRepetitionMilestone[] = intervals.map((days, index) => {
      const targetDate = new Date(baseDate.getTime());
      targetDate.setDate(targetDate.getDate() + days);
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

    const nextDate = new Date(baseDate.getTime());
    nextDate.setDate(nextDate.getDate() + 1);

    const newItem: SpacedRepetitionItem = {
      id: 'sr_' + Math.random().toString(36).substring(2, 9),
      lessonId,
      lessonName: cleanLessonName,
      subjectId,
      subjectName,
      unitName,
      studiedDate: studiedDateStr,
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

    setSpacedRepetitionReviews(prev => {
      const cleanNameLower = cleanLessonName.toLowerCase();
      const existingIdx = prev.findIndex(r => 
        r.subjectId === subjectId && 
        (r.lessonName.toLowerCase() === cleanNameLower || r.lessonName.toLowerCase().includes(cleanNameLower) || cleanNameLower.includes(r.lessonName.toLowerCase()))
      );
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          studiedDate: studiedDateStr,
          memoryStrength: 100,
          retentionEstimate: 100
        };
        syncStateWithStorage({ spacedRepetitionReviews: updated });
        return updated;
      }
      const updated = [newItem, ...prev];
      syncStateWithStorage({ spacedRepetitionReviews: updated });
      return updated;
    });
  };

  // V12.6 Advance Smart Revision Milestone for Weekly Reviews (Class Sheet, Homework, Revision)
  const advanceSmartRevisionMilestone = (
    subjectId: string,
    subjectName: string,
    lessonName: string,
    stageType: string,
    customDate?: string
  ) => {
    if (!subjectId) return;

    const todayStr = customDate || new Date().toISOString().split('T')[0];
    const normStage = (stageType || '').toLowerCase();
    const cleanName = lessonName && lessonName.trim() ? lessonName.trim() : `${subjectName} - درس اليوم`;

    setSpacedRepetitionReviews(prev => {
      // Find matching item by lessonName specifically for this subject
      let existingIndex = -1;
      if (cleanName) {
        const cleanNameLower = cleanName.toLowerCase();
        existingIndex = prev.findIndex(item => 
          item.subjectId === subjectId && 
          (item.lessonName.toLowerCase() === cleanNameLower || item.lessonName.toLowerCase().includes(cleanNameLower) || cleanNameLower.includes(item.lessonName.toLowerCase()))
        );
      }

      let list = [...prev];
      let item: SpacedRepetitionItem;

      if (existingIndex === -1) {
        // Create new item for this lesson if not already present
        const baseDate = new Date(todayStr + 'T00:00:00');
        const intervals = [1, 3, 7, 14, 30, 60, 90, 180];
        const lessonId = 'les_' + Math.random().toString(36).substring(2, 9);

        const milestones: SpacedRepetitionMilestone[] = intervals.map((days, index) => {
          const targetDate = new Date(baseDate.getTime());
          targetDate.setDate(targetDate.getDate() + days);
          const dateStr = targetDate.toISOString().split('T')[0];
          return {
            daysFromStart: days,
            targetDate: dateStr,
            status: 'pending' as const,
            lessonId,
            subject: subjectName,
            unit: 'الوحدة الدراسية',
            reviewNumber: index + 1,
            plannedReviewDate: dateStr,
            memoryStrength: Math.round(Math.max(20, 100 - (days / (index + 1)) * 2)),
            retentionEstimate: Math.round(Math.max(15, 100 - (days / (index + 1)) * 3)),
            priority: 'medium' as const,
            difficulty: 'medium' as const,
            confidence: null
          };
        });

        const nextDate = new Date(baseDate.getTime());
        nextDate.setDate(nextDate.getDate() + 1);

        item = {
          id: 'sr_' + Math.random().toString(36).substring(2, 9),
          lessonId,
          lessonName: cleanName,
          subjectId,
          subjectName,
          unitName: 'الوحدة الدراسية',
          studiedDate: todayStr,
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
        list.unshift(item);
        existingIndex = 0;
      } else {
        item = { ...list[existingIndex] };
      }

      // Determine which milestone to complete based on stageType or next pending
      const updatedMilestones = item.milestones ? [...item.milestones] : [];
      let targetMilestoneIndex = -1;

      if (normStage.includes('sheet') || normStage.includes('شيت') || normStage.includes('كلاس')) {
        // Class Sheet = Review 1 (Milestone 0)
        targetMilestoneIndex = 0;
      } else if (normStage.includes('homework') || normStage.includes('واجب')) {
        // Homework = Review 2 (Milestone 1)
        targetMilestoneIndex = updatedMilestones.findIndex(m => m.reviewNumber === 2 || m.daysFromStart === 3);
        if (targetMilestoneIndex === -1) targetMilestoneIndex = 1;
      } else {
        // Next pending milestone
        targetMilestoneIndex = updatedMilestones.findIndex(m => m.status === 'pending');
      }

      if (targetMilestoneIndex >= 0 && targetMilestoneIndex < updatedMilestones.length) {
        updatedMilestones[targetMilestoneIndex] = {
          ...updatedMilestones[targetMilestoneIndex],
          status: 'completed',
          completedAt: todayStr,
          actualReviewDate: todayStr,
          score: 100,
          confidence: 5
        };
      }

      const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
      const nextPending = updatedMilestones.find(m => m.status === 'pending');

      const updatedHistory = [
        ...(item.history || []),
        {
          date: todayStr,
          score: 100,
          intervalDays: item.intervalDays,
          reviewType: stageType || 'تطبيق ومراجعة أسبوعية'
        }
      ];

      const updatedItem: SpacedRepetitionItem = {
        ...item,
        repetitions: Math.max(item.repetitions + 1, completedCount),
        milestones: updatedMilestones,
        nextReviewDate: nextPending ? nextPending.targetDate : item.nextReviewDate,
        history: updatedHistory,
        memoryStrength: Math.min(100, item.memoryStrength + 15),
        retentionEstimate: Math.min(100, item.retentionEstimate + 12)
      };

      list[existingIndex] = updatedItem;
      syncStateWithStorage({ spacedRepetitionReviews: list });
      return list;
    });
  };

  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('study_dark_mode') === 'true');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'offline'>('idle');
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      setIsOnline(true);
      handleManualSyncRequest();
      if (token) loadUserData();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };
    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible' && token && navigator.onLine) {
        loadUserData();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    const handleBeforeUnload = () => {
      if (token && latestStateRef.current && navigator.onLine) {
        try {
          const payload = JSON.stringify({ data: latestStateRef.current });
          if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon('/api/study/save', blob);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const syncInterval = setInterval(() => {
      if (token && navigator.onLine && document.visibilityState === 'visible') {
        loadUserData();
      }
    }, 30000);

    getQueuePendingCount().then(setPendingCount);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(syncInterval);
    };
  }, [token]);

  // Load User and App Data
  useEffect(() => {
    if (token) {
      loadUserData();
    }
  }, [token]);

  // Load theme preference
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('study_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // Populate application state from data object
  const populateState = (data: AppStudyState, userStream?: 'math' | 'science' | 'literature') => {
    const streamToUse = userStream || user?.stream || 'science';
    const trackToUse = user?.curriculumTrack || 'arabic';

    const sanitized = sanitizeUserDataState(
      data.subjects || [],
      data.exams || [],
      data.grades || [],
      data.sessions || [],
      data.tasks || [],
      streamToUse,
      trackToUse
    );

    const hasChange = (data.subjects || []).length !== sanitized.subjects.length ||
                      (data.exams || []).length !== sanitized.exams.length ||
                      (data.grades || []).length !== sanitized.grades.length ||
                      (data.sessions || []).length !== sanitized.sessions.length ||
                      (data.tasks || []).length !== sanitized.tasks.length ||
                      (streamToUse === 'math' && (data.subjects || []).some(s => s.id === 'sub_3'));

    if (hasChange) {
      setTimeout(() => {
        syncStateWithStorage({
          subjects: sanitized.subjects,
          exams: sanitized.exams,
          grades: sanitized.grades,
          sessions: sanitized.sessions,
          tasks: sanitized.tasks
        });
      }, 500);
    }

    setSubjects(sanitized.subjects);
    setSessions(sanitized.sessions);
    setTasks(sanitized.tasks);
    setGoals(data.goals || []);
    setExams(sanitized.exams);
    setChatHistory(data.chatHistory || []);
    if (data.weeklySchedule) {
      setWeeklySchedule(data.weeklySchedule);
      setPlannerActivities(data.weeklySchedule.schedule || []);
    } else {
      setPlannerActivities(data.plannerActivities || []);
    }
    setSleepLogs(data.sleepLogs || []);
    setScreenTimeLogs(data.screenTimeLogs || []);
    setDailyCheckins(data.dailyCheckins || []);
    setGrades(sanitized.grades);

    latestStateRef.current = {
      ...data,
      subjects: sanitized.subjects,
      sessions: sanitized.sessions,
      tasks: sanitized.tasks,
      exams: sanitized.exams,
      grades: sanitized.grades,
      plannerActivities: data.weeklySchedule ? (data.weeklySchedule.schedule || []) : (data.plannerActivities || [])
    };
    
    // Extended attributes loading
    setCountdowns(data.countdowns || []);
    setBurnoutLogs(data.burnoutLogs || []);
    setStressLogs(data.stressLogs || []);
    setAcademicHistory(data.academicHistory || []);
    setNotifSettings(data.notifSettings || {
      emailNotif: true,
      browserNotif: true,
      whatsappNotif: true,
      whatsappTime: '18:00',
      morningSummary: true,
      nightReview: true,
      hydrateReminder: true,
      breakReminder: true,
      sleepReminder: true
    });

    if (data.lifestyleProfile) {
      setLifestyleProfile(data.lifestyleProfile);
    }
    if (data.gamification) {
      setGamification((prev) => {
        const higherXp = Math.max(prev.xp || 0, data.gamification?.xp || 0);
        const higherLevel = Math.max(prev.level || 1, data.gamification?.level || 1, Math.floor(higherXp / 1000) + 1);
        const higherStreak = Math.max(prev.streak || 0, data.gamification?.streak || 0);
        const higherCoins = Math.max(prev.coins || 0, data.gamification?.coins || 0);
        return {
          ...prev,
          ...data.gamification,
          xp: higherXp,
          level: higherLevel,
          streak: higherStreak,
          coins: higherCoins
        };
      });
    }

    const startDateStr = data.thanaweyaStartDate || thanaweyaStartDateRef.current || '2026-08-25';
    thanaweyaStartDateRef.current = startDateStr;
    setThanaweyaStartDate(startDateStr);

    // Calculate actual academic week from start date (DST & Midnight Boundary Safe)
    try {
      const startParts = startDateStr.split('-');
      const start = new Date(parseInt(startParts[0], 10), parseInt(startParts[1], 10) - 1, parseInt(startParts[2], 10), 0, 0, 0, 0);
      const now = new Date();
      const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      
      const diffTime = todayZero.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) {
        const computedWeek = Math.min(Math.max(Math.floor(diffDays / 7) + 1, 1), 52);
        setCurrentAcademicWeek(computedWeek);
      } else {
        setCurrentAcademicWeek(0);
      }
    } catch {
      setCurrentAcademicWeek(data.currentAcademicWeek || 0);
    }

    setSpacedRepetitionReviews(data.spacedRepetitionReviews || []);
    setCustomHistoryLogs(data.customHistoryLogs || []);

    if (data.stats) {
      setNeuroscienceStats(data.stats);
    }

    // Auto-trigger daily check-in modal according to schedule wake-up time if not done today
    const checkins = data.dailyCheckins || [];
    const todayStr = getTodayDateStr();
    const isDoneToday = localStorage.getItem(`checkin_done_${todayStr}`) === 'true';
    const hasCheckin = isDoneToday || checkins.some((c: any) => c && c.date && (c.date === todayStr || c.date.startsWith(todayStr)));

    if (hasCheckin) {
      // Already checked in today - do NOT prompt again today
      setShowCheckinModal(false);
    } else {
      const skippedDate = localStorage.getItem(`checkin_skip_${todayStr}`);
      const postponedUntil = localStorage.getItem(`checkin_postponed_until_${todayStr}`);
      
      const isSkipped = skippedDate === 'true';
      const isPostponed = postponedUntil && Date.now() < Number(postponedUntil);

      if (!isSkipped && !isPostponed) {
        // Calculate wake up schedule check-in target time (1.5 hours after wakeup)
        const wakeup = data.lifestyleProfile?.sleepSchedule?.wakeupTime || '06:30';
        const [h, m] = wakeup.split(':').map(Number);
        const wakeupMinutes = (h || 6) * 60 + (m || 30);
        const targetCheckinMinutes = wakeupMinutes + 90; // 1.5 hours after wakeup

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (currentMinutes >= targetCheckinMinutes) {
          // Time has arrived or passed for today
          setTimeout(() => {
            setShowCheckinModal(true);
          }, 1000);
        } else {
          // Time hasn't arrived yet today - schedule timer for target check-in time
          const msUntilCheckin = Math.max(1000, (targetCheckinMinutes - currentMinutes) * 60 * 1000);
          setTimeout(() => {
            const recheckDone = localStorage.getItem(`checkin_done_${todayStr}`) === 'true';
            if (!recheckDone) {
              setShowCheckinModal(true);
            }
          }, msUntilCheckin);
        }
      }
    }
  };

  // Load state from IndexedDB (falling back to server and LocalStorage)
  const loadUserData = async () => {
    let localCheckins: any[] = [];
    let localWeeklySchedule: WeeklyScheduleData | null = null;
    const todayStr = getTodayDateStr();

    // 1. Immediate IndexedDB local-first hydration with robust retry recovery
    try {
      localCheckins = await getOfflineDailyCheckins();
      console.log("[Daily Check-in]\nLoaded from IndexedDB");

      localWeeklySchedule = await retryRecoverWeeklyScheduleFromIndexedDB({
        maxRetries: 3,
        retryDelayMs: 200,
        userToken: token || undefined
      });

      const localDbData = await getLocalAcademicData<AppStudyState | null>('study_state', null);
      if (localDbData) {
        localCheckins = mergeDailyCheckins(localCheckins, localDbData.dailyCheckins || []);
        localDbData.dailyCheckins = localCheckins;

        if (!localWeeklySchedule && localDbData.weeklySchedule) {
          localWeeklySchedule = localDbData.weeklySchedule;
        }
        if (!localWeeklySchedule && localDbData.plannerActivities && localDbData.plannerActivities.length > 0) {
          localWeeklySchedule = {
            weekId: `week_${todayStr}`,
            generatedAt: new Date().toISOString(),
            version: 1,
            schedule: localDbData.plannerActivities,
            lastUpdated: Date.now(),
            hash: generateScheduleHash(localDbData.plannerActivities)
          };
          await saveOfflineWeeklySchedule(localWeeklySchedule);
        }

        if (localWeeklySchedule) {
          localDbData.weeklySchedule = localWeeklySchedule;
          localDbData.plannerActivities = localWeeklySchedule.schedule;
        }

        populateState(localDbData);
      }

      if (localWeeklySchedule && localWeeklySchedule.schedule && localWeeklySchedule.schedule.length > 0) {
        console.log("[Weekly Schedule] Loaded from IndexedDB");
        console.log("[Weekly Schedule] Restored successfully");
        setWeeklySchedule(localWeeklySchedule);
        setPlannerActivities(localWeeklySchedule.schedule);
      }

      if (localCheckins.length > 0) {
        setDailyCheckins(localCheckins);
      }

      const hasTodayInLocal = localCheckins.some(c => c && c.date && (c.date === todayStr || c.date.startsWith(todayStr)));
      if (hasTodayInLocal) {
        console.log("[Daily Check-in]\nToday's status restored");
      }
    } catch (err) {
      console.warn('IndexedDB initial read warning:', err);
    }

    // 2. Cloud synchronization if online
    if (navigator.onLine) {
      try {
        const res = await fetch('/api/study/data', {
          headers: { 'x-auth-token': token || '' }
        });
        const resData = await res.json();
        
        if (res.ok) {
          console.log("[Daily Check-in]\nLoaded from Firestore");

          if (resData.user) {
            setUser(resData.user);
          }
          if (resData.data) {
            if (resData.data.thanaweyaStartDate) {
              thanaweyaStartDateRef.current = resData.data.thanaweyaStartDate;
              setThanaweyaStartDate(resData.data.thanaweyaStartDate);
            }
            const remoteCheckins = resData.data.dailyCheckins || [];
            const mergedCheckins = mergeDailyCheckins(localCheckins, remoteCheckins);
            resData.data.dailyCheckins = mergedCheckins;

            let remoteWeeklySchedule: WeeklyScheduleData | null = resData.data.weeklySchedule || null;
            if (!remoteWeeklySchedule && resData.data.plannerActivities && resData.data.plannerActivities.length > 0) {
              remoteWeeklySchedule = {
                weekId: `week_${todayStr}`,
                generatedAt: new Date().toISOString(),
                version: 1,
                schedule: resData.data.plannerActivities,
                lastUpdated: Date.now(),
                hash: generateScheduleHash(resData.data.plannerActivities)
              };
            }

            if (remoteWeeklySchedule && remoteWeeklySchedule.schedule && remoteWeeklySchedule.schedule.length > 0) {
              console.log("[Weekly Schedule] Loaded from Firestore");
            }

            // Merge local and remote schedules
            let mergedWeeklySchedule = mergeWeeklySchedules(localWeeklySchedule, remoteWeeklySchedule);

            // If merged is still null (e.g. server had empty schedule and local was loading), retry deep IndexedDB recovery
            if (!mergedWeeklySchedule || !mergedWeeklySchedule.schedule || mergedWeeklySchedule.schedule.length === 0) {
              const fallbackRecovered = await retryRecoverWeeklyScheduleFromIndexedDB({
                maxRetries: 3,
                retryDelayMs: 250,
                userToken: token || undefined
              });
              if (fallbackRecovered && fallbackRecovered.schedule && fallbackRecovered.schedule.length > 0) {
                mergedWeeklySchedule = fallbackRecovered;
              }
            }

            if (mergedWeeklySchedule && mergedWeeklySchedule.schedule && mergedWeeklySchedule.schedule.length > 0) {
              console.log("[Weekly Schedule] Merge completed");
              resData.data.weeklySchedule = mergedWeeklySchedule;
              resData.data.plannerActivities = mergedWeeklySchedule.schedule;

              setWeeklySchedule(mergedWeeklySchedule);
              setPlannerActivities(mergedWeeklySchedule.schedule);

              await saveOfflineWeeklySchedule(mergedWeeklySchedule);
              console.log("[Weekly Schedule] Saved locally");

              const remoteHash = remoteWeeklySchedule?.hash;
              const remoteUpdated = remoteWeeklySchedule?.lastUpdated || 0;
              if (!remoteWeeklySchedule || mergedWeeklySchedule.lastUpdated > remoteUpdated || mergedWeeklySchedule.hash !== remoteHash) {
                await syncStateWithStorage({
                  dailyCheckins: mergedCheckins,
                  weeklySchedule: mergedWeeklySchedule,
                  plannerActivities: mergedWeeklySchedule.schedule
                });
                console.log("[Weekly Schedule] Saved to Firestore");
              }

              console.log("[Weekly Schedule] Restored successfully");
            }

            populateState(resData.data, resData.user?.stream);
            setDailyCheckins(mergedCheckins);

            // Persist the clean, updated remote state to local IndexedDB & localStorage cache
            await setLocalAcademicData('study_state', resData.data);
            try {
              localStorage.setItem(`study_cache_${token}`, JSON.stringify(resData.data));
            } catch (err) {
              // quota safe
            }

            // Save merged checkins to IndexedDB
            await saveOfflineDailyCheckins(mergedCheckins);
            console.log("[Daily Check-in]\nSaved to IndexedDB");

            if (mergedCheckins.length > remoteCheckins.length || JSON.stringify(mergedCheckins) !== JSON.stringify(remoteCheckins)) {
              await syncStateWithStorage({ dailyCheckins: mergedCheckins });
              console.log("[Daily Check-in]\nSaved to Firestore");
            }

            if (mergedCheckins.some(c => c && c.date && (c.date === todayStr || c.date.startsWith(todayStr)))) {
              console.log("[Daily Check-in]\nToday's status restored");
            }
          }
        } else {
          // Server returned non-ok: fallback to IndexedDB retry and LocalStorage
          const fallbackRecovered = await retryRecoverWeeklyScheduleFromIndexedDB({
            maxRetries: 3,
            retryDelayMs: 250,
            userToken: token || undefined
          });
          const cached = localStorage.getItem(`study_cache_${token}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              const merged = mergeDailyCheckins(localCheckins, parsed.dailyCheckins || []);
              parsed.dailyCheckins = merged;
              const mergedSchedule = mergeWeeklySchedules(fallbackRecovered || localWeeklySchedule, parsed.weeklySchedule || null);
              if (mergedSchedule) {
                parsed.weeklySchedule = mergedSchedule;
                parsed.plannerActivities = mergedSchedule.schedule;
                setWeeklySchedule(mergedSchedule);
                setPlannerActivities(mergedSchedule.schedule);
              }
              populateState(parsed);
              setDailyCheckins(merged);
            } catch (err) {
              console.error('Failed to parse cached study state:', err);
            }
          } else if (fallbackRecovered) {
            setWeeklySchedule(fallbackRecovered);
            setPlannerActivities(fallbackRecovered.schedule);
          }
        }
      } catch (e) {
        console.warn('Network offline, using local study replica cache and IndexedDB.');
        const fallbackRecovered = await retryRecoverWeeklyScheduleFromIndexedDB({
          maxRetries: 3,
          retryDelayMs: 250,
          userToken: token || undefined
        });
        const cached = localStorage.getItem(`study_cache_${token}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const merged = mergeDailyCheckins(localCheckins, parsed.dailyCheckins || []);
            parsed.dailyCheckins = merged;
            const mergedSchedule = mergeWeeklySchedules(fallbackRecovered || localWeeklySchedule, parsed.weeklySchedule || null);
            if (mergedSchedule) {
              parsed.weeklySchedule = mergedSchedule;
              parsed.plannerActivities = mergedSchedule.schedule;
              setWeeklySchedule(mergedSchedule);
              setPlannerActivities(mergedSchedule.schedule);
            }
            populateState(parsed);
            setDailyCheckins(merged);
          } catch (err) {
            console.error('Failed to parse cached study state:', err);
          }
        } else if (fallbackRecovered) {
          setWeeklySchedule(fallbackRecovered);
          setPlannerActivities(fallbackRecovered.schedule);
        }
      }
    }
  };

  // Synchronize state back to server and write IndexedDB + cache replica
  const syncStateWithStorage = async (updatedData: Partial<AppStudyState>) => {
    const prev = latestStateRef.current || {};
    let scheduleToSave = updatedData.weeklySchedule ?? prev.weeklySchedule ?? weeklySchedule;
    const currentPlannerActivities = updatedData.plannerActivities ?? prev.plannerActivities ?? plannerActivities;

    if (!scheduleToSave && currentPlannerActivities && currentPlannerActivities.length > 0) {
      scheduleToSave = {
        weekId: `week_${getTodayDateStr()}`,
        generatedAt: new Date().toISOString(),
        version: 1,
        schedule: currentPlannerActivities,
        lastUpdated: Date.now(),
        hash: generateScheduleHash(currentPlannerActivities)
      };
    } else if (scheduleToSave && (updatedData.plannerActivities || currentPlannerActivities)) {
      const activeSchedule = updatedData.plannerActivities || currentPlannerActivities;
      scheduleToSave = {
        ...scheduleToSave,
        schedule: activeSchedule,
        lastUpdated: Date.now(),
        hash: generateScheduleHash(activeSchedule)
      };
    }

    const effectiveStartDate = updatedData.thanaweyaStartDate ?? prev.thanaweyaStartDate ?? thanaweyaStartDateRef.current ?? thanaweyaStartDate;
    if (updatedData.thanaweyaStartDate) {
      thanaweyaStartDateRef.current = updatedData.thanaweyaStartDate;
      setThanaweyaStartDate(updatedData.thanaweyaStartDate);
    }

    const currentGamification = prev.gamification || gamification;
    const effectiveGamification = updatedData.gamification ?? currentGamification;
    const safeGamification: Gamification = {
      ...currentGamification,
      ...(effectiveGamification || {}),
      xp: Math.max(currentGamification?.xp || 0, effectiveGamification?.xp || 0),
      level: Math.max(currentGamification?.level || 1, effectiveGamification?.level || 1, Math.floor(Math.max(currentGamification?.xp || 0, effectiveGamification?.xp || 0) / 1000) + 1),
      coins: Math.max(currentGamification?.coins || 0, effectiveGamification?.coins || 0),
      streak: Math.max(currentGamification?.streak || 0, effectiveGamification?.streak || 0),
      achievements: effectiveGamification?.achievements || currentGamification.achievements,
      dailyMissions: effectiveGamification?.dailyMissions || currentGamification.dailyMissions,
      weeklyMissions: effectiveGamification?.weeklyMissions || currentGamification.weeklyMissions
    };

    const fullState: AppStudyState = {
      ...prev,
      ...updatedData,
      subjects: updatedData.subjects ?? prev.subjects ?? subjects,
      sessions: updatedData.sessions ?? prev.sessions ?? sessions,
      tasks: updatedData.tasks ?? prev.tasks ?? tasks,
      goals: updatedData.goals ?? prev.goals ?? goals,
      exams: updatedData.exams ?? prev.exams ?? exams,
      chatHistory: updatedData.chatHistory ?? prev.chatHistory ?? chatHistory,
      stats: updatedData.stats ?? prev.stats ?? neuroscienceStats,
      plannerActivities: currentPlannerActivities,
      weeklySchedule: scheduleToSave,
      sleepLogs: updatedData.sleepLogs ?? prev.sleepLogs ?? sleepLogs,
      screenTimeLogs: updatedData.screenTimeLogs ?? prev.screenTimeLogs ?? screenTimeLogs,
      dailyCheckins: updatedData.dailyCheckins ?? prev.dailyCheckins ?? dailyCheckins,
      grades: updatedData.grades ?? prev.grades ?? grades,
      countdowns: updatedData.countdowns ?? prev.countdowns ?? countdowns,
      burnoutLogs: updatedData.burnoutLogs ?? prev.burnoutLogs ?? burnoutLogs,
      stressLogs: updatedData.stressLogs ?? prev.stressLogs ?? stressLogs,
      notifSettings: updatedData.notifSettings ?? prev.notifSettings ?? notifSettings,
      lifestyleProfile: updatedData.lifestyleProfile ?? prev.lifestyleProfile ?? lifestyleProfile,
      gamification: safeGamification,
      thanaweyaStartDate: effectiveStartDate,
      spacedRepetitionReviews: updatedData.spacedRepetitionReviews ?? prev.spacedRepetitionReviews ?? spacedRepetitionReviews,
      customHistoryLogs: updatedData.customHistoryLogs ?? prev.customHistoryLogs ?? customHistoryLogs
    };

    latestStateRef.current = fullState;

    // 1. Instant local persistence to IndexedDB + localStorage with QuotaExceeded Protection
    await setLocalAcademicData('study_state', fullState);
    if (scheduleToSave) {
      await saveOfflineWeeklySchedule(scheduleToSave);
      console.log("[Weekly Schedule] Saved locally");
      try {
        localStorage.setItem('last_known_weekly_schedule', JSON.stringify(scheduleToSave));
      } catch (e) {
        // quota safe
      }
    }
    try {
      localStorage.setItem(`study_cache_${token}`, JSON.stringify(fullState));
    } catch (quotaErr) {
      console.warn('[LocalStorage] Quota limit reached; falling back to lightweight cache & IndexedDB:', quotaErr);
      try {
        // Fallback: store lightweight state in localStorage (essential metadata only)
        const lightState = {
          subjects: fullState.subjects?.map(s => ({ id: s.id, name: s.name, totalMinutes: s.totalMinutes })),
          gamification: fullState.gamification,
          thanaweyaStartDate: fullState.thanaweyaStartDate
        };
        localStorage.setItem(`study_cache_${token}`, JSON.stringify(lightState));
      } catch (innerErr) {
        // Safe silence - IndexedDB holds the primary offline data
      }
    }

    // 2. Cloud Sync or Queueing (Debounced to optimize API calls & prevent quota exhaustion)
    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }

    if (navigator.onLine && token) {
      setSyncStatus('syncing');
      syncDebounceRef.current = setTimeout(async () => {
        try {
          await fetch('/api/study/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            },
            body: JSON.stringify({ data: fullState })
          });
          setSyncStatus('success');
          if (scheduleToSave) {
            console.log("[Weekly Schedule] Saved to Firestore");
          }
          setTimeout(() => setSyncStatus('idle'), 3000);
        } catch (e) {
          console.warn('Could not sync with server DB, queued in IndexedDB offline queue.');
          await enqueueOfflineAction('planner_update', fullState);
          setSyncStatus('offline');
          const count = await getQueuePendingCount();
          setPendingCount(count);
        }
      }, 400);
    } else {
      await enqueueOfflineAction('planner_update', fullState);
      setSyncStatus('offline');
      const count = await getQueuePendingCount();
      setPendingCount(count);
    }
  };

  // Process offline sync queue automatically
  const handleManualSyncRequest = async () => {
    if (!navigator.onLine || !token) return;
    setSyncStatus('syncing');
    try {
      const queue = await getPendingSyncQueue();
      for (const item of queue) {
        if (item.payload) {
          await fetch('/api/study/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            },
            body: JSON.stringify({ data: item.payload })
          });
        }
        await dequeueOfflineAction(item.id);
      }

      // Final state check & sync
      const currentState = await getLocalAcademicData<AppStudyState | null>('study_state', null);
      if (currentState) {
        await fetch('/api/study/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify({ data: currentState })
        });
      }

      setSyncStatus('success');
      const remaining = await getQueuePendingCount();
      setPendingCount(remaining);
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      console.error('Manual sync execution failed:', err);
      setSyncStatus('offline');
    }
  };

  // Auth Action Handlers
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
          stream: authStream,
          targetPercentage: authTarget,
          curriculumTrack: authCurriculumTrack,
          academicYear: authAcademicYear
        })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('study_session_token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        setAuthError(data.error || 'فشلت عملية التسجيل');
      }
    } catch (err) {
      setAuthError('حدث عطل بالشبكة أو الخادم');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('study_session_token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        setAuthError(data.error || 'خطأ في البريد أو كلمة المرور');
      }
    } catch (err) {
      setAuthError('حدث عطل بالشبكة أو الخادم');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, newPassword: authPassword })
      });
      const data = await res.json();
      if (res.ok) {
        alert('تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بالرمز الجديد.');
        setAuthMode('login');
      } else {
        setAuthError(data.error || 'فشلت إعادة التعيين');
      }
    } catch (err) {
      setAuthError('حدث عطل بالشبكة');
    }
  };

  const handleLogout = async () => {
    try {
      // 1. Immediately flush any pending sync to the cloud before clearing auth token
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
        syncDebounceRef.current = null;
      }
      if (token && latestStateRef.current && navigator.onLine) {
        try {
          await fetch('/api/study/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            },
            body: JSON.stringify({ data: latestStateRef.current })
          });
        } catch (syncErr) {
          console.warn('Final logout sync warning:', syncErr);
        }
      }

      if (token) {
        localStorage.removeItem(`study_cache_${token}`);
      }
      localStorage.removeItem('study_session_token');
      setToken(null);
      setUser(null);
      setAuthMode('login');
      latestStateRef.current = null;

      // Cleanly reset UI state in memory without triggering auto-sync to IndexedDB
      setSubjects([]);
      setSessions([]);
      setTasks([]);
      setGoals([]);
      setExams([]);
      setWeeklySchedule(null);
      setPlannerActivities([]);
      setSleepLogs([]);
      setScreenTimeLogs([]);
      setDailyCheckins([]);
      setGrades([]);
      setCountdowns([]);
      setBurnoutLogs([]);
      setStressLogs([]);
      setAcademicHistory([]);
      setSpacedRepetitionReviews([]);
      setCustomHistoryLogs([]);
      setChatHistory([]);
    } catch (e) {
      console.warn('Logout cleanup error:', e);
    }
  };

  // State modification triggers with automated syncing
  const handleAddSubject = (newSub: Omit<Subject, 'id' | 'totalMinutes'>) => {
    const id = 'sub_' + Math.random().toString(36).substring(2, 9);
    const added: Subject = { ...newSub, id, totalMinutes: 0 };
    const list = [...subjects, added];
    setSubjects(list);
    syncStateWithStorage({ subjects: list });
  };

  const handleEditSubject = (id: string, updated: Partial<Subject>) => {
    const list = subjects.map((sub) => (sub.id === id ? { ...sub, ...updated } : sub));
    setSubjects(list);
    syncStateWithStorage({ subjects: list });
  };

  const handleDeleteSubject = (id: string) => {
    const list = subjects.filter((sub) => sub.id !== id);
    setSubjects(list);
    syncStateWithStorage({ subjects: list });
  };

  const handleResetSubjectsToDefault = () => {
    const defaultList = getDefaultSubjects(user?.stream || 'science', user?.curriculumTrack || 'arabic');
    setSubjects(defaultList);
    syncStateWithStorage({ subjects: defaultList });
  };

  const handleAddTask = (newTask: Omit<Task, 'id'>) => {
    const id = 'task_' + Math.random().toString(36).substring(2, 9);
    const added: Task = { ...newTask, id };
    const list = [...tasks, added];
    setTasks(list);
    syncStateWithStorage({ tasks: list });
  };

  const handleToggleTask = (id: string) => {
    let isNowCompleted = false;
    const list = tasks.map((t) => {
      if (t.id === id) {
        const nextStatus = (t.status === 'todo' ? 'done' : 'todo') as any;
        if (nextStatus === 'done') isNowCompleted = true;
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'done' ? new Date().toISOString() : undefined
        };
      }
      return t;
    });

    setTasks(list);

    // Update Gamification XP and Task-based Streak
    const xpGain = isNowCompleted ? 35 : -15;
    const coinsGain = isNowCompleted ? 10 : 0;
    const newXp = Math.max(0, gamification.xp + xpGain);
    const newCoins = Math.max(0, gamification.coins + coinsGain);
    const newLevel = Math.max(1, Math.floor(newXp / 1000) + 1);

    // Evaluate task-based streak (strictly requires 75% tasks completed)
    const evaluatedGamification = evaluateGamificationStreak(
      {
        ...gamification,
        xp: newXp,
        coins: newCoins,
        level: newLevel
      },
      plannerActivities,
      list,
      'three_fourths'
    );

    const updatedDaily = evaluatedGamification.dailyMissions.map((m) => {
      if (isNowCompleted && !m.completed) {
        const newCurrent = Math.min(m.target, m.current + 1);
        return {
          ...m,
          current: newCurrent,
          completed: newCurrent >= m.target
        };
      }
      return m;
    });

    const updated = {
      ...evaluatedGamification,
      dailyMissions: updatedDaily
    };

    setGamification(updated);
    syncStateWithStorage({ tasks: list, gamification: updated });
  };

  const handleDeleteTask = (id: string) => {
    const list = tasks.filter((t) => t.id !== id);
    setTasks(list);
    syncStateWithStorage({ tasks: list });
  };

  const handleAddExam = (newExam: Omit<Exam, 'id'>) => {
    const id = 'exam_' + Math.random().toString(36).substring(2, 9);
    const added: Exam = { ...newExam, id };
    const list = [...exams, added];
    setExams(list);
    syncStateWithStorage({ exams: list });
  };

  const handleRecordExamGrade = (id: string, score: number, topScore?: number) => {
    const list = exams.map((e) => (e.id === id ? { ...e, score, topScore: topScore !== undefined ? topScore : e.topScore } : e));
    setExams(list);
    syncStateWithStorage({ exams: list });
  };

  const handleDeleteExam = (id: string) => {
    const list = exams.filter((e) => e.id !== id);
    setExams(list);
    syncStateWithStorage({ exams: list });
  };

  const handleAddSleepLog = (log: any) => {
    const id = 'sleep_' + Math.random().toString(36).substring(2, 9);
    const list = [...sleepLogs, { ...log, id }];
    setSleepLogs(list);
    syncStateWithStorage({ sleepLogs: list });
  };

  const handleAddScreenTimeLog = (log: any) => {
    const id = 'screen_' + Math.random().toString(36).substring(2, 9);
    const list = [...screenTimeLogs, { ...log, id }];
    setScreenTimeLogs(list);
    syncStateWithStorage({ screenTimeLogs: list });
  };

  const adaptTodaySchedule = (checkin: any) => {
    const todayDayOfWeek = new Date().getDay();
    
    setPlannerActivities((prevActivities) => {
      let todayActs = prevActivities.filter(act => act.dayOfWeek === todayDayOfWeek);
      const otherActs = prevActivities.filter(act => act.dayOfWeek !== todayDayOfWeek);
      
      if (todayActs.length === 0) return prevActivities;

      const isPoorSleep = (checkin.sleepHours && checkin.sleepHours < 6) || checkin.sleepQuality === 'poor';
      const isHighFocus = checkin.focusLevel && checkin.focusLevel >= 4;
      const isLowMotivation = checkin.motivation && checkin.motivation <= 2;
      const isHighStress = checkin.stress && checkin.stress >= 4;
      const isHighEnergy = checkin.energy && checkin.energy >= 4;

      todayActs = todayActs.map((act) => {
        let notes = act.notes || '';
        let todayGoal = act.todayGoal || '';

        if ((isPoorSleep || isHighStress) && act.category === 'Study') {
          if (!notes.includes('تعديل الجدول')) {
            notes += ` [🧠 تعديل المنظم الأكاديمي: تم تقليص الجهد المعرفي لضمان راحتك النفسية والتركيز الهادئ.]`;
            todayGoal = `🧘 ${todayGoal} (مع فترات راحة أطول لتقليل الإجهاد)`;
          }
        }

        if (isHighEnergy && !notes.includes('طاقتك مذهلة')) {
          notes += ` [⚡ طاقتك مذهلة اليوم! يمكنك زيادة طول جلسات التركيز لإنهاء مهام أكبر.]`;
        }

        return {
          ...act,
          notes,
          todayGoal
        };
      });

      if (isHighFocus || isLowMotivation) {
        const studyActs = todayActs.filter(act => ['Study', 'Revision', 'Active Recall', 'Homework'].includes(act.category));
        const nonStudyActs = todayActs.filter(act => !['Study', 'Revision', 'Active Recall', 'Homework'].includes(act.category));
        
        if (studyActs.length > 1) {
          studyActs.sort((a, b) => {
            if (isHighFocus) {
              if (a.priority === 'high' && b.priority !== 'high') return -1;
              if (a.priority !== 'high' && b.priority === 'high') return 1;
              return 0;
            } else {
              if (a.priority === 'low' && b.priority !== 'low') return -1;
              if (a.priority !== 'low' && b.priority === 'low') return 1;
              return 0;
            }
          });
          
          const times = todayActs
            .filter(act => ['Study', 'Revision', 'Active Recall', 'Homework'].includes(act.category))
            .map(act => ({ start: act.startTime, end: act.endTime }))
            .sort((a, b) => a.start.localeCompare(b.start));
          
          studyActs.forEach((act, idx) => {
            if (times[idx]) {
              act.startTime = times[idx].start;
              act.endTime = times[idx].end;
              if (isHighFocus && !act.notes?.includes('تركيزك عالي')) {
                act.notes = (act.notes || '') + ' [🧠 تركيزك عالي اليوم! تم تقديم المواد الصعبة أولاً لضمان أقصى استيعاب.]';
              } else if (isLowMotivation && !act.notes?.includes('الحماس منخفض')) {
                act.notes = (act.notes || '') + ' [🔥 الحماس منخفض اليوم. لنبدأ بمادة سهلة ولطيفة لبناء الزخم الدراسي تدريجياً!]';
              }
            }
          });
        }
        
        todayActs = [...studyActs, ...nonStudyActs];
      }

      const updatedList = [...otherActs, ...todayActs];
      
      setTimeout(() => {
        syncStateWithStorage({ plannerActivities: updatedList });
      }, 500);

      return updatedList;
    });
  };

  const handleAddDailyCheckin = async (checkin: any) => {
    const todayStr = getTodayDateStr();
    const timestamp = Date.now();
    const completedAt = new Date().toISOString();
    const checkinWithDate = { date: todayStr, completedAt, timestamp, ...checkin };

    // Mark checkin as completed for today in localStorage to ensure no duplicate prompts
    localStorage.setItem(`checkin_done_${todayStr}`, 'true');

    // Update lifestyleProfile wake-up time if user specified a wakeup time in check-in
    let updatedLifestyle = lifestyleProfile;
    if (checkin.wakeupTime && checkin.wakeupTime !== lifestyleProfile?.sleepSchedule?.wakeupTime) {
      updatedLifestyle = {
        ...lifestyleProfile,
        sleepSchedule: {
          ...lifestyleProfile.sleepSchedule,
          wakeupTime: checkin.wakeupTime
        }
      };
      setLifestyleProfile(updatedLifestyle);
    }

    // Ensure no duplicate check-ins exist for the same date
    const existingIndex = dailyCheckins.findIndex(c => c && c.date && (c.date === todayStr || c.date.startsWith(todayStr)));
    let list: any[];
    
    if (existingIndex >= 0) {
      const updated = [...dailyCheckins];
      updated[existingIndex] = { ...updated[existingIndex], ...checkinWithDate };
      list = updated;
    } else {
      const id = 'checkin_' + timestamp + '_' + Math.random().toString(36).substring(2, 6);
      list = [...dailyCheckins, { ...checkinWithDate, id }];
    }
    
    // 1. Update React local state
    setDailyCheckins(list);

    // 2. Save offline copy to IndexedDB
    await saveOfflineDailyCheckins(list);
    console.log("[Daily Check-in]\nSaved to IndexedDB");

    // 3. Save to Firestore immediately
    await syncStateWithStorage({ dailyCheckins: list, lifestyleProfile: updatedLifestyle });
    console.log("[Daily Check-in]\nSaved to Firestore");

    console.log("[Daily Check-in]\nToday's status restored");

    setShowCheckinModal(false);
    
    adaptTodaySchedule(checkinWithDate);
  };

  const handleAddGrade = (grade: any) => {
    const id = 'grade_' + Math.random().toString(36).substring(2, 9);
    const list = [...grades, { ...grade, id }];
    setGrades(list);
    syncStateWithStorage({ grades: list });
  };

  const handleDeleteGrade = (id: string) => {
    const list = grades.filter((g) => g.id !== id);
    setGrades(list);
    syncStateWithStorage({ grades: list });
  };

  const handleAddPlannerActivity = (activity: any) => {
    const id = 'act_' + Math.random().toString(36).substring(2, 9);
    const list = [...plannerActivities, { ...activity, id }];
    const updatedSchedule: WeeklyScheduleData = {
      weekId: weeklySchedule?.weekId || `week_${getTodayDateStr()}`,
      generatedAt: weeklySchedule?.generatedAt || new Date().toISOString(),
      version: (weeklySchedule?.version || 1),
      schedule: list,
      lastUpdated: Date.now(),
      hash: generateScheduleHash(list)
    };
    setWeeklySchedule(updatedSchedule);
    setPlannerActivities(list);
    syncStateWithStorage({ weeklySchedule: updatedSchedule, plannerActivities: list });
  };

  const handleDeletePlannerActivity = (id: string) => {
    const list = plannerActivities.filter((act) => act.id !== id);
    const updatedSchedule: WeeklyScheduleData = {
      weekId: weeklySchedule?.weekId || `week_${getTodayDateStr()}`,
      generatedAt: weeklySchedule?.generatedAt || new Date().toISOString(),
      version: (weeklySchedule?.version || 1),
      schedule: list,
      lastUpdated: Date.now(),
      hash: generateScheduleHash(list)
    };
    setWeeklySchedule(updatedSchedule);
    setPlannerActivities(list);
    syncStateWithStorage({ weeklySchedule: updatedSchedule, plannerActivities: list });
  };

  const handleUpdatePlannerActivity = (updatedActivity: PlannerActivity) => {
    const existingAct = plannerActivities.find(a => a.id === updatedActivity.id);
    const oldTitle = existingAct ? (existingAct.lessonName || existingAct.title) : '';
    const newTitle = updatedActivity.lessonName || updatedActivity.title;

    // Clean duplicate prefixes from updatedActivity.title if present
    let cleanTitle = updatedActivity.title;
    if (updatedActivity.subjectId) {
      const sub = subjects.find(s => s.id === updatedActivity.subjectId);
      if (sub) {
        const subPrefix = sub.name.split(' (')[0];
        const doubleSubPattern = new RegExp(`^${subPrefix}\\s*-\\s*${subPrefix}\\s*-\\s*`, 'i');
        cleanTitle = cleanTitle.replace(doubleSubPattern, `${subPrefix} - `);
      }
    }
    const cleanUpdatedActivity = {
      ...updatedActivity,
      title: cleanTitle
    };

    const list = plannerActivities.map((act) => act.id === cleanUpdatedActivity.id ? cleanUpdatedActivity : act);
    const updatedSchedule: WeeklyScheduleData = {
      weekId: weeklySchedule?.weekId || `week_${getTodayDateStr()}`,
      generatedAt: weeklySchedule?.generatedAt || new Date().toISOString(),
      version: (weeklySchedule?.version || 1),
      schedule: list,
      lastUpdated: Date.now(),
      hash: generateScheduleHash(list)
    };
    setWeeklySchedule(updatedSchedule);
    setPlannerActivities(list);
    syncStateWithStorage({ weeklySchedule: updatedSchedule, plannerActivities: list });

    if (oldTitle && newTitle && oldTitle !== newTitle && updatedActivity.subjectId) {
      syncLessonRename(updatedActivity.subjectId, oldTitle, newTitle, updatedActivity.id);
    }
  };

  const handleOptimizeSchedule = (optimizedList: any[]) => {
    const newWeeklySchedule: WeeklyScheduleData = {
      weekId: `week_${getTodayDateStr()}`,
      generatedAt: new Date().toISOString(),
      version: (weeklySchedule?.version || 0) + 1,
      schedule: optimizedList,
      lastUpdated: Date.now(),
      hash: generateScheduleHash(optimizedList)
    };
    setWeeklySchedule(newWeeklySchedule);
    setPlannerActivities(optimizedList);
    saveOfflineWeeklySchedule(newWeeklySchedule);
    console.log("[Weekly Schedule] Saved locally");
    syncStateWithStorage({ weeklySchedule: newWeeklySchedule, plannerActivities: optimizedList });
  };

  const parseTimeStringToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const handleTogglePlannerActivityCompletion = (id: string, updates?: Partial<PlannerActivity>) => {
    const act = plannerActivities.find(a => a.id === id);
    if (!act) return;

    const isGoingToComplete = !act.completed;

    // Only prompt for academic study activities when going to complete
    if (isGoingToComplete && act.subjectId) {
      const sub = subjects.find(s => s.id === act.subjectId);
      const startMins = parseTimeStringToMinutes(act.startTime);
      const endMins = parseTimeStringToMinutes(act.endTime);
      let duration = endMins - startMins;
      if (duration < 0) duration += 24 * 60; // handle midnight wrap around

      setStageCompletionModal({
        activityId: act.id,
        subjectId: act.subjectId,
        subjectName: sub ? sub.name : 'المادة الدراسية',
        defaultDurationMinutes: duration || 90,
        stage: act.currentStage || (act.category === 'Homework' ? 'Homework' : act.category === 'Active Recall' ? 'Active Recall' : 'Lesson'),
      });
      return;
    }

    // Otherwise, toggle instantly (e.g. non-academic, or uncompleting)
    processPlannerActivityCompletionToggle(id, updates);
  };

  const handleMissActivity = async (activityId: string, reason: string) => {
    if (!token) return;
    try {
      const response = await fetch('/api/ai/reschedule-missed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ activityId, reason })
      });
      if (!response.ok) throw new Error('Rescheduling failed');
      const data = await response.json();
      if (data.plannerActivities) {
        setPlannerActivities(data.plannerActivities);
      }
    } catch (err) {
      console.error('Error in handleMissActivity:', err);
    }
  };

  const processPlannerActivityCompletionToggle = (
    id: string, 
    updates?: Partial<PlannerActivity> & { 
      actualDurationMinutes?: number, 
      stage?: string, 
      completionStatus?: 'completed' | 'partially' | 'not_completed',
      partiallyCompletedPercent?: number,
      incompleteReason?: string
    }
  ) => {
    let xpGain = 0;
    let coinsGain = 0;
    let isNowCompleted = false;

    const list = plannerActivities.map((act) => {
      if (act.id === id) {
        const status = updates?.completionStatus || (updates?.partiallyCompletedPercent !== undefined ? 'partially' : updates?.incompleteReason ? 'not_completed' : (!act.completed ? 'completed' : 'uncompleted'));
        const isCompleted = status === 'completed';
        isNowCompleted = isCompleted;
        
        if (isCompleted) {
          // 5 XP per completed task/commitment
          xpGain = 5;
          coinsGain = 0;
        } else if (status === 'partially') {
          xpGain = 2;
          coinsGain = 0;
        } else {
          // Reverting completed commitment
          xpGain = -5;
          coinsGain = 0;
        }

        const pct = updates?.partiallyCompletedPercent;
        const remainingStr = pct ? `متبقي ${100 - pct}% للاستكمال` : act.remainingStageTime;
        const newLessonName = (updates as any)?.lessonName || (updates as any)?.title || act.lessonName || act.title;

        return { 
          ...act, 
          completed: isCompleted,
          title: newLessonName,
          lessonName: newLessonName,
          partiallyCompletedPercent: pct !== undefined ? pct : act.partiallyCompletedPercent,
          remainingStageTime: remainingStr,
          incompleteReason: updates?.incompleteReason || act.incompleteReason,
          actualDurationMinutes: updates?.actualDurationMinutes !== undefined ? updates.actualDurationMinutes : act.actualDurationMinutes,
          currentStage: updates?.stage || act.currentStage,
          notes: updates?.notes || act.notes
        };
      }
      return act;
    });

    setPlannerActivities(list);
    const updatedSchedule: WeeklyScheduleData = {
      ...(weeklySchedule || {
        weekId: `week_${getTodayDateStr()}`,
        generatedAt: new Date().toISOString(),
        version: 1
      }),
      schedule: list,
      lastUpdated: Date.now(),
      hash: generateScheduleHash(list)
    };
    setWeeklySchedule(updatedSchedule);

    let nextSessions = sessions;
    const isStudyingDone = (isNowCompleted || updates?.completionStatus === 'partially' || (updates?.partiallyCompletedPercent !== undefined && updates.partiallyCompletedPercent > 0));
    // If completing with duration input, log as a study session so external study hours (center lectures, homework, sheets) are calculated in daily hours
    if (isStudyingDone && updates?.actualDurationMinutes !== undefined && updates.actualDurationMinutes > 0) {
      const act = plannerActivities.find(a => a.id === id);
      const subObj = subjects.find(s => s.id === act?.subjectId);
      const actualMinutes = updates.actualDurationMinutes;
      const lessonTitle = (updates as any)?.lessonName || (updates as any)?.title || act?.lessonName || act?.title || 'حصة / جلسة دراسية';

      const newSession: StudySession = {
        id: 'session_act_' + id + '_' + Date.now(),
        subjectId: act?.subjectId || 'sub_general',
        subjectName: subObj?.name || 'مذاكرة عامة',
        duration: actualMinutes * 60, // in seconds
        durationMinutes: actualMinutes,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        method: 'Practice Questions',
        focusScore: 95,
        cognitiveEnergyBefore: 85,
        cognitiveEnergyAfter: 80,
        notes: `جلسة مذاكرة: ${lessonTitle}`
      };

      nextSessions = [newSession, ...sessions];
      setSessions(nextSessions);
    }

    let updatedSubjects = subjects;
    // Apply subject metrics if completing with duration input
    if (isStudyingDone && updates?.actualDurationMinutes !== undefined && updates.actualDurationMinutes > 0) {
      const act = plannerActivities.find(a => a.id === id);
      if (act && act.subjectId) {
        const actualMinutes = updates.actualDurationMinutes;
        const rawStage = updates.stage || act.currentStage || 'Lesson';

        const normalizeStageNameLocal = (stageInput: number | string): string => {
          const s = String(stageInput || '').trim().toLowerCase();
          if (s === '1' || s.includes('lesson') || s.includes('study') || s.includes('شرح') || s.includes('حصة')) return 'Lesson';
          if (s === '2' || s.includes('sheet') || s.includes('class') || s.includes('worksheet') || s.includes('assignment') || s.includes('شيت') || s.includes('تدريب')) return 'Class Sheet';
          if (s === '3' || s.includes('homework') || s.includes('واجب')) return 'Homework';
          if (s === '4' || s.includes('recall') || s.includes('active') || s.includes('استرجاع') || s.includes('تذكر')) return 'Active Recall';
          if (s === '6' || s.includes('monthly') || s.includes('شهرية')) return 'Monthly Review';
          if (s === '5' || s.includes('weekly') || s.includes('أسبوعية') || s.includes('review') || s.includes('revision') || s.includes('مراجعة')) return 'Weekly Review';
          return 'Lesson';
        };

        const stage = normalizeStageNameLocal(rawStage);

        updatedSubjects = subjects.map((sub) => {
          if (sub.id === act.subjectId) {
            const totalMinutes = (sub.totalMinutes || 0) + actualMinutes;
            const stageLogs = sub.stageLogs || [];
            const updatedStageLogs = [
              ...stageLogs,
              { stage, actualMinutes, timestamp: new Date().toISOString() }
            ];

            // Filter logs for THIS stage only
            const logsForStage = updatedStageLogs.filter(log => normalizeStageNameLocal(log.stage) === stage);
            
            // 4-week rolling average for THIS stage
            const fourWeeksAgoMs = Date.now() - 28 * 24 * 60 * 60 * 1000;
            const recentStageLogs = logsForStage.filter(log => !log.timestamp || new Date(log.timestamp).getTime() >= fourWeeksAgoMs);
            const activeLogs = recentStageLogs.length > 0 ? recentStageLogs : logsForStage;
            const avg = Math.round(activeLogs.reduce((sum, log) => sum + log.actualMinutes, 0) / activeLogs.length);

            // Update stageAverages for THIS stage ONLY
            const stageAverages = { ...(sub.stageAverages || {}) };
            stageAverages[stage] = avg;

            const isLesson = stage === 'Lesson';
            const isWorksheet = stage === 'Class Sheet';
            const isHomework = stage === 'Homework';
            const isRecall = stage === 'Active Recall';
            const isWeeklyReview = stage === 'Weekly Review';
            const isMonthlyReview = stage === 'Monthly Review';

            const lessonsCompleted = isLesson ? (sub.lessonsCompleted || 0) + 1 : (sub.lessonsCompleted || 0);
            const classSheetsCompleted = isWorksheet ? (sub.classSheetsCompleted || 0) + 1 : (sub.classSheetsCompleted || 0);
            const homeworkCompleted = isHomework ? (sub.homeworkCompleted || 0) + 1 : (sub.homeworkCompleted || 0);
            const activeRecallSessions = isRecall ? (sub.activeRecallSessions || 0) + 1 : (sub.activeRecallSessions || 0);
            const weeklyReviews = isWeeklyReview ? (sub.weeklyReviews || 0) + 1 : (sub.weeklyReviews || 0);
            const monthlyReviews = isMonthlyReview ? (sub.monthlyReviews || 0) + 1 : (sub.monthlyReviews || 0);

            const totalStudyHours = (sub.totalStudyHours || 0) + (actualMinutes / 60);

            const avgLessonDuration = isLesson ? avg : (sub.avgLessonDuration || stageAverages['Lesson'] || 0);
            const avgWorksheetDuration = isWorksheet ? avg : (sub.avgWorksheetDuration || stageAverages['Class Sheet'] || 0);
            const avgHomeworkDuration = isHomework ? avg : (sub.avgHomeworkDuration || stageAverages['Homework'] || 0);
            const avgRecallDuration = isRecall ? avg : (sub.avgRecallDuration || stageAverages['Active Recall'] || 0);
            const avgReviewDuration = isWeeklyReview ? avg : (sub.avgReviewDuration || stageAverages['Weekly Review'] || 0);

            const targetMins = sub.targetMinutesPerWeek || 200;
            const completionPercent = Math.min(100, Math.round((totalMinutes / targetMins) * 100));

            return {
              ...sub,
              totalMinutes,
              stageLogs: updatedStageLogs,
              stageAverages,
              lessonsCompleted,
              classSheetsCompleted,
              homeworkCompleted,
              activeRecallSessions,
              weeklyReviews,
              monthlyReviews,
              totalStudyHours,
              avgLessonDuration,
              avgWorksheetDuration,
              avgHomeworkDuration,
              avgRecallDuration,
              avgReviewDuration,
              completionPercent
            };
          }
          return sub;
        });

        setSubjects(updatedSubjects);
      }
    }

    // Atomic Sync to Spaced Repetition (المراجعات الذكية)
    let nextSpacedReviews = spacedRepetitionReviews;
    if (isStudyingDone && (updates as any)?.syncToSpacedRepetition !== false) {
      const act = plannerActivities.find(a => a.id === id);
      const subId = act?.subjectId;
      const subObj = subjects.find(s => s.id === subId);
      const subName = subObj?.name || 'المادة الدراسية';
      const cleanLessonName = String((updates as any)?.lessonName || (updates as any)?.title || act?.lessonName || act?.title || '').trim();

      if (subId && cleanLessonName) {
        const rawStage = updates?.stage || act?.currentStage || (act?.category === 'Homework' ? 'Homework' : act?.category === 'Active Recall' ? 'Active Recall' : 'Lesson');
        const stageNorm = String(rawStage).toLowerCase();
        const todayStr = new Date().toISOString().split('T')[0];

        const cleanNameLower = cleanLessonName.toLowerCase();
        let existingIndex = nextSpacedReviews.findIndex(item => 
          item.subjectId === subId && 
          (item.lessonName.toLowerCase() === cleanNameLower || item.lessonName.toLowerCase().includes(cleanNameLower) || cleanNameLower.includes(item.lessonName.toLowerCase()))
        );

        let listSR = [...nextSpacedReviews];
        let item: SpacedRepetitionItem;

        if (existingIndex === -1) {
          const baseDate = new Date(todayStr + 'T00:00:00');
          const intervals = [1, 3, 7, 14, 30, 60, 90, 180];
          const lessonId = 'les_' + Math.random().toString(36).substring(2, 9);

          const milestones: SpacedRepetitionMilestone[] = intervals.map((days, index) => {
            const targetDate = new Date(baseDate.getTime());
            targetDate.setDate(targetDate.getDate() + days);
            const dateStr = targetDate.toISOString().split('T')[0];
            return {
              daysFromStart: days,
              targetDate: dateStr,
              status: 'pending' as const,
              lessonId,
              subject: subName,
              unit: 'الوحدة الدراسية',
              reviewNumber: index + 1,
              plannedReviewDate: dateStr,
              memoryStrength: Math.round(Math.max(20, 100 - (days / (index + 1)) * 2)),
              retentionEstimate: Math.round(Math.max(15, 100 - (days / (index + 1)) * 3)),
              priority: 'medium' as const,
              difficulty: 'medium' as const,
              confidence: null
            };
          });

          const nextDate = new Date(baseDate.getTime());
          nextDate.setDate(nextDate.getDate() + 1);

          item = {
            id: 'sr_' + Math.random().toString(36).substring(2, 9),
            lessonId,
            lessonName: cleanLessonName,
            subjectId: subId,
            subjectName: subName,
            unitName: 'الوحدة الدراسية',
            studiedDate: todayStr,
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
          listSR.unshift(item);
          existingIndex = 0;
        } else {
          item = { ...listSR[existingIndex] };
        }

        const updatedMilestones = item.milestones ? [...item.milestones] : [];
        let targetMilestoneIndex = -1;

        if (stageNorm.includes('sheet') || stageNorm.includes('شيت') || stageNorm.includes('كلاس')) {
          targetMilestoneIndex = 0;
        } else if (stageNorm.includes('homework') || stageNorm.includes('واجب')) {
          targetMilestoneIndex = updatedMilestones.findIndex(m => m.reviewNumber === 2 || m.daysFromStart === 3);
          if (targetMilestoneIndex === -1) targetMilestoneIndex = 1;
        } else if (stageNorm.includes('review') || stageNorm.includes('recall') || stageNorm.includes('مراجعة') || stageNorm.includes('استرجاع')) {
          targetMilestoneIndex = updatedMilestones.findIndex(m => m.status === 'pending');
        }

        if (targetMilestoneIndex >= 0 && targetMilestoneIndex < updatedMilestones.length) {
          updatedMilestones[targetMilestoneIndex] = {
            ...updatedMilestones[targetMilestoneIndex],
            status: 'completed',
            completedAt: todayStr,
            actualReviewDate: todayStr,
            score: 100,
            confidence: 5
          };
        }

        const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
        const nextPending = updatedMilestones.find(m => m.status === 'pending');

        const updatedHistory = [
          ...(item.history || []),
          {
            date: todayStr,
            score: 100,
            intervalDays: item.intervalDays,
            reviewType: rawStage
          }
        ];

        const updatedItem: SpacedRepetitionItem = {
          ...item,
          studiedDate: item.studiedDate || todayStr,
          repetitions: Math.max(item.repetitions + 1, completedCount),
          milestones: updatedMilestones,
          nextReviewDate: nextPending ? nextPending.targetDate : item.nextReviewDate,
          history: updatedHistory,
          memoryStrength: Math.min(100, item.memoryStrength + 15),
          retentionEstimate: Math.min(100, item.retentionEstimate + 12)
        };

        listSR[existingIndex] = updatedItem;
        nextSpacedReviews = listSR;
        setSpacedRepetitionReviews(nextSpacedReviews);
      }
    }

    // Apply Gamification State changes
    const newXP = Math.max(0, gamification.xp + xpGain);
    const newCoins = Math.max(0, gamification.coins + coinsGain);
    
    // Strict 75% streak rule: Streak is earned/maintained ONLY when 75% is achieved, resets to 0 if missed
    const streakResult = computeTaskBasedStreak(list, tasks, 'three_fourths');
    const newStreak = streakResult.streak;
    const todayAcademicStr = streakResult.todayStats.dateStr;

    // Dynamic Level logic: continuous formula avoiding overflow/caps
    const newLevel = Math.max(1, Math.floor(newXP / 1000) + 1);

    // Update Daily & Weekly Mission progress
    const updatedDaily = gamification.dailyMissions.map((mission) => {
      if (isNowCompleted && !mission.completed) {
        const newCurrent = Math.min(mission.target, mission.current + 1);
        const isCompletedNow = newCurrent >= mission.target;
        return {
          ...mission,
          current: newCurrent,
          completed: isCompletedNow
        };
      }
      return mission;
    });

    const updatedWeekly = gamification.weeklyMissions.map((mission) => {
      if (isNowCompleted && !mission.completed) {
        const newCurrent = Math.min(mission.target, mission.current + 1);
        const isCompletedNow = newCurrent >= mission.target;
        return {
          ...mission,
          current: newCurrent,
          completed: isCompletedNow
        };
      }
      return mission;
    });

    // Update Achievements progress
    const updatedAchievements = gamification.achievements.map((ach) => {
      if (!ach.completed) {
        let shouldUnlock = false;
        if (ach.id === 'ach_1' && isNowCompleted) {
          shouldUnlock = true;
        } else if (ach.id === 'ach_2' && newStreak >= 3) {
          shouldUnlock = true;
        } else if (ach.id === 'ach_3') {
          const completedCount = list.filter(a => a.completed).length;
          if (completedCount >= 5) {
            shouldUnlock = true;
          }
        }

        if (shouldUnlock) {
          return {
            ...ach,
            completed: true,
            unlockedAt: new Date().toISOString()
          };
        }
      }
      return ach;
    });

    const updatedGamification: Gamification = {
      ...gamification,
      xp: newXP,
      coins: newCoins,
      streak: newStreak,
      lastCompletedDate: isNowCompleted ? todayAcademicStr : gamification.lastCompletedDate,
      level: newLevel,
      achievements: updatedAchievements,
      dailyMissions: updatedDaily,
      weeklyMissions: updatedWeekly
    };

    setGamification(updatedGamification);

    // Unified instant synchronization
    syncStateWithStorage({
      plannerActivities: list,
      weeklySchedule: updatedSchedule,
      sessions: nextSessions,
      subjects: updatedSubjects,
      spacedRepetitionReviews: nextSpacedReviews,
      gamification: updatedGamification
    });
  };

  // Complete study session from Timer
  const handleSessionComplete = (session: {
    subjectId: string;
    subjectName: string;
    duration: number;
    method: any;
    focusScore: number;
  }) => {
    const id = 'session_' + Math.random().toString(36).substring(2, 9);
    const completedSession: StudySession = {
      ...session,
      id,
      cognitiveEnergyBefore: neuroscienceStats.dailyCognitiveEnergy,
      cognitiveEnergyAfter: Math.max(neuroscienceStats.dailyCognitiveEnergy - 15, 20),
      timestamp: new Date().toISOString()
    };

    // Update subject accumulated minutes
    const updatedSubjects = subjects.map((sub) =>
      sub.id === session.subjectId
        ? { ...sub, totalMinutes: sub.totalMinutes + Math.round(session.duration / 60) }
        : sub
    );

    const updatedSessions = [...sessions, completedSession];
    
    // Recalculate daily cognitive energy and consistency
    const nextEnergy = Math.max(neuroscienceStats.dailyCognitiveEnergy - 10, 30);
    const nextStats = {
      ...neuroscienceStats,
      dailyCognitiveEnergy: nextEnergy,
      consistencyScore: Math.min(neuroscienceStats.consistencyScore + 2, 100)
    };

    // Calculate XP gained: 50 XP per hour of focus study, scaled by focus score (min 15 XP)
    const focusHours = Math.max(0.2, session.duration / 3600);
    const focusRatio = (session.focusScore || 85) / 100;
    const earnedXP = Math.max(15, Math.round(focusHours * 50 * focusRatio));

    const nextXP = (gamification?.xp || 0) + earnedXP;
    const nextLevel = Math.max(1, Math.floor(nextXP / 1000) + 1);

    const updatedGamification: Gamification = {
      ...gamification,
      xp: nextXP,
      level: nextLevel
    };

    setSubjects(updatedSubjects);
    setSessions(updatedSessions);
    setNeuroscienceStats(nextStats);
    setGamification(updatedGamification);

    syncStateWithStorage({
      subjects: updatedSubjects,
      sessions: updatedSessions,
      stats: nextStats,
      gamification: updatedGamification
    });
  };

  // --- Upgraded feature handlers ---
  const handleAddCountdown = (c: any) => {
    const id = 'count_' + Math.random().toString(36).substring(2, 9);
    const list = [...countdowns, { ...c, id }];
    setCountdowns(list);
    syncStateWithStorage({ countdowns: list });
  };

  const handleDeleteCountdown = (id: string) => {
    const list = countdowns.filter(c => c.id !== id);
    setCountdowns(list);
    syncStateWithStorage({ countdowns: list });
  };

  const handleTogglePinCountdown = (id: string) => {
    const list = countdowns.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c);
    setCountdowns(list);
    syncStateWithStorage({ countdowns: list });
  };

  const handleAddBurnoutLog = (b: any) => {
    const id = 'burn_' + Math.random().toString(36).substring(2, 9);
    const list = [...burnoutLogs, { ...b, id }];
    setBurnoutLogs(list);
    syncStateWithStorage({ burnoutLogs: list });
  };

  const handleAddStressLog = (s: any) => {
    const id = 'stress_' + Math.random().toString(36).substring(2, 9);
    const list = [...stressLogs, { ...s, id }];
    setStressLogs(list);
    syncStateWithStorage({ stressLogs: list });
  };

  const handleUpdateNotifSettings = (settings: any) => {
    setNotifSettings(settings);
    syncStateWithStorage({ notifSettings: settings });
  };

  // AI Chat Messenger Proxy handler
  const handleSendMessageToAI = async (message: string): Promise<string> => {
    const userMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      role: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ message, history: chatHistory })
      });
      const data = await res.json();
      
      const botMsg: ChatMessage = {
        id: 'msg_' + Math.random().toString(36).substring(2, 9),
        role: 'model',
        text: data.text || 'أهلاً بك يا بطل! أعد المحاولة مجدداً.',
        timestamp: new Date().toISOString()
      };

      const finalHistory = [...newHistory, botMsg];
      setChatHistory(finalHistory);
      syncStateWithStorage({ chatHistory: finalHistory });

      return botMsg.text;
    } catch (e) {
      console.error('AI call failed:', e);
      return 'عذراً يا بطل، حدث خطأ في الاتصال بالخادم. حاول مجدداً.';
    }
  };

  const handleClearChatHistory = () => {
    setChatHistory([]);
    syncStateWithStorage({ chatHistory: [] });
  };

  const handleUpdateThanaweyaStartDate = (newStartDate: string) => {
    if (!newStartDate) return;
    thanaweyaStartDateRef.current = newStartDate;
    setThanaweyaStartDate(newStartDate);
    try {
      const startParts = newStartDate.split('-');
      const start = new Date(parseInt(startParts[0], 10), parseInt(startParts[1], 10) - 1, parseInt(startParts[2], 10), 0, 0, 0, 0);
      const now = new Date();
      const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const diffTime = todayZero.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) {
        const computedWeek = Math.min(Math.max(Math.floor(diffDays / 7) + 1, 1), 52);
        setCurrentAcademicWeek(computedWeek);
        syncStateWithStorage({ thanaweyaStartDate: newStartDate, currentAcademicWeek: computedWeek });
      } else {
        setCurrentAcademicWeek(0);
        syncStateWithStorage({ thanaweyaStartDate: newStartDate, currentAcademicWeek: 0 });
      }
    } catch {
      syncStateWithStorage({ thanaweyaStartDate: newStartDate });
    }
  };

  const handleUpdateCurriculumProgress = (updatedProgress: any) => {
    if (user) {
      const updatedUser: any = {
        ...user,
        data: {
          ...((user as any).data || {}),
          curriculumProgress: updatedProgress
        }
      };
      setUser(updatedUser);
      localStorage.setItem(`study_cache_${token}`, JSON.stringify(updatedUser.data));
    }
  };

  const handleUpdateProfile = async (profile: { 
    name: string; 
    stream: 'math' | 'science' | 'literature'; 
    targetPercentage: number; 
    phone?: string; 
    whatsappReminders?: boolean;
    curriculumTrack?: 'arabic' | 'languages';
    academicYear?: 'first' | 'second' | 'third';
  }) => {
    try {
      const oldStream = user?.stream;
      const oldYear = user?.academicYear;
      const oldTrack = user?.curriculumTrack;
      
      setUser({ ...user!, ...profile });

      const isCurriculumChanged = (profile.stream !== oldStream) || 
                                  (profile.academicYear !== oldYear) || 
                                  (profile.curriculumTrack !== oldTrack);

      if (isCurriculumChanged) {
        const newStream = profile.stream;
        const newTrack = profile.curriculumTrack || oldTrack || 'arabic';
        
        const sanitized = sanitizeUserDataState(
          subjects,
          exams,
          grades,
          sessions,
          tasks,
          newStream,
          newTrack
        );

        setSubjects(sanitized.subjects);
        setExams(sanitized.exams);
        setGrades(sanitized.grades);
        setSessions(sanitized.sessions);
        setTasks(sanitized.tasks);

        syncStateWithStorage({
          subjects: sanitized.subjects,
          exams: sanitized.exams,
          grades: sanitized.grades,
          sessions: sanitized.sessions,
          tasks: sanitized.tasks
        });

        if (token) {
          await fetch('/api/user/update-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            },
            body: JSON.stringify(profile)
          });
        }
      } else if (token) {
        await fetch('/api/user/update-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify(profile)
        });
      }
    } catch (e) {
      console.error('Failed to update profile:', e);
    }
  };

  const handleUpdatePassword = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, newPassword: password })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  };

  const handleResetAccountData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/reset-account-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user && data.user.data) {
          populateState(data.user.data);
          localStorage.removeItem(`study_cache_${token}`);
        } else {
          populateState({
            subjects: subjects.map(s => ({ ...s, totalMinutes: 0 })),
            sessions: [],
            tasks: [],
            goals: [],
            exams: [],
            chatHistory: [],
            stats: neuroscienceStats,
            plannerActivities: [],
            sleepLogs: [],
            screenTimeLogs: [],
            dailyCheckins: [],
            grades: []
          });
        }
        alert('تمت إعادة ضبط كافة بيانات الحساب والبدء من جديد بنجاح! 🔄');
      } else {
        alert(data.error || 'حدث خطأ أثناء إعادة ضبط البيانات');
      }
    } catch (err) {
      console.error('Failed to reset account data:', err);
      alert('عذراً، تعذر الاتصال بالخادم لإعادة الضبط.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    const currentToken = token;
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': currentToken
        }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        // Purge all local state, keys, and cached data
        try {
          localStorage.removeItem('study_session_token');
          localStorage.removeItem(`study_cache_${currentToken}`);
          localStorage.removeItem('onboarding_completed');
          localStorage.removeItem('study_dnd_mode');
          localStorage.removeItem('thanaweya_custom_part_names');
          localStorage.removeItem('custom_timers_list');
          localStorage.removeItem('timer_stats_history');
          localStorage.removeItem('focus_stats_logs');
          localStorage.removeItem('study_voice_notes');
          localStorage.removeItem('local_bug_reports');

          // Clean up any other user-specific localStorage items
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('checkin_') || k.startsWith('study_cache_') || k.startsWith('timer_'))) {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (storageErr) {
          console.warn('LocalStorage cleanup warning:', storageErr);
        }

        // Purge IndexedDB stores
        try {
          await clearAllLocalAcademicData();
        } catch (idbErr) {
          console.warn('IndexedDB clear warning:', idbErr);
        }

        setToken(null);
        setUser(null);
        setAuthMode('login');
        
        populateState({
          subjects: [],
          sessions: [],
          tasks: [],
          goals: [],
          exams: [],
          chatHistory: [],
          stats: {
            burnoutRisk: 'low',
            breakRecommendations: [],
            optimalStudyHours: [],
            dailyCognitiveEnergy: 100,
            consistencyScore: 100,
            spacedRepetitionList: []
          }
        });

        alert('تم حذف حسابك نهائياً وكافة بياناته بنجاح! نتمنى لك كل التوفيق والنجاح 🎓');
      } else {
        alert(data.error || 'فشل حذف الحساب من الخادم');
      }
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('عذراً، حدث عطل أثناء حذف الحساب. يرجى التحقق من اتصال الإنترنت.');
    }
  };

  // Study Streak Calculation (Task-Based: Requires at least half / 3/4 tasks to maintain & increase)
  const studyStreak = useMemo(() => {
    // If user has planner activities or tasks, compute exact task-based streak
    if (plannerActivities.length > 0 || tasks.length > 0) {
      const result = computeTaskBasedStreak(
        plannerActivities,
        tasks,
        'three_fourths'
      );
      return result.streak;
    }

    if (sessions.length === 0) return 0;
    // Fallback if no tasks configured yet: consecutive study days
    const uniqueDays = Array.from(
      new Set(sessions.map((s) => s.timestamp.split('T')[0]))
    ).sort().reverse() as string[];
    
    if (uniqueDays.length === 0) return 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (uniqueDays[0] !== todayStr && uniqueDays[0] !== yesterdayStr) {
      return 0; // streak broken
    }

    let streakCount = 1;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const current = new Date(uniqueDays[i]);
      const prev = new Date(uniqueDays[i + 1]);
      const diffTime = Math.abs(current.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streakCount++;
      } else if (diffDays > 1) {
        break;
      }
    }
    return streakCount;
  }, [plannerActivities, tasks, gamification.streakThreshold, sessions]);

  // Auth gate rendering
  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-300`}>
        <div className="w-full max-w-md p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl text-right" style={{ direction: 'rtl' }}>
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 rounded-2xl mx-auto flex items-center justify-center shadow-md mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">مساعد دراسة ثانوية عامة دفعة ٢٠٢٧ 🎓</h2>
            <p className="text-xs text-zinc-500 mt-1.5 dark:text-zinc-400">النظام الجديد المعدّل (المجموع من ٣٢٠ درجة) - مبني على أسس علم الأعصاب للتفوق</p>
          </div>

          {/* Top Auth Mode Switcher Buttons: Sign In / Log In & Sign Up / Register */}
          <div className="grid grid-cols-2 gap-2 p-1.5 mb-6 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
            <button
              type="button"
              id="auth-tab-login-btn"
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40'
              }`}
            >
              <LogIn className="w-4 h-4 text-indigo-500" />
              <span>تسجيل الدخول (Sign In)</span>
            </button>
            <button
              type="button"
              id="auth-tab-register-btn"
              onClick={() => {
                setAuthMode('register');
                setAuthError('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-500" />
              <span>حساب جديد (Sign Up)</span>
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold">
              {authError}
            </div>
          )}

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">البريد الإلكتروني للجروب المغلق:</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-2.5 w-4.5 h-4.5 text-zinc-400" />
                  <input
                    type="email"
                    required
                    placeholder="student@group.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">رمز المرور الخاص بك:</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-2.5 w-4.5 h-4.5 text-zinc-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs mt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                >
                  نسيت رمز المرور؟
                </button>
              </div>

              <button
                type="submit"
                id="auth-login-submit-btn"
                className="w-full py-3 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 font-bold rounded-xl text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول (Log In)</span>
              </button>

              <div className="pt-2 border-t border-zinc-150 dark:border-zinc-800 text-center">
                <button
                  type="button"
                  id="switch-to-register-link-btn"
                  onClick={() => setAuthMode('register')}
                  className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
                  <span>ليس لديك حساب؟ إنشاء حساب جديد (Sign Up)</span>
                </button>
              </div>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">اسم الطالب بالكامل:</label>
                <div className="relative">
                  <User className="absolute right-3 top-2.5 w-4.5 h-4.5 text-zinc-400" />
                  <input
                    type="text"
                    required
                    placeholder="محمد أحمد علي"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">البريد الإلكتروني:</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-2.5 w-4.5 h-4.5 text-zinc-400" />
                  <input
                    type="email"
                    required
                    placeholder="student@group.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">رمز المرور الخاص بك:</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-2.5 w-4.5 h-4.5 text-zinc-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">الشعبة الدراسية:</label>
                  <select
                    value={authStream}
                    onChange={(e) => setAuthStream(e.target.value as any)}
                    className="w-full px-2 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="science">علمي علوم 🧪</option>
                    <option value="math">علمي رياضة 📐</option>
                    <option value="literature">أدبي 📚</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">المجموع المستهدف (%):</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={authTarget}
                    onChange={(e) => setAuthTarget(Number(e.target.value))}
                    className="w-full px-2 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="auth-register-submit-btn"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>تسجيل حساب جديد (Sign Up)</span>
              </button>

              <div className="pt-2 border-t border-zinc-150 dark:border-zinc-800 text-center">
                <button
                  type="button"
                  id="switch-to-login-link-btn"
                  onClick={() => setAuthMode('login')}
                  className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-indigo-500" />
                  <span>لديك حساب بالفعل؟ تسجيل الدخول (Sign In)</span>
                </button>
              </div>
            </form>
          )}

          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                تعديل كلمة المرور للجروب المغلق: أدخل بريدك الإلكتروني والرمز الجديد لتحديثه فوراً.
              </p>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">البريد الإلكتروني:</label>
                <input
                  type="email"
                  required
                  placeholder="student@group.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">كلمة المرور الجديدة:</label>
                <input
                  type="password"
                  required
                  placeholder="رمز جديد قوية"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 font-semibold rounded-xl text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-md"
              >
                تحديث رمز المرور
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full text-xs text-center text-zinc-500 hover:underline hover:text-zinc-800 dark:hover:text-zinc-300 block"
              >
                رجوع لتسجيل الدخول
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Study Dashboard Workspace Layout
  const userStreamLabel = user?.stream === 'math' ? 'علمي رياضة' : user?.stream === 'science' ? 'علمي علوم' : 'أدبي';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-300 relative pb-16 md:pb-0">
      
      {activeFocusActivity && (
        <FocusModeContainer
          activity={activeFocusActivity}
          subjects={subjects}
          onClose={() => setActiveFocusActivity(null)}
          onComplete={(details) => {
            const todayStr = new Date().toISOString().split('T')[0];
            const durationMins = details.durationMinutes || 1;
            const subObj = subjects.find(s => s.id === details.subjectId);
            const rawLessonTitle = details.lessonName || activeFocusActivity?.lessonName || activeFocusActivity?.title || (subObj ? subObj.name : 'مذاكرة');
            const cleanLesson = rawLessonTitle.trim();

            const completedSession: StudySession = {
              id: 'session_' + Math.random().toString(36).substring(2, 9),
              subjectId: details.subjectId || 'sub_general',
              subjectName: subObj?.name || 'مادة دراسية',
              duration: durationMins * 60,
              durationMinutes: durationMins,
              date: todayStr,
              method: 'Pomodoro' as any,
              focusScore: details.focusScore || (details.completionStatus === 'yes' ? 95 : details.completionStatus === 'partially' ? 75 : 50),
              cognitiveEnergyBefore: neuroscienceStats.dailyCognitiveEnergy,
              cognitiveEnergyAfter: Math.max(neuroscienceStats.dailyCognitiveEnergy - 10, 25),
              notes: details.notes ? `${details.notes}` : `جلسة تركيز بومودورو: ${cleanLesson}`,
              timestamp: new Date().toISOString()
            };

            const updatedSessions = [completedSession, ...sessions.filter(s => s.id !== completedSession.id)];
            setSessions(updatedSessions);

            // Update subject totalMinutes and stage logs
            const updatedSubjects = subjects.map(s => {
              if (s.id === details.subjectId) {
                const totalMinutes = (s.totalMinutes || 0) + durationMins;
                const totalStudyHours = (s.totalStudyHours || 0) + (durationMins / 60);
                return {
                  ...s,
                  totalMinutes,
                  totalStudyHours
                };
              }
              return s;
            });
            setSubjects(updatedSubjects);

            // Update activity & weekly schedule if activityId is present
            let updatedActivities = plannerActivities;
            let updatedSchedule = weeklySchedule;
            if (details.activityId) {
              updatedActivities = plannerActivities.map(act => {
                if (act.id === details.activityId) {
                  return {
                    ...act,
                    completed: details.completionStatus !== 'no',
                    actualDurationMinutes: durationMins,
                    currentStage: details.stage || act.currentStage,
                    notes: details.notes || act.notes
                  };
                }
                return act;
              });
              setPlannerActivities(updatedActivities);

              if (weeklySchedule) {
                updatedSchedule = {
                  ...weeklySchedule,
                  schedule: updatedActivities,
                  lastUpdated: Date.now(),
                  hash: generateScheduleHash(updatedActivities)
                };
                setWeeklySchedule(updatedSchedule);
              }
            }

            // Gamification update for Pomodoro completion
            const earnedXP = Math.max(25, Math.round(durationMins * 1.5 * ((details.focusScore || 90) / 100)));
            const earnedCoins = Math.max(5, Math.round(durationMins / 10));
            const newXP = (gamification?.xp || 0) + earnedXP;
            const newCoins = (gamification?.coins || 0) + earnedCoins;
            const newLevel = Math.max(1, Math.floor(newXP / 1000) + 1);

            const updatedGamification: Gamification = {
              ...gamification,
              xp: newXP,
              coins: newCoins,
              level: newLevel
            };
            setGamification(updatedGamification);

            // Spaced Repetition (المراجعات الذكية) integration
            if (cleanLesson && details.completionStatus !== 'no' && details.subjectId) {
              const stageNorm = String(details.stage || '').toLowerCase();
              
              if (stageNorm.includes('sheet') || stageNorm.includes('شيت') || stageNorm.includes('كلاس')) {
                advanceSmartRevisionMilestone(
                  details.subjectId,
                  subObj?.name || 'مادة دراسية',
                  cleanLesson,
                  'شيت الحصة (تطبيق عملي)'
                );
              } else if (stageNorm.includes('homework') || stageNorm.includes('واجب')) {
                advanceSmartRevisionMilestone(
                  details.subjectId,
                  subObj?.name || 'مادة دراسية',
                  cleanLesson,
                  'حل الواجب المنزلي'
                );
              } else if (stageNorm.includes('review') || stageNorm.includes('recall') || stageNorm.includes('مراجعة') || stageNorm.includes('استرجاع')) {
                advanceSmartRevisionMilestone(
                  details.subjectId,
                  subObj?.name || 'مادة دراسية',
                  cleanLesson,
                  'مراجعة أسبوعية'
                );
              } else {
                addLessonToSmartRevision(
                  details.subjectId,
                  subObj?.name || 'مادة دراسية',
                  cleanLesson,
                  'الوحدة الدراسية'
                );
              }
            }

            // Instant atomic persistence
            syncStateWithStorage({
              sessions: updatedSessions,
              subjects: updatedSubjects,
              plannerActivities: updatedActivities,
              weeklySchedule: updatedSchedule,
              gamification: updatedGamification
            });

            setActiveFocusActivity(null);
            setActiveTab('today');
          }}
        />
      )}
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 z-35 bg-black/60 backdrop-blur-xs md:hidden transition-opacity" 
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-72 sm:w-80 md:w-64 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col justify-between`}
        style={{ direction: 'rtl' }}
      >
        <div className="flex flex-col h-full overflow-y-auto justify-between">
          <div>
            {/* Brand logo */}
            <div className="p-4 sm:p-5 border-b border-zinc-150 dark:border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-right">
                <div className="p-2 rounded-xl bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 shadow-sm shrink-0">
                  <Brain className="w-5 h-5 text-indigo-500 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">مساعد ثانوية عامة</h1>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold block">المرافق الدراسي الذكي</span>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 md:hidden cursor-pointer"
                title="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Status Profile quick widget */}
            <div className="p-4 mx-3 sm:mx-4 my-4 rounded-2xl border border-zinc-150 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30 text-right">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="text-[10px] text-zinc-400 font-semibold block">طالب مجتهد</span>
              </div>
              <strong className="text-sm font-bold text-zinc-800 dark:text-zinc-200 block truncate">{user?.name || 'طالب ثانوية'}</strong>
              <span className="text-[10px] text-zinc-500 mt-1 block">الشعبة: {userStreamLabel} | المستهدف: {user?.targetPercentage || 95}%</span>
            </div>

            {/* Nav Items */}
            <nav className="px-3 space-y-1">
              {[
                { id: 'planning', label: 'جدول وتنظيم المذاكرة 🗓️', icon: Calendar, tab: 'dashboard' },
                { id: 'learning', label: 'المراجعات الذكية والتسميع 🧠', icon: Brain, tab: 'spaced' },
                { id: 'progress', label: 'مستواك ونتائجك 📊', icon: TrendingUp, tab: 'prediction' },
                { id: 'health', label: 'النصائح والراحة النفسية 🧬', icon: Activity, tab: 'checkin' },
                { id: 'gamification', label: 'النقاط والمكافآت 🏆', icon: Award, tab: 'gamification' },
                { id: 'profile', label: 'الملف الدراسي والإعدادات ⚙️', icon: SettingsIcon, tab: 'settings' }
              ].map((item) => {
                const IconComp = item.icon;
                const isActive = primaryTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPrimaryTab(item.id as any);
                      setActiveTab(item.tab as any);
                      // On mobile, auto-close sidebar on navigate
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <IconComp className={`w-4 h-4 ${isActive ? 'text-indigo-500' : 'text-zinc-400'}`} />
                      <span>{item.label}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Logout */}
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 z-30" style={{ direction: 'rtl' }}>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Toggle sidebar button for mobile */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 md:hidden transition-colors cursor-pointer"
              aria-label="فتح القائمة الرئيسية"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Context Help Trigger Button */}
            <button
              onClick={() => setShowStudentGuideModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm cursor-pointer"
              title="افتـح دليل استخدام المنصة الشامل"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>دليل الاستخدام 📖</span>
            </button>

            {HELP_CONTENT[activeTab] && (
              <button
                onClick={() => setHelpTopic(HELP_CONTENT[activeTab])}
                className="hidden xs:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 dark:text-indigo-400 rounded-xl transition-colors shadow-sm cursor-pointer"
                title="اضغط لمعرفة كيفية الاستخدام"
              >
                <Info className="w-3.5 h-3.5" />
                <span>عن هذا القسم ⓘ</span>
              </button>
            )}

            {/* Academic Week Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-[11px] font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl shadow-xs">
              <span>📅</span>
              <span>
                {currentAcademicWeek > 0 
                  ? `الأسبوع الأكاديمي ${currentAcademicWeek}` 
                  : `فترة التهيئة (البداية ${thanaweyaStartDate})`}
              </span>
            </div>

            {/* Gamification Stats Header Bar */}
            <div className="hidden lg:flex items-center gap-4 text-xs font-semibold bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 px-4 py-1.5 rounded-2xl">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500">🏆</span>
                <span>المستوى {gamification.level}</span>
              </div>
              <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-500">✨</span>
                <span>{gamification.xp} XP</span>
              </div>
              <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex items-center gap-1.5">
                <span className="text-orange-500">🔥</span>
                <span>سلسلة {gamification.streak} يوم</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Day/Night Toggler */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              title="تغيير المظهر البصري"
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Dynamic Online/Offline Sync Status Indicator */}
            <div className={`hidden sm:flex items-center gap-1.5 text-[10px] border px-3 py-1.5 rounded-xl font-bold transition-all ${
              isOnline 
                ? 'text-zinc-500 border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900' 
                : 'text-amber-600 border-amber-250 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/25'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-bounce'}`}></span>
              <span>{isOnline ? 'مزامنة سحابية نشطة' : 'وضع غير متصل'}</span>
            </div>

            {/* Quick Log Out Button in Top Header */}
            <button
              id="header-logout-btn"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 border border-red-200/60 dark:border-red-900/40 rounded-xl transition-all shadow-xs cursor-pointer"
              title="تسجيل الخروج من الحساب"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden xs:inline">تسجيل الخروج (Log Out)</span>
            </button>
          </div>
        </header>

        {/* Tab Canvas Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col pb-24 md:pb-8">
          
          {/* AI Scheduler V13 — Offline Status Badge & Smart Cloud Sync Banner */}
          <div className="mb-6 space-y-3">
            <OfflineSyncBanner
              isOnline={isOnline}
              syncStatus={syncStatus}
              onManualSyncRequest={handleManualSyncRequest}
              pendingCount={pendingCount}
            />

            {dndMode && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-900 text-white border border-indigo-700/60 shadow-md flex items-center justify-between gap-3 text-right animate-fade-in" style={{ direction: 'rtl' }}>
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-xl bg-indigo-600 text-white animate-pulse flex-shrink-0">
                    <Plane className="w-4 h-4" />
                  </span>
                  <div className="text-xs">
                    <span className="font-bold text-indigo-200">✈️ وضع عدم الإزعاج مفعل (Airplane Mode Active):</span>{' '}
                    <span className="text-zinc-200">
                      يُنصح بتفعيل وضع الطيران في هاتفك وكتم الإشعارات الآن لمنع تشتيت الانتباه والحفاظ على حالة التدفق الذهني.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setPrimaryTab('profile');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-indigo-100 text-[10px] font-bold transition-all cursor-pointer"
                  >
                    الإعدادات
                  </button>
                  <button
                    onClick={() => {
                      setDndMode(false);
                      localStorage.setItem('study_dnd_mode', 'false');
                    }}
                    className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs"
                    title="إغلاق التنبيه"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Horizontal Sub-Navigation Tab Bar */}
          {primaryTab === 'planning' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-zinc-100 dark:border-zinc-900 dir-rtl scrollbar-none" style={{ direction: 'rtl' }}>
              {[
                { id: 'dashboard', label: 'الرئيسية 🏠' },
                { id: 'today', label: 'جدول اليوم (تقسيم الأجزاء) 📅' },
                { id: 'planner', label: 'المنظم الأسبوعي 🗓️' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveTab(sub.id as any)}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === sub.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm font-semibold scale-[1.02]'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {primaryTab === 'learning' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-zinc-100 dark:border-zinc-900 dir-rtl scrollbar-none" style={{ direction: 'rtl' }}>
              {[
                { id: 'spaced', label: 'جدول المراجعات الذكية 🧠' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveTab(sub.id as any)}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === sub.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm font-semibold scale-[1.02]'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {primaryTab === 'progress' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-zinc-100 dark:border-zinc-900 dir-rtl scrollbar-none" style={{ direction: 'rtl' }}>
              {[
                { id: 'custom_analytic', label: 'الرسم البياني والتحليلات (Analytic) 📈' },
                { id: 'prediction', label: 'توقع مجموعك النهائي 🎯' },
                { id: 'focus_diagnostics', label: 'مستوى تركيزك 🧠' },
                { id: 'exams', label: 'سجل الامتحانات والدرجات 📝' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveTab(sub.id as any)}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === sub.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm font-semibold scale-[1.02]'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {primaryTab === 'health' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-zinc-100 dark:border-zinc-900 dir-rtl scrollbar-none" style={{ direction: 'rtl' }}>
              {[
                { id: 'checkin', label: 'سجل المزاج والنشاط 🧠' },
                { id: 'burnout', label: 'مستوى الراحة وتفادي الإجهاد 🤯' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveTab(sub.id as any)}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === sub.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm font-semibold scale-[1.02]'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {primaryTab === 'profile' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-zinc-100 dark:border-zinc-900 dir-rtl scrollbar-none" style={{ direction: 'rtl' }}>
              {[
                { id: 'settings', label: 'تعديل الملف الشخصي ⚙️' },
                { id: 'subjects', label: 'إدارة المواد الدراسية 📚' },
                { id: 'drive', label: 'النسخ السحابي الاحتياطي ☁' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveTab(sub.id as any)}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === sub.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm font-semibold scale-[1.02]'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {/* Sub-tab description help note */}
          {HELP_CONTENT[activeTab] && (
            <div className="mb-6 p-4 border border-zinc-100 dark:border-zinc-900/60 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl text-right flex items-center justify-between gap-4" style={{ direction: 'rtl' }}>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                💡 {HELP_CONTENT[activeTab].shortDesc}
              </p>
              <button
                onClick={() => setHelpTopic(HELP_CONTENT[activeTab])}
                className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold hover:underline shrink-0"
              >
                اقرأ المزيد ➔
              </button>
            </div>
          )}

          {/* Screens Renderers */}
          {activeTab === 'today' && user && (
            <TodayTracker
              user={user as any}
              activities={plannerActivities}
              subjects={subjects}
              sessions={sessions}
              tasks={tasks}
              onToggleActivityCompletion={handleTogglePlannerActivityCompletion}
              onUpdateProfile={handleUpdateProfile}
              onAddGrade={handleAddGrade}
              notifSettings={notifSettings}
              onUpdateNotifSettings={handleUpdateNotifSettings}
              lifestyleProfile={lifestyleProfile}
              gamification={gamification}
              onUpdateGamification={(g) => { setGamification(g); syncStateWithStorage({ gamification: g }); }}
              onStartFocusSession={setActiveFocusActivity}
              onMissActivity={handleMissActivity}
              onAddActivity={handleAddPlannerActivity}
              onDeleteActivity={handleDeletePlannerActivity}
              onUpdateActivity={handleUpdatePlannerActivity}
              onRenameLesson={syncLessonRename}
            />
          )}

          {(activeTab === 'dashboard' || activeTab === 'spaced' || activeTab === 'memory') && (
            <StatsDashboard
              subjects={subjects}
              sessions={sessions}
              tasks={tasks}
              streak={studyStreak}
              exams={exams}
              grades={grades}
              thanaweyaStartDate={thanaweyaStartDate}
              onUpdateThanaweyaStartDate={(d) => { setThanaweyaStartDate(d); syncStateWithStorage({ thanaweyaStartDate: d }); }}
              spacedRepetitionReviews={spacedRepetitionReviews}
              onUpdateSpacedRepetitionReviews={(r) => { setSpacedRepetitionReviews(r); syncStateWithStorage({ spacedRepetitionReviews: r }); }}
              customHistoryLogs={customHistoryLogs}
              onUpdateCustomHistoryLogs={(l) => { setCustomHistoryLogs(l); syncStateWithStorage({ customHistoryLogs: l }); }}
              gamification={gamification}
              onUpdateGamification={(g) => { setGamification(g); syncStateWithStorage({ gamification: g }); }}
              token={token || undefined}
              curriculumProgress={(user as any)?.data?.curriculumProgress}
              initialSubTab={activeTab === 'spaced' ? 'spaced' : activeTab === 'memory' ? 'memory' : 'daily'}
              isHomeScreen={activeTab === 'dashboard'}
              setActiveTab={setActiveTab}
              onToggleActivityCompletion={handleTogglePlannerActivityCompletion}
              plannerActivities={plannerActivities}
              onAddDailyCheckin={handleAddDailyCheckin}
              onTriggerCheckin={() => setShowCheckinModal(true)}
              dailyCheckins={dailyCheckins}
              user={user as any}
              onSessionComplete={handleSessionComplete}
              onOpenStudentGuide={() => setShowStudentGuideModal(true)}
              onRenameLesson={syncLessonRename}
              onUpdatePlannerActivity={handleUpdatePlannerActivity}
              lifestyleProfile={lifestyleProfile}
              onUpdateLifestyleProfile={(lp: LifestyleProfile) => { 
                setLifestyleProfile(lp); 
                syncStateWithStorage({ lifestyleProfile: lp }); 
              }}
            />
          )}

          {activeTab === 'timer' && (
            <div className="max-w-md mx-auto">
              <Timer
                subjects={subjects}
                onSessionComplete={handleSessionComplete}
                token={token || undefined}
              />
            </div>
          )}

          {activeTab === 'subjects' && (
            <SubjectsManager
              subjects={subjects}
              onAddSubject={handleAddSubject}
              onEditSubject={handleEditSubject}
              onDeleteSubject={handleDeleteSubject}
              onResetSubjects={handleResetSubjectsToDefault}
            />
          )}

          {activeTab === 'curriculum' && (
            <CurriculumTracker
              curriculumProgress={(user as any)?.data?.curriculumProgress || {}}
              onUpdateCurriculumProgress={handleUpdateCurriculumProgress}
              token={token || undefined}
              user={user}
              onTriggerCheckin={() => setShowCheckinModal(true)}
            />
          )}

          {activeTab === 'ai' && (
            <AIChatbot
              chatHistory={chatHistory}
              onSendMessage={handleSendMessageToAI}
              onClearChat={handleClearChatHistory}
              subjects={subjects}
              token={token || null}
              user={user}
            />
          )}

          {activeTab === 'exams' && (
            <ExamsTracker
              exams={exams}
              subjects={subjects}
              onAddExam={handleAddExam}
              onRecordGrade={handleRecordExamGrade}
              onDeleteExam={handleDeleteExam}
              consistencyScore={neuroscienceStats.consistencyScore}
              thanaweyaStartDate={thanaweyaStartDate}
              onUpdateThanaweyaStartDate={handleUpdateThanaweyaStartDate}
            />
          )}

          {activeTab === 'prediction' && (
            <ScorePrediction
              exams={exams}
              subjects={subjects}
              sessions={sessions}
              consistencyScore={neuroscienceStats.consistencyScore}
              token={token || undefined}
              userTarget={user?.targetPercentage || 95}
              thanaweyaStartDate={thanaweyaStartDate}
              grades={grades}
            />
          )}

          {activeTab === 'custom_analytic' && (
            <CustomAnalyticsDashboard
              subjects={subjects}
              sessions={sessions}
              exams={exams}
              tasks={tasks}
              dailyHistoryLogs={customHistoryLogs}
              currentAcademicWeek={currentAcademicWeek}
              thanaweyaStartDate={thanaweyaStartDate}
              onOpenStudentGuide={() => setShowStudentGuideModal(true)}
            />
          )}

          {['analytics', 'checkin', 'burnout'].includes(activeTab) && (
            <NeurosciencePanel
              stream={user?.stream || 'science'}
              consistencyScore={neuroscienceStats.consistencyScore}
              subjects={subjects}
              sleepLogs={sleepLogs}
              screenTimeLogs={screenTimeLogs}
              dailyCheckins={dailyCheckins}
              grades={grades}
              plannerActivities={plannerActivities}
              onAddSleepLog={handleAddSleepLog}
              onAddScreenTimeLog={handleAddScreenTimeLog}
              onAddDailyCheckin={handleAddDailyCheckin}
              onAddGrade={handleAddGrade}
              onDeleteGrade={handleDeleteGrade}
              burnoutLogs={burnoutLogs}
              stressLogs={stressLogs}
              token={token || undefined}
              thanaweyaStartDate={thanaweyaStartDate}
              initialSubTab={
                activeTab === 'analytics' ? 'analytics' :
                activeTab === 'checkin' ? 'checkin' : 'burnout'
              }
              onSyncFullData={(newData) => {
                if (newData.subjects) setSubjects(newData.subjects);
                if (newData.sessions) setSessions(newData.sessions);
                if (newData.tasks) setTasks(newData.tasks);
                if (newData.goals) setGoals(newData.goals);
                if (newData.exams) setExams(newData.exams);
                if (newData.chatHistory) setChatHistory(newData.chatHistory);
                if (newData.plannerActivities) setPlannerActivities(newData.plannerActivities);
                if (newData.sleepLogs) setSleepLogs(newData.sleepLogs);
                if (newData.screenTimeLogs) setScreenTimeLogs(newData.screenTimeLogs);
                if (newData.dailyCheckins) setDailyCheckins(newData.dailyCheckins);
                if (newData.grades) setGrades(newData.grades);
                if (newData.countdowns) setCountdowns(newData.countdowns);
                if (newData.burnoutLogs) setBurnoutLogs(newData.burnoutLogs);
                if (newData.stressLogs) setStressLogs(newData.stressLogs);
                if (newData.stats) setNeuroscienceStats(newData.stats);
                syncStateWithStorage(newData);
              }}
            />
          )}

          {activeTab === 'gamification' && (
            <GamificationHub
              gamification={gamification}
              onUpdateGamification={(g) => { setGamification(g); syncStateWithStorage({ gamification: g }); }}
              stream={user?.stream || 'science'}
              token={token || undefined}
              user={user}
              curriculumProgress={(user as any)?.data?.curriculumProgress}
              spacedRepetitionReviews={spacedRepetitionReviews}
            />
          )}

          {activeTab === 'planner' && (
            <WeeklyPlanner
              activities={plannerActivities}
              subjects={subjects}
              currentAcademicWeek={currentAcademicWeek}
              onAddActivity={handleAddPlannerActivity}
              onDeleteActivity={handleDeletePlannerActivity}
              onUpdateActivity={handleUpdatePlannerActivity}
              onOptimizeSchedule={handleOptimizeSchedule}
              onStartFocusSession={setActiveFocusActivity}
              lifestyleProfile={lifestyleProfile}
              onUpdateLifestyleProfile={(lp: LifestyleProfile) => { setLifestyleProfile(lp); syncStateWithStorage({ lifestyleProfile: lp }); }}
              gamification={gamification}
              onUpdateGamification={(g: Gamification) => { setGamification(g); syncStateWithStorage({ gamification: g }); }}
              exams={exams}
              onAddExam={handleAddExam}
              onDeleteExam={handleDeleteExam}
              token={token || undefined}
              spacedRepetitionReviews={spacedRepetitionReviews}
              onSyncFullData={(newData) => {
                if (newData.subjects) setSubjects(newData.subjects);
                if (newData.sessions) setSessions(newData.sessions);
                if (newData.tasks) setTasks(newData.tasks);
                if (newData.goals) setGoals(newData.goals);
                if (newData.exams) setExams(newData.exams);
                if (newData.chatHistory) setChatHistory(newData.chatHistory);
                if (newData.plannerActivities) setPlannerActivities(newData.plannerActivities);
                if (newData.sleepLogs) setSleepLogs(newData.sleepLogs);
                if (newData.screenTimeLogs) setScreenTimeLogs(newData.screenTimeLogs);
                if (newData.dailyCheckins) setDailyCheckins(newData.dailyCheckins);
                if (newData.grades) setGrades(newData.grades);
                if (newData.countdowns) setCountdowns(newData.countdowns);
                if (newData.burnoutLogs) setBurnoutLogs(newData.burnoutLogs);
                if (newData.stressLogs) setStressLogs(newData.stressLogs);
                if (newData.stats) setNeuroscienceStats(newData.stats);
                if (newData.currentAcademicWeek !== undefined) setCurrentAcademicWeek(newData.currentAcademicWeek);
                if (newData.academicHistory !== undefined) setAcademicHistory(newData.academicHistory);
                syncStateWithStorage(newData);
              }}
            />
          )}

          {activeTab === 'drive' && (
            <GoogleDrivePanel
              appData={{ subjects, sessions, tasks, goals, exams, chatHistory, stats: neuroscienceStats }}
              onRestoreState={(restoredData) => {
                populateState(restoredData);
                syncStateWithStorage(restoredData);
              }}
            />
          )}

          {activeTab === 'focus_diagnostics' && (
            <FocusDiagnostics
              sessions={sessions}
              subjects={subjects}
              onNavigateToSettings={() => {
                setActiveTab('settings');
                setPrimaryTab('profile');
              }}
              onStartFocusSession={() => {
                setActiveTab('timer');
                setPrimaryTab('planning');
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel
              user={user || { name: 'طالب', email: '', stream: 'science', targetPercentage: 95 }}
              appData={{ subjects, sessions, tasks, goals, exams, chatHistory, stats: neuroscienceStats, plannerActivities, sleepLogs, screenTimeLogs, dailyCheckins, grades }}
              token={token}
              currentAcademicWeek={currentAcademicWeek}
              thanaweyaStartDate={thanaweyaStartDate}
              onUpdateThanaweyaStartDate={handleUpdateThanaweyaStartDate}
              dndMode={dndMode}
              onToggleDndMode={(active) => {
                setDndMode(active);
                localStorage.setItem('study_dnd_mode', String(active));
              }}
              onUpdateProfile={handleUpdateProfile}
              onUpdatePassword={handleUpdatePassword}
              onImportData={(importedData) => {
                populateState(importedData);
                syncStateWithStorage(importedData);
              }}
              onResetAccountData={handleResetAccountData}
              onDeleteAccount={handleDeleteAccount}
              onLogout={handleLogout}
              onOpenStudentGuide={() => setShowStudentGuideModal(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg flex items-center justify-between md:hidden px-1.5 shadow-2xl safe-area-bottom" style={{ direction: 'rtl' }}>
        {[
          { id: 'planning', label: 'التخطيط', icon: Calendar, tab: 'dashboard' },
          { id: 'learning', label: 'المراجعات', icon: Brain, tab: 'spaced' },
          { id: 'progress', label: 'التقدم', icon: TrendingUp, tab: 'prediction' },
          { id: 'health', label: 'الصحة', icon: Activity, tab: 'checkin' },
          { id: 'gamification', label: 'المكافآت', icon: Award, tab: 'gamification' },
          { id: 'profile', label: 'حسابي', icon: SettingsIcon, tab: 'settings' }
        ].map((item) => {
          const IconComp = item.icon;
          const isActive = primaryTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setPrimaryTab(item.id as any);
                setActiveTab(item.tab as any);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50/70 dark:bg-indigo-950/40'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              <IconComp className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-zinc-400 dark:text-zinc-500'} transition-transform`} />
              <span className="text-[9.5px] font-bold leading-none tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Universal Help Center Popup Modal */}
      {helpTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ direction: 'rtl' }}>
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 text-right shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-150 dark:border-zinc-800 pb-4 mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>💡 دليل الاستخدام:</span>
                <span className="text-indigo-600 dark:text-indigo-400">{helpTopic.title}</span>
              </h3>
              <button
                onClick={() => setHelpTopic(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-zinc-400 mb-1">الهدف من الميزة:</h4>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold">{helpTopic.purpose}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-400 mb-1">كيف تعمل:</h4>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold">{helpTopic.howItWorks}</p>
              </div>

              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">نصيحة ذهبية للتفوق 🌟:</h4>
                <p className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed font-bold">{helpTopic.bestPractices}</p>
              </div>
            </div>

            <button
              onClick={() => setHelpTopic(null)}
              className="mt-6 w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 font-bold rounded-2xl text-xs transition-colors shadow-sm cursor-pointer"
            >
              فهمت ذلك، دعنا نكمل! 🚀
            </button>
          </div>
        </div>
      )}

      {/* Comprehensive Student Guide Modal */}
      <StudentGuideModal
        isOpen={showStudentGuideModal}
        onClose={() => setShowStudentGuideModal(false)}
        onNavigateTab={(tab, primary) => {
          if (primary) setPrimaryTab(primary as any);
          setActiveTab(tab as any);
        }}
      />

      {/* AI Scheduler V12.3 — Intelligent Session Completion & Minimal Logging Modal */}
      {stageCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md" style={{ direction: 'rtl' }}>
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 md:p-7 text-right shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden space-y-4">
            
            {/* Header with read-only subject & auto-detected stage */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>📚 {stageCompletionModal.subjectName}</span>
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">تسجيل المذاكرة والتعلم الذاتي التكيفي</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-left">
                  <span className="block text-[9px] text-zinc-400 font-bold">المرحلة الحالية (محددة تلقائياً)</span>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900/50 inline-block">
                    {stageCompletionModal.stage}
                  </span>
                </div>
                <button
                  onClick={() => setStageCompletionModal(null)}
                  className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Prompt for Learned Lesson Name for Smart Repetition */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60">
              <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                📚 ما هو اسم أو عنوان الدرس الذي أتممت شرحه/مراجعته اليوم؟
              </label>
              <input
                type="text"
                placeholder="مثال: قانون أوم للدوائر المغلقة / البلاغة: أسلوب القصر..."
                value={modalLessonName}
                onChange={(e) => setModalLessonName(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-indigo-700 dark:text-indigo-300 block">
                سيتم احتساب تطبيق الشيت أو الواجب كأحد خطوات المراجعة المباشرة وإدراجها بجدول المراجعات الذكية.
              </span>
            </div>

            {/* Prefilled Actual Duration Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                ⏱️ وقت المذاكرة الفعلي (مملوء تلقائياً من المخطط):
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 p-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={modalHours}
                    onChange={(e) => setModalHours(Math.max(0, Math.min(23, Number(e.target.value))))}
                    className="w-full bg-transparent text-center font-bold text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none"
                  />
                  <span className="text-xs text-zinc-400 font-semibold pl-1">ساعة</span>
                </div>
                <div className="flex-1 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 p-2">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={modalMinutes}
                    onChange={(e) => setModalMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                    className="w-full bg-transparent text-center font-bold text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none"
                  />
                  <span className="text-xs text-zinc-400 font-semibold pl-1">دقيقة</span>
                </div>
              </div>
            </div>

            {/* Session Completion Status */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                حالة إنجاز الجلسة:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'completed', label: 'تم بالكامل ✅' },
                  { id: 'partially', label: 'مكتمل جزئياً ⏳' },
                  { id: 'not_completed', label: 'لم ينفذ / تعذر ❌' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModalCompletionStatus(item.id as any)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      modalCompletionStatus === item.id
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-md font-black'
                        : 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Questions: If Partially Completed */}
            {modalCompletionStatus === 'partially' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-2 animate-fadeIn">
                <div className="flex justify-between items-center text-xs font-bold text-amber-800 dark:text-amber-300">
                  <span>كم نسبة ما أنجزته من مهمة اليوم؟</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">{modalPartialPercent}%</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setModalPartialPercent(pct)}
                      className={`py-1 px-2.5 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                        modalPartialPercent === pct
                          ? 'bg-amber-500 text-zinc-950 font-black'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-amber-700 dark:text-amber-400/90 font-medium">
                  سيتم حفظ العمل المتبقي ({100 - modalPartialPercent}%) وترحيله تلقائياً إلى الجدول القادم دون إعادة المرحلة من البداية.
                </p>
              </div>
            )}

            {/* Conditional Questions: If Not Completed */}
            {modalCompletionStatus === 'not_completed' && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-2 animate-fadeIn">
                <label className="block text-xs font-bold text-rose-800 dark:text-rose-300">
                  لماذا لم تكتمل المذاكرة؟ (لتحسين الجدول الذكي)
                </label>
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
                      onClick={() => setModalIncompleteReason(reason)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer text-center ${
                        modalIncompleteReason === reason
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save / Cancel buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setStageCompletionModal(null)}
                className="px-4 py-2.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  const actualTotalMinutes = (modalHours * 60) + modalMinutes;
                  const cleanLessonName = modalLessonName.trim() || `${stageCompletionModal.subjectName} - درس جديد`;
                  const stageNorm = String(stageCompletionModal.stage || '').toLowerCase();

                  processPlannerActivityCompletionToggle(stageCompletionModal.activityId, {
                    actualDurationMinutes: actualTotalMinutes,
                    stage: stageCompletionModal.stage,
                    completionStatus: modalCompletionStatus,
                    partiallyCompletedPercent: modalCompletionStatus === 'partially' ? modalPartialPercent : (modalCompletionStatus === 'completed' ? 100 : 0),
                    incompleteReason: modalCompletionStatus === 'not_completed' ? modalIncompleteReason : undefined,
                    lessonName: cleanLessonName,
                    title: cleanLessonName,
                    syncToSpacedRepetition: true
                  } as any);

                  setStageCompletionModal(null);
                }}
                className="px-6 py-2.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>حفظ النتيجة وإكمال الجلسة 🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Based Onboarding Wizard Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md" style={{ direction: 'rtl' }}>
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-[2rem] p-8 text-center shadow-2xl flex flex-col justify-between items-center min-h-[460px] animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            
            {/* Ambient colored backdrop glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl" />

            {/* Slide Header Progress Bar */}
            <div className="w-full flex items-center gap-1 mb-6">
              {[0, 1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    step <= onboardingStep ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}
                />
              ))}
            </div>

            {/* Slide Content */}
            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 shadow-sm mb-6 animate-bounce">
                {onboardingStep === 0 && <Sparkles className="w-10 h-10 text-indigo-500" />}
                {onboardingStep === 1 && <TimerIcon className="w-10 h-10 text-emerald-500" />}
                {onboardingStep === 2 && <Brain className="w-10 h-10 text-purple-500" />}
                {onboardingStep === 3 && <TrendingUp className="w-10 h-10 text-amber-500" />}
              </div>

              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
                {onboardingStep === 0 && "مرحباً بك في مساعدك الدراسي الذكي! 🚀"}
                {onboardingStep === 1 && "المذاكرة المركزة وجدولك الأسبوعي ⏱️🗓️"}
                {onboardingStep === 2 && "التكرار المتباعد وصحة الذاكرة 🧠📈"}
                {onboardingStep === 3 && "التنبؤ بالمجموع ومستشار الدماغ 🎯🧪"}
              </h2>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm font-semibold">
                {onboardingStep === 0 && "نظام مصمم خصيصاً لطلاب الثانوية العامة، لتمكينك من الدراسة بكفاءة عالية وبناء ذاكرة ممتدة المدى خالية من التشتت والنسيان."}
                {onboardingStep === 1 && "استخدم مؤقت بومودورو لقياس تركيزك والمنظم الذكي لتوليد جدول دراسي أسبوعي متزن يعتمد على قدرتك النفسية والجسدية ويتجنب الاحتراق الدراسي."}
                {onboardingStep === 2 && "توقف عن الحفظ المكرر! فور تعليم أي درس كمكتمل، سيولد لك النظام تلقائياً مراجعات متباعدة ذكية (SM-2) تقيك من النسيان وتدعم ذاكرتك الدائمة."}
                {onboardingStep === 3 && "توقع مجموعك النهائي بدقة، وراقب فترات نومك وضغطك النفسي لتلقي نصائح عصبية تساعد دماغك على الأداء بأفضل طاقة ممكنة يومياً."}
              </p>
            </div>

            {/* Slide Action Buttons */}
            <div className="w-full flex items-center justify-between gap-4 mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => {
                  localStorage.setItem('onboarding_completed', 'true');
                  setShowOnboarding(false);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-bold px-3 py-2 cursor-pointer"
              >
                تخطي الجولة
              </button>

              <div className="flex items-center gap-2">
                {onboardingStep > 0 && (
                  <button
                    onClick={() => setOnboardingStep(onboardingStep - 1)}
                    className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                  >
                    السابق
                  </button>
                )}

                <button
                  onClick={() => {
                    if (onboardingStep < 3) {
                      setOnboardingStep(onboardingStep + 1);
                    } else {
                      localStorage.setItem('onboarding_completed', 'true');
                      setShowOnboarding(false);
                    }
                  }}
                  className="px-6 py-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {onboardingStep === 3 ? "ابدأ المذاكرة الذكية! 🎉" : "التالي ➔"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Check-in Modal */}
      <AnimatePresence>
        {showCheckinModal && (
          <DailyCheckinModal
            isOpen={showCheckinModal}
            existingCheckin={dailyCheckins.find(c => c.date === new Date().toISOString().split('T')[0])}
            onClose={() => setShowCheckinModal(false)}
            onSkip={() => {
              const todayStr = new Date().toISOString().split('T')[0];
              localStorage.setItem(`checkin_skip_${todayStr}`, 'true');
              setShowCheckinModal(false);
            }}
            onPostpone={() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const thirtyMinutesLater = Date.now() + 30 * 60 * 1000;
              localStorage.setItem(`checkin_postponed_until_${todayStr}`, String(thirtyMinutesLater));
              setShowCheckinModal(false);
            }}
            onSave={(newCheckin) => {
              handleAddDailyCheckin(newCheckin);
              setShowCheckinModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
