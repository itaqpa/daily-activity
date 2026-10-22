import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Auto Update Service Worker PWA saat ada rilis/deploy baru
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Otomatis update aset ke versi baru saat terdeteksi versi baru dari server
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] Aplikasi siap digunakan offline.');
  },
});

// Pengecekan update berkala setiap 15 menit jika sedang online
if ('serviceWorker' in navigator) {
  setInterval(async () => {
    if (navigator.onLine) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.update();
        }
      } catch (err) {
        console.warn('[PWA] Gagal mengecek update service worker:', err);
      }
    }
  }, 15 * 60 * 1000);
}

// Global Fetch Interceptor
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  const token = localStorage.getItem('token');
  
  if (token) {
    if (!config) config = {};
    if (!config.headers) config.headers = {};
    
    // Menambahkan Authorization header jika belum ada
    if (config.headers instanceof Headers) {
      if (!config.headers.has('Authorization')) {
        config.headers.append('Authorization', `Bearer ${token}`);
      }
    } else if (Array.isArray(config.headers)) {
      if (!config.headers.some(h => h[0].toLowerCase() === 'authorization')) {
        config.headers.push(['Authorization', `Bearer ${token}`]);
      }
    } else {
      const authKey = Object.keys(config.headers).find(k => k.toLowerCase() === 'authorization');
      if (!authKey) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }

  // Tangani GET request caching otomatis (Stale-While-Revalidate / Offline Fallback)
  const method = (config?.method || 'GET').toUpperCase();
  const urlString = typeof resource === 'string' ? resource : resource?.url || '';

  // Daftar pola URL yang otomatis di-cache untuk offline browsing seluruh modul:
  // - activities, customers, sales (Daily Activity Sales Dashboard & Laporan)
  // - report/all-costs, installation-project, projects (Dinas Luar Summary & Pengeluaran)
  // - survey-engine, surveys (Survey Product Laporan & Drafts)
  const isCacheableGet = method === 'GET' && (
    urlString.includes('/api/activities') ||
    urlString.includes('/api/customers') ||
    urlString.includes('/api/sales') ||
    urlString.includes('/api/report/all-costs') ||
    urlString.includes('/api/install-projects') ||
    urlString.includes('/api/installation-project') ||
    urlString.includes('/api/survey-engine') ||
    urlString.includes('/api/surveys')
  );

  const cacheKey = `offline_cache_${urlString}`;

  if (isCacheableGet) {
    try {
      const response = await originalFetch(resource, config);
      if (response && response.ok) {
        // Clone response dan simpan ke localStorage sebagai cache snapshot
        try {
          const clone = response.clone();
          clone.text().then(text => {
            try {
              localStorage.setItem(cacheKey, text);
            } catch (e) {
              console.warn('[PWA Cache] Storage quota exceeded for:', urlString);
            }
          });
        } catch (_) {}
      }
      return response;
    } catch (networkError) {
      // Saat offline atau server mati: ambil data dari cache lokal agar summary/laporan tetap tampil!
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        console.log('[PWA Offline Fallback] Menggunakan data cache untuk:', urlString);
        return new Response(cachedData, {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw networkError;
    }
  }

  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
