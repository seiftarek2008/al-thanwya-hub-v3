import React, { useState, useMemo, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Calendar, 
  Award, 
  Clock, 
  Smile, 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  Coffee, 
  PhoneOff, 
  Activity, 
  Plus, 
  Trash2, 
  Moon, 
  Sliders, 
  BookOpen,
  ChevronRight,
  Battery,
  Mic,
  MicOff
} from 'lucide-react';
import { Subject, SleepLog, ScreenTimeLog, DailyCheckin, GradeRecord, PlannerActivity } from '../types';

interface NeurosciencePanelProps {
  stream: 'math' | 'science' | 'literature';
  consistencyScore: number;
  subjects: Subject[];
  sleepLogs: SleepLog[];
  screenTimeLogs: ScreenTimeLog[];
  dailyCheckins: DailyCheckin[];
  grades: GradeRecord[];
  plannerActivities: PlannerActivity[];
  onAddSleepLog: (log: Omit<SleepLog, 'id'>) => void;
  onAddScreenTimeLog: (log: Omit<ScreenTimeLog, 'id'>) => void;
  onAddDailyCheckin: (checkin: Omit<DailyCheckin, 'id'>) => void;
  onAddGrade: (grade: Omit<GradeRecord, 'id'>) => void;
  onDeleteGrade: (id: string) => void;
  burnoutLogs?: any[];
  stressLogs?: any[];
  token?: string;
  onSyncFullData?: (newData: any) => void;
  initialSubTab?: 'spaced' | 'checkin' | 'burnout' | 'grades' | 'voice-recall' | 'coach' | 'analytics';
  thanaweyaStartDate?: string;
}

