import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, List, Edit3, FileText, ChevronDown, ChevronRight, TrendingUp } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export default function SidebarMarketing({ isActive }) {
  const { hasPermission } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  if (!hasPermission('dashboard_view') && !hasPermission('aktivitas_view') && !hasPermission('aktivitas_create') && !hasPermission('laporan_marketing_view')) {
    return null;
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-200/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-300" />
          <span>Marketing</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-blue-200/60" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-blue-200/60" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-1 pl-1">
          {hasPermission('dashboard_view') && (
            <Link
              to="/marketing/dashboard"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                isActive("/marketing/dashboard")
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Summary Dashboard</span>
            </Link>
          )}

          {hasPermission('aktivitas_view') && (
            <Link
              to="/marketing/activities"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                isActive("/marketing/activities")
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
              }`}
            >
              <List className="w-4 h-4" />
              <span>Semua aktivitas</span>
            </Link>
          )}

          {hasPermission('aktivitas_create') && (
            <Link
              to="/marketing/activities/new"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                isActive("/marketing/activities/new")
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Catat Aktivitas</span>
            </Link>
          )}

          {hasPermission('laporan_marketing_view') && (
            <Link
              to="/marketing/reports"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                isActive("/marketing/reports")
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Laporan</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
