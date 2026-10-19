import { createContext, useContext, useState, useEffect } from 'react';
import { apiUrl } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  });

  // Background refresh user profile
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const response = await fetch(apiUrl('/me'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user)); // update cache
        return data.user;
      } else if (response.status === 401) {
        // Hanya hapus jika server secara eksplisit mengembalikan 401 Unauthorized (token invalid/expired)
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (err) {
      // Jika jaringan mati / server down, tetap gunakan cached user session dari localStorage
      console.warn('Network error or server down during user refresh, keeping cached session:', err.message);
    }
    return null;
  };

  // Initial load / background refresh
  useEffect(() => {
    refreshUser();
  }, []);

  // Update user in state and localStorage
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Helper function to check permission based purely on database setup
  const hasPermission = (permissionName) => {
    if (!user) return false;
    const inRole = user.permissions?.includes(permissionName);
    const inBypass = user.explicit_bypass_permissions?.includes(permissionName);
    return !!(inRole || inBypass);
  };

  // Helper function to get data scope for a permission ('ALL' | 'DIVISION' | 'OWN' | null)
  const getPermissionScope = (permissionName) => {
    if (!user) return null;
    if (!hasPermission(permissionName)) return null;
    return user.permission_scopes?.[permissionName] || 'ALL';
  };

  // Helper function to check module access respecting both Division gatekeeper and Direct User Bypass
  const canAccessModule = (requiredPermissions = []) => {
    if (!user) return false;

    // Super Admin gets god-mode access
    if (user.jabatan === 'Super Admin') return true;

    // 1. Direct User Bypass: User explicitly given access in user_permissions
    const hasDirectBypass = requiredPermissions.some(perm =>
      user.explicit_bypass_permissions?.includes(perm)
    );
    if (hasDirectBypass) return true;

    // 2. Modul Master Admin (user_view, akses_view, dsb) bersifat lintas divisi untuk jabatan Admin
    const isMasterAdminCheck = requiredPermissions.every(perm =>
      ['user_view', 'akses_view', 'history_view', 'survey_question_view'].includes(perm)
    );
    if (isMasterAdminCheck && user.jabatan === 'Admin') {
      return requiredPermissions.some(perm => user.permissions?.includes(perm));
    }

    // 3. Division check untuk modul operasional kerja (Sales, Dinas Luar, Survey):
    // If divisi_permissions is loaded, verify against it
    let hasDivisiAccess = false;
    if (Array.isArray(user.divisi_permissions)) {
      hasDivisiAccess = requiredPermissions.some(perm =>
        user.divisi_permissions.includes(perm)
      );
    } else {
      // Fallback transitional check based on division name
      const divName = (user.nama_divisi || user.divisi || '').toLowerCase();
      if (divName.includes('sales') && requiredPermissions.some(p => p.includes('aktivitas') || p.includes('customer') || p.includes('sales') || p.includes('laporan_marketing'))) {
        hasDivisiAccess = true;
      } else if (divName.includes('engineering') && requiredPermissions.some(p => p.includes('install') || p.includes('progress') || p.includes('pengeluaran'))) {
        hasDivisiAccess = true;
      } else if (divName.includes('management')) {
        hasDivisiAccess = true;
      }
    }

    // User's role must also have permission
    const hasRoleAccess = requiredPermissions.some(perm =>
      user.permissions?.includes(perm)
    );

    return !!(hasDivisiAccess && hasRoleAccess);
  };

  // Alias hasMarketingPerm to hasPermission to support existing components without division hardcoding
  const hasMarketingPerm = (permissionName) => {
    return hasPermission(permissionName);
  };

  return (
    <AuthContext.Provider value={{ user, updateUser, refreshUser, logout, hasPermission, canAccessModule, getPermissionScope, hasMarketingPerm }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
