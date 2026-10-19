import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { offlineEngine } from '../offline/offlineEngine';

export default function OfflineSyncIndicator() {
  const [engineState, setEngineState] = useState(offlineEngine.getStatus());
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineEngine.subscribe((state) => {
      setEngineState({ ...state });
    });
    return unsubscribe;
  }, []);

  const { isOnline, isSyncing, pendingCount, syncingCount, failedCount, syncedCount, lastError } = engineState;

  const totalPending = pendingCount + syncingCount + failedCount;

  return (
    <div className="relative inline-flex items-center">
      {/* Badge Button */}
      <button
        onClick={() => setShowDetail(!showDetail)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border shadow-xs ${
          !isOnline
            ? 'bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100'
            : isSyncing
            ? 'bg-blue-50 text-blue-700 border-blue-200/80 animate-pulse'
            : failedCount > 0
            ? 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100'
            : totalPending > 0
            ? 'bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100'
            : 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
        }`}
        title="Status Koneksi & Sinkronisasi Offline"
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="tracking-tight">Offline</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
            <span className="tracking-tight">Sync ({syncingCount || totalPending})</span>
          </>
        ) : failedCount > 0 ? (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="tracking-tight">Error ({failedCount})</span>
          </>
        ) : totalPending > 0 ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="tracking-tight">Pending ({totalPending})</span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="tracking-tight font-medium">Online</span>
          </>
        )}
      </button>

      {/* Popover Detail Modal */}
      {showDetail && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDetail(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 text-left text-xs animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
              <span className="font-bold text-gray-800 text-sm">Status Sinkronisasi</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {isOnline ? 'Terhubung' : 'Terputus (Offline)'}
              </span>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center text-gray-600">
                <span>Antrean Pending:</span>
                <span className="font-bold text-gray-900">{pendingCount}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Sedang Dikirim:</span>
                <span className="font-bold text-blue-600">{syncingCount}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Berhasil Disinkron:</span>
                <span className="font-bold text-emerald-600">{syncedCount}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Gagal / Konflik:</span>
                <span className="font-bold text-red-600">{failedCount}</span>
              </div>
            </div>

            {lastError && (
              <div className="p-2 mb-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-[11px] leading-tight">
                <strong>Catatan Sync:</strong> {lastError}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => {
                  offlineEngine.triggerSync();
                }}
                disabled={isSyncing || !isOnline}
                className={`w-full py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  isSyncing || !isOnline
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sedang Sinkronisasi...' : 'Sinkronkan Data (Retry)'}
              </button>

              <button
                onClick={async () => {
                  if ('serviceWorker' in navigator) {
                    try {
                      const reg = await navigator.serviceWorker.getRegistration();
                      if (reg) {
                        await reg.update();
                      }
                      window.location.reload();
                    } catch (e) {
                      window.location.reload();
                    }
                  } else {
                    window.location.reload();
                  }
                }}
                className="w-full py-1.5 px-3 rounded-lg font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 flex items-center justify-center gap-1.5 transition-colors text-[11px]"
              >
                <RefreshCw className="w-3 h-3 text-gray-500" />
                Periksa & Muat Ulang Versi Baru
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
