import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  LogOut, Activity, Users, Settings, Database, Briefcase, UserCircle, FileText, List, Edit3, Download, Menu, X, ChevronDown
} from "lucide-react";

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDataMasterOpen, setIsDataMasterOpen] = useState(false);

  // Parse user dari localStorage untuk mengecek role
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : {};

  // Ambil active jabatan
  const activeJabatan = user.active_jabatan || user.jabatan;
  const activeJabatanId = user.active_jabatan_id || user.jabatan_id;

  // Logika role
  const isSuperAdmin = user.username === "admin" || activeJabatan === "Super Admin" || user.role === "superadmin";
  const isAdmin = activeJabatan === "Admin" || user.role === "admin" || activeJabatan?.toLowerCase() === "admin sales";
  const isSales = user.divisi?.toLowerCase() === "sales" || user.kode_divisi === "SLS" || user.divisi_id === 1;
  const isRegularUser = !isSuperAdmin;

  const isSPV = activeJabatan?.toLowerCase().includes("spv") || activeJabatan?.toLowerCase().includes("supervisor");
  const isManager = activeJabatan?.toLowerCase().includes("manager");
  const canViewTimSales = isSuperAdmin || isSPV || isManager;

  const roleName = (activeJabatan || '').toLowerCase();
  const canCatatAktivitas = 
    roleName === 'staff' || roleName === 'leader' || roleName.includes('spv') || 
    roleName.includes('supervisor') || roleName.includes('manager');

  const availableRoles = [];
  if (user.jabatan) availableRoles.push({ id: user.jabatan_id, nama_jabatan: user.jabatan });
  if (user.additional_roles_data && Array.isArray(user.additional_roles_data)) {
    user.additional_roles_data.forEach(role => {
       if (!availableRoles.some(r => r.id === role.id)) availableRoles.push(role);
    });
  }

  const handleSwitchRole = (roleId, roleName) => {
    const updatedUser = { ...user, active_jabatan_id: roleId, active_jabatan: roleName };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;
  
  // Komponen Helper untuk Link
  const NavLink = ({ to, icon: Icon, label, active }) => (
    <Link
      to={to}
      onClick={() => setIsMobileMenuOpen(false)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap
        ${active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  );

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <Link to="/marketing/dashboard" className="flex items-center gap-2">
              <img src="/logo/aqpa-indonesia-logo.png" alt="AQPA Logo" className="h-8 w-auto object-contain" />
            </Link>
            
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex ml-6 items-center space-x-2">
              <NavLink to="/marketing/dashboard" icon={Activity} label="Dashboard" active={isActive("/marketing/dashboard")} />
              
              {isRegularUser && (
                <NavLink to="/marketing/master-data/customer" icon={UserCircle} label="Data Customer" active={isActive("/marketing/master-data/customer")} />
              )}
              
              {(canViewTimSales || isAdmin) && !isSuperAdmin && (
                <NavLink to="/marketing/master-data/sales" icon={Briefcase} label={isAdmin ? "Data Sales" : "Tim Sales"} active={isActive("/marketing/master-data/sales")} />
              )}
              
              <NavLink to="/marketing/activities" icon={List} label="Aktivitas" active={isActive("/marketing/activities")} />
              
              {canCatatAktivitas && (
                <NavLink to="/marketing/activities/new" icon={Edit3} label="Catat Aktivitas" active={isActive("/marketing/activities/new")} />
              )}
              
              <NavLink to="/marketing/reports" icon={FileText} label="Laporan" active={isActive("/marketing/reports")} />
              
              {/* Dropdown Data Master Super Admin */}
              {isSuperAdmin && (
                <div className="relative">
                  <button 
                    onClick={() => setIsDataMasterOpen(!isDataMasterOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    <Database className="w-4 h-4" />
                    <span>Data Master</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {isDataMasterOpen && (
                    <div className="absolute top-full mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-50">
                      <Link to="/marketing/master-data/sales" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsDataMasterOpen(false)}>Data Sales</Link>
                      <Link to="/marketing/master-data/customer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsDataMasterOpen(false)}>Data Customer</Link>
                      <Link to="/marketing/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsDataMasterOpen(false)}>User Management</Link>
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          {/* Right Side (Profile & Mobile Toggle) */}
          <div className="flex items-center gap-3">
            {/* User Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 focus:outline-none hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold text-gray-700 leading-tight">{user.nama || user.username}</span>
                  <span className="text-xs text-blue-600 font-medium">{activeJabatan}</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                  {user.nama ? user.nama.substring(0, 2).toUpperCase() : 'U'}
                </div>
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2">
                    <div className="px-4 py-2 border-b border-gray-100 mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Pilih Role Aktif</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {availableRoles.length > 0 ? availableRoles.map(role => (
                        <button
                          key={role.id}
                          onClick={() => handleSwitchRole(role.id, role.nama_jabatan)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 ${activeJabatanId === role.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                        >
                          <div className="w-4">{activeJabatanId === role.id && "✓"}</div>
                          {role.nama_jabatan}
                        </button>
                      )) : (
                         <div className="px-4 py-2 text-sm text-gray-400">Tidak ada role lain</div>
                      )}
                    </div>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <Link to="/marketing/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>
                        <Settings className="w-4 h-4" /> Edit Profil
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-inner">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3 overflow-y-auto max-h-[70vh]">
            <NavLink to="/marketing/dashboard" icon={Activity} label="Dashboard" active={isActive("/marketing/dashboard")} />
            {isRegularUser && <NavLink to="/marketing/master-data/customer" icon={UserCircle} label="Data Customer" active={isActive("/marketing/master-data/customer")} />}
            {(canViewTimSales || isAdmin) && !isSuperAdmin && <NavLink to="/marketing/master-data/sales" icon={Briefcase} label={isAdmin ? "Data Sales" : "Tim Sales"} active={isActive("/marketing/master-data/sales")} />}
            <NavLink to="/marketing/activities" icon={List} label="Aktivitas" active={isActive("/marketing/activities")} />
            {canCatatAktivitas && <NavLink to="/marketing/activities/new" icon={Edit3} label="Catat Aktivitas" active={isActive("/marketing/activities/new")} />}
            <NavLink to="/marketing/reports" icon={FileText} label="Laporan" active={isActive("/marketing/reports")} />
            {isSuperAdmin && (
              <div className="pl-4 border-l-2 border-gray-100 my-2 py-2 space-y-1">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase">Data Master (Admin)</p>
                <NavLink to="/marketing/master-data/sales" icon={Briefcase} label="Data Sales" active={isActive("/marketing/master-data/sales")} />
                <NavLink to="/marketing/master-data/customer" icon={UserCircle} label="Data Customer" active={isActive("/marketing/master-data/customer")} />
                <NavLink to="/marketing/users" icon={Users} label="User Management" active={isActive("/marketing/users")} />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
