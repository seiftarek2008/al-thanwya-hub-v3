/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  stream: 'math' | 'science' | 'literature';
  targetPercentage: number;
  profilePicture?: string;
  createdAt: string;
  curriculumTrack?: 'arabic' | 'languages';
  academicYear?: 'first' | 'second' | 'third';
}

export interface Subject {
  id: string;
  name: string;
  color: string; // Hex or Tailwind color class
  icon: string;  // Lucide icon name
  totalMinutes: number;
  targetMinutesPerWeek: number;
  maxScore?: number;
  branches?: string[];
  difficultyLevel?: string;
  confidenceScore?: number;
  lessonType?: 'online' | 'center'; // أونلاين أم في سنتر
  studyMode?: 'online' | 'center'; // أونلاين أم في سنتر
  centerDay?: number; // يوم السنتر (0 = الأحد, ... 6 = السبت)
  centerStartTime?: string; // وقت بدء السنتر "HH:MM"
  centerTime?: string; // وقت بدء السنتر "HH:MM"
  centerEndTime?: string; // وقت انتهاء السنتر "HH:MM"
  centerLocation?: string; // عنوان أو اسم السنتر
  stageAverages?: { [stage: string]: number };
  stageLogs?: { stage: string; actualMinutes: number; timestamp: string; }[];
  completionPercent?: number;
  chapterCount?: number;
  currentChapterCount?: number;
  lessonsCompleted?: number;
  lessonsRemaining?: number;
  classSheetsCompleted?: number;
  homeworkCompleted?: number;
  activeRecallSessions?: number;
  weeklyReviews?: number;
  monthlyReviews?: number;
  examReviews?: number;
  totalStudyHours?: number;
  avgLessonDuration?: number;
  avgRecallDuration?: number;
  avgWorksheetDuration?: number;
  avgHomeworkDuration?: number;
  avgReviewDuration?: number;
  avgMonthlyReviewDuration?: number;
  weeklyHistory?: {
    weekIndex: number;
    actualMinutes: number;
    completion: 'yes' | 'partially' | 'no';
    difficulty: number;
    targetMinutes: number;
    confidence?: number;
    lessonsCompletedCount?: number;
    sheetsCompletedCount?: number;
    homeworkCompletedCount?: number;
    reviewsCompletedCount?: number;
    activeRecallCount?: number;
  }[];
}

export type StudyMethod = 'Pomodoro' | 'Deep Work' | 'Revision' | 'Practice Questions';

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  duration: number; // in seconds
  durationMinutes?: number;
  date?: string;
  academicWeek?: number;
  method: StudyMethod;
  focusScore: number; // 0 to 100
  cognitiveEnergyBefore: number; // 0 to 100
  cognitiveEnergyAfter: number; // 0 to 100
  timestamp: string; // ISO string
}

export interface Task {
  id: string;
  title: string;
  subjectId: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'done';
  completed?: boolean;
  deadline: string; // YYYY-MM-DD
  completedAt?: string; // ISO string
}

export interface Goal {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly';
  category: 'hours' | 'tasks';
  targetValue: number; // e.g., 4 hours, or 5 tasks
  currentValue: number;
  deadline: string; // YYYY-MM-DD
}

export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  date: string; // YYYY-MM-DD
  score?: number; // actual grade
  totalScore: number; // max possible grade (e.g. 60 or 40 for Thanaweya Amma)
  maxScore?: number;
  academicWeek?: number;
  preparationLevel: 'high' | 'medium' | 'low';
  priority?: 'high' | 'medium' | 'low';
  expectedDifficulty?: 'high' | 'medium' | 'low';
  type?: 'mock' | 'homework' | 'quiz';
  topScore?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  type?: 'general' | 'quiz' | 'flashcard' | 'summary' | 'plan';
}

export interface NeuroscienceStats {
  burnoutRisk: 'low' | 'moderate' | 'high';
  breakRecommendations: string[];
  optimalStudyHours: string[];
  dailyCognitiveEnergy: number; // 0 to 100
  consistencyScore: number; // 0 to 100
  spacedRepetitionList: {
    subjectName: string;
    topicName: string;
    nextReviewDate: string; // YYYY-MM-DD
    intervalDays: number;
  }[];
}

