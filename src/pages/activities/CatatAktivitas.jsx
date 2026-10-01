import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { Save, AlertCircle } from 'lucide-react';
import { apiUrl } from '../../api';

export default function CatatAktivitas() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [customers, setCustomers] = useState([]);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    site_kota: '',
    jenis_aktivitas: '',
    ditemui: [],
    ditemui_lainnya: '',
    tanggal: new Date().toISOString().split('T')[0],
    catatan: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const jenisAktivitasOptions = [
    'Kunjungan (Promote)',
    'Survey Potensial Order / Tender',
    'Submit Quotation',
    'Meeting Tender',
    'Meeting / Survey PO Diterima',
    'Say Hello (Telp / WhatsApp)'
  ];

  const ditemuiOptions = ['Purchaser', 'User', 'Engineer', 'Planner', 'Lainnya'];

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const url = new URL(apiUrl('/customers'), window.location.origin);
      
      const isSuperAdmin = user.jabatan === 'Super Admin' || user.username === 'admin' || user.role === 'superadmin';
      const isSPV = user.jabatan?.toLowerCase().includes('spv') || user.jabatan?.toLowerCase().includes('supervisor');
      
      // Jika bukan Super Admin dan bukan SPV, hanya tampilkan customer miliknya sendiri
      if (!isSuperAdmin && !isSPV) {
        url.searchParams.append('sales_id', user.id);
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    const selectedCust = customers.find(c => c.id.toString() === custId);
    
    let defaultSite = '';
    if (selectedCust && Array.isArray(selectedCust.site_kota) && selectedCust.site_kota.length > 0) {
      defaultSite = selectedCust.site_kota[0];
    } else {
      defaultSite = 'Umum / tidak spesifik';
    }

    setFormData(prev => ({
      ...prev,
      customer_id: custId,
      site_kota: defaultSite
    }));
  };

  const handleCheckboxChange = (option) => {
    setFormData(prev => {
      const isSelected = prev.ditemui.includes(option);
      if (isSelected) {
        return { ...prev, ditemui: prev.ditemui.filter(item => item !== option) };
      } else {
        return { ...prev, ditemui: [...prev.ditemui, option] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        user_id: user.id
      };

      if (!navigator.onLine) {
        // Save to offline queue
        const offlineQueue = JSON.parse(localStorage.getItem('offlineActivities') || '[]');
        offlineQueue.push({ ...payload, _offline_id: Date.now() });
        localStorage.setItem('offlineActivities', JSON.stringify(offlineQueue));
        
        setSuccess('Anda sedang offline. Aktivitas berhasil disimpan lokal dan akan disinkronisasi saat online!');
        resetFormAndRedirect();
        return;
      }

      const response = await fetch(apiUrl('/activities'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Gagal menyimpan aktivitas');
      }

      setSuccess('Aktivitas berhasil disimpan!');
      resetFormAndRedirect();

    } catch (err) {
      if (err.message === 'Failed to fetch') {
        // Network error (server down or no internet even though navigator.onLine was true)
        const payload = { ...formData, user_id: user.id };
        const offlineQueue = JSON.parse(localStorage.getItem('offlineActivities') || '[]');
        offlineQueue.push({ ...payload, _offline_id: Date.now() });
        localStorage.setItem('offlineActivities', JSON.stringify(offlineQueue));
        
        setSuccess('Server tidak dapat dijangkau. Aktivitas disimpan lokal dan akan disinkronisasi nanti!');
        resetFormAndRedirect();
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetFormAndRedirect = () => {
    // Reset form
    setFormData({
      customer_id: '',
      site_kota: '',
      jenis_aktivitas: '',
      ditemui: [],
      ditemui_lainnya: '',
      tanggal: new Date().toISOString().split('T')[0],
      catatan: ''
    });
    
    // Optionally redirect to riwayat
    setTimeout(() => {
      navigate('/activities');
    }, 2000);
  };

  const selectedCustomerObj = customers.find(c => c.id.toString() === formData.customer_id);
  const availableSites = selectedCustomerObj && Array.isArray(selectedCustomerObj.site_kota) 
    ? selectedCustomerObj.site_kota 
    : [];

  return (
    <MainLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Catat Aktivitas</h2>
        <p className="text-gray-600 mt-1">Form input untuk mencatat daily activity sales. Anda login sebagai: <span className="font-semibold">{user.name}</span></p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-3xl">
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r">
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Customer & Site/Kota */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer <span className="text-red-500">*</span></label>
                <select 
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleCustomerChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">-- Pilih Customer --</option>
                  {customers.map(cust => (
                    <option key={cust.id} value={cust.id}>{cust.nama_customer}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Site / Kota</label>
                {availableSites.length > 0 ? (
                  <select 
                    name="site_kota"
                    value={formData.site_kota}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {availableSites.map((site, i) => (
                      <option key={i} value={site}>{site}</option>
                    ))}
                    <option value="Lainnya">Lainnya...</option>
                  </select>
                ) : (
                  <input 
                    type="text"
                    name="site_kota"
                    value={formData.site_kota}
                    onChange={handleChange}
                    placeholder="Umum / tidak spesifik"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  />
                )}
              </div>
            </div>

            {/* Jenis Aktivitas */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Aktivitas <span className="text-red-500">*</span></label>
              <select 
                name="jenis_aktivitas"
                value={formData.jenis_aktivitas}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">-- Pilih Aktivitas --</option>
                {jenisAktivitasOptions.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Yang Akan Ditemui */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Yang Akan Ditemui (bisa pilih lebih dari 1)</label>
              <div className="flex flex-wrap gap-4">
                {ditemuiOptions.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={formData.ditemui.includes(opt)}
                      onChange={() => handleCheckboxChange(opt)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
                  </label>
                ))}
              </div>
              
              {formData.ditemui.includes('Lainnya') && (
                <div className="mt-3">
                  <input 
                    type="text"
                    name="ditemui_lainnya"
                    value={formData.ditemui_lainnya}
                    onChange={handleChange}
                    placeholder="Sebutkan yang ditemui lainnya..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Tanggal & Catatan */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal <span className="text-red-500">*</span></label>
                <input 
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  required
                  className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan (opsional)</label>
                <textarea 
                  name="catatan"
                  value={formData.catatan}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Contoh: Diskusi kebutuhan RTI untuk unit baru..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                ></textarea>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button 
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70"
              >
                <Save size={18} />
                {loading ? 'Menyimpan...' : 'Simpan Aktivitas'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
