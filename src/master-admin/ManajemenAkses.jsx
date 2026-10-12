import { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { apiUrl } from '../api';
import { Shield, Save, Loader2, Check } from 'lucide-react';

export default function ManajemenAkses() {
  const [activeTab, setActiveTab] = useState('matrix');
  const [permissions, setPermissions] = useState([]);
  const [divisis, setDivisis] = useState([]);
  const [jabatans, setJabatans] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedDivisi, setSelectedDivisi] = useState('');
  const [selectedJabatan, setSelectedJabatan] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  const [divisiPerms, setDivisiPerms] = useState([]);
  const [jabatanPerms, setJabatanPerms] = useState([]); // array of permission_id
  const [jabatanScopes, setJabatanScopes] = useState({}); // { [permId]: 'ALL' | 'DIVISION' | 'OWN' }
  const [userPerms, setUserPerms] = useState([]); // array of permission_id (direct bypass)
  const [userScopes, setUserScopes] = useState({}); // { [permId]: 'ALL' | 'DIVISION' | 'OWN' }
  const [inheritedDivisiPerms, setInheritedDivisiPerms] = useState([]); // array of permission_id
  const [inheritedJabatanPerms, setInheritedJabatanPerms] = useState([]); // array of permission_id
  const [inheritedJabatanScopes, setInheritedJabatanScopes] = useState({}); // { [permId]: scope }
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => { fetchMasterData(); }, []);

  const fetchMasterData = async () => {
    setIsLoading(true);
    try {
      const [permRes, divRes, jabRes, usrRes] = await Promise.all([
        fetch(apiUrl('/permissions')).then(r => r.json()),
        fetch(apiUrl('/divisis')).then(r => r.json()),
        fetch(apiUrl('/jabatans')).then(r => r.json()),
        fetch(apiUrl('/users')).then(r => r.json())
      ]);
      setPermissions(permRes || []);
      setDivisis(divRes || []);
      setJabatans(jabRes || []);
      setUsers(usrRes || []);
    } catch (error) {
      console.error('Error fetching master data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDivisiPerms = async (id) => {
    if(!id) return setDivisiPerms([]);
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl(`/permissions/divisi/${id}`));
      const data = await res.json();
      setDivisiPerms(Array.isArray(data) ? data : []);
    } catch(e) {
      setDivisiPerms([]);
    } finally { setIsLoading(false); }
  }

  const fetchJabatanPerms = async (id) => {
    if(!id) {
      setJabatanPerms([]);
      setJabatanScopes({});
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl(`/permissions/jabatan/${id}`));
      const data = await res.json();
      if (Array.isArray(data)) {
        const ids = data.map(item => (typeof item === 'object' ? item.permission_id : item));
        const scopes = {};
        data.forEach(item => {
          if (typeof item === 'object') {
            scopes[item.permission_id] = item.data_scope || 'ALL';
          }
        });
        setJabatanPerms(ids);
        setJabatanScopes(scopes);
      } else {
        setJabatanPerms([]);
        setJabatanScopes({});
      }
    } catch(e) {} finally { setIsLoading(false); }
  }

  const fetchUserPerms = async (id) => {
    if(!id) {
      setUserPerms([]);
      setUserScopes({});
      setInheritedDivisiPerms([]);
      setInheritedJabatanPerms([]);
      setInheritedJabatanScopes({});
      setSelectedUserInfo(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl(`/permissions/user/${id}`));
      const data = await res.json();
      
      // Jika data berupa object response baru
      if (data && data.direct) {
        setSelectedUserInfo(data.user || null);
        
        // Direct bypass
        const directIds = (data.direct || []).map(item => item.permission_id);
        const directScopes = {};
        (data.direct || []).forEach(item => {
          directScopes[item.permission_id] = item.data_scope || 'ALL';
        });
        setUserPerms(directIds);
        setUserScopes(directScopes);

        // Inherited dari divisi
        const divIds = Array.isArray(data.inherited_divisi) ? data.inherited_divisi.map(item => item.permission_id) : [];
        setInheritedDivisiPerms(divIds);

        // Inherited dari jabatan
        const jabList = Array.isArray(data.inherited_jabatan) ? data.inherited_jabatan : [];
        const jabIds = jabList.map(item => item.permission_id);
        const jabScopes = {};
        jabList.forEach(item => {
          jabScopes[item.permission_id] = item.data_scope || 'ALL';
        });
        setInheritedJabatanPerms(jabIds);
        setInheritedJabatanScopes(jabScopes);
      } else if (Array.isArray(data)) {
        // Fallback backward compatibility
        const ids = data.map(item => (typeof item === 'object' ? item.permission_id : item));
        const scopes = {};
        data.forEach(item => {
          if (typeof item === 'object') {
            scopes[item.permission_id] = item.data_scope || 'ALL';
          }
        });
        setUserPerms(ids);
        setUserScopes(scopes);
        setInheritedDivisiPerms([]);
        setInheritedJabatanPerms([]);
        setInheritedJabatanScopes({});
        setSelectedUserInfo(null);
      } else {
        setUserPerms([]);
        setUserScopes({});
        setInheritedDivisiPerms([]);
        setInheritedJabatanPerms([]);
        setInheritedJabatanScopes({});
        setSelectedUserInfo(null);
      }
    } catch(e) {
      console.error(e);
      setUserPerms([]);
      setUserScopes({});
      setInheritedDivisiPerms([]);
      setInheritedJabatanPerms([]);
      setInheritedJabatanScopes({});
      setSelectedUserInfo(null);
    } finally { setIsLoading(false); }
  }

  useEffect(() => { fetchDivisiPerms(selectedDivisi); }, [selectedDivisi]);
  useEffect(() => { fetchJabatanPerms(selectedJabatan); }, [selectedJabatan]);
  useEffect(() => { fetchUserPerms(selectedUser); }, [selectedUser]);

  const toggleDivisiPerm = (id) => setDivisiPerms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  
  const toggleJabatanPerm = (id) => {
    setJabatanPerms(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      if (!prev.includes(id) && !jabatanScopes[id]) {
        setJabatanScopes(s => ({ ...s, [id]: 'ALL' }));
      }
      return next;
    });
  };

  const changeJabatanScope = (id, scope) => {
    setJabatanScopes(prev => ({ ...prev, [id]: scope }));
  };

  const toggleUserPerm = (id) => {
    setUserPerms(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      if (!prev.includes(id) && !userScopes[id]) {
        setUserScopes(s => ({ ...s, [id]: 'ALL' }));
      }
      return next;
    });
  };

  const changeUserScope = (id, scope) => {
    setUserScopes(prev => ({ ...prev, [id]: scope }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promises = [];
      if (activeTab === 'matrix') {
        if (selectedDivisi) {
          promises.push(fetch(apiUrl(`/permissions/divisi/${selectedDivisi}`), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ permissions: divisiPerms })
          }));
        }
        if (selectedJabatan) {
          const items = jabatanPerms.map(id => ({
            permission_id: id,
            data_scope: jabatanScopes[id] || 'ALL'
          }));
          promises.push(fetch(apiUrl(`/permissions/jabatan/${selectedJabatan}`), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, permissions: jabatanPerms })
          }));
        }
      } else {
        if (selectedUser) {
          const items = userPerms.map(id => ({
            permission_id: id,
            data_scope: userScopes[id] || 'ALL'
          }));
          promises.push(fetch(apiUrl(`/permissions/user/${selectedUser}`), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, permissions: userPerms })
          }));
        }
      }
      
      await Promise.all(promises);
      setNotification('Hak akses berhasil disimpan!');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      setNotification('Gagal menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const groupPermissions = () => {
    const groups = {};
    permissions.forEach(p => {
      let key = "Lainnya";
      if (p.nama_permission.startsWith("dashboard")) key = "Dashboard";
      else if (p.nama_permission.startsWith("sales")) key = "Data Sales";
      else if (p.nama_permission.startsWith("customer")) key = "Data Customer";
      else if (p.nama_permission.startsWith("manpower")) key = "Data Manpower";
      else if (p.nama_permission.startsWith("user")) key = "User Management";
      else if (p.nama_permission.startsWith("akses")) key = "Manajemen Akses";
      else if (p.nama_permission.startsWith("history")) key = "History Log";
      else if (p.nama_permission.startsWith("aktivitas") || p.nama_permission.startsWith("riwayat_aktivitas")) key = "Aktivitas Sales";
      else if (p.nama_permission.startsWith("laporan_marketing")) key = "Laporan Marketing";
      else if (p.nama_permission.startsWith("install_project")) key = "Dinas Luar";
      else if (p.nama_permission.startsWith("daily_progress")) key = "Daily Progress";
      else if (p.nama_permission.startsWith("laporan_project")) key = "Laporan Project";
      else if (p.nama_permission.startsWith("pengeluaran")) key = "Data Pengeluaran MP";
      else if (p.nama_permission.startsWith("survey_product")) key = "Survey Product";
      else if (p.nama_permission.startsWith("survey_question")) key = "Survey Question";
      else if (p.nama_permission.startsWith("surveyor")) key = "Data Surveyor";
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  };

  const grouped = groupPermissions();

  return (
    <MainLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="w-full space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
              <Shield className="w-7 h-7 text-blue-600" /> Matrix Hak Akses
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Tentukan ruang kerja (Divisi) dan wewenang (Jabatan) dalam satu tampilan cerdas.
            </p>
          </div>
          {notification && (
            <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" /> {notification}
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 border-b border-gray-200 pb-2">
          <button 
            className={`font-bold pb-2 border-b-2 transition-all ${activeTab === 'matrix' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('matrix')}
          >
            Matrix Divisi & Jabatan
          </button>
          <button 
            className={`font-bold pb-2 border-b-2 transition-all ${activeTab === 'user' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('user')}
          >
            Pengecualian Spesifik User
          </button>
        </div>

        {activeTab === 'user' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3 text-sm flex gap-2 items-start">
            <span className="text-blue-500 font-bold mt-0.5">ℹ</span>
            <div>
              <strong>Cara Bypass Lintas Modul:</strong> Untuk mengizinkan 1 user dari divisi lain agar bisa mengakses fitur di modul <em>Daily Activity Sales</em>, cukup centang permission yang diperlukan (misal: <strong>riwayat_aktivitas_view</strong> atau <strong>laporan_marketing_view</strong>). Portal akan otomatis menyesuaikan menu yang tampil untuk user tersebut.
            </div>
          </div>
        )}


        {activeTab === 'matrix' ? (
          <>
            {/* Top Panel: Selectors */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">1. Pilih Divisi (Ruang Kerja)</label>
                <select 
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedDivisi} onChange={(e) => setSelectedDivisi(e.target.value)}
                >
                  <option value="">-- Pilih Divisi --</option>
                  {divisis.map(d => <option key={d.id} value={d.id}>{d.nama_divisi} ({d.kode_divisi})</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">2. Pilih Jabatan (Wewenang)</label>
                <select 
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedJabatan} onChange={(e) => setSelectedJabatan(e.target.value)}
                >
                  <option value="">-- Pilih Jabatan --</option>
                  {jabatans.map(j => <option key={j.id} value={j.id}>{j.nama_jabatan} (Lvl: {j.level})</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleSave}
                  disabled={isSaving || (!selectedDivisi && !selectedJabatan)}
                  className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan Matrix
                </button>
              </div>
            </div>

            {/* Matrix Panel */}
            {(!selectedDivisi && !selectedJabatan) ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
                Silakan pilih Divisi dan/atau Jabatan di atas untuk mulai mengatur hak akses.
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-6 flex flex-col gap-1 border border-blue-100">
                  <span className="font-bold">Info Matrix:</span>
                  <span>• Centang utama (warna biru) akan disimpan ke <b>Divisi</b> (Membuka akses menu).</span>
                  <span>• Centang CRUD di bawahnya (warna abu/hijau) akan disimpan ke <b>Jabatan</b> (Kewenangan).</span>
                  <span>• Role <b>Admin</b> dapat diatur cakupan datanya (ALL / DIVISION / OWN). Role <b>Super Admin</b> bersifat permanen (ALL).</span>
                </div>

                {(() => {
                  const currentJabatanObj = jabatans.find(j => Number(j.id) === Number(selectedJabatan));
                  const isSuperAdminJabatan = Number(selectedJabatan) === 1 || 
                    (currentJabatanObj?.nama_jabatan || '').toLowerCase().trim() === 'super admin';

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Object.keys(grouped).map(groupName => {
                    const perms = grouped[groupName];
                    const viewPerm = perms.find(p => p.nama_permission.endsWith('_view'));
                    const crudPerms = perms.filter(p => !p.nama_permission.endsWith('_view'));

                    if (!viewPerm && crudPerms.length > 0) {
                      return (
                        <div key={groupName} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                          <div className="bg-gray-200 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <span className="font-bold text-gray-700">Fitur Spesifik: {groupName}</span>
                          </div>
                          <div className="p-4 flex flex-wrap gap-3">
                            {crudPerms.map(p => (
                              <label key={p.id} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                                <input 
                                  type="checkbox" 
                                  disabled={!selectedJabatan}
                                  checked={jabatanPerms.includes(p.id)}
                                  onChange={() => toggleJabatanPerm(p.id)}
                                  className="text-green-600 rounded"
                                />
                                <span className="text-sm">{p.nama_permission.split('_').pop().toUpperCase()}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (viewPerm) {
                      const isViewChecked = Array.isArray(divisiPerms) && divisiPerms.includes(viewPerm.id);
                      const isJabatanViewChecked = Array.isArray(jabatanPerms) && jabatanPerms.includes(viewPerm.id);
                      const currentScope = jabatanScopes[viewPerm.id] || 'ALL';

                      return (
                        <div key={groupName} className={`border rounded-xl overflow-hidden transition-all ${isViewChecked ? 'border-blue-400 shadow-sm bg-blue-50/30' : 'border-gray-200 bg-gray-50 opacity-75 hover:opacity-100'}`}>
                          <label className={`cursor-pointer px-4 py-3 border-b flex justify-between items-center transition-colors ${isViewChecked ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`}>
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                disabled={!selectedDivisi}
                                checked={isViewChecked}
                                onChange={() => toggleDivisiPerm(viewPerm.id)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                              />
                              <span className={`font-extrabold ${isViewChecked ? 'text-blue-900' : 'text-gray-600'}`}>{groupName}</span>
                            </div>
                            {selectedDivisi && <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-bold">DIVISI</span>}
                          </label>

                          <div className="p-4 space-y-4">
                            {/* Scope Data Jabatan */}
                            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                              <div className="flex items-center justify-between mb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    disabled={!selectedJabatan}
                                    checked={isJabatanViewChecked}
                                    onChange={() => toggleJabatanPerm(viewPerm.id)}
                                    className="rounded text-blue-600"
                                  />
                                  <span className="text-xs font-bold text-gray-700">Akses View Jabatan</span>
                                </label>
                                {selectedJabatan && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                    currentScope === 'ALL' ? 'bg-emerald-100 text-emerald-700' :
                                    currentScope === 'DIVISION' ? 'bg-indigo-100 text-indigo-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {currentScope}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-500">Cakupan Data:</span>
                                {isSuperAdminJabatan ? (
                                  <div className="text-xs py-1.5 px-2 border border-emerald-200 bg-emerald-50 rounded-md text-emerald-800 font-bold flex-1 flex items-center justify-between">
                                    <span>Semua Data (ALL)</span>
                                    <span className="text-[10px] text-emerald-600 font-normal">Permanen Super Admin</span>
                                  </div>
                                ) : (
                                  <select 
                                    disabled={!selectedJabatan}
                                    value={currentScope}
                                    onChange={(e) => {
                                      const newScope = e.target.value;
                                      setJabatanPerms(prev => prev.includes(viewPerm.id) ? prev : [...prev, viewPerm.id]);
                                      setJabatanScopes(prev => ({ ...prev, [viewPerm.id]: newScope }));
                                    }}
                                    className="text-xs py-1.5 px-2 border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium flex-1 disabled:opacity-50"
                                  >
                                    <option value="ALL">Semua Data (ALL)</option>
                                    <option value="DIVISION">Satu Divisi (DIVISION)</option>
                                    <option value="OWN">Data Diri Sendiri (OWN)</option>
                                  </select>
                                )}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 mb-2 font-semibold">Kewenangan Aksi (CRUD):</p>
                              <div className="flex flex-wrap gap-2">
                                {crudPerms.length === 0 ? (
                                  <span className="text-xs text-gray-400 italic">Tidak ada aksi spesifik.</span>
                                ) : (
                                  crudPerms.map(p => {
                                    const action = p.nama_permission.split('_').pop();
                                    let colorClass = "text-gray-600 bg-white border-gray-200";
                                    const isJabPermChecked = Array.isArray(jabatanPerms) && jabatanPerms.includes(p.id);
                                    if (isJabPermChecked) {
                                      if (action === 'create' || action === 'import') colorClass = "text-green-700 bg-green-100 border-green-300 font-bold";
                                      else if (action === 'edit') colorClass = "text-yellow-700 bg-yellow-100 border-yellow-300 font-bold";
                                      else if (action === 'delete') colorClass = "text-red-700 bg-red-100 border-red-300 font-bold";
                                      else if (action === 'export') colorClass = "text-purple-700 bg-purple-100 border-purple-300 font-bold";
                                      else colorClass = "text-blue-700 bg-blue-100 border-blue-300 font-bold";
                                    }

                                    return (
                                      <label 
                                        key={p.id} 
                                        className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm ${colorClass} ${(!isViewChecked) ? 'opacity-50' : ''}`}
                                      >
                                        <input 
                                          type="checkbox" 
                                          disabled={!selectedJabatan}
                                          checked={isJabPermChecked}
                                          onChange={() => toggleJabatanPerm(p.id)}
                                          className="hidden"
                                        />
                                        <span className="text-xs">{action.toUpperCase()}</span>
                                      </label>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                  );
                })()}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex gap-6 mb-6 items-end">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">Pilih User untuk Bypass</label>
                <select 
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">-- Pilih User --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <button 
                onClick={handleSave}
                disabled={isSaving || !selectedUser}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Simpan Bypass
              </button>
            </div>
            
            {selectedUserInfo && (
              <div className="mb-6 p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-wrap items-center justify-between gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Profil User:</span>{' '}
                  <strong className="text-gray-800">{selectedUserInfo.name}</strong> ({selectedUserInfo.email})
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg font-bold text-xs">
                    Divisi: {selectedUserInfo.nama_divisi || 'Tanpa Divisi'}
                  </span>
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg font-bold text-xs">
                    Jabatan: {selectedUserInfo.nama_jabatan || 'Tanpa Jabatan'}
                  </span>
                </div>
              </div>
            )}

            {(!selectedUser) ? (
              <div className="py-10 text-center text-gray-500">Silakan pilih User.</div>
            ) : isLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.keys(grouped).map(groupName => {
                  const perms = grouped[groupName];
                  const viewPerm = perms.find(p => p.nama_permission.endsWith('_view'));
                  const crudPerms = perms.filter(p => !p.nama_permission.endsWith('_view'));

                  if (!viewPerm && crudPerms.length > 0) {
                    return (
                      <div key={groupName} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                        <div className="bg-gray-200 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                          <span className="font-bold text-gray-700">Fitur Spesifik: {groupName}</span>
                        </div>
                        <div className="p-4 flex flex-wrap gap-3">
                          {crudPerms.map(p => {
                            const isInherited = Array.isArray(inheritedJabatanPerms) && inheritedJabatanPerms.includes(p.id);
                            const isDirect = Array.isArray(userPerms) && userPerms.includes(p.id);
                            const isEffectiveChecked = isInherited || isDirect;

                            return (
                              <label key={p.id} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                                <input 
                                  type="checkbox" 
                                  checked={isEffectiveChecked}
                                  onChange={() => toggleUserPerm(p.id)}
                                  className="text-green-600 rounded"
                                />
                                <span className="text-sm">{p.nama_permission.split('_').pop().toUpperCase()}</span>
                                {isInherited && (
                                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded font-bold">Role</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (viewPerm) {
                    // Cek apakah permission view diwarisi dari divisi atau jabatan
                    const isDivisiInherited = Array.isArray(inheritedDivisiPerms) && inheritedDivisiPerms.includes(viewPerm.id);
                    const isJabatanInherited = Array.isArray(inheritedJabatanPerms) && inheritedJabatanPerms.includes(viewPerm.id);
                    const isInherited = isDivisiInherited || isJabatanInherited;
                    const isDirect = Array.isArray(userPerms) && userPerms.includes(viewPerm.id);
                    const isEffectiveViewChecked = isInherited || isDirect;

                    // Hitung scope efektif: Prioritaskan user override jika ada, jika tidak pakai scope bawaan jabatan
                    const inheritedScope = inheritedJabatanScopes[viewPerm.id] || 'ALL';
                    const effectiveScope = isDirect ? (userScopes[viewPerm.id] || 'ALL') : (isJabatanInherited ? inheritedScope : 'ALL');

                    return (
                      <div key={groupName} className={`border rounded-xl overflow-hidden transition-all ${isEffectiveViewChecked ? 'border-blue-400 shadow-sm bg-blue-50/30' : 'border-gray-200 bg-gray-50 opacity-75 hover:opacity-100'}`}>
                        {/* Header Modul / Menu View */}
                        <label className={`cursor-pointer px-4 py-3 border-b flex justify-between items-center transition-colors ${isEffectiveViewChecked ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`}>
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={isEffectiveViewChecked}
                              onChange={() => toggleUserPerm(viewPerm.id)}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`font-extrabold ${isEffectiveViewChecked ? 'text-blue-900' : 'text-gray-600'}`}>{groupName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isInherited && (
                              <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                                {isDivisiInherited && isJabatanInherited ? 'DIVISI & JABATAN' : isDivisiInherited ? 'DIVISI' : 'JABATAN'}
                              </span>
                            )}
                            {isDirect && (
                              <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                BYPASS
                              </span>
                            )}
                          </div>
                        </label>

                        <div className="p-4 space-y-4">
                          {/* Scope Selector Box */}
                          <div className={`p-3 rounded-lg border transition-all ${isEffectiveViewChecked ? 'bg-white border-blue-200 shadow-xs' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-gray-700">Cakupan Data (Scope)</span>
                              <div className="flex items-center gap-1">
                                {isInherited && !isDirect && (
                                  <span className="text-[10px] text-gray-500 font-medium">(Bawaan Role)</span>
                                )}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  effectiveScope === 'ALL' ? 'bg-emerald-100 text-emerald-700' :
                                  effectiveScope === 'DIVISION' ? 'bg-indigo-100 text-indigo-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {effectiveScope}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <select 
                                disabled={!isEffectiveViewChecked}
                                value={effectiveScope}
                                onChange={(e) => {
                                  const newScope = e.target.value;
                                  setUserPerms(prev => prev.includes(viewPerm.id) ? prev : [...prev, viewPerm.id]);
                                  setUserScopes(prev => ({ ...prev, [viewPerm.id]: newScope }));
                                }}
                                className="text-xs py-1.5 px-2.5 border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium flex-1 disabled:opacity-50"
                              >
                                <option value="ALL">Semua Data (ALL)</option>
                                <option value="DIVISION">Satu Divisi (DIVISION)</option>
                                <option value="OWN">Data Diri Sendiri (OWN)</option>
                              </select>
                            </div>
                          </div>

                          {/* Action Badges (CRUD) */}
                          <div>
                            <p className="text-xs text-gray-500 mb-2 font-semibold">Kewenangan Aksi (CRUD):</p>
                            <div className="flex flex-wrap gap-2">
                              {crudPerms.length === 0 ? (
                                <span className="text-xs text-gray-400 italic">Tidak ada aksi spesifik.</span>
                              ) : (
                                crudPerms.map(p => {
                                  const action = p.nama_permission.split('_').pop();
                                  const isJabatanAct = Array.isArray(inheritedJabatanPerms) && inheritedJabatanPerms.includes(p.id);
                                  const isDirectAct = Array.isArray(userPerms) && userPerms.includes(p.id);
                                  const isActChecked = isJabatanAct || isDirectAct;

                                  let colorClass = "text-gray-600 bg-white border-gray-200";
                                  if (isActChecked) {
                                    if (action === 'create' || action === 'import') colorClass = "text-green-700 bg-green-100 border-green-300 font-bold";
                                    else if (action === 'edit') colorClass = "text-yellow-700 bg-yellow-100 border-yellow-300 font-bold";
                                    else if (action === 'delete') colorClass = "text-red-700 bg-red-100 border-red-300 font-bold";
                                    else if (action === 'export') colorClass = "text-purple-700 bg-purple-100 border-purple-300 font-bold";
                                    else colorClass = "text-blue-700 bg-blue-100 border-blue-300 font-bold";
                                  }

                                  return (
                                    <label 
                                      key={p.id} 
                                      title={isJabatanAct ? 'Bawaan dari Jabatan' : isDirectAct ? 'Bypass Khusus User' : ''}
                                      className={`flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm ${colorClass} ${(!isEffectiveViewChecked) ? 'opacity-50' : ''}`}
                                    >
                                      <input 
                                        type="checkbox" 
                                        checked={isActChecked}
                                        onChange={() => toggleUserPerm(p.id)}
                                        className="hidden"
                                      />
                                      <span className="text-xs">{action.toUpperCase()}</span>
                                      {isJabatanAct && !isDirectAct && (
                                        <span className="text-[9px] bg-black/10 px-1 py-0.2 rounded font-normal">🔒</span>
                                      )}
                                      {isDirectAct && (
                                        <span className="text-[9px] bg-amber-500 text-white px-1 py-0.2 rounded font-bold">★</span>
                                      )}
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </MainLayout>
  );
}
