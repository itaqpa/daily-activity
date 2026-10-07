import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './marketing/pages/Dashboard';
import DataSales from './marketing/pages/master-data/DataSales';
import DataCustomer from './marketing/pages/master-data/DataCustomer';
import DataManpower from './marketing/pages/master-data/DataManpower';
import UserManagement from './marketing/pages/user-management/UserManagement';

import CatatAktivitas from './marketing/pages/activities/CatatAktivitas';
import RiwayatAktivitas from './marketing/pages/activities/RiwayatAktivitas';
import Laporan from './marketing/pages/reports/Laporan';
import Settings from './marketing/pages/Settings';
import ListInstallPage from './install-project/ListInstallPage';
import ShowInstallPage from './install-project/components/ShowInstallPage';
import FormDailyInputPage from './install-project/components/DailyProgress/FormDailyInputPage';
import ListCostMPPage from './install-project/ListCostMPPage';
import LaporanProjectPage from './install-project/LaporanProjectPage';

function ProtectedRoute() {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/marketing" element={<ProtectedRoute />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Master Data */}
          <Route path="master-data/sales" element={<DataSales />} />
          <Route path="master-data/customer" element={<DataCustomer />} />
          <Route path="master-data/manpower" element={<DataManpower />} />
          <Route path="users" element={<UserManagement />} />
          
          {/* Activities & Reports */}
          <Route path="activities/new" element={<CatatAktivitas />} />
          <Route path="activities" element={<RiwayatAktivitas />} />
          <Route path="reports" element={<Laporan />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/installation-project" element={<ProtectedRoute />}>
          <Route index element={<ListInstallPage />} />
          <Route path="reports" element={<LaporanProjectPage />} />
          <Route path=":id" element={<ShowInstallPage />} />
          <Route path=":id/daily-progress/new" element={<FormDailyInputPage />} />
        </Route>

        <Route path="/data-pengeluaran" element={<ProtectedRoute />}>
          <Route index element={<ListCostMPPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
