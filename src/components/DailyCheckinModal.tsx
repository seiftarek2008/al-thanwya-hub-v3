import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Moon, 
  Brain, 
  Flame, 
  AlertTriangle, 
  Zap, 
  Smartphone, 
  CheckCircle, 
  Smile, 
  ArrowLeft, 
  ArrowRight 
} from 'lucide-react';
import { DailyCheckin } from '../types';

interface DailyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  onPostpone: () => void;
  onSave: (checkin: Omit<DailyCheckin, 'id'>) => void;
  existingCheckin?: DailyCheckin | null;
  scheduledWakeupTime?: string;
}

export default function DailyCheckinModal({
  isOpen,
  onClose,
  onSkip,
  onPostpone,
  onSave,
  existingCheckin,
  scheduledWakeupTime = '06:30'
}: DailyCheckinModalProps) {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 7;

  // Questionnaire States
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [wakeupTime, setWakeupTime] = useState<string>(scheduledWakeupTime);
  const [sleepQuality, setSleepQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [focusLevel, setFocusLevel] = useState<number>(3);
  const [motivation, setMotivation] = useState<number>(3);
  const [stress, setStress] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(3);
  const [phoneUsage, setPhoneUsage] = useState<number>(60); // in minutes

  // Auto-fill existing checkin values if editing
  useEffect(() => {
    if (existingCheckin) {
      setSleepHours(existingCheckin.sleepHours || 7);
      setWakeupTime(existingCheckin.wakeupTime || scheduledWakeupTime);
      setSleepQuality(existingCheckin.sleepQuality || 'good');
      setFocusLevel(existingCheckin.focusLevel || 3);
      setMotivation(existingCheckin.motivation || 3);
      setStress(existingCheckin.stress || 3);
      setEnergy(existingCheckin.energy || 3);
      setPhoneUsage(existingCheckin.phoneUsage || 60);
    } else {
      // Reset to defaults
      setSleepHours(7);
      setWakeupTime(scheduledWakeupTime || '06:30');
      setSleepQuality('good');
      setFocusLevel(3);
      setMotivation(3);
      setStress(3);
      setEnergy(3);
      setPhoneUsage(60);
    }
    setStep(1);
  }, [existingCheckin, isOpen, scheduledWakeupTime]);

  // Keyboard navigation support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (step < totalSteps) {
          setStep(prev => prev + 1);
        } else {
          handleComplete();
        }
      } else if (e.key === 'ArrowLeft' && step > 1) {
        setStep(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && step < totalSteps) {
        setStep(prev => prev + 1);
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const val = Number(e.key);
        if (step === 3) setFocusLevel(val);
        else if (step === 4) setMotivation(val);
        else if (step === 5) setStress(val);
        else if (step === 6) setEnergy(val);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, sleepHours, sleepQuality, focusLevel, motivation, stress, energy, phoneUsage]);

  if (!isOpen) return null;

  const handleComplete = () => {
    // fatigue is inverse of energy
    const fatigue = 6 - energy; 

    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    onSave({
      date: todayStr,
      sleepHours,
      wakeupTime,
      sleepQuality,
      focusLevel,
      motivation,
      stress,
      fatigue,
      energy,
      phoneUsage
    });
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const getSleepQualityLabel = (q: string) => {
    switch (q) {
      case 'poor': return 'سيء جداً 🔴';
      case 'fair': return 'مقبول / متقطع 🟡';
      case 'good': return 'جيد ومريح 🟢';
      case 'excellent': return 'ممتاز وعميق 🌟';
      default: return q;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 text-right shadow-2xl"
        style={{ direction: 'rtl' }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-zinc-950 dark:text-zinc-50">
                {existingCheckin ? 'تحديث التقييم اليومي' : 'التقييم اليومي الذكي'}
              </h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block">
                توجيه كوتش ثانوية عامة المباشر 🧭
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 dark:text-zinc-500 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full">
            السؤال {step} من {totalSteps}
          </span>
          
          {/* Progress bar */}
          <div className="flex-1 max-w-[200px] bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mx-4 overflow-hidden">
            <div 
              className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold font-mono">
            {Math.round((step / totalSteps) * 100)}%
          </span>
        </div>

        {/* Question Body with animation */}
        <div className="my-8 min-h-[160px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Question 1: Sleep Hours & Wake-up Time */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Moon className="w-5 h-5 text-indigo-500" />
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      كم عدد ساعات نومك ووقت استيقاظك حسب جدولك؟
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold block">ساعات النوم ⏱️</span>
                      <div className="flex items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={() => setSleepHours(Math.max(3, sleepHours - 0.5))}
                          className="w-9 h-9 rounded-full bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-extrabold text-base flex items-center justify-center hover:scale-[1.05] active:scale-[0.95] cursor-pointer shadow-sm border border-zinc-200 dark:border-zinc-700"
                        >
                          -
                        </button>
                        <div className="text-center">
                          <span className="text-2xl font-black font-mono text-zinc-900 dark:text-white">
                            {sleepHours}
                          </span>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold mr-1">ساعات</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSleepHours(Math.min(14, sleepHours + 0.5))}
                          className="w-9 h-9 rounded-full bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-extrabold text-base flex items-center justify-center hover:scale-[1.05] active:scale-[0.95] cursor-pointer shadow-sm border border-zinc-200 dark:border-zinc-700"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold block">وقت الاستيقاظ المحدد بالجدول ⏰</span>
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="time"
                          value={wakeupTime}
                          onChange={(e) => setWakeupTime(e.target.value)}
                          className="px-3 py-1.5 text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 block font-bold">
                        توقيت التقييم التلقائي: ساعة ونصف بعد الاستيقاظ
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Question 2: Sleep Quality */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Moon className="w-5 h-5 text-indigo-500 animate-pulse" />
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      كيف تقيم جودة نومك الليلة الماضية؟
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    {[
                      { id: 'poor', label: 'سيء 🔴', desc: 'متقطع أو قليل جداً' },
                      { id: 'fair', label: 'مقبول 🟡', desc: 'نوم خفيف متقطع' },
                      { id: 'good', label: 'جيد 🟢', desc: 'مريح ومستقر' },
                      { id: 'excellent', label: 'ممتاز وعميق 🌟', desc: 'استيقاظ بكامل الحيوية' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSleepQuality(item.id as any)}
                        className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between hover:scale-[1.01] cursor-pointer ${
                          sleepQuality === item.id
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span className="text-xs font-black block">{item.label}</span>
                        <span className={`text-[10px] block mt-1 ${sleepQuality === item.id ? 'text-indigo-100' : 'text-zinc-400 dark:text-zinc-500'}`}>
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question 3: Focus Level */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-teal-500" />
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      ما هو مستوى تركيزك وتيقظك اليوم؟
                    </h4>
                  </div>
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {[
                      { val: 1, label: '1 😵', desc: 'تشتت تام' },
                      { val: 2, label: '2 🥱', desc: 'تركيز ضعيف' },
                      { val: 3, label: '3 🙂', desc: 'متوسط' },
                      { val: 4, label: '4 ⚡', desc: 'عالٍ' },
                      { val: 5, label: '5 🧠', desc: 'تركيز خارق' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setFocusLevel(item.val)}
                        className={`p-2.5 rounded-xl border text-center transition-all hover:scale-[1.03] cursor-pointer ${
                          focusLevel === item.val
                            ? 'bg-teal-600 border-teal-600 text-white font-black'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span className="text-xs font-black block">{item.label}</span>
                        <span className={`text-[9px] block mt-1 ${focusLevel === item.val ? 'text-teal-100' : 'text-zinc-400'}`}>
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question 4: Motivation */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      كيف هي دافعيتك وحماسك للمذاكرة اليوم؟
                    </h4>
                  </div>
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {[
                      { val: 1, label: '1 🛑', desc: 'منعدمة' },
                      { val: 2, label: '2 📉', desc: 'منخفضة' },
                      { val: 3, label: '3 ⚖️', desc: 'عادية' },
                      { val: 4, label: '4 🔥', desc: 'حماس جيد' },
                      { val: 5, label: '5 🚀', desc: 'حماس متقد' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setMotivation(item.val)}
                        className={`p-2.5 rounded-xl border text-center transition-all hover:scale-[1.03] cursor-pointer ${
                          motivation === item.val
                            ? 'bg-orange-600 border-orange-600 text-white font-black'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span className="text-xs font-black block">{item.label}</span>
                        <span className={`text-[9px] block mt-1 ${motivation === item.val ? 'text-orange-100' : 'text-zinc-400'}`}>
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question 5: Stress */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      ما هو مستوى التوتر أو الضغط النفسي الذي تعاني منه؟
                    </h4>
                  </div>
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {[
                      { val: 1, label: '1 😌', desc: 'هادئ تماماً' },
                      { val: 2, label: '2 🌱', desc: 'توتر خفيف' },
                      { val: 3, label: '3 🛡️', desc: 'متوسط' },
                      { val: 4, label: '4 ⚠️', desc: 'توتر مرتفع' },
                      { val: 5, label: '5 🚨', desc: 'توتر شديد' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setStress(item.val)}
                        className={`p-2.5 rounded-xl border text-center transition-all hover:scale-[1.03] cursor-pointer ${
                          stress === item.val
                            ? 'bg-red-600 border-red-600 text-white font-black'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span className="text-xs font-black block">{item.label}</span>
                        <span className={`text-[9px] block mt-1 ${stress === item.val ? 'text-red-100' : 'text-zinc-400'}`}>
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question 6: Energy */}
              {step === 6 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      كيف هو مستوى طاقتك ونشاطك الآن؟
                    </h4>
                  </div>
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {[
                      { val: 1, label: '1 💤', desc: 'خمول تام' },
                      { val: 2, label: '2 😴', desc: 'مرهق' },
                      { val: 3, label: '3 ☕', desc: 'نشاط مقبول' },
                      { val: 4, label: '4 💪', desc: 'حيوية ونشاط' },
                      { val: 5, label: '5 🔋', desc: 'طاقة قصوى' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setEnergy(item.val)}
                        className={`p-2.5 rounded-xl border text-center transition-all hover:scale-[1.03] cursor-pointer ${
                          energy === item.val
                            ? 'bg-amber-500 border-amber-500 text-white font-black'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span className="text-xs font-black block">{item.label}</span>
                        <span className={`text-[9px] block mt-1 ${energy === item.val ? 'text-amber-100' : 'text-zinc-400'}`}>
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question 7: Phone Usage */}
              {step === 7 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-purple-500" />
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      كم كان وقت استخدامك للهاتف/الشاشات اليوم؟
                    </h4>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { val: 15, label: '١٥ د 📱' },
                        { val: 30, label: '٣٠ د ⏱️' },
                        { val: 60, label: 'ساعة ⏳' },
                        { val: 120, label: 'ساعتين ⚠️' },
                        { val: 240, label: '٤ ساعات+ 🚨' }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setPhoneUsage(item.val)}
                          className={`py-2 px-1 rounded-lg border text-[11px] font-black text-center transition-all hover:scale-[1.02] cursor-pointer ${
                            phoneUsage === item.val
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 mt-2">
                      <span className="text-[11px] text-zinc-400 font-semibold">تحديد مخصص بالدقائق:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="10"
                          max="480"
                          step="10"
                          value={phoneUsage}
                          onChange={(e) => setPhoneUsage(Number(e.target.value))}
                          className="w-28 accent-purple-500 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold text-zinc-800 dark:text-white bg-zinc-150 dark:bg-zinc-900 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800">
                          {phoneUsage >= 60 ? `${Math.floor(phoneUsage / 60)}س ${phoneUsage % 60}د` : `${phoneUsage}د`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
          {/* Back button */}
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center gap-1.5 py-2 px-4 text-xs font-bold rounded-xl transition-all ${
              step === 1
                ? 'opacity-40 text-zinc-300 cursor-not-allowed'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            <span>السابق</span>
          </button>

          {/* SKIP / POSTPONE for step 1 only */}
          {step === 1 && !existingCheckin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPostpone}
                className="py-2 px-3 text-[11px] font-black text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl transition-all cursor-pointer"
              >
                ذكرني لاحقاً (30د)
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="py-2 px-3 text-[11px] font-black text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
              >
                تخطي اليوم
              </button>
            </div>
          )}

          {/* Next/Complete button */}
          <button
            type="button"
            onClick={nextStep}
            className="flex items-center gap-1.5 py-2.5 px-5 text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <span>{step === totalSteps ? 'إنهاء وحفظ التقييم' : 'التالي'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
