import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Download, Search, Filter } from 'lucide-react';
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
  const canSeeAll = user.jabatan === 'Spv' || user.jabatan === 'Supervisor' || user.jabatan === 'Super Admin' || user.jabatan === 'Manager';

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [period, setPeriod] = useState('monthly');
  const [periodRef, setPeriodRef] = useState(new Date().toISOString().substring(0, 7));
  
  const [reportScope, setReportScope] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/activities');
      if (response.ok) {
        let data = await response.json();
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

  const filteredActs = useMemo(() => {
    return activities.filter(act => {
      // 1. Period filter
      let matchPeriod = false;
      const actDateStr = getLocalDateStr(act.tanggal);

      if (period === 'monthly') {
        // periodRef format 2024-03
        matchPeriod = actDateStr.substring(0, 7) === periodRef;
      } else if (period === 'yearly') {
        // periodRef format 2024
        matchPeriod = actDateStr.substring(0, 4) === periodRef;
      }

      // 2. Scope filter (for Supervisor/Admin)
      const matchScope = canSeeAll ? (reportScope === 'all' || act.user_id.toString() === reportScope) : true;
      
      // 3. Type filter
      const matchType = filterType === 'all' || act.jenis_aktivitas === filterType;
      
      // 4. Customer filter
      const matchCustomer = filterCustomer === 'all' || act.nama_customer === filterCustomer;

      return matchPeriod && matchScope && matchType && matchCustomer;
    });
  }, [activities, period, periodRef, reportScope, filterType, filterCustomer, canSeeAll]);

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

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleDownloadCoveragePdf = () => {
    const doc = new jsPDF();
    let scopeName = canSeeAll ? (reportScope === 'all' ? "Seluruh Tim Sales" : uniqueSales.find(s => s.id.toString() === reportScope)?.name || "") : user.name;
    const dateObj = new Date(periodRef + "-01");
    const periodStr = period === 'monthly' ? dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : periodRef;

    // Top Accent Bar
    doc.setFillColor(31, 62, 124);
    doc.rect(0, 0, 210, 4, 'F');

    let currY = 16;
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

    // Top Accent Bar
    doc.setFillColor(31, 62, 124);
    doc.rect(0, 0, 210, 4, 'F');

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 62, 124);
    doc.text(`Laporan ${period === 'monthly' ? 'Bulanan' : 'Tahunan'}`, 14, 16);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`${scopeName} · ${periodStr}`, 14, 23);
    
    doc.setDrawColor(230, 230, 230);
    doc.line(14, 27, 196, 27);
    
    let currY = 32;
    
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
        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
          <h3 className="font-bold text-lg text-gray-800">Cakupan Customer — {periodStrUI}</h3>
          <button onClick={handleDownloadCoveragePdf} className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
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
        <button onClick={handleDownloadActivityPdf} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
          <Download size={16} /> Unduh PDF
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center bg-gray-50">
          <span className="text-sm font-semibold text-gray-500 flex items-center gap-1"><Filter size={16} /> Filter:</span>
          <select className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">Semua Jenis</option>
            {ACTIVITY_TYPES.map(t => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <select className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)}>
            <option value="all">Semua Customer</option>
            {uniqueCustomer.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {(filterType !== 'all' || filterCustomer !== 'all') && (
            <button onClick={() => { setFilterType('all'); setFilterCustomer('all'); }} className="text-sm text-blue-600 hover:underline">
              Reset Filter
            </button>
          )}
          <span className="ml-auto text-xs text-gray-500 font-medium">{filteredActs.length} aktivitas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-sm">
                <th className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Tanggal</th>
                {canSeeAll && reportScope === 'all' && (
                  <th className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Sales</th>
                )}
                <th className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Customer</th>
                <th className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Site</th>
                <th className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Jenis</th>
                <th className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Detail</th>
                <th className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Catatan</th>
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
