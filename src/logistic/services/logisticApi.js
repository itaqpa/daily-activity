const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8400/api';

export const logisticApi = {
  // 1. Profil Driver & Armada
  getDriverProfile: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/logistic/driver/profile?${query}`);
    if (!res.ok) throw new Error('Gagal mengambil profil driver');
    return res.json();
  },

  // 2. Daftar Tugas Driver (dengan filter periode harian, mingguan, bulanan, dll)
  getDriverTasks: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/logistic/driver/tasks?${query}`);
    if (!res.ok) throw new Error('Gagal mengambil daftar tugas');
    return res.json();
  },

  // 3. Update Status Tugas
  updateTaskStatus: async (taskId, payload) => {
    const res = await fetch(`${API_BASE}/logistic/tasks/${taskId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memperbarui status tugas');
    }
    return res.json();
  },

  // 4. Shift Driver (Today, Clock In, Clock Out)
  getTodayShift: async (driverId) => {
    const query = driverId ? `?driver_id=${driverId}` : '';
    const res = await fetch(`${API_BASE}/logistic/driver/shifts/today${query}`);
    if (!res.ok) throw new Error('Gagal mengambil data shift hari ini');
    return res.json();
  },

  clockIn: async (payload) => {
    const res = await fetch(`${API_BASE}/logistic/driver/shifts/clock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal melakukan Clock In');
    }
    return res.json();
  },

  clockOut: async (payload) => {
    const res = await fetch(`${API_BASE}/logistic/driver/shifts/clock-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal melakukan Clock Out');
    }
    return res.json();
  },

  // 5. Laporan & Rekap KPI Driver
  getDriverReports: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/logistic/driver/reports?${query}`);
    if (!res.ok) throw new Error('Gagal mengambil data laporan driver');
    return res.json();
  },

  // 6. Centralized Attachment
  saveAttachment: async (payload) => {
    const res = await fetch(`${API_BASE}/logistic/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Gagal mengunggah lampiran');
    return res.json();
  },

  // 7. Sinkronisasi Data dari Database Driver Apps
  syncDriverApps: async () => {
    const res = await fetch(`${API_BASE}/logistic/sync-driver-apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal melakukan sinkronisasi dengan database driver_apps');
    }
    return res.json();
  },

  // 8. Master Kendaraan & Driver
  getVehicles: async () => {
    const res = await fetch(`${API_BASE}/logistic/vehicles`);
    if (!res.ok) throw new Error('Gagal mengambil daftar kendaraan');
    return res.json();
  },

  getDrivers: async () => {
    const res = await fetch(`${API_BASE}/logistic/drivers`);
    if (!res.ok) throw new Error('Gagal mengambil daftar driver');
    return res.json();
  },

  // 9. Manifest Penugasan Driver
  getManifests: async () => {
    const res = await fetch(`${API_BASE}/logistic/manifests`);
    if (!res.ok) throw new Error('Gagal mengambil daftar manifest penugasan');
    return res.json();
  },

  createManifest: async (payload) => {
    const res = await fetch(`${API_BASE}/logistic/manifests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal membuat manifest penugasan');
    }
    return res.json();
  }
};

