import React, { useState } from 'react';
import CardResume from './CardResume';
import KpiSection from './KpiSection';
import KurvaSection from './KurvaSection';
import ProgressPerUnit from './ProgressPerUnit';
import DetailDaerah from './DetailDaerah';
import DetailUnit from './DetailUnit';
import DetailScope from './DetailScope';
import UserTerkait from './UserTerkait';
import DailyInputTab from './DailyInputTab';
import ReportTab from './ReportTab';
import BiayaProyekTab from './BiayaProyekTab';
import { 
  LayoutDashboard, 
  MapPin, 
  Users,
  Calendar,
  FileText,
  DollarSign
} from 'lucide-react';

export {
  CardResume,
  KpiSection,
  KurvaSection,
  ProgressPerUnit,
  DetailDaerah,
  DetailUnit,
  DetailScope,
  UserTerkait,
  DailyInputTab,
  ReportTab,
  BiayaProyekTab
};

export default function DetailInstall({ project = {}, onEdit }) {
  const [activeTab, setActiveTab] = useState('ALL');

  const tabs = [
    { id: 'ALL', label: 'Semua Tampilan', icon: LayoutDashboard },
    { id: 'DAILY_INPUT', label: 'Daily Input', icon: Calendar },
    { id: 'REPORT', label: 'Report', icon: FileText },
    { id: 'BIAYA', label: 'Biaya Proyek', icon: DollarSign },
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

      {/* Tab: Daily Input */}
      {activeTab === 'DAILY_INPUT' && (
        <DailyInputTab project={project} />
      )}

      {/* Tab: Report */}
      {activeTab === 'REPORT' && (
        <ReportTab project={project} />
      )}

      {/* Tab: Biaya Proyek */}
      {activeTab === 'BIAYA' && (
        <BiayaProyekTab project={project} />
      )}
    </div>
  );
}
