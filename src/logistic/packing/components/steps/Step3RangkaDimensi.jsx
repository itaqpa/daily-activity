import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Plus,
  Trash2
} from 'lucide-react';

export default function Step3RangkaDimensi({ formData, setFormData }) {
  // Collapsible accordion state
  const [openSections, setOpenSections] = useState({
    dataUtama: true,
    dimensi: true,
    innerBox: false,
    areaBawah: true,
    areaAtas: true
  });

  const toggleSection = (sec) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const isPalet = formData.type_packaging === 'Palet';
  const isKerangka = formData.type_packaging === 'Kerangka';

  // Helper change
  const handleChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  // Kalkulasi estimasi volume (m3)
  const volumeM3 = ((formData.panjang * formData.lebar * formData.tinggi) / 1000000000).toFixed(3);

  // Inner Box Handlers
  const handleAddInnerBox = () => {
    const newBox = {
      name: `Box #${formData.inner_carton_boxes.length + 1}`,
      length: 400,
      width: 300,
      height: 250,
      qty: 1
    };
    setFormData(prev => ({
      ...prev,
      inner_carton_boxes: [...prev.inner_carton_boxes, newBox]
    }));
  };

  const handleUpdateInnerBox = (idx, field, value) => {
    setFormData(prev => ({
      ...prev,
      inner_carton_boxes: prev.inner_carton_boxes.map((b, i) =>
        i === idx ? { ...b, [field]: value } : b
      )
    }));
  };

  const handleRemoveInnerBox = (idx) => {
    setFormData(prev => ({
      ...prev,
      inner_carton_boxes: prev.inner_carton_boxes.filter((_, i) => i !== idx)
    }));
  };

  return (
    <div className="space-y-4 text-xs">
      {/* 1. DATA UTAMA PACKAGING */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div
          onClick={() => toggleSection('dataUtama')}
          className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none"
        >
          <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
            1. Data Utama Packaging
          </span>
          {openSections.dataUtama ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {openSections.dataUtama && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Packaging Number
              </label>
              <input
                type="text"
                disabled
                value={formData.packaging_number}
                className="w-full px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 font-mono font-bold text-slate-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Packer Leader
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={formData.packer_name}
                  onChange={(e) => handleChange('packer_name', e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white rounded-lg border border-slate-300 font-medium text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Bpk. Supriyanto (Leader)">Bpk. Supriyanto (Leader)</option>
                  <option value="Bpk. Haryanto">Bpk. Haryanto (Senior)</option>
                  <option value="Bpk. Budi Santoso">Bpk. Budi Santoso</option>
                  <option value="Tim Packaging Reguler">Tim Packaging Reguler</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Target Selesai Packaging
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={formData.packaging_date}
                  onChange={(e) => handleChange('packaging_date', e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white rounded-lg border border-slate-300 font-medium text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. DIMENSI KEMASAN LUAR */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div
          onClick={() => toggleSection('dimensi')}
          className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
              2. Dimensi Luar Kemasan
            </span>
            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Volume: {volumeM3} m³
            </span>
          </div>
          {openSections.dimensi ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {openSections.dimensi && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Panjang Luar (mm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="100"
                value={formData.panjang}
                onChange={(e) => handleChange('panjang', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 font-mono font-bold text-slate-900 text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Lebar Luar (mm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="100"
                value={formData.lebar}
                onChange={(e) => handleChange('lebar', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 font-mono font-bold text-slate-900 text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tinggi Luar (mm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="100"
                value={formData.tinggi}
                onChange={(e) => handleChange('tinggi', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 font-mono font-bold text-slate-900 text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. KONFIGURASI AREA BAWAH */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div
          onClick={() => toggleSection('areaBawah')}
          className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none"
        >
          <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
            3. Konfigurasi Area Bawah (Floor & Kaki Forklift)
          </span>
          {openSections.areaBawah ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {openSections.areaBawah && (
          <div className="p-4 space-y-3">
            {/* Row Penyangga Bawah */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="sm:col-span-3">
                <span className="font-bold text-slate-800 block">Penyangga Bawah</span>
                <span className="text-[10px] text-slate-500">Balok penguat lantai</span>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Status</label>
                <select
                  value={formData.bawah_penyanggah}
                  onChange={(e) => handleChange('bawah_penyanggah', e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                >
                  <option value="Include">Include</option>
                  <option value="Exclude">Exclude</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Arah</label>
                <select
                  value={formData.bawah_penyanggah_arah}
                  onChange={(e) => handleChange('bawah_penyanggah_arah', e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                >
                  <option value="Horizontal">Horizontal</option>
                  <option value="Vertikal">Vertikal</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Material</label>
                <select
                  value={formData.bawah_penyanggah_material}
                  onChange={(e) => handleChange('bawah_penyanggah_material', e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                >
                  <option value="Balok Rimba 5x7 cm">Balok Rimba 5x7 cm</option>
                  <option value="Balok Rimba 6x12 cm">Balok Rimba 6x12 cm</option>
                  <option value="Balok Meranti 5x7 cm">Balok Meranti 5x7 cm</option>
                  <option value="Balok Pinus 4x6 cm">Balok Pinus 4x6 cm</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Jarak (mm)</label>
                <input
                  type="number"
                  value={formData.jarak_penyanggah_bawah}
                  onChange={(e) => handleChange('jarak_penyanggah_bawah', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-center"
                />
              </div>
            </div>

            {/* Row Penutup Bawah */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="sm:col-span-3">
                <span className="font-bold text-slate-800 block">Penutup Bawah</span>
                <span className="text-[10px] text-slate-500">Alas lantai kemasan</span>
              </div>
              <div className="sm:col-span-3">
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Tipe Penutup</label>
                <select
                  value={formData.bawah_penutup}
                  onChange={(e) => handleChange('bawah_penutup', e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                >
                  <option value="Papan Full">Papan Full (Rapat)</option>
                  <option value="Papan Setengah">Papan Setengah (Renggang)</option>
                  <option value="Tripleks">Tripleks / Plywood</option>
                  <option value="Tanpa Penutup">Tanpa Penutup</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Arah Pemasangan</label>
                <select
                  value={formData.bawah_penutup_arah || 'Horizontal'}
                  onChange={(e) => handleChange('bawah_penutup_arah', e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                >
                  <option value="Horizontal">Horizontal</option>
                  <option value="Vertikal">Vertikal</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Celah/Gap (mm)</label>
                <input
                  type="number"
                  value={formData.gap_bawah}
                  onChange={(e) => handleChange('gap_bawah', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-center"
                />
              </div>
            </div>

            {/* Row Kaki Balok Forklift */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="sm:col-span-3">
                <span className="font-bold text-slate-800 block">Kaki Balok Forklift</span>
                <span className="text-[10px] text-slate-500">Rongga garpu forklift</span>
              </div>
              <div className="sm:col-span-3">
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Status Kaki</label>
                <select
                  value={formData.bawah_kakibalok}
                  onChange={(e) => handleChange('bawah_kakibalok', e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                >
                  <option value="Include">Include (Kaki Balok)</option>
                  <option value="Exclude">Exclude (Tanpa Kaki)</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Arah Balok Kaki</label>
                <select
                  value={formData.bawah_kakibalok_arah || 'Vertikal'}
                  onChange={(e) => handleChange('bawah_kakibalok_arah', e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                >
                  <option value="Vertikal">Vertikal</option>
                  <option value="Horizontal">Horizontal</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Material</label>
                <select
                  value={formData.bawah_kakibalok_material || 'Balok Rimba 8x10 cm'}
                  onChange={(e) => handleChange('bawah_kakibalok_material', e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                >
                  <option value="Balok Rimba 8x10 cm">Balok Rimba 8x10 cm</option>
                  <option value="Balok Rimba 10x10 cm">Balok Rimba 10x10 cm</option>
                  <option value="Balok Meranti 8x8 cm">Balok Meranti 8x8 cm</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. KONFIGURASI AREA ATAS */}
      {!isPalet && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div
            onClick={() => toggleSection('areaAtas')}
            className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none"
          >
            <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
              4. Konfigurasi Area Atas (Roof & Penutup)
            </span>
            {openSections.areaAtas ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>

          {openSections.areaAtas && (
            <div className="p-4 space-y-3">
              {/* Row Penyangga Atas */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="sm:col-span-3">
                  <span className="font-bold text-slate-800 block">Penyangga Atas</span>
                  <span className="text-[10px] text-slate-500">Balok penguat atap</span>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Status</label>
                  <select
                    value={formData.atas_penyanggah || 'Include'}
                    onChange={(e) => handleChange('atas_penyanggah', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                  >
                    <option value="Include">Include</option>
                    <option value="Exclude">Exclude</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Arah</label>
                  <select
                    value={formData.atas_penyanggah_arah || 'Vertikal'}
                    onChange={(e) => handleChange('atas_penyanggah_arah', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                  >
                    <option value="Vertikal">Vertikal</option>
                    <option value="Horizontal">Horizontal</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Material</label>
                  <select
                    value={formData.atas_penyanggah_material || 'Balok Rimba 5x7 cm'}
                    onChange={(e) => handleChange('atas_penyanggah_material', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="Balok Rimba 5x7 cm">Balok Rimba 5x7 cm</option>
                    <option value="Balok Meranti 5x7 cm">Balok Meranti 5x7 cm</option>
                    <option value="Balok Pinus 4x6 cm">Balok Pinus 4x6 cm</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Jarak (mm)</label>
                  <input
                    type="number"
                    value={formData.jarak_penyanggah_atas}
                    onChange={(e) => handleChange('jarak_penyanggah_atas', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-center"
                  />
                </div>
              </div>

              {/* Row Penutup Atas */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="sm:col-span-3">
                  <span className="font-bold text-slate-800 block">Penutup Atas</span>
                  <span className="text-[10px] text-slate-500">
                    {isKerangka ? 'Terkunci tanpa penutup' : 'Tutup atas kemasan'}
                  </span>
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Tipe Penutup</label>
                  <select
                    disabled={isKerangka}
                    value={isKerangka ? 'Tanpa Penutup' : (formData.atas_penutup || 'Tanpa Penutup')}
                    onChange={(e) => handleChange('atas_penutup', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="Tanpa Penutup">Tanpa Penutup</option>
                    <option value="Papan Full">Papan Full (Rapat)</option>
                    <option value="Papan Setengah">Papan Setengah (Renggang)</option>
                    <option value="Tripleks">Tripleks / Plywood</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Arah Pemasangan</label>
                  <select
                    disabled={isKerangka}
                    value={formData.atas_penutup_arah || 'Horizontal'}
                    onChange={(e) => handleChange('atas_penutup_arah', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="Horizontal">Horizontal</option>
                    <option value="Vertikal">Vertikal</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Celah/Gap (mm)</label>
                  <input
                    type="number"
                    value={formData.gap_atas}
                    onChange={(e) => handleChange('gap_atas', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-center"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. INNER CARTON BOX */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div
          onClick={() => toggleSection('innerBox')}
          className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
              5. Susunan Inner Carton Box (Opsional)
            </span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
              {formData.inner_carton_boxes.length} Box
            </span>
          </div>
          {openSections.innerBox ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {openSections.innerBox && (
          <div className="p-4 space-y-3">
            {formData.inner_carton_boxes.map((box, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="text"
                  value={box.name}
                  onChange={(e) => handleUpdateInnerBox(idx, 'name', e.target.value)}
                  className="w-32 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                />
                <div className="flex items-center gap-1 font-mono text-xs">
                  <input
                    type="number"
                    value={box.length}
                    onChange={(e) => handleUpdateInnerBox(idx, 'length', parseInt(e.target.value) || 0)}
                    className="w-16 px-1.5 py-1 text-center bg-white border border-slate-300 rounded"
                    placeholder="P"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    value={box.width}
                    onChange={(e) => handleUpdateInnerBox(idx, 'width', parseInt(e.target.value) || 0)}
                    className="w-16 px-1.5 py-1 text-center bg-white border border-slate-300 rounded"
                    placeholder="L"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    value={box.height}
                    onChange={(e) => handleUpdateInnerBox(idx, 'height', parseInt(e.target.value) || 0)}
                    className="w-16 px-1.5 py-1 text-center bg-white border border-slate-300 rounded"
                    placeholder="T"
                  />
                  <span className="text-slate-400 text-[10px]">mm</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-semibold">Qty:</span>
                  <input
                    type="number"
                    min="1"
                    value={box.qty}
                    onChange={(e) => handleUpdateInnerBox(idx, 'qty', parseInt(e.target.value) || 1)}
                    className="w-12 px-1.5 py-1 text-center bg-white border border-slate-300 rounded font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveInnerBox(idx)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddInnerBox}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Ukuran Inner Box</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
