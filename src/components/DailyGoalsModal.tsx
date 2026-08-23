import React, { useState } from 'react';
import { Target, X, Check, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { LifestyleProfile } from '../types';

interface DailyGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lifestyleProfile: LifestyleProfile;
  onUpdateLifestyleProfile: (profile: LifestyleProfile) => void;
  onSaveDailyTarget?: (targetHours: number, targetTasks?: number) => void;
}

export default function DailyGoalsModal({
  isOpen,
  onClose,
  lifestyleProfile,
  onUpdateLifestyleProfile,
  onSaveDailyTarget
}: DailyGoalsModalProps) {
  const currentDailyHours = lifestyleProfile?.personalPreferences?.maxStudyHoursPerDay || 4;
  const currentWeeklyHours = lifestyleProfile?.weeklyGoals?.studyHours || currentDailyHours * 7;
  const currentRevisionHours = lifestyleProfile?.weeklyGoals?.revisionHours || 10;

  const [dailyTarget, setDailyTarget] = useState<number>(currentDailyHours);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(currentWeeklyHours);
  const [revisionTarget, setRevisionTarget] = useState<number>(currentRevisionHours);
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleDailyChange = (hours: number) => {
    const clamped = Math.max(1, Math.min(16, hours));
    setDailyTarget(clamped);
    setWeeklyTarget(Number((clamped * 7).toFixed(1)));
  };

  const handleSave = () => {
    const updatedProfile: LifestyleProfile = {
      ...lifestyleProfile,
      personalPreferences: {
        ...(lifestyleProfile?.personalPreferences || {}),
        maxStudyHoursPerDay: dailyTarget,
      },
      weeklyGoals: {
        ...(lifestyleProfile?.weeklyGoals || {
          studyHours: 28,
          revisionHours: 10,
          exerciseHours: 5,
          hobbyHours: 5,
          restHours: 10,
          sleepHours: 56
        }),
        studyHours: weeklyTarget,
        revisionHours: revisionTarget,
      }
    };

    onUpdateLifestyleProfile(updatedProfile);
    if (onSaveDailyTarget) {
      onSaveDailyTarget(dailyTarget);
    }

    setSuccessToast(true);
    setTimeout(() => {
      setSuccessToast(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black shadow-inner">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>تحديد الأهداف وساعات المذاكرة المستهدفة</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  يومي وأسبوعي 🎯
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                حدّد عدد الساعات المستهدفة ليتم تحديث الرسم البياني ومؤشرات الالتزام فوراً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Quick presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 block text-right">
              اختر مستهدفاً سريعاً أو حدد بدقة:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 4, 5, 6].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => handleDailyChange(hours)}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 border ${
                    dailyTarget === hours
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                      : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>{hours} ساعات</span>
                  <span className={`text-[10px] ${dailyTarget === hours ? 'text-indigo-200' : 'text-zinc-400'}`}>
                    {hours * 7} س/أسبوع
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Study Hours Slider & Input */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-4 text-right">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {dailyTarget}
                </span>
                <span className="text-xs font-bold text-zinc-500">ساعة / يومياً</span>
              </div>
              <label className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>المستهدف اليومي للمذاكرة ⏳</span>
              </label>
            </div>

            <input
              type="range"
              min="1"
              max="14"
              step="0.5"
              value={dailyTarget}
              onChange={(e) => handleDailyChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-indigo-200 dark:bg-indigo-900/60 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            <div className="flex justify-between text-[10px] font-bold text-zinc-400 font-mono">
              <span>1 ساعة (بداية هادئة)</span>
              <span>7 ساعات (مكثف)</span>
              <span>14 ساعة (ماراثون)</span>
            </div>
          </div>

          {/* Weekly Target Summary Calculation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-right space-y-1">
              <span className="text-[11px] font-bold text-zinc-400 block">إجمالي المستهدف الأسبوعي</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{weeklyTarget}</span>
                <span className="text-xs text-zinc-500 font-bold">ساعة / أسبوع</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">
                يحدد خط المستهدف في الرسم البياني للـ 7 أيام
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-right space-y-1">
              <span className="text-[11px] font-bold text-zinc-400 block">مستهدف المراجعات وحل الشيتات</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{revisionTarget}</span>
                <span className="text-xs text-zinc-500 font-bold">ساعة / أسبوع</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">
                يضمن تثبيت المعلومات وتكرار المراجعة
              </p>
            </div>
          </div>

          {/* Tips Info Note */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2.5 text-right">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
              <strong>نصيحة علمية:</strong> الاستمرارية اليومية بـ 4-5 ساعات بتركيز عالٍ ومتقطع تتفوق بنسبة 80% على المذاكرة المتقلبة وغير المنتظمة.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            إلغاء
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={successToast}
            className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20"
          >
            {successToast ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>تم حفظ الهدف بنجاح!</span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4 text-white" />
                <span>تطبيق وحفظ المستهدف 🎯</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
