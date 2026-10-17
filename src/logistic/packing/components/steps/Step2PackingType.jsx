import React from 'react';
import {
  Box,
  Layers,
  Check,
  Info
} from 'lucide-react';

export default function Step2PackingType({ formData, setFormData }) {
  const packingTypes = [
    {
      id: 'Box',
      title: 'Box Kayu',
      desc: 'Peti kayu tertutup rapat untuk mesin industri dan barang ekspor.'
    },
    {
      id: 'Palet',
      title: 'Palet Kayu',
      desc: 'Alas tatakan datar kayu kuat untuk penanganan forklift.'
    },
    {
      id: 'Peti',
      title: 'Peti Kayu',
      desc: 'Peti berbilah papan berjarak untuk sirkulasi udara & efisiensi bobot.'
    },
    {
      id: 'Kerangka',
      title: 'Kerangka Kayu',
      desc: 'Rangka penahan kargo struktural tanpa atap tertutup komplit.'
    }
  ];

  const handleSelectPackingType = (type) => {
    setFormData(prev => {
      let cover = prev.tipe_penutup;
      // Peti Kayu hanya support Papan
      if (type === 'Peti' && cover === 'Triplek') {
        cover = 'Papan';
      }
      return {
        ...prev,
        type_packaging: type,
        tipe_penutup: cover
      };
    });
  };

  const handleSelectCover = (cover) => {
    setFormData(prev => ({
      ...prev,
      tipe_penutup: cover
    }));
  };

  const handleSelectAdditional = (mat) => {
    setFormData(prev => ({
      ...prev,
      additional_mat: mat
    }));
  };

  return (
    <div className="space-y-4">
      {/* 1. Pilih Jenis Kemasan */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          1. Pilih Jenis Kemasan (Packing Type)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {packingTypes.map((pt) => {
            const isSelected = formData.type_packaging === pt.id;
            return (
              <div
                key={pt.id}
                onClick={() => handleSelectPackingType(pt.id)}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900">
                      {pt.title}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {pt.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Bahan Penutup & Material Tambahan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bahan Penutup */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            2. Bahan Penutup Kemasan
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'Papan', title: 'Papan Kayu', desc: 'Papan rimba tebal' },
              { id: 'Triplek', title: 'Triplek / Plywood', desc: 'Kayu lapis rata' }
            ].map((cover) => {
              const isSelected = formData.tipe_penutup === cover.id;
              const isDisabled = formData.type_packaging === 'Peti' && cover.id === 'Triplek';

              return (
                <button
                  key={cover.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectCover(cover.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isDisabled
                      ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed'
                      : isSelected
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {cover.title}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {cover.desc}
                    </span>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {formData.type_packaging === 'Peti' && (
            <p className="text-[11px] text-amber-700 flex items-center gap-1 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Peti Kayu mewajibkan bahan penutup menggunakan Papan berjarak.
            </p>
          )}
        </div>

        {/* Material Tambahan */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            3. Material Pembungkus Tambahan
          </h4>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: '', label: 'Tanpa Tambahan' },
              { id: 'Terpal', label: 'Terpal Plastik' },
              { id: 'Carton', label: 'Carton Sheet' },
              { id: 'Terpal + Carton', label: 'Terpal + Carton' }
            ].map((item) => {
              const isSelected = (formData.additional_mat || '') === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectAdditional(item.id)}
                  className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ringkasan Step 2 */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Pilihan Aktif:</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">
            {formData.type_packaging}
          </span>
          <span className="text-slate-400">/</span>
          <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-bold">
            {formData.tipe_penutup}
          </span>
          {formData.additional_mat && (
            <>
              <span className="text-slate-400">/</span>
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold">
                {formData.additional_mat}
              </span>
            </>
          )}
        </div>

        <span className="text-[11px] text-slate-500">
          Muatan: {formData.items.length} Barang terdaftar
        </span>
      </div>
    </div>
  );
}
