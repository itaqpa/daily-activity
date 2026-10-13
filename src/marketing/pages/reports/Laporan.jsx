import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import MainLayout from '../../../components/layouts/MainLayout';
import { apiUrl } from '../../../api';
import { Download, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Clock, ChevronDown, X, Check, ExternalLink } from 'lucide-react';
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
import { Bar, Doughnut, Chart } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../../context/AuthContext';

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
  { key: "Kunjungan (Promote)", label: "Kunjungan (Promote)", color: "#2563EB", short: "Kunjungan", bg: "#EFF6FF" },
  { key: "Survey Potensial Order / Tender", label: "Survey / Potensial", color: "#8B5CF6", short: "Survey/Potensial", bg: "#F5F3FF" },
  { key: "Submit Quotation", label: "Submit Quotation", color: "#F59E0B", short: "Sub. Quotation", bg: "#FFFBEB" },
  { key: "Meeting Tender", label: "Meeting Tender", color: "#E11D48", short: "Meet Tender", bg: "#FFF1F2" },
  { key: "Meeting / Survey PO Diterima", label: "PO Diterima", color: "#10B981", short: "PO Diterima", bg: "#ECFDF5" },
  { key: "Say Hello (Telp / WhatsApp)", label: "Say Hello (Telp/WA)", color: "#06B6D4", short: "Say Hello", bg: "#ECFEFF" }
];

