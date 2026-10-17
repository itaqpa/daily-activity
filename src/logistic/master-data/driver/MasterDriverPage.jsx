import React, { useState, useMemo } from 'react';
import MainLayout from '../../../components/layouts/MainLayout';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  CreditCard, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  Edit2, 
  Trash2,
  Truck,
  UserCheck,
  Tag
} from 'lucide-react';
import FormDriverModal from './components/FormDriverModal';

export default function MasterDriverPage() {
  // Data Master Driver sesuai rekap acuan pengguna (11 Driver)
  const [drivers, setDrivers] = useState([
    {
      id: 'DRV-001',
      no: 1,
      nama: 'ABDUL KARIM',
      keterangan: 'DRIVER',
      no_hp: '0812-9911-2201',
      sim_tipe: 'SIM B1 Umum',
      no_sim: '9201-8821-0021',
      default_mobil: 'B 2257 KIO (GRANDMAX PUTIH)',
      username: 'abdulkarim',
      divisi: 'Driver',
      user_id: 101,
      status: 'Aktif'
    },
    {
      id: 'DRV-002',
      no: 2,
      nama: 'ALDI YUSUF',
      keterangan: 'DRIVER',
      no_hp: '0857-8822-3302',
      sim_tipe: 'SIM B1 Umum',
      no_sim: '9102-4412-0099',
      default_mobil: 'B 9819 KRW (L300)',
      username: 'aldiyusuf',
      divisi: 'Driver',
      user_id: 102,
      status: 'Aktif'
    },
    {
      id: 'DRV-003',
      no: 3,
      nama: 'ARIE SANJAYA',
      keterangan: 'DRIVER',
      no_hp: '0813-7733-4403',
      sim_tipe: 'SIM B1 Umum',
      no_sim: '8830-1120-0014',
      default_mobil: 'B 9726 KCI (BLIND VAN)',
      username: 'ariesanjaya',
      divisi: 'Driver',
      user_id: 103,
      status: 'Aktif'
    },
    {
      id: 'DRV-004',
      no: 4,
      nama: 'HAMDANI NURHIDAYAT',
      keterangan: 'DRIVER',
      no_hp: '0821-6644-5504',
      sim_tipe: 'SIM B2 Umum',
      no_sim: '8840-2231-0055',
      default_mobil: 'B 9074 KIU (TRUCK KUNING ENGKEL)',
      username: 'hamdani',
      divisi: 'Driver',
      user_id: 104,
      status: 'Aktif'
    },
    {
      id: 'DRV-005',
      no: 5,
      nama: 'WAHYU ADI',
      keterangan: 'DRIVER',
      no_hp: '0812-5566-7705',
      sim_tipe: 'SIM B1 Umum',
      no_sim: '9311-3342-0081',
      default_mobil: 'B 9976 KCI (BLIND VAN PUTIH)',
      username: 'wahyuadi',
      divisi: 'Driver',
      user_id: 105,
      status: 'Aktif'
    },
    {
      id: 'DRV-006',
      no: 6,
      nama: 'WAHYU PRASETYO',
      keterangan: 'DRIVER',
      no_hp: '0856-4477-8806',
      sim_tipe: 'SIM B1 Umum',
      no_sim: '9311-5563-0092',
      default_mobil: 'B 2235 KYB (GRANDMAX HITAM)',
      username: 'wahyuprasetyo',
      divisi: 'Driver',
      user_id: 106,
      status: 'Aktif'
    },
    {
      id: 'DRV-007',
      no: 7,
      nama: 'SISWO RIMBAWAN',
      keterangan: 'DRIVER',
      no_hp: '0813-3388-9907',
      sim_tipe: 'SIM B1 Umum',
      no_sim: '8922-6674-0103',
      default_mobil: 'B 1442 KYI (GRANDMAX PUTIH GTE)',
      username: 'siswo',
      divisi: 'Driver',
      user_id: 107,
      status: 'Aktif'
    },
    {
      id: 'DRV-008',
      no: 8,
      nama: 'SUTAR',
      keterangan: 'DRIVER',
      no_hp: '0822-2299-0008',
      sim_tipe: 'SIM B1 Umum',
      no_sim: '9033-7785-0114',
      default_mobil: 'B 9168 KAV (CARRY HITAM GTE)',
      username: 'sutar',
      divisi: 'Driver',
      user_id: 108,
      status: 'Aktif'
    },
    {
      id: 'DRV-009',
      no: 9,
      nama: 'BIVANT HARDI CHOARAHMAN',
      keterangan: 'DRIVER',
      no_hp: '0857-1100-2209',
      sim_tipe: 'SIM B1 Umum',
      no_sim: '9455-8896-0125',
      default_mobil: 'B 9412 KUF (CARRY PUTIH SBY)',
      username: 'bivanthardi',
      divisi: 'Driver',
      user_id: 109,
      status: 'Aktif'
    },
    {
      id: 'DRV-010',
      no: 10,
      nama: 'RONI IRAWAN',
      keterangan: 'DRIVER',
      no_hp: '0812-4411-3310',
      sim_tipe: 'SIM B1 Umum',
      no_sim: '9566-9907-0136',
      default_mobil: 'B 2969 KYC (GRANDMAX SILVER SBY)',
      username: 'roniirawan',
      divisi: 'Driver',
      user_id: 110,
      status: 'Aktif'
    },
    {
      id: 'DRV-011',
      no: 11,
      nama: 'DEA FATHUROHMAN',
      keterangan: 'OPSIONAL DRIVER',
      no_hp: '0878-5522-4411',
      sim_tipe: 'SIM A',
      no_sim: '9677-0018-0147',
      default_mobil: 'B 5563 KIU (VARIO 125 HITAM MERAH)',
      username: 'deafathurohman',
      divisi: 'Driver',
      user_id: 111,
      status: 'Aktif'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterKeterangan, setFilterKeterangan] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  // Filter Drivers
  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        d.nama.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        (d.username || '').toLowerCase().includes(q) ||
        (d.default_mobil || '').toLowerCase().includes(q) ||
        (d.no_hp || '').toLowerCase().includes(q);

      const matchKeterangan = filterKeterangan === 'ALL' || d.keterangan === filterKeterangan;

      return matchSearch && matchKeterangan;
    });
  }, [drivers, searchQuery, filterKeterangan]);

  // Handler Buka Modal Tambah
  const handleOpenCreate = () => {
    setSelectedDriver(null);
    setIsDeleteMode(false);
    setIsModalOpen(true);
  };

  // Handler Buka Modal Edit
  const handleOpenEdit = (item) => {
    setSelectedDriver(item);
    setIsDeleteMode(false);
    setIsModalOpen(true);
  };

  // Handler Buka Modal Delete
  const handleOpenDelete = (item) => {
    setSelectedDriver(item);
    setIsDeleteMode(true);
    setIsModalOpen(true);
  };

  // Simpan Data Driver & Buat Akun
  const handleSaveDriver = (data) => {
    if (selectedDriver) {
      setDrivers(prev =>
        prev.map(d =>
          d.id === selectedDriver.id ? { ...d, ...data } : d
        )
      );
    } else {
      const newDriver = {
        ...data,
        no: drivers.length + 1,
        id: data.id || `DRV-${String(drivers.length + 1).padStart(3, '0')}`,
        user_id: Math.floor(100 + Math.random() * 900)
      };
      setDrivers(prev => [...prev, newDriver]);
    }
    setIsModalOpen(false);
    setSelectedDriver(null);
  };

  // Hapus Data Driver
  const handleDeleteDriver = (keyId) => {
    setDrivers(prev =>
      prev
        .filter(d => d.id !== keyId && d.nama !== keyId)
        .map((d, idx) => ({ ...d, no: idx + 1 }))
    );
    setIsModalOpen(false);
    setSelectedDriver(null);
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-slate-800">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" /> Master Data Operasional Logistik
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Data Master Driver & Akun Mobile
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Daftar personil sopir/driver, pembagian peran operasional, lisensi SIM, serta sinkronisasi akun login mobile app (Divisi: <strong>Driver</strong>)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Driver & Akun</span>
            </button>
          </div>
        </div>

        {/* METRIK STATISTIK DRIVER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Personil</span>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{drivers.length} Orang</p>
            <span className="text-[11px] text-blue-600 font-semibold">Tercatat di Sistem</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Driver Utama</span>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {drivers.filter(d => d.keterangan === 'DRIVER').length} Orang
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold">Pengemudi Rute Inti</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Opsional Driver</span>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {drivers.filter(d => d.keterangan === 'OPSIONAL DRIVER').length} Orang
            </p>
            <span className="text-[11px] text-purple-600 font-semibold">Back-up / Khusus Ringan</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Akun Driver App</span>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {drivers.filter(d => d.username).length} Akun
            </p>
            <span className="text-[11px] text-indigo-600 font-semibold">Hak Akses Divisi: Driver</span>
          </div>
        </div>

        {/* TABEL MASTER DATA DRIVER */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar Search & Filter */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Nama Driver, Username, Armada..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-60 sm:w-80"
                />
              </div>

              <select
                value={filterKeterangan}
                onChange={(e) => setFilterKeterangan(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Keterangan</option>
                <option value="DRIVER">DRIVER</option>
                <option value="OPSIONAL DRIVER">OPSIONAL DRIVER</option>
              </select>
            </div>

            <span className="text-xs font-bold text-slate-500 font-mono">
              Menampilkan {filteredDrivers.length} dari {drivers.length} Driver
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Sopir</th>
                  <th className="py-3 px-3 text-center">Keterangan</th>
                  <th className="py-3 px-4">Akun Driver App</th>
                  <th className="py-3 px-3">No. HP / WhatsApp</th>
                  <th className="py-3 px-3">Lisensi SIM</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 font-medium">
                      Data driver tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((d) => (
                    <tr key={d.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                        {d.no}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 block text-xs">
                          {d.nama}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {d.id}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          d.keterangan === 'DRIVER'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {d.keterangan}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {d.username ? (
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-indigo-700 flex items-center gap-1">
                              <KeyRound className="w-3 h-3 text-indigo-500" />
                              {d.username}
                            </span>
                            <span className="text-[10px] font-extrabold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 inline-block">
                              Divisi: {d.divisi || 'Driver'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum terhubung akun</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-700">
                        {d.no_hp || '-'}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 block text-[11px]">{d.sim_tipe}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{d.no_sim || '-'}</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {d.status}
                        </span>
                      </td>

                      {/* KOLOM AKSI: EDIT & DELETE */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(d)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                            title="Edit Driver"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(d)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                            title="Hapus Driver"
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

        {/* 1 KOMPONEN FORM MODAL TERPADU UNTUK CREATE, EDIT, DAN DELETE */}
        <FormDriverModal
          isOpen={isModalOpen}
          initialData={selectedDriver}
          isDeleteMode={isDeleteMode}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDriver(null);
            setIsDeleteMode(false);
          }}
          onSubmit={handleSaveDriver}
          onDelete={handleDeleteDriver}
        />

      </div>
    </MainLayout>
  );
}
