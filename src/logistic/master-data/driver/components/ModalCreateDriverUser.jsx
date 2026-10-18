import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  KeyRound, 
  Lock, 
  Mail, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  Truck
} from 'lucide-react';
import { apiUrl } from '../../../../api';

export default function ModalCreateDriverUser({
  isOpen,
  onClose,
  driver,
  onSuccess
}) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: 'driver123',
    divisi: 'Logistik',
    jabatan: 'Driver'
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (driver) {
      const cleanUsername = (driver.username || driver.nama || driver.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      setFormData({
        name: driver.nama || driver.name || '',
        username: cleanUsername,
        email: driver.email || (cleanUsername ? `${cleanUsername}@aqpa-indonesia.com` : ''),
        password: driver.username ? '' : 'driver123',
        divisi: 'Logistik',
        jabatan: 'Driver'
      });
      setErrorMsg('');
    }
  }, [driver, isOpen]);

  if (!isOpen || !driver) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.username.trim()) {
      setErrorMsg('Username wajib diisi.');
      return;
    }

    if (!formData.password && !driver.username) {
      setErrorMsg('Password wajib diisi untuk pembuatan akun baru.');
      return;
    }

    setLoading(true);
    try {
      // Panggil backend API jika driver memiliki id di database
      if (driver.id && String(driver.id).includes('-')) {
        const response = await fetch(apiUrl(`/logistic/drivers/${driver.id}/create-user`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password || 'driver123',
            email: formData.email
          })
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || 'Gagal menyimpan user');
        }
      }

      if (onSuccess) {
        onSuccess({
          ...driver,
          username: formData.username.toLowerCase().trim(),
          divisi: 'Logistik',
          jabatan: 'Driver',
          has_account: true
        });
      }
      onClose();
    } catch (err) {
      console.error('Error create driver user:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                {driver.username ? 'Kelola Akun User Driver' : 'Jadikan User & Buat Akun Driver'}
              </h2>
              <p className="text-xs text-blue-100">
                Akses Driver App • Divisi: Logistik • Posisi: Driver
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Informasi Driver Terpilih */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-black flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 block text-sm">
                  {driver.nama || driver.name}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Kode: {driver.driver_code || driver.id} • {driver.keterangan || driver.role_type || 'DRIVER'}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
              {driver.status || 'Aktif'}
            </span>
          </div>

          {/* Divisi & Sub-Divisi / Posisi Preview */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Divisi Utama
              </label>
              <div className="px-3 py-2 bg-blue-50/80 border border-blue-200 rounded-xl font-extrabold text-blue-900 flex items-center justify-between">
                <span>Logistik</span>
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Sub-Divisi / Jabatan
              </label>
              <div className="px-3 py-2 bg-indigo-50/80 border border-indigo-200 rounded-xl font-extrabold text-indigo-900 flex items-center justify-between">
                <span>Driver (Sopir)</span>
                <KeyRound className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Username & Email */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username Driver <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Cth: abdulkarim"
                  value={formData.username}
                  onChange={(e) => {
                    const u = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    setFormData(prev => ({
                      ...prev,
                      username: u,
                      email: u ? `${u}@aqpa-indonesia.com` : prev.email
                    }));
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Sistem (Opsional)
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="driver@aqpa-indonesia.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password {driver.username ? '(Kosongkan jika tidak diubah)' : <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={driver.username ? 'Biarkan kosong untuk mempertahankan password lama' : 'Password login (cth: driver123)'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Password default: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">driver123</code>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2 text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : (driver.username ? 'Perbarui Akun User' : 'Buat Akun User Sekarang')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
