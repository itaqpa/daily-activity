import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
