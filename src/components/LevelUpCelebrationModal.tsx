import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Sparkles, Trophy, Flame, Zap, Check, ArrowUpRight, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LevelUpCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  oldLevel?: number;
  totalXp: number;
  unlockedPerks?: string[];
}

export default function LevelUpCelebrationModal({
  isOpen,
  onClose,
  newLevel,
  oldLevel = newLevel - 1,
  totalXp,
  unlockedPerks
}: LevelUpCelebrationModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger multiple confetti bursts
      const count = 200;
      const defaults = {
        origin: { y: 0.7 }
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        try {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
          });
        } catch {
          // ignore if canvas not supported
        }
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });

      // Optional Web Audio level up chime
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = audioCtx.currentTime;
        
        const playTone = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.exponentialRampToValueAtTime(0.15, startTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };

        // Fanfare chord progression: C5 -> E5 -> G5 -> C6
        playTone(523.25, now + 0.0, 0.25, 'triangle');
        playTone(659.25, now + 0.12, 0.25, 'triangle');
        playTone(783.99, now + 0.24, 0.35, 'triangle');
        playTone(1046.50, now + 0.36, 0.7, 'sine');
      } catch {
        // AudioContext not allowed or disabled
      }
    }
  }, [isOpen]);

  const defaultPerks = [
    `زيادة قوة التركيز والقدرة الاستيعابية بنسبة ${(newLevel * 5)}%`,
    `فتح أوسمة شرف جديدة في لوحة المتصدرين العامة`,
    `مضاعفة نقاط التحفيز لجلسات المذاكرة المركزة`
  ];

  const perks = unlockedPerks && unlockedPerks.length > 0 ? unlockedPerks : defaultPerks;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" style={{ direction: 'rtl' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 via-zinc-900 to-indigo-950/90 border border-indigo-500/40 rounded-3xl p-6 md:p-8 shadow-2xl text-white text-center overflow-hidden"
          >
            {/* Background Glow effects */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 right-0 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Floating Star & Sparkles Decorations */}
            <motion.div
              animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="absolute top-4 left-4 text-amber-400 opacity-60"
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>

            <motion.div
              animate={{ rotate: [360, 0], scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
              className="absolute top-6 right-6 text-indigo-400 opacity-60"
            >
              <Star className="w-4 h-4 fill-indigo-400" />
            </motion.div>

            {/* Level Badge Animation */}
            <div className="relative my-4 flex justify-center items-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-500 to-amber-400 p-[3px] shadow-2xl shadow-indigo-500/50 flex items-center justify-center relative"
              >
                <div className="w-full h-full rounded-full bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent" />
                  <Trophy className="w-9 h-9 text-amber-400 drop-shadow-md animate-bounce" />
                  <span className="text-[11px] font-black text-amber-300 font-mono mt-0.5">LEVEL</span>
                  <span className="text-2xl font-black text-white font-mono tracking-tight leading-none">{newLevel}</span>
                </div>
              </motion.div>

              {/* Pulsing Aura Rings */}
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute w-32 h-32 rounded-full border-2 border-indigo-400/50 pointer-events-none"
              />
            </div>

            {/* Title & Congratulations */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2 mt-3"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>إنجاز استثنائي جديد! 🎉</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                تهانينا! ارتقيت إلى <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">المستوى {newLevel}</span>
              </h2>

              <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
                لقد اجتزت عتبة الـ XP المطلوبة ورفعت كفاءة قدرتك الدماغية والالتزام بالثانوية العامة!
              </p>
            </motion.div>

            {/* XP and Level Stat Overview */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="my-5 grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 text-right"
            >
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-zinc-400 font-bold block">المستوى السابق</span>
                <span className="text-base font-black text-zinc-300 font-mono">المستوى {oldLevel}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
                <span className="text-[10px] text-indigo-300 font-bold block">المستوى الحالي 🚀</span>
                <span className="text-base font-black text-amber-300 font-mono">المستوى {newLevel}</span>
              </div>
            </motion.div>

            {/* Unlocked Perks List */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2 text-right mb-6"
            >
              <span className="text-[11px] font-bold text-zinc-400 block">المكافآت والترقيات المفتوحة:</span>
              <div className="space-y-1.5">
                {perks.map((perk, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-medium text-zinc-200">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-black shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>متابعة التفوق والمذاكرة 🚀</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
