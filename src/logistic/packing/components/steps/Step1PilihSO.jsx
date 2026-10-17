import React, { useState } from 'react';
import {
  Search,
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  Building,
  MapPin,
  Check
} from 'lucide-react';

export default function Step1PilihSO({
  formData,
  setFormData,
  onSearchSO,
  isSearchingAkurasi
}) {
  const [selectedItemTemp, setSelectedItemTemp] = useState('');
  const [qtyItemTemp, setQtyItemTemp] = useState('');
  const [showManualSection, setShowManualSection] = useState(false);

  // Form input manual jika SO tidak ditemukan di API
  const [manualData, setManualData] = useState({
    so: '',
    customer: '',
    part_no: '',
    deskripsi: '',
    qty: 1
  });

  const handleSearchClick = async () => {
    const ref = formData.so_number.trim();
    if (!ref) {
      alert('Silakan masukkan nomor Sales Order (SO) terlebih dahulu.');
      return;
    }

    if (onSearchSO) {
      const result = await onSearchSO(ref);
      if (result) {
        setFormData(prev => ({
          ...prev,
          customer: result.nama_pelanggan || prev.customer,
          alamat_shipto: result.shipto || prev.alamat_shipto,
          so_available_items: result.items || [],
          items: prev.items.length > 0 ? prev.items : (result.items || []).map(i => ({
            so_number: ref,
            customer: result.nama_pelanggan || prev.customer,
            item_code: i.kode_barang || i.item_code || 'ITM-01',
            item_name: i.deskripsi_barang || i.item_name || '-',
            qty: i.sisa_kirim || i.qty || 1,
            qty_order: i.qty || 0,
            sisa_kirim: i.sisa_kirim || i.qty || 0,
            uom: i.uom || 'Pcs'
          }))
        }));
      } else {
        setShowManualSection(true);
      }
    }
  };

  const handleAddItemFromDropdown = () => {
    if (!selectedItemTemp) {
      alert('Pilih barang terlebih dahulu');
      return;
    }
    const qty = parseInt(qtyItemTemp) || 1;
    const found = (formData.so_available_items || []).find(
      i => (i.kode_barang || i.item_code) === selectedItemTemp
    );

    if (found) {
      const newItem = {
        so_number: formData.so_number,
        customer: formData.customer || '-',
        item_code: found.kode_barang || found.item_code,
        item_name: found.deskripsi_barang || found.item_name,
        qty: qty,
        qty_order: found.qty || qty,
        sisa_kirim: found.sisa_kirim || qty,
        uom: found.uom || 'Pcs'
      };

      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));

      setSelectedItemTemp('');
      setQtyItemTemp('');
    }
  };

  const handleAddManualItem = () => {
    if (!manualData.so || !manualData.part_no) {
      alert('Nomor SO dan Part No wajib diisi.');
      return;
    }

    const newItem = {
      so_number: manualData.so,
      customer: manualData.customer || '-',
      item_code: manualData.part_no,
      item_name: manualData.deskripsi || '-',
      qty: parseInt(manualData.qty) || 1,
      qty_order: parseInt(manualData.qty) || 1,
      sisa_kirim: parseInt(manualData.qty) || 1,
      uom: 'Pcs'
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
      customer: prev.customer || manualData.customer,
      so_number: prev.so_number || manualData.so
    }));

    setManualData({
      so: '',
      customer: '',
      part_no: '',
      deskripsi: '',
      qty: 1
    });
    setShowManualSection(false);
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleUpdateQty = (index, val) => {
    const qty = Math.max(1, parseInt(val) || 1);
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((it, idx) => idx === index ? { ...it, qty } : it)
    }));
  };

  return (
    <div className="space-y-4">
      {/* Box Pencarian SO */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Cari Dokumen Sales Order
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowManualSection(!showManualSection)}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 underline"
          >
            {showManualSection ? 'Tutup Input Manual' : '+ Input Manual'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Nomor Sales Order <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.so_number}
                onChange={(e) => setFormData(p => ({ ...p, so_number: e.target.value }))}
                placeholder="Cth: AI-PP-261840 atau SO..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleSearchClick}
              disabled={isSearchingAkurasi}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isSearchingAkurasi ? 'Menarik...' : 'Tarik Data'}</span>
            </button>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Pilih Barang dari SO
            </label>
            <select
              value={selectedItemTemp}
              onChange={(e) => setSelectedItemTemp(e.target.value)}
              disabled={!formData.so_available_items || formData.so_available_items.length === 0}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {formData.so_available_items?.length > 0 ? '-- Pilih Barang --' : '-- Tarik SO terlebih dahulu --'}
              </option>
              {(formData.so_available_items || []).map((it, i) => (
                <option key={i} value={it.kode_barang || it.item_code}>
                  {it.kode_barang || it.item_code} - {it.deskripsi_barang || it.item_name} (Sisa: {it.sisa_kirim || it.qty})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex gap-1.5">
            <input
              type="number"
              min="1"
              placeholder="Qty"
              value={qtyItemTemp}
              onChange={(e) => setQtyItemTemp(e.target.value)}
              className="w-16 px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddItemFromDropdown}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center"
              title="Tambah ke list"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ringkasan Data Customer */}
        {formData.customer && (
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-900">{formData.customer}</span>
            </div>
            {formData.alamat_shipto && (
              <div className="flex items-center gap-1.5 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500">Alamat Kirim:</span>
                <span className="font-medium text-slate-800 truncate max-w-sm">{formData.alamat_shipto}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Manual Box */}
      {showManualSection && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <span className="text-xs font-bold text-slate-800 block">
            Form Input Barang Manual
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">No SO *</label>
              <input
                type="text"
                placeholder="No SO"
                value={manualData.so}
                onChange={(e) => setManualData(p => ({ ...p, so: e.target.value }))}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Customer *</label>
              <input
                type="text"
                placeholder="Nama Customer"
                value={manualData.customer}
                onChange={(e) => setManualData(p => ({ ...p, customer: e.target.value }))}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Part No *</label>
              <input
                type="text"
                placeholder="Kode Barang"
                value={manualData.part_no}
                onChange={(e) => setManualData(p => ({ ...p, part_no: e.target.value }))}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Deskripsi</label>
              <input
                type="text"
                placeholder="Deskripsi Barang"
                value={manualData.deskripsi}
                onChange={(e) => setManualData(p => ({ ...p, deskripsi: e.target.value }))}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
              />
            </div>
            <div className="flex items-end gap-1">
              <div className="w-16">
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={manualData.qty}
                  onChange={(e) => setManualData(p => ({ ...p, qty: e.target.value }))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono text-center font-bold"
                />
              </div>
              <button
                type="button"
                onClick={handleAddManualItem}
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabel Barang yang Dipacking */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Daftar Barang Packaging ({formData.items.length} Item)
          </span>
          {formData.items.length === 0 && (
            <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Pilih minimal 1 barang
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">No SO</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Part No / Kode</th>
                <th className="py-2.5 px-3">Deskripsi Barang</th>
                <th className="py-2.5 px-3 text-center w-28">Qty Kemas</th>
                <th className="py-2.5 px-3 text-center w-14">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {formData.items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <p className="font-medium text-xs">Belum ada barang dipilih.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Ketik Nomor SO di atas lalu klik "Tarik Data" untuk memasukkan barang pesanan.
                    </p>
                  </td>
                </tr>
              ) : (
                formData.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                      {item.so_number || formData.so_number || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {item.customer || formData.customer || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                      {item.item_code}
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 font-medium">
                      {item.item_name}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleUpdateQty(idx, e.target.value)}
                        className="w-20 px-2 py-1 text-center font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors"
                        title="Hapus barang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
