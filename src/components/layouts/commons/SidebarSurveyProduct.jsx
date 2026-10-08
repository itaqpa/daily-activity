import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ClipboardList, ChevronDown, ChevronRight, FileText, FileBarChart } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export default function SidebarSurveyProduct({ isActive }) {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  if (!hasPermission('survey_product_view')) {
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
          <ClipboardList className="w-4 h-4 text-blue-300" />
          <span>Survey Product</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-blue-200/60" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-blue-200/60" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-1 pl-1">
          {hasPermission('survey_product_view') && (
            <Link
              to="/survey-product"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                isActive("/survey-product") && !location.pathname.includes("reports") && !location.pathname.includes("master-data")
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Survey</span>
            </Link>
          )}

          {hasPermission('survey_product_view') && (
            <Link
              to="/survey-product/reports"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-sm ${
                location.pathname.includes("/survey-product/reports")
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10 font-semibold"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium opacity-60"
              }`}
            >
              <FileBarChart className="w-4 h-4" />
              <span>Laporan (Coming Soon)</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
