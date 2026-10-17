import React, { useState, useMemo } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import {
  Truck,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  Edit3,
  MoreVertical,
  Download,
  RefreshCw,
  MapPin,
  User,
  Package,
  FileText,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import FormTugasDriverModal from './components/FormTugasDriverModal';

// Data Mockup untuk prototyping UI yang rapi & terstruktur
const INITIAL_TASKS = [
  {
    id: 'TSK-2026-001',
    tipe: 'Delivery',
    nomor_ref: 'SO-2026-0891',
    customer_vendor: 'PT Indofood CBP Sukses Makmur',
    do_easy: 'DO-EASY-9921',
    jumlah_barang: '120 Karton',
    item_description: 'Inner Box Corrugated 30x20x15',
    lokasi_awal: 'Gudang AQPA Cikarang',
    lokasi_tujuan: 'Pabrik Indofood Cibitung Blok B',
    driver_name: 'Budi Santoso',
    driver_phone: '0812-3456-7890',
    mobil_plat: 'B 9481 KXZ',
    mobil_tipe: 'Engkel Box 4 Roda',
    tanggal_penugasan: '2026-10-16',
    status: 'on_route',
  },
  {
    id: 'TSK-2026-002',
    tipe: 'Pickup',
    nomor_ref: 'PO-AQPA-0412',
    customer_vendor: 'PT Roda Prima Logam',
    do_easy: 'DO-EASY-9925',
    jumlah_barang: '45 Pallet',
    item_description: 'Plat Besi Galvanis 1.2mm',
    lokasi_awal: 'Vendor Logam Pulogadung',
    lokasi_tujuan: 'Pabrik AQPA Gunung Putri',
    driver_name: 'Ahmad Fauzi',
    driver_phone: '0857-9876-5432',
    mobil_plat: 'B 9102 SQA',
    mobil_tipe: 'CDD Long Box 6 Roda',
    tanggal_penugasan: '2026-10-16',
    status: 'assigned',
  },
  {
    id: 'TSK-2026-003',
    tipe: 'Delivery',
    nomor_ref: 'SO-2026-0875',
    customer_vendor: 'PT Astra Otoparts Tbk',
    do_easy: 'DO-EASY-9880',
    jumlah_barang: '300 Pcs',
    item_description: 'Wooden Pallet Heavy Duty Export',
    lokasi_awal: 'Gudang AQPA Cikarang',
    lokasi_tujuan: 'Plant 2 Astra Otoparts Karawang',
    driver_name: 'Joko Susilo',
    driver_phone: '0813-1122-3344',
    mobil_plat: 'B 9301 TYA',
    mobil_tipe: 'Fuso Box',
    tanggal_penugasan: '2026-10-15',
    status: 'delivered',
  },
  {
    id: 'TSK-2026-004',
    tipe: 'Pickup',
    nomor_ref: 'PO-AQPA-0399',
    customer_vendor: 'CV Berkah Plastindo',
    do_easy: 'DO-EASY-9810',
    jumlah_barang: '80 Roll',
    item_description: 'Bubble Wrap & Stretch Film 50cm',
    lokasi_awal: 'Kawasan Pergudangan Dadap',
    lokasi_tujuan: 'Gudang Logistik AQPA',
    driver_name: 'Rudi Hartono',
    driver_phone: '0878-5544-3322',
    mobil_plat: 'B 9204 UIO',
    mobil_tipe: 'Blind Van GranMax',
    tanggal_penugasan: '2026-10-15',
    status: 'arrived',
  },
  {
    id: 'TSK-2026-005',
    tipe: 'Delivery',
    nomor_ref: 'SO-2026-0860',
    customer_vendor: 'PT Mayora Indah Tbk',
    do_easy: 'DO-EASY-9750',
    jumlah_barang: '50 Set',
    item_description: 'Packaging Box Biskuit Kaleng',
    lokasi_awal: 'Gudang AQPA Cikarang',
    lokasi_tujuan: 'Mayora Factory Jatake Tangerang',
    driver_name: 'Dedi Kurniawan',
    driver_phone: '0821-6677-8899',
    mobil_plat: 'B 9552 WXY',
    mobil_tipe: 'Engkel Box',
    tanggal_penugasan: '2026-10-14',
    status: 'failed',
    failure_reason: 'Gudang customer tutup / over kapasitas',
  },
  {
    id: 'TSK-2026-006',
    tipe: 'Delivery',
    nomor_ref: 'SO-2026-0899',
    customer_vendor: 'PT Kalbe Farma Tbk',
    do_easy: 'DO-EASY-9940',
    jumlah_barang: '200 Box',
    item_description: 'Packaging Steril Farmasi',
    lokasi_awal: 'Gudang AQPA Cikarang',
    lokasi_tujuan: 'Kawasan Delta Silicon 3 Cikarang',
    driver_name: 'Budi Santoso',
    driver_phone: '0812-3456-7890',
    mobil_plat: 'B 9481 KXZ',
    mobil_tipe: 'Engkel Box 4 Roda',
    tanggal_penugasan: '2026-10-16',
    status: 'draft',
  }
];

export default function TugasDriverPage() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);

  const handleCreateTask = (newTaskData) => {
    const totalQty = newTaskData.items.reduce((sum, item) => sum + (parseFloat(item.quantity_order) || 0), 0);
    const mainUnit = newTaskData.items[0]?.unit || 'Pcs';
    const mainItemName = newTaskData.items.map(i => i.item_name).filter(Boolean).join(', ');

    const created = {
      id: `TSK-2026-${String(tasks.length + 1).padStart(3, '0')}`,
      tipe: newTaskData.task_type === 'delivery' ? 'Delivery' : 'Pickup',
      nomor_ref: newTaskData.reference_number,
      customer_vendor: newTaskData.destination_name,
      do_easy: newTaskData.do_easy || '-',
      jumlah_barang: `${totalQty} ${mainUnit}`,
      item_description: mainItemName || 'Item Muatan',
      lokasi_awal: newTaskData.origin_name,
      lokasi_tujuan: newTaskData.destination_name,
      driver_name: 'Belum Ditugaskan',
      driver_phone: '-',
      mobil_plat: '-',
      mobil_tipe: '-',
      tanggal_penugasan: newTaskData.dispatch_date,
      status: 'draft',
      is_out_of_city: newTaskData.is_out_of_city,
    };

    setTasks(prev => [created, ...prev]);
  };

  // Filter Data
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.nomor_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.do_easy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customer_vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.mobil_plat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.item_description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = filterType === 'ALL' || t.tipe === filterType;
      const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;

      return matchSearch && matchType && matchStatus;
    });
  }, [tasks, searchTerm, filterType, filterStatus]);

  // Statistik KPI
  const stats = useMemo(() => {
    const total = tasks.length;
    const deliveryCount = tasks.filter((t) => t.tipe === 'Delivery').length;
    const pickupCount = tasks.filter((t) => t.tipe === 'Pickup').length;
    const onRoute = tasks.filter((t) => t.status === 'on_route' || t.status === 'arrived').length;
    const completed = tasks.filter((t) => t.status === 'delivered').length;
    const pending = tasks.filter((t) => t.status === 'assigned' || t.status === 'draft').length;
    const failed = tasks.filter((t) => t.status === 'failed' || t.status === 'cancelled').length;

    return { total, deliveryCount, pickupCount, onRoute, completed, pending, failed };
  }, [tasks]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <Clock className="w-3.5 h-3.5 text-gray-500" /> Draft
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Ditugaskan
          </span>
        );
      case 'on_route':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Truck className="w-3.5 h-3.5 text-blue-500" /> Di Perjalanan
          </span>
        );
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <MapPin className="w-3.5 h-3.5 text-purple-500" /> Sampai di Lokasi
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Selesai
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Gagal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <Truck className="w-4 h-4" /> Logistik Operasional
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tugas Driver
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Pusat kendali dan monitoring penugasan armada driver (Delivery & Pickup) secara real-time
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => alert('Fitur Export Excel sedang disiapkan')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              type="button"
              onClick={() => setIsModalCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Tugas Baru</span>
            </button>
          </div>
        </div>

        {/* KPI STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Tugas */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tugas</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{stats.total}</span>
              <span className="text-xs text-slate-500 font-medium">Tugas</span>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 border-t border-slate-50 pt-2.5">
              <span className="flex items-center gap-1 font-semibold text-blue-700">
                <ArrowUpRight className="w-3.5 h-3.5" /> {stats.deliveryCount} Delivery
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <ArrowDownLeft className="w-3.5 h-3.5" /> {stats.pickupCount} Pickup
              </span>
            </div>
          </div>

          {/* Card 2: Dalam Perjalanan */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sedang Jalan</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-cyan-700">{stats.onRoute}</span>
              <span className="text-xs text-slate-500 font-medium">Armada Aktif</span>
            </div>
            <p className="mt-3 text-xs text-slate-500 border-t border-slate-50 pt-2.5">
              Armada di jalan atau tiba di lokasi
            </p>
          </div>

          {/* Card 3: Menunggu Ditugaskan / Pending */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menunggu / Draft</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-700">{stats.pending}</span>
              <span className="text-xs text-slate-500 font-medium">Antrean</span>
            </div>
            <p className="mt-3 text-xs text-slate-500 border-t border-slate-50 pt-2.5">
              Belum mulai shift jalan oleh driver
            </p>
          </div>

          {/* Card 4: Selesai Terkirim */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Terkirim / Selesai</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-700">{stats.completed}</span>
              <span className="text-xs text-slate-500 font-medium">Terkirim</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-2.5">
              <span>Gagal / Batal:</span>
              <span className="font-bold text-red-600">{stats.failed}</span>
            </div>
          </div>
        </div>

        {/* FILTER & SEARCH BAR */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari No SO/PO, DO Easy, Driver, Plat Mobil, atau Customer..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Buttons & Select */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Tipe: Delivery vs Pickup */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === 'ALL'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('Delivery')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    filterType === 'Delivery'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('Pickup')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    filterType === 'Pickup'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Pickup
                </button>
              </div>

              {/* Filter Status Dropdown */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Semua Status</option>
                <option value="draft">Draft</option>
                <option value="assigned">Ditugaskan</option>
                <option value="on_route">Di Perjalanan</option>
                <option value="arrived">Sampai Lokasi</option>
                <option value="delivered">Selesai</option>
                <option value="failed">Gagal</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('ALL');
                  setFilterStatus('ALL');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                title="Reset Filter"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* TABEL DATA TUGAS DRIVER (RESPONSIVE FIT FULL WIDTH - NO SCROLL X) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="w-full">
            <table className="w-full table-fixed text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-gray-100 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-2 w-[3%] text-center">No</th>
                  <th className="py-3 px-2 w-[7%]">Tipe</th>
                  <th className="py-3 px-2.5 w-[14%]">No. Dokumen / Ref</th>
                  <th className="py-3 px-2 w-[7%] text-center">Jumlah</th>
                  <th className="py-3 px-2.5 w-[14%]">Lokasi Awal</th>
                  <th className="py-3 px-2.5 w-[15%]">Lokasi Tujuan</th>
                  <th className="py-3 px-2 w-[16%]">Driver & Armada</th>
                  <th className="py-3 px-2 w-[8%] text-center">Tgl Tugas</th>
                  <th className="py-3 px-2 w-[9%] text-center">Status</th>
                  <th className="py-3 px-2 w-[7%] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-slate-700">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task, index) => (
                    <tr
                      key={task.id}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      {/* No */}
                      <td className="py-3 px-2 text-center font-bold text-slate-400 group-hover:text-blue-600">
                        {index + 1}
                      </td>

                      {/* Tipe: Delivery or Pickup */}
                      <td className="py-3 px-2">
                        {task.tipe === 'Delivery' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <ArrowUpRight className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>Kirim</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Ambil</span>
                          </span>
                        )}
                      </td>

                      {/* No. Dokumen / Ref (SO/PO + DO Easy) */}
                      <td className="py-3 px-2.5">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-blue-600 font-extrabold group-hover:underline text-xs break-all">
                              {task.nomor_ref}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono font-bold text-[9px] border border-slate-200 shrink-0">
                              {task.do_easy}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 break-words leading-tight mt-0.5">
                            {task.customer_vendor}
                          </span>
                        </div>
                      </td>

                      {/* Jumlah Barang */}
                      <td className="py-3 px-2 text-center">
                        <span className="font-extrabold text-slate-800 text-xs px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 inline-block">
                          {task.jumlah_barang}
                        </span>
                      </td>

                      {/* Lokasi Awal (Turun ke Bawah) */}
                      <td className="py-3 px-2.5">
                        <div className="flex items-start gap-1 text-slate-600 text-[11px] leading-tight break-words">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="break-words">{task.lokasi_awal}</span>
                        </div>
                      </td>

                      {/* Lokasi Tujuan (Turun ke Bawah) */}
                      <td className="py-3 px-2.5">
                        <div className="flex items-start gap-1 font-semibold text-slate-800 text-[11px] leading-tight break-words">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <span className="break-words">{task.lokasi_tujuan}</span>
                        </div>
                      </td>

                      {/* Driver & Armada Mobil */}
                      <td className="py-3 px-2">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1 font-bold text-slate-800 truncate text-[11px]">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{task.driver_name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5 truncate">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1 rounded border border-slate-200 text-[9px]">
                              {task.mobil_plat}
                            </span>
                            <span className="truncate">{task.mobil_tipe}</span>
                          </div>
                        </div>
                      </td>

                      {/* Tanggal Penugasan */}
                      <td className="py-3 px-2 text-center text-slate-600 font-medium text-[11px]">
                        {task.tanggal_penugasan}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2 text-center">
                        {getStatusBadge(task.status)}
                      </td>

                      {/* Aksi */}
                      <td
                        className="py-3 px-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedTask(task)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => alert(`Edit tugas: ${task.nomor_ref}`)}
                            className="p-1 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="w-8 h-8 text-slate-300" />
                        <span className="font-bold text-slate-600">Tidak ada tugas ditemukan</span>
                        <span className="text-xs">Coba sesuaikan kata kunci pencarian atau filter status</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER / PAGINATION */}
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-bold text-slate-800">{filteredTasks.length}</span> dari{' '}
              <span className="font-bold text-slate-800">{tasks.length}</span> total penugasan
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled
                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold shadow-sm text-xs"
              >
                1
              </button>
              <button
                type="button"
                disabled
                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL DETAIL TUGAS DRIVER */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-white overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                      selectedTask.tipe === 'Delivery'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {selectedTask.tipe === 'Delivery' ? (
                      <ArrowUpRight className="w-6 h-6" />
                    ) : (
                      <ArrowDownLeft className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                      {selectedTask.nomor_ref}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-700">
                        {selectedTask.tipe}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      DO Easy: <span className="font-mono font-bold text-slate-700">{selectedTask.do_easy}</span> • ID: {selectedTask.id}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs">
                {/* Status Bar */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-600">Status Tugas Saat Ini:</span>
                  <div>{getStatusBadge(selectedTask.status)}</div>
                </div>

                {/* Info Rute & Lokasi */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] text-blue-600">
                    Informasi Rute & Destinasi
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Lokasi Asal (Origin)</span>
                      <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        {selectedTask.lokasi_awal}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Lokasi Tujuan (Destination)</span>
                      <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                        {selectedTask.lokasi_tujuan}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Muatan & Barang */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] text-blue-600">
                    Detail Muatan & Barang
                  </h4>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Customer / Vendor:</span>
                      <span className="font-bold text-slate-900">{selectedTask.customer_vendor}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Total Kuantitas Muatan:</span>
                      <span className="font-extrabold text-blue-600 text-sm">{selectedTask.jumlah_barang}</span>
                    </div>
                    <div className="flex justify-between items-start pt-1">
                      <span className="text-slate-500">Deskripsi Barang:</span>
                      <span className="font-medium text-slate-800 text-right max-w-xs">{selectedTask.item_description}</span>
                    </div>
                  </div>
                </div>

                {/* Info Driver & Kendaraan */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] text-blue-600">
                    Armada & Driver yang Ditugaskan
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Driver</span>
                        <p className="font-bold text-slate-900 text-sm">{selectedTask.driver_name}</p>
                        <p className="text-[11px] text-slate-500">{selectedTask.driver_phone}</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Kendaraan Armada</span>
                        <p className="font-bold text-slate-900 text-sm">{selectedTask.mobil_plat}</p>
                        <p className="text-[11px] text-slate-500">{selectedTask.mobil_tipe}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-bold"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => alert(`Buka riwayat perjalanan untuk ${selectedTask.nomor_ref}`)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Lihat Riwayat & Attachment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Buat Tugas Driver Baru */}
        <FormTugasDriverModal
          isOpen={isModalCreateOpen}
          onClose={() => setIsModalCreateOpen(false)}
          onSubmit={handleCreateTask}
        />
      </div>
    </MainLayout>
  );
}
