import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import ForbiddenAccess from './ForbiddenAccess';

export default function ModuleGuard({ requiredPermissions = [] }) {
  const { canAccessModule } = useAuth();
  
  // If no permissions required, allow access
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return <Outlet />;
  }
  
  // Validasi apakah user diizinkan mengakses modul ini (memvalidasi Divisi, Jabatan, dan User Bypass)
  const hasAccess = canAccessModule(requiredPermissions);
  
  if (!hasAccess) {
    return <ForbiddenAccess />;
  }
  
  return <Outlet />;
}
