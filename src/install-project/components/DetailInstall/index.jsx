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
  DollarSign,
  Menu,
  ChevronDown
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <div className="sticky top-0 z-20 bg-gray-50/90 sm:bg-transparent backdrop-blur-xl border-b border-gray-200/80 -mx-4 px-4 sm:mx-0 sm:px-0 sm:mb-6 pt-2 pb-2 sm:pb-0 transition-all">
        
        {/* Mobile Dropdown Button */}
        <div className="sm:hidden relative">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <Menu className="w-5 h-5 text-gray-500" />
              <div className="flex items-center gap-2 text-blue-600 font-bold">
                {(() => {
                  const active = tabs.find(t => t.id === activeTab);
                  const ActiveIcon = active?.icon || LayoutDashboard;
                  return (
                    <>
                      <ActiveIcon className="w-4 h-4" strokeWidth={2.5} />
                      <span>{active?.label}</span>
                    </>
                  );
                })()}
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3.5 text-sm font-semibold transition-colors text-left border-b border-gray-50 last:border-0 ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:flex items-center overflow-x-auto gap-8 border-b border-transparent sm:border-gray-200/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 py-3 px-2 border-b-2 font-semibold text-sm transition-all whitespace-nowrap outline-none ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <Icon 
                  className={`w-[18px] h-[18px] transition-colors ${
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
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
