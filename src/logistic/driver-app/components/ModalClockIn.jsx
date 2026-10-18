import React, { useState } from 'react';
import { 
  X, 
  Camera, 
  Gauge, 
  CheckCircle2, 
  Fuel, 
  AlertTriangle, 
  Check, 
  Trash2, 
  Loader2,
  Car,
  MapPin,
  Sparkles
} from 'lucide-react';

export default function ModalClockIn({ isOpen, onClose, onSubmit, vehiclePlate = 'B 9481 KXZ' }) {
  const [startOdo, setStartOdo] = useState('');
  const [fuelLevel, setFuelLevel] = useState(''); // Text input bebas (misal: "3/4", "35 Liter", "Full")
  const [odoPhotoPreview, setOdoPhotoPreview] = useState('');
  const [fuelPhotoPreview, setFuelPhotoPreview] = useState('');
  
  // Checklist Kondisi Mobil
  const [conditions, setConditions] = useState({
    oil: true,
    brakes: true,
    tires: true,
    lights: true,
    cleanliness: true
  });

  const [conditionNotes, setConditionNotes] = useState('');
  const [attachedPhotos, setAttachedPhotos] = useState([]); // Foto opsional kondisi mobil (Max 5 foto)
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Handler Foto Speedometer
  const handleOdoPhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setOdoPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handler Foto Indikator Bensin
  const handleFuelPhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFuelPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handler Foto Opsional Kondisi Mobil (Max 5 Foto)
  const handleAddConditionPhoto = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (attachedPhotos.length + files.length > 5) {
      alert('Maksimal hanya dapat melampirkan 5 foto kondisi kendaraan!');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedPhotos(prev => {
          if (prev.length >= 5) return prev;
          return [...prev, { file, preview: reader.result, id: Date.now() + Math.random() }];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (id) => {
    setAttachedPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleToggleCheck = (key) => {
    setConditions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startOdo) {
      alert('Silakan masukkan angka KM Odometer awal.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Ambil geolocation jika tersedia
      let lat = null;
      let lng = null;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (err) {
          console.warn('GPS tidak tersedia');
        }
      }

      await onSubmit({
        start_odometer: parseInt(startOdo, 10),
        start_fuel_level: fuelLevel || 'Cukup',
        odo_photo: odoPhotoPreview || null,
        fuel_photo: fuelPhotoPreview || null,
        conditions,
        condition_notes: conditionNotes,
        photos_count: attachedPhotos.length,
        attached_photos: attachedPhotos.map(p => p.preview),
        latitude: lat,
        longitude: lng,
        check_in_time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      });

      onClose();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses Clock In.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-2xs">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                Mulai Dinas
              </span>
              <h2 className="text-base font-black text-slate-900">
                Form Clock In Driver
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* Card Info Mobil */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Armada Mobil</span>
              <span className="font-black text-slate-900 text-sm">{vehiclePlate}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Status Shift</span>
              <span className="text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-lg">
                Siap Berangkat
              </span>
            </div>
          </div>

          {/* Input KM Odometer Awal & Bahan Bakar (Field Input Bebas) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                KM Odometer Awal <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="Cth: 85420"
                value={startOdo}
                onChange={(e) => setStartOdo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-extrabold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Bahan Bakar Awal
              </label>
              <input
                type="text"
                placeholder="Cth: Full, 3/4, 40 Liter"
                value={fuelLevel}
                onChange={(e) => setFuelLevel(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
              />
            </div>
          </div>

          {/* 2 Kolom Foto: Foto Odometer Speedometer & Foto Indikator Bensin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Foto Odometer */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Foto Odometer (KM Awal)
              </label>
              <div className="p-3 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 flex flex-col items-center justify-center min-h-[90px] hover:border-slate-400 transition-colors">
                {odoPhotoPreview ? (
                  <div className="relative w-full text-center space-y-1">
                    <img src={odoPhotoPreview} alt="Odo Awal" className="w-full h-20 object-contain rounded-xl border border-slate-300 shadow-2xs bg-white" />
                    <button type="button" onClick={() => setOdoPhotoPreview('')} className="text-[10px] text-rose-600 font-bold hover:underline">
                      Ganti Foto
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full py-1 text-center">
                    <Camera className="w-5 h-5 text-emerald-600 mb-1" />
                    <span className="text-[11px] font-bold text-slate-800">Foto Speedometer</span>
                    <span className="text-[9px] text-slate-400">Kamera / Galeri</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleOdoPhotoCapture} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Foto Indikator Bensin */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Foto Indikator Bensin
              </label>
              <div className="p-3 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 flex flex-col items-center justify-center min-h-[90px] hover:border-slate-400 transition-colors">
                {fuelPhotoPreview ? (
                  <div className="relative w-full text-center space-y-1">
                    <img src={fuelPhotoPreview} alt="Indikator Bensin" className="w-full h-20 object-contain rounded-xl border border-slate-300 shadow-2xs bg-white" />
                    <button type="button" onClick={() => setFuelPhotoPreview('')} className="text-[10px] text-rose-600 font-bold hover:underline">
                      Ganti Foto
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full py-1 text-center">
                    <Fuel className="w-5 h-5 text-amber-600 mb-1" />
                    <span className="text-[11px] font-bold text-slate-800">Foto Jarum/Bar Bensin</span>
                    <span className="text-[9px] text-slate-400">Kamera / Galeri</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleFuelPhotoCapture} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Checklist Pengecekan Kondisi Fisik & Mesin Mobil */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 block">
              Pemeriksaan Kendaraan (Checklist Kelayakan)
            </span>
            <div className="grid grid-cols-1 gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/90 text-xs">
              {[
                { key: 'oil', label: 'Oli Mesin & Air Radiator Cukup' },
                { key: 'brakes', label: 'Minyak Rem & Pedal Berfungsi Normal' },
                { key: 'tires', label: 'Tekanan Angin Ban & Ban Serep Bagus' },
                { key: 'lights', label: 'Semua Lampu (Utama, Sein, Rem) Menyala' },
                { key: 'cleanliness', label: 'Kebersihan Kabin & Bak Bersih' }
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleToggleCheck(item.key)}
                  className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-100 transition-colors text-left"
                >
                  <span className="text-slate-800 font-medium text-xs">{item.label}</span>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    conditions[item.key] ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                  }`}>
                    {conditions[item.key] && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Catatan Tambahan Kondisi Mobil */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Catatan Kondisi Mobil / Keluhan Fisik
            </label>
            <textarea
              rows={2}
              placeholder="Cth: AC agak kurang dingin, ada baret lama di pintu kiri..."
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
            />
          </div>

          {/* Upload Foto Opsional Kondisi Mobil (Max 5 Foto) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800">
                Foto Opsional Kondisi Mobil / Bodi
              </label>
              <span className={`text-[11px] font-bold ${attachedPhotos.length >= 5 ? 'text-rose-600' : 'text-slate-400'}`}>
                {attachedPhotos.length} / 5 Foto Max
              </span>
            </div>

            {/* Grid Thumbnail Foto Opsional */}
            <div className="grid grid-cols-3 gap-2">
              {attachedPhotos.map((photo, idx) => (
                <div key={photo.id} className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-square group shadow-2xs bg-slate-100">
                  <img src={photo.preview} alt={`Kondisi ${idx+1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-transform active:scale-90"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1.5 text-[9px] font-black bg-black/60 text-white px-1.5 py-0.5 rounded">
                    Foto {idx+1}
                  </span>
                </div>
              ))}

              {attachedPhotos.length < 5 && (
                <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer aspect-square transition-colors text-center p-2">
                  <Camera className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 leading-tight">Foto Opsional</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">(Max 5)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={handleAddConditionPhoto}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Tombol Simpan Clock In */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/3 py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Clock In...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Clock In</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
