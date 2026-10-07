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
  LogOut
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

  const allModules = [
    {
      title: 'Daily Activity Sales',
      description: 'Manajemen aktivitas sales, laporan, dan pelanggan',
      icon: <LayoutDashboard className="w-6 h-6 text-blue-600" />,
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-100',
      path: '/marketing/dashboard',
      permission: 'dashboard_view' // Check against backend permissions
    },
    {
      title: 'Dinas Luar (Installation)',
      description: 'Manajemen proyek instalasi, progress harian, dan laporan',
      icon: <Wrench className="w-6 h-6 text-orange-600" />,
      bgClass: 'bg-orange-50',
      borderClass: 'border-orange-100',
      path: '/installation-project',
      permission: 'install_project_view'
    }
  ];

  // Filter modules based on user permissions
  const modules = allModules.filter(mod => hasPermission(mod.permission));

  // Helper to get formatted date
  const getFormattedDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('id-ID', options);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">

      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">

        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-lg">
            <img
              src="/logo/aqpa-indonesia-logo.png"
              alt="AQPA Logo"
              className="h-8 object-contain"
            />
          </div>
        </div>

        {/* Middle: Search */}
        <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 w-[400px] focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Cari modul, menu, atau informasi..."
            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
          />
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-400 font-medium shadow-sm">⌘</kbd>
            <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-400 font-medium shadow-sm">K</kbd>
          </div>
        </div>

        {/* Right: Profile & Actions */}
        <div className="flex items-center gap-6 relative">
          <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </button>

          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {user?.jabatan || 'Staff'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-blue-600 font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'B'}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Profile Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-14 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || '-'}</p>
              </div>

              <div className="py-2">
                <div className="px-4 py-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Role Akses Tambahan</p>
                  {user?.additional_roles_data && user.additional_roles_data.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {user.additional_roles_data.map((role) => (
                        <div key={role.id} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="font-medium truncate">{role.nama_jabatan}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Tidak ada role tambahan</p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    // navigate('/settings') // Example
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Pengaturan
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
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
      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 mb-2">
              Selamat Datang, {user?.name ? user.name.split(' ')[0] : 'User'} <span className="text-4xl">👋</span>
            </h1>
            <p className="text-gray-500 font-medium">Pilih modul yang ingin Anda akses atau cari melalui kolom pencarian.</p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <p className="text-sm font-bold text-gray-400">{getFormattedDate()}</p>
            <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border border-yellow-100 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              Waktunya produktif!
            </div>
          </div>
        </div>

        {/* Modul Favorit */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Modul Favorit
            </h2>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700">Lihat semua</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((mod, idx) => (
              <div
                key={idx}
                onClick={() => navigate(mod.path)}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex items-center gap-4 group"
              >
                <div className={`w-14 h-14 rounded-xl ${mod.bgClass} flex items-center justify-center border ${mod.borderClass} shrink-0 group-hover:scale-110 transition-transform`}>
                  {mod.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">{mod.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{mod.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Modul Terakhir Diakses */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" /> Modul Terakhir Diakses
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.length > 0 ? (
              <div
                onClick={() => navigate(modules[0].path)}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex items-center gap-4 group"
              >
                <div className={`w-14 h-14 rounded-xl ${modules[0].bgClass} flex items-center justify-center border ${modules[0].borderClass} shrink-0 group-hover:scale-110 transition-transform`}>
                  {modules[0].icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">{modules[0].title}</h3>
                  <p className="text-xs text-gray-400 font-medium">2 jam yang lalu</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">Belum ada modul yang diakses.</div>
            )}
          </div>
        </section>

        {/* Semua Modul */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-gray-200 pb-4">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              <button className="text-sm font-bold text-white bg-blue-600 px-4 py-2 rounded-full whitespace-nowrap shadow-sm">Semua Modul</button>
              <button className="text-sm font-medium text-gray-500 hover:text-gray-900 whitespace-nowrap">Operasional</button>
              <button className="text-sm font-medium text-gray-500 hover:text-gray-900 whitespace-nowrap">Proyek</button>
              <button className="text-sm font-medium text-gray-500 hover:text-gray-900 whitespace-nowrap">Support</button>
              <button className="text-sm font-medium text-gray-500 hover:text-gray-900 whitespace-nowrap">Manajemen</button>
              <button className="text-sm font-medium text-gray-500 hover:text-gray-900 whitespace-nowrap">Tools</button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium shrink-0">
              Urutkan: <span className="font-bold text-gray-900">A-Z</span> <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((mod, idx) => (
              <div
                key={idx}
                onClick={() => navigate(mod.path)}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex items-center gap-4 group"
              >
                <div className={`w-14 h-14 rounded-xl ${mod.bgClass} flex items-center justify-center border ${mod.borderClass} shrink-0 group-hover:scale-110 transition-transform`}>
                  {mod.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">{mod.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{mod.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
