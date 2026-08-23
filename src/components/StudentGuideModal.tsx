import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Calendar, 
  Brain, 
  TrendingUp, 
  Settings, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Mic, 
  RotateCcw, 
  Compass,
  PlayCircle,
  Clock,
  Target,
  Award,
  Activity,
  Bug,
  FileSpreadsheet
} from 'lucide-react';

interface StudentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string, primaryTab?: string) => void;
}

export const StudentGuideModal: React.FC<StudentGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [openStep, setOpenStep] = useState<number | null>(1);

  if (!isOpen) return null;

  const steps = [
    {
      id: 1,
      title: '1️⃣ تجهيز الحساب وتاريخ انطلاق العام الدراسي',
      icon: Settings,
      badge: 'البداية والتهيئة',
      color: 'from-blue-500 to-indigo-600',
      summary: 'ضبط الشعبة، تاريخ بدء العام الدراسي الفعلي، وتخصيص المواد.',
      details: [
        'افتح تبويب **"الإعدادات"** ⚙️ من القائمة الجانبية.',
        'حدد شعبتك الدراسية ومستهدفك من المجموع (مثلاً 95%) ومسار اللغة (عربي / لغات).',
        'حدد **تاريخ بدء العام الدراسي الفعلي** في التقويم: إذا كان اليوم قبل تاريخ البداية، ستكون في **مرحلة التهيئة والإعداد** (الأسبوع 0)، ويبدأ حساب الأسبوع الأكاديمي 1 ومؤشرات الإجهاد من تاريخ انطلاق العام المحدد.',
        'يمكنك في أي وقت استخدام **"إعادة ضبط الحساب من الصفر"** أو تصدير واستيراد بياناتك.'
      ],
      actionLabel: 'الانتقال للإعدادات ⚙️',
      tabKey: 'settings',
      primaryTabKey: 'profile'
    },
    {
      id: 2,
      title: '2️⃣ جدول اليوم ومؤقت المذاكرة والتحقق بعد كل حصة',
      icon: Calendar,
      badge: 'الروتين والتركيز',
      color: 'from-emerald-500 to-teal-600',
      summary: 'تنظيم مهام اليوم، والمذاكرة بالمؤقت، وتأكيد إنهاء الدرس وشيت الحصة والواجب.',
      details: [
        'انتقل إلى **"جدول اليوم"** 📅 لمتابعة المهام المقسمة لكل مادة دراسية.',
        'استخدم **"مؤقت التركيز (Pomodoro)"** ⏱️ للمذاكرة بدون تشتيت مع أصوات العزل والـ Fullscreen.',
        'عند إنهاء جلسة المذاكرة، سيسألك النظام للتحقق: **هل أتممت فهم الدرس؟** أو تأكيد **شيت الحصة لمادة [المادة]** أو **واجب مادة [المادة]** أو **المراجعة الأسبوعية/الشهرية**، لتسجيل التقدم فوراً.',
        'فعل **"وضع عدم الإزعاج ✈️"** لحماية تركيزك الذهني من الإشعارات.'
      ],
      actionLabel: 'فتح جدول اليوم 📅',
      tabKey: 'today',
      primaryTabKey: 'planning'
    },
    {
      id: 3,
      title: '3️⃣ منهج المذاكرة الذكي ودورة الـ 6 مراحل والتسميع بالصوت',
      icon: Brain,
      badge: 'المنهج والتحصيل',
      color: 'from-purple-500 to-indigo-600',
      summary: 'دورة التعلم المتكاملة، التكرار المتباعد، والتسميع الصوتي والذكاء الاصطناعي.',
      details: [
        'تصفح **"منهج ومقرر الدروس 📚"**: يتبع كل درس 6 مراحل عصبية متتالية (الفهم الأول، الاستدعاء الفوري، شيت الحصة، الواجب، التكرار المتباعد، والتثبيت النهائي).',
        'استخدم **"كوتش الذكاء الاصطناعي 🤖"**: اسأله عن أي مسألة أو درس وسيقوم بتبسيطه وشرحه لك بالعامية المصرية الدافئة.',
        'استفد من **"التسميع بالصوت 🎙️"**: اشرح الدرس بصوتك وسيقوم النظام بتفريغه ومراجعته وتخزينه في مكتبتك الصوتية.',
        'تابع **"جدول المراجعات الذكية 🧠"** للتكرار المتباعد التلقائي بعد أسبوع وشهر وقبل الامتحانات.'
      ],
      actionLabel: 'فتح منهج ومقرر الدروس 📚',
      tabKey: 'curriculum',
      primaryTabKey: 'learning'
    },
    {
      id: 4,
      title: '4️⃣ سجل الامتحانات والدرجات وتوقع المجموع والتحليلات',
      icon: TrendingUp,
      badge: 'النتائج والتحليل',
      color: 'from-amber-500 to-orange-600',
      summary: 'سجل درجاتك في الامتحانات والشيتات والواجبات وشاهد توقع مجموعك النهائي.',
      details: [
        'سجل درجات اختباراتك في **"سجل الامتحانات والدرجات 📝"** لتتبع مستوى كل فرع ومادة.',
        'شاهد **"توقع مجموعك النهائي 🎯"** المبني على درجاتك الحقيقية ومدى انتظامك الدراسي.',
        'تابع **"الرسم البياني والتحليلات (Analytic) 📈"** و **"مستوى تركيزك 🧠"** لمعرفة ساعات ذروة نشاطك الذهني وتطور أدائك الأسبوعي.'
      ],
      actionLabel: 'عرض توقع المجموع 🎯',
      tabKey: 'prediction',
      primaryTabKey: 'progress'
    },
    {
      id: 5,
      title: '5️⃣ التقييم اليومي ومقاييس الراحة وتفادي الإجهاد والتوتر النفسي',
      icon: Activity,
      badge: 'الراحة النفسية',
      color: 'from-teal-500 to-cyan-600',
      summary: 'التقييم اليومي الذكي ومقاييس التوتر والإجهاد التي تنطلق مع العام الدراسي.',
      details: [
        'قم بإجراء **"التقييم اليومي 🧠"** لتسجيل ساعات نومك، ومستوى طاقتك، ووقت الشاشة.',
        'يوجهك زر التقييم اليومي مباشرة إلى **"سجل الإحصائيات والمؤشرات الحيوية"** لتحليل صحتك النفسية.',
        '**مقياس الراحة وتفادي الإجهاد ومقياس ضغط التوتر النفسي 🤯**: يبدأ احتسابها وتحليلها التراكمي بدقة مع انطلاق العام الدراسي المحدد في تقويمك، وفي فترة التهيئة يوضح النظام حالة الاستعداد.',
        'تحصل على توصيات عصبية مخصصة مثل تمارين الـ NSDR لتجديد النشاط والوقاية من الاحتراق الأكاديمي.'
      ],
      actionLabel: 'سجل المزاج والراحة النفسية 🧬',
      tabKey: 'checkin',
      primaryTabKey: 'health'
    },
    {
      id: 6,
      title: '6️⃣ لوحة المتصدرين العامة، المكافآت، وخدمة الإبلاغ عن المشاكل',
      icon: Award,
      badge: 'المنافسة والدعم',
      color: 'from-pink-500 to-rose-600',
      summary: 'لوحة المتصدرين وتحديث آخر درس منجز لكل مادة ونظام الإبلاغ الفوري.',
      details: [
        'شاهد ترتيبك في **"لوحة المتصدرين العامة 🏆"**، حيث يظهر آخر درس منجز لكل مادة في بطاقة كل طالب مع نقاط الخبرة (XP) وسلسلة الالتزام (Streak).',
        'بمجرد إنجازك لأي درس أو شيت أو واجب، يتم تحديث بياناتك فوراً في لوحة المتصدرين والمقرر الدراسي.',
        'إذا واجهت أي مشكلة في التواريخ، أو التزامن، أو الواجهة، افتح الإعدادات واضغط **"تسجيل مشكلة جديدة 📝"** في نافذة الإبلاغ عن الأخطاء وسيقوم الفريق بمتابعتها فوراً.'
      ],
      actionLabel: 'لوحة المتصدرين والمكافآت 🏆',
      tabKey: 'gamification',
      primaryTabKey: 'gamification'
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm dir-rtl animate-in fade-in duration-200"
      style={{ direction: 'rtl' }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-right">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-zinc-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                <span>دليل الاستخدام الشامل والربط المتكامل للمنصة 📖</span>
              </h3>
              <p className="text-xs text-indigo-200/80 font-bold mt-0.5">
                دليلك المترابط لكافة أدوات ومزايا المساعد الدراسي من الألف إلى الياء
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 divide-y divide-zinc-150 dark:divide-zinc-800/80">
          
          {/* Quick Intro Card */}
          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>مرحباً بك يا بطل الثانوية العامة! كافة ميزات المنصة مرتبطة ببعضها تلقائياً ⚡</span>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-bold">
              جميع عناصر المنصة مترابطة تماماً: جلسات المذاكرة تسجل في المقرر، درجات الشيتات والواجبات تحسب في توقع المجموع، التقييم اليومي يوجهك مباشرة للإحصائيات، ومقاييس الإجهاد والتوتر تلتزم بتاريخ بدء العام الدراسي الفعلي.
            </p>
          </div>

          {/* Accordion Steps */}
          <div className="pt-4 space-y-3">
            {steps.map((step) => {
              const IconComp = step.icon;
              const isExpanded = openStep === step.id;

              return (
                <div 
                  key={step.id} 
                  className={`border rounded-2xl transition-all overflow-hidden ${
                    isExpanded 
                      ? 'border-indigo-500/40 dark:border-indigo-500/30 bg-zinc-50/50 dark:bg-zinc-800/30 shadow-sm' 
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {/* Step Title Header */}
                  <button
                    onClick={() => setOpenStep(isExpanded ? null : step.id)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-right cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                            {step.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 hidden sm:inline-block">
                            {step.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {step.summary}
                        </p>
                      </div>
                    </div>
                    <div className="text-zinc-400 shrink-0">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {/* Step Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-3 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      <ul className="space-y-2 list-disc list-inside text-zinc-600 dark:text-zinc-300 font-medium">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: detail.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        ))}
                      </ul>

                      {onNavigateTab && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => {
                              onNavigateTab(step.tabKey, step.primaryTabKey);
                              onClose();
                            }}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{step.actionLabel}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="pt-4 text-center text-[11px] text-zinc-500 font-bold">
            💡 نصيحة: يمكنك العودة لهذا الدليل الشامل في أي وقت عبر زر "دليل الاستخدام 📖" في أعلى الصفحة أو من قائمة الإعدادات.
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-500 font-bold">
            المنصة المترابطة لإدارة الثانوية العامة 🎓
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer"
          >
            فهمت، لنبدأ المذاكرة! 🚀
          </button>
        </div>

      </div>
    </div>
  );
};
export default StudentGuideModal;
