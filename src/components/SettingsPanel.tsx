/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Settings, Save, Download, Key, Shield, User, Bell, Database, Activity, CheckCircle2, AlertCircle, Loader2, Plane, BellOff, VolumeX, RotateCcw, Trash2, Compass, BookOpen, Bug, LogOut } from 'lucide-react';
import { AppStudyState } from '../types';
import ReportProblemModal from './ReportProblemModal';

interface SettingsPanelProps {
  user: { 
    name: string; 
    email: string; 
    stream: 'math' | 'science' | 'literature'; 
    targetPercentage: number;
    curriculumTrack?: 'arabic' | 'languages';
    academicYear?: 'first' | 'second' | 'third';
  };
  appData: AppStudyState;
  token?: string | null;
  currentAcademicWeek?: number;
  thanaweyaStartDate?: string;
  onUpdateThanaweyaStartDate?: (date: string) => void;
  dndMode?: boolean;
  onToggleDndMode?: (active: boolean) => void;
  onUpdateProfile: (profile: { 
    name: string; 
    stream: 'math' | 'science' | 'literature'; 
    targetPercentage: number;
    curriculumTrack?: 'arabic' | 'languages';
    academicYear?: 'first' | 'second' | 'third';
  }) => void;
  onUpdatePassword: (password: string) => Promise<boolean>;
  onImportData: (data: AppStudyState) => void;
  onResetAccountData?: () => Promise<void>;
  onDeleteAccount?: () => Promise<void>;
  onLogout?: () => void;
  onOpenStudentGuide?: () => void;
}

