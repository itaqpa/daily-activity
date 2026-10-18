import React, { useState } from 'react';
import {
  X,
  User,
  Users,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Phone,
  CreditCard,
  Truck,
  ShieldCheck,
  KeyRound,
  Link2
} from 'lucide-react';

export default function FormDriverModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData = null,
  isDeleteMode = false,
  availableVehicles = []
}) {
  const [formData, setFormData] = useState({
    id: '',
    nama: '',
    keterangan: 'DRIVER', // 'DRIVER' atau 'OPSIONAL DRIVER'
    no_hp: '',
    sim_tipe: 'SIM B1 Umum',
    no_sim: '',
    default_mobil: '',
    status: 'Aktif',
    
    // Hubungan ke Akun User (Divisi: Logistik, Jabatan: Driver)
    is_create_account: true,
    user_id: '',
    username: '',
    email: '',
    password: '',
    divisi: 'Logistik',
    jabatan: 'Driver'
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        is_create_account: !!initialData.username,
        divisi: initialData.divisi || 'Logistik',
        jabatan: initialData.jabatan || 'Driver'
      });
    } else {
      const randomCode = `DRV-${String(Math.floor(10 + Math.random() * 90))}`;
      setFormData({
        id: randomCode,
        nama: '',
        keterangan: 'DRIVER',
        no_hp: '',
        sim_tipe: 'SIM B1 Umum',
        no_sim: '',
        default_mobil: '',
        status: 'Aktif',
        is_create_account: true,
        user_id: '',
        username: '',
        email: '',
        password: '',
        divisi: 'Logistik',
        jabatan: 'Driver'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-generate username jika nama diisi pada mode buat akun baru
      if (field === 'nama' && !initialData && !prev.username) {
        const cleanUsername = value.toLowerCase().replace(/[^a-z0-9]/g, '');
        updated.username = cleanUsername;
        updated.email = cleanUsername ? `${cleanUsername}@aqpa-indonesia.com` : '';
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      alert('Nama Driver wajib diisi.');
      return;
    }

    if (formData.is_create_account && !formData.username.trim()) {
      alert('Username akun driver wajib diisi.');
      return;
    }

    if (onSubmit) {
      onSubmit({
        ...formData,
        divisi: 'Logistik',
        jabatan: 'Driver'
      });
    }
    onClose();
  };

  const handleConfirmDelete = () => {
    if (onDelete && initialData) {
      onDelete(initialData.id || initialData.nama);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDeleteMode ? 'bg-red-50/70 border-red-100' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              isDeleteMode ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {isDeleteMode ? <Trash2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {isDeleteMode
                  ? 'Konfirmasi Hapus Driver'
                  : initialData
                  ? 'Edit Master Data Driver'
                  : 'Tambah Driver & Hubungkan Akun'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isDeleteMode
                  ? 'Tindakan ini akan menghapus sopir dari master data driver'
                  : 'Profil pengemudi, relasi user akun login (Divisi: Driver), & SIM'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        {isDeleteMode ? (
          /* MODE DELETE */
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-900">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm space-y-1">
                <p className="font-bold">Hapus data driver ini?</p>
                <p className="text-red-700">
                  Driver <strong className="font-extrabold text-red-950">{formData.nama}</strong> ({formData.keterangan}) akan dihapus dari daftar master penugasan sopir.
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md shadow-red-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Driver</span>
              </button>
            </div>
          </div>
        ) : (
          /* MODE CREATE & EDIT */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs sm:text-sm">
            {/* Nama Lengkap & Peran/Keterangan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Sopir <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ABDUL KARIM"
                  value={formData.nama}
                  onChange={(e) => handleChange('nama', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Keterangan / Tipe <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.keterangan}
                  onChange={(e) => handleChange('keterangan', e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                >
                  <option value="DRIVER">DRIVER</option>
                  <option value="OPSIONAL DRIVER">OPSIONAL DRIVER</option>
                  <option value="KERNET">KERNET / CO-DRIVER</option>
                </select>
              </div>
            </div>

            {/* Kontak & Lisensi SIM */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  No. HP / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={formData.no_hp}
                  onChange={(e) => handleChange('no_hp', e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipe SIM
                </label>
                <select
                  value={formData.sim_tipe}
                  onChange={(e) => handleChange('sim_tipe', e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SIM B1 Umum">SIM B1 Umum</option>
                  <option value="SIM B2 Umum">SIM B2 Umum</option>
                  <option value="SIM A">SIM A</option>
                  <option value="SIM C">SIM C</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Status Driver
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                </select>
              </div>
            </div>



            {/* INTEGRASI HUBUNGKAN AKUN LOGIN USER (DIVISI: LOGISTIK, JABATAN: DRIVER) */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span className="font-extrabold text-blue-900 text-xs uppercase tracking-wider">
                    Akun Login Driver App
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[11px] border border-blue-200">
                  <Link2 className="w-3.5 h-3.5" />
                  Divisi: <strong>Logistik</strong> • Posisi: <strong>Driver</strong>
                </div>
              </div>

              <p className="text-[11px] text-blue-700 font-medium">
                Akun ini akan otomatis terdaftar di tabel <code className="font-mono bg-white px-1 rounded text-blue-900">users</code> dengan hak akses Divisi: <strong>Logistik</strong>, Jabatan: <strong>Driver</strong> untuk login ke Driver App.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Username Akun Driver <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Cth: abdulkarim"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-1.5 bg-white rounded-lg border border-blue-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Password Default
                  </label>
                  <input
                    type="password"
                    placeholder="Default: driver123"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white rounded-lg border border-blue-300 font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2 text-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{initialData ? 'Perbarui Data Driver' : 'Simpan & Buat Akun Driver'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
