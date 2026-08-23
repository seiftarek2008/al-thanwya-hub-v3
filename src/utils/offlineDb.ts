/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AI Scheduler V13 — IndexedDB Local-First Database & Offline Sync Queue Engine
 */

const DB_NAME = 'ThanaweyaStudyDB_V13';
const DB_VERSION = 1;

export const STORES = {
  ACADEMIC_STORE: 'academic_store',
  VOICE_AUDIO_BLOBS: 'voice_audio_blobs',
  OFFLINE_SYNC_QUEUE: 'offline_sync_queue',
};

export interface OfflineQueueItem {
  id: string;
  timestamp: number;
  type: 
    | 'session_complete'
    | 'task_update'
    | 'weekly_reflection'
    | 'voice_note'
    | 'stage_duration_update'
    | 'focus_stats'
    | 'profile_update'
    | 'planner_update';
  payload: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
}

// Promisified IndexedDB initialization
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = request.result;
      
      // Store 1: Academic Data Key-Value Store
      if (!db.objectStoreNames.contains(STORES.ACADEMIC_STORE)) {
        db.createObjectStore(STORES.ACADEMIC_STORE);
      }

      // Store 2: Voice Audio Blobs / Data URIs
      if (!db.objectStoreNames.contains(STORES.VOICE_AUDIO_BLOBS)) {
        db.createObjectStore(STORES.VOICE_AUDIO_BLOBS, { keyPath: 'id' });
      }

      // Store 3: Offline Sync Queue
      if (!db.objectStoreNames.contains(STORES.OFFLINE_SYNC_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.OFFLINE_SYNC_QUEUE, { keyPath: 'id' });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// General Key-Value Getter
export async function getLocalAcademicData<T = any>(key: string, fallback: T): Promise<T> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.ACADEMIC_STORE, 'readonly');
      const store = tx.objectStore(STORES.ACADEMIC_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result !== undefined && req.result !== null) {
          resolve(req.result as T);
        } else {
          resolve(fallback);
        }
      };
      req.onerror = () => resolve(fallback);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Get error for key ${key}:`, err);
    return fallback;
  }
}

// General Key-Value Setter
export async function setLocalAcademicData(key: string, value: any): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.ACADEMIC_STORE, 'readwrite');
      const store = tx.objectStore(STORES.ACADEMIC_STORE);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Set error for key ${key}:`, err);
    return false;
  }
}

