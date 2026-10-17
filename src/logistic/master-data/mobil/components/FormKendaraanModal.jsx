import React, { useState } from 'react';
import {
  X,
  Car,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Building,
  MapPin,
  Fuel,
  DollarSign,
  Tag,
  FileText
} from 'lucide-react';

export default function FormKendaraanModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData = null,
  isDeleteMode = false
}) {
  const [formData, setFormData] = useState(
    initialData || {
      no_aset: '',
      nopolisi: '',
      kendaraan: '',
      tipe: 'Pickup',
      lokasi: 'Bekasi',
      operasional: 'LOG AQPA',
      km_per_liter: 12.0,
      rate_per_hari: 250000,
      status: 'Siap Pakai'
    }
  );

  // Sinkronisasi data saat modal dibuka
  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        no_aset: '',
        nopolisi: '',
        kendaraan: '',
        tipe: 'Pickup',
        lokasi: 'Bekasi',
        operasional: 'LOG AQPA',
        km_per_liter: 12.0,
        rate_per_hari: 250000,
        status: 'Siap Pakai'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.no_aset.trim() || !formData.nopolisi.trim() || !formData.kendaraan.trim()) {
      alert('Mohon lengkapi No Aset, No Polisi, dan Nama Kendaraan.');
      return;
    }

    if (onSubmit) {
      onSubmit({
        ...formData,
        km_per_liter: parseFloat(formData.km_per_liter) || 0,
        rate_per_hari: parseFloat(formData.rate_per_hari) || 0
      });
    }
    onClose();
  };

  const handleConfirmDelete = () => {
    if (onDelete && initialData) {
      onDelete(initialData.no_aset || initialData.nopolisi);
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
              {isDeleteMode ? <Trash2 className="w-5 h-5" /> : <Car className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {isDeleteMode
                  ? 'Konfirmasi Hapus Kendaraan'
                  : initialData
                  ? 'Edit Master Data Kendaraan'
                  : 'Tambah Kendaraan Armada Baru'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isDeleteMode
                  ? 'Tindakan ini akan menghapus kendaraan dari master data inventaris'
                  : 'Inventarisasi aset armada, lokasi pangkalan & konsumsi BBM'}
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
          /* TAMPILAN MODE DELETE */
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-900">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm space-y-1">
                <p className="font-bold">Apakah Anda yakin ingin menghapus kendaraan ini?</p>
                <p className="text-red-700">
                  Data unit <strong className="font-mono text-red-900">{formData.nopolisi}</strong> ({formData.kendaraan}) dengan No Aset <strong className="font-mono">{formData.no_aset}</strong> akan dihapus permanen dari daftar master armada.
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
                <span>Ya, Hapus Kendaraan</span>
              </button>
            </div>
          </div>
        ) : (
          /* TAMPILAN MODE CREATE & EDIT */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* No Aset */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor Aset <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cth: A/2/0001"
                  value={formData.no_aset}
                  onChange={(e) => handleChange('no_aset', e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                />
              </div>

              {/* No Polisi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor Polisi (Plat) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cth: B 2235 KYB"
                  value={formData.nopolisi}
                  onChange={(e) => handleChange('nopolisi', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Nama Kendaraan & Tipe */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Kendaraan / Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cth: GRANDMAX HITAM, L300"
                  value={formData.kendaraan}
                  onChange={(e) => handleChange('kendaraan', e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipe Unit
                </label>
                <select
                  value={formData.tipe}
                  onChange={(e) => handleChange('tipe', e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                >
                  <option value="Pickup">Pickup</option>
                  <option value="Pickup Box">Pickup Box</option>
                  <option value="Blind Van">Blind Van</option>
                  <option value="Truck Engkel 4 Roda">Truck Engkel</option>
                  <option value="Truck CDD 6 Roda">Truck CDD</option>
                  <option value="Motorcycle">Sepeda Motor</option>
                  <option value="Passenger Car">Passenger Car</option>
                </select>
              </div>
            </div>

            {/* Lokasi Pangkalan & Operasional */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lokasi Base / Pangkalan <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.lokasi}
                  onChange={(e) => handleChange('lokasi', e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                >
                  <option value="Bekasi">Bekasi (Pusat / Cikarang)</option>
                  <option value="Surabaya">Surabaya (Jawa Timur)</option>
                  <option value="Bogor">Bogor (Gunung Putri)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Divisi Operasional <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.operasional}
                  onChange={(e) => handleChange('operasional', e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                >
                  <option value="LOG AQPA">LOG AQPA</option>
                  <option value="LOG GTE">LOG GTE</option>
                  <option value="HRGA">HRGA</option>
                  <option value="LOG AQPA SBY">LOG AQPA SBY</option>
                </select>
              </div>
            </div>

            {/* KM / Liter & Rate Per Hari */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  KM / Liter (Konsumsi BBM)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    placeholder="12"
                    value={formData.km_per_liter}
                    onChange={(e) => handleChange('km_per_liter', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-200 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    KM
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Rate Kendaraan / Hari
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    placeholder="250000"
                    value={formData.rate_per_hari}
                    onChange={(e) => handleChange('rate_per_hari', e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-slate-200 font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Status Kendaraan
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Siap Pakai">Siap Pakai (Aktif)</option>
                  <option value="Sedang Jalan">Sedang Jalan</option>
                  <option value="Servis Rutin">Servis Rutin / Bengkel</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                </select>
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
                <span>{initialData ? 'Perbarui Data Kendaraan' : 'Simpan Kendaraan Baru'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
