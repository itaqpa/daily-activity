const API_BASE_URL =
  window.__APP_CONFIG__?.VITE_API_URL || import.meta.env.VITE_API_URL || '/api';

export function apiUrl(path) {
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

// Global Fetch Interceptor to attach JWT token
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  if (typeof resource === 'string' && resource.startsWith(API_BASE_URL)) {
    const token = localStorage.getItem('token');
    if (token) {
      config = config || {};
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }
  
  return originalFetch(resource, config);
};
