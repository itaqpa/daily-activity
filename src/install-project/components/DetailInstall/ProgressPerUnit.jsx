import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ProgressPerUnit({ project = {} }) {
  const [expandedUnitIds, setExpandedUnitIds] = useState(new Set());

  const areas = project.areas || [];

  // Flatten all units with area context
  const unitsList = [];
  areas.forEach((area, aIdx) => {
    (area.units || []).forEach((unit, uIdx) => {
      const unitKey = `${area.id || aIdx}_${unit.id || uIdx}`;
      unitsList.push({
        ...unit,
        unitKey,
        areaName: area.nama || `Area ${aIdx + 1}`,
        unitName: unit.nama || `Unit ${uIdx + 1}`,
        areaBobot: parseFloat(area.bobot || 0)
      });
    });
  });

  // Toggle dropdown row
  const toggleRow = (unitKey) => {
    setExpandedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitKey)) {
        next.delete(unitKey);
      } else {
        next.add(unitKey);
      }
      return next;
    });
  };

  // Helper formatting target tanggal (YYYY-MM-DD s.d. YYYY-MM-DD)
  const formatTargetRange = (start, finish) => {
    if (!start && !finish) return '-';
    const s = start || '-';
    const f = finish || '-';
    return `${s} s.d. ${f}`;
  };

  // Helper status unit badge
  const getUnitStatusBadge = (actual) => {
    const act = parseFloat(actual || 0);
    if (act >= 100) {
      return (
        <span className="inline-block px-3 py-0.5 text-xs font-medium rounded-full border border-emerald-600 text-emerald-700 bg-emerald-50/50">
          Selesai
        </span>
      );
    } else if (act > 0) {
      return (
        <span className="inline-block px-3 py-0.5 text-xs font-medium rounded-full border border-amber-600 text-amber-700 bg-amber-50/50">
          Berjalan
        </span>
      );
    } else {
      return (
        <span className="inline-block px-3 py-0.5 text-xs font-medium rounded-full border border-gray-400 text-gray-600 bg-gray-50/50">
          Belum mulai
        </span>
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden border-l-4 border-l-teal-700">
      {/* Title */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-base">
          Progress per unit s.d. hari ini
        </h3>
        <span className="text-xs text-gray-400">
          Klik baris untuk melihat capaian scope
        </span>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#f0f4f8] text-gray-700 font-semibold text-xs border-b border-gray-200">
              <th className="py-3 px-4 w-1/5">Area - Unit</th>
              <th className="py-3 px-4 w-1/6">Group</th>
              <th className="py-3 px-4">Target</th>
              <th className="py-3 px-4 text-center">Plan</th>
              <th className="py-3 px-4 min-w-[150px]">Actual</th>
              <th className="py-3 px-4 text-center">Deviasi</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {unitsList.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400 text-xs italic">
                  Belum ada unit kerja yang terdaftar.
                </td>
              </tr>
            ) : (
              unitsList.map((unit) => {
                const isExpanded = expandedUnitIds.has(unit.unitKey);
                const actualVal = parseFloat(unit.capaian_unit || 0);
                const planVal = 100.0; // Target rencana unit s.d. finish
                const deviasi = parseFloat((actualVal - planVal).toFixed(1));
                const scopes = unit.scopes || [];

                return (
                  <React.Fragment key={unit.unitKey}>
                    {/* Unit Row */}
                    <tr 
                      onClick={() => toggleRow(unit.unitKey)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors select-none"
                    >
                      {/* Area - Unit */}
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        <div className="flex items-center gap-1.5">
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                          )}
                          <span>{unit.areaName} - {unit.unitName}</span>
                        </div>
                      </td>

                      {/* Group */}
                      <td className="py-3.5 px-4 text-gray-700">
                        {unit.group_name || 'Tim Gabungan'}
                      </td>

                      {/* Target */}
                      <td className="py-3.5 px-4 text-gray-700 font-mono text-xs">
                        {formatTargetRange(unit.target_start, unit.target_finish)}
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4 text-center font-medium text-gray-800">
                        {planVal.toFixed(1)}%
                      </td>

                      {/* Actual */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[90px]">
                            <div 
                              className="h-full bg-amber-700 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, actualVal)}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-900 text-xs shrink-0 w-8">
                            {actualVal}%
                          </span>
                        </div>
                      </td>

                      {/* Deviasi */}
                      <td className="py-3.5 px-4 text-center font-medium text-gray-700">
                        {deviasi.toFixed(1)}%
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getUnitStatusBadge(actualVal)}
                      </td>
                    </tr>

                    {/* Subtable Scope of work (Dropdown) */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-0 bg-[#f4f7f9] border-y border-gray-200">
                          <div className="p-4 sm:p-5 space-y-3">
                            <table className="w-full text-left text-xs sm:text-sm">
                              <thead>
                                <tr className="text-gray-700 font-semibold text-xs border-b border-gray-200/80 pb-2">
                                  <th className="pb-2 px-3 w-2/5">Scope of work</th>
                                  <th className="pb-2 px-3 w-1/5">Bobot dalam unit</th>
                                  <th className="pb-2 px-3 w-1/5">Bobot thd project</th>
                                  <th className="pb-2 px-3 w-1/4">Capaian aktual</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200/60">
                                {scopes.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="py-3 px-3 text-gray-400 text-xs italic">
                                      Belum ada scope pekerjaan yang ditambahkan ke unit ini.
                                    </td>
                                  </tr>
                                ) : (
                                  scopes.map((s, sIdx) => {
                                    const sCapaian = parseFloat(s.capaian || 0);
                                    const bobotUnit = parseFloat(s.bobot_unit || 0);
                                    const bobotProj = parseFloat(s.bobot_project || 0);

                                    return (
                                      <tr key={s.id || sIdx} className="hover:bg-gray-100/40">
                                        {/* Scope Name in clean container */}
                                        <td className="py-2.5 px-3">
                                          <div className="flex items-center justify-between px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-800 text-xs">
                                            <span className="truncate">{s.nama_scope}</span>
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-2" />
                                          </div>
                                        </td>

                                        {/* Bobot dalam unit */}
                                        <td className="py-2.5 px-3">
                                          <div className="flex items-center gap-1.5">
                                            <div className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800 w-14 text-center">
                                              {bobotUnit}
                                            </div>
                                            <span className="text-gray-500 font-medium">%</span>
                                          </div>
                                        </td>

                                        {/* Bobot thd project */}
                                        <td className="py-2.5 px-3 font-semibold text-gray-800">
                                          {bobotProj}%
                                        </td>

                                        {/* Capaian aktual */}
                                        <td className="py-2.5 px-3">
                                          <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                              <div 
                                                className="h-full bg-emerald-700 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(100, sCapaian)}%` }}
                                              />
                                            </div>
                                            <span className="font-bold text-gray-900 text-xs shrink-0 w-9 text-right">
                                              {sCapaian}%
                                            </span>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
