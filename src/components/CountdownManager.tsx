import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Pin, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  AlertTriangle,
  Bookmark, 
  Sparkles,
  BookOpen,
  ChevronDown,
  Info
} from 'lucide-react';
import { Countdown } from '../types';

interface CountdownManagerProps {
  countdowns: Countdown[];
  onAddCountdown: (newCountdown: Countdown) => void;
  onDeleteCountdown: (id: string) => void;
  onTogglePin: (id: string) => void;
}

const PRESETS: Omit<Countdown, 'id'>[] = [
  {
    title: 'انطلاق امتحانات الثانوية العامة المضافة للمجموع 🎓',
    emoji: '📝',
    category: 'امتحانات',
    deadline: '2027-06-08T09:00',
    color: 'rose',
    priority: 'high',
    notes: 'بداية الملحمة! لا تقلق، لقد صنعت لتبدع وتتفوق.',
    repeat: 'none',
    reminder: '1d',
    pinned: true
  },
  {
    title: 'المراجعة الشاملة الأولى (الكهربية والحديثة فيزياء) ⚡',
    emoji: '🧠',
    category: 'مراجعات',
    deadline: '2027-03-15T18:00',
    color: 'amber',
    priority: 'high',
    notes: 'مراجعة وحل ٢٠٠ سؤال فيزياء شاملة.',
    repeat: 'none',
    reminder: '1h',
    pinned: false
  },
  {
    title: 'تسليم المسودة النهائية لمشروع الجيولوجيا 🌍',
    emoji: '📚',
    category: 'مشاريع',
    deadline: '2027-04-20T12:00',
    color: 'indigo',
    priority: 'medium',
    notes: 'تحضير قطاعات الصخور وعوامل التعرية للتقييم.',
    repeat: 'none',
    reminder: '1d',
    pinned: false
  }
];

