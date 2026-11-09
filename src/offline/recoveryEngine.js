import { offlineDb } from './db';
import { apiUrl } from '../api';

class RecoveryEngine {
  constructor() {
    this.isHarvesting = false;
  }

  /**
   * Pindai seluruh IndexedDB & LocalStorage untuk data tanggal 19 Oktober s/d 6 November
   * dan kirimkan ke server agar data yang hilang di-restore.
   */
  async autoHarvestAndRestore(user) {
    if (this.isHarvesting) return;
    if (typeof window === 'undefined' || !navigator.onLine) return;

    // Cek apakah perangkat ini sudah pernah sukses restore hari ini
    const lastRestoredDate = localStorage.getItem('aqpa_recovery_harvest_done');
    const todayStr = new Date().toISOString().split('T')[0];
    if (lastRestoredDate === todayStr) {
      return; // Sudah berhasil disetor hari ini
    }

    this.isHarvesting = true;
    console.log('[RecoveryEngine] Memulai scanning data offline di perangkat...');

    try {
      // 1. Ambil seluruh data activities dari Dexie IndexedDB
      const allActivities = await offlineDb.activities.toArray().catch(() => []);
      
      // Ambil juga jika ada di antrean outbox
      const outboxActivities = await offlineDb.outbox
        .where('module')
        .equals('sales_activity')
        .toArray()
        .catch(() => []);
      const outboxPayloads = outboxActivities
        .map(o => o.payload)
        .filter(p => p && p.tanggal);

      // Ambil juga dari snapshot localStorage jika ada
      let snapshotActivities = [];
      try {
        const snapRaw = localStorage.getItem('offline_cache_/api/activities');
        if (snapRaw) {
          const parsed = JSON.parse(snapRaw);
          if (Array.isArray(parsed)) snapshotActivities = parsed;
        }
      } catch (_) {}

      // Gabungkan semua kandidat data
      const candidateMap = new Map();
      [...allActivities, ...outboxPayloads, ...snapshotActivities].forEach(act => {
        if (!act || !act.tanggal) return;
        // Key unik berdasarkan user_id, tanggal, dan customer_id
        const key = `${act.user_id || act.userId || '_'}_${act.tanggal}_${act.customer_id || '_'}_${act.jenis_aktivitas || '_'}`;
        if (!candidateMap.has(key)) {
          candidateMap.set(key, act);
        }
      });

      const uniqueActivities = Array.from(candidateMap.values());

      // Filter: Hanya kirim data yang berada di rentang musibah (>= 2026-10-19)
      const activitiesToRestore = uniqueActivities.filter(act => {
        const tgl = String(act.tanggal).slice(0, 10);
        return tgl >= '2026-10-19';
      });

      console.log(`[RecoveryEngine] Ditemukan ${activitiesToRestore.length} data aktivitas pada rentang 19 Okt - sekarang.`);

      if (activitiesToRestore.length > 0) {
        const token = localStorage.getItem('token');
        const payload = {
          user_id: user?.id || null,
          user_email: user?.email || user?.username || null,
          activities: activitiesToRestore
        };

        const response = await fetch(apiUrl('/recovery/harvest'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const resJson = await response.json();
          console.log('[RecoveryEngine] Berhasil memulihkan data ke database server:', resJson);
          localStorage.setItem('aqpa_recovery_harvest_done', todayStr);
        } else {
          console.warn('[RecoveryEngine] Server menolak recovery payload:', response.status);
        }
      } else {
        // Tidak ada data hilang di perangkat ini
        localStorage.setItem('aqpa_recovery_harvest_done', todayStr);
      }
    } catch (err) {
      console.error('[RecoveryEngine] Gagal mengeksekusi recovery harvesting:', err);
    } finally {
      this.isHarvesting = false;
    }
  }

  /**
   * Fitur download file JSON cadangan langsung dari HP/Laptop user
   */
  async exportBackupJson() {
    try {
      const activities = await offlineDb.activities.toArray().catch(() => []);
      const dinas = await offlineDb.dinasProgress.toArray().catch(() => []);
      const survey = await offlineDb.surveyDrafts.toArray().catch(() => []);
      
      const backupData = {
        exportedAt: new Date().toISOString(),
        device: navigator.userAgent,
        data: {
          activities,
          dinas,
          survey
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AQPA_RECOVERY_BACKUP_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error('Failed to export backup JSON:', e);
      return false;
    }
  }
}

export const recoveryEngine = new RecoveryEngine();

