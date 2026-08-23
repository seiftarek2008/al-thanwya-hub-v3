import { DailyHistoryLog, StudySession, Task, GradeRecord, Exam, Gamification } from '../types';

/**
 * Parses YYYY-MM-DD string into a date object ignoring timezone shifts
 */
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Returns date as YYYY-MM-DD string
 */
export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Generates a complete chronological timeline of DailyHistoryLog from startDate to endDate
 * based on all available student logs and actions in the system.
 */
export function generateHistoryTimeline(
  startDateStr: string,
  endDateStr: string,
  sessions: StudySession[],
  tasks: Task[],
  grades: GradeRecord[],
  exams: Exam[],
  burnoutLogs: any[],
  stressLogs: any[],
  dailyCheckins: any[],
  gamification: Gamification,
  subjects: any[],
  curriculumProgress: any,
  existingCustomLogs?: DailyHistoryLog[]
): DailyHistoryLog[] {
  const timeline: DailyHistoryLog[] = [];
  const start = parseDateOnly(startDateStr);
  const end = parseDateOnly(endDateStr);

  if (start > end) {
    return [];
  }

  const customLogsMap = new Map<string, DailyHistoryLog>();
  if (existingCustomLogs) {
    existingCustomLogs.forEach(log => {
      customLogsMap.set(log.date, log);
    });
  }

  // Iterate day by day
  const current = new Date(start);
  let accumulatedXP = 0;
  let runningStreak = 0;
  
  while (current <= end) {
    const dateStr = formatDateOnly(current);
    
    // Check if we have a manually saved or custom logged snapshot for this day
    if (customLogsMap.has(dateStr)) {
      timeline.push(customLogsMap.get(dateStr)!);
      current.setDate(current.getDate() + 1);
      continue;
    }

    // Otherwise, generate it dynamically from the student's records!
    
    // 1. Filter sessions for this date
    const daySessions = sessions.filter(s => s.timestamp.startsWith(dateStr));
    const studyMins = daySessions.reduce((acc, s) => acc + s.duration, 0) / 60;
    const deepWorkMins = daySessions
      .filter(s => s.method === 'Deep Work' || s.focusScore >= 80)
      .reduce((acc, s) => acc + s.duration, 0) / 60;
    const revisionMins = daySessions
      .filter(s => s.method === 'Revision')
      .reduce((acc, s) => acc + s.duration, 0) / 60;
    
    // Focus Score
    const focusScore = daySessions.length > 0
      ? Math.round(daySessions.reduce((acc, s) => acc + s.focusScore, 0) / daySessions.length)
      : 0;

    // 2. Filter grades/exams for this date
    const dayGrades = grades.filter(g => g.date === dateStr);
    const dayExams = exams.filter(e => e.date === dateStr && e.score !== undefined);

    const quizGrades = dayGrades.filter(g => g.category === 'Quiz' || g.category === 'Homework' || g.category === 'Assignment');
    const examGrades = dayGrades.filter(g => g.category === 'Exam' || g.category === 'Practice Test');

    const quizPercentages = quizGrades.map(g => (g.score / g.totalScore) * 100);
    const examPercentages = [
      ...examGrades.map(g => (g.score / g.totalScore) * 100),
      ...dayExams.map(e => (e.score! / e.totalScore) * 100)
    ];

    // AI exams (contains AI, ذكاء in title)
    const aiExamPercentages = [
      ...quizGrades.filter(g => g.title.toLowerCase().includes('ai') || g.title.includes('ذكاء') || g.title.includes('ذكائي')).map(g => (g.score / g.totalScore) * 100),
      ...examGrades.filter(g => g.title.toLowerCase().includes('ai') || g.title.includes('ذكاء') || g.title.includes('ذكائي')).map(g => (g.score / g.totalScore) * 100),
      ...dayExams.filter(e => e.title.toLowerCase().includes('ai') || e.title.includes('ذكاء') || e.title.includes('ذكائي')).map(e => (e.score! / e.totalScore) * 100)
    ];

    // 3. Burnout & Stress levels (scaled to 10)
    const dayBurnout = burnoutLogs.find(b => b.date === dateStr);
    const dayStress = stressLogs.find(s => s.date === dateStr);
    const dayCheckin = dailyCheckins.find(c => c.date === dateStr);

    let burnoutLevel = dayBurnout ? Math.round(dayBurnout.score / 10) : 0;
    let stressLevel = dayStress ? Math.round(dayStress.score / 10) : 0;

    // Fallbacks from daily checkin or study duration
    if (burnoutLevel === 0) {
      if (dayCheckin && dayCheckin.fatigue) {
        burnoutLevel = Math.round(dayCheckin.fatigue * 2);
      } else {
        burnoutLevel = studyMins > 360 ? 7 : studyMins > 240 ? 5 : studyMins > 120 ? 3 : (studyMins > 0 ? 1 : 0);
      }
    }
    if (stressLevel === 0) {
      if (dayCheckin && dayCheckin.stress) {
        stressLevel = Math.round(dayCheckin.stress * 2);
      } else {
        stressLevel = studyMins > 300 ? 6 : studyMins > 180 ? 4 : (studyMins > 0 ? 2 : 0);
      }
    }

    // 4. Lessons/Units/Subjects Completed ON or BEFORE this day
    let completedLessonsCount = 0;
    let completedUnitsCount = 0;
    let completedSubjectsCount = 0;

    if (curriculumProgress) {
      // Lessons
      completedLessonsCount = Object.keys(curriculumProgress).filter(lessonId => {
        const p = curriculumProgress[lessonId];
        if (p) {
          if (p.stages && p.stages[1] && p.stages[1].status === 'completed') {
            const studyDate = (p.stages[1].completedAt || p.lastUpdated || "").split('T')[0];
            return !studyDate || studyDate <= dateStr;
          }
          if (p.status === 'completed' || p.status === 'done') {
            if (p.lastStudied) {
              const studyDate = p.lastStudied.split('T')[0];
              return studyDate <= dateStr;
            }
            return true; // fallback
          }
        }
        return false;
      }).length;

      // Units and subjects completed calculation on or before this day
      subjects.forEach(subject => {
        let subjectCompleted = true;
        let unitsCompletedCount = 0;

        if (subject.units) {
          subject.units.forEach(unit => {
            let unitCompleted = true;
            if (unit.lessons && unit.lessons.length > 0) {
              unit.lessons.forEach(lesson => {
                const p = curriculumProgress[lesson.id];
                const completed = p && (
                  (p.stages && p.stages[1] && p.stages[1].status === 'completed' && (!p.stages[1].completedAt || p.stages[1].completedAt.split('T')[0] <= dateStr)) ||
                  ((p.status === 'completed' || p.status === 'done') && (!p.lastStudied || p.lastStudied.split('T')[0] <= dateStr))
                );
                if (!completed) {
                  unitCompleted = false;
                }
              });
            } else {
              unitCompleted = false;
            }

            if (unitCompleted) {
              unitsCompletedCount++;
            } else {
              subjectCompleted = false;
            }
          });
        } else {
          subjectCompleted = false;
        }

        completedUnitsCount += unitsCompletedCount;
        if (subjectCompleted && subject.units && subject.units.length > 0) {
          completedSubjectsCount++;
        }
      });
    }

    // 5. XP and level calculation
    const xpGainedToday = daySessions.length * 20 + quizGrades.length * 30 + dayExams.length * 50;
    accumulatedXP += xpGainedToday;
    const computedLevel = Math.max(1, Math.floor(Math.sqrt(accumulatedXP / 100)) + 1);

    // 6. Streak calculation
    if (studyMins > 0) {
      runningStreak++;
    } else {
      runningStreak = 0;
    }

    // 7. Consistency Score (studied days / last 7 days)
    const studiedDaysInLast7 = timeline.slice(-6).filter(d => d.studyMinutes > 0).length + (studyMins > 0 ? 1 : 0);
    const consistencyScore = Math.round((studiedDaysInLast7 / Math.min(timeline.length + 1, 7)) * 100);

    // 8. Memory Retention (estimate from spaced repetition reviews)
    let memoryRetention = 85; // baseline
    if (daySessions.length > 0) {
      const activeRecallSessionCount = daySessions.filter(s => s.method === 'Revision' || s.focusScore > 85).length;
      memoryRetention = Math.min(100, 75 + activeRecallSessionCount * 5 + runningStreak * 1);
    } else if (runningStreak === 0) {
      memoryRetention = Math.max(50, memoryRetention - 1); // forget curve
    }

    // 9. Productivity Score (composite)
    const tasksDoneToday = tasks.filter(t => t.status === 'done' && t.completedAt && t.completedAt.startsWith(dateStr)).length;
    const productivityScore = Math.min(
      100,
      Math.round(
        (studyMins > 0 ? 50 : 0) +
        (focusScore * 0.3) +
        (tasksDoneToday * 10) +
        (quizPercentages.length > 0 ? quizPercentages[0] * 0.1 : 0)
      )
    );

    // 10. Weak and Strong Chapters
    const weakConcepts: string[] = [];
    const strongConcepts: string[] = [];
    grades.forEach(g => {
      const gradeDate = g.date;
      if (gradeDate <= dateStr) {
        const percent = (g.score / g.totalScore) * 100;
        if (percent < 65 && g.weakChapters) {
          g.weakChapters.forEach(c => { if (!weakConcepts.includes(c)) weakConcepts.push(c); });
        } else if (percent >= 85 && g.strongChapters) {
          g.strongChapters.forEach(c => { if (!strongConcepts.includes(c)) strongConcepts.push(c); });
        }
      }
    });

    timeline.push({
      date: dateStr,
      studyMinutes: Number(studyMins.toFixed(1)),
      deepWorkMinutes: Number(deepWorkMins.toFixed(1)),
      revisionMinutes: Number(revisionMins.toFixed(1)),
      focusScore,
      burnoutLevel,
      stressLevel,
      memoryRetention,
      productivityScore,
      completedLessonsCount,
      completedUnitsCount,
      completedSubjectsCount,
      quizScores: quizPercentages,
      examScores: examPercentages,
      aiExamScores: aiExamPercentages,
      weakConcepts: weakConcepts.slice(0, 3), // top 3
      strongConcepts: strongConcepts.slice(0, 3),
      xp: xpGainedToday,
      level: computedLevel,
      consistencyScore,
      dailyStreak: runningStreak,
      weeklyStreak: Math.floor(runningStreak / 7),
      monthlyStreak: Math.floor(runningStreak / 30)
    });

    current.setDate(current.getDate() + 1);
  }

  return timeline;
}

