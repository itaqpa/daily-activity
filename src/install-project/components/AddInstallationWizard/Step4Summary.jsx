import React, { useState } from 'react';
import { 
  FileText, 
  Layers, 
  Users, 
  ListChecks, 
  Edit3, 
  CheckSquare, 
  Square
} from 'lucide-react';

export default function Step4Summary({ data = {}, onEditStep }) {
  const [isConfirmed, setIsConfirmed] = useState(true);

  // Helper format rupiah
  const formatRupiah = (value) => {
    if (!value) return '0';
    const [wholePart] = value.toString().split('.');
    const numberString = wholePart.replace(/[^,\d]/g, '');
    const split = numberString.split(',');
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      const separator = sisa ? '.' : '';
      rupiah += separator + ribuan.join('.');
    }

    rupiah = split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
    return rupiah || '0';
  };

  const areas = data.areas || [];

  // Hitung agregasi
  const totalAreas = areas.length;
  const totalUnits = areas.reduce((acc, a) => acc + (a.units || []).length, 0);
  const totalScopes = areas.reduce(
    (acc, a) => acc + (a.units || []).reduce((uAcc, u) => uAcc + (u.scopes || []).length, 0), 
    0
  );

  // Agregasi Manpower per Area & Unit
  const manpowerRows = [];
  const allUserIds = new Set();
  const groupNamesSet = new Set();

  areas.forEach(area => {
    (area.units || []).forEach(unit => {
      const groupName = 
        unit.group_name || 
        (unit.group_id === 'new' ? unit.new_group_name : '') || 
        (data.work_groups?.find(wg => String(wg.id) === String(unit.group_id))?.nama) || 
        (unit.group_id ? `Group ${unit.group_id}` : 'Belum Ditentukan');
      
      if (groupName && groupName !== 'Belum Ditentukan') {
        groupNamesSet.add(groupName);
      }

      manpowerRows.push({
        areaName: area.nama || 'Area Tanpa Nama',
        unitName: unit.nama || 'Unit Tanpa Nama',
        groupName: groupName,
        users: [...(unit.selected_users || [])]
      });

      (unit.selected_users || []).forEach(u => allUserIds.add(u.id || u.name));
    });
  });

  const totalGroupsCount = groupNamesSet.size;
  const totalManpowerCount = allUserIds.size;

  // Avatar colors palette for visuals
  const avatarColors = [
    'bg-blue-600 text-white',
    'bg-emerald-600 text-white',
    'bg-amber-600 text-white',
    'bg-indigo-600 text-white',
    'bg-rose-600 text-white',
    'bg-cyan-600 text-white'
  ];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 pb-4">
      
      {/* 1. INFORMASI PROJECT CARD */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-800 text-base">Informasi Project</h3>
          </div>
          {onEditStep && (
            <button 
              onClick={() => onEditStep(1)}
              className="px-3 py-1 text-xs font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 pt-4 text-sm">
          {/* Kolom Kiri */}
          <div className="space-y-2.5">
            <div className="flex items-start">
              <span className="w-36 text-gray-400 font-medium shrink-0">No Project</span>
              <span className="font-bold text-gray-900">{data.no_project || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="w-36 text-gray-400 font-medium shrink-0">Nama Project</span>
              <span className="font-semibold text-gray-800">{data.nama || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="w-36 text-gray-400 font-medium shrink-0">Customer / Klien</span>
              <span className="font-medium text-gray-800">{data.customer || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="w-36 text-gray-400 font-medium shrink-0">Lokasi</span>
              <span className="font-medium text-gray-800">{data.lokasi || '-'}</span>
            </div>
          </div>

          {/* Kolom Kanan */}
          <div className="space-y-2.5">
            <div className="flex items-start">
              <span className="w-32 text-gray-400 font-medium shrink-0">Project Leader</span>
              <span className="font-medium text-gray-800">{data.leader || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="w-32 text-gray-400 font-medium shrink-0">Tanggal Mulai</span>
              <span className="font-medium text-gray-800">{data.tgl_mulai || '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="w-32 text-gray-400 font-medium shrink-0">Durasi Project</span>
              <span className="font-medium text-gray-800">{data.durasi_hari ? `${data.durasi_hari} Hari` : '-'}</span>
            </div>
            <div className="flex items-start">
              <span className="w-32 text-gray-400 font-medium shrink-0">Nilai Kontrak</span>
              <span className="font-semibold text-gray-800">Rp {formatRupiah(data.nilai_kontrak)}</span>
            </div>
            <div className="flex items-start">
              <span className="w-32 text-gray-400 font-medium shrink-0">Budget Biaya</span>
              <span className="font-semibold text-gray-800">Rp {formatRupiah(data.budget_biaya)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. AREA & UNIT CARD */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 text-base">Area & Unit</h3>
              <span className="text-xs text-gray-400 font-medium">
                {totalAreas} Area • {totalUnits} Unit
              </span>
            </div>
          </div>
          {onEditStep && (
            <button 
              onClick={() => onEditStep(2)}
              className="px-3 py-1 text-xs font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-blue-50/40 text-blue-900/80 font-semibold text-xs border-y border-blue-100/60">
                <th className="py-2.5 px-4 w-1/3">Area</th>
                <th className="py-2.5 px-4 w-1/2">Unit Kerja</th>
                <th className="py-2.5 px-4 text-right">Bobot Area</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {areas.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 px-4 text-center text-gray-400 text-xs italic">
                    Belum ada data Area & Unit.
                  </td>
                </tr>
              ) : (
                areas.map((area, idx) => {
                  const unitNames = (area.units || [])
                    .map(u => u.nama)
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <tr key={area.id || idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-800">{area.nama || '-'}</td>
                      <td className="py-3 px-4 text-gray-600 font-medium">{unitNames || '-'}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-800">
                        {parseFloat(area.bobot || 0)}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. MANPOWER TERPILIH CARD */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 text-base">Manpower Terpilih</h3>
              <span className="text-xs text-gray-400 font-medium">
                {totalGroupsCount} Group • {totalManpowerCount} Orang
              </span>
            </div>
          </div>
          {onEditStep && (
            <button 
              onClick={() => onEditStep(2)}
              className="px-3 py-1 text-xs font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-blue-50/40 text-blue-900/80 font-semibold text-xs border-y border-blue-100/60">
                <th className="py-2.5 px-4 w-1/4">Area</th>
                <th className="py-2.5 px-4 w-1/4">Unit Kerja</th>
                <th className="py-2.5 px-4 w-1/4">Group Pelaksana</th>
                <th className="py-2.5 px-4 text-right w-1/4">Anggota Tim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {manpowerRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 px-4 text-center text-gray-400 text-xs italic">
                    Belum ada Manpower atau Group yang dipilih.
                  </td>
                </tr>
              ) : (
                manpowerRows.map((row, idx) => {
                  const displayUsers = row.users.slice(0, 4);
                  const extraCount = row.users.length - 4;

                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-800">{row.areaName}</td>
                      <td className="py-3 px-4 font-medium text-gray-700">{row.unitName}</td>
                      <td className="py-3 px-4 font-medium text-gray-700">{row.groupName}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end -space-x-1.5 overflow-hidden">
                          {row.users.length === 0 ? (
                            <span className="text-xs text-gray-400 italic">Belum ada anggota</span>
                          ) : (
                            <>
                              {displayUsers.map((user, uIdx) => {
                                const initials = (user.name || 'U').charAt(0).toUpperCase();
                                const colorClass = avatarColors[uIdx % avatarColors.length];
                                return (
                                  <div
                                    key={user.id || uIdx}
                                    title={user.name}
                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ring-2 ring-white shadow-sm ${colorClass}`}
                                  >
                                    {initials}
                                  </div>
                                );
                              })}
                              {extraCount > 0 && (
                                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-blue-100 text-blue-700 ring-2 ring-white shadow-sm">
                                  +{extraCount}
                                </div>
                              )}
                            </>
                          )}
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

      {/* 4. RENCANA KERJA & SCOPE OF WORK CARD */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ListChecks className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 text-base">Rencana Kerja & Scope of Work</h3>
              <span className="text-xs text-gray-400 font-medium">
                {totalUnits} Unit • {totalScopes} Scope
              </span>
            </div>
          </div>
          {onEditStep && (
            <button 
              onClick={() => onEditStep(3)}
              className="px-3 py-1 text-xs font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-blue-50/40 text-blue-900/80 font-semibold text-xs border-y border-blue-100/60">
                <th className="py-2.5 px-4 w-1/4">Area</th>
                <th className="py-2.5 px-4 w-1/3">Unit Kerja</th>
                <th className="py-2.5 px-4 text-center w-1/5">Jumlah Scope</th>
                <th className="py-2.5 px-4 text-right">Bobot thd Project</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {areas.length === 0 || totalUnits === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 px-4 text-center text-gray-400 text-xs italic">
                    Belum ada Rencana Kerja & Scope.
                  </td>
                </tr>
              ) : (
                areas.flatMap((area) =>
                  (area.units || []).map((unit, uIdx) => {
                    const scopeCount = (unit.scopes || []).length;
                    const aBobot = parseFloat(area.bobot || 0);
                    const uBobot = parseFloat(unit.bobot || 0);
                    const bobotProject = ((aBobot * uBobot) / 100).toFixed(1);

                    return (
                      <tr key={`${area.id}_${unit.id || uIdx}`} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-gray-800">{area.nama || '-'}</td>
                        <td className="py-3 px-4 font-medium text-gray-700">{unit.nama || '-'}</td>
                        <td className="py-3 px-4 text-center font-bold text-gray-700">{scopeCount}</td>
                        <td className="py-3 px-4 text-right font-bold text-blue-600">
                          {bobotProject}%
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CHECKBOX KONFIRMASI */}
      <div 
        onClick={() => setIsConfirmed(!isConfirmed)}
        className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 flex items-center gap-3 cursor-pointer select-none transition-colors hover:bg-blue-50"
      >
        <div className="text-blue-600 shrink-0">
          {isConfirmed ? (
            <CheckSquare className="w-5 h-5 fill-blue-600 text-white" />
          ) : (
            <Square className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <span className="text-xs sm:text-sm font-medium text-gray-700 leading-snug">
          Saya sudah memeriksa seluruh informasi di atas dan yakin untuk menyimpan project ini.
        </span>
      </div>

    </div>
  );
}
