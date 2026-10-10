import React, { useState } from 'react';
import { MapPin, Box, Plus, Trash2, ChevronRight, X, Download, Share2 } from 'lucide-react';
import DynamicProductForm from './modals/DynamicProductForm';
import { exportToPDF, generatePreviewHTML } from '../utils/pdfExport';
import { useAuth } from '../../context/AuthContext';

export const PRODUCT_LIST = [
  { code: 'EJR', name: 'Expansion Joint Rubber', category: 'Expansion joint' },
  { code: 'EJM', name: 'Expansion Joint Metal', category: 'Expansion joint' },
  { code: 'EJF', name: 'Expansion Joint Fabric', category: 'Expansion joint' },
  { code: 'SWG', name: 'Spiral Wound Gasket', category: 'Gasket' },
  { code: 'GMG', name: 'Grooved Metal Gasket', category: 'Gasket' },
  { code: 'RTI', name: 'Removable Thermal Insulation', category: 'Insulasi' },
  { code: 'GPP', name: 'Gland Packing', category: 'Packing' },
  { code: 'DFG', name: 'Die Formed Graphite', category: 'Packing' }
];

export const createEmptyLapanganData = () => {
  const today = new Date().toISOString().split('T')[0];
  return {
    actualSchedules: [{ id: 1, hari_ke: 1, tanggal: today, kegiatan: '' }],
    productProgress: []
  };
};

