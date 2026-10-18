import React, { useState } from 'react';
import { X, Camera, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ModalProofDelivery({ isOpen, onClose, task, onSubmit }) {
  const [receiverName, setReceiverName] = useState('');
  const [receiverRole, setReceiverRole] = useState('Staff Gudang / Penerima');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [itemCondition, setItemCondition] = useState('Baik');
  const [completedOdometer, setCompletedOdometer] = useState('');
  const [notes, setNotes] = useState('');
  const [proofPhoto, setProofPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !task) return null;

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receiverName.trim()) {
      alert('Nama penerima barang wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      let lat = null;
      let lng = null;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (geoErr) {
          console.warn('Gagal mendapatkan GPS:', geoErr);
        }
      }

      await onSubmit({
        task_id: task.id,
        receiver_name: receiverName,
        receiver_role: receiverRole,
        receiver_phone: receiverPhone,
        item_condition: itemCondition,
        completed_odometer: completedOdometer ? parseInt(completedOdometer) : null,
        notes,
        proof_photo: photoPreview || 'sample_proof.jpg',
        actual_lat: lat,
        actual_lng: lng
      });

      onClose();
    } catch (err) {
      console.error('Error submit POD:', err);
      alert('Terjadi kesalahan saat menyimpan bukti serah terima.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Proof of Delivery (POD)</span>
            <h2 className="text-base font-bold text-slate-900">Selesaikan Tugas & Serah Terima</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* Info Task Ringkas */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">No Ref / Surat Jalan:</span>
              <span className="font-mono text-slate-900 font-bold">{task.reference_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Tujuan:</span>
              <span className="text-slate-900 font-semibold truncate max-w-[220px]">
                {task.task_type === 'delivery' ? task.destination_name : task.origin_name}
              </span>
            </div>
          </div>

          {/* Form Nama Penerima & Jabatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nama Penerima <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Cth: Pak Slamet"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Jabatan / Hubungan
              </label>
              <input
                type="text"
                placeholder="Cth: Staff Gudang / Security"
                value={receiverRole}
                onChange={(e) => setReceiverRole(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Odometer Akhir & Kondisi Barang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                KM Odometer Mobil
              </label>
              <input
                type="number"
                placeholder="Cth: 85420"
                value={completedOdometer}
                onChange={(e) => setCompletedOdometer(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kondisi Barang
              </label>
              <select
                value={itemCondition}
                onChange={(e) => setItemCondition(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Baik">Sangat Baik / Lengkap</option>
                <option value="Sebagian Kurang">Sebagian Kurang</option>
                <option value="Kemasan Basah/Rusak">Kemasan Basah / Rusak</option>
              </select>
            </div>
          </div>

          {/* Upload Foto Surat Jalan / Bukti Serah Terima */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Foto Surat Jalan / Barang Bertanda Tangan
            </label>
            <div className="mt-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 relative hover:border-slate-400 transition-colors">
              {photoPreview ? (
                <div className="w-full space-y-2 text-center">
                  <img 
                    src={photoPreview} 
                    alt="Preview POD" 
                    className="max-h-48 w-full object-contain rounded-xl border border-slate-200 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => { setPhotoPreview(''); setProofPhoto(null); }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                  >
                    Ganti Foto
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer w-full py-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2 border border-emerald-200 shadow-sm">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Ambil Foto Surat Jalan</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Kamera HP atau Galeri</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Catatan / Keterangan
            </label>
            <textarea
              rows={2}
              placeholder="Catatan dari penerima atau kondisi khusus..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Tombol Simpan */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/3 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Selesai</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
