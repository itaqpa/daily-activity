import React, { useState, useRef } from 'react';
import {
  X,
  Box,
  Layers,
  Ruler,
  Calendar,
  User,
  Hammer,
  DollarSign,
  FileText,
  Printer,
  Camera,
  CheckCircle2,
  Clock,
  Sliders,
  ChevronDown,
  ChevronUp,
  Package,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import Packing3DViewer from './Packing3DViewer';
import CrateSizeAndClearanceCard from './CrateSizeAndClearanceCard';
import AssemblyStepsGrid from './AssemblyStepsGrid';

export default function ModalShowPacking({ isOpen, onClose, job }) {
  if (!isOpen || !job) return null;

  const viewerRef = useRef(null);

  // Default dimensi sesuai gambar referensi pengguna: P=1000, L=800, T=800
  const [dimensions, setDimensions] = useState({
    panjang: job.panjang || 1000,
    lebar: job.lebar || 800,
    tinggi: job.tinggi || 800
  });

  // Clearance sesuai gambar: Jarak Atas 300, Jarak Bawah 300, Celah Atas 0, Celah Bawah 0
  const [clearance, setClearance] = useState({
    jarakAtas: 300,
    jarakBawah: 300,
    celahAtas: 0,
    celahBawah: 0
  });

  const [timberConfig, setTimberConfig] = useState({
    skidWidth: 80,
    skidHeight: 80,
    skidCount: 3,
    pygSize: 60,
    boardWidth: 140,
    boardThickness: 20,
    boardGap: 15,
    postWidth: 70,
    postThickness: 50,
    postsPerSide: 3
  });

  const [activeStep, setActiveStep] = useState(0); // 0 = Full, 1..6 = Steps, 9 = Exploded
  const [summaryData, setSummaryData] = useState(null);
  const [activeTab, setActiveTab] = useState('assembly'); // 'assembly', 'cutting-list', 'specs'

  const defaultBoxVol = ((dimensions.panjang || 1000) * (dimensions.lebar || 800) * (dimensions.tinggi || 800)) / 1e9;
  const totalVolume = summaryData?.totalVolumeM3 ?? 0;
  const totalLength = summaryData?.totalLengthM ?? 0;
  const boxOuterVolume = summaryData?.boxOuterVolumeM3 ?? defaultBoxVol;
  const estimatedNails = summaryData?.estimatedNailsKg ?? '0';

  const WOOD_PRICE_PER_M3 = 4500000;
  const NAIL_PRICE_PER_KG = 25000;

  const totalWoodCost = Math.round(totalVolume * WOOD_PRICE_PER_M3);
  const totalNailCost = Math.round(parseFloat(estimatedNails) * NAIL_PRICE_PER_KG);
  const totalLaborCost = summaryData?.estimatedLaborCost ?? 0;
  const grandTotalCost = totalWoodCost + totalNailCost + totalLaborCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-7xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] my-auto">
        
        {/* HEADER MODAL */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white font-mono">
                  {job.packaging_number}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  job.status === 'done'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : job.status === 'process'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {job.status === 'done' ? 'Siap Kirim' : job.status === 'process' ? 'Dalam Proses' : 'Permintaan Baru'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>SO: <strong className="text-slate-200">{job.so_number}</strong></span>
                <span>•</span>
                <span>Customer: <strong className="text-slate-200">{job.customer}</strong></span>
                <span>•</span>
                <span>Tipe: <strong className="text-blue-400">{job.type_packaging}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => viewerRef.current?.handleScreenshot()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Foto 3D</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all flex items-center justify-center border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY CONTAINER (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50">
          
          {/* BARIS 1: CRATE SIZE & INTERNAL CLEARANCE PANELS */}
          <CrateSizeAndClearanceCard
            dimensions={dimensions}
            setDimensions={setDimensions}
            clearance={clearance}
            setClearance={setClearance}
          />

          {/* BARIS 2: SUMMARY KPI STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Ukuran Crate
              </span>
              <div className="font-black text-slate-900 font-mono text-sm sm:text-base">
                {dimensions.panjang}×{dimensions.lebar}×{dimensions.tinggi}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">mm (P × L × T)</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Kapasitas Volume
              </span>
              <div className="font-black text-blue-600 font-mono text-sm sm:text-base">
                {boxOuterVolume.toFixed(3)} m³
              </div>
              <span className="text-[10px] text-slate-400 block">Kubikasi Crate</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Kebutuhan Kayu
              </span>
              <div className="font-black text-emerald-600 font-mono text-sm sm:text-base">
                {totalVolume.toFixed(4)} m³
              </div>
              <span className="text-[10px] text-slate-400 block">
                {summaryData ? `${summaryData.totalPieces || 0} Batang Balok` : '-'}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Panjang Kayu
              </span>
              <div className="font-black text-purple-600 font-mono text-sm sm:text-base">
                {totalLength.toFixed(1)} m
              </div>
              <span className="text-[10px] text-slate-400 block">Total Akumulasi</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Titik Paku & Fastener
              </span>
              <div className="font-black text-amber-600 font-mono text-sm sm:text-base">
                {summaryData ? `${summaryData.estimatedNailsKg} kg` : '0 kg'}
              </div>
              <span className="text-[10px] text-slate-400 block">
                {summaryData ? `${summaryData.totalNailsCount} titik paku` : '-'}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1 bg-gradient-to-br from-white to-blue-50/50">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                Total Biaya Est.
              </span>
              <div className="font-black text-slate-900 font-mono text-sm sm:text-base">
                Rp {grandTotalCost.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-slate-500 block">Kayu + Paku + Upah</span>
            </div>
          </div>

          {/* BARIS 3: MAIN 3D THREE.JS CANVAS */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Visualisasi 3D Utama Peti Kemas (Three.js WebGL)
                </h3>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  {activeStep === 0 ? 'HASIL AKHIR RAKITAN UTUH' : activeStep === 9 ? 'EXPLODED VIEW' : `STEP ${activeStep}`}
                </span>
              </div>

              {/* Step Quick Switcher */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveStep(0)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeStep === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Utuh
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(9)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeStep === 9 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Exploded
                </button>
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActiveStep(s)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeStep === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    S{s}
                  </button>
                ))}
              </div>
            </div>

            <Packing3DViewer
              ref={viewerRef}
              dimensions={dimensions}
              clearance={clearance}
              timberConfig={timberConfig}
              assemblyStep={activeStep}
              onCalculateSummary={setSummaryData}
              className="h-[460px] sm:h-[540px]"
            />
          </div>

          {/* BARIS 4: LANGKAH PERAKITAN GRID (8 CARDS) */}
          <AssemblyStepsGrid
            dimensions={dimensions}
            clearance={clearance}
            timberConfig={timberConfig}
            activeStep={activeStep}
            onSelectStep={setActiveStep}
          />

          {/* BARIS 5: BILL OF MATERIALS / CUTTING LIST */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Ruler className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight uppercase">
                    BILL OF MATERIALS & CUTTING LIST KAYU
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kalkulasi otomatis jumlah dan potongan balok kayu berdasarkan dimensi {dimensions.panjang} × {dimensions.lebar} × {dimensions.tinggi} mm
                  </p>
                </div>
              </div>

              <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                Total: {summaryData?.totalPieces || 0} pieces • {totalVolume.toFixed(4)} m³
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-slate-200 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 text-center w-10">No</th>
                    <th className="py-2.5 px-4">Nama Komponen</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-4 text-center">Ukuran (T × L × P mm)</th>
                    <th className="py-2.5 px-3 text-center">Qty Potong</th>
                    <th className="py-2.5 px-3 text-right">Tot. Panjang</th>
                    <th className="py-2.5 px-3 text-right">Volume (m³)</th>
                    <th className="py-2.5 px-4 text-right">Est. Biaya Kayu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {summaryData?.groupedParts?.map((part, idx) => {
                    const cost = Math.round(part.totalVolumeM3 * WOOD_PRICE_PER_M3);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {part.name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {part.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-800">
                          {part.thickMm} × {part.widthMm} × {part.lengthMm}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 bg-slate-50/60">
                          {part.qty} pcs
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                          {part.totalLengthM.toFixed(2)} m
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {part.totalVolumeM3.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          Rp {cost.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-black text-slate-900 border-t border-slate-200">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-4 text-right uppercase tracking-wider">
                      Total Kayu Rangka & Penutup:
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {summaryData?.totalPieces || 0} pcs
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {totalLength.toFixed(2)} m
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                      {totalVolume.toFixed(4)} m³
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-blue-700">
                      Rp {totalWoodCost.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Kalkulasi otomatis balok kayu & 8 tahapan perakitan 3D siap digunakan
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => viewerRef.current?.handleScreenshot()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Simpan Gambar Desain</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
