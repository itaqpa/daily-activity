import React from 'react';
import { Home, ClipboardList, Plus, FileText, User } from 'lucide-react';

export default function DriverBottomNav({ 
  activeNav = 'tasks', 
  onChangeNav,
  onNavChange,
  activeTasksCount = 0 
}) {
  const handleNavClick = (id) => {
    if (typeof onNavChange === 'function') {
      onNavChange(id);
    } else if (typeof onChangeNav === 'function') {
      onChangeNav(id);
    }
  };
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home
    },
    {
      id: 'tasks',
      label: 'Daftar Tugas',
      icon: ClipboardList
    },
    {
      id: 'add',
      label: 'Tambah',
      icon: Plus,
      isPrimaryAction: true // Tombol tengah menonjol
    },
    {
      id: 'reports',
      label: 'Laporan',
      icon: FileText
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: User
    }
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;

          // Tombol Tengah Floating (Tambah Plus)
          if (item.isPrimaryAction) {
            return (
              <div key={item.id} className="relative -top-5 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  aria-label="Tambah Plus"
                  className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center transition-transform active:scale-90 border-4 border-slate-50"
                >
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </button>
                <span className="text-[10px] font-bold text-slate-600 mt-1">
                  {item.label}
                </span>
              </div>
            );
          }

          // Tombol Navigasi Standar
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors relative ${isActive ? 'bg-emerald-50 text-emerald-600' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.id === 'tasks' && activeTasksCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
                    {activeTasksCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
