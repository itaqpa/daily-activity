import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { Clock, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { apiUrl } from '../../api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ACTIVITY_TYPES = [
  { key: "Kunjungan (Promote)", short: "Kunjungan", color: "#2563EB", bg: "#EEF3FE" },
  { key: "Survey Potensial Order / Tender", short: "Survey", color: "#7C3AED", bg: "#F4F0FE" },
  { key: "Submit Quotation", short: "Quotation", color: "#B8790F", bg: "#FBF0DC" },
  { key: "Meeting Tender", short: "Meet. Tender", color: "#BE185D", bg: "#FCE8F1" },
  { key: "Meeting / Survey PO Diterima", short: "PO Diterima", color: "#15803D", bg: "#E9F6EE" },
  { key: "Say Hello (Telp / WhatsApp)", short: "Say Hello", color: "#0D9488", bg: "#E8F8F6" },
];

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const getVisibilityRoles = (jabatan) => {
    if (!jabatan) return [];
    const jName = jabatan.toLowerCase();
    
    if (jName.includes('super admin') || jName.includes('admin') || user.role === 'admin') {
      return ['Super Admin', 'Admin', 'Manager', 'Spv', 'Supervisor', 'Leader', 'Staff'];
    }
    if (jName.includes('manager')) {
      return ['Spv', 'Supervisor', 'Leader', 'Staff'];
    }
    if (jName.includes('spv') || jName.includes('supervisor')) {
      return ['Leader', 'Staff'];
    }
    if (jName.includes('leader')) {
      return ['Staff'];
    }
    return [];
  };

  const roleName = (user.jabatan || '').toLowerCase();
  // User bypass: jika user punya permission dashboard_view secara eksplisit (user-level bypass)
  // dan divisinya bukan Sales/Marketing, berarti dia user lintas modul
  const userDivisiLower = (user.divisi || user.nama_divisi || '').toLowerCase();
  const isSalesDivision = userDivisiLower.includes('sales') || userDivisiLower.includes('marketing');
  const hasExplicitDashboardAccess = user.explicit_bypass_permissions?.includes('dashboard_view');
  const isCrossModuleViewer = hasExplicitDashboardAccess && !isSalesDivision;
  const canSeeAll = roleName !== 'staff' || isCrossModuleViewer;

  const [activities, setActivities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [periodType, setPeriodType] = useState('daily');
  const [sortConfig, setSortConfig] = useState({ key: 'tanggal', direction: 'desc' });
  const [filters, setFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);

  const handleFilterChange = (columnKey, value) => {
    setFilters(prev => ({ ...prev, [columnKey]: value }));
  };
  
  const [dailyValue, setDailyValue] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  
  const [weeklyValue, setWeeklyValue] = useState(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  });

  const [monthlyValue, setMonthlyValue] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [yearlyValue, setYearlyValue] = useState(() => {
    return new Date().getFullYear().toString();
  });

  useEffect(() => {
    Promise.all([
      fetch(apiUrl('/activities')),
      fetch(apiUrl('/customers' + (!canSeeAll ? `?sales_id=${user.id}` : ''))),
      fetch(apiUrl('/sales'))
    ])
    .then(async ([actRes, custRes, salesRes]) => {
      if (actRes.ok && custRes.ok && salesRes.ok) {
        let actsData = await actRes.json();
        let custData = await custRes.json();
        let salesData = await salesRes.json();
        
        const visibleRoles = getVisibilityRoles(user.jabatan).map(r => r.toLowerCase());
        const isSuperAdminOrAdmin = roleName.includes('super admin') || roleName.includes('admin') || user.role === 'admin';

        actsData = actsData.filter(act => {
          if (isSuperAdminOrAdmin) return true;
          if (act.user_id === user.id) return true;
          if (act.user_jabatan) {
            const actRole = act.user_jabatan.toLowerCase();
            const userDiv = (user.divisi || user.nama_divisi || '').toLowerCase();
            const actDiv = (act.user_divisi || '').toLowerCase();
            // Jika user lintas modul (bypass), tampilkan semua tanpa filter divisi
            if (isCrossModuleViewer) return true;

            const isSameDivisi = !userDiv || !actDiv || userDiv === actDiv;
            if (isSameDivisi && visibleRoles.some(vr => actRole.includes(vr))) return true;
          }
          return false;
        });
        
        setActivities(actsData);
        setCustomers(custData);
        setSales(salesData);
      }
    })
    .catch(err => console.error("Error fetching data:", err))
    .finally(() => setLoading(false));
  }, [canSeeAll, user.id]);

  // date helpers
  const getPeriodRange = () => {
    if (periodType === 'daily') {
      const d = new Date(dailyValue);
      return { 
        start: dailyValue, 
        end: dailyValue, 
        label: isNaN(d) ? dailyValue : d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) 
      };
    }
    if (periodType === 'weekly') {
      const [year, week] = weeklyValue.split('-W');
      const simpleDate = new Date(year, 0, 1 + (week - 1) * 7);
      const day = simpleDate.getDay();
      const diff = simpleDate.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(simpleDate.setDate(diff));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      
      const pad = n => String(n).padStart(2, '0');
      const start = `${mon.getFullYear()}-${pad(mon.getMonth()+1)}-${pad(mon.getDate())}`;
      const end = `${sun.getFullYear()}-${pad(sun.getMonth()+1)}-${pad(sun.getDate())}`;
      return { 
        start, 
        end, 
        label: `${mon.toLocaleDateString('id-ID', {day:'numeric', month:'short'})} - ${sun.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}` 
      };
    }
    if (periodType === 'monthly') {
      const [y, m] = monthlyValue.split('-');
      const lastDay = new Date(y, m, 0).getDate();
      const start = `${y}-${m}-01`;
      const end = `${y}-${m}-${lastDay}`;
      return { start, end, label: new Date(y, m-1).toLocaleDateString('id-ID', {month:'long', year:'numeric'}) };
    }
    if (periodType === 'yearly') {
      return { start: `${yearlyValue}-01-01`, end: `${yearlyValue}-12-31`, label: yearlyValue };
    }
    return { start: '', end: '', label: '' };
  };

  const range = getPeriodRange();
  
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
       const localDate = new Date(a.tanggal);
       const pad = n => String(n).padStart(2, '0');
       const dateStr = isNaN(localDate) ? (a.tanggal || "").split('T')[0] : `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}`;
       return dateStr >= range.start && dateStr <= range.end;
    });
  }, [activities, range.start, range.end]);

  const typeCounts = useMemo(() => {
    const counts = {};
    ACTIVITY_TYPES.forEach(t => counts[t.key] = 0);
    filteredActivities.forEach(a => {
      if (counts[a.jenis_aktivitas] !== undefined) {
         counts[a.jenis_aktivitas]++;
      }
    });
    return counts;
  }, [filteredActivities]);

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
      const pArr = act.produk;
      let pItems = [...(Array.isArray(pArr) ? pArr : [])];
      if (act.produk_lainnya) {
        pItems = pItems.filter(i => i !== 'Lainnya');
        pItems.push(act.produk_lainnya);
      }
      const c = items.length > 0 ? "Ditemui/Dihub: " + items.join(', ') : "";
      const p = pItems.length > 0 ? "Produk: " + pItems.join(', ') : "";
      return [c, p].filter(Boolean).join(' · ');
    } catch(e) {
      return '';
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const FilterHeader = ({ columnKey, label }) => {
    const isActive = !!filters[columnKey];
    return (
      <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider relative whitespace-nowrap group align-middle">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 cursor-pointer hover:text-gray-800 flex items-center gap-1" onClick={() => requestSort(columnKey)}>
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

  const uniqueOptions = useMemo(() => {
    const opts = {
      tanggal: new Set(),
      sales: new Set(),
      customer: new Set(),
      jenis: new Set(),
      detail: new Set(),
      catatan: new Set(),
    };
    
    filteredActivities.forEach(a => {
      opts.tanggal.add(new Date(a.created_at || a.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}));
      if (a.user_name) opts.sales.add(a.user_name);
      if (a.nama_customer) opts.customer.add(a.nama_customer);
      
      const typeInfo = ACTIVITY_TYPES.find(t => t.key === a.jenis_aktivitas) || ACTIVITY_TYPES[0];
      if (typeInfo) opts.jenis.add(typeInfo.short);
      
      const detailStr = getDitemuiText(a);
      if (detailStr) opts.detail.add(detailStr);
      
      if (a.catatan) opts.catatan.add(a.catatan);
    });

    return {
      tanggal: Array.from(opts.tanggal).sort(),
      sales: Array.from(opts.sales).sort(),
      customer: Array.from(opts.customer).sort(),
      jenis: Array.from(opts.jenis).sort(),
      detail: Array.from(opts.detail).sort(),
      catatan: Array.from(opts.catatan).sort(),
    };
  }, [filteredActivities]);

  const sortedActivities = useMemo(() => {
    let sortableItems = [...filteredActivities];

    // Apply column filters
    sortableItems = sortableItems.filter(a => {
      let match = true;
      if (filters.tanggal) {
        const dateStr = new Date(a.created_at || a.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}).toLowerCase();
        if (dateStr !== filters.tanggal.toLowerCase()) match = false;
      }
      if (filters.sales && canSeeAll) {
        const salesName = (a.user_name || '').toLowerCase();
        if (salesName !== filters.sales.toLowerCase()) match = false;
      }
      if (filters.customer) {
        const custName = (a.nama_customer || '').toLowerCase();
        if (custName !== filters.customer.toLowerCase()) match = false;
      }
      if (filters.jenis) {
        const typeInfo = ACTIVITY_TYPES.find(t => t.key === a.jenis_aktivitas) || ACTIVITY_TYPES[0];
        if (typeInfo.short.toLowerCase() !== filters.jenis.toLowerCase()) match = false;
      }
      if (filters.detail) {
        const detailStr = (getDitemuiText(a) || '').toLowerCase();
        if (detailStr !== filters.detail.toLowerCase()) match = false;
      }
      if (filters.catatan) {
        const cat = (a.catatan || '').toLowerCase();
        if (cat !== filters.catatan.toLowerCase()) match = false;
      }
      return match;
    });

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = '', bValue = '';
        if (sortConfig.key === 'tanggal') {
          aValue = new Date(a.created_at || a.tanggal).getTime();
          bValue = new Date(b.created_at || b.tanggal).getTime();
        } else if (sortConfig.key === 'sales') {
          aValue = a.user_name || '';
          bValue = b.user_name || '';
        } else if (sortConfig.key === 'customer') {
          aValue = a.nama_customer || '';
          bValue = b.nama_customer || '';
        } else if (sortConfig.key === 'jenis') {
          aValue = a.jenis_aktivitas || '';
          bValue = b.jenis_aktivitas || '';
        } else if (sortConfig.key === 'detail') {
          aValue = getDitemuiText(a) || '';
          bValue = getDitemuiText(b) || '';
        } else if (sortConfig.key === 'catatan') {
          aValue = a.catatan || '';
          bValue = b.catatan || '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredActivities, sortConfig, filters, canSeeAll]);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 inline text-blue-600" />;
  };

  const chartData = {
    labels: ACTIVITY_TYPES.map(t => t.short),
    datasets: [{
      data: ACTIVITY_TYPES.map(t => typeCounts[t.key]),
      backgroundColor: ACTIVITY_TYPES.map(t => t.color),
      borderRadius: 6,
      maxBarThickness: 48,
    }]
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { grid: { display: false } }
    }
  };

  // Progress Customer
  const customerStats = useMemo(() => {
    const withActivity = new Set(filteredActivities.map(a => a.customer_id));
    const progressed = customers.filter(c => withActivity.has(c.id));
    const notProgressed = customers.filter(c => !withActivity.has(c.id));
    return {
      total: customers.length,
      progressed: progressed.length,
      notProgressed: notProgressed.length,
      pct: customers.length ? Math.round((progressed.length / customers.length) * 100) : 0,
      progressedList: progressed,
      notProgressedList: notProgressed
    };
  }, [customers, filteredActivities]);

  // Leaderboard (only if canSeeAll)
  const leaderboard = useMemo(() => {
    if (!canSeeAll) return [];
    const bySales = {};
    filteredActivities.forEach(a => {
      if(a.user_id) bySales[a.user_id] = (bySales[a.user_id] || 0) + 1;
    });
    return sales.filter(s => bySales[s.id]).map(s => ({
       name: s.name,
       count: bySales[s.id] || 0
    })).sort((a,b) => b.count - a.count);
  }, [sales, filteredActivities, canSeeAll]);

  const maxLeaderboard = leaderboard.length > 0 ? leaderboard[0].count : 1;

  if (loading) {
     return <MainLayout><div className="flex items-center justify-center min-h-[50vh]">Memuat data...</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Summary</h2>
          <p className="text-gray-600 mt-1">
            {canSeeAll 
              ? 'Melihat ringkasan aktivitas seluruh tim.' 
              : 'Melihat ringkasan aktivitas Anda sendiri.'}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        {/* Area 1: Tabs */}
        <div className="grid grid-cols-4 md:flex bg-gray-100 p-1 rounded-lg gap-1 w-full md:w-auto">
          {[
            { id: 'daily', label: 'Harian' },
            { id: 'weekly', label: 'Mingguan' },
            { id: 'monthly', label: 'Bulanan' },
            { id: 'yearly', label: 'Tahunan' },
          ].map(opt => (
            <button 
              key={opt.id}
              onClick={() => setPeriodType(opt.id)}
              className={`whitespace-nowrap px-1 sm:px-3 py-1.5 text-[11px] sm:text-sm font-semibold rounded-md transition-colors ${periodType === opt.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        
        {/* Area 2: Input + Label */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:flex-none sm:w-48">
            {periodType === 'daily' && (
               <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={dailyValue} onChange={e => setDailyValue(e.target.value)} />
            )}
            {periodType === 'weekly' && (
               <input type="week" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={weeklyValue} onChange={e => setWeeklyValue(e.target.value)} />
            )}
            {periodType === 'monthly' && (
               <input type="month" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={monthlyValue} onChange={e => setMonthlyValue(e.target.value)} />
            )}
            {periodType === 'yearly' && (
               <input type="number" min="2020" max="2100" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={yearlyValue} onChange={e => setYearlyValue(e.target.value)} />
            )}
          </div>
          <div className="text-sm font-semibold text-gray-500 whitespace-nowrap bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 sm:bg-transparent sm:border-none sm:p-0">
            {range.label}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col justify-center">
          <div className="text-3xl font-bold text-gray-900 mb-1" style={{fontFamily:"'Space Grotesk', sans-serif"}}>{filteredActivities.length}</div>
          <div className="text-xs font-semibold text-gray-500">Total Aktivitas</div>
        </div>
        {ACTIVITY_TYPES.map(t => (
          <div key={t.key} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col justify-center">
            <div className="text-3xl font-bold mb-1" style={{color: t.color, fontFamily:"'Space Grotesk', sans-serif"}}>{typeCounts[t.key]}</div>
            <div className="text-xs font-semibold text-gray-500">{t.short}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Aktivitas per Jenis — {range.label}</h3>
        <div className="h-64 w-full">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Cakupan Customer — {range.label}</h3>
        </div>
        
        {customerStats.total === 0 ? (
          <div className="py-8 text-center text-gray-500">Belum ada customer pada cakupan ini.</div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
              <div className="min-w-[100px] flex flex-row sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0">
                 <div className="text-4xl font-bold text-green-600 mb-1" style={{fontFamily:"'Space Grotesk', sans-serif"}}>{customerStats.pct}%</div>
                 <div className="text-xs font-semibold text-gray-500">Terprogress</div>
              </div>
              <div className="flex-1 w-full">
                 <div className="h-3 bg-red-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500" style={{width: `${customerStats.pct}%`}}></div>
                 </div>
                 <div className="flex flex-col lg:flex-row lg:justify-between mt-3 gap-2 text-xs text-gray-500">
                    <div><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 flex-shrink-0"></span> Terprogress: <span className="font-bold text-gray-800">{customerStats.progressed}</span> dari {customerStats.total} customer</div>
                    <div><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 flex-shrink-0"></span> Belum Ada Aktivitas: <span className="font-bold text-gray-800">{customerStats.notProgressed}</span> customer</div>
                 </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <div className="text-xs font-bold text-green-600 mb-2">SUDAH ADA AKTIVITAS ({customerStats.progressed})</div>
                  <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto px-3">
                     {customerStats.progressedList.length ? customerStats.progressedList.map(c => (
                        <div key={c.id} className="flex justify-between py-2 border-b border-dashed border-gray-200 last:border-0 text-sm">
                           <span className="text-gray-500">{c.no_akun || '—'}</span>
                           <span className="font-medium text-gray-900">{c.nama_customer}</span>
                        </div>
                     )) : <div className="py-3 text-gray-500 text-sm">Tidak ada.</div>}
                  </div>
               </div>
               <div>
                  <div className="text-xs font-bold text-red-500 mb-2">BELUM ADA AKTIVITAS ({customerStats.notProgressed})</div>
                  <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto px-3">
                     {customerStats.notProgressedList.length ? customerStats.notProgressedList.map(c => (
                        <div key={c.id} className="flex justify-between py-2 border-b border-dashed border-gray-200 last:border-0 text-sm">
                           <span className="text-gray-500">{c.no_akun || '—'}</span>
                           <span className="font-medium text-gray-900">{c.nama_customer}</span>
                        </div>
                     )) : <div className="py-3 text-gray-500 text-sm">Tidak ada.</div>}
                  </div>
               </div>
            </div>
          </>
        )}
      </div>

      {canSeeAll && (
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Leaderboard Sales — {range.label}</h3>
            {leaderboard.length ? (
               <div className="flex flex-col gap-3">
                  {leaderboard.map(r => {
                     const pct = Math.round((r.count / maxLeaderboard) * 100);
                     return (
                        <div key={r.name}>
                           <div className="flex justify-between text-sm mb-1.5">
                              <span className="font-semibold text-gray-800">{r.name}</span>
                              <span className="text-gray-500">{r.count} aktivitas</span>
                           </div>
                           <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{width: `${pct}%`}}></div>
                           </div>
                        </div>
                     )
                  })}
               </div>
            ) : <div className="text-gray-500 text-sm text-center py-4">Belum ada aktivitas pada periode ini.</div>}
         </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
        {openFilter && (
          <div className="fixed inset-0 z-50" onClick={() => setOpenFilter(null)} />
        )}
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Aktivitas Terbaru</h3>
        </div>
        {/* Table Desktop */}
        <div className="hidden md:block overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <FilterHeader columnKey="tanggal" label="Tanggal" />
                {canSeeAll && <FilterHeader columnKey="sales" label="Sales" />}
                <FilterHeader columnKey="customer" label="Customer" />
                <FilterHeader columnKey="jenis" label="Jenis" />
                <FilterHeader columnKey="detail" label="Detail" />
                <FilterHeader columnKey="catatan" label="Catatan" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-base">
               {sortedActivities.length > 0 ? (
                  sortedActivities
                    .map(act => {
                     const typeInfo = ACTIVITY_TYPES.find(t => t.key === act.jenis_aktivitas) || ACTIVITY_TYPES[0];
                     return (
                     <tr key={act.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap text-gray-600">{new Date(act.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</td>
                        {canSeeAll && <td className="px-6 py-5 text-gray-800">{act.user_name || '—'}</td>}
                        <td className="px-6 py-5">
                           <div className="font-semibold text-gray-900">{act.nama_customer || '—'}</div>
                           {act.site_kota && <div className="text-sm text-gray-500 mt-0.5">{act.site_kota}</div>}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                           <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold" style={{backgroundColor: typeInfo.bg, color: typeInfo.color}}>
                              <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: typeInfo.color}}></span>
                              {typeInfo.short}
                           </span>
                        </td>
                        <td className="px-6 py-5 text-gray-600 text-sm max-w-xs">{getDitemuiText(act) || '—'}</td>
                        <td className="px-6 py-5 text-gray-600 max-w-xs truncate" title={act.catatan}>{act.catatan || '—'}</td>
                     </tr>
                  )})
               ) : (
                  <tr>
                     <td colSpan={canSeeAll ? 6 : 5} className="px-5 py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                           <Clock className="w-8 h-8 mb-2 opacity-20" />
                           <div>Belum ada aktivitas tercatat.</div>
                        </div>
                     </td>
                  </tr>
               )}
            </tbody>
          </table>
        </div>

        {/* Card Mobile */}
        <div className="md:hidden flex flex-col gap-3 p-4 bg-gray-50/30">
          {sortedActivities.length > 0 ? (
            sortedActivities.map(act => {
              const typeInfo = ACTIVITY_TYPES.find(t => t.key === act.jenis_aktivitas) || ACTIVITY_TYPES[0];
              return (
                <div key={act.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-2 relative">
                  <div className="flex justify-between items-start gap-2 pr-28">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm leading-tight mb-0.5">{act.nama_customer || '—'}</h3>
                      {canSeeAll && <p className="text-xs text-blue-600 font-medium mb-1">{act.user_name || '—'}</p>}
                      <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                        <Clock size={12} /> {new Date(act.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}
                      </p>
                    </div>
                  </div>
                  
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border" style={{backgroundColor: typeInfo.bg, color: typeInfo.color, borderColor: `${typeInfo.color}40`}}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: typeInfo.color}}></span>
                      {typeInfo.short}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold mb-0.5">Site/Kota</span>
                      <span className="font-medium text-gray-700">{act.site_kota || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold mb-0.5">Ditemui</span>
                      <span className="font-medium text-gray-700">{getDitemuiText(act) || '—'}</span>
                    </div>
                    <div className="col-span-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold mb-1">Catatan</span>
                      <p className="text-gray-700 text-xs italic leading-relaxed">{act.catatan || '—'}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex flex-col items-center justify-center">
                <Clock className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">Belum ada aktivitas yang dicatat.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