// Clear all local IndexedDB stores completely (called upon account deletion or full reset)
export async function clearAllLocalAcademicData(): Promise<boolean> {
  try {
    const db = await openDatabase();
    const storeNames = [STORES.ACADEMIC_STORE, STORES.VOICE_AUDIO_BLOBS, STORES.OFFLINE_SYNC_QUEUE];
    return new Promise((resolve) => {
      const tx = db.transaction(storeNames, 'readwrite');
      for (const name of storeNames) {
        if (db.objectStoreNames.contains(name)) {
          tx.objectStore(name).clear();
        }
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('[IndexedDB] Clear error:', err);
    return false;
  }
}

// Daily Check-in Offline Store Helpers
export function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function mergeDailyCheckins(localList: any[] = [], remoteList: any[] = []): any[] {
  const map = new Map<string, any>();
  
  if (Array.isArray(localList)) {
    for (const c of localList) {
      if (c && c.date) {
        map.set(c.date, c);
      }
    }
  }

  if (Array.isArray(remoteList)) {
    for (const c of remoteList) {
      if (c && c.date) {
        const existing = map.get(c.date);
        if (!existing) {
          map.set(c.date, c);
        } else {
          const localTime = existing.timestamp || (existing.completedAt ? new Date(existing.completedAt).getTime() : 0);
          const remoteTime = c.timestamp || (c.completedAt ? new Date(c.completedAt).getTime() : 0);
          if (remoteTime >= localTime) {
            map.set(c.date, { ...existing, ...c });
          } else {
            map.set(c.date, { ...c, ...existing });
          }
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getOfflineDailyCheckins(): Promise<any[]> {
  try {
    const dedicated = await getLocalAcademicData<any[]>('daily_checkins', []);
    const studyState = await getLocalAcademicData<any>('study_state', null);
    const studyStateCheckins = Array.isArray(studyState?.dailyCheckins) ? studyState.dailyCheckins : [];
    
    return mergeDailyCheckins(dedicated, studyStateCheckins);
  } catch (err) {
    console.warn('[IndexedDB] Failed to load daily_checkins:', err);
    return [];
  }
}

export async function saveOfflineDailyCheckins(checkins: any[]): Promise<boolean> {
  try {
    await setLocalAcademicData('daily_checkins', checkins);
    const studyState = await getLocalAcademicData<any>('study_state', null);
    if (studyState) {
      studyState.dailyCheckins = checkins;
      await setLocalAcademicData('study_state', studyState);
    }
    return true;
  } catch (err) {
    console.warn('[IndexedDB] Failed to save daily_checkins:', err);
    return false;
  }
}

// Save Voice Audio Blob locally
export async function saveVoiceAudioBlob(id: string, audioData: Blob | string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.VOICE_AUDIO_BLOBS, 'readwrite');
      const store = tx.objectStore(STORES.VOICE_AUDIO_BLOBS);
      const req = store.put({ id, audioData, timestamp: Date.now() });
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('[IndexedDB] Save voice audio error:', err);
    return false;
  }
}

// Get Voice Audio Blob
export async function getVoiceAudioBlob(id: string): Promise<Blob | string | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.VOICE_AUDIO_BLOBS, 'readonly');
      const store = tx.objectStore(STORES.VOICE_AUDIO_BLOBS);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result.audioData);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error('[IndexedDB] Get voice audio error:', err);
    return null;
  }
}

// Queue Management: Add pending item
export async function enqueueOfflineAction(type: OfflineQueueItem['type'], payload: any): Promise<OfflineQueueItem> {
  const item: OfflineQueueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    type,
    payload,
    status: 'pending',
    retryCount: 0,
  };

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.OFFLINE_SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.OFFLINE_SYNC_QUEUE);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB Queue] Failed to enqueue action:', err);
  }

  return item;
}

// Queue Management: Get all pending items sorted by timestamp (oldest first)
export async function getPendingSyncQueue(): Promise<OfflineQueueItem[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.OFFLINE_SYNC_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.OFFLINE_SYNC_QUEUE);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result || []) as OfflineQueueItem[];
        // Filter pending or failed and sort oldest first
        const pending = items
          .filter((i) => i.status === 'pending' || i.status === 'failed')
          .sort((a, b) => a.timestamp - b.timestamp);
        resolve(pending);
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('[IndexedDB Queue] Get pending error:', err);
    return [];
  }
}

// Queue Management: Mark synced or remove
export async function dequeueOfflineAction(id: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.OFFLINE_SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.OFFLINE_SYNC_QUEUE);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('[IndexedDB Queue] Delete action error:', err);
    return false;
  }
}

// Queue Management: Update item status / retry
export async function updateQueueItemStatus(id: string, status: OfflineQueueItem['status']): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORES.OFFLINE_SYNC_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.OFFLINE_SYNC_QUEUE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) {
        const updated = {
          ...getReq.result,
          status,
          retryCount: (getReq.result.retryCount || 0) + (status === 'failed' ? 1 : 0),
        };
        store.put(updated);
      }
    };
  } catch (err) {
    console.warn('[IndexedDB Queue] Update status error:', err);
  }
}

// Count remaining pending queue items
export async function getQueuePendingCount(): Promise<number> {
  const pending = await getPendingSyncQueue();
  return pending.length;
}

// ==========================================
// Weekly Schedule Offline Store & Sync Helpers
// ==========================================

export interface WeeklyScheduleData {
  weekId: string;
  generatedAt: string;
  version: number;
  schedule: any[];
  lastUpdated: number;
  aiMetadata?: {
    reasoning?: string;
    metrics?: any;
    estimations?: any;
    feasibilityReport?: any;
  };
  hash?: string;
}

export function generateScheduleHash(activities: any[]): string {
  if (!activities || !Array.isArray(activities)) return 'hash_0';
  const str = JSON.stringify(
    activities.map((a) => ({
      id: a.id,
      title: a.title,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      completed: !!a.completed,
      stage: a.currentStage || a.stage,
    }))
  );
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'hash_' + Math.abs(hash).toString(16);
}

