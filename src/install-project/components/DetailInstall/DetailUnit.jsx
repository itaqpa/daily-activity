import React, { useState } from 'react';
import { 
  Boxes, 
  MapPin, 
  Calendar, 
  Users, 
  ListChecks, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export default function DetailUnit({ project = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('ALL');

  const areas = project.areas || [];

  // Flatten all units with area context
  const allUnits = [];
  areas.forEach(area => {
    (area.units || []).forEach(unit => {
      const aWeight = parseFloat(area.bobot || 0);
      const uWeight = parseFloat(unit.bobot || 0);
      const bobotProject = ((aWeight * uWeight) / 100).toFixed(2);

      allUnits.push({
        ...unit,
        areaId: area.id,
        areaName: area.nama,
        areaBobot: aWeight,
        bobotProject
      });
    });
  });

  // Filter logic
  const filteredUnits = allUnits.filter(u => {
    const matchSearch = (u.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (u.areaName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (u.group_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchArea = selectedAreaFilter === 'ALL' || String(u.areaId) === String(selectedAreaFilter);
    return matchSearch && matchArea;
  });

  // Format tanggal
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Status unit
  const getUnitStatus = (unit) => {
    const cap = parseFloat(unit.capaian_unit || 0);
    const now = new Date();
    const finish = unit.target_finish ? new Date(unit.target_finish) : null;

    if (cap >= 100) {
      return {
        label: 'Selesai 100%',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500'
      };
    } else if (finish && now > finish && cap < 100) {
      return {
        label: 'Terlambat (Overdue)',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500'
      };
    } else if (cap > 0) {
      return {
        label: `${cap}% Berjalan`,
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500 animate-pulse'
      };
    } else {
      return {
        label: 'Belum Mulai',
        color: 'bg-slate-50 text-slate-600 border-slate-200',
        dot: 'bg-slate-400'
      };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 space-y-6">
      {/* Header Unit Kerja */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Detail Unit Kerja
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Daftar seluruh unit kerja, penugasan group, jadwal target pelaksanaan, serta capaian progres.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Filter Area Dropdown */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              className="w-full sm:w-44 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-700"
            >
              <option value="ALL">Semua Daerah ({allUnits.length})</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nama} ({(a.units || []).length})
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari unit atau group..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Units Table / Card List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-indigo-50/40 text-indigo-950 font-semibold text-xs border-y border-indigo-100/70">
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4">Nama Unit</th>
              <th className="py-3 px-4">Daerah / Area</th>
              <th className="py-3 px-4">Group Pelaksana</th>
              <th className="py-3 px-4 text-center">Target Pelaksanaan</th>
              <th className="py-3 px-4 text-center">Bobot Proyek</th>
              <th className="py-3 px-4 text-right min-w-[140px]">Progres Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUnits.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400 text-xs italic">
                  Tidak ada unit kerja yang sesuai dengan filter atau kriteria pencarian.
                </td>
              </tr>
            ) : (
              filteredUnits.map((unit, idx) => {
                const status = getUnitStatus(unit);
                const cap = parseFloat(unit.capaian_unit || 0);
                const scopeCount = (unit.scopes || []).length;
                const userCount = (unit.selected_users || []).length;

                return (
                  <tr key={unit.id || idx} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{unit.nama || 'Unit Tanpa Nama'}</div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <ListChecks className="w-3 h-3 text-indigo-500" />
                          {scopeCount} Scope
                        </span>
                        <span>•</span>
                        <span>Bobot Area: <strong>{parseFloat(unit.bobot || 0)}%</strong></span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        {unit.areaName || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-800">
                        {unit.group_name || 'Belum Ditentukan'}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span>{userCount} Manpower Terdaftar</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="text-xs font-medium text-gray-700">
                        {formatDate(unit.target_start)} <ArrowRight className="w-3 h-3 inline text-gray-400 mx-0.5" /> {formatDate(unit.target_finish)}
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border mt-1 ${status.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-700">
                      {unit.bobotProject}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-between items-center text-xs font-bold mb-1">
                        <span className="text-gray-400 text-[11px] font-normal">Capaian:</span>
                        <span className="text-emerald-700">{cap}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, cap)}%` }}
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
