import React, { useState } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { Calculator, Search, Filter, Plus, FileCheck, CheckCircle2 } from 'lucide-react';

export default function HppRitasePage() {
  const [ritases, setRitases] = useState([
    {
      id: 'HPP-2026-10-001',
      rute: 'Cikarang → Karawang Timur',
      kendaraan: 'B 9481 KXZ (Engkel Box)',
      jarak_km: 45,
      driver: 'Budi Santoso',
      biaya_bbm: 180000,
      biaya_tol: 45000,
      uang_makan: 50000,
      total_hpp: 275000,
      status_validasi: 'Valid'
    },
    {
      id: 'HPP-2026-10-002',
      rute: 'Cikarang → Cikande Serang (Luar Kota)',
      kendaraan: 'B 9102 SQA (CDD Long)',
      jarak_km: 125,
      driver: 'Ahmad Fauzi',
      biaya_bbm: 420000,
      biaya_tol: 120000,
      uang_makan: 100000,
      total_hpp: 640000,
      status_validasi: 'Perlu Review'
    }
  ]);

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <Calculator className="w-4 h-4" /> Cost Control & HPP
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Kalkulasi HPP Ritase
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Penetapan dan validasi Harga Pokok Penjualan (HPP) per rute ritase armada pengiriman
            </p>
          </div>
          <button
            type="button"
            onClick={() => alert('Hitung Simulasi HPP Ritase Baru')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Kalkulasi HPP Baru</span>
          </button>
        </div>

        {/* Tabel HPP Ritase */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-gray-100 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-4">Kode HPP</th>
                  <th className="py-3 px-4">Trayek / Rute Ritase</th>
                  <th className="py-3 px-4">Armada & Driver</th>
                  <th className="py-3 px-4 text-center">Estimasi Jarak</th>
                  <th className="py-3 px-4 text-right">Biaya BBM</th>
                  <th className="py-3 px-4 text-right">Tol & Parkir</th>
                  <th className="py-3 px-4 text-right">Total HPP Ritase</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-slate-700">
                {ritases.map((r, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{r.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{r.rute}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{r.kendaraan}</p>
                      <p className="text-[10px] text-slate-400">{r.driver}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-600">{r.jarak_km} KM</td>
                    <td className="py-3.5 px-4 text-right text-slate-700">Rp {r.biaya_bbm.toLocaleString('id-ID')}</td>
                    <td className="py-3.5 px-4 text-right text-slate-700">Rp {r.biaya_tol.toLocaleString('id-ID')}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-blue-700 text-sm">
                      Rp {r.total_hpp.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        r.status_validasi === 'Valid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {r.status_validasi}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
