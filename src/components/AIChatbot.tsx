/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, BookOpen, HelpCircle, MessageSquare, 
  Brain, ChevronLeft, ChevronRight, CheckCircle, RefreshCw, Check, Lightbulb, 
  Activity, Info, Clock, Target, Layers, Award, Play, RotateCcw, Zap,
  CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, HelpCircle as HintIcon,
  Compass, Flame, GraduationCap, FileCheck, Bookmark, Sparkle, Languages, FlaskConical
} from 'lucide-react';
import { ChatMessage, Subject } from '../types';
import { SEED_SUBJECTS, CurriculumSubject, Unit, Lesson } from '../db/curriculum_seed';

interface AIChatbotProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => Promise<string>;
  onClearChat?: () => void;
  subjects: Subject[];
  token: string | null;
  isOnline?: boolean;
  user?: {
    name?: string;
    email?: string;
    stream?: 'math' | 'science' | 'literature';
    curriculumTrack?: 'arabic' | 'languages';
    academicYear?: 'first' | 'second' | 'third';
    targetPercentage?: number;
  } | null;
}

interface ExamQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  coachingTip?: string;
}

interface GeneratedExam {
  quizTitle: string;
  detectedSubject: string;
  detectedTopic: string;
  difficultyLevel: string;
  targetTimeMinutes: number;
  learningOutcomesTested?: string[];
  questions: ExamQuestion[];
}