export async function getOfflineWeeklySchedule(): Promise<WeeklyScheduleData | null> {
  try {
    const dedicated = await getLocalAcademicData<WeeklyScheduleData | null>('weekly_schedule', null);
    if (dedicated && dedicated.schedule && Array.isArray(dedicated.schedule) && dedicated.schedule.length > 0) {
      return dedicated;
    }
    const studyState = await getLocalAcademicData<any>('study_state', null);
    if (studyState && studyState.weeklySchedule && studyState.weeklySchedule.schedule) {
      return studyState.weeklySchedule;
    }
    if (studyState && Array.isArray(studyState.plannerActivities) && studyState.plannerActivities.length > 0) {
      return {
        weekId: `week_${getTodayDateStr()}`,
        generatedAt: new Date().toISOString(),
        version: 1,
        schedule: studyState.plannerActivities,
        lastUpdated: Date.now(),
        hash: generateScheduleHash(studyState.plannerActivities),
      };
    }
    return null;
  } catch (err) {
    console.warn('[IndexedDB] Failed to load weekly_schedule:', err);
    return null;
  }
}

export async function saveOfflineWeeklySchedule(weeklySchedule: WeeklyScheduleData): Promise<boolean> {
  try {
    await setLocalAcademicData('weekly_schedule', weeklySchedule);
    const studyState = await getLocalAcademicData<any>('study_state', null);
    if (studyState) {
      studyState.weeklySchedule = weeklySchedule;
      studyState.plannerActivities = weeklySchedule.schedule;
      await setLocalAcademicData('study_state', studyState);
    }
    return true;
  } catch (err) {
    console.warn('[IndexedDB] Failed to save weekly_schedule:', err);
    return false;
  }
}

export function mergeWeeklySchedules(
  local: WeeklyScheduleData | null,
  remote: WeeklyScheduleData | null
): WeeklyScheduleData | null {
  if (!local && !remote) return null;
  if (!local) return remote;
  if (!remote) return local;

  const localTime = local.lastUpdated || (local.generatedAt ? new Date(local.generatedAt).getTime() : 0);
  const remoteTime = remote.lastUpdated || (remote.generatedAt ? new Date(remote.generatedAt).getTime() : 0);

  // If local is strictly newer in version or timestamp, prefer local
  if ((local.version || 1) > (remote.version || 1) || localTime > remoteTime + 1000) {
    return local;
  }

  // If remote is strictly newer, prefer remote
  if ((remote.version || 1) > (local.version || 1) || remoteTime > localTime + 1000) {
    return remote;
  }

  // If timestamps/versions match, merge item-level completions
  const localMap = new Map<string, any>((local.schedule || []).map((item) => [item.id, item]));
  const remoteMap = new Map<string, any>((remote.schedule || []).map((item) => [item.id, item]));

  const mergedScheduleList: any[] = [];
  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

  for (const id of allIds) {
    const locItem = localMap.get(id);
    const remItem = remoteMap.get(id);

    if (locItem && remItem) {
      const completed = locItem.completed || remItem.completed;
      mergedScheduleList.push({
        ...remItem,
        ...locItem,
        completed,
        partiallyCompletedPercent: Math.max(
          locItem.partiallyCompletedPercent || 0,
          remItem.partiallyCompletedPercent || 0
        ),
      });
    } else if (locItem) {
      mergedScheduleList.push(locItem);
    } else if (remItem) {
      mergedScheduleList.push(remItem);
    }
  }

  const mergedObj: WeeklyScheduleData = {
    weekId: remote.weekId || local.weekId || `week_${getTodayDateStr()}`,
    generatedAt: remote.generatedAt || local.generatedAt || new Date().toISOString(),
    version: Math.max(local.version || 1, remote.version || 1),
    schedule: mergedScheduleList,
    lastUpdated: Math.max(localTime, remoteTime),
    aiMetadata: { ...(remote.aiMetadata || {}), ...(local.aiMetadata || {}) },
    hash: generateScheduleHash(mergedScheduleList),
  };

  return mergedObj;
}

