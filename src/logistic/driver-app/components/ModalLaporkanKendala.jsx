import React, { useState } from 'react';
import { X, AlertTriangle, Camera, Loader2 } from 'lucide-react';

export default function ModalLaporkanKendala({ isOpen, onClose, task, onSubmit }) {
  const [issueType, setIssueType] = useState('ban_bocor');
  const [issueNote, setIssueNote] = useState('');
  const [issuePhotoPreview, setIssuePhotoPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !task) return null;

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIssuePhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!issueNote.trim()) {
      alert('Mohon isi penjelasan kendala secara rinci.');
      return;
    }

    setIsSubmitting(true);
    try {
      let lat = null;
      let lng = null;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (e) {
          console.warn('GPS unvailable');
        }
      }

      await onSubmit({
        task_id: task.id,
        issue_type: issueType,
        issue_note: issueNote,
        issue_photo: issuePhotoPreview || null,
        reported_lat: lat,
        reported_lng: lng
      });

      onClose();
    } catch (err) {
      console.error('Error laporkan kendala:', err);
      alert('Gagal mengirimkan laporan kendala.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">Laporan Lapangan</span>
              <h2 className="text-base font-bold text-slate-900">Laporkan Kendala Tugas</h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Jenis Kendala
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            >
              <option value="ban_bocor">Ban Bocor / Masalah Mesin</option>
              <option value="gudang_tutup">Gudang Penerima Tutup / Tidak Ada Orang</option>
              <option value="barang_rusak">Barang Rusak di Perjalanan</option>
              <option value="selisih_qty">Selisih Jumlah Barang (Kurang/Lebih)</option>
              <option value="macet_total">Macet Parah / Akses Jalan Ditutup</option>
              <option value="lainnya">Kendala Lainnya</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Keterangan Rinci Kendala <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan kondisi di lokasi dan alasan keterlambatan..."
              value={issueNote}
              onChange={(e) => setIssueNote(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Foto Bukti Kendala (Opsional)
            </label>
            <div className="mt-1 flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative hover:border-slate-400 transition-colors">
              {issuePhotoPreview ? (
                <div className="w-full space-y-2 text-center">
                  <img src={issuePhotoPreview} alt="Preview Kendala" className="max-h-40 w-full object-contain rounded-lg border border-slate-200" />
                  <button type="button" onClick={() => setIssuePhotoPreview('')} className="text-xs text-rose-600 hover:text-rose-700 font-bold">
                    Hapus Foto
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer py-2 text-xs font-semibold text-slate-700">
                  <Camera className="w-4 h-4 text-rose-600" />
                  <span>Ambil Foto Kondisi Lapangan</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/3 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <span>Kirim Laporan ke SPV</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
