import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Search, 
  Boxes, 
  MapPin, 
  Briefcase, 
  Coins,
  Crown,
  Layers
} from 'lucide-react';

export default function UserTerkait({ project = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');

  const areas = project.areas || [];
  const projectLeader = project.leader || '-';

  // Avatar colors
  const avatarColors = [
    'bg-blue-600 text-white',
    'bg-emerald-600 text-white',
    'bg-amber-600 text-white',
    'bg-indigo-600 text-white',
    'bg-rose-600 text-white',
    'bg-cyan-600 text-white',
    'bg-purple-600 text-white',
    'bg-teal-600 text-white'
  ];

  // Agregasi Group dan Manpower
  const groupMap = new Map();
  const manpowerMap = new Map();

  areas.forEach(area => {
    (area.units || []).forEach(unit => {
      const gName = unit.group_name || (unit.group_id ? `Group ${unit.group_id}` : 'Tanpa Group');
      
      if (!groupMap.has(gName)) {
        groupMap.set(gName, {
          name: gName,
          groupId: unit.group_id,
          units: [],
          members: new Map()
        });
      }

      const grp = groupMap.get(gName);
      grp.units.push({
        unitName: unit.nama,
        areaName: area.nama
      });

      (unit.selected_users || []).forEach(user => {
        const uId = user.id || user.name;
        grp.members.set(uId, user);

        if (!manpowerMap.has(uId)) {
          manpowerMap.set(uId, {
            ...user,
            groups: new Set([gName]),
            assignedUnits: [{ unitName: unit.nama, areaName: area.nama }]
          });
        } else {
          const mp = manpowerMap.get(uId);
          mp.groups.add(gName);
          mp.assignedUnits.push({ unitName: unit.nama, areaName: area.nama });
        }
      });
    });
  });

  const groupList = Array.from(groupMap.values()).map(g => ({
    ...g,
    memberCount: g.members.size,
    membersList: Array.from(g.members.values())
  }));

  const manpowerList = Array.from(manpowerMap.values());

  // Filter manpower
  const filteredManpower = manpowerList.filter(mp => {
    const matchSearch = (mp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (mp.posisi || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchGroup = selectedGroupFilter === 'ALL' || mp.groups.has(selectedGroupFilter);
    return matchSearch && matchGroup;
  });

  // Format currency
  const formatRupiah = (val) => {
    if (!val) return '0';
    return Number(val).toLocaleString('id-ID');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 space-y-6">
      {/* Header Tim & Manpower */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Tim Kerja & User Terkait
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Penanggung jawab proyek (Leader), group pelaksana, dan personil teknisi yang dialokasikan ke unit kerja.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-gray-700 font-medium"
          >
            <option value="ALL">Semua Group ({groupList.length})</option>
            {groupList.map((g, idx) => (
              <option key={idx} value={g.name}>{g.name} ({g.memberCount} Org)</option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-52">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari personil..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Leader Showcase Card */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-xl text-yellow-300 shadow-inner">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-200 bg-white/10 px-2 py-0.5 rounded">
                Project Leader / PIC
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white mt-1">
              {projectLeader}
            </h3>
            <p className="text-xs text-violet-200/80">
              Penanggung jawab operasional penuh terhadap timeline dan keselamatan instalasi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs bg-white/10 px-4 py-2.5 rounded-xl border border-white/15 backdrop-blur-sm self-start sm:self-auto">
          <div>
            <span className="text-violet-200/70 block">Total Tim:</span>
            <span className="text-sm font-bold text-white">{groupList.length} Group Kerja</span>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div>
            <span className="text-violet-200/70 block">Total Manpower:</span>
            <span className="text-sm font-bold text-white">{manpowerList.length} Personil</span>
          </div>
        </div>
      </div>

      {/* Work Groups Overview Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-violet-600" />
          Daftar Group Kerja Pelaksana ({groupList.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {groupList.map((group, gIdx) => (
            <div 
              key={gIdx}
              className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-3 hover:border-violet-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{group.name}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Ditugaskan di {group.units.length} Unit Kerja
                  </p>
                </div>
                <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded">
                  {group.memberCount} Org
                </span>
              </div>

              {/* Members Avatars preview */}
              <div className="flex items-center gap-1.5 overflow-hidden">
                {group.membersList.slice(0, 6).map((m, mIdx) => {
                  const initial = (m.name || 'U').charAt(0).toUpperCase();
                  const color = avatarColors[mIdx % avatarColors.length];
                  return (
                    <div 
                      key={m.id || mIdx}
                      title={m.name}
                      className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ring-2 ring-white ${color} shadow-xs`}
                    >
                      {initial}
                    </div>
                  );
                })}
                {group.memberCount > 6 && (
                  <span className="text-xs font-bold text-gray-500 pl-1">
                    +{group.memberCount - 6}
                  </span>
                )}
              </div>

              {/* Units attached */}
              <div className="text-[11px] text-gray-500 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1">
                {group.units.map((u, uIdx) => (
                  <span key={uIdx} className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[10px] text-gray-700">
                    {u.unitName}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manpower Personil Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-violet-600" />
          Daftar Roster Personil & Manpower ({filteredManpower.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-violet-50/40 text-violet-950 font-semibold text-xs border-y border-violet-100/70">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Personil</th>
                <th className="py-3 px-4">Posisi / Keahlian</th>
                <th className="py-3 px-4">Group Pelaksana</th>
                <th className="py-3 px-4">Penugasan Unit Kerja</th>
                <th className="py-3 px-4 text-right">Rate per Jam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredManpower.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-xs italic">
                    Belum ada personil atau manpower yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredManpower.map((person, idx) => {
                  const initial = (person.name || 'U').charAt(0).toUpperCase();
                  const colorClass = avatarColors[idx % avatarColors.length];
                  const groupsArr = Array.from(person.groups);

                  return (
                    <tr key={person.id || idx} className="hover:bg-violet-50/20 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${colorClass} shadow-2xs`}>
                            {initial}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900">{person.name || 'Tanpa Nama'}</span>
                            <span className="text-[11px] text-gray-400 block font-mono">ID: #{person.id || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          <Briefcase className="w-3 h-3 text-slate-500" />
                          {person.posisi || 'Helper / Teknisi'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {groupsArr.map((g, gIdx) => (
                            <span key={gIdx} className="text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                              {g}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-gray-700 space-y-0.5">
                          {person.assignedUnits.map((u, uIdx) => (
                            <div key={uIdx} className="flex items-center gap-1 text-[11px] text-gray-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                              <strong className="text-gray-800">{u.unitName}</strong> ({u.areaName})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-800">
                        {person.rate_per_jam && Number(person.rate_per_jam) > 0 ? (
                          <span>Rp {formatRupiah(person.rate_per_jam)}/jam</span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Standar</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
