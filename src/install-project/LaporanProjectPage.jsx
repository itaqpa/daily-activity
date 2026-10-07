import React, { useState, useEffect, useMemo } from 'react';
import { Download, Search, Filter, RefreshCw, FileText, ArrowRight } from 'lucide-react';
import { apiUrl } from '../api';
import MainLayout from '../components/layouts/MainLayout';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import GlobalSummary from './components/Laporan/GlobalSummary';
import SCurveChart from './components/Laporan/SCurveChart';
import ProjectListTable from './components/Laporan/ProjectListTable';
import ProjectDetailReport from './components/Laporan/ProjectDetailReport';

const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

export default function LaporanProjectPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [costData, setCostData] = useState(null);

  // Fetch Projects List
  const fetchProjects = async () => {
    try {
      const res = await fetch(apiUrl('/install-projects'));
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  // Fetch Data (Refresh)
  const fetchReportData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Costs
      let costsRes = await fetch(apiUrl('/report/all-costs'));
      let cData = null;
      if (costsRes.ok) cData = await costsRes.json();
      setCostData(cData);

      // 2. Fetch Project Details based on selection
      if (selectedProjectId === 'all') {
        // Filter projects by date range
        const filteredProjects = projects.filter(p => {
          if (!dateFrom || !dateTo) return true;
          const pStart = new Date(p.tgl_mulai || new Date());
          const pEnd = new Date(pStart);
          pEnd.setDate(pEnd.getDate() + (parseInt(p.durasi_hari) || 1));
          
          const fStart = new Date(dateFrom);
          const fEnd = new Date(dateTo);
          
          // Overlap condition
          return pStart <= fEnd && pEnd >= fStart;
        });

        const promises = filteredProjects.map(p => fetch(apiUrl(`/install-projects/${p.id}`)).then(r => r.json()));
        const allDetails = await Promise.all(promises);
        setReportData(allDetails);
      } else {
        const res = await fetch(apiUrl(`/install-projects/${selectedProjectId}`));
        if (res.ok) {
          const detail = await res.json();
          setReportData([detail]);
        }
      }
    } catch (error) {
      console.error("Error fetching report data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    
    // Set default dates to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(lastDay.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (projects.length > 0 && reportData.length === 0) {
      fetchReportData();
    }
  }, [projects]);

  // Handle Export Excel
  const handleExportExcel = () => {
    const dataToExport = [];
    
    reportData.forEach(proj => {
      if (proj.areas && proj.areas.length > 0) {
        proj.areas.forEach(area => {
          if (area.units && area.units.length > 0) {
            area.units.forEach(unit => {
              dataToExport.push({
                'Project': proj.nama,
                'Area': area.nama_area,
                'Unit': unit.nama_unit,
                'Plan Progress (%)': unit.progress_plan || 0,
                'Actual Progress (%)': unit.progress_actual || 0,
                'Status': unit.status || 'Pending'
              });
            });
          } else {
            dataToExport.push({
              'Project': proj.nama,
              'Area': area.nama_area,
              'Unit': '-',
              'Plan Progress (%)': 0,
              'Actual Progress (%)': 0,
              'Status': '-'
            });
          }
        });
      } else {
        dataToExport.push({
          'Project': proj.nama,
          'Area': '-',
          'Unit': '-',
          'Plan Progress (%)': proj.progress_plan || 0,
          'Actual Progress (%)': proj.progress_actual || 0,
          'Status': proj.status || '-'
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Project");
    XLSX.writeFile(workbook, `Laporan_Project_${dateFrom}_${dateTo}.xlsx`);
  };

  // Handle Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text("Laporan Instalasi Project", 14, 15);
    doc.setFontSize(10);
    doc.text(`Periode: ${dateFrom} s.d ${dateTo}`, 14, 22);

    const tableColumn = ["Project", "Area", "Unit", "Plan (%)", "Actual (%)", "Status"];
    const tableRows = [];

    reportData.forEach(proj => {
      if (proj.areas && proj.areas.length > 0) {
        proj.areas.forEach(area => {
          if (area.units && area.units.length > 0) {
            area.units.forEach(unit => {
              tableRows.push([
                proj.nama,
                area.nama_area,
                unit.nama_unit,
                unit.progress_plan || '0',
                unit.progress_actual || '0',
                unit.status || 'Pending'
              ]);
            });
          }
        });
      }
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`Laporan_Project_${dateFrom}_${dateTo}.pdf`);
  };

  // Compute exact metrics as of dateTo
  const computedMetrics = useMemo(() => {
    if (!reportData || reportData.length === 0) return [];
    
    const maxDate = new Date(dateTo || new Date());
    maxDate.setHours(23, 59, 59, 999);

    return reportData.map(p => {
      // 1. Calculate Plan Progress up to dateTo
      let planPct = 0;
      if (p.tgl_mulai) {
        const start = new Date(p.tgl_mulai);
        const end = new Date(p.tgl_mulai);
        end.setDate(end.getDate() + (parseInt(p.durasi_hari) || 1));
        
        if (maxDate < start) {
          planPct = 0;
        } else if (maxDate >= end) {
          planPct = 100;
        } else {
          // Sigmoid approx
          const x = (maxDate - start) / (end - start);
          planPct = (x * x * (3 - 2 * x)) * 100;
        }
      }

      // 2. Calculate Actual Progress up to dateTo
      let actualPct = 0;
      if (p.daily_progress_history) {
        p.daily_progress_history.forEach(h => {
          if (new Date(h.tanggal) <= maxDate) {
            actualPct += parseFloat(h.pct_day || 0);
          }
        });
      }

      // 3. Calculate Actual Cost up to dateTo
      let actualCost = 0;
      if (costData) {
        const cd = costData.find(c => c.id === p.id);
        if (cd && cd.ledger) {
          cd.ledger.forEach(l => {
            if (new Date(l.tanggal) <= maxDate) {
              actualCost += parseFloat(l.jumlah || 0);
            }
          });
        }
      }

      return {
        ...p,
        computed_plan: Math.min(100, Math.max(0, planPct)),
        computed_actual: Math.min(100, Math.max(0, actualPct)),
        computed_cost: actualCost
      };
    });
  }, [reportData, dateTo, costData]);

  // Generate Data for S-Curve
  const chartData = useMemo(() => {
    if (computedMetrics.length === 0) return { labels: [], datasets: [] };

    let startD = new Date(dateFrom || new Date());
    startD.setHours(0,0,0,0);
    let endD = new Date(dateTo || new Date());
    endD.setHours(23,59,59,999);
    
    let totalDays = Math.max(1, Math.ceil((endD - startD) / (1000 * 60 * 60 * 24)));
    let pointsCount = Math.min(totalDays, 30); // Max 30 points on chart
    let step = totalDays / pointsCount;

    const labels = [];
    const planData = [];
    const actualData = [];
    const deviationData = [];
    const costPlanData = [];
    const costActualData = [];

    // Total Budget
    let totalBudget = computedMetrics.reduce((acc, p) => acc + parseFloat(p.budget_biaya || 0), 0);

    for (let i = 0; i <= pointsCount; i++) {
      const d = new Date(startD.getTime() + i * step * (1000 * 60 * 60 * 24));
      labels.push(`${d.getDate()}/${d.getMonth()+1}`);
      d.setHours(23, 59, 59, 999);

      let sumPlan = 0;
      let sumActual = 0;
      let sumCost = 0;

      computedMetrics.forEach(p => {
        // Plan
        if (p.tgl_mulai) {
          const pStart = new Date(p.tgl_mulai);
          const pEnd = new Date(p.tgl_mulai);
          pEnd.setDate(pEnd.getDate() + (parseInt(p.durasi_hari) || 1));
          if (d >= pEnd) sumPlan += 100;
          else if (d > pStart) {
            const x = (d - pStart) / (pEnd - pStart);
            sumPlan += (x * x * (3 - 2 * x)) * 100;
          }
        }
        
        // Actual
        if (p.daily_progress_history) {
          p.daily_progress_history.forEach(h => {
            if (new Date(h.tanggal) <= d) sumActual += parseFloat(h.pct_day || 0);
          });
        }
        
        // Cost
        if (costData) {
          const cd = costData.find(c => c.id === p.id);
          if (cd && cd.ledger) {
            cd.ledger.forEach(l => {
              if (new Date(l.tanggal) <= d) sumCost += parseFloat(l.jumlah || 0);
            });
          }
        }
      });

      const avgPlan = sumPlan / computedMetrics.length || 0;
      const avgActual = sumActual / computedMetrics.length || 0;

      planData.push(avgPlan.toFixed(2));
      actualData.push(avgActual.toFixed(2));
      deviationData.push((avgActual - avgPlan).toFixed(2));
      
      costPlanData.push((totalBudget * (avgPlan / 100)).toFixed(0));
      costActualData.push(sumCost.toFixed(0));
    }

    const devColorsBg = deviationData.map(v => parseFloat(v) < 0 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)');
    const devColorsBorder = deviationData.map(v => parseFloat(v) < 0 ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)');

    // Calculate synchronized bounds for Y axes
    const minDev = Math.min(0, ...deviationData.map(v => parseFloat(v)));
    const yMin = Math.floor(minDev / 10) * 10; // Round down to nearest 10, e.g. -5 -> -10
    const yMax = 100;

    const maxCost = Math.max(totalBudget, ...costActualData.map(v => parseFloat(v)));
    const y1Max = maxCost > 0 ? maxCost * 1.05 : 1000000;
    const y1Min = yMin < 0 ? (yMin / yMax) * y1Max : 0;

    return {
      bounds: { yMin, yMax, y1Min, y1Max },
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Deviasi Progress (%)',
            data: deviationData,
            backgroundColor: devColorsBg,
            borderColor: devColorsBorder,
            borderWidth: 1,
            yAxisID: 'y',
            order: 3
          },
          {
            type: 'line',
            label: 'Plan Progress (%)',
            data: planData,
            borderColor: '#94a3b8',
            backgroundColor: 'rgba(148, 163, 184, 0.05)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            yAxisID: 'y',
            order: 2
          },
          {
            type: 'line',
            label: 'Actual Progress (%)',
            data: actualData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#2563eb',
            pointRadius: 3,
            yAxisID: 'y',
            order: 1
          },
          {
            type: 'line',
            label: 'Plan Cost (Rp)',
            data: costPlanData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0)',
            borderWidth: 2,
            borderDash: [4, 4],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            yAxisID: 'y1',
            order: 4
          },
          {
            type: 'line',
            label: 'Actual Cost (Rp)',
            data: costActualData,
            borderColor: '#047857',
            backgroundColor: 'rgba(4, 120, 87, 0)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 3,
            yAxisID: 'y1',
            order: 5
          }
        ]
      }
    };
  }, [reportData, dateFrom, dateTo, computedMetrics]);

  // Dynamic Chart Options
  const chartOptions = useMemo(() => {
    if (!chartData || !chartData.bounds) return {};
    const { yMin, yMax, y1Min, y1Max } = chartData.bounds;
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { 
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12, family: "'Inter', sans-serif" }
          }
        },
        tooltip: { 
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1e293b',
          bodyColor: '#475569',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.dataset.yAxisID === 'y1') {
                label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(context.raw);
              } else {
                label += context.raw + '%';
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          min: yMin,
          max: yMax,
          title: { display: true, text: 'Progress (%)' },
          ticks: { callback: (value) => value + '%' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          min: y1Min,
          max: y1Max,
          title: { display: true, text: 'Biaya (Rp)' },
          grid: { drawOnChartArea: false },
          ticks: { 
            callback: (value) => {
              if (value === 0) return 'Rp 0';
              const isNeg = value < 0;
              const val = Math.abs(value);
              let res = '';
              if (val >= 1e9) {
                res = (val / 1e9).toFixed(1).replace(/\.0$/, '') + ' M';
              } else if (val >= 1e6) {
                res = (val / 1e6).toFixed(1).replace(/\.0$/, '') + ' Jt';
              } else {
                res = new Intl.NumberFormat('id-ID').format(val);
              }
              return (isNeg ? '-' : '') + 'Rp ' + res;
            }
          }
        }
      }
    };
  }, [chartData]);

  return (
    <MainLayout>
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Project</h1>
            <p className="text-gray-500 text-sm mt-1">
              Pantau kurva S, progress unit, dan pengeluaran secara menyeluruh.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={handleExportExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                <Download size={16} /> Excel
             </button>
             <button onClick={handleExportPDF} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                <FileText size={16} /> PDF
             </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase">Dari Tanggal</label>
            <input 
              type="date" 
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase">Sampai Tanggal</label>
            <input 
              type="date" 
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-600 uppercase">Pilih Project</label>
            <select 
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="all">Semua Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.no_project} - {p.nama}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={fetchReportData}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-5 py-2 rounded-lg font-medium transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 
            {loading ? 'Memuat...' : 'Refresh'}
          </button>
        </div>

        {/* Global Summary */}
        <GlobalSummary 
          computedMetrics={computedMetrics}
          dateFrom={dateFrom}
          dateTo={dateTo}
          formatCurrency={formatCurrency}
          title={selectedProjectId === 'all' ? "Global Executive Summary" : "Project Summary"}
        />

        {/* Charts */}
        <SCurveChart 
          reportData={reportData}
          chartData={chartData.data}
          chartOptions={chartOptions}
        />

        {/* Data Detail Tables */}
        <div className="space-y-6">
          {selectedProjectId === 'all' ? (
             <ProjectListTable 
               computedMetrics={computedMetrics}
               dateFrom={dateFrom}
               dateTo={dateTo}
               formatCurrency={formatCurrency}
             />
          ) : (
             <ProjectDetailReport 
               reportData={reportData}
             />
          )}

          {reportData.length === 0 && !loading && (
             <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 flex flex-col items-center justify-center text-gray-400">
                <Filter size={32} className="mb-3 opacity-50" />
                <p>Pilih project dan klik Refresh untuk menampilkan data laporan.</p>
             </div>
          )}
        </div>

      </div>
    </MainLayout>
  );
}
