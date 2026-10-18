import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronRight,
  Trash2,
  Paperclip,
  ExternalLink,
  LayoutGrid,
  List
} from 'lucide-react';
import FormTugasDriverModal from './components/FormTugasDriverModal';
import { logisticApi } from '../services/logisticApi';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function TugasDriverPage() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('logistic_driver_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(null);

  const mapApiTaskToUi = (t) => ({
    id: t.id,
    tipe: t.task_type === 'delivery' ? 'Delivery' : 'Pickup',
    nomor_ref: t.reference_number,
    customer_vendor: t.destination_name || 'Pelanggan / Vendor',
    do_easy: t.do_easy || '-',
    jumlah_barang: t.total_items_unit ? `${parseFloat(t.total_items_count) || 1} ${t.total_items_unit}` : `${parseFloat(t.total_items_count) || 1}`,
    total_price: parseFloat(t.total_price) || 0,
    items: t.items || [],
    item_description: t.item_description || (t.task_type === 'delivery' ? 'Pengiriman Barang' : 'Pengambilan Barang'),
    lokasi_awal: t.origin_name || 'Gudang AQPA',
    lokasi_tujuan: t.destination_name || 'Tujuan',
    driver_name: t.driver_name || 'Belum Ditugaskan',
    driver_phone: t.driver_phone || '-',
    mobil_plat: t.vehicle_plate || '-',
    mobil_tipe: t.vehicle_name || '-',
    tanggal_penugasan: t.dispatch_date ? String(t.dispatch_date).slice(0, 10) : '-',
    status: t.status || 'draft',
    is_out_of_city: Boolean(t.is_out_of_city),
    departure_notes: t.departure_notes || '',
    attachments: t.attachments || [],
    origin_name: t.origin_name || '',
    origin_pic_name: t.origin_pic_name || '',
    origin_pic_phone: t.origin_pic_phone || '',
    origin_address: t.origin_address || '',
    destination_name: t.destination_name || '',
    destination_pic_name: t.destination_pic_name || '',
    destination_pic_phone: t.destination_pic_phone || '',
    destination_address: t.destination_address || '',
    completed_odometer: t.completed_odometer,
    started_at: t.started_at,
    completed_at: t.completed_at
  });

  const fetchTasksFromApi = async () => {
    try {
      setIsLoading(true);
      const apiTasks = await logisticApi.getDriverTasks();
      if (Array.isArray(apiTasks) && apiTasks.length > 0) {
        const mapped = apiTasks.map(mapApiTaskToUi);
        setTasks(mapped);
      }
    } catch (err) {
      console.warn('Gagal memuat tugas dari API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksFromApi();
  }, []);

  const handleSyncDriverApps = async () => {
    try {
      setIsSyncing(true);
      setSyncSuccessMsg(null);
      const res = await logisticApi.syncDriverApps();
      setSyncSuccessMsg(res.message);
      await fetchTasksFromApi();
      setTimeout(() => {
        setSyncSuccessMsg(null);
      }, 7000);
    } catch (err) {
      alert('Gagal melakukan sinkronisasi dengan driver_apps: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('logistic_driver_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage:', e);
    }
  }, [tasks]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState('auto'); // 'auto' (cards on mobile, table on desktop), 'cards', 'table'
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [previewAttachment, setPreviewAttachment] = useState(null);

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalCreateOpen(true);
  };

  const handleDeleteTask = (taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    const refName = taskToDelete ? `[${taskToDelete.nomor_ref}]` : 'tugas ini';
    if (window.confirm(`Apakah Anda yakin ingin menghapus tugas ${refName}?`)) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    }
  };

  const handleSaveTask = (newTaskData) => {
    const totalQty = (newTaskData.items || []).reduce((sum, item) => sum + (parseFloat(item.quantity_order) || 0), 0);
    const totalPrice = (newTaskData.items || []).reduce((sum, item) => sum + ((parseFloat(item.quantity_order) || 0) * (parseFloat(item.unit_price) || 0)), 0);
    const mainUnit = (newTaskData.items?.[0]?.unit || '').trim();
    const mainItemName = (newTaskData.items || []).map(i => i.item_name).filter(Boolean).join(', ');

    if (editingTask) {
      setTasks(prev => prev.map(t => {
        if (t.id === editingTask.id) {
          const updated = {
            ...t,
            tipe: newTaskData.task_type === 'delivery' ? 'Delivery' : 'Pickup',
            nomor_ref: newTaskData.reference_number,
            customer_vendor: newTaskData.destination_name,
            do_easy: newTaskData.do_easy || '-',
            jumlah_barang: mainUnit ? `${totalQty} ${mainUnit}` : `${totalQty}`,
            total_price: totalPrice,
            items: newTaskData.items,
            item_description: mainItemName || 'Item Muatan',
            lokasi_awal: newTaskData.origin_name,
            lokasi_tujuan: newTaskData.destination_name,
            tanggal_penugasan: newTaskData.dispatch_date,
            is_out_of_city: newTaskData.is_out_of_city,
            departure_notes: newTaskData.departure_notes,
            attachments: newTaskData.attachments || [],
            origin_name: newTaskData.origin_name,
            origin_pic_name: newTaskData.origin_pic_name,
            origin_pic_phone: newTaskData.origin_pic_phone,
            origin_address: newTaskData.origin_address,
            destination_name: newTaskData.destination_name,
            destination_pic_name: newTaskData.destination_pic_name,
            destination_pic_phone: newTaskData.destination_pic_phone,
            destination_address: newTaskData.destination_address,
          };
          if (selectedTask?.id === t.id) {
            setSelectedTask(updated);
          }
          return updated;
        }
        return t;
      }));
      setEditingTask(null);
    } else {
      const created = {
        id: `TSK-2026-${String(tasks.length + 1).padStart(3, '0')}`,
        tipe: newTaskData.task_type === 'delivery' ? 'Delivery' : 'Pickup',
        nomor_ref: newTaskData.reference_number,
        customer_vendor: newTaskData.destination_name,
        do_easy: newTaskData.do_easy || '-',
        jumlah_barang: mainUnit ? `${totalQty} ${mainUnit}` : `${totalQty}`,
        total_price: totalPrice,
        items: newTaskData.items,
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
        departure_notes: newTaskData.departure_notes,
        attachments: newTaskData.attachments || [],
        origin_name: newTaskData.origin_name,
        origin_pic_name: newTaskData.origin_pic_name,
        origin_pic_phone: newTaskData.origin_pic_phone,
        origin_address: newTaskData.origin_address,
        destination_name: newTaskData.destination_name,
        destination_pic_name: newTaskData.destination_pic_name,
        destination_pic_phone: newTaskData.destination_pic_phone,
        destination_address: newTaskData.destination_address,
      };
      setTasks(prev => [created, ...prev]);
    }
  };

  const handleUpdateStatus = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    setSelectedTask(prev => prev && prev.id === taskId ? { ...prev, status: newStatus } : prev);
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
    const draftCount = tasks.filter((t) => t.status === 'draft').length;
    const assignedCount = tasks.filter((t) => t.status === 'assigned').length;
    const onRoute = tasks.filter((t) => t.status === 'on_route' || t.status === 'arrived').length;
    const deliveredCount = tasks.filter((t) => t.status === 'delivered').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const failed = tasks.filter((t) => t.status === 'failed' || t.status === 'cancelled').length;

    return { total, deliveryCount, pickupCount, draftCount, assignedCount, onRoute, deliveredCount, completed, failed };
  }, [tasks]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Draft
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Ditugaskan
          </span>
        );
      case 'on_route':
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Truck className="w-3.5 h-3.5 text-blue-500" /> On Route
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Package className="w-3.5 h-3.5 text-indigo-600" /> Delivered
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" /> {status === 'cancelled' ? 'Dibatalkan' : 'Gagal'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  return (
    <MainLayout>
      <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <Truck className="w-4 h-4" /> Logistik Operasional
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tugas Driver
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
              Pusat kendali dan monitoring penugasan armada driver (Delivery & Pickup) secara real-time
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSyncDriverApps}
              disabled={isSyncing}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50 active:scale-95"
              title="Sinkronisasi tugas, armada, dan driver dari database driver_apps"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sync Driver Apps'}</span>
            </button>
            <button
              type="button"
              onClick={() => alert('Fitur Export Excel sedang disiapkan')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-700 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setIsModalCreateOpen(true);
              }}
              className="flex-2 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all text-center"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Tugas Baru</span>
            </button>
          </div>
        </div>

        {/* NOTIFIKASI HASIL SINKRONISASI */}
        {syncSuccessMsg && (
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-semibold shadow-sm transition-all">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncSuccessMsg(null)}
              className="text-emerald-600 hover:text-emerald-900 font-bold ml-2 text-sm p-1 rounded-lg hover:bg-emerald-100/50"
            >
              ✕
            </button>
          </div>
        )}

        {/* KPI STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Total Tugas */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tugas</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total}</span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Tugas</span>
            </div>
            <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-500 border-t border-slate-50 pt-2 sm:pt-2.5 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-blue-700">
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {stats.deliveryCount} Kirim
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <ArrowDownLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {stats.pickupCount} Ambil
              </span>
            </div>
          </div>

          {/* Card 2: Draft & Ditugaskan */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Draft & Ditugaskan</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-700">{stats.draftCount + stats.assignedCount}</span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Tugas</span>
            </div>
            <div className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 border-t border-slate-50 pt-2 sm:pt-2.5 flex-wrap">
              <span className="font-semibold text-slate-700">{stats.draftCount} Draft</span>
              <span>•</span>
              <span className="font-semibold text-amber-700">{stats.assignedCount} Ditugaskan</span>
            </div>
          </div>

          {/* Card 3: On Route */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">On Route</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-700">{stats.onRoute}</span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Armada</span>
            </div>
            <p className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-slate-500 border-t border-slate-50 pt-2 sm:pt-2.5 truncate">
              Sedang dalam perjalanan armada
            </p>
          </div>

          {/* Card 4: Delivered & Completed */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Selesai</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{stats.deliveredCount + stats.completed}</span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Selesai</span>
            </div>
            <div className="mt-2 sm:mt-3 flex items-center justify-between text-[11px] sm:text-xs text-slate-500 border-t border-slate-50 pt-2 sm:pt-2.5">
              <span className="truncate">{stats.deliveredCount} Delivered • {stats.completed} Done</span>
              <span className="font-bold text-red-600 ml-1">{stats.failed} Batal</span>
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

            {/* Filter Buttons, Select, & View Mode */}
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
                  <ArrowUpRight className="w-3.5 h-3.5" /> Kirim
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
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Ambil
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
                <option value="on_route">On Route</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="failed">Gagal / Dibatalkan</option>
              </select>

              {/* View Mode Toggle (Kartu / Tabel) */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'cards' ? 'auto' : 'cards')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === 'cards'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tampilan Kartu (Aplikasi Mobile)"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'table' ? 'auto' : 'table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tampilan Tabel (Desktop)"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('ALL');
                  setFilterStatus('ALL');
                  setViewMode('auto');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                title="Reset Filter"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* TAMPILAN KARTU UNTUK APLIKASI MOBILE */}
        <div className={viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block space-y-3' : 'block md:hidden space-y-3'}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task, index) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer space-y-3"
              >
                {/* Header: No, Type, Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400">
                      #{index + 1}
                    </span>
                    {task.tipe === 'Delivery' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Kirim</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Ambil</span>
                      </span>
                    )}

                    {task.attachments && task.attachments.length > 0 && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200"
                        title={`${task.attachments.length} Dokumen terlampir`}
                      >
                        <Paperclip className="w-3 h-3" />
                        {task.attachments.length}
                      </span>
                    )}
                  </div>

                  <div>
                    {getStatusBadge(task.status)}
                  </div>
                </div>

                {/* Reference & Customer */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-blue-600 text-sm tracking-tight break-all">
                      {task.nomor_ref}
                    </h3>
                    <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                      {task.customer_vendor}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-bold text-[10px] border border-slate-200 block">
                      {task.do_easy}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                      {task.tanggal_penugasan}
                    </span>
                  </div>
                </div>

                {/* Route Journey (Origin -> Destination) */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-3 h-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Lokasi Asal (Pickup)</span>
                      <p className="font-semibold text-slate-700 text-xs leading-snug break-words">
                        {task.lokasi_awal}
                      </p>
                    </div>
                  </div>

                  <div className="ml-2.5 pl-2 border-l-2 border-dashed border-slate-300 -my-1 h-2" />

                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-3 h-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-red-400 uppercase block">Lokasi Tujuan (Destinasi)</span>
                      <p className="font-bold text-slate-900 text-xs leading-snug break-words">
                        {task.lokasi_tujuan}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Muatan & Driver Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Muatan Barang</span>
                    <p className="font-extrabold text-blue-700 text-xs mt-0.5">
                      {task.jumlah_barang}
                    </p>
                    {Boolean(task.total_price) && (
                      <p className="text-[10px] font-bold text-emerald-700 mt-0.5">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(task.total_price)}
                      </p>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Driver & Armada</span>
                    <p className="font-bold text-slate-800 text-xs truncate mt-0.5">
                      {task.driver_name}
                    </p>
                    <p className="text-[10px] font-mono font-semibold text-slate-500 truncate mt-0.5">
                      {task.mobil_plat !== '-' ? task.mobil_plat : 'Belum Ditugaskan'}
                    </p>
                  </div>
                </div>

                {/* Touch-Friendly Action Buttons */}
                <div
                  className="flex items-center gap-2 pt-2 border-t border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedTask(task)}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" /> Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditTask(task)}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-all"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">Tidak ada tugas ditemukan</p>
              <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci atau filter status</p>
            </div>
          )}

          {filteredTasks.length > 0 && (
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span>Menampilkan <strong>{filteredTasks.length}</strong> dari <strong>{tasks.length}</strong> tugas</span>
              <span className="font-bold text-blue-600">Mode Kartu</span>
            </div>
          )}
        </div>

        {/* TABEL DATA TUGAS DRIVER (RESPONSIVE FIT FULL WIDTH - NO SCROLL X) */}
        <div className={viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden' : 'hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'}>
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
                            {task.attachments && task.attachments.length > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200"
                                title={`${task.attachments.length} Dokumen terlampir`}
                              >
                                <Paperclip className="w-2.5 h-2.5" />
                                {task.attachments.length}
                              </span>
                            )}
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
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditTask(task)}
                            className="p-1 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Edit Masukan ke Form"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Hapus Tugas"
                          >
                            <Trash2 className="w-4 h-4" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                      selectedTask.tipe === 'Delivery'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {selectedTask.tipe === 'Delivery' ? (
                      <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2 truncate">
                      {selectedTask.nomor_ref}
                      <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-700 shrink-0">
                        {selectedTask.tipe}
                      </span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                      DO Easy: <span className="font-mono font-bold text-slate-700">{selectedTask.do_easy}</span> • ID: {selectedTask.id}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-xs">
                {/* Status Bar with Interactive Status Changer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Status Tugas Saat Ini
                    </span>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedTask.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Ubah Status:</span>
                    <select
                      value={selectedTask.status}
                      onChange={(e) => handleUpdateStatus(selectedTask.id, e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="draft">Draft</option>
                      <option value="assigned">Ditugaskan</option>
                      <option value="on_route">On Route</option>
                      <option value="delivered">Delivered</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                  </div>
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
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Customer / Vendor:</span>
                      <span className="font-bold text-slate-900">{selectedTask.customer_vendor}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Total Kuantitas Muatan:</span>
                      <span className="font-extrabold text-blue-600 text-sm">{selectedTask.jumlah_barang}</span>
                    </div>
                    {Boolean(selectedTask.total_price) && (
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-slate-500">Total Nilai Muatan:</span>
                        <span className="font-extrabold text-emerald-600 text-sm">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedTask.total_price)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-start pt-1">
                      <span className="text-slate-500">Deskripsi Barang:</span>
                      <span className="font-medium text-slate-800 text-right max-w-xs">{selectedTask.item_description}</span>
                    </div>

                    {selectedTask.items && selectedTask.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Rincian Item Muatan:
                        </span>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                              <tr>
                                <th className="p-2">Barang</th>
                                <th className="p-2 text-center">Qty</th>
                                <th className="p-2 text-right">Harga Satuan</th>
                                <th className="p-2 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedTask.items.map((it, idx) => {
                                const qty = parseFloat(it.quantity_order) || 0;
                                const price = parseFloat(it.unit_price) || 0;
                                return (
                                  <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="p-2">
                                      <p className="font-bold text-slate-900">{it.item_name}</p>
                                      {it.item_code && <p className="font-mono text-[10px] text-slate-400">{it.item_code}</p>}
                                    </td>
                                    <td className="p-2 text-center font-bold text-slate-700">
                                      {qty} {it.unit || 'Pcs'}
                                    </td>
                                    <td className="p-2 text-right text-slate-600">
                                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)}
                                    </td>
                                    <td className="p-2 text-right font-extrabold text-emerald-700">
                                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(qty * price)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
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

                {/* Catatan Instruksi Driver (jika ada) */}
                {selectedTask.departure_notes && (
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] text-blue-600">
                      Catatan / Instruksi Pengiriman
                    </h4>
                    <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 text-amber-900 font-medium text-xs leading-relaxed">
                      {selectedTask.departure_notes}
                    </div>
                  </div>
                )}

                {/* Dokumen Lampiran (Attachments) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] text-blue-600 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                      Dokumen Lampiran (Attachments)
                    </h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {(selectedTask.attachments || []).length} Berkas
                    </span>
                  </div>

                  {selectedTask.attachments && selectedTask.attachments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedTask.attachments.map((att) => {
                        const isImage = att.type?.startsWith('image/') || att.dataUrl?.startsWith('data:image/');
                        return (
                          <div
                            key={att.id}
                            className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all flex items-center justify-between gap-3 group"
                          >
                            <div 
                              className="flex items-center gap-3 min-w-0 cursor-pointer"
                              onClick={() => setPreviewAttachment(att)}
                            >
                              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {isImage ? (
                                  <img
                                    src={att.dataUrl}
                                    alt={att.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <FileText className="w-6 h-6 text-red-500" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors" title={att.name}>
                                  {att.name}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {formatFileSize(att.size)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewAttachment(att)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Lihat Pratinjau"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <a
                                href={att.dataUrl}
                                download={att.name}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Unduh Berkas"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center">
                      <Paperclip className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-slate-500">Belum ada dokumen lampiran yang diunggah</p>
                      <p className="text-[11px] text-slate-400">Edit tugas untuk menambahkan surat jalan, nota, atau foto bukti</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 sm:p-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="px-3.5 py-2.5 rounded-xl border border-red-200 text-red-600 bg-red-50/60 hover:bg-red-100 font-bold flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Tugas
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-bold text-xs text-center"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const taskToEdit = selectedTask;
                      setSelectedTask(null);
                      handleEditTask(taskToEdit);
                    }}
                    className="flex-2 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all text-xs text-center"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Masukan ke Form
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Buat / Edit Tugas Driver */}
        <FormTugasDriverModal
          isOpen={isModalCreateOpen}
          initialData={editingTask}
          onClose={() => {
            setIsModalCreateOpen(false);
            setEditingTask(null);
          }}
          onSubmit={handleSaveTask}
        />

        {/* PREVIEW ATTACHMENT MODAL / LIGHTBOX */}
        {previewAttachment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setPreviewAttachment(null)}
          >
            <div
              className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate" title={previewAttachment.name}>
                      {previewAttachment.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {formatFileSize(previewAttachment.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={previewAttachment.dataUrl}
                    download={previewAttachment.name}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewAttachment(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 overflow-y-auto flex items-center justify-center bg-slate-950/5 min-h-[300px]">
                {previewAttachment.type?.startsWith('image/') || previewAttachment.dataUrl?.startsWith('data:image/') ? (
                  <img
                    src={previewAttachment.dataUrl}
                    alt={previewAttachment.name}
                    className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-md"
                  />
                ) : (
                  <iframe
                    src={previewAttachment.dataUrl}
                    title={previewAttachment.name}
                    className="w-full h-[65vh] rounded-xl border border-slate-200 bg-white"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
