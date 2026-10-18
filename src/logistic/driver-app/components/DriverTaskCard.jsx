import React from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Calendar, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export default function DriverTaskCard({ task, onUpdateStatus, onReportIssue, onCompleteTask }) {
  const isDelivery = task.task_type === 'delivery';

  // Badge Status (Tema Terang)
  const getStatusBadge = (status) => {
    switch (status) {
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Siap Jalan
          </span>
        );
      case 'on_route':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Truck className="w-3.5 h-3.5 text-blue-600" /> Dalam Perjalanan
          </span>
        );
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <MapPin className="w-3.5 h-3.5 text-purple-600" /> Tiba di Lokasi
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Selesai
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Kendala / Batal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Navigasi Google Maps
  const handleOpenMaps = () => {
    const targetAddress = isDelivery ? task.destination_address : task.origin_address;
    const lat = isDelivery ? task.destination_latitude : task.origin_latitude;
    const lng = isDelivery ? task.destination_longitude : task.origin_longitude;
    
    let url = '';
    if (lat && lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetAddress)}`;
    }
    window.open(url, '_blank');
  };

  // Hubungi PIC
  const handleCallPic = () => {
    const phone = isDelivery ? task.destination_pic_phone : task.origin_pic_phone;
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      alert('Nomor telepon PIC tidak tersedia');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
      {/* Header Card: Tipe Tugas & Status */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
            isDelivery 
              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {isDelivery ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
            {isDelivery ? 'Delivery' : 'Pickup'}
          </span>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {task.reference_number}
          </span>
        </div>
        {getStatusBadge(task.status)}
      </div>

      {/* Target Lokasi & Nama Customer/Vendor */}
      <div className="py-3 space-y-2.5">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {isDelivery ? 'Tujuan Kirim (Customer)' : 'Lokasi Ambil (Vendor)'}
          </span>
          <h3 className="text-base font-bold text-slate-900 leading-snug mt-0.5">
            {isDelivery ? task.destination_name : task.origin_name}
          </h3>
        </div>

        {/* Alamat Lengkap */}
        <div className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="line-clamp-2 leading-relaxed font-normal">
            {isDelivery ? task.destination_address : task.origin_address}
          </p>
        </div>

        {/* Info PIC & Telp */}
        <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-slate-400">PIC:</span>
            <span className="font-semibold text-slate-800 truncate">
              {isDelivery ? (task.destination_pic_name || '-') : (task.origin_pic_name || '-')}
            </span>
          </div>
          {(isDelivery ? task.destination_pic_phone : task.origin_pic_phone) && (
            <button 
              onClick={handleCallPic}
              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hubungi</span>
            </button>
          )}
        </div>

        {/* Ringkasan Barang */}
        <div className="flex items-center justify-between bg-slate-100/70 px-3 py-2 rounded-xl text-xs text-slate-700 mt-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600" />
            <span>Muatan: <strong className="text-slate-900">{task.total_items_count || 1} {task.total_items_unit || 'Karton'}</strong></span>
          </div>
          {task.do_easy && (
            <span className="text-[11px] font-mono font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              DO: {task.do_easy}
            </span>
          )}
        </div>
      </div>

      {/* Tombol Aksi Cepat Driver */}
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Tombol Google Maps */}
          <button 
            onClick={handleOpenMaps}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-300 active:scale-[0.98]"
          >
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>Buka Maps</span>
          </button>

          {/* Tombol Laporkan Kendala */}
          <button 
            onClick={() => onReportIssue(task)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200 active:scale-[0.98]"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Lapor Masalah</span>
          </button>
        </div>

        {/* Tombol Progres Utama */}
        {task.status === 'assigned' && (
          <button 
            onClick={() => onUpdateStatus(task.id, 'on_route')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            <Truck className="w-4 h-4" />
            <span>Mulai Berangkat (On Route)</span>
          </button>
        )}

        {task.status === 'on_route' && (
          <button 
            onClick={() => onUpdateStatus(task.id, 'arrived')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md shadow-purple-500/20 transition-all active:scale-[0.98]"
          >
            <MapPin className="w-4 h-4" />
            <span>Tiba di Lokasi Tujuan</span>
          </button>
        )}

        {task.status === 'arrived' && (
          <button 
            onClick={() => onCompleteTask(task)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Serah Terima & Foto Bukti (POD)</span>
          </button>
        )}

        {task.status === 'delivered' && (
          <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tugas Telah Selesai Dikirim</span>
          </div>
        )}
      </div>
    </div>
  );
}
