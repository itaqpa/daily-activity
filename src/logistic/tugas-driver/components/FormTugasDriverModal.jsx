import React, { useState, useEffect } from 'react';
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
  Check,
  Paperclip,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { apiUrl } from '../../../api';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val || 0);
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function FormTugasDriverModal({ isOpen, onClose, onSubmit, initialData = null }) {
  const [isSearchingAkurasi, setIsSearchingAkurasi] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
  const [formData, setFormData] = useState({
    task_type: 'delivery', // 'delivery' atau 'pickup'
    reference_number: '',  // No SO atau No PO
    do_easy: '',           // No DO Easy / Surat Jalan
    is_out_of_city: false,
    dispatch_date: new Date().toISOString().split('T')[0],
    departure_notes: '',
    attachments: [],       // File / Dokumen lampiran (Surat Jalan, Bukti PO/SO, Nota, dll)

    // Lokasi Asal (Origin)
    origin_name: '',
    origin_pic_name: '',
    origin_pic_phone: '',
    origin_address: '',
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
      { item_code: '', item_name: '', quantity_order: 1, unit: '', unit_price: 0, notes: '' }
    ]
  });

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        task_type: (initialData.tipe || initialData.task_type || 'delivery').toLowerCase(),
        reference_number: initialData.nomor_ref || initialData.reference_number || '',
        do_easy: initialData.do_easy && initialData.do_easy !== '-' ? initialData.do_easy : '',
        is_out_of_city: Boolean(initialData.is_out_of_city),
        dispatch_date: initialData.tanggal_penugasan || initialData.dispatch_date || new Date().toISOString().split('T')[0],
        departure_notes: initialData.departure_notes || '',
        attachments: initialData.attachments || [],

        // Lokasi Asal
        origin_name: initialData.origin_name || initialData.lokasi_awal || '',
        origin_pic_name: initialData.origin_pic_name || '',
        origin_pic_phone: initialData.origin_pic_phone || '',
        origin_address: initialData.origin_address || '',
        origin_latitude: initialData.origin_latitude || '',
        origin_longitude: initialData.origin_longitude || '',

        // Lokasi Tujuan
        destination_name: initialData.destination_name || initialData.lokasi_tujuan || initialData.customer_vendor || '',
        destination_pic_name: initialData.destination_pic_name || '',
        destination_pic_phone: initialData.destination_pic_phone || '',
        destination_address: initialData.destination_address || '',
        destination_latitude: initialData.destination_latitude || '',
        destination_longitude: initialData.destination_longitude || '',

        // Rincian Item Barang
        items: initialData.items && initialData.items.length > 0
          ? initialData.items
          : [
              {
                item_code: '',
                item_name: initialData.item_description || '',
                quantity_order: 1,
                unit: '',
                unit_price: 0,
                notes: ''
              }
            ]
      });
      setSearchFeedback(null);
    } else {
      setFormData({
        task_type: 'delivery',
        reference_number: '',
        do_easy: '',
        is_out_of_city: false,
        dispatch_date: new Date().toISOString().split('T')[0],
        departure_notes: '',
        attachments: [],

        origin_name: '',
        origin_pic_name: '',
        origin_pic_phone: '',
        origin_address: '',
        origin_latitude: '',
        origin_longitude: '',

        destination_name: '',
        destination_pic_name: '',
        destination_pic_phone: '',
        destination_address: '',
        destination_latitude: '',
        destination_longitude: '',

        items: [
          { item_code: '', item_name: '', quantity_order: 1, unit: '', unit_price: 0, notes: '' }
        ]
      });
      setSearchFeedback(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'reference_number') setSearchFeedback(null);
  };

  const handleTaskTypeChange = (newType) => {
    if (newType === formData.task_type) return;

    setSearchFeedback(null);
    setFormData(prev => ({
      ...prev,
      task_type: newType,
      reference_number: '',
      do_easy: '',
      departure_notes: '',
      attachments: [],

      // Reset Lokasi Asal (Origin)
      origin_name: '',
      origin_pic_name: '',
      origin_pic_phone: '',
      origin_address: '',
      origin_latitude: '',
      origin_longitude: '',

      // Reset Lokasi Tujuan (Destination)
      destination_name: '',
      destination_pic_name: '',
      destination_pic_phone: '',
      destination_address: '',
      destination_latitude: '',
      destination_longitude: '',

      // Reset Rincian Muatan Barang
      items: [
        { item_code: '', item_name: '', quantity_order: 1, unit: 'Box', unit_price: 0, notes: '' }
      ]
    }));
  };

  // Handler Upload Berkas Lampiran
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      // Validasi ukuran maks 5MB per berkas agar localStorage aman
      if (file.size > 5 * 1024 * 1024) {
        alert(`Ukuran berkas "${file.name}" (${formatFileSize(file.size)}) melebihi batas 5 MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl: event.target.result,
          uploaded_at: new Date().toISOString()
        };

        setFormData(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveAttachment = (attId) => {
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== attId)
    }));
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
      const primaryUrl = isSO 
        ? apiUrl(`akurasi/sales-orders?ref=${encodeURIComponent(ref)}`)
        : apiUrl(`akurasi/pembelian?ref=${encodeURIComponent(ref)}`);

      let res = await fetch(primaryUrl);
      let json = await res.json().catch(() => null);
      let activeIsSO = isSO;

      // Smart Auto-Fallback: Jika tidak ditemukan di tipe yang dipilih (misal user pilih Pickup padahal AI-PP adalah SO, atau sebaliknya)
      if ((!res.ok || !json?.success || !json?.data?.length) && ref.length >= 3) {
        const fallbackUrl = isSO
          ? apiUrl(`akurasi/pembelian?ref=${encodeURIComponent(ref)}`)
          : apiUrl(`akurasi/sales-orders?ref=${encodeURIComponent(ref)}`);

        try {
          const fallbackRes = await fetch(fallbackUrl);
          const fallbackJson = await fallbackRes.json().catch(() => null);
          if (fallbackRes.ok && fallbackJson?.success && fallbackJson?.data?.length > 0) {
            res = fallbackRes;
            json = fallbackJson;
            activeIsSO = !isSO;
          }
        } catch {
          // Fallback check silent fail
        }
      }

      if (res.ok && json?.success && json?.data?.length > 0) {
        const result = json.data[0];

        if (activeIsSO) {
          setFormData(prev => ({
            ...prev,
            task_type: 'delivery',
            reference_number: result.no_so || prev.reference_number,
            destination_name: result.nama_pelanggan || prev.destination_name,
            destination_address: result.shipto || prev.destination_address,
            destination_pic_name: result.nama_salesman ? `Kontak Sales: ${result.nama_salesman}` : prev.destination_pic_name,
            items: result.items && result.items.length > 0 
              ? result.items.map(item => ({
                  item_code: item.no_barang || '',
                  item_name: item.deskripsi_barang || '',
                  quantity_order: item.sisa_kirim > 0 ? item.sisa_kirim : item.qty,
                  unit: item.uom || '',
                  unit_price: parseFloat(item.unit_price) || 0,
                  notes: `PO Cust: ${result.no_po_customer || '-'}`
                }))
              : prev.items
          }));
          const switchNote = !isSO ? ' (Tipe tugas otomatis diubah ke Delivery)' : '';
          setSearchFeedback({ 
            type: 'success', 
            message: `Data SO [${result.no_so}] ditemukan & dimuat dari Akurasi API!${switchNote}` 
          });
        } else {
          setFormData(prev => ({
            ...prev,
            task_type: 'pickup',
            reference_number: result.no_po || prev.reference_number,
            origin_name: result.nama_pemasok || prev.origin_name,
            origin_address: result.alamat_pemasok || prev.origin_address,
            items: result.items && result.items.length > 0
              ? result.items.map(item => ({
                  item_code: item.no_barang || '',
                  item_name: item.deskripsi_barang || '',
                  quantity_order: item.qty,
                  unit: item.uom || '',
                  unit_price: parseFloat(item.unit_price) || 0,
                  notes: 'Sesuai Purchase Order'
                }))
              : prev.items
          }));
          const switchNote = isSO ? ' (Tipe tugas otomatis diubah ke Pickup)' : '';
          setSearchFeedback({ 
            type: 'success', 
            message: `Data PO [${result.no_po}] ditemukan & dimuat dari Akurasi API!${switchNote}` 
          });
        }
      } else {
        setSearchFeedback({ 
          type: 'error', 
          message: json?.message || `Data "${ref}" tidak ditemukan di Akurasi API (baik di SO Penjualan maupun PO Pembelian).` 
        });
      }
    } catch (err) {
      console.error('Error lookup akurasi:', err);
      setSearchFeedback({ type: 'error', message: 'Gagal terhubung ke endpoint Akurasi API.' });
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
        { item_code: '', item_name: '', quantity_order: 1, unit: '', unit_price: 0, notes: '' }
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

  const totalQtyKeseluruhan = formData.items.reduce(
    (sum, item) => sum + (parseFloat(item.quantity_order) || 0),
    0
  );
  const totalHargaKeseluruhan = formData.items.reduce(
    (sum, item) => sum + ((parseFloat(item.quantity_order) || 0) * (parseFloat(item.unit_price) || 0)),
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.reference_number.trim()) {
      alert('Nomor Referensi (SO / PO) wajib diisi');
      return;
    }
    if (!formData.origin_name.trim()) {
      alert('Nama Lokasi Asal (Origin) wajib diisi');
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
      onSubmit({
        ...formData,
        total_quantity: totalQtyKeseluruhan,
        total_price: totalHargaKeseluruhan
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-5">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
              formData.task_type === 'delivery' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
            }`}>
              {formData.task_type === 'delivery' ? (
                <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <ArrowDownLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                {initialData ? `Edit: ${formData.reference_number || initialData.nomor_ref}` : 'Buat Tugas Logistik Baru'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                {initialData ? 'Perbarui data rute, instruksi, dan muatan' : 'Input penugasan dokumen ke antrean pool driver'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center shrink-0 transition-all"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 flex-1 text-xs sm:text-sm">
          {/* TIPE TUGAS & TANGGAL RENCANA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Jenis Tugas
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTaskTypeChange('delivery')}
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
                  onClick={() => handleTaskTypeChange('pickup')}
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
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nama Tempat / Vendor / Gudang Asal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Asal Muat / Vendor / Lokasi Penjemputan"
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
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Alamat Lengkap Asal <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Alamat lengkap asal pengambilan / muat barang..."
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

            {/* Header Kolom Desktop */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">Kode Barang</div>
              <div className="col-span-3">Nama Muatan Barang</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-1 text-center">Satuan</div>
              <div className="col-span-2 text-right">Harga Satuan</div>
              <div className="col-span-2 text-right">Total Harga</div>
              <div className="col-span-1 text-center">Aksi</div>
            </div>

            <div className="space-y-2">
              {formData.items.map((item, idx) => {
                const qty = parseFloat(item.quantity_order) || 0;
                const unitPrice = parseFloat(item.unit_price) || 0;
                const subtotal = qty * unitPrice;

                return (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-2">
                      <span className="block sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-0.5">Kode Barang</span>
                      <input
                        type="text"
                        placeholder="Kode Barang"
                        value={item.item_code}
                        onChange={(e) => handleItemChange(idx, 'item_code', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <span className="block sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-0.5">Nama Muatan *</span>
                      <input
                        type="text"
                        required
                        placeholder="Nama Barang / Muatan *"
                        value={item.item_name}
                        onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <span className="block sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-0.5">Qty</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Qty"
                        value={item.quantity_order}
                        onChange={(e) => handleItemChange(idx, 'quantity_order', parseFloat(e.target.value) || 0)}
                        className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 text-center"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <span className="block sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-0.5">Satuan</span>
                      <input
                        type="text"
                        placeholder="Satuan"
                        value={item.unit || ''}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-xs focus:ring-2 focus:ring-blue-500 text-center"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-0.5">Harga Satuan (Rp)</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">Rp</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={item.unit_price || ''}
                          onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 text-right"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total Harga</span>
                      <div className="w-full px-2 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs text-right truncate">
                        {formatCurrency(subtotal)}
                      </div>
                    </div>
                    <div className="sm:col-span-1 flex justify-center">
                      <button
                        type="button"
                        disabled={formData.items.length === 1}
                        onClick={() => handleRemoveItem(idx)}
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all ${
                          formData.items.length === 1 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="Hapus baris item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Summary Footer */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/30 to-emerald-50/40 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 text-slate-600">
                <span className="font-medium">Total Item: <strong className="text-slate-900 font-extrabold">{formData.items.length}</strong> jenis</span>
                <span className="font-medium">Total Kuantitas: <strong className="text-blue-700 font-extrabold">{totalQtyKeseluruhan}</strong> unit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">Total Nilai Muatan:</span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-700 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-sm">
                  {formatCurrency(totalHargaKeseluruhan)}
                </span>
              </div>
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

          {/* DOKUMEN & LAMPIRAN TUGAS (ATTACHMENTS) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                Upload Dokumen & Lampiran Tugas (Attachments)
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                {(formData.attachments || []).length} Berkas Terlampir
              </span>
            </div>

            {/* Drop / Upload Button Container */}
            <div className="p-4 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 rounded-2xl bg-slate-50/60 transition-all flex flex-col items-center justify-center text-center">
              <input
                type="file"
                id="task-attachments-input"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="task-attachments-input"
                className="cursor-pointer flex flex-col items-center group w-full"
              >
                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-50 transition-all mb-1.5">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                  Klik untuk Unggah Foto / Berkas Lampiran
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Foto Surat Jalan, PO/SO Customer, Bukti Timbangan, Nota (JPG, PNG, PDF maks. 5MB)
                </span>
              </label>
            </div>

            {/* Attached Files List */}
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                {formData.attachments.map((att) => {
                  const isImage = att.type?.startsWith('image/') || att.dataUrl?.startsWith('data:image/');
                  return (
                    <div
                      key={att.id}
                      className="relative flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-sm"
                    >
                      {/* Thumbnail or File Icon */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-100">
                        {isImage ? (
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="w-5 h-5 text-red-500" />
                        )}
                      </div>

                      {/* File Details */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate" title={att.name}>
                          {att.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {formatFileSize(att.size)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                        title="Hapus berkas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 sm:gap-3 bg-white sticky bottom-0 z-10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all text-xs sm:text-sm text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-2 sm:flex-initial px-4 sm:px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-lg shadow-blue-500/25 active:scale-95 transition-all text-xs sm:text-sm text-center"
            >
              {initialData ? 'Simpan Perubahan' : 'Simpan ke Antrean Pool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
