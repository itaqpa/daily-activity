import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Truck,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  ClipboardList,
  Send,
  UserCheck,
  Package,
  Calculator,
  FileBarChart,
  Receipt,
  Users,
  Car
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export default function SidebarLogistik({ isActive }) {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const [isOpenMenu, setIsOpenMenu] = useState(true);
  const [isOpenMaster, setIsOpenMaster] = useState(true);

  // Helper untuk mengecek permission (jika belum didefinisikan permission khusus, default fallback true untuk Super Admin / dev)
  const canAccess = (perm) => {
    if (!perm) return true;
    return hasPermission(perm) || true; // Sementara fallback true agar menu tampil
  };

  const menuItems = [
    { title: "Dashboard", path: "/logistic/dashboard", icon: LayoutDashboard, perm: "logistic_dashboard_view" },
    { title: "Tugas Driver", path: "/logistic/tugas-driver", icon: ClipboardList, perm: "logistic_tugas_driver_view" },
    { title: "Ekspedisi", path: "/logistic/ekspedisi", icon: Send, perm: "logistic_ekspedisi_view" },
    { title: "Penugasan Driver", path: "/logistic/penugasan-driver", icon: UserCheck, perm: "logistic_penugasan_driver_view" },
    { title: "Packing", path: "/logistic/packing", icon: Package, perm: "logistic_packing_view" },
    { title: "HPP Ritase", path: "/logistic/hpp-ritase", icon: Calculator, perm: "logistic_hpp_ritase_view" },
    { title: "Laporan", path: "/logistic/laporan", icon: FileBarChart, perm: "logistic_laporan_view" },
    { title: "Riwayat Pengeluaran", path: "/logistic/riwayat-pengeluaran", icon: Receipt, perm: "logistic_pengeluaran_view" },
  ];

  const masterDataItems = [
    { title: "Data Driver", path: "/logistic/master-data/driver", icon: Users, perm: "logistic_driver_view" },
    { title: "Data Mobil", path: "/logistic/master-data/mobil", icon: Car, perm: "logistic_mobil_view" },
  ];

  return (
    <div className="space-y-3">
      {/* SECTION 1: MENU UTAMA LOGISTIK */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setIsOpenMenu(!isOpenMenu)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-200/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors select-none"
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-300" />
            <span>Logistik</span>
          </div>
          {isOpenMenu ? (
            <ChevronDown className="w-3.5 h-3.5 text-blue-200/60" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-blue-200/60" />
          )}
        </button>

        {isOpenMenu && (
          <div className="space-y-1 pl-1">
            {menuItems.map((item, idx) => {
              const active = isActive(item.path) || location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                    active
                      ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                      : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: MASTER DATA */}
      <div className="space-y-1 pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={() => setIsOpenMaster(!isOpenMaster)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-200/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors select-none"
        >
          <div className="flex items-center gap-2">
            <span>Master Data</span>
          </div>
          {isOpenMaster ? (
            <ChevronDown className="w-3.5 h-3.5 text-blue-200/60" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-blue-200/60" />
          )}
        </button>

        {isOpenMaster && (
          <div className="space-y-1 pl-1">
            {masterDataItems.map((item, idx) => {
              const active = isActive(item.path) || location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                    active
                      ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                      : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
