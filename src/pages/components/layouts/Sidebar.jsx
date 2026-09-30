import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LogOut, 
  Activity, 
  Users, 
  Settings, 
  X, 
  Database, 
  ChevronDown, 
  ChevronRight, 
  Briefcase, 
  UserCircle,
  FileText,
  List,
  Edit3,
  Download
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDataMasterOpen, setIsDataMasterOpen] = useState(
    location.pathname.includes('/master-data')
  );

  // Parse user dari localStorage untuk mengecek role
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};
  
  // Logika role (sesuaikan dengan data user dari database Anda)
  const isSuperAdmin = user.username === 'admin' || user.jabatan === 'Super Admin' || user.role === 'superadmin';
  const isSales = user.divisi?.toLowerCase() === 'sales' || user.kode_divisi === 'SLS' || user.divisi_id === 1;
  
  // Jika bukan super admin, maka ia adalah user biasa (termasuk sales)
  const isRegularUser = !isSuperAdmin;
  
  // Cek apakah user adalah Staff (bukan SPV) di divisi Sales
  const isStaffSales = isSales && (user.jabatan?.toLowerCase() === 'staff' || user.jabatan_id === 5);
  
  const isSPV = user.jabatan?.toLowerCase().includes('spv') || user.jabatan?.toLowerCase().includes('supervisor');
  const canViewTimSales = isSuperAdmin || isSPV;

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  // Online/Offline State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Tampilkan prompt bawaan OS/Browser
      deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Prompt hanya bisa dipakai 1 kali
      setDeferredPrompt(null);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
          {/* Mobile Close Button */}
          <div className="md:hidden flex justify-end p-4 pb-0">
             <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 rounded-lg p-1">
               <X className="w-5 h-5" />
             </button>
          </div>

          <div className="p-6 pt-4 md:pt-6 flex items-center justify-center shrink-0">
             <img 
                src="/logo/aqpa-indonesia-logo.png" 
                alt="AQPA Logo" 
                className="h-10 w-auto object-contain" 
              />
          </div>
          
          <nav className="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto pb-4">
            {/* Dashboard */}
            <Link 
              to="/dashboard" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/dashboard') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>

            {/* Data Customer - Untuk User Biasa */}
            {isRegularUser && (
              <Link 
                to="/master-data/customer"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/master-data/customer') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <UserCircle className="w-5 h-5" />
                <span className="font-medium">Data Customer</span>
              </Link>
            )}

            {/* Tim Sales - Khusus untuk Super Admin & SPV */}
            {canViewTimSales && (
              <Link 
                to="/master-data/sales"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/master-data/sales') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                <span className="font-medium">Tim Sales</span>
              </Link>
            )}

            {/* Semua Aktivitas */}
            <Link 
              to="/activities"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/activities') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <List className="w-5 h-5" />
              <span className="font-medium">Semua Aktivitas</span>
            </Link>

            {/* Catat Aktivitas - Khusus Staff Sales & SPV */}
            {(isStaffSales || isSPV) && (
              <Link 
                to="/activities/new"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/activities/new') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Edit3 className="w-5 h-5" />
                <span className="font-medium">Catat Aktivitas</span>
              </Link>
            )}

            {/* Submenu Data Master - Khusus Super Admin */}
            {isSuperAdmin && (
              <div>
                <button 
                  onClick={() => setIsDataMasterOpen(!isDataMasterOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    location.pathname.includes('/master-data') ? 'bg-blue-50/50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5" />
                    <span className="font-medium">Data Master</span>
                  </div>
                  {isDataMasterOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                
                {isDataMasterOpen && (
                  <div className="mt-1 ml-4 pl-4 border-l border-gray-100 space-y-1">
                    <Link 
                      to="/master-data/sales"
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                        isActive('/master-data/sales') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      <span className="font-medium text-sm">Data Sales</span>
                    </Link>
                    <Link 
                      to="/master-data/customer"
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                        isActive('/master-data/customer') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <UserCircle className="w-4 h-4" />
                      <span className="font-medium text-sm">Data Customer</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* User Management - Khusus Super Admin */}
            {isSuperAdmin && (
              <Link 
                to="/users"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/users') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">User Management</span>
              </Link>
            )}

            {/* Laporan - Paling Akhir */}
            <Link 
              to="/reports"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/reports') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Laporan</span>
            </Link>
            
            {/* Settings */}
            <Link 
              to="/settings"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/settings') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Edit Profil</span>
            </Link>
          </nav>
          
          <div className="p-4 border-t border-gray-200 shrink-0 space-y-2">
            {/* Tombol Install App (Hanya Tampil di Mobile) */}
            <button
              onClick={handleInstallClick}
              className="md:hidden flex items-center gap-3 text-blue-600 hover:bg-blue-50 w-full px-4 py-3 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Install App</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-red-600 hover:bg-red-50 w-full px-4 py-3 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
      </aside>
    </>
  );
}
