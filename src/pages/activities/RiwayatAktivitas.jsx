import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Clock, Filter, Trash2, Search } from 'lucide-react';

export default function RiwayatAktivitas() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Contoh pengecekan akses (Spv / Admin vs Sales)
  const canSeeAll = user.jabatan === 'Spv' || user.jabatan === 'Supervisor' || user.jabatan === 'Super Admin' || user.jabatan === 'Manager';

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterSales, setFilterSales] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterDitemui, setFilterDitemui] = useState('');
  const [filterCatatan, setFilterCatatan] = useState('');

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

  const uniqueTanggal = [...new Set(activities.map(a => formatDate(a.tanggal)).filter(Boolean))];
  const uniqueSales = [...new Set(activities.map(a => a.user_name).filter(Boolean))];
  const uniqueCustomer = [...new Set(activities.map(a => a.nama_customer).filter(Boolean))];
  const uniqueSite = [...new Set(activities.map(a => a.site_kota).filter(Boolean))];
  const uniqueJenis = [...new Set(activities.map(a => a.jenis_aktivitas).filter(Boolean))];
  const uniqueDitemui = [...new Set(activities.map(a => getDitemuiText(a)).filter(Boolean))];
  const uniqueCatatan = [...new Set(activities.map(a => a.catatan).filter(Boolean))];

  const filteredActivities = activities.filter(act => {
    const matchesSearch = 
       (act.nama_customer?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
       (act.catatan?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
       (getDitemuiText(act).toLowerCase()).includes(searchTerm.toLowerCase());
    
    const matchesTanggal = filterTanggal === '' || formatDate(act.tanggal) === filterTanggal;
    const matchesSales = filterSales === '' || act.user_name === filterSales;
    const matchesCustomer = filterCustomer === '' || act.nama_customer === filterCustomer;
    const matchesSite = filterSite === '' || act.site_kota === filterSite;
    const matchesJenis = filterJenis === '' || act.jenis_aktivitas === filterJenis;
    const matchesDitemui = filterDitemui === '' || getDitemuiText(act) === filterDitemui;
    const matchesCatatan = filterCatatan === '' || act.catatan === filterCatatan;

    return matchesSearch && matchesTanggal && matchesSales && matchesCustomer && matchesSite && matchesJenis && matchesDitemui && matchesCatatan;
  });

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                <th className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">
                  <select 
                    value={filterTanggal} 
                    onChange={(e) => setFilterTanggal(e.target.value)}
                    className="bg-transparent font-semibold text-gray-700 focus:outline-none cursor-pointer hover:text-blue-600"
                  >
                    <option value="">Semua Tanggal</option>
                    {uniqueTanggal.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </th>
                {canSeeAll && (
                  <th className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">
                    <select 
                      value={filterSales} 
                      onChange={(e) => setFilterSales(e.target.value)}
                      className="bg-transparent font-semibold text-gray-700 focus:outline-none cursor-pointer hover:text-blue-600"
                    >
                      <option value="">Semua Sales</option>
                      {uniqueSales.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </th>
                )}
                <th className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">
                  <select 
                    value={filterCustomer} 
                    onChange={(e) => setFilterCustomer(e.target.value)}
                    className="bg-transparent font-semibold text-gray-700 focus:outline-none cursor-pointer hover:text-blue-600"
                  >
                    <option value="">Semua Customer</option>
                    {uniqueCustomer.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">
                  <select 
                    value={filterSite} 
                    onChange={(e) => setFilterSite(e.target.value)}
                    className="bg-transparent font-semibold text-gray-700 focus:outline-none cursor-pointer hover:text-blue-600"
                  >
                    <option value="">Semua Site</option>
                    {uniqueSite.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">
                  <select 
                    value={filterJenis} 
                    onChange={(e) => setFilterJenis(e.target.value)}
                    className="bg-transparent font-semibold text-gray-700 focus:outline-none cursor-pointer hover:text-blue-600"
                  >
                    <option value="">Semua Jenis Aktivitas</option>
                    {uniqueJenis.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">
                  <select 
                    value={filterDitemui} 
                    onChange={(e) => setFilterDitemui(e.target.value)}
                    className="bg-transparent font-semibold text-gray-700 focus:outline-none cursor-pointer hover:text-blue-600 max-w-[200px]"
                  >
                    <option value="">Semua Detail (Ditemui)</option>
                    {uniqueDitemui.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">
                  <select 
                    value={filterCatatan} 
                    onChange={(e) => setFilterCatatan(e.target.value)}
                    className="bg-transparent font-semibold text-gray-700 focus:outline-none cursor-pointer hover:text-blue-600 max-w-[200px]"
                  >
                    <option value="">Semua Catatan</option>
                    {uniqueCatatan.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </th>
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
              ) : filteredActivities.length > 0 ? (
                filteredActivities.map(act => (
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