export default function Laporan() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { hasPermission } = useAuth();
  const canExport = hasPermission('laporan_marketing_export');
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

  const canSeeAll = hasPermission('laporan_marketing_view_all');
  const canSeeTeam = hasPermission('laporan_marketing_view_team');
  // User bypass lintas modul: punya dashboard_view tapi bukan divisi sales/marketing
  const userDivisiLower = (user.divisi || user.nama_divisi || '').toLowerCase();
  const isCrossModuleViewer = (user.explicit_bypass_permissions?.includes('dashboard_view') || user.explicit_bypass_permissions?.includes('laporan_marketing_view') || user.explicit_bypass_permissions?.includes('laporan_marketing_view_all') || user.explicit_bypass_permissions?.includes('laporan_marketing_view_team')) && !userDivisiLower.includes('sales') && !userDivisiLower.includes('marketing');
  const showDropdown = canSeeAll || canSeeTeam || isCrossModuleViewer;
  const [activities, setActivities] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();

  // Filters
  const [period, setPeriod] = useState(() => searchParams.get('period') || 'monthly');
  const [periodRef, setPeriodRef] = useState(() => searchParams.get('periodRef') || new Date().toISOString().substring(0, 7));

  const [reportScope, setReportScope] = useState('all');
  const [salesSearch, setSalesSearch] = useState('');
  const [isSalesDropdownOpen, setIsSalesDropdownOpen] = useState(false);
  const salesDropdownRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'tanggal', direction: 'desc' });
  const [filters, setFilters] = useState(() => {
    const qJenis = searchParams.get('jenis');
    return qJenis ? { jenis_aktivitas: qJenis } : {};
  });
  const [openFilter, setOpenFilter] = useState(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterPopupPosition, setFilterPopupPosition] = useState({ top: 0, left: 0 });
  const filterPopupRef = useRef(null);
  const filterButtonRefs = useRef({});

  // Sync state whenever searchParams changes & smooth scroll to table
  useEffect(() => {
    const qPeriod = searchParams.get('period');
    const qPeriodRef = searchParams.get('periodRef');
    const qJenis = searchParams.get('jenis');

    if (qPeriod) setPeriod(qPeriod);
    if (qPeriodRef) setPeriodRef(qPeriodRef);
    if (qJenis !== null) {
      if (qJenis) {
        setFilters(prev => ({ ...prev, jenis_aktivitas: qJenis }));
      } else {
        setFilters(prev => {
          const next = { ...prev };
          delete next.jenis_aktivitas;
          return next;
        });
      }
    }

    if (qPeriod || qPeriodRef || qJenis) {
      setTimeout(() => {
        const tableSection = document.getElementById('table-aktivitas-laporan');
        if (tableSection) {
          tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
    }
  }, [searchParams]);

  // Tutup dropdown filter jika klik di luar, menekan Esc, atau tabel di-scroll.
  // Portal membuat dropdown tidak terpotong oleh overflow-x-auto pada tabel.
  useEffect(() => {
    if (!openFilter) return;

    const handleOutsideClick = (event) => {
      if (filterPopupRef.current?.contains(event.target)) return;
      if (filterButtonRefs.current[openFilter]?.contains(event.target)) return;
      setOpenFilter(null);
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpenFilter(null);
    };
    const handleExternalScroll = (event) => {
      if (filterPopupRef.current?.contains(event.target)) return;
      setOpenFilter(null);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleExternalScroll);
    window.addEventListener('scroll', handleExternalScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleExternalScroll);
      window.removeEventListener('scroll', handleExternalScroll, true);
    };
  }, [openFilter]);

  // Chart & Customer Modal States (matching Dashboard)
  const [chartViewMode, setChartViewMode] = useState('trend'); // 'trend' | 'summary'
  const [customerModal, setCustomerModal] = useState(false);
  const [customerModalSearch, setCustomerModalSearch] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (salesDropdownRef.current && !salesDropdownRef.current.contains(event.target)) {
        setIsSalesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchActivities();
    fetchCustomersData();
    if (showDropdown) {
      fetchSalesList();
    }
  }, [showDropdown]);

  const fetchCustomersData = async () => {
    try {
      const response = await fetch(apiUrl('/customers'));
      if (response.ok) {
        const data = await response.json();
        const formatted = data.map(c => ({
          ...c,
          assigned_sales: Array.isArray(c.assigned_sales) ? c.assigned_sales : (c.assigned_sales ? JSON.parse(c.assigned_sales) : [])
        }));
        setCustomersData(formatted);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchSalesList = async () => {
    try {
      const response = await fetch(apiUrl('/sales'));
      if (response.ok) {
        setSalesList(await response.json());
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(apiUrl('/activities'));
      if (response.ok) {
        let data = await response.json();
        const visibleRoles = getVisibilityRoles(user.jabatan).map(r => r.toLowerCase());
        data = data.filter(act => {
          if (canSeeAll) return true;
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
    } catch (e) {
      return '';
    }
  };

  const typeColor = (type) => {
    const found = ACTIVITY_TYPES.find(t => t.key === type);
    return found ? found.color : '#6b7280';
  };

  const typePillClass = (type) => {
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

  // Helper to get week number
  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo < 10 ? '0' + weekNo : weekNo}`;
  };

  // Helper to format Date to local YYYY-MM-DD
  const getLocalDateStr = (dateString) => {
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

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

  const uniqueOptions = useMemo(() => {
    const opts = {
      tanggal: new Set(),
      user_name: new Set(),
      nama_customer: new Set(),
      site_kota: new Set(),
      jenis_aktivitas: new Set(),
      ditemui: new Set(),
      catatan: new Set(),
    };

    const baseActs = activities.filter(act => {
      let matchPeriod = false;
      const actDateStr = getLocalDateStr(act.tanggal);
      if (period === 'daily') {
        matchPeriod = actDateStr === periodRef;
      } else if (period === 'weekly') {
        matchPeriod = getWeekNumber(new Date(act.tanggal)) === periodRef;
      } else if (period === 'monthly') {
        matchPeriod = actDateStr.substring(0, 7) === periodRef;
      } else if (period === 'yearly') {
        matchPeriod = actDateStr.substring(0, 4) === periodRef;
      }
      const matchScope = canSeeAll ? (reportScope === 'all' || act.user_id?.toString() === reportScope) : true;
      return matchPeriod && matchScope;
    });

    baseActs.forEach(a => {
      if (a.tanggal) opts.tanggal.add(formatDate(a.tanggal));
      if (a.user_name) opts.user_name.add(a.user_name);
      if (a.nama_customer) opts.nama_customer.add(a.nama_customer);
      if (a.site_kota) opts.site_kota.add(a.site_kota);
      if (a.jenis_aktivitas) opts.jenis_aktivitas.add(a.jenis_aktivitas);

      const dText = getDitemuiText(a);
      if (dText) opts.ditemui.add(dText);
      if (a.catatan) opts.catatan.add(a.catatan);
    });

    return {
      tanggal: Array.from(opts.tanggal).filter(Boolean).sort(),
      user_name: Array.from(opts.user_name).filter(Boolean).sort(),
      nama_customer: Array.from(opts.nama_customer).filter(Boolean).sort(),
      site_kota: Array.from(opts.site_kota).filter(Boolean).sort(),
      jenis_aktivitas: Array.from(opts.jenis_aktivitas).filter(Boolean).sort(),
      ditemui: Array.from(opts.ditemui).filter(Boolean).sort(),
      catatan: Array.from(opts.catatan).filter(Boolean).sort(),
    };
  }, [activities, period, periodRef, reportScope, canSeeAll]);

  const filteredActs = useMemo(() => {
    let result = activities.filter(act => {
      // 1. Period filter
      let matchPeriod = false;
      const actDateStr = getLocalDateStr(act.tanggal);

      if (period === 'daily') {
        matchPeriod = actDateStr === periodRef;
      } else if (period === 'weekly') {
        matchPeriod = getWeekNumber(new Date(act.tanggal)) === periodRef;
      } else if (period === 'monthly') {
        matchPeriod = actDateStr.substring(0, 7) === periodRef;
      } else if (period === 'yearly') {
        matchPeriod = actDateStr.substring(0, 4) === periodRef;
      }

      // 2. Scope filter (for Supervisor/Admin)
      const matchScope = canSeeAll ? (reportScope === 'all' || act.user_id?.toString() === reportScope) : true;

      return matchPeriod && matchScope;
    });

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(act =>
        (act.nama_customer?.toLowerCase() || '').includes(s) ||
        (act.catatan?.toLowerCase() || '').includes(s) ||
        (getDitemuiText(act).toLowerCase()).includes(s)
      );
    }

    result = result.filter(act => {
      if (filters.tanggal && formatDate(act.tanggal).toLowerCase() !== filters.tanggal.toLowerCase()) return false;
      if (filters.user_name && (act.user_name || '').toLowerCase() !== filters.user_name.toLowerCase()) return false;
      if (filters.nama_customer && (act.nama_customer || '').toLowerCase() !== filters.nama_customer.toLowerCase()) return false;
      if (filters.site_kota && (act.site_kota || '').toLowerCase() !== filters.site_kota.toLowerCase()) return false;
      if (filters.jenis_aktivitas && (act.jenis_aktivitas || '').toLowerCase() !== filters.jenis_aktivitas.toLowerCase()) return false;
      if (filters.ditemui && (getDitemuiText(act) || '').toLowerCase() !== filters.ditemui.toLowerCase()) return false;
      if (filters.catatan && (act.catatan || '').toLowerCase() !== filters.catatan.toLowerCase()) return false;
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
  }, [activities, period, periodRef, reportScope, canSeeAll, filters, sortConfig, searchTerm]);

  const scopeActivities = useMemo(() => {
    return activities.filter(act => {
      return canSeeAll ? (reportScope === 'all' || act.user_id.toString() === reportScope) : true;
    });
  }, [activities, reportScope, canSeeAll]);

  const allScopeCustomers = useMemo(() => {
    let filtered = customersData;
    if (canSeeAll) {
      if (reportScope !== 'all') {
        filtered = filtered.filter(c => c.assigned_sales?.some(s => s.id.toString() === reportScope));
      }
    } else {
      filtered = filtered.filter(c => c.assigned_sales?.some(s => s.id === user.id));
    }
    return [...new Set(filtered.map(c => c.nama_customer).filter(Boolean))].sort();
  }, [customersData, reportScope, canSeeAll, user.id]);

  const uniqueSales = useMemo(() => {
    return salesList.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [salesList]);

  const filteredSalesList = useMemo(() => {
    if (!salesSearch.trim()) return uniqueSales;
    const q = salesSearch.toLowerCase();
    return uniqueSales.filter(s => (s.name || '').toLowerCase().includes(q));
  }, [uniqueSales, salesSearch]);

  const selectedSalesLabel = useMemo(() => {
    if (reportScope === 'all') return 'Seluruh Tim Sales';
    const found = uniqueSales.find(s => s.id.toString() === reportScope);
    return found ? found.name : 'Pilih Sales';
  }, [reportScope, uniqueSales]);

  const handleSelectSales = (val) => {
    setReportScope(val);
    setIsSalesDropdownOpen(false);
    setSalesSearch('');
  };

  const uniqueCustomer = useMemo(() => {
    return [...new Set(filteredActs.map(a => a.nama_customer).filter(Boolean))].sort();
  }, [filteredActs]);

  const customersTanpaAktivitas = useMemo(() => {
    return allScopeCustomers.filter(c => !uniqueCustomer.includes(c));
  }, [allScopeCustomers, uniqueCustomer]);

  const coveragePercent = allScopeCustomers.length > 0
    ? Math.round((uniqueCustomer.length / allScopeCustomers.length) * 100)
    : (uniqueCustomer.length > 0 ? 100 : 0);

  const statCounts = useMemo(() => {
    const counts = {};
    ACTIVITY_TYPES.forEach(t => counts[t.key] = 0);
    filteredActs.forEach(act => {
      if (counts[act.jenis_aktivitas] !== undefined) {
        counts[act.jenis_aktivitas]++;
      }
    });
    return counts;
  }, [filteredActs]);

  // Chart Kategori Per Jenis (Bar Chart)
  const chartData = {
    labels: ACTIVITY_TYPES.map(t => t.short),
    datasets: [{
      data: ACTIVITY_TYPES.map(t => statCounts[t.key] || 0),
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
    if (!periodRef) return { labels: [], datasets: [] };

    const dateList = [];
    const isDaily = period === 'daily';
    const isYearly = period === 'yearly';

    if (isDaily) {
      for (let h = 0; h < 24; h++) {
        const padH = String(h).padStart(2, '0');
        dateList.push({
          key: padH,
          label: `${padH}:00`
        });
      }
    } else if (isYearly) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const y = parseInt(periodRef, 10) || new Date().getFullYear();
      for (let m = 0; m < 12; m++) {
        const padM = String(m + 1).padStart(2, '0');
        dateList.push({
          key: `${y}-${padM}`,
          label: monthNames[m]
        });
      }
    } else if (period === 'weekly') {
      const match = periodRef.match(/^(\d{4})-W(\d{1,2})$/);
      if (match) {
        const year = parseInt(match[1], 10);
        const week = parseInt(match[2], 10);
        const simpleDate = new Date(year, 0, 1 + (week - 1) * 7);
        const day = simpleDate.getDay();
        const diff = simpleDate.getDate() - day + (day === 0 ? -6 : 1);
        const mon = new Date(simpleDate.setDate(diff));
        for (let i = 0; i < 7; i++) {
          const d = new Date(mon);
          d.setDate(mon.getDate() + i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dateStr = String(d.getDate()).padStart(2, '0');
          const key = `${y}-${m}-${dateStr}`;
          dateList.push({
            key,
            label: `${d.getDate()} ${d.toLocaleDateString('id-ID', { month: 'short' })}`
          });
        }
      }
    } else {
      // Monthly
      const parts = periodRef.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const lastDay = new Date(y, m, 0).getDate();
        for (let d = 1; d <= lastDay; d++) {
          const padD = String(d).padStart(2, '0');
          const padM = String(m).padStart(2, '0');
          dateList.push({
            key: `${y}-${padM}-${padD}`,
            label: String(d)
          });
        }
      }
    }

    const countsPerDate = {};
    const totalPerDate = {};

    dateList.forEach(item => {
      countsPerDate[item.key] = {};
      ACTIVITY_TYPES.forEach(t => {
        countsPerDate[item.key][t.key] = 0;
      });
      totalPerDate[item.key] = 0;
    });

    filteredActs.forEach(a => {
      let key = '';

      if (isDaily) {
        let hour = null;
        if (a.created_at) {
          const dt = new Date(a.created_at);
          if (!isNaN(dt.getTime())) {
            hour = String(dt.getHours()).padStart(2, '0');
          }
        }
        if (hour === null && a.tanggal && typeof a.tanggal === 'string' && a.tanggal.includes('T')) {
          const dt = new Date(a.tanggal);
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

    const datasets = ACTIVITY_TYPES.map(t => ({
      type: 'bar',
      label: t.short,
      data: dateList.map(item => countsPerDate[item.key]?.[t.key] || 0),
      backgroundColor: t.color,
      stack: 'activityStack',
      borderRadius: 4,
      maxBarThickness: 32,
    }));

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
  }, [periodRef, filteredActs, period]);

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

  // Pie / Donut Chart Cakupan Customer (matching Dashboard)
  const customerPieData = {
    labels: ['Terprogress', 'Belum Ada Aktivitas'],
    datasets: [{
      data: [uniqueCustomer.length, customersTanpaAktivitas.length],
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
            const total = allScopeCustomers.length || 1;
            const pct = Math.round((val / total) * 100);
            return ` ${context.label}: ${val} (${pct}%)`;
          }
        }
      }
    },
    cutout: '62%'
  };

  const getFormattedPeriodTitle = (p, ref) => {
    if (!ref) return '';
    if (p === 'daily') {
      const parts = ref.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      return ref;
    }
    if (p === 'weekly') {
      const match = ref.match(/^(\d{4})-W(\d{1,2})$/);
      if (match) {
        return `Minggu ke-${parseInt(match[2], 10)}, ${match[1]}`;
      }
      return ref;
    }
    if (p === 'monthly') {
      const parts = ref.split('-');
      if (parts.length >= 2) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
        return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      }
      return ref;
    }
    return `Tahun ${ref}`;
  };

  const getPeriodLabelText = (p) => {
    switch (p) {
      case 'daily': return 'Harian';
      case 'weekly': return 'Mingguan';
      case 'monthly': return 'Bulanan';
      case 'yearly': return 'Tahunan';
      default: return 'Aktivitas';
    }
  };

  const handleDownloadCoveragePdf = () => {
    const doc = new jsPDF();
    let scopeName = canSeeAll ? (reportScope === 'all' ? "Seluruh Tim Sales" : uniqueSales.find(s => s.id.toString() === reportScope)?.name || "") : user.name;
    const periodStr = getFormattedPeriodTitle(period, periodRef);

    // Top Header Bar
    doc.setFillColor(31, 62, 124);
    doc.rect(0, 0, 210, 20, 'F');

    // Text Logo
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("AQPA INDONESIA", 14, 14);

    let currY = 32;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 40, 50);
    doc.text(`Cakupan Customer — ${periodStr}`, 14, currY);
    currY += 5;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(scopeName, 14, currY);
    currY += 8;

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`Terprogress: ${uniqueCustomer.length} dari ${allScopeCustomers.length} customer (${coveragePercent}%)  ·  Belum Ada Aktivitas: ${customersTanpaAktivitas.length} customer`, 14, currY);
    currY += 8;

    // Table: Sudah Ada Aktivitas (Green Header)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(`Sudah Ada Aktivitas (${uniqueCustomer.length})`, 14, currY);
    currY += 4;

    const coverageRowsSudah = uniqueCustomer.length > 0 ? uniqueCustomer.map(c => [c]) : [["Tidak ada customer pada kelompok ini"]];

    autoTable(doc, {
      startY: currY,
      head: [["Nama Customer"]],
      body: coverageRowsSudah,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3, textColor: [50, 50, 50] },
      headStyles: { fillColor: [209, 250, 229], textColor: [4, 120, 87], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 255, 255] }
    });

    currY = doc.lastAutoTable.finalY + 10;

    // Table: Belum Ada Aktivitas (Red Header)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text(`Belum Ada Aktivitas (${customersTanpaAktivitas.length})`, 14, currY);
    currY += 4;

    const coverageRowsBelum = customersTanpaAktivitas.length > 0 ? customersTanpaAktivitas.map(c => [c]) : [["Tidak ada customer pada kelompok ini"]];

    autoTable(doc, {
      startY: currY,
      head: [["Nama Customer"]],
      body: coverageRowsBelum,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3, textColor: [50, 50, 50] },
      headStyles: { fillColor: [254, 226, 226], textColor: [185, 28, 28], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 255, 255] }
    });

    doc.save(`Cakupan-Customer-${periodRef}.pdf`);
  };

  const handleDownloadActivityPdf = () => {
    const doc = new jsPDF();
    const showSalesCol = showDropdown && reportScope === 'all';
    let scopeName = showDropdown ? (reportScope === 'all' ? "Seluruh Tim Sales" : uniqueSales.find(s => s.id.toString() === reportScope)?.name || "") : user.name;
    const periodStr = getFormattedPeriodTitle(period, periodRef);

    // Top Header Bar
    doc.setFillColor(31, 62, 124);
    doc.rect(0, 0, 210, 20, 'F');

    // Text Logo
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("AQPA INDONESIA", 14, 14);

    let currY = 32;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 62, 124);
    doc.text(`Laporan ${getPeriodLabelText(period)}`, 14, currY);

    currY += 7;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`${scopeName} · ${periodStr}`, 14, currY);

    currY += 4;
    doc.setDrawColor(230, 230, 230);
    doc.line(14, currY, 196, currY);

    currY += 5;

    const drawCard = (label, value, colIndex, rowIndex) => {
      const cardWidth = 42.5;
      const cardHeight = 16;
      const gap = 4;
      const x = 14 + (colIndex * (cardWidth + gap));
      const y = currY + (rowIndex * (cardHeight + gap));

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 113, 128);
      doc.text(label, x + 4, y + 6);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 138);
      doc.text(String(value), x + 4, y + 13);
    };

    drawCard("TOTAL AKTIVITAS", filteredActs.length, 0, 0);
    drawCard("KUNJUNGAN", statCounts["Kunjungan (Promote)"] || 0, 1, 0);
    drawCard("SURVEY / POTENSIAL", statCounts["Survey Potensial Order / Tender"] || 0, 2, 0);
    drawCard("QUOTATION", statCounts["Submit Quotation"] || 0, 3, 0);
    drawCard("MEETING TENDER", statCounts["Meeting Tender"] || 0, 0, 1);
    drawCard("PO DITERIMA", statCounts["Meeting / Survey PO Diterima"] || 0, 1, 1);
    drawCard("SAY HELLO", statCounts["Say Hello (Telp / WhatsApp)"] || 0, 2, 1);

    currY += 50;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 40, 50);
    doc.text(`Rincian Data Aktivitas — ${periodStr}`, 14, currY);
    currY += 8;

    const tableColumns = [
      "Tanggal",
      ...(showSalesCol ? ["Sales"] : []),
      "Customer",
      "Site",
      "Jenis",
      "Detail",
      "Catatan"
    ];

    const tableRows = filteredActs.map(a => [
      formatDate(a.tanggal),
      ...(showSalesCol ? [a.user_name || '-'] : []),
      a.nama_customer || '-',
      a.site_kota || '-',
      ACTIVITY_TYPES.find(t => t.key === a.jenis_aktivitas)?.short || a.jenis_aktivitas,
      getDitemuiText(a) || '-',
      a.catatan || '-'
    ]);

    autoTable(doc, {
      startY: currY,
      head: [tableColumns],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [250, 251, 252] }
    });

    doc.save(`Laporan-Aktivitas-${periodRef}.pdf`);
  };

  const handlePeriodChange = (e) => {
    const newPeriod = e.target.value;
    setPeriod(newPeriod);
    const d = new Date();
    if (newPeriod === 'daily') setPeriodRef(getLocalDateStr(d));
    else if (newPeriod === 'weekly') setPeriodRef(getWeekNumber(d));
    else if (newPeriod === 'monthly') setPeriodRef(d.toISOString().substring(0, 7));
    else if (newPeriod === 'yearly') setPeriodRef(d.getFullYear().toString());
  };

  // UI variables for formatting period
  const periodStrUI = getFormattedPeriodTitle(period, periodRef);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 inline text-blue-600" />;
  };

  const filterColumnLabels = {
    tanggal: 'Tanggal',
    user_name: 'Sales',
    nama_customer: 'Customer',
    site_kota: 'Site',
    jenis_aktivitas: 'Jenis',
    ditemui: 'Detail',
    catatan: 'Catatan',
  };

  const handleToggleTableFilter = (columnKey, event) => {
    event.stopPropagation();
    if (openFilter === columnKey) {
      setOpenFilter(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const width = 256;
    const menuHeight = 310;
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldOpenUp = spaceBelow < menuHeight && rect.top > spaceBelow;
    const top = shouldOpenUp
      ? Math.max(8, rect.top - menuHeight - 6)
      : Math.min(rect.bottom + 6, window.innerHeight - 80);
    const anchorLeft = columnKey === 'catatan' ? rect.right - width : rect.left;
    const left = Math.max(8, Math.min(anchorLeft, window.innerWidth - width - 8));

    setFilterPopupPosition({ top, left });
    setFilterSearch('');
    setOpenFilter(columnKey);
  };

  const FilterHeader = ({ columnKey, label }) => {
    const isActive = !!filters[columnKey];
    return (
      <th className="py-3 px-4 font-semibold text-sm text-gray-700 relative whitespace-nowrap group align-middle select-none">
        <div className="flex items-center justify-between gap-2">
          <div
            className="flex-1 cursor-pointer hover:text-gray-900 flex items-center gap-1"
            onClick={() => requestSort(columnKey)}
          >
            {label} <SortIcon columnKey={columnKey} />
          </div>
          <button
            ref={(element) => { filterButtonRefs.current[columnKey] = element; }}
            type="button"
            title={`Filter ${label}`}
            aria-label={`Filter ${label}`}
            aria-expanded={openFilter === columnKey}
            className={`cursor-pointer p-1.5 rounded transition-colors ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            onClick={(event) => handleToggleTableFilter(columnKey, event)}
          >
            <Filter size={16} fill={isActive ? 'currentColor' : 'none'} />
          </button>
        </div>
      </th>
    );
  };

  const currentFilterOptions = openFilter ? (uniqueOptions[openFilter] || []) : [];
  const visibleFilterOptions = currentFilterOptions.filter(option =>
    String(option).toLowerCase().includes(filterSearch.trim().toLowerCase())
  );
  const activeColumnFilterValue = openFilter ? filters[openFilter] : undefined;

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Laporan Aktivitas</h2>
          <p className="text-gray-600 mt-1">
            {showDropdown
              ? 'Analisis aktivitas seluruh tim atau individu.'
              : 'Laporan kinerja aktivitas Anda.'}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 md:items-center mb-6">
        <div className="flex flex-col w-full md:w-auto">
          <label className="text-sm font-semibold text-gray-600 mb-1">Periode Laporan</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 w-full sm:w-auto" value={period} onChange={handlePeriodChange}>
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
            {period === 'daily' && <input type="date" className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none w-full sm:w-auto" value={periodRef} onChange={e => setPeriodRef(e.target.value)} />}
            {period === 'weekly' && <input type="week" className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none w-full sm:w-auto" value={periodRef} onChange={e => setPeriodRef(e.target.value)} />}
            {period === 'monthly' && <input type="month" className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none w-full sm:w-auto" value={periodRef} onChange={e => setPeriodRef(e.target.value)} />}
            {period === 'yearly' && <input type="number" min="2000" max="2100" className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none w-full sm:w-24" value={periodRef} onChange={e => setPeriodRef(e.target.value)} />}
          </div>
        </div>

        {showDropdown && (
          <div className="flex flex-col md:border-l md:border-gray-200 md:pl-4 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 w-full md:w-auto mt-2 md:mt-0 relative" ref={salesDropdownRef}>
            <label className="text-sm font-semibold text-gray-600 mb-1">Cakupan Sales</label>
            <div className="relative w-full md:w-60">
              <button
                type="button"
                onClick={() => setIsSalesDropdownOpen(!isSalesDropdownOpen)}
                className="w-full flex items-center justify-between border border-gray-300 rounded px-3 py-1.5 bg-white text-sm text-left hover:border-gray-400 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                <span className="truncate text-gray-800 font-medium">{selectedSalesLabel}</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ml-1.5 ${isSalesDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </button>

              {isSalesDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
                  {/* Search Input Box */}
                  <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-1.5">
                    <Search size={14} className="text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={salesSearch}
                      onChange={(e) => setSalesSearch(e.target.value)}
                      placeholder="Cari sales..."
                      className="w-full text-xs bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
                      autoFocus
                    />
                    {salesSearch && (
                      <button
                        type="button"
                        onClick={() => setSalesSearch('')}
                        className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                    <button
                      type="button"
                      onClick={() => handleSelectSales('all')}
                      className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between transition-colors ${reportScope === 'all'
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span>Seluruh Tim Sales</span>
                      {reportScope === 'all' && <Check size={14} className="text-blue-600" />}
                    </button>

                    {filteredSalesList.length > 0 ? (
                      filteredSalesList.map(s => {
                        const isSelected = reportScope === s.id.toString();
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectSales(s.id.toString())}
                            className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between transition-colors ${isSelected
                                ? 'bg-blue-50 text-blue-600 font-semibold'
                                : 'text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            <span className="truncate">{s.name}</span>
                            {isSelected && <Check size={14} className="text-blue-600 flex-shrink-0 ml-1.5" />}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-4 text-xs text-center text-gray-400 italic">
                        Tidak ada sales yang cocok
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div
          onClick={() => {
            setFilters(prev => {
              const next = { ...prev };
              delete next.jenis_aktivitas;
              return next;
            });
            document.getElementById('table-aktivitas-laporan')?.scrollIntoView({ behavior: 'smooth' });
          }}
          title="Klik untuk menampilkan semua aktivitas"
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center cursor-pointer hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all group"
        >
          <div className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{filteredActs.length}</div>
          <div className="text-xs text-gray-500 group-hover:text-blue-600 font-medium text-center mt-1 uppercase transition-colors">Total Aktivitas</div>
        </div>
        {ACTIVITY_TYPES.map(t => {
          const isActive = filters.jenis_aktivitas === t.key;
          return (
            <div
              key={t.key}
              onClick={() => {
                setFilters(prev => ({ ...prev, jenis_aktivitas: isActive ? '' : t.key }));
                document.getElementById('table-aktivitas-laporan')?.scrollIntoView({ behavior: 'smooth' });
              }}
              title={`Klik untuk filter ${t.label}`}
              className={`bg-white p-4 rounded-xl shadow-sm border flex flex-col justify-center items-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group ${
                isActive ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20' : 'border-gray-100'
              }`}
            >
              <div className="text-2xl font-bold group-hover:scale-105 transition-transform" style={{ color: t.color }}>{statCounts[t.key] || 0}</div>
              <div className="text-xs text-gray-500 font-medium text-center mt-1 uppercase group-hover:text-gray-900 transition-colors">{t.short}</div>
            </div>
          );
        })}
      </div>

      {/* SECTION CHARTS: SAMA PERSIS SEPERTI DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-6">
        {/* Kolom 1 & 2: Chart Timeline / Kategori Aktivitas */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                {chartViewMode === 'trend' ? 'Tren Aktivitas Penjualan' : 'Ringkasan Jenis Aktivitas'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {chartViewMode === 'trend'
                  ? (period === 'daily'
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
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Cakupan Customer</h3>
              <p className="text-xs text-gray-500 mt-0.5">{periodStrUI}</p>
            </div>
            {canExport && (
              <button
                type="button"
                onClick={handleDownloadCoveragePdf}
                title="Unduh PDF Cakupan Customer"
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
              >
                <Download size={14} />
              </button>
            )}
          </div>

          <div className="relative flex-1 flex flex-col items-center justify-center min-h-[220px]">
            {allScopeCustomers.length === 0 ? (
              <div className="text-xs text-gray-400 py-12 text-center">Belum ada customer pada cakupan ini.</div>
            ) : (
              <>
                <div className="h-48 w-full relative flex items-center justify-center">
                  <Doughnut data={customerPieData} options={customerPieOptions} />
                  {/* Angka Persentase di Tengah Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-5">
                    <span className="text-2xl font-bold text-gray-800 font-mono">
                      {coveragePercent}%
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
                    onClick={() => { setCustomerModal('progressed'); setCustomerModalSearch(''); }}
                    className="bg-emerald-50/70 hover:bg-emerald-100/80 p-2 rounded-lg border border-emerald-200 transition-colors text-left flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] text-emerald-700 font-semibold">Terprogress</span>
                      <ExternalLink className="w-3 h-3 text-emerald-600 opacity-60 group-hover:opacity-100" />
                    </div>
                    <div className="text-base font-bold text-emerald-800 mt-1">{uniqueCustomer.length}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setCustomerModal('notProgressed'); setCustomerModalSearch(''); }}
                    className="bg-rose-50/70 hover:bg-rose-100/80 p-2 rounded-lg border border-rose-200 transition-colors text-left flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] text-rose-700 font-semibold">Belum Ada</span>
                      <ExternalLink className="w-3 h-3 text-rose-600 opacity-60 group-hover:opacity-100" />
                    </div>
                    <div className="text-base font-bold text-rose-800 mt-1">{customersTanpaAktivitas.length}</div>
                  </button>
                </div>

                {/* 3 Data Terbaru & 3 Data Belum Terprogress */}
                <div className="w-full mt-4 space-y-3 pt-3 border-t border-gray-100">
                  {/* Data Terprogress */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-700 tracking-wide">
                        TERPROGRESS ({uniqueCustomer.length})
                      </span>
                      {uniqueCustomer.length > 3 && (
                        <button
                          type="button"
                          onClick={() => { setCustomerModal('progressed'); setCustomerModalSearch(''); }}
                          className="text-[10px] text-blue-600 hover:underline font-semibold"
                        >
                          Lihat Semua
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {uniqueCustomer.slice(0, 3).map((c, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setCustomerModal('progressed'); setCustomerModalSearch(c); }}
                          className="flex items-center justify-between p-1.5 rounded-md hover:bg-emerald-50/60 transition-colors text-xs cursor-pointer border border-transparent hover:border-emerald-100"
                        >
                          <span className="font-medium text-gray-800 truncate mr-2">{c}</span>
                        </div>
                      ))}
                      {!uniqueCustomer.length && (
                        <div className="text-[11px] text-gray-400 italic py-1">Belum ada data.</div>
                      )}
                    </div>
                  </div>

                  {/* Data Belum Ada Progres */}
                  <div className="pt-2 border-t border-dashed border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-rose-700 tracking-wide">
                        BELUM ADA AKTIVITAS ({customersTanpaAktivitas.length})
                      </span>
                      {customersTanpaAktivitas.length > 3 && (
                        <button
                          type="button"
                          onClick={() => { setCustomerModal('notProgressed'); setCustomerModalSearch(''); }}
                          className="text-[10px] text-blue-600 hover:underline font-semibold"
                        >
                          Lihat Semua
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {customersTanpaAktivitas.slice(0, 3).map((c, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setCustomerModal('notProgressed'); setCustomerModalSearch(c); }}
                          className="flex items-center justify-between p-1.5 rounded-md hover:bg-rose-50/60 transition-colors text-xs cursor-pointer border border-transparent hover:border-rose-100"
                        >
                          <span className="font-medium text-gray-800 truncate mr-2">{c}</span>
                        </div>
                      ))}
                      {!customersTanpaAktivitas.length && (
                        <div className="text-[11px] text-gray-400 italic py-1">Semua customer terprogress!</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="font-bold text-lg text-gray-800">{periodStrUI}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {canSeeAll ? (reportScope === 'all' ? 'Seluruh Tim Sales' : (uniqueSales.find(s => s.id.toString() === reportScope)?.name || '')) : user.name}
          </p>
        </div>
        {canExport && (
          <button onClick={handleDownloadActivityPdf} className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap w-fit">
            <Download size={16} /> Unduh PDF
          </button>
        )}
      </div>

      <div id="table-aktivitas-laporan" className="bg-white rounded-xl shadow-sm border border-gray-100 relative scroll-mt-6">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
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
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {Object.values(filters).some(Boolean) && (
              <button
                onClick={() => setFilters({})}
                className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium flex items-center gap-1"
              >
                <X size={13} /> Reset Filter Tabel
              </button>
            )}
            <span className="text-xs text-gray-500 font-medium">{filteredActs.length} aktivitas</span>
          </div>
        </div>

        {/* Active Filter Badges */}
        {Object.entries(filters).some(([_, val]) => !!val) && (
          <div className="px-4 py-2 bg-blue-50/50 border-b border-blue-100/60 flex flex-wrap items-center gap-2">
            <span className="text-xs text-blue-700 font-medium">Filter Aktif:</span>
            {Object.entries(filters).map(([k, v]) => {
              if (!v) return null;
              const labelsMap = {
                tanggal: 'Tanggal',
                user_name: 'Sales',
                nama_customer: 'Customer',
                site_kota: 'Site',
                jenis_aktivitas: 'Jenis',
                ditemui: 'Detail',
                catatan: 'Catatan'
              };
              return (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-blue-800 border border-blue-200 rounded-md text-xs font-medium shadow-sm"
                >
                  <span className="text-gray-500">{labelsMap[k] || k}:</span>
                  <span>{v}</span>
                  <button
                    type="button"
                    onClick={() => handleFilterChange(k, '')}
                    className="text-gray-400 hover:text-red-600 ml-0.5"
                    title={`Hapus filter ${labelsMap[k] || k}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Table Desktop */}
        <div className="hidden md:block overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse relative z-10">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-sm">
                <FilterHeader columnKey="tanggal" label="Tanggal" />
                {canSeeAll && reportScope === 'all' && (
                  <FilterHeader columnKey="user_name" label="Sales" />
                )}
                <FilterHeader columnKey="nama_customer" label="Customer" />
                <FilterHeader columnKey="site_kota" label="Site" />
                <FilterHeader columnKey="jenis_aktivitas" label="Jenis" />
                <FilterHeader columnKey="ditemui" label="Detail" />
                <FilterHeader columnKey="catatan" label="Catatan" alignRight={true} />
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {loading ? (
                <tr><td colSpan={canSeeAll ? 7 : 6} className="py-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : filteredActs.length > 0 ? (
                filteredActs.map(act => (
                  <tr key={act.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 whitespace-nowrap">{formatDate(act.tanggal)}</td>
                    {canSeeAll && reportScope === 'all' && (
                      <td className="py-3 px-4">{act.user_name || '-'}</td>
                    )}
                    <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">{act.nama_customer || '-'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{act.site_kota || '-'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typePillClass(act.jenis_aktivitas)}`}>
                        {act.jenis_aktivitas}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{getDitemuiText(act) || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-[250px] truncate" title={act.catatan}>{act.catatan || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canSeeAll ? 7 : 6} className="py-8 text-center text-gray-500">
                    Tidak ada aktivitas yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card Mobile */}
        <div className="md:hidden flex flex-col gap-3 p-4 bg-gray-50/30">
          {loading ? (
            <div className="py-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100 text-sm">Memuat data...</div>
          ) : filteredActs.length > 0 ? (
            filteredActs.map(act => (
              <div key={act.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-2 relative">
                <div className="flex justify-between items-start gap-2 pr-28">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight mb-0.5">{act.nama_customer || '-'}</h3>
                    {canSeeAll && reportScope === 'all' && (
                      <p className="text-xs text-blue-600 font-medium mb-1">{act.user_name || '-'}</p>
                    )}
                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                      <Clock size={12} /> {formatDate(act.tanggal)}
                    </p>
                  </div>
                </div>

                <div className="absolute top-4 right-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-medium border ${typePillClass(act.jenis_aktivitas)}`}>
                    {act.jenis_aktivitas}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold mb-0.5">Site/Kota</span>
                    <span className="font-medium text-gray-700">{act.site_kota || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold mb-0.5">Ditemui</span>
                    <span className="font-medium text-gray-700">{getDitemuiText(act) || '-'}</span>
                  </div>
                  <div className="col-span-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold mb-1">Catatan</span>
                    <p className="text-gray-700 text-xs italic leading-relaxed">{act.catatan || '-'}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex flex-col items-center justify-center">
                <Clock className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">Tidak ada aktivitas yang cocok.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown filter table: portal ke body agar tidak tertutup overlay/overflow tabel. */}
      {openFilter && typeof document !== 'undefined' && createPortal(
        <div
          ref={filterPopupRef}
          role="dialog"
          aria-label={`Filter ${filterColumnLabels[openFilter] || openFilter}`}
          style={{ top: filterPopupPosition.top, left: filterPopupPosition.left, width: 256 }}
          className="fixed z-[9999] bg-white border border-gray-200 shadow-2xl rounded-lg font-normal normal-case text-gray-700 overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="font-semibold text-xs text-gray-700">
              Filter {filterColumnLabels[openFilter] || openFilter}
            </span>
            <button
              type="button"
              aria-label="Tutup filter"
              onClick={() => setOpenFilter(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none p-0.5 rounded"
            >
              &times;
            </button>
          </div>
          {currentFilterOptions.length > 5 && (
            <div className="p-2 border-b border-gray-100 bg-white">
              <input
                type="text"
                placeholder={`Cari ${(filterColumnLabels[openFilter] || openFilter).toLowerCase()}...`}
                value={filterSearch}
                onChange={(event) => setFilterSearch(event.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
            <button
              type="button"
              className={`w-full px-3 py-2 text-xs text-left cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between ${!activeColumnFilterValue ? 'bg-blue-50/80 text-blue-600 font-semibold' : 'text-gray-600'}`}
              onClick={() => { handleFilterChange(openFilter, ''); setOpenFilter(null); }}
            >
              <span>Semua</span>
              {!activeColumnFilterValue && <Check size={14} className="text-blue-600" />}
            </button>
            {visibleFilterOptions.length > 0 ? (
              visibleFilterOptions.map(option => {
                const selected = activeColumnFilterValue === option;
                return (
                  <button
                    type="button"
                    key={option}
                    className={`w-full px-3 py-2 text-xs text-left cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between ${selected ? 'bg-blue-50/80 text-blue-600 font-semibold' : 'text-gray-700'}`}
                    onClick={() => { handleFilterChange(openFilter, option); setOpenFilter(null); }}
                  >
                    <span className="truncate pr-2" title={String(option)}>{option}</span>
                    {selected && <Check size={14} className="text-blue-600 flex-shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-xs text-gray-400 text-center italic">
                Tidak ada pilihan
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* MODAL LIHAT SEMUA CUSTOMER (SAMA DENGAN DASHBOARD) */}
      {customerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Daftar Cakupan Customer
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Periode: {periodStrUI} · {selectedSalesLabel}
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
                  placeholder="Cari nama customer..."
                  value={customerModalSearch}
                  onChange={(e) => setCustomerModalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  autoFocus
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
                    {uniqueCustomer.length} Customer
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-5 divide-y divide-emerald-100/60">
                  {(() => {
                    const q = customerModalSearch.toLowerCase();
                    const list = uniqueCustomer.filter(c => c.toLowerCase().includes(q));

                    if (list.length === 0) {
                      return (
                        <div className="py-12 text-center text-xs text-gray-400">
                          {customerModalSearch ? 'Tidak ditemukan customer yang cocok.' : 'Belum ada customer terprogress.'}
                        </div>
                      );
                    }

                    return list.map((c, idx) => (
                      <div key={idx} className="py-2.5 px-2 flex items-center justify-between hover:bg-emerald-50/60 rounded-lg transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="text-xs font-semibold text-emerald-600/70 w-6 shrink-0 text-right">{idx + 1}.</span>
                          <span className="text-sm font-semibold text-gray-900 truncate">{c}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-200/60 px-2 py-0.5 rounded shrink-0">
                          Aktif
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
                    {customersTanpaAktivitas.length} Customer
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-5 divide-y divide-rose-100/60">
                  {(() => {
                    const q = customerModalSearch.toLowerCase();
                    const list = customersTanpaAktivitas.filter(c => c.toLowerCase().includes(q));

                    if (list.length === 0) {
                      return (
                        <div className="py-12 text-center text-xs text-gray-400">
                          {customerModalSearch ? 'Tidak ditemukan customer yang cocok.' : 'Semua customer telah memiliki aktivitas.'}
                        </div>
                      );
                    }

                    return list.map((c, idx) => (
                      <div key={idx} className="py-2.5 px-2 flex items-center justify-between hover:bg-rose-50/60 rounded-lg transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="text-xs font-semibold text-rose-500/70 w-6 shrink-0 text-right">{idx + 1}.</span>
                          <span className="text-sm font-semibold text-gray-900 truncate">{c}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/70 border border-rose-200/60 px-2 py-0.5 rounded shrink-0">
                          Pending
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
                Menampilkan total {allScopeCustomers.length} customer
              </div>
              <button
                type="button"
                onClick={() => setCustomerModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
