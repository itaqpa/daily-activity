import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Initial load
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      setUser(JSON.parse(userString));
    }
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

  // Helper function to check permission
  const hasPermission = (permissionName) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permissionName);
  };

  const hasMarketingPerm = (permissionName) => {
    if (!user) return false;
    const userDivisiLower = (user.divisi || user.nama_divisi || '').toLowerCase();
    const isMarketingDivision = userDivisiLower.includes('sales') || userDivisiLower.includes('marketing');
    if (isMarketingDivision) {
      return user.permissions?.includes(permissionName);
    } else {
      return user.explicit_bypass_permissions?.includes(permissionName);
    }
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
