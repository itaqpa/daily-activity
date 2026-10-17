import React, { useState, useMemo } from 'react';
import MainLayout from '../../../components/layouts/MainLayout';
import { 
  Car, 
  Search, 
  Plus, 
  Wrench, 
  Shield, 
  Calendar,
  Fuel,
  DollarSign,
  MapPin,
  Building,
  CheckCircle2,
  Clock,
  Filter,
  Edit2,
  Trash2
} from 'lucide-react';
import FormKendaraanModal from './components/FormKendaraanModal';

export default function MasterMobilPage() {
  const [vehicles, setVehicles] = useState([
    {
      no: 1,
      no_aset: 'A/1/0001',
      nopolisi: 'B 5563 KIU',
      kendaraan: 'VARIO 125 HITAM MERAH',
      tipe: 'Motorcycle',
      lokasi: 'Bekasi',
      operasional: 'LOG AQPA',
      km_per_liter: 40.0,
      rate_per_hari: 100000,
      status: 'Siap Pakai'
    },
    {
      no: 2,
      no_aset: 'A/2/0001',
      nopolisi: 'B 2235 KYB',
      kendaraan: 'GRANDMAX HITAM',
      tipe: 'Pickup',
      lokasi: 'Bekasi',
      operasional: 'HRGA',
      km_per_liter: 12.0,
      rate_per_hari: 250000,
      status: 'Siap Pakai'
    },
    {
      no: 3,
      no_aset: 'A/2/0002',
      nopolisi: 'B 9819 KRW',
      kendaraan: 'L300',
      tipe: 'Pickup Box',
      lokasi: 'Bekasi',
      operasional: 'LOG AQPA',
      km_per_liter: 10.0,
      rate_per_hari: 250000,
      status: 'Siap Pakai'
    },
    {
      no: 4,
      no_aset: 'A/2/0007',
      nopolisi: 'B 2257 KIO',
      kendaraan: 'GRANDMAX PUTIH',
      tipe: 'Pickup',
      lokasi: 'Bekasi',
      operasional: 'LOG AQPA',
      km_per_liter: 11.0,
      rate_per_hari: 250000,
      status: 'Siap Pakai'
    },
    {
      no: 5,
      no_aset: 'A/2/0008',
      nopolisi: 'B 9074 KIU',
      kendaraan: 'TRUCK KUNING ENGKEL',
      tipe: 'Truck Engkel 4 Roda',
      lokasi: 'Bekasi',
      operasional: 'LOG AQPA',
      km_per_liter: 6.5,
      rate_per_hari: 250000,
      status: 'Siap Pakai'
    },
    {
      no: 6,
      no_aset: 'A/2/0009',
      nopolisi: 'B 9726 KCI',
      kendaraan: 'BLIND VAN',
      tipe: 'Blind Van',
      lokasi: 'Bekasi',
      operasional: 'LOG AQPA',
      km_per_liter: 12.0,
      rate_per_hari: 250000,
      status: 'Siap Pakai'
    },
    {
      no: 7,
      no_aset: 'A/2/0010',
      nopolisi: 'B 9976 KCI',
      kendaraan: 'BLIND VAN PUTIH',
      tipe: 'Blind Van',
      lokasi: 'Bekasi',
      operasional: 'LOG AQPA',
      km_per_liter: 12.0,
      rate_per_hari: 250000,
      status: 'Siap Pakai'
    },
    {
      no: 8,
      no_aset: 'G/12/0002',
      nopolisi: 'B 2213 KKU',
      kendaraan: 'WULING MERAH',
      tipe: 'Passenger Car',
      lokasi: 'Bekasi',
      operasional: 'HRGA',
      km_per_liter: 10.0,
      rate_per_hari: 250000,
      status: 'Siap Pakai'
    },
    {
      no: 9,
      no_aset: 'G/2/0001',
      nopolisi: 'B 1442 KYI',
      kendaraan: 'GRANDMAX PUTIH',
      tipe: 'Pickup',
      lokasi: 'Bekasi',
      operasional: 'LOG GTE',
      km_per_liter: 12.0,
      rate_per_hari: 250000,
      status: 'Siap Pakai'
    },
    {
      no: 10,
      no_aset: 'G/2/0003',
      nopolisi: 'B 9168 KAV',
      kendaraan: 'CARRY HITAM',
      tipe: 'Pickup',
      lokasi: 'Bekasi',
      operasional: 'LOG GTE',
      km_per_liter: 12.0,
      rate_per_hari: 250000,
      status: 'Siap Pakai'
    },
    {
      no: 11,
      no_aset: 'G/2/0004',
      nopolisi: 'B 2415 KIG',
      kendaraan: 'GRANDMAX SILVER',
      tipe: 'Pickup',
      lokasi: 'Bekasi',
      operasional: 'HRGA',
      km_per_liter: 12.0,
      rate_per_hari: 250000,
      status: 'Siap Pakai'
    },
    {
      no: 12,
      no_aset: 'A/1/0003',
      nopolisi: 'B 5359 KJB',
      kendaraan: 'VARIO 125 PUTIH',
      tipe: 'Motorcycle',
      lokasi: 'Surabaya',
      operasional: 'LOG AQPA SBY',
      km_per_liter: 40.0,
      rate_per_hari: 100000,
      status: 'Siap Pakai'
    },
    {
      no: 13,
      no_aset: 'A/2/0003',
      nopolisi: 'B 9412 KUF',
      kendaraan: 'CARRY PUTIH',
      tipe: 'Pickup',
      lokasi: 'Surabaya',
      operasional: 'LOG AQPA SBY',
      km_per_liter: 12.0,
      rate_per_hari: 250000,
      status: 'Siap Pakai'
    },
    {
      no: 14,
      no_aset: 'A/2/0005',
      nopolisi: 'B 2969 KYC',
      kendaraan: 'GRANDMAX SILVER',
      tipe: 'Pickup',
      lokasi: 'Surabaya',
      operasional: 'LOG AQPA SBY',
      km_per_liter: 12.0,
      rate_per_hari: 250000,
      status: 'Siap Pakai'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('ALL');
  const [filterOperasional, setFilterOperasional] = useState('ALL');

  // Modal State (Create, Edit, Delete)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  // Filter Kendaraan
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        v.no_aset.toLowerCase().includes(q) ||
        v.nopolisi.toLowerCase().includes(q) ||
        v.kendaraan.toLowerCase().includes(q) ||
        v.operasional.toLowerCase().includes(q) ||
        v.lokasi.toLowerCase().includes(q);

      const matchLokasi = filterLokasi === 'ALL' || v.lokasi === filterLokasi;
      const matchOperasional = filterOperasional === 'ALL' || v.operasional === filterOperasional;

      return matchSearch && matchLokasi && matchOperasional;
    });
  }, [vehicles, searchQuery, filterLokasi, filterOperasional]);

  // Handler Buka Modal Tambah
  const handleOpenCreate = () => {
    setSelectedVehicle(null);
    setIsDeleteMode(false);
    setIsModalOpen(true);
  };

  // Handler Buka Modal Edit
  const handleOpenEdit = (item) => {
    setSelectedVehicle(item);
    setIsDeleteMode(false);
    setIsModalOpen(true);
  };

  // Handler Buka Modal Delete
  const handleOpenDelete = (item) => {
    setSelectedVehicle(item);
    setIsDeleteMode(true);
    setIsModalOpen(true);
  };

  // Simpan Data (Create / Update)
  const handleSaveVehicle = (data) => {
    if (selectedVehicle) {
      // Mode Edit
      setVehicles(prev =>
        prev.map(v =>
          v.no_aset === selectedVehicle.no_aset ? { ...v, ...data } : v
        )
      );
    } else {
      // Mode Create
      const newVehicle = {
        ...data,
        no: vehicles.length + 1
      };
      setVehicles(prev => [...prev, newVehicle]);
    }
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  // Hapus Data (Delete)
  const handleDeleteVehicle = (keyIdentifier) => {
    setVehicles(prev =>
      prev
        .filter(v => v.no_aset !== keyIdentifier && v.nopolisi !== keyIdentifier)
        .map((v, idx) => ({ ...v, no: idx + 1 }))
    );
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-slate-800">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Car className="w-4 h-4" /> Master Data Inventaris Logistik
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Data Master Kendaraan Armada
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Daftar nomor aset, nopolisi, jenis kendaraan, lokasi pangkalan, divisi operasional, konsumsi BBM (KM/Liter), dan rate per hari
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kendaraan</span>
            </button>
          </div>
        </div>

        {/* STATISTIK RINGKAS ARMADA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Unit Armada</span>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{vehicles.length} Unit</p>
            <span className="text-[11px] text-blue-600 font-semibold">Tersedia di Sistem</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Base Lokasi Bekasi</span>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {vehicles.filter(v => v.lokasi === 'Bekasi').length} Unit
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold">Operasional Jabodetabek</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Base Lokasi Surabaya</span>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {vehicles.filter(v => v.lokasi === 'Surabaya').length} Unit
            </p>
            <span className="text-[11px] text-purple-600 font-semibold">Cabang Jawa Timur</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Rata-rata Rate/Hari</span>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
              Rp {Math.round(vehicles.reduce((sum, v) => sum + (v.rate_per_hari || 0), 0) / (vehicles.length || 1)).toLocaleString('id-ID')}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold">Biaya Operasional Dasar</span>
          </div>
        </div>

        {/* TABEL MASTER DATA KENDARAAN */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar Search & Filter */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari No Aset, Plat, Kendaraan, Divisi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-60 sm:w-80"
                />
              </div>

              <select
                value={filterLokasi}
                onChange={(e) => setFilterLokasi(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Lokasi</option>
                <option value="Bekasi">Bekasi</option>
                <option value="Surabaya">Surabaya</option>
              </select>

              <select
                value={filterOperasional}
                onChange={(e) => setFilterOperasional(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Operasional</option>
                <option value="LOG AQPA">LOG AQPA</option>
                <option value="LOG GTE">LOG GTE</option>
                <option value="HRGA">HRGA</option>
                <option value="LOG AQPA SBY">LOG AQPA SBY</option>
              </select>
            </div>

            <span className="text-xs font-bold text-slate-500 font-mono">
              Menampilkan {filteredVehicles.length} dari {vehicles.length} Kendaraan
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3">No Aset</th>
                  <th className="py-3 px-4">No Polisi</th>
                  <th className="py-3 px-4">Kendaraan</th>
                  <th className="py-3 px-3 text-center">Lokasi</th>
                  <th className="py-3 px-3 text-center">Operasional</th>
                  <th className="py-3 px-3 text-right">KM / Liter</th>
                  <th className="py-3 px-4 text-right">Rate Kendaraan Perhari</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400 font-medium">
                      Kendaraan tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => (
                    <tr key={v.no} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                        {v.no}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        {v.no_aset}
                      </td>

                      <td className="py-3 px-4 font-mono font-black text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {v.nopolisi}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-extrabold text-slate-800">
                        {v.kendaraan}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.lokasi === 'Bekasi' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {v.lokasi}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                          {v.operasional}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                        {v.km_per_liter} KM
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-extrabold text-indigo-700">
                        Rp {Number(v.rate_per_hari).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {v.status}
                        </span>
                      </td>

                      {/* KOLOM AKSI: EDIT & DELETE */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                            title="Edit Kendaraan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(v)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                            title="Hapus Kendaraan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* 1 KOMPONEN FORM MODAL UNTUK CREATE, EDIT, DAN DELETE */}
        <FormKendaraanModal
          isOpen={isModalOpen}
          initialData={selectedVehicle}
          isDeleteMode={isDeleteMode}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedVehicle(null);
            setIsDeleteMode(false);
          }}
          onSubmit={handleSaveVehicle}
          onDelete={handleDeleteVehicle}
        />

      </div>
    </MainLayout>
  );
}
