import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Settings, X, Download } from "lucide-react";
import SidebarMarketing from "./commons/SidebarMarketing";
import SidebarInstallation from "./commons/SidebarInstallation";
import SidebarMasterData from "./commons/SidebarMasterData";

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  
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

  const isMarketing = location.pathname.startsWith("/marketing");
  const isInstallation = location.pathname.startsWith("/installation-project") || location.pathname.startsWith("/data-pengeluaran");

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
            
            {/* Conditional Rendering of Sections */}
            {isMarketing && <SidebarMarketing isActive={isActive} />}
            {isInstallation && <SidebarInstallation isActive={isActive} />}
            
            {/* Master Data is shown if it's Marketing (since the routes are under /marketing), 
                but we could also show it everywhere if needed. Based on current paths, 
                they are heavily tied to /marketing, so let's show it always when in Marketing or Installation. */}
            {(isMarketing || isInstallation) && (
              <div className="pt-1 border-t border-white/5">
                <SidebarMasterData isActive={isActive} />
              </div>
            )}

            {/* SECTION 4: SETTING */}
            {(isMarketing || isInstallation) && (
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
            )}

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
