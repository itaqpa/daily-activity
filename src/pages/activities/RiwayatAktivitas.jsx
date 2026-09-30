import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Clock, Filter, Trash2, Search, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export default function RiwayatAktivitas() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Contoh pengecekan akses (Spv / Admin vs Sales)
  const canSeeAll = user.jabatan === 'Spv' || user.jabatan === 'Supervisor' || user.jabatan === 'Super Admin' || user.jabatan === 'Manager';

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'tanggal', direction: 'desc' });
  const [filters, setFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/activities');
      if (response.ok) {
        let data = await response.json();
        // Filter out for sales staff
        if (!canSeeAll) {
           data = data.filter(act => act.user_id === user.id);
        }
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDitemuiText = (act) => {
     try {
       let ditemuiArr = act.ditemui;
       if (typeof ditemuiArr === 'string') {
         ditemuiArr = JSON.parse(ditemuiArr);
       }
       let items = [...(Array.isArray(ditemuiArr) ? ditemuiArr : [])];
       if (act.ditemui_lainnya) {
         items = items.filter(i => i !== 'Lainnya');
         items.push(act.ditemui_lainnya);
       }
       return items.join(', ');
     } catch(e) {
       console.error("Error formatting ditemui:", e);
       return '';
     }
  };

  const typeColor = (type) => {
    switch (type) {
      case 'Kunjungan (Promote)': return 'bg-blue-100 text-blue-700';
      case 'Survey Potensial Order / Tender': return 'bg-indigo-100 text-indigo-700';
      case 'Submit Quotation': return 'bg-amber-100 text-amber-700';
      case 'Meeting Tender': return 'bg-purple-100 text-purple-700';
      case 'Meeting / Survey PO Diterima': return 'bg-green-100 text-green-700';
      case 'Say Hello (Telp / WhatsApp)': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (columnKey, value) => {
    setFilters(prev => ({ ...prev, [columnKey]: value }));
  };

  const uniqueOptions = React.useMemo(() => {
    const opts = {
      tanggal: new Set(),
      user_name: new Set(),
      nama_customer: new Set(),
      site_kota: new Set(),
      jenis_aktivitas: new Set(),
      ditemui: new Set(),
      catatan: new Set(),
    };
    
    activities.forEach(a => {
      opts.tanggal.add(formatDate(a.tanggal));
      if (a.user_name) opts.user_name.add(a.user_name);
      if (a.nama_customer) opts.nama_customer.add(a.nama_customer);
      if (a.site_kota) opts.site_kota.add(a.site_kota);
      if (a.jenis_aktivitas) opts.jenis_aktivitas.add(a.jenis_aktivitas);
      
      const dText = getDitemuiText(a);
      if (dText) opts.ditemui.add(dText);
      if (a.catatan) opts.catatan.add(a.catatan);
    });

    return {
      tanggal: Array.from(opts.tanggal).sort(),
      user_name: Array.from(opts.user_name).sort(),
      nama_customer: Array.from(opts.nama_customer).sort(),
      site_kota: Array.from(opts.site_kota).sort(),
      jenis_aktivitas: Array.from(opts.jenis_aktivitas).sort(),
      ditemui: Array.from(opts.ditemui).sort(),
      catatan: Array.from(opts.catatan).sort(),
    };
  }, [activities]);

  const filteredAndSortedActivities = React.useMemo(() => {
    let result = [...activities];
    
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(act => 
         (act.nama_customer?.toLowerCase() || '').includes(s) ||
         (act.catatan?.toLowerCase() || '').includes(s) ||
         (getDitemuiText(act).toLowerCase()).includes(s)
      );
    }
    
    result = result.filter(act => {
      if (filters.tanggal && formatDate(act.tanggal) !== filters.tanggal) return false;
      if (filters.user_name && act.user_name !== filters.user_name) return false;
      if (filters.nama_customer && act.nama_customer !== filters.nama_customer) return false;
      if (filters.site_kota && act.site_kota !== filters.site_kota) return false;
      if (filters.jenis_aktivitas && act.jenis_aktivitas !== filters.jenis_aktivitas) return false;
      if (filters.ditemui && getDitemuiText(act) !== filters.ditemui) return false;
      if (filters.catatan && act.catatan !== filters.catatan) return false;
      return true;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let aVal = '', bVal = '';
        if (sortConfig.key === 'tanggal') { 
          aVal = new Date(a.tanggal).getTime(); bVal = new Date(b.tanggal).getTime(); 
        } else if (sortConfig.key === 'user_name') { aVal = a.user_name || ''; bVal = b.user_name || ''; }
        else if (sortConfig.key === 'nama_customer') { aVal = a.nama_customer || ''; bVal = b.nama_customer || ''; }
        else if (sortConfig.key === 'site_kota') { aVal = a.site_kota || ''; bVal = b.site_kota || ''; }
        else if (sortConfig.key === 'jenis_aktivitas') { aVal = a.jenis_aktivitas || ''; bVal = b.jenis_aktivitas || ''; }
        else if (sortConfig.key === 'ditemui') { aVal = getDitemuiText(a); bVal = getDitemuiText(b); }
        else if (sortConfig.key === 'catatan') { aVal = a.catatan || ''; bVal = b.catatan || ''; }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [activities, filters, sortConfig, searchTerm]);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 inline text-blue-600" />;
  };

  const FilterHeader = ({ columnKey, label }) => {
    const isActive = !!filters[columnKey];
    return (
      <th className="py-3 px-4 font-semibold text-sm text-gray-700 relative whitespace-nowrap group align-middle">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 cursor-pointer hover:text-gray-900 flex items-center gap-1" onClick={() => requestSort(columnKey)}>
            {label} <SortIcon columnKey={columnKey} />
          </div>
          <div 
            className={`cursor-pointer p-1.5 rounded transition-colors ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'}`}
            onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === columnKey ? null : columnKey); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isActive ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
        </div>
        {openFilter === columnKey && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-md z-[60] w-48 font-normal normal-case text-gray-700">
            <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-md">
              <span className="font-semibold text-xs text-gray-600">Filter {label}</span>
              <button onClick={(e) => { e.stopPropagation(); setOpenFilter(null); }} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <div 
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${!isActive ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleFilterChange(columnKey, ''); setOpenFilter(null); }}
              >
                Semua
              </div>
              {uniqueOptions[columnKey].map(o => (
                <div 
                  key={o}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${filters[columnKey] === o ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleFilterChange(columnKey, o); setOpenFilter(null); }}
                >
                  {o}
                </div>
              ))}
            </div>
          </div>
        )}
      </th>
    );
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Semua Aktivitas / Riwayat</h2>
        <p className="text-gray-600 mt-1">
          {canSeeAll 
            ? 'Melihat riwayat aktivitas diri sendiri dan seluruh tim.' 
            : 'Melihat riwayat aktivitas Anda sendiri.'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
        {openFilter && (
          <div className="fixed inset-0 z-50" onClick={() => setOpenFilter(null)} />
        )}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
           <div className="flex gap-2 w-full max-w-md">
             <div className="relative w-full">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
               </div>
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Cari customer, ditemui, atau catatan..." 
                 className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
             </div>
           </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                <FilterHeader columnKey="tanggal" label="Tanggal" />
                {canSeeAll && <FilterHeader columnKey="user_name" label="Sales" />}
                <FilterHeader columnKey="nama_customer" label="Customer" />
                <FilterHeader columnKey="site_kota" label="Site/Kota" />
                <FilterHeader columnKey="jenis_aktivitas" label="Jenis" />
                <FilterHeader columnKey="ditemui" label="Ditemui" />
                <FilterHeader columnKey="catatan" label="Catatan" />
                <th className="py-3 px-4 font-semibold text-gray-700 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                 <tr>
                    <td colSpan={canSeeAll ? 8 : 7} className="py-8 text-center text-gray-500">
                       Memuat data...
                    </td>
                 </tr>
              ) : filteredAndSortedActivities.length > 0 ? (
                filteredAndSortedActivities.map(act => (
                  <tr key={act.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 whitespace-nowrap">
                       {formatDate(act.tanggal)}
                    </td>
                    {canSeeAll && <td className="py-3 px-4">{act.user_name || '-'}</td>}
                    <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">{act.nama_customer || '-'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{act.site_kota || '-'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColor(act.jenis_aktivitas)}`}>
                        {act.jenis_aktivitas}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{getDitemuiText(act) || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-[300px] truncate" title={act.catatan}>{act.catatan || '-'}</td>
                    <td className="py-3 px-4 text-center">
                       <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Hapus">
                         <Trash2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={canSeeAll ? 8 : 7} className="py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Clock className="w-8 h-8 mb-2 opacity-20" />
                        <p>Belum ada aktivitas yang dicatat.</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && activities.length > 0 && (
           <div className="p-4 border-t border-gray-100 text-xs text-gray-500">
             Menampilkan {activities.length} aktivitas
           </div>
        )}
      </div>
    </MainLayout>
  );
}