export default function SettingsPanel({ user, appData, token, currentAcademicWeek, thanaweyaStartDate = '2026-08-25', onUpdateThanaweyaStartDate, dndMode = false, onToggleDndMode, onUpdateProfile, onUpdatePassword, onImportData, onResetAccountData, onDeleteAccount, onLogout, onOpenStudentGuide }: SettingsPanelProps) {
  const [name, setName] = useState(user.name);
  const [stream, setStream] = useState<'math' | 'science' | 'literature'>(user.stream);
  const [targetPercentage, setTargetPercentage] = useState(user.targetPercentage);
  const [curriculumTrack, setCurriculumTrack] = useState<'arabic' | 'languages'>(user.curriculumTrack || 'arabic');
  const [academicYear, setAcademicYear] = useState<'first' | 'second' | 'third'>(user.academicYear || 'third');
  const [startDate, setStartDate] = useState(thanaweyaStartDate);

  useEffect(() => {
    if (thanaweyaStartDate) {
      setStartDate(thanaweyaStartDate);
    }
  }, [thanaweyaStartDate]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [profileStatus, setProfileStatus] = useState<'idle' | 'success'>('idle');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  const [showReportModal, setShowReportModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setDiagnosticLoading(true);
    setDiagnosticError(null);
    setDiagnosticResult(null);
    try {
      const response = await fetch('/api/diagnose-firestore');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDiagnosticResult(data);
    } catch (err: any) {
      console.error('Failed to run database diagnostics:', err);
      setDiagnosticError(err.message || 'حدث خطأ غير متوقع أثناء فحص قاعدة البيانات.');
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ name, stream, targetPercentage, curriculumTrack, academicYear });
    if (onUpdateThanaweyaStartDate && startDate) {
      onUpdateThanaweyaStartDate(startDate);
    }
    setProfileStatus('success');
    setTimeout(() => setProfileStatus('idle'), 3500);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordStatus('error');
      return;
    }
    const success = await onUpdatePassword(newPassword);
    if (success) {
      setPasswordStatus('success');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordStatus('error');
    }
    setTimeout(() => setPasswordStatus('idle'), 3000);
  };

  // Data exporter to download JSON backup
  const handleExportData = () => {
    try {
      const fullBackup = {
        exportedAt: new Date().toISOString(),
        user: { name: user.name, email: user.email, stream, targetPercentage },
        data: appData
      };
      const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thanaweya_study_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export study data:', e);
    }
  };

  // Data importer to restore JSON backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        // The backup can be nested as { data: ... } or flat AppStudyState
        const targetData = parsed.data || parsed;
        
        if (targetData && (Array.isArray(targetData.subjects) || Array.isArray(targetData.sessions) || Array.isArray(targetData.tasks))) {
          onImportData(targetData);
          setImportStatus('success');
          setImportMessage('تم استيراد الملف الدراسي بنجاح وجاري المزامنة السحابية!');
        } else {
          setImportStatus('error');
          setImportMessage('صيغة ملف النسخة الاحتياطية غير صالحة. يرجى اختيار ملف صحيح.');
        }
      } catch (err) {
        setImportStatus('error');
        setImportMessage('حدث خطأ أثناء قراءة الملف. تأكد من سلامة ملف الـ JSON.');
      }
      setTimeout(() => {
        setImportStatus('idle');
        setImportMessage('');
      }, 5000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 text-right" style={{ direction: 'rtl' }}>
      
      {/* Student Guide Card */}
      <div className="p-6 bg-gradient-to-r from-indigo-900 via-zinc-900 to-indigo-950 text-white rounded-3xl shadow-lg border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <span>دليل الاستخدام الشامل للمنصة 📖</span>
            </h4>
            <p className="text-xs text-indigo-200/80 font-medium mt-0.5">
              دليل خطوة بخطوة يبين لك كيفية استخدام كافة خصائص الموقع دون أن تتوه أو تشعر بثرثرة الخيارات.
            </p>
          </div>
        </div>
        {onOpenStudentGuide && (
          <button
            type="button"
            onClick={onOpenStudentGuide}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-2 border border-indigo-400/30"
          >
            <BookOpen className="w-4 h-4" />
            <span>عرض دليل الاستخدام 📖</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            تعديل الملف الدراسي والأهداف
          </h4>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">الاسم ثلاثي أو ثنائي:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-950 dark:text-zinc-50"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">الشعبة الحالية:</label>
              <select
                value={stream}
                onChange={(e) => setStream(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none text-zinc-950 dark:text-zinc-50"
              >
                <option value="math">علمي رياضة 📐</option>
                <option value="science">علمي علوم 🧪</option>
                <option value="literature">أدبي 📚</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">الصف الدراسي:</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none text-zinc-950 dark:text-zinc-50"
                >
                  <option value="first">الصف الأول الثانوي 🎒</option>
                  <option value="second">الصف الثاني الثانوي 📖</option>
                  <option value="third">الصف الثالث الثانوي 🎓</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">نظام المنهج الدراسي:</label>
                <select
                  value={curriculumTrack}
                  onChange={(e) => setCurriculumTrack(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none text-zinc-950 dark:text-zinc-50"
                >
                  <option value="arabic">منهج عربي 🇪🇬</option>
                  <option value="languages">منهج لغات (English) 🇬🇧</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">المجموع المستهدف لثانوية عامة (%):</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  step="0.1"
                  value={targetPercentage}
                  onChange={(e) => setTargetPercentage(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none text-zinc-950 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">تاريخ بداية العام الدراسي الرسمي 📅:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (onUpdateThanaweyaStartDate && e.target.value) {
                      onUpdateThanaweyaStartDate(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none text-zinc-950 dark:text-zinc-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {profileStatus === 'success' && (
                <span className="text-xs text-emerald-500 font-semibold">تم حفظ التعديلات بنجاح!</span>
              )}
              <div className="flex-1"></div>
              <button
                type="submit"
                className="px-5 py-2 bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-semibold text-xs hover:bg-zinc-850 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </form>
        </div>

        {/* Change Password settings */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <Key className="w-4 h-4" />
            تعديل كلمة المرور للجروب المغلق
          </h4>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">كلمة المرور الجديدة:</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة مرور قوية"
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-950 dark:text-zinc-50"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">تأكيد كلمة المرور:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابتها مرة أخرى"
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-950 dark:text-zinc-50"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {passwordStatus === 'success' && (
                <span className="text-xs text-emerald-500 font-semibold">تم تحديث كلمة المرور!</span>
              )}
              {passwordStatus === 'error' && (
                <span className="text-xs text-red-500 font-semibold">غير متطابقين أو فشل التعديل!</span>
              )}
              <div className="flex-1"></div>
              <button
                type="submit"
                className="px-5 py-2 bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-semibold text-xs hover:bg-zinc-850 flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>تحديث الرمز السري</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Do Not Disturb & Airplane Mode Reminder Settings */}
      <div className="p-6 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/60 via-purple-50/30 to-white dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-zinc-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Plane className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              تفعيل وضع عدم الإزعاج وتنبيه وضع الطيران (Do Not Disturb / Airplane Mode)
            </h4>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            عند تفعيل هذا الخيار، سيتم إظهار شريط تنبيه بروتوكول عدم الإزعاج بشكل دائم أعلى التطبيق لتذكيرك بتفعيل وضع الطيران (Airplane Mode) أو كتم جميع إشعارات الهاتف أثناء المذاكرة لمنع انقطاع التركيز وتشتيت الانتباه.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <span className={`text-xs font-bold ${dndMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`}>
            {dndMode ? 'مفعل ✈️' : 'غير مفعل'}
          </span>
          <button
            type="button"
            onClick={() => onToggleDndMode?.(!dndMode)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              dndMode ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                dndMode ? 'translate-x-0' : '-translate-x-5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Export & Import Study Data & Privacy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2">تصدير نسخة احتياطية (Export JSON)</h4>
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              قم بتنزيل ملف JSON يحتوي على كافة بياناتك (جلسات المذاكرة، الجدول الأسبوعي، الدرجات، الإحصائيات، المهام، والأهداف الشخصية) للاحتفاظ بنسخة مادية آمنة على جهازك.
            </p>
          </div>
          <button
            onClick={handleExportData}
            className="w-full py-3 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2.5"
          >
            <Download className="w-4 h-4" />
            <span>تصدير الملف الدراسي الكامل للكمبيوتر (JSON)</span>
          </button>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2">استيراد نسخة احتياطية (Import JSON)</h4>
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              استرجع بياناتك بالكامل من ملف نسخة احتياطية قمت بتصديره مسبقاً. سيتم استبدال البيانات الحالية على الفور ومزامنتها سحابياً تلقائياً.
            </p>
          </div>
          <div className="space-y-3">
            {importMessage && (
              <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                importStatus === 'success' ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
              }`}>
                {importMessage}
              </div>
            )}
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
                id="import-file-input"
              />
              <label
                htmlFor="import-file-input"
                className="w-full py-3 border border-dashed border-zinc-350 dark:border-zinc-750 hover:border-zinc-500 text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded-xl font-semibold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <span>اختيار ملف النسخة الاحتياطية واستعادته</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Firestore Database Connection Diagnostics */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-6">
        <div>
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500" />
            فحص تشخيص اتصال قاعدة البيانات (Firestore Connection Diagnostics)
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            استخدم هذه الأداة للتحقق من سلامة الاتصال بقاعدة بيانات Cloud Firestore السحابية، والتحقق من تطابق معرّف قاعدة البيانات (Database ID) ومراجعة سجلات تشغيل السيرفر.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={runDiagnostics}
            disabled={diagnosticLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-400 rounded-xl font-semibold text-xs transition-all flex items-center gap-2"
          >
            {diagnosticLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
            <span>{diagnosticLoading ? 'جاري الفحص السحابي...' : 'تشغيل فحص الاتصال وقاعدة البيانات'}</span>
          </button>
        </div>

        {diagnosticError && (
          <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/30 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{diagnosticError}</span>
          </div>
        )}

        {diagnosticResult && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Status Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${
                diagnosticResult.diagnostics.adminSdkInitialized
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-50/30 dark:bg-red-950/10 border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-400'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-70 mb-1">اتصال السيرفر (Backend SDK)</div>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  {diagnosticResult.diagnostics.adminSdkInitialized ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>متصل بنجاح</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>غير متصل</span>
                    </>
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${
                diagnosticResult.diagnostics.readTestSuccess
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-50/30 dark:bg-red-950/10 border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-400'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-70 mb-1">اختبار القراءة (Read Test)</div>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  {diagnosticResult.diagnostics.readTestSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>ناجح (مستندات: {diagnosticResult.diagnostics.readTestDataCount})</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>فشل القراءة</span>
                    </>
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${
                diagnosticResult.diagnostics.dbIdAligned
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-50/30 dark:bg-red-950/10 border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-400'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-70 mb-1">تطابق معرّف قاعدة البيانات (ID Alignment)</div>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  {diagnosticResult.diagnostics.dbIdAligned ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>متطابق ومثالي</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>معرّف غير متطابق</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Config & Database Specs */}
            <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-2 text-xs">
              <h5 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">تفاصيل ومواصفات قاعدة البيانات النشطة:</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800/40 pb-1.5">
                  <span className="text-zinc-500">مُعرّف المشروع (Project ID):</span>
                  <span className="font-mono text-zinc-850 dark:text-zinc-150">{diagnosticResult.config.projectId}</span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800/40 pb-1.5">
                  <span className="text-zinc-500">المُعرّف المُهيجأ في الإعدادات:</span>
                  <span className="font-mono text-zinc-850 dark:text-zinc-150">{diagnosticResult.config.configuredDatabaseId}</span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800/40 pb-1.5 sm:col-span-2">
                  <span className="text-zinc-500">المُعرّف النشط في السيرفر (Active DB ID):</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{diagnosticResult.config.activeDatabaseIdOnServer}</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Logs */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400">سجل عمليات الفحص (Diagnostic Execution Logs):</div>
              <div className="p-4 rounded-xl bg-zinc-900 text-zinc-150 dark:bg-black dark:text-zinc-300 font-mono text-[11px] leading-relaxed overflow-x-auto border border-zinc-800 h-40 max-h-40 overflow-y-auto">
                {diagnosticResult.logs.map((log: string, idx: number) => (
                  <div key={idx} className="border-b border-zinc-800/30 pb-1 mb-1 last:border-none last:pb-0 last:mb-0">
                    <span className="text-indigo-400 select-none mr-2">❯</span>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Report a Problem / Bug Tracker Card */}
        <div className="p-6 bg-gradient-to-r from-red-50/70 via-amber-50/40 to-white dark:from-red-950/25 dark:via-amber-950/15 dark:to-zinc-950 border border-red-200/80 dark:border-red-900/50 rounded-3xl space-y-4 text-right dir-rtl shadow-xs" style={{ direction: 'rtl' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/20 shrink-0">
                <Bug className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>الإبلاغ عن مشكلة أو خطأ تقني (Report a Problem)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                    مباشر 🚀
                  </span>
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  هل واجهت مشكلة في تنسيق التواريخ، مزامنة البيانات، تداخل في الواجهة، أو مؤقت التركيز؟ وثّق الخطأ والسيناريو لنقوم بحله فوراً.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-open-report-problem"
              onClick={() => setShowReportModal(true)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-red-600/20 hover:shadow-lg flex items-center gap-2 cursor-pointer shrink-0 self-end sm:self-center"
            >
              <Bug className="w-4 h-4" />
              <span>تسجيل مشكلة جديدة 📝</span>
            </button>
          </div>
        </div>

        {/* Danger Zone: Account Reset & Permanent Account Deletion */}
        <div className="p-6 bg-red-50/30 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-3xl space-y-4 text-right dir-rtl" style={{ direction: 'rtl' }}>
          <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 font-black text-base">
            <Trash2 className="w-5 h-5" />
            <span>منطقة إدارة الحساب والمسح الشامل (Danger Zone)</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            تتيح لك خيارات هذه المنطقة إما إعادة ضبط بيانات الحساب والبدء من الصفحة البيضاء (الصفر) بنفس البريد، أو حذف حسابك بالكامل نهائياً من النظام.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-red-200/60 dark:border-red-900/40">
            {/* Log Out Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                <LogOut className="w-4 h-4 text-red-400 dark:text-red-600" />
                <span>تسجيل الخروج من الحساب (Log Out)</span>
              </button>
            )}

            {/* Reset Account Button */}
            {onResetAccountData && (
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة ضبط الحساب للصفر 🔄</span>
              </button>
            )}

            {/* Delete Account Button */}
            {onDeleteAccount && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف الحساب بالكامل نهائياً 🗑️</span>
              </button>
            )}
          </div>
        </div>

        {/* Reset Account Confirmation Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs dir-rtl" style={{ direction: 'rtl' }}>
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-right space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100">إعادة ضبط الحساب من الصفر 🔄</h4>
                  <p className="text-[11px] text-zinc-500">البدء بحساب نظيف دون مسح الحساب</p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                هل أنت متأكد من رغبتك في مسح كافة الجلسات الدراسية، المهام، الاختبارات، والنقاط والبدء من جديد من الصفحة البيضاء بنفس الحساب؟
              </p>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={async () => {
                    if (!onResetAccountData) return;
                    setIsResetting(true);
                    try {
                      await onResetAccountData();
                      setShowResetModal(false);
                    } finally {
                      setIsResetting(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  <span>تأكيد مسح البيانات والبدء من الصفر</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs dir-rtl" style={{ direction: 'rtl' }}>
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-6 text-right space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-red-600 dark:text-red-400">حذف الحساب بالكامل نهائياً 🗑️</h4>
                  <p className="text-[11px] text-zinc-500">إجراء غير قابل للتراجع</p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-bold">
                ⚠️ تنبيه هام: سيتم مسح حسابك وبريدك وإحصائياتك تماماً ولن تتمكن من تسجيل الدخول بنفس البيانات مجدداً إلا بإنشاء حساب جديد. هل تريد الاستمرار بحذف الحساب نهائياً؟
              </p>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!onDeleteAccount) return;
                    setIsDeleting(true);
                    try {
                      await onDeleteAccount();
                      setShowDeleteModal(false);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>تأكيد حذف الحساب نهائياً 🗑️</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Report a Problem Modal */}
        <ReportProblemModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          token={token}
          user={user}
          currentAcademicWeek={currentAcademicWeek}
        />
      </div>
    </div>
  );
}