export interface PlannerActivity {
  id: string;
  title: string;
  lessonName?: string;
  dayOfWeek: number; // 0 to 6 (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  priority: 'high' | 'medium' | 'low';
  category: 'Study' | 'Revision' | 'Homework' | 'Assignment' | 'Exam' | 'Health/Gym' | 'Family/Personal' | 'Free Time' | 'Active Recall' | 'Lesson' | 'StudyMethod' | 'ActiveRecall';
  subjectId?: string; // Optional linked subject
  reminder?: boolean;
  completed?: boolean;
  missed?: boolean;
  missedReason?: string;
  notes?: string;
  gradeScore?: number;
  gradeTotal?: number;
  expectedDuration?: string;
  todayGoal?: string;
  targetGoal?: string;
  targetCompletedEarly?: boolean;
  targetMetTime?: string;
  bufferMinutes?: number;
  dayPart?: 'Morning' | 'Afternoon' | 'Evening';
  partIndex?: number; // 0 = Part 1, 1 = Part 2, 2 = Part 3
  timeBlock?: string;
  currentStage?: string;
  lessonPart?: 'lesson' | 'classwork' | 'class_sheet' | 'homework' | 'revision' | 'custom' | string; // مرحلة المادة (الشرح/كلاس ورك/واجب/مراجعة/مخصص)
  customStageName?: string; // اسم مرحلة إضافية مخصصة
  studyMode?: 'online' | 'center'; // أونلاين أم حضور مباشر بالسنتر/الفصل
  onlineTimerTool?: 'pomodoro' | 'stopwatch' | 'none'; // أداة التايمر المفضلة في الأونلاين
  actualInPersonMinutes?: number; // تسجيل مدة الحضور الفعلية في السنتر/الفصل بعد الانتهاء
  actualDurationMinutes?: number;
  remainingStageTime?: string;
  weeklyProgressPercent?: number;
  partiallyCompletedPercent?: number;
  incompleteReason?: string;
  voiceNoteId?: string;
}

export interface VoiceNote {
  id: string;
  subjectId: string;
  subjectName: string;
  chapterName: string;
  lessonName: string;
  recordingType?: 'summary' | 'full_explanation' | 'review' | string;
  note?: string;
  audioDataUri?: string; // base64 or blob URL
  durationSeconds: number; // e.g. 762 (12:42)
  date: string; // YYYY-MM-DD
  academicWeek?: number;
  sessionId?: string;
  activityId?: string;
  isFavorite?: boolean;
  createdAt: string; // ISO string
}

