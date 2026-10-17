import React, { useState } from 'react';
import {
  X,
  Truck,
  User,
  Users,
  Calendar,
  Layers,
  FileText,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import ModalPilihTugas from './ModalPilihTugas';

export default function ModalPlottingDriver({
  isOpen,
  onClose,
  poolTasks = [], // Daftar antrean DO yang belum ditugaskan
  drivers = [],
  vehicles = [],
  onSubmit
}) {
  const [formData, setFormData] = useState({
    manifest_number: `MNF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
    driver_id: '',
    co_driver_id: '',
    vehicle_id: '',
    vehicle_plate: '',
    dispatch_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_out_of_city: false,
    notes: ''
  });

  // State daftar tugas yang sudah dipilih ke dalam form
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [isModalPilihTugasOpen, setIsModalPilihTugasOpen] = useState(false);

  if (!isOpen) return null;

  // Cek apakah ada tugas yang dipilih berstatus luar kota
  const hasOutOfCityTask = selectedTasks.some(t => t.out_of_city || t.is_out_of_city);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'is_out_of_city' && value && !prev.end_date
        ? { end_date: prev.dispatch_date }
        : {})
    }));
  };

  const handleSelectVehicle = (vehicleId) => {
    const selectedVeh = vehicles.find(v => v.id === vehicleId);
    setFormData(prev => ({
      ...prev,
      vehicle_id: vehicleId,
      vehicle_plate: selectedVeh?.plate_number || ''
    }));
  };

  // Callback saat user memilih tugas dari ModalPilihTugas
  const handleConfirmSelectedTasks = (selectedIds, selectedObjects) => {
    setSelectedTasks(selectedObjects);
  };

  const handleRemoveTask = (taskId) => {
    setSelectedTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTasks.length === 0) {
      alert('Silakan klik tombol "Pilih Tugas / DO" untuk memilih minimal 1 tugas yang akan ditugaskan.');
      return;
    }
    if (!formData.driver_id) {
      alert('Silakan tentukan Driver / Sopir utama.');
      return;
    }
    if (!formData.vehicle_id) {
      alert('Silakan tentukan Mobil / Armada kendaraan.');
      return;
    }
    if ((formData.is_out_of_city || hasOutOfCityTask) && !formData.end_date) {
      alert('Untuk penugasan Luar Kota, tanggal kepulangan (Sampai Tanggal) wajib diisi.');
      return;
    }

    if (onSubmit) {
      onSubmit({
        ...formData,
        is_out_of_city: formData.is_out_of_city || hasOutOfCityTask,
        task_ids: selectedTasks.map(t => t.id),
        selected_tasks: selectedTasks
      });
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
        <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header Modal */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Form Penugasan Driver & Armada
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Pilih tugas DO dari antrean pool, lalu tentukan sopir dan kendaraannya
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

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs sm:text-sm">
            {/* BAGIAN 1: PILIH TUGAS (TOMBOL MEMBUKA MODAL TUGAS) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider block">
                    Daftar Tugas / DO Terpilih <span className="text-red-500">*</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {selectedTasks.length === 0
                      ? 'Belum ada tugas yang dipilih untuk penugasan ini'
                      : `${selectedTasks.length} tugas/DO siap digabungkan ke manifest ini`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalPilihTugasOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Pilih Tugas / DO dari Pool</span>
                </button>
              </div>

              {/* List Kartu Tugas yang Sudah Masuk ke Form */}
              {selectedTasks.length === 0 ? (
                <div
                  onClick={() => setIsModalPilihTugasOpen(true)}
                  className="p-6 text-center text-slate-400 text-xs font-semibold bg-white rounded-xl border-2 border-dashed border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all"
                >
                  Klik di sini atau tombol di atas untuk memilih surat jalan (DO/PO) dari antrean antrean pool driver.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-black ${
                            task.type === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {(task.type || 'delivery').toUpperCase()}
                          </span>
                          <span className="font-extrabold text-blue-700 font-mono text-xs">
                            {task.ref || task.nomor_ref}
                          </span>
                          {(task.out_of_city || task.is_out_of_city) && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              Luar Kota
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-900 text-xs line-clamp-1">
                          {task.customer || task.customer_vendor}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Tujuan: <strong className="text-slate-600">{task.dest || task.lokasi_tujuan}</strong> ({task.qty || task.jumlah_barang})
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveTask(task.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Hapus dari penugasan ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BAGIAN 2: PILIH DRIVER & KERNET */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sopir Utama (Driver) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    required
                    value={formData.driver_id}
                    onChange={(e) => handleChange('driver_id', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                  >
                    <option value="">-- Pilih Driver Standby --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.status ? `(${d.status})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kernet / Co-Driver <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={formData.co_driver_id}
                    onChange={(e) => handleChange('co_driver_id', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                  >
                    <option value="">-- Tanpa Kernet --</option>
                    {drivers.filter(d => d.id !== formData.driver_id).map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* BAGIAN 3: PILIH KENDARAAN ARMADA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kendaraan Mobil Armada <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  required
                  value={formData.vehicle_id}
                  onChange={(e) => handleSelectVehicle(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                >
                  <option value="">-- Pilih Kendaraan Armada --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plate_number} - {v.name} {v.division ? `(${v.division} • ${v.location})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* BAGIAN 4: JADWAL BERANGKAT & KEPULANGAN (LUAR KOTA) */}
            <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-extrabold text-blue-900 text-xs uppercase tracking-wider">
                    Jadwal Operasional
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_out_of_city || hasOutOfCityTask}
                    onChange={(e) => handleChange('is_out_of_city', e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Rute Luar Kota (Multi-day)
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Berangkat (Jalan) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dispatch_date}
                    onChange={(e) => handleChange('dispatch_date', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {(formData.is_out_of_city || hasOutOfCityTask) && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Sampai Tanggal (Perkiraan Kembali) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={formData.dispatch_date}
                      value={formData.end_date}
                      onChange={(e) => handleChange('end_date', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-semibold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-[10px] text-purple-700 font-medium mt-1">
                      * Driver & Mobil dikunci selama rentang hari ini.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CATATAN SPV */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Instruksi SPV untuk Rombongan Tugas Ini
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Utamakan pengantaran plant Karawang sebelum jam 11 siang..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Tugaskan Driver ({selectedTasks.length} DO)
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SUB-MODAL: PILIH ANTREAN TUGAS DARI POOL */}
      <ModalPilihTugas
        isOpen={isModalPilihTugasOpen}
        onClose={() => setIsModalPilihTugasOpen(false)}
        poolTasks={poolTasks}
        initialSelectedIds={selectedTasks.map(t => t.id)}
        onConfirm={handleConfirmSelectedTasks}
      />
    </>
  );
}
