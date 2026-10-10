import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Wrench, ChevronDown, ChevronRight, FolderKanban, Coins, FileText, PlusSquare, PlusCircle } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export default function SidebarInstallation({ isActive }) {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  if (!hasPermission('install_project_view') && !hasPermission('pengeluaran_view') && !hasPermission('laporan_project_view')) {
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
          <Wrench className="w-4 h-4 text-blue-300" />
          <span>Installation Project</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-blue-200/60" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-blue-200/60" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-1 pl-1">
          {hasPermission('install_project_view') && (
            <Link
              to="/installation-project"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                isActive("/installation-project") || location.pathname.startsWith("/installation-project")
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>Data Project</span>
            </Link>
          )}

          {hasPermission('pengeluaran_view') && (
            <Link
              to="/data-pengeluaran"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                isActive("/data-pengeluaran") || location.pathname.startsWith("/data-pengeluaran")
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Data Pengeluaran</span>
            </Link>
          )}

          {/* New Mobile Friendly Forms */}
          {hasPermission('install_project_view') && (
            <Link
              to="/installation-project/add-activity"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                location.pathname === '/installation-project/add-activity'
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
              }`}
            >
              <PlusSquare className="w-4 h-4" />
              <span>Tambah Aktivitas</span>
            </Link>
          )}

          {(hasPermission('pengeluaran_view') || hasPermission('install_project_view')) && (
            <Link
              to="/installation-project/add-cost"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                location.pathname === '/installation-project/add-cost'
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Pengeluaran</span>
            </Link>
          )}

          {hasPermission('laporan_project_view') && (
            <Link
              to="/installation-project/reports"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                location.pathname === '/installation-project/reports'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
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