/**
 * Aggregates logs inside a specific custom date range
 */
export function aggregateHistoryForRange(
  logs: DailyHistoryLog[],
  startDateStr: string,
  endDateStr: string
) {
  const rangeLogs = logs.filter(log => log.date >= startDateStr && log.date <= endDateStr);
  if (rangeLogs.length === 0) return null;

  const totalStudyMinutes = rangeLogs.reduce((acc, l) => acc + l.studyMinutes, 0);
  const totalDeepWorkMinutes = rangeLogs.reduce((acc, l) => acc + l.deepWorkMinutes, 0);
  const totalRevisionMinutes = rangeLogs.reduce((acc, l) => acc + l.revisionMinutes, 0);

  const avgFocusScore = Math.round(
    rangeLogs.filter(l => l.focusScore > 0).reduce((acc, l) => acc + l.focusScore, 0) /
    Math.max(1, rangeLogs.filter(l => l.focusScore > 0).length)
  );

  const avgBurnoutLevel = Number(
    (rangeLogs.reduce((acc, l) => acc + l.burnoutLevel, 0) / rangeLogs.length).toFixed(1)
  );
  
  const avgStressLevel = Number(
    (rangeLogs.reduce((acc, l) => acc + l.stressLevel, 0) / rangeLogs.length).toFixed(1)
  );

  const avgMemoryRetention = Math.round(
    rangeLogs.reduce((acc, l) => acc + l.memoryRetention, 0) / rangeLogs.length
  );

  const avgProductivityScore = Math.round(
    rangeLogs.reduce((acc, l) => acc + l.productivityScore, 0) / rangeLogs.length
  );

  // Take the final snapshots of completed items at the end date of range
  const lastLog = rangeLogs[rangeLogs.length - 1];
  const completedLessons = lastLog.completedLessonsCount;
  const completedUnits = lastLog.completedUnitsCount;
  const completedSubjects = lastLog.completedSubjectsCount;

  // Flatten and average quiz and exam scores
  const quizzes = rangeLogs.flatMap(l => l.quizScores);
  const avgQuizScore = quizzes.length > 0 ? Math.round(quizzes.reduce((acc, s) => acc + s, 0) / quizzes.length) : 80;

  const exams = rangeLogs.flatMap(l => l.examScores);
  const avgExamScore = exams.length > 0 ? Math.round(exams.reduce((acc, s) => acc + s, 0) / exams.length) : 75;

  const aiExams = rangeLogs.flatMap(l => l.aiExamScores);
  const avgAIExamScore = aiExams.length > 0 ? Math.round(aiExams.reduce((acc, s) => acc + s, 0) / aiExams.length) : 75;

  const weakConcepts = Array.from(new Set(rangeLogs.flatMap(l => l.weakConcepts))).slice(0, 5);
  const strongConcepts = Array.from(new Set(rangeLogs.flatMap(l => l.strongConcepts))).slice(0, 5);

  const totalXP = rangeLogs.reduce((acc, l) => acc + l.xp, 0);
  const avgConsistency = Math.round(rangeLogs.reduce((acc, l) => acc + l.consistencyScore, 0) / rangeLogs.length);

  return {
    studyHours: Number((totalStudyMinutes / 60).toFixed(1)),
    deepWorkHours: Number((totalDeepWorkMinutes / 60).toFixed(1)),
    revisionHours: Number((totalRevisionMinutes / 60).toFixed(1)),
    focusScore: avgFocusScore,
    burnoutTrend: avgBurnoutLevel,
    stressTrend: avgStressLevel,
    memoryRetention: avgMemoryRetention,
    productivity: avgProductivityScore,
    completedLessons,
    completedUnits,
    completedSubjects,
    quizScore: avgQuizScore,
    examScore: avgExamScore,
    aiExamScore: avgAIExamScore,
    weakConcepts,
    strongConcepts,
    xp: totalXP,
    levelProgress: lastLog.level,
    consistency: avgConsistency,
    dailyStreak: lastLog.dailyStreak,
    weeklyStreak: lastLog.weeklyStreak,
    monthlyStreak: lastLog.monthlyStreak
  };
}
