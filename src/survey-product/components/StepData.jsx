import React, { useState } from 'react';
import { Building2, MapPin, Calendar, User, Phone, FileText, Target, Plus, Trash2, PackageOpen, CalendarDays } from 'lucide-react';

export default function StepData() {
  // Constants
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

  // State for dynamic lists and selections
  const [selectedProducts, setSelectedProducts] = useState([]);

  const toggleProduct = (code) => {
    setSelectedProducts(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const [schedules, setSchedules] = useState([
    { id: 1, hari: '', tanggal: '', rencana_area: '', target_item: '' }
  ]);



  const addSchedule = () => {
    setSchedules([
      ...schedules,
      { id: Date.now(), hari: '', tanggal: '', rencana_area: '', target_item: '' }
    ]);
  };

  const removeSchedule = (id) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Data Survey */}
      <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Section 1: Data Survey</h2>
            <p className="text-sm text-gray-500">Informasi utama terkait identitas dan lokasi survey</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Client / Perusahaan */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data Client / Perusahaan <span className="text-red-500">*</span></label>
            <div className="relative">
              <Building2 className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Nama Perusahaan Client" />
            </div>
          </div>

          {/* Plant / Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Plant / Area <span className="text-red-500">*</span></label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Area Plant" />
            </div>
          </div>

          {/* Alamat Lokasi */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Lokasi <span className="text-red-500">*</span></label>
            <textarea rows="3" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Alamat lengkap lokasi survey..."></textarea>
          </div>

          {/* Tanggal Mulai */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Mulai <span className="text-red-500">*</span></label>
            <div className="relative">
              <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="date" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700" />
            </div>
          </div>

          {/* Nama Surveyor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Surveyor <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Pilih / Ketik Surveyor" />
            </div>
          </div>

          {/* Marketing / Sales */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Marketing / Sales <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Nama Marketing" />
            </div>
          </div>

          {/* No Inquiry / Referensi */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">No Inquiry / Referensi</label>
            <div className="relative">
              <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Nomor referensi (opsional)" />
            </div>
          </div>

          {/* PIC Client */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">PIC Client <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Nama PIC dari Client" />
            </div>
          </div>

          {/* Kontak PIC */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Kontak PIC <span className="text-red-500">*</span></label>
            <div className="relative">
              <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="No HP / Email PIC" />
            </div>
          </div>

          {/* Tujuan Survey */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tujuan Survey <span className="text-red-500">*</span></label>
            <div className="relative">
              <Target className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <textarea rows="3" className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Sebutkan tujuan pelaksanaan survey..."></textarea>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Produk yang direncanakan */}
      <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <PackageOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Section 2: Produk Terencana</h2>
            <p className="text-sm text-gray-500">Pilih produk yang direncanakan untuk disurvey</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {PRODUCT_LIST.map((product) => {
            const isSelected = selectedProducts.includes(product.code);
            return (
              <label 
                key={product.code} 
                className={`relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all duration-200 ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-50/50 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                    {product.code}
                  </span>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300 bg-white'
                  }`}>
                    {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
                <div className="mt-1">
                  <h3 className={`font-semibold text-sm ${isSelected ? 'text-purple-900' : 'text-gray-800'}`}>
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={isSelected}
                  onChange={() => toggleProduct(product.code)}
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 3: Rencana Jadwal Survey */}
      <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Section 3: Rencana Jadwal</h2>
              <p className="text-sm text-gray-500">Alokasi hari dan target item di lapangan</p>
            </div>
          </div>
          <button onClick={addSchedule} className="flex items-center gap-1.5 text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-green-200 transition-colors">
            <Plus className="w-4 h-4" /> Tambah Jadwal
          </button>
        </div>

        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Hari ke:</label>
                <input type="number" min="1" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-white" placeholder="Cth: 1" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm text-gray-700" />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Rencana / Area</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm" placeholder="Cth: Area Produksi 1" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Target Item</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm" placeholder="Jml Target" />
              </div>
              <div className="md:col-span-1 flex justify-end md:justify-center pt-5">
                <button 
                  onClick={() => removeSchedule(schedule.id)}
                  disabled={schedules.length === 1}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
