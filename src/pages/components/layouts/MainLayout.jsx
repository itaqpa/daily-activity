import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto w-full">
        {/* Header (Mobile) */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center md:hidden sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 p-1 bg-gray-50 rounded-md">
              <Menu className="w-6 h-6" />
            </button>
            <img src="/logo/aqpa-indonesia-logo.png" alt="AQPA Logo" className="h-6 w-auto object-contain" />
          </div>
          <button onClick={handleLogout} className="text-gray-600">
            <LogOut className="w-6 h-6" />
          </button>
        </header>

        {/* Content Area */}
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
