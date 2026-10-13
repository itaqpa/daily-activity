import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layouts/MainLayout';
import { Clock, ArrowDown, ArrowUp, ArrowUpDown, X, ExternalLink, Search, Trophy, Medal, Award, TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Pie, Doughnut, Chart } from 'react-chartjs-2';
import { apiUrl } from '../../api';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ACTIVITY_TYPES = [
  { key: "Kunjungan (Promote)", short: "Kunjungan", color: "#2563EB", bg: "#EFF6FF" }, // Royal Blue
  { key: "Survey Potensial Order / Tender", short: "Survey", color: "#8B5CF6", bg: "#F5F3FF" }, // Vivid Purple
  { key: "Submit Quotation", short: "Quotation", color: "#F59E0B", bg: "#FFFBEB" }, // Bright Amber / Orange-Yellow
  { key: "Meeting Tender", short: "Meet. Tender", color: "#E11D48", bg: "#FFF1F2" }, // Bright Crimson / Rose Red
  { key: "Meeting / Survey PO Diterima", short: "PO Diterima", color: "#10B981", bg: "#ECFDF5" }, // Emerald Green
  { key: "Say Hello (Telp / WhatsApp)", short: "Say Hello", color: "#06B6D4", bg: "#ECFEFF" }, // Cyan / Sky Teal
];

