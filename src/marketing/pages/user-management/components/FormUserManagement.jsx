import React, { useState } from 'react';
import { XCircle, User, Shield, Key } from 'lucide-react';

const PERMISSION_MODULES = [
  { id: 'data_sales', name: 'Data Sales' },
  { id: 'data_customer', name: 'Data Customer' },
  { id: 'user_management', name: 'User Management' },
  { id: 'activities', name: 'Aktivitas (Catat & Riwayat)' },
  { id: 'reports', name: 'Reports' }
];

const PERMISSION_ACTIONS = [
  { id: 'view', name: 'View' },
  { id: 'create', name: 'Create' },
  { id: 'edit', name: 'Edit' },
  { id: 'delete', name: 'Delete' },
  { id: 'import', name: 'Import' },
  { id: 'export', name: 'Export' }
];

export default function FormUserManagement({
  isEditing,
  formData,
  divisis,
  jabatans,
  onClose,
  onChange,
  onSubmit
}) {
  const [activeTab, setActiveTab] = useState('info');

  const tabs = [
    { key: 'info', label: 'Informasi User', icon: User },
    { key: 'role', label: 'Akses Role', icon: Shield },
    { key: 'permission', label: 'Permission', icon: Key },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3 py-4 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl w-full sm:max-w-3xl shadow-xl flex flex-col overflow-hidden"
        style={{ maxHeight: 'min(92dvh, 92vh)' }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base sm:text-xl font-bold text-gray-800">
            {isEditing ? '✏️ Edit User' : '➕ Tambah User Baru'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Tab Navigation - Horizontal scroll on mobile */}
        <div className="sm:hidden flex-shrink-0 border-b border-gray-100 bg-gray-50/50">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Body - flex row */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          
          {/* Sidebar - Desktop only */}
          <div className="hidden sm:flex w-52 bg-gray-50/50 border-r border-gray-100 p-3 flex-col gap-1 flex-shrink-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    activeTab === tab.key
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 border-l-4 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area - scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 bg-white">
            <form id="user-form" onSubmit={onSubmit} className="space-y-4">
              
              {/* TAB 1: INFORMASI USER */}
              {activeTab === 'info' && (
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-2 text-sm sm:text-base">Informasi Dasar</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Nama Lengkap</label>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={onChange}
                        placeholder="Nama lengkap"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Username</label>
                      <input 
                        type="text" 
                        name="username"
                        value={formData.username}
                        onChange={onChange}
                        placeholder="username"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Email</label>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={onChange}
                        placeholder="email@contoh.com"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                        Password
                        {isEditing && <span className="text-gray-400 normal-case ml-1">(opsional)</span>}
                      </label>
                      <input 
                        type="password" 
                        name="password"
                        value={formData.password}
                        onChange={onChange}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required={!isEditing} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Divisi</label>
                      <select
                        name="divisi_id"
                        value={formData.divisi_id}
                        onChange={onChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">Pilih Divisi</option>
                        {divisis.map(d => (
                          <option key={d.id} value={d.id}>{d.nama_divisi}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Jabatan</label>
                      <select
                        name="jabatan_id"
                        value={formData.jabatan_id}
                        onChange={onChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">Pilih Jabatan</option>
                        {jabatans.map(j => (
                          <option key={j.id} value={j.id}>{j.nama_jabatan}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <input 
                      type="checkbox" 
                      name="is_active"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={onChange}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                      User Aktif — dapat login ke sistem
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: AKSES ROLE */}
              {activeTab === 'role' && (
                <div className="space-y-5">
                  <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-2 text-sm sm:text-base">Pengaturan Role & Hak Akses</h4>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-gray-800 text-sm">Role Default</h5>
                      <span className="text-xs font-normal text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Primary</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Role utama yang aktif saat user masuk ke sistem.</p>
                    <select
                      name="jabatan_id"
                      value={formData.jabatan_id}
                      onChange={onChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Pilih Role Default</option>
                      {jabatans.map(j => (
                        <option key={j.id} value={j.id}>{j.nama_jabatan}</option>
                      ))}
                    </select>
                  </div>

                  <hr className="border-gray-100" />

                  <div>
                    <h5 className="font-semibold text-gray-800 mb-1 text-sm">Role Tambahan</h5>
                    <p className="text-xs text-gray-500 mb-3">Pilih role ekstra yang dapat digunakan oleh user ini.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {jabatans.map(j => (
                        <label key={`add-role-${j.id}`} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            name="additional_roles"
                            value={j.id}
                            checked={(formData.additional_roles || []).some(id => Number(id) === Number(j.id))}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              const currentRoles = formData.additional_roles || [];
                              const newRoles = isChecked 
                                ? [...currentRoles, Number(j.id)] 
                                : currentRoles.filter(id => Number(id) !== Number(j.id));
                              onChange({ target: { name: 'additional_roles', value: newRoles, type: 'array' } });
                            }}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 flex-shrink-0"
                          />
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                            j.nama_jabatan.toLowerCase().includes('admin') ? 'bg-red-50 text-red-700' :
                            j.nama_jabatan.toLowerCase().includes('spv') ? 'bg-purple-50 text-purple-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {j.nama_jabatan}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ADDITIONAL PERMISSION */}
              {activeTab === 'permission' && (
                <div className="space-y-5">
                  <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-2 text-sm sm:text-base">Hak Akses Spesifik (Permissions)</h4>
                  <p className="text-xs text-gray-500 mb-4">Pilih fitur dan aksi apa saja yang diperbolehkan untuk user ini pada masing-masing modul di aplikasi.</p>
                  
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <h5 className="text-lg font-bold text-gray-800 mb-2">Coming Soon</h5>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                      Fitur Hak Akses Spesifik (Permissions) sedang dalam pengembangan. Saat ini seluruh akses diatur secara otomatis berdasarkan Jabatan / Role user.
                    </p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-gray-100 bg-gray-50/80 flex gap-3 flex-shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 sm:flex-none sm:px-6 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors font-semibold text-sm"
          >
            Batal
          </button>
          <button 
            type="submit" 
            form="user-form"
            className="flex-1 sm:flex-none sm:px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors font-semibold shadow-sm text-sm"
          >
            {isEditing ? 'Simpan Perubahan' : 'Buat User'}
          </button>
        </div>

      </div>
    </div>
  );
}
