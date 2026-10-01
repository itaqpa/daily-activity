import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Menu, Home, PlusCircle, List, Download } from 'lucide-react';
import Sidebar from './Sidebar';
import { apiUrl } from '../../../../api';

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Role checking for Add Activity button
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};
  const isSales = user.divisi?.toLowerCase() === 'sales' || user.kode_divisi === 'SLS' || user.divisi_id === 1;
  const isStaffSales = isSales && (user.jabatan?.toLowerCase() === 'staff' || user.jabatan_id === 5);
  const isSPV = user.jabatan?.toLowerCase().includes('spv') || user.jabatan?.toLowerCase().includes('supervisor');
  const canAddActivity = isStaffSales || isSPV;

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
          <div className="flex items-center gap-4">
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
                className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md"
                title="Install App"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            <button onClick={handleLogout} className="text-gray-600">
              <LogOut className="w-6 h-6" />
            </button>
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


