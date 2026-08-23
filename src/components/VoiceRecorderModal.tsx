import React, { useState, useEffect, useRef } from 'react';
import { Mic, Pause, Play, Square, X, Check, Volume2, Save, Sparkles, Clock, BookOpen, Layers, Bookmark } from 'lucide-react';
import { VoiceNote, Subject } from '../types';
import { blobToDataUri, saveVoiceNote } from '../utils/voiceNotesStore';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectName: string;
  subjectId: string;
  subjects?: Subject[];
  chapterName?: string;
  lessonName?: string;
  academicWeek?: number;
  activityId?: string;
  sessionId?: string;
  onSaveSuccess: (note: VoiceNote) => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  subjectName: initialSubjectName,
  subjectId: initialSubjectId,
  subjects = [],
  chapterName = 'الباب الأول',
  lessonName = 'الدرس الأول',
  academicWeek = 1,
  activityId,
  sessionId,
  onSaveSuccess
}) => {
  // Step in the flow: 'prompt' | 'recording' | 'save_dialog'
  const [step, setStep] = useState<'prompt' | 'recording' | 'save_dialog'>('prompt');

  // Selected Subject State
  const [selectedSubjectName, setSelectedSubjectName] = useState(initialSubjectName);
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId);

  // Recording Type State ('summary' | 'full_explanation' | 'review')
  const [recordingType, setRecordingType] = useState<'summary' | 'full_explanation' | 'review'>('full_explanation');

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);

  // Form Fields
  const [formLessonName, setFormLessonName] = useState(lessonName);
  const [formChapterName, setFormChapterName] = useState(chapterName);
  const [formNote, setFormNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('prompt');
      setIsRecording(false);
      setIsPaused(false);
      setElapsedSeconds(0);
      setRecordedAudioUri(null);
      setSelectedSubjectName(initialSubjectName || (subjects[0]?.name || 'فيزياء'));
      setSelectedSubjectId(initialSubjectId || (subjects[0]?.id || 'sub_1'));
      setFormLessonName(lessonName || 'الدرس الأول');
      setFormChapterName(chapterName || 'الباب الأول');
      setFormNote('');
      setRecordingType('full_explanation');
    } else {
      stopTimer();
      stopRecordingCleanup();
    }
  }, [isOpen, initialSubjectName, initialSubjectId, lessonName, chapterName]);

  // Timer Handlers
  const startTimer = () => {
    stopTimer();
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const stopRecordingCleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
  };

  // Start Audio Recording
  const handleStartRecording = async () => {
    setStep('recording');
    setIsRecording(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    audioChunksRef.current = [];

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          try {
            const dataUri = await blobToDataUri(audioBlob);
            setRecordedAudioUri(dataUri);
          } catch (err) {
            setRecordedAudioUri('data:audio/webm;base64,placeholder');
          }
          // Stop stream tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start(200);
      }
    } catch (err) {
      console.warn('Microphone permission denied or unavailable in sandbox, running simulation timer mode.', err);
    }

    startTimer();
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      setIsPaused(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      startTimer();
    } else {
      setIsPaused(true);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      stopTimer();
    }
  };

  const handleStopRecording = () => {
    stopTimer();
    setIsRecording(false);
    setIsPaused(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Move to Save Dialog
    setStep('save_dialog');
  };

  const handleCancelRecording = () => {
    stopTimer();
    stopRecordingCleanup();
    onClose();
  };

  const handleSaveNote = () => {
    const newNote = saveVoiceNote({
      subjectId: selectedSubjectId,
      subjectName: selectedSubjectName,
      chapterName: formChapterName.trim() || 'الباب الأول',
      lessonName: formLessonName.trim() || 'الدرس المنهجي',
      recordingType,
      note: formNote.trim() || undefined,
      audioDataUri: recordedAudioUri || undefined,
      durationSeconds: elapsedSeconds > 0 ? elapsedSeconds : 180,
      date: new Date().toISOString().split('T')[0],
      academicWeek: academicWeek || 1,
      sessionId,
      activityId
    });

    onSaveSuccess(newNote);
    onClose();
  };

  // Time formatter MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md dir-rtl" style={{ direction: 'rtl' }}>
      
      {/* 1. INITIAL PROMPT STEP */}
      {step === 'prompt' && (
        <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-right space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">استوديو التسجيل والشرح الصوتي 🎙️</h3>
                <p className="text-[11px] text-zinc-400">سجّل شرحك الكامل أو ملخصك الخاص للدرس بصوتك</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Subject Selector */}
            <div>
              <label className="block text-zinc-300 font-bold mb-1">المادة الدراسية (Subject):</label>
              {subjects && subjects.length > 0 ? (
                <select
                  value={selectedSubjectName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setSelectedSubjectName(name);
                    const matched = subjects.find(s => s.name === name);
                    if (matched) setSelectedSubjectId(matched.id);
                  }}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold focus:border-indigo-500 focus:outline-none"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedSubjectName}
                  onChange={(e) => setSelectedSubjectName(e.target.value)}
                  placeholder="ادخل اسم المادة..."
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold focus:border-indigo-500 focus:outline-none"
                />
              )}
            </div>

            {/* Chapter & Lesson Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-300 font-bold mb-1">اسم/رقم الباب أو الفصل (Chapter):</label>
                <input
                  type="text"
                  value={formChapterName}
                  onChange={(e) => setFormChapterName(e.target.value)}
                  placeholder="مثال: الباب الثاني - الكهربية"
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">اسم/رقم الدرس (Lesson):</label>
                <input
                  type="text"
                  value={formLessonName}
                  onChange={(e) => setFormLessonName(e.target.value)}
                  placeholder="مثال: الدرس 1 - قانون كيرشوف"
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Recording Type Selector (Full Explanation vs Summary vs Review) */}
            <div>
              <label className="block text-zinc-300 font-bold mb-1.5">نوع التسجيل (Recording Type):</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'full_explanation', label: 'شرح الدرس الكامل 📖' },
                  { id: 'summary', label: 'ملخص الدرس 📝' },
                  { id: 'review', label: 'مراجعة وأفكار 💡' },
                ].map(typeObj => (
                  <button
                    key={typeObj.id}
                    type="button"
                    onClick={() => setRecordingType(typeObj.id as any)}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                      recordingType === typeObj.id
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md font-black'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {typeObj.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Privacy & Permission Notice */}
            <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 flex items-center gap-2">
              <span className="text-amber-400 text-sm shrink-0">🔒</span>
              <span>
                <strong>إذن الميكروفون:</strong> لن يتم طلب إذن الوصول للميكروفون من متصفحك إلا عند الضغط على زر التفعيل أدناه لبدء التسجيل.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800/80">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={handleStartRecording}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-600/25 cursor-pointer flex items-center gap-2"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span>إسمح للميكروفون وابدأ التسجيل 🎙️</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. MINIMAL FULL-SCREEN RECORDING OVERLAY */}
      {step === 'recording' && (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-between p-6 md:p-12 text-white dir-rtl" style={{ direction: 'rtl' }}>
          
          {/* Header Displaying Subject, Chapter, Lesson & Recording Type */}
          <div className="w-full max-w-xl text-center space-y-2 pt-4">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="inline-block text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 px-4 py-1 rounded-full">
                {selectedSubjectName}
              </span>
              <span className="inline-block text-xs font-black text-amber-400 bg-amber-950/60 border border-amber-800/50 px-3 py-1 rounded-full">
                {recordingType === 'summary' ? 'ملخص الدرس 📝' : recordingType === 'review' ? 'مراجعة وأفكار 💡' : 'شرح الدرس الكامل 📖'}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">{formLessonName}</h2>
            <p className="text-xs text-zinc-400 font-bold">{formChapterName}</p>
          </div>

          {/* Large Microphone Visualizer & Live Timer */}
          <div className="flex flex-col items-center justify-center space-y-8 my-auto">
            {/* Animated Ring / Microphone icon */}
            <div className="relative flex items-center justify-center">
              {isRecording && !isPaused && (
                <>
                  <div className="absolute w-48 h-48 rounded-full bg-indigo-600/20 animate-ping" />
                  <div className="absolute w-64 h-64 rounded-full bg-indigo-500/10 animate-pulse" />
                </>
              )}
              <div className={`relative w-36 h-36 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isPaused 
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/10' 
                  : 'bg-indigo-950/60 border-indigo-500/60 text-indigo-400 shadow-2xl shadow-indigo-500/30'
              }`}>
                <Mic className={`w-16 h-16 ${isRecording && !isPaused ? 'animate-bounce' : ''}`} />
              </div>
            </div>

            {/* Live Timer */}
            <div className="text-center space-y-1">
              <div className="text-5xl md:text-6xl font-black font-mono tracking-wider text-white">
                {formatTime(elapsedSeconds)}
              </div>
              <span className="text-xs text-zinc-400 font-bold block">
                {isPaused ? 'التسجيل متوقف مؤقتاً ⏸️' : 'جاري تسجيل شرحك الصوتي الآن... 🎙️'}
              </span>
            </div>
          </div>

          {/* Minimal Control Buttons: Pause, Stop, Cancel */}
          <div className="w-full max-w-md flex items-center justify-center gap-6 pb-8">
            <button
              onClick={handleCancelRecording}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                <X className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold">إلغاء</span>
            </button>

            <button
              onClick={handleStopRecording}
              className="flex flex-col items-center gap-1.5 p-4 rounded-3xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-xl shadow-indigo-600/30 cursor-pointer scale-110"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Square className="w-6 h-6 fill-current text-white" />
              </div>
              <span className="text-xs font-black">إيقاف وحفظ</span>
            </button>

            <button
              onClick={handlePauseToggle}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                {isPaused ? <Play className="w-5 h-5 fill-current text-emerald-400" /> : <Pause className="w-5 h-5 text-amber-400" />}
              </div>
              <span className="text-[10px] font-bold">{isPaused ? 'استئناف' : 'مؤقت'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. SAVE DIALOG */}
      {step === 'save_dialog' && (
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-right space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>💾 حفظ الشرح الصوتي في المكتبة</span>
              </h3>
              <p className="text-[11px] text-zinc-400">المدة المسجلة: {formatTime(elapsedSeconds)} دقيقة</p>
            </div>
            <span className="text-xs font-black text-indigo-400 bg-indigo-950 px-3 py-1 rounded-xl border border-indigo-900">
              {selectedSubjectName}
            </span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">اسم الدرس (Lesson Name):</label>
              <input
                type="text"
                required
                value={formLessonName}
                onChange={(e) => setFormLessonName(e.target.value)}
                placeholder="مثال: قانون نيوتن الأول"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">اسم الباب / الفصل (Chapter):</label>
              <input
                type="text"
                required
                value={formChapterName}
                onChange={(e) => setFormChapterName(e.target.value)}
                placeholder="مثال: الديناميكا والحركة"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">ملاحظة مدونة مع المقطع (اختياري):</label>
              <textarea
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                rows={2}
                placeholder="أضف أي ملاحظات أو نقاط هامة تود تذكرها..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Read-Only Automatic Metadata Summary */}
            <div className="p-3 bg-zinc-950/70 rounded-2xl border border-zinc-800/80 space-y-1 text-[11px] text-zinc-400">
              <span className="font-extrabold text-zinc-300 block mb-1">بيانات وصفية تُحفظ مع التسجيل:</span>
              <div className="grid grid-cols-2 gap-1 font-semibold">
                <span>المادة: <strong className="text-zinc-200">{selectedSubjectName}</strong></span>
                <span>النوع: <strong className="text-zinc-200">{recordingType === 'summary' ? 'ملخص' : recordingType === 'review' ? 'مراجعة' : 'شرح كامل'}</strong></span>
                <span>التاريخ: <strong className="text-zinc-200">{new Date().toISOString().split('T')[0]}</strong></span>
                <span>المدة: <strong className="text-zinc-200">{formatTime(elapsedSeconds)}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSaveNote}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التسجيل الآن 💾</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