export interface SleepLog {
  id: string;
  date: string; // YYYY-MM-DD
  bedtime: string; // "HH:MM"
  waketime: string; // "HH:MM"
  durationHours: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface ScreenTimeLog {
  id: string;
  date: string; // YYYY-MM-DD
  minutes: number;
}

export interface DailyCheckin {
  id: string;
  date: string; // YYYY-MM-DD
  focusLevel: number; // 1 to 5
  motivation: number; // 1 to 5
  stress: number; // 1 to 5
  fatigue: number; // 1 to 5
  sleepHours?: number;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  energy?: number; // 1 to 5
  phoneUsage?: number; // screenMinutes/minutes of phone usage
  wakeupTime?: string; // HH:MM
}

export interface GradeRecord {
  id: string;
  subjectId: string;
  category: 'Homework' | 'Quiz' | 'Exam' | 'Practice Test' | 'Assignment';
  title: string;
  score: number;
  totalScore: number;
  date: string; // YYYY-MM-DD
  weakChapters?: string[];
  strongChapters?: string[];
  branch?: string;
}


export interface Countdown {
  id: string;
  title: string;
  emoji: string;
  category: string;
  deadline: string; // ISO string or YYYY-MM-DDTHH:MM
  color: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminder: 'none' | '10m' | '1h' | '1d' | '1w';
  pinned?: boolean;
}

export interface CustomTimer {
  id: string;
  name: string;
  duration: number; // in seconds
  category: StudyMethod;
  color: string;
  icon: string;
  sound: string;
  autoRepeat: boolean;
}

export interface BurnoutLog {
  id: string;
  date: string; // YYYY-MM-DD
  score: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  confidence: number; // percentage
  reasons: string[];
  recommendations: string[];
}

export interface StressLog {
  id: string;
  date: string; // YYYY-MM-DD
  score: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number; // percentage
  factors: string[];
  recommendations: string[];
}

export interface NotificationSettings {
  emailNotif: boolean;
  browserNotif: boolean;
  morningSummary: boolean;
  nightReview: boolean;
  hydrateReminder: boolean;
  breakReminder: boolean;
  sleepReminder: boolean;
}

// LIFESTYLE & SCHEDULING PROFILE
export interface FixedCommitment {
  id: string;
  name: string;
  category: string; // e.g. "School", "Lessons", "Gym", "Work"
  days: number[]; // 0-6
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  location?: string;
  transportBefore?: number; // in minutes
  transportAfter?: number; // in minutes
  priority: 'high' | 'medium' | 'low';
}

export interface SleepSchedule {
  bedtime: string; // "HH:MM"
  wakeupTime: string; // "HH:MM"
  minDuration: number; // in hours
  targetDuration: number; // in hours
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface FlexibleActivity {
  id: string;
  name: string; // e.g. "Study", "Revision", "Reading", "Programming"
  targetDuration: number; // in hours per week
  priority: 'high' | 'medium' | 'low';
  frequency?: number;
  sessionDuration?: number; // in minutes
  travelTimeBefore?: number; // in minutes
  travelTimeAfter?: number; // in minutes
  preferredDays?: number[]; // days of week
  preferredTime?: string; // "HH:MM"
  canBeMoved?: boolean;
}

export interface PersonalPreferences {
  bestStudyTime?: 'morning' | 'afternoon' | 'night';
  worstStudyTime?: 'morning' | 'afternoon' | 'night';
  sessionDuration?: number; // in minutes
  breakDuration?: number; // in minutes
  maxStudyHoursPerDay?: number;
  maxDeepWorkSessions?: number;
  difficultSubjects?: string[]; // subjectIds
  avoidNightSubjects?: string[]; // subjectIds
  maxFocusSubjects?: string[]; // subjectIds
  weeklyDayOff?: number; // 0-6 where 0 is Sunday, or -1 for none
  maxFocusSubjectsPerDay?: number; // 1 to 3
}

export interface EnergyLifestyle {
  exerciseFrequency: 'none' | '1-2' | '3-4' | '5+';
  workoutIntensity: 'low' | 'medium' | 'high';
  dailyWalkingMinutes: number;
  screenTimeMinutes: number;
  coffeeCups: number;
  waterIntakeLiters: number;
  mealsCount: number;
  mentalEnergyLevel: number; // 1-10
  relaxationActivities: string[];
}

export interface WeeklyGoals {
  studyHours: number;
  revisionHours: number;
  exerciseHours: number;
  hobbyHours: number;
  restHours: number;
  sleepHours: number;
}

export interface SubjectLearning {
  subjectId: string;
  repeatDifficultCount: number;
  shorterSessionsSuggested?: boolean;
  longerBreaksSuggested?: boolean;
  startEarlierSuggested?: boolean;
}

export interface DayPartConfig {
  morningStart: string;   // e.g. "06:00"
  morningEnd: string;     // e.g. "11:59"
  afternoonStart: string; // e.g. "12:00"
  afternoonEnd: string;   // e.g. "16:59"
  eveningStart: string;   // e.g. "17:00"
  eveningEnd: string;     // e.g. "23:00"
}

export interface LifestyleProfile {
  fixedCommitments: FixedCommitment[];
  sleepSchedule: SleepSchedule;
  flexibleActivities: FlexibleActivity[];
  personalPreferences: PersonalPreferences;
  energyLifestyle: EnergyLifestyle;
  weeklyGoals: WeeklyGoals;
  subjectLearnings?: SubjectLearning[];
  dayPartConfig?: DayPartConfig;
}

// SMART REWARD SYSTEM & GAMIFICATION
export interface Mission {
  id: string;
  title: string;
  target: number;
  current: number;
  xpReward: number;
  coinsReward: number;
  completed: boolean;
  category: 'daily' | 'weekly';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  unlockedAt?: string;
  xpReward: number;
  coinsReward: number;
  icon: string;
}

export interface Gamification {
  xp: number;
  coins: number;
  streak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
  level: number;
  achievements: Achievement[];
  dailyMissions: Mission[];
  weeklyMissions: Mission[];
}

export interface WeeklyScheduleData {
  weekId: string;
  generatedAt: string;
  version: number;
  schedule: PlannerActivity[];
  lastUpdated: number;
  aiMetadata?: {
    reasoning?: string;
    metrics?: any;
    estimations?: any;
    feasibilityReport?: any;
  };
  hash?: string;
}

export interface AppStudyState {
  subjects: Subject[];
  sessions: StudySession[];
  tasks: Task[];
  goals: Goal[];
  exams: Exam[];
  chatHistory: ChatMessage[];
  stats: NeuroscienceStats;
  plannerActivities?: PlannerActivity[];
  weeklySchedule?: WeeklyScheduleData | null;
  sleepLogs?: SleepLog[];
  screenTimeLogs?: ScreenTimeLog[];
  dailyCheckins?: DailyCheckin[];
  grades?: GradeRecord[];
  countdowns?: Countdown[];
  customTimers?: CustomTimer[];
  burnoutLogs?: BurnoutLog[];
  stressLogs?: StressLog[];
  notifSettings?: NotificationSettings;
  lifestyleProfile?: LifestyleProfile;
  gamification?: Gamification;
  thanaweyaStartDate?: string;
  spacedRepetitionReviews?: SpacedRepetitionItem[];
  customHistoryLogs?: DailyHistoryLog[];
  currentAcademicWeek?: number;
  academicHistory?: {
    weekIndex: number;
    plannerActivities: PlannerActivity[];
    reflections: {
      subjectId: string;
      actualHours: number;
      completion: 'yes' | 'partially' | 'no';
      difficulty: number;
      lessonsCompletedCount?: number;
      sheetsCompletedCount?: number;
      homeworkCompletedCount?: number;
      reviewsCompletedCount?: number;
      activeRecallCount?: number;
      confidence?: number;
    }[];
    timestamp: string;
  }[];
  carryOverActivities?: PlannerActivity[];
}

export interface SpacedRepetitionMilestone {
  daysFromStart: number;
  targetDate: string; // YYYY-MM-DD
  status: 'pending' | 'completed' | 'missed';
  completedAt?: string; // YYYY-MM-DD
  actualReviewDate?: string; // YYYY-MM-DD
  score?: number;
  rescheduledReason?: string;

