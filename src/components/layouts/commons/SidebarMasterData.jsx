import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Database, ChevronDown, ChevronRight, Briefcase, UserCircle, HardHat, Users, Shield, History } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export default function SidebarMasterData({ isActive }) {
  const { hasPermission } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  if (!hasPermission('sales_view') && !hasPermission('customer_view') && !hasPermission('manpower_view') && !hasPermission('user_view') && !hasPermission('akses_view') && !hasPermission('history_view')) {
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
          <Database className="w-4 h-4 text-blue-300" />
          <span>Data Master</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-blue-200/60" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-blue-200/60" />
        )}
      </button>

      {isOpen && (
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

          {hasPermission('user_view') && (
            <Link
              to="/master-admin/users"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                isActive("/master-admin/users")
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </Link>
          )}

          {hasPermission('akses_view') && (
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
              to="/master-admin/history-log"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                isActive("/master-admin/history-log")
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
  );
}
