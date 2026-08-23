/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Award, 
  Calendar, 
  ChevronRight, 
  TrendingUp, 
  Sparkles, 
  Trash, 
  CheckCircle2, 
  BookOpen, 
  FileText, 
  Trophy, 
  Clock, 
  Activity, 
  Settings, 
  BarChart2, 
  HelpCircle,
  TrendingDown,
  Info
} from 'lucide-react';
import { Exam, Subject } from '../types';

interface ExamsTrackerProps {
  exams: Exam[];
  subjects: Subject[];
  onAddExam: (exam: Omit<Exam, 'id'>) => void;
  onRecordGrade: (id: string, score: number, topScore?: number) => void;
  onDeleteExam: (id: string) => void;
  consistencyScore: number;
  thanaweyaStartDate?: string;
  onUpdateThanaweyaStartDate?: (date: string) => void;
}

export default function ExamsTracker({ 
  exams, 
  subjects, 
  onAddExam, 
  onRecordGrade, 
  onDeleteExam, 
  consistencyScore,
  thanaweyaStartDate = '2026-08-25',
  onUpdateThanaweyaStartDate
}: ExamsTrackerProps) {
  
  // State for adding a new assessment
  const [title, setTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalScore, setTotalScore] = useState(60); 
  const [preparationLevel, setPreparationLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [assessmentType, setAssessmentType] = useState<'mock' | 'homework' | 'quiz'>('mock');
  const [userScoreInput, setUserScoreInput] = useState<string>('');
  const [topScoreInput, setTopScoreInput] = useState<string>('');
  
  // State for recording score in list
  const [scoreRecord, setScoreRecord] = useState<{ [id: string]: string }>({});
  const [topScoreRecord, setTopScoreRecord] = useState<{ [id: string]: string }>({});
  
  // State for interactive chart filtering
  const [chartTypeFilter, setChartTypeFilter] = useState<'all' | 'mock' | 'homework' | 'quiz'>('all');
  
  // Current Date string
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  // Check if journey has started
  const isJourneyStarted = useMemo(() => {
    return todayStr >= thanaweyaStartDate;
  }, [thanaweyaStartDate, todayStr]);

  // Sync default subject ID
  useEffect(() => {
    if (subjects.length > 0 && (!selectedSubjectId || !subjects.some(s => s.id === selectedSubjectId))) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Handle adding new grade/assessment
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const actualScore = userScoreInput.trim() !== '' ? Number(userScoreInput) : undefined;
    const finalTopScore = topScoreInput.trim() !== '' ? Number(topScoreInput) : undefined;

    onAddExam({
      title: title.trim(),
      subjectId: selectedSubjectId,
      date,
      totalScore: Number(totalScore),
      preparationLevel,
      type: assessmentType,
      topScore: finalTopScore,
      score: actualScore
    });

    setTitle('');
    setUserScoreInput('');
    setTopScoreInput('');
  };

  // Helper mapping subjects
  const subjectMap = useMemo(() => {
    const map: { [id: string]: Subject } = {};
    subjects.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [subjects]);

  // CRITICAL REQUIREMENT: Filter out any items dated BEFORE thanaweyaStartDate
  const activeExams = useMemo(() => {
    if (!thanaweyaStartDate) return exams;
    return exams.filter(e => e.date >= thanaweyaStartDate);
  }, [exams, thanaweyaStartDate]);

  // Calculations of Graded Items
  const gradedExams = useMemo(() => activeExams.filter((e) => e.score !== undefined), [activeExams]);

  // Group graded items by type
  const typeAverages = useMemo(() => {
    const mocks = gradedExams.filter(e => !e.type || e.type === 'mock');
    const homeworks = gradedExams.filter(e => e.type === 'homework');
    const quizzes = gradedExams.filter(e => e.type === 'quiz');

    const avgMocks = mocks.length > 0 ? (mocks.reduce((acc, e) => acc + (e.score || 0) / e.totalScore, 0) / mocks.length) * 100 : null;
    const avgHomeworks = homeworks.length > 0 ? (homeworks.reduce((acc, e) => acc + (e.score || 0) / e.totalScore, 0) / homeworks.length) * 100 : null;
    const avgQuizzes = quizzes.length > 0 ? (quizzes.reduce((acc, e) => acc + (e.score || 0) / e.totalScore, 0) / quizzes.length) * 100 : null;

    return {
      mock: avgMocks,
      homework: avgHomeworks,
      quiz: avgQuizzes,
      mocksCount: mocks.length,
      homeworksCount: homeworks.length,
      quizzesCount: quizzes.length
    };
  }, [gradedExams]);

  // Weighted score prediction incorporating Mocks (50%), Quizzes (30%), Homeworks (20%)
  const weightedPercentage = useMemo(() => {
    const weights = [
      { avg: typeAverages.mock, weight: 50 },
      { avg: typeAverages.quiz, weight: 30 },
      { avg: typeAverages.homework, weight: 20 }
    ];

    const activeWeights = weights.filter(w => w.avg !== null);
    if (activeWeights.length === 0) return 0; // lock predictions if no grades entered or pre-journey

    const totalWeight = activeWeights.reduce((acc, w) => acc + w.weight, 0);
    const weightedSum = activeWeights.reduce((acc, w) => acc + (w.avg! * w.weight), 0);
    return Math.round(weightedSum / totalWeight);
  }, [typeAverages]);

  // AI Predictor Model
  const predictedFinalScore = useMemo(() => {
    // If we have no grades yet or journey hasn't started, return null/placeholder
    if (weightedPercentage === 0 || !isJourneyStarted) {
      return { percent: 0, marks: 0 };
    }
    const consistencyMultiplier = (consistencyScore - 50) / 100 * 5; // Adds up to +2.5% or down to -2.5%
    const finalPercent = Math.min(Math.max(Math.round(weightedPercentage + consistencyMultiplier), 50), 100);
    const finalMarks = Number(((finalPercent / 100) * 320).toFixed(1));
    return { percent: finalPercent, marks: finalMarks };
  }, [weightedPercentage, consistencyScore, isJourneyStarted]);

  // Calculate user comparative success rate against top students
  const topStudentsComparisonStats = useMemo(() => {
    if (gradedExams.length === 0) return { beatCount: 0, closeCount: 0, total: 0, percentage: 0 };
    let beatCount = 0;
    let closeCount = 0;

    gradedExams.forEach(e => {
      const userPct = ((e.score || 0) / e.totalScore) * 100;
      const topScoreEst = e.topScore !== undefined ? e.topScore : Math.round(e.totalScore * 0.96);
      const topPct = (topScoreEst / e.totalScore) * 100;

      if (userPct >= topPct) {
        beatCount++;
      } else if (topPct - userPct <= 7) {
        closeCount++;
      }
    });

    const total = gradedExams.length;
    const percentage = Math.round(((beatCount + closeCount) / total) * 100);

    return {
      beatCount,
      closeCount,
      total,
      percentage
    };
  }, [gradedExams]);

  // Prepare data for the interactive Recharts line chart
  const chartData = useMemo(() => {
    const filtered = gradedExams.filter(e => {
      if (chartTypeFilter === 'all') return true;
      return e.type === chartTypeFilter || (chartTypeFilter === 'mock' && !e.type);
    });

    return [...filtered]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(e => {
        const scoreVal = e.score || 0;
        const total = e.totalScore || 1;
        const estTopScore = e.topScore !== undefined ? e.topScore : Math.round(total * 0.96);
        return {
          id: e.id,
          title: e.title,
          date: e.date,
          'درجتي (%)': Math.round((scoreVal / total) * 100),
          'درجة الأوائل (%)': Math.round((estTopScore / total) * 100),
        };
      });
  }, [gradedExams, chartTypeFilter]);

  // Generate descriptive text of performance relative to top students
  const evaluationFeedback = useMemo(() => {
    if (gradedExams.length === 0) return 'ابدأ بتسجيل درجاتك واختباراتك لتفعيل التقييم التنافسي.';
    const stats = topStudentsComparisonStats;
    if (stats.percentage >= 80) {
      return 'أداء استثنائي! مستواك حالياً يطابق أو يتفوق على الأوائل في معظم المواد. استمر على هذا التركيز العالي.';
    } else if (stats.percentage >= 60) {
      return 'أداء ممتاز ومنافس بقوة. أنت قريب جداً من مجاميع الأوائل، ضاعف الجهد في الواجبات لتغلق الفارق البسيط.';
    } else if (stats.percentage >= 40) {
      return 'مستوى جيد ومتقارب، لكن يحتاج لزيادة الانضباط والتحضير لحصص الشرح لضمان رفع كفاءة الإجابات التصفوية.';
    } else {
      return 'هنالك فارق واضح مقارنة بدرجات الأوائل. نوصي بمراجعة المفاهيم الضعيفة عبر مستشار الـ AI فوراً لإعادة صياغة الفهم.';
    }
  }, [gradedExams, topStudentsComparisonStats]);

  return (
    <div className="space-y-6 text-right" style={{ direction: 'rtl' }} id="exams-and-grades-diary">
      
      {/* 1. Journey Start Date Customization & Sync Section */}
      <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
            <Settings className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">تاريخ انطلاق رحلة الثانوية العامة 🚀</h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              مزامنة انطلاق الرحلة للتحكم في فترة تفعيل التنبؤات والتحليلات ومنع التوتر المسبق.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-semibold text-zinc-500 shrink-0">تاريخ البداية:</label>
          <input
            type="date"
            value={thanaweyaStartDate}
            onChange={(e) => onUpdateThanaweyaStartDate && onUpdateThanaweyaStartDate(e.target.value)}
            className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100 font-bold font-mono"
          />
          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-md shrink-0">
            مُزامَن
          </span>
        </div>
      </div>

      {/* 2. Pre-Journey Locked State Notification */}
      {!isJourneyStarted ? (
        <div className="p-6 rounded-3xl border border-dashed border-amber-300 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10 text-center space-y-3">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 rounded-full flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="text-base font-black text-amber-800 dark:text-amber-400">مرحلة ما قبل بداية رحلة الثانوية العامة!</h4>
          <p className="text-xs text-amber-700 dark:text-amber-500 max-w-xl mx-auto leading-relaxed">
            تاريخ بدء الرحلة المختار هو <strong className="font-mono text-amber-900 dark:text-white">{thanaweyaStartDate}</strong> بينما تاريخ اليوم هو {todayStr}.
            <br />
            لحماية جهازك العصبي من القلق والتراكم، <strong>جميع التحليلات المتقدمة ورسم البيانات والتوقعات مغلقة</strong> ولا تحتسب إلا بدءاً من تاريخ بداية الرحلة المحدد. يمكنك تقديم التاريخ لليوم لتفعيلها فوراً!
          </p>
          <button
            onClick={() => onUpdateThanaweyaStartDate && onUpdateThanaweyaStartDate(todayStr)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            بدء رحلتي الرسمية اليوم وتفعيل التحليلات ⚡
          </button>
        </div>
      ) : null}

      {/* 3. Stats Dashboard Cards (Disabled/Empty if pre-journey) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Graded counts and averages */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 mb-2">
            <span>متوسط التقييم العام (الوزن النسبي)</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-black font-mono text-zinc-900 dark:text-zinc-50">
            {!isJourneyStarted ? 'مغلق' : gradedExams.length > 0 ? `${weightedPercentage}%` : 'لا يوجد نتائج'}
          </h3>
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 space-y-0.5">
            <p>الشامل ({typeAverages.mocksCount}) • الواجب ({typeAverages.homeworksCount}) • الحصة ({typeAverages.quizzesCount})</p>
          </div>
        </div>

        {/* AI Prediction Out of 320 */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-950 md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-16 h-16 bg-indigo-500/10 rounded-br-full" />
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 dark:text-zinc-600 mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              توقعات درجات الثانوية العامة التراكمية المدمجة (٣٢٠ درجة)
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-400 dark:text-indigo-600" />
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mt-2">
            <div>
              <h3 className="text-3xl font-black font-mono text-amber-400 dark:text-indigo-600">
                {!isJourneyStarted ? 'مغلق مؤقتاً' : predictedFinalScore.marks > 0 ? `${predictedFinalScore.marks} / ٣٢٠` : 'بانتظار درجاتك'}
              </h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                {!isJourneyStarted 
                  ? 'سيبدأ حساب التوقعات فور حلول تاريخ بداية الرحلة.' 
                  : predictedFinalScore.percent > 0 
                    ? `مجموع تراكمي تقديري بنسبة ${predictedFinalScore.percent}% (مدمج فيه الواجبات والحصص والشامل)` 
                    : 'قم بإضافة وتسجيل درجاتك في الأسفل لحساب توقعك التراكمي.'
                }
              </p>
            </div>
            <div className="text-left text-[9px] text-zinc-400 dark:text-zinc-500 max-w-xs">
              * نظام توقع ذكي يدمج درجات واجباتك (٢٠٪) واختبار الحصة (٣٠٪) والامتحانات الشاملة (٥٠٪) مع استمرارية انضباطك الدراسي.
            </div>
          </div>
        </div>
      </div>

      {/* Comparison against Top Students Alert Banner (Only active if journey started) */}
      {isJourneyStarted && gradedExams.length > 0 && (
        <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/10 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500 text-white shrink-0 mt-0.5">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">التقرير التنافسي المباشر مع الأوائل (Benchmarking)</h4>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">{evaluationFeedback}</p>
            </div>
          </div>
          <div className="text-center shrink-0 bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-950 px-4 py-2.5 rounded-xl shadow-xs">
            <span className="text-[9px] text-zinc-400 block font-bold">معدل موازاة الأوائل</span>
            <strong className="text-lg font-black font-mono text-indigo-500">{topStudentsComparisonStats.percentage}%</strong>
          </div>
        </div>
      )}

      {/* 4. Analytics Redirection Banner */}
      {isJourneyStarted && (
        <div className="p-5 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/50 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>ملخص أداء الامتحانات والتقييمات 📈</span>
              </h4>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                تتوفر كافة الرسومات البيانية التفاعلية ومقارنات الأسابيع والمحاور المخصصة للامتحانات في <strong>تبويب الرسم البياني (Analytic) 📊</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-2xs">
              عدد الاختبارات: {exams.length}
            </span>
          </div>
        </div>
      )}

      {/* 5. Smart Form & Score Diary Log Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Diary entry form */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" />
            تسجيل تقييم جديد في الدفتر
          </h4>
          
          <form onSubmit={handleAdd} className="space-y-4">
            
            {/* Assessment Type Segment selector */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-2">نوع التقييم الدراسي:</label>
              <div className="grid grid-cols-3 gap-1.5 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setAssessmentType('mock'); setTotalScore(60); }}
                  className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${assessmentType === 'mock' ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                >
                  امتحان شامل
                </button>
                <button
                  type="button"
                  onClick={() => { setAssessmentType('homework'); setTotalScore(20); }}
                  className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${assessmentType === 'homework' ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                >
                  واجب منزلي
                </button>
                <button
                  type="button"
                  onClick={() => { setAssessmentType('quiz'); setTotalScore(15); }}
                  className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${assessmentType === 'quiz' ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                >
                  اختبار حصة
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">اسم/عنوان التقييم:</label>
              <input
                type="text"
                placeholder={assessmentType === 'mock' ? 'مثال: الباب الأول، امتحان تجريبي..' : assessmentType === 'homework' ? 'واجب الدرس الثاني كيمياء عضوي..' : 'اختبار الحصة الثالثة حديثة..'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-950 dark:text-zinc-50 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">المادة الدراسية:</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-950 dark:text-zinc-50 font-bold"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">الدرجة الكلية (النهائية):</label>
                <input
                  type="number"
                  value={totalScore}
                  onChange={(e) => setTotalScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-950 dark:text-zinc-50 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">تاريخ التقييم:</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-950 dark:text-zinc-50 font-mono"
                />
              </div>
            </div>

            {/* Score Inputs (User & Top score) directly on adding! */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-900 rounded-2xl">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1">درجتي المحققة (اختياري):</label>
                <input
                  type="number"
                  placeholder="لم يصحح بعد"
                  value={userScoreInput}
                  onChange={(e) => setUserScoreInput(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs text-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg focus:outline-none text-zinc-950 dark:text-zinc-50 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1">درجة الأوائل (اختياري):</label>
                <input
                  type="number"
                  placeholder="تلقائي 96%+"
                  value={topScoreInput}
                  onChange={(e) => setTopScoreInput(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs text-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg focus:outline-none text-zinc-950 dark:text-zinc-50 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">مستوى استعدادك المعرفي:</label>
              <select
                value={preparationLevel}
                onChange={(e) => setPreparationLevel(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none text-zinc-950 dark:text-zinc-50"
              >
                <option value="high">استعداد قاسي (جاهز تماماً) 🚀</option>
                <option value="medium">جاهزية متوسطة ⚡</option>
                <option value="low">غير جاهز كفاية (تحت التجربة) ⚠️</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-bold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>حفظ في دفتر الدرجات</span>
            </button>
          </form>
        </div>

        {/* Diary List Logger */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-indigo-500" />
              سجل دفتر الدرجات والتقييمات التفصيلي
            </h4>
            <span className="text-[10px] font-bold text-zinc-400">إجمالي التقييمات: {exams.length}</span>
          </div>

          {exams.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <p className="text-xs font-bold">دفتر الدرجات فارغ تماماً حالياً.</p>
              <p className="text-[10px] mt-1 text-zinc-500">ابدأ بجدولة أو إدخال امتحان أو واجب من الجانب الأيمن!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {exams.slice().reverse().map((exam) => {
                const sub = subjectMap[exam.subjectId];
                const isExcluded = thanaweyaStartDate && exam.date < thanaweyaStartDate;
                
                // Get type representation
                const examType = exam.type || 'mock';
                const typeLabels = {
                  mock: { label: 'امتحان شامل', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50' },
                  homework: { label: 'واجب منزلي', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50' },
                  quiz: { label: 'اختبار حصة', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50' }
                };
                const activeTypeLabel = typeLabels[examType] || typeLabels.mock;

                // Evaluate performance
                let comparisonResult = null;
                if (exam.score !== undefined) {
                  const userPct = (exam.score / exam.totalScore) * 100;
                  const finalTopScore = exam.topScore !== undefined ? exam.topScore : Math.round(exam.totalScore * 0.96);
                  const topPct = (finalTopScore / exam.totalScore) * 100;

                  if (userPct >= topPct) {
                    comparisonResult = { text: '🏆 متفوق على الأوائل!', css: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40' };
                  } else if (topPct - userPct <= 6) {
                    comparisonResult = { text: '🌟 قريب من الأوائل!', css: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40' };
                  } else if (topPct - userPct <= 15) {
                    comparisonResult = { text: '📈 منافس - يحتاج مجهود', css: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40' };
                  } else {
                    comparisonResult = { text: '💡 ضاعف المذاكرة لتعويض الفارق', css: 'bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800' };
                  }
                }

                return (
                  <div
                    key={exam.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isExcluded 
                        ? 'border-zinc-200 bg-zinc-50/55 dark:border-zinc-900/50 dark:bg-zinc-950/20 opacity-60' 
                        : 'border-zinc-100 bg-zinc-50/40 dark:border-zinc-900/30 hover:border-zinc-200 dark:hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{exam.title}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg ${activeTypeLabel.color}`}>
                            {activeTypeLabel.label}
                          </span>
                          {sub && (
                            <span
                              className="text-[9px] px-2 py-0.5 rounded-lg text-white font-black"
                              style={{ backgroundColor: sub.color }}
                            >
                              {sub.name}
                            </span>
                          )}
                          {isExcluded && (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-md">
                              مستثنى (قبل البداية) ⚠️
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-medium">
                          <span className="font-mono">{exam.date}</span>
                          <span>•</span>
                          <span>استعداد: {exam.preparationLevel === 'high' ? 'قوي 🚀' : exam.preparationLevel === 'medium' ? 'متوسط ⚡' : 'تحت التطوير ⚠️'}</span>
                        </div>
                      </div>

                      {/* Grades Entry / Comparison Display */}
                      <div className="flex items-center gap-2 shrink-0">
                        {exam.score !== undefined ? (
                          <div className="text-left space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-zinc-400">درجتك:</span>
                              <span className="text-xs font-black font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900">
                                {exam.score} / {exam.totalScore} ({Math.round((exam.score / exam.totalScore) * 100)}%)
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className="text-[9px] text-zinc-400 font-bold">الأوائل:</span>
                              <span className="text-[9px] font-bold font-mono bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 px-2 py-0.5 rounded-md">
                                {exam.topScore !== undefined ? exam.topScore : Math.round(exam.totalScore * 0.96)} / {exam.totalScore}
                              </span>
                            </div>

                            {comparisonResult && (
                              <div className={`px-2 py-0.5 rounded-lg text-[9px] font-bold text-center ${comparisonResult.css}`}>
                                {comparisonResult.text}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                            <span className="text-[9px] font-bold text-zinc-500 block">تسجيل التقييم والدرجة الفورية:</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                placeholder="درجتي"
                                value={scoreRecord[exam.id] || ''}
                                onChange={(e) => setScoreRecord({ ...scoreRecord, [exam.id]: e.target.value })}
                                className="w-14 px-1.5 py-1 text-xs text-center border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none font-bold"
                              />
                              <input
                                type="number"
                                placeholder="الأوائل"
                                value={topScoreRecord[exam.id] || ''}
                                onChange={(e) => setTopScoreRecord({ ...topScoreRecord, [exam.id]: e.target.value })}
                                className="w-14 px-1.5 py-1 text-xs text-center border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none font-bold"
                              />
                              <button
                                onClick={() => {
                                  const uScore = scoreRecord[exam.id];
                                  if (uScore === undefined || uScore.trim() === '') return;
                                  const scoreVal = Number(uScore);
                                  if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > exam.totalScore) return;
                                  
                                  const tScore = topScoreRecord[exam.id];
                                  const topVal = tScore && tScore.trim() !== '' ? Number(tScore) : undefined;
                                  
                                  onRecordGrade(exam.id, scoreVal, topVal);
                                }}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs shrink-0"
                              >
                                حفظ
                              </button>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => onDeleteExam(exam.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shrink-0"
                          title="حذف هذا التقييم"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
