import React, { useState } from 'react';
import { 
  MapPin, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  CheckCircle2, 
  Clock, 
  Boxes,
  Users,
  ListChecks
} from 'lucide-react';

export default function DetailDaerah({ project = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAreaId, setExpandedAreaId] = useState(null);

  const areas = project.areas || [];

  // Filter area berdasarkan pencarian
  const filteredAreas = areas.filter(a => 
    (a.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.units || []).some(u => (u.nama || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Toggle expand area accordion
  const toggleExpand = (id) => {
    setExpandedAreaId(prev => prev === id ? null : id);
  };

  // Helper hitung rata-rata progres area dari unit-unitnya
  const calculateAreaProgress = (area) => {
    const units = area.units || [];
    if (units.length === 0) return 0;
    
    let totalWeightedProg = 0;
    let totalUnitWeight = 0;

    units.forEach(u => {
      const uWeight = parseFloat(u.bobot || 0);
      const uCap = parseFloat(u.capaian_unit || 0);
      totalWeightedProg += (uWeight * uCap);
      totalUnitWeight += uWeight;
    });

    if (totalUnitWeight === 0) return 0;
    return parseFloat((totalWeightedProg / totalUnitWeight).toFixed(1));
  };

  // Status badge area
  const getAreaStatusBadge = (progress) => {
    if (progress >= 100) {
      return {
        label: 'Selesai 100%',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500'
      };
    } else if (progress > 0) {
      return {
        label: `${progress}% Berjalan`,
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
      {/* Header Daerah / Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Detail Daerah & Wilayah Kerja
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pembagian area kerja konstruksi/instalasi beserta alokasi bobot dan status penyelesaiannya.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama daerah..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Area Cards List */}
      <div className="space-y-4">
        {filteredAreas.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-gray-400">
            {searchTerm ? 'Tidak ada daerah yang cocok dengan pencarian.' : 'Belum ada data daerah/area untuk project ini.'}
          </div>
        ) : (
          filteredAreas.map((area, index) => {
            const areaProgress = calculateAreaProgress(area);
            const statusBadge = getAreaStatusBadge(areaProgress);
            const isExpanded = expandedAreaId === (area.id || index);
            const units = area.units || [];
            const totalScopes = units.reduce((acc, u) => acc + (u.scopes || []).length, 0);

            return (
              <div 
                key={area.id || index}
                className="border border-gray-200/90 rounded-2xl overflow-hidden shadow-2xs hover:border-emerald-300 transition-all bg-white"
              >
                {/* Area Card Header */}
                <div 
                  onClick={() => toggleExpand(area.id || index)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base">
                          {area.nama || 'Daerah Tanpa Nama'}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusBadge.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                          {statusBadge.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Boxes className="w-3.5 h-3.5 text-gray-400" />
                          {units.length} Unit Kerja
                        </span>
                        <span className="flex items-center gap-1">
                          <ListChecks className="w-3.5 h-3.5 text-gray-400" />
                          {totalScopes} Total Scope
                        </span>
                        <span className="text-gray-400 font-medium">
                          Bobot Daerah: <strong className="text-emerald-700 font-bold">{parseFloat(area.bobot || 0)}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress & Accordion Trigger */}
                  <div className="flex items-center gap-4 self-end md:self-auto w-full md:w-auto">
                    <div className="flex-1 md:w-44 text-right">
                      <div className="flex justify-between items-center text-xs font-semibold mb-1">
                        <span className="text-gray-500 text-[11px]">Progres Daerah</span>
                        <span className="text-emerald-700">{areaProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, areaProgress)}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Accordion: Units inside this Area */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-gray-100 p-4 sm:p-5 space-y-3">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                      Daftar Unit Kerja di Daerah Ini ({units.length}):
                    </p>

                    {units.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Belum ada unit kerja yang didaftarkan di daerah ini.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {units.map((unit, uIdx) => {
                          const unitCap = parseFloat(unit.capaian_unit || 0);
                          const unitWeight = parseFloat(unit.bobot || 0);
                          const aWeight = parseFloat(area.bobot || 0);
                          const projWeight = ((aWeight * unitWeight) / 100).toFixed(1);

                          return (
                            <div 
                              key={unit.id || uIdx}
                              className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-2xs space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-semibold text-gray-800 text-xs sm:text-sm">
                                    {unit.nama || 'Unit Tanpa Nama'}
                                  </h4>
                                  <p className="text-[11px] text-gray-500">
                                    Group: <strong className="text-gray-700 font-medium">{unit.group_name || 'Belum Ditentukan'}</strong>
                                  </p>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shrink-0">
                                  {unitCap}%
                                </span>
                              </div>

                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.min(100, unitCap)}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-50">
                                <span>Bobot dlm Area: <strong>{unitWeight}%</strong></span>
                                <span>Bobot Proyek: <strong className="text-blue-600">{projWeight}%</strong></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
