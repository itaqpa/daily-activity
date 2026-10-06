import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  LogOut,
  Activity,
  Users,
  Settings,
  X,
  Database,
  ChevronDown,
  ChevronRight,
  Briefcase,
  UserCircle,
  FileText,
  List,
  Edit3,
  Download,
} from "lucide-react";

export default function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDataMasterOpen, setIsDataMasterOpen] = useState(
    location.pathname.includes("/master-data"),
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Parse user dari localStorage untuk mengecek role
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : {};

  // Ambil active jabatan, jika belum pilih, gunakan jabatan utama
  const activeJabatan = user.active_jabatan || user.jabatan;
  const activeJabatanId = user.active_jabatan_id || user.jabatan_id;

  // Logika role (sesuaikan dengan data user dari database Anda)
  const isSuperAdmin =
    user.username === "admin" ||
    activeJabatan === "Super Admin" ||
    user.role === "superadmin";
    
  const isAdmin = 
    activeJabatan === "Admin" || 
    user.role === "admin" || 
    activeJabatan?.toLowerCase() === "admin sales";

  const isSales =
    user.divisi?.toLowerCase() === "sales" ||
    user.kode_divisi === "SLS" ||
    user.divisi_id === 1;

  // Jika bukan super admin, maka ia adalah user biasa (termasuk sales)
  const isRegularUser = !isSuperAdmin;

  // Cek apakah user adalah Staff (bukan SPV) di divisi Sales
  const isStaffSales =
    isSales &&
    (activeJabatan?.toLowerCase() === "staff" || activeJabatanId === 5);

  const isSPV =
    activeJabatan?.toLowerCase().includes("spv") ||
    activeJabatan?.toLowerCase().includes("supervisor");
  const isManager = activeJabatan?.toLowerCase().includes("manager");
  const canViewTimSales = isSuperAdmin || isSPV || isManager;

  const roleName = (activeJabatan || '').toLowerCase();
  const canCatatAktivitas = 
    roleName === 'staff' || 
    roleName === 'leader' || 
    roleName.includes('spv') || 
    roleName.includes('supervisor') || 
    roleName.includes('manager');

  // Siapkan daftar role (Jabatan Utama + Jabatan Tambahan)
  const availableRoles = [];
  if (user.jabatan) {
    availableRoles.push({ id: user.jabatan_id, nama_jabatan: user.jabatan });
  }
  if (user.additional_roles_data && Array.isArray(user.additional_roles_data)) {
    user.additional_roles_data.forEach(role => {
       if (!availableRoles.some(r => r.id === role.id)) {
          availableRoles.push(role);
       }
    });
  }

  const handleSwitchRole = (roleId, roleName) => {
    const updatedUser = { ...user, active_jabatan_id: roleId, active_jabatan: roleName };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    window.location.reload();
  };

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Online/Offline State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPrompt = e; // Simpan di global agar bisa diakses oleh topbar
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Tampilkan prompt bawaan OS/Browser
      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }

      // Prompt hanya bisa dipakai 1 kali
      setDeferredPrompt(null);
    } else {
      // Fallback jika tidak ada prompt (misal di iOS atau sudah diinstal)
      alert(
        "Untuk menginstal aplikasi:\n\n- iOS/Safari: Tap tombol Share, lalu pilih 'Add to Home Screen'.\n- Android/Chrome: Tap ikon titik tiga, lalu pilih 'Install App' atau 'Add to Home Screen'.\n\n(Pesan ini muncul jika aplikasi sudah terinstal atau browser belum mendukung install prompt otomatis).",
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
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

        <div className="p-6 pt-4 md:pt-6 flex items-center justify-center shrink-0">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm">
            <img
              src="/logo/aqpa-indonesia-logo.png"
              alt="AQPA Logo"
              className="h-8 w-auto object-contain"
            />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto pb-4">
          {/* Dashboard */}
          <Link
            to="/marketing/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/marketing/dashboard")
                ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10"
                : "text-blue-100/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>

          {/* Data Customer - Untuk User Biasa */}
          {isRegularUser && (
            <Link
              to="/marketing/master-data/customer"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive("/marketing/master-data/customer")
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <UserCircle className="w-5 h-5" />
              <span className="font-medium">Data Customer</span>
            </Link>
          )}

          {/* Tim Sales / Data Sales */}
          {(canViewTimSales || isAdmin) && !isSuperAdmin && (
            <Link
              to="/marketing/master-data/sales"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive("/marketing/master-data/sales")
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span className="font-medium">{isAdmin ? "Data Sales" : "Tim Sales"}</span>
            </Link>
          )}

          {/* Semua Aktivitas */}
          <Link
            to="/marketing/activities"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/marketing/activities")
                ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10"
                : "text-blue-100/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <List className="w-5 h-5" />
            <span className="font-medium">Semua Aktivitas</span>
          </Link>

          {/* Catat Aktivitas - Khusus Staff, Leader, SPV, Manager */}
          {canCatatAktivitas && (
            <Link
              to="/marketing/activities/new"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive("/marketing/activities/new")
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Edit3 className="w-5 h-5" />
              <span className="font-medium">Catat Aktivitas</span>
            </Link>
          )}

          {/* Submenu Data Master - Khusus Super Admin */}
          {isSuperAdmin && (
            <div>
              <button
                onClick={() => setIsDataMasterOpen(!isDataMasterOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  location.pathname.includes("/master-data")
                    ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10"
                    : "text-blue-100/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5" />
                  <span className="font-medium">Data Master</span>
                </div>
                {isDataMasterOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {isDataMasterOpen && (
                <div className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-1">
                  <Link
                    to="/marketing/master-data/sales"
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive("/marketing/master-data/sales")
                        ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10"
                        : "text-blue-100/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium text-sm">Data Sales</span>
                  </Link>
                  <Link
                    to="/marketing/master-data/customer"
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive("/marketing/master-data/customer")
                        ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10"
                        : "text-blue-100/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <UserCircle className="w-4 h-4" />
                    <span className="font-medium text-sm">Data Customer</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* User Management - Khusus Super Admin */}
          {isSuperAdmin && (
            <Link
              to="/marketing/users"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive("/marketing/users")
                  ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">User Management</span>
            </Link>
          )}

          {/* Laporan - Paling Akhir */}
          <Link
            to="/marketing/reports"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/marketing/reports")
                ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10"
                : "text-blue-100/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Laporan</span>
          </Link>

          {/* Settings */}
          <Link
            to="/marketing/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive("/marketing/settings")
                ? "bg-[#1c3350] shadow-sm text-white ring-1 ring-white/10"
                : "text-blue-100/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Edit Profil</span>
          </Link>

          {/* Install Apps */}
          <button
            onClick={handleInstallClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-blue-100/70 hover:bg-white/5 hover:text-white"
          >
            <Download className="w-5 h-5" />
            <span className="font-medium flex-1 text-left">Install Apps</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0 flex flex-col gap-2">
          {/* Profile Dropdown */}
          <div className="w-full relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-blue-100/70 hover:bg-white/5 hover:text-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold shadow-inner">
                  {user.nama ? user.nama.substring(0, 2).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-sm text-white truncate max-w-[120px]">{user.nama || user.username}</span>
                  <span className="text-xs text-blue-200/70 truncate max-w-[120px]">{activeJabatan}</span>
                </div>
              </div>
              {isProfileOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {isProfileOpen && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1a2d47] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/5 bg-[#1c3350]">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Pilih Role Aktif</p>
                </div>
                <div className="flex flex-col max-h-48 overflow-y-auto py-1">
                  {availableRoles.length > 0 ? availableRoles.map(role => (
                    <button
                      key={role.id}
                      onClick={() => handleSwitchRole(role.id, role.nama_jabatan)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left
                        ${activeJabatanId === role.id ? 'bg-blue-600/20 text-blue-300 font-bold border-l-2 border-blue-400' : 'text-blue-100/70 hover:bg-white/5 hover:text-white border-l-2 border-transparent'}
                      `}
                    >
                      <div className="w-4 flex justify-center flex-shrink-0">
                        {activeJabatanId === role.id && <span className="text-blue-400">✓</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {role.nama_jabatan.toLowerCase().includes('admin') ? <Settings className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        <span>{role.nama_jabatan}</span>
                      </div>
                    </button>
                  )) : (
                    <div className="px-4 py-3 text-sm text-blue-200/50 italic">Tidak ada role lain</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 px-4 py-3 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}


