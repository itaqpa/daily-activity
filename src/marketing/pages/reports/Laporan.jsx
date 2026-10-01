import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { apiUrl } from '../../../api';
import { Download, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ACTIVITY_TYPES = [
  { key: "Kunjungan (Promote)", label: "Kunjungan (Promote)", color: "#3b82f6", short: "Kunjungan" },
  { key: "Survey Potensial Order / Tender", label: "Survey / Potensial", color: "#6366f1", short: "Survey/Potensial" },
  { key: "Submit Quotation", label: "Submit Quotation", color: "#f59e0b", short: "Sub. Quotation" },
  { key: "Meeting Tender", label: "Meeting Tender", color: "#8b5cf6", short: "Meet Tender" },
  { key: "Meeting / Survey PO Diterima", label: "PO Diterima", color: "#10b981", short: "PO Diterima" },
  { key: "Say Hello (Telp / WhatsApp)", label: "Say Hello (Telp/WA)", color: "#14b8a6", short: "Say Hello" }
];

export default function Laporan() {
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
  const canSeeAll = roleName !== 'staff';
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [period, setPeriod] = useState('monthly');
  const [periodRef, setPeriodRef] = useState(new Date().toISOString().substring(0, 7));
  
  const [reportScope, setReportScope] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'tanggal', direction: 'desc' });
  const [filters, setFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch(apiUrl('/activities'));
      if (response.ok) {
        let data = await response.json();
        const visibleRoles = getVisibilityRoles(user.jabatan).map(r => r.toLowerCase());
        const isSuperAdminOrAdmin = roleName.includes('super admin') || roleName.includes('admin') || user.role === 'admin';

        data = data.filter(act => {
          if (isSuperAdminOrAdmin) return true;
          if (act.user_id === user.id) return true;
          if (act.user_jabatan) {
            const actRole = act.user_jabatan.toLowerCase();
            const userDiv = (user.divisi || user.nama_divisi || '').toLowerCase();
            const actDiv = (act.user_divisi || '').toLowerCase();
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
      if (period === 'monthly') {
        matchPeriod = actDateStr.substring(0, 7) === periodRef;
      } else if (period === 'yearly') {
        matchPeriod = actDateStr.substring(0, 4) === periodRef;
      }
      const matchScope = canSeeAll ? (reportScope === 'all' || act.user_id.toString() === reportScope) : true;
      return matchPeriod && matchScope;
    });

    baseActs.forEach(a => {
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
  }, [activities, period, periodRef, reportScope, canSeeAll]);

  const filteredActs = useMemo(() => {
    let result = activities.filter(act => {
      // 1. Period filter
      let matchPeriod = false;
      const actDateStr = getLocalDateStr(act.tanggal);

      if (period === 'monthly') {
        matchPeriod = actDateStr.substring(0, 7) === periodRef;
      } else if (period === 'yearly') {
        matchPeriod = actDateStr.substring(0, 4) === periodRef;
      }

      // 2. Scope filter (for Supervisor/Admin)
      const matchScope = canSeeAll ? (reportScope === 'all' || act.user_id.toString() === reportScope) : true;
      
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
  }, [activities, period, periodRef, reportScope, canSeeAll, filters, sortConfig, searchTerm]);

  const scopeActivities = useMemo(() => {
    return activities.filter(act => {
      return canSeeAll ? (reportScope === 'all' || act.user_id.toString() === reportScope) : true;
    });
  }, [activities, reportScope, canSeeAll]);

  const allScopeCustomers = useMemo(() => {
    return [...new Set(scopeActivities.map(a => a.nama_customer).filter(Boolean))].sort();
  }, [scopeActivities]);

  const uniqueSales = useMemo(() => {
    const salesMap = new Map();
    activities.forEach(act => {
      if (act.user_id && act.user_name) {
        salesMap.set(act.user_id, act.user_name);
      }
    });
    return Array.from(salesMap, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [activities]);

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

  const handleDownloadCoveragePdf = () => {
    const doc = new jsPDF();
    let scopeName = canSeeAll ? (reportScope === 'all' ? "Seluruh Tim Sales" : uniqueSales.find(s => s.id.toString() === reportScope)?.name || "") : user.name;
    const dateObj = new Date(periodRef + "-01");
    const periodStr = period === 'monthly' ? dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : periodRef;

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
    const showSalesCol = canSeeAll && reportScope === 'all';
    let scopeName = canSeeAll ? (reportScope === 'all' ? "Seluruh Tim Sales" : uniqueSales.find(s => s.id.toString() === reportScope)?.name || "") : user.name;
    const dateObj = new Date(periodRef + "-01");
    const periodStr = period === 'monthly' ? dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : periodRef;

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
    doc.text(`Laporan ${period === 'monthly' ? 'Bulanan' : 'Tahunan'}`, 14, currY);
    
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
    if (newPeriod === 'monthly') setPeriodRef(d.toISOString().substring(0, 7));
    else if (newPeriod === 'yearly') setPeriodRef(d.getFullYear().toString());
  };

  // UI variables for formatting period
  const dateObjUI = new Date(periodRef + "-01");
  const periodStrUI = period === 'monthly' 
    ? dateObjUI.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : periodRef;

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
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Laporan Aktivitas</h2>
          <p className="text-gray-600 mt-1">
            {canSeeAll 
              ? 'Analisis aktivitas seluruh tim atau individu.' 
              : 'Laporan kinerja bulanan Anda.'}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center mb-6">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-600 mb-1">Periode Laporan</label>
          <div className="flex gap-2">
            <select className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500" value={period} onChange={handlePeriodChange}>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
            {period === 'monthly' && <input type="month" className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none" value={periodRef} onChange={e => setPeriodRef(e.target.value)} />}
            {period === 'yearly' && <input type="number" min="2000" max="2100" className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none w-24" value={periodRef} onChange={e => setPeriodRef(e.target.value)} />}
          </div>
        </div>

        {canSeeAll && (
          <div className="flex flex-col border-l border-gray-200 pl-4">
            <label className="text-sm font-semibold text-gray-600 mb-1">Cakupan Sales</label>
            <select className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 min-w-[180px]" value={reportScope} onChange={e => setReportScope(e.target.value)}>
              <option value="all">Seluruh Tim Sales</option>
              {uniqueSales.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
          <div className="text-2xl font-bold text-gray-800">{filteredActs.length}</div>
          <div className="text-xs text-gray-500 font-medium text-center mt-1 uppercase">Total Aktivitas</div>
        </div>
        {ACTIVITY_TYPES.map(t => (
          <div key={t.key} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
            <div className="text-2xl font-bold" style={{ color: t.color }}>{statCounts[t.key] || 0}</div>
            <div className="text-xs text-gray-500 font-medium text-center mt-1 uppercase">{t.short}</div>
          </div>
        ))}
      </div>

      {/* CAKUPAN CUSTOMER UI */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-4 gap-4">
          <h3 className="font-bold text-lg text-gray-800">Cakupan Customer — {periodStrUI}</h3>
          <button onClick={handleDownloadCoveragePdf} className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors shadow-sm whitespace-nowrap w-fit">
            <Download size={16} /> Unduh PDF
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center mb-6">
          <div className="w-full md:w-auto text-center md:text-left">
            <div className="text-4xl font-bold text-emerald-700">{coveragePercent}%</div>
            <div className="text-sm text-gray-500 font-medium mt-1">Terprogress</div>
          </div>
          <div className="flex-1 w-full">
            <div className="h-4 w-full bg-red-100 rounded-full overflow-hidden flex relative">
              <div 
                className="h-full bg-emerald-600 transition-all duration-500 ease-out" 
                style={{ width: `${coveragePercent}%` }}
              ></div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between mt-3 text-sm gap-2">
              <span className="text-emerald-700 font-medium flex items-start sm:items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 block mt-1.5 sm:mt-0 flex-shrink-0"></span>
                Terprogress: {uniqueCustomer.length} dari {allScopeCustomers.length} customer
              </span>
              <span className="text-red-700 font-medium flex items-start sm:items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 block mt-1.5 sm:mt-0 flex-shrink-0"></span>
                Belum Ada Aktivitas: {customersTanpaAktivitas.length} customer
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sudah Ada Aktivitas */}
          <div>
            <h4 className="text-sm font-bold text-emerald-700 mb-2 uppercase">Sudah Ada Aktivitas ({uniqueCustomer.length})</h4>
            <div className="border border-emerald-100 rounded-lg overflow-hidden bg-white max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <tbody>
                  {uniqueCustomer.length > 0 ? (
                    uniqueCustomer.map((c, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="py-2.5 px-4 font-medium text-gray-700">{c}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="py-3 px-4 text-gray-500 italic text-center">Tidak ada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Belum Ada Aktivitas */}
          <div>
            <h4 className="text-sm font-bold text-red-700 mb-2 uppercase">Belum Ada Aktivitas ({customersTanpaAktivitas.length})</h4>
            <div className="border border-red-100 rounded-lg overflow-hidden bg-white max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <tbody>
                  {customersTanpaAktivitas.length > 0 ? (
                    customersTanpaAktivitas.map((c, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="py-2.5 px-4 font-medium text-gray-700">{c}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="py-3 px-4 text-gray-500 italic text-center">Tidak ada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
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
        <button onClick={handleDownloadActivityPdf} className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap w-fit">
          <Download size={16} /> Unduh PDF
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
        {openFilter && (
          <div className="fixed inset-0 z-50" onClick={() => setOpenFilter(null)} />
        )}
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
           <span className="text-xs text-gray-500 font-medium">{filteredActs.length} aktivitas</span>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
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
                <FilterHeader columnKey="catatan" label="Catatan" />
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
      </div>
    </MainLayout>
  );
}
