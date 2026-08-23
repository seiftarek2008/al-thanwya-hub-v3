import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  FileText, 
  RefreshCw, 
  Search, 
  Plus, 
  ExternalLink, 
  File, 
  Check, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  LogOut,
  Sparkles,
  Award
} from 'lucide-react';
import { googleSignIn, logout, initAuth, getAccessToken } from '../lib/googleDriveAuth';
import { AppStudyState } from '../types';

interface GoogleDrivePanelProps {
  appData: AppStudyState;
  onRestoreState: (restoredData: AppStudyState) => void;
}

export default function GoogleDrivePanel({ appData, onRestoreState }: GoogleDrivePanelProps) {
  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Drive operations states
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStatus, setBackupStatus] = useState<{ success: boolean; message: string; time?: string } | null>(null);
  const [existingBackup, setExistingBackup] = useState<any>(null);
  const [isLoadingBackupInfo, setIsLoadingBackupInfo] = useState(false);

  // File browser & search states
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom note export state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isExportingNote, setIsExportingNote] = useState(false);
  const [noteExportStatus, setNoteExportStatus] = useState<{ success: boolean; message: string } | null>(null);

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Check initial Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setIsAuthenticated(true);
        setGoogleUser(user);
        setAccessToken(token);
        fetchBackupInfo(token);
        fetchDriveFiles(token);
      },
      () => {
        setIsAuthenticated(false);
        setGoogleUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setBackupStatus(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setIsAuthenticated(true);
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
        fetchBackupInfo(res.accessToken);
        fetchDriveFiles(res.accessToken);
      }
    } catch (err) {
      console.error('Failed to connect to Google Drive:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('هل تريد بالتأكيد تسجيل الخروج وفصل Google Drive؟')) {
      await logout();
      setIsAuthenticated(false);
      setGoogleUser(null);
      setAccessToken(null);
      setDriveFiles([]);
      setExistingBackup(null);
      setBackupStatus(null);
    }
  };

  // 1. Fetch Existing Backup Information
  const fetchBackupInfo = async (tokenToUse: string) => {
    setIsLoadingBackupInfo(true);
    try {
      const query = encodeURIComponent("name = 'thanaweya_study_backup.json' and trashed = false");
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&spaces=drive`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${tokenToUse}` }
      });
      const data = await res.json();
      
      if (data.files && data.files.length > 0) {
        setExistingBackup(data.files[0]);
      } else {
        setExistingBackup(null);
      }
    } catch (err) {
      console.error('Error fetching backup info:', err);
    } finally {
      setIsLoadingBackupInfo(false);
    }
  };

  // 2. Backup Current State
  const handleBackup = async () => {
    if (!accessToken) return;
    setIsBackingUp(true);
    setBackupStatus(null);

    try {
      // Step A: Check if backup file exists
      const query = encodeURIComponent("name = 'thanaweya_study_backup.json' and trashed = false");
      const checkRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const checkData = await checkRes.json();
      const existingFile = checkData.files?.[0];

      let fileId = '';

      if (existingFile) {
        // Explicit user confirmation before updating/overwriting existing file
        const confirmOverwrite = window.confirm('يوجد نسخة احتياطية سابقة بالفعل على Google Drive. هل تريد استبدالها بالبيانات الحالية؟');
        if (!confirmOverwrite) {
          setIsBackingUp(false);
          return;
        }
        fileId = existingFile.id;
      } else {
        // Create new metadata
        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'thanaweya_study_backup.json',
            mimeType: 'application/json',
            description: 'Backup of Thanaweya Amma Study Assistant progress and settings'
          })
        });
        const createData = await createRes.json();
        fileId = createData.id;
      }

      // Step B: Upload file content
      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appData)
      });

      if (uploadRes.ok) {
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setBackupStatus({
          success: true,
          message: 'تم حفظ النسخة الاحتياطية بنجاح على Google Drive!',
          time: timeNow
        });
        fetchBackupInfo(accessToken); // refresh
      } else {
        throw new Error('Failed to upload backup content');
      }
    } catch (err) {
      console.error('Backup failed:', err);
      setBackupStatus({
        success: false,
        message: 'فشل حفظ النسخة الاحتياطية. يرجى التأكد من اتصال الإنترنت وإعادة المحاولة.'
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // 3. Restore State from Drive Backup
  const handleRestore = async () => {
    if (!accessToken || !existingBackup) return;

    const confirmRestore = window.confirm(
      'تحذير هام: سيتم استبدال جميع بيانات المذاكرة والمهام والامتحانات الحالية بالنسخة الاحتياطية السحابية. لا يمكن التراجع عن هذا الإجراء. هل تريد الاستمرار؟'
    );
    if (!confirmRestore) return;

    setIsLoadingBackupInfo(true);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${existingBackup.id}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.ok) {
        const restoredData = await res.json() as AppStudyState;
        
        // Basic validation of restored data
        if (restoredData && (restoredData.subjects || restoredData.tasks || restoredData.sessions)) {
          onRestoreState(restoredData);
          alert('تم استعادة بيانات دراستك ونجاح المزامنة بنجاح! 🎉');
        } else {
          throw new Error('Invalid backup file format');
        }
      } else {
        throw new Error('Failed to retrieve backup file contents');
      }
    } catch (err) {
      console.error('Restore failed:', err);
      alert('عذراً، فشل استعادة البيانات من النسخة الاحتياطية السحابية. يرجى التأكد من سلامة الملف.');
    } finally {
      setIsLoadingBackupInfo(false);
    }
  };

  // 4. Fetch study documents list
  const fetchDriveFiles = async (tokenToUse: string) => {
    setIsLoadingFiles(true);
    try {
      // Query common study file types: PDF, Word, plain text, images, or Google Docs
      const query = encodeURIComponent(
        "trashed = false and (mimeType = 'application/pdf' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'text/plain' or mimeType = 'image/png' or mimeType = 'image/jpeg' or mimeType = 'application/vnd.google-apps.document')"
      );
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=15&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${tokenToUse}` }
      });
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err) {
      console.error('Error fetching drive files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // 5. Upload Custom Study Note to Google Drive
  const handleExportNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !noteTitle.trim() || !noteContent.trim()) return;

    setIsExportingNote(true);
    setNoteExportStatus(null);

    try {
      // Step A: Create metadata
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${noteTitle.trim()}.txt`,
          mimeType: 'text/plain',
          description: 'Study Notes exported from Thanaweya Amma Study Assistant'
        })
      });
      const createData = await createRes.json();
      const fileId = createData.id;

      // Step B: Upload text content
      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/plain; charset=utf-8'
        },
        body: noteContent
      });

      if (uploadRes.ok) {
        setNoteExportStatus({
          success: true,
          message: `تم تصدير مذكرة "${noteTitle}" بنجاح إلى ملف نصي على Google Drive!`
        });
        setNoteTitle('');
        setNoteContent('');
        fetchDriveFiles(accessToken); // refresh files
      } else {
        throw new Error('Failed to upload notes content');
      }
    } catch (err) {
      console.error('Notes export failed:', err);
      setNoteExportStatus({
        success: false,
        message: 'فشل تصدير المذكرة. يرجى المحاولة لاحقاً.'
      });
    } finally {
      setIsExportingNote(false);
    }
  };

  // 6. Upload any study file from device directly to Google Drive
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      // Step A: Create metadata
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: file.name,
          mimeType: file.type
        })
      });
      const createData = await createRes.json();
      const fileId = createData.id;

      // Read file content
      const fileBuffer = await file.arrayBuffer();

      // Step B: Upload
      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': file.type
        },
        body: fileBuffer
      });

      if (uploadRes.ok) {
        setUploadStatus({
          success: true,
          message: `تم رفع ملف "${file.name}" بنجاح إلى ملفاتك السحابية!`
        });
        fetchDriveFiles(accessToken); // refresh
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadStatus({
        success: false,
        message: 'فشل رفع الملف. يرجى مراجعة حجم الملف ونوعه.'
      });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Helper: Filter drive files locally by search input
  const filteredFiles = driveFiles.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-right" style={{ direction: 'rtl' }}>
      
      {/* Introduction Card */}
      <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Cloud className="w-5.5 h-5.5 text-zinc-600 dark:text-zinc-400" />
              <span>مستودع المذاكرة السحابي (Google Drive)</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              قم بربط حسابك لحفظ تقدمك الدراسي ومذاكرتك على السحابة، واسترجاعها في أي وقت، بالإضافة لتصفح مذكراتك وكتبك مباشرة.
            </p>
          </div>
          
          {/* Google Sign-in / Status Indicator */}
          <div>
            {isAuthenticated ? (
              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 p-2 pr-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="text-right">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">متصل بنجاح</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">{googleUser?.displayName || 'حساب Google'}</span>
                </div>
                {googleUser?.photoURL ? (
                  <img 
                    src={googleUser.photoURL} 
                    alt="avatar" 
                    className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600">G</div>
                )}
                <button
                  onClick={handleDisconnect}
                  className="p-2 mr-2 text-zinc-400 hover:text-red-500 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  title="تسجيل الخروج وفصل الحساب"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="gsi-material-button w-full sm:w-auto shadow-sm"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents text-xs font-semibold">ربط حساب Google Drive</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {isAuthenticated ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Right Column: Backup and Sync */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Backup/Restore Box */}
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <CloudUpload className="w-4.5 h-4.5 text-zinc-500" />
                <span>حفظ واستعادة النسخة السحابية</span>
              </h3>
              
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                اضغط على "نسخ احتياطي" لرفع حالتك الدراسية ومجموع موادك وأوقات تركيزك وسجل الأسئلة مع معلم الـ AI لملف سحابي مشفر وآمن.
              </p>

              {backupStatus && (
                <div className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-xs ${
                  backupStatus.success 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30' 
                    : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border border-red-100 dark:border-red-900/30'
                }`}>
                  {backupStatus.success ? <Check className="w-4.5 h-4.5 flex-shrink-0" /> : <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />}
                  <div>
                    <strong className="font-semibold block">{backupStatus.success ? 'عملية ناجحة' : 'خطأ بالعملية'}</strong>
                    <span>{backupStatus.message}</span>
                    {backupStatus.time && <span className="block mt-1 text-[10px] opacity-80">تم الحفظ الساعة: {backupStatus.time}</span>}
                  </div>
                </div>
              )}

              {/* Status of Cloud Backup */}
              <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 text-xs space-y-2">
                <div className="flex justify-between items-center text-zinc-500">
                  <span>اسم ملف النسخة:</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">thanaweya_study_backup.json</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500">
                  <span>تاريخ آخر تحديث في Drive:</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {isLoadingBackupInfo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : existingBackup ? (
                      new Date(existingBackup.modifiedTime).toLocaleString()
                    ) : (
                      'لا يوجد نسخة احتياطية سابقة'
                    )}
                  </span>
                </div>
                {existingBackup && (
                  <div className="flex justify-between items-center text-zinc-500">
                    <span>حجم الملف السحابي:</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {(Number(existingBackup.size) / 1024).toFixed(2)} KB
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="py-2.5 px-4 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 text-xs font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {isBackingUp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CloudUpload className="w-4 h-4" />
                  )}
                  <span>نسخ احتياطي</span>
                </button>

                <button
                  onClick={handleRestore}
                  disabled={!existingBackup || isLoadingBackupInfo}
                  className="py-2.5 px-4 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  title={!existingBackup ? 'لا توجد نسخة سحابية مسجلة لاستعادتها' : 'استعادة النسخة السحابية المحددة'}
                >
                  {isLoadingBackupInfo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CloudDownload className="w-4 h-4" />
                  )}
                  <span>استعادة البيانات</span>
                </button>
              </div>
            </div>

            {/* Quick Export Text Notes to Drive */}
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-zinc-500" />
                <span>كتابة وتصدير مذكرات لـ Drive</span>
              </h3>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                دون ملاحظات سريعة، ملخصات صعبة، أو كويز قمت بحله، وصدرها لملف نصي (.txt) في حسابك فوراً للرجوع إليها لاحقاً.
              </p>

              {noteExportStatus && (
                <div className={`p-3 rounded-xl text-xs ${noteExportStatus.success ? 'bg-emerald-50 dark:bg-emerald-950/10 text-emerald-700' : 'bg-red-50 dark:bg-red-950/10 text-red-700'}`}>
                  {noteExportStatus.message}
                </div>
              )}

              <form onSubmit={handleExportNote} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="عنوان المذكرة (مثال: تلخيص كيمياء عضوية)"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                />
                <textarea
                  rows={4}
                  required
                  placeholder="اكتب محتوى المذكرة أو انقل الملاحظات الهامة هنا..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100 resize-none"
                ></textarea>

                <button
                  type="submit"
                  disabled={isExportingNote || !noteTitle.trim() || !noteContent.trim()}
                  className="w-full py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isExportingNote ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>تصدير المذكرة إلى Drive</span>
                </button>
              </form>
            </div>
          </div>

          {/* Left Column: Drive File Browser & Upload */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* File List Browser */}
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">تصفح مستندات ومذكرات المذاكرة</h3>
                  <p className="text-[11px] text-zinc-500">مزامنة حية لملفات الـ PDF والصور والملفات النصية لسهولة الوصول والمطالعة.</p>
                </div>

                {/* Upload File Input Button */}
                <div>
                  <label className="cursor-pointer py-2 px-3.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors">
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                    <span>رفع ملف دراسي جديد</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>

              {uploadStatus && (
                <div className={`p-3 rounded-xl text-xs ${uploadStatus.success ? 'bg-emerald-50 dark:bg-emerald-950/10 text-emerald-700' : 'bg-red-50 dark:bg-red-950/10 text-red-700'}`}>
                  {uploadStatus.message}
                </div>
              )}

              {/* Search drive input */}
              <div className="relative">
                <Search className="absolute right-3.5 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="ابحث في ملفات ومذكرات المذاكرة في Drive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              {/* File Table / Grid */}
              {isLoadingFiles ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <span className="text-xs">جاري مزامنة وتحميل قائمة ملفات المذاكرة...</span>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <File className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">لم يتم العثور على مذكرات دراسية أو ملفات متوافقة في هذا الحساب.</p>
                  <p className="text-[10px] text-zinc-400 mt-1">ابدأ برفع مذكراتك لتظهر هنا فوراً.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[380px] overflow-y-auto pr-1">
                  {filteredFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className="py-3.5 flex items-center justify-between gap-3 group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 px-2 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 rounded-xl group-hover:bg-white dark:group-hover:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-850">
                          <FileText className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div className="min-w-0 text-right">
                          <strong className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block truncate" title={file.name}>
                            {file.name}
                          </strong>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">
                            آخر تعديل: {new Date(file.modifiedTime).toLocaleDateString()}
                            {file.size && ` • ${(Number(file.size) / (1024 * 1024)).toFixed(2)} MB`}
                          </span>
                        </div>
                      </div>

                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-150 dark:hover:bg-zinc-850 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center transition-all text-xs gap-1"
                      >
                        <span className="text-[10px] font-semibold hidden sm:inline">فتح في Drive</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Reload list button */}
              <div className="flex justify-end">
                <button
                  onClick={() => fetchDriveFiles(accessToken)}
                  className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>تحديث قائمة الملفات السحابية</span>
                </button>
              </div>
            </div>

            {/* Integration Guide / Benefits */}
            <div className="p-5 rounded-3xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/10 space-y-3">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">💡 مميزات ومنافع ربط Google Drive:</h4>
              <ul className="space-y-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed list-disc pr-4">
                <li>المزامنة السحابية الكاملة تضمن عدم فقدان جدول مذاكرتك أو سجل تقدمك في أي وقت.</li>
                <li>تصدير الملاحظات مباشرة يسهل تجميع مراجعات ليلة الامتحان ومطالعتها من أي جهاز.</li>
                <li>يمكنك رفع جداول امتحاناتك أو بنوك أسئلة بصيغة PDF ومذاكرتها مع تفعيل مؤقت التركيز.</li>
              </ul>
            </div>

          </div>
        </div>
      ) : (
        /* Logged Out View with big placeholder */
        <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-950 flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 rounded-2xl flex items-center justify-center shadow-inner">
            <Cloud className="w-8 h-8 text-zinc-500" />
          </div>
          <div className="space-y-1 text-center">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">الربط غير نشط حالياً</h3>
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
              قم بربط حسابك السحابي بلمسة واحدة لمشاهدة مذكراتك وتحميلها وحفظ تقدمك الدراسي ثانية بثانية على Google Drive لضمان عدم ضياعه.
            </p>
          </div>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-6 py-3 bg-zinc-950 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-950 text-xs font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-md"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Cloud className="w-4 h-4" />
            )}
            <span>تفعيل مزامنة Google Drive السحابية</span>
          </button>
        </div>
      )}

    </div>
  );
}
