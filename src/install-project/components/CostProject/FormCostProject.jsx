import { useState, useEffect } from "react";
import { X, Save, ArrowLeft, Loader2, Calendar } from "lucide-react";

export default function FormCostProject({ project, onClose, onSuccess, isMobile = false, inline = false }) {
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    kategori: "",
    keterangan: "",
    jumlah: "",
    dibebankan_ke: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    // Gather all units from all areas in the project for the dropdown
    if (project && project.areas) {
      const allUnits = project.areas.flatMap(a => 
        (a.units || []).map(u => ({
          ...u,
          areaNama: a.nama
        }))
      );
      setUnits(allUnits);
    }
  }, [project]);

  // Handle Input format currency
  const handleJumlahChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, jumlah: value });
  };

  const displayJumlah = formData.jumlah ? `Rp ${new Intl.NumberFormat('id-ID').format(formData.jumlah)}` : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tanggal || !formData.kategori || !formData.keterangan || !formData.jumlah) {
      alert("Harap lengkapi field wajib (Tanggal, Kategori, Keterangan, Jumlah)");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        project_id: project.id,
        tanggal: formData.tanggal,
        kategori: formData.kategori,
        keterangan: formData.keterangan,
        jumlah: formData.jumlah,
        dibebankan_ke: formData.dibebankan_ke === "prorata" ? null : (formData.dibebankan_ke || null)
      };

      const res = await fetch('http://localhost:8400/api/cost-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan biaya");
      }
      
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="space-y-5 p-4 sm:p-6 bg-white sm:rounded-2xl h-full flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Tanggal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal</label>
          <div className="relative">
            <input 
              type="date" 
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white" 
              value={formData.tanggal} 
              onChange={e => setFormData({...formData, tanggal: e.target.value})} 
            />
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
          <select 
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white"
            value={formData.kategori} 
            onChange={e => setFormData({...formData, kategori: e.target.value})}
          >
            <option value="">Pilih Kategori...</option>
            <option value="Akomodasi">Akomodasi</option>
            <option value="Hotel">Hotel</option>
            <option value="Transportasi">Transportasi</option>
            <option value="Consumable">Consumable</option>
          </select>
        </div>

      </div>

      {/* Keterangan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan</label>
        <textarea 
          rows="3"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white resize-none" 
          placeholder="Cth: Hotel supervisor 5 malam" 
          value={formData.keterangan} 
          onChange={e => setFormData({...formData, keterangan: e.target.value})} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Jumlah */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah (Rp)</label>
          <input 
            type="text" 
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow font-medium bg-white" 
            placeholder="Rp 0" 
            value={displayJumlah} 
            onChange={handleJumlahChange} 
          />
        </div>

        {/* Dibebankan Ke */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Dibebankan ke</label>
          <select 
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white"
            value={formData.dibebankan_ke} 
            onChange={e => setFormData({...formData, dibebankan_ke: e.target.value})}
          >
            <option value="prorata">Prorata ke semua unit (berdasar man-hours)</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.areaNama} - {u.nama}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-auto pt-6">
        <button 
          onClick={handleSubmit} 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 font-medium transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" /> 
              Tambah Biaya [{formData.tanggal}]
            </>
          )}
        </button>
      </div>
    </div>
  );

  if (inline) {
    return formContent;
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col absolute inset-0 z-50">
        <div className="bg-white px-4 py-4 flex items-center gap-3 border-b sticky top-0 z-10 shadow-sm">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="font-semibold text-gray-800 text-lg">Input Pengeluaran</h2>
        </div>
        <div className="flex-1 overflow-auto">
          {formContent}
        </div>
      </div>
    );
  }

  // Desktop Modal version
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Input Pengeluaran Proyek</h2>
            <p className="text-sm text-gray-500 mt-1">Tambahkan data biaya/pengeluaran baru</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto">
          {formContent}
        </div>
      </div>
    </div>
  );
}
