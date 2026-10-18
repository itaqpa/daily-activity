import React, { useState, useMemo } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import {
  Send,
  Search,
  Filter,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Download,
  Building2,
  DollarSign,
  Package,
  Calendar,
  AlertCircle,
  Eye,
  Edit3
} from 'lucide-react';
import FormEkspedisiModal from './components/FormEkspedisiModal';

export default function EkspedisiPage() {
  const [expeditions, setExpeditions] = useState([
    {
      id: 'EXP-20261017-001',
      tracking_number: 'DKT-9920192',
      vendor_name: 'Dakota Cargo',
      service_type: 'Cargo Darat',
      origin_address: '',
      destination_address: 'Kawasan Industri Rungkut Blok D-12, Surabaya',
      receiver_pic_name: 'Bpk. Agus Santoso',
      receiver_pic_phone: '0812-9876-1234',
      item_description: 'Master Corrugated Box 40x30x25 (2 Pallet)',
      total_colli: 2,
      weight_kg: 450,
      cost_amount: 1450000,
      shipping_date: '2026-10-15',
      estimated_arrival_date: '2026-10-17',
      actual_arrival_date: '2026-10-17 10:15',
      status: 'delivered',
      notes: 'Diterima oleh security gudang dalam kondisi baik'
    },
    {
      id: 'EXP-20261017-002',
      tracking_number: 'JTR-88192039',
      vendor_name: 'JNE Trucking (JTR)',
      service_type: 'Cargo Darat',
      origin_address: 'Pabrik AQPA Gunung Putri, Bogor',
      destination_address: 'Semarang Barat, Jawa Tengah',
      receiver_pic_name: 'Ibu Ratna Dewi',
      receiver_pic_phone: '0857-3344-5566',
      item_description: 'Packaging Box Biskuit Kaleng (35 Karton)',
      total_colli: 35,
      weight_kg: 280,
      cost_amount: 850000,
      shipping_date: '2026-10-16',
      estimated_arrival_date: '2026-10-18',
      actual_arrival_date: null,
      status: 'on_delivery',
      notes: 'Driver kontak: Pak Bimo 0813-8899-7766'
    },
    {
      id: 'EXP-20261017-003',
      tracking_number: 'IND-449120',
      vendor_name: 'Indah Logistik Cargo',
      service_type: 'Sewa Truk / FTL',
      origin_address: '',
      destination_address: 'Kawasan Industri Candi, Semarang',
      receiver_pic_name: 'Bpk. Herman',
      receiver_pic_phone: '0821-5544-2211',
      item_description: 'Plat Besi Galvanis & Rangka Rak (1 Truk CDD)',
      total_colli: 1,
      weight_kg: 2200,
      cost_amount: 3200000,
      shipping_date: '2026-10-17',
      estimated_arrival_date: '2026-10-18',
      actual_arrival_date: null,
      status: 'on_delivery',
      notes: 'Pengiriman via armada sewaan CDD Long Box'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Filter Ekspedisi
  const filteredExpeditions = useMemo(() => {
    return expeditions.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.id.toLowerCase().includes(q) ||
        (item.tracking_number || '').toLowerCase().includes(q) ||
        item.vendor_name.toLowerCase().includes(q) ||
        item.origin_address.toLowerCase().includes(q) ||
        item.destination_address.toLowerCase().includes(q) ||
        item.item_description.toLowerCase().includes(q);

      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [expeditions, searchQuery, filterStatus]);

  // Total Biaya Pengiriman
  const totalCost = useMemo(() => {
    return expeditions.reduce((sum, item) => sum + (parseFloat(item.cost_amount) || 0), 0);
  }, [expeditions]);

  const handleSaveExpedition = (data) => {
    if (editingItem) {
      setExpeditions(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...data } : item));
    } else {
      setExpeditions(prev => [data, ...prev]);
    }
    setEditingItem(null);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'on_delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5 text-blue-500" /> Dalam Pengiriman
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terkirim (Sampai)
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Retur
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              <Send className="w-4 h-4" /> Pengiriman Vendor Ekspedisi (3PL / Cargo)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Ekspedisi & Cargo Luar
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Pengiriman penugasan barang SO/PO via bantuan vendor ekspedisi / sewa truk: Tracking Resi, Rute, Muatan Barang, Biaya Ongkir, dan Audit Aktual Sampai.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Input Ekspedisi Baru</span>
            </button>
          </div>
        </div>

        {/* RINGKASAN STATISTIK */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Total Pengiriman</span>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{expeditions.length}</p>
              <span className="text-[11px] font-semibold text-indigo-600">Cargo / Vendor Terdata</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Dalam Perjalanan</span>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {expeditions.filter(e => e.status === 'on_delivery').length}
              </p>
              <span className="text-[11px] font-semibold text-blue-600">Menunggu Tiba</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Sudah Sampai (POD)</span>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {expeditions.filter(e => e.status === 'delivered').length}
              </p>
              <span className="text-[11px] font-semibold text-emerald-600">Telah Diverifikasi</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Total Biaya Ongkir</span>
              <p className="text-xl font-black text-slate-900 mt-0.5 font-mono">
                Rp {totalCost.toLocaleString('id-ID')}
              </p>
              <span className="text-[11px] font-semibold text-slate-500">Akumulasi Ongkos Kirim</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* TABEL DATA EKSPEDISI */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Toolbar Search & Filter */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Vendor, Resi, Tujuan, Barang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 w-60 sm:w-80"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="on_delivery">Dalam Pengiriman</option>
                <option value="delivered">Terkirim (Sampai)</option>
                <option value="returned">Retur</option>
              </select>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-gray-100 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3.5 px-4">No. Pengiriman & Resi</th>
                  <th className="py-3.5 px-4">Vendor & Layanan</th>
                  <th className="py-3.5 px-4">Rute (Asal → Akhir)</th>
                  <th className="py-3.5 px-4">Barang Muatan</th>
                  <th className="py-3.5 px-4 text-right">Biaya (Rp)</th>
                  <th className="py-3.5 px-4 text-center">Tgl Kirim & ETA</th>
                  <th className="py-3.5 px-4 text-center">Aktual Sampai</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-slate-700">
                {filteredExpeditions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      Belum ada data pengiriman ekspedisi yang tercatat.
                    </td>
                  </tr>
                ) : (
                  filteredExpeditions.map((item) => (
                    <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-indigo-700 block text-xs">
                          {item.id}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          Resi: {item.tracking_number || '-'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 block">{item.vendor_name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{item.service_type}</span>
                      </td>

                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="space-y-0.5">
                          <p className="text-slate-500 line-clamp-1 text-[11px]">
                            Dari: <span className="text-slate-700">{item.origin_address}</span>
                          </p>
                          <p className="font-semibold text-slate-800 line-clamp-1 text-[11px]">
                            Ke: <strong className="text-indigo-900">{item.destination_address}</strong>
                          </p>
                          {item.receiver_pic_name && (
                            <p className="text-[10px] text-slate-400">
                              PIC: {item.receiver_pic_name} ({item.receiver_pic_phone || '-'})
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[200px]">
                        <span className="font-semibold text-slate-800 line-clamp-1 block">
                          {item.item_description}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.total_colli} Koli {item.weight_kg ? `• ${item.weight_kg} Kg` : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-indigo-700">
                        Rp {Number(item.cost_amount).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-medium text-slate-800 block text-[11px]">
                          Kirim: {item.shipping_date}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ETA: {item.estimated_arrival_date || '-'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {item.actual_arrival_date ? (
                          <div className="inline-block px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[10px]">
                            {item.actual_arrival_date}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Belum Tiba</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.status !== 'delivered' && (
                            <button
                              type="button"
                              onClick={() => {
                                const now = new Date();
                                const formattedNow = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                setExpeditions(prev => prev.map(exp => 
                                  exp.id === item.id 
                                    ? { ...exp, status: 'delivered', actual_arrival_date: formattedNow }
                                    : exp
                                ));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 font-bold text-xs transition-all inline-flex items-center gap-1 shadow-sm"
                              title="Tandai Sampai Sekarang"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Sampai</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-bold text-xs transition-all inline-flex items-center gap-1"
                            title="Edit Data Ekspedisi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL INPUT / EDIT EKSPEDISI */}
        <FormEkspedisiModal
          isOpen={isModalOpen}
          initialData={editingItem}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          onSubmit={handleSaveExpedition}
        />
      </div>
    </MainLayout>
  );
}
