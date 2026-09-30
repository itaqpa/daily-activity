import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataSales from './pages/master-data/DataSales';
import DataCustomer from './pages/master-data/DataCustomer';
import UserManagement from './pages/user-management/UserManagement';

import CatatAktivitas from './pages/activities/CatatAktivitas';
import RiwayatAktivitas from './pages/activities/RiwayatAktivitas';
import Laporan from './pages/reports/Laporan';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Master Data */}
        <Route path="/master-data/sales" element={<DataSales />} />
        <Route path="/master-data/customer" element={<DataCustomer />} />
        <Route path="/users" element={<UserManagement />} />
        
        {/* Activities & Reports */}
        <Route path="/activities/new" element={<CatatAktivitas />} />
        <Route path="/activities" element={<RiwayatAktivitas />} />
        <Route path="/reports" element={<Laporan />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
