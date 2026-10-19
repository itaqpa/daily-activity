import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layouts/MainLayout';
import {
  ArrowLeft,
  Box,
  Layers,
  Ruler,
  Calendar,
  Hammer,
  Camera,
  CheckCircle2,
  Clock,
  Printer,
  TrendingUp,
  FileText
} from 'lucide-react';
import Packing3DViewer from './components/Packing3DViewer';
import CrateSizeAndClearanceCard from './components/CrateSizeAndClearanceCard';
import AssemblyStepsGrid from './components/AssemblyStepsGrid';

const DUMMY_JOBS = [
  {
    id: 'PKG-20261017-001',
    packaging_number: 'PKG-20261017-001',
    so_number: 'SO-2026-0880',
    customer: 'PT Astra Daihatsu Motor',
    deadline: '2026-10-18',
    type_packaging: 'Wooden Box Export IPPC',
    panjang: 1000,
    lebar: 800,
    tinggi: 800,
    qty_pack: 50,
    carton_material: 'Double Wall (CB-Flute 7mm)',
    terpal_material: 'Terpal Plastik A12 Biru Silver',
    status: 'process',
    created_at: '2026-10-17 08:30'
  },
  {
    id: 'PKG-20261016-002',
    packaging_number: 'PKG-20261016-002',
    so_number: 'SO-2026-0884',
    customer: 'PT Denso Indonesia',
    deadline: '2026-10-17',
    type_packaging: 'Pallet Heavy Duty',
    panjang: 1100,
    lebar: 1100,
    tinggi: 150,
    qty_pack: 120,
    carton_material: 'Single Wall (B-Flute 3mm)',
    terpal_material: 'Stretch Film Wrap',
    status: 'done',
    created_at: '2026-10-16 09:15'
  },
  {
    id: 'PKG-20261015-003',
    packaging_number: 'PKG-20261015-003',
    so_number: 'SO-2026-0870',
    customer: 'PT Djarum Kudus',
    deadline: '2026-10-19',
    type_packaging: 'Crate Box (Peti Kayu Rangka)',
    panjang: 1400,
    lebar: 900,
    tinggi: 1100,
    qty_pack: 80,
    carton_material: 'Triple Wall Heavy Duty',
    terpal_material: 'Terpal Plastik A12',
    status: 'assigned',
    created_at: '2026-10-15 14:00'
  }
];

export default function ShowPackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const viewerRef = useRef(null);

  const [job] = useState(() => {
    return DUMMY_JOBS.find(j => j.id === id || j.packaging_number === id) || DUMMY_JOBS[0];
  });

  // Default Crate Size: 1000 × 800 × 800 mm (matching user reference)
  const [dimensions, setDimensions] = useState({
    panjang: job.panjang || 1000,
    lebar: job.lebar || 800,
    tinggi: job.tinggi || 800
  });

  // Default Clearance: Jarak Atas 300, Jarak Bawah 300, Celah Atas 0, Celah Bawah 0
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

  const WOOD_PRICE_PER_M3 = 4500000;
  const NAIL_PRICE_PER_KG = 25000;

  const totalVolume = summaryData?.totalVolumeM3 ?? 0;
  const totalLength = summaryData?.totalLengthM ?? 0;
  const areaKerja = summaryData?.areaKerjaM2 ?? 0;
  const estimatedNails = summaryData?.estimatedNailsKg ?? '0';

  const totalWoodCost = Math.round(totalVolume * WOOD_PRICE_PER_M3);
  const totalNailCost = Math.round(parseFloat(estimatedNails) * NAIL_PRICE_PER_KG);
  const totalLaborCost = summaryData?.estimatedLaborCost ?? 0;
  const grandTotalCost = totalWoodCost + totalNailCost + totalLaborCost;

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto text-slate-800">
        
        {/* TOP BAR / BACK LINK */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/logistic/packing')}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
                  {job.packaging_number}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  job.status === 'done'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : job.status === 'process'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {job.status === 'done' ? 'Siap Kirim' : job.status === 'process' ? 'Dalam Proses' : 'Permintaan Baru'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Kalkulasi Otomatis Dimensi, Volume Kayu & Desain Balok 3D (Ref: {job.so_number} - {job.customer})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => viewerRef.current?.handleScreenshot()}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>Simpan Foto 3D</span>
            </button>
          </div>
        </div>

        {/* 1. CRATE SIZE & INTERNAL CLEARANCE PANELS (MATCHING SCREENSHOT) */}
        <CrateSizeAndClearanceCard
          dimensions={dimensions}
          setDimensions={setDimensions}
          clearance={clearance}
          setClearance={setClearance}
        />

        {/* 2. MAIN 3D THREE.JS CANVAS & RESUME KEBUTUHAN KAYU (MATCHING show.blade.php LAYOUT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* LEFT 9 COLS: 3D ILUSTRASI WITH 2-TIER FLOATING CAD TOOLBAR */}
          <div className="lg:col-span-9 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Ilustrasi Packaging 3D (Three.js WebGL Engine)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Model 3D interaktif balok kayu, penutup, penyangga, dan titik paku
                  </p>
                </div>
              </div>

              {/* Quick assembly step pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveStep(0)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeStep === 0 ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Utuh 3D
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(9)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeStep === 9 ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                      activeStep === s ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              className="h-[520px] sm:h-[620px]"
            />
          </div>

          {/* RIGHT 3 COLS: RESUME KEBUTUHAN KAYU (MATCHING show.blade.php) */}
          <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                    Resume Kebutuhan Kayu
                  </h3>
                  <span className="text-[10px] text-slate-400 block">Kalkulasi Material</span>
                </div>
              </div>

              {/* KPI WIDGETS */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Panjang</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900 font-mono">
                      {totalLength.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-slate-500">m</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Luas</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900 font-mono">
                      {areaKerja.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-500">m²</span>
                  </div>
                </div>
              </div>

              {/* LIST PER MATERIAL */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Kebutuhan Per Material
                </span>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {summaryData?.groupedParts?.slice(0, 4).map((mat, idx) => (
                    <div key={idx} className="p-2.5 border border-slate-200 rounded-xl bg-white shadow-xs">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit">
                          {mat.name}
                        </span>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-mono text-[11px]">
                            {mat.thickMm}×{mat.widthMm}×{mat.lengthMm}
                          </span>
                          <span className="font-mono font-black text-emerald-600">
                            {mat.totalLengthM.toFixed(1)} m ({mat.qty} pcs)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!summaryData?.groupedParts || summaryData.groupedParts.length === 0) && (
                    <div className="text-center py-4 text-xs text-slate-400">
                      Memuat data material...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TOTAL PACKING ESTIMATE CARD */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Total Estimasi Packing
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Lengkap
                </span>
              </div>
              <div className="text-xl font-black text-emerald-700 font-mono">
                Rp {grandTotalCost.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-500">
                Kayu ({totalVolume.toFixed(4)} m³) + Paku ({estimatedNails} kg) + Upah
              </p>
            </div>

          </div>
        </div>

        {/* 3. LANGKAH PERAKITAN GRID (8 CARDS MATCHING SCREENSHOT) */}
        <AssemblyStepsGrid
          dimensions={dimensions}
          clearance={clearance}
          timberConfig={timberConfig}
          activeStep={activeStep}
          onSelectStep={setActiveStep}
        />

        {/* 4. BILL OF MATERIALS / CUTTING LIST */}
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
                  <th className="py-2.5 px-4 text-right">Est. Biaya</th>
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
            </table>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