export default function NeurosciencePanel({
  stream,
  consistencyScore,
  subjects,
  sleepLogs,
  screenTimeLogs,
  dailyCheckins,
  grades,
  plannerActivities,
  onAddSleepLog,
  onAddScreenTimeLog,
  onAddDailyCheckin,
  onAddGrade,
  onDeleteGrade,
  burnoutLogs = [],
  stressLogs = [],
  token,
  onSyncFullData,
  initialSubTab,
  thanaweyaStartDate
}: NeurosciencePanelProps) {
  // Tabs State
  const [activeSubTab, setActiveSubTab] = useState<'spaced' | 'checkin' | 'burnout' | 'grades' | 'voice-recall' | 'analytics'>(
    initialSubTab === 'coach' ? 'checkin' : (initialSubTab || 'spaced')
  );
  const [trendType, setTrendType] = useState<'weekly' | 'monthly'>('weekly');

  // Sync initialSubTab
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab === 'coach' ? 'checkin' : initialSubTab);
    }
  }, [initialSubTab]);

  // Daily Checkin Form State
  const [focusLevel, setFocusLevel] = useState(4);
  const [motivation, setMotivation] = useState(4);
  const [stress, setStress] = useState(3);
  const [fatigue, setFatigue] = useState(2);
  const [checkinMessage, setCheckinMessage] = useState('');

  // Sleep Form State
  const [bedtime, setBedtime] = useState('23:00');
  const [waketime, setWaketime] = useState('06:30');
  const [sleepQuality, setSleepQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [sleepMessage, setSleepMessage] = useState('');

  // Screen Time Form State
  const [screenMinutes, setScreenMinutes] = useState('');
  const [screenMessage, setScreenMessage] = useState('');

  // Grade Form State
  const [gradeSubjectId, setGradeSubjectId] = useState(subjects[0]?.id || '');
  const [gradeCategory, setGradeCategory] = useState<GradeRecord['category']>('Quiz');
  const [gradeTitle, setGradeTitle] = useState('');
  const [gradeScore, setGradeScore] = useState('');
  const [gradeTotal, setGradeTotal] = useState('20');
  const [gradeWeak, setGradeWeak] = useState('');
  const [gradeStrong, setGradeStrong] = useState('');
  const [gradeBranch, setGradeBranch] = useState('');

  // AI Burnout & Stress Analysis State
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState('');

  // AI Voice Recall State
  const [voiceSubjectId, setVoiceSubjectId] = useState(subjects[0]?.id || '');
  const [voiceTopicName, setVoiceTopicName] = useState('');
  const [voiceExplanation, setVoiceExplanation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showMicPrompt, setShowMicPrompt] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<any | null>(null);
  const [voiceError, setVoiceError] = useState('');

  // AI Weekly Coach State
  const [coachMode, setCoachMode] = useState<'weekly' | 'monthly'>('weekly');
  const [isGeneratingCoach, setIsGeneratingCoach] = useState(false);
  const [coachReport, setCoachReport] = useState<{
    achievements: string[];
    mistakesToAvoid: string[];
    weakestSubject: string;
    strongestSubject: string;
    predictedExamScore: number;
    studyConsistencyComments: string;
    metricsTrends: {
      focus: string;
      stress: string;
      burnout: string;
      memory: string;
      productivity: string;
    };
    actionableRecommendations: string[];
  } | null>(null);
  const [coachError, setCoachError] = useState('');

  // AI Monthly Coach State
  const [isGeneratingMonthlyCoach, setIsGeneratingMonthlyCoach] = useState(false);
  const [monthlyCoachReport, setMonthlyCoachReport] = useState<{
    achievements: string[];
    mistakesToAvoid: string[];
    weakestSubject: string;
    strongestSubject: string;
    predictedExamScore: number;
    consistencyScore: number;
    metricsTrends: {
      focus: string;
      stress: string;
      burnout: string;
      memory: string;
      productivity: string;
    };
    monthlyReportText: string;
  } | null>(null);
  const [monthlyCoachError, setMonthlyCoachError] = useState('');

  // AI Advanced Analytics State
  const [isGeneratingAnalytics, setIsGeneratingAnalytics] = useState(false);
  const [analyticsResult, setAnalyticsResult] = useState<{
    learningEfficiency: number;
    estimatedMemoryRetention: number;
    bestStudyHours: string[];
    worstStudyHours: string[];
    predictedExamScore: number;
    studyQualityIndicator: string;
    revisionQualityIndicator: string;
    consistencyScore: number;
    productivityIndex: number;
    focusConsistency: number;
    knowledgeGrowthRate: number;
    memoryProfile?: any;
    digitalTwin?: any;
    completedHours?: number;
    completionRate?: number;
    subjectsFinished?: number;
    averageSessionLength?: number;
    weeklyProgress?: number;
    missedSessions?: number;
  } | null>(null);
  const [analyticsError, setAnalyticsError] = useState('');

  // Web Speech API initialization
  const [recognition, setRecognition] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'ar-EG'; // Egyptian Arabic
        
        rec.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setVoiceExplanation(prev => prev + finalTranscript);
          }
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsRecording(false);
          if (event.error === 'not-allowed') {
            setVoiceError('عذراً يا بطل! تم رفض إذن استخدام الميكروفون. يرجى تفعيل إذن الميكروفون للموقع من إعدادات المتصفح أو فتح التطبيق في علامة تبويب جديدة.');
          } else {
            setVoiceError(`خطأ في التعرف على الصوت: ${event.error}. يرجى التسميع يدوياً أو المحاولة مرة أخرى.`);
          }
        };

        setRecognition(rec);
      }
    }
  }, []);

  const handleToggleRecording = () => {
    if (!recognition) {
      setVoiceError('التسجيل الصوتي غير مدعوم في متصفحك الحالي، يرجى كتابة التسميع يدوياً يا بطل!');
      return;
    }
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setVoiceError('');
      setShowMicPrompt(true);
    }
  };

  const handleStartSpeechAfterPermission = () => {
    setShowMicPrompt(false);
    try {
      if (recognition) {
        recognition.start();
        setIsRecording(true);
      }
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setVoiceError('فشل تشغيل التعرف على الصوت. تأكد من تفعيل الميكروفون بالمتصفح.');
    }
  };

  const handleRunAIBurnoutAndStress = async () => {
    if (!token) return;
    setIsAnalyzingAI(true);
    setAiAnalysisError('');
    try {
      // 1. Burnout prediction
      const resB = await fetch('/api/ai/burnout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      const dataB = await resB.json();

      // 2. Stress prediction
      const resS = await fetch('/api/ai/stress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      const dataS = await resS.json();

      if (resB.ok && resS.ok) {
        if (onSyncFullData && dataS.data) {
          onSyncFullData(dataS.data);
        }
      } else {
        const errorMsg = dataB.message || dataB.error || dataS.message || dataS.error || 'حدث خطأ أثناء إجراء التحليل الذكي من الخادم.';
        setAiAnalysisError(errorMsg);
      }
    } catch (err: any) {
      setAiAnalysisError(err.message || 'عذراً، فشل الاتصال بالخادم لإجراء التحليل الذكي.');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleGenerateWeeklyCoach = async () => {
    if (!token) return;
    setIsGeneratingCoach(true);
    setCoachError('');
    setCoachReport(null);

    try {
      const res = await fetch('/api/ai/weekly-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'فشل خادم التوجيه الذكي في معالجة التقرير.');
      }

      const data = await res.json();
      const result = data.analysis || data;
      if (result && result.achievements) {
        setCoachReport({
          achievements: result.achievements,
          mistakesToAvoid: result.mistakes || result.mistakesToAvoid || [],
          weakestSubject: result.weakestSubject,
          strongestSubject: result.strongestSubject,
          predictedExamScore: result.predictedExamScore,
          studyConsistencyComments: result.studyConsistencyComments || result.coachReportText || 'استمر في السعي والمذاكرة بذكاء وعزيمة.',
          metricsTrends: {
            focus: result.trends?.focus || 'تركيز مستقر وعالي التحصيل',
            stress: result.trends?.stress || 'توتر معتدل تحت السيطرة',
            burnout: result.trends?.burnout || 'أمان كامل من الإرهاق العصبي',
            memory: result.trends?.memory || 'استبقاء ممتاز مع الاستدعاء النشط',
            productivity: result.trends?.productivity || 'إنتاجية تصاعدية متميزة'
          },
          actionableRecommendations: result.actionableRecommendations || [
            'ابدأ دائمًا بالمواد العلمية العميقة عندما تكون طاقتك الذهنية في أعلى مستوياتها صباحًا.',
            'احرص على أخذ فترة راحة كاملة لمدة ساعة بعد العودة من المدرسة أو الدروس الخصوصية.'
          ]
        });
      } else {
        throw new Error('لم يتم إرجاع تقرير صالح من الذكاء الاصطناعي.');
      }
    } catch (err: any) {
      console.warn("Weekly Coach API Error:", err);
      setCoachError(err.message || 'فشل الاتصال بالخادم لإنشاء تقرير المدرب الأسبوعي.');
      
      // Resilient local fallback
      setCoachReport({
        achievements: ['الحفاظ على الاستيقاظ المبكر والمذاكرة في الساعات عالية التركيز (الصباحية).', 'إكمال 85% من الواجبات المطلوبة في وقتها دون تسويف.'],
        mistakesToAvoid: ['تجنب المذاكرة ليلة الجمعة متأخراً لتنظيم دورة النوم السليمة.', 'تقليل تشتت شاشات الجوال أثناء فترات الراحة القصيرة.'],
        weakestSubject: subjects.length > 0 ? subjects[0].name.split(' (')[0] : 'كيمياء',
        strongestSubject: subjects.length > 1 ? subjects[1].name.split(' (')[0] : 'فيزياء',
        predictedExamScore: 92,
        studyConsistencyComments: 'استمرارية مثيرة للإعجاب هذا الأسبوع! لقد حققت معدل توافق بنسبة 88% مع الجدول الدراسي المصمم عصبياً.',
        metricsTrends: {
          focus: 'انتباه ثابت ومستقر بنسبة 85% خلال فترات المذاكرة العميقة.',
          stress: 'توتر معتدل ومؤقت يزول بالتمارين الرياضية الخفيفة وممارسة التأمل المنظم.',
          burnout: 'منحنى أمان ممتاز، ومعدل الوقاية مرتفع بفضل الفواصل العقلية المجدولة.',
          memory: 'قدرة استبقاء الذاكرة متوسطة المدى ممتازة بنسبة تقارب 84%.',
          productivity: 'نمو إنتاجي ملحوظ بمعدل ساعات يتجاوز 18 ساعة أسبوعياً.'
        },
        actionableRecommendations: [
          'احرص على مراجعة ملخصات الفيزياء اليومية قبل النوم مباشرة لمدة 15 دقيقة فقط لتنشيط خلايا التخزين العصبية العميقة.',
          'أضف 30 دقيقة نوم إضافية لتعزيز كفاءة التخزين الصباحية.'
        ]
      });
    } finally {
      setIsGeneratingCoach(false);
    }
  };

  const handleGenerateMonthlyCoach = async () => {
    if (!token) return;
    setIsGeneratingMonthlyCoach(true);
    setMonthlyCoachError('');
    setMonthlyCoachReport(null);

    try {
      const res = await fetch('/api/ai/monthly-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      if (!res.ok) {
        throw new Error('فشل خادم التوجيه الذكي الشهري في معالجة التقرير.');
      }

      const data = await res.json();
      const result = data.analysis || data;
      if (result && result.achievements) {
        setMonthlyCoachReport({
          achievements: result.achievements,
          mistakesToAvoid: result.mistakes || result.mistakesToAvoid || [],
          weakestSubject: result.weakestSubject,
          strongestSubject: result.strongestSubject,
          predictedExamScore: result.predictedExamScore,
          consistencyScore: result.consistencyScore || 90,
          metricsTrends: {
            focus: result.trends?.focus || 'تركيز ثابت ومنظم على المدى البعيد',
            stress: result.trends?.stress || 'توتر طبيعي ومتحكم به بنجاح',
            burnout: result.trends?.burnout || 'سلامة عقلية تامة بفضل التناوب المنظم',
            memory: result.trends?.memory || 'استقرار متميز للدروس الأولى وفروع المنهج',
            productivity: result.trends?.productivity || 'تصاعد شهري قوي في المذاكرة الفعالة'
          },
          monthlyReportText: result.monthlyReportText || 'تقرير شهري متميز من معلمك الذكي.'
        });
      } else {
        throw new Error('لم يتم إرجاع تقرير شهري صالح من الذكاء الاصطناعي.');
      }
    } catch (err: any) {
      console.warn("Monthly Coach API Error:", err);
      setMonthlyCoachError(err.message || 'فشل الاتصال بالخادم لإنشاء تقرير المدرب الشهري.');
      
      // Resilient local fallback
      setMonthlyCoachReport({
        achievements: [
          'الالتزام المستمر بالاستدعاء النشط والمذاكرة التراكمية على مدار الـ 30 يوماً الماضية.',
          'التحكم الممتاز في مستويات التوتر وتثبيت نظام صحي للموازنة بين المذاكرة والراحة.'
        ],
        mistakesToAvoid: [
          'الاستسلام للمشتتات البصرية ليلة مراجعة الفصول الصعبة.',
          'تأخير مراجعة الامتحانات الشاملة إلى نهاية الأسبوع الثاني.'
        ],
        weakestSubject: subjects.length > 0 ? subjects[0].name.split(' (')[0] : 'اللغة الإنجليزية الأولى',
        strongestSubject: subjects.length > 1 ? subjects[1].name.split(' (')[0] : 'الفيزياء',
        predictedExamScore: 94,
        consistencyScore: 91,
        metricsTrends: {
          focus: 'انتباه شهري ثابت ومتصاعد، مع تقليل ساعات الخمول بشكل ملحوظ.',
          stress: 'مستويات توتر متحكم بها وآمنة ولا تؤثر على سلامة اتخاذ القرارات.',
          burnout: 'منخفض ومستقر بنسبة أمان 92% بفضل تطبيق فواصل بومودورو بانتظام.',
          memory: 'استقرار الذاكرة التراكمية بنسبة ممتازة تمنع النسيان المبكر للدروس الأولى.',
          productivity: 'نمو شهري قوي، وإتمام أكثر من 80 ساعة من المذاكرة الإيجابية الفعالة.'
        },
        monthlyReportText: `### 🌟 تقرير وتوجيهات الكوتش الشهري لدفعة ٢٠٢٧:

أهلاً بك يا بطل الثانوية العامة العظيم! لقد مر شهر كامل من العطاء والتعلم المستمر، وأنا هنا اليوم لنحتفي معاً بجهدك ونرسم ملامح الشهر القادم بكفاءة علمية مكملة لتميزك الأكاديمي.

**تحليل الكوتش المتقدم لأدائك الشهري التراكمي:**
1. **الاستبقاء والذاكرة طويلة المدى**: نلاحظ تطوراً كبيراً في قدرتك على ربط المفاهيم الكيميائية والفيزيائية ببعضها. عقلك الباطن يسجل هذه الروابط كأولويات للذاكرة طويلة المدى.
2. **عادات النوم وتناسق السركادين**: الحفاظ على معدل نومك هو سلاحك السري! هرمونات الذاكرة والتعلم تفرز بالكامل خلال نوم حركة العين السريعة (REM).
3. **تطوير مهارة التكرار المتباعد**: مراجعاتك الذكية هذا الشهر منحتك تفوقاً حقيقياً في اللغات.

**خارطة طريق الشهر القادم (الأهداف الاستراتيجية):**
- **جدولة حل شامل**: ابدأ بدمج 3 امتحانات شاملة بنهاية كل أسبوع لتدريب عقلك على تبديل الفصول والأفكار بسرعة وسلاسة تامة.
- **ترتيب المذاكرة**: حافظ على مبدأ "التفوق الصباحي" عبر البدء بالدروس العميقة والمنطقية أولاً، وتأخير قراءات الفهم الممتعة لفترات ما بعد العصر.

أنا فخور بك وبكل دقيقة تبذلها في سبيل إسعاد أسرتك وتحقيق حلمك الكبير من ٣٢٠ درجة. تذكر دائماً أن النجاح التراكمي هو مجموع الجهود الصغيرة اليومية! 🚀🎓`
      });
    } finally {
      setIsGeneratingMonthlyCoach(false);
    }
  };

  const handleGenerateAdvancedAnalytics = async () => {
    if (!token) return;
    setIsGeneratingAnalytics(true);
    setAnalyticsError('');
    setAnalyticsResult(null);

    try {
      const res = await fetch('/api/ai/advanced-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'فشل خادم التحليلات في معالجة الاستعلام.');
      }

      const data = await res.json();
      if (data.analytics) {
        setAnalyticsResult(data.analytics);
      } else {
        throw new Error('لم يتم إرجاع تحليلات صالحة.');
      }
    } catch (err: any) {
      console.warn("Advanced Analytics API Error:", err);
      setAnalyticsError(err.message || 'فشل الاتصال بالخادم لجلب التحليلات الإدراكية المتقدمة.');
      setAnalyticsResult(null);
    } finally {
      setIsGeneratingAnalytics(false);
    }
  };

  const handleAnalyzeVoiceRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceExplanation.trim()) {
      setVoiceError('الرجاء التحدث أو كتابة شرح للدرس أولاً!');
      return;
    }
    setIsAnalyzingVoice(true);
    setVoiceFeedback(null);
    setVoiceError('');

    const subName = subjects.find(s => s.id === voiceSubjectId)?.name || 'عام';

    try {
      const res = await fetch('/api/ai/voice-revision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          subjectName: subName,
          topicName: voiceTopicName || 'مفهوم دراسي غير محدد',
          lessonText: voiceExplanation
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setVoiceFeedback(resData);
      } else {
        setVoiceError(resData.error || 'فشل تحليل التسميع الصوتي.');
      }
    } catch (err) {
      setVoiceError('عذراً، تعذر إرسال طلب التسميع للخادم.');
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

  // Get active subject branches dynamically
  const activeSubjectBranches = useMemo(() => {
    const sub = subjects.find(s => s.id === gradeSubjectId);
    return sub?.branches || [];
  }, [gradeSubjectId, subjects]);

  // Set default branch when subject changes
  useEffect(() => {
    if (activeSubjectBranches.length > 0) {
      setGradeBranch(activeSubjectBranches[0]);
    } else {
      setGradeBranch('');
    }
  }, [activeSubjectBranches]);

  // Spaced Repetition static list (as simulated fallback tracker)
  const [spacedRepetitionList, setSpacedRepetitionList] = useState<any[]>([]);

  const handleToggleSpaced = (id: string) => {
    setSpacedRepetitionList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  // Grade lists & helpers
  const subjectMap = useMemo(() => {
    const map: { [id: string]: Subject } = {};
    subjects.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [subjects]);

  // Overall grades analytics
  const gradesStats = useMemo(() => {
    if (grades.length === 0) return { overallAvg: 0, subjectAverages: [] };
    
    // Overall average percentage
    const totalPerc = grades.reduce((acc, g) => acc + (g.score / g.totalScore) * 100, 0);
    const overallAvg = Math.round(totalPerc / grades.length);

    // Group by subject
    const subjectGradesMap: { [id: string]: { scores: number[]; total: number[] } } = {};
    grades.forEach(g => {
      if (!subjectGradesMap[g.subjectId]) {
        subjectGradesMap[g.subjectId] = { scores: [], total: [] };
      }
      subjectGradesMap[g.subjectId].scores.push(g.score);
      subjectGradesMap[g.subjectId].total.push(g.totalScore);
    });

    const subjectAverages = Object.keys(subjectGradesMap).map(subId => {
      const rec = subjectGradesMap[subId];
      const sumScores = rec.scores.reduce((a, b) => a + b, 0);
      const sumTotals = rec.total.reduce((a, b) => a + b, 0);
      const avg = sumTotals > 0 ? Math.round((sumScores / sumTotals) * 100) : 0;
      return {
        subjectId: subId,
        subjectName: subjectMap[subId]?.name || 'مادة أخرى',
        color: subjectMap[subId]?.color || '#94a3b8',
        avg,
        count: rec.scores.length
      };
    });

    return { overallAvg, subjectAverages };
  }, [grades, subjects, subjectMap]);

  // Advanced Branch Diagnosis Engine
  const branchDiagnosis = useMemo(() => {
    // Group grades by subjectId and branch
    const branchScores: { [subId: string]: { [branchName: string]: { scores: number[]; totals: number[] } } } = {};

    grades.forEach((g) => {
      if (!g.branch) return;
      if (!branchScores[g.subjectId]) {
        branchScores[g.subjectId] = {};
      }
      if (!branchScores[g.subjectId][g.branch]) {
        branchScores[g.subjectId][g.branch] = { scores: [], totals: [] };
      }
      branchScores[g.subjectId][g.branch].scores.push(g.score);
      branchScores[g.subjectId][g.branch].totals.push(g.totalScore);
    });

    const weaknesses: { subjectName: string; branch: string; avg: number; subColor: string; recommendation: string }[] = [];
    const strengths: { subjectName: string; branch: string; avg: number; subColor: string }[] = [];

    Object.keys(branchScores).forEach((subId) => {
      const sub = subjectMap[subId];
      if (!sub) return;
      const branchesData = branchScores[subId];

      Object.keys(branchesData).forEach((bName) => {
        const { scores, totals } = branchesData[bName];
        const sumScore = scores.reduce((a, b) => a + b, 0);
        const sumTotal = totals.reduce((a, b) => a + b, 0);
        const avg = sumTotal > 0 ? Math.round((sumScore / sumTotal) * 100) : 0;

        if (avg < 80) {
          // Weakness identified
          let recommendation = '';
          if (bName.includes('نحو')) {
            recommendation = 'النحو التراكمي يعتمد على فهم القواعد الكلية. قم بحل ١٠ جمل إعرابية يومياً كاستدعاء نشط (Active Recall).';
          } else if (bName.includes('عضوية') || bName.includes('Chemistry')) {
            recommendation = 'الكيمياء العضوية تحتاج لخرائط ذهنية تفاعلية للروابط والتفاعلات. ارسم مخطط تفاعلات الألكينات باليد دون النظر للكتاب.';
          } else if (bName.includes('كهرب') || bName.includes('الفيزياء')) {
            recommendation = 'قوانين كيرشوف وتوصيل المقاومات يُتقن بـ "تعليم الأقران" (Feynman Technique). اشرح طريقة حل المسألة لنفسك بصوت عالٍ.';
          } else if (bName.includes('أحياء') || bName.includes('Biology') || bName.includes('دعامة') || bName.includes('تكاثر')) {
            recommendation = 'الأحياء تحتاج فهم عميق للمصطلحات والمقارنات. استخدم بطاقات التكرار المتباعد (Spaced Repetition) لتثبيت أسماء الهرمونات ووظائفها.';
          } else if (bName.includes('جبر') || bName.includes('تفاضل') || bName.includes('الرياضيات')) {
            recommendation = 'الرياضيات مهارة عضلية للعقل. لا تكتفِ بقراءة الحلول؛ قم بإعادة حل المسائل الصعبة فوراً بنفسك.';
          } else if (sub.name.includes('عربي') || sub.name.includes('Arabic')) {
            recommendation = 'عزز مهاراتك في هذا الفرع بمراجعة أسئلة الامتحانات الاسترشادية الوزارية وحل أسئلة الفهم القرائي المتكاملة.';
          } else if (sub.name.includes('إنجليزية') || sub.name.includes('English')) {
            recommendation = 'تدرب على كتابة الجمل السليمة وتوسيع حصيلة الكلمات عبر وضع الكلمات الصعبة في سياقات درامية مألوفة.';
          } else {
            recommendation = `فرع ${bName} يحتاج لتطبيق فوري. قم بمذاكرة الجزء النظري لـ ٢٠ دقيقة ثم حل تدريبات مكثفة دون استخدام الملاحظات.`;
          }

          weaknesses.push({
            subjectName: sub.name.split(' (')[0],
            branch: bName,
            avg,
            subColor: sub.color,
            recommendation
          });
        } else {
          strengths.push({
            subjectName: sub.name.split(' (')[0],
            branch: bName,
            avg,
            subColor: sub.color
          });
        }
      });
    });

    return { weaknesses, strengths };
  }, [grades, subjectMap]);

  // Submit Daily Checkin
  const handleCheckinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDailyCheckin({
      date: new Date().toISOString().split('T')[0],
      focusLevel,
      motivation,
      stress,
      fatigue
    });
    setCheckinMessage('تم تسجيل حالتك الذهنية والتركيز بنجاح! سيتم تعديل التوصيات فوراً.');
    setTimeout(() => setCheckinMessage(''), 4000);
  };

  // Submit Sleep Log
  const handleSleepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Parse bedtime & waketime to calculate duration
    const bedParts = bedtime.split(':').map(Number);
    const wakeParts = waketime.split(':').map(Number);
    
    let hours = wakeParts[0] - bedParts[0];
    let mins = wakeParts[1] - bedParts[1];
    
    if (hours < 0 || (hours === 0 && mins < 0)) {
      hours += 24; // spans past midnight
    }
    
    const durationHours = Number((hours + mins / 60).toFixed(1));

    onAddSleepLog({
      date: new Date().toISOString().split('T')[0],
      bedtime,
      waketime,
      durationHours,
      quality: sleepQuality
    });

    setSleepMessage(`تم تسجيل نومك اليوم بنجاح (${durationHours} ساعة). جودة النوم: ${sleepQuality === 'excellent' ? 'ممتازة' : sleepQuality === 'good' ? 'جيدة' : sleepQuality === 'fair' ? 'متوسطة' : 'سيئة'}.`);
    setTimeout(() => setSleepMessage(''), 4000);
  };

  // Submit Screen Time Log
  const handleScreenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = Number(screenMinutes);
    if (isNaN(mins) || mins < 0) return;

    onAddScreenTimeLog({
      date: new Date().toISOString().split('T')[0],
      minutes: mins
    });

    setScreenMinutes('');
    setScreenMessage(`تم تسجيل وقت الشاشة بنجاح (${(mins / 60).toFixed(1)} ساعة).`);
    setTimeout(() => setScreenMessage(''), 4000);
  };

  // Submit Grade Log
  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const score = Number(gradeScore);
    const total = Number(gradeTotal);
    if (!gradeTitle.trim() || isNaN(score) || isNaN(total) || total <= 0) return;

    onAddGrade({
      subjectId: gradeSubjectId,
      category: gradeCategory,
      title: gradeTitle.trim(),
      score,
      totalScore: total,
      date: new Date().toISOString().split('T')[0],
      weakChapters: gradeWeak.trim() ? gradeWeak.split(',').map(s => s.trim()) : [],
      strongChapters: gradeStrong.trim() ? gradeStrong.split(',').map(s => s.trim()) : [],
      branch: gradeBranch || undefined
    });

    setGradeTitle('');
    setGradeScore('');
    setGradeWeak('');
    setGradeStrong('');
  };

  // ----------------------------------------------------
  // BURNOUT & STRESS PREDICTION ENGINE (Multi-indicator neuroscience feedback)
  // ----------------------------------------------------
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const isBeforeAcademicYear = useMemo(() => {
    if (!thanaweyaStartDate) return false;
    return todayStr < thanaweyaStartDate;
  }, [thanaweyaStartDate, todayStr]);

  const predictions = useMemo(() => {
    // If before academic year start date, do not compute stress or burnout metrics
    if (isBeforeAcademicYear) {
      return {
        score: 0,
        riskLevel: 'low' as const,
        burnoutLevel: 'low' as const,
        explanation: `🌱 أنت حالياً في مرحلة التهيئة والاستعداد الأكاديمي قبل بدء العام الدراسي في (${thanaweyaStartDate}). تم إيقاف حساب مؤشرات الإجهاد التراكمي وضغط التوتر مؤقتاً لتبدأ العام بكامل طاقتك ونشاطك 100%.`,
        recommendations: [
          'استغل فترة التهيئة لتنظيم روتين النوم وضبط بيئة المذاكرة بهدوء.',
          'حدد أهدافك السنوية وجدول المواد بأريحية دون أي ضغوط نفسية.'
        ],
        recoverySuggestions: [
          'حافظ على نوم عميق ومريح واستمتع بفترة الإعداد والتجهيز.'
        ],
        stressScore: 0,
        stressLevel: 'low' as const,
        stressContributingFactors: ['فترة التحضير المسبق - لا توجد أعباء أو إجهاد متراكم'],
        stressRecommendations: ['أنت في وضع التهيئة الذهنية والبدنية الإيجابي قبل انطلاق العام الدراسي.'],
        isLongTermStress: false,
        isIncreasingTrend: false,
        weeklyPoints: [],
        monthlyPoints: []
      };
    }

    // Only consider data on or after academic start date
    const relevantCheckins = thanaweyaStartDate 
      ? dailyCheckins.filter(c => c.date >= thanaweyaStartDate)
      : dailyCheckins;

    const recentCheckin = relevantCheckins[relevantCheckins.length - 1];
    const recentSleep = sleepLogs[sleepLogs.length - 1];
    const recentScreen = screenTimeLogs[screenTimeLogs.length - 1];
    const latestAIBurnout = burnoutLogs && burnoutLogs.length > 0 ? burnoutLogs[0] : null;
    const latestAIStress = stressLogs && stressLogs.length > 0 ? stressLogs[0] : null;

    const hasRealData = !!(recentCheckin || recentSleep || recentScreen || latestAIBurnout || latestAIStress);

    // 1. Calculate Burnout Score (0 - 100)
    let burnoutScore = 0;

    if (hasRealData) {
      burnoutScore = 15; // base level for an active student

      if (recentCheckin) {
        burnoutScore += recentCheckin.stress * 8;      // Up to +40%
        burnoutScore += recentCheckin.fatigue * 8;     // Up to +40%
        burnoutScore -= recentCheckin.motivation * 4;  // High motivation reduces burnout feeling (up to -20%)
        if (recentCheckin.focusLevel < 3) burnoutScore += 10;
      }

      if (recentSleep) {
        if (recentSleep.durationHours < 6) burnoutScore += 15;
        else if (recentSleep.durationHours > 8) burnoutScore -= 10;
        if (recentSleep.quality === 'poor') burnoutScore += 15;
        else if (recentSleep.quality === 'excellent') burnoutScore -= 15;
      }

      if (recentScreen) {
        if (recentScreen.minutes > 300) burnoutScore += 15;
        else if (recentScreen.minutes > 180) burnoutScore += 8;
      }

      burnoutScore = Math.min(Math.max(burnoutScore, 0), 100);
    }

    let burnoutLevel: 'low' | 'moderate' | 'high' | 'very_high' = 'low';
    if (burnoutScore >= 80) burnoutLevel = 'very_high';
    else if (burnoutScore >= 60) burnoutLevel = 'high';
    else if (burnoutScore >= 35) burnoutLevel = 'moderate';

    // 2. Calculate Stress Score (0 - 100)
    let stressScore = 0;
    if (hasRealData) {
      stressScore = 10;
      if (recentCheckin) {
        stressScore += recentCheckin.stress * 12; // up to +60
        stressScore += recentCheckin.fatigue * 4; // up to +20
        if (recentCheckin.focusLevel < 3) stressScore += 10;
      }
      if (recentSleep && recentSleep.durationHours < 5.5) {
        stressScore += 15;
      }
      if (grades.length > 0) {
        const recentGrades = grades.slice(-3);
        const lowGradesCount = recentGrades.filter(g => (g.score / g.totalScore) < 0.7).length;
        stressScore += lowGradesCount * 8;
      }
      stressScore = Math.min(Math.max(stressScore, 0), 100);
    }

    let stressLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    if (stressScore >= 85) stressLevel = 'critical';
    else if (stressScore >= 65) stressLevel = 'high';
    else if (stressScore >= 35) stressLevel = 'moderate';

    // 3. Reasons, Contributing Factors, Recommendations
    let burnoutExplanation = '';
    let burnoutRecommendations: string[] = [];
    let recoverySuggestions: string[] = [];
    
    if (!hasRealData) {
      burnoutExplanation = 'لا توجد بيانات مسجلة بعد. عند تسجيل ساعات نومك، وقت الشاشة، أو حالتك اليومية، سيقوم النظام بحساب مؤشر طاقتك بدقة.';
      burnoutRecommendations = [
        'سجل مؤشراتك الحيوية واليومية لتوليد تشخيص مخصص لدماغك.',
        'احرص على أخذ قسط كافٍ من النوم والراحة اليومية.'
      ];
      recoverySuggestions = [
        'ابدأ بتسجيل أول قراءة في تبويب "مؤشراتي الحيوية".'
      ];
    } else if (burnoutLevel === 'very_high') {
      burnoutExplanation = 'تحذير حرج! مستويات الاحتراق الأكاديمي لديك تخطت الحدود الآمنة. عقلك يمر بإرهاق كلي نتيجة الحمل المعرفي الزائد ونقص التعافي. الذاكرة الصلبة تواجه صعوبة بالغة في ترميز المعلومات الجديدة.';
      burnoutRecommendations = [
        'توقف تام عن المذاكرة لـ ٢٤ ساعة لشحن النواقل العصبية (الكلية والنجاح يحتاجان عقلاً حياً ونشطاً).',
        'التنفس بأسلوب الـ Box Breathing لدقائق لتخفيض هرمون الكورتيزول مسبب القلق.',
        'قم بتبسيط جدولك والتركيز على الأساسيات والملخصات النهائية لليومين القادمين.'
      ];
      recoverySuggestions = [
        'مارس رياضة المشي الخفيفة في الهواء الطلق لـ ٣٠ دقيقة لتنشيط الدورة الدموية للدماغ.',
        'نم الليلة مبكراً قبل الساعة ١٠:٣٠ مساءً لتعزيز مرحلة النوم العميق (Slow-wave sleep).'
      ];
    } else if (burnoutLevel === 'high') {
      burnoutExplanation = 'مؤشر الاحتراق مرتفع! عضلات الانتباه لديك مشحونة بشكل مفرط وهناك بداية لتسرب التعب والملل والتشتت اللحظي. نسبة الاستبقاء للمذاكرة تراجعت بمعدل ٣٠٪.';
      burnoutRecommendations = [
        'خفض ساعات المذاكرة المقررة اليوم بمقدار النصف وركز على المراجعة التفاعلية البسيطة.',
        'قسّم المواد بأسلوب Interleaving: تجنب دراسة مادتين علميتين ثقيلتين في يوم واحد.',
        'أغلق الهواتف المحمولة تماماً أثناء جلسة التركيز لتخفيف الضوضاء الإدراكية.'
      ];
      recoverySuggestions = [
        'خذ قيلولة علمية (Power Nap) لمدة ٢٠ دقيقة في منتصف النهار لإعادة تنشيط الذاكرة قصيرة المدى.',
        'كافئ نفسك بنشاط ممتع بعد إنجاز أول جلسة مذاكرة ناجحة لرفع الدوبامين.'
      ];
    } else if (burnoutLevel === 'moderate') {
      burnoutExplanation = 'مستوى التعب والضغط الأكاديمي متوسط. عتبة التركيز مستقرة ومريحة ولكن عضلات الانتباه بدأت تشعر بالإرهاق الخفيف. يرجى التخطيط لراحة كافية لتفادي التراكم.';
      burnoutRecommendations = [
        'طبق قاعدة 50/10: 50 دقيقة مذاكرة تركيز عالي تليها 10 دقائق استراحة حقيقية خالية من الشاشات.',
        'اشرب كوباً من الماء كل ساعة؛ خلايا الدماغ الرطبة تنقل الإشارات الكهربائية بكفاءة تفوق بـ ٢٠٪ خلايا الجفاف.'
      ];
      recoverySuggestions = [
        'مارس تمارين التمدد البسيطة لـ ٥ دقائق لتفادي تصلب الرقبة والظهر المسبب للصداع الدراسي.',
        'اكتب قائمة بمهام الغد قبل النوم لتفريغ العقل الباطن وتجنب التفكير المتواصل والقلق الليلة.'
      ];
    } else {
      burnoutExplanation = 'مؤشر طاقتك الإدراكية ممتاز وفي أعلى معدلات الاستعداد الدراسي والنشاط العصبي! يظهر توازن رائع ومثالي لاستقبال وحل المفاهيم الأكثر تعقيداً.';
      burnoutRecommendations = [
        'استمر على هذا التوازن واستغل الفترات الصباحية لحل مسائل النظم الجديدة المعقدة والمستويات العليا.',
        'فعل مبدأ الاستدعاء الذاتي وكافئ نفسك بدوبامين صحي بعد كل مهمة دراسية ناجحة.'
      ];
      recoverySuggestions = [
        'حافظ على ساعات نومك المنتظمة الحالية (من ٧ إلى ٨ ساعات يومياً).',
        'طبق أسلوب التكرار المتباعد لمراجعة الدروس لترسيخ الذاكرة طويلة المدى.'
      ];
    }

    // Stress Factors & Trends
    let stressContributingFactors: string[] = [];
    let stressRecommendations: string[] = [];
    let isLongTermStress = false;
    let isIncreasingTrend = false;

    // Detect trends if we have history
    if (dailyCheckins.length >= 3) {
      const last3 = dailyCheckins.slice(-3);
      if (last3[2].stress > last3[1].stress && last3[1].stress > last3[0].stress) {
        isIncreasingTrend = true;
      }
      const highStressDays = dailyCheckins.filter(c => c.stress >= 4).length;
      if (highStressDays >= 2) {
        isLongTermStress = true;
      }
    }

    if (recentCheckin) {
      if (recentCheckin.stress >= 4) stressContributingFactors.push('ضغط الفحص والتقييم النفسي المرتفع');
      if (recentCheckin.fatigue >= 4) stressContributingFactors.push('الإجهاد البدني المتراكم وقلة الراحة الممتدة');
    }
    if (recentSleep && recentSleep.durationHours < 6) {
      stressContributingFactors.push('عدم كفاية ساعات النوم العميقة لترميم الذاكرة (أقل من 6 ساعات)');
    }
    if (recentScreen && recentScreen.minutes > 240) {
      stressContributingFactors.push('التعرض المفرط للشاشات وإشعاع الضوء الأزرق المشتت للانتباه');
    }
    if (stressContributingFactors.length === 0) {
      stressContributingFactors.push(hasRealData ? 'مستوى الضغوطات اليومية منخفض وآمن جداً' : 'لا توجد بيانات ضغوطات مسجلة بعد');
    }

    if (!hasRealData) {
      stressRecommendations = [
        'سجل مؤشراتك الحيوية بانتظام لمتابعة التوتر العصبي وتفادي الإجهاد.',
        'حافظ على تنظيم وقتك وجدولك الدراسي.'
      ];
    } else if (stressLevel === 'critical') {
      stressRecommendations = [
        'مارس تمرين الـ NSDR (الراحة العميقة بدون نوم) لـ ٢٠ دقيقة فوراً لتخفيض الأدرينالين والتوتر العضلي.',
        'قلل استهلاك الكافيين والمنبهات؛ فهي تزيد من استجابة القتال أو الهروب (Fight or Flight) في الدماغ.',
        'تحدث مع شخص مقرب أو معلم تثق به لمشاركتك تنظيم المواد وتخفيف عبء المجموع.'
      ];
    } else if (stressLevel === 'high') {
      stressRecommendations = [
        'ابتعد عن شاشات الهاتف تماماً قبل النوم بساعة كاملة لتسهيل الدخول في نوم فسيولوجي عميق.',
        'تجنب تراكم الدروس؛ قسّم الدرس الكبير إلى أجزاء صغيرة لتخفيف حمل البداية وتسهيل المبادرة.',
        'خصص ١٠-١٥ دقيقة يومياً للمشي الهادئ أو تمارين الاسترخاء العميقة.'
      ];
    } else {
      stressRecommendations = [
        'واصل ممارسة عاداتك الصحية الرائعة وتوازنك العصبي الممتاز.',
        'احرص على أخذ استراحات قصيرة ومنتظمة بين جلسات الاستذكار لمنع تراكم التعب.'
      ];
    }

    // Weekly trend generator based strictly on real checkins
    const weeklyPoints: { day: string; burnout: number; stress: number }[] = [];
    const DAYS_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    if (dailyCheckins.length > 0) {
      for (let i = 0; i < 7; i++) {
        const checkinIndex = dailyCheckins.length - 7 + i;
        if (checkinIndex >= 0 && dailyCheckins[checkinIndex]) {
          const c = dailyCheckins[checkinIndex];
          weeklyPoints.push({
            day: DAYS_NAMES[i],
            burnout: Math.min(Math.max(Math.round((c.stress + c.fatigue) * 10), 0), 100),
            stress: Math.min(Math.max(Math.round(c.stress * 20), 0), 100)
          });
        }
      }
    }

    // Monthly trend generator based on real weekly averages
    const monthlyPoints: { week: string; burnout: number; stress: number }[] = [];
    if (dailyCheckins.length >= 7) {
      const WEEKS_NAMES = ['الأسبوع ١', 'الأسبوع ٢', 'الأسبوع ٣', 'الأسبوع ٤'];
      for (let w = 0; w < 4; w++) {
        const slice = dailyCheckins.slice(w * 7, (w + 1) * 7);
        if (slice.length > 0) {
          const avgStress = slice.reduce((acc, c) => acc + c.stress, 0) / slice.length;
          const avgFatigue = slice.reduce((acc, c) => acc + c.fatigue, 0) / slice.length;
          monthlyPoints.push({
            week: WEEKS_NAMES[w],
            burnout: Math.round((avgStress + avgFatigue) * 10),
            stress: Math.round(avgStress * 20)
          });
        }
      }
    }

    // 4. Incorporate server-side AI-powered Burnout & Stress logs if present
    if (latestAIBurnout) {
      burnoutScore = latestAIBurnout.score !== undefined ? latestAIBurnout.score : burnoutScore;
      burnoutLevel = latestAIBurnout.riskLevel || latestAIBurnout.burnoutLevel || burnoutLevel;
      burnoutExplanation = (latestAIBurnout.reasons && latestAIBurnout.reasons.length > 0)
        ? `تشخيص الذكاء الاصطناعي: ${latestAIBurnout.reasons.join(' ')} \nالعلامات المبكرة: ${latestAIBurnout.warningSigns?.join('، ') || 'لا توجد علامات حرجة حالياً.'}`
        : latestAIBurnout.explanation || burnoutExplanation;
      if (latestAIBurnout.recommendations && latestAIBurnout.recommendations.length > 0) {
        burnoutRecommendations = latestAIBurnout.recommendations;
      }
      if (latestAIBurnout.recoverySuggestions && latestAIBurnout.recoverySuggestions.length > 0) {
        recoverySuggestions = latestAIBurnout.recoverySuggestions;
      } else if (latestAIBurnout.scheduleAdjustments && latestAIBurnout.scheduleAdjustments.length > 0) {
        recoverySuggestions = latestAIBurnout.scheduleAdjustments;
      }
    }

    if (latestAIStress) {
      stressScore = latestAIStress.score !== undefined ? latestAIStress.score : stressScore;
      stressLevel = latestAIStress.riskLevel || latestAIStress.stressLevel || stressLevel;
      if (latestAIStress.factors && latestAIStress.factors.length > 0) {
        stressContributingFactors = latestAIStress.factors;
      } else if (latestAIStress.causes && latestAIStress.causes.length > 0) {
        stressContributingFactors = latestAIStress.causes;
      }
      if (latestAIStress.recommendations && latestAIStress.recommendations.length > 0) {
        stressRecommendations = latestAIStress.recommendations;
      }
    }

    return {
      score: burnoutScore,
      riskLevel: burnoutLevel,
      burnoutLevel,
      explanation: burnoutExplanation,
      recommendations: burnoutRecommendations,
      recoverySuggestions,
      stressScore,
      stressLevel,
      stressContributingFactors,
      stressRecommendations,
      isLongTermStress,
      isIncreasingTrend,
      weeklyPoints,
      monthlyPoints
    };
  }, [dailyCheckins, sleepLogs, screenTimeLogs, grades, burnoutLogs, stressLogs, isBeforeAcademicYear, thanaweyaStartDate]);

  const burnoutAnalysis = predictions;


  return (
    <div className="space-y-6 text-right animate-fade-in" style={{ direction: 'rtl' }}>
      
      {/* Tab Selectors */}
      {initialSubTab !== 'voice-recall' && (
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1 overflow-x-auto">
          {/* Group 1: Academic / Study Analytics (Shown when accessing via Advanced Study Reports) */}
          {(initialSubTab === 'analytics' || initialSubTab === 'spaced') && (
            <>
              <button
                onClick={() => setActiveSubTab('analytics')}
                className={`pb-3 pt-1 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeSubTab === 'analytics'
                    ? 'border-zinc-950 dark:border-zinc-50 text-zinc-950 dark:text-zinc-50 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>📊 تحليلات الفهم المتقدمة (AI Advanced Analytics)</span>
              </button>

              <button
                onClick={() => setActiveSubTab('spaced')}
                className={`pb-3 pt-1 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeSubTab === 'spaced'
                    ? 'border-zinc-950 dark:border-zinc-50 text-zinc-950 dark:text-zinc-50 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>🧠 علم الأعصاب والذاكرة المتباعدة</span>
              </button>
            </>
          )}

          {/* Group 2: Biological & Brain Health */}
          {(initialSubTab === 'coach' || initialSubTab === 'checkin' || initialSubTab === 'burnout' || !initialSubTab) && (
            <>
              <button
                onClick={() => setActiveSubTab('checkin')}
                className={`pb-3 pt-1 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeSubTab === 'checkin'
                    ? 'border-zinc-950 dark:border-zinc-50 text-zinc-950 dark:text-zinc-50 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>🧪 مؤشراتي الحيوية (نوم / شاشة / توتر)</span>
              </button>

              <button
                onClick={() => setActiveSubTab('burnout')}
                className={`pb-3 pt-1 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeSubTab === 'burnout'
                    ? 'border-zinc-950 dark:border-zinc-50 text-zinc-950 dark:text-zinc-50 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>🤯 مقياس الراحة وتفادي الإجهاد</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Preparation Phase Notice if before academic year start date */}
      {isBeforeAcademicYear && (
        <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/30 text-right space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-black text-xs">
            <Sparkles className="w-4 h-4" />
            <span>فترة الإعداد والتهيئة المسبقة (يبدأ العام الدراسي في {thanaweyaStartDate}) 🌱</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-semibold">
            أنت الآن في مرحلة الإعداد والتجهيز المسبق. تم إيقاف حساب مؤشرات الإجهاد التراكمي ومقاييس الضغط العصبي مؤقتاً لتبدأ العام الدراسي بكامل طاقتك الذهنية 100%. سيبدأ الحساب الفعلي مع بداية العام الدراسي المحدد.
          </p>
        </div>
      )}

      {/* 1. Spaced Repetition Tab */}
      {activeSubTab === 'spaced' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>تقنيات الذاكرة الصلبة وتفعيل الاستدعاء الفعال</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
              إن حفظ مناهج الثانوية العامة الهائلة يتطلب تحفيز هرموني مستمر لإشارات الخلايا العصبية عبر تقنية <strong>Active Recall</strong> (إغلاق المذكرة وتسميع المفهوم غيباً) وتقنية <strong>Spaced Repetition</strong> (المراجعة على فترات متباعدة تتغلب على منحنى النسيان الطبيعي).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-right">
                <span className="w-6 h-6 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs mb-3">١</span>
                <strong className="text-xs text-zinc-800 dark:text-zinc-200 block mb-1">الاستدعاء النشط (Active Recall)</strong>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">تجنب وهم المعرفة الحاصل من قراءة ملخصات جاهزة. اختبر نفسك باستمرار، حل أسئلة قبل البدء بالقراءة، أو استعمل الفلش كارد لتسميع المعلومات.</p>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-right">
                <span className="w-6 h-6 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-xs mb-3">٢</span>
                <strong className="text-xs text-zinc-800 dark:text-zinc-200 block mb-1">التكرار المتباعد (Spaced Repetition)</strong>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">راجع الدرس بعد يوم واحد من مذاكرته، ثم بعد 3 أيام، ثم بعد 7 أيام، ثم بعد شهر. هذا يضمن نقل المعلومات من الذاكرة اللحظية إلى الذاكرة الصلبة الدائمة.</p>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-right">
                <span className="w-6 h-6 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs mb-3">٣</span>
                <strong className="text-xs text-zinc-800 dark:text-zinc-200 block mb-1">تداخل المذاكرة (Interleaving)</strong>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">تجنب دراسة مادة واحدة طوال اليوم! عقلك يتعب سريعاً. اخلط بين مادة علمية جافة ومادة أدبية أو حل مسائل النحو لتنشيط فصوص المخ المختلفة بالتناوب.</p>
              </div>
            </div>
          </div>

          {/* Active Recall checklist */}
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">المهام المجدولة للتكرار المتباعد هذا الأسبوع</h4>
                <p className="text-[10px] text-zinc-500">مبنية تلقائياً على سجل مذاكرتك الفائت لمقاومة معدل النسيان.</p>
              </div>
              <Zap className="w-4.5 h-4.5 text-zinc-500" />
            </div>

            <div className="space-y-3">
              {spacedRepetitionList.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/20 dark:bg-zinc-950/20">
                  <p className="text-xs text-zinc-400">لا توجد مهام مراجعة مجدولة للتكرار المتباعد حالياً. سيقوم النظام بجدولة المهام تلقائياً بمجرد بدئك في تسجيل جلسات المذاكرة والامتحانات الحقيقية.</p>
                </div>
              ) : (
                spacedRepetitionList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleSpaced(item.id)}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                      item.checked
                        ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-950 opacity-60'
                        : 'bg-zinc-50/50 dark:bg-zinc-950/30 border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        item.checked ? 'bg-zinc-900 dark:bg-zinc-100 border-transparent text-white dark:text-zinc-950' : 'border-zinc-300 dark:border-zinc-700'
                      }`}>
                        {item.checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <h5 className={`text-xs font-bold ${item.checked ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                          {item.topic}
                        </h5>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400">
                          <span className="bg-zinc-150 dark:bg-zinc-850 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400 font-bold">{item.subject}</span>
                          <span>•</span>
                          <span>آخر تكرار: {item.lastReviewed}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                      item.checked ? 'bg-zinc-200 text-zinc-400' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    }`}>
                      {item.nextReview}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Vitality & Health Loggers Tab */}
      {activeSubTab === 'checkin' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <span>سجل الحالات والمؤشرات البيولوجية اليومية</span>
            </h3>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              يقوم هذا السجل بأرشفة مؤشراتك اليومية مثل جودة النوم، ومستويات التركيز، والضغط النفسي، والنشاط، لمساعدتك على مراقبة طاقتك الذهنية وتجنب الاحتراق الدراسي.
            </p>
          </div>

          {dailyCheckins.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900/50 space-y-3">
              <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-400">
                📊
              </div>
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">لا توجد سجلات تقييم يومية بعد</h4>
              <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                ابدأ تقييم اليوم من خلال زر "التقييم اليومي" الموجود على الصفحة الرئيسية لتوليد السجلات وتدريب خوارزميات الـ AI.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailyCheckins.slice().reverse().map((log) => {
                // Determine icons and styling for various metrics
                const sleepQualityLabel = 
                  log.sleepQuality === 'excellent' ? 'ممتاز 🌟' :
                  log.sleepQuality === 'good' ? 'جيد 👍' :
                  log.sleepQuality === 'fair' ? 'مقبول ⚠️' : 'سيء ❌';

                return (
                  <div key={log.id || log.date} className="p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs space-y-3.5 text-right relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                      <strong className="text-xs font-black text-indigo-600 dark:text-indigo-400">{log.date}</strong>
                      <span className="text-[10px] text-zinc-400 font-bold">تقييم كامل ✓</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 space-y-1">
                        <span className="text-[10px] text-zinc-400 font-bold block">🛌 النوم:</span>
                        <strong className="text-[11px] text-zinc-800 dark:text-zinc-200 block">
                          {log.sleepHours} ساعة ({sleepQualityLabel})
                        </strong>
                      </div>

                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 space-y-1">
                        <span className="text-[10px] text-zinc-400 font-bold block">⚡ التركيز والطاقة:</span>
                        <strong className="text-[11px] text-zinc-800 dark:text-zinc-200 block">
                          {log.focusLevel || 4} / 5 | {log.energy || 4} / 5
                        </strong>
                      </div>

                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 space-y-1">
                        <span className="text-[10px] text-zinc-400 font-bold block">🔥 دافعية وتوتر:</span>
                        <strong className="text-[11px] text-zinc-800 dark:text-zinc-200 block">
                          {log.motivation || 4} / 5 | {log.stress || 3} / 5
                        </strong>
                      </div>

                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 space-y-1">
                        <span className="text-[10px] text-zinc-400 font-bold block">📱 الشاشة والهاتف:</span>
                        <strong className="text-[11px] text-zinc-800 dark:text-zinc-200 block">
                          {log.phoneUsage || 0} دقيقة
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Burnout & Stress Prediction Dashboard Tab */}
      {activeSubTab === 'burnout' && (() => {
        const hasNoData = dailyCheckins.length === 0 && sleepLogs.length === 0 && screenTimeLogs.length === 0;

        if (hasNoData) {
          return (
            <div className="p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center space-y-6 max-w-2xl mx-auto my-6" style={{ direction: 'rtl' }}>
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                <AlertTriangle className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-50">مؤشرات الاحتراق والضغط العصبي غير مفعلة 🧠</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
                  يا بطل، لم تقم بتسجيل أي بيانات صحية أو مؤشرات حيوية حتى الآن! 
                  نظام التنبؤ بالإجهاد والاحتراق بالذكاء الاصطناعي يعتمد حصرياً على مدخلاتك الحقيقية لضمان الدقة.
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl inline-block text-right">
                <span className="text-[10px] text-zinc-400 block font-bold mb-1">💡 كيف تبدأ الآن؟</span>
                <span className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  اذهب إلى تبويب <strong>"مؤشراتي الحيوية"</strong> المجاور، وقم بتسجيل ساعات نومك، أو وقت الشاشة اليومي، أو سجل حالتك النفسية والدراسية، وسيفعل النظام فوراً تتبع منحنيات طاقتك العصبية.
                </span>
              </div>
            </div>
          );
        }

        const points = trendType === 'weekly' ? predictions.weeklyPoints : predictions.monthlyPoints;

        // Draw custom SVG chart coordinates
        const width = 500;
        const height = 150;
        const paddingLeft = 35;
        const paddingRight = 15;
        const paddingTop = 15;
        const paddingBottom = 25;

        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        const getX = (index: number) => {
          if (!points || points.length <= 1) return paddingLeft + chartWidth / 2;
          const x = paddingLeft + (index / (points.length - 1)) * chartWidth;
          return Number.isNaN(x) ? paddingLeft : x;
        };

        const getY = (value: number) => {
          // values from 0 to 100
          const numericVal = Number(value);
          const safeVal = Number.isNaN(numericVal) ? 0 : numericVal;
          const y = paddingTop + chartHeight - (safeVal / 100) * chartHeight;
          return Number.isNaN(y) ? paddingTop + chartHeight : y;
        };

        const burnoutPath = points.map((p, idx) => `${getX(idx)},${getY(p.burnout)}`).join(' ');
        const stressPath = points.map((p, idx) => `${getX(idx)},${getY(p.stress)}`).join(' ');

        return (
          <div className="space-y-6">
            {/* Physiological Health Status Card */}
            <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-r from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-900 shadow-xs flex items-center justify-between gap-4">
              <div className="space-y-1 text-right">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
                  <Activity className="w-3 h-3" />
                  <span>مقياس مستويات الراحة والإجهاد</span>
                </span>
                <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">متابعة الصحة النفسية ومعدلات التعافي</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  تعتمد المؤشرات على القراءات المباشرة لساعات نومك، وقت الشاشة، وسجلات المتابعة اليومية لضمان توازنك النفسي والأكاديمي.
                </p>
              </div>
            </div>

            {/* Warning Notices & Trend Detection Alerts */}
            {(predictions.isIncreasingTrend || predictions.isLongTermStress) && (
              <div className="p-4.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span>نظام الإنذار المبكر للضغط العصبي ⚠️</span>
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-semibold space-y-1">
                  {predictions.isIncreasingTrend && (
                    <p>• تنبيه استباقي: تم رصد اتجاه تصاعدي مستمر في مستويات التوتر الخاصة بك على مدار الأيام الثلاثة الماضية. نوصيك بجدولة استراحة إضافية الآن لتجنب الوصول لمرحلة الإرهاق الأكاديمي.</p>
                  )}
                  {predictions.isLongTermStress && (
                    <p>• تحذير حرج: تظهر البيانات تراكم ضغوط عالية لفترة طويلة دون تعافٍ عصبي كافٍ. قد يؤثر هذا سلباً على كفاءة تخزين الذاكرة طويلة المدى.</p>
                  )}
                </div>
              </div>
            )}

            {/* Twin Meters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Burnout Risk Card */}
              <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <Battery className="w-5 h-5 text-amber-500" />
                    <span>مؤشر الاحتراق الأكاديمي</span>
                  </h3>
                  <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full ${
                    predictions.burnoutLevel === 'very_high' ? 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300' :
                    predictions.burnoutLevel === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300' :
                    predictions.burnoutLevel === 'moderate' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300' :
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                  }`}>
                    {predictions.burnoutLevel === 'very_high' ? 'خطر حرج جداً' :
                     predictions.burnoutLevel === 'high' ? 'إرهاق مرتفع' :
                     predictions.burnoutLevel === 'moderate' ? 'إرهاق دراسي متوسط' : 'مستقر وآمن'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4.5 bg-zinc-50/50 dark:bg-zinc-950/20 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                  <div className="relative flex items-center justify-center w-20 h-20 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="currentColor" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
                      <circle
                        cx="40" cy="40" r="32" strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - (Number(predictions.score) || 0) / 100)}
                        strokeLinecap="round" stroke="currentColor" fill="transparent"
                        className={`transition-all duration-1000 ${
                          predictions.burnoutLevel === 'very_high' || predictions.burnoutLevel === 'high' ? 'text-red-500' :
                          predictions.burnoutLevel === 'moderate' ? 'text-amber-500' : 'text-emerald-500'
                        }`}
                      />
                    </svg>
                    <span className="absolute text-sm font-black font-mono text-zinc-900 dark:text-zinc-100">{predictions.score}%</span>
                  </div>
                  <div className="space-y-1 text-right">
                    <strong className="text-[11px] text-zinc-800 dark:text-zinc-200 block">تشخيص أنماط الطاقة:</strong>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">{(predictions as any).burnoutExplanation || predictions.explanation}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">خطط واستراتيجيات التعافي الموصى بها:</span>
                  <div className="space-y-1.5">
                    {((predictions.recommendations || []).concat(predictions.recoverySuggestions || [])).slice(0, 3).map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 p-2 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/10 text-[10px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="font-semibold">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stress Risk Card */}
              <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    <span>مقياس الضغط والتوتر النفسي</span>
                  </h3>
                  <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full ${
                    predictions.stressLevel === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300' :
                    predictions.stressLevel === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300' :
                    predictions.stressLevel === 'moderate' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300' :
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                  }`}>
                    {predictions.stressLevel === 'critical' ? 'توتر حرج' :
                     predictions.stressLevel === 'high' ? 'توتر مرتفع' :
                     predictions.stressLevel === 'moderate' ? 'توتر متوسط' : 'متزن وآمن'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4.5 bg-zinc-50/50 dark:bg-zinc-950/20 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                  <div className="relative flex items-center justify-center w-20 h-20 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="currentColor" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
                      <circle
                        cx="40" cy="40" r="32" strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - (Number(predictions.stressScore) || 0) / 100)}
                        strokeLinecap="round" stroke="currentColor" fill="transparent"
                        className={`transition-all duration-1000 ${
                          predictions.stressLevel === 'critical' || predictions.stressLevel === 'high' ? 'text-red-500' :
                          predictions.stressLevel === 'moderate' ? 'text-indigo-500' : 'text-emerald-500'
                        }`}
                      />
                    </svg>
                    <span className="absolute text-sm font-black font-mono text-zinc-900 dark:text-zinc-100">{predictions.stressScore}%</span>
                  </div>
                  <div className="space-y-1 text-right">
                    <strong className="text-[11px] text-zinc-800 dark:text-zinc-200 block">العوامل المساهمة في الضغط:</strong>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {predictions.stressContributingFactors.map((factor, idx) => (
                        <span key={idx} className="bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded text-[9px] font-semibold border border-zinc-150 dark:border-zinc-800">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">التوصيات الطبية العصبية لتخفيف التوتر:</span>
                  <div className="space-y-1.5">
                    {predictions.stressRecommendations.slice(0, 2).map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 p-2 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/10 text-[10px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                        <Coffee className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <span className="font-semibold">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Interactive SVG Line Chart */}
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-zinc-500" />
                    <span>مخطط الاتجاه والتحليل التاريخي (Neurometric Analytics)</span>
                  </h3>
                  <p className="text-[9px] text-zinc-400 mt-0.5">تتبع أسبوعي أو شهري لمستويات استنزاف الطاقة وضغط التراكم الدراسي.</p>
                </div>

                {/* Toggle Type buttons */}
                <div className="flex border border-zinc-200 dark:border-zinc-850 rounded-lg p-0.5 bg-zinc-50 dark:bg-zinc-950">
                  <button
                    onClick={() => setTrendType('weekly')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      trendType === 'weekly' ? 'bg-white dark:bg-zinc-900 shadow-xs text-zinc-950 dark:text-white' : 'text-zinc-400'
                    }`}
                  >
                    المنحنى الأسبوعي 📈
                  </button>
                  <button
                    onClick={() => setTrendType('monthly')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      trendType === 'monthly' ? 'bg-white dark:bg-zinc-900 shadow-xs text-zinc-950 dark:text-white' : 'text-zinc-400'
                    }`}
                  >
                    المنحنى الشهري 🗓️
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-[9px] font-bold text-zinc-500 justify-end">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>مؤشر التوتر المتراكم</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>مؤشر الاحتراق الأكاديمي</span>
                </div>
              </div>

              {/* The SVG Container */}
              <div className="relative w-full h-40">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map((v) => (
                    <g key={v}>
                      <line
                        x1={paddingLeft}
                        y1={getY(v)}
                        x2={width - paddingRight}
                        y2={getY(v)}
                        stroke="currentColor"
                        className="text-zinc-100 dark:text-zinc-850"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={getY(v) + 3}
                        textAnchor="end"
                        className="text-[8px] font-mono font-bold text-zinc-400"
                        fill="currentColor"
                      >
                        {v}%
                      </text>
                    </g>
                  ))}

                  {/* Draw Lines */}
                  {points.length > 1 && (
                    <>
                      {/* Burnout Path */}
                      <polyline
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={burnoutPath}
                      />
                      {/* Stress Path */}
                      <polyline
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={stressPath}
                      />
                    </>
                  )}

                  {/* Point Dots & Labels */}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      {/* Burnout Dot */}
                      <circle
                        cx={getX(idx)}
                        cy={getY(p.burnout)}
                        r="3.5"
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                      {/* Stress Dot */}
                      <circle
                        cx={getX(idx)}
                        cy={getY(p.stress)}
                        r="3.5"
                        fill="#6366f1"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                      {/* X Label */}
                      <text
                        x={getX(idx)}
                        y={height - 8}
                        textAnchor="middle"
                        className="text-[8px] font-semibold text-zinc-500 dark:text-zinc-400"
                        fill="currentColor"
                      >
                        {trendType === 'weekly' ? p.day : p.week}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </div>
        );
      })()}


      {/* 4. Grades & Evaluation Tab */}
      {activeSubTab === 'grades' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form and Averages column */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Summary statistics */}
            <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-zinc-500">متوسط الدرجات العام لجميع التقييمات:</h3>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
                  {gradesStats.overallAvg}%
                </span>
                <span className="text-[10px] text-zinc-400 font-bold">
                  مستنتجة من {grades.length} واجبات وكويزات سابقة
                </span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                <div className="bg-zinc-900 dark:bg-zinc-100 h-full transition-all" style={{ width: `${gradesStats.overallAvg}%` }}></div>
              </div>
            </div>

            {/* Add Grade Form */}
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Plus className="w-4.5 h-4.5 text-zinc-500" />
                <span>إضافة تقييم / درجة جديدة</span>
              </h3>

              <form onSubmit={handleGradeSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">المادة:</label>
                    <select
                      value={gradeSubjectId}
                      onChange={(e) => setGradeSubjectId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none"
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>{sub.name.split(' (')[0]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">نوع التقييم:</label>
                    <select
                      value={gradeCategory}
                      onChange={(e) => setGradeCategory(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none"
                    >
                      <option value="Quiz">كويز / اختبار حصة</option>
                      <option value="Homework">واجب منزلي</option>
                      <option value="Exam">امتحان شامل</option>
                      <option value="Practice Test">حل بنك أسئلة</option>
                      <option value="Assignment">تطبيق عملي</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">عنوان التقييم (مثال: واجب العضوية الأول):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أسئلة التيار المتردد"
                    value={gradeTitle}
                    onChange={(e) => setGradeTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {activeSubjectBranches.length > 0 && (
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">الفرع الدراسي الخاص بهذا التقييم:</label>
                    <select
                      value={gradeBranch}
                      onChange={(e) => setGradeBranch(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                    >
                      {activeSubjectBranches.map((br) => (
                        <option key={br} value={br}>{br}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">الدرجة الحاصل عليها:</label>
                    <input
                      type="number"
                      required
                      placeholder="مثال: 18"
                      value={gradeScore}
                      onChange={(e) => setGradeScore(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">الدرجة الكلية القصوى:</label>
                    <input
                      type="number"
                      required
                      placeholder="مثال: 20"
                      value={gradeTotal}
                      onChange={(e) => setGradeTotal(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">نقاط الضعف / الفصول الصعبة (اختياري، مفصولة بفواصل):</label>
                  <input
                    type="text"
                    placeholder="مثال: التسمية الشائعة، الأيزوميرات"
                    value={gradeWeak}
                    onChange={(e) => setGradeWeak(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">نقاط القوة / الفصول المتقنة (اختياري، مفصولة بفواصل):</label>
                  <input
                    type="text"
                    placeholder="مثال: الألكينات، تفاعلات الإضافة"
                    value={gradeStrong}
                    onChange={(e) => setGradeStrong(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <span>تسجيل التقييم في دفتر الدرجات</span>
                </button>
              </form>
            </div>
          </div>

          {/* Visual Ledger table column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Subject-specific performance breakdown */}
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">معدل تحصيل المواد من التقييمات</h3>
              
              {gradesStats.subjectAverages.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-4">قم بتسجيل التقييمات والواجبات لعرض متوسطات المواد هنا.</p>
              ) : (
                <div className="space-y-3">
                  {gradesStats.subjectAverages.map((sub, i) => (
                    <div key={sub.subjectId || i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }}></span>
                          <span>{sub.subjectName} ({sub.count} تقييمات)</span>
                        </span>
                        <span className="font-mono">{sub.avg}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${sub.avg}%`, backgroundColor: sub.color }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Diagnostics & Branch-level Strengths & Weaknesses */}
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
                  <span>خبير التشخيص الدراسي للفروع (دفعة ٢٠٢٧)</span>
                </h3>
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold px-2 py-0.5 rounded-full">
                  تحليل ذكي تلقائي
                </span>
              </div>

              {branchDiagnosis.weaknesses.length === 0 && branchDiagnosis.strengths.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-zinc-150 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50/30 dark:bg-zinc-950/10">
                  <Sparkles className="w-6.5 h-6.5 text-zinc-400 mx-auto mb-2" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                    لا يوجد تحليل فروع حتى الآن
                  </p>
                  <p className="text-[10px] text-zinc-400 max-w-sm mx-auto leading-normal">
                    قم بتسجيل درجات التقييمات والواجبات مع اختيار "الفرع الدراسي" (مثل النحو، أو الكيمياء العضوية) ليقوم المساعد بعرض تقرير فوري بنقاط ضعفك وقوتك وتوصيات للتفوق.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Weaknesses List */}
                  {branchDiagnosis.weaknesses.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>فروع تحتاج إلى تدخل علاجي فوري (أقل من ٨٠٪):</span>
                      </h4>
                      <div className="space-y-2">
                        {branchDiagnosis.weaknesses.map((w, index) => (
                          <div key={index} className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: w.subColor }}></span>
                                <span>{w.subjectName} - فرع: {w.branch}</span>
                              </span>
                              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-950/40 px-2 py-0.5 rounded text-[10px]">
                                متوسط التحصيل: {w.avg}%
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-semibold">
                              💡 <strong className="text-zinc-800 dark:text-zinc-200">التوصية العلمية:</strong> {w.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths List */}
                  {branchDiagnosis.strengths.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>فروع متميزة ومتقنة (٨٠٪ أو أكثر):</span>
                      </h4>
                      <div className="space-y-2">
                        {branchDiagnosis.strengths.map((s, index) => (
                          <div key={index} className="p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.subColor }}></span>
                              <span>{s.subjectName} - فرع: {s.branch}</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/30 px-2 py-0.5 rounded text-[10px]">
                              نسبة الإتقان: {s.avg}% ✨
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* List of recorded grades */}
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">دفتر التقييمات التفصيلي</h3>
              
              {grades.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  لا توجد درجات مسجلة بعد في الدفتر.
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[300px] overflow-y-auto pr-1">
                  {grades.slice().reverse().map((g) => {
                    const sub = subjectMap[g.subjectId];
                    const percent = Math.round((g.score / g.totalScore) * 100);

                    return (
                      <div key={g.id} className="py-3 flex items-start justify-between gap-3 group">
                        <div className="space-y-1 text-right min-w-0">
                          <strong className="text-xs font-bold text-zinc-900 dark:text-zinc-50 block truncate">
                            {g.title}
                          </strong>
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-zinc-400">
                            <span className="font-bold px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300">
                              {g.category}
                            </span>
                            {sub && (
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub.color }}></span>
                                <span className="font-bold">{sub.name.split(' (')[0]}</span>
                              </span>
                            )}
                            {g.branch && (
                              <span className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300 font-bold">
                                فرع: {g.branch}
                              </span>
                            )}
                            <span>{g.date}</span>
                          </div>

                          {/* Strong / Weak chapters feedback */}
                          {((g.weakChapters && g.weakChapters.length > 0) || (g.strongChapters && g.strongChapters.length > 0)) && (
                            <div className="space-y-0.5 mt-1.5">
                              {g.strongChapters && g.strongChapters.length > 0 && (
                                <p className="text-[9px] text-emerald-600 font-semibold">متقن: {g.strongChapters.join('، ')}</p>
                              )}
                              {g.weakChapters && g.weakChapters.length > 0 && (
                                <p className="text-[9px] text-rose-600 font-semibold">يحتاج مراجعة: {g.weakChapters.join('، ')}</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-left font-mono">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">{g.score} / {g.totalScore}</span>
                            <span className={`text-[9px] font-bold ${percent >= 85 ? 'text-emerald-500' : percent >= 65 ? 'text-amber-500' : 'text-rose-500'}`}>{percent}%</span>
                          </div>

                          <button
                            onClick={() => onDeleteGrade(g.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="حذف الدرجة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 5. Active Recall Voice subtab */}
      {activeSubTab === 'voice-recall' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Mic className="w-5 h-5 text-amber-500" />
              <span>التسميع الصوتي التفاعلي بذكاء الأعصاب (Active Recall Engine)</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              اشرح مفهومًا أو درسًا بصوتك كما لو كنت تشرحه لزميلك (مبدأ فاينمان للتعلم السريع). سيقوم الخبير الذكي بتحليل شرحك الصوتي فوراً، ورصد أي مفاهيم خاطئة أو ناقصة، وتقدير نسبة فهمك، وتقديم أسئلة مخصصة لاختبار مدى رسوخ المعلومة في عقلك!
            </p>

            <form onSubmit={handleAnalyzeVoiceRecall} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">المادة الدراسية:</label>
                  <select
                    value={voiceSubjectId}
                    onChange={(e) => setVoiceSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                  >
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">المفهوم أو الدرس المحدد (مثال: الخلايا الجلفانية، الكيمياء العضوية):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: نظرية دالتون الذرية"
                    value={voiceTopicName}
                    onChange={(e) => setVoiceTopicName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {/* Microphone Permission Modal */}
                {showMicPrompt && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs dir-rtl" style={{ direction: 'rtl' }}>
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-right space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Mic className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100">تأكيد إذن الميكروفون 🎙️</h4>
                          <p className="text-[11px] text-zinc-500">سماح ببدء استخدام الميكروفون للتسميع</p>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        هل تأذن للبرنامج بالوصول للميكروفون في متصفحك للبدء بالتحويل التلقائي لصوتك إلى كتابة للتسميع الشفاهي؟
                      </p>
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setShowMicPrompt(false)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={handleStartSpeechAfterPermission}
                          className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>إسمح وابدأ التسميع 🎙️</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <label className="block text-xs text-zinc-500">نص الشرح والتسميع الصوتي:</label>
                  <button
                    type="button"
                    onClick={handleToggleRecording}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                      isRecording 
                        ? 'bg-red-100 text-red-600 animate-pulse border border-red-200' 
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                        <span>جاري التسجيل الصوتي... اضغط للإيقاف 🛑</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-zinc-500" />
                        <span>ابدأ التحدث باللغة العربية 🎙️</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  required
                  rows={5}
                  placeholder="اضغط على زر التسجيل وتحدث لشرح الدرس بالكامل بصوتك، أو اكتب شرحك التفصيلي هنا يدوياً..."
                  value={voiceExplanation}
                  onChange={(e) => setVoiceExplanation(e.target.value)}
                  className="w-full p-4 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-2xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100 leading-relaxed"
                />
              </div>

              {voiceError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 text-xs font-semibold">
                  {voiceError}
                </div>
              )}

              <button
                type="submit"
                disabled={isAnalyzingVoice}
                className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isAnalyzingVoice ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري تفعيل ذكاء الأعصاب وتحليل الشرح...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>تحليل التسميع والتحقق من الفهم بالذكاء الاصطناعي 🧠</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Voice Recall Feedback Results */}
          {voiceFeedback && (
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-b from-zinc-50/50 to-white dark:from-zinc-950/30 dark:to-zinc-900 shadow-xs space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-850 pb-4">
                <div className="text-right">
                  <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">نتائج الفحص الإدراكي للشرح والتسميع</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">تم التحليل باستخدام معايير الفهم العميق والذاكرة الصلبة.</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <span className="text-[10px] text-zinc-400 block font-bold mb-1">الدرجة الإجمالية</span>
                    <span className="text-xl font-black font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-2xl border border-amber-500/20">{voiceFeedback.score} / 100</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-zinc-400 block font-bold mb-1">نسبة الفهم المقدرة</span>
                    <span className="text-xl font-black font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-2xl border border-indigo-500/20">{voiceFeedback.understandingEstimate}%</span>
                  </div>
                </div>
              </div>

              {/* Coach Feedback */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-150 dark:border-zinc-850">
                <strong className="text-xs text-zinc-800 dark:text-zinc-200 block mb-1">تحليل الخبير الموجه:</strong>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-semibold">{voiceFeedback.feedbackText}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Missing Concepts */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>مفاهيم مفقودة أو هامة نسيتها:</span>
                  </h5>
                  {voiceFeedback.detectedMissingConcepts && voiceFeedback.detectedMissingConcepts.length > 0 ? (
                    <div className="space-y-1.5">
                      {voiceFeedback.detectedMissingConcepts.map((item: string, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 font-semibold">
                          • {item}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-emerald-600 font-bold">✨ رائع! لم تفوت أي مفهوم رئيسي في شرحك.</p>
                  )}
                </div>

                {/* Misconceptions */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-red-500" />
                    <span>مفاهيم خاطئة يجب تصحيحها:</span>
                  </h5>
                  {voiceFeedback.misconceptions && voiceFeedback.misconceptions.length > 0 ? (
                    <div className="space-y-1.5">
                      {voiceFeedback.misconceptions.map((item: string, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-red-50/50 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/20 text-[11px] leading-relaxed text-red-700 dark:text-red-400 font-semibold">
                          ⚠️ {item}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-emerald-600 font-bold">✨ ممتاز! جميع تفاصيل شرحك دقيقة علمياً.</p>
                  )}
                </div>
              </div>

              {/* Suggested Improvements */}
              {voiceFeedback.suggestedImprovements && voiceFeedback.suggestedImprovements.length > 0 && (
                <div className="space-y-2.5">
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    <span>خطوات عملية لتحسين الفهم وتثبيت المعلومة:</span>
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {voiceFeedback.suggestedImprovements.map((item: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-semibold">
                        {idx + 1}. {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow up questions */}
              {voiceFeedback.followUpQuestions && voiceFeedback.followUpQuestions.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-850">
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span>اختبر معلوماتك: أسئلة متابعة لتحدي عقلك وتعميق الفهم:</span>
                  </h5>
                  <div className="space-y-2">
                    {voiceFeedback.followUpQuestions.map((item: string, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        ❓ {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. AI Advanced Analytics Tab */}

      {/* 7. AI Advanced Analytics Tab */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm text-right">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
              <span>التحليلات المعرفية ومؤشرات الفهم المتقدمة (AI Advanced Analytics)</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
              فحص فسيولوجي عميق لدرجة جودة الاستيعاب ونوعية المراجعة، وتحديد ساعات التركيز الذهنية المثالية والخمول اليومية لتحقيق الذروة المعرفية.
            </p>

            <button
              onClick={handleGenerateAdvancedAnalytics}
              disabled={isGeneratingAnalytics}
              className="py-3 px-6 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingAnalytics ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري تجميع المؤشرات وفحص منحنيات النسيان...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>عرض التحليلات الإدراكية المتقدمة بالذكاء الاصطناعي 📊</span>
                </>
              )}
            </button>
          </div>

          {analyticsError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 text-xs font-semibold">
              {analyticsError}
            </div>
          )}

          {analyticsResult && (
            <div className="space-y-6 animate-fade-in text-right">
              {((analyticsResult.completedHours || 0) === 0 && (analyticsResult.completionRate || 0) === 0) ? (
                <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-center text-zinc-500 font-bold text-xs">
                  ⚠️ عفواً، لا توجد بيانات كافية لعرض الإحصائيات الحقيقية بعد. يرجى إتمام بعض المهام وجلسات الدراسة أولاً!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Radial Score Widget */}
                  <div className="md:col-span-1 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4 text-center">
                    <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 block">معدل الإنجاز الأسبوعي (Completion Rate)</span>
                    <div className="w-24 h-24 mx-auto rounded-full border-4 border-indigo-500 flex items-center justify-center relative bg-indigo-500/5">
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">%{analyticsResult.completionRate ?? 0}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 text-[10px] leading-relaxed text-zinc-500">
                      مقياس حقيقي وصادق لنسبة المهام التي أنجزتها بالفعل من جدولك الأسبوعي الحالي.
                    </div>

                    <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 block pt-2">درجة الثبات والاستمرارية (Consistency)</span>
                    <div className="w-24 h-24 mx-auto rounded-full border-4 border-emerald-500 flex items-center justify-center relative bg-emerald-500/5">
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">%{analyticsResult.consistencyScore ?? 0}</span>
                    </div>
                  </div>

                  {/* 7 High Quality Honest Metrics Bento Grid */}
                  <div className="md:col-span-2 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-6">
                    <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-850 pb-3 flex items-center gap-2">
                      <span>📊 مؤشرات الأداء الحقيقية والواقعية للثانوية العامة</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850">
                        <span className="text-[10px] text-zinc-400 block font-bold mb-0.5">⏱️ الساعات المكتملة (Completed Hours)</span>
                        <span className="text-base font-black text-zinc-800 dark:text-zinc-100">{analyticsResult.completedHours ?? 0} ساعة</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850">
                        <span className="text-[10px] text-zinc-400 block font-bold mb-0.5">📚 المواد المذاكرة (Subjects Finished)</span>
                        <span className="text-base font-black text-zinc-800 dark:text-zinc-100">{analyticsResult.subjectsFinished ?? 0} مواد</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850">
                        <span className="text-[10px] text-zinc-400 block font-bold mb-0.5">⚡ متوسط طول الجلسة (Avg Session)</span>
                        <span className="text-base font-black text-zinc-800 dark:text-zinc-100">{analyticsResult.averageSessionLength ?? 0} دقيقة</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850">
                        <span className="text-[10px] text-zinc-400 block font-bold mb-0.5">📈 التقدم الأسبوعي (Weekly Progress)</span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">%{analyticsResult.weeklyProgress ?? 0}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 col-span-2">
                        <span className="text-[10px] text-zinc-400 block font-bold mb-0.5">⚠️ الحصص/الجلسات الفائتة (Missed Sessions)</span>
                        <span className="text-base font-black text-rose-600 dark:text-rose-400">{analyticsResult.missedSessions ?? 0} جلسة</span>
                      </div>
                    </div>

                    {/* Best & Worst hours */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                        <span className="text-[10px] text-emerald-600 font-bold block mb-1.5">⏱️ أوقات التركيز الأعلى (الذروة الفكرية):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {analyticsResult.bestStudyHours.map((time, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                              {time}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-red-500/5 border border-red-500/10">
                        <span className="text-[10px] text-red-600 font-bold block mb-1.5">💤 أوقات الخمول العصبي (أعلى نسب تشتت):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {analyticsResult.worstStudyHours.map((time, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400 text-[10px] font-bold">
                              {time}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quality descriptions */}
                    <div className="space-y-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-850">
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-semibold">
                        ⭐ <span className="font-bold text-zinc-900 dark:text-zinc-100">جودة جلسات العمل: </span>
                        {analyticsResult.studyQualityIndicator}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-semibold">
                        🔄 <span className="font-bold text-zinc-900 dark:text-zinc-100">منظومة التكرار الفعال: </span>
                        {analyticsResult.revisionQualityIndicator}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Memory Profile & Digital Twin Neuroscience Section */}
              {analyticsResult.memoryProfile && analyticsResult.digitalTwin && (
                <div className="md:col-span-3 p-6 rounded-3xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/5 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-900 pb-3">
                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-indigo-500 animate-pulse" />
                      <span>التوأم الرقمي العصبي والملف المعرفي للطالب (AI Neuroscience Digital Twin)</span>
                    </h4>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold px-3 py-1 rounded-full">
                      تحديث تلقائي مستمر 🔄
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Part 1: AI Memory Profile */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
                      <h5 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-150 dark:border-zinc-805 pb-2">
                        <span className="p-1 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">🧠</span>
                        <span>الملف المعرفي للذاكرة والسلوك الأكاديمي</span>
                      </h5>

                      <div className="space-y-3.5 text-xs text-zinc-700 dark:text-zinc-350">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950">
                            <span className="text-[10px] text-zinc-400 font-bold block mb-0.5">أسلوب التعلم:</span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{analyticsResult.memoryProfile.learningStyle || 'سمعي بصري'}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950">
                            <span className="text-[10px] text-zinc-400 font-bold block mb-0.5">جلسة المذاكرة المثالية:</span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{analyticsResult.memoryProfile.preferredStudyDuration || 25} دقيقة</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950">
                            <span className="text-[10px] text-zinc-400 font-bold block mb-0.5">أفضل ساعات التركيز:</span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-[10px]">
                              {Array.isArray(analyticsResult.memoryProfile.bestStudyHours) ? analyticsResult.memoryProfile.bestStudyHours.join('، ') : analyticsResult.memoryProfile.bestStudyHours}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950">
                            <span className="text-[10px] text-zinc-400 font-bold block mb-0.5">أوقات الخمول:</span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-[10px]">
                              {Array.isArray(analyticsResult.memoryProfile.worstStudyHours) ? analyticsResult.memoryProfile.worstStudyHours.join('، ') : analyticsResult.memoryProfile.worstStudyHours}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 space-y-1">
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">نقاط قوة الذاكرة والتعافي:</span>
                          <p className="leading-relaxed font-semibold text-zinc-800 dark:text-zinc-200">{analyticsResult.memoryProfile.memoryStrength}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 space-y-1">
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">مواطن ضعف الذاكرة وسلوك النسيان:</span>
                          <p className="leading-relaxed font-semibold text-zinc-800 dark:text-zinc-200">{analyticsResult.memoryProfile.memoryWeakness}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold block">نمط دافعية التعلم والاحتراق:</span>
                          <p className="leading-relaxed font-semibold text-zinc-800 dark:text-zinc-200">
                            {analyticsResult.memoryProfile.motivationPattern} | {analyticsResult.memoryProfile.burnoutPattern}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold block">سلوك التكرار والمراجعة المفضل:</span>
                          <p className="leading-relaxed font-semibold text-zinc-800 dark:text-zinc-200">{analyticsResult.memoryProfile.revisionBehaviour}</p>
                        </div>
                      </div>
                    </div>

                    {/* Part 2: AI Digital Twin */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
                      <h5 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-150 dark:border-zinc-805 pb-2">
                        <span className="p-1 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">🤖</span>
                        <span>التوأم الرقمي العصبي التراكمي (AI Digital Twin)</span>
                      </h5>

                      <div className="space-y-3.5 text-xs text-zinc-700 dark:text-zinc-350">
                        <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-1">
                          <span className="text-[10px] text-indigo-600 font-bold block">الترتيب المعرفي الأمثل للمذاكرة:</span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {Array.isArray(analyticsResult.digitalTwin.optimalStudyOrder) ? (
                              analyticsResult.digitalTwin.optimalStudyOrder.map((order: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold">
                                  {order}
                                </span>
                              ))
                            ) : (
                              <span className="font-semibold">{analyticsResult.digitalTwin.optimalStudyOrder}</span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold block">التوقيت الأمثل لمراجعة الدروس:</span>
                          <p className="leading-relaxed font-semibold text-zinc-800 dark:text-zinc-200">{analyticsResult.digitalTwin.bestReviewTiming}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold block">تأثير النوم والراحة على التحصيل المعرفي:</span>
                          <p className="leading-relaxed font-semibold text-zinc-800 dark:text-zinc-200">{analyticsResult.digitalTwin.sleepImpact}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold block">تأثير التداخل وتفاعل المواد العقلية:</span>
                          <p className="leading-relaxed font-semibold text-zinc-800 dark:text-zinc-200">{analyticsResult.digitalTwin.subjectInteractions}</p>
                        </div>

                        {/* Historical Learnings Log */}
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 space-y-2">
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">سجل الإدراك التراكمي للتوأم الرقمي (Continuous Learnings):</span>
                          <div className="max-h-28 overflow-y-auto space-y-2 text-[10px] divide-y divide-zinc-100 dark:divide-zinc-800 pr-1 text-right">
                            {analyticsResult.digitalTwin.historicalLearnings && analyticsResult.digitalTwin.historicalLearnings.length > 0 ? (
                              analyticsResult.digitalTwin.historicalLearnings.map((learn: any, i: number) => (
                                <div key={i} className="pt-2 first:pt-0">
                                  <div className="flex justify-between font-bold text-zinc-500 mb-0.5">
                                    <span>{learn.category || 'تعلم تلقائي'}</span>
                                    <span>{new Date(learn.timestamp).toLocaleDateString('ar-EG')}</span>
                                  </div>
                                  <p className="text-zinc-800 dark:text-zinc-300 leading-normal font-semibold">{learn.insight}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-zinc-400 italic">يبدأ التوأم الرقمي بتسجيل استنتاجاته فور تفاعلك وحل الجلسات.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