export default function Dashboard() {
  const navigate = useNavigate();
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
  const [customerModal, setCustomerModal] = useState(null); // null | 'progressed' | 'notProgressed'
  const [customerSearch, setCustomerSearch] = useState('');
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);

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
      const start = `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;
      const end = `${sun.getFullYear()}-${pad(sun.getMonth() + 1)}-${pad(sun.getDate())}`;
      return {
        start,
        end,
        label: `${mon.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${sun.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
      };
    }
    if (periodType === 'monthly') {
      const [y, m] = monthlyValue.split('-');
      const lastDay = new Date(y, m, 0).getDate();
      const start = `${y}-${m}-01`;
      const end = `${y}-${m}-${lastDay}`;
      return { start, end, label: new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) };
    }
    if (periodType === 'yearly') {
      return { start: `${yearlyValue}-01-01`, end: `${yearlyValue}-12-31`, label: yearlyValue };
    }
    return { start: '', end: '', label: '' };
  };

  const range = getPeriodRange();

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      if (!a.tanggal) return false;
      // Jika sudah berformat string 'YYYY-MM-DD...', ambil langsung 10 karakter pertama untuk menghindari timezone shift
      let dateStr = '';
      if (typeof a.tanggal === 'string') {
        const m = a.tanggal.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) dateStr = m[0];
      }
      if (!dateStr) {
        const localDate = new Date(a.tanggal);
        const pad = n => String(n).padStart(2, '0');
        dateStr = isNaN(localDate) ? (a.tanggal || "").split('T')[0] : `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}`;
      }
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
    } catch (e) {
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

  const SortIcon = ({ columnKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 inline text-blue-600" />;
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

  const formatDisplayDate = (dStr) => {
    if (!dStr) return '';
    if (typeof dStr === 'string') {
      const m = dStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        const [_, y, mth, d] = m;
        const dt = new Date(Number(y), Number(mth) - 1, Number(d));
        return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    const dt = new Date(dStr);
    return isNaN(dt.getTime()) ? dStr : dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
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
      opts.tanggal.add(formatDisplayDate(a.tanggal));
      if (a.user_name) opts.sales.add(a.user_name);
      if (a.nama_customer) opts.customer.add(a.nama_customer);

      const typeInfo = ACTIVITY_TYPES.find(t => t.key === a.jenis_aktivitas) || ACTIVITY_TYPES[0];
      if (typeInfo) opts.jenis.add(typeInfo.short);

      const detailStr = getDitemuiText(a);
      if (detailStr) opts.detail.add(detailStr);

      if (a.catatan) opts.catatan.add(a.catatan);
    });

    return {
      tanggal: Array.from(opts.tanggal).filter(Boolean).sort(),
      sales: Array.from(opts.sales).filter(Boolean).sort(),
      customer: Array.from(opts.customer).filter(Boolean).sort(),
      jenis: Array.from(opts.jenis).filter(Boolean).sort(),
      detail: Array.from(opts.detail).filter(Boolean).sort(),
      catatan: Array.from(opts.catatan).filter(Boolean).sort(),
    };
  }, [filteredActivities]);

  const sortedActivities = useMemo(() => {
    let sortableItems = [...filteredActivities];

    // Apply column filters
    sortableItems = sortableItems.filter(a => {
      let match = true;
      if (filters.tanggal) {
        const dateStr = formatDisplayDate(a.tanggal).toLowerCase();
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
          aValue = new Date(a.tanggal).getTime();
          bValue = new Date(b.tanggal).getTime();
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

  const [chartViewMode, setChartViewMode] = useState('trend'); // 'trend' | 'summary'

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

  // Timeline Trend Data (Stacked Bar + Line for Total)
  const trendData = useMemo(() => {
    if (!range.start || !range.end) {
      return { labels: [], datasets: [] };
    }

    const startDate = new Date(range.start);
    const endDate = new Date(range.end);
    const dateList = [];
    const curr = new Date(startDate);

    // Cek apakah mode harian (daily) -> gunakan pembagian per Jam (00:00 s.d 23:00)
    const isDaily = periodType === 'daily';
    const isYearly = periodType === 'yearly';

    if (isDaily) {
      // Pembagian 24 Jam (atau rentang jam kerja 07:00 - 21:00 atau full 24 jam)
      for (let h = 0; h < 24; h++) {
        const padH = String(h).padStart(2, '0');
        dateList.push({
          key: padH,
          label: `${padH}:00`
        });
      }
    } else if (isYearly) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const y = parseInt(yearlyValue, 10) || new Date().getFullYear();
      for (let m = 0; m < 12; m++) {
        const padM = String(m + 1).padStart(2, '0');
        dateList.push({
          key: `${y}-${padM}`,
          label: monthNames[m]
        });
      }
    } else {
      while (curr <= endDate) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${d}`;
        dateList.push({
          key,
          label: periodType === 'monthly' ? String(curr.getDate()) : `${curr.getDate()} ${curr.toLocaleDateString('id-ID', { month: 'short' })}`
        });
        curr.setDate(curr.getDate() + 1);
      }
    }

    // Hitung per titik waktu (jam / tanggal) & per jenis aktivitas
    const countsPerDate = {};
    const totalPerDate = {};

    dateList.forEach(item => {
      countsPerDate[item.key] = {};
      ACTIVITY_TYPES.forEach(t => {
        countsPerDate[item.key][t.key] = 0;
      });
      totalPerDate[item.key] = 0;
    });

    filteredActivities.forEach(a => {
      let key = '';

      if (isDaily) {
        // Ekstrak jam langsung dari created_at
        let hour = null;
        if (a.created_at && typeof a.created_at === 'string') {
          // Jika format string seperti "2026-10-13 09:33:36" atau "2026-10-13T09:33:36"
          const match = a.created_at.match(/[T\s](\d{2}):/);
          if (match) {
            hour = match[1];
          }
        }
        
        // Fallback jika berupa Date object asli
        if (hour === null && a.created_at) {
          const dt = new Date(a.created_at);
          if (!isNaN(dt.getTime())) {
            hour = String(dt.getHours()).padStart(2, '0');
          }
        }
        key = hour !== null ? hour : '09';
      } else if (isYearly) {
        let dateStr = '';
        if (typeof a.tanggal === 'string') {
          const m = a.tanggal.match(/^(\d{4})-(\d{2})/);
          if (m) dateStr = m[0];
        }
        if (!dateStr) {
          const localDate = new Date(a.tanggal);
          const pad = n => String(n).padStart(2, '0');
          dateStr = isNaN(localDate)
            ? (a.tanggal || '').substring(0, 7)
            : `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}`;
        }
        key = dateStr.substring(0, 7);
      } else {
        let dateStr = '';
        if (typeof a.tanggal === 'string') {
          const m = a.tanggal.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (m) dateStr = m[0];
        }
        if (!dateStr) {
          const localDate = new Date(a.tanggal);
          const pad = n => String(n).padStart(2, '0');
          dateStr = isNaN(localDate)
            ? (a.tanggal || '').split('T')[0]
            : `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}`;
        }
        key = dateStr;
      }

      if (countsPerDate[key]) {
        if (countsPerDate[key][a.jenis_aktivitas] !== undefined) {
          countsPerDate[key][a.jenis_aktivitas]++;
          totalPerDate[key]++;
        }
      }
    });

    // Dataset Bar Stacked untuk masing-masing jenis aktivitas
    const datasets = ACTIVITY_TYPES.map(t => ({
      type: 'bar',
      label: t.short,
      data: dateList.map(item => countsPerDate[item.key][t.key] || 0),
      backgroundColor: t.color,
      stack: 'activityStack',
      borderRadius: 4,
      maxBarThickness: 32,
    }));

    // Dataset Line untuk Total Aktivitas di atas Bar
    datasets.push({
      type: 'line',
      label: 'Total Aktivitas',
      data: dateList.map(item => totalPerDate[item.key] || 0),
      borderColor: '#94A3B8',
      backgroundColor: '#94A3B8',
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#FFFFFF',
      pointBorderColor: '#94A3B8',
      pointBorderWidth: 2,
      tension: 0.2,
      fill: false,
    });

    return {
      labels: dateList.map(item => item.label),
      datasets
    };
  }, [range.start, range.end, filteredActivities, periodType, yearlyValue]);

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
          font: { size: 11, weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: true,
        ticks: { precision: 0, font: { size: 11 } },
        grid: { color: '#F1F5F9' }
      },
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { size: 10 } }
      }
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

  const customerPieData = {
    labels: ['Terprogress', 'Belum Ada Aktivitas'],
    datasets: [{
      data: [customerStats.progressed, customerStats.notProgressed],
      backgroundColor: ['#10B981', '#EF4444'],
      hoverBackgroundColor: ['#059669', '#DC2626'],
      borderWidth: 2,
      borderColor: '#ffffff',
    }]
  };

  const customerPieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 12,
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            const total = customerStats.total || 1;
            const pct = Math.round((val / total) * 100);
            return ` ${context.label}: ${val} (${pct}%)`;
          }
        }
      }
    },
    cutout: '62%'
  };

  // Leaderboard (only if canSeeAll)
  // Perhitungan: % progres = (jumlah customer yang terprogress oleh sales / target customer sales atau total customer) * 100
  const leaderboard = useMemo(() => {
    if (!canSeeAll) return [];

    // Map customer kepemilikan sales:
    // 1. Dari assigned_customers pada objek sales (dari sales_customers relation)
    // 2. Fallback: jika tidak ada data assignment, gunakan total customer
    const salesTotalCust = {};
    sales.forEach(s => {
      if (Array.isArray(s.assigned_customers) && s.assigned_customers.length > 0) {
        salesTotalCust[s.id] = s.assigned_customers.length;
      }
    });

    customers.forEach(c => {
      const sId = c.sales_id || c.user_id;
      if (sId && !salesTotalCust[sId]) {
        salesTotalCust[sId] = (salesTotalCust[sId] || 0) + 1;
      }
    });

    const bySalesActs = {};
    const bySalesCust = {};

    filteredActivities.forEach(a => {
      if (a.user_id) {
        bySalesActs[a.user_id] = (bySalesActs[a.user_id] || 0) + 1;
        if (a.customer_id) {
          if (!bySalesCust[a.user_id]) bySalesCust[a.user_id] = new Set();
          bySalesCust[a.user_id].add(a.customer_id);
        }
      }
    });

    // Total target customer: gunakan customer milik sales tersebut jika ada, atau total customer sebagai acuan
    const globalCustomerTotal = customers.length || 1;

    // Gabungkan user dari tim sales dan user lain yang memiliki aktivitas (misal Super Admin)
    const allUsersMap = new Map();
    sales.forEach(s => allUsersMap.set(s.id, { id: s.id, name: s.name }));
    filteredActivities.forEach(a => {
      if (a.user_id && !allUsersMap.has(a.user_id)) {
        allUsersMap.set(a.user_id, { id: a.user_id, name: a.user_name || `User #${a.user_id}` });
      }
    });

    return Array.from(allUsersMap.values()).map(s => {
      const actsCount = bySalesActs[s.id] || 0;
      const progressedCustSet = bySalesCust[s.id] || new Set();
      const progressedCount = progressedCustSet.size;

      // Target Customer riil untuk sales ini
      const targetCustomer = salesTotalCust[s.id] || globalCustomerTotal;
      // Persentase capaian customer yang dihubungi dari total customer yang dipegang
      const pct = targetCustomer > 0 ? Math.min(100, Math.round((progressedCount / targetCustomer) * 100)) : 0;

      return {
        id: s.id,
        name: s.name,
        count: actsCount,
        progressedCount,
        targetCustomer,
        pct
      };
    })
      .filter(s => s.count > 0 || s.progressedCount > 0)
      .sort((a, b) => b.pct - a.pct || b.progressedCount - a.progressedCount || b.count - a.count);
  }, [sales, customers, filteredActivities, canSeeAll]);

  const maxLeaderboard = leaderboard.length > 0 ? leaderboard[0].count : 1;

  if (loading) {
    return <MainLayout><div className="flex items-center justify-center min-h-[50vh]">Memuat data...</div></MainLayout>;
  }

  const handleKpiCardClick = (activityTypeKey = null) => {
    let currentPeriodVal = dailyValue;
    if (periodType === 'weekly') currentPeriodVal = weeklyValue;
    else if (periodType === 'monthly') currentPeriodVal = monthlyValue;
    else if (periodType === 'yearly') currentPeriodVal = yearlyValue;

    const params = new URLSearchParams({
      period: periodType,
      periodRef: currentPeriodVal,
    });

    if (activityTypeKey) {
      params.set('jenis', activityTypeKey);
    }

    navigate(`/marketing/reports?${params.toString()}`);
  };

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
        <div
          onClick={() => handleKpiCardClick(null)}
          title="Klik untuk melihat rincian seluruh aktivitas di Laporan"
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col justify-center cursor-pointer hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 mb-1 transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {filteredActivities.length}
          </div>
          <div className="text-xs font-semibold text-gray-500 group-hover:text-blue-600 transition-colors flex items-center justify-center gap-1">
            <span>Total Aktivitas</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        {ACTIVITY_TYPES.map(t => (
          <div
            key={t.key}
            onClick={() => handleKpiCardClick(t.key)}
            title={`Klik untuk mem-filter ${t.key} di Laporan`}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col justify-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            style={{
              borderColor: undefined,
            }}
          >
            <div className="text-3xl font-bold mb-1 group-hover:scale-105 transition-transform" style={{ color: t.color, fontFamily: "'Space Grotesk', sans-serif" }}>
              {typeCounts[t.key]}
            </div>
            <div className="text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition-colors flex items-center justify-center gap-1">
              <span>{t.short}</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: t.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Section Grid: 9 Cols (Chart Tren / Satuan) + 3 Cols (Pie Chart Cakupan Customer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Kolom 9: Chart Aktivitas (Tab: Tren Kumulatif vs Satuan per Jenis) */}
        <div className="lg:col-span-9 bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                {chartViewMode === 'trend'
                  ? (periodType === 'daily' ? 'Tren Aktivitas per Jam' : 'Tren Aktivitas Harian')
                  : 'Aktivitas per Jenis'} — {range.label}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {chartViewMode === 'trend'
                  ? (periodType === 'daily'
                    ? 'Distribusi waktu aktivitas sales dari jam 00:00 s.d 23:00'
                    : 'Visualisasi distribusi aktivitas kumulatif & total aktivitas sepanjang periode')
                  : 'Total volume aktivitas berdasarkan kategori jenis aktivitas'}
              </p>
            </div>

            {/* Tab Pilihan Mode Chart */}
            <div className="inline-flex bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setChartViewMode('trend')}
                className={`px-3 py-1.5 rounded-md transition-all ${chartViewMode === 'trend'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Tren Timeline
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('summary')}
                className={`px-3 py-1.5 rounded-md transition-all ${chartViewMode === 'summary'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Kategori Per Jenis
              </button>
            </div>
          </div>

          <div className="h-72 w-full mt-2">
            {chartViewMode === 'trend' ? (
              <Chart type="bar" data={trendData} options={trendOptions} />
            ) : (
              <Bar data={chartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Kolom 3: Pie / Donut Chart Cakupan Customer */}
        <div className="lg:col-span-3 bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Cakupan Customer</h3>
            <p className="text-xs text-gray-500 mt-0.5">{range.label}</p>
          </div>

          <div className="relative flex-1 flex flex-col items-center justify-center min-h-[220px]">
            {customerStats.total === 0 ? (
              <div className="text-xs text-gray-400 py-12 text-center">Belum ada customer.</div>
            ) : (
              <>
                <div className="h-48 w-full relative flex items-center justify-center">
                  <Doughnut data={customerPieData} options={customerPieOptions} />
                  {/* Angka Persentase di Tengah Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-5">
                    <span className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {customerStats.pct}%
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                      Terprogress
                    </span>
                  </div>
                </div>

                {/* Ringkasan Angka Bawah */}
                <div className="w-full pt-3 mt-1 border-t border-gray-100 grid grid-cols-2 gap-2 text-center">
                  <button
                    type="button"
                    onClick={() => { setCustomerModal(true); setCustomerSearch(''); }}
                    className="bg-emerald-50/70 hover:bg-emerald-100/80 p-2 rounded-lg border border-emerald-200 transition-colors text-left flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] text-emerald-700 font-semibold">Terprogress</span>
                      <ExternalLink className="w-3 h-3 text-emerald-600 opacity-60 group-hover:opacity-100" />
                    </div>
                    <div className="text-base font-bold text-emerald-800 mt-1">{customerStats.progressed}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setCustomerModal(true); setCustomerSearch(''); }}
                    className="bg-rose-50/70 hover:bg-rose-100/80 p-2 rounded-lg border border-rose-200 transition-colors text-left flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] text-rose-700 font-semibold">Belum Ada</span>
                      <ExternalLink className="w-3 h-3 text-rose-600 opacity-60 group-hover:opacity-100" />
                    </div>
                    <div className="text-base font-bold text-rose-800 mt-1">{customerStats.notProgressed}</div>
                  </button>
                </div>

                {/* 3 Data Terbaru & 3 Data Belum Terprogress */}
                <div className="w-full mt-4 space-y-3 pt-3 border-t border-gray-100">
                  {/* Data Terprogress */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-700 tracking-wide">
                        TERPROGRESS ({customerStats.progressed})
                      </span>
                      {customerStats.progressedList.length > 3 && (
                        <button
                          type="button"
                          onClick={() => { setCustomerModal(true); setCustomerSearch(''); }}
                          className="text-[10px] text-blue-600 hover:underline font-semibold"
                        >
                          Lihat Semua
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {customerStats.progressedList.slice(0, 3).map((c) => (
                        <div
                          key={c.id}
                          onClick={() => { setCustomerModal(true); setCustomerSearch(c.nama_customer); }}
                          className="flex items-center justify-between p-1.5 rounded-md hover:bg-emerald-50/60 transition-colors text-xs cursor-pointer border border-transparent hover:border-emerald-100"
                        >
                          <span className="font-medium text-gray-800 truncate mr-2">{c.nama_customer}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">{c.no_akun || '—'}</span>
                        </div>
                      ))}
                      {!customerStats.progressedList.length && (
                        <div className="text-[11px] text-gray-400 italic py-1">Belum ada data.</div>
                      )}
                    </div>
                  </div>

                  {/* Data Belum Ada Progres */}
                  <div className="pt-2 border-t border-dashed border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-rose-700 tracking-wide">
                        BELUM ADA AKTIVITAS ({customerStats.notProgressed})
                      </span>
                      {customerStats.notProgressedList.length > 3 && (
                        <button
                          type="button"
                          onClick={() => { setCustomerModal(true); setCustomerSearch(''); }}
                          className="text-[10px] text-blue-600 hover:underline font-semibold"
                        >
                          Lihat Semua
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {customerStats.notProgressedList.slice(0, 3).map((c) => (
                        <div
                          key={c.id}
                          onClick={() => { setCustomerModal(true); setCustomerSearch(c.nama_customer); }}
                          className="flex items-center justify-between p-1.5 rounded-md hover:bg-rose-50/60 transition-colors text-xs cursor-pointer border border-transparent hover:border-rose-100"
                        >
                          <span className="font-medium text-gray-800 truncate mr-2">{c.nama_customer}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">{c.no_akun || '—'}</span>
                        </div>
                      ))}
                      {!customerStats.notProgressedList.length && (
                        <div className="text-[11px] text-gray-400 italic py-1">Semua customer telah terprogress.</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal All List Customer: 1 Modal dengan Kiri Hijau (Terprogress) dan Kanan Merah (Belum Ada) */}
      {customerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Status Cakupan Seluruh Customer — {range.label}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Total: <span className="font-semibold text-gray-700">{customerStats.total} Customer</span> ({customerStats.pct}% Terprogress)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomerModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Input */}
            <div className="p-3 sm:px-6 border-b border-gray-100 bg-gray-50/70">
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari customer (nama atau no akun)..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Modal Body: 2 Kolom (Kiri Hijau, Kanan Merah) */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              {/* Kolom KIRI: Hijau (Sudah Ada Aktivitas / Terprogress) */}
              <div className="flex flex-col h-full overflow-hidden bg-emerald-50/20">
                <div className="p-3 sm:px-5 border-b border-emerald-100 bg-emerald-50/60 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs sm:text-sm font-bold text-emerald-800 uppercase tracking-wide">
                      Sudah Ada Aktivitas
                    </span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {customerStats.progressed} Customer
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-5 divide-y divide-emerald-100/60">
                  {(() => {
                    const q = customerSearch.toLowerCase();
                    const list = customerStats.progressedList.filter(c =>
                      (c.nama_customer || '').toLowerCase().includes(q) ||
                      (c.no_akun || '').toLowerCase().includes(q)
                    );

                    if (list.length === 0) {
                      return (
                        <div className="py-12 text-center text-xs text-gray-400">
                          {customerSearch ? 'Tidak ditemukan customer yang cocok.' : 'Belum ada customer terprogress.'}
                        </div>
                      );
                    }

                    return list.map((c, idx) => (
                      <div key={c.id || idx} className="py-2.5 px-2 flex items-center justify-between hover:bg-emerald-50/60 rounded-lg transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="text-xs font-semibold text-emerald-600/70 w-5 shrink-0 text-right">{idx + 1}.</span>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">{c.nama_customer}</div>
                            <div className="text-xs text-gray-400 truncate">{c.industri || c.alamat || c.site_kota || '—'}</div>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/70 border border-emerald-200/60 px-2 py-0.5 rounded shrink-0">
                          {c.no_akun || '—'}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Kolom KANAN: Merah (Belum Ada Aktivitas) */}
              <div className="flex flex-col h-full overflow-hidden bg-rose-50/20">
                <div className="p-3 sm:px-5 border-b border-rose-100 bg-rose-50/60 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-xs sm:text-sm font-bold text-rose-800 uppercase tracking-wide">
                      Belum Ada Aktivitas
                    </span>
                  </div>
                  <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {customerStats.notProgressed} Customer
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-5 divide-y divide-rose-100/60">
                  {(() => {
                    const q = customerSearch.toLowerCase();
                    const list = customerStats.notProgressedList.filter(c =>
                      (c.nama_customer || '').toLowerCase().includes(q) ||
                      (c.no_akun || '').toLowerCase().includes(q)
                    );

                    if (list.length === 0) {
                      return (
                        <div className="py-12 text-center text-xs text-gray-400">
                          {customerSearch ? 'Tidak ditemukan customer yang cocok.' : 'Semua customer telah memiliki aktivitas.'}
                        </div>
                      );
                    }

                    return list.map((c, idx) => (
                      <div key={c.id || idx} className="py-2.5 px-2 flex items-center justify-between hover:bg-rose-50/60 rounded-lg transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="text-xs font-semibold text-rose-500/70 w-5 shrink-0 text-right">{idx + 1}.</span>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">{c.nama_customer}</div>
                            <div className="text-xs text-gray-400 truncate">{c.industri || c.alamat || c.site_kota || '—'}</div>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-rose-700 bg-rose-100/70 border border-rose-200/60 px-2 py-0.5 rounded shrink-0">
                          {c.no_akun || '—'}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:px-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Menampilkan total {customerStats.total} customer terdaftar
              </div>
              <button
                type="button"
                onClick={() => setCustomerModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors shadow-2xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {canSeeAll && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-600">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 tracking-tight">Leaderboard Sales</h3>
                <p className="text-xs text-gray-500">
                  Peringkat berdasarkan volume aktivitas & jangkauan customer periode <span className="font-semibold text-gray-700">{range.label}</span>
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Urutan berdasarkan persentase capaian customer tertinggi</span>
            </div>
          </div>

          {leaderboard.length ? (
            <div>
              {/* Leaderboard Grid / Rows: Compact & Space-saving */}
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${!showAllLeaderboard && leaderboard.length > 6 ? 'max-h-[380px] overflow-y-auto pr-1' : ''}`}>
                {(showAllLeaderboard ? leaderboard : leaderboard.slice(0, 12)).map((r, index) => {
                  const rank = index + 1;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;

                  const badgeBg = isTop1
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : isTop2
                      ? "bg-slate-200 text-slate-800 border-slate-300"
                      : isTop3
                        ? "bg-orange-100 text-orange-800 border-orange-200"
                        : "bg-gray-100 text-gray-600 border-gray-200";

                  // Relatif progress bar berdasarkan max aktivitas tertinggi di periode ini
                  const barPercent = Math.min(100, Math.round((r.count / maxLeaderboard) * 100));

                  return (
                    <div
                      key={r.id || r.name}
                      className={`px-3.5 py-3 rounded-xl border transition-all hover:shadow-xs flex flex-col justify-between ${isTop1
                          ? "bg-amber-50/20 border-amber-200/90 shadow-2xs"
                          : "bg-white border-gray-200 hover:border-blue-200"
                        }`}
                    >
                      {/* Baris Atas: Rank, Nama Sales, & Badge Total Aktivitas Utama */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg border font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ${badgeBg}`}>
                            {isTop1 ? <Medal className="w-4 h-4 text-amber-600" /> : rank}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 text-sm truncate block" title={r.name}>
                              {r.name}
                            </span>
                          </div>
                        </div>

                        {/* Total Volume Aktivitas */}
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/70 text-blue-700 font-bold text-xs">
                            <span className="text-sm font-extrabold">{r.count}</span>
                            <span className="text-[11px] text-blue-600 font-medium">Aktivitas</span>
                          </span>
                        </div>
                      </div>

                      {/* Area Informasi: Customer dihubungi vs Total Customer & Persentase */}
                      <div className="bg-gray-50/80 rounded-lg p-2.5 border border-gray-100 flex flex-col gap-1.5 mb-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <span>Customer: </span>
                            <strong className="text-emerald-700 font-bold">{r.progressedCount}</strong>
                            <span className="text-gray-400">dihubungi</span>
                            <span className="text-gray-400">/</span>
                            <strong className="text-gray-700 font-semibold">{r.targetCustomer}</strong>
                            <span className="text-gray-500">cust</span>
                          </span>
                          <span className={`font-extrabold text-xs px-2 py-0.5 rounded-full ${r.pct >= 100
                              ? "bg-emerald-100 text-emerald-800"
                              : r.pct >= 50
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                            {r.pct}%
                          </span>
                        </div>

                        {/* Bar Persentase Jangkauan Customer: Customer Dihubungi / Total Customer */}
                        <div className="h-2 bg-gray-200/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${r.pct >= 100
                                ? "bg-emerald-500"
                                : r.pct >= 50
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                              }`}
                            style={{ width: `${Math.min(100, Math.max(r.pct, r.progressedCount > 0 ? 5 : 0))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tombol Lihat Semua Sales Jika Lebih dari 12 */}
              {leaderboard.length > 12 && (
                <div className="mt-3 text-center border-t border-gray-100 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllLeaderboard(prev => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {showAllLeaderboard ? (
                      <>
                        <span>Tampilkan Lebih Sedikit (Top 12)</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>Lihat Semua {leaderboard.length} Sales</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-xs text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              Belum ada aktivitas pada periode ini.
            </div>
          )}
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
                        <td className="px-6 py-5 whitespace-nowrap text-gray-600">{formatDisplayDate(act.tanggal)}</td>
                        {canSeeAll && <td className="px-6 py-5 text-gray-800">{act.user_name || '—'}</td>}
                        <td className="px-6 py-5">
                          <div className="font-semibold text-gray-900">{act.nama_customer || '—'}</div>
                          {act.site_kota && <div className="text-sm text-gray-500 mt-0.5">{act.site_kota}</div>}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold" style={{ backgroundColor: typeInfo.bg, color: typeInfo.color }}>
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: typeInfo.color }}></span>
                            {typeInfo.short}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-gray-600 text-sm max-w-xs">{getDitemuiText(act) || '—'}</td>
                        <td className="px-6 py-5 text-gray-600 max-w-xs truncate" title={act.catatan}>{act.catatan || '—'}</td>
                      </tr>
                    )
                  })
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
                        <Clock size={12} /> {formatDisplayDate(act.tanggal)}
                      </p>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border" style={{ backgroundColor: typeInfo.bg, color: typeInfo.color, borderColor: `${typeInfo.color}40` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: typeInfo.color }}></span>
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