  // Memory Timeline & Long-Term Retention Fields
  lessonId: string;
  subject: string;
  unit: string;
  reviewNumber: number;
  plannedReviewDate: string; // YYYY-MM-DD (matches targetDate)
  memoryStrength: number; // 0-100%
  retentionEstimate: number; // 0-100%
  priority: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: number | null; // 1-5 score, null if pending
}

export interface SpacedRepetitionItem {
  id: string;
  lessonId: string;
  lessonName: string;
  subjectId: string;
  subjectName: string;
  unitName: string;
  studiedDate?: string; // YYYY-MM-DD (Date the lesson was originally explained/studied)
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: string; // YYYY-MM-DD
  history: {
    reviewDate?: string;
    date?: string;
    confidenceScore?: number;
    score?: number;
    adjustedInterval?: number;
    intervalDays?: number;
    reviewType?: string;
  }[];
  milestones: SpacedRepetitionMilestone[];
  priority: 'high' | 'medium' | 'low';
  memoryStrength?: number; // Current memory strength (0-100%)
  retentionEstimate?: number; // Current retention estimate (0-100%)
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface DailyHistoryLog {
  date: string; // YYYY-MM-DD
  studyMinutes: number;
  deepWorkMinutes: number;
  revisionMinutes: number;
  focusScore: number;
  burnoutLevel: number;
  stressLevel: number;
  memoryRetention: number;
  productivityScore: number;
  completedLessonsCount: number;
  completedUnitsCount: number;
  completedSubjectsCount: number;
  quizScores: number[]; // quiz percentages
  examScores: number[]; // exam percentages
  aiExamScores: number[]; // AI exam percentages
  weakConcepts: string[];
  strongConcepts: string[];
  xp: number;
  level: number;
  consistencyScore: number;
  dailyStreak: number;
  weeklyStreak: number;
  monthlyStreak: number;
}

export interface BugReport {
  id: string;
  category: 'date_formatting' | 'sync_errors' | 'ui_overlaps' | 'focus_timer' | 'stats_graphs' | 'curriculum_tasks' | 'gamification_xp' | 'other';
  title: string;
  scenario?: string; // Description of the scenario being performed when the error occurred
  severity: 'low' | 'medium' | 'high' | 'critical';
  status?: 'submitted' | 'under_review' | 'resolved';
  environmentInfo?: {
    browser?: string;
    screenSize?: string;
    academicWeek?: number;
    stream?: string;
    curriculumTrack?: string;
    academicYear?: string;
    isOnline?: boolean;
    timestamp?: string;
  };
  createdAt: string;
  userEmail?: string;
  userName?: string;
}

export interface LessonStageProgress {
  status: 'not_started' | 'scheduled' | 'completed';
  completedAt?: string; // YYYY-MM-DD or ISO
  confidenceScore?: number; // 1-5 score for active recall / spaced reviews
  score?: number; // grade score for sheets/homework (e.g. out of 10)
  totalScore?: number; // max score for sheets/homework
  scheduledDate?: string; // YYYY-MM-DD
}

export interface LessonProgress {
  lessonId: string;
  lessonName: string;
  subjectId: string;
  subjectName: string;
  unitName: string;
  currentStage: 1 | 2 | 3 | 4 | 5 | 6; // 1: New Lesson, 2: Immediate Active Recall, 3: Class Sheet, 4: Homework, 5: First Spaced Review, 6: Long-Term Review
  stages: {
    1: LessonStageProgress; // New Lesson
    2: LessonStageProgress; // Immediate Active Recall
    3: LessonStageProgress; // Class Sheet
    4: LessonStageProgress; // Homework
    5: LessonStageProgress; // First Spaced Review
    6: LessonStageProgress; // Long-Term Review
  };
  confidenceScore: number; // overall average confidence or performance rating
  mastered: boolean; // true when all stages are completed
  lastUpdated: string;
}

