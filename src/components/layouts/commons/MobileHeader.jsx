import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Download, Settings, Users, LogOut } from 'lucide-react';

export default function MobileHeader({ 
  user, 
  activeJabatan, 
  activeJabatanId, 
  availableRoles, 
  isOnline, 
  isMobileProfileOpen, 
  setIsMobileProfileOpen, 
  setIsSidebarOpen, 
  handleSwitchRole, 
  handleLogout 
}) {
  return (
    <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center md:hidden sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 p-1 bg-gray-50 rounded-md">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo/aqpa-indonesia-logo.png" alt="AQPA Logo" className="h-6 w-auto object-contain" />
          {isOnline ? (
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Online</span>
          ) : (
            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Offline</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {!window.matchMedia('(display-mode: standalone)').matches && (
          <button 
            onClick={async () => {
              if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
                const { outcome } = await window.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                  console.log('User accepted the install prompt');
                }
                window.deferredPrompt = null;
              } else {
                alert("Untuk menginstal aplikasi:\n\n- iOS/Safari: Tap tombol Share, lalu pilih 'Add to Home Screen'.\n- Android/Chrome: Tap ikon titik tiga, lalu pilih 'Install App' atau 'Add to Home Screen'.");
              }
            }}
            className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md transition-colors"
            title="Install App"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
        
        {/* Mobile Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsMobileProfileOpen(!isMobileProfileOpen)}
            className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 shadow-sm flex items-center justify-center text-blue-600 font-bold active:scale-95 transition-transform"
          >
            {user.nama ? user.nama.substring(0, 2).toUpperCase() : 'U'}
          </button>

          {isMobileProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMobileProfileOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                    {user.nama ? user.nama.substring(0, 2).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-gray-800 text-sm truncate">{user.nama || user.username}</span>
                    <span className="text-xs text-gray-500 truncate">{activeJabatan}</span>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50/30 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Role Aktif</p>
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    {availableRoles.length > 0 ? availableRoles.map(role => (
                      <button
                        key={role.id}
                        onClick={() => handleSwitchRole(role.id, role.nama_jabatan)}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all text-left border ${
                          activeJabatanId === role.id 
                            ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold shadow-sm' 
                            : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <div className="w-4 flex justify-center shrink-0">
                          {activeJabatanId === role.id && <span className="text-blue-600">✓</span>}
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          {role.nama_jabatan.toLowerCase().includes('admin') ? <Settings className="w-4 h-4 text-gray-400" /> : <Users className="w-4 h-4 text-gray-400" />}
                          <span className="truncate">{role.nama_jabatan}</span>
                        </div>
                      </button>
                    )) : (
                      <div className="px-2 py-2 text-xs text-gray-400 italic">Tidak ada role lain</div>
                    )}
                  </div>
                </div>

                <div className="p-2">
                  <Link
                    to="/marketing/settings"
                    onClick={() => setIsMobileProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                  >
                    <Settings className="w-5 h-5 text-gray-400" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                  >
                    <LogOut className="w-5 h-5 text-red-400" />
                    Logout
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
