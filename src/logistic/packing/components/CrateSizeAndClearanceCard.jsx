import React from 'react';
import {
  Box,
  MoveHorizontal,
  MoveVertical,
  Maximize2,
  Info,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown
} from 'lucide-react';

export default function CrateSizeAndClearanceCard({
  dimensions,
  setDimensions,
  clearance,
  setClearance
}) {
  const handleDimChange = (key, value) => {
    setDimensions((prev) => ({
      ...prev,
      [key]: Math.max(100, parseInt(value, 10) || 100)
    }));
  };

  const handleClearanceChange = (key, value) => {
    setClearance((prev) => ({
      ...prev,
      [key]: Math.max(0, parseInt(value, 10) || 0)
    }));
  };

  return (
    <div className="space-y-4">
      {/* 1. CRATE SIZE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight uppercase">
              CRATE SIZE
            </h3>
            <p className="text-xs text-slate-500">
              Ukuran luar peti kemas / crate
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Panjang (P) */}
          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <MoveHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Panjang (P)</span>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                step={50}
                min={200}
                value={dimensions.panjang}
                onChange={(e) => handleDimChange('panjang', e.target.value)}
                className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg font-mono font-black text-slate-900 text-lg focus:outline-none"
              />
              <span className="absolute right-3 font-mono font-bold text-xs text-slate-400 pointer-events-none">
                mm
              </span>
            </div>
          </div>

          {/* Lebar (L) */}
          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <MoveHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Lebar (L)</span>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                step={50}
                min={200}
                value={dimensions.lebar}
                onChange={(e) => handleDimChange('lebar', e.target.value)}
                className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg font-mono font-black text-slate-900 text-lg focus:outline-none"
              />
              <span className="absolute right-3 font-mono font-bold text-xs text-slate-400 pointer-events-none">
                mm
              </span>
            </div>
          </div>

          {/* Tinggi (T) */}
          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <MoveVertical className="w-3.5 h-3.5 text-blue-600" />
              <span>Tinggi (T)</span>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                step={50}
                min={200}
                value={dimensions.tinggi}
                onChange={(e) => handleDimChange('tinggi', e.target.value)}
                className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg font-mono font-black text-slate-900 text-lg focus:outline-none"
              />
              <span className="absolute right-3 font-mono font-bold text-xs text-slate-400 pointer-events-none">
                mm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTERNAL CLEARANCE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <MoveVertical className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight uppercase">
              INTERNAL CLEARANCE
            </h3>
            <p className="text-xs text-slate-500">
              Ruang tambahan untuk handling dan keamanan barang
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Jarak Atas */}
          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Jarak Atas</span>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                step={10}
                min={0}
                value={clearance.jarakAtas}
                onChange={(e) => handleClearanceChange('jarakAtas', e.target.value)}
                className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg font-mono font-black text-slate-900 text-lg focus:outline-none"
              />
              <span className="absolute right-3 font-mono font-bold text-xs text-slate-400 pointer-events-none">
                mm
              </span>
            </div>
          </div>

          {/* Jarak Bawah */}
          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
              <span>Jarak Bawah</span>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                step={10}
                min={0}
                value={clearance.jarakBawah}
                onChange={(e) => handleClearanceChange('jarakBawah', e.target.value)}
                className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg font-mono font-black text-slate-900 text-lg focus:outline-none"
              />
              <span className="absolute right-3 font-mono font-bold text-xs text-slate-400 pointer-events-none">
                mm
              </span>
            </div>
          </div>

          {/* Celah Atas */}
          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <ChevronsUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Celah Atas</span>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                step={5}
                min={0}
                value={clearance.celahAtas}
                onChange={(e) => handleClearanceChange('celahAtas', e.target.value)}
                className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg font-mono font-black text-slate-900 text-lg focus:outline-none"
              />
              <span className="absolute right-3 font-mono font-bold text-xs text-slate-400 pointer-events-none">
                mm
              </span>
            </div>
          </div>

          {/* Celah Bawah */}
          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <ChevronsDown className="w-3.5 h-3.5 text-emerald-600" />
              <span>Celah Bawah</span>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                step={5}
                min={0}
                value={clearance.celahBawah}
                onChange={(e) => handleClearanceChange('celahBawah', e.target.value)}
                className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg font-mono font-black text-slate-900 text-lg focus:outline-none"
              />
              <span className="absolute right-3 font-mono font-bold text-xs text-slate-400 pointer-events-none">
                mm
              </span>
            </div>
          </div>
        </div>

        {/* Note Box */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-slate-600 leading-relaxed text-[11px] sm:text-xs">
            Nilai clearance digunakan sebagai ruang tambahan untuk memudahkan proses handling dan menjaga keamanan barang.
          </p>
        </div>
      </div>
    </div>
  );
}
