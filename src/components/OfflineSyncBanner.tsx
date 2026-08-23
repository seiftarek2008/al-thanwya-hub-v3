/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AI Scheduler V13 — Offline Status Badge & Smart Cloud Sync Banner Component
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Download, AlertCircle, Cloud, Sparkles } from 'lucide-react';
import { getQueuePendingCount, getPendingSyncQueue, dequeueOfflineAction, updateQueueItemStatus } from '../utils/offlineDb';

interface OfflineSyncBannerProps {
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'offline';
  onManualSyncRequest?: () => Promise<void>;
  pendingCount: number;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  isOnline,
  syncStatus,
  onManualSyncRequest,
  pendingCount,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showSyncDetailsModal, setShowSyncDetailsModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (err) {
      console.warn('[PWA] Install prompt error:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 px-4 shadow-sm backdrop-blur-md transition-all text-xs">
      {/* Network Status Badge */}
      <div className="flex items-center gap-2.5">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors ${
            !isOnline
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : syncStatus === 'syncing'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse'
              : syncStatus === 'success'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {!isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <WifiOff className="w-3.5 h-3.5" />
              <span>🟠 وضع بدون إنترنت (Offline)</span>
            </>
          ) : syncStatus === 'syncing' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>☁ جاري المزامنة...</span>
            </>
          ) : syncStatus === 'success' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>✔ تمت المزامنة</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>🟢 أونلاين</span>
            </>
          )}
        </div>

        {/* Offline Notice or Pending Queue Badge */}
        {!isOnline ? (
          <span className="text-zinc-400 flex items-center gap-1 text-[11px] hidden sm:inline-flex">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>ميزات الذكاء الاصطناعي ستعود تلقائياً فور الاتصال بالإنترنت</span>
          </span>
        ) : pendingCount > 0 ? (
          <span className="text-zinc-400 text-[11px] bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
            {pendingCount} تغييرات في انتظار المزامنة
          </span>
        ) : null}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mr-auto">
        {/* Manual Sync Request */}
        {isOnline && onManualSyncRequest && (
          <button
            onClick={onManualSyncRequest}
            disabled={syncStatus === 'syncing'}
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium border border-zinc-700/60 transition-all disabled:opacity-50"
            title="مزامنة التغييرات فوراً مع السحابة"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>مزامنة الآن</span>
          </button>
        )}

        {/* PWA Install Button */}
        {isInstallable && (
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all animate-bounce"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تثبيت التطبيق 📲</span>
          </button>
        )}
      </div>
    </div>
  );
};
