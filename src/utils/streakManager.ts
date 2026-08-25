/**
 * Streak Manager - Task-Based Academic Streak Calculation
 * 
 * Rules:
 * 1. A streak strictly requires tasks to be completed.
 * 2. To maintain or earn a streak, at least 75% (3/4) of the assigned tasks for the day must be completed.
 * 3. If 75% of tasks are completed consecutively day after day, the streak increases (+1).
 * 4. If a day passes without completing at least 75% of required tasks, the streak strictly resets to zero (0).
 */

import { PlannerActivity, Task, Gamification } from '../types';

export type StreakThreshold = 'three_fourths';

export interface DayTaskStats {
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  totalAssignedTasks: number;
  completedTasks: number;
  completionRatio: number; // 0 to 1
  completionPercentage: number; // 0 to 100
  meetsHalf: boolean; // >= 50%
  meetsThreeFourths: boolean; // >= 75%
  isStreakSecured: boolean; // strictly >= 75% (three_fourths)
  tasksRemainingForHalf: number;
  tasksRemainingForThreeFourths: number;
  hasTasks: boolean;
}

/**
 * Get date string in YYYY-MM-DD format (considering academic 4:00 AM cutoff)
 */
export function getAcademicDateString(date: Date = new Date()): string {
  const d = new Date(date);
  // Before 4 AM counts as part of the previous night's study session
  if (d.getHours() < 4) {
    d.setDate(d.getDate() - 1);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate task completion stats for a specific date
 */
export function calculateDayTaskStats(
  targetDate: Date | string = new Date(),
  activities: PlannerActivity[] = [],
  tasks: Task[] = [],
  threshold: StreakThreshold = 'three_fourths',
  isTodayDate: boolean = true
): DayTaskStats {
  const dateObj = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const dateStr = typeof targetDate === 'string' ? targetDate.split('T')[0] : getAcademicDateString(targetDate);
  const dayOfWeek = dateObj.getDay();
  const todayStr = getAcademicDateString(new Date());
  const isActualToday = dateStr === todayStr;

  // 1. Collect planner activities assigned to this day
  const dayActivities = activities.filter((act) => {
    const actWithDate = act as PlannerActivity & { date?: string; completedAt?: string };
    if (actWithDate.date) {
      return actWithDate.date === dateStr || actWithDate.date.startsWith(dateStr);
    }
    if (!isActualToday) {
      // For past days, only match if it was specifically completed or scheduled on that date
      if (actWithDate.completedAt && actWithDate.completedAt.startsWith(dateStr)) return true;
      return act.dayOfWeek === dayOfWeek;
    }
    return act.dayOfWeek === dayOfWeek;
  });

  // 2. Collect tasks with deadline or completion matching this date
  const dayTasks = tasks.filter((t) => {
    const tAny = t as any;
    if (t.deadline) {
      return t.deadline === dateStr || t.deadline.startsWith(dateStr);
    }
    if (tAny.completedAt && tAny.completedAt.startsWith(dateStr)) {
      return true;
    }
    if (tAny.createdAt && tAny.createdAt.split('T')[0] === dateStr) {
      return true;
    }
    if (isActualToday && (t.status === 'done' || (t.status as string) === 'completed')) {
      return true;
    }
    return false;
  });

  // Count totals and completed items
  const activityCompletedCount = dayActivities.filter((a) => {
    const aAny = a as any;
    if (!isActualToday && aAny.completedAt) {
      return aAny.completedAt.startsWith(dateStr) && a.completed;
    }
    return a.completed || aAny.completionStatus === 'completed';
  }).length;

  const taskCompletedCount = dayTasks.filter((t) => {
    const tAny = t as any;
    if (!isActualToday && tAny.completedAt) {
      return tAny.completedAt.startsWith(dateStr) && (t.status === 'done' || (t.status as string) === 'completed');
    }
    return t.status === 'done' || (t.status as string) === 'completed';
  }).length;

  const totalAssignedTasks = dayActivities.length + dayTasks.length;
  const completedTasks = activityCompletedCount + taskCompletedCount;

  const completionRatio = totalAssignedTasks > 0 ? completedTasks / totalAssignedTasks : 0;
  const completionPercentage = Math.round(completionRatio * 100);

  const meetsHalf = totalAssignedTasks > 0 ? completionRatio >= 0.5 : completedTasks > 0;
  // Strict 75% requirement: Must have at least 1 task completed and achieve >= 75%
  const meetsThreeFourths = totalAssignedTasks > 0 
    ? (completionRatio >= 0.75 && completedTasks > 0)
    : completedTasks > 0;

  // Strict 75% streak rule: Streak is earned ONLY when 75% is achieved
  const isStreakSecured = meetsThreeFourths;

  const requiredForHalf = Math.ceil(totalAssignedTasks * 0.5);
  const requiredForThreeFourths = Math.max(1, Math.ceil(totalAssignedTasks * 0.75));

  const tasksRemainingForHalf = Math.max(0, requiredForHalf - completedTasks);
  const tasksRemainingForThreeFourths = Math.max(0, requiredForThreeFourths - completedTasks);

  return {
    dateStr,
    dayOfWeek,
    totalAssignedTasks,
    completedTasks,
    completionRatio,
    completionPercentage,
    meetsHalf,
    meetsThreeFourths,
    isStreakSecured,
    tasksRemainingForHalf,
    tasksRemainingForThreeFourths,
    hasTasks: totalAssignedTasks > 0
  };
}

/**
 * Compute historical consecutive streak based on strict 75% task completion
 */
export function computeTaskBasedStreak(
  activities: PlannerActivity[] = [],
  tasks: Task[] = [],
  threshold: StreakThreshold = 'three_fourths',
  maxDaysToCheck: number = 60
): {
  streak: number;
  todayStats: DayTaskStats;
  yesterdayStats: DayTaskStats;
  isTodaySecured: boolean;
  history: { dateStr: string; success: boolean; stats: DayTaskStats }[];
} {
  const todayDateStr = getAcademicDateString(new Date());
  const todayStats = calculateDayTaskStats(todayDateStr, activities, tasks, 'three_fourths', true);

  // Compute yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateStr = getAcademicDateString(yesterday);
  const yesterdayStats = calculateDayTaskStats(yesterdayDateStr, activities, tasks, 'three_fourths', false);

  const history: { dateStr: string; success: boolean; stats: DayTaskStats }[] = [];

  // Check today first
  const todaySecured = todayStats.isStreakSecured;
  history.push({
    dateStr: todayDateStr,
    success: todaySecured,
    stats: todayStats
  });

  // Build backwards history
  let streak = 0;

  // If today is already secured (>=75%), start with streak = 1; otherwise if yesterday was secured, streak is maintained from yesterday
  if (todaySecured) {
    streak = 1;
  }

  let prevDate = new Date();
  if (todaySecured) {
    prevDate.setDate(prevDate.getDate() - 1);
  } else {
    // Today not yet secured: check if yesterday was secured (>= 75%)
    if (yesterdayStats.isStreakSecured) {
      streak = 1;
      prevDate.setDate(prevDate.getDate() - 2);
    } else {
      // If 75% was not achieved yesterday, the streak strictly resets to zero (0)
      streak = 0;
      return {
        streak: 0,
        todayStats,
        yesterdayStats,
        isTodaySecured: todaySecured,
        history
      };
    }
  }

  // Traverse backwards day by day: streak continues only if each consecutive day achieved >= 75%
  for (let i = 0; i < maxDaysToCheck; i++) {
    const checkDateStr = getAcademicDateString(prevDate);
    const dayStats = calculateDayTaskStats(checkDateStr, activities, tasks, 'three_fourths', false);

    history.push({
      dateStr: checkDateStr,
      success: dayStats.isStreakSecured,
      stats: dayStats
    });

    if (dayStats.isStreakSecured) {
      streak++;
      prevDate.setDate(prevDate.getDate() - 1);
    } else {
      // Day passed without achieving 75% tasks -> streak breaks here
      break;
    }
  }

  return {
    streak,
    todayStats,
    yesterdayStats,
    isTodaySecured: todaySecured,
    history
  };
}

/**
 * Evaluate and update Gamification streak state when a task is toggled or checked
 */
export function evaluateGamificationStreak(
  currentGamification: Gamification,
  activities: PlannerActivity[] = [],
  tasks: Task[] = [],
  threshold: StreakThreshold = 'three_fourths'
): Gamification {
  const result = computeTaskBasedStreak(activities, tasks, 'three_fourths');
  const todayDateStr = result.todayStats.dateStr;

  return {
    ...currentGamification,
    streak: result.streak,
    streakThreshold: 'three_fourths',
    lastCompletedDate: result.isTodaySecured ? todayDateStr : currentGamification.lastCompletedDate
  };
}
