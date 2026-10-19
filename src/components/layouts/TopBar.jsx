import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, ChevronDown, LayoutDashboard, Wrench, Shield, LogOut, Settings, ClipboardList } from 'lucide-react';

import OfflineSyncIndicator from '../OfflineSyncIndicator';

export default function Topbar({ currentModule }) {
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

  const allModules = [
    { name: 'Daily Activity Sales', icon: <LayoutDashboard className="w-4 h-4 text-blue-600" />, path: marketingPath, hasAccess: hasMarketingAccess },
    { name: 'Dinas Luar', icon: <Wrench className="w-4 h-4 text-orange-600" />, path: '/installation-project', hasAccess: hasPermission('install_project_view') },
    { name: 'Survey Product', icon: <ClipboardList className="w-4 h-4 text-emerald-600" />, path: '/survey-product', hasAccess: hasPermission('survey_product_view') }
  ];

  const modules = allModules.filter(mod => mod.hasAccess);
  const currentMod = modules.find(m => m.name === currentModule) || modules[0] || allModules[0];

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-30 hidden md:flex">
      <div className="flex items-center gap-6">
        <img src="/logo/aqpa-indonesia-logo.png" alt="AQPA Logo" className="h-8 w-auto object-contain cursor-pointer" onClick={() => navigate('/portal')} />
        
        {/* Module Switcher */}
        <div className="relative">
          <button 
            onClick={() => setIsModuleOpen(!isModuleOpen)}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
          >
            <div className="bg-blue-100 p-1 rounded-md">
              {currentMod.icon}
            </div>
            <span className="text-sm font-bold text-gray-800">{currentMod.name}</span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isModuleOpen ? 'rotate-180' : ''}`} />
          </button>

          {isModuleOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsModuleOpen(false)}></div>
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                {modules.map((mod, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setIsModuleOpen(false);
                      navigate(mod.path);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="bg-gray-100 p-1.5 rounded-lg shrink-0">
                      {mod.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{mod.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <OfflineSyncIndicator />
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        
        {/* Profile Dropdown */}
        <div className="relative ml-2 pl-4 border-l border-gray-200">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {user?.jabatan || 'Staff'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold overflow-hidden shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
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
