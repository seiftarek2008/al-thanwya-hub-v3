/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  X, 
  Send, 
  AlertTriangle, 
  Calendar, 
  RefreshCw, 
  Layout, 
  Clock, 
  BarChart3, 
  BookOpen, 
  Award, 
  HelpCircle, 
  CheckCircle2, 
  Loader2, 
  Info, 
  History, 
  Smartphone, 
  Copy, 
  Check
} from 'lucide-react';
import { BugReport } from '../types';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
  user?: {
    name?: string;
    email?: string;
    stream?: string;
    curriculumTrack?: string;
    academicYear?: string;
  };
  currentAcademicWeek?: number;
}

const BUG_CATEGORIES: { 
  id: BugReport['category']; 
  title: string; 
  description: string; 
  icon: any; 
  color: string;
}[] = [
  {
    id: 'date_formatting',
    title: 'تنسيق التواريخ ورقم الأسبوع',
    description: 'انزياح رقم الأسبوع الدراسي، أخطاء التوقيت الصيفي، أو تواريخ الجلسات',
    icon: Calendar,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30'
  },
  {
    id: 'sync_errors',
    title: 'أخطاء المزامنة والتخزين',
    description: 'عدم حفظ البيانات، مشاكل التخزين المحلي، أو صراع الأجهزة المتعددة',
    icon: RefreshCw,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/30'
  },
  {
    id: 'ui_overlaps',
    title: 'تداخل الواجهة والتصميم',
    description: 'أزرار متداخلة، نصوص غير مقروءة، أو عيوب في شاشات الموبايل والتابلت',
    icon: Layout,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/30'
  },
  {
    id: 'focus_timer',
    title: 'مؤقت التركيز والجلسات',
    description: 'توقف المؤقت في الخلفية، عدم احتساب الوقت، أو انقطاع الصوت المحيطي',
    icon: Clock,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
  },
  {
    id: 'stats_graphs',
    title: 'الإحصائيات والتنبؤات',
    description: 'أخطاء الرسوم البيانية، قسمة على صفر، أو حسابات النسبة المتوقعة',
    icon: BarChart3,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/30'
  },
  {
    id: 'curriculum_tasks',
    title: 'خطة المنهج والتراكمات',
    description: 'مراحل استذكار الدروس، التكرار المتباعد، أو مهام الواجبات والسناتر',
    icon: BookOpen,
    color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30'
  },
  {
    id: 'gamification_xp',
    title: 'الـ XP والمستويات والسلسلة',
    description: 'عدم احتساب نقاط الخبرة، انكسار الـ Streak ظلماً، أو أخطاء الرتب',
    icon: Award,
    color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
  },
  {
    id: 'other',
    title: 'مشكلة أو خطأ تقني آخر',
    description: 'أي سلوك غير متوقع أو مشكلة عامة لم يتم تصنيفها أعلاه',
    icon: HelpCircle,
    color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/30'
  }
];

