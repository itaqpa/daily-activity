import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Star,
  Clock,
  LayoutDashboard,
  Wrench,
  ChevronDown,
  Settings,
  Shield,
  LogOut,
  ArrowRight
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function Portal() {
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // --- HAK AKSES UNTUK DAILY ACTIVITY SALES ---
  // Memeriksa apakah user memiliki minimal satu akses "View" ke fitur-fitur di modul Daily Activity Sales
  const hasDailyActivitySalesAccess = 
    hasPermission('dashboard_view') || 
    hasPermission('aktivitas_view') || 
    hasPermission('riwayat_aktivitas_view') || 
    hasPermission('laporan_marketing_view') || 
    hasPermission('customer_view') || 
    hasPermission('sales_view');
  
  const dailyActivityPath = hasPermission('dashboard_view') ? '/marketing/dashboard' : 
                            (hasPermission('aktivitas_view') || hasPermission('riwayat_aktivitas_view')) ? '/marketing/activities' : 
                            hasPermission('laporan_marketing_view') ? '/marketing/reports' : '/marketing/activities';

  // --- HAK AKSES UNTUK DINAS LUAR (INSTALLATION) ---
  // Memeriksa apakah user memiliki minimal satu akses "View" ke fitur-fitur di modul Dinas Luar
  const hasDinasLuarAccess = 
    hasPermission('install_project_view') || 
    hasPermission('daily_progress_view') || 
    hasPermission('laporan_project_view') || 
    hasPermission('pengeluaran_view') || 
    hasPermission('manpower_view');

  const dinasLuarPath = hasPermission('install_project_view') ? '/installation-project' : 
                        hasPermission('daily_progress_view') ? '/installation-project/progress' : 
                        hasPermission('laporan_project_view') ? '/installation-project/reports' : 
                        hasPermission('pengeluaran_view') ? '/installation-project/expenses' : '/installation-project';

  const allModules = [
    {
      title: 'Daily Activity Sales',
      description: 'Manajemen aktivitas sales, laporan, dan pelanggan secara real-time',
      icon: <LayoutDashboard className="w-7 h-7 text-blue-600" />,
      bgClass: 'bg-blue-50/80',
      borderClass: 'border-blue-100',
      shadowClass: 'shadow-blue-500/20',
      path: dailyActivityPath,
      hasAccess: hasDailyActivitySalesAccess
    },
    {
      title: 'Dinas Luar (Installation)',
      description: 'Manajemen proyek instalasi, progress harian, dan pelaporan lapangan',
      icon: <Wrench className="w-7 h-7 text-orange-600" />,
      bgClass: 'bg-orange-50/80',
      borderClass: 'border-orange-100',
      shadowClass: 'shadow-orange-500/20',
      path: dinasLuarPath,
      hasAccess: hasDinasLuarAccess
    }
  ];

  const modules = allModules.filter(mod => mod.hasAccess);

  useEffect(() => {
    // Jika user hanya punya akses ke 1 modul, langsung arahkan tanpa harus lewat portal
    if (modules.length === 1) {
      navigate(modules[0].path, { replace: true });
    }
  }, [modules.length, navigate]); // using length to prevent infinite re-renders since modules array is recreated every render

  const getFormattedDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('id-ID', options);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Navigation - Glassmorphism */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm px-6 py-4 flex items-center justify-between transition-all">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-xl bg-white/50 shadow-sm border border-white/50">
            <img
              src="/logo/aqpa-indonesia-logo.png"
              alt="AQPA Logo"
              className="h-8 object-contain"
            />
          </div>
        </div>

        {/* Middle: Search */}
        <div className="hidden md:flex items-center bg-white border border-gray-200/80 shadow-inner rounded-full px-5 py-2.5 w-[450px] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all group">
          <Search className="w-5 h-5 text-gray-400 mr-3 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Cari modul, menu, atau informasi..."
            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
          />
          <div className="flex items-center gap-1 opacity-70">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-[10px] text-gray-500 font-bold shadow-sm">⌘</kbd>
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-[10px] text-gray-500 font-bold shadow-sm">K</kbd>
          </div>
        </div>

        {/* Right: Profile & Actions */}
        <div className="flex items-center gap-6 relative">
          <button className="relative p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
          </button>

          <div
            className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-full hover:bg-white/50 transition-all"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {user?.jabatan || 'Staff'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-white shadow-md overflow-hidden flex items-center justify-center text-blue-700 font-extrabold text-lg">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'B'}
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Profile Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-16 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 py-2 z-50 overflow-hidden ring-1 ring-black/5 animate-in slide-in-from-top-2">
              <div className="px-5 py-4 border-b border-slate-100/80 bg-slate-50/50">
                <p className="text-sm font-bold text-slate-900">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate mt-1">{user?.email || '-'}</p>
              </div>

              <div className="py-3">
                <div className="px-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Role Akses Tambahan</p>
                  {user?.additional_roles_data && user.additional_roles_data.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {user.additional_roles_data.map((role) => (
                        <div key={role.id} className="flex items-center gap-2.5 text-sm text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                            <Shield className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-xs truncate">{role.nama_jabatan}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-xl text-center">Tidak ada role tambahan</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100/80 py-1.5">
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-3 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Pengaturan
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Keluar (Logout)
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">

        {/* Welcome Section - Enhanced */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200/60 shadow-sm text-xs font-bold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistem Aktif & Terhubung
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user?.name ? user.name.split(' ')[0] : 'User'}</span> 👋
            </h1>
            <p className="text-slate-500 text-lg font-medium max-w-xl">
              Selamat datang di portal utama AQPA. Pilih modul kerja Anda untuk memulai produktivitas hari ini.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3">
            <p className="text-sm font-bold text-slate-400">{getFormattedDate()}</p>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 border border-amber-100 shadow-sm">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              Waktunya berkarya!
            </div>
          </div>
        </div>

        {/* Modul Utama (Favorit / Tersedia) */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6 text-indigo-500" /> Modul Akses Anda
            </h2>
          </div>

          {modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {modules.map((mod, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(mod.path)}
                  className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                  </div>
                  <div className={`w-16 h-16 rounded-2xl ${mod.bgClass} flex items-center justify-center border ${mod.borderClass} shadow-lg ${mod.shadowClass} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {mod.icon}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">{mod.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{mod.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Belum Ada Akses Modul</h3>
              <p className="text-slate-500">Akun Anda saat ini belum memiliki hak akses untuk modul apapun. Silakan hubungi Administrator.</p>
            </div>
          )}
        </section>

        {/* Modul Terakhir Diakses */}
        {modules.length > 0 && (
          <section className="mb-12 opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-700">Aktivitas Terakhir</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => navigate(modules[0].path)}
                className="bg-white/60 rounded-2xl p-4 border border-slate-100 shadow-sm hover:bg-white hover:border-blue-100 hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
              >
                <div className={`w-12 h-12 rounded-xl ${modules[0].bgClass} flex items-center justify-center border ${modules[0].borderClass} shrink-0`}>
                  {modules[0].icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600">{modules[0].title}</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">2 jam yang lalu</p>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
