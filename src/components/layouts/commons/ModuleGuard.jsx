import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import ForbiddenAccess from './ForbiddenAccess';

export default function ModuleGuard({ requiredPermissions = [] }) {
  const { hasPermission } = useAuth();
  
  // If no permissions required, allow access
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return <Outlet />;
  }
  
  // Cek apakah user memiliki MINIMAL SATU dari array permission yang dibutuhkan untuk modul ini
  const hasAccess = requiredPermissions.some(perm => hasPermission(perm));
  
  if (!hasAccess) {
    return <ForbiddenAccess />;
  }
  
  return <Outlet />;
}
