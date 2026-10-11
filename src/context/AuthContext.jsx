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
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (err) {
      console.error('Failed to refresh user session', err);
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

  // Alias hasMarketingPerm to hasPermission to support existing components without division hardcoding
  const hasMarketingPerm = (permissionName) => {
    return hasPermission(permissionName);
  };

  return (
    <AuthContext.Provider value={{ user, updateUser, refreshUser, logout, hasPermission, getPermissionScope, hasMarketingPerm }}>
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
