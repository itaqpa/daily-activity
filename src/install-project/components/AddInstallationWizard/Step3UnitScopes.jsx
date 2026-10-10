import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import { apiUrl } from '../../../api';

export default function Step3UnitScopes({ data, updateData }) {
  const [catalogScopes, setCatalogScopes] = useState([]);

  useEffect(() => {
    fetch(apiUrl('/install-projects/scopes/catalog'))
      .then(res => res.json())
      .then(fetched => {
        if (Array.isArray(fetched)) {
          setCatalogScopes(fetched.map(s => ({ value: s.id.toString(), label: s.nama })));
        }
      })
      .catch(console.error);
  }, []);
  
  // Mengumpulkan seluruh unit dari area yang dibuat di Step 2
  const allUnits = (data.areas || []).reduce((acc, area) => {
    const units = area.units || [];
    return [
      ...acc, 
      ...units.map(u => ({ 
        ...u, 
        areaId: area.id, 
        areaNama: area.nama,
        areaBobot: parseFloat(area.bobot || 0)
      }))
    ];
  }, []);

  const customScopes = [];
  allUnits.forEach(u => {
    (u.scopes || []).forEach(s => {
      if (s.scope_id === 'new' && s.nama_scope) {
        if (!customScopes.find(cs => cs.value === `new_${s.nama_scope}`)) {
          customScopes.push({ value: `new_${s.nama_scope}`, label: s.nama_scope });
        }
      }
    });
  });

  const dynamicScopeOptions = [
    ...catalogScopes,
    ...customScopes
  ];

  // Inisialisasi properti scopes di dalam setiap unit jika belum ada
  useEffect(() => {
    let shouldUpdate = false;
    const newAreas = (data.areas || []).map(area => {
      let areaUpdated = false;
      const newUnits = (area.units || []).map(unit => {
        if (!unit.scopes) {
          areaUpdated = true;
          shouldUpdate = true;
          return { ...unit, scopes: [] };
        }
        return unit;
      });
      return areaUpdated ? { ...area, units: newUnits } : area;
    });

    if (shouldUpdate) {
      updateData(prev => ({ ...prev, areas: newAreas }));
    }
  }, [data.areas, updateData]);


  const addScope = (areaId, unitId) => {
    updateData(prev => ({
      ...prev,
      areas: prev.areas.map(area => {
        if (area.id === areaId) {
          return {
            ...area,
            units: area.units.map(unit => {
              if (unit.id === unitId) {
                return {
                  ...unit,
                  scopes: [
                    ...(unit.scopes || []),
                    { 
                      id: Date.now(), 
                      scope_id: '',
                      nama_scope: '', 
                      bobot_unit: '', 
                      bobot_project: ''
                    }
                  ]
                };
              }
              return unit;
            })
          };
        }
        return area;
      })
    }));
  };

  const removeScope = (areaId, unitId, scopeId) => {
    updateData(prev => ({
      ...prev,
      areas: prev.areas.map(area => {
        if (area.id === areaId) {
          return {
            ...area,
            units: area.units.map(unit => {
              if (unit.id === unitId) {
                return {
                  ...unit,
                  scopes: unit.scopes.filter(s => s.id !== scopeId)
                };
              }
              return unit;
            })
          };
        }
        return area;
      })
    }));
  };

  const updateScope = (areaId, unitId, scopeId, field, value) => {
    updateData(prev => ({
      ...prev,
      areas: prev.areas.map(area => {
        if (area.id === areaId) {
          return {
            ...area,
            units: area.units.map(unit => {
              if (unit.id === unitId) {
                
                // Logic auto hitung Bobot Project = (Bobot Area * Bobot Unit * Bobot Scope) / 10000
                const updatedScopes = unit.scopes.map(s => {
                  if (s.id === scopeId) {
                    const newScope = { ...s, [field]: value };
                    
                    // Auto compute jika yg diubah adalah bobot_unit
                    if (field === 'bobot_unit') {
                      const aBobot = parseFloat(area.bobot || 0);
                      const uBobot = parseFloat(unit.bobot || 0);
                      const sBobot = parseFloat(value || 0);
                      
                      // Misal: Area 50%, Unit 50%, Scope 100% -> Project = 25%
                      const hitungProject = (aBobot * uBobot * sBobot) / 10000;
                      newScope.bobot_project = hitungProject > 0 ? hitungProject.toFixed(2) : '';
                    }

                    return newScope;
                  }
                  return s;
                });

                return { ...unit, scopes: updatedScopes };
              }
              return unit;
            })
          };
        }
        return area;
      })
    }));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">3. Rencana Kerja (Unit Scopes)</h2>
        <p className="text-sm text-gray-500">Tentukan daftar scope pekerjaan (Scope of work) untuk setiap unit yang telah dibuat.</p>
      </div>

      {allUnits.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
          <p className="text-gray-500 font-medium mb-2">Belum ada Unit Kerja yang didefinisikan.</p>
          <p className="text-sm text-gray-400">Silakan kembali ke Step 2 untuk mendaftarkan Area dan Unit terlebih dahulu.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {allUnits.map((unit) => (
            <div key={unit.id} className="border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
              
              {/* Header Unit */}
              <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-base">{unit.nama || 'Unit Tanpa Nama'} <span className="text-sm font-normal text-gray-500">(Area: {unit.areaNama})</span></h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 mt-1.5">
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">Bobot thd Project: {((parseFloat(unit.areaBobot) || 0) * (parseFloat(unit.bobot) || 0) / 100).toFixed(2)}%</span>
                    <span className="font-medium bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">Target: {unit.target_start || '-'} s/d {unit.target_finish || '-'}</span>
                    <span className="font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-md border border-green-200">Total Bobot Scope: {((unit.scopes || []).reduce((acc, s) => acc + (parseFloat(s.bobot_unit) || 0), 0)).toFixed(2)}%</span>
                    <span className="font-medium bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md border border-orange-200">Capaian Unit: 0.00%</span>
                    <span className="font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">Group: {unit.group_id === 'new' ? unit.new_group_name : (unit.group_id || '-')}</span>
                  </div>
                </div>
                <button 
                  onClick={() => addScope(unit.areaId, unit.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <Plus className="w-4 h-4" /> Tambah Scope
                </button>
              </div>

              {/* Scope List */}
              <div className="p-5">
                {(unit.scopes || []).length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <p className="text-gray-400 text-sm">Belum ada rincian pekerjaan (Scope) di unit ini.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(unit.scopes || []).map((scope, index) => (
                      <div key={scope.id} className="flex flex-col md:flex-row items-end gap-3 p-4 border border-blue-100 bg-blue-50/10 rounded-xl relative group">
                        
                        <div className="w-full flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="col-span-1 md:col-span-6">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Scope of work <span className="text-red-500">*</span></label>
                            <CreatableSelect
                              isClearable
                              options={dynamicScopeOptions}
                              placeholder="Pilih atau ketik scope baru..."
                              formatCreateLabel={(inputValue) => `+ Tambah Scope: "${inputValue}"`}
                              value={
                                scope.scope_id
                                  ? (scope.scope_id === 'new' 
                                      ? { value: `new_${scope.nama_scope}`, label: scope.nama_scope } 
                                      : dynamicScopeOptions.find(o => o.value === scope.scope_id))
                                  : (scope.nama_scope 
                                      ? (dynamicScopeOptions.find(o => o.label === scope.nama_scope) || { value: `new_${scope.nama_scope}`, label: scope.nama_scope })
                                      : null)
                              }
                              onChange={(newValue) => {
                                if (!newValue) {
                                  updateScope(unit.areaId, unit.id, scope.id, 'scope_id', '');
                                  updateScope(unit.areaId, unit.id, scope.id, 'nama_scope', '');
                                } else if (newValue.__isNew__) {
                                  updateScope(unit.areaId, unit.id, scope.id, 'scope_id', 'new');
                                  updateScope(unit.areaId, unit.id, scope.id, 'nama_scope', newValue.value);
                                } else if (String(newValue.value).startsWith('new_')) {
                                  updateScope(unit.areaId, unit.id, scope.id, 'scope_id', 'new');
                                  updateScope(unit.areaId, unit.id, scope.id, 'nama_scope', newValue.label);
                                } else {
                                  updateScope(unit.areaId, unit.id, scope.id, 'scope_id', newValue.value);
                                  updateScope(unit.areaId, unit.id, scope.id, 'nama_scope', newValue.label);
                                }
                              }}
                              menuPortalTarget={document.body}
                              menuPosition="fixed"
                              menuShouldScrollIntoView={false}
                              styles={{
                                menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                control: (base) => ({
                                  ...base,
                                  borderColor: '#e5e7eb',
                                  borderRadius: '0.5rem',
                                  padding: '1px',
                                  fontSize: '0.875rem',
                                  boxShadow: 'none',
                                  '&:hover': { borderColor: '#3b82f6' }
                                }),
                                option: (base) => ({
                                  ...base,
                                  fontSize: '0.875rem'
                                })
                              }}
                            />
                          </div>
                          
                          <div className="col-span-1 md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Bobot dlm Unit (%)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white" 
                              value={scope.bobot_unit}
                              onChange={(e) => updateScope(unit.areaId, unit.id, scope.id, 'bobot_unit', e.target.value)}
                            />
                          </div>

                          <div className="col-span-1 md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Bobot thd Project (%)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-gray-100 font-medium text-gray-700" 
                              readOnly
                              value={
                                (parseFloat(unit.areaBobot || 0) > 0 && parseFloat(unit.bobot || 0) > 0 && parseFloat(scope.bobot_unit || 0) > 0)
                                  ? ((parseFloat(unit.areaBobot) * parseFloat(unit.bobot) * parseFloat(scope.bobot_unit)) / 10000).toFixed(2)
                                  : (scope.bobot_project || '')
                              }
                            />
                            <p className="text-[10px] text-gray-400 mt-0.5">*(Auto dari bobot Area & Unit)</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => removeScope(unit.areaId, unit.id, scope.id)}
                          className="h-[38px] w-[38px] flex items-center justify-center shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors"
                          title="Hapus Scope"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
 
