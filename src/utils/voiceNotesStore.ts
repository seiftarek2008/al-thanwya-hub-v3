import { VoiceNote } from '../types';
import { saveVoiceAudioBlob, setLocalAcademicData, enqueueOfflineAction } from './offlineDb';

const STORAGE_KEY = 'thanaweya_voice_notes_library_v1';

// No placeholder or fake voice notes - user-provided recordings only
const DEFAULT_VOICE_NOTES: VoiceNote[] = [];

export function getStoredVoiceNotes(): VoiceNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_VOICE_NOTES));
      return DEFAULT_VOICE_NOTES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading voice notes from storage:', err);
    return DEFAULT_VOICE_NOTES;
  }
}

export function saveVoiceNote(note: Omit<VoiceNote, 'id' | 'createdAt'>): VoiceNote {
  const notes = getStoredVoiceNotes();
  const id = `vn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newNote: VoiceNote = {
    ...note,
    id,
    createdAt: new Date().toISOString()
  };
  const updated = [newNote, ...notes];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('LocalStorage size limit reached, saving metadata without raw audio or trimming oldest:', err);
  }

  // Dual-save audio blob and metadata in IndexedDB
  if (newNote.audioDataUri) {
    saveVoiceAudioBlob(id, newNote.audioDataUri);
  }
  setLocalAcademicData('voice_notes', updated);

  // Queue background upload metadata
  enqueueOfflineAction('voice_note', {
    id: newNote.id,
    subjectName: newNote.subjectName,
    chapterName: newNote.chapterName,
    lessonName: newNote.lessonName,
    durationSeconds: newNote.durationSeconds,
    createdAt: newNote.createdAt
  });

  return newNote;
}

export function updateVoiceNote(id: string, updates: Partial<VoiceNote>): VoiceNote[] {
  const notes = getStoredVoiceNotes();
  const updated = notes.map(n => n.id === id ? { ...n, ...updates } : n);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update voice note:', err);
  }
  return updated;
}

export function deleteVoiceNote(id: string): VoiceNote[] {
  const notes = getStoredVoiceNotes();
  const updated = notes.filter(n => n.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setLocalAcademicData('voice_notes', updated);
  } catch (err) {
    console.error('Failed to delete voice note:', err);
  }
  return updated;
}

export function deleteMultipleVoiceNotes(ids: string[]): VoiceNote[] {
  const notes = getStoredVoiceNotes();
  const set = new Set(ids);
  const updated = notes.filter(n => !set.has(n.id));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setLocalAcademicData('voice_notes', updated);
  } catch (err) {
    console.error('Failed to delete multiple voice notes:', err);
  }
  return updated;
}

export function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function downloadVoiceNote(note: VoiceNote) {
  if (!note.audioDataUri) {
    alert('لا يوجد ملف صوتي متاح للتحميل في العرض التوضيحي');
    return;
  }
  const link = document.createElement('a');
  link.href = note.audioDataUri;
  link.download = `${note.subjectName}_${note.lessonName.replace(/[^a-zA-Z0-9أ-ي]/g, '_')}.webm`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAllVoiceNotes(notes: VoiceNote[]) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
  const link = document.createElement('a');
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `Voice_Library_Backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getVoiceNotesStats(notes: VoiceNote[]) {
  const totalCount = notes.length;
  const totalDurationSec = notes.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
  const totalHours = (totalDurationSec / 3600).toFixed(1);
  
  // Estimate size: ~12KB per second of recorded audio
  const estimatedBytes = totalDurationSec * 12000;
  const sizeMb = (estimatedBytes / (1024 * 1024)).toFixed(1);

  const largestNotes = [...notes].sort((a, b) => b.durationSeconds - a.durationSeconds).slice(0, 5);
  const recentNotes = [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return {
    totalCount,
    totalDurationSec,
    totalHours,
    sizeMb,
    largestNotes,
    recentNotes
  };
}
