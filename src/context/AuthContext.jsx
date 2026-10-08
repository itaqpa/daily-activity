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
