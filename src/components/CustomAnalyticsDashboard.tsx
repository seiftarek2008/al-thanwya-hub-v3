import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { 
  BarChart3, LineChart as LineIcon, PieChart as PieIcon, Activity, 
  Calendar, BookOpen, Download, RefreshCw, Filter, Layers, 
  CheckCircle2, Sparkles, TrendingUp, Compass, Award, FileSpreadsheet,
  CalendarRange, CheckSquare, Square, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Subject, StudySession, Exam, Task, DailyHistoryLog } from '../types';

interface CustomAnalyticsDashboardProps {
  subjects: Subject[];
  sessions: StudySession[];
  exams: Exam[];
  tasks?: Task[];
  dailyHistoryLogs?: DailyHistoryLog[];
  currentAcademicWeek?: number;
  thanaweyaStartDate?: string;
  onOpenStudentGuide?: () => void;
}

// Color Palette for Multi-series/Weeks comparison
const CHART_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', 
  '#06b6d4', '#f97316', '#14b8a6', '#e11d48', '#3b82f6',
  '#84cc16', '#a855f7', '#0ea5e9', '#d946ef', '#eab308'
];

export default function CustomAnalyticsDashboard({
  subjects = [],
  sessions = [],
  exams = [],
  tasks = [],
  dailyHistoryLogs = [],
  currentAcademicWeek = 1,
  thanaweyaStartDate = '2026-08-25',
  onOpenStudentGuide
}: CustomAnalyticsDashboardProps) {
  // --- Calculate Current Academic Week from Start Date ---
  const calculatedCurrentWeek = useMemo(() => {
    if (currentAcademicWeek && currentAcademicWeek > 0) return currentAcademicWeek;
    if (!thanaweyaStartDate) return 1;
    const start = new Date(thanaweyaStartDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 1;
    return Math.min(Math.floor(diffDays / 7) + 1, 52);
  }, [currentAcademicWeek, thanaweyaStartDate]);

  // Determine highest week with data or active week (open-ended up to full 52-week year)
  const maxRecordedWeek = useMemo(() => {
    const recordedWeeks = [
      calculatedCurrentWeek,
      ...sessions.map(s => s.academicWeek || 1),
      ...exams.map(e => e.academicWeek || 1)
    ];
    return Math.max(...recordedWeeks, 1);
  }, [calculatedCurrentWeek, sessions, exams]);

  // Full academic year weeks list (1 to 52)
  const allYearWeeks = useMemo(() => {
    const total = Math.max(maxRecordedWeek, 52);
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [maxRecordedWeek]);

  // --- Builder Controls State ---
  const [xAxisKey, setXAxisKey] = useState<'subject' | 'academicWeek' | 'dayOfWeek' | 'date' | 'month' | 'examName'>('academicWeek');
  const [yAxisMetric, setYAxisMetric] = useState<'studyHours' | 'sessionCount' | 'examScore' | 'tasksCompleted' | 'confidence' | 'xpEarned'>('studyHours');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie' | 'radar' | 'composed'>('bar');
  
  // Custom Week Range Selection: [startWeek, endWeek] (Defaults to Week 1 up to current week open-ended!)
  const [startWeek, setStartWeek] = useState<number>(1);
  const [endWeek, setEndWeek] = useState<number>(Math.max(calculatedCurrentWeek, maxRecordedWeek));
  const [weekRangePreset, setWeekRangePreset] = useState<'fromStart' | 'allYear' | 'last4' | 'last8' | 'last12' | 'custom'>('fromStart');

  // Comparison Mode: compare selected weeks (e.g. W1, W2, W3...)
  const [enableComparison, setEnableComparison] = useState<boolean>(false);
  const [selectedWeeksToCompare, setSelectedWeeksToCompare] = useState<number[]>(() => {
    const targetMax = Math.max(calculatedCurrentWeek, 4);
    const initial = [];
    for (let i = 1; i <= Math.min(targetMax, 6); i++) {
      initial.push(i);
    }
    return initial;
  });

  // Effective weeks in the selected range [startWeek, endWeek]
  const effectiveWeeksRange = useMemo(() => {
    const s = Math.min(startWeek, endWeek);
    const e = Math.max(startWeek, endWeek);
    const list = [];
    for (let w = s; w <= e; w++) {
      list.push(w);
    }
    return list;
  }, [startWeek, endWeek]);

  // Apply Quick Week Range Preset
  const handleApplyWeekPreset = (preset: 'fromStart' | 'allYear' | 'last4' | 'last8' | 'last12' | 'custom') => {
    setWeekRangePreset(preset);
    const current = Math.max(calculatedCurrentWeek, maxRecordedWeek);
    if (preset === 'fromStart') {
      setStartWeek(1);
      setEndWeek(current);
    } else if (preset === 'allYear') {
      setStartWeek(1);
      setEndWeek(52);
    } else if (preset === 'last4') {
      setStartWeek(Math.max(1, current - 3));
      setEndWeek(current);
    } else if (preset === 'last8') {
      setStartWeek(Math.max(1, current - 7));
      setEndWeek(current);
    } else if (preset === 'last12') {
      setStartWeek(Math.max(1, current - 11));
      setEndWeek(current);
    }
  };

  // --- Presets Handler ---
  const handleApplyPreset = (preset: 'weeklyProgress' | 'hoursBySubject' | 'compareWeeks' | 'examScores' | 'dailyDistribution') => {
    if (preset === 'weeklyProgress') {
      setXAxisKey('academicWeek');
      setYAxisMetric('studyHours');
      setSelectedSubjectId('all');
      setChartType('bar');
      setEnableComparison(false);
      handleApplyWeekPreset('fromStart');
    } else if (preset === 'hoursBySubject') {
      setXAxisKey('subject');
      setYAxisMetric('studyHours');
      setSelectedSubjectId('all');
      setChartType('bar');
      setEnableComparison(false);
    } else if (preset === 'compareWeeks') {
      setXAxisKey('subject');
      setYAxisMetric('studyHours');
      setSelectedSubjectId('all');
      setEnableComparison(true);
      const current = Math.max(calculatedCurrentWeek, maxRecordedWeek);
      const weeksToCompare = Array.from({ length: Math.min(current, 8) }, (_, i) => i + 1);
      setSelectedWeeksToCompare(weeksToCompare);
      setChartType('bar');
    } else if (preset === 'examScores') {
      setXAxisKey('examName');
      setYAxisMetric('examScore');
      setSelectedSubjectId('all');
      setChartType('line');
      setEnableComparison(false);
    } else if (preset === 'dailyDistribution') {
      setXAxisKey('dayOfWeek');
      setYAxisMetric('studyHours');
      setSelectedSubjectId('all');
      setChartType('area');
      setEnableComparison(false);
    }
  };

  const toggleWeekSelection = (weekNum: number) => {
    if (selectedWeeksToCompare.includes(weekNum)) {
      if (selectedWeeksToCompare.length > 1) {
        setSelectedWeeksToCompare(selectedWeeksToCompare.filter(w => w !== weekNum));
      }
    } else {
      setSelectedWeeksToCompare([...selectedWeeksToCompare, weekNum].sort((a, b) => a - b));
    }
  };

  const handleSelectAllWeeksInRangeForComparison = () => {
    setSelectedWeeksToCompare([...effectiveWeeksRange]);
  };

  const handleSelectFromStartToCurrentForComparison = () => {
    const current = Math.max(calculatedCurrentWeek, maxRecordedWeek);
    const list = Array.from({ length: current }, (_, i) => i + 1);
    setSelectedWeeksToCompare(list);
  };

  // Helper to calculate academic week for session/exam if not explicitly tagged
  const resolveAcademicWeek = (item: { academicWeek?: number; date?: string; timestamp?: string }) => {
    if (item.academicWeek && item.academicWeek > 0) return item.academicWeek;
    const dateStr = item.date || item.timestamp;
    if (dateStr && thanaweyaStartDate) {
      const start = new Date(thanaweyaStartDate);
      const current = new Date(dateStr);
      const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) {
        return Math.min(Math.floor(diffDays / 7) + 1, 52);
      }
    }
    return 1;
  };

  // --- Data Processing Engine ---
  const processedChartData = useMemo(() => {
    // 1. Filter sessions & exams by subject if selected
    let filteredSessions = sessions;
    let filteredExams = exams;
    let filteredTasks = tasks;

    if (selectedSubjectId !== 'all') {
      filteredSessions = sessions.filter(s => s.subjectId === selectedSubjectId);
      filteredExams = exams.filter(e => e.subjectId === selectedSubjectId);
    }

    // --- Mode A: Comparison Mode (Comparing Selected Weeks) ---
    if (enableComparison) {
      if (xAxisKey === 'subject') {
        const subjectsList = selectedSubjectId === 'all' 
          ? subjects 
          : subjects.filter(s => s.id === selectedSubjectId);

        return subjectsList.map(subj => {
          const item: any = { name: subj.name, subjectId: subj.id };
          selectedWeeksToCompare.forEach(wNum => {
            const weekSessions = filteredSessions.filter(s => s.subjectId === subj.id && resolveAcademicWeek(s) === wNum);
            const weekExams = filteredExams.filter(e => e.subjectId === subj.id && resolveAcademicWeek(e) === wNum);

            if (yAxisMetric === 'studyHours') {
              const mins = weekSessions.reduce((acc, s) => acc + (s.durationMinutes || (s.duration ? s.duration / 60 : 0)), 0);
              item[`أسبوع ${wNum}`] = Number((mins / 60).toFixed(1));
            } else if (yAxisMetric === 'sessionCount') {
              item[`أسبوع ${wNum}`] = weekSessions.length;
            } else if (yAxisMetric === 'examScore') {
              if (weekExams.length > 0) {
                const avgPct = weekExams.reduce((acc, e) => acc + ((e.score / (e.maxScore || 100)) * 100), 0) / weekExams.length;
                item[`أسبوع ${wNum}`] = Number(avgPct.toFixed(1));
              } else {
                item[`أسبوع ${wNum}`] = 0;
              }
            } else if (yAxisMetric === 'confidence') {
              item[`أسبوع ${wNum}`] = subj.confidenceScore || 100;
            } else {
              item[`أسبوع ${wNum}`] = weekSessions.length * 10;
            }
          });
          return item;
        });
      } else if (xAxisKey === 'dayOfWeek') {
        const days = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
        return days.map((dayName, dayIdx) => {
          const item: any = { name: dayName };
          selectedWeeksToCompare.forEach(wNum => {
            const daySessions = filteredSessions.filter(s => {
              if (resolveAcademicWeek(s) !== wNum) return false;
              const dateVal = s.date || s.timestamp;
              if (!dateVal) return false;
              const d = new Date(dateVal).getDay();
              const adjustedDayIdx = (d + 1) % 7; 
              return adjustedDayIdx === dayIdx;
            });

            if (yAxisMetric === 'studyHours') {
              const mins = daySessions.reduce((acc, s) => acc + (s.durationMinutes || (s.duration ? s.duration / 60 : 0)), 0);
              item[`أسبوع ${wNum}`] = Number((mins / 60).toFixed(1));
            } else {
              item[`أسبوع ${wNum}`] = daySessions.length;
            }
          });
          return item;
        });
      }
    }

    // --- Mode B: Normal Custom Chart Processing ---

    // 1. By Academic Weeks (Open-Ended Range from startWeek to endWeek)
    if (xAxisKey === 'academicWeek') {
      const weeksMap: { [key: number]: any } = {};
      effectiveWeeksRange.forEach(w => {
        const isCurrent = w === calculatedCurrentWeek;
        weeksMap[w] = { 
          name: isCurrent ? `أسبوع ${w} (الحالي)` : `أسبوع ${w}`, 
          weekNum: w, 
          isCurrent,
          value: 0, 
          count: 0,
          fillColor: isCurrent ? '#4f46e5' : '#6366f1'
        };
      });

      if (yAxisMetric === 'studyHours' || yAxisMetric === 'sessionCount' || yAxisMetric === 'xpEarned') {
        filteredSessions.forEach(s => {
          const w = resolveAcademicWeek(s);
          if (weeksMap[w]) {
            const durationMins = s.durationMinutes || (s.duration ? s.duration / 60 : 0);
            if (yAxisMetric === 'studyHours') {
              weeksMap[w].value += durationMins / 60;
            } else if (yAxisMetric === 'sessionCount') {
              weeksMap[w].value += 1;
            } else if (yAxisMetric === 'xpEarned') {
              weeksMap[w].value += durationMins * 2;
            }
          }
        });
      } else if (yAxisMetric === 'examScore') {
        filteredExams.forEach(e => {
          const w = resolveAcademicWeek(e);
          if (weeksMap[w]) {
            const pct = (e.score / (e.maxScore || 100)) * 100;
            weeksMap[w].value += pct;
            weeksMap[w].count += 1;
          }
        });
        Object.keys(weeksMap).forEach(k => {
          const entry = weeksMap[Number(k)];
          if (entry.count > 0) {
            entry.value = Number((entry.value / entry.count).toFixed(1));
          }
        });
      } else if (yAxisMetric === 'tasksCompleted') {
        filteredTasks.forEach(t => {
          if (t.completed) {
            const w = resolveAcademicWeek(t as any);
            if (weeksMap[w]) {
              weeksMap[w].value += 1;
            }
          }
        });
      }

      return Object.values(weeksMap).map(item => ({
        ...item,
        value: Number(item.value.toFixed(1))
      }));
    }

    // 2. By Subject
    if (xAxisKey === 'subject') {
      const targetSubjects = selectedSubjectId === 'all' 
        ? subjects 
        : subjects.filter(s => s.id === selectedSubjectId);

      return targetSubjects.map(subj => {
        const subjSessions = filteredSessions.filter(s => s.subjectId === subj.id);
        const subjExams = filteredExams.filter(e => e.subjectId === subj.id);
        const subjTasks = filteredTasks.filter(t => t.subjectId === subj.id && t.completed);

        let value = 0;
        if (yAxisMetric === 'studyHours') {
          const mins = subjSessions.reduce((acc, s) => acc + (s.durationMinutes || (s.duration ? s.duration / 60 : 0)), 0);
          value = Number((mins / 60).toFixed(1));
        } else if (yAxisMetric === 'sessionCount') {
          value = subjSessions.length;
        } else if (yAxisMetric === 'examScore') {
          if (subjExams.length > 0) {
            value = Number((subjExams.reduce((acc, e) => acc + ((e.score / (e.maxScore || 100)) * 100), 0) / subjExams.length).toFixed(1));
          }
        } else if (yAxisMetric === 'tasksCompleted') {
          value = subjTasks.length;
        } else if (yAxisMetric === 'confidence') {
          value = subj.confidenceScore || 100;
        } else if (yAxisMetric === 'xpEarned') {
          value = subjSessions.reduce((acc, s) => acc + (s.durationMinutes || (s.duration ? s.duration / 60 : 0)) * 2, 0);
        }

        return {
          name: subj.name,
          value,
          fillColor: subj.color || '#6366f1'
        };
      });
    }

    // 3. By Day of Week
    if (xAxisKey === 'dayOfWeek') {
      const days = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
      const dayData = days.map(d => ({ name: d, value: 0 }));

      filteredSessions.forEach(s => {
        const dateVal = s.date || s.timestamp;
        if (!dateVal) return;
        const d = new Date(dateVal).getDay();
        const adjustedIdx = (d + 1) % 7;
        const durationMins = s.durationMinutes || (s.duration ? s.duration / 60 : 0);
        if (yAxisMetric === 'studyHours') {
          dayData[adjustedIdx].value += durationMins / 60;
        } else if (yAxisMetric === 'sessionCount') {
          dayData[adjustedIdx].value += 1;
        } else if (yAxisMetric === 'xpEarned') {
          dayData[adjustedIdx].value += durationMins * 2;
        }
      });

      return dayData.map(d => ({
        ...d,
        value: Number(d.value.toFixed(1)),
        fillColor: '#6366f1'
      }));
    }

    // 4. By Exams
    if (xAxisKey === 'examName') {
      return filteredExams.map(e => ({
        name: e.title || `اختبار ${e.date}`,
        value: Number(((e.score / (e.maxScore || 100)) * 100).toFixed(1)),
        fillColor: '#10b981'
      }));
    }

    // 5. Fallback Date timeline
    const dateMap: { [key: string]: number } = {};
    filteredSessions.slice(-30).forEach(s => {
      const dateVal = s.date || s.timestamp;
      if (!dateVal) return;
      const dStr = new Date(dateVal).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' });
      const durationMins = s.durationMinutes || (s.duration ? s.duration / 60 : 0);
      dateMap[dStr] = (dateMap[dStr] || 0) + durationMins / 60;
    });

    return Object.entries(dateMap).map(([dateStr, val]) => ({
      name: dateStr,
      value: Number(val.toFixed(1))
    }));

  }, [subjects, sessions, exams, tasks, selectedSubjectId, xAxisKey, yAxisMetric, enableComparison, selectedWeeksToCompare, effectiveWeeksRange, calculatedCurrentWeek, thanaweyaStartDate]);

  // Metric Labels & Units
  const getMetricLabel = () => {
    switch (yAxisMetric) {
      case 'studyHours': return 'ساعات المذاكرة (ساعة)';
      case 'sessionCount': return 'عدد الجلسات';
      case 'examScore': return 'درجة الامتحان (%)';
      case 'tasksCompleted': return 'المهام المنجزة';
      case 'confidence': return 'مستوى الثقة (%)';
      case 'xpEarned': return 'نقاط XP';
      default: return 'القيمة';
    }
  };

  // Summary Metrics Calculation
  const totalVal = useMemo(() => {
    if (enableComparison) return 0;
    return processedChartData.reduce((acc: number, item: any) => acc + (Number(item.value) || 0), 0);
  }, [processedChartData, enableComparison]);

  const avgVal = useMemo(() => {
    if (processedChartData.length === 0 || enableComparison) return 0;
    return (totalVal / processedChartData.length).toFixed(1);
  }, [totalVal, processedChartData, enableComparison]);

  const peakItem = useMemo(() => {
    if (processedChartData.length === 0 || enableComparison) return null;
    return [...processedChartData].sort((a, b) => (b.value || 0) - (a.value || 0))[0];
  }, [processedChartData, enableComparison]);

  // Export Data to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (enableComparison) {
      const headers = ["العنصر", ...selectedWeeksToCompare.map(w => `أسبوع ${w}`)].join(",");
      csvContent += headers + "\n";
      processedChartData.forEach((row: any) => {
        const line = [row.name, ...selectedWeeksToCompare.map(w => row[`أسبوع ${w}`] || 0)].join(",");
        csvContent += line + "\n";
      });
    } else {
      csvContent += `العنصر,${getMetricLabel()}\n`;
      processedChartData.forEach((row: any) => {
        csvContent += `${row.name},${row.value}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `custom_analytics_${xAxisKey}_${yAxisMetric}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 text-right dir-rtl pb-16" style={{ direction: 'rtl' }}>
      
      {/* Top Banner Header */}
      <div className="p-6 bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 text-white rounded-3xl shadow-xl border border-indigo-500/20 space-y-4 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                <span>استوديو التحليلات والرسم البياني المفتوح (Analytic Studio) 📈</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  أسابيع مفتوحة 🚀
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80 font-bold mt-0.5">
                تتبع مسيرتك الدراسية منذ بداية العام الدراسي وحتى الأسبوع الحالي أو اختر أي نطاق من أسبوع X إلى أسبوع Y دون قيود!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenStudentGuide && (
              <button
                onClick={onOpenStudentGuide}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[11px] font-black text-white transition-all shadow-md cursor-pointer flex items-center gap-1.5 border border-indigo-400/30"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>دليل الاستخدام 📖</span>
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-extrabold text-white transition-all cursor-pointer flex items-center gap-1.5 border border-white/10"
              title="تصدير البيانات كملف CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير البيانات 📊</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-400">نماذج تحليلية جاهزة:</span>
          <button
            onClick={() => handleApplyPreset('weeklyProgress')}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/60 hover:bg-indigo-600 text-[11px] font-black text-white border border-indigo-400/40 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <CalendarRange className="w-3.5 h-3.5 text-indigo-200" />
            <span>📅 من بداية العام حتى الآن (أسبوع 1 ➔ {calculatedCurrentWeek})</span>
          </button>
          <button
            onClick={() => handleApplyPreset('hoursBySubject')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-extrabold text-white transition-all cursor-pointer border border-white/10 flex items-center gap-1"
          >
            <span>📚 ساعات المذاكرة بالمادة</span>
          </button>
          <button
            onClick={() => handleApplyPreset('compareWeeks')}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/40 text-[11px] font-black text-indigo-200 border border-indigo-400/40 transition-all cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-indigo-300" />
            <span>⚡ مقارنة الأسابيع المتعددة</span>
          </button>
          <button
            onClick={() => handleApplyPreset('examScores')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-extrabold text-white transition-all cursor-pointer border border-white/10 flex items-center gap-1"
          >
            <span>📝 درجات الامتحانات</span>
          </button>
          <button
            onClick={() => handleApplyPreset('dailyDistribution')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-extrabold text-white transition-all cursor-pointer border border-white/10 flex items-center gap-1"
          >
            <span>🗓️ توزيع أيام الأسبوع</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Controls Builder */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-black text-sm">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>منشئ وتخصيص الرسم البياني (Configurator):</span>
          </div>

          <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            أنت الآن في: <span className="text-indigo-600 dark:text-indigo-400 font-black font-mono">الأسبوع الأكاديمي {calculatedCurrentWeek} 🎯</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. X-Axis Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
              المحور الأفقي (X-Axis):
            </label>
            <select
              value={xAxisKey}
              onChange={(e: any) => setXAxisKey(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="academicWeek">الأسابيع الدراسية المفتوحة (Academic Weeks) 📅</option>
              <option value="subject">المواد الدراسية (Subjects) 📚</option>
              <option value="dayOfWeek">أيام الأسبوع (Days of Week) 🗓️</option>
              <option value="examName">الامتحانات والاختبارات (Exams) 📝</option>
            </select>
          </div>

          {/* 2. Y-Axis Metric */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
              المحور الرأسي (Y-Axis Metric):
            </label>
            <select
              value={yAxisMetric}
              onChange={(e: any) => setYAxisMetric(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="studyHours">ساعات المذاكرة (Study Hours) ⏱️</option>
              <option value="sessionCount">عدد الجلسات (Sessions Count) 🔢</option>
              <option value="examScore">نسبة درجات الامتحانات (%) 💯</option>
              <option value="tasksCompleted">عدد المهام المنجزة (Tasks) ✅</option>
              <option value="confidence">مستوى الثقة بالفهم (%) 🧠</option>
              <option value="xpEarned">نقاط الخبرة (XP) ⚡</option>
            </select>
          </div>

          {/* 3. Subject Scope */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
              تحديد المادة الدراسية:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">كل المواد الدراسية (All Subjects)</option>
              {subjects.map(subj => (
                <option key={subj.id} value={subj.id}>{subj.name}</option>
              ))}
            </select>
          </div>

          {/* 4. Chart Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
              نوع الرسم البياني (Graph Type):
            </label>
            <select
              value={chartType}
              onChange={(e: any) => setChartType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="bar">أعمدة رأسية (Bar Chart) 📊</option>
              <option value="line">خطي زمني (Line Chart) 📈</option>
              <option value="area">مساحة مظللة (Area Chart) 📉</option>
              <option value="pie">دائري مقسم (Pie / Donut Chart) 🥧</option>
              <option value="radar">رادار شبكي (Radar Chart) 🕸️</option>
              <option value="composed">مركب أعمدة + خط (Composed) 🔀</option>
            </select>
          </div>

        </div>

        {/* --- DEDICATED OPEN-ENDED ACADEMIC WEEKS RANGE SELECTOR --- */}
        {(xAxisKey === 'academicWeek' || enableComparison) && (
          <div className="p-5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/60 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                  نطاق الأسابيع الدراسية المفتوح (Academic Weeks Range):
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-black">
                  من أسبوع {Math.min(startWeek, endWeek)} إلى أسبوع {Math.max(startWeek, endWeek)} ({effectiveWeeksRange.length} أسبوع)
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyWeekPreset('fromStart')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border ${
                    weekRangePreset === 'fromStart'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300'
                  }`}
                >
                  🚀 من البداية حتى الآن (1 ➔ {calculatedCurrentWeek})
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyWeekPreset('allYear')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border ${
                    weekRangePreset === 'allYear'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300'
                  }`}
                >
                  🌟 العام كاملاً (1 ➔ 52)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyWeekPreset('last4')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border ${
                    weekRangePreset === 'last4'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300'
                  }`}
                >
                  آخر 4 أسابيع
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyWeekPreset('last8')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border ${
                    weekRangePreset === 'last8'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300'
                  }`}
                >
                  آخر 8 أسابيع
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyWeekPreset('last12')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border ${
                    weekRangePreset === 'last12'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300'
                  }`}
                >
                  آخر 12 أسبوع
                </button>
              </div>
            </div>

            {/* Custom Range Dropdowns (From Week X to Week Y) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  من الأسبوع (Start Week X):
                </label>
                <select
                  value={startWeek}
                  onChange={(e) => {
                    setStartWeek(Number(e.target.value));
                    setWeekRangePreset('custom');
                  }}
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {allYearWeeks.map(w => (
                    <option key={w} value={w}>
                      الأسبوع {w} {w === 1 ? '(بداية العام)' : ''} {w === calculatedCurrentWeek ? '🎯 (الأسبوع الحالي)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  إلى الأسبوع (End Week Y):
                </label>
                <select
                  value={endWeek}
                  onChange={(e) => {
                    setEndWeek(Number(e.target.value));
                    setWeekRangePreset('custom');
                  }}
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {allYearWeeks.map(w => (
                    <option key={w} value={w}>
                      الأسبوع {w} {w === calculatedCurrentWeek ? '🎯 (الأسبوع الحالي)' : ''} {w === 52 ? '(نهاية العام)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Feature: Compare Weeks Mode */}
        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="toggleComparison"
                checked={enableComparison}
                onChange={(e) => setEnableComparison(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="toggleComparison" className="text-xs font-black text-indigo-900 dark:text-indigo-200 cursor-pointer flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>تفعيل وضع مقارنة الأسابيع الدراسية المفتوحة (Weekly Comparison Mode) ⚡</span>
              </label>
            </div>
            <span className="text-[11px] text-zinc-500 font-bold hidden sm:inline">
              يقوم بتوضيح الفروق بين الأسابيع جنب لجنب في نفس الرسم!
            </span>
          </div>

          {enableComparison && (
            <div className="pt-2 border-t border-indigo-200/50 dark:border-indigo-800/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  اختر الأسابيع الدراسية المراد مقارنتها دون أي قيود:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllWeeksInRangeForComparison}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>تحديد كل الأسابيع في النطاق ({effectiveWeeksRange.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectFromStartToCurrentForComparison}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>من 1 إلى الحالي ({calculatedCurrentWeek})</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 max-h-48 overflow-y-auto p-1">
                {effectiveWeeksRange.map(wNum => {
                  const isSelected = selectedWeeksToCompare.includes(wNum);
                  const isCurrent = wNum === calculatedCurrentWeek;
                  return (
                    <button
                      key={wNum}
                      type="button"
                      onClick={() => toggleWeekSelection(wNum)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                        isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-indigo-400'
                      }`}
                    >
                      {isSelected ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Square className="w-3.5 h-3.5 text-zinc-400" />}
                      <span>أسبوع {wNum}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-400 text-zinc-950 font-black">
                          الحالي
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Graph Visualization Area */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-6">
        
        {/* Graph Header Label */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-150 dark:border-zinc-800 pb-4">
          <div>
            <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{getMetricLabel()}</span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                {enableComparison 
                  ? `مقارنة ${selectedWeeksToCompare.length} أسابيع` 
                  : xAxisKey === 'academicWeek'
                  ? `الأسابيع الدراسية (من أسبوع ${Math.min(startWeek, endWeek)} إلى ${Math.max(startWeek, endWeek)})`
                  : `حسب ${xAxisKey === 'subject' ? 'المواد' : 'الأيام'}`}
              </span>
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              عرض تفاعلي مباشر وشامل وفق خيارات النطاق والتحليل المحددة.
            </p>
          </div>

          {!enableComparison && (
            <div className="flex items-center gap-3 text-xs font-bold text-zinc-600 dark:text-zinc-400">
              <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl">
                الإجمالي: <strong className="text-indigo-600 dark:text-indigo-400 font-black">{totalVal}</strong>
              </span>
              <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl">
                المتوسط: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{avgVal}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Recharts Container */}
        <div className="w-full h-[380px] sm:h-[420px] pt-4 dir-ltr overflow-x-auto" style={{ direction: 'ltr' }}>
          {processedChartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 space-y-2">
              <Activity className="w-8 h-8 text-zinc-400 animate-pulse" />
              <p className="text-xs font-bold text-zinc-500">لا توجد بيانات كافية مسجلة لهذه الفلاتر المحددة حتى الآن.</p>
              <p className="text-[11px] text-zinc-400">قم بتسجيل جلسات أو اختبارات دراسية لعرضها هنا فوراً!</p>
            </div>
          ) : enableComparison ? (
            /* --- COMPARISON MULTI-SERIES CHART --- */
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={processedChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #374151', backgroundColor: '#111827', color: '#fff' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  {selectedWeeksToCompare.map((wNum, idx) => (
                    <Line
                      key={wNum}
                      type="monotone"
                      dataKey={`أسبوع ${wNum}`}
                      stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              ) : chartType === 'area' ? (
                <AreaChart data={processedChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #374151', backgroundColor: '#111827', color: '#fff' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  {selectedWeeksToCompare.map((wNum, idx) => (
                    <Area
                      key={wNum}
                      type="monotone"
                      dataKey={`أسبوع ${wNum}`}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                      stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                      fillOpacity={0.25}
                    />
                  ))}
                </AreaChart>
              ) : (
                <BarChart data={processedChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #374151', backgroundColor: '#111827', color: '#fff' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  {selectedWeeksToCompare.map((wNum, idx) => (
                    <Bar
                      key={wNum}
                      dataKey={`أسبوع ${wNum}`}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                      radius={[6, 6, 0, 0]}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            /* --- SINGLE SERIES STANDARD CHART (OPEN-ENDED) --- */
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={processedChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: processedChartData.length > 15 ? 10 : 12, fill: '#71717a' }} 
                    angle={processedChartData.length > 12 ? -45 : 0}
                    textAnchor={processedChartData.length > 12 ? 'end' : 'middle'}
                    height={processedChartData.length > 12 ? 60 : 30}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #374151', backgroundColor: '#111827', color: '#fff' }} />
                  <Line type="monotone" dataKey="value" name={getMetricLabel()} stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              ) : chartType === 'area' ? (
                <AreaChart data={processedChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: processedChartData.length > 15 ? 10 : 12, fill: '#71717a' }} 
                    angle={processedChartData.length > 12 ? -45 : 0}
                    textAnchor={processedChartData.length > 12 ? 'end' : 'middle'}
                    height={processedChartData.length > 12 ? 60 : 30}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #374151', backgroundColor: '#111827', color: '#fff' }} />
                  <Area type="monotone" dataKey="value" name={getMetricLabel()} stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                </AreaChart>
              ) : chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={processedChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {processedChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fillColor || CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #374151', backgroundColor: '#111827', color: '#fff' }} />
                  <Legend />
                </PieChart>
              ) : chartType === 'radar' ? (
                <RadarChart cx="50%" cy="50%" outerRadius={110} data={processedChartData}>
                  <PolarGrid opacity={0.3} />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis />
                  <Radar name={getMetricLabel()} dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #374151', backgroundColor: '#111827', color: '#fff' }} />
                </RadarChart>
              ) : chartType === 'composed' ? (
                <ComposedChart data={processedChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: processedChartData.length > 15 ? 10 : 12, fill: '#71717a' }} 
                    angle={processedChartData.length > 12 ? -45 : 0}
                    textAnchor={processedChartData.length > 12 ? 'end' : 'middle'}
                    height={processedChartData.length > 12 ? 60 : 30}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #374151', backgroundColor: '#111827', color: '#fff' }} />
                  <Bar dataKey="value" name={getMetricLabel()} fill="#6366f1" radius={[6, 6, 0, 0]}>
                    {processedChartData.map((entry: any, index: number) => (
                      <Cell key={`composed-cell-${index}`} fill={entry.fillColor || (entry.isCurrent ? '#4f46e5' : '#6366f1')} />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              ) : (
                <BarChart data={processedChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: processedChartData.length > 15 ? 10 : 12, fill: '#71717a' }} 
                    angle={processedChartData.length > 12 ? -45 : 0}
                    textAnchor={processedChartData.length > 12 ? 'end' : 'middle'}
                    height={processedChartData.length > 12 ? 60 : 30}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #374151', backgroundColor: '#111827', color: '#fff' }} />
                  <Bar dataKey="value" name={getMetricLabel()} fill="#6366f1" radius={[6, 6, 0, 0]}>
                    {processedChartData.map((entry: any, index: number) => (
                      <Cell key={`bar-${index}`} fill={entry.fillColor || (entry.isCurrent ? '#4f46e5' : '#6366f1')} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Insight Card Below Chart */}
        {!enableComparison && peakItem && (
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 block">
                تحليل ذكي للرسم البياني 🌟
              </span>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                أعلى قيمة مسجلة في هذا النطاق هي في <strong>"{peakItem.name}"</strong> بـ <strong>{peakItem.value} {getMetricLabel()}</strong>. استمر على هذا الأداء الممتاز!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
