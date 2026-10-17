import React, { useState } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { FileBarChart, Download, Calendar, Filter, Truck, Package, CheckCircle2 } from 'lucide-react';

export default function LaporanLogistikPage() {
  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <FileBarChart className="w-4 h-4" /> Reporting & Analytics
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Laporan Logistik
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Laporan performa ketepatan waktu pengiriman, produktivitas armada, dan rekapitulasi ritase
            </p>
          </div>
          <button
            type="button"
            onClick={() => alert('Download Rekap Laporan Bulanan (Excel)')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Download Rekap Excel</span>
          </button>
        </div>

        {/* Ringkasan Performa */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">On-Time Delivery Rate</span>
            <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">96.4%</h3>
            <p className="text-xs text-slate-500 mt-1">Target bulanan: min. 95%</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Ritase Selesai</span>
            <h3 className="text-3xl font-extrabold text-blue-600 mt-2">142 Ritase</h3>
            <p className="text-xs text-slate-500 mt-1">Periode: Oktober 2026</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Tingkat Retur / Kendala</span>
            <h3 className="text-3xl font-extrabold text-amber-600 mt-2">1.8%</h3>
            <p className="text-xs text-slate-500 mt-1">Rata-rata isu: akses gudang</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
