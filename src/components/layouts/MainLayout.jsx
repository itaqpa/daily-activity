import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Menu, Home, PlusCircle, List, Download, UserCircle, Settings, Users, FolderKanban, PlusSquare, Coins } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileHeader from './commons/MobileHeader';
import MobileBottomNav from './commons/MobileBottomNav';
import { apiUrl } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const { user: contextUser, hasMarketingPerm } = useAuth();
  const user = contextUser || {};
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  // Determine current module based on URL, but persist in localStorage
  // so shared routes (like master data) don't lose context.
  const [currentModule, setCurrentModule] = useState(() => {
    return localStorage.getItem('activeAppModule') || 'Daily Activity Sales';
  });

  useEffect(() => {
    const path = location.pathname;
    const isSharedRoute = path.startsWith('/marketing/master-data') || 
                          path.startsWith('/marketing/settings') || 
                          path.startsWith('/marketing/users') || 
                          path.startsWith('/master-admin/manajemen-akses');
                          
    if (!isSharedRoute) {
      if (path.startsWith('/installation-project') || path.startsWith('/data-pengeluaran')) {
        localStorage.setItem('activeAppModule', 'Installation Project');
        setCurrentModule('Installation Project');
      } else if (path.startsWith('/marketing')) {
        localStorage.setItem('activeAppModule', 'Daily Activity Sales');
        setCurrentModule('Daily Activity Sales');
      }
    }
  }, [location.pathname]);

  const activeJabatan = user?.active_jabatan || user?.jabatan;
  const activeJabatanId = user?.active_jabatan_id || user?.jabatan_id;

  const canAddActivity = hasMarketingPerm('aktivitas_create');

  const availableRoles = [];
  if (user?.jabatan) {
    availableRoles.push({ id: user.jabatan_id, nama_jabatan: user.jabatan });
  }
  if (user?.additional_roles_data && Array.isArray(user.additional_roles_data)) {
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

  const syncOfflineCustomers = async () => {
    const offlineQueue = JSON.parse(localStorage.getItem('offlineCustomers') || '[]');
    if (offlineQueue.length === 0) return;

    let successCount = 0;
    const remainingQueue = [];

    for (const customer of offlineQueue) {
      try {
        const response = await fetch(apiUrl('/customers'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer)
        });
        
        if (response.ok) {
          successCount++;
        } else {
          remainingQueue.push(customer);
        }
      } catch (err) {
        remainingQueue.push(customer);
      }
    }

    localStorage.setItem('offlineCustomers', JSON.stringify(remainingQueue));
    if (successCount > 0) {
      alert(`${successCount} data customer offline berhasil disinkronkan ke server!`);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineActivities();
      syncOfflineCustomers();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on load
    if (navigator.onLine) {
      syncOfflineActivities();
      syncOfflineCustomers();
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
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Desktop Topbar */}
      <TopBar currentModule={currentModule} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} currentModule={currentModule} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-0 relative">
          <MobileHeader 
            user={user}
            activeJabatan={activeJabatan}
            activeJabatanId={activeJabatanId}
            availableRoles={availableRoles}
            isOnline={isOnline}
            isMobileProfileOpen={isMobileProfileOpen}
            setIsMobileProfileOpen={setIsMobileProfileOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            handleSwitchRole={handleSwitchRole}
            handleLogout={handleLogout}
          />

          {/* Content Area */}
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      <MobileBottomNav 
        currentModule={currentModule}
        isActive={isActive}
        canAddActivity={canAddActivity}
      />
    </div>
  );
}


