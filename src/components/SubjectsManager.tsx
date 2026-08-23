/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, BookOpen, Trash, Edit2, Check, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { Subject } from '../types';

interface SubjectsManagerProps {
  subjects: Subject[];
  onAddSubject: (subject: Omit<Subject, 'id' | 'totalMinutes'>) => void;
  onEditSubject: (id: string, updated: Partial<Subject>) => void;
  onDeleteSubject: (id: string) => void;
  onResetSubjects?: () => void;
}

export default function SubjectsManager({ subjects, onAddSubject, onEditSubject, onDeleteSubject, onResetSubjects }: SubjectsManagerProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#FF5733');
  const [targetHours, setTargetHours] = useState(5); // target hours per week
  const [studyMode, setStudyMode] = useState<'online' | 'center'>('online');
  const [centerDay, setCenterDay] = useState<number>(0);
  const [centerTime, setCenterTime] = useState<string>('10:00');
  const [centerEndTime, setCenterEndTime] = useState<string>('12:30');
  const [centerLocation, setCenterLocation] = useState<string>('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editHours, setEditHours] = useState(5);
  const [editStudyMode, setEditStudyMode] = useState<'online' | 'center'>('online');
  const [editCenterDay, setEditCenterDay] = useState<number>(0);
  const [editCenterTime, setEditCenterTime] = useState<string>('10:00');
  const [editCenterEndTime, setEditCenterEndTime] = useState<string>('12:30');
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Record<string, boolean>>({});
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const DAYS_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const toggleSubjectExpanded = (id: string) => {
    setExpandedSubjectIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const colorsList = [
    '#FF5733', // Coral
    '#33FF57', // Lime
    '#3357FF', // Indigo
    '#F3FF33', // Yellow
    '#FF33F3', // Fuchsia
    '#00F0FF', // Cyan
    '#FF9F00', // Orange
    '#9B51E0'  // Purple
  ];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddSubject({
      name: name.trim(),
      color,
      icon: 'BookOpen',
      targetMinutesPerWeek: targetHours * 60,
      lessonType: studyMode,
      studyMode,
      centerDay: studyMode === 'center' ? centerDay : undefined,
      centerStartTime: studyMode === 'center' ? centerTime : undefined,
      centerTime: studyMode === 'center' ? centerTime : undefined,
      centerEndTime: studyMode === 'center' ? centerEndTime : undefined,
      centerLocation: studyMode === 'center' ? centerLocation : undefined
    });

    setName('');
  };

  const handleStartEdit = (sub: Subject) => {
    setEditingId(sub.id);
    setEditName(sub.name);
    setEditHours(sub.targetMinutesPerWeek / 60);
    setEditStudyMode((sub.lessonType || sub.studyMode) === 'center' ? 'center' : 'online');
    setEditCenterDay(sub.centerDay !== undefined ? Number(sub.centerDay) : 0);
    setEditCenterTime(sub.centerStartTime || sub.centerTime || '10:00');
    setEditCenterEndTime(sub.centerEndTime || '12:30');
  };

  const handleSaveEdit = (id: string) => {
    onEditSubject(id, {
      name: editName,
      targetMinutesPerWeek: editHours * 60,
      lessonType: editStudyMode,
      studyMode: editStudyMode,
      centerDay: editStudyMode === 'center' ? editCenterDay : undefined,
      centerStartTime: editStudyMode === 'center' ? editCenterTime : undefined,
      centerTime: editStudyMode === 'center' ? editCenterTime : undefined,
      centerEndTime: editStudyMode === 'center' ? editCenterEndTime : undefined
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6 text-right" style={{ direction: 'rtl' }}>
      {/* Add New Subject */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-500 animate-pulse" />
          إضافة مادة دراسية لجدول المذاكرة
        </h3>
        
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">اسم المادة:*</label>
              <input
                type="text"
                required
                placeholder="مثال: الكيمياء، الفيزياء، الرياضيات.."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-950 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">الهدف الأسبوعي (بالساعات):*</label>
              <input
                type="number"
                min="1"
                max="40"
                value={targetHours}
                onChange={(e) => setTargetHours(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none text-zinc-950 dark:text-zinc-50"
              />
            </div>
          </div>

          {/* Mode Selection: Online vs Center */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
              طبيعة دراسة المادة (أونلاين أم في سنتر):
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="studyMode"
                  value="online"
                  checked={studyMode === 'online'}
                  onChange={() => setStudyMode('online')}
                  className="accent-indigo-600"
                />
                <span>🌐 أونلاين (وقت مرن في أي جزء من اليوم)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="studyMode"
                  value="center"
                  checked={studyMode === 'center'}
                  onChange={() => setStudyMode('center')}
                  className="accent-indigo-600"
                />
                <span>🏫 في سنتر (موعد ثابت)</span>
              </label>
            </div>

            {studyMode === 'center' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">يوم السنتر:</label>
                  <select
                    value={centerDay}
                    onChange={(e) => setCenterDay(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg font-semibold"
                  >
                    {DAYS_NAMES.map((d, idx) => (
                      <option key={idx} value={idx}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">وقت البداية:</label>
                  <input
                    type="time"
                    value={centerTime}
                    onChange={(e) => setCenterTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">وقت النهاية:</label>
                  <input
                    type="time"
                    value={centerEndTime}
                    onChange={(e) => setCenterEndTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Color Palettes Selection */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">اختر لون التمييز البصري لمخططات المذاكرة والمؤقت:</label>
            <div className="flex gap-2.5 flex-wrap">
              {colorsList.map((col) => (
                <button
                  type="button"
                  key={col}
                  onClick={() => setColor(col)}
                  className={`w-8 h-8 rounded-full transition-transform duration-150 ${
                    color === col ? 'scale-110 ring-2 ring-zinc-400 dark:ring-zinc-500' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: col }}
                ></button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 font-semibold rounded-xl text-xs hover:bg-zinc-850 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل المادة</span>
            </button>
          </div>
        </form>
      </div>

      {/* List Subjects */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">قائمة المواد الحالية وأهدافها المسجلة</h4>
          {onResetSubjects && (
            <div>
              {showConfirmReset ? (
                <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-1 rounded-xl">
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400">إعادة ضبط المواد؟</span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetSubjects();
                      setShowConfirmReset(false);
                    }}
                    className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold shadow-xs hover:bg-red-700 transition-all cursor-pointer"
                  >
                    نعم، استبدل
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(false)}
                    className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-[10px] font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(true)}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>إعادة ضبط المواد الافتراضية 🔄</span>
                </button>
              )}
            </div>
          )}
        </div>
        
        {subjects.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-zinc-400" />
            <p className="text-xs font-semibold">لم تسجل أي مواد حتى الآن.</p>
            <p className="text-[10px] text-zinc-400 mt-1">المواد تساعدك على تصنيف إحصائياتك تلقائياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10 flex flex-col gap-2 w-full transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-4 w-full">
                  <div className="flex items-center gap-3 w-full">
                    <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: sub.color }}></span>
                    
                    {editingId === sub.id ? (
                      <div className="space-y-3 w-full p-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-1">اسم المادة:</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-1">الهدف الأسبوعي (ساعات):</label>
                            <input
                              type="number"
                              min="1"
                              max="40"
                              value={editHours}
                              onChange={(e) => setEditHours(Number(e.target.value))}
                              className="w-full px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-1">نوع الدرس:</label>
                            <select
                              value={editStudyMode}
                              onChange={(e) => setEditStudyMode(e.target.value as 'online' | 'center')}
                              className="w-full px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 font-semibold"
                            >
                              <option value="online">🌐 أونلاين (مرن)</option>
                              <option value="center">🏫 في سنتر (موعد ثابت)</option>
                            </select>
                          </div>
                        </div>

                        {editStudyMode === 'center' && (
                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                            <div>
                              <label className="block text-[9px] text-zinc-500">اليوم:</label>
                              <select
                                value={editCenterDay}
                                onChange={(e) => setEditCenterDay(Number(e.target.value))}
                                className="w-full px-1.5 py-1 text-xs border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg font-semibold"
                              >
                                {DAYS_NAMES.map((d, idx) => (
                                  <option key={idx} value={idx}>{d}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] text-zinc-500">البداية:</label>
                              <input
                                type="time"
                                value={editCenterTime}
                                onChange={(e) => setEditCenterTime(e.target.value)}
                                className="w-full px-1.5 py-1 text-xs border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-zinc-500">النهاية:</label>
                              <input
                                type="time"
                                value={editCenterEndTime}
                                onChange={(e) => setEditCenterEndTime(e.target.value)}
                                className="w-full px-1.5 py-1 text-xs border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg font-mono font-bold"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(sub.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>حفظ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{sub.name}</h5>
                          {(sub.lessonType || sub.studyMode) === 'center' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              🏫 سنتر ({DAYS_NAMES[sub.centerDay !== undefined ? Number(sub.centerDay) : 0]} من {sub.centerStartTime || sub.centerTime || '10:00'} إلى {sub.centerEndTime || '12:30'})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              🌐 أونلاين (توزيع مرن آلي)
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">الهدف: {sub.targetMinutesPerWeek / 60} ساعة أسبوعياً</span>
                      </div>
                    )}
                  </div>

                  {editingId !== sub.id && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => toggleSubjectExpanded(sub.id)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center gap-1 text-[10px] font-bold"
                        title={expandedSubjectIds[sub.id] ? 'طي التفاصيل' : 'عرض التفاصيل المستمرة'}
                      >
                        <span className="hidden sm:inline">{expandedSubjectIds[sub.id] ? 'طي المؤشرات' : 'مؤشرات V9 المستمرة'}</span>
                        {expandedSubjectIds[sub.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleStartEdit(sub)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSubject(sub.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* V9 Continuous Progress Bento Grid Area */}
                {expandedSubjectIds[sub.id] && (
                  <div className="mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 w-full space-y-3.5">
                    {/* 1. Progress Bar / Completion */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-500">معدل إنجاز المنهج الدراسي المستمر</span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-50">{sub.completionPercent || 0}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            backgroundColor: sub.color || '#9B51E0',
                            width: `${sub.completionPercent || 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* 3-Part Neuroscience Learning Structure */}
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                      <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 block">
                        🧠 هيكل التوزيع الثلاثي المتوافق مع العلوم العصبية (Neuroscience 3-Parts):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                        <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 block mb-0.5">1️⃣ سماع الشرح/الدرس</span>
                          <span className="text-zinc-500 block">
                            {sub.studyMode === 'center' ? `سنتر (${DAYS_NAMES[sub.centerDay || 0]} ${sub.centerTime || '10:00'})` : 'أونلاين (وقت مرن)'}
                          </span>
                        </div>
                        <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                          <span className="font-extrabold text-amber-600 dark:text-amber-400 block mb-0.5">2️⃣ شيت ورشة الحصة</span>
                          <span className="text-zinc-500 block">حل ورشة التمارين وتطبيقات الدرس المباشرة</span>
                        </div>
                        <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block mb-0.5">3️⃣ الواجب المنزلي</span>
                          <span className="text-zinc-500 block">التدريب المستقل والتكرار المتباعد بعد يومين</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-850/40 flex items-center justify-between">
                      <div>
                        <h6 className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">الفصل/الباب الدراسي الحالي:</h6>
                        <p className="text-[9px] text-zinc-400">تحكم بتقدمك في الفصول لتوجيه الذكاء الاصطناعي</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const cur = sub.chapterCount || sub.currentChapterCount || 1;
                            if (cur > 1) {
                              onEditSubject(sub.id, { chapterCount: cur - 1, currentChapterCount: cur - 1 });
                            }
                          }}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-black hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                          -
                        </button>
                        <span className="font-mono text-xs font-bold w-6 text-center text-zinc-900 dark:text-zinc-50">
                          {sub.chapterCount || sub.currentChapterCount || 1}
                        </span>
                        <button
                          onClick={() => {
                            const cur = sub.chapterCount || sub.currentChapterCount || 1;
                            onEditSubject(sub.id, { chapterCount: cur + 1, currentChapterCount: cur + 1 });
                          }}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-black hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* 3. Metrics Bento Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-right">
                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">الدروس المكتملة</span>
                        <span className="font-mono text-xs font-black text-zinc-800 dark:text-zinc-200">{sub.lessonsCompleted || 0}</span>
                      </div>

                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">الدروس المتبقية</span>
                        <span className="font-mono text-xs font-black text-zinc-800 dark:text-zinc-200">{sub.lessonsRemaining || 0}</span>
                      </div>

                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">شيتات الحصة المنجزة</span>
                        <span className="font-mono text-xs font-black text-zinc-800 dark:text-zinc-200">{sub.classSheetsCompleted || 0}</span>
                      </div>

                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">الواجبات المحلولة</span>
                        <span className="font-mono text-xs font-black text-zinc-800 dark:text-zinc-200">{sub.homeworkCompleted || 0}</span>
                      </div>

                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">الاستدعاء النشط (جلسات)</span>
                        <span className="font-mono text-xs font-black text-zinc-800 dark:text-zinc-200">{sub.activeRecallSessions || 0}</span>
                      </div>

                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">المراجعات الأسبوعية</span>
                        <span className="font-mono text-xs font-black text-zinc-800 dark:text-zinc-200">{sub.weeklyReviews || 0}</span>
                      </div>

                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">المراجعات الشهرية</span>
                        <span className="font-mono text-xs font-black text-zinc-800 dark:text-zinc-200">{sub.monthlyReviews || 0}</span>
                      </div>

                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">المراجعات الامتحانية</span>
                        <span className="font-mono text-xs font-black text-zinc-800 dark:text-zinc-200">{sub.examReviews || 0}</span>
                      </div>

                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">إجمالي ساعات الدراسة</span>
                        <span className="font-mono text-xs font-black text-zinc-800 dark:text-zinc-200">{sub.totalStudyHours || 0} س</span>
                      </div>

                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">متوسط مدة الدرس (Lesson)</span>
                        <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {sub.stageAverages?.['Lesson'] ? `${sub.stageAverages['Lesson']} د` : sub.avgLessonDuration ? `${sub.avgLessonDuration} د` : 'غير محدد'}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">متوسط شيت الحصة (Class Sheet)</span>
                        <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {sub.stageAverages?.['Class Sheet'] ? `${sub.stageAverages['Class Sheet']} د` : sub.avgWorksheetDuration ? `${sub.avgWorksheetDuration} د` : 'غير محدد'}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">متوسط حل الواجب (Homework)</span>
                        <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {sub.stageAverages?.['Homework'] ? `${sub.stageAverages['Homework']} د` : sub.avgHomeworkDuration ? `${sub.avgHomeworkDuration} د` : 'غير محدد'}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">متوسط الاسترجاع (Active Recall)</span>
                        <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {sub.stageAverages?.['Active Recall'] ? `${sub.stageAverages['Active Recall']} د` : sub.avgRecallDuration ? `${sub.avgRecallDuration} د` : 'غير محدد'}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">متوسط المراجعة الأسبوعية</span>
                        <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {sub.stageAverages?.['Weekly Review'] ? `${sub.stageAverages['Weekly Review']} د` : sub.avgReviewDuration ? `${sub.avgReviewDuration} د` : 'غير محدد'}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/40">
                        <span className="block text-[9px] text-zinc-400 font-medium">متوسط المراجعة الشهرية</span>
                        <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {sub.stageAverages?.['Monthly Review'] ? `${sub.stageAverages['Monthly Review']} د` : sub.avgMonthlyReviewDuration ? `${sub.avgMonthlyReviewDuration} د` : 'غير محدد'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
