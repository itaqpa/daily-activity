import React from 'react';
import { 
  Building2, 
  MapPin, 
  User, 
  Calendar, 
  Clock, 
  Coins, 
  Wallet, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Clock4,
  FileText
} from 'lucide-react';

export default function CardResume({ project = {} }) {
  // Format mata uang Rupiah
  const formatRupiah = (val) => {
    if (!val) return '0';
    const num = Math.round(Number(val));
    return num.toLocaleString('id-ID');
  };

  // Helper tanggal & target selesai
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const calculateTargetSelesai = (tgl, durasi) => {
    if (!tgl || !durasi) return '-';
    try {
      const start = new Date(tgl);
      start.setDate(start.getDate() + (parseInt(durasi) - 1));
      return start.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  // Hitung hari berjalan & sisa hari
  const calculateDaysRemaining = () => {
    if (!project.tgl_mulai || !project.durasi_hari) return { elapsed: 0, remaining: 0, status: 'normal' };
    const start = new Date(project.tgl_mulai);
    const end = new Date(start);
    end.setDate(end.getDate() + (parseInt(project.durasi_hari) - 1));
    const now = new Date();

    const totalDays = parseInt(project.durasi_hari);
    const elapsedDays = Math.max(0, Math.min(totalDays, Math.floor((now - start) / (1000 * 60 * 60 * 24))));
    const remainingDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

    let status = 'normal';
    if (now > end) status = 'overdue';
    else if (remainingDays <= 7) status = 'critical';

    return { elapsed: elapsedDays, remaining: remainingDays, total: totalDays, status };
  };

  const daysInfo = calculateDaysRemaining();

  // Finansial calculation
  const nilaiKontrak = parseFloat(project.nilai_kontrak || 0);
  const budgetBiaya = parseFloat(project.budget_biaya || 0);
  const grossProfit = nilaiKontrak - budgetBiaya;
  const marginPercent = nilaiKontrak > 0 ? ((grossProfit / nilaiKontrak) * 100).toFixed(1) : 0;
  const budgetPercent = nilaiKontrak > 0 ? ((budgetBiaya / nilaiKontrak) * 100).toFixed(1) : 0;

  // Actual progress
  const progressActual = parseFloat(project.progress_actual || 0);

  // Status badge styling
  const getStatusBadge = (status) => {
    const s = (status || 'registered').toLowerCase();
    switch (s) {
      case 'running':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500 animate-pulse',
          label: 'Sedang Berjalan (Running)'
        };
      case 'completed':
      case 'closed':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          label: 'Selesai (Completed)'
        };
      case 'delayed':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Terlambat (Delayed)'
        };
      default:
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Terdaftar (Registered)'
        };
    }
  };

  const statusBadge = getStatusBadge(project.status);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Top Banner / Header Resume */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 md:p-8 text-white relative">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-xs font-mono font-semibold tracking-wider text-blue-200">
                {project.no_project || 'PRJ-XXXX'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${statusBadge.bg} backdrop-blur-md`}>
                <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
                {statusBadge.label}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {project.nama || 'Untitled Project'}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-blue-100/80 pt-1">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-300" />
                <span className="font-medium text-white">{project.customer || '-'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-300" />
                <span>{project.lokasi || '-'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-300" />
                <span>PIC: <strong className="text-white font-medium">{project.leader || '-'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Progress Dial / Bar on Header */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex items-center gap-5 min-w-[260px]">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/15"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400 transition-all duration-1000 ease-out"
                  strokeDasharray={`${Math.min(100, Math.max(0, progressActual))}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-sm font-bold text-white">
                {progressActual}%
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-blue-200/90">
                Total Realisasi
              </p>
              <p className="text-lg font-bold text-white mt-0.5">
                {progressActual >= 100 ? 'Selesai 100%' : `${progressActual}% Capaian`}
              </p>
              <p className="text-xs text-blue-200/70">
                Bobot Kumulatif Project
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Resume Details Grid */}
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Waktu & Jadwal */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Jadwal Proyek</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Mulai:</span>
                  <span className="font-semibold text-slate-900">{formatDate(project.tgl_mulai)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Target Selesai:</span>
                  <span className="font-semibold text-slate-900">{calculateTargetSelesai(project.tgl_mulai, project.durasi_hari)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Durasi Kontrak:</span>
                  <span className="font-semibold text-blue-600">{project.durasi_hari || 0} Hari</span>
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
              <span className="text-slate-500">Sisa Waktu:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${
                daysInfo.status === 'overdue' ? 'bg-red-100 text-red-700' :
                daysInfo.status === 'critical' ? 'bg-amber-100 text-amber-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {daysInfo.status === 'overdue' ? `Terlewat ${Math.abs(daysInfo.remaining)} Hari` : `${daysInfo.remaining} Hari Lagi`}
              </span>
            </div>
          </div>

          {/* Card 2: Nilai Kontrak */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>Nilai Kontrak</span>
              </div>
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                Rp {formatRupiah(project.nilai_kontrak)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Total bruto nilai kesepakatan klien
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
              <span className="text-slate-500">Gross Margin:</span>
              <span className={`font-bold ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {grossProfit >= 0 ? '+' : ''}{marginPercent}%
              </span>
            </div>
          </div>

          {/* Card 3: Budget & Biaya */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
                <Wallet className="w-4 h-4 text-indigo-600" />
                <span>Budget Biaya</span>
              </div>
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                Rp {formatRupiah(project.budget_biaya)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Estimasi alokasi biaya pengeluaran
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
              <span className="text-slate-500">Porsi Budget:</span>
              <span className="font-bold text-indigo-600">{budgetPercent}% dr Kontrak</span>
            </div>
          </div>

          {/* Card 4: Proyeksi Profit / Selisih */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
                <TrendingUp className="w-4 h-4 text-cyan-600" />
                <span>Estimasi Laba Kotor</span>
              </div>
              <p className={`text-xl font-bold tracking-tight ${grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                Rp {formatRupiah(grossProfit)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Selisih kontrak terhadap pagu budget
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
              <span className="text-slate-500">Status Keuangan:</span>
              <span className="font-semibold text-slate-700">
                {grossProfit >= 0 ? 'Margin Sehat' : 'Defisit Budget'}
              </span>
            </div>
          </div>

        </div>

        {/* Progress Tracker Bar */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs font-medium">
            <span className="text-gray-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Progres Kumulatif Realisasi vs Target Waktu
            </span>
            <div className="flex items-center gap-4 text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Realisasi: <strong>{progressActual}%</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Waktu Berlalu: <strong>{((daysInfo.elapsed / (daysInfo.total || 1)) * 100).toFixed(0)}%</strong>
              </span>
            </div>
          </div>

          <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            {/* Waktu berlalu background marker */}
            <div 
              className="absolute top-0 bottom-0 bg-blue-200/70 rounded-full" 
              style={{ width: `${Math.min(100, (daysInfo.elapsed / (daysInfo.total || 1)) * 100)}%` }}
              title={`Waktu Berlalu: ${daysInfo.elapsed} hari`}
            />
            {/* Realisasi bar */}
            <div 
              className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700" 
              style={{ width: `${Math.min(100, Math.max(0, progressActual))}%` }}
              title={`Progress Realisasi: ${progressActual}%`}
            />
          </div>
        </div>

        {/* Catatan / Keterangan Project jika ada */}
        {project.catatan && (
          <div className="bg-blue-50/50 border border-blue-100/80 rounded-xl p-3.5 flex items-start gap-3">
            <FileText className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs sm:text-sm text-gray-700">
              <strong className="text-blue-900 font-semibold">Catatan Khusus: </strong>
              <span>{project.catatan}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
