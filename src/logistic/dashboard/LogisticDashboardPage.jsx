import React from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import {
  Truck,
  TrendingUp,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Car
} from 'lucide-react';

export default function LogisticDashboardPage() {
  const kpis = [
    { title: 'Tugas Hari Ini', value: '18', sub: '12 Kirim, 6 Ambil', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Armada Beroperasi', value: '8 / 10', sub: '2 Standby / Servis', icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Driver On-Duty', value: '8 Orang', sub: 'Shift Pagi & Siang', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Kendala / Issue', value: '2', sub: 'Perlu Follow-up', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const recentActivities = [
    { time: '14:30', driver: 'Budi Santoso', vehicle: 'B 9481 KXZ', event: 'Tiba di PT Indofood Cibitung', status: 'Arrived' },
    { time: '13:15', driver: 'Ahmad Fauzi', vehicle: 'B 9102 SQA', event: 'Muat barang di Vendor Pulogadung', status: 'Pickup' },
    { time: '11:45', driver: 'Joko Susilo', vehicle: 'B 9301 TYA', event: 'Selesai serah terima di PT Astra Otoparts', status: 'Completed' },
    { time: '09:20', driver: 'Dedi Kurniawan', vehicle: 'B 9552 WXY', event: 'Lapor kendala: Gudang customer antre panjang', status: 'Issue' },
  ];

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <Truck className="w-4 h-4" /> Monitoring Operasional
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dashboard Logistik
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Ringkasan performa armada pengiriman, status driver, dan muatan secara live
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.title}</span>
                  <div className={`w-10 h-10 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center font-bold`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-3xl font-extrabold text-slate-900">{kpi.value}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{kpi.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Aktivitas Armada Live */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Aktivitas Logistik Terkini
              </h2>
              <span className="text-xs text-blue-600 font-bold cursor-pointer hover:underline">Lihat Semua</span>
            </div>

            <div className="divide-y divide-gray-100">
              {recentActivities.map((act, i) => (
                <div key={i} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400 text-[11px] font-bold">{act.time}</span>
                    <div>
                      <p className="font-bold text-slate-800">{act.event}</p>
                      <p className="text-[10px] text-slate-400">{act.driver} • {act.vehicle}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    act.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                    act.status === 'Issue' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {act.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Kesiapan Armada */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2 border-b border-gray-100 pb-3">
              <Car className="w-4 h-4 text-indigo-600" /> Status Armada Mobil
            </h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900 font-mono">B 9481 KXZ</p>
                  <p className="text-[10px] text-slate-500">Engkel Box 4 Roda</p>
                </div>
                <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Beroperasi</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900 font-mono">B 9102 SQA</p>
                  <p className="text-[10px] text-slate-500">CDD Long Box 6 Roda</p>
                </div>
                <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Beroperasi</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900 font-mono">B 9601 TYZ</p>
                  <p className="text-[10px] text-slate-500">Blind Van GranMax</p>
                </div>
                <span className="text-amber-600 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Standby Gudang</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
