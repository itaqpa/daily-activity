import React, { useState } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { Receipt, Search, Filter, Plus, Calendar, DollarSign, Fuel, Wrench, Download } from 'lucide-react';

export default function RiwayatPengeluaranPage() {
  const [expenses, setExpenses] = useState([
    {
      id: 'EXP-001',
      tanggal: '2026-10-16',
      driver: 'Budi Santoso',
      plat_mobil: 'B 9481 KXZ',
      kategori: 'BBM Solar',
      nominal: 250000,
      keterangan: 'Isi Solar di SPBU KM 19 Tol Japek',
      struk_lampiran: 'struk_bbm_01.jpg',
      status: 'Approved'
    },
    {
      id: 'EXP-002',
      tanggal: '2026-10-16',
      driver: 'Budi Santoso',
      plat_mobil: 'B 9481 KXZ',
      kategori: 'Tol & Parkir',
      nominal: 45000,
      keterangan: 'Tol Cikarang Barat - Karawang Timur',
      struk_lampiran: 'etoll_slip.jpg',
      status: 'Approved'
    },
    {
      id: 'EXP-003',
      tanggal: '2026-10-15',
      driver: 'Ahmad Fauzi',
      plat_mobil: 'B 9102 SQA',
      kategori: 'Tambal Ban / Darurat',
      nominal: 75000,
      keterangan: 'Tambal ban belakang kanan di Pantura',
      struk_lampiran: 'nota_bengkel.jpg',
      status: 'Pending Review'
    }
  ]);

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <Receipt className="w-4 h-4" /> Klaim Biaya Driver
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Riwayat Pengeluaran Driver
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Monitoring dan verifikasi struk reimbursement operasional driver (BBM, e-Toll, Parkir, Darurat)
            </p>
          </div>
          <button
            type="button"
            onClick={() => alert('Download Rekap Pengeluaran Driver')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Rekap Biaya</span>
          </button>
        </div>

        {/* Tabel Pengeluaran */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-gray-100 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-4">Tgl Pengajuan</th>
                  <th className="py-3 px-4">Driver & Mobil</th>
                  <th className="py-3 px-4">Kategori Biaya</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4">Keterangan / Lokasi</th>
                  <th className="py-3 px-4 text-center">Struk / Bukti</th>
                  <th className="py-3 px-4 text-center">Status Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-slate-700">
                {expenses.map((exp, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-600">{exp.tanggal}</td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{exp.driver}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{exp.plat_mobil}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {exp.kategori}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-blue-600">
                      Rp {exp.nominal.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{exp.keterangan}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                        Lihat Foto
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        exp.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {exp.status}
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
