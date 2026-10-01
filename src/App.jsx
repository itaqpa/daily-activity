import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './marketing/pages/Dashboard';
import DataSales from './marketing/pages/master-data/DataSales';
import DataCustomer from './marketing/pages/master-data/DataCustomer';
import UserManagement from './marketing/pages/user-management/UserManagement';

import CatatAktivitas from './marketing/pages/activities/CatatAktivitas';
import RiwayatAktivitas from './marketing/pages/activities/RiwayatAktivitas';
import Laporan from './marketing/pages/reports/Laporan';
import Settings from './marketing/pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/marketing/dashboard" element={<Dashboard />} />
        
        {/* Master Data */}
        <Route path="/marketing/master-data/sales" element={<DataSales />} />
        <Route path="/marketing/master-data/customer" element={<DataCustomer />} />
        <Route path="/marketing/users" element={<UserManagement />} />
        
        {/* Activities & Reports */}
        <Route path="/marketing/activities/new" element={<CatatAktivitas />} />
        <Route path="/marketing/activities" element={<RiwayatAktivitas />} />
        <Route path="/marketing/reports" element={<Laporan />} />
        <Route path="/marketing/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
