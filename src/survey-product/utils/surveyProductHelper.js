import { apiUrl } from '../../api';
import { offlineEngine } from '../../offline/offlineEngine';

// Default static fallback jika offline atau backend belum merespons
export const DEFAULT_PRODUCT_LIST = [
  { code: 'EJR', name: 'Expansion Joint Rubber', category: 'Expansion joint' },
  { code: 'EJM', name: 'Expansion Joint Metal', category: 'Expansion joint' },
  { code: 'EJF', name: 'Expansion Joint Fabric', category: 'Expansion joint' },
  { code: 'SWG', name: 'Spiral Wound Gasket', category: 'Gasket' },
  { code: 'GMG', name: 'Grooved Metal Gasket', category: 'Gasket' },
  { code: 'RTI', name: 'Removable Thermal Insulation', category: 'Insulasi' },
  { code: 'GPP', name: 'Gland Packing', category: 'Packing' },
  { code: 'DFG', name: 'Die Formed Graphite', category: 'Packing' }
];

export const PRODUCT_LIST = DEFAULT_PRODUCT_LIST;

const CACHE_KEY = 'survey_products_master';

/**
 * Mengambil daftar produk dinamis dari API survey-engine/admin/products
 * dengan fallback ke offline cache dan DEFAULT_PRODUCT_LIST.
 */
export async function fetchSurveyProducts() {
  try {
    const res = await fetch(apiUrl('survey-engine/admin/products'));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Cache ke offlineEngine
        try {
          await offlineEngine.cacheReference(CACHE_KEY, 'survey_product', data);
        } catch (cErr) {
          console.warn('Failed to cache survey products offline:', cErr);
        }
        return data;
      }
    }
  } catch (err) {
    console.warn('Network error fetching survey products, attempting offline cache:', err);
  }

  // Coba ambil dari offline cache
  try {
    const cached = await offlineEngine.getReference(CACHE_KEY);
    if (Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch (cErr) {
    console.warn('Failed to read survey products from offline cache:', cErr);
  }

  return DEFAULT_PRODUCT_LIST;
}

/**
 * Menyimpan / menambahkan produk baru ke server
 */
export async function createSurveyProduct(productData) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl('survey-engine/admin/products'), {
    method: 'POST',
    headers,
    body: JSON.stringify(productData)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || 'Gagal menyimpan produk baru');
  }

  return await res.json();
}

/**
 * Menghapus atau menonaktifkan produk
 */
export async function deleteSurveyProduct(productCode) {
  const token = localStorage.getItem('token');
  const headers = {
    'Accept': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl(`survey-engine/admin/products/${productCode}`), {
    method: 'DELETE',
    headers
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || 'Gagal menghapus produk');
  }

  return await res.json();
}
