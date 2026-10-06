import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Users, X } from 'lucide-react';

// --- NO DUMMY DATA ---
// ------------------

export default function Step2AreaUnit({ data, updateData }) {
  const [showUserSelect, setShowUserSelect] = useState({}); // { [unitId]: boolean }
  
  useEffect(() => {
    if (!data.areas || data.areas.length === 0) {
      updateData((prev) => ({
        ...prev,
        areas: [{ id: Date.now(), nama: '', bobot: '', units: [] }]
      }));
    }
  }, [data.areas, updateData]);

  const areas = data.areas || [];

  // Build group options from API-fetched work_groups + any dynamically created new groups
  const customGroups = [];
  
  // 1. Add all existing groups from the database (fetched via API)
  if (data.work_groups && data.work_groups.length > 0) {
    data.work_groups.forEach(wg => {
      if (!customGroups.find(g => String(g.id) === String(wg.id))) {
        customGroups.push({ id: wg.id, name: wg.nama });
      }
    });
  }

  // 2. Add any newly created groups from the current session (not yet saved)
  areas.forEach(a => {
    (a.units || []).forEach(u => {
      if (u.group_id === 'new' && u.new_group_name && !customGroups.find(g => g.name === u.new_group_name)) {
        customGroups.push({ id: `new_${u.new_group_name}`, name: u.new_group_name });
      }
    });
  });

  const addArea = () => {
    updateData(prev => ({
      ...prev,
      areas: [...(prev.areas || []), { id: Date.now(), nama: '', bobot: '', units: [] }]
    }));
  };

  const removeArea = (areaId) => {
    updateData(prev => ({
      ...prev,
      areas: prev.areas.filter(a => a.id !== areaId)
    }));
  };

  const updateArea = (areaId, field, value) => {
    updateData(prev => ({
      ...prev,
      areas: prev.areas.map(a => a.id === areaId ? { ...a, [field]: value } : a)
    }));
  };

  const addUnit = (areaId) => {
    updateData(prev => ({
      ...prev,
      areas: prev.areas.map(a => {
        if (a.id === areaId) {
          return {
            ...a,
            units: [...(a.units || []), { 
              id: Date.now(), 
              nama: '', 
              bobot: '', 
              target_start: '', 
              target_finish: '', 
              group_id: '', 
              new_group_name: '',
              selected_users: [] 
            }]
          };
        }
        return a;
      })
    }));
  };

  const removeUnit = (areaId, unitId) => {
    updateData(prev => ({
      ...prev,
      areas: prev.areas.map(a => {
        if (a.id === areaId) {
          return { ...a, units: a.units.filter(u => u.id !== unitId) };
        }
        return a;
      })
    }));
  };

  const updateUnit = (areaId, unitId, field, value) => {
    updateData(prev => ({
      ...prev,
      areas: prev.areas.map(a => {
        if (a.id === areaId) {
          return {
            ...a,
            units: a.units.map(u => u.id === unitId ? { ...u, [field]: value } : u)
          };
        }
        return a;
      })
    }));
  };

  const handleGroupChange = (areaId, unitId, groupId) => {
    updateData(prev => ({
      ...prev,
      areas: prev.areas.map(a => {
        if (a.id === areaId) {
          return {
            ...a,
            units: a.units.map(u => {
              if (u.id === unitId) {
                let newGroupName = '';
                let finalGroupId = groupId;
                
                if (groupId && groupId.startsWith('new_')) {
                  newGroupName = groupId.replace('new_', '');
                  finalGroupId = 'new';
                }

                return { ...u, group_id: finalGroupId, new_group_name: newGroupName, selected_users: u.selected_users || [] };
              }
              return u;
            })
          };
        }
        return a;
      })
    }));
  };

  const handleAddUserToUnit = (areaId, unitId, userId) => {
    // We no longer have DUMMY_ALL_USERS, so this function does nothing for now.
    // Hide the select dropdown after adding
    setShowUserSelect(prev => ({ ...prev, [unitId]: false }));
  };

  const handleRemoveUserFromUnit = (areaId, unitId, userId) => {
    updateData(prev => ({
      ...prev,
      areas: prev.areas.map(a => {
        if (a.id === areaId) {
          return {
            ...a,
            units: a.units.map(u => {
              if (u.id === unitId) {
                return { ...u, selected_users: (u.selected_users || []).filter(cu => cu.id !== userId) };
              }
              return u;
            })
          };
        }
        return a;
      })
    }));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">2. Registrasi Area & Manpower</h2>
          <p className="text-sm text-gray-500">Tambahkan area kerja, unit, dan atur tim pelaksana per unit.</p>
        </div>
        <button 
          onClick={addArea}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors border border-blue-200"
        >
          <Plus className="w-4 h-4" /> Tambah Area
        </button>
      </div>

      <div className="space-y-6">
        {areas.map((area) => (
          <div key={area.id} className="border border-blue-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            
            {/* Header Area */}
            <div className="bg-blue-50/50 px-5 py-4 border-b border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">NAMA AREA <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Area Surabaya"
                    className="w-full font-medium text-gray-800 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white" 
                    value={area.nama}
                    onChange={(e) => updateArea(area.id, 'nama', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">BOBOT AREA (%)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      placeholder="0"
                      className="w-24 font-medium text-gray-800 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white" 
                      value={area.bobot}
                      onChange={(e) => updateArea(area.id, 'bobot', e.target.value)}
                    />
                    <span className="text-gray-500 font-medium">%</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => removeArea(area.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-4 sm:mt-0 bg-white border border-red-100"
                title="Hapus Area"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* List of Units inside Area */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="block text-sm font-bold text-gray-700">Unit Kerja di Area Ini</label>
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-md border border-green-200">
                    Total Bobot Unit: {((area.units || []).reduce((acc, u) => acc + (parseFloat(u.bobot) || 0), 0)).toFixed(2)}%
                  </span>
                </div>
                <button 
                  onClick={() => addUnit(area.id)}
                  className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" /> Tambah Unit
                </button>
              </div>
              
              {(area.units || []).map((unit) => (
                <div key={unit.id} className="border border-gray-200 rounded-xl p-4 relative group">
                  <button 
                    onClick={() => removeUnit(area.id, unit.id)}
                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="Hapus Unit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col md:flex-row gap-4 pr-8">
                    <div className="flex-[2] min-w-[180px]">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Unit <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Unit Server"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white" 
                        value={unit.nama}
                        onChange={(e) => updateUnit(area.id, unit.id, 'nama', e.target.value)}
                      />
                    </div>
                    <div className="w-[100px] shrink-0">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Bobot (%)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white" 
                        value={unit.bobot}
                        onChange={(e) => updateUnit(area.id, unit.id, 'bobot', e.target.value)}
                      />
                    </div>
                    <div className="w-[125px] shrink-0 flex flex-col justify-end">
                      <label className="block text-xs font-semibold text-gray-500 mb-1 whitespace-nowrap">Bobot thd Project</label>
                      <div className="h-[38px] flex items-center px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-blue-700">
                        {((parseFloat(area.bobot) || 0) * (parseFloat(unit.bobot) || 0) / 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="w-[130px] shrink-0">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Target Start</label>
                      <input 
                        type="date" 
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white" 
                        value={unit.target_start}
                        onChange={(e) => updateUnit(area.id, unit.id, 'target_start', e.target.value)}
                      />
                    </div>
                    <div className="w-[130px] shrink-0">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Target Finish</label>
                      <input 
                        type="date" 
                        min={unit.target_start || undefined}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white" 
                        value={unit.target_finish}
                        onChange={(e) => updateUnit(area.id, unit.id, 'target_finish', e.target.value)}
                      />
                    </div>
                    <div className="flex-[2] min-w-[180px]">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Group Pelaksana <span className="text-red-500">*</span></label>
                      <select 
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white font-medium"
                        value={unit.group_id || ''}
                        onChange={(e) => handleGroupChange(area.id, unit.id, e.target.value)}
                      >
                        <option value="">-- Pilih Group --</option>
                        {customGroups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                        <option value="new" className="font-bold text-blue-600">+ Buat Group Baru</option>
                      </select>
                    </div>
                  </div>

                  {/* Manpower Section inside Unit */}
                  {unit.group_id && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        {unit.group_id === 'new' ? 'Manpower untuk Unit Ini (Group Baru)' : 'Manpower untuk Unit Ini'}
                      </label>
                      
                      <div className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        {unit.group_id === 'new' && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Group Baru</label>
                            <input 
                              type="text" 
                              placeholder="Contoh: Tim Instalasi Khusus"
                              className="w-full md:w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white" 
                              value={unit.new_group_name || ''}
                              onChange={(e) => updateUnit(area.id, unit.id, 'new_group_name', e.target.value)}
                            />
                          </div>
                        )}

                        <div>
                          <span className="text-xs text-gray-500 mb-2 block">Daftar Anggota Tim:</span>
                          <div className="flex flex-wrap gap-2 items-center">
                            
                            {(unit.selected_users || []).map(u => (
                              <div key={u.id} className="flex items-center gap-1.5 bg-white border border-gray-200 pl-2 pr-1 py-1 rounded-full text-sm shadow-sm">
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                  {u.name.charAt(0)}
                                </div>
                                <span className="font-medium text-gray-700 text-xs">{u.name}</span>
                                <button 
                                  onClick={() => handleRemoveUserFromUnit(area.id, unit.id, u.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                  title="Hapus user dari unit ini"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            {/* Tombol Plus & Dropdown Add User */}
                            {!showUserSelect[unit.id] ? (
                              <button 
                                onClick={() => setShowUserSelect(prev => ({ ...prev, [unit.id]: true }))}
                                className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Tambah Anggota"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <select 
                                  id={`userSelect-${unit.id}`}
                                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
                                  onChange={(e) => handleAddUserToUnit(area.id, unit.id, e.target.value)}
                                >
                                  <option value="">Pilih User...</option>
                                  <option value="" disabled>User Kosong (Belum ada data)</option>
                                </select>
                                <button 
                                  onClick={() => setShowUserSelect(prev => ({ ...prev, [unit.id]: false }))}
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                          </div>
                          {(unit.selected_users || []).length === 0 && !showUserSelect[unit.id] && (
                            <span className="text-xs text-red-400 italic mt-2 block">* Anggota tim masih kosong.</span>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              ))}

              {(area.units || []).length === 0 && (
                <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <p className="text-gray-400 text-sm">Belum ada Unit Kerja di Area ini.</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {areas.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
            <p className="text-gray-500 font-medium">Belum ada Area yang didaftarkan.</p>
            <button 
              onClick={addArea}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Buat Area Pertama
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
