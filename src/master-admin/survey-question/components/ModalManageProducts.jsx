import React, { useState } from 'react';
import { X, Plus, Trash2, Package, Tag, AlertCircle, CheckCircle2, Layers } from 'lucide-react';
import { createSurveyProduct, deleteSurveyProduct } from '../../../survey-product/utils/surveyProductHelper';

export default function ModalManageProducts({
  isOpen,
  onClose,
  products = [],
  onProductsUpdated
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Expansion joint'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedCode = (formData.code || '').trim().toUpperCase();
    const trimmedName = (formData.name || '').trim();
    const trimmedCat = (formData.category || '').trim();

    if (!trimmedCode) {
      setErrorMsg('Kode produk wajib diisi (mis. BVT, EXP, DLL)');
      return;
    }
    if (!trimmedName) {
      setErrorMsg('Nama produk wajib diisi');
      return;
    }

    // Cek duplikasi di client
    if (products.some(p => (p.code || '').toUpperCase() === trimmedCode)) {
      setErrorMsg(`Kode produk "${trimmedCode}" sudah ada!`);
      return;
    }

    try {
      setIsSubmitting(true);
      await createSurveyProduct({
        code: trimmedCode,
        name: trimmedName,
        category: trimmedCat || 'Lainnya'
      });

      setSuccessMsg(`Produk ${trimmedCode} berhasil ditambahkan!`);
      setFormData({ code: '', name: '', category: 'Expansion joint' });
      onProductsUpdated?.();
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menambahkan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Yakin ingin menghapus produk "${code}"? Pastikan tidak ada template pertanyaan aktif yang bergantung pada produk ini.`)) {
      return;
    }

    try {
      setIsDeleting(code);
      setErrorMsg('');
      await deleteSurveyProduct(code);
      onProductsUpdated?.();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menghapus produk');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-400/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Kelola Jenis Produk Survei</h2>
              <p className="text-xs text-slate-300">
                Tambah atau atur produk survei agar langsung muncul di form lapangan & master pertanyaan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Tambah Produk */}
          <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Tambah Produk Baru</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kode Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="cth: BVT"
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono uppercase text-xs outline-none"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  disabled={isSubmitting}
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="cth: Butterfly Valve"
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  placeholder="cth: Valve / Gasket"
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}</span>
              </button>
            </div>
          </form>

          {/* List Produk Saat Ini */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Daftar Produk Aktif ({products.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {products.map((p) => (
                <div
                  key={p.code}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md">
                        {p.code}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-[11px] font-medium text-slate-500 truncate">
                        {p.category || 'Umum'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-1 truncate">
                      {p.name}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(p.code)}
                    disabled={isDeleting === p.code}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-40"
                    title={`Hapus produk ${p.code}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Selesai / Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
