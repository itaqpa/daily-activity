import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { 
  Save, 
  AlertCircle, 
  Building2, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Users, 
  FileText, 
  Check, 
  Hash, 
  ArrowLeft,
  ClipboardList
} from 'lucide-react';
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
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <ClipboardList size={15} />
            <span>Daily Sales Activity</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Catat Aktivitas</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Form pencatatan interaksi harian sales dengan customer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/marketing/activities')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Lihat Riwayat</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden max-w-4xl">
        {/* User Context Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Formulir Log Aktivitas</h3>
              <p className="text-xs text-gray-500">
                Petugas: <span className="font-semibold text-blue-700">{user.name || 'Sales'}</span> {user.jabatan ? `• ${user.jabatan}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 animate-in fade-in">
              <Check size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800 font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Customer, Site/Kota & Kode CSR */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Customer */}
              <div className="md:col-span-5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                  <Building2 size={14} className="text-blue-600" />
                  <span>Customer</span>
                  <span className="text-red-500">*</span>
                </label>
                <Select 
                  options={uniqueCustomerNames.map(name => ({ value: name, label: name }))}
                  value={selectedCustomerName ? { value: selectedCustomerName, label: selectedCustomerName } : null}
                  onChange={(selected) => handleCustomerNameChange({ target: { value: selected ? selected.value : '' } })}
                  placeholder="-- Cari / Pilih Customer --"
                  isClearable
                  isSearchable
                  required={!selectedCustomerName}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: '44px',
                      height: '44px',
                      borderRadius: '0.75rem',
                      borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                      '&:hover': {
                        borderColor: '#3b82f6'
                      },
                      fontSize: '0.875rem'
                    }),
                    valueContainer: (base) => ({
                      ...base,
                      height: '44px',
                      padding: '0 12px',
                      display: 'flex',
                      alignItems: 'center'
                    }),
                    input: (base) => ({
                      ...base,
                      margin: 0,
                      padding: 0
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: '#9ca3af',
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }),
                    indicatorsContainer: (base) => ({
                      ...base,
                      height: '44px'
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                      border: '1px solid #f3f4f6',
                      zIndex: 9999
                    })
                  }}
                />
              </div>

              {/* Site / Kota */}
              <div className="md:col-span-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                  <MapPin size={14} className="text-blue-600" />
                  <span>Site / Kota</span>
                </label>
                {allAvailableSites.length > 0 ? (
                  <select 
                    name="site_kota"
                    value={formData.site_kota}
                    onChange={handleSiteChange}
                    className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium text-gray-800 transition-colors cursor-pointer"
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
                    className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/70 font-medium text-gray-700 transition-colors"
                  />
                )}
              </div>

              {/* Kode CSR */}
              <div className="md:col-span-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                  <Hash size={14} className="text-blue-600" />
                  <span>Kode CSR</span>
                </label>
                <input 
                  type="text"
                  value={currentKodeCsr || ''}
                  readOnly
                  placeholder="Otomatis terisi"
                  className="w-full h-11 px-3.5 border border-gray-200 rounded-xl bg-slate-50 font-mono font-bold text-gray-800 text-sm cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 my-1"></div>

            {/* Jenis Aktivitas & Tanggal */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                  <Briefcase size={14} className="text-blue-600" />
                  <span>Jenis Aktivitas</span>
                  <span className="text-red-500">*</span>
                </label>
                <select 
                  name="jenis_aktivitas"
                  value={formData.jenis_aktivitas}
                  onChange={handleChange}
                  required
                  className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium text-gray-800 transition-colors cursor-pointer"
                >
                  <option value="">-- Pilih Aktivitas --</option>
                  {jenisAktivitasOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                  <Calendar size={14} className="text-blue-600" />
                  <span>Tanggal</span>
                  <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  required
                  className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium text-gray-800 transition-colors"
                />
              </div>
            </div>

            {/* Yang Akan Ditemui */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                <Users size={14} className="text-blue-600" />
                <span>Yang Akan Ditemui</span>
                <span className="text-gray-400 font-normal lowercase">(bisa pilih lebih dari 1)</span>
              </label>
              
              {/* Modern Interactive Chips */}
              <div className="flex flex-wrap gap-2.5">
                {ditemuiOptions.map((opt) => {
                  const isSelected = formData.ditemui.includes(opt);
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleCheckboxChange(opt)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 border cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20 ring-2 ring-blue-500/20'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        isSelected 
                          ? 'bg-white text-blue-600 border-white' 
                          : 'border-gray-300 bg-gray-50'
                      }`}>
                        {isSelected && <Check size={11} strokeWidth={3.5} />}
                      </div>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
              
              {formData.ditemui.includes('Lainnya') && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-150">
                  <input 
                    type="text"
                    name="ditemui_lainnya"
                    value={formData.ditemui_lainnya}
                    onChange={handleChange}
                    placeholder="Sebutkan yang ditemui lainnya..."
                    className="w-full h-11 px-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
                  />
                </div>
              )}
            </div>

            {/* Catatan (opsional) */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                <FileText size={14} className="text-blue-600" />
                <span>Catatan</span>
                <span className="text-gray-400 font-normal lowercase">(opsional)</span>
              </label>
              <textarea 
                name="catatan"
                value={formData.catatan}
                onChange={handleChange}
                rows="4"
                placeholder="Contoh: Diskusi kebutuhan RTI untuk unit baru..."
                className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y bg-white placeholder:text-gray-400 transition-colors"
              ></textarea>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
              >
                <Save size={18} />
                <span>{loading ? 'Menyimpan...' : 'Simpan Aktivitas'}</span>
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </MainLayout>
  );
}