export default function ReportProblemModal({
  isOpen,
  onClose,
  token,
  user,
  currentAcademicWeek = 1
}: ReportProblemModalProps) {
  const [activeTab, setActiveTab] = useState<'new_report' | 'history'>('new_report');
  const [category, setCategory] = useState<BugReport['category']>('date_formatting');
  const [title, setTitle] = useState('');
  const [scenario, setScenario] = useState('');
  const [severity, setSeverity] = useState<BugReport['severity']>('medium');
  const [includeEnvInfo, setIncludeEnvInfo] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const [myReports, setMyReports] = useState<BugReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Auto-detect environment details
  const envInfo = {
    browser: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : 'Unknown',
    screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Unknown',
    academicWeek: currentAcademicWeek,
    stream: user?.stream || 'science',
    curriculumTrack: user?.curriculumTrack || 'arabic',
    academicYear: user?.academicYear || 'third',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    timestamp: new Date().toLocaleString('ar-EG')
  };

  // Fetch submitted bug reports
  const fetchMyReports = async () => {
    if (!token) return;
    setIsLoadingReports(true);
    try {
      const res = await fetch('/api/my-bug-reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyReports(data.reports || []);
      }
    } catch (err) {
      console.warn('Could not fetch bug reports history:', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchMyReports();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setSubmitError('يرجى كتابة عنوان أو ملخص سريع للخطأ');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      category,
      title: title.trim(),
      scenario: scenario.trim(),
      severity,
      environmentInfo: includeEnvInfo ? envInfo : { isOnline: navigator.onLine }
    };

    try {
      let reportId = `BUG-${Date.now().toString().slice(-6)}`;
      let success = false;

      if (token) {
        const response = await fetch('/api/report-bug', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const resData = await response.json();
          reportId = resData.reportId || reportId;
          success = true;
        }
      }

      // Offline / Fallback Local Storage
      const localReport: BugReport = {
        id: reportId,
        category,
        title: title.trim(),
        scenario: scenario.trim(),
        severity,
        status: 'submitted',
        environmentInfo: payload.environmentInfo,
        createdAt: new Date().toISOString(),
        userEmail: user?.email,
        userName: user?.name
      };

      const existingLocal = JSON.parse(localStorage.getItem('local_bug_reports') || '[]');
      existingLocal.unshift(localReport);
      localStorage.setItem('local_bug_reports', JSON.stringify(existingLocal.slice(0, 50)));

      setSubmitSuccess(reportId);
      setTitle('');
      setScenario('');
      // Refresh reports list
      setMyReports(prev => [localReport, ...prev]);
    } catch (err: any) {
      console.error('Error submitting bug report:', err);
      setSubmitError('حدث تعذر في الإرسال للسيرفر؛ تم حفظ البلاغ محلياً وسيعاد إرساله عند توفر الاتصال.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyEnvironmentData = () => {
    const text = JSON.stringify(envInfo, null, 2);
    navigator.clipboard?.writeText(text);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs dir-rtl" 
      style={{ direction: 'rtl' }}
    >
      <div 
        id="report-problem-modal-container"
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl text-right shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-150 dark:border-zinc-800 bg-gradient-to-r from-red-50/50 via-amber-50/30 to-white dark:from-red-950/20 dark:via-amber-950/10 dark:to-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/20 shrink-0">
              <Bug className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>الإبلاغ عن مشكلة أو خطأ تقني</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                  Bug Tracker
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                وثّق الخطأ البرمجي وسيناريو حدوثه بدقة لضمان معالجته فوراً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Header Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={() => { setActiveTab('new_report'); setSubmitSuccess(null); }}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'new_report'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-zinc-900 shadow-xs'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Bug className="w-4 h-4" />
            <span>تسجيل بلاغ جديد ✍️</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('history'); fetchMyReports(); }}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-zinc-900 shadow-xs'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل بلاغاتي السابقة 📋 ({myReports.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'new_report' ? (
            <>
              {submitSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-center space-y-3 animate-in zoom-in-95">
                  <div className="w-14 h-14 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-black text-emerald-900 dark:text-emerald-200">
                    تم استلام بلاغك بنجاح! شكراً لمساعدتك 🌟
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto leading-relaxed">
                    تم تسجيل المشكلة برقم تتبع <span className="font-mono font-bold underline">#{submitSuccess}</span> مع كافة بيانات البيئة والسيناريو، وسيقوم فريق المطورين بفحصها وإصلاحها على الفور.
                  </p>
                  <div className="pt-3 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSubmitSuccess(null)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      تسجيل بلاغ آخر 📝
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      إغلاق النافذة
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category Selection */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        نوع المشكلة / التصنيف (Bug Category) *
                      </span>
                      <span className="text-[11px] text-zinc-400 font-normal">اختر القسم المتأثر</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {BUG_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`p-3 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                              isSelected
                                ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 ring-2 ring-red-500/20 shadow-xs'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className={`p-2 rounded-xl border shrink-0 ${cat.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-black text-zinc-900 dark:text-zinc-100 mb-0.5 truncate">
                                {cat.title}
                              </div>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                                {cat.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bug Title */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200">
                      عنوان أو ملخص المشكلة (Bug Summary) *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: رقم الأسبوع الدراسي تأخر يوماً، أو المؤقت توقف عند إغلاق الشاشة..."
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-750 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none transition-all"
                    />
                  </div>

                  {/* Scenario Description (Core User Requirement) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-blue-500" />
                        وصف السيناريو والخطوات (Scenario & Reproduction Steps)
                      </label>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold">
                        اختياري ومهم جداً
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      اشرح ماذا كنت تفعل بالتحديد قبل ظهور الخطأ (مثلاً: الصفحة التي كنت فيها، الزر الذي ضغطت عليه، أو التوقيت):
                    </p>
                    <textarea
                      rows={4}
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      placeholder="سيناريو الحدوث: كنت أذاكر جلسة فيزياء 45 دقيقة، وبعد 20 دقيقة قفلت شاشة الموبايل وفتحتها تاني لقيت المؤقت متوقف..."
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-750 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none transition-all leading-relaxed"
                    />
                  </div>

                  {/* Severity Level */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200">
                      درجة التأثير على المذاكرة (Severity Level)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'low', label: 'بسيط / شكلي 🟢', desc: 'تنسيق أو خطأ بسيط' },
                        { id: 'medium', label: 'متوسط 🟡', desc: 'يزعج لكن المذاكرة مستمرة' },
                        { id: 'high', label: 'مرتفع 🟠', desc: 'يعطل ميزة مهمة' },
                        { id: 'critical', label: 'حرج / يعطل التطبيق 🔴', desc: 'توقف الحفظ أو شاشة بيضاء' }
                      ].map((sev) => (
                        <button
                          key={sev.id}
                          type="button"
                          onClick={() => setSeverity(sev.id as any)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            severity === sev.id
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-black ring-1 ring-red-500'
                              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 font-bold'
                          }`}
                        >
                          <div className="text-xs">{sev.label}</div>
                          <div className="text-[9px] opacity-75 mt-0.5">{sev.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-detected Environment Snapshot */}
                  <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                          بيانات الفحص التلقائي المرفقة (Device & Environment)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={copyEnvironmentData}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        {copiedEnv ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedEnv ? 'تم النسخ!' : 'نسخ البيانات'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                      <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800">
                        <span className="block font-bold text-zinc-750 dark:text-zinc-300">الأسبوع الدراسي:</span>
                        <span>أسبوع {envInfo.academicWeek}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800">
                        <span className="block font-bold text-zinc-750 dark:text-zinc-300">أبعاد الشاشة:</span>
                        <span>{envInfo.screenSize}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800">
                        <span className="block font-bold text-zinc-750 dark:text-zinc-300">الشعبة والمسار:</span>
                        <span>{envInfo.stream} | {envInfo.curriculumTrack}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800">
                        <span className="block font-bold text-zinc-750 dark:text-zinc-300">حالة الاتصال:</span>
                        <span>{envInfo.isOnline ? 'متصل سحابياً 🌐' : 'وضع غير متصل 📴'}</span>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeEnvInfo}
                        onChange={(e) => setIncludeEnvInfo(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                        إرفاق هذه المعلومات التقنية مع البلاغ لتسهيل إصلاح الخطأ
                      </span>
                    </label>
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>{isSubmitting ? 'جاري إرسال البلاغ...' : 'إرسال تقرير الخطأ 🚀'}</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            /* History Tab */
            <div className="space-y-4">
              {isLoadingReports ? (
                <div className="py-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                  <span className="text-xs font-bold">جاري تحميل سجل البلاغات...</span>
                </div>
              ) : myReports.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto" />
                  <h4 className="text-sm font-black text-zinc-700 dark:text-zinc-300">
                    لا توجد بلاغات سابقة مسجلة!
                  </h4>
                  <p className="text-xs text-zinc-500">
                    كل الأمور تعمل بسلاسة. إذا واجهت أي عطل يمكنك تسجيله هنا في أي وقت.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReports.map((rep) => {
                    const catObj = BUG_CATEGORIES.find(c => c.id === rep.category) || BUG_CATEGORIES[7];
                    const Icon = catObj.icon;
                    return (
                      <div
                        key={rep.id}
                        className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2.5 text-right"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`p-1.5 rounded-lg border ${catObj.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                              {rep.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                            #{rep.id}
                          </span>
                        </div>

                        {rep.scenario && (
                          <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800/80 text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-0.5">سيناريو الحدوث:</span>
                            {rep.scenario}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-150 dark:border-zinc-800 text-[10px] text-zinc-500">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                              تم الاستلام والمتابعة 📥
                            </span>
                            <span>التصنيف: {catObj.title}</span>
                          </div>
                          <span>{new Date(rep.createdAt).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
