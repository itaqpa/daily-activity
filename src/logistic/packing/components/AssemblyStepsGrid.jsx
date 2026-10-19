import React, { useState } from 'react';
import {
  Layers,
  Box,
  Eye,
  CheckCircle2,
  Maximize2,
  Hammer,
  ArrowRight
} from 'lucide-react';
import Packing3DViewer from './Packing3DViewer';

const STEPS_DATA = [
  {
    step: 1,
    title: '1. KAKI BALOK & PYG BAWAH',
    desc: '3 Kaki balok bawah + 1 balok penyangga melintang'
  },
  {
    step: 2,
    title: '2. + PENUTUP BAWAH',
    desc: 'Papan penutup lantai bawah dipaku ke balok'
  },
  {
    step: 3,
    title: '3. + PNTP DEPAN BELAKANG',
    desc: 'Tiang vertikal & papan penutup depan-belakang'
  },
  {
    step: 4,
    title: '4. + PNTP KANAN KIRI',
    desc: 'Tiang vertikal & papan penutup sisi kanan-kiri'
  },
  {
    step: 5,
    title: '5. + PENYANGGA ATAS',
    desc: '3 Balok penyangga atas melintang'
  },
  {
    step: 6,
    title: '6. + PENUTUP ATAS',
    desc: 'Papan penutup atas dipasang & dipaku'
  },
  {
    step: 9,
    title: 'HASIL POSISI SEMUA TEREXPAND',
    desc: 'Exploded view posisi semua komponen terurai',
    isWide: true
  },
  {
    step: 0,
    title: 'HASIL AKHIR RAKITAN UTUH',
    desc: 'Hasil akhir peti kemas rakitan utuh & presisi',
    isWide: true
  }
];

export default function AssemblyStepsGrid({
  dimensions,
  clearance,
  timberConfig,
  activeStep,
  onSelectStep
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Hammer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight uppercase">
              LANGKAH PERAKITAN (ASSEMBLY STEPS)
            </h3>
            <p className="text-[11px] text-slate-500">
              Tahapan perakitan balok kayu, penutup, dan pemasangan paku terstandar
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
          8 Tahapan Konstruksi
        </span>
      </div>

      {/* TOP 6 STEPS (GRID 3 COLUMNS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {STEPS_DATA.slice(0, 6).map((item) => {
          const isSelected = activeStep === item.step;
          return (
            <div
              key={item.step}
              onClick={() => onSelectStep(item.step)}
              className={`rounded-xl border overflow-hidden transition-all cursor-pointer group ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/20 shadow-md'
                  : 'border-slate-200 hover:border-blue-300 hover:shadow-sm bg-white'
              }`}
            >
              {/* Header Card */}
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-tight">
                  {item.title}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isSelected ? 'bg-blue-600 text-white' : 'text-slate-400 group-hover:text-blue-600'
                }`}>
                  Step {item.step}
                </span>
              </div>

              {/* 3D Mini Canvas */}
              <div className="relative bg-slate-50 p-1">
                <Packing3DViewer
                  dimensions={dimensions}
                  clearance={clearance}
                  timberConfig={timberConfig}
                  assemblyStep={item.step}
                  className="h-[180px]"
                />
              </div>

              {/* Description */}
              <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 line-clamp-1">{item.desc}</span>
                <button
                  type="button"
                  className="text-blue-600 font-bold hover:underline flex items-center gap-0.5 flex-shrink-0"
                >
                  <span>Pilih</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTTOM 2 BIG CARDS (EXPANDED & ASSEMBLED FULL) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
        {STEPS_DATA.slice(6, 8).map((item) => {
          const isSelected = activeStep === item.step;
          return (
            <div
              key={item.step}
              onClick={() => onSelectStep(item.step)}
              className={`rounded-xl border overflow-hidden transition-all cursor-pointer group ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/20 shadow-md'
                  : 'border-slate-200 hover:border-blue-300 hover:shadow-sm bg-white'
              }`}
            >
              {/* Header */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-900 uppercase tracking-tight">
                  {item.title}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {item.step === 9 ? 'Exploded 3D' : 'Utuh 3D'}
                </span>
              </div>

              {/* 3D Canvas */}
              <div className="relative bg-slate-50 p-1">
                <Packing3DViewer
                  dimensions={dimensions}
                  clearance={clearance}
                  timberConfig={timberConfig}
                  assemblyStep={item.step}
                  className="h-[250px]"
                />
              </div>

              {/* Description */}
              <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">{item.desc}</span>
                <span className="text-blue-600 font-bold flex items-center gap-1">
                  <span>Lihat di Canvas Utama</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
