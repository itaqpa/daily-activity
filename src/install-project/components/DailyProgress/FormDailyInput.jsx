import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { apiUrl } from '../../../api';

export default function FormDailyInput({ onBack, project }) {
  const [formData, setFormData] = useState({
    tanggal: '',
    area: '',
    unit: '',
    jamKerja: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  // Scopes array (diambil saat area & unit dipilih)
  const [scopes, setScopes] = useState([]);

  // Simulasi fetch data aktual ketika area & unit dipilih
  React.useEffect(() => {
    if (project && project.areas && formData.area && formData.unit) {
      const selectedArea = project.areas.find(a => a.id.toString() === formData.area);
      if (selectedArea) {
        const selectedUnit = selectedArea.units.find(u => u.id.toString() === formData.unit);
        if (selectedUnit && selectedUnit.scopes) {
          setScopes(selectedUnit.scopes.map(s => ({
            id: s.id,
            nama: s.nama_scope,
            bobot: parseFloat(s.bobot_unit || 0),
            capaianKemarin: parseFloat(s.capaian || 0),
            capaianHariIni: 0,
            jenis: s.tipe === 'planned' ? 'Utama' : (s.tipe === 'additional' ? 'Additional Job' : s.tipe)
          })));
          return;
        }
      }
    }
    // Kosongkan jika belum lengkap atau tidak ketemu
    setScopes([]);
  }, [project, formData.area, formData.unit]);

  // Derived state untuk opsi dropdown Unit
  const availableUnits = React.useMemo(() => {
    if (!project || !project.areas || !formData.area) return [];
    const selectedArea = project.areas.find(a => a.id.toString() === formData.area);
    return selectedArea ? (selectedArea.units || []) : [];
  }, [project, formData.area]);

  // State untuk form scope tambahan
  const [tambahan, setTambahan] = useState({
    jenis: 'Additional Job',
    nama: '',
    bobot: ''
  });

  const handleAddTambahan = () => {
    if (!tambahan.nama) return;
    
    const newScope = {
      id: Date.now(),
      nama: tambahan.nama,
      // Jika Additional Job, bobot tidak berlaku (atau 0/-)
      bobot: tambahan.jenis === 'Terencana' ? Number(tambahan.bobot) : 0,
      capaianKemarin: 0,
      capaianHariIni: 0,
      jenis: tambahan.jenis
    };
    
    setScopes([...scopes, newScope]);
    
    // Reset form
    setTambahan({ jenis: 'Additional Job', nama: '', bobot: '' });
  };

  const updateCapaianHariIni = (id, value) => {
    setScopes(scopes.map(s => s.id === id ? { ...s, capaianHariIni: Number(value) } : s));
  };

  const updateCatatan = (id, value) => {
    setScopes(scopes.map(s => s.id === id ? { ...s, catatan: value } : s));
  };

  const handleSubmit = async () => {
    if (!formData.tanggal || !formData.unit) {
      alert("Tanggal dan Unit harus diisi!");
      return;
    }

    setIsSaving(true);
    const payload = {
      tanggal: formData.tanggal,
      unit_id: parseInt(formData.unit),
      jam_kerja: parseFloat(formData.jamKerja) || 0,
      scopes: scopes
        .filter(s => s.capaianHariIni > 0 || s.id > 1000000 || (s.catatan && s.catatan.trim() !== '')) 
        .map(s => ({
          id: s.id,
          nama_scope: s.nama,
          bobot: s.bobot,
          tipe: s.jenis,
          pct: parseFloat(s.capaianHariIni) || 0,
          catatan: s.catatan
        }))
    };

    try {
      const res = await fetch(apiUrl('/daily-progress'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Berhasil menyimpan catatan harian!");
        onBack();
      } else {
        const err = await res.json();
        alert("Gagal menyimpan: " + err.error);
      }
    } catch (err) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-6xl mx-auto mt-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Tambah Catatan Daily Progress</h2>
        <button 
          onClick={onBack} 
          className="text-gray-500 hover:text-gray-700 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 
          <span className="text-sm font-medium">Kembali</span>
        </button>
      </div>

      {/* Form Informasi Umum */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal</label>
          <input 
            type="date" 
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
            value={formData.tanggal} 
            onChange={e => setFormData({...formData, tanggal: e.target.value})} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Daerah</label>
          <select 
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            value={formData.area} 
            onChange={e => setFormData({...formData, area: e.target.value})}
          >
            <option value="">Pilih Daerah</option>
            {project?.areas?.map(area => (
              <option key={area.id} value={area.id}>{area.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
          <select 
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            value={formData.unit} 
            onChange={e => setFormData({...formData, unit: e.target.value})}
            disabled={!formData.area}
          >
            <option value="">Pilih Unit</option>
            {availableUnits.map(unit => (
              <option key={unit.id} value={unit.id}>{unit.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Jam Kerja Hari ini</label>
          <div className="relative">
            <input 
              type="number" 
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-12 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
              placeholder="0" 
              value={formData.jamKerja} 
              onChange={e => setFormData({...formData, jamKerja: e.target.value})} 
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">Jam</span>
          </div>
        </div>
      </div>

      {/* Scope of Work Tambahan */}
      <div className="bg-gray-50/80 rounded-2xl p-5 mb-8 border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2">
          Scope of Work Tambahan
          <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">Pekerjaan di luar daftar unit</span>
        </h3>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Jenis Scope</label>
            <select 
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-white"
              value={tambahan.jenis} 
              onChange={e => setTambahan({...tambahan, jenis: e.target.value})}
            >
              <option value="Additional Job">Additional Job</option>
              <option value="Terencana">Terencana</option>
            </select>
          </div>
          
          <div className="w-full md:w-2/4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Nama Scope</label>
            <input 
              type="text" 
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-white" 
              placeholder="Ketik nama scope tambahan..." 
              value={tambahan.nama} 
              onChange={e => setTambahan({...tambahan, nama: e.target.value})} 
            />
          </div>
          
          {tambahan.jenis === 'Terencana' && (
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Bobot dalam Unit (%)</label>
              <input 
                type="number" 
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-white" 
                placeholder="0" 
                value={tambahan.bobot} 
                onChange={e => setTambahan({...tambahan, bobot: e.target.value})} 
              />
            </div>
          )}
          
          <div className="w-full md:w-auto">
            <button 
              onClick={handleAddTambahan} 
              disabled={!tambahan.nama}
              className={`w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
                !tambahan.nama ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <Plus className="w-4 h-4" /> 
              Tambah
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Capaian Progres */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-800 mb-4">Persentase Progres</h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                <th className="p-4 font-semibold text-gray-600">Scope of Work</th>
                <th className="p-4 font-semibold text-gray-600">Bobot dlm Unit</th>
                <th className="p-4 font-semibold text-gray-600">Capaian s.d. Kemarin</th>
                <th className="p-4 font-semibold text-gray-600">% Capaian Hari Ini</th>
                <th className="p-4 font-semibold text-gray-600">Capaian Kumulatif</th>
                <th className="p-4 font-semibold text-gray-600">Catatan</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {scopes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-500 bg-gray-50/30">
                    <div className="flex flex-col items-center justify-center">
                      <p className="font-medium text-gray-600 mb-1">Belum ada Scope of Work</p>
                      <p className="text-xs">Pilih Daerah & Unit terlebih dahulu atau tambah scope secara manual.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                scopes.map(s => {
                  const kumulatif = s.capaianKemarin + (s.capaianHariIni || 0);
                  
                  return (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="font-medium text-gray-800">{s.nama}</span>
                          {s.jenis !== 'Utama' && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase ${
                              s.jenis === 'Additional Job' 
                                ? 'bg-orange-100 text-orange-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {s.jenis}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-gray-700">
                        {s.jenis === 'Additional Job' ? '-' : `${s.bobot}%`}
                      </td>
                      <td className="p-4 text-gray-600">{s.capaianKemarin}%</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-white" 
                            value={s.capaianHariIni === 0 ? '' : s.capaianHariIni} 
                            onChange={(e) => updateCapaianHariIni(s.id, e.target.value)}
                            placeholder="0"
                            min="0"
                            max="100"
                          />
                          <span className="text-gray-500 font-medium">%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold ${kumulatif > 100 ? 'text-red-600' : 'text-blue-600'}`}>
                          {kumulatif}%
                        </span>
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          className="w-full min-w-[200px] rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-white" 
                          placeholder="Tambahkan catatan (opsional)" 
                          value={s.catatan || ''} 
                          onChange={(e) => updateCatatan(s.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end pt-5 border-t border-gray-200">
        <button 
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm hover:shadow-md disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Menyimpan...' : 'Simpan Catatan'}
        </button>
      </div>
    </div>
  );
}
