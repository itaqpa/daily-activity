import React, { useState, useMemo } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import {
  Package,
  Search,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  Box,
  Layers,
  Ruler,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  Percent,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
  ArrowRight
} from 'lucide-react';
import ModalWizardPackaging from './components/ModalWizardPackaging';
import ModalValidasiMaterial from './components/ModalValidasiMaterial';
import { apiUrl } from '../../api';

export default function PackingPage() {
  // Data Pekerjaan Packaging (Sesuai Struktur Packaging Calculation backend-admin)
  const [jobs, setJobs] = useState([
    {
      id: 'PKG-20261017-001',
      packaging_number: 'PKG-20261017-001',
      so_number: 'SO-2026-0880',
      customer: 'PT Astra Daihatsu Motor',
      deadline: '2026-10-18',
      type_packaging: 'Wooden Box Export IPPC',
      panjang: 1200,
      lebar: 800,
      tinggi: 1000,
      qty_pack: 50,
      carton_material: 'Double Wall (CB-Flute 7mm)',
      terpal_material: 'Terpal Plastik A12 Biru Silver',
      status: 'process', // 'draft', 'assigned', 'process', 'done'
      created_at: '2026-10-17 08:30'
    },
    {
      id: 'PKG-20261016-002',
      packaging_number: 'PKG-20261016-002',
      so_number: 'SO-2026-0884',
      customer: 'PT Denso Indonesia',
      deadline: '2026-10-17',
      type_packaging: 'Pallet Heavy Duty',
      panjang: 1100,
      lebar: 1100,
      tinggi: 150,
      qty_pack: 120,
      carton_material: 'Single Wall (B-Flute 3mm)',
      terpal_material: 'Stretch Film Wrap',
      status: 'done',
      created_at: '2026-10-16 09:15'
    },
    {
      id: 'PKG-20261015-003',
      packaging_number: 'PKG-20261015-003',
      so_number: 'SO-2026-0870',
      customer: 'PT Djarum Kudus',
      deadline: '2026-10-19',
      type_packaging: 'Crate Box (Peti Kayu Rangka)',
      panjang: 1400,
      lebar: 900,
      tinggi: 1100,
      qty_pack: 80,
      carton_material: 'Triple Wall Heavy Duty',
      terpal_material: 'Terpal Plastik A12',
      status: 'assigned',
      created_at: '2026-10-15 14:00'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isValidasiOpen, setIsValidasiOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Filter Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        j.packaging_number.toLowerCase().includes(q) ||
        j.so_number.toLowerCase().includes(q) ||
        j.customer.toLowerCase().includes(q) ||
        j.type_packaging.toLowerCase().includes(q);

      const matchStatus = filterStatus === 'ALL' || j.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [jobs, searchQuery, filterStatus]);

  // KPI Calculations
  const kpiData = useMemo(() => {
    const total = jobs.length;
    const processCount = jobs.filter(j => j.status === 'process').length;
    const doneCount = jobs.filter(j => j.status === 'done').length;
    const assignedCount = jobs.filter(j => j.status === 'assigned' || j.status === 'draft').length;
    const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    return { total, processCount, doneCount, assignedCount, completionRate };
  }, [jobs]);

  // Handler Search SO ke API Akurasi
  const handleSearchSO = async (ref) => {
    try {
      const res = await fetch(apiUrl(`akurasi/sales-orders?ref=${encodeURIComponent(ref)}`));
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && json?.data?.length > 0) {
        return json.data[0];
      }
    } catch (err) {
      console.error('Error lookup SO:', err);
    }
    return null;
  };

  // Simpan Kalkulasi Baru dari Wizard
  const handleSaveCalculation = (data) => {
    const newJob = {
      id: data.packaging_number,
      packaging_number: data.packaging_number,
      so_number: data.so_number || 'SO-MANUAL',
      customer: data.customer || 'Customer Demo',
      deadline: data.packaging_date,
      type_packaging: data.type_packaging,
      panjang: data.panjang,
      lebar: data.lebar,
      tinggi: data.tinggi,
      qty_pack: data.qty_packaging || 1,
      carton_material: data.carton_material,
      terpal_material: data.terpal_material,
      status: 'assigned',
      created_at: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    setJobs(prev => [newJob, ...prev]);
    setIsWizardOpen(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Siap Kirim (Done)
          </span>
        );
      case 'process':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Dalam Proses
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
            <Layers className="w-3 h-3 text-blue-600" /> Permintaan Baru
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-slate-800">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Box className="w-4 h-4" /> Packaging Calculation & Engineering
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Packaging Job & Material Calculation
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Kalkulasi kebutuhan dimensi, volume kayu, pallet, paku, dan material kemasan sebelum proses pengiriman
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsValidasiOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <ClipboardCheck className="w-4 h-4 text-blue-600" />
              <span>Data Validasi Material</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Calculation</span>
            </button>
          </div>
        </div>

        {/* KPI MONITORING CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Permintaan Baru</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-mono">{kpiData.assignedCount}</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Menunggu Proses</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Order packaging masuk dari sales order</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Dalam Proses Pengerjaan</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Box className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-mono">{kpiData.processCount}</span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Di Workshop Packing</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Sedang dirakit tim packer</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Siap Kirim (Done)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-mono">{kpiData.doneCount}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Selesai Dikemas</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Kemasan siap dimuat armada/driver</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Tingkat Penyelesaian</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-mono">{kpiData.completionRate}%</span>
              <span className="text-xs font-bold text-slate-400 font-mono">{kpiData.doneCount}/{kpiData.total} Jobs</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full"
                style={{ width: `${kpiData.completionRate}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-slate-400 block">Realisasi target pengerjaan kemasan</span>
          </div>
        </div>

        {/* TABEL JOBS PACKAGING */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar Search & Status Filter */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari No PKG, No SO, Customer, Tipe Kemasan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-60 sm:w-80"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="assigned">Permintaan Baru</option>
                <option value="process">Dalam Proses</option>
                <option value="done">Siap Kirim</option>
              </select>
            </div>

            <span className="text-xs font-bold text-slate-500 font-mono">
              Total {filteredJobs.length} Data Kalkulasi Packaging
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-slate-200 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-4">No Packaging</th>
                  <th className="py-3 px-4">No SO & Tgl Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-3">Target Selesai</th>
                  <th className="py-3 px-4">Tipe Kemasan & Material</th>
                  <th className="py-3 px-4 text-center">Dimensi (P x L x T mm)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      Belum ada data kalkulasi packaging yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job, idx) => (
                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {job.packaging_number}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-800 block text-xs">
                          {job.so_number}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {job.created_at}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {job.customer}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.deadline}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block text-xs">
                          {job.type_packaging}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {job.carton_material}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 bg-slate-50/50">
                        {job.panjang} x {job.lebar} x {job.tinggi} mm
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {getStatusBadge(job.status)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => alert(`Detail kalkulasi ${job.packaging_number}`)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-bold text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: WIZARD KALKULASI PACKAGING BARU */}
        <ModalWizardPackaging
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onSubmit={handleSaveCalculation}
          onSearchSO={handleSearchSO}
        />

        {/* MODAL 2: DATA VALIDASI MATERIAL & FASTENER */}
        <ModalValidasiMaterial
          isOpen={isValidasiOpen}
          onClose={() => setIsValidasiOpen(false)}
        />

      </div>
    </MainLayout>
  );
}
