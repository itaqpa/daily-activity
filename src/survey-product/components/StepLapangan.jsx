import React, { useState } from 'react';
import { MapPin, Box, Plus, Trash2, CheckCircle2, ChevronRight, X } from 'lucide-react';

const PRODUCT_LIST = [
  { code: 'EJR', name: 'Expansion Joint Rubber', category: 'Expansion joint' },
  { code: 'EJM', name: 'Expansion Joint Metal', category: 'Expansion joint' },
  { code: 'EJF', name: 'Expansion Joint Fabric', category: 'Expansion joint' },
  { code: 'SWG', name: 'Spiral Wound Gasket', category: 'Gasket' },
  { code: 'GMG', name: 'Grooved Metal Gasket', category: 'Gasket' },
  { code: 'RTI', name: 'Removable Thermal Insulation', category: 'Insulasi' },
  { code: 'GPP', name: 'Gland Packing', category: 'Packing' },
  { code: 'DFG', name: 'Die Formed Graphite', category: 'Packing' }
];

export default function StepLapangan() {
  const [actualSchedules, setActualSchedules] = useState([
    { id: 1, hari_ke: '', tanggal: '', kegiatan: '' }
  ]);

  const [productProgress, setProductProgress] = useState([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const addSchedule = () => {
    setActualSchedules([
      ...actualSchedules,
      { id: Date.now(), hari_ke: '', tanggal: '', kegiatan: '' }
    ]);
  };

  const removeSchedule = (id) => {
    setActualSchedules(actualSchedules.filter(s => s.id !== id));
  };

  const handleAddProduct = (product) => {
    // Count existing products of the same code to generate ID like EJR-001
    const count = productProgress.filter(p => p.code === product.code).length + 1;
    const formattedId = `${product.code}-${String(count).padStart(3, '0')}`;

    setProductProgress([
      ...productProgress,
      { 
        id: Date.now(), 
        code: product.code, 
        name: product.name, 
        displayId: formattedId,
        lokasi: '', 
        hari_ke: 1, 
        percent: 0 
      }
    ]);
    setIsAddingProduct(false);
  };

  const removeProductProgress = (id) => {
    setProductProgress(productProgress.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Hari Pelaksanaan Aktual */}
      <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Section 1: Pelaksanaan Aktual</h2>
              <p className="text-sm text-gray-500">Pencatatan kegiatan harian di lapangan</p>
            </div>
          </div>
          <button onClick={addSchedule} className="flex items-center gap-1.5 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-200 transition-colors">
            <Plus className="w-4 h-4" /> Tambah Hari
          </button>
        </div>

        <div className="space-y-4">
          {actualSchedules.map((schedule) => (
            <div key={schedule.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Hari ke:</label>
                <input 
                  type="number" 
                  min="1" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" 
                  placeholder="Cth: 1" 
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal Aktual</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700 bg-white" 
                />
              </div>
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Area / Kegiatan Aktual</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" 
                  placeholder="Cth: Survey area produksi 1" 
                />
              </div>
              <div className="md:col-span-1 flex justify-end md:justify-center pt-5">
                <button 
                  onClick={() => removeSchedule(schedule.id)}
                  disabled={actualSchedules.length === 1}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Data Product */}
      <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Section 2: Data Produk</h2>
              <p className="text-sm text-gray-500">Progress survey produk di lapangan</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddingProduct(!isAddingProduct)} 
            className="flex items-center gap-1.5 text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-purple-200 transition-colors"
          >
            {isAddingProduct ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
            {isAddingProduct ? 'Batal' : 'Tambah Produk'}
          </button>
        </div>

        {isAddingProduct && (
          <div className="mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100">
            <h3 className="text-sm font-bold text-purple-800 mb-3">Pilih Jenis Produk:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {PRODUCT_LIST.map(prod => (
                <button
                  key={prod.code}
                  onClick={() => handleAddProduct(prod)}
                  className="flex flex-col items-start p-3 bg-white border border-purple-200 rounded-lg hover:border-purple-500 hover:shadow-sm transition-all text-left"
                >
                  <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 mb-1">{prod.code}</span>
                  <span className="text-sm font-semibold text-gray-800 line-clamp-1">{prod.name}</span>
                  <span className="text-xs text-gray-500">{prod.category}</span>
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
              <div key={product.id} className="relative group bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 hover:border-blue-300 transition-colors cursor-pointer shadow-sm">
                
                {/* Delete button (shows on hover) */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeProductProgress(product.id);
                  }}
                  className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600 bg-white">
                      {product.code}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-base">{product.displayId}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {product.lokasi || 'Lokasi belum diisi'} · Hari {product.hari_ke}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm font-bold text-slate-800 flex items-center">
                      {product.percent}% <ChevronRight className="w-4 h-4 text-slate-400 ml-0.5" />
                    </div>
                    <button 
                      onClick={(e) => e.stopPropagation()}
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
    </div>
  );
}
