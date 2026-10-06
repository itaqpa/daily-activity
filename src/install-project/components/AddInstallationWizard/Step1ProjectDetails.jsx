import React, { useState, useEffect } from 'react';

export default function Step1ProjectDetails({ data, updateData }) {
  // Local state helper for Date computation
  const [tglMulai, setTglMulai] = useState(data.tgl_mulai || '');
  const [durasiHari, setDurasiHari] = useState(data.durasi_hari || 1);
  const [targetSelesai, setTargetSelesai] = useState('');

  // Hitung otomatis Target Selesai = tgl_mulai + durasi_hari - 1
  useEffect(() => {
    if (tglMulai && durasiHari) {
      const start = new Date(tglMulai);
      // tambah durasi (dikurangi 1 hari sesuai logic schema)
      start.setDate(start.getDate() + (parseInt(durasiHari) - 1));
      const formatted = start.toISOString().split('T')[0];
      setTargetSelesai(formatted);
    } else {
      setTargetSelesai('');
    }
  }, [tglMulai, durasiHari]);

  const formatRupiah = (value) => {
    if (!value) return '';
    // Jika value dari database mengandung desimal seperti "120000000.00", ambil angka utamanya saja
    const [wholePart] = value.toString().split('.');
    
    const numberString = wholePart.replace(/[^,\d]/g, '');
    const split = numberString.split(',');
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      const separator = sisa ? '.' : '';
      rupiah += separator + ribuan.join('.');
    }

    rupiah = split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
    return rupiah;
  };

  const handleCurrencyChange = (field, value) => {
    const rawValue = value.replace(/[^0-9]/g, '');
    handleChange(field, rawValue);
  };

  const handleChange = (field, value) => {
    updateData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-xl font-bold text-gray-800">1. Data Project</h2>
      <p className="text-sm text-gray-500 mb-6">Input informasi dasar dari project instalasi.</p>
      
      <div className="flex flex-col gap-4">
        
        {/* ROW 1: No Project, Nama Project (2 kolom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No Project</label>
            <input 
              type="text" 
              className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50/50 focus:bg-white" 
              placeholder="PRJ-2026-001" 
              value={data.no_project || ''}
              onChange={(e) => handleChange('no_project', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Project</label>
            <input 
              type="text" 
              className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50/50 focus:bg-white" 
              placeholder="Masukkan nama project"
              value={data.nama || ''}
              onChange={(e) => handleChange('nama', e.target.value)}
            />
          </div>
        </div>

        {/* ROW 2: Customer, Lokasi, Leader (3 kolom) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <input 
              type="text" 
              className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50/50 focus:bg-white" 
              placeholder="Nama Customer"
              value={data.customer || ''}
              onChange={(e) => handleChange('customer', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
            <input 
              type="text" 
              className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50/50 focus:bg-white" 
              placeholder="Lokasi Pengerjaan"
              value={data.lokasi || ''}
              onChange={(e) => handleChange('lokasi', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Leader</label>
            <input 
              type="text" 
              className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50/50 focus:bg-white" 
              placeholder="Nama Leader"
              value={data.leader || ''}
              onChange={(e) => handleChange('leader', e.target.value)}
            />
          </div>
        </div>

        {/* ROW 3: Tanggal Mulai, Durasi, Target Selesai (3 kolom) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
            <input 
              type="date" 
              className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50/50 focus:bg-white" 
              value={tglMulai}
              onChange={(e) => {
                setTglMulai(e.target.value);
                handleChange('tgl_mulai', e.target.value);
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (hari)</label>
            <input 
              type="number" 
              min="1"
              className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50/50 focus:bg-white" 
              value={durasiHari}
              onChange={(e) => {
                setDurasiHari(e.target.value);
                handleChange('durasi_hari', e.target.value);
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Selesai</label>
            <input 
              type="date" 
              disabled
              className="w-full border border-gray-200 rounded-xl p-3 bg-gray-100 text-gray-500 outline-none cursor-not-allowed" 
              value={targetSelesai}
            />
          </div>
        </div>

        {/* ROW 4: Nilai Kontrak, Budget Biaya (2 kolom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Kontrak (Rp)</label>
            <input 
              type="text" 
              className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50/50 focus:bg-white" 
              placeholder="0"
              value={formatRupiah(data.nilai_kontrak)}
              onChange={(e) => handleCurrencyChange('nilai_kontrak', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Biaya (Rp)</label>
            <input 
              type="text" 
              className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50/50 focus:bg-white" 
              placeholder="0"
              value={formatRupiah(data.budget_biaya)}
              onChange={(e) => handleCurrencyChange('budget_biaya', e.target.value)}
            />
          </div>
        </div>

        {/* ROW 5: Catatan (1 kolom full) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
          <textarea 
            rows="3"
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50/50 focus:bg-white" 
            placeholder="Catatan tambahan project..."
            value={data.catatan || ''}
            onChange={(e) => handleChange('catatan', e.target.value)}
          ></textarea>
        </div>

      </div>
    </div>
  );
}
