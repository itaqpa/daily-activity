import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import React, { useEffect } from 'react';
import { apiUrl } from './api';

function PageTrackingListener() {
  const location = useLocation();

  useEffect(() => {
    // Hindari log page view jika di halaman login atau root
    if (location.pathname === '/' || location.pathname === '/login') return;
    
    // Tentukan judul halaman yang simpel berdasarkan pathname
    const pathParts = location.pathname.split('/').filter(Boolean);
    let title = pathParts.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')).join(' > ');
    if (!title) title = 'Beranda';

    fetch(apiUrl('/global-logs/page-view'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: location.pathname,
        title: title
      })
    }).catch(err => console.error('Failed to log page view:', err));
  }, [location.pathname]);

  return null;
}

import Login from './pages/Login';
import Dashboard from './marketing/pages/Dashboard';
import DataSales from './marketing/pages/master-data/DataSales';
import DataCustomer from './marketing/pages/master-data/DataCustomer';
import DataManpower from './master-admin/DataManpower';
import UserManagement from './master-admin/user-management/UserManagement';


import CatatAktivitas from './marketing/pages/activities/CatatAktivitas';
import RiwayatAktivitas from './marketing/pages/activities/RiwayatAktivitas';
import Laporan from './marketing/pages/reports/Laporan';
import Settings from './marketing/pages/Settings';
import Portal from './pages/Portal';
import ListInstallPage from './install-project/ListInstallPage';
import ShowInstallPage from './install-project/components/ShowInstallPage';
import FormDailyInputPage from './install-project/components/DailyProgress/FormDailyInputPage';
import ListCostMPPage from './install-project/ListCostMPPage';
import LaporanProjectPage from './install-project/LaporanProjectPage';
import ManajemenAkses from './master-admin/ManajemenAkses';
import HistorynLogPage from './master-admin/HistorynLogPage';
import StandaloneAddActivity from './install-project/pages/StandaloneAddActivity';
import StandaloneAddCost from './install-project/pages/StandaloneAddCost';

function ProtectedRoute() {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PageTrackingListener />
        <Routes>
          <Route path="/" element={<Login />} />
          
          <Route path="/portal" element={<ProtectedRoute />}>
            <Route index element={<Portal />} />
          </Route>

          <Route path="/marketing" element={<ProtectedRoute />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Master Data */}
            <Route path="master-data/sales" element={<DataSales />} />
            <Route path="master-data/customer" element={<DataCustomer />} />
            <Route path="master-data/manpower" element={<DataManpower />} />

            
            {/* Activities & Reports */}
            <Route path="activities/new" element={<CatatAktivitas />} />
            <Route path="activities" element={<RiwayatAktivitas />} />
            <Route path="reports" element={<Laporan />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="/installation-project" element={<ProtectedRoute />}>
            <Route index element={<ListInstallPage />} />
            <Route path="reports" element={<LaporanProjectPage />} />
            <Route path="add-activity" element={<StandaloneAddActivity />} />
            <Route path="add-cost" element={<StandaloneAddCost />} />
            <Route path=":id" element={<ShowInstallPage />} />
            <Route path=":id/daily-progress/new" element={<FormDailyInputPage />} />
          </Route>

          <Route path="/data-pengeluaran" element={<ProtectedRoute />}>
            <Route index element={<ListCostMPPage />} />
          </Route>

          <Route path="/master-admin" element={<ProtectedRoute />}>
            <Route path="manajemen-akses" element={<ManajemenAkses />} />
            <Route path="history-log" element={<HistorynLogPage />} />
            <Route path="users" element={<UserManagement />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