export default function StepLapangan({ data = createEmptyLapanganData(), stepData = {}, onChange, readOnly = false }) {
  const { user } = useAuth();
  const actualSchedules = data.actualSchedules?.length ? data.actualSchedules : createEmptyLapanganData().actualSchedules;
  const productProgress = data.productProgress || [];
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewParams, setPreviewParams] = useState(null);

  const updateData = (patch) => {
    if (readOnly) return;
    onChange?.({ ...data, ...patch });
  };

  const addSchedule = () => {
    if (readOnly) return;
    const today = new Date().toISOString().split('T')[0];
    updateData({
      actualSchedules: [
        ...actualSchedules,
        { id: Date.now(), hari_ke: actualSchedules.length + 1, tanggal: today, kegiatan: '' }
      ]
    });
  };

  const updateSchedule = (id, field, value) => {
    if (readOnly) return;
    updateData({
      actualSchedules: actualSchedules.map(schedule =>
        schedule.id === id ? { ...schedule, [field]: value } : schedule
      )
    });
  };

  const removeSchedule = (id) => {
    if (readOnly) return;
    if (actualSchedules.length === 1) return;
    
    const newSchedules = actualSchedules
      .filter(schedule => schedule.id !== id)
      .map((sch, index) => ({ ...sch, hari_ke: index + 1 }));
      
    updateData({
      actualSchedules: newSchedules
    });
  };

  const handleAddProduct = (product) => {
    if (readOnly) return;
    const count = productProgress.filter(item => item.code === product.code).length + 1;
    const formattedId = `${product.code}-${String(count).padStart(3, '0')}`;

    updateData({
      productProgress: [
        ...productProgress,
        {
          id: Date.now(),
          code: product.code,
          name: product.name,
          displayId: formattedId,
          lokasi: '',
          hari_ke: 1,
          percent: 0,
          filled_by: user ? (user.name || user.username || user.email) : 'Unknown',
          formData: {}
        }
      ]
    });
    setIsAddingProduct(false);
  };

  const handleProductDataChange = (answers, percentage) => {
    if (readOnly) return;
    // Jika tidak ada percentage dari component anak, fallback ke hitungan manual (sebagai backup)
    let calcPercent = percentage;
    if (calcPercent === undefined) {
      const filledKeys = Object.entries(answers).filter(([key, value]) =>
        !key.endsWith('_lainnya') && key !== 'custom_refs' && value !== undefined && value !== ''
      ).length;
      const estimatedTotal = Math.max(filledKeys, 10);
      calcPercent = Math.min(Math.round((filledKeys / estimatedTotal) * 100), 100);
    }

    // Extract hari_ke from the "Hari Survey" field if it exists in answers
    let newHariKe = selectedProduct ? selectedProduct.hari_ke : 1;
    const hariKeString = Object.values(answers).find(val => typeof val === 'string' && val.startsWith('Hari ke '));
    if (hariKeString) {
      const match = hariKeString.match(/Hari ke (\d+)/);
      if (match && match[1]) {
        newHariKe = parseInt(match[1], 10);
      }
    }

    updateData({
      productProgress: productProgress.map(product =>
        product.id === selectedProduct.id
          ? { ...product, formData: answers, percent: calcPercent, hari_ke: newHariKe }
          : product
      )
    });
    
    // Auto update selectedProduct without closing to keep formData in sync
    setSelectedProduct(prev => prev ? { ...prev, formData: answers, percent: calcPercent, hari_ke: newHariKe } : prev);
  };

  const handleSaveProductForm = (answers, percentage) => {
    if (readOnly) {
      setSelectedProduct(null);
      return;
    }
    handleProductDataChange(answers, percentage);
    setSelectedProduct(null);
  };

  const removeProductProgress = (id) => {
    if (readOnly) return;
    updateData({
      productProgress: productProgress.filter(product => product.id !== id)
    });
  };

  return (
    <div className="space-y-8">
      {readOnly && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">Read-Only</span>
            <span className="font-semibold text-emerald-900">Survey sudah selesai.</span>
            <span className="text-emerald-700">Data lapangan dan form produk hanya dapat dilihat.</span>
          </div>
        </div>
      )}

      <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Pelaksanaan Aktual</h2>
              <p className="text-sm text-gray-500">Pencatatan kegiatan harian di lapangan</p>
            </div>
          </div>
          {!readOnly && (
            <button onClick={addSchedule} className="flex items-center gap-1.5 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-200 transition-colors">
              <Plus className="w-4 h-4" /> Tambah Hari
            </button>
          )}
        </div>

        <div className="space-y-4">
          {actualSchedules.map((schedule, index) => {
            const hariKe = schedule.hari_ke || (index + 1);
            const tanggal = schedule.tanggal || new Date().toISOString().split('T')[0];

            return (
            <div key={schedule.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Hari ke:</label>
                <input
                  type="number"
                  value={hariKe}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed outline-none text-sm"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal Aktual</label>
                <input
                  type="date"
                  value={tanggal}
                  disabled={readOnly}
                  onChange={(e) => updateSchedule(schedule.id, 'tanggal', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                />
              </div>
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Area / Kegiatan Aktual</label>
                <input
                  type="text"
                  value={schedule.kegiatan || ''}
                  disabled={readOnly}
                  onChange={(e) => updateSchedule(schedule.id, 'kegiatan', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                  placeholder="Cth: Survey area produksi 1"
                />
              </div>
              {!readOnly && (
                <div className="md:col-span-1 flex justify-end md:justify-center pt-5">
                  <button
                    onClick={() => removeSchedule(schedule.id)}
                    disabled={actualSchedules.length === 1}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Data Produk</h2>
              <p className="text-sm text-gray-500">Progress survey produk di lapangan</p>
            </div>
          </div>
          {!readOnly && (
            <button
              onClick={() => setIsAddingProduct(!isAddingProduct)}
              className="flex items-center gap-1.5 text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-purple-200 transition-colors"
            >
              {isAddingProduct ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isAddingProduct ? 'Batal' : 'Tambah Produk'}
            </button>
          )}
        </div>

        {isAddingProduct && !readOnly && (
          <div className="mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100">
            <h3 className="text-sm font-bold text-purple-800 mb-3">Pilih Jenis Produk:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {PRODUCT_LIST.map(product => (
                <button
                  key={product.code}
                  onClick={() => handleAddProduct(product)}
                  className="flex flex-col items-start p-3 bg-white border border-purple-200 rounded-lg hover:border-purple-500 hover:shadow-sm transition-all text-left"
                >
                  <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 mb-1">{product.code}</span>
                  <span className="text-sm font-semibold text-gray-800 line-clamp-1">{product.name}</span>
                  <span className="text-xs text-gray-500">{product.category}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {productProgress.length === 0 && !isAddingProduct ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Box className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">Belum ada produk yang ditambahkan.</p>
            <p className="text-gray-400 text-sm">Klik "Tambah Produk" untuk mulai mencatat progress.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productProgress.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="relative group bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 hover:border-blue-300 transition-colors cursor-pointer shadow-sm"
              >
                {!readOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProductProgress(product.id);
                    }}
                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600 bg-white">
                      {product.code}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-base">{product.displayId}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {product.lokasi || 'Lokasi belum diisi'} - Hari {product.hari_ke}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Oleh: {product.filled_by || 'Belum ada'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm font-bold text-slate-800 flex items-center">
                      {product.percent}% <ChevronRight className="w-4 h-4 text-slate-400 ml-0.5" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Hitung skala agar A4 pas dengan LEBAR layar, sisanya bisa di-scroll ke bawah
                        const screenWidth = window.innerWidth;
                        const scaleW = (screenWidth - 32) / 794; // 32 = padding container
                        const initialScale = Math.max(0.1, Math.min(scaleW, 1));
                        
                        setPreviewParams({ code: product.code });
                        setPreviewScale(initialScale);
                        setPreviewHtml(generatePreviewHTML(stepData, data, product.code, initialScale));
                      }}
                      className="bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded-md text-xs font-bold hover:bg-orange-100 transition-colors"
                    >
                      Preview Laporan
                    </button>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${product.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <DynamicProductForm
          product={selectedProduct}
          existingData={selectedProduct.formData || {}}
          onClose={() => setSelectedProduct(null)}
          onSave={handleSaveProductForm}
          onChange={handleProductDataChange}
          schedules={actualSchedules}
          readOnly={readOnly}
        />
      )}

      {previewHtml && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-8">
          <div className="bg-[#1f1f1f] md:rounded-2xl shadow-2xl w-full h-full md:max-w-5xl md:h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#2d2d2d] text-gray-200">
              <h3 className="font-bold text-gray-100 text-lg">Preview Laporan</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#3d3d3d] rounded-lg shadow-sm overflow-hidden mr-2">
                  <button onClick={() => {
                    const s = Math.max(previewScale - 0.1, 0.1);
                    setPreviewScale(s);
                    setPreviewHtml(generatePreviewHTML(stepData, data, previewParams?.code, s));
                  }} className="px-3 py-1.5 hover:bg-[#4d4d4d] font-bold text-gray-300">-</button>
                  <span className="px-3 py-1.5 text-sm font-semibold text-gray-200 min-w-[3.5rem] text-center">{Math.round((previewScale || 1) * 100)}%</span>
                  <button onClick={() => {
                    const s = Math.min(previewScale + 0.1, 3);
                    setPreviewScale(s);
                    setPreviewHtml(generatePreviewHTML(stepData, data, previewParams?.code, s));
                  }} className="px-3 py-1.5 hover:bg-[#4d4d4d] font-bold text-gray-300">+</button>
                </div>
                
                <button 
                  onClick={() => exportToPDF(stepData, data, previewParams?.code)} 
                  className="p-2 text-gray-400 hover:text-white bg-[#3d3d3d] rounded-lg shadow-sm hover:bg-blue-600 transition-colors mr-1"
                  title="Unduh Laporan"
                >
                  <Download className="w-5 h-5" />
                </button>
                
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Laporan Survey GTE',
                        text: 'Silakan lihat lampiran Laporan Survey ini.',
                        url: window.location.href // Fallback to app link
                      }).catch(err => {
                        console.log("Error sharing:", err);
                      });
                    } else {
                      alert('Fitur bagikan otomatis tidak didukung. Silakan gunakan fitur Unduh (Save as PDF) lalu bagikan filenya secara manual.');
                    }
                  }} 
                  className="p-2 text-gray-400 hover:text-white bg-[#3d3d3d] rounded-lg shadow-sm hover:bg-green-600 transition-colors mr-1"
                  title="Bagikan"
                >
                  <Share2 className="w-5 h-5" />
                </button>

                <button onClick={() => setPreviewHtml(null)} className="p-2 text-gray-400 hover:text-white bg-[#3d3d3d] rounded-lg shadow-sm hover:bg-red-500 transition-colors ml-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full h-full bg-white relative">
              <iframe 
                srcDoc={previewHtml} 
                className="absolute top-0 left-0 w-full h-full border-0"
                title="Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