export default function CountdownManager({ 
  countdowns, 
  onAddCountdown, 
  onDeleteCountdown, 
  onTogglePin 
}: CountdownManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [category, setCategory] = useState('امتحانات');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('indigo');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [notes, setNotes] = useState('');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [reminder, setReminder] = useState<'none' | '10m' | '1h' | '1d' | '1w'>('1d');
  const [pinned, setPinned] = useState(false);

  // Sorting & Filtering State
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortMethod, setSortMethod] = useState<'date' | 'priority' | 'title'>('date');

  // Real-time ticker update every second
  const [, setTicker] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTicker(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Populate presets if the user's countdowns list is empty
  useEffect(() => {
    if (countdowns.length === 0) {
      PRESETS.forEach((preset, index) => {
        onAddCountdown({
          ...preset,
          id: `preset-${Date.now()}-${index}`
        });
      });
    }
  }, [countdowns.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;

    onAddCountdown({
      id: `countdown-${Date.now()}`,
      title,
      emoji,
      category,
      deadline,
      color,
      priority,
      notes,
      repeat,
      reminder,
      pinned
    });

    // Reset Form
    setTitle('');
    setDeadline('');
    setNotes('');
    setPinned(false);
    setShowAddForm(false);
  };

  // Remaining time calculator
  const getRemainingTime = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds, isPassed: false };
  };

  // Categories list
  const categories = ['all', ...Array.from(new Set(countdowns.map(c => c.category)))];

  // Filtered & Sorted countdowns
  const processedCountdowns = countdowns
    .filter(c => filterCategory === 'all' || c.category === filterCategory)
    .sort((a, b) => {
      // 1. Pinned items always go first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // 2. Main sort method
      if (sortMethod === 'date') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortMethod === 'priority') {
        const pMap = { high: 3, medium: 2, low: 1 };
        return pMap[b.priority] - pMap[a.priority];
      }
      return a.title.localeCompare(b.title, 'ar');
    });

  const getPriorityBadgeColor = (p: string) => {
    if (p === 'high') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-150';
    if (p === 'medium') return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-150';
    return 'bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-150';
  };

  const getColorClasses = (c: string) => {
    const map: { [key: string]: string } = {
      rose: 'border-rose-100 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10',
      amber: 'border-amber-100 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/10',
      indigo: 'border-indigo-100 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/10',
      emerald: 'border-emerald-100 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/10',
      purple: 'border-purple-100 dark:border-purple-900 bg-purple-50/20 dark:bg-purple-950/10',
      slate: 'border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30'
    };
    return map[c] || map.slate;
  };

  const getEmojiOptions = ['📝', '⏳', '🎓', '⚡', '🧠', '📚', '🏆', '🗓️', '🌍', '🧪', '🔔', '🚀'];

  return (
    <div className="space-y-6 text-right" style={{ direction: 'rtl' }}>
      
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-150 dark:border-zinc-850">
        <div>
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span>عدادات التنازل الزمني والعد التنازلي للمهام</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">تتبع مواعيد امتحاناتك، ومراجعاتك النهائية، وتسليماتك بدقة متناهية بالثانية.</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء عداد تنازلي مخصص</span>
        </button>
      </div>

      {/* Creation form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-500 mb-1.5">عنوان العداد التنازلي:</label>
              <input
                type="text" required placeholder="مثال: امتحان مادة الكيمياء الشامل للثانوية"
                value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1.5">أيقونة تعبيرية (Emoji):</label>
              <div className="flex gap-1 overflow-x-auto p-1 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-150 dark:border-zinc-800">
                {getEmojiOptions.map(em => (
                  <button
                    key={em} type="button" onClick={() => setEmoji(em)}
                    className={`p-1.5 rounded-lg text-sm transition-all ${emoji === em ? 'bg-zinc-200 dark:bg-zinc-800 scale-110' : 'hover:scale-105'}`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1.5">التصنيف:</label>
              <select
                value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 rounded-xl focus:outline-none"
              >
                <option value="امتحانات">امتحانات 🎓</option>
                <option value="مراجعات">مراجعات سلوكية 🧠</option>
                <option value="مشاريع">تسليمات ومشاريع 📚</option>
                <option value="راحة شخصية">راحة ومناسبات عائلية 🎉</option>
                <option value="عام">عام ⚡</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1.5">تاريخ ووقت النهاية (الموعد):</label>
              <input
                type="datetime-local" required
                value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1.5">الأهمية والأولوية:</label>
              <select
                value={priority} onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 rounded-xl focus:outline-none"
              >
                <option value="high">قصوى (High) 🔥</option>
                <option value="medium">متوسطة (Medium) ⚡</option>
                <option value="low">عادية (Low) ✨</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1.5">اللون التعبيري للبطاقة:</label>
              <div className="flex gap-1.5 p-1 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-150 dark:border-zinc-800 justify-center">
                {['rose', 'amber', 'indigo', 'emerald', 'purple', 'slate'].map(col => (
                  <button
                    key={col} type="button" onClick={() => setColor(col)}
                    className={`w-6 h-6 rounded-full border transition-all ${
                      color === col ? 'ring-2 ring-offset-2 ring-zinc-400 scale-110' : 'hover:scale-105'
                    } ${
                      col === 'rose' ? 'bg-rose-500' :
                      col === 'amber' ? 'bg-amber-500' :
                      col === 'indigo' ? 'bg-indigo-500' :
                      col === 'emerald' ? 'bg-emerald-500' :
                      col === 'purple' ? 'bg-purple-500' : 'bg-zinc-500'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1.5">المنبه والتذكير:</label>
              <select
                value={reminder} onChange={(e) => setReminder(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 rounded-xl focus:outline-none"
              >
                <option value="none">بدون تذكير</option>
                <option value="10m">قبل الموعد بـ ١٠ دقائق</option>
                <option value="1h">قبل الموعد بـ ساعة واحدة</option>
                <option value="1d">قبل الموعد بـ يوم واحد 🔔</option>
                <option value="1w">قبل الموعد بـ أسبوع كامل</option>
              </select>
            </div>

            <div className="flex items-center justify-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0 w-4 h-4"
                />
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">تثبيت هذا العداد في الأعلى كشاشة رئيسية</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1.5">ملاحظات وخطوات المذاكرة المرتبطة:</label>
            <textarea
              placeholder="اكتب ملاحظاتك، مراجعك، الأجزاء الهامة التي يجب أن تنجزها قبل هذا الموعد الفاصل..."
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full p-3 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button" onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-black bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 rounded-xl shadow-xs"
            >
              حفظ العداد وتشغيله 🚀
            </button>
          </div>
        </form>
      )}

      {/* Sorting & Filter controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Filter className="w-3.5 h-3.5" />
            <span>فلترة بالتصنيف:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {categories.map(cat => (
              <button
                key={cat} onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                  filterCategory === cat
                    ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 border-transparent'
                    : 'bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-zinc-150 hover:bg-zinc-50'
                }`}
              >
                {cat === 'all' ? 'الكل' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>ترتيب حسب:</span>
          </div>
          <select
            value={sortMethod} onChange={(e) => setSortMethod(e.target.value as any)}
            className="px-2.5 py-1 text-[10px] font-bold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="date">الموعد الأقرب 📅</option>
            <option value="priority">الأولوية والأهمية 🔥</option>
            <option value="title">الترتيب الأبجدي 📝</option>
          </select>
        </div>
      </div>

      {/* Main Countdowns List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {processedCountdowns.map(c => {
          const { days, hours, minutes, seconds, isPassed } = getRemainingTime(c.deadline);
          
          return (
            <div
              key={c.id}
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${getColorClasses(c.color)}`}
            >
              
              {/* Card top flags */}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{c.emoji}</span>
                  <div className="text-right">
                    <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 line-clamp-1">{c.title}</h3>
                    <span className="text-[9px] bg-white/70 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-md font-bold mt-0.5 inline-block">{c.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onTogglePin(c.id)}
                    className={`p-1.5 rounded-lg border border-transparent hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 transition-colors ${c.pinned ? 'text-indigo-600' : 'text-zinc-400'}`}
                    title={c.pinned ? 'إزالة التثبيت' : 'تثبيت في الأعلى'}
                  >
                    <Pin className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => onDeleteCountdown(c.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Countdown Ticker Block */}
              <div className="my-3 py-3.5 bg-white/60 dark:bg-zinc-900/40 rounded-xl border border-zinc-100/50 dark:border-zinc-800/30 grid grid-cols-4 gap-1 text-center relative z-10">
                {isPassed ? (
                  <div className="col-span-4 py-2 flex flex-col items-center justify-center text-zinc-500">
                    <AlertTriangle className="w-5 h-5 text-zinc-400 animate-pulse" />
                    <span className="text-xs font-black mt-1">انتهى هذا الموعد الفاصل!</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="text-lg font-mono font-black text-zinc-950 dark:text-zinc-50">{days}</span>
                      <span className="text-[9px] font-black text-zinc-400">يوم</span>
                    </div>
                    <div className="flex flex-col border-r border-zinc-200/30">
                      <span className="text-lg font-mono font-black text-zinc-950 dark:text-zinc-50">{hours}</span>
                      <span className="text-[9px] font-black text-zinc-400">ساعة</span>
                    </div>
                    <div className="flex flex-col border-r border-zinc-200/30">
                      <span className="text-lg font-mono font-black text-zinc-950 dark:text-zinc-50">{minutes}</span>
                      <span className="text-[9px] font-black text-zinc-400">دقيقة</span>
                    </div>
                    <div className="flex flex-col border-r border-zinc-200/30">
                      <span className="text-lg font-mono font-black text-indigo-600 dark:text-indigo-400">{seconds}</span>
                      <span className="text-[9px] font-black text-zinc-400">ثانية</span>
                    </div>
                  </>
                )}
              </div>

              {/* Note / Description */}
              {c.notes && (
                <div className="text-right text-[10px] text-zinc-500 dark:text-zinc-400 italic mt-2 line-clamp-2 leading-relaxed border-r-2 border-zinc-250 pr-2 relative z-10">
                  {c.notes}
                </div>
              )}

              {/* Priority & Date Line */}
              <div className="mt-4 pt-3.5 border-t border-zinc-100/60 dark:border-zinc-800/40 flex justify-between items-center text-[9px] font-bold text-zinc-400 relative z-10">
                <span>الموعد النهائي: {new Date(c.deadline).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
                <span className={`px-2 py-0.5 rounded-full border ${getPriorityBadgeColor(c.priority)}`}>
                  {c.priority === 'high' ? 'أولوية قصوى 🔥' : c.priority === 'medium' ? 'أولوية متوسطة ⚡' : 'أولوية عادية'}
                </span>
              </div>
            </div>
          );
        })}

        {processedCountdowns.length === 0 && (
          <div className="col-span-2 text-center p-12 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850 text-zinc-400 flex flex-col items-center justify-center space-y-2">
            <Info className="w-8 h-8 text-zinc-300 animate-bounce" />
            <strong className="text-xs font-bold">لا يوجد عدادات تنازلية تطابق الفلتر المختار!</strong>
            <p className="text-[10px]">ابدأ بإنشاء أول عداد تنازلي لمادة دراسية أو امتحان تجريبي الآن.</p>
          </div>
        )}
      </div>
    </div>
  );
}
