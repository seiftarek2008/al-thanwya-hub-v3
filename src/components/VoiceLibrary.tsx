import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Play, Pause, Search, Filter, Trash2, Edit2, Star, Download, 
  HardDrive, Clock, FileAudio, RotateCcw, Share2, Plus, Volume2, 
  Sparkles, Layers, Calendar, CheckSquare, Square, ChevronDown, ChevronRight, Save, X
} from 'lucide-react';
import { VoiceNote, Subject } from '../types';
import { 
  getStoredVoiceNotes, deleteVoiceNote, deleteMultipleVoiceNotes, 
  updateVoiceNote, downloadVoiceNote, exportAllVoiceNotes, getVoiceNotesStats 
} from '../utils/voiceNotesStore';

interface VoiceLibraryProps {
  subjects: Subject[];
  onStartNewRecording?: (initialSubject?: { name: string; id: string }) => void;
}

export const VoiceLibrary: React.FC<VoiceLibraryProps> = ({ subjects, onStartNewRecording }) => {
  const [activeTab, setActiveTab] = useState<'library' | 'storage'>('library');
  const [notes, setNotes] = useState<VoiceNote[]>([]);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterChapter, setFilterChapter] = useState<string>('all');
  const [filterWeek, setFilterWeek] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Audio Playback State
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Edit Modal State
  const [editingNote, setEditingNote] = useState<VoiceNote | null>(null);
  const [editLessonName, setEditLessonName] = useState('');
  const [editChapterName, setEditChapterName] = useState('');
  const [editNoteText, setEditNoteText] = useState('');

  // Storage Management Multi-Select State
  const [selectedIdsForDelete, setSelectedIdsForDelete] = useState<string[]>([]);

  // Deletion Confirmation Modals State
  const [deletingNote, setDeletingNote] = useState<VoiceNote | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // Expanded Subject/Chapter Accordion State
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const list = getStoredVoiceNotes();
    setNotes(list);

    // Expand all subjects and chapters by default
    const subjMap: Record<string, boolean> = {};
    const chapMap: Record<string, boolean> = {};
    list.forEach(n => {
      subjMap[n.subjectName] = true;
      chapMap[`${n.subjectName}_${n.chapterName}`] = true;
    });
    setExpandedSubjects(subjMap);
    setExpandedChapters(chapMap);
  };

  // Filter Logic
  const filteredNotes = notes.filter(n => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = n.lessonName.toLowerCase().includes(q);
      const matchChapter = n.chapterName.toLowerCase().includes(q);
      const matchSubject = n.subjectName.toLowerCase().includes(q);
      const matchNote = n.note?.toLowerCase().includes(q) || false;
      if (!matchName && !matchChapter && !matchSubject && !matchNote) return false;
    }
    if (filterSubject !== 'all' && n.subjectName !== filterSubject && n.subjectId !== filterSubject) return false;
    if (filterChapter !== 'all' && n.chapterName !== filterChapter) return false;
    if (filterWeek !== 'all' && String(n.academicWeek) !== filterWeek) return false;
    if (onlyFavorites && !n.isFavorite) return false;
    return true;
  });

  // Extract unique chapters and weeks for filter dropdowns
  const availableChapters = Array.from(new Set(notes.map(n => n.chapterName)));
  const availableWeeks = Array.from(new Set(notes.map(n => n.academicWeek).filter(Boolean)));

  // Audio Control Handlers
  const handlePlayToggle = (note: VoiceNote) => {
    if (currentlyPlayingId === note.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      setCurrentlyPlayingId(note.id);
      setCurrentTime(0);
      setDuration(note.durationSeconds || 300);
      setIsPlaying(true);

      if (audioRef.current) {
        if (note.audioDataUri) {
          audioRef.current.src = note.audioDataUri;
          audioRef.current.playbackRate = playbackSpeed;
          audioRef.current.play().catch((err) => {
            console.warn('Playback error or blocked by browser policy:', err);
          });
        } else {
          alert('هذا الشرح يحتوي على بيانات وصفية فقط ولا يملك مقطعاً صوتياً مخزناً.');
          setIsPlaying(false);
          setCurrentlyPlayingId(null);
        }
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
  };

  const handleToggleFavorite = (id: string, currentFav: boolean) => {
    const updated = updateVoiceNote(id, { isFavorite: !currentFav });
    setNotes(updated);
  };

  const handleDelete = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      setDeletingNote(note);
    } else {
      const updated = deleteVoiceNote(id);
      setNotes(updated);
      if (currentlyPlayingId === id) {
        audioRef.current?.pause();
        setCurrentlyPlayingId(null);
        setIsPlaying(false);
      }
    }
  };

  const confirmDeleteSingleNote = () => {
    if (!deletingNote) return;
    const id = deletingNote.id;
    const updated = deleteVoiceNote(id);
    setNotes(updated);
    if (currentlyPlayingId === id) {
      audioRef.current?.pause();
      setCurrentlyPlayingId(null);
      setIsPlaying(false);
    }
    setDeletingNote(null);
  };

  const confirmBatchDelete = () => {
    const updated = deleteMultipleVoiceNotes(selectedIdsForDelete);
    setNotes(updated);
    if (currentlyPlayingId && selectedIdsForDelete.includes(currentlyPlayingId)) {
      audioRef.current?.pause();
      setCurrentlyPlayingId(null);
      setIsPlaying(false);
    }
    setSelectedIdsForDelete([]);
    setShowBatchDeleteConfirm(false);
  };

  const handleOpenEdit = (note: VoiceNote) => {
    setEditingNote(note);
    setEditLessonName(note.lessonName);
    setEditChapterName(note.chapterName);
    setEditNoteText(note.note || '');
  };

  const handleSaveEdit = () => {
    if (!editingNote) return;
    const updated = updateVoiceNote(editingNote.id, {
      lessonName: editLessonName.trim() || editingNote.lessonName,
      chapterName: editChapterName.trim() || editingNote.chapterName,
      note: editNoteText.trim() || undefined
    });
    setNotes(updated);
    setEditingNote(null);
  };

  // Group notes by Subject -> Chapter
  const groupedBySubject: Record<string, Record<string, VoiceNote[]>> = {};

  // If no search query / favorite / chapter / week filters are active, initialize all subjects from props
  const isNarrowFilterActive = Boolean(searchQuery.trim() || onlyFavorites || filterChapter !== 'all' || filterWeek !== 'all');

  if (!isNarrowFilterActive) {
    subjects.forEach(subj => {
      if (filterSubject === 'all' || filterSubject === subj.name || filterSubject === subj.id) {
        groupedBySubject[subj.name] = {};
      }
    });
  }

  filteredNotes.forEach(note => {
    if (filterSubject === 'all' || filterSubject === note.subjectName || filterSubject === note.subjectId) {
      if (!groupedBySubject[note.subjectName]) {
        groupedBySubject[note.subjectName] = {};
      }
      if (!groupedBySubject[note.subjectName][note.chapterName]) {
        groupedBySubject[note.subjectName][note.chapterName] = [];
      }
      groupedBySubject[note.subjectName][note.chapterName].push(note);
    }
  });

  const stats = getVoiceNotesStats(notes);

  // Time formatter MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 dir-rtl" style={{ direction: 'rtl' }}>
      
      {/* Hidden Global Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            if (audioRef.current.duration) setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      {/* Main Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-950 border border-indigo-900/40 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mt-20" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <Mic className="w-6 h-6 animate-pulse" />
              </span>
              <h1 className="text-xl md:text-2xl font-black">مكتبة الشروح الصوتية الشخصية (My Voice Library) 🎤</h1>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl font-semibold">
              أرشيفك الصوتي الخاص لاستعادة فهمك للدروس بصوتك ولغتك البسيطة. بدلاً من إعادة قراءة الملاحظات الطويلة، استمع إلى شرحك الصوتي السابق في دقائق معدودة!
            </p>
          </div>

          {onStartNewRecording && (
            <button
              onClick={() => onStartNewRecording()}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <Mic className="w-4 h-4" />
              <span>تسجيل شرح جديد 🎙️</span>
            </button>
          )}
        </div>

        {/* Sub-tabs: Library vs Storage Management */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-indigo-900/40 text-xs font-bold">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'library'
                ? 'bg-white text-zinc-950 font-black shadow-md'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            <span>الشروح الصوتية ({filteredNotes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'storage'
                ? 'bg-white text-zinc-950 font-black shadow-md'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>إدارة المساحة والتخزين ({stats.sizeMb} MB)</span>
          </button>
        </div>
      </div>

      {/* 1. LIBRARY TAB */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          
          {/* Search & Filter Controls Bar */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="ابحث برقم الدرس، الباب، أو المادة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              {/* Subject Filter */}
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full md:w-44 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none"
              >
                <option value="all">كل المواد الدراسية</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>

              {/* Chapter Filter */}
              <select
                value={filterChapter}
                onChange={(e) => setFilterChapter(e.target.value)}
                className="w-full md:w-44 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none"
              >
                <option value="all">كل الفصول والأبواب</option>
                {availableChapters.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Academic Week Filter */}
              <select
                value={filterWeek}
                onChange={(e) => setFilterWeek(e.target.value)}
                className="w-full md:w-36 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none"
              >
                <option value="all">كل الأسابيع</option>
                {availableWeeks.map(w => (
                  <option key={w} value={String(w)}>الأسبوع {w}</option>
                ))}
              </select>

              {/* Favorite Toggle */}
              <button
                type="button"
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  onlyFavorites
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 font-extrabold'
                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current text-amber-500' : ''}`} />
                <span>المفضلة فقط ⭐️</span>
              </button>
            </div>
          </div>

          {/* Grouped Library List (Subject -> Chapter -> Recordings) */}
          {Object.keys(groupedBySubject).length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
                <Mic className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">لا توجد شروح صوتية مطابقة للتصفية</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                يمكنك إنهاء درس جديد في الجدول وتسجيل شرحك الصوتي فوراً لبناء مكتبتك الشخصية طوال العام.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedBySubject).map(([subjectName, chaptersMap]) => {
                const isSubjectExpanded = expandedSubjects[subjectName] !== false;
                
                return (
                  <div key={subjectName} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
                    
                    {/* Subject Accordion Header */}
                    <div 
                      onClick={() => setExpandedSubjects(prev => ({ ...prev, [subjectName]: !isSubjectExpanded }))}
                      className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-black text-sm">
                          📘
                        </span>
                        <div>
                          <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">{subjectName}</h2>
                          <span className="text-[11px] text-zinc-400 font-semibold">
                            {Object.values(chaptersMap).flat().length} شرح صوتی مسجّل
                          </span>
                        </div>
                      </div>

                      <div className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                        {isSubjectExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    </div>

                    {/* Chapters List or Empty Subject Prompt */}
                    {isSubjectExpanded && (
                      Object.keys(chaptersMap).length === 0 ? (
                        <div className="p-4 bg-zinc-50/60 dark:bg-zinc-950/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <p className="font-bold text-zinc-700 dark:text-zinc-300">لا توجد تسجيلات حتى الآن لمادة {subjectName}</p>
                            <p className="text-[11px] text-zinc-400">سجّل شرحك الصوتي لأحد دروس هذه المادة لتتمكن من استماعه ومراجعته لاحقاً.</p>
                          </div>
                          {onStartNewRecording && (
                            <button
                              onClick={() => {
                                const matched = subjects.find(s => s.name === subjectName);
                                onStartNewRecording({ name: subjectName, id: matched?.id || '' });
                              }}
                              className="px-3.5 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                            >
                              <Mic className="w-3.5 h-3.5" />
                              <span>تسجيل شرح لهذه المادة 🎙️</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 pr-2">
                          {Object.entries(chaptersMap).map(([chapterName, noteList]) => {
                          const chapterKey = `${subjectName}_${chapterName}`;
                          const isChapExpanded = expandedChapters[chapterKey] !== false;

                          return (
                            <div key={chapterName} className="p-4 bg-zinc-50/70 dark:bg-zinc-950/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
                              
                              {/* Chapter Header */}
                              <div 
                                onClick={() => setExpandedChapters(prev => ({ ...prev, [chapterKey]: !isChapExpanded }))}
                                className="flex items-center justify-between cursor-pointer select-none"
                              >
                                <div className="flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-indigo-500" />
                                  <h3 className="text-xs font-black text-zinc-800 dark:text-zinc-200">{chapterName}</h3>
                                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                                    {noteList.length} مقطع
                                  </span>
                                </div>
                                <div className="text-zinc-400">
                                  {isChapExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </div>
                              </div>

                              {/* Lesson Recording Cards */}
                              {isChapExpanded && (
                                <div className="space-y-3 pt-1">
                                  {noteList.map((note) => {
                                    const isThisPlaying = currentlyPlayingId === note.id && isPlaying;
                                    
                                    return (
                                      <div 
                                        key={note.id}
                                        className={`p-4 rounded-2xl border transition-all ${
                                          isThisPlaying
                                            ? 'bg-indigo-950/20 border-indigo-500/50 dark:border-indigo-500/60 shadow-md'
                                            : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                        }`}
                                      >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                          
                                          {/* Main Information & Play Button */}
                                          <div className="flex items-start md:items-center gap-3">
                                            <button
                                              onClick={() => handlePlayToggle(note)}
                                              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                                isThisPlaying
                                                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                                                  : 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 hover:scale-105'
                                              }`}
                                            >
                                              {isThisPlaying ? (
                                                <Pause className="w-5 h-5 fill-current" />
                                              ) : (
                                                <Play className="w-5 h-5 fill-current mr-0.5" />
                                              )}
                                            </button>

                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-xs md:text-sm font-black text-zinc-900 dark:text-white">
                                                  ▶ {note.lessonName}
                                                </h4>
                                                {note.recordingType && (
                                                  <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold border border-indigo-500/20">
                                                    {note.recordingType === 'summary' ? 'ملخص الدرس 📝' : note.recordingType === 'review' ? 'مراجعة وأفكار 💡' : 'شرح كامل 📖'}
                                                  </span>
                                                )}
                                                {note.isFavorite && (
                                                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold border border-amber-500/20">
                                                    مفضل ⭐️
                                                  </span>
                                                )}
                                              </div>

                                              <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-semibold flex-wrap">
                                                <span className="flex items-center gap-1 font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                                  <Clock className="w-3 h-3 text-indigo-400" />
                                                  {formatTime(note.durationSeconds)}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                  <Calendar className="w-3 h-3" />
                                                  {note.date}
                                                </span>
                                                {note.academicWeek && (
                                                  <>
                                                    <span>•</span>
                                                    <span>أسبوع {note.academicWeek}</span>
                                                  </>
                                                )}
                                              </div>

                                              {note.note && (
                                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 bg-zinc-100 dark:bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60 leading-relaxed font-medium">
                                                  💬 {note.note}
                                                </p>
                                              )}
                                            </div>
                                          </div>

                                          {/* Actions */}
                                          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                            <button
                                              onClick={() => handleToggleFavorite(note.id, !!note.isFavorite)}
                                              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                                note.isFavorite ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-zinc-100 dark:bg-zinc-800'
                                              }`}
                                              title="تفضيل"
                                            >
                                              <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-current' : ''}`} />
                                            </button>
                                            <button
                                              onClick={() => downloadVoiceNote(note)}
                                              className="p-2 rounded-xl text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-zinc-100 dark:bg-zinc-800 transition-colors cursor-pointer"
                                              title="تحميل"
                                            >
                                              <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() => handleDelete(note.id)}
                                              className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 bg-zinc-100 dark:bg-zinc-800 transition-colors cursor-pointer"
                                              title="حذف"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. STORAGE MANAGEMENT TAB */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          
          {/* Stats Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 block">إجمالي التسجيلات</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.totalCount} مقطع</div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 block">إجمالي الساعات المسجلة</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.totalHours} ساعة</div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 block">المساحة المستهلكة تقريبياً</span>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.sizeMb} MB</div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 block">حالة التخزين والنسخ</span>
              <div className="text-2xl font-black text-sky-600 dark:text-sky-400">محلي (Offline)</div>
            </div>
          </div>

          {/* Batch Actions & Export Panel */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">إجراءات المزامنة والتفريغ</h3>
                <p className="text-xs text-zinc-400 mt-0.5">تصدير جميع التسجيلات لحمايتها أو تفريغ مساحة للتسجيلات الجديدة</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportAllVoiceNotes(notes)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير جميع التسجيلات (JSON)</span>
                </button>

                {selectedIdsForDelete.length > 0 && (
                  <button
                    onClick={() => setShowBatchDeleteConfirm(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف المحدد ({selectedIdsForDelete.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* List with selection for bulk actions */}
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-500 pb-2">
                <span>اختر التسجيلات لإدارتها:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedIdsForDelete.length === notes.length) {
                      setSelectedIdsForDelete([]);
                    } else {
                      setSelectedIdsForDelete(notes.map(n => n.id));
                    }
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {selectedIdsForDelete.length === notes.length ? 'إلغاء تحديد الكل' : 'تحديد جميع المقاطع'}
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {notes.map(note => {
                  const isSelected = selectedIdsForDelete.includes(note.id);

                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedIdsForDelete(selectedIdsForDelete.filter(id => id !== note.id));
                        } else {
                          setSelectedIdsForDelete([...selectedIdsForDelete, note.id]);
                        }
                      }}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-400 dark:border-rose-800'
                          : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-rose-500" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-400" />
                        )}
                        <div>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 block">{note.subjectName} — {note.lessonName}</span>
                          <span className="text-[10px] text-zinc-400">{note.chapterName} • {formatTime(note.durationSeconds)} دقيقة</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-zinc-400">{note.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md dir-rtl" style={{ direction: 'rtl' }}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-right space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">تعديل معلومات الشرح الصوتي ✏️</h3>
              <button
                onClick={() => setEditingNote(null)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 font-bold mb-1">اسم الدرس:</label>
                <input
                  type="text"
                  value={editLessonName}
                  onChange={(e) => setEditLessonName(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-500 font-bold mb-1">اسم الفصل / الباب:</label>
                <input
                  type="text"
                  value={editChapterName}
                  onChange={(e) => setEditChapterName(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-500 font-bold mb-1">الملاحظة المدونة:</label>
                <textarea
                  value={editNoteText}
                  onChange={(e) => setEditNoteText(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setEditingNote(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Note Delete Confirmation Modal */}
      {deletingNote && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl" style={{ direction: 'rtl' }}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 text-right shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-white">تأكيد حذف الشرح الصوتي 🗑️</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">سيتم حذف هذا المقطع نهائياً من المكتبة الصوتية.</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
              <p className="font-bold text-zinc-900 dark:text-white">📘 {deletingNote.subjectName} - {deletingNote.lessonName}</p>
              <p className="text-zinc-500 dark:text-zinc-400">📖 {deletingNote.chapterName}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setDeletingNote(null)}
                className="px-4 py-2.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                إلغاء (تراجع)
              </button>
              <button
                onClick={confirmDeleteSingleNote}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد الحذف النهائي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl" style={{ direction: 'rtl' }}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 text-right shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-white">حذف المقاطع المحددة 🗑️</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">هل أنت متأكد من حذف {selectedIdsForDelete.length} مقطع/شرح صوتي محدد؟</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="px-4 py-2.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmBatchDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف {selectedIdsForDelete.length} مقطع نهائياً</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
