import React, { useState, useMemo } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import {
  UserCheck,
  Search,
  Filter,
  Truck,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Package,
  User,
  Plus,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Percent,
  CheckCircle,
  AlertCircle,
  Calendar,
  Phone
} from 'lucide-react';
import ModalPlottingDriver from './components/ModalPlottingDriver';

export default function PenugasanDriverPage() {
  // Pool DO yang belum di-plot
  const [unassignedPoolTasks, setUnassignedPoolTasks] = useState([
    {
      id: 'T-101',
      ref: 'SO-2026-0901',
      type: 'delivery',
      customer: 'PT Unilever Indonesia Tbk',
      qty: '80 Karton',
      item_name: 'Corrugated Box Export 40x30x25',
      origin: 'Gudang AQPA Cikarang',
      dest: 'Rungkut Industri Surabaya',
      out_of_city: true,
      created_at: '2026-10-17 08:30'
    },
    {
      id: 'T-102',
      ref: 'SO-2026-0904',
      type: 'delivery',
      customer: 'PT Mayora Indah Tbk',
      qty: '150 Box',
      item_name: 'Folding Box Packaging Biskuit',
      origin: 'Gudang AQPA Cikarang',
      dest: 'Daan Mogot KM 19 Jakarta Barat',
      out_of_city: false,
      created_at: '2026-10-17 09:15'
    },
    {
      id: 'T-103',
      ref: 'PO-2026-0420',
      type: 'pickup',
      customer: 'PT Baja Mandiri Perkasa',
      qty: '30 Batang',
      item_name: 'Pipa Seamless Baja 2 Inch',
      origin: 'Cilegon Banten',
      dest: 'Pabrik AQPA Gunung Putri',
      out_of_city: true,
      created_at: '2026-10-17 09:40'
    },
    {
      id: 'T-104',
      ref: 'SO-2026-0912',
      type: 'delivery',
      customer: 'PT Astra Otoparts Tbk',
      qty: '200 Pcs',
      item_name: 'Wooden Pallet Heavy Duty',
      origin: 'Gudang AQPA Cikarang',
      dest: 'Kawasan KIIC Karawang Barat',
      out_of_city: false,
      created_at: '2026-10-17 10:00'
    },
    {
      id: 'T-105',
      ref: 'SO-2026-0918',
      type: 'delivery',
      customer: 'PT Santos Jaya Abadi (Kapal Api)',
      qty: '110 Karton',
      item_name: 'Outer Carton Box Kopi Sachet',
      origin: 'Gudang AQPA Cikarang',
      dest: 'Karawang Timur Plant',
      out_of_city: false,
      created_at: '2026-10-17 10:20'
    }
  ]);

  // Data Manifest Penugasan
  const [manifestList, setManifestList] = useState([
    {
      id: 'MNF-20261017-001',
      driver_name: 'Ahmad Fauzi',
      driver_phone: '0857-9876-5432',
      co_driver_name: 'Dedi Kurniawan',
      vehicle_plate: 'B 9102 SQA',
      vehicle_name: 'CDD Long Box 6 Roda',
      dispatch_date: '2026-10-17',
      end_date: null,
      is_out_of_city: false,
      status: 'on_route',
      notes: 'Berangkat pagi, utamakan drop point Astra terlebih dahulu',
      created_at: '2026-10-17 07:45',
      tasks: [
        {
          id: 'TSK-M01',
          ref: 'SO-2026-0880',
          type: 'delivery',
          customer: 'PT Astra Daihatsu Motor',
          dest: 'Sunter Plant Jakarta Utara',
          qty: '140 Box',
          status: 'arrived'
        },
        {
          id: 'TSK-M02',
          ref: 'SO-2026-0884',
          type: 'delivery',
          customer: 'PT Denso Indonesia',
          dest: 'Kawasan MM2100 Cikarang Barat',
          qty: '80 Karton',
          status: 'on_route'
        }
      ]
    },
    {
      id: 'MNF-20261016-003',
      driver_name: 'Budi Santoso',
      driver_phone: '0812-3456-7890',
      co_driver_name: null,
      vehicle_plate: 'B 9481 KXZ',
      vehicle_name: 'Engkel Box 4 Roda',
      dispatch_date: '2026-10-16',
      end_date: '2026-10-18',
      is_out_of_city: true,
      status: 'on_route',
      notes: 'Rute Jawa Tengah & Jawa Timur (Multi-day)',
      created_at: '2026-10-16 06:30',
      tasks: [
        {
          id: 'TSK-M03',
          ref: 'SO-2026-0870',
          type: 'delivery',
          customer: 'PT Djarum Kudus',
          dest: 'Kudus Jawa Tengah',
          qty: '300 Box',
          status: 'delivered'
        },
        {
          id: 'TSK-M04',
          ref: 'SO-2026-0872',
          type: 'delivery',
          customer: 'PT Gudang Garam Tbk',
          dest: 'Kediri Jawa Timur',
          qty: '220 Box',
          status: 'on_route'
        }
      ]
    },
    {
      id: 'MNF-20261015-002',
      driver_name: 'Joko Susilo',
      driver_phone: '0813-1122-3344',
      co_driver_name: null,
      vehicle_plate: 'B 9301 TYA',
      vehicle_name: 'Fuso Box Tronton',
      dispatch_date: '2026-10-15',
      end_date: null,
      is_out_of_city: false,
      status: 'completed',
      notes: 'Pengiriman area Cikarang dan Cibitung tuntas',
      created_at: '2026-10-15 08:00',
      tasks: [
        {
          id: 'TSK-M05',
          ref: 'SO-2026-0855',
          type: 'delivery',
          customer: 'PT Epson Industry',
          dest: 'Kawasan EJIP Cikarang Selatan',
          qty: '250 Box',
          status: 'delivered'
        }
      ]
    }
  ]);

  // Master Driver (Sesuai 11 Personil Driver Master & Akun Mobile)
  const [drivers] = useState([
    { id: 'DRV-001', name: 'ABDUL KARIM', phone: '0812-9911-2201', status: 'Available', role: 'DRIVER', vehicle: 'B 2257 KIO' },
    { id: 'DRV-002', name: 'ALDI YUSUF', phone: '0857-8822-3302', status: 'Available', role: 'DRIVER', vehicle: 'B 9819 KRW' },
    { id: 'DRV-003', name: 'ARIE SANJAYA', phone: '0813-7733-4403', status: 'Available', role: 'DRIVER', vehicle: 'B 9726 KCI' },
    { id: 'DRV-004', name: 'HAMDANI NURHIDAYAT', phone: '0821-6644-5504', status: 'On Shift', role: 'DRIVER', vehicle: 'B 9074 KIU' },
    { id: 'DRV-005', name: 'WAHYU ADI', phone: '0812-5566-7705', status: 'Available', role: 'DRIVER', vehicle: 'B 9976 KCI' },
    { id: 'DRV-006', name: 'WAHYU PRASETYO', phone: '0856-4477-8806', status: 'Available', role: 'DRIVER', vehicle: 'B 2235 KYB' },
    { id: 'DRV-007', name: 'SISWO RIMBAWAN', phone: '0813-3388-9907', status: 'Available', role: 'DRIVER', vehicle: 'B 1442 KYI' },
    { id: 'DRV-008', name: 'SUTAR', phone: '0822-2299-0008', status: 'Available', role: 'DRIVER', vehicle: 'B 9168 KAV' },
    { id: 'DRV-009', name: 'BIVANT HARDI CHOARAHMAN', phone: '0857-1100-2209', status: 'Available', role: 'DRIVER', vehicle: 'B 9412 KUF' },
    { id: 'DRV-010', name: 'RONI IRAWAN', phone: '0812-4411-3310', status: 'Available', role: 'DRIVER', vehicle: 'B 2969 KYC' },
    { id: 'DRV-011', name: 'DEA FATHUROHMAN', phone: '0878-5522-4411', status: 'Available', role: 'OPSIONAL DRIVER', vehicle: 'B 5563 KIU' }
  ]);

  // Master Kendaraan Armada (Sesuai Data Master 14 Aset Kendaraan)
  const [vehicles] = useState([
    { id: 'v-1', asset_number: 'A/1/0001', plate_number: 'B 5563 KIU', name: 'VARIO 125 HITAM MERAH', location: 'Bekasi', division: 'LOG AQPA', fuel_ratio: 40.0, rate: 100000 },
    { id: 'v-2', asset_number: 'A/2/0001', plate_number: 'B 2235 KYB', name: 'GRANDMAX HITAM', location: 'Bekasi', division: 'HRGA', fuel_ratio: 12.0, rate: 250000 },
    { id: 'v-3', asset_number: 'A/2/0002', plate_number: 'B 9819 KRW', name: 'L300', location: 'Bekasi', division: 'LOG AQPA', fuel_ratio: 10.0, rate: 250000 },
    { id: 'v-4', asset_number: 'A/2/0007', plate_number: 'B 2257 KIO', name: 'GRANDMAX PUTIH', location: 'Bekasi', division: 'LOG AQPA', fuel_ratio: 11.0, rate: 250000 },
    { id: 'v-5', asset_number: 'A/2/0008', plate_number: 'B 9074 KIU', name: 'TRUCK KUNING ENGKEL', location: 'Bekasi', division: 'LOG AQPA', fuel_ratio: 6.5, rate: 250000 },
    { id: 'v-6', asset_number: 'A/2/0009', plate_number: 'B 9726 KCI', name: 'BLIND VAN', location: 'Bekasi', division: 'LOG AQPA', fuel_ratio: 12.0, rate: 250000 },
    { id: 'v-7', asset_number: 'A/2/0010', plate_number: 'B 9976 KCI', name: 'BLIND VAN PUTIH', location: 'Bekasi', division: 'LOG AQPA', fuel_ratio: 12.0, rate: 250000 },
    { id: 'v-8', asset_number: 'G/12/0002', plate_number: 'B 2213 KKU', name: 'WULING MERAH', location: 'Bekasi', division: 'HRGA', fuel_ratio: 10.0, rate: 250000 },
    { id: 'v-9', asset_number: 'G/2/0001', plate_number: 'B 1442 KYI', name: 'GRANDMAX PUTIH', location: 'Bekasi', division: 'LOG GTE', fuel_ratio: 12.0, rate: 250000 },
    { id: 'v-10', asset_number: 'G/2/0003', plate_number: 'B 9168 KAV', name: 'CARRY HITAM', location: 'Bekasi', division: 'LOG GTE', fuel_ratio: 12.0, rate: 250000 },
    { id: 'v-11', asset_number: 'G/2/0004', plate_number: 'B 2415 KIG', name: 'GRANDMAX SILVER', location: 'Bekasi', division: 'HRGA', fuel_ratio: 12.0, rate: 250000 },
    { id: 'v-12', asset_number: 'A/1/0003', plate_number: 'B 5359 KJB', name: 'VARIO 125 PUTIH', location: 'Surabaya', division: 'LOG AQPA SBY', fuel_ratio: 40.0, rate: 100000 },
    { id: 'v-13', asset_number: 'A/2/0003', plate_number: 'B 9412 KUF', name: 'CARRY PUTIH', location: 'Surabaya', division: 'LOG AQPA SBY', fuel_ratio: 12.0, rate: 250000 },
    { id: 'v-14', asset_number: 'A/2/0005', plate_number: 'B 2969 KYC', name: 'GRANDMAX SILVER', location: 'Surabaya', division: 'LOG AQPA SBY', fuel_ratio: 12.0, rate: 250000 }
  ]);

  // State Modal, Filter & Accordion
  const [isModalPlotOpen, setIsModalPlotOpen] = useState(false);
  const [searchManifest, setSearchManifest] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedRows, setExpandedRows] = useState({ 'MNF-20261017-001': true }); // Default baris pertama terbuka

  // Toggle Accordion Baris
  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAllRows = () => {
    const allExpanded = filteredManifests.every(m => expandedRows[m.id]);
    if (allExpanded) {
      setExpandedRows({});
    } else {
      const nextState = {};
      filteredManifests.forEach(m => { nextState[m.id] = true; });
      setExpandedRows(nextState);
    }
  };

  // Filter Manifest
  const filteredManifests = useMemo(() => {
    return manifestList.filter(m => {
      const q = searchManifest.toLowerCase();
      const matchSearch =
        m.id.toLowerCase().includes(q) ||
        m.driver_name.toLowerCase().includes(q) ||
        m.vehicle_plate.toLowerCase().includes(q) ||
        m.tasks.some(t => t.ref.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q));

      const matchStatus = filterStatus === 'ALL' || m.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [manifestList, searchManifest, filterStatus]);

  // KALKULASI KPI LOGISTIK
  const kpiData = useMemo(() => {
    const totalManifest = manifestList.length;
    const allTasks = manifestList.flatMap(m => m.tasks);
    const totalDO = allTasks.length;
    const deliveredDO = allTasks.filter(t => t.status === 'delivered').length;
    
    // KPI Fulfillment Rate
    const fulfillmentRate = totalDO > 0 ? Math.round((deliveredDO / totalDO) * 100) : 0;

    // Armada Beroperasi (On Route)
    const onRouteArmada = manifestList.filter(m => m.status === 'on_route').length;
    const fleetUtilization = vehicles.length > 0 ? Math.round((onRouteArmada / vehicles.length) * 100) : 0;

    // Driver Terplot vs Driver Standby
    const availableDrivers = drivers.filter(d => d.status === 'Available').length;

    return {
      totalManifest,
      totalDO,
      deliveredDO,
      fulfillmentRate,
      onRouteArmada,
      fleetUtilization,
      availableDrivers,
      poolCount: unassignedPoolTasks.length
    };
  }, [manifestList, vehicles, drivers, unassignedPoolTasks]);

  // Handler Submit Penugasan Baru
  const handleCreateManifest = (payload) => {
    const selectedDriver = drivers.find(d => d.id === payload.driver_id);
    const selectedCoDriver = drivers.find(d => d.id === payload.co_driver_id);
    const selectedVeh = vehicles.find(v => v.id === payload.vehicle_id);

    const newManifest = {
      id: payload.manifest_number,
      driver_name: selectedDriver?.name || 'Driver',
      driver_phone: selectedDriver?.phone || '-',
      co_driver_name: selectedCoDriver?.name || null,
      vehicle_plate: selectedVeh?.plate_number || '-',
      vehicle_name: selectedVeh?.name || '-',
      dispatch_date: payload.dispatch_date,
      end_date: payload.end_date || null,
      is_out_of_city: payload.is_out_of_city,
      status: 'assigned',
      notes: payload.notes || '-',
      created_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      tasks: payload.selected_tasks.map(t => ({
        id: `TSK-${t.id}`,
        ref: t.ref || t.nomor_ref,
        type: t.type || 'delivery',
        customer: t.customer || t.customer_vendor,
        dest: t.dest || t.lokasi_tujuan,
        qty: t.qty || t.jumlah_barang,
        status: 'assigned'
      }))
    };

    setManifestList(prev => [newManifest, ...prev]);
    setExpandedRows(prev => ({ ...prev, [newManifest.id]: true }));
    setUnassignedPoolTasks(prev => prev.filter(t => !payload.task_ids.includes(t.id)));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" /> Ditugaskan
          </span>
        );
      case 'on_route':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3 h-3 text-blue-500" /> Di Perjalanan
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-slate-800">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <UserCheck className="w-4 h-4" /> Logistik Operasional & Dispatching
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Penugasan Driver & Manifest DO
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Monitoring perjalanan armada, jadwal pengantaran DO, dan performa KPI logistik harian
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalPlotOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Plotting Penugasan Baru</span>
              {kpiData.poolCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400 text-slate-950">
                  {kpiData.poolCount} Pool DO
                </span>
              )}
            </button>
          </div>
        </div>

        {/* KPI MONITORING CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: OTIF / Delivery Fulfillment Rate */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">DO Terkirim (Fulfillment)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 font-mono">{kpiData.deliveredDO}</span>
                <span className="text-xs font-bold text-slate-400 ml-1">/ {kpiData.totalDO} DO</span>
              </div>
              <span className="text-sm font-black text-emerald-600 font-mono">
                {kpiData.fulfillmentRate}%
              </span>
            </div>
            {/* Progress Bar KPI */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${kpiData.fulfillmentRate}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-slate-400 block">Surat jalan yang telah sampai di customer</span>
          </div>

          {/* KPI 2: Fleet Utilization */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Utilitas Armada Mobil</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 font-mono">{kpiData.onRouteArmada}</span>
                <span className="text-xs font-bold text-slate-400 ml-1">/ {vehicles.length} Unit</span>
              </div>
              <span className="text-sm font-black text-blue-600 font-mono">
                {kpiData.fleetUtilization}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${kpiData.fleetUtilization}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-slate-400 block">Armada yang aktif berjalan di lapangan</span>
          </div>

          {/* KPI 3: Kesiapan Driver */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Driver Standby</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 font-mono">{kpiData.availableDrivers}</span>
                <span className="text-xs font-bold text-slate-400 ml-1">/ {drivers.length} Sopir</span>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Siap Rute Baru
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${(kpiData.availableDrivers / drivers.length) * 100}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-slate-400 block">Sopir tersedia untuk penugasan berikutnya</span>
          </div>

          {/* KPI 4: Antrean Pool DO */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Pool DO Siap Kirim</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 font-mono">{kpiData.poolCount}</span>
                <span className="text-xs font-bold text-slate-400 ml-1">Dokumen</span>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Menunggu Plot
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${Math.min(kpiData.poolCount * 20, 100)}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-slate-400 block">Surat jalan belum memiliki supir & armada</span>
          </div>
        </div>

        {/* TABEL MANIFEST DENGAN ACCORDION EXPAND / HIDE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar Search & Status Filter */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari No Manifest, Sopir, Plat, Customer..."
                  value={searchManifest}
                  onChange={(e) => setSearchManifest(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-60 sm:w-72"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="assigned">Ditugaskan</option>
                <option value="on_route">Di Perjalanan</option>
                <option value="completed">Selesai</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAllRows}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 transition-colors"
              >
                {filteredManifests.every(m => expandedRows[m.id]) ? 'Tutup Semua Rincian' : 'Buka Semua Rincian'}
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
                  <th className="py-3 px-3 w-10 text-center"></th>
                  <th className="py-3 px-3">No. Manifest</th>
                  <th className="py-3 px-4">Driver & Kernet</th>
                  <th className="py-3 px-4">Kendaraan</th>
                  <th className="py-3 px-4">Jadwal Keberangkatan</th>
                  <th className="py-3 px-3 text-center">Jml DO</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Catatan Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredManifests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada manifest penugasan yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredManifests.map((mnf) => {
                    const isExpanded = !!expandedRows[mnf.id];
                    return (
                      <React.Fragment key={mnf.id}>
                        {/* BARIS UTAMA MANIFEST */}
                        <tr
                          onClick={() => toggleRow(mnf.id)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded ? 'bg-blue-50/40 font-semibold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-3 text-center text-slate-400">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-blue-600 inline" />
                            ) : (
                              <ChevronRight className="w-4 h-4 inline" />
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-mono font-black text-blue-700 block text-xs">
                              {mnf.id}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {mnf.created_at}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 block">{mnf.driver_name}</span>
                              {mnf.co_driver_name && (
                                <span className="text-[10px] text-slate-500 font-normal bg-slate-100 px-1.5 py-0.5 rounded">
                                  + {mnf.co_driver_name}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">{mnf.driver_phone}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900 block">{mnf.vehicle_plate}</span>
                            <span className="text-[11px] text-slate-500">{mnf.vehicle_name}</span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono font-semibold text-slate-800">
                                {mnf.dispatch_date} {mnf.end_date ? `s/d ${mnf.end_date}` : ''}
                              </span>
                            </div>
                            {mnf.is_out_of_city && (
                              <span className="inline-block mt-0.5 text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                Luar Kota
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 font-mono">
                              {mnf.tasks.length} DO
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {getStatusBadge(mnf.status)}
                          </td>

                          <td className="py-3 px-4 max-w-xs text-slate-600 truncate text-[11px]">
                            {mnf.notes || '-'}
                          </td>
                        </tr>

                        {/* ACCORDION EXPAND: RINCIAN LIST DO DI DALAM MANIFEST */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={8} className="p-0">
                              <div className="px-6 py-4 border-y border-slate-200 bg-gradient-to-b from-blue-50/20 to-slate-50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                                    Daftar Pengantaran / Penjemputan dalam Manifest ({mnf.id})
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                                    Selesai: {mnf.tasks.filter(t => t.status === 'delivered').length} dari {mnf.tasks.length} DO
                                  </span>
                                </div>

                                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                                        <th className="py-2 px-3 w-8 text-center">No</th>
                                        <th className="py-2 px-3">Tipe</th>
                                        <th className="py-2 px-3">No. Referensi (SO/PO)</th>
                                        <th className="py-2 px-4">Customer / Vendor</th>
                                        <th className="py-2 px-4">Tujuan Pengiriman</th>
                                        <th className="py-2 px-3 text-right">Kuantitas</th>
                                        <th className="py-2 px-3 text-center">Status Kirim</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {mnf.tasks.map((task, idx) => (
                                        <tr key={task.id} className="hover:bg-slate-50">
                                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-400">
                                            {idx + 1}
                                          </td>
                                          <td className="py-2 px-3">
                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                                              task.type === 'delivery' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                                            }`}>
                                              {task.type.toUpperCase()}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 font-mono font-bold text-blue-700">
                                            {task.ref}
                                          </td>
                                          <td className="py-2 px-4 font-bold text-slate-900">
                                            {task.customer}
                                          </td>
                                          <td className="py-2 px-4 text-slate-600 text-[11px]">
                                            {task.dest}
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                                            {task.qty}
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                              task.status === 'delivered' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                : task.status === 'arrived' 
                                                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                              {task.status === 'delivered' ? '✓ Terkirim' : task.status === 'arrived' ? 'Sampai' : 'Dalam Rute'}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL PLOTTING PENUGASAN DRIVER */}
        <ModalPlottingDriver
          isOpen={isModalPlotOpen}
          onClose={() => setIsModalPlotOpen(false)}
          poolTasks={unassignedPoolTasks}
          drivers={drivers}
          vehicles={vehicles}
          onSubmit={handleCreateManifest}
        />
      </div>
    </MainLayout>
  );
}
