import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, PlusCircle, List, FolderKanban, PlusSquare, Coins, X, Plus } from 'lucide-react';

export default function MobileBottomNav({ currentModule, isActive, canAddActivity }) {
  const [showInstallMenu, setShowInstallMenu] = useState(false);

  if (currentModule === 'Installation Project') {
    return (
      <>
        {/* Backdrop for popup menu */}
        {showInstallMenu && (
          <div 
            className="fixed inset-0 bg-black/20 z-30 md:hidden" 
            onClick={() => setShowInstallMenu(false)}
          ></div>
        )}

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 px-8 py-3 flex justify-between items-center pb-safe">
          <Link 
            to="/installation-project" 
            className={`flex flex-col items-center gap-1 ${isActive('/installation-project') ? 'text-blue-600' : 'text-gray-500'}`}
            onClick={() => setShowInstallMenu(false)}
          >
            <FolderKanban className="w-6 h-6" />
            <span className="text-[10px] font-medium">Project</span>
          </Link>
          
          {/* Center Floating Button */}
          <div className="relative flex flex-col items-center -mt-8">
            {/* Popup Menu */}
            {showInstallMenu && (
              <div className="absolute bottom-16 flex flex-col gap-3 items-center animate-in slide-in-from-bottom-2 fade-in duration-200">
                <Link 
                  to="/installation-project/add-activity" 
                  className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-lg border border-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                  onClick={() => setShowInstallMenu(false)}
                >
                  <PlusSquare className="w-4 h-4 text-blue-600" />
                  Tambah Aktivitas
                </Link>
                <Link 
                  to="/installation-project/add-cost" 
                  className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-lg border border-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                  onClick={() => setShowInstallMenu(false)}
                >
                  <PlusCircle className="w-4 h-4 text-green-600" />
                  Tambah Biaya
                </Link>
              </div>
            )}

            <button 
              onClick={() => setShowInstallMenu(!showInstallMenu)}
              className={`text-white rounded-full p-3 shadow-lg transition-transform duration-200 ${showInstallMenu ? 'bg-red-500 rotate-45' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <Plus className="w-8 h-8" strokeWidth={2} />
            </button>
          </div>
          
          <Link 
            to="/data-pengeluaran" 
            className={`flex flex-col items-center gap-1 ${isActive('/data-pengeluaran') ? 'text-blue-600' : 'text-gray-500'}`}
            onClick={() => setShowInstallMenu(false)}
          >
            <Coins className="w-6 h-6" />
            <span className="text-[10px] font-medium">Data Biaya</span>
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 px-8 py-3 flex justify-between items-center pb-safe">
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
  );
}
