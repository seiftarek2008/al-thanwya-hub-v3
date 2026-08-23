/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { setLocalAcademicData, enqueueOfflineAction } from './offlineDb';

export interface FocusSessionLog {
  id: string;
  timestamp: string;
  subjectName: string;
  durationMinutes: number;
  interruptionsCount: number;
  totalDistractionSeconds: number;
  longestUninterruptedSeconds: number;
  focusScore: number;
  classification: string;
  wasCleanSession: boolean;
}

const FOCUS_STATS_KEY = 'thanaweya_focus_stats_v12.5';

export function getStoredFocusStats(): FocusSessionLog[] {
  try {
    const raw = localStorage.getItem(FOCUS_STATS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveFocusSessionLog(log: Omit<FocusSessionLog, 'id' | 'timestamp'>): FocusSessionLog {
  const existing = getStoredFocusStats();
  const newLog: FocusSessionLog = {
    ...log,
    id: `focus_log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString()
  };
  const updated = [newLog, ...existing];
  try {
    localStorage.setItem(FOCUS_STATS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to save focus log to localStorage:", e);
  }

  // Dual-Save to IndexedDB and enqueue offline sync item
  setLocalAcademicData('focus_stats', updated);
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOfflineAction('focus_stats', newLog);
  }

  return newLog;
}

export function getWeeklyFocusMetrics() {
  const logs = getStoredFocusStats();
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentLogs = logs.filter(l => new Date(l.timestamp).getTime() >= oneWeekAgo);

  const totalSessions = recentLogs.length;
  const totalInterruptions = recentLogs.reduce((acc, l) => acc + (l.interruptionsCount || 0), 0);
  const totalDistractionMins = Math.round(recentLogs.reduce((acc, l) => acc + (l.totalDistractionSeconds || 0), 0) / 60);
  const longestUninterruptedMins = Math.round(Math.max(0, ...recentLogs.map(l => l.longestUninterruptedSeconds || 0)) / 60);
  const cleanSessionsCount = recentLogs.filter(l => l.wasCleanSession || l.interruptionsCount === 0).length;
  const avgFocusScore = totalSessions > 0 ? Math.round(recentLogs.reduce((acc, l) => acc + (l.focusScore || 100), 0) / totalSessions) : 95;

  return {
    totalSessions,
    totalInterruptions,
    avgInterruptionsPerSession: totalSessions > 0 ? (totalInterruptions / totalSessions).toFixed(1) : '0',
    totalDistractionMins,
    longestUninterruptedMins,
    cleanSessionsCount,
    cleanSessionsRatio: totalSessions > 0 ? Math.round((cleanSessionsCount / totalSessions) * 100) : 100,
    avgFocusScore
  };
}