const renderSubjectIcon = (iconName?: string) => {
  switch (iconName) {
    case 'BookOpen':
      return <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />;
    case 'Languages':
      return <Languages className="w-4 h-4 text-emerald-600 shrink-0" />;
    case 'Layers':
      return <Layers className="w-4 h-4 text-blue-600 shrink-0" />;
    case 'Compass':
      return <Compass className="w-4 h-4 text-sky-600 shrink-0" />;
    case 'Flame':
      return <Flame className="w-4 h-4 text-rose-600 shrink-0" />;
    case 'FlaskConical':
      return <FlaskConical className="w-4 h-4 text-purple-600 shrink-0" />;
    case 'Brain':
      return <Brain className="w-4 h-4 text-pink-600 shrink-0" />;
    case 'GraduationCap':
      return <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />;
    default:
      return <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
};

export default function AIChatbot({ chatHistory, onSendMessage, onClearChat, subjects, token, isOnline = true, user }: AIChatbotProps) {
  // Main Tab navigation
  const [mainTab, setMainTab] = useState<'consultant' | 'smart_exam'>('consultant');

  // Universal Loading & Error state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ==========================================
  // TAB 1: ACADEMIC CONSULTANT & COACHING CHAT
  // ==========================================
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [activeCoachingMode, setActiveCoachingMode] = useState<'general' | 'feynman' | 'spaced_rep' | 'exam_strategy'>('general');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendChat = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    setInputMessage('');
    setIsLoading(true);
    setErrorMessage(null);

    let prefix = '';
    if (activeCoachingMode === 'feynman') {
      prefix = '[نظام التوجيه - أسلوب فاينمان البسيط]: ';
    } else if (activeCoachingMode === 'spaced_rep') {
      prefix = '[نظام التوجيه - استراتيجية التكرار المتباعد والتذكر النشط]: ';
    } else if (activeCoachingMode === 'exam_strategy') {
      prefix = '[نظام التوجيه - استراتيجية التعامل مع أسئلة امتحانات الثانوية العامة]: ';
    }

    try {
      await onSendMessage(prefix + textToSend);
    } catch (err: any) {
      setErrorMessage('تعذر التواصل مع المستشار التعليمي حالياً. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // TAB 2: SMART CURRICULUM EXAMS (PDF-FREE)
  // ==========================================
  // User profile defaults
  const userYear = user?.academicYear || 'third';
  const userTrack = user?.curriculumTrack || 'arabic';
  const userSpec = user?.stream || 'science';

  // Selection states
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(-1); // -1 = All Units (كامل المنهج)
  const [selectedLessonId, setSelectedLessonId] = useState<string>('all'); // 'all' = All lessons in unit

  const filteredSeedSubjects = SEED_SUBJECTS.filter(s => {
    if (userYear && s.academicYear !== userYear) return false;
    if (userTrack && s.curriculumTrack !== userTrack) return false;
    if (userSpec && s.specialization !== 'general' && s.specialization !== userSpec) return false;
    return true;
  });

  // Ensure selectedSubjectId is valid inside current filtered list
  useEffect(() => {
    if (filteredSeedSubjects.length > 0 && !filteredSeedSubjects.some(s => s.id === selectedSubjectId)) {
      setSelectedSubjectId(filteredSeedSubjects[0].id);
      setSelectedUnitIndex(-1);
      setSelectedLessonId('all');
    }
  }, [filteredSeedSubjects, selectedSubjectId]);

  // Exam parameters
  const [mcqCount, setMcqCount] = useState<number>(10);
  const [targetTimeMinutes, setTargetTimeMinutes] = useState<number>(15);
  const [difficultyLevel, setDifficultyLevel] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('extreme');
  const [examLanguage, setExamLanguage] = useState<'ar' | 'en'>(userTrack === 'languages' ? 'en' : 'ar');

  useEffect(() => {
    setExamLanguage(userTrack === 'languages' ? 'en' : 'ar');
  }, [userTrack]);

  // Exam execution state
  const [examStep, setExamStep] = useState<'setup' | 'active_exam' | 'results'>('setup');
  const [generatedExam, setGeneratedExam] = useState<GeneratedExam | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [showHintMap, setShowHintMap] = useState<Record<number, boolean>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);

  // Active Subject object derived from seed
  const currentSubjectObj = SEED_SUBJECTS.find(s => s.id === selectedSubjectId) || SEED_SUBJECTS[0];
  const currentUnitObj = (selectedUnitIndex >= 0 && currentSubjectObj.units[selectedUnitIndex]) ? currentSubjectObj.units[selectedUnitIndex] : null;
  const currentLessonObj = currentUnitObj ? currentUnitObj.lessons.find(l => l.id === selectedLessonId) : null;

  // Countdown timer for active exam
  useEffect(() => {
    let timer: any = null;
    if (examStep === 'active_exam' && timeRemainingSeconds > 0) {
      timer = setInterval(() => {
        setTimeRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setExamStep('results');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [examStep, timeRemainingSeconds]);

  // Handle generating the exam from curriculum
  const handleGenerateCurriculumExam = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const subjectName = currentSubjectObj.name;
    const unitName = currentUnitObj ? currentUnitObj.name : 'شامل أبواب المنهج';
    const lessonName = currentLessonObj ? currentLessonObj.name : (currentUnitObj ? `جميع دروس ${currentUnitObj.name}` : 'كامل المنهج الدراسي');
    
    // Extract learning outcomes & concepts
    let learningOutcomes: string[] = [];
    let concepts: string[] = [];
    let keywords: string[] = [];

    if (currentLessonObj) {
      learningOutcomes = currentLessonObj.officialLearningOutcomes || [];
      concepts = currentLessonObj.concepts || [];
      keywords = currentLessonObj.keywords || [];
    } else if (currentUnitObj) {
      currentUnitObj.lessons.forEach(l => {
        if (l.officialLearningOutcomes) learningOutcomes.push(...l.officialLearningOutcomes);
        if (l.concepts) concepts.push(...l.concepts);
      });
    }

    try {
      const response = await fetch('/api/ai/document-vault-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          documentName: `اختبار ${subjectName} - ${lessonName}`,
          mode: 'mcq_quiz',
          mcqCount,
          targetTimeMinutes,
          subjectName,
          unitName,
          lessonName: currentLessonObj ? currentLessonObj.name : '',
          topicName: lessonName,
          learningOutcomes,
          concepts,
          keywords,
          difficulty: difficultyLevel,
          language: examLanguage,
          isGeneralExamWithoutPdf: true
        })
      });

      if (!response.ok) {
        throw new Error('تعذر توليد الامتحان المنهجي الذكي');
      }

      const examData: GeneratedExam = await response.json();
      
      if (!examData || !examData.questions || examData.questions.length === 0) {
        throw new Error('لم يتضمن الرد أسئلة صلاحية');
      }

      setGeneratedExam(examData);
      setUserAnswers(new Array(examData.questions.length).fill(-1));
      setCurrentQuestionIdx(0);
      setShowHintMap({});
      setTimeRemainingSeconds((examData.targetTimeMinutes || targetTimeMinutes) * 60);
      setExamStep('active_exam');
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء توليد الأسئلة المنهجية.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (qIdx: number, optionIdx: number) => {
    setUserAnswers(prev => {
      const copy = [...prev];
      copy[qIdx] = optionIdx;
      return copy;
    });
  };

  const calculateScore = () => {
    if (!generatedExam) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    generatedExam.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });
    const total = generatedExam.questions.length;
    return {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0
    };
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 dir-rtl" style={{ direction: 'rtl' }}>
      
      {/* HEADER & MAIN NAVIGATION TABS */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-xl shadow-md">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                منظومة التوجيه والتقييم المنهجي الذكي
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                  منهج الثانوية العامة 🇪🇬
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                مستشار المذاكرة الميداني + امتحانات منهجية مخصصة بدقة حسب الدروس والمخرجات التعليمية
              </p>
            </div>
          </div>

          {/* MAIN TABS */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setMainTab('consultant')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                mainTab === 'consultant'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>المستشار الأكاديمي والمدرب</span>
            </button>
            <button
              onClick={() => setMainTab('smart_exam')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                mainTab === 'smart_exam'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>امتحانات المنهج الذكية</span>
              <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">جديد</span>
            </button>
          </div>
        </div>
      </div>

      {/* ERROR ALERT BANNER */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-3 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">
            إغلاق
          </button>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 1: ACADEMIC CONSULTANT & COACHING CHAT */}
      {/* ========================================== */}
      {mainTab === 'consultant' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-6xl w-full mx-auto p-3 md:p-4 gap-4">
          
          {/* SIDEBAR: COACHING MODES & QUICK SHORTCUTS */}
          <div className="w-full md:w-80 shrink-0 flex flex-col gap-3">
            
            {/* NEUROSCIENCE COACHING MODES */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>أنماط التدريب والتوجيه العصبي</span>
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => setActiveCoachingMode('general')}
                  className={`w-full text-right p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                    activeCoachingMode === 'general'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Compass className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">المستشار الأكاديمي العام</div>
                    <div className="text-[11px] text-slate-500 font-normal">إرشادات واستفسارات منهجية مفتوحة</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveCoachingMode('feynman')}
                  className={`w-full text-right p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                    activeCoachingMode === 'feynman'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">شرح فاينمان (تبسيط المفاهيم المعقدة)</div>
                    <div className="text-[11px] text-slate-500 font-normal">شرح مبسط باستخدام التشبيهات والأمثلة</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveCoachingMode('spaced_rep')}
                  className={`w-full text-right p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                    activeCoachingMode === 'spaced_rep'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Activity className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">التكرار المتباعد والتذكر النشط</div>
                    <div className="text-[11px] text-slate-500 font-normal">خطة تثبيت المعلومات لمنع منحنى النسيان</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveCoachingMode('exam_strategy')}
                  className={`w-full text-right p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                    activeCoachingMode === 'exam_strategy'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Target className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">استراتيجية التعامل مع الامتحانات</div>
                    <div className="text-[11px] text-slate-500 font-normal">تحليل أسئلة الفهم والتطبيق وتجنب المشتتات</div>
                  </div>
                </button>
              </div>
            </div>

            {/* QUICK COACHING PROMPTS */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex-1">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>أسئلة توجيهية سريعة</span>
              </h3>

              <div className="space-y-2">
                {[
                  'كيف أنظم جدول المذاكرة اليومي مع التكرار المتباعد؟',
                  'كيف أتعامل مع أسئلة الفهم والتفكير العليا في الفيزياء؟',
                  'أفضل طريقة لاستيعاب القواعد النحوية والبلاغة للثانوية العامة',
                  'كيف أتغلب على النسيان والتوتر أثناء حل الامتحانات؟'
                ].map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSendChat(undefined, prompt)}
                    disabled={isLoading}
                    className="w-full text-right p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-900 text-xs transition-all"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CHAT MESSAGES AREA */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            
            {/* CHAT MESSAGES STREAM */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
                    <Brain className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">أهلاً بك في جلسة التوجيه الميداني والتدريب التعليمي</h3>
                  <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                    يمكنك طرح أي استفسار منهجياً أو طلب شرح مبسط لدرس محدد، أو استخدام نماذج التوجيه العصبي لمنع النسيان وتنظيم وقت المذاكرة.
                  </p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text || (msg as any).content}</div>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-bl-none p-4 text-slate-600 text-xs flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>جاري تحليل السؤال وكتابة التوجيه المنهجي...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* CHAT INPUT FORM */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 bg-slate-50/50 flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="اكتب استفسارك المنهجي أو اختر درساً لشرحه..."
                disabled={isLoading}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm"
              >
                <span>إرسال</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: SMART CURRICULUM EXAMS (PDF-FREE) */}
      {/* ========================================== */}
      {mainTab === 'smart_exam' && (
        <div className="flex-1 overflow-y-auto p-3 md:p-6 max-w-6xl w-full mx-auto">
          
          {/* STEP 1: SETUP EXAM SELECTION PAGE */}
          {examStep === 'setup' && (
            <div className="space-y-6">
              
              {/* TOP INTRO CARD */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 bg-indigo-500/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-indigo-200 mb-3 border border-indigo-400/30">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>مضمن 100% داخل حدود المنهج الرسمي المقرر</span>
                  </div>
                  <h2 className="text-2xl font-black mb-2">مولّد امتحانات المنهج والتأهيل النهائي</h2>
                  <p className="text-xs md:text-sm text-indigo-100/90 leading-relaxed">
                    حدد المادة ثم اختر الباب أو الدرس المحدد بدقة، وسيقوم النظام بتوليد امتحان تفاعلي ذكي ملتزم تماماً بمخرجات التعلم الرسمية ومصمم لمنع أي خروج عن نطاق الدرس.
                  </p>
                </div>
              </div>

              {/* GRID: SUBJECTS & LESSON SCOPE SELECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMN 1: SELECT SUBJECT */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>1. اختر المادة الدراسية</span>
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      ({filteredSeedSubjects.length} مواد)
                    </span>
                  </div>

                  {/* ACTIVE USER PROFILE BANNER */}
                  <div className="bg-indigo-50/70 rounded-xl p-3 border border-indigo-100 text-xs flex items-center gap-2.5">
                    <GraduationCap className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-bold text-indigo-950">
                        مواد الشعبة: {userSpec === 'science' ? 'علمي علوم' : userSpec === 'math' ? 'علمي رياضة' : 'أدبي'}
                      </div>
                      <div className="text-[11px] text-indigo-700/80 mt-0.5">
                        {userYear === 'third' ? 'الصف الثالث الثانوي' : userYear === 'second' ? 'الصف الثاني الثانوي' : 'الصف الأول الثانوي'} • {userTrack === 'languages' ? 'منهج لغات' : 'منهج عربي'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {filteredSeedSubjects.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        لا توجد مواد تطابق التصفية المحددة
                      </div>
                    ) : (
                      filteredSeedSubjects.map((sub, sIdx) => {
                        const isSelected = sub.id === selectedSubjectId;

                        return (
                          <button
                            key={`${sub.id}_${sIdx}`}
                            onClick={() => {
                              setSelectedSubjectId(sub.id);
                              setSelectedUnitIndex(-1);
                              setSelectedLessonId('all');
                            }}
                            className={`w-full text-right p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold shadow-sm'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {renderSubjectIcon(sub.icon)}
                              <span className="font-bold text-slate-900">{sub.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal shrink-0">
                              {sub.units.length} أبواب
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* COLUMN 2: SELECT UNIT & LESSON SCOPE */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b pb-3">
                    <Target className="w-4 h-4 text-indigo-600" />
                    <span>2. تحديد نطاق الامتحان (الباب / الدرس)</span>
                  </h3>

                  {/* UNIT SELECTOR DROPDOWN */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">اختر الباب / الوحدة:</label>
                    <select
                      value={selectedUnitIndex}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setSelectedUnitIndex(val);
                        setSelectedLessonId('all');
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={-1}>✨ كامل المنهج (اختبار عام شامل)</option>
                      {currentSubjectObj.units.map((unit, uIdx) => (
                        <option key={uIdx} value={uIdx}>
                          {unit.name} ({unit.lessons.length} دروس)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* LESSON SELECTOR DROPDOWN (if unit selected) */}
                  {selectedUnitIndex >= 0 && currentUnitObj && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <label className="text-xs font-bold text-slate-700">تحديد الدرس بدقة (نطاق مغلق):</label>
                      <select
                        value={selectedLessonId}
                        onChange={(e) => setSelectedLessonId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">🎯 جميع دروس الباب ({currentUnitObj.name})</option>
                        {currentUnitObj.lessons.map((les) => (
                          <option key={les.id} value={les.id}>
                            الدرس {les.lessonNumber}: {les.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* CURRICULUM DETAILS BANNER */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
                      <span>نطاق الامتحان المحدد:</span>
                    </div>
                    <div className="text-slate-700 font-medium bg-white p-2 rounded-lg border border-slate-200">
                      {currentLessonObj ? currentLessonObj.name : (currentUnitObj ? currentUnitObj.name : 'كامل منهج ' + currentSubjectObj.name)}
                    </div>

                    {currentLessonObj && currentLessonObj.officialLearningOutcomes && (
                      <div className="pt-1">
                        <span className="text-[11px] font-bold text-slate-600">نواتج التعلم الرسمية المستهدفة:</span>
                        <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1 mt-1 pr-1">
                          {currentLessonObj.officialLearningOutcomes.slice(0, 3).map((out, oIdx) => (
                            <li key={oIdx}>{out}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUMN 3: EXAM PARAMETERS & LAUNCH BUTTON */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b pb-3">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>3. إعدادات الامتحان</span>
                    </h3>

                    {/* NUMBER OF QUESTIONS */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex justify-between">
                        <span>عدد الأسئلة:</span>
                        <span className="text-indigo-600 font-bold">{mcqCount} سؤالاً</span>
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 15, 20].map((num) => (
                          <button
                            key={num}
                            onClick={() => setMcqCount(num)}
                            className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              mcqCount === num
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* DURATION */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex justify-between">
                        <span>الزمن المخصص:</span>
                        <span className="text-indigo-600 font-bold">{targetTimeMinutes} دقيقة</span>
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[10, 15, 30, 45].map((mins) => (
                          <button
                            key={mins}
                            onClick={() => setTargetTimeMinutes(mins)}
                            className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              targetTimeMinutes === mins
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {mins} د
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* DIFFICULTY */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">مستوى الأسئلة:</label>
                      <select
                        value={difficultyLevel}
                        onChange={(e) => setDifficultyLevel(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="easy">سهل ومباشر (أساسيات الدرس)</option>
                        <option value="medium">متوسط (تطبيقات منهجية)</option>
                        <option value="hard">صعب وعميق (تفكير عليا)</option>
                        <option value="extreme">مستوى امتحان الثانوية العامة الرسمي 🇪🇬</option>
                      </select>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    onClick={handleGenerateCurriculumExam}
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري صياغة أسئلة الدرس الرسمية...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>توليد وبدء الامتحان المنهجي الذكي</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: SMART EXAM SUMMARY & QUESTIONS VIEW (SECOND SUMMARY VIEW) */}
          {/* ============================================================== */}
          {examStep === 'active_exam' && generatedExam && (
            <div className="space-y-6">
              
              {/* PROMINENT SMART EXAM SUMMARY BANNER */}
              <div className="bg-white rounded-2xl p-5 border-2 border-indigo-500 shadow-md space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs">
                        ⚡ {generatedExam.detectedSubject || currentSubjectObj.name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                        🎯 {generatedExam.detectedTopic || 'نطاق الدرس المحدد'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>مضمون 100% داخل حدود المنهج فقط</span>
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 pt-1">
                      {generatedExam.quizTitle}
                    </h2>
                  </div>

                  {/* TIMER BANNER */}
                  <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-2.5 rounded-xl self-start md:self-auto">
                    <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">الوقت المتبقي</div>
                      <div className="text-lg font-black tracking-wider text-amber-300">
                        {formatTimer(timeRemainingSeconds)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TESTED OUTCOMES HIGHLIGHT */}
                {generatedExam.learningOutcomesTested && generatedExam.learningOutcomesTested.length > 0 && (
                  <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100 text-xs space-y-1">
                    <span className="font-bold text-indigo-900">نواتج التعلم الرسمية المختبرة في هذا النموذج:</span>
                    <ul className="list-disc list-inside text-indigo-950 font-medium space-y-0.5 pr-1">
                      {generatedExam.learningOutcomesTested.slice(0, 2).map((out, oIdx) => (
                        <li key={oIdx}>{out}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* QUESTION NAVIGATOR PILLS */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
                  <span className="text-xs font-bold text-slate-600 shrink-0 ml-2">الأسئلة:</span>
                  {generatedExam.questions.map((_, qIdx) => {
                    const isAnswered = userAnswers[qIdx] !== -1;
                    const isCurrent = qIdx === currentQuestionIdx;
                    return (
                      <button
                        key={qIdx}
                        onClick={() => setCurrentQuestionIdx(qIdx)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${
                          isCurrent
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 shadow-sm'
                            : isAnswered
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {qIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CURRENT ACTIVE QUESTION CARD */}
              {generatedExam.questions[currentQuestionIdx] && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                  
                  {/* QUESTION HEADER */}
                  <div className="flex items-center justify-between border-b pb-3 text-xs text-slate-500">
                    <span className="font-bold text-indigo-600">
                      السؤال {currentQuestionIdx + 1} من {generatedExam.questions.length}
                    </span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 font-medium">
                      درجة السؤال: 1
                    </span>
                  </div>

                  {/* QUESTION STEM */}
                  <div className="text-base md:text-lg font-bold text-slate-900 leading-relaxed">
                    {generatedExam.questions[currentQuestionIdx].question}
                  </div>

                  {/* OPTIONS GRID */}
                  <div className="space-y-3">
                    {generatedExam.questions[currentQuestionIdx].options.map((optionText, optIdx) => {
                      const isSelected = userAnswers[currentQuestionIdx] === optIdx;
                      const optionLetters = ['أ', 'ب', 'جـ', 'د'];
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(currentQuestionIdx, optIdx)}
                          className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center justify-between text-sm md:text-base font-medium ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-950 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {optionLetters[optIdx] || optIdx + 1}
                            </span>
                            <span>{optionText}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* AI COACHING HINT BUTTON */}
                  {generatedExam.questions[currentQuestionIdx].coachingTip && (
                    <div className="pt-2">
                      {!showHintMap[currentQuestionIdx] ? (
                        <button
                          onClick={() => setShowHintMap(prev => ({ ...prev, [currentQuestionIdx]: true }))}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 transition-all"
                        >
                          <HintIcon className="w-4 h-4 text-amber-500" />
                          <span>تلميح المدرب الذكي (AI Coaching Hint) 💡</span>
                        </button>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-amber-800">
                            <HintIcon className="w-4 h-4 text-amber-600" />
                            <span>تلميح التوجيه المنهجي:</span>
                          </div>
                          <p className="leading-relaxed">{generatedExam.questions[currentQuestionIdx].coachingTip}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONTROLS (PREV, NEXT, SUBMIT) */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIdx === 0}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>السؤال السابق</span>
                    </button>

                    {currentQuestionIdx < generatedExam.questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIdx(prev => Math.min(generatedExam.questions.length - 1, prev + 1))}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <span>السؤال التالي</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setExamStep('results')}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>إنهاء وتسليم الامتحان</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: EXAM RESULTS & BOOSTED AI COACHING REPORT */}
          {/* ============================================================== */}
          {examStep === 'results' && generatedExam && (() => {
            const score = calculateScore();
            return (
              <div className="space-y-6">
                
                {/* RESULTS HEADER SCORE CARD */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
                  <div className="inline-flex p-4 rounded-full bg-indigo-50 text-indigo-600 mb-1">
                    <Award className="w-12 h-12" />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">نتيجة الامتحان المنهجي الذكي</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {generatedExam.quizTitle}
                    </p>
                  </div>

                  <div className="flex justify-center items-center gap-6 py-3 border-y border-slate-100">
                    <div>
                      <div className="text-3xl font-black text-indigo-600">{score.percentage}%</div>
                      <div className="text-xs text-slate-500 font-medium">الدرجة المئوية</div>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div>
                      <div className="text-3xl font-black text-slate-800">{score.correct} / {score.total}</div>
                      <div className="text-xs text-slate-500 font-medium">الأسئلة الصحيحة</div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => setExamStep('setup')}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>اختيار درس/مادة جديدة</span>
                    </button>
                    <button
                      onClick={handleGenerateCurriculumExam}
                      disabled={isLoading}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>إعادة الامتحان بنموذج جديد</span>
                    </button>
                  </div>
                </div>

                {/* BOOSTED AI COACHING BREAKDOWN */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
                  <h3 className="text-base font-bold flex items-center gap-2 text-indigo-200">
                    <Brain className="w-5 h-5 text-indigo-400" />
                    <span>تقرير التوجيه العصبي والتحليل الأكاديمي الشامل (AI Coaching Report)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-2">
                      <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>نقاط القوة والاستيعاب المنهجي:</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">
                        {score.percentage >= 80
                          ? 'أظهرت استيعاباً ممتازاً لمبادئ ونواتج تعلم هذا الدرس. يمكنك الانتقال إلى الدرس التالي بثقة.'
                          : 'تمتلك حصيلة جيدة في الأسئلة المباشرة والمفاهيم الأساسية للدرس.'}
                      </p>
                    </div>

                    <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-2">
                      <div className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>توصية التكرار المتباعد المخصصة:</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">
                        {score.percentage < 100
                          ? 'يُنصح بإعادة مراجعة الأسئلة غير المكتملة وتطبيق طريقة "شرح فاينمان" على النقاط الشائكة قبل الانتقال للفصل التالي.'
                          : 'رائع! قم بجدولة مراجعة سريعة لهذه المادة بعد 3 أيام لتأكيد الحفظ الدائم بالنواقل العصبية.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* FULL QUESTIONS REVIEW WITH EXPLANATIONS */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                  <h3 className="font-bold text-slate-900 text-base border-b pb-3 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-indigo-600" />
                    <span>مراجعة إجابات الأسئلة مع الشرح المنهجي التفصيلي</span>
                  </h3>

                  <div className="space-y-6">
                    {generatedExam.questions.map((q, qIdx) => {
                      const userAns = userAnswers[qIdx];
                      const isCorrect = userAns === q.correctIndex;
                      return (
                        <div key={qIdx} className={`p-4 rounded-xl border space-y-3 ${
                          isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                        }`}>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              س{qIdx + 1}: {q.question}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                              isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isCorrect ? 'إجابة صحيحة ✓' : 'إجابة خاطئة ✗'}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            {q.options.map((opt, oIdx) => {
                              const isThisCorrect = oIdx === q.correctIndex;
                              const isThisUserAns = oIdx === userAns;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-2.5 rounded-lg border font-medium flex items-center justify-between ${
                                    isThisCorrect
                                      ? 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold'
                                      : isThisUserAns
                                      ? 'bg-rose-100 border-rose-300 text-rose-950 font-bold'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {isThisCorrect && <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md">الإجابة الصحيحة</span>}
                                  {isThisUserAns && !isThisCorrect && <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-md">اختيارك</span>}
                                </div>
                              );
                            })}
                          </div>

                          {/* DETAILED EXPLANATION */}
                          <div className="bg-white/80 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                            <span className="font-bold text-indigo-900 block">التفسير والأساس المنهجي:</span>
                            <p className="leading-relaxed">{q.explanation}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })()}

        </div>
      )}

    </div>
  );
}
