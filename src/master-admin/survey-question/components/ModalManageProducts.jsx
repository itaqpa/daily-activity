import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Package, AlertCircle, CheckCircle2, Layers, AlertTriangle, Check } from 'lucide-react';
import { createSurveyProduct, updateSurveyProduct, deleteSurveyProduct } from '../../../survey-product/utils/surveyProductHelper';

export default function ModalManageProducts({
  isOpen,
  onClose,
  products = [],
  onProductsUpdated
}) {
  // Mode: 'create' | 'edit'
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Expansion joint'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 2-Step Confirmation Delete State
  // deleteConfirmState: null | { step: 1, product } | { step: 2, product, typedCode: '' }
  const [deleteConfirmState, setDeleteConfirmState] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleStartEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code || '',
      name: product.name || '',
      category: product.category || 'Expansion joint'
    });
    setErrorMsg('');
    setSuccessMsg('');
    setDeleteConfirmState(null);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setFormData({ code: '', name: '', category: 'Expansion joint' });
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedCode = (formData.code || '').trim().toUpperCase();
    const trimmedName = (formData.name || '').trim();
    const trimmedCat = (formData.category || '').trim();

    if (!editingProduct && !trimmedCode) {
      setErrorMsg('Kode produk wajib diisi (mis. BVT, EXP, DLL)');
      return;
    }
    if (!trimmedName) {
      setErrorMsg('Nama produk wajib diisi');
      return;
    }

    // Jika mode create, pastikan kode belum terpakai
    if (!editingProduct && products.some(p => (p.code || '').toUpperCase() === trimmedCode)) {
      setErrorMsg(`Kode produk "${trimmedCode}" sudah ada!`);
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingProduct) {
        // Mode Edit: Update nama produk
        await updateSurveyProduct(editingProduct.code, {
          name: trimmedName,
          category: trimmedCat || 'Lainnya'
        });
        setSuccessMsg(`Produk ${editingProduct.code} berhasil diperbarui!`);
        handleCancelEdit();
      } else {
        // Mode Create: Tambah produk baru
        await createSurveyProduct({
          code: trimmedCode,
          name: trimmedName,
          category: trimmedCat || 'Lainnya'
        });
        setSuccessMsg(`Produk ${trimmedCode} berhasil ditambahkan!`);
        setFormData({ code: '', name: '', category: 'Expansion joint' });
      }

      onProductsUpdated?.();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Buka modal konfirmasi pertama
  const handleOpenDeleteStep1 = (product) => {
    setErrorMsg('');
    setSuccessMsg('');
    setDeleteConfirmState({ step: 1, product });
  };

  // Step 2: Lanjut ke konfirmasi kedua (ketik kode untuk konfirmasi)
  const handleProceedDeleteStep2 = () => {
    if (!deleteConfirmState?.product) return;
    setDeleteConfirmState({
      step: 2,
      product: deleteConfirmState.product,
      typedCode: ''
    });
  };

  // Eksekusi hapus setelah konfirmasi ke-2 lolos
  const handleFinalDelete = async () => {
    if (!deleteConfirmState?.product) return;
    const targetProduct = deleteConfirmState.product;

    if (deleteConfirmState.typedCode !== targetProduct.code) {
      setErrorMsg(`Kode yang Anda masukkan tidak sesuai. Ketik persis "${targetProduct.code}" untuk menghapus.`);
      return;
    }

    try {
      setIsDeleting(true);
      setErrorMsg('');
      await deleteSurveyProduct(targetProduct.code);
      setSuccessMsg(`Produk ${targetProduct.code} berhasil dinonaktifkan/dihapus.`);
      setDeleteConfirmState(null);
      if (editingProduct?.code === targetProduct.code) {
        handleCancelEdit();
      }
      onProductsUpdated?.();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menghapus produk');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-400/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Kelola Jenis Produk Survei</h2>
              <p className="text-xs text-slate-300">
                Tambah, edit nama produk, atau hapus produk survei
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
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Tambah / Edit Produk */}
          <form onSubmit={handleSubmit} className={`border rounded-xl p-4 space-y-3 transition-colors ${
            editingProduct ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                editingProduct ? 'text-amber-800' : 'text-slate-600'
              }`}>
                {editingProduct ? (
                  <>
                    <Edit2 className="w-4 h-4 text-amber-600" />
                    <span>Edit Produk: <strong className="font-mono text-blue-700">{editingProduct.code}</strong></span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>Tambah Produk Baru</span>
                  </>
                )}
              </h3>

              {editingProduct && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium underline cursor-pointer"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kode Produk {!editingProduct && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="cth: BVT"
                  className={`w-full px-3 py-2 rounded-lg border font-mono uppercase text-xs outline-none ${
                    editingProduct
                      ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  disabled={isSubmitting || !!editingProduct}
                  title={editingProduct ? 'Kode produk tidak dapat diubah setelah dibuat' : ''}
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

            <div className="flex justify-end gap-2 pt-2">
              {editingProduct && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-95 ${
                  editingProduct ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {editingProduct ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>
                  {isSubmitting
                    ? 'Menyimpan...'
                    : (editingProduct ? 'Simpan Perubahan' : 'Simpan Produk')}
                </span>
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
              {products.map((p) => {
                const isItemEditing = editingProduct?.code === p.code;
                return (
                  <div
                    key={p.code}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all shadow-2xs ${
                      isItemEditing
                        ? 'border-amber-400 bg-amber-50/70 ring-1 ring-amber-400'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
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

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(p)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isItemEditing
                            ? 'text-amber-700 bg-amber-100'
                            : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title={`Edit produk ${p.code}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDeleteStep1(p)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title={`Hapus produk ${p.code}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
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

      {/* ── MODAL 2-STEP CONFIRMATION DELETE ─────────────────────── */}
      {deleteConfirmState && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4 border border-red-100">
            
            {/* Step 1: Peringatan Awal */}
            {deleteConfirmState.step === 1 && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      Konfirmasi Tahap 1 dari 2
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Hapus Produk "{deleteConfirmState.product.code}"?
                    </h3>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                  <p>
                    Anda akan menghapus produk <strong>{deleteConfirmState.product.name} ({deleteConfirmState.product.code})</strong>.
                  </p>
                  <p className="text-red-600 font-semibold">
                    ⚠️ Produk ini tidak akan lagi muncul di formulir survey lapangan baru.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmState(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedDeleteStep2}
                    className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    Lanjut Konfirmasi Terakhir &rarr;
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Konfirmasi Final (Ketik Kode Produk) */}
            {deleteConfirmState.step === 2 && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-200">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      Konfirmasi Terakhir (Tahap 2 dari 2)
                    </span>
                    <h3 className="text-base font-bold text-red-700 mt-1">
                      Ketik Kode Produk Untuk Menghapus
                    </h3>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-2">
                  <p>
                    Untuk mencegah ketidaksengajaan klik, ketik kode produk{' '}
                    <strong className="font-mono bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200">
                      {deleteConfirmState.product.code}
                    </strong>{' '}
                    di bawah ini untuk melanjutkan:
                  </p>

                  <input
                    type="text"
                    placeholder={`Ketik ${deleteConfirmState.product.code}`}
                    className="w-full px-3 py-2 border-2 border-red-300 rounded-lg font-mono text-sm uppercase text-slate-800 focus:outline-none focus:border-red-600"
                    value={deleteConfirmState.typedCode || ''}
                    onChange={(e) => setDeleteConfirmState(prev => ({
                      ...prev,
                      typedCode: e.target.value.toUpperCase()
                    }))}
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmState(null)}
                    disabled={isDeleting}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalDelete}
                    disabled={isDeleting || deleteConfirmState.typedCode !== deleteConfirmState.product.code}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}</span>
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
