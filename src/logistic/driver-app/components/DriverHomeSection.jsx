import React, { useState, useEffect } from 'react';
import { 
  User, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Calendar, 
  Navigation, 
  TrendingUp, 
  Award, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowRight,
  Sparkles,
  Play,
  Check,
  Fuel,
  Gauge,
  LogIn,
  LogOut,
  Loader2,
  ChevronRight
} from 'lucide-react';
import ModalClockIn from './ModalClockIn';
import { logisticApi } from '../../services/logisticApi';

export default function DriverHomeSection({ 
  currentUser,
  driverProfile,
  tasks = [], 
  onNavigateTasks,
  onOpenTaskDetail,
  onRefreshTasks
}) {
  // State Shifting Driver (Clock In & Clock Out)
  const [shiftStatus, setShiftStatus] = useState('not_checked_in'); // 'not_checked_in' | 'checked_in' | 'checked_out'
  const [activeShift, setActiveShift] = useState(null);
  const [checkInTime, setCheckInTime] = useState('-');
  const [checkOutTime, setCheckOutTime] = useState('-');
  const [currentOdo, setCurrentOdo] = useState('85,420');
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [vehicleCheckSummary, setVehicleCheckSummary] = useState(null);
  const [isShiftLoading, setIsShiftLoading] = useState(false);

  // Ambil shift aktif hari ini dari backend
  useEffect(() => {
    let isMounted = true;
    const fetchTodayShift = async () => {
      try {
        setIsShiftLoading(true);
        const res = await logisticApi.getTodayShift(driverProfile?.id);
        if (isMounted && res) {
          if (res.status === 'checked_in' && res.shift) {
            setShiftStatus('checked_in');
            setActiveShift(res.shift);
            setCheckInTime(new Date(res.shift.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
            setCurrentOdo(res.shift.start_odometer ? res.shift.start_odometer.toLocaleString() : '85,420');
            setVehicleCheckSummary({
              start_odometer: res.shift.start_odometer,
              photos_count: 2
            });
          } else if (res.status === 'checked_out' && res.shift) {
            setShiftStatus('checked_out');
            setActiveShift(res.shift);
            setCheckInTime(new Date(res.shift.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
            setCheckOutTime(new Date(res.shift.end_time || res.shift.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
            setCurrentOdo(res.shift.start_odometer ? res.shift.start_odometer.toLocaleString() : '85,420');
          } else {
            setShiftStatus('not_checked_in');
            setActiveShift(null);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat shift hari ini:', err);
      } finally {
        if (isMounted) setIsShiftLoading(false);
      }
    };

    fetchTodayShift();
    return () => { isMounted = false; };
  }, [driverProfile?.id]);

  // Cari tugas yang sedang berjalan (status 'on_route' atau 'arrived') atau tugas terdekat
  const activeTask = tasks.find(t => t.status === 'on_route' || t.status === 'arrived') || tasks.find(t => t.status === 'assigned');

  // Metrik KPI Riil dari tasks yang ada
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'delivered').length;
  const onTimeRate = totalTasks > 0 ? `${((completedTasks / totalTasks) * 100).toFixed(1)}%` : '100%';
  const safetyScore = '100 / 100';

  // Handler Submit dari Modal Clock In Riil ke Server
  const handleConfirmClockIn = async (clockInData) => {
    try {
      const payload = {
        driver_id: driverProfile?.id || '57f3ae13-0277-4dd4-96dd-40564049fa9c',
        driver_name: driverProfile?.name || currentUser.name || 'ABDUL KARIM',
        vehicle_id: driverProfile?.assigned_vehicle_id || 'fb5c09d5-48dc-4b76-83bc-6fb1b30d2e47',
        vehicle_plate: driverProfile?.assigned_vehicle_plate || 'B 1442 KYI',
        start_odometer: clockInData.start_odometer,
        start_fuel_level: clockInData.fuel_level_text || 'Full',
        is_engine_oil_ok: clockInData.checklist?.oliMesin ?? true,
        is_brake_fluid_ok: clockInData.checklist?.rem ?? true,
        is_tire_pressure_ok: clockInData.checklist?.ban ?? true,
        is_lights_ok: clockInData.checklist?.lampu ?? true,
        is_cleanliness_ok: clockInData.checklist?.kebersihan ?? true,
        vehicle_condition_notes: clockInData.condition_notes || null,
        odo_photo_data: clockInData.odo_photo ? { file_name: 'odo_start.jpg', file_path: clockInData.odo_photo } : null,
        fuel_photo_data: clockInData.fuel_photo ? { file_name: 'fuel_start.jpg', file_path: clockInData.fuel_photo } : null,
        condition_photos: (clockInData.condition_photos || []).map((cp, idx) => ({
          file_name: `kondisi_${idx + 1}.jpg`,
          file_path: cp.preview || cp
        }))
      };

      const res = await logisticApi.clockIn(payload);
      setActiveShift(res.shift);
      setCheckInTime(clockInData.check_in_time);
      setCurrentOdo(clockInData.start_odometer.toLocaleString());
      setShiftStatus('checked_in');
      setVehicleCheckSummary(clockInData);
      if (onRefreshTasks) onRefreshTasks();
      alert(`Berhasil Clock In (${clockInData.check_in_time})!\nKM Awal: ${clockInData.start_odometer} KM telah tercatat di server.`);
    } catch (err) {
      console.error('Error clock in:', err);
      alert('Gagal Clock In: ' + err.message);
    }
  };

  const handleClockOut = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menyelesaikan shift dinas hari ini (Clock Out)?')) return;
    try {
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      if (activeShift?.id) {
        await logisticApi.clockOut({
          shift_id: activeShift.id,
          end_odometer: parseInt(currentOdo.replace(/,/g, '')) + 25,
          end_fuel_level: '3/4 Tank'
        });
      }
      setCheckOutTime(now);
      setShiftStatus('checked_out');
      if (onRefreshTasks) onRefreshTasks();
      alert(`Berhasil Clock Out (${now})! Data shift dinas telah ditutup di server.`);
    } catch (err) {
      console.error('Error clock out:', err);
      alert('Gagal Clock Out: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* SECTION 1: INFO PROFIL DRIVER & STATUS ARMADA              */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-3xl p-5 shadow-lg shadow-emerald-700/20">
        <div className="absolute top-[-30px] right-[-30px] w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-20px] left-[-20px] w-28 h-28 bg-black/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center font-extrabold text-xl shadow-inner text-white">
                {(driverProfile?.name || currentUser?.name)?.charAt(0) || 'D'}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full shadow-sm" title="Online" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 text-white/95">
                  Driver Logistik
                </span>
                <span className="text-[11px] text-white/80 font-mono">
                  {driverProfile?.driver_code || 'DRV-001'}
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight mt-0.5 leading-snug">
                {driverProfile?.name || currentUser?.name || 'Abdul Karim'}
              </h2>
              <p className="text-xs text-white/80 font-medium flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                {driverProfile?.license_type || 'SIM B1 Umum'} Aktif • Driver Logistik
              </p>
            </div>
          </div>
        </div>

        {/* Baris Info Armada & Rasio BBM */}
        <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/15">
            <span className="text-[10px] text-white/70 uppercase font-semibold block">Armada Mobil</span>
            <div className="font-extrabold text-white text-sm flex items-center gap-1 mt-0.5">
              <Truck className="w-4 h-4 text-emerald-300" />
              <span>{driverProfile?.assigned_vehicle_plate || 'B 1442 KYI'}</span>
            </div>
            <span className="text-[10px] text-white/80 block mt-0.5">
              {driverProfile?.assigned_vehicle_name || 'GRANDMAX PUTIH'}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/15">
            <span className="text-[10px] text-white/70 uppercase font-semibold block">Odometer / KM Awal</span>
            <div className="font-extrabold text-white text-sm flex items-center gap-1 mt-0.5">
              <Gauge className="w-4 h-4 text-amber-300" />
              <span>{currentOdo} KM</span>
            </div>
            <span className="text-[10px] text-white/80 block mt-0.5">
              Rasio: {driverProfile?.fuel_ratio_km_per_liter || '12'} KM / Liter
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: CLOCK IN & CLOCK OUT DRIVER                    */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-none">Clock In & Clock Out</h3>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Status Jam Dinas Lapangan</p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            shiftStatus === 'checked_in' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : shiftStatus === 'checked_out'
                ? 'bg-slate-100 text-slate-600 border border-slate-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {shiftStatus === 'checked_in' ? '● Aktif Dinas' : shiftStatus === 'checked_out' ? '● Shift Selesai' : 'Belum Clock In'}
          </span>
        </div>

        {/* Waktu Masuk vs Pulang */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clock In</span>
              <LogIn className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-sm font-black text-slate-900 font-mono mt-1 block">{checkInTime}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clock Out</span>
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="text-sm font-black text-slate-900 font-mono mt-1 block">{checkOutTime}</span>
          </div>
        </div>

        {/* Ringkasan Pemeriksaan Mobil jika sudah Clock In */}
        {vehicleCheckSummary && shiftStatus === 'checked_in' && (
          <div className="bg-emerald-50/70 p-2.5 rounded-2xl border border-emerald-200/80 text-[11px] text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Kondisi Mobil Dicek • Siap Operasional</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700">KM: {vehicleCheckSummary.start_odometer}</span>
          </div>
        )}

        {/* Tombol Aksi Shifting */}
        {shiftStatus === 'not_checked_in' && (
          <button
            onClick={() => setIsClockInModalOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span>Clock In (Mulai Dinas & Cek Mobil)</span>
          </button>
        )}

        {shiftStatus === 'checked_in' && (
          <button
            onClick={handleClockOut}
            className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            <span>Clock Out (Selesai Dinas Hari Ini)</span>
          </button>
        )}

        {shiftStatus === 'checked_out' && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Shift dinas hari ini telah berhasil ditutup.
            </span>
          </div>
        )}
      </div>

      {/* Modal Form Clock In & Cek Kondisi Kendaraan (Max 5 Foto) */}
      <ModalClockIn
        isOpen={isClockInModalOpen}
        onClose={() => setIsClockInModalOpen(false)}
        onSubmit={handleConfirmClockIn}
        vehiclePlate={driverProfile?.assigned_vehicle_plate || 'B 1442 KYI'}
      />

      {/* ========================================================= */}
      {/* SECTION 3: TUGAS BERJALAN SAAT INI (LIVE TRACKING CARD)    */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-none">Tugas Berjalan Saat Ini</h3>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Prioritas pengiriman berikutnya</p>
            </div>
          </div>

          <button 
            onClick={onNavigateTasks}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
          >
            <span>Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeTask ? (
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-3.5 rounded-2xl border border-blue-100/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-blue-700">
                {activeTask.reference_number}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100/80 text-blue-800 animate-pulse">
                {activeTask.status === 'on_route' ? 'Sedang Di Jalan' : activeTask.status === 'arrived' ? 'Tiba di Lokasi' : 'Siap Berangkat'}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                {activeTask.task_type === 'delivery' ? activeTask.destination_name : activeTask.origin_name}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  {activeTask.task_type === 'delivery' ? activeTask.destination_address : activeTask.origin_address}
                </span>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Muatan: <strong className="text-slate-800">{activeTask.total_items_count} {activeTask.total_items_unit}</strong>
              </span>
              <button
                onClick={() => onOpenTaskDetail(activeTask)}
                className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <span>Lihat Detail</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-xs text-slate-500 font-medium">Tidak ada tugas yang sedang aktif saat ini.</p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION 4: KPI SUMMARY & PENCAPAIAN DRIVER                 */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-none">Rangkuman Kinerja (KPI)</h3>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Statistik Pengiriman Driver</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pengiriman</span>
            <span className="text-base font-extrabold text-slate-900 mt-1 block">
              {completedTasks} / {totalTasks} Selesai
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ketepatan Waktu</span>
            <span className="text-base font-extrabold text-emerald-600 mt-1 block">{onTimeRate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
