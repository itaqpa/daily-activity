import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, PlusCircle, List, Download } from 'lucide-react';
import TopBar from './TopBar';
import { apiUrl } from '../../../../api'; // Sesuaikan path ini nanti jika file dipindah

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Role checking for Add Activity button (Bottom nav mobile)
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};
  const activeJabatan = user.active_jabatan || user.jabatan;
  const activeJabatanId = user.active_jabatan_id || user.jabatan_id;

  const isSales = user.divisi?.toLowerCase() === 'sales' || user.kode_divisi === 'SLS' || user.divisi_id === 1;
  const isStaffSales = isSales && (activeJabatan?.toLowerCase() === 'staff' || activeJabatanId === 5);
  const isSPV = activeJabatan?.toLowerCase().includes('spv') || activeJabatan?.toLowerCase().includes('supervisor');
  const isManager = activeJabatan?.toLowerCase().includes('manager');
  const isLeader = activeJabatan?.toLowerCase().includes('leader');
  const canAddActivity = isStaffSales || isSPV || isManager || isLeader;

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

    if (navigator.onLine) {
      syncOfflineActivities();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <TopBar />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        {!isOnline && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm font-medium flex items-center justify-center">
            Anda sedang offline. Data akan disinkronkan saat online.
          </div>
        )}
        {children}
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
