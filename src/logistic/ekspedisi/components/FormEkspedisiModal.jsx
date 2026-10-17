import React, { useState } from 'react';
import {
  X,
  Truck,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Layers,
  FileText,
  User,
  Phone,
  CheckCircle2,
  Clock,
  Search,
  Loader2,
  Check,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export default function FormEkspedisiModal({ isOpen, onClose, onSubmit, initialData = null }) {
  const [isSearchingAkurasi, setIsSearchingAkurasi] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState(null);

  const [formData, setFormData] = useState(initialData || {
    expedition_number: `EXP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
    task_type: 'delivery', // 'delivery' atau 'pickup'
    reference_number: '',  // No SO atau No PO
    do_easy: '',           // No DO Easy / Accurate
    customer_vendor_name: '',
    tracking_number: '',
    vendor_name: '',
    service_type: 'Cargo Darat',
    
    // Rute Asal
    origin_name: 'Gudang Logistik AQPA Cikarang',
    origin_address: 'Kawasan Industri GIIC Cikarang Pusat, Bekasi, Jawa Barat',
    origin_pic_name: 'Staff Gudang Logistik',
    origin_pic_phone: '0812-3456-7890',
    
    // Rute Tujuan
    destination_name: '',
    destination_address: '',
    receiver_pic_name: '',
    receiver_pic_phone: '',
    
    // Barang & Biaya
    item_description: '',
    total_colli: 1,
    weight_kg: '',
    cost_amount: '',
    payment_method: 'non_cod',
    
    // Waktu & Audit
    shipping_date: new Date().toISOString().split('T')[0],
    estimated_arrival_date: '',
    actual_arrival_date: '',
    status: 'on_delivery',
    proof_photo: '',
    notes: ''
  });

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'reference_number') setSearchFeedback(null);
  };

  // Pencarian ke Akurasi API untuk auto-populate alamat, pelanggan, dan barang muatan
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

        // Format deskripsi barang dari daftar item SO/PO
        const itemsSummary = (result.items || [])
          .map(i => `${i.deskripsi_barang || i.item_name} (${i.sisa_kirim > 0 ? i.sisa_kirim : i.qty} ${i.uom || 'Pcs'})`)
          .join(', ');

        if (isSO) {
          setFormData(prev => ({
            ...prev,
            customer_vendor_name: result.nama_pelanggan || prev.customer_vendor_name,
            destination_name: result.nama_pelanggan || prev.destination_name,
            destination_address: result.shipto || prev.destination_address,
            receiver_pic_name: result.nama_salesman ? `Sales: ${result.nama_salesman}` : prev.receiver_pic_name,
            item_description: itemsSummary || prev.item_description,
            total_colli: result.items?.length || prev.total_colli
          }));
          setSearchFeedback({ type: 'success', message: `Data SO [${result.no_so}] ditemukan! Alamat & Barang termuat otomatis.` });
        } else {
          setFormData(prev => ({
            ...prev,
            customer_vendor_name: result.nama_pemasok || prev.customer_vendor_name,
            origin_name: result.nama_pemasok || prev.origin_name,
            origin_address: result.alamat_pemasok || prev.origin_address,
            item_description: itemsSummary || prev.item_description,
            total_colli: result.items?.length || prev.total_colli
          }));
          setSearchFeedback({ type: 'success', message: `Data PO [${result.no_po}] ditemukan! Alamat Vendor & Barang termuat otomatis.` });
        }
      } else {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.reference_number.trim()) {
      alert('Nomor Referensi SO/PO wajib diisi.');
      return;
    }
    if (!formData.vendor_name.trim()) {
      alert('Nama Vendor Ekspedisi wajib diisi.');
      return;
    }
    if (!formData.destination_address.trim()) {
      alert('Tujuan Akhir (Alamat Penerima) wajib diisi.');
      return;
    }
    if (!formData.item_description.trim()) {
      alert('Deskripsi Barang muatan wajib diisi.');
      return;
    }
    if (formData.cost_amount === '' || isNaN(formData.cost_amount)) {
      alert('Harga / Biaya pengiriman wajib diisi angka.');
      return;
    }

    if (onSubmit) {
      onSubmit({
        ...formData,
        cost_amount: parseFloat(formData.cost_amount) || 0,
        weight_kg: parseFloat(formData.weight_kg) || 0,
        total_colli: parseInt(formData.total_colli) || 1
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {initialData ? 'Update Pengiriman Ekspedisi' : 'Buat Pengiriman via Vendor Ekspedisi'}
                </h2>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {formData.expedition_number}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Delegasi pengiriman SO/PO ke pihak ketiga (JNE, Dakota, Indah Cargo, Truk Sewaan)
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1 text-xs sm:text-sm">
          {/* TIPE TUGAS & PENCARIAN SO/PO AKURASI */}
          <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Jenis Bantuan Vendor:
                </span>
                <div className="inline-flex rounded-xl p-1 bg-white border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleChange('task_type', 'delivery')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                      formData.task_type === 'delivery'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> Delivery (SO)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('task_type', 'pickup')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                      formData.task_type === 'pickup'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" /> Pickup (PO)
                  </button>
                </div>
              </div>

              <span className="text-[10px] font-semibold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
                Terkoneksi API Akurasi
              </span>
            </div>

            {/* Kolom Pencarian SO/PO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor Referensi ({formData.task_type === 'delivery' ? 'No SO' : 'No PO'}) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder={formData.task_type === 'delivery' ? 'Misal: SO-2026-0901' : 'Misal: PO-AQPA-0450'}
                      value={formData.reference_number}
                      onChange={(e) => handleChange('reference_number', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchAkurasi();
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isSearchingAkurasi}
                    onClick={handleSearchAkurasi}
                    className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs ${
                      isSearchingAkurasi
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 active:scale-95'
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
                  Nomor DO Easy / Surat Jalan
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Contoh: DO-EASY-9941 (Opsional)"
                    value={formData.do_easy}
                    onChange={(e) => handleChange('do_easy', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: VENDOR EKSPEDISI & RESI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Vendor Ekspedisi / 3PL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="list-vendors"
                required
                placeholder="Pilih atau ketik vendor..."
                value={formData.vendor_name}
                onChange={(e) => handleChange('vendor_name', e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
              />
              <datalist id="list-vendors">
                <option value="Dakota Cargo">Dakota Cargo (Cargo Darat Rekanan)</option>
                <option value="JNE Trucking (JTR)">JNE Trucking / JTR (Reguler & Kargo)</option>
                <option value="Indah Logistik Cargo">Indah Logistik Cargo (Darat / Laut)</option>
                <option value="Sewa Truk / Armada Charter (Rekanan)">Sewa Truk / Charter CDD / Fuso</option>
                <option value="Baraka Sarana Tama (BST)">Baraka Sarana Tama (Kargo Darat)</option>
                <option value="KALOG (Kereta Api Logistik)">KALOG (Kereta Api Logistik)</option>
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nomor Resi / AWB Ekspedisi
              </label>
              <input
                type="text"
                placeholder="Nomor Resi Cargo (Opsional)"
                value={formData.tracking_number}
                onChange={(e) => handleChange('tracking_number', e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Layanan Ekspedisi
              </label>
              <select
                value={formData.service_type}
                onChange={(e) => handleChange('service_type', e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              >
                <option value="Cargo Darat">Cargo Darat (Truk / Kereta)</option>
                <option value="Cargo Laut">Cargo Laut (Kapal)</option>
                <option value="Cargo Udara">Cargo Udara (Pesawat)</option>
                <option value="Sewa Truk / FTL">Sewa Truk / Charter (FTL)</option>
                <option value="Reguler / Same Day">Reguler / Instant</option>
              </select>
            </div>
          </div>

          {/* SECTION 3: RUTE ASAL DAN TUJUAN AKHIR (AUTO-POPULATE DARI AKURASI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                Tujuan Asal (Pengirim) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nama Tempat / Pabrik Asal"
                value={formData.origin_name}
                onChange={(e) => handleChange('origin_name', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
              />
              <textarea
                rows={2}
                required
                placeholder="Alamat lengkap asal..."
                value={formData.origin_address}
                onChange={(e) => handleChange('origin_address', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/20 space-y-2">
              <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Tujuan Akhir (Pelanggan / Penerima) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nama Customer / Pelanggan Penerima"
                value={formData.destination_name}
                onChange={(e) => handleChange('destination_name', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-indigo-950"
              />
              <textarea
                rows={2}
                required
                placeholder="Alamat lengkap tujuan akhir (shipto)..."
                value={formData.destination_address}
                onChange={(e) => handleChange('destination_address', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* SECTION 4: MUATAN BARANG & BIAYA PENGIRIMAN */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Muatan Barang & Biaya Pengiriman Ekspedisi
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Deskripsi Barang Muatan (dari SO/PO) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Deskripsi barang muatan..."
                  value={formData.item_description}
                  onChange={(e) => handleChange('item_description', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Jml Koli
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.total_colli}
                  onChange={(e) => handleChange('total_colli', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-center focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Berat (Kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Kg"
                  value={formData.weight_kg}
                  onChange={(e) => handleChange('weight_kg', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-center focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Harga Ongkir (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Rp..."
                  value={formData.cost_amount}
                  onChange={(e) => handleChange('cost_amount', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-extrabold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: TANGGAL PENGIRIMAN & ESTIMASI TIBA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tgl Pengiriman (Kirim) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={formData.shipping_date}
                  onChange={(e) => handleChange('shipping_date', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Estimasi Datang (ETA)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={formData.estimated_arrival_date}
                  onChange={(e) => handleChange('estimated_arrival_date', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* STATUS & CATATAN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status Pengiriman
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="on_delivery">Dalam Pengiriman (On Delivery)</option>
                <option value="delivered">Terkirim / Selesai (Delivered)</option>
                <option value="returned">Retur / Dikembalikan</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan Khusus / Resi Fisik
              </label>
              <input
                type="text"
                placeholder="Catatan tambahan vendor, nomor kontak supir ekspedisi..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
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
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan Data Ekspedisi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
