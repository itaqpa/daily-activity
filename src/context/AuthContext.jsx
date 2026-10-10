import { createContext, useContext, useState, useEffect } from 'react';
import { apiUrl } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  });

  // Initial load / background refresh
  useEffect(() => {
    // Background fetch profil dan permission terbaru
    const fetchLatestProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const response = await fetch(apiUrl('/me'));
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user)); // update cache
        } else if (response.status === 401) {
          // Token expired atau invalid
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (err) {
        console.error('Failed to refresh user session', err);
      }
    };
    
    fetchLatestProfile();
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

  // Alias hasMarketingPerm to hasPermission to support existing components without division hardcoding
  const hasMarketingPerm = (permissionName) => {
    return hasPermission(permissionName);
  };

  return (
    <AuthContext.Provider value={{ user, updateUser, logout, hasPermission, hasMarketingPerm }}>
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
