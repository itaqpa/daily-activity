import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  List,
  Edit3,
  FileText,
  Settings,
  X,
  UserCircle,
  Briefcase,
  Users,
  HardHat,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  FolderKanban,
  Wrench,
  Download,
  Coins,
  Shield,
  Database,
  History
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleInstallClick = () => {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.click();
    } else {
      alert("Aplikasi sudah terinstall atau tidak mendukung instalasi.");
    }
  };

  // State Section Expand/Collapse
  const [isMarketingSectionOpen, setIsMarketingSectionOpen] = useState(
    location.pathname.includes("/marketing") || location.pathname === "/portal"
  );
  const [isInstallSectionOpen, setIsInstallSectionOpen] = useState(
    location.pathname.includes("/installation-project") || location.pathname.includes("/data-pengeluaran")
  );
  const [isDataMasterSectionOpen, setIsDataMasterSectionOpen] = useState(
    location.pathname.includes("/master-data") || location.pathname.includes("/users") || location.pathname.includes("/manajemen-akses")
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-[#233E60] border-r border-[#1c3350] 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-end p-4 pb-0">
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto pb-4">
          <div className="space-y-3">
            
            {/* SECTION 1: MARKETING */}
            {(hasPermission('dashboard_view') || hasPermission('aktivitas_view') || hasPermission('laporan_marketing_view')) && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setIsMarketingSectionOpen(!isMarketingSectionOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-200/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors select-none"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-300" />
                    <span>Marketing</span>
                  </div>
                  {isMarketingSectionOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-blue-200/60" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-blue-200/60" />
                  )}
                </button>

                {isMarketingSectionOpen && (
                  <div className="space-y-1 pl-1">
                    {/* Dashboard */}
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

                    {/* Semua aktivitas */}
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

                    {/* Laporan */}
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
            )}

            {/* SECTION 2: INSTALLATION PROJECT */}
            {(hasPermission('install_project_view') || hasPermission('pengeluaran_view') || hasPermission('laporan_project_view')) && (
              <div className="space-y-1 pt-1 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsInstallSectionOpen(!isInstallSectionOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-200/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors select-none"
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-blue-300" />
                    <span>Installation Project</span>
                  </div>
                  {isInstallSectionOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-blue-200/60" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-blue-200/60" />
                  )}
                </button>

                {isInstallSectionOpen && (
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
            )}

            {/* SECTION 3: DATA MASTER */}
            {(hasPermission('sales_view') || hasPermission('customer_view') || hasPermission('manpower_view') || hasPermission('user_management_view') || hasPermission('manajemen_akses_view') || hasPermission('history_view')) && (
              <div className="space-y-1 pt-1 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsDataMasterSectionOpen(!isDataMasterSectionOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-200/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors select-none"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-300" />
                    <span>Data Master</span>
                  </div>
                  {isDataMasterSectionOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-blue-200/60" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-blue-200/60" />
                  )}
                </button>

                {isDataMasterSectionOpen && (
                  <div className="space-y-1 pl-1">
                    {hasPermission('sales_view') && (
                      <Link
                        to="/marketing/master-data/sales"
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                          isActive("/marketing/master-data/sales")
                            ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                            : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
                        }`}
                      >
                        <Briefcase className="w-4 h-4" />
                        <span>Data Sales</span>
                      </Link>
                    )}

                    {hasPermission('customer_view') && (
                      <Link
                        to="/marketing/master-data/customer"
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                          isActive("/marketing/master-data/customer")
                            ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                            : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
                        }`}
                      >
                        <UserCircle className="w-4 h-4" />
                        <span>Data Customer</span>
                      </Link>
                    )}

                    {hasPermission('manpower_view') && (
                      <Link
                        to="/marketing/master-data/manpower"
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                          isActive("/marketing/master-data/manpower")
                            ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                            : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
                        }`}
                      >
                        <HardHat className="w-4 h-4" />
                        <span>Data Manpower</span>
                      </Link>
                    )}

                    {hasPermission('user_management_view') && (
                      <Link
                        to="/marketing/users"
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                          isActive("/marketing/users")
                            ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                            : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>User Management</span>
                      </Link>
                    )}

                    {hasPermission('manajemen_akses_view') && (
                      <Link
                        to="/master-admin/manajemen-akses"
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                          isActive("/master-admin/manajemen-akses")
                            ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                            : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        <span>Manajemen Akses</span>
                      </Link>
                    )}

                    {hasPermission('history_view') && (
                      <Link
                        to="/marketing/master-data/history-log"
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                          isActive("/marketing/master-data/history-log")
                            ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                            : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
                        }`}
                      >
                        <History className="w-4 h-4" />
                        <span>History & Activity Log</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: SETTING */}
            <div className="pt-2 border-t border-white/10">
              <Link
                to="/marketing/settings"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive("/marketing/settings")
                    ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                    : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Setting</span>
              </Link>
            </div>

            {/* Install Apps */}
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-blue-100/70 hover:bg-white/5 hover:text-white text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="flex-1 text-left">Install Apps</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
