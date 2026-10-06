import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Menu, Home, PlusCircle, List, Download, UserCircle, Settings, Users } from 'lucide-react';
import Sidebar from './Sidebar';
import { apiUrl } from '../../../../api';

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  // Role checking for Add Activity button
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};
  // Ambil active jabatan, jika belum pilih, gunakan jabatan utama
  const activeJabatan = user.active_jabatan || user.jabatan;
  const activeJabatanId = user.active_jabatan_id || user.jabatan_id;

  const isSales = user.divisi?.toLowerCase() === 'sales' || user.kode_divisi === 'SLS' || user.divisi_id === 1;
  const isStaffSales = isSales && (activeJabatan?.toLowerCase() === 'staff' || activeJabatanId === 5);
  const isSPV = activeJabatan?.toLowerCase().includes('spv') || activeJabatan?.toLowerCase().includes('supervisor');
  const isManager = activeJabatan?.toLowerCase().includes('manager');
  const isLeader = activeJabatan?.toLowerCase().includes('leader');
  const canAddActivity = isStaffSales || isSPV || isManager || isLeader;

  const availableRoles = [];
  if (user.jabatan) {
    availableRoles.push({ id: user.jabatan_id, nama_jabatan: user.jabatan });
  }
  if (user.additional_roles_data && Array.isArray(user.additional_roles_data)) {
    user.additional_roles_data.forEach(role => {
       if (!availableRoles.some(r => r.id === role.id)) {
          availableRoles.push(role);
       }
    });
  }

  const handleSwitchRole = (roleId, roleName) => {
    const updatedUser = { ...user, active_jabatan_id: roleId, active_jabatan: roleName };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    window.location.reload();
  };

  const isActive = (path) => location.pathname === path;

  const syncOfflineActivities = async () => {
    const offlineQueue = JSON.parse(localStorage.getItem('offlineActivities') || '[]');
    if (offlineQueue.length === 0) return;

    let successCount = 0;
    const remainingQueue = [];

    for (const activity of offlineQueue) {
      try {
        const response = await fetch(apiUrl('/activities'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activity)
        });
        
        if (response.ok) {
          successCount++;
        } else {
          remainingQueue.push(activity);
        }
      } catch (err) {
        remainingQueue.push(activity);
      }
    }

    localStorage.setItem('offlineActivities', JSON.stringify(remainingQueue));
    if (successCount > 0) {
      alert(`${successCount} data aktivitas offline berhasil disinkronkan ke server!`);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineActivities();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on load
    if (navigator.onLine) {
      syncOfflineActivities();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto w-full pb-20 md:pb-0">
        {/* Header (Mobile) */}
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

        {/* Content Area */}
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 px-6 py-3 flex justify-between items-center pb-safe">
        <Link 
          to="/marketing/dashboard" 
          className={`flex flex-col items-center gap-1 ${isActive('/marketing/dashboard') ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        
        {canAddActivity && (
          <Link 
            to="/marketing/activities/new" 
            className="flex flex-col items-center -mt-8"
          >
            <div className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors">
              <PlusCircle className="w-8 h-8" strokeWidth={2} />
            </div>
          </Link>
        )}

        <Link 
          to="/marketing/activities" 
          className={`flex flex-col items-center gap-1 ${isActive('/marketing/activities') ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <List className="w-6 h-6" />
          <span className="text-[10px] font-medium">Riwayat</span>
        </Link>
      </div>
    </div>
  );
}


