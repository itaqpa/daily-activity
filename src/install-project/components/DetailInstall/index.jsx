import React, { useState } from 'react';
import CardResume from './CardResume';
import KpiSection from './KpiSection';
import KurvaSection from './KurvaSection';
import ProgressPerUnit from './ProgressPerUnit';
import DetailDaerah from './DetailDaerah';
import DetailUnit from './DetailUnit';
import DetailScope from './DetailScope';
import UserTerkait from './UserTerkait';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Boxes, 
  MapPin, 
  ListChecks, 
  Users 
} from 'lucide-react';

export {
  CardResume,
  KpiSection,
  KurvaSection,
  ProgressPerUnit,
  DetailDaerah,
  DetailUnit,
  DetailScope,
  UserTerkait
};

export default function DetailInstall({ project = {}, onEdit }) {
  const [activeTab, setActiveTab] = useState('ALL');

  const tabs = [
    { id: 'ALL', label: 'Semua Tampilan', icon: LayoutDashboard },
    { id: 'KPI_KURVA', label: 'KPI & Kurva S', icon: TrendingUp },
    { id: 'PROGRESS_UNIT', label: 'Progress Unit & Scope', icon: Boxes },
    { id: 'DAERAH', label: 'Detail Daerah', icon: MapPin },
    { id: 'SCOPE', label: 'Scope of Work', icon: ListChecks },
    { id: 'USER', label: 'User & Tim Terkait', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* 1. HERO / CARD RESUME (Selalu tampil di atas sebagai ringkasan eksekutif project) */}
      <CardResume project={project} />

      {/* 2. TAB NAVIGATION BAR */}
      <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/90 shadow-xs p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap select-none ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENTS */}
      {/* Tab: Semua Tampilan */}
      {activeTab === 'ALL' && (
        <div className="space-y-6">
          {/* Table KPI (Gambar 1) */}
          <KpiSection project={project} />

          {/* Curva S (Gambar 2) */}
          <KurvaSection project={project} />

          {/* Card Progress Per Unit dengan Dropdown Scope (Gambar 3 & 4) */}
          <ProgressPerUnit project={project} />

          {/* Grid Daerah & Tim */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DetailDaerah project={project} />
            <UserTerkait project={project} />
          </div>
        </div>
      )}

      {/* Tab: KPI & Kurva S */}
      {activeTab === 'KPI_KURVA' && (
        <div className="space-y-6">
          <KpiSection project={project} />
          <KurvaSection project={project} />
        </div>
      )}

      {/* Tab: Progress Unit & Scope */}
      {activeTab === 'PROGRESS_UNIT' && (
        <div className="space-y-6">
          <ProgressPerUnit project={project} />
          <DetailScope project={project} />
        </div>
      )}

      {/* Tab: Detail Daerah */}
      {activeTab === 'DAERAH' && (
        <div className="space-y-6">
          <DetailDaerah project={project} />
        </div>
      )}

      {/* Tab: Scope of Work */}
      {activeTab === 'SCOPE' && (
        <div className="space-y-6">
          <DetailScope project={project} />
        </div>
      )}

      {/* Tab: User & Tim Terkait */}
      {activeTab === 'USER' && (
        <div className="space-y-6">
          <UserTerkait project={project} />
        </div>
      )}
    </div>
  );
}
