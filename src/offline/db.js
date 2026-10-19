import Dexie from 'dexie';

// Database lokal untuk website dan PWA Daily Activity
export const offlineDb = new Dexie('aqpa-daily-activity-offline');

// Skema v1 awal
offlineDb.version(1).stores({
  activities: 'id, userId, serverId, syncStatus, updatedAt',
  attachments: 'id, userId, activityId, syncStatus, createdAt',
  outbox: 'id, userId, entityType, entityId, syncStatus, createdAt'
});

// Skema v2: Unified Offline-First Engine untuk semua modul (Sales, Dinas Luar, Survey Product)
offlineDb.version(2).stores({
  // Modul Sales: data aktivitas lokal dan cache server
  activities: 'id, userId, serverId, syncStatus, updatedAt, createdAt',
  // Lampiran foto/file sebagai Blob di IndexedDB
  attachments: 'id, userId, entityType, entityId, syncStatus, createdAt',
  // Antrean sync outbox terpadu
  outbox: 'id, userId, module, entityType, entityId, syncStatus, createdAt, retryCount',
  // Cache referensi: customers, projects, survey templates, master persiapan dsb
  references: 'key, module, userId, updatedAt',
  // Dinas Luar: daily progress lokal & cache
  dinasProgress: 'id, userId, projectId, unitId, tanggal, syncStatus, updatedAt',
  // Survey Product: drafts lokal & cache
  surveyDrafts: 'id, userId, serverId, noSurvey, status, syncStatus, updatedAt',
  // Auth cache & device activation (offline re-login aman)
  authTokens: 'userId, email, username, updatedAt'
});
