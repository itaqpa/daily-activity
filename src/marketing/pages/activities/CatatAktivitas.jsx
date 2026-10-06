import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { Save, AlertCircle } from 'lucide-react';
import { apiUrl } from '../../../api';
import Select from 'react-select';

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
      
      // Semua role sales (Staff, Leader, SPV, Manager) HANYA BISA memilih customer yang di-assign kepadanya.
      if (!isSuperAdmin) {
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

  const [selectedCustomerName, setSelectedCustomerName] = useState('');

  const uniqueCustomerNames = Array.from(new Set(customers.map(c => c.nama_customer))).filter(Boolean);

  const handleCustomerNameChange = (e) => {
    const custName = e.target.value;
    setSelectedCustomerName(custName);
    
    if (!custName) {
      setFormData(prev => ({ ...prev, customer_id: '', site_kota: '' }));
      return;
    }

    const rows = customers.filter(c => c.nama_customer === custName);
    let allSites = [];
    rows.forEach(r => {
      if (Array.isArray(r.site_kota)) {
        r.site_kota.forEach(site => {
          allSites.push({ site, id: r.id });
        });
      }
    });

    if (allSites.length > 0) {
      setFormData(prev => ({
        ...prev,
        customer_id: allSites[0].id.toString(),
        site_kota: allSites[0].site
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customer_id: rows.length > 0 ? rows[0].id.toString() : '',
        site_kota: 'Umum / tidak spesifik'
      }));
    }
  };

  const handleSiteChange = (e) => {
    const selectedSite = e.target.value;
    const rows = customers.filter(c => c.nama_customer === selectedCustomerName);
    let matchedId = formData.customer_id;
    
    if (selectedSite !== 'Lainnya') {
       for (const r of rows) {
          if (Array.isArray(r.site_kota) && r.site_kota.includes(selectedSite)) {
             matchedId = r.id.toString();
             break;
          }
       }
    }

    setFormData(prev => ({
      ...prev,
      site_kota: selectedSite,
      customer_id: matchedId
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
    setSelectedCustomerName('');
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
      navigate('/marketing/activities');
    }, 2000);
  };

  const currentCustomerRow = customers.find(c => c.id.toString() === formData.customer_id);
  const currentKodeCsr = currentCustomerRow ? currentCustomerRow.no_akun : '';

  const rowsForSelectedCustomer = customers.filter(c => c.nama_customer === selectedCustomerName);
  let allAvailableSites = [];
  rowsForSelectedCustomer.forEach(r => {
    if (Array.isArray(r.site_kota)) {
      r.site_kota.forEach(site => {
        if (!allAvailableSites.includes(site)) allAvailableSites.push(site);
      });
    }
  });

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
            
            {/* Customer, Site/Kota & Kode CSR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer <span className="text-red-500">*</span></label>
                <Select 
                  options={uniqueCustomerNames.map(name => ({ value: name, label: name }))}
                  value={selectedCustomerName ? { value: selectedCustomerName, label: selectedCustomerName } : null}
                  onChange={(selected) => handleCustomerNameChange({ target: { value: selected ? selected.value : '' } })}
                  placeholder="-- Ketik / Pilih Customer --"
                  isClearable
                  isSearchable
                  required={!selectedCustomerName}
                  styles={{
                    control: (base) => ({
                      ...base,
                      padding: '2px',
                      borderRadius: '0.5rem',
                      borderColor: '#d1d5db',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#3b82f6'
                      }
                    })
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Site / Kota</label>
                {allAvailableSites.length > 0 ? (
                  <select 
                    name="site_kota"
                    value={formData.site_kota}
                    onChange={handleSiteChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {allAvailableSites.map((site, i) => (
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kode CSR</label>
                <input 
                  type="text"
                  value={currentKodeCsr || ''}
                  readOnly
                  placeholder="Akan otomatis terisi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
                />
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

