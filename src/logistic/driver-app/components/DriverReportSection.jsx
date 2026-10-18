import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Award, 
  Truck, 
  Gauge, 
  Clock, 
  Receipt, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  MapPin, 
  Fuel, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Filter,
  Check,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { logisticApi } from '../../services/logisticApi';

export default function DriverReportSection({ currentUser, driverProfile }) {
  const [reportPeriod, setReportPeriod] = useState('monthly'); // 'weekly' | 'monthly' | 'yearly'
  const [activeReportTab, setActiveReportTab] = useState('kpi'); // 'kpi' | 'tasks' | 'expenses' | 'shifts'
  const [isLoading, setIsLoading] = useState(false);

  // Real Data State dari Server
  const [kpiData, setKpiData] = useState({
    totalKm: 0,
    totalDeliveries: 0,
    completedDeliveries: 0,
    onTimeRate: 100,
    customerRating: 4.9,
    safeDrivingScore: 99,
    totalTripHours: '0 Jam',
    totalFuelExpense: 0,
    totalTollExpense: 0,
    totalOtherExpense: 0
  });

  const [taskHistory, setTaskHistory] = useState([]);
  const [expenseHistory, setExpenseHistory] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const data = await logisticApi.getDriverReports({
          driver_id: driverProfile?.id,
          period: reportPeriod
        });
        if (isMounted && data) {
          if (data.kpi) setKpiData(data.kpi);
          if (data.taskHistory) setTaskHistory(data.taskHistory);
          if (data.expenseHistory) setExpenseHistory(data.expenseHistory);
        }
      } catch (err) {
        console.error('Gagal mengambil laporan driver:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchReports();
    return () => { isMounted = false; };
  }, [driverProfile?.id, reportPeriod]);

  return (
    <div className="space-y-4">
      {/* Header Laporan & Pemilih Periode */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Rekapitulasi Operasional
          </span>
          <h2 className="text-base font-black text-slate-900 mt-0.5">
            Laporan Kinerja Driver
          </h2>
        </div>

        {/* Dropdown Periode (Mingguan / Bulanan / Tahunan) */}
        <select
          value={reportPeriod}
          onChange={(e) => setReportPeriod(e.target.value)}
          className="bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
        >
          <option value="weekly">Minggu Ini</option>
          <option value="monthly">Bulan Ini</option>
          <option value="yearly">Tahun Ini</option>
        </select>
      </div>

      {/* Tab Navigasi Sub-Laporan (4 Menu Pill) */}
      <div className="flex rounded-2xl bg-slate-200/70 p-1 border border-slate-300/60 overflow-x-auto no-scrollbar gap-1 text-xs">
        <button
          onClick={() => setActiveReportTab('kpi')}
          className={`flex-1 min-w-[75px] py-2 font-bold rounded-xl transition-all ${
            activeReportTab === 'kpi' 
              ? 'bg-white text-emerald-800 shadow-sm font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          KPI Driver
        </button>
        <button
          onClick={() => setActiveReportTab('tasks')}
          className={`flex-1 min-w-[75px] py-2 font-bold rounded-xl transition-all ${
            activeReportTab === 'tasks' 
              ? 'bg-white text-emerald-800 shadow-sm font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tugas
        </button>
        <button
          onClick={() => setActiveReportTab('expenses')}
          className={`flex-1 min-w-[75px] py-2 font-bold rounded-xl transition-all ${
            activeReportTab === 'expenses' 
              ? 'bg-white text-emerald-800 shadow-sm font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pengeluaran
        </button>
        <button
          onClick={() => setActiveReportTab('shifts')}
          className={`flex-1 min-w-[75px] py-2 font-bold rounded-xl transition-all ${
            activeReportTab === 'shifts' 
              ? 'bg-white text-emerald-800 shadow-sm font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Shifting
        </button>
      </div>

      {isLoading && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Memuat data rekapitulasi database...</p>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. TAB: LAPORAN KPI & RINGKASAN PERFORMA                  */}
      {/* ========================================================= */}
      {!isLoading && activeReportTab === 'kpi' && (
        <div className="space-y-3.5">
          {/* Card Highlight Skor Utama */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-3xl p-5 shadow-lg shadow-emerald-700/20 relative overflow-hidden">
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Indeks Kinerja Driver</span>
                <h3 className="text-xl font-black mt-0.5">{driverProfile?.name || currentUser?.name || 'Abdul Karim'}</h3>
              </div>
              <div className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-xs font-black flex items-center gap-1">
                <Award className="w-4 h-4 text-amber-300" />
                <span>GRADE A+</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 text-center">
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-2xl border border-white/15">
                <span className="text-[10px] text-white/70 uppercase font-semibold block">Total KM</span>
                <span className="text-base font-black mt-0.5 block">{kpiData.totalKm.toLocaleString()} KM</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-2xl border border-white/15">
                <span className="text-[10px] text-white/70 uppercase font-semibold block">Pengiriman</span>
                <span className="text-base font-black mt-0.5 block">{kpiData.totalDeliveries} Rit</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-2xl border border-white/15">
                <span className="text-[10px] text-white/70 uppercase font-semibold block">Ketepatan</span>
                <span className="text-base font-black mt-0.5 block text-emerald-300">{kpiData.onTimeRate}%</span>
              </div>
            </div>
          </div>

          {/* Grid Detail Metrik KPI */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-slate-500">
                <Gauge className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Safety Driving</span>
              </div>
              <div className="text-lg font-black text-slate-900">{kpiData.safeDrivingScore} / 100</div>
              <span className="text-[10px] text-emerald-600 font-bold block">Tanpa Insiden & Kendala</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-slate-500">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Jam Perjalanan</span>
              </div>
              <div className="text-lg font-black text-slate-900">{kpiData.totalTripHours}</div>
              <span className="text-[10px] text-slate-500 font-medium block">Tercatat di server</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-slate-500">
                <Fuel className="w-4 h-4 text-amber-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Biaya BBM</span>
              </div>
              <div className="text-lg font-black text-slate-900">
                Rp {kpiData.totalFuelExpense ? kpiData.totalFuelExpense.toLocaleString() : '0'}
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">
                Rasio: {driverProfile?.fuel_ratio_km_per_liter || '12'} KM / Liter
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-slate-500">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Biaya Tol</span>
              </div>
              <div className="text-lg font-black text-slate-900">
                Rp {kpiData.totalTollExpense ? kpiData.totalTollExpense.toLocaleString() : '0'}
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">Struk terverifikasi</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TAB: DAFTAR LAPORAN TUGAS                              */}
      {/* ========================================================= */}
      {!isLoading && activeReportTab === 'tasks' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1 text-slate-500 font-semibold">
            <span>Riwayat Tugas ({taskHistory.length} Dokumen)</span>
            <span>Data Riil Server</span>
          </div>

          {taskHistory.length > 0 ? (
            taskHistory.map((t) => (
              <div key={t.id} className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      t.task_type === 'delivery' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {t.task_type}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">{t.reference_number}</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {t.status === 'delivered' ? 'Selesai' : t.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t.destination_name}</h4>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="line-clamp-1">{t.destination_address}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {typeof t.dispatch_date === 'string' ? t.dispatch_date.slice(0, 10) : new Date(t.dispatch_date).toLocaleDateString('id-ID')}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-slate-800">
                    Muatan: {t.total_items_count} {t.total_items_unit}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
              <p className="text-xs text-slate-500">Belum ada riwayat tugas pada periode ini.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TAB: LAPORAN PENGELUARAN (BBM, TOL, PARKIR)            */}
      {/* ========================================================= */}
      {!isLoading && activeReportTab === 'expenses' && (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pengeluaran Driver</span>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                Rp {((kpiData.totalFuelExpense || 0) + (kpiData.totalTollExpense || 0) + (kpiData.totalOtherExpense || 0)).toLocaleString()}
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Terdata di Server
              </span>
            </div>
          </div>

          {expenseHistory.length > 0 ? (
            expenseHistory.map((exp) => (
              <div key={exp.id} className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                    <Fuel className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{exp.expense_name}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{exp.notes || 'Pengeluaran operasional driver'}</p>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      {new Date(exp.expense_time).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-slate-900 block">
                    Rp {parseFloat(exp.amount).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                    Shift {exp.shift_number}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
              <p className="text-xs text-slate-500">Belum ada catatan pengeluaran pada shift ini.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TAB: SHIFTING & LAMA JAM PERJALANAN                    */}
      {/* ========================================================= */}
      {!isLoading && activeReportTab === 'shifts' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1 text-slate-500 font-semibold">
            <span>Daftar Shifting Driver</span>
            <span>Armada: {driverProfile?.assigned_vehicle_plate || 'B 1442 KYI'}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Shift Hari Ini</span>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Aktif Dinas
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Jam Dinas</span>
                <span className="font-bold text-slate-800">08:00 WIB — Selesai</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Armada</span>
                <span className="font-bold text-blue-700">{driverProfile?.assigned_vehicle_name || 'GRANDMAX PUTIH'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-medium">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                {driverProfile?.assigned_vehicle_plate || 'B 1442 KYI'}
              </span>
              <span className="font-bold text-slate-800">
                Base: {driverProfile?.division || 'AQPA Logistik'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
