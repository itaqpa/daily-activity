import React, { useState } from 'react';
import {
  X,
  ClipboardCheck,
  Layers,
  Wrench,
  CheckCircle2,
  Box,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';

export default function ModalValidasiMaterial({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('balok');

  // Master Data Material Sesuai packaging_validasi_data_material
  const [materials] = useState({
    balok: [
      { id: 1, kode: 'BLK-57', nama: 'BALOK RIMBA 5 x 7 CM', tebal: 50, lebar: 70, panjang: 4000, stok_m3: 14.5, satuan: 'Batang' },
      { id: 2, kode: 'BLK-68', nama: 'BALOK ALBASIA 6 x 8 CM', tebal: 60, lebar: 80, panjang: 3000, stok_m3: 8.2, satuan: 'Batang' },
      { id: 3, kode: 'BLK-46', nama: 'BALOK JATI BELANDA 4 x 6 CM', tebal: 40, lebar: 60, panjang: 2500, stok_m3: 5.0, satuan: 'Batang' }
    ],
    papan: [
      { id: 4, kode: 'PPN-210', nama: 'PAPAN RIMBA 2 x 10 CM', tebal: 20, lebar: 100, panjang: 4000, stok_m3: 22.0, satuan: 'Lembar' },
      { id: 5, kode: 'PPN-215', nama: 'PAPAN ALBASIA 2 x 15 CM', tebal: 20, lebar: 150, panjang: 3000, stok_m3: 16.8, satuan: 'Lembar' },
      { id: 6, kode: 'PPN-320', nama: 'PAPAN HEAVY DUTY 3 x 20 CM', tebal: 30, lebar: 200, panjang: 4000, stok_m3: 11.4, satuan: 'Lembar' }
    ],
    tripleks: [
      { id: 7, kode: 'TRP-09', nama: 'TRIPLEKS MERANTI 9 MM', tebal: 9, lebar: 1220, panjang: 2440, stok_m3: 350, satuan: 'Lembar' },
      { id: 8, kode: 'TRP-12', nama: 'TRIPLEKS MERANTI 12 MM', tebal: 12, lebar: 1220, panjang: 2440, stok_m3: 280, satuan: 'Lembar' },
      { id: 9, kode: 'TRP-18', nama: 'TRIPLEKS FILM FACE 18 MM', tebal: 18, lebar: 1220, panjang: 2440, stok_m3: 150, satuan: 'Lembar' }
    ],
    fastener: [
      { id: 10, kode: 'PKU-05', nama: 'PAKU ULIR PALLET 5 CM (2 INCH)', jenis: 'Paku Ulir', ukuran: '50 mm', stok_kg: 85, satuan: 'Kg' },
      { id: 11, kode: 'PKU-07', nama: 'PAKU ULIR PALLET 7 CM (3 INCH)', jenis: 'Paku Ulir', ukuran: '70 mm', stok_kg: 120, satuan: 'Kg' },
      { id: 12, kode: 'SKR-04', nama: 'SEKRUP DRYWALL HITAM 4 CM', jenis: 'Sekrup', ukuran: '40 mm', stok_kg: 45, satuan: 'Box' }
    ]
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Data Validasi Material & Fastener
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Katalog master dimensi kayu (Balok, Papan, Tripleks) & standar fastener kemasan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('balok')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'balok'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Master Balok ({materials.balok.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('papan')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'papan'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Master Papan ({materials.papan.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tripleks')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'tripleks'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Master Tripleks ({materials.tripleks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fastener')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'fastener'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Fastener & Paku ({materials.fastener.length})
          </button>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3">Kode Material</th>
                <th className="py-2.5 px-4">Nama Spesifikasi</th>
                <th className="py-2.5 px-3 text-center">Ukuran (T x L x P)</th>
                <th className="py-2.5 px-3 text-right">Stok Gudang</th>
                <th className="py-2.5 px-3 text-center">Satuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(materials[activeTab] || []).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-bold text-orange-700">{item.kode}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{item.nama}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-600">
                    {item.tebal ? `${item.tebal} x ${item.lebar} x ${item.panjang} mm` : item.ukuran}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                    {item.stok_m3 || item.stok_kg}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-500">{item.satuan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
