import React, { useState } from 'react';
import {
  X,
  Box,
  Layers,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import Step1PilihSO from './steps/Step1PilihSO';
import Step2PackingType from './steps/Step2PackingType';
import Step3RangkaDimensi from './steps/Step3RangkaDimensi';

export default function ModalWizardPackaging({
  isOpen,
  onClose,
  onSubmit,
  isSearchingAkurasi,
  onSearchSO
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // State Form Wizard Lengkap & Terpadu (Preserved Logic)
  const [formData, setFormData] = useState({
    // Step 1: Dokumen SO & Barang
    packaging_number: `PKG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
    so_number: '',
    customer: '',
    alamat_shipto: '',
    so_available_items: [],
    items: [],

    // Step 2: Packing Type & Penutup
    type_packaging: 'Box', // Box, Palet, Peti, Kerangka
    tipe_penutup: 'Papan',  // Papan, Triplek
    additional_mat: '',     // Terpal, Carton, Terpal + Carton, ''

    // Step 3: Data Utama Packaging & Konfigurasi Rangka
    packaging_date: new Date().toISOString().split('T')[0],
    packer_name: 'Bpk. Supriyanto (Leader)',
    qty_packaging: 1,

    // Dimensi mm
    panjang: 1200,
    lebar: 800,
    tinggi: 1000,

    // Area Bawah
    bawah_penyanggah: 'Include',
    bawah_penyanggah_arah: 'Horizontal',
    bawah_penyanggah_material: 'Balok Rimba 5x7 cm',
    jarak_penyanggah_bawah: 300,
    bawah_penutup: 'Papan Full',
    bawah_penutup_arah: 'Horizontal',
    gap_bawah: 20,
    bawah_kakibalok: 'Include',
    bawah_kakibalok_arah: 'Vertikal',
    bawah_kakibalok_material: 'Balok Rimba 8x10 cm',

    // Area Atas
    atas_penyanggah: 'Include',
    atas_penyanggah_arah: 'Vertikal',
    atas_penyanggah_material: 'Balok Rimba 5x7 cm',
    jarak_penyanggah_atas: 300,
    atas_penutup: 'Tanpa Penutup',
    atas_penutup_arah: 'Horizontal',
    gap_atas: 20,

    // Inner carton box
    inner_carton_boxes: []
  });

  if (!isOpen) return null;

  // Validasi Step Sebelum Lanjut (Preserved Logic)
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.items || formData.items.length === 0) {
        alert('Tarik data Sales Order (SO) dan masukkan minimal satu produk ke daftar muatan packaging.');
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!formData.type_packaging) {
        alert('Pilih type packaging terlebih dahulu.');
        return;
      }
      if (!formData.tipe_penutup) {
        alert('Pilih bahan penutup terlebih dahulu.');
        return;
      }
      setCurrentStep(3);
      return;
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!formData.panjang || !formData.lebar || !formData.tinggi) {
      alert('Dimensi Panjang, Lebar, dan Tinggi kemasan wajib diisi.');
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Packaging Calculation Wizard
                </h2>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {formData.packaging_number}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pilih dokumen SO, tipe kemasan kayu, dan kalkulasi dimensi rangka
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Progress Bar (Step 1, 2, 3) */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-center gap-3 sm:gap-6 text-xs font-semibold">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 1
                  ? 'bg-blue-600 text-white'
                  : currentStep > 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <span className={currentStep === 1 ? 'font-bold text-blue-700' : 'text-slate-600'}>
              Pilih Dokumen SO
            </span>
          </div>

          <div className={`w-8 sm:w-14 h-0.5 ${currentStep > 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 2
                  ? 'bg-blue-600 text-white'
                  : currentStep > 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <span className={currentStep === 2 ? 'font-bold text-blue-700' : 'text-slate-600'}>
              Packing Type & Penutup
            </span>
          </div>

          <div className={`w-8 sm:w-14 h-0.5 ${currentStep > 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

          {/* Step 3 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 3
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              3
            </div>
            <span className={currentStep === 3 ? 'font-bold text-blue-700' : 'text-slate-600'}>
              Dimensi & Rangka Kayu
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {currentStep === 1 && (
            <Step1PilihSO
              formData={formData}
              setFormData={setFormData}
              onSearchSO={onSearchSO}
              isSearchingAkurasi={isSearchingAkurasi}
            />
          )}

          {currentStep === 2 && (
            <Step2PackingType
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {currentStep === 3 && (
            <Step3RangkaDimensi
              formData={formData}
              setFormData={setFormData}
            />
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-xs text-slate-700 hover:bg-white flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-white font-bold text-xs transition-colors"
            >
              Batal
            </button>
          )}

          <div className="flex items-center gap-2.5">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-white font-bold text-xs transition-colors"
              >
                Batal
              </button>
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>
                  {currentStep === 1 ? 'Lanjut ke Packing Type' : 'Lanjut ke Dimensi & Rangka'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Kalkulasi Packaging</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
