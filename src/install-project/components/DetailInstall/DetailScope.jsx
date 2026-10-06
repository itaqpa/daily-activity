import React, { useState } from 'react';
import { 
  ListChecks, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  Check, 
  Boxes,
  MapPin,
  Sparkles
} from 'lucide-react';

export default function DetailScope({ project = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'planned' | 'additional'
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('ALL');

  const areas = project.areas || [];

  // Flatten all scopes with context
  const allScopes = [];
  areas.forEach(area => {
    (area.units || []).forEach(unit => {
      (unit.scopes || []).forEach(scope => {
        allScopes.push({
          ...scope,
          areaId: area.id,
          areaName: area.nama,
          unitId: unit.id,
          unitName: unit.nama,
          groupName: unit.group_name
        });
      });
    });
  });

  // Calculate scope statistics
  const totalScopes = allScopes.length;
  const plannedCount = allScopes.filter(s => s.tipe !== 'additional').length;
  const additionalCount = allScopes.filter(s => s.tipe === 'additional').length;
  const completedCount = allScopes.filter(s => parseFloat(s.capaian || 0) >= 100).length;
  const inProgressCount = allScopes.filter(s => {
    const c = parseFloat(s.capaian || 0);
    return c > 0 && c < 100;
  }).length;
  const pendingCount = allScopes.filter(s => parseFloat(s.capaian || 0) === 0).length;

  // Filter scopes
  const filteredScopes = allScopes.filter(s => {
    const matchSearch = (s.nama_scope || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.unitName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.areaName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'ALL' || (s.tipe || 'planned') === typeFilter;
    const matchArea = selectedAreaFilter === 'ALL' || String(s.areaId) === String(selectedAreaFilter);
    return matchSearch && matchType && matchArea;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 space-y-6">
      {/* Header Scope of Work */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ListChecks className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Rencana Kerja & Scope of Work
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Rincian seluruh lingkup pekerjaan teknis per unit kerja beserta bobot dan progres capaiannya.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Filter Area */}
          <select
            value={selectedAreaFilter}
            onChange={(e) => setSelectedAreaFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-700 font-medium"
          >
            <option value="ALL">Semua Daerah</option>
            {areas.map(a => (
              <option key={a.id} value={a.id}>{a.nama}</option>
            ))}
          </select>

          {/* Filter Tipe */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-700 font-medium"
          >
            <option value="ALL">Semua Tipe ({totalScopes})</option>
            <option value="planned">Terencana ({plannedCount})</option>
            <option value="additional">Additional Job ({additionalCount})</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari scope pekerjaan..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Scope Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase">Total Scope</span>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{totalScopes}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
            {totalScopes}
          </div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-700 uppercase">Selesai 100%</span>
            <p className="text-lg font-bold text-emerald-800 mt-0.5">{completedCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs">
            <Check className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-blue-50/60 border border-blue-200/70 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-blue-700 uppercase">Sedang Berjalan</span>
            <p className="text-lg font-bold text-blue-800 mt-0.5">{inProgressCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-xs">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-700 uppercase">Belum Dimulai</span>
            <p className="text-lg font-bold text-amber-800 mt-0.5">{pendingCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs">
            {pendingCount}
          </div>
        </div>
      </div>

      {/* Scope Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-blue-50/40 text-blue-950 font-semibold text-xs border-y border-blue-100/70">
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4">Nama Lingkup Pekerjaan (Scope)</th>
              <th className="py-3 px-4">Unit Kerja & Daerah</th>
              <th className="py-3 px-4 text-center">Tipe</th>
              <th className="py-3 px-4 text-center">Bobot dlm Unit</th>
              <th className="py-3 px-4 text-center">Bobot thd Proyek</th>
              <th className="py-3 px-4 text-right min-w-[130px]">Status Capaian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredScopes.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400 text-xs italic">
                  Tidak ada data scope pekerjaan yang cocok dengan pencarian atau filter.
                </td>
              </tr>
            ) : (
              filteredScopes.map((scope, idx) => {
                const capaian = parseFloat(scope.capaian || 0);
                const isCompleted = capaian >= 100;
                const isAdditional = scope.tipe === 'additional';

                return (
                  <tr key={scope.id || idx} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {isCompleted && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        <span>{scope.nama_scope || 'Scope Pekerjaan'}</span>
                      </div>
                      {isAdditional && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block border border-amber-200">
                          Pekerjaan Tambahan Lapangan
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-gray-800 text-xs">
                        {scope.unitName}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{scope.areaName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                        isAdditional 
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {isAdditional ? 'Additional' : 'Planned'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-800">
                      {scope.bobot_unit}%
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-600">
                      {scope.bobot_project}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-between items-center text-xs font-bold mb-1">
                        <span className={`text-[11px] font-semibold ${isCompleted ? 'text-emerald-600' : 'text-gray-500'}`}>
                          {isCompleted ? 'Selesai' : `${capaian}%`}
                        </span>
                        <span className="text-gray-400 font-normal text-[11px]">/ 100%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, capaian)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
