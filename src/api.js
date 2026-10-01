const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function apiUrl(path) {
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
