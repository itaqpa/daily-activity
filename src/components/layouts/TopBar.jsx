import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, ChevronDown, LayoutDashboard, Wrench, Shield, LogOut, Settings, ClipboardList } from 'lucide-react';

import OfflineSyncIndicator from '../OfflineSyncIndicator';

export default function Topbar({ currentModule, dark = false, onToggleDark = null, showOnMobile = false, rightSlot = null, paddingClass = 'px-3 sm:px-6' }) {
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isModuleOpen, setIsModuleOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userDivisiLower = (user?.divisi || user?.nama_divisi || '').toLowerCase();
  const isMarketingDivision = userDivisiLower.includes('sales') || userDivisiLower.includes('marketing');
  
  const marketingPerms = ['dashboard_view', 'aktivitas_view', 'aktivitas_create', 'laporan_marketing_view', 'laporan_marketing_view_all', 'laporan_marketing_view_team', 'riwayat_aktivitas_view'];
  
  // Cukup cek lewat hasPermission karena role (termasuk Super Admin) sudah di-handle di AuthContext
  const hasMarketingAccess = marketingPerms.some(p => hasPermission(p));
  const checkPerm = (p) => hasPermission(p);
  const marketingPath = checkPerm('dashboard_view') ? '/marketing/dashboard' : 
                        (checkPerm('aktivitas_view') || checkPerm('riwayat_aktivitas_view')) ? '/marketing/activities' : 
                        checkPerm('aktivitas_create') ? '/marketing/activities/new' : 
                        checkPerm('laporan_marketing_view') ? '/marketing/reports' : '/marketing/activities';

  const hasDinasLuarAccess = ['install_project_view', 'daily_progress_view', 'laporan_project_view', 'pengeluaran_view', 'manpower_view'].some(p => hasPermission(p));

  const allModules = [
    { name: 'Daily Activity Sales', icon: <LayoutDashboard className="w-4 h-4 text-blue-600" />, path: marketingPath, hasAccess: hasMarketingAccess },
    { name: 'Installation Project', icon: <Wrench className="w-4 h-4 text-cyan-500" />, path: '/installation-project-v2', hasAccess: hasDinasLuarAccess },
    { name: 'Survey Product', icon: <ClipboardList className="w-4 h-4 text-emerald-600" />, path: '/survey-product', hasAccess: hasPermission('survey_product_view') }
  ];

  const modules = allModules.filter(mod => mod.hasAccess);
  const currentMod = modules.find(m => m.name === currentModule) || modules[0] || allModules[0];

  return (
    <header className={`${dark ? 'bg-[#0d1520] border-[#1e3a5a] text-slate-100' : 'bg-white border-gray-100 text-gray-800'} border-b ${paddingClass} py-2.5 sm:py-3 items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 ${showOnMobile ? 'flex' : 'hidden md:flex'}`}>
      <div className="flex items-center gap-2 sm:gap-5 min-w-0">
        <img src="/logo/aqpa-indonesia-logo.png" alt="AQPA Logo" className="h-5 sm:h-8 w-auto object-contain cursor-pointer shrink-0" onClick={() => navigate('/portal')} />
        
        {/* Module Switcher */}
        <div className="relative shrink-0">
          <button 
            onClick={() => setIsModuleOpen(!isModuleOpen)}
            title={currentMod.name}
            className={`flex items-center gap-1.5 sm:gap-2 border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 transition-colors cursor-pointer ${
              dark ? 'border-[#1e3a5a] bg-[#111b2a] hover:bg-[#162133]' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`p-1 rounded-md shrink-0 ${dark ? 'bg-cyan-500/15' : 'bg-blue-100'}`}>
              {currentMod.icon}
            </div>
            <span className={`hidden sm:inline text-xs sm:text-sm font-bold truncate sm:max-w-[160px] lg:max-w-none ${dark ? 'text-cyan-300' : 'text-gray-800'}`}>{currentMod.name}</span>
            <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform shrink-0 ${dark ? 'text-slate-400' : 'text-gray-500'} ${isModuleOpen ? 'rotate-180' : ''}`} />
          </button>

          {isModuleOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsModuleOpen(false)}></div>
              <div className={`absolute top-full left-0 mt-2 w-64 border rounded-xl shadow-lg z-50 overflow-hidden py-1 ${
                dark ? 'bg-[#111b2a] border-[#1e3a5a] text-slate-100' : 'bg-white border-gray-100 text-gray-700'
              }`}>
                {modules.map((mod, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setIsModuleOpen(false);
                      navigate(mod.path);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left cursor-pointer ${
                      dark ? 'hover:bg-[#162133]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${dark ? 'bg-[#162133]' : 'bg-gray-100'}`}>
                      {mod.icon}
                    </div>
                    <span className={`text-sm font-medium ${dark ? 'text-slate-200' : 'text-gray-700'}`}>{mod.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {rightSlot}
        {onToggleDark && (
          <button
            type="button"
            onClick={onToggleDark}
            title={dark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
            aria-label="Toggle theme"
            className={`p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer ${
              dark
                ? 'bg-[#111b2a] border-[#1e3a5a] text-cyan-300 hover:bg-[#162133]'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {dark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        )}
        <OfflineSyncIndicator />
        <button className={`hidden sm:inline-flex transition-colors ${dark ? 'text-slate-400 hover:text-cyan-300' : 'text-gray-400 hover:text-gray-600'}`}>
          <Search className="w-5 h-5" />
        </button>
        <button className={`hidden sm:inline-flex relative transition-colors ${dark ? 'text-slate-400 hover:text-cyan-300' : 'text-gray-400 hover:text-gray-600'}`}>
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        
        {/* Profile Dropdown */}
        <div className={`relative ml-0.5 sm:ml-2 pl-1.5 sm:pl-3 border-l ${dark ? 'border-[#1e3a5a]' : 'border-gray-200'}`}>
          <div 
            className="flex items-center gap-1.5 sm:gap-3 cursor-pointer group"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="text-right hidden sm:block">
              <p className={`text-sm font-bold leading-tight transition-colors ${dark ? 'text-slate-100 group-hover:text-cyan-300' : 'text-gray-900 group-hover:text-blue-600'}`}>
                {user?.name || 'User'}
              </p>
              <p className={`text-xs font-medium mt-0.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                {user?.jabatan || 'Staff'}
              </p>
            </div>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 shadow-sm flex items-center justify-center font-bold overflow-hidden shrink-0 ${
              dark ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-blue-100 border-white text-blue-600'
            }`}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${dark ? 'text-slate-400 group-hover:text-cyan-300' : 'text-gray-400 group-hover:text-gray-600'} ${isProfileOpen ? 'rotate-180' : ''}`} />
          </div>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || '-'}</p>
                </div>
                <div className="py-1">
                  <div className="px-4 py-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsRoleOpen(!isRoleOpen); }}
                      className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider py-1.5 hover:text-gray-600 transition-colors"
                    >
                      <span>Role & Akses Akun</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isRoleOpen && (
                      <div className="mt-2 mb-1">
                        {(() => {
                          const rolesList = [];
                          if (user?.jabatan) {
                            rolesList.push({ id: user.jabatan_id, nama_jabatan: user.jabatan, isDefault: true });
                          }
                          if (user?.additional_roles_data && Array.isArray(user.additional_roles_data)) {
                            user.additional_roles_data.forEach(r => {
                              if (!rolesList.some(item => Number(item.id) === Number(r.id))) {
                                rolesList.push({ id: r.id, nama_jabatan: r.nama_jabatan, isDefault: false });
                              }
                            });
                          }
                          const activeRoleName = user?.active_jabatan || user?.jabatan;

                          return (
                            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                              {rolesList.map((role) => {
                                const isCurrentActive = activeRoleName === role.nama_jabatan;
                                return (
                                  <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => {
                                      const updatedUser = { ...user, active_jabatan_id: role.id, active_jabatan: role.nama_jabatan };
                                      localStorage.setItem("user", JSON.stringify(updatedUser));
                                      window.location.reload();
                                    }}
                                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all border ${
                                      isCurrentActive 
                                        ? 'bg-blue-50/80 border-blue-200 text-blue-700 font-semibold' 
                                        : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <Shield className={`w-3.5 h-3.5 shrink-0 ${isCurrentActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                      <span className="truncate text-xs">{role.nama_jabatan}</span>
                                      {role.isDefault && (
                                        <span className="text-[9px] bg-gray-200 text-gray-600 px-1 py-0.2 rounded font-normal shrink-0">Utama</span>
                                      )}
                                    </div>
                                    {isCurrentActive && (
                                      <span className="text-blue-600 text-xs font-bold shrink-0 ml-1">✓</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button onClick={() => { setIsProfileOpen(false); navigate('/portal'); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                    <LayoutDashboard className="w-4 h-4 text-gray-400" />
                    Portal Modul
                  </button>
                  <button onClick={() => { setIsProfileOpen(false); /* navigate('/settings') */ }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                    <Settings className="w-4 h-4 text-gray-400" />
                    Pengaturan
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
                    <LogOut className="w-4 h-4 text-red-400" />
                    Keluar Aplikasi
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
