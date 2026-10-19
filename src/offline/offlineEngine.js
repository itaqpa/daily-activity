// Shared Offline Engine untuk Daily Activity Sales, Dinas Luar, & Survey Product
import { offlineDb } from './db';
import { apiUrl } from '../api';

class OfflineEngine {
  constructor() {
    this.listeners = new Set();
    this.isSyncing = false;
    this.syncStats = {
      pendingCount: 0,
      syncingCount: 0,
      syncedCount: 0,
      failedCount: 0,
      lastSyncTime: null,
      lastError: null
    };

    // Auto-listen window online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notifyListeners();
        this.triggerSync();
      });
      window.addEventListener('offline', () => {
        this.notifyListeners();
      });
    }

    this.refreshCounts();
  }

  // Subscribe to changes (Sync status changes, online/offline changes)
  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.getStatus());
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach(cb => {
      try {
        cb(status);
      } catch (e) {
        console.error('Error in offline engine listener:', e);
      }
    });
  }

  getStatus() {
    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: this.isSyncing,
      ...this.syncStats
    };
  }

  async refreshCounts() {
    try {
      const allOutbox = await offlineDb.outbox.toArray();
      const pending = allOutbox.filter(item => item.syncStatus === 'pending').length;
      const syncing = allOutbox.filter(item => item.syncStatus === 'syncing').length;
      const failed = allOutbox.filter(item => item.syncStatus === 'failed').length;
      
      this.syncStats.pendingCount = pending;
      this.syncStats.syncingCount = syncing;
      this.syncStats.failedCount = failed;
      this.notifyListeners();
    } catch (err) {
      console.warn('Could not refresh outbox counts:', err);
    }
  }

  // =========================================================================
  // REFERENCE DATA CACHE (Customers, Projects, Survey Templates, etc.)
  // =========================================================================
  async cacheReference(key, module, data, userId = 0) {
    try {
      await offlineDb.references.put({
        key,
        module,
        userId: Number(userId || 0),
        data: JSON.parse(JSON.stringify(data)),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(`Failed to cache reference [${key}]:`, err);
    }
  }

  async getReference(key, userId = 0) {
    try {
      const rec = await offlineDb.references.get(key);
      if (rec) return rec.data;
      return null;
    } catch (err) {
      console.error(`Failed to get cached reference [${key}]:`, err);
      return null;
    }
  }

  // =========================================================================
  // ATTACHMENT BLOB STORAGE
  // =========================================================================
  async saveAttachmentBlob({ id, userId, entityType, entityId, blob, meta = {} }) {
    const attachmentId = id || `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const record = {
      id: attachmentId,
      userId: Number(userId || 0),
      entityType,
      entityId,
      blob,
      meta,
      syncStatus: 'pending',
      createdAt: new Date().toISOString()
    };
    await offlineDb.attachments.put(record);
    return attachmentId;
  }

  async getAttachmentBlob(id) {
    const record = await offlineDb.attachments.get(id);
    return record?.blob || null;
  }

  async getAttachmentsForEntity(entityType, entityId) {
    return await offlineDb.attachments
      .where('entityType')
      .equals(entityType)
      .and(item => item.entityId === entityId)
      .toArray();
  }

  // =========================================================================
  // OUTBOX QUEUEING
  // =========================================================================
  async queueOperation({ module, entityType, entityId, action, payload, userId }) {
    const localId = `out_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const outboxItem = {
      id: localId,
      userId: Number(userId || 0),
      module,
      entityType,
      entityId,
      action, // 'CREATE' | 'UPDATE' | 'DELETE' | 'UPLOAD_FILE'
      payload: JSON.parse(JSON.stringify(payload)),
      syncStatus: 'pending',
      retryCount: 0,
      lastError: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDb.outbox.put(outboxItem);
    await this.refreshCounts();

    // Trigger sync jika sedang online
    if (navigator.onLine) {
      this.triggerSync();
    }

    return outboxItem;
  }

  // =========================================================================
  // MODUL 1: DAILY ACTIVITY SALES
  // =========================================================================
  async saveSalesActivity({ activityData, userId }) {
    const isNew = !activityData.id || String(activityData.id).startsWith('local_');
    const localId = activityData.id || `local_act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const record = {
      ...activityData,
      id: localId,
      userId: Number(userId || 0),
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
      createdAt: activityData.createdAt || new Date().toISOString()
    };

    // 1. Simpan di tabel Dexie activities
    await offlineDb.activities.put(record);

    // 2. Simpan foto/file jika ada
    if (activityData.photos && Array.isArray(activityData.photos)) {
      for (const p of activityData.photos) {
        if (p.blob) {
          await this.saveAttachmentBlob({
            id: p.id,
            userId,
            entityType: 'activity_sales',
            entityId: localId,
            blob: p.blob,
            meta: { filename: p.filename || 'foto.jpg', cat: p.cat }
          });
        }
      }
    }

    // 3. Masukkan ke outbox queue
    await this.queueOperation({
      module: 'sales_activity',
      entityType: 'daily_activity_sales',
      entityId: localId,
      action: isNew ? 'CREATE' : 'UPDATE',
      payload: record,
      userId
    });

    return record;
  }

  async getSalesActivities(userId = 0) {
    try {
      const activities = await offlineDb.activities.toArray();
      if (!userId) return activities;
      return activities.filter(a => Number(a.userId) === Number(userId) || Number(a.user_id) === Number(userId));
    } catch (err) {
      console.error('Failed to get sales activities from offlineDb:', err);
      return [];
    }
  }

  // =========================================================================
  // MODUL 2: DINAS LUAR (DAILY PROGRESS & LAPORAN)
  // =========================================================================
  async saveDinasProgress({ progressData, userId }) {
    const localId = progressData.id || `local_dp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const record = {
      ...progressData,
      id: localId,
      userId: Number(userId || 0),
      projectId: progressData.project_id || progressData.projectId,
      unitId: progressData.unit_id || progressData.unitId,
      tanggal: progressData.tanggal,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString()
    };

    await offlineDb.dinasProgress.put(record);

    await this.queueOperation({
      module: 'dinas_luar',
      entityType: 'daily_progress',
      entityId: localId,
      action: 'CREATE',
      payload: record,
      userId
    });

    return record;
  }

  async getDinasProgressByProject(projectId) {
    try {
      const all = await offlineDb.dinasProgress.toArray();
      return all.filter(p => String(p.projectId) === String(projectId));
    } catch (err) {
      console.error('Failed to get dinas progress:', err);
      return [];
    }
  }

  // =========================================================================
  // MODUL 3: SURVEY PRODUCT
  // =========================================================================
  async saveSurveyDraft({ surveyId, status, data, selectedProducts, schedules, userId }) {
    const localId = surveyId || `local_surv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const record = {
      id: localId,
      userId: Number(userId || 0),
      serverId: (surveyId && !String(surveyId).startsWith('local_')) ? surveyId : null,
      noSurvey: data?.no_survey || null,
      status: status || 'Draft',
      data,
      selected_products: selectedProducts,
      schedules,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString()
    };

    await offlineDb.surveyDrafts.put(record);

    await this.queueOperation({
      module: 'survey_product',
      entityType: 'survey_draft',
      entityId: localId,
      action: record.serverId ? 'UPDATE' : 'CREATE',
      payload: record,
      userId
    });

    return record;
  }

  async saveSurveyPersiapan({ surveyId, items, userId }) {
    const record = await offlineDb.surveyDrafts.get(surveyId);
    if (record) {
      record.persiapan = { items, updatedAt: new Date().toISOString() };
      record.syncStatus = 'pending';
      record.updatedAt = new Date().toISOString();
      await offlineDb.surveyDrafts.put(record);
    }

    await this.queueOperation({
      module: 'survey_product',
      entityType: 'survey_persiapan',
      entityId: surveyId,
      action: 'UPDATE_PERSIAPAN',
      payload: { survey_id: surveyId, items },
      userId
    });
  }

  async saveSurveyLapangan({ surveyId, payload, userId }) {
    const record = await offlineDb.surveyDrafts.get(surveyId);
    if (record) {
      record.lapangan = payload;
      record.syncStatus = 'pending';
      record.updatedAt = new Date().toISOString();
      await offlineDb.surveyDrafts.put(record);
    }

    await this.queueOperation({
      module: 'survey_product',
      entityType: 'survey_lapangan',
      entityId: surveyId,
      action: 'SUBMIT_LAPANGAN',
      payload: { ...payload, survey_id: surveyId },
      userId
    });
  }

  async saveSurveyPhotoOffline({ surveyId, photoItem, userId }) {
    const photoId = photoItem.id || `p_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Simpan blob jika ada data base64 / blob
    let blob = photoItem.blob;
    if (!blob && photoItem.data && photoItem.data.startsWith('data:')) {
      const res = await fetch(photoItem.data);
      blob = await res.blob();
    }

    if (blob) {
      await this.saveAttachmentBlob({
        id: photoId,
        userId,
        entityType: 'survey_photo',
        entityId: surveyId,
        blob,
        meta: {
          filename: photoItem.filename || 'photo.jpg',
          category: photoItem.cat || 'Lainnya',
          productCode: photoItem.productCode || 'product',
          noSurvey: photoItem.noSurvey || 'survey'
        }
      });
    }

    await this.queueOperation({
      module: 'survey_product',
      entityType: 'survey_photo',
      entityId: photoId,
      action: 'UPLOAD_PHOTO',
      payload: {
        photoId,
        surveyId,
        noSurvey: photoItem.noSurvey,
        productCode: photoItem.productCode,
        category: photoItem.cat || 'Lainnya',
        filename: photoItem.filename || 'photo.jpg',
        data: photoItem.data || null
      },
      userId
    });

    return photoId;
  }

  async getSurveyDraft(id) {
    return await offlineDb.surveyDrafts.get(id);
  }

  async getAllSurveyDrafts(userId = 0) {
    const all = await offlineDb.surveyDrafts.toArray();
    if (!userId) return all;
    return all.filter(s => Number(s.userId) === Number(userId));
  }

  // =========================================================================
  // SYNC DISPATCHER & CONFLICT DETECTION
  // =========================================================================
  async triggerSync() {
    if (this.isSyncing) return;
    if (!navigator.onLine) {
      console.log('[OfflineEngine] Device is offline, skipping sync trigger.');
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[OfflineEngine] Cannot sync: user is not authenticated with valid token.');
        this.isSyncing = false;
        this.notifyListeners();
        return;
      }

      // Ambil seluruh queue outbox berurutan
      const queue = await offlineDb.outbox
        .where('syncStatus')
        .anyOf(['pending', 'failed'])
        .sortBy('createdAt');

      if (queue.length === 0) {
        this.isSyncing = false;
        this.notifyListeners();
        return;
      }

      console.log(`[OfflineEngine] Starting synchronization for ${queue.length} items...`);

      for (const item of queue) {
        // Tandai syncing
        await offlineDb.outbox.update(item.id, { syncStatus: 'syncing' });
        await this.refreshCounts();

        try {
          const syncResult = await this.processSyncItem(item, token);
          if (syncResult.success) {
            // Berhasil: hapus dari outbox
            await offlineDb.outbox.delete(item.id);
            this.syncStats.syncedCount++;
          } else if (syncResult.isConflict) {
            // Konflik terdeteksi
            await offlineDb.outbox.update(item.id, {
              syncStatus: 'failed',
              lastError: syncResult.error || 'Konflik versi terdeteksi',
              retryCount: (item.retryCount || 0) + 1
            });
            this.syncStats.lastError = syncResult.error;
          } else {
            // Gagal non-fatal (misal server mati, bad request)
            await offlineDb.outbox.update(item.id, {
              syncStatus: 'failed',
              lastError: syncResult.error || 'Gagal mengirim data ke server',
              retryCount: (item.retryCount || 0) + 1
            });
            this.syncStats.lastError = syncResult.error;
          }
        } catch (itemErr) {
          console.error(`[OfflineEngine] Error syncing item ${item.id}:`, itemErr);
          await offlineDb.outbox.update(item.id, {
            syncStatus: 'failed',
            lastError: itemErr.message,
            retryCount: (item.retryCount || 0) + 1
          });
          this.syncStats.lastError = itemErr.message;
        }

        await this.refreshCounts();
      }

      this.syncStats.lastSyncTime = new Date().toISOString();
    } catch (err) {
      console.error('[OfflineEngine] Global sync error:', err);
      this.syncStats.lastError = err.message;
    } finally {
      this.isSyncing = false;
      await this.refreshCounts();
      this.notifyListeners();
    }
  }

  /**
   * Eksekusi satu item outbox ke endpoint server yang relevan
   */
  async processSyncItem(item, token) {
    const { module, entityType, action, payload } = item;

    // 1. SALES ACTIVITY SYNC
    if (module === 'sales_activity') {
      const targetId = payload.serverId || payload.id;
      const isLocalId = !targetId || String(targetId).startsWith('local_') || String(item.entityId).startsWith('local_');
      const isCreate = action === 'CREATE' || (!payload.serverId && isLocalId);
      
      const endpoint = isCreate ? apiUrl('/activities') : apiUrl(`/activities/${targetId}`);
      const method = isCreate ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...payload,
          _local_id: item.entityId
        })
      });

      if (!res.ok) {
        if (res.status === 409) {
          return { success: false, isConflict: true, error: 'Data aktivitas telah diubah di server.' };
        }
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error || `Server returned ${res.status}` };
      }

      const serverRecord = await res.json();
      // Update local activities record dengan serverId & status synced
      await offlineDb.activities.update(item.entityId, {
        serverId: serverRecord.id,
        syncStatus: 'synced',
        updatedAt: serverRecord.updated_at || new Date().toISOString()
      });

      return { success: true };
    }

    // 2. DINAS LUAR (DAILY PROGRESS) SYNC
    if (module === 'dinas_luar') {
      const res = await fetch(apiUrl('/daily-progress'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error || `Server returned ${res.status}` };
      }

      await offlineDb.dinasProgress.update(item.entityId, {
        syncStatus: 'synced',
        updatedAt: new Date().toISOString()
      });

      return { success: true };
    }

    // 3. SURVEY PRODUCT SYNC
    if (module === 'survey_product') {
      if (entityType === 'survey_draft') {
        const res = await fetch(apiUrl('survey-engine/product-drafts'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            survey_id: payload.serverId || (String(payload.id).startsWith('local_') ? null : payload.id),
            status: payload.status,
            data: payload.data,
            selected_products: payload.selected_products,
            schedules: payload.schedules
          })
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          return { success: false, error: errJson.error || `Server returned ${res.status}` };
        }

        const resData = await res.json();
        const serverId = resData.survey_id;

        await offlineDb.surveyDrafts.update(item.entityId, {
          serverId,
          noSurvey: resData.no_survey || payload.noSurvey,
          syncStatus: 'synced',
          updatedAt: new Date().toISOString()
        });

        return { success: true };
      }

      if (entityType === 'survey_persiapan') {
        let surveyId = payload.survey_id;
        // Resolve serverId if local
        if (String(surveyId).startsWith('local_')) {
          const draft = await offlineDb.surveyDrafts.get(surveyId);
          if (draft && draft.serverId) {
            surveyId = draft.serverId;
          } else {
            return { success: false, error: 'Draft induk belum memiliki serverId, menunggu sync draft' };
          }
        }

        const res = await fetch(apiUrl(`survey-engine/product-drafts/${surveyId}/persiapan`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'Draft',
            items: payload.items
          })
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          return { success: false, error: errJson.error || `Server returned ${res.status}` };
        }

        return { success: true };
      }

      if (entityType === 'survey_lapangan') {
        let surveyId = payload.survey_id;
        if (String(surveyId).startsWith('local_')) {
          const draft = await offlineDb.surveyDrafts.get(surveyId);
          if (draft && draft.serverId) {
            surveyId = draft.serverId;
          } else {
            return { success: false, error: 'Draft induk belum memiliki serverId, menunggu sync draft' };
          }
        }

        const res = await fetch(apiUrl('survey-engine/submit-lapangan'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...payload,
            survey_id: surveyId
          })
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          return { success: false, error: errJson.error || `Server returned ${res.status}` };
        }

        return { success: true };
      }

      if (entityType === 'survey_photo') {
        let photoData = payload.data;
        if (!photoData) {
          // Ambil dari blob IndexedDB jika tidak ada base64
          const att = await offlineDb.attachments.get(payload.photoId);
          if (att && att.blob) {
            photoData = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(att.blob);
            });
          }
        }

        if (!photoData) {
          return { success: false, error: 'Blob foto tidak ditemukan di IndexedDB' };
        }

        const res = await fetch(apiUrl('survey-engine/upload-photo'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            data: photoData,
            filename: payload.filename || 'photo.jpg',
            category: payload.category || 'Lainnya',
            noSurvey: payload.noSurvey || 'survey',
            productCode: payload.productCode || 'product'
          })
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          return { success: false, error: errJson.error || `Server returned ${res.status}` };
        }

        const uploadResult = await res.json();
        // Update URL di attachments IndexedDB
        await offlineDb.attachments.update(payload.photoId, {
          syncStatus: 'synced',
          meta: { ...(await offlineDb.attachments.get(payload.photoId))?.meta, serverUrl: uploadResult.url }
        });

        return { success: true };
      }
    }

    return { success: false, error: `Modul tidak dikenal: ${module}` };
  }
}

export const offlineEngine = new OfflineEngine();
