import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Building2,
  User,
  Phone,
  FileText,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Navigation,
  Search,
  Loader2,
  Check
} from 'lucide-react';

export default function FormTugasDriverModal({ isOpen, onClose, onSubmit }) {
  const [isSearchingAkurasi, setIsSearchingAkurasi] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
  const [formData, setFormData] = useState({
    task_type: 'delivery', // 'delivery' atau 'pickup'
    reference_number: '',  // No SO atau No PO
    do_easy: '',           // No DO Easy / Surat Jalan
    is_out_of_city: false,
    dispatch_date: new Date().toISOString().split('T')[0],
    departure_notes: '',

    // Lokasi Asal (Origin)
    origin_name: 'Gudang AQPA Cikarang',
    origin_pic_name: 'Staff Gudang Logistik',
    origin_pic_phone: '0812-3456-7890',
    origin_address: 'Kawasan Industri GIIC Cikarang Pusat, Bekasi, Jawa Barat',
    origin_latitude: '',
    origin_longitude: '',

    // Lokasi Tujuan (Destination)
    destination_name: '',
    destination_pic_name: '',
    destination_pic_phone: '',
    destination_address: '',
    destination_latitude: '',
    destination_longitude: '',

    // Rincian Item Barang
    items: [
      { item_code: '', item_name: '', quantity_order: 1, unit: 'Box', notes: '' }
    ]
  });

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'reference_number') setSearchFeedback(null);
  };

  // Fungsi pencarian ke Akurasi API / Backend Sync
  const handleSearchAkurasi = async () => {
    const ref = formData.reference_number.trim();
    if (!ref) {
      alert(`Silakan masukkan ${formData.task_type === 'delivery' ? 'Nomor SO' : 'Nomor PO'} terlebih dahulu.`);
      return;
    }

    setIsSearchingAkurasi(true);
    setSearchFeedback(null);

    try {
      const isSO = formData.task_type === 'delivery';
      const endpoint = isSO 
        ? `/api/akurasi/sales-orders?ref=${encodeURIComponent(ref)}` 
        : `/api/akurasi/pembelian?ref=${encodeURIComponent(ref)}`;

      const res = await fetch(endpoint);
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success && json?.data?.length > 0) {
        const result = json.data[0];

        if (isSO) {
          setFormData(prev => ({
            ...prev,
            destination_name: result.nama_pelanggan || prev.destination_name,
            destination_address: result.shipto || prev.destination_address,
            destination_pic_name: result.nama_salesman ? `Kontak Sales: ${result.nama_salesman}` : prev.destination_pic_name,
            items: result.items && result.items.length > 0 
              ? result.items.map(item => ({
                  item_code: item.no_barang || '',
                  item_name: item.deskripsi_barang || '',
                  quantity_order: item.sisa_kirim > 0 ? item.sisa_kirim : item.qty,
                  unit: item.uom || 'Pcs',
                  notes: `PO Cust: ${result.no_po_customer || '-'}`
                }))
              : prev.items
          }));
          setSearchFeedback({ type: 'success', message: `Data SO [${result.no_so}] ditemukan & dimuat dari Akurasi API!` });
        } else {
          setFormData(prev => ({
            ...prev,
            origin_name: result.nama_pemasok || prev.origin_name,
            origin_address: result.alamat_pemasok || prev.origin_address,
            items: result.items && result.items.length > 0
              ? result.items.map(item => ({
                  item_code: item.no_barang || '',
                  item_name: item.deskripsi_barang || '',
                  quantity_order: item.qty,
                  unit: item.uom || 'Pcs',
                  notes: 'Sesuai Purchase Order'
                }))
              : prev.items
          }));
          setSearchFeedback({ type: 'success', message: `Data PO [${result.no_po}] ditemukan & dimuat dari Akurasi API!` });
        }
      } else {
        // Fallback jika belum konek / demo
        setSearchFeedback({ 
          type: 'error', 
          message: json?.message || `Data ${isSO ? 'SO' : 'PO'} "${ref}" tidak ditemukan di Akurasi API.` 
        });
      }
    } catch (err) {
      console.error('Error lookup akurasi:', err);
      setSearchFeedback({ type: 'error', message: 'Gagal terhubung ke endpoint /api/akurasi.' });
    } finally {
      setIsSearchingAkurasi(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { item_code: '', item_name: '', quantity_order: 1, unit: 'Box', notes: '' }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.reference_number.trim()) {
      alert('Nomor Referensi (SO / PO) wajib diisi');
      return;
    }
    if (!formData.destination_name.trim()) {
      alert('Nama Tujuan / Pelanggan wajib diisi');
      return;
    }
    if (!formData.destination_address.trim()) {
      alert('Alamat Tujuan wajib diisi');
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
              formData.task_type === 'delivery' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
            }`}>
              {formData.task_type === 'delivery' ? (
                <ArrowUpRight className="w-6 h-6" />
              ) : (
                <ArrowDownLeft className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Buat Tugas Logistik Baru
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Input penugasan dokumen SO/PO ke antrean pool driver
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs sm:text-sm">
          {/* TIPE TUGAS & TANGGAL RENCANA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Jenis Tugas
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('task_type', 'delivery')}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                    formData.task_type === 'delivery'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" /> Delivery
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('task_type', 'pickup')}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                    formData.task_type === 'pickup'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" /> Pickup
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Rencana Tanggal Berangkat
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={formData.dispatch_date}
                  onChange={(e) => handleChange('dispatch_date', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Jangkauan Rute
              </label>
              <label className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all h-[38px]">
                <input
                  type="checkbox"
                  checked={formData.is_out_of_city}
                  onChange={(e) => handleChange('is_out_of_city', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-bold text-slate-800 text-xs">
                  Pengiriman Luar Kota (Multi-day)
                </span>
              </label>
            </div>
          </div>

          {/* DOKUMEN REFERENSI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  No Referensi Pesanan ({formData.task_type === 'delivery' ? 'No SO' : 'No PO'}) <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Terkoneksi Akurasi API
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={formData.task_type === 'delivery' ? 'Contoh: SO-2026-0901' : 'Contoh: PO-AQPA-0450'}
                    value={formData.reference_number}
                    onChange={(e) => handleChange('reference_number', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchAkurasi();
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 text-xs sm:text-sm"
                  />
                </div>
                <button
                  type="button"
                  disabled={isSearchingAkurasi}
                  onClick={handleSearchAkurasi}
                  className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs sm:text-sm ${
                    isSearchingAkurasi
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95'
                  }`}
                >
                  {isSearchingAkurasi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mencari...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Cari</span>
                    </>
                  )}
                </button>
              </div>

              {searchFeedback && (
                <div className={`mt-1.5 text-[11px] font-semibold flex items-center gap-1.5 ${
                  searchFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {searchFeedback.type === 'success' ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{searchFeedback.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                No DO Easy / Surat Jalan Accurate
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Contoh: DO-EASY-9942 (Opsional)"
                  value={formData.do_easy}
                  onChange={(e) => handleChange('do_easy', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* LOKASI AWAL VS LOKASI TUJUAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LOKASI ASAL (ORIGIN) */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800 font-extrabold text-xs uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-amber-600" />
                Lokasi Asal (Origin / Pickup Point)
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Tempat / Vendor / Gudang</label>
                <input
                  type="text"
                  placeholder="Nama Gudang / Asal Barang"
                  value={formData.origin_name}
                  onChange={(e) => handleChange('origin_name', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama PIC Asal</label>
                  <input
                    type="text"
                    placeholder="Nama PIC"
                    value={formData.origin_pic_name}
                    onChange={(e) => handleChange('origin_pic_name', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">No Telp PIC Asal</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx"
                    value={formData.origin_pic_phone}
                    onChange={(e) => handleChange('origin_pic_phone', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Alamat Lengkap Asal</label>
                <textarea
                  rows={2}
                  placeholder="Alamat asal pengambilan barang..."
                  value={formData.origin_address}
                  onChange={(e) => handleChange('origin_address', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* LOKASI TUJUAN (DESTINATION) */}
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/20 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-blue-100 text-blue-900 font-extrabold text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-blue-600" />
                Lokasi Tujuan (Customer / Destination Point)
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nama Customer / Penerima <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Indofood CBP Sukses Makmur"
                  value={formData.destination_name}
                  onChange={(e) => handleChange('destination_name', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama PIC Penerima</label>
                  <input
                    type="text"
                    placeholder="Nama PIC Penerima"
                    value={formData.destination_pic_name}
                    onChange={(e) => handleChange('destination_pic_name', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">No HP PIC Penerima</label>
                  <input
                    type="text"
                    placeholder="0813-xxxx"
                    value={formData.destination_pic_phone}
                    onChange={(e) => handleChange('destination_pic_phone', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Alamat Lengkap Tujuan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Alamat tujuan pengantaran (akan dibuka supir di Google Maps)..."
                  value={formData.destination_address}
                  onChange={(e) => handleChange('destination_address', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* RINCIAN ITEM BARANG */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2 font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                <Package className="w-4 h-4 text-blue-600" />
                Rincian Muatan Barang
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-all border border-blue-200"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Item
              </button>
            </div>

            <div className="space-y-2">
              {formData.items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Kode Barang (Accurate)"
                      value={item.item_code}
                      onChange={(e) => handleItemChange(idx, 'item_code', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      required
                      placeholder="Nama Barang / Muatan *"
                      value={item.item_name}
                      onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity_order}
                      onChange={(e) => handleItemChange(idx, 'quantity_order', parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 text-center"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-xs focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Box">Box</option>
                      <option value="Karton">Karton</option>
                      <option value="Pallet">Pallet</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Roll">Roll</option>
                      <option value="Kg">Kg</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1 flex justify-center">
                    <button
                      type="button"
                      disabled={formData.items.length === 1}
                      onClick={() => handleRemoveItem(idx)}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all ${
                        formData.items.length === 1 ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CATATAN PENGIRIMAN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan Instruksi untuk Driver
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Wajib bawa APD rompi dan helm proyek, lapor satpam pos timur..."
              value={formData.departure_notes}
              onChange={(e) => handleChange('departure_notes', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              Simpan ke Antrean Pool
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
